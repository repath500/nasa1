/**
 * Mission view engine: the planning prototype's dithered stage (app/fire-atlas.html), rebuilt on the real corpus.
 * Every NASA test row is a flame. In Orbit they circle Earth; picking a habitat flies the camera there and the tests
 * run in air like that habitat's travel to it. Air map, Oxygen ladder and Timeline re-sort the same flames.
 *
 * Rendering: a low-resolution pixel buffer with a fixed 4x4 Bayer matrix (no shimmer), scaled up with nearest-neighbour.
 * Matching comes from the caller (@fire/core overlap), so this view and the Gap Map always agree.
 * One rAF loop at ~30 fps, paused when off-screen or the tab is hidden; static under reduced motion.
 */
import type { FuelPhase, TestRow } from '@fire/contracts';

export type MissionView = 'orbit' | 'map' | 'ladder' | 'time';
export type MatchClass = 'match' | 'unknown' | 'none' | 'burner';
export type BodyKey = 'earth' | 'moon' | 'mars';
export interface MissionDest { key: string; name: string; o2Pct: number; totalKpa: number; body: BodyKey | null; o2Points: number; pressureFrac: number }
export interface MissionApi {
  setData(rows: TestRow[], classify: (row: TestRow) => MatchClass): void;
  setDest(dest: MissionDest, instant?: boolean): void;
  setView(view: MissionView): void;
  setSelected(id: string | null): void;
  setHighlights(ids: string[]): void;
  setPhaseFilter(phases: FuelPhase[]): void;
  replay(): void;
  isReplaying(): boolean;
  destroy(): void;
}
export interface MissionCallbacks {
  onHover(rowId: string | null, x: number, y: number): void;
  onSelect(rowId: string | null): void;
  onReplayYear(year: number | null): void;
}

type RGB = [number, number, number];
type Cls = 'drop' | 'gas' | 'solid' | 'aerosol' | 'burner' | 'unknown';
interface Flame {
  row: TestRow; i: number; cls: Cls; o2: number | null; kpa: number | null; when: number | null;
  ang: number; rad: number; spd: number; j: number;
  mode: 'home' | 'dest'; from: { x: number; y: number } | null; t0: number; arc: number; launch: number;
  cx: number; cy: number; match: MatchClass; visible: boolean;
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const thr = (x: number, y: number) => (BAYER[(y & 3) * 4 + (x & 3)]! + 0.5) / 16;
const hash2 = (x: number, y: number) => { let h = x * 374761393 + y * 668265263; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
const hex = (h: string): RGB => { const v = h.trim().replace('#', ''); const n = parseInt(v.length === 3 ? v.split('').map((c) => c + c).join('') : v, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const dimmed = (c: RGB): RGB => [Math.round(c[0] * 0.45), Math.round(c[1] * 0.45), Math.round(c[2] * 0.45)];
const mid = (r: { min: number | null; max: number | null }) => (r.min === null && r.max === null ? null : ((r.min ?? r.max!) + (r.max ?? r.min!)) / 2);
const lg = (o: number) => Math.log10(Math.max(10, Math.min(100, o))) - 1;

function vnoise(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm = (x: number, y: number, o: number) => { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); a *= 0.5; f *= 2; } return s; };
const TW = 256, TH = 128;
const makeTex = (fn: (x: number, y: number) => number) => { const t = new Float32Array(TW * TH); for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) t[y * TW + x] = fn(x, y); return t; };

let textures: { earth: Float32Array; moon: Float32Array; mars: Float32Array; neb: Float32Array } | null = null;
function getTextures() {
  if (textures) return textures;
  const craters: [number, number, number][] = [];
  for (let i = 0; i < 70; i++) craters.push([hash2(i, 7) * TW, hash2(i, 13) * TH, 2 + hash2(i, 21) * hash2(i, 3) * 14]);
  textures = {
    earth: makeTex((x, y) => { const lat = Math.abs(y / TH - 0.5) * 2; if (lat > 0.86) return 2; return fbm(x / 22, y / 22, 4) + 0.08 * Math.sin(x / 9) > 0.56 ? 1 : 0; }),
    moon: makeTex((x, y) => {
      let v = 0.55 + (fbm(x / 14, y / 14, 4) - 0.5) * 0.6; if (fbm(x / 40 + 3, y / 40, 3) > 0.58) v -= 0.18;
      for (const [cx, cy, r] of craters) { let dx = Math.abs(x - cx); dx = Math.min(dx, TW - dx); const d = Math.hypot(dx, y - cy) / r; if (d < 1) v -= 0.16 * (1 - d); else if (d < 1.25) v += 0.12 * (1.25 - d) * 4; }
      return Math.max(0, Math.min(1, v));
    }),
    mars: makeTex((x, y) => (Math.abs(y / TH - 0.5) * 2 > 0.9 ? 1.2 : 0.45 + (fbm(x / 18, y / 18, 4) - 0.5) * 0.9)),
    neb: makeTex((x, y) => Math.max(0, fbm(x / 34 + 9, y / 34 + 4, 4) - 0.45) * 2.4),
  };
  return textures;
}

const RAMP: Record<string, string[]> = {
  ocean: ['#05080D', '#0A1E36', '#123E66', '#2A6FA3', '#6EC1F5'], land: ['#05080D', '#0E2A22', '#1E5240', '#3F8E6C', '#A6E0C2'],
  ice: ['#05080D', '#26303C', '#6A7888', '#C6D3E0', '#F2F7FB'], moon: ['#05080D', '#171A1F', '#33383F', '#5F656E', '#9CA2AA', '#DADDE1'],
  mars: ['#05080D', '#260D07', '#55210F', '#913E22', '#CF6E42', '#F2AE86'], marsice: ['#05080D', '#3A2A28', '#8A7A76', '#D9CFCB', '#F7F1EE'],
};
const RG: Record<string, RGB[]> = Object.fromEntries(Object.entries(RAMP).map(([k, v]) => [k, v.map(hex)]));
const BODY: Record<BodyKey, { x: number; y: number; r: number }> = { earth: { x: 0, y: 0, r: 52 }, moon: { x: 430, y: -24, r: 38 }, mars: { x: 830, y: 14, r: 30 } };
const CAMS: Record<string, { x: number; y: number; z: number }> = {
  earth: { x: 0, y: 0, z: 1.05 }, moon: { x: 430, y: -10, z: 2.25 }, mars: { x: 830, y: 14, z: 2.6 }, suit: { x: 430, y: 10, z: 6 },
};
const LIGHT = (() => { const l = [-0.55, -0.35, 0.76]; const n = Math.hypot(...l); return l.map((v) => v / n) as [number, number, number]; })();
const NEB: RGB[] = [[12, 22, 40], [22, 40, 70]];
const GRID: RGB = [34, 48, 68], GRID2: RGB = [78, 98, 124];

export function createMission(canvas: HTMLCanvasElement, labels: HTMLElement, cb: MissionCallbacks, reduce: boolean): MissionApi {
  const ctx = canvas.getContext('2d')!;
  const tex = getTextures();
  let W = 480, H = 270, FZ = 1;
  let img = ctx.createImageData(W, H), buf = img.data;
  const css = getComputedStyle(document.documentElement);
  const tok = (n: string, f: string) => hex(css.getPropertyValue(n).trim() || f);
  const pal: Record<Cls, RGB> = {
    drop: tok('--color-droplet', '#6EC1F5'), gas: tok('--color-gas', '#56D3C1'), solid: tok('--color-solid', '#FF9447'),
    aerosol: tok('--color-aerosol', '#C7B7FF'), burner: tok('--color-burner', '#9A90CC'), unknown: tok('--color-unknown', '#8A94A3'),
  };
  const palD = Object.fromEntries(Object.entries(pal).map(([k, v]) => [k, dimmed(v)])) as Record<Cls, RGB>;
  const white: RGB = [234, 240, 247], bg: RGB = [5, 8, 13];

  let flames: Flame[] = [];
  let view: MissionView = 'orbit';
  let dest: MissionDest = { key: 'earth-iss', name: 'ISS / Earth air', o2Pct: 21, totalKpa: 101.3, body: 'earth', o2Points: 3, pressureFrac: 0.15 };
  let cam = { ...CAMS.earth! }, camAnim: { from: typeof cam; to: typeof cam; t0: number; dur: number } | null = null;
  let bodyA = 1, selected: string | null = null, highlights = new Set<string>(), hover = -1, phases: FuelPhase[] = [];
  let drawn: { x: number; y: number; f: Flame }[] = [];
  let replayStart = -1, replayRange: [number, number] = [2009, 2022];
  let raf = 0, last = 0, onScreen = true, running = true;
  let chart: { x0: number; x1: number; y0: number; y1: number; band: number; yb: number } | null = null;

  const S = (wx: number, wy: number): [number, number] => [(wx - cam.x) * cam.z * FZ + W / 2, (wy - cam.y) * cam.z * FZ + H / 2];
  const put = (x: number, y: number, c: RGB) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 4; buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; };
  const q = (r: RGB[], v: number, x: number, y: number) => { const n = r.length - 1, s = Math.max(0, Math.min(1, v)) * n, b = Math.floor(s), f = s - b; return r[Math.min(n, f > thr(x, y) ? b + 1 : b)]!; };

  /* ---- crisp HTML labels in canvas pixels ---- */
  const pool: HTMLDivElement[] = []; let used = 0, scale = 1;
  const label = (text: string, sx: number, sy: number, cls = '', dx = 0, dy = 0) => {
    let d = pool[used]; if (!d) { d = document.createElement('div'); labels.appendChild(d); pool[used] = d; } used++;
    if (d.textContent !== text) d.textContent = text;
    const c = `mv-label ${cls}`; if (d.className !== c) d.className = c;
    d.style.display = ''; d.style.transform = `translate(${Math.round(sx * scale + dx)}px, ${Math.round(sy * scale + dy)}px)`;
  };

  function resize() {
    const r = canvas.parentElement!.getBoundingClientRect(); if (!r.width || !r.height) return;
    H = 270; W = Math.max(Math.round(H * 0.8), Math.min(820, Math.round(H * r.width / r.height)));
    canvas.width = W; canvas.height = H; img = ctx.createImageData(W, H); buf = img.data; FZ = Math.min(H / 270, W / 430);
    if (view !== 'orbit') layout();
  }

  function classOf(row: TestRow): Cls {
    if (row.o2Location === 'burner') return 'burner';
    return row.fuel.phase === 'liquid-droplet' ? 'drop' : row.fuel.phase === 'gas' ? 'gas' : row.fuel.phase === 'solid' ? 'solid' : row.fuel.phase === 'aerosol' ? 'aerosol' : 'unknown';
  }

  /* ---- positions ---- */
  const homePos = (f: Flame, t: number) => { const a = f.ang + t * f.spd, rr = f.rad; return { x: Math.cos(a) * rr, y: Math.sin(a) * rr * 0.27 + Math.cos(a) * rr * -0.12, back: Math.sin(a) < 0 }; };
  const anchor = () => {
    if (dest.body === 'moon') return { x: BODY.moon.x, y: BODY.moon.y + BODY.moon.r * 0.93 };
    if (dest.body === 'mars') return { x: BODY.mars.x, y: BODY.mars.y };
    return null;
  };
  const destPos = (f: Flame, t: number) => {
    const A = anchor()!;
    if (dest.body === 'mars') { const a = f.ang * 3 + t * 0.5; return { x: A.x + Math.cos(a) * BODY.mars.r * 1.4, y: A.y + Math.sin(a) * BODY.mars.r * 0.42, back: Math.sin(a) < 0 }; }
    const a = f.ang * 5 + t * 0.9, rr = 5 + f.j * 11; return { x: A.x + Math.cos(a) * rr, y: A.y - 4 + Math.sin(a) * rr * 0.45, back: false };
  };
  function posOf(f: Flame, t: number, now: number) {
    let tgt: { x: number; y: number; back: boolean };
    if (view === 'orbit') tgt = f.mode === 'dest' && anchor() ? destPos(f, t) : homePos(f, t);
    else { const z = cam.z * FZ; tgt = { x: (f.cx - W / 2) / z + cam.x, y: (f.cy - H / 2) / z + cam.y, back: false }; }
    let pos: { x: number; y: number; back: boolean; travel?: boolean } = tgt;
    const u = (now - f.t0) / 1500;
    if (u < 1 && f.from) {
      const e = u < 0 ? 0 : u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      const cx = (f.from.x + tgt.x) / 2, cy = Math.min(f.from.y, tgt.y) - f.arc;
      pos = { x: (1 - e) * (1 - e) * f.from.x + 2 * (1 - e) * e * cx + e * e * tgt.x, y: (1 - e) * (1 - e) * f.from.y + 2 * (1 - e) * e * cy + e * e * tgt.y, back: false, travel: u > 0 };
    }
    return pos;
  }

  /* ---- layouts for the three chart views ---- */
  function region() { const x0 = Math.round(Math.max(30, W * 0.09)), x1 = Math.round(W - 10), y0 = Math.round(H * 0.17), y1 = Math.round(H * 0.84); return { x0, x1: Math.max(x0 + 60, x1), y0, y1 }; }
  function layout() {
    const R = region(), w = R.x1 - R.x0, xo = (o: number) => R.x0 + lg(o) * w;
    if (view === 'map') {
      const band = Math.max(10, Math.round(H * 0.07)), yb = R.y1 - band;
      const yk = (k: number) => yb - Math.log(Math.max(20, Math.min(600, k)) / 20) / Math.log(30) * (yb - R.y0);
      for (const f of flames) {
        const j1 = hash2(f.i, 51) - 0.5, j2 = hash2(f.i, 52) - 0.5;
        f.cx = f.o2 === null ? R.x0 - 14 + j1 * 8 : xo(f.o2) + j1 * 5;
        f.cy = f.kpa === null ? yb + 2 + (j2 + 0.5) * (band - 4) : yk(f.kpa) + j2 * 5;
      }
      chart = { ...R, band, yb };
      return;
    }
    if (view === 'orbit') { chart = null; return; }
    const bw = Math.max(5, Math.round(w / (view === 'time' ? 54 : 46))), nbin = Math.max(2, Math.floor(w / bw)), sub = Math.max(1, Math.floor((bw - 1) / 2));
    const span = replayRange[1] - replayRange[0];
    const key = (f: Flame) => (view === 'time' ? (f.when === null ? null : (f.when - replayRange[0]) / span) : f.o2 === null ? null : lg(f.o2));
    const order: Record<Cls, number> = { solid: 0, drop: 1, gas: 2, aerosol: 3, unknown: 4, burner: 5 };
    const counts: Record<number, number> = {}; let max = 1;
    const list = [...flames].sort((a, b) => order[a.cls] - order[b.cls] || a.i - b.i);
    const extraBin = nbin; // last column: no O2 (ladder) or no date (timeline)
    const bins = new Map<Flame, number>();
    for (const f of list) {
      const k = key(f); const bin = k === null ? extraBin : Math.max(0, Math.min(nbin - 1, Math.floor(k * nbin)));
      const n = (counts[bin] = (counts[bin] ?? 0) + 1); if (n > max) max = n; bins.set(f, bin * 100000 + n);
    }
    const hgt = R.y1 - R.y0 - 4, rows = Math.ceil(max / sub), step = rows * 2 <= hgt ? 2 : hgt / rows;
    const usableW = w - bw * 2;
    const colX = (bin: number) => (bin === extraBin ? R.x1 - bw : R.x0 + (bin / nbin) * usableW);
    for (const f of list) { const v = bins.get(f)!, bin = Math.floor(v / 100000), n = (v % 100000) - 1; f.cx = colX(bin) + (n % sub) * 2 + 1; f.cy = R.y1 - 2 - Math.floor(n / sub) * step; }
    chart = { ...R, band: 0, yb: R.y1 };
  }

  /* ---- drawing ---- */
  function drawBack(orb: boolean) {
    let i = 0;
    for (let y = 0; y < H; y++) {
      const ty = Math.min(TH - 1, (y * TH / H) | 0) * TW;
      for (let x = 0; x < W; x++, i += 4) {
        const t = thr(x, y); let c = bg; const n = tex.neb[ty + (((x * 220 / W) | 0) & 255)]!;
        if (orb && n > t * 1.6 + 0.12) c = n > t * 1.6 + 0.6 ? NEB[1]! : NEB[0]!;
        buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = 255;
      }
    }
  }
  function drawBody(key: BodyKey, rot: number) {
    const b = BODY[key], [sx, sy] = S(b.x, b.y), R = b.r * cam.z * FZ;
    if (sx + R * 1.1 < 0 || sx - R * 1.1 > W || sy + R * 1.1 < 0 || sy - R * 1.1 > H) return;
    const x0 = Math.max(0, Math.floor(sx - R * 1.08)), x1 = Math.min(W - 1, Math.ceil(sx + R * 1.08)), y0 = Math.max(0, Math.floor(sy - R * 1.08)), y1 = Math.min(H - 1, Math.ceil(sy + R * 1.08));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const nx = (x + 0.5 - sx) / R, ny = (y + 0.5 - sy) / R, rr = nx * nx + ny * ny;
      if (rr > 1) { if (key === 'earth' && bodyA >= 1 && rr < 1.12) { const a = (1.12 - rr) / 0.12 * 0.55 * Math.max(0.15, -(nx * LIGHT[0] + ny * LIGHT[1]) + 0.4); if (a > thr(x, y)) put(x, y, RG.ocean![4]!); } continue; }
      if (bodyA < 1 && bodyA <= thr(x + 5, y + 2)) continue;
      const nz = Math.sqrt(1 - rr), sh = Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]), lon = Math.atan2(nx, nz) + rot, lat = Math.asin(ny);
      const u = ((lon / (2 * Math.PI)) % 1 + 1) % 1, tv = Math.floor((lat / Math.PI + 0.5) * (TH - 1)), ti = tv * TW + (Math.floor(u * TW) % TW);
      const lit = 0.05 + 0.95 * sh;
      let c: RGB;
      if (key === 'earth') { const k = tex.earth[ti]!; c = q(k === 2 ? RG.ice! : k === 1 ? RG.land! : RG.ocean!, lit * (k ? 0.95 : 0.85), x, y); }
      else if (key === 'moon') c = q(RG.moon!, lit * (0.35 + 0.75 * tex.moon[ti]!), x, y);
      else { const m = tex.mars[ti]!; c = q(m > 1 ? RG.marsice! : RG.mars!, lit * (m > 1 ? 0.95 : 0.3 + 0.75 * m), x, y); }
      put(x, y, c);
    }
  }
  function glow(xi: number, yi: number, c: RGB, r: number, a: number) {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const d = Math.hypot(dx, dy); if (d > r || (!dx && !dy)) continue; if ((1 - d / (r + 0.6)) * a > thr(xi + dx, yi + dy)) put(xi + dx, yi + dy, c); }
  }
  function ring(x: number, y: number, r: number, c: RGB) { for (let k = 0; k < 28; k++) { const a = (k / 28) * Math.PI * 2; put(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), c); } }
  const passes = (f: Flame) => !phases.length || phases.includes(f.row.fuel.phase);

  function drawFlames(t: number, now: number, front: boolean) {
    const [ex, ey] = S(0, 0), eR = BODY.earth.r * cam.z * FZ;
    for (const f of flames) {
      if (!f.visible) continue;
      const pos = posOf(f, t, now); if (!!pos.back === front) continue;
      const [x, y] = S(pos.x, pos.y), xi = Math.round(x), yi = Math.round(y);
      if (xi < -2 || yi < -2 || xi > W + 1 || yi > H + 1) continue;
      if (pos.back && f.mode === 'home' && Math.hypot(x - ex, y - ey) < eR) continue;
      const c = pal[f.cls], hot = f.match === 'match', lit = highlights.has(f.row.id), active = passes(f);
      if (!active) { if ((xi + yi) % 3 === 0) put(xi, yi, palD[f.cls]); drawn.push({ x, y, f }); continue; }
      if (hot || pos.travel || lit) {
        glow(xi, yi, palD[f.cls], view === 'orbit' ? 3 : 2, 0.85);
        put(xi, yi, hash2(f.i, Math.floor(now / 140)) > 0.25 ? c : white); put(xi + 1, yi, c); put(xi, yi - 1, c);
      } else if (f.cls === 'burner') { if (view !== 'orbit') { put(xi, yi, palD.burner); put(xi + 1, yi + 1, palD.burner); } else if ((f.i + Math.floor(now / 400)) % 3 === 0) put(xi, yi, palD.burner); }
      else if (view === 'orbit') put(xi, yi, hash2(f.i, Math.floor(now / 160)) > 0.3 ? c : palD[f.cls]);
      else { const cc = f.match === 'unknown' ? palD[f.cls] : c; put(xi, yi, cc); put(xi + 1, yi, cc); put(xi, yi + 1, cc); put(xi + 1, yi + 1, cc); }
      if (f.row.id === selected) { ring(xi, yi, 5 + (reduce ? 0 : Math.floor(now / 350) % 2), white); }
      drawn.push({ x, y, f });
    }
  }
  function drawOrbitRing() {
    for (let k = 0; k < 180; k += 3) {
      const a = (k / 180) * Math.PI * 2, rr = 84, x = Math.cos(a) * rr, y = Math.sin(a) * rr * 0.27 + Math.cos(a) * rr * -0.12;
      const [sx, sy] = S(x, y), [ex, ey] = S(0, 0);
      if (Math.sin(a) < 0 && Math.hypot(sx - ex, sy - ey) < BODY.earth.r * cam.z * FZ) continue;
      put(Math.round(sx), Math.round(sy), [40, 60, 84]);
    }
  }
  const vdot = (x: number, ya: number, yb: number, c: RGB, st = 3) => { x = Math.round(x); for (let y = Math.round(ya); y <= yb; y += st) put(x, y, c); };
  const hdot = (y: number, xa: number, xb: number, c: RGB, st = 3) => { y = Math.round(y); for (let x = Math.round(xa); x <= xb; x += st) put(x, y, c); };
  const fillD = (xa: number, ya: number, xb: number, yb: number, c: RGB, a: number) => {
    for (let y = Math.max(0, Math.round(ya)); y <= Math.min(H - 1, Math.round(yb)); y++) for (let x = Math.max(0, Math.round(xa)); x <= Math.min(W - 1, Math.round(xb)); x++) if (a > thr(x, y)) put(x, y, c);
  };
  function drawChart() {
    if (!chart) return; const R = chart, w = R.x1 - R.x0, xo = (o: number) => R.x0 + lg(o) * w, wide = W > 320;
    if (view === 'time') {
      const usableW = w - Math.max(5, Math.round(w / 54)) * 2, span = replayRange[1] - replayRange[0];
      for (let yy = replayRange[0]; yy <= replayRange[1]; yy++) { const x = R.x0 + ((yy - replayRange[0]) / span) * usableW; vdot(x, R.y0, R.y1, GRID); if (yy < replayRange[1] && (wide || yy % 2)) label(String(yy), x, R.y1, 'c', 0, 8); }
      hdot(R.y1 + 1, R.x0, R.x1, GRID2, 1); label('no date', R.x1 - 4, R.y0, 'r', 0, -6);
      label('Every test, by the year it ran', R.x0, R.y0, 'hi', 0, -20); return;
    }
    const xa = xo(Math.max(10, dest.o2Pct - dest.o2Points)), xb = xo(Math.min(100, dest.o2Pct + dest.o2Points));
    if (view === 'ladder') {
      fillD(xa, R.y0, xb, R.y1, [26, 44, 66], 0.5); vdot(xa, R.y0, R.y1, white, 2); vdot(xb, R.y0, R.y1, white, 2);
      label('no O₂ in table', R.x1 - 4, R.y0, 'r', 0, -6);
      label(`Every test, stacked by oxygen. ${dest.name}: ${dest.o2Pct}% ±${dest.o2Points}`, R.x0, R.y0, 'hi', 0, -20);
    } else {
      const yk = (k: number) => R.yb - Math.log(Math.max(20, Math.min(600, k)) / 20) / Math.log(30) * (R.yb - R.y0);
      const ya = yk(dest.totalKpa * (1 + dest.pressureFrac)), yb2 = yk(dest.totalKpa * (1 - dest.pressureFrac));
      for (const k of [30, 50, 70, 101, 200, 300, 500]) { const y = yk(k); hdot(y, R.x0, R.x1, GRID); label(String(k), R.x0, y, 'r', -6, -7); }
      fillD(xa, R.yb + 1, xb, R.y1, [26, 44, 66], 0.4); fillD(xa, ya, xb, yb2, [36, 64, 96], 0.55);
      hdot(ya, xa, xb, white, 2); hdot(yb2, xa, xb, white, 2); vdot(xa, ya, yb2, white, 2); vdot(xb, ya, yb2, white, 2);
      hdot(R.yb, R.x0, R.x1, GRID2, 1); label('pressure not reported', R.x1, R.y1 - R.band / 2, 'r', -4, -7);
      label(dest.name, (xa + xb) / 2, ya, 'hi c', 0, -18);
      label('Oxygen % across, pressure kPa up', R.x0, R.y0, 'hi', 0, -20);
    }
    for (const o of [12, 15, 21, 30, 40, 60, 85, 100]) { const x = xo(o); vdot(x, R.y0, R.y1, GRID); if (wide || o !== 15) label(`${o}%`, x, R.y1, 'c', 0, 8); }
    hdot(R.y1 + 1, R.x0, R.x1, GRID2, 1);
    const solidMax = flames.reduce((m, f) => (f.cls === 'solid' && f.row.o2Location === 'ambient' && f.o2 !== null ? Math.max(m, f.row.o2Pct.max ?? f.o2) : m), 0);
    if (solidMax > 0) { const xs = xo(solidMax); vdot(xs, R.y0, R.y1, pal.solid, 2); label(`no solid-fuel row reports O₂ above ${solidMax}%`, xs, R.y0, 'fire', 5, 2); }
  }
  function placeBodyLabels(orb: boolean) {
    if (!orb) return;
    const at = (b: BodyKey, text: string) => { const B = BODY[b]; const [x, y] = S(B.x, B.y - B.r - 10); if (x > -40 && x < W + 40 && y > -20 && y < H + 20) label(text, x, y, 'big c', 0, -10); };
    at('earth', 'Earth'); if (cam.z < 4) at('moon', 'Moon'); at('mars', 'Exploration atmosphere');
    const A = anchor();
    if (A && !camAnim) {
      const hits = flames.filter((f) => f.match === 'match' && f.visible && passes(f)).length;
      const [x, y] = S(A.x, A.y);
      const air = /air$/i.test(dest.name) ? dest.name : `${dest.name} air`;
      label(hits ? `${hits} tests in ${air}` : `No test in ${air}. That is the gap.`, x, y, hits ? 'hi c' : 'gap c', 0, dest.body === 'mars' ? -BODY.mars.r * cam.z * FZ * scale - 34 : -46);
    }
  }

  function stepCam(now: number) {
    if (!camAnim) return;
    const u = Math.min(1, (now - camAnim.t0) / camAnim.dur), e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2, f = camAnim.from, t = camAnim.to;
    cam = { x: f.x + (t.x - f.x) * e, y: f.y + (t.y - f.y) * e, z: Math.exp(Math.log(f.z) + (Math.log(t.z) - Math.log(f.z)) * e) };
    if (u >= 1) camAnim = null;
  }
  const fly = (to: typeof cam, dur: number) => { if (reduce || !dur) { cam = { ...to }; camAnim = null; return; } camAnim = { from: { ...cam }, to: { ...to }, t0: performance.now(), dur }; };
  const camFor = () => (view !== 'orbit' ? CAMS.earth! : dest.key === 'suit' ? CAMS.suit! : CAMS[dest.body ?? 'earth'] ?? CAMS.earth!);

  function updateReplay(now: number) {
    if (replayStart < 0) return;
    const u = Math.min(1, (now - replayStart) / 9000), year = replayRange[0] + u * (replayRange[1] - replayRange[0]);
    for (const f of flames) f.visible = f.when === null ? u >= 1 : f.when <= year;
    cb.onReplayYear(u >= 1 ? null : Math.floor(year));
    if (u >= 1) replayStart = -1;
  }

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    if (!onScreen || document.hidden) return;
    if (now - last < 33 && !reduce) return;
    last = now;
    const t = now / 1000, orb = view === 'orbit';
    stepCam(now); updateReplay(now);
    drawn = []; used = 0; scale = canvas.getBoundingClientRect().width / W || 1;
    bodyA += ((orb ? 1 : 0) - bodyA) * 0.2; if (reduce || Math.abs((orb ? 1 : 0) - bodyA) < 0.03) bodyA = orb ? 1 : 0;
    drawBack(orb);
    if (orb) drawFlames(t, now, false);
    if (bodyA > 0) { drawBody('earth', t * 0.05); drawBody('moon', t * 0.02 + 1); drawBody('mars', t * 0.035 + 2); }
    if (orb) drawOrbitRing(); else drawChart();
    drawFlames(t, now, true);
    if (hover >= 0) { const d = drawn.find((p) => p.f.i === hover); if (d) ring(Math.round(d.x), Math.round(d.y), 4, pal.drop); }
    ctx.putImageData(img, 0, 0);
    placeBodyLabels(orb);
    for (let i = used; i < pool.length; i++) pool[i]!.style.display = 'none';
    if (reduce) { cancelAnimationFrame(raf); raf = 0; }
  }
  const kick = () => { if (!raf && running) raf = requestAnimationFrame(frame); };

  /* ---- pointer ---- */
  const pick = (e: PointerEvent | MouseEvent) => {
    const r = canvas.getBoundingClientRect(), bx = ((e.clientX - r.left) / r.width) * W, by = ((e.clientY - r.top) / r.height) * H;
    let best: Flame | null = null, bd = 7 * 7;
    for (const d of drawn) { const dd = (d.x - bx) ** 2 + (d.y - by) ** 2; if (dd < bd && d.f.visible) { bd = dd; best = d.f; } }
    return best;
  };
  const onMove = (e: PointerEvent) => { const f = pick(e); hover = f ? f.i : -1; canvas.style.cursor = f ? 'pointer' : 'default'; cb.onHover(f ? f.row.id : null, e.clientX, e.clientY); if (reduce) kick(); };
  const onLeave = () => { hover = -1; cb.onHover(null, 0, 0); };
  const onClick = (e: MouseEvent) => { const f = pick(e); cb.onSelect(f ? f.row.id : null); };
  canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerleave', onLeave); canvas.addEventListener('click', onClick);
  const ro = new ResizeObserver(() => { resize(); kick(); }); ro.observe(canvas.parentElement!);
  const io = new IntersectionObserver((es) => { onScreen = es.some((x) => x.isIntersecting); if (onScreen) kick(); }); io.observe(canvas);
  resize(); kick();

  function retarget(instant: boolean) {
    const now = performance.now(), t = now / 1000; let n = 0;
    for (const f of flames) {
      const want: Flame['mode'] = anchor() && f.match === 'match' ? 'dest' : 'home';
      if (want === f.mode) continue;
      if (view !== 'orbit' || instant || reduce) { f.mode = want; f.from = null; continue; }
      f.from = posOf(f, t, now); f.mode = want; f.arc = 90; f.t0 = now + Math.min(1400, n++ * 40) + 300;
    }
  }

  return {
    setData(rows, classify) {
      const old = new Map(flames.map((f) => [f.row.id, f]));
      const dated = rows.map((r) => (r.date ? Number(r.date.slice(0, 4)) + (Number(r.date.slice(5, 7)) - 1) / 12 : null)).filter((v): v is number => v !== null);
      if (dated.length) replayRange = [Math.floor(Math.min(...dated)), Math.ceil(Math.max(...dated)) + 1];
      flames = rows.map((row, i) => {
        const prev = old.get(row.id);
        const when = row.date ? Number(row.date.slice(0, 4)) + (Number(row.date.slice(5, 7)) - 1) / 12 : null;
        const f: Flame = prev ?? {
          row, i, cls: classOf(row), o2: mid(row.o2Pct), kpa: mid(row.pressureKpa), when,
          ang: hash2(i, 91) * Math.PI * 2, rad: 70 + hash2(i, 92) * 36, spd: 0.05 + hash2(i, 93) * 0.05, j: hash2(i, 94),
          mode: 'home', from: null, t0: -1e9, arc: 90, launch: -1e9, cx: 0, cy: 0, match: 'none', visible: true,
        };
        f.row = row; f.match = classify(row);
        return f;
      });
      layout(); retarget(true); kick();
    },
    setDest(next, instant = false) {
      dest = next;
      if (view === 'orbit') fly(camFor(), instant ? 0 : 1800);
      retarget(instant); kick();
    },
    setView(v) {
      if (v === view) return;
      const now = performance.now(), t = now / 1000;
      for (const f of flames) f.from = posOf(f, t, now);
      view = v; layout();
      for (const f of flames) { f.arc = v === 'orbit' ? 90 : 24; f.t0 = reduce ? now - 2000 : now + hash2(f.i, 77) * 450; }
      if (reduce) bodyA = v === 'orbit' ? 1 : 0;
      fly(camFor(), v === 'orbit' ? 1400 : 800); kick();
    },
    setSelected(id) { selected = id; kick(); },
    setHighlights(ids) { highlights = new Set(ids); kick(); },
    setPhaseFilter(next) { phases = next; kick(); },
    replay() { if (reduce) return; replayStart = performance.now(); for (const f of flames) f.visible = false; kick(); },
    isReplaying: () => replayStart >= 0,
    destroy() {
      running = false; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerleave', onLeave); canvas.removeEventListener('click', onClick);
      labels.replaceChildren();
    },
  };
}
