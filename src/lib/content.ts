import { getCollection, type CollectionEntry } from 'astro:content';
import { site, statusDaEdicao } from '../data/site';

export type Ponto = CollectionEntry<'pontos'>;
export type Edicao = CollectionEntry<'edicoes'>;
export type Peca = CollectionEntry<'galeria'>;

/** Pontos em ordem alfabética. Quem não lista `edicoes` recebe todas as já lançadas. */
export async function getPontos() {
  const lancadas = Array.from({ length: site.edicaoAtual }, (_, i) => i + 1);
  return (await getCollection('pontos'))
    .map((p) => (p.data.edicoes.length ? p : { ...p, data: { ...p.data, edicoes: lancadas } }))
    .sort((a, b) => a.data.nome.localeCompare(b.data.nome, 'pt-BR'));
}

export async function getEdicoes() {
  const edicoes = (await getCollection('edicoes')).sort((a, b) => a.data.numero - b.data.numero);
  return edicoes.map((e) => ({ ...e, status: statusDaEdicao(e.data.numero) }));
}

export type EdicaoComStatus = Awaited<ReturnType<typeof getEdicoes>>[number];

/** Peças da campanha agrupadas por série (obra + cartaz), na ordem do galeria.json. */
export async function getGaleria() {
  const pecas = await getCollection('galeria');
  const series = [...new Set(pecas.map((p) => p.data.serie))];
  return series.map((serie) => ({
    serie,
    obra: pecas.find((p) => p.data.serie === serie && p.data.tipo === 'obra'),
    cartaz: pecas.find((p) => p.data.serie === serie && p.data.tipo === 'cartaz'),
  }));
}
