/**
 * As rodas são geradas no build. Aqui o status (aconteceu / próxima roda) é refeito
 * com a data de quem visita, para a agenda não envelhecer entre uma publicação e outra.
 * Listas com data-limite="N" mostram só as N próximas rodas.
 */
const ROTULO = { passada: 'aconteceu', proxima: 'próxima roda', futura: '' } as const;

export function initRodas() {
  const agora = Date.now();
  for (const lista of document.querySelectorAll<HTMLElement>('[data-rodas]')) {
    const limite = Number(lista.dataset.limite) || Infinity;
    let futuras = 0;
    for (const roda of lista.querySelectorAll<HTMLElement>('[data-roda]')) {
      const passou = Date.parse(roda.dataset.fim ?? '') < agora;
      if (!passou) futuras++;
      const status = passou ? 'passada' : futuras === 1 ? 'proxima' : 'futura';
      roda.classList.remove('roda--passada', 'roda--proxima', 'roda--futura');
      roda.classList.add(`roda--${status}`);
      const rotulo = roda.querySelector('[data-roda-status]');
      if (rotulo) rotulo.textContent = ROTULO[status];
      const item = roda.closest('li') ?? roda;
      item.hidden = Number.isFinite(limite) && (passou || futuras > limite);
    }
    const vazio = lista.parentElement?.querySelector<HTMLElement>('[data-rodas-vazio]');
    if (vazio) vazio.hidden = futuras > 0;
  }
}
