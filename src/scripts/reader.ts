/**
 * Leitor folheável: trilho com scroll-snap no celular, livro 3D no desktop.
 * Página atual sincronizada com o hash (#p=5) para links diretos.
 */

const BOOK_QUERY = '(min-width: 900px)';

export function initReaders() {
  document.querySelectorAll<HTMLElement>('[data-reader]').forEach((root) => {
    if (root.dataset.ready) return;
    root.dataset.ready = 'true';
    new Reader(root);
  });
}

class Reader {
  root: HTMLElement;
  book: HTMLElement;
  pages: HTMLElement[];
  total: number;
  mode: 'scroll' | 'book' = 'scroll';
  current = 1;
  flipped = 0;
  leaves: HTMLElement[] = [];
  observer?: IntersectionObserver;
  prevBtn: HTMLButtonElement;
  nextBtn: HTMLButtonElement;
  count: HTMLElement;
  progress: HTMLElement;
  live: HTMLElement;
  fsBtn: HTMLButtonElement | null;

  constructor(root: HTMLElement) {
    this.root = root;
    this.book = root.querySelector<HTMLElement>('[data-book]')!;
    this.pages = Array.from(this.book.querySelectorAll<HTMLElement>(':scope > .page'));
    this.total = this.pages.length;
    this.prevBtn = root.querySelector<HTMLButtonElement>('[data-prev]')!;
    this.nextBtn = root.querySelector<HTMLButtonElement>('[data-next]')!;
    this.count = root.querySelector<HTMLElement>('[data-count]')!;
    this.progress = root.querySelector<HTMLElement>('[data-progress]')!;
    this.live = root.querySelector<HTMLElement>('[data-live]')!;
    this.fsBtn = root.querySelector<HTMLButtonElement>('[data-fs]');

    const fromHash = this.pageFromHash();
    if (fromHash) this.current = fromHash;
    // links na própria página (ex.: <a href="#p=6">) também folheiam e trazem o leitor para a vista
    window.addEventListener('hashchange', () => {
      const p = this.pageFromHash();
      if (!p) return;
      this.goTo(p);
      if (!this.isInView()) this.root.scrollIntoView({ block: 'center' });
    });

    const mq = matchMedia(BOOK_QUERY);
    this.setMode(mq.matches ? 'book' : 'scroll', true);
    mq.addEventListener('change', (e) => this.setMode(e.matches ? 'book' : 'scroll'));

    this.prevBtn.addEventListener('click', () => this.step(-1));
    this.nextBtn.addEventListener('click', () => this.step(1));
    this.book.addEventListener('click', (e) => this.onBookClick(e));
    this.book.addEventListener('keydown', (e) => this.onKey(e));
    document.addEventListener('keydown', (e) => {
      const active = document.activeElement;
      const typing = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
      if (typing || this.root.contains(active)) return;
      if (this.isInView()) this.onKey(e);
    });
    this.setupFullscreen();
  }

  pageFromHash() {
    const p = Number(new URLSearchParams(location.hash.slice(1)).get('p'));
    return p >= 1 && p <= this.total ? p : 0;
  }

  /* ---------- modos ---------- */

  setMode(mode: 'scroll' | 'book', initial = false) {
    if (!initial && mode === this.mode) return;
    this.mode = mode;
    if (mode === 'book') {
      this.observer?.disconnect();
      this.buildBook();
      this.root.classList.add('is-book');
      this.goBook(Math.floor(this.current / 2), false);
    } else {
      this.teardownBook();
      this.root.classList.remove('is-book');
      this.observeScroll();
      requestAnimationFrame(() => this.scrollToPage(this.current, false));
    }
  }

  buildBook() {
    const leafCount = Math.ceil(this.total / 2);
    this.leaves = [];
    for (let i = 0; i < leafCount; i++) {
      const leaf = document.createElement('div');
      leaf.className = 'leaf';
      const front = document.createElement('div');
      front.className = 'face face--front';
      const back = document.createElement('div');
      back.className = 'face face--back';
      const pFront = this.pages[i * 2];
      const pBack = this.pages[i * 2 + 1];
      if (pFront) front.append(pFront);
      if (pBack) back.append(pBack);
      leaf.append(front, back);
      this.leaves.push(leaf);
    }
    this.book.replaceChildren(...this.leaves);
  }

  teardownBook() {
    if (!this.leaves.length) return;
    this.pages.forEach((p) => p.removeAttribute('inert'));
    this.book.replaceChildren(...this.pages);
    this.book.removeAttribute('data-pos');
    this.leaves = [];
  }

  /* ---------- livro ---------- */

  get maxSpread() {
    return Math.floor(this.total / 2);
  }

  goBook(spread: number, animate = true) {
    const k = Math.max(0, Math.min(this.maxSpread, spread));
    const prevK = this.flipped;
    this.flipped = k;
    this.leaves.forEach((leaf, i) => {
      const shouldFlip = i < k;
      const changing = shouldFlip !== leaf.classList.contains('is-flipped');
      if (!animate) leaf.style.transition = 'none';
      leaf.classList.toggle('is-flipped', shouldFlip);
      if (changing && animate) {
        leaf.style.zIndex = '200';
        window.setTimeout(() => this.stackLeaves(), 860);
      }
      if (!animate) requestAnimationFrame(() => (leaf.style.transition = ''));
    });
    if (!animate || prevK === k) this.stackLeaves();

    const pos = k === 0 ? 'start' : k === this.maxSpread && this.total % 2 === 0 ? 'end' : 'middle';
    this.book.dataset.pos = pos;

    const visible = k === 0 ? [1] : [2 * k, 2 * k + 1].filter((p) => p <= this.total);
    this.current = visible[0];
    this.leaves.forEach((leaf, i) => {
      const front = leaf.querySelector<HTMLElement>('.face--front')!;
      const back = leaf.querySelector<HTMLElement>('.face--back')!;
      front.toggleAttribute('inert', i !== k);
      back.toggleAttribute('inert', i !== k - 1);
    });
    this.update(visible);
  }

  stackLeaves() {
    const n = this.leaves.length;
    this.leaves.forEach((leaf, i) => {
      leaf.style.zIndex = String(i < this.flipped ? i + 1 : n - i + 1);
    });
  }

  /* ---------- trilho ---------- */

  observeScroll() {
    this.observer?.disconnect();
    this.observer = new IntersectionObserver(
      (entries) => {
        const best = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!best) return;
        const n = Number((best.target as HTMLElement).dataset.page);
        if (n && n !== this.current) {
          this.current = n;
          this.update([n]);
        }
      },
      { root: this.book, threshold: [0.55, 0.8] },
    );
    this.pages.forEach((p) => this.observer!.observe(p));
    this.update([this.current]);
  }

  scrollToPage(n: number, smooth = true) {
    const page = this.pages[n - 1];
    if (!page) return;
    const left = page.offsetLeft - (this.book.clientWidth - page.offsetWidth) / 2;
    this.book.scrollTo({ left, behavior: smooth ? 'smooth' : 'instant' });
    this.current = n;
    this.update([n]);
  }

  /* ---------- navegação ---------- */

  step(dir: 1 | -1) {
    if (this.mode === 'book') this.goBook(this.flipped + dir);
    else this.scrollToPage(Math.max(1, Math.min(this.total, this.current + dir)));
  }

  goTo(page: number) {
    if (this.mode === 'book') this.goBook(Math.floor(page / 2));
    else this.scrollToPage(page);
  }

  onBookClick(e: MouseEvent) {
    if (this.mode !== 'book') return;
    if ((e.target as HTMLElement).closest('a, button')) return;
    const rect = this.book.getBoundingClientRect();
    const mid = this.flipped === 0 ? rect.left + rect.width * 0.5 : rect.left + rect.width / 2;
    this.step(e.clientX < mid && this.flipped > 0 ? -1 : 1);
  }

  onKey(e: KeyboardEvent) {
    const keys: Record<string, () => void> = {
      ArrowRight: () => this.step(1),
      ArrowLeft: () => this.step(-1),
      PageDown: () => this.step(1),
      PageUp: () => this.step(-1),
      Home: () => this.goTo(1),
      End: () => this.goTo(this.total),
    };
    const action = keys[e.key];
    if (!action) return;
    e.preventDefault();
    action();
  }

  isInView() {
    const r = this.root.getBoundingClientRect();
    return r.top < innerHeight * 0.75 && r.bottom > innerHeight * 0.25;
  }

  update(visible: number[]) {
    const last = visible[visible.length - 1];
    const label = visible.length > 1 ? `${visible[0]}–${last}` : `${visible[0]}`;
    this.count.textContent = `${label} / ${this.total}`;
    this.progress.style.width = `${(last / this.total) * 100}%`;
    this.live.textContent =
      visible.length > 1 ? `Páginas ${visible[0]} e ${last} de ${this.total}` : `Página ${visible[0]} de ${this.total}`;
    const atStart = this.mode === 'book' ? this.flipped === 0 : this.current <= 1;
    const atEnd = this.mode === 'book' ? this.flipped >= this.maxSpread : this.current >= this.total;
    this.prevBtn.disabled = atStart;
    this.nextBtn.disabled = atEnd;
    history.replaceState(null, '', visible[0] > 1 ? `#p=${visible[0]}` : location.pathname + location.search);
  }

  /* ---------- tela cheia ---------- */

  setupFullscreen() {
    const btn = this.fsBtn;
    if (!btn) return;
    const native = typeof this.root.requestFullscreen === 'function' && document.fullscreenEnabled;
    const setLabel = (on: boolean) => (btn.textContent = on ? 'sair da tela cheia' : 'tela cheia');
    btn.addEventListener('click', async () => {
      if (native) {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await this.root.requestFullscreen().catch(() => this.toggleFallback(setLabel));
      } else {
        this.toggleFallback(setLabel);
      }
    });
    document.addEventListener('fullscreenchange', () => setLabel(document.fullscreenElement === this.root));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.root.classList.contains('is-fs')) this.toggleFallback(setLabel);
    });
  }

  toggleFallback(setLabel: (on: boolean) => void) {
    const on = this.root.classList.toggle('is-fs');
    document.documentElement.style.overflow = on ? 'hidden' : '';
    setLabel(on);
  }
}
