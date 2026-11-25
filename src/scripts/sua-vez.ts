/**
 * "Sua vez!": protótipo sem servidor. A reflexão não é enviada a lugar nenhum;
 * se a pessoa autoriza a publicação, ela aparece no mural e fica guardada só
 * neste navegador (localStorage), para continuar lá quando a página recarregar.
 */
const CHAVE = 'entrelinhas:sua-vez';

interface Reflexao {
  texto: string;
  assinatura: string;
  idade: string;
  origem: string;
  edicao: string;
  quando: string;
}

function ler(): Reflexao[] {
  try {
    const lista = JSON.parse(localStorage.getItem(CHAVE) ?? '[]');
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function gravar(lista: Reflexao[]) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch {
    // navegação anônima ou armazenamento bloqueado: a nota aparece só até recarregar
  }
}

export function initSuaVez() {
  const form = document.querySelector<HTMLFormElement>('[data-sua-vez]');
  const obrigado = document.querySelector<HTMLElement>('[data-obrigado]');
  const mural = document.querySelector<HTMLElement>('[data-mural]');
  const modelo = document.querySelector<HTMLTemplateElement>('[data-nota-modelo]');
  if (!form || !obrigado || !mural || !modelo) return;

  const texto = form.querySelector('textarea')!;
  const contador = form.querySelector('[data-contador]')!;
  const origem = form.querySelector<HTMLSelectElement>('select[name="origem"]')!;
  const edicao = form.querySelector<HTMLSelectElement>('select[name="edicao"]');
  const pergunta = form.querySelector('[data-pergunta]')!;

  const rotuloOrigem = (valor: string) =>
    Array.from(origem.options).find((o) => o.value === valor)?.dataset.rotulo ?? '';

  function mostrar(r: Reflexao) {
    const nota = modelo!.content.firstElementChild!.cloneNode(true) as HTMLElement;
    const assinatura = [r.assinatura.trim(), r.idade && `${r.idade} anos`].filter(Boolean).join(', ');
    nota.querySelector('.nota-texto p')!.textContent = r.texto;
    nota.querySelector('.nota-ass')!.textContent = `— ${assinatura || 'sem assinatura'}`;
    nota.querySelector('.nota-origem')!.textContent = rotuloOrigem(r.origem);
    mural!.prepend(nota);
  }
  ler().forEach(mostrar);

  // `required` aceita só espaços; a mensagem própria evita enviar uma folha em branco
  const validar = () => {
    contador.textContent = String(texto.value.length);
    texto.setCustomValidity(texto.value.trim() ? '' : 'Escreva sua reflexão antes de enviar.');
  };
  texto.addEventListener('input', validar);
  validar();

  edicao?.addEventListener('change', () => {
    pergunta.textContent = edicao.selectedOptions[0]?.dataset.pergunta ?? '';
  });

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const dados = new FormData(form);
    const publicar = dados.get('publicar') === 'on';
    if (publicar) {
      const r: Reflexao = {
        texto: texto.value.trim(),
        assinatura: String(dados.get('assinatura') ?? ''),
        idade: String(dados.get('idade') ?? ''),
        origem: String(dados.get('origem') ?? ''),
        edicao: String(dados.get('edicao') ?? ''),
        quando: new Date().toISOString(),
      };
      gravar([...ler(), r]);
      mostrar(r);
    }
    obrigado.querySelector('[data-obrigado-texto]')!.textContent = publicar
      ? 'Sua reflexão já está no mural, logo abaixo, junto com as de outras pessoas que leram o entrelinhas.'
      : 'Combinado: ela não vai para o mural. Se mudar de ideia, é só escrever de novo.';
    obrigado.querySelector<HTMLElement>('[data-ver-mural]')!.hidden = !publicar;
    form.hidden = true;
    obrigado.hidden = false;
    obrigado.focus();
  });

  obrigado.querySelector('[data-de-novo]')?.addEventListener('click', () => {
    form.reset();
    validar();
    obrigado.hidden = true;
    form.hidden = false;
    texto.focus();
  });
}
