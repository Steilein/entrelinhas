// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Publicado no GitHub Pages em https://steilein.github.io/entrelinhas/
// Ao mudar de endereço (ex.: domínio próprio ou Netlify), ajuste `site` e `base`
// (em domínio próprio, `base` volta a ser '/').
export default defineConfig({
  site: 'https://steilein.github.io',
  base: '/entrelinhas',
  // Mantém o comportamento de espaços do HTML (no Astro 7 o padrão passou a ser 'jsx').
  compressHTML: true,
  devToolbar: { enabled: false },
  integrations: [sitemap({ filter: (page) => !page.includes('/og/') })],
});
