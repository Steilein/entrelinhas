/** Gerador pseudoaleatório determinístico (mesma seed → mesma estrela). */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface StarburstOptions {
  /** número de pontas */
  points?: number;
  /** raio interno relativo (0–1): menor = pontas mais finas */
  inner?: number;
  /** irregularidade das pontas (0–1) */
  jitter?: number;
  seed?: number;
  /** tamanho do viewBox quadrado */
  size?: number;
}

/** Path SVG de uma estrela-explosão irregular, no estilo da identidade do entrelinhas. */
export function starburstPath({
  points = 16,
  inner = 0.5,
  jitter = 0.22,
  seed = 1,
  size = 100,
}: StarburstOptions = {}): string {
  const rand = mulberry32(seed);
  const r = size / 2;
  const n = points * 2;
  const rot = rand() * Math.PI * 2;
  const step = (Math.PI * 2) / n;
  let d = '';
  for (let i = 0; i < n; i++) {
    const outer = i % 2 === 0;
    const radius = outer ? r * (1 - jitter * rand()) : r * inner * (1 - jitter * 0.6 * rand());
    const angle = rot + i * step + (rand() - 0.5) * step * jitter;
    const x = r + Math.cos(angle) * radius;
    const y = r + Math.sin(angle) * radius;
    d += `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return `${d}Z`;
}
