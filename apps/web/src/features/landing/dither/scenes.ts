/** CPU mirror of the shader scenes, used by the Canvas 2D fallback (no WebGL2) and by layout helpers. */
export type RGB = [number, number, number];
export interface Palette { bg: RGB; c1: RGB; c2: RGB; c3: RGB; ink: RGB }
export interface Body { x: number; y: number; r: number }
export interface SceneState {
  morph: number; fade: number; cx: number; cy: number; scale: number;
  bodies: [Body, Body, Body]; orbit: { x: number; y: number; r: number };
}
export const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const BAYER8 = (() => {
  const out: number[] = [];
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    let v = 0;
    for (let k = 0; k < 3; k++) { const bx = (x >> k) & 1, by = (y >> k) & 1; v = v * 4 + 2 * (bx ^ by) + by; }
    out.push(v);
  }
  return out;
})();

const sstep = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const h21 = (x: number, y: number) => { let px = (x * 123.34) % 1, py = (y * 456.21) % 1; if (px < 0) px += 1; if (py < 0) py += 1; const d = px * (px + 45.32) + py * (py + 45.32); px += d; py += d; const v = (px * py) % 1; return v < 0 ? v + 1 : v; };

function sphere(px: number, py: number, t: number): number {
  const r = Math.hypot(px, py), a = Math.atan2(py, px);
  const R = 0.62 * (1 + 0.02 * Math.sin(t * 1.3 + a * 3) + 0.012 * Math.sin(t * 2.7 - a * 5));
  const shell = Math.exp(-(((r - R) / 0.075) ** 2));
  const halo = r > R ? Math.exp(-(r - R) * 5) * 0.38 : 0;
  const inner = (1 - sstep(0, R, r)) * 0.1;
  const drop = 1 - sstep(0.035, 0.06, r);
  return Math.min(1, Math.max(0, shell * 1.1 + halo + inner + drop));
}

function teardrop(px: number, py: number, t: number): number {
  const qy = py + 0.66, qx = px;
  const s = qy / (1.5 * (1 + 0.04 * Math.sin(t * 7.3)));
  if (s < -0.04 || s > 1) return 0;
  const sc = Math.min(1, Math.max(0, s));
  const w = 0.4 * Math.sqrt(Math.min(1, sc / 0.22)) * Math.pow(Math.max(1 - sc, 0), 1.1);
  const off = 0.05 * Math.sin(qy * 5 - t * 6) * sc * sc + 0.03 * Math.sin(qy * 11 - t * 9.5) * sc;
  const dx = Math.abs(qx - off);
  const body = (1 - sstep(w * 0.55, w, dx)) * (1 - 0.5 * sc);
  const core = (1 - sstep(0, w * 0.5, dx)) * (1 - sstep(0.1, 0.38, sc)) * (sc >= 0.06 ? 1 : 0) * 0.4;
  const glow = 0.26 * Math.exp(-Math.max(dx - w, 0) * 4) * (1 - sc * 0.5);
  return Math.min(1, Math.max(0, body - core + glow));
}

/** Returns [r, g, b, alpha]; alpha is the luminance that the ordered dither thresholds. */
export function flamePixel(x: number, y: number, cols: number, rows: number, t: number, st: SceneState, pal: Palette): [number, number, number, number] {
  const u = Math.min(cols, rows) * 0.5 * st.scale;
  const px = (x - st.cx * cols) / u, py = (y - st.cy * rows) / u;
  const m = sstep(0, 1, st.morph);
  const l = teardrop(px, py, t) * (1 - m) + sphere(px, py, t) * m;
  if (h21(Math.floor(x), Math.floor(y)) > 0.9962 && l < 0.2) return [...pal.ink, 1];
  const c = pal.c2.map((v, i) => v + (pal.c1[i]! - v) * m) as RGB;
  return [c[0], c[1], c[2], l];
}

function bodyPixel(b: Body, x: number, y: number, t: number, id: number, col: RGB): [number, number, number, number] | null {
  const dx = (x - b.x) / b.r, dy = (y - b.y) / b.r, d2 = dx * dx + dy * dy;
  if (d2 < 1) {
    const z = Math.sqrt(1 - d2);
    const len = Math.hypot(-0.55, 0.6, 0.55);
    const lamb = Math.max(0, (dx * -0.55 + dy * 0.6 + z * 0.55) / len);
    let tex = 0.8 + 0.2 * Math.sin(dx * 9 + Math.sin(dy * 6 + id * 2) * 2 + (id === 0 ? t * 0.12 : 0));
    if (id === 1) tex -= 0.28 * sstep(0.78, 1, Math.sin(dx * 17 + 1) * Math.sin(dy * 15 + 2));
    return [col[0], col[1], col[2], Math.min(1, Math.max(0, lamb * tex + Math.pow(1 - z, 3) * 0.12 + 0.03))];
  }
  if (id === 0) { const g = Math.exp(-(Math.sqrt(d2) - 1) * 16) * 0.4; if (g > 0.02) return [col[0], col[1], col[2], g]; }
  return null;
}

export function orbitPixel(x: number, y: number, t: number, st: SceneState, pal: Palette): [number, number, number, number] {
  let r: [number, number, number, number] = [0, 0, 0, 0];
  const cols: RGB[] = [pal.c1, pal.ink, pal.c2];
  st.bodies.forEach((b, i) => { const p = bodyPixel(b, x, y, t, i, cols[i]!); if (p) r = p; });
  const ox = (x - st.orbit.x) / st.orbit.r, oy = (y - st.orbit.y) / (st.orbit.r * 0.3);
  const ring = Math.abs(Math.hypot(ox, oy) - 1) * st.orbit.r;
  if (ring < 0.7 && r[3] < 0.05) { const dash = (Math.atan2(oy, ox) * 7 / 6.2832 * 3) % 1 >= 0.5 ? 1 : 0; r = [...pal.ink, 0.55 * dash]; }
  for (let i = 0; i < 30; i++) {
    const ang = i * 2.399 + t * (0.24 + 0.05 * (i % 4)), rr = st.orbit.r * (1 + 0.07 * (i % 4));
    const px = st.orbit.x + Math.cos(ang) * rr, py = st.orbit.y + Math.sin(ang) * rr * 0.3;
    if (Math.abs(Math.floor(x) - Math.floor(px)) + Math.abs(Math.floor(y) - Math.floor(py)) < 1.5) r = [...(i % 3 < 2 ? pal.c2 : pal.c3), 1];
  }
  if (h21(Math.floor(x), Math.floor(y)) > 0.9965 && r[3] < 0.2) return [...pal.ink, 1];
  return r;
}

/** Plate layout for the orbit scene, in cells with y measured from the top. Also used to place the crisp DOM labels. */
export function orbitLayout(cols: number, rows: number): [Body, Body, Body] {
  if (cols / rows >= 1.15) {
    return [
      { x: cols * 0.2, y: rows * 0.52, r: rows * 0.3 },
      { x: cols * 0.52, y: rows * 0.4, r: rows * 0.15 },
      { x: cols * 0.8, y: rows * 0.58, r: rows * 0.12 },
    ];
  }
  return [
    { x: cols * 0.3, y: rows * 0.25, r: cols * 0.22 },
    { x: cols * 0.7, y: rows * 0.52, r: cols * 0.12 },
    { x: cols * 0.34, y: rows * 0.8, r: cols * 0.1 },
  ];
}
