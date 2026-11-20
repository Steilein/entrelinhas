import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { starburstPath } from '../lib/starburst';
import { distanceKm, formatDistance, normalize, directionsUrl } from '../lib/geo';

interface Ponto {
  id: string;
  nome: string;
  tipo: 'expositor' | 'lambe';
  endereco: string;
  bairro: string;
  lat: number;
  lng: number;
  horario: string;
  edicoes: number[];
  descricao?: string;
}

type Tipo = 'todos' | 'expositor' | 'lambe';

const CURITIBA: L.LatLngBoundsExpression = [
  [-25.65, -49.42],
  [-25.3, -49.15],
];

const pad = (n: number) => String(n).padStart(2, '0');
const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function pinIcon(p: Ponto, index: number) {
  const expositor = p.tipo === 'expositor';
  const d = starburstPath({ seed: index + 3, points: expositor ? 14 : 12, inner: 0.5, jitter: 0.2 });
  const size = expositor ? 46 : 32;
  const mark = expositor
    ? `<rect x="35" y="31" width="30" height="4.5" fill="#fff"/><text x="50" y="61" text-anchor="middle" fill="#fff" style="font:800 36px var(--font-display)">e</text><rect x="35" y="66" width="30" height="4.5" fill="#fff"/>`
    : '';
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<span class="pin pin--${p.tipo}" data-pin="${p.id}"><svg viewBox="0 0 100 100" aria-hidden="true"><path d="${d}" fill="${expositor ? '#E6007E' : '#B5CD20'}"/>${mark}</svg></span>`,
  });
}

export function initMap() {
  const root = document.querySelector<HTMLElement>('[data-mapa]');
  const el = root?.querySelector<HTMLElement>('[data-map]');
  const dataEl = document.getElementById('pontos-data');
  if (!root || !el || !dataEl) return;

  const pontos: Ponto[] = JSON.parse(dataEl.textContent || '[]');
  const byId = new Map(pontos.map((p) => [p.id, p]));
  const list = root.querySelector<HTMLOListElement>('[data-list]')!;
  const items = new Map(
    Array.from(list.querySelectorAll<HTMLLIElement>('.ponto')).map((li) => [li.dataset.id!, li]),
  );
  const countEl = root.querySelector<HTMLElement>('[data-count]')!;
  const emptyEl = root.querySelector<HTMLElement>('[data-empty]')!;
  const searchEl = root.querySelector<HTMLInputElement>('[data-search]')!;
  const geoMsg = root.querySelector<HTMLElement>('[data-geo-msg]')!;
  const sheet = root.querySelector<HTMLElement>('[data-sheet]')!;
  const sheetBody = root.querySelector<HTMLElement>('[data-sheet-body]')!;
  const mobile = matchMedia('(max-width: 860px)');

  /* ---------- estado (sincronizado com a URL) ---------- */
  const params = new URLSearchParams(location.search);
  const state = {
    tipo: (['expositor', 'lambe'].includes(params.get('tipo') ?? '') ? params.get('tipo') : 'todos') as Tipo,
    edicao: Number(params.get('edicao')) || 0,
    q: params.get('q') ?? '',
    selected: params.get('ponto') ?? '',
  };
  let me: L.LatLng | null = null;
  const distances = new Map<string, number>();

  /* ---------- mapa ---------- */
  const map = L.map(el, {
    zoomControl: false,
    minZoom: 11,
    maxZoom: 19,
    maxBounds: CURITIBA,
    maxBoundsViscosity: 0.8,
    scrollWheelZoom: true,
  });
  map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
  L.control.zoom({ position: 'topright', zoomInTitle: 'Aproximar', zoomOutTitle: 'Afastar' }).addTo(map);
  // Tiles do OpenStreetMap (gratuitos, sem chave; adequados a tráfego baixo, como um projeto acadêmico).
  // O filtro .tiles-base deixa o mapa em tons de cinza para os pontos da identidade saltarem.
  // Para tráfego alto, troque por um provedor com chave (ex.: MapTiler, Stadia) mantendo a atribuição.
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    className: 'tiles-base',
    attribution: '&copy; colaboradores do <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  const markers = new Map<string, L.Marker>();
  const layer = L.layerGroup().addTo(map);
  pontos.forEach((p, i) => {
    const m = L.marker([p.lat, p.lng], {
      icon: pinIcon(p, i),
      title: p.nome,
      alt: p.nome,
      keyboard: true,
      riseOnHover: true,
      zIndexOffset: p.tipo === 'expositor' ? 100 : 0,
    });
    // com keyboard: true, o Leaflet também dispara 'click' ao apertar Enter no marcador
    m.on('click', () => select(p.id, { fly: false, fromMap: true }));
    markers.set(p.id, m);
  });

  map.fitBounds(L.latLngBounds(pontos.map((p) => [p.lat, p.lng])), { padding: [40, 40] });

  /* ---------- filtros ---------- */
  function matches(p: Ponto) {
    if (state.tipo !== 'todos' && p.tipo !== state.tipo) return false;
    if (state.edicao && !p.edicoes.includes(state.edicao)) return false;
    if (state.q) {
      const li = items.get(p.id);
      if (!li?.dataset.busca?.includes(normalize(state.q))) return false;
    }
    return true;
  }

  function apply({ fit = false } = {}) {
    const visible: Ponto[] = [];
    pontos.forEach((p) => {
      const ok = matches(p);
      const m = markers.get(p.id)!;
      if (ok) {
        visible.push(p);
        if (!layer.hasLayer(m)) layer.addLayer(m);
      } else if (layer.hasLayer(m)) {
        layer.removeLayer(m);
      }
      items.get(p.id)!.hidden = !ok;
    });
    const n = visible.length;
    countEl.textContent = n === 1 ? '1 ponto encontrado' : `${n} pontos encontrados`;
    emptyEl.hidden = n > 0;

    root!.querySelectorAll<HTMLButtonElement>('button[data-tipo]').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.dataset.tipo === state.tipo)),
    );
    root!.querySelectorAll<HTMLButtonElement>('button[data-edicao]').forEach((b) =>
      b.setAttribute('aria-pressed', String(Number(b.dataset.edicao) === state.edicao)),
    );

    if (fit && n) {
      const bounds = L.latLngBounds(visible.map((p) => [p.lat, p.lng]));
      if (me) bounds.extend(me);
      map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 16, duration: 0.6 });
    }
    if (state.selected && !visible.some((p) => p.id === state.selected)) closeSheet();
    syncUrl();
  }

  function syncUrl() {
    const q = new URLSearchParams();
    if (state.tipo !== 'todos') q.set('tipo', state.tipo);
    if (state.edicao) q.set('edicao', String(state.edicao));
    if (state.q) q.set('q', state.q);
    if (state.selected) q.set('ponto', state.selected);
    const s = q.toString();
    history.replaceState(null, '', s ? `?${s}` : location.pathname);
  }

  root.querySelectorAll<HTMLButtonElement>('button[data-tipo]').forEach((b) =>
    b.addEventListener('click', () => {
      state.tipo = b.dataset.tipo as Tipo;
      apply({ fit: true });
    }),
  );
  root.querySelectorAll<HTMLButtonElement>('button[data-edicao]').forEach((b) =>
    b.addEventListener('click', () => {
      state.edicao = Number(b.dataset.edicao);
      apply({ fit: true });
    }),
  );
  let searchTimer = 0;
  searchEl.value = state.q;
  searchEl.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      state.q = searchEl.value.trim();
      apply({ fit: true });
    }, 180);
  });

  /* ---------- seleção ---------- */
  function select(id: string, { fly = true, fromMap = false } = {}) {
    const p = byId.get(id);
    if (!p) return;
    state.selected = id;
    items.forEach((li, key) => li.classList.toggle('is-active', key === id));
    markers.forEach((m, key) => {
      m.getElement()?.querySelector('.pin')?.classList.toggle('is-active', key === id);
    });
    if (mobile.matches) setView('mapa');
    if (fly) map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), 16), { duration: 0.7 });
    else map.panTo([p.lat, p.lng], { animate: true });
    if (fromMap && !mobile.matches) items.get(id)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    openSheet(p);
    syncUrl();
  }

  function openSheet(p: Ponto) {
    const dist = distances.get(p.id);
    const eds = p.edicoes.map(pad).join(' · ');
    sheetBody.innerHTML = `
      <span class="sheet-tipo sheet-tipo--${p.tipo}">${p.tipo === 'expositor' ? 'livretos grátis' : 'lambe-lambe'}</span>
      <h2 class="sheet-nome">${escapeHtml(p.nome)}</h2>
      <p class="sheet-info">${escapeHtml(p.endereco)} · ${escapeHtml(p.bairro)}</p>
      <p class="sheet-info">${escapeHtml(p.horario)}${dist != null ? ` · <span class="sheet-dist">${formatDistance(dist)}</span>` : ''}</p>
      ${p.descricao ? `<p class="sheet-desc">${escapeHtml(p.descricao)}</p>` : ''}
      ${eds ? `<p class="sheet-eds">${p.tipo === 'expositor' ? 'Edições disponíveis' : 'Cartazes das edições'}: ${eds}</p>` : ''}
      <div class="sheet-acoes">
        <a class="btn btn--sm btn--magenta" href="${directionsUrl(p.lat, p.lng)}" target="_blank" rel="noopener">como chegar ↗</a>
        <button type="button" class="btn btn--sm btn--ghost" data-share="${p.id}" data-nome="${escapeHtml(p.nome)}">compartilhar</button>
      </div>`;
    sheet.hidden = false;
  }

  function closeSheet() {
    sheet.hidden = true;
    state.selected = '';
    items.forEach((li) => li.classList.remove('is-active'));
    root!.querySelectorAll('.pin.is-active').forEach((el) => el.classList.remove('is-active'));
    syncUrl();
  }

  root.querySelector('[data-sheet-close]')!.addEventListener('click', closeSheet);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !sheet.hidden) closeSheet();
  });

  list.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-select]');
    if (btn) select(btn.dataset.select!);
  });

  /* ---------- compartilhar ---------- */
  root.addEventListener('click', async (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-share]');
    if (!btn) return;
    const link = `${location.origin}${location.pathname}?ponto=${btn.dataset.share}`;
    const title = `${btn.dataset.nome} · entrelinhas`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: 'Tem livreto grátis do entrelinhas aqui:', url: link });
      } catch {
        /* cancelado */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      const old = btn.textContent;
      btn.textContent = 'link copiado!';
      setTimeout(() => (btn.textContent = old), 2000);
    } catch {
      prompt('Copie o link:', link);
    }
  });

  /* ---------- perto de mim ---------- */
  let meMarker: L.Marker | null = null;
  root.querySelector('[data-near]')!.addEventListener('click', () => {
    if (!('geolocation' in navigator)) {
      geoMsg.textContent = 'Seu navegador não oferece localização. Use a busca por bairro.';
      return;
    }
    if (!window.isSecureContext) {
      geoMsg.textContent = 'A localização só funciona com o site em conexão segura (https).';
      return;
    }
    geoMsg.textContent = 'Procurando você no mapa…';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        me = L.latLng(pos.coords.latitude, pos.coords.longitude);
        pontos.forEach((p) => distances.set(p.id, distanceKm(me!.lat, me!.lng, p.lat, p.lng)));
        const sorted = [...pontos].sort((a, b) => distances.get(a.id)! - distances.get(b.id)!);
        sorted.forEach((p) => {
          const li = items.get(p.id)!;
          li.querySelector<HTMLElement>('[data-dist]')!.textContent = formatDistance(distances.get(p.id)!);
          list.append(li);
        });
        if (!meMarker) {
          meMarker = L.marker(me, {
            icon: L.divIcon({ className: '', iconSize: [22, 22], iconAnchor: [11, 11], html: '<span class="pin-me" style="position:relative;display:block"></span>' }),
            title: 'Você está aqui',
            keyboard: false,
            zIndexOffset: 1000,
          }).addTo(map);
        } else {
          meMarker.setLatLng(me);
        }
        const nearest = sorted.filter(matches).slice(0, 3);
        const far = distances.get(sorted[0].id)! > 40;
        geoMsg.textContent = far
          ? 'Você parece estar longe de Curitiba. Mesmo assim, ordenamos os pontos pela distância.'
          : `O mais perto é ${sorted[0].nome}, ${formatDistance(distances.get(sorted[0].id)!)}. A lista agora vai do mais perto ao mais longe.`;
        if (!far && nearest.length) {
          const b = L.latLngBounds(nearest.map((p) => [p.lat, p.lng]));
          b.extend(me);
          map.flyToBounds(b, { padding: [60, 60], maxZoom: 16, duration: 0.8 });
        }
      },
      (err) => {
        geoMsg.textContent =
          err.code === err.PERMISSION_DENIED
            ? 'Sem acesso à localização. Tudo bem: use o mapa ou busque pelo seu bairro.'
            : 'Não conseguimos encontrar sua localização agora. Tente de novo ou busque pelo bairro.';
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });

  /* ---------- mapa / lista (celular) ---------- */
  function setView(view: 'mapa' | 'lista') {
    root!.dataset.view = view;
    root!.querySelectorAll<HTMLButtonElement>('[data-view-btn]').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.dataset.viewBtn === view)),
    );
    if (view === 'mapa') requestAnimationFrame(() => map.invalidateSize());
  }
  root.querySelectorAll<HTMLButtonElement>('[data-view-btn]').forEach((b) =>
    b.addEventListener('click', () => setView(b.dataset.viewBtn as 'mapa' | 'lista')),
  );
  mobile.addEventListener('change', () => requestAnimationFrame(() => map.invalidateSize()));

  /* ---------- estado inicial ---------- */
  apply({ fit: Boolean(state.tipo !== 'todos' || state.edicao || state.q) });
  if (state.selected && byId.has(state.selected)) {
    const id = state.selected;
    map.whenReady(() => setTimeout(() => select(id), 250));
  }
  root.dataset.ready = 'true';
}
