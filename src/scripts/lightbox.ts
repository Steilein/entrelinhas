/** Lightbox da galeria com <dialog> nativo (foco preso, ESC fecha). */
export function initLightbox() {
  const dialog = document.querySelector<HTMLDialogElement>('[data-lightbox]');
  const gallery = document.querySelector<HTMLElement>('[data-gallery]');
  if (!dialog || !gallery) return;

  const items = Array.from(gallery.querySelectorAll<HTMLElement>('[data-item]'));
  const media = dialog.querySelector<HTMLElement>('[data-lb-media]')!;
  const caption = dialog.querySelector<HTMLElement>('[data-lb-caption]')!;
  const count = dialog.querySelector<HTMLElement>('[data-lb-count]')!;
  let index = 0;
  let opener: HTMLElement | null = null;

  function show(i: number) {
    index = (i + items.length) % items.length;
    const item = items[index];
    const paper = item.querySelector('.cartaz-paper')!;
    const tpl = item.querySelector<HTMLTemplateElement>('template[data-caption]')!;
    // no lightbox entra a imagem grande (data-full) no lugar da miniatura
    media.replaceChildren(
      ...Array.from(paper.children).map((c) => {
        const copia = c.cloneNode(true) as HTMLElement;
        if (copia instanceof HTMLImageElement && copia.dataset.full) {
          copia.loading = 'eager';
          copia.src = copia.dataset.full;
        }
        return copia;
      }),
    );
    caption.replaceChildren(tpl.content.cloneNode(true));
    count.textContent = `${index + 1} / ${items.length}`;
    history.replaceState(null, '', `#${item.id}`);
  }

  gallery.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-open]');
    if (!btn) return;
    opener = btn;
    show(Number(btn.dataset.open));
    dialog.showModal();
  });
  dialog.querySelector('[data-lb-prev]')!.addEventListener('click', () => show(index - 1));
  dialog.querySelector('[data-lb-next]')!.addEventListener('click', () => show(index + 1));
  dialog.querySelector('[data-lb-close]')!.addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') show(index + 1);
    if (e.key === 'ArrowLeft') show(index - 1);
  });
  // clicar fora do conteúdo (no fundo escuro) fecha
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    history.replaceState(null, '', location.pathname);
    opener?.focus();
  });

  // abre direto quando vem de um link com #obra-... ou #cartaz-...
  const fromHash = items.findIndex((el) => `#${el.id}` === location.hash);
  if (fromHash >= 0) {
    items[fromHash].scrollIntoView({ block: 'center' });
    show(fromHash);
    dialog.showModal();
  }
}
