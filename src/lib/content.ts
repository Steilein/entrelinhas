import { getCollection, type CollectionEntry } from 'astro:content';
import { statusDaEdicao } from '../data/site';

export type Ponto = CollectionEntry<'pontos'>;
export type Edicao = CollectionEntry<'edicoes'>;
export type Lambe = CollectionEntry<'galeria'>;

export async function getPontos() {
  return (await getCollection('pontos')).sort((a, b) => a.data.nome.localeCompare(b.data.nome, 'pt-BR'));
}

export async function getEdicoes() {
  const edicoes = (await getCollection('edicoes')).sort((a, b) => a.data.numero - b.data.numero);
  return edicoes.map((e) => ({ ...e, status: statusDaEdicao(e.data.numero) }));
}

export type EdicaoComStatus = Awaited<ReturnType<typeof getEdicoes>>[number];

/** Galeria com o ponto já resolvido. Falha o build se a referência estiver quebrada. */
export async function getGaleria() {
  const [galeria, pontos] = await Promise.all([getCollection('galeria'), getCollection('pontos')]);
  const porId = new Map(pontos.map((p) => [p.id, p]));
  return galeria.map((item) => {
    const ponto = porId.get(item.data.ponto.id);
    if (!ponto) {
      throw new Error(`galeria.json: "${item.id}" aponta para o ponto "${item.data.ponto.id}", que não existe em pontos.json.`);
    }
    return { ...item, ponto };
  });
}

export type LambeComPonto = Awaited<ReturnType<typeof getGaleria>>[number];
