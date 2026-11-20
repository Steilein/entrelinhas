/**
 * QA do site: screenshots, testes de interação e acessibilidade (axe).
 * Uso: com `npm run preview` rodando, execute `npm run qa`.
 * Variáveis: BASE (padrão http://localhost:4321/entrelinhas) e OUT (pasta das imagens, padrão ./qa-output).
 */
import { chromium } from 'playwright-core';
import { AxeBuilder } from '@axe-core/playwright';
import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const BASE = process.env.BASE ?? 'http://localhost:4321/entrelinhas';
const OUT = process.env.OUT ?? 'qa-output';
const SHOTS = process.env.SHOTS !== '0';
await mkdir(OUT, { recursive: true });

const pontos = JSON.parse(await readFile('src/data/pontos.json', 'utf8'));
const paginas = ['/', '/mapa', '/edicoes', '/edicoes/03-corpo-territorio', '/edicoes/05-intersecoes', '/galeria', '/sobre', '/nao-existe'];
const viewports = {
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
};

const browser = await chromium.launch({ channel: 'msedge' });
const results = [];
const ok = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? '✔' : '✘'} ${name}${detail ? ` — ${detail}` : ''}`);
};

async function newPage(kind, opts = {}) {
  const ctx = await browser.newContext({ ...viewports[kind], reducedMotion: 'reduce', locale: 'pt-BR', ...opts });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !m.text().includes('404') && errors.push(m.text()));
  return { ctx, page, errors };
}

/* ---------- screenshots + erros de console + axe ---------- */
for (const [kind] of Object.entries(viewports)) {
  for (const path of paginas) {
    const { ctx, page, errors } = await newPage(kind);
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    if (path === '/mapa') await page.waitForSelector('[data-mapa][data-ready]');
    await page.evaluate(() => document.fonts.ready);
    const slug = path === '/' ? 'home' : path.replace(/\//g, '_').replace(/^_/, '');
    if (SHOTS) {
      await page.screenshot({ path: join(OUT, `${kind}-${slug}.png`), fullPage: path !== '/mapa' });
    }
    ok(`[${kind}] ${path} sem erros de JS`, errors.length === 0, errors.join(' | '));
    const scrollX = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ok(`[${kind}] ${path} sem rolagem horizontal`, scrollX <= 1, `excesso ${scrollX}px`);
    if (kind === 'desktop') {
      const axe = await new AxeBuilder({ page }).disableRules(['region']).analyze();
      const serious = axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
      ok(
        `[axe] ${path} sem violações sérias`,
        serious.length === 0,
        serious.map((v) => `${v.id} (${v.nodes.length}): ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(', ')}`).join(' | '),
      );
    }
    await ctx.close();
  }
}

/* ---------- mapa ---------- */
{
  const { ctx, page } = await newPage('desktop');
  const esperado3 = pontos.filter((p) => p.edicoes.includes(3)).length;
  await page.goto(`${BASE}/mapa?edicao=3`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-mapa][data-ready]');
  const count = await page.textContent('[data-count]');
  ok('mapa ?edicao=3 filtra os pontos', count?.startsWith(String(esperado3)), `${count} (esperado ${esperado3})`);
  const visiveis = await page.locator('.ponto:not([hidden])').count();
  const markers = await page.locator('.leaflet-marker-icon').count();
  ok('mapa: lista e marcadores coincidem', visiveis === esperado3 && markers === esperado3, `lista ${visiveis}, marcadores ${markers}`);

  await page.click('[data-edicao="0"]');
  await page.click('[data-tipo="expositor"]');
  const exp = pontos.filter((p) => p.tipo === 'expositor').length;
  ok('mapa: filtro "livretos"', (await page.textContent('[data-count]'))?.startsWith(String(exp)));
  ok('mapa: URL reflete o filtro', page.url().includes('tipo=expositor'), page.url());

  await page.click('[data-tipo="todos"]');
  await page.fill('[data-search]', 'sao francisco');
  await page.waitForTimeout(400);
  const busca = await page.locator('.ponto:not([hidden])').count();
  ok('mapa: busca sem acento acha "São Francisco"', busca > 0, `${busca} pontos`);

  await page.goto(`${BASE}/mapa?ponto=cinemateca`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-sheet]:not([hidden])', { timeout: 5000 }).catch(() => {});
  const ficha = await page.textContent('[data-sheet-body]');
  ok('mapa ?ponto= abre a ficha do ponto', !!ficha?.includes('Cinemateca'));
  const rota = await page.getAttribute('[data-sheet-body] a[href*="google.com/maps/dir"]', 'href');
  ok('mapa: link "como chegar" com coordenadas', !!rota?.includes('-25.42478'), rota ?? '');
  await page.keyboard.press('Escape');
  ok('mapa: ESC fecha a ficha', await page.locator('[data-sheet]').isHidden());

  await page.locator('.ponto-btn').first().click();
  ok('mapa: clicar no card abre a ficha', await page.locator('[data-sheet]').isVisible());
  if (SHOTS) await page.screenshot({ path: join(OUT, 'desktop-mapa-ficha.png') });
  await ctx.close();
}
{
  // geolocalização simulada (perto da Praça Tiradentes)
  const { ctx, page } = await newPage('mobile', { geolocation: { latitude: -25.4297, longitude: -49.2719 }, permissions: ['geolocation'] });
  await page.goto(`${BASE}/mapa`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-mapa][data-ready]');
  await page.click('[data-near]');
  await page.waitForFunction(() => document.querySelector('[data-geo-msg]')?.textContent?.includes('mais perto'));
  const primeiro = await page.locator('.ponto').first().getAttribute('data-id');
  ok('mapa: "perto de mim" ordena pela distância', primeiro === 'praca-tiradentes', `primeiro: ${primeiro}`);
  if (SHOTS) await page.screenshot({ path: join(OUT, 'mobile-mapa-perto.png') });
  await page.click('[data-view-btn="lista"]');
  ok('mapa (celular): alterna para lista', await page.locator('.lista').isVisible());
  if (SHOTS) await page.screenshot({ path: join(OUT, 'mobile-mapa-lista.png') });
  await ctx.close();
}

/* ---------- leitor ---------- */
for (const kind of ['desktop', 'mobile']) {
  const { ctx, page } = await newPage(kind, { reducedMotion: 'no-preference' });
  await page.goto(`${BASE}/edicoes/01-o-feminino-nao-vem-de-fabrica`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const overflow = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.page .pg')).flatMap((pg) => {
      const page = pg.closest('.page');
      return pg.scrollHeight > pg.clientHeight + 1 ? [`p.${page.dataset.page} (+${pg.scrollHeight - pg.clientHeight}px)`] : [];
    }),
  );
  ok(`[${kind}] leitor: nenhuma página transborda`, overflow.length === 0, overflow.join(', '));
  await page.locator('[data-book]').focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(1000);
  const count = await page.textContent('[data-count]');
  const total = await page.getAttribute('[data-reader]', 'data-total');
  const esperado = kind === 'desktop' ? `2–3 / ${total}` : `2 / ${total}`;
  ok(`[${kind}] leitor: seta → avança`, count?.trim() === esperado, count ?? '');
  ok(`[${kind}] leitor: hash #p=2`, page.url().endsWith('#p=2'), page.url());
  if (kind === 'mobile') {
    const sl = await page.evaluate(() => document.querySelector('[data-book]').scrollLeft);
    ok('[mobile] leitor: o trilho realmente rola', sl > 100, `scrollLeft ${sl}`);
  }
  if (SHOTS) await page.screenshot({ path: join(OUT, `${kind}-leitor-p2.png`) });
  await page.goto(`${BASE}/edicoes/01-o-feminino-nao-vem-de-fabrica#p=6`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const c6 = await page.textContent('[data-count]');
  ok(`[${kind}] leitor: link direto #p=6`, !!c6?.includes('6'), c6 ?? '');
  if (kind === 'desktop') {
    // página 3 ficaria escondida atrás da folha; precisa estar inerte
    const inertes = await page.locator('.face[inert]').count();
    ok('leitor: faces fora da vista estão inertes', inertes > 0, `${inertes} faces`);
    if (SHOTS) await page.screenshot({ path: join(OUT, 'desktop-leitor-p6.png') });
  }
  await ctx.close();
}

/* ---------- galeria, letreiro, menu ---------- */
{
  const { ctx, page } = await newPage('desktop');
  await page.goto(`${BASE}/galeria`, { waitUntil: 'networkidle' });
  await page.locator('[data-open]').first().click();
  ok('galeria: lightbox abre', await page.locator('dialog[open]').isVisible());
  await page.keyboard.press('ArrowRight');
  ok('galeria: seta passa para o próximo', (await page.textContent('[data-lb-count]'))?.startsWith('2 /'));
  if (SHOTS) await page.screenshot({ path: join(OUT, 'desktop-galeria-lightbox.png') });
  await page.keyboard.press('Escape');
  ok('galeria: ESC fecha', (await page.locator('dialog[open]').count()) === 0);

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.click('[data-marquee-toggle]');
  ok('home: letreiro pausa', await page.locator('[data-marquee].is-paused').count() === 1);
  await ctx.close();
}
{
  const { ctx, page } = await newPage('mobile');
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.click('.menu-btn');
  ok('celular: menu abre', await page.locator('#menu:popover-open').count() === 1);
  if (SHOTS) await page.screenshot({ path: join(OUT, 'mobile-menu.png') });
  await ctx.close();
}

await browser.close();
const falhas = results.filter((r) => !r.pass);
console.log(`\n${results.length - falhas.length}/${results.length} verificações ok`);
process.exit(falhas.length ? 1 : 0);
