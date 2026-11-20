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
    usuario: '@entre.linhas',
    url: 'https://www.instagram.com/entre.linhas/',
  },
  email: 'entre.linhas@gmail.com',
  credito: {
    autora: 'Helena Arioli',
    curso: 'Design',
    instituicao: 'PUCPR',
    ano: 2026,
  },
  /** Enquanto pontos, edições e fotos forem provisórios, mantenha `true` para exibir o aviso no rodapé. */
  conteudoIlustrativo: true,
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
