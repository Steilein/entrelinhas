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

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

/** Rodas de conversa em ordem cronológica, com ponto, coletivos e edição já resolvidos. */
export async function getRodas() {
  const [rodas, pontos, parceiros, edicoes] = await Promise.all([
    getCollection('rodas'),
    getCollection('pontos'),
    getCollection('parceiros'),
    getCollection('edicoes'),
  ]);
  return rodas
    .map((r) => {
      const { data, inicio, fim, titulo, descricao } = r.data;
      const ponto = pontos.find((p) => p.id === r.data.ponto);
      if (!ponto) throw new Error(`rodas.json (${r.id}): ponto "${r.data.ponto}" não existe em pontos.json`);
      const coletivos = r.data.coletivos.map((id) => {
        const c = parceiros.find((p) => p.id === id);
        if (!c) throw new Error(`rodas.json (${r.id}): coletivo "${id}" não existe em parceiros.json`);
        return c;
      });
      const edicao = edicoes.find((e) => e.data.numero === r.data.edicao);
      // Curitiba não tem horário de verão desde 2019: o fuso é sempre -03:00.
      const comeca = `${data}T${inicio}:00-03:00`;
      const termina = `${data}T${fim}:00-03:00`;
      const [ano, mes, dia] = data.split('-').map(Number);
      const semana = DIAS[new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay()];
      const local = `${ponto.data.nome}, ${ponto.data.endereco}, Curitiba`;
      const agenda = new URL('https://calendar.google.com/calendar/render');
      agenda.search = new URLSearchParams({
        action: 'TEMPLATE',
        text: `Roda de conversa entrelinhas: ${titulo}`,
        dates: `${data.replaceAll('-', '')}T${inicio.replace(':', '')}00/${data.replaceAll('-', '')}T${fim.replace(':', '')}00`,
        ctz: 'America/Sao_Paulo',
        details: `${descricao}\n\nMediação: ${coletivos.map((c) => c.data.nome).join(', ')}. Gratuita e aberta, sem inscrição.`,
        location: local,
      }).toString();
      return {
        id: r.id,
        ...r.data,
        ponto,
        coletivos,
        edicao,
        comeca,
        termina,
        dia: String(dia).padStart(2, '0'),
        mes: MESES[mes - 1],
        ano,
        semana,
        horario: `${inicio.replace(':00', 'h').replace(':', 'h')} às ${fim.replace(':00', 'h').replace(':', 'h')}`,
        agenda: agenda.toString(),
      };
    })
    .sort((a, b) => a.comeca.localeCompare(b.comeca));
}

export type Roda = Awaited<ReturnType<typeof getRodas>>[number];

export type StatusRoda = 'passada' | 'proxima' | 'futura';

/** Status de cada roda em relação a `agora`. O build usa a data da publicação; src/scripts/rodas.ts refaz no navegador. */
export function statusDasRodas(rodas: Roda[], agora = Date.now()): StatusRoda[] {
  let proxima = false;
  return rodas.map((r) => {
    if (Date.parse(r.termina) < agora) return 'passada';
    if (proxima) return 'futura';
    proxima = true;
    return 'proxima';
  });
}

/** Como a reflexão chegou: "pegou o livreto: …", "viu o lambe: …" ou "leu a edição digital". */
export function rotuloOrigem(origem: string | undefined, pontos: Ponto[]): string {
  if (origem === 'digital') return 'leu a edição digital';
  const p = pontos.find((ponto) => ponto.id === origem);
  if (!p) return '';
  return p.data.tipo === 'expositor' ? `pegou o livreto: ${p.data.nome}` : `viu o lambe: ${p.data.nome}`;
}
