/**
 * Configurações gerais do site.
 * Para avançar a "edição do mês", basta mudar `edicaoAtual`:
 * as edições anteriores viram "disponível" e as seguintes "em breve".
 */
export const site = {
  nome: 'entrelinhas',
  descricao:
    'Livretos gratuitos sobre as construções sociais do feminino, espalhados por Curitiba. Encontre um expositor no mapa, leia a edição digital e acompanhe a campanha nas ruas.',
  edicaoAtual: 1,
  totalEdicoes: 6,
  cidade: 'Curitiba',
  instagram: {
    usuario: '@ellielikesdsgn',
    url: 'https://www.instagram.com/ellielikesdsgn/',
  },
  email: 'entre.linhas@gmail.com',
  credito: {
    autora: 'Helena Arioli',
    curso: 'Design',
    instituicao: 'PUCPR',
    ano: 2026,
  },
  /** `true` exibe o aviso de protótipo (mapa e rodapé). Desligado a pedido da Helena em nov/2026. */
  conteudoIlustrativo: false,
  /**
   * Alfabet (títulos) e Jubilat (texto) vêm da Adobe Fonts. Cole aqui o ID do projeto web,
   * o trecho "abc1234" de https://use.typekit.net/abc1234.css.
   * Vazio: o site usa as substitutas gratuitas, Archivo e Zilla Slab.
   */
  adobeFonts: 'wsn2hin',
};

/** Frases do folder, usadas no letreiro corrido e nos cartazes. */
export const frases = [
  'Ideias ganham forma. Perspectivas ganham mundo.',
  'Questionar o que parece inquestionável.',
  'Nenhum conhecimento se constrói sozinho.',
  'O que mais podemos descobrir quando mudamos o olhar?',
  'Conhecimento não precisa ficar preso a uma só forma.',
  'Ideias não surgem do nada. Conhecimento também não.',
  'Outras formas de pensar, criar e compartilhar conhecimento.',
];

export type StatusEdicao = 'disponivel' | 'atual' | 'em-breve';

export function statusDaEdicao(numero: number): StatusEdicao {
  if (numero < site.edicaoAtual) return 'disponivel';
  if (numero === site.edicaoAtual) return 'atual';
  return 'em-breve';
}

export const rotuloStatus: Record<StatusEdicao, string> = {
  disponivel: 'disponível',
  atual: 'edição do mês',
  'em-breve': 'em breve',
};

export const pad = (n: number) => String(n).padStart(2, '0');
