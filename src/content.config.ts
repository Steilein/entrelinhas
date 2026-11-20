import { defineCollection, reference } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

const cores = z.enum(['magenta', 'lima', 'verde', 'ciano', 'azul', 'preto']);

/** Pontos do mapa: expositores de livretos e locais da campanha de lambe-lambes. */
const pontos = defineCollection({
  loader: file('src/data/pontos.json'),
  schema: z.object({
    nome: z.string(),
    tipo: z.enum(['expositor', 'lambe']),
    endereco: z.string(),
    bairro: z.string(),
    // Limites de Curitiba: impedem coordenadas trocadas ou digitadas errado.
    lat: z.number().min(-25.65).max(-25.33),
    lng: z.number().min(-49.4).max(-49.18),
    horario: z.string(),
    edicoes: z.array(z.number().int().min(1).max(6)).default([]),
    descricao: z.string().optional(),
  }),
});

const pagina = z.object({
  layout: z.enum(['capa', 'texto', 'citacao', 'pergunta', 'pautas', 'lista', 'contracapa', 'imagem']),
  titulo: z.string().optional(),
  texto: z.string().optional(),
  autor: z.string().optional(),
  itens: z.array(z.string()).optional(),
  imagem: z.string().optional(),
  alt: z.string().optional(),
});

/** Edições: um arquivo Markdown por livreto. O corpo do arquivo é a sinopse. */
const edicoes = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/edicoes' }),
  schema: z.object({
    numero: z.number().int().min(1).max(6),
    titulo: z.string(),
    tema: z.string(),
    lancamento: z.string(),
    cor: cores,
    chamada: z.string(),
    referencias: z.array(z.string()).default([]),
    pdf: z.string().optional(),
    /** Imagem da capa real (ex.: /edicoes/01/capa.webp). Sem ela, o site desenha a capa. */
    capa: z.string().optional(),
    paginas: z.array(pagina).default([]),
  }),
});

/** Galeria de lambe-lambes. Sem `imagem`, o site desenha o cartaz pela variante. */
const galeria = defineCollection({
  loader: file('src/data/galeria.json'),
  schema: z.object({
    titulo: z.string(),
    variante: z.enum(['ideias', 'forma', 'questionar', 'porque', 'nenhum', 'olhar', 'explosao', 'nada']),
    ponto: reference('pontos'),
    edicao: z.number().int().min(1).max(6).optional(),
    imagem: z.string().optional(),
    alt: z.string().optional(),
  }),
});

const parceiros = defineCollection({
  loader: file('src/data/parceiros.json'),
  schema: z.object({
    nome: z.string(),
    sigla: z.string(),
    descricao: z.string(),
    papel: z.string(),
    cor: cores,
    url: z.url().optional(),
    instagram: z.url().optional(),
    logo: z.string().optional(),
    ordem: z.number().default(0),
  }),
});

export const collections = { pontos, edicoes, galeria, parceiros };
