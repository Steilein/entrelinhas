/**
 * Gera as imagens de compartilhamento (1200×630) no build:
 * /og/site.png e uma por edição (/og/<id-da-edicao>.png).
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { getEdicoes } from '../../lib/content';
import { starburstPath } from '../../lib/starburst';
import { pad } from '../../data/site';

const CORES: Record<string, string> = {
  magenta: '#E6007E',
  lima: '#B5CD20',
  verde: '#00A86B',
  ciano: '#009FE3',
  azul: '#2658A4',
  preto: '#000000',
};
const ESCURAS = ['magenta', 'azul', 'preto'];

interface Card {
  cor: string;
  topo: string;
  titulo: string;
  sub: string;
  estrela: string;
  seed: number;
}

export const getStaticPaths = (async () => {
  const edicoes = await getEdicoes();
  const site: Card = {
    cor: 'magenta',
    topo: 'livretos gratuitos · Curitiba',
    titulo: 'Ideias ganham forma. Perspectivas ganham mundo.',
    sub: 'Encontre sua edição no mapa.',
    estrela: 'lima',
    seed: 7,
  };
  return [
    { params: { slug: 'site' }, props: { card: site } },
    ...edicoes.map((e) => ({
      params: { slug: e.id },
      props: {
        card: {
          cor: e.data.cor,
          topo: `edição nº ${pad(e.data.numero)} · ${e.data.lancamento}`,
          titulo: e.data.titulo,
          sub: e.data.tema,
          estrela: ['lima', 'verde'].includes(e.data.cor) ? 'magenta' : e.data.cor === 'magenta' ? 'lima' : 'magenta',
          seed: e.data.numero * 31,
        } satisfies Card,
      },
    })),
  ];
}) satisfies GetStaticPaths;

const font = (file: string) => readFile(resolve('node_modules', file));

const h = (type: string, style: Record<string, unknown>, children?: unknown) => ({ type, props: { style, children } });

export const GET: APIRoute = async ({ props }) => {
  const { card } = props as { card: Card };
  const [display, displayBlack, text] = await Promise.all([
    font('@fontsource/archivo/files/archivo-latin-800-normal.woff'),
    font('@fontsource/archivo/files/archivo-latin-900-normal.woff'),
    font('@fontsource/zilla-slab/files/zilla-slab-latin-400-normal.woff'),
  ]);

  const fg = ESCURAS.includes(card.cor) ? '#FFFFFF' : '#000000';
  const star = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="${starburstPath({ seed: card.seed, points: 16, inner: 0.45, jitter: 0.25 })}" fill="${CORES[card.estrela]}"/></svg>`;
  const starUri = `data:image/svg+xml;base64,${Buffer.from(star).toString('base64')}`;
  const n = card.titulo.length;
  const tamanho = n > 40 ? 58 : n > 20 ? 72 : 92;

  const tree = h(
    'div',
    {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '64px 72px',
      background: CORES[card.cor],
      color: fg,
      fontFamily: 'Archivo',
      position: 'relative',
    },
    [
      { type: 'img', props: { src: starUri, width: 520, height: 520, style: { position: 'absolute', right: -90, top: -60 } } },
      h('div', { display: 'flex', flexDirection: 'column', fontSize: 52, fontWeight: 800, lineHeight: 0.85, letterSpacing: -2 }, [
        h('div', { display: 'flex' }, 'entre'),
        h('div', { display: 'flex', width: 230, height: 6, background: fg, margin: '10px 0 12px' }),
        h('div', { display: 'flex', paddingLeft: 34 }, 'linhas'),
      ]),
      h('div', { display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 900 }, [
        h('div', { display: 'flex', fontFamily: 'Zilla Slab', fontSize: 30 }, card.topo),
        h('div', { display: 'flex', fontSize: tamanho, fontWeight: 900, lineHeight: 0.98, letterSpacing: -3 }, card.titulo),
        h('div', { display: 'flex', fontFamily: 'Zilla Slab', fontSize: 34 }, card.sub),
      ]),
    ],
  );

  const svg = await satori(tree as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Archivo', data: display, weight: 800, style: 'normal' },
      { name: 'Archivo', data: displayBlack, weight: 900, style: 'normal' },
      { name: 'Zilla Slab', data: text, weight: 400, style: 'normal' },
    ],
  });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
