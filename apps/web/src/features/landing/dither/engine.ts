import { cssRgb } from '../../../design/dither';
import { FRAG, VERT } from './shader';
import { BAYER4, BAYER8, flamePixel, orbitLayout, orbitPixel, type Body, type Palette, type SceneState } from './scenes';

/**
 * Small ordered-dither engine for the landing page (own code, no dependency).
 * Evaluated libraries (npm, Nov 2026): canvas-dither, floyd-steinberg, ditherdance, @weasel-js/dither, image-to-pixel. They dither
 * existing bitmaps on the CPU; none renders procedural scenes per frame, none keeps a fixed matrix origin, and the newest are days old.
 *
 * One hidden WebGL2 context renders every plate at cell resolution (one fragment = one dither cell) and blits it, scaled
 * with nearest-neighbour, into each plate's own 2D canvas. One rAF loop serves all plates. Plates only draw while on screen,
 * the loop stops when nothing is visible or the tab is hidden, and under prefers-reduced-motion each plate paints a static frame.
 */
export type SceneName = 'flame' | 'orbit' | 'sweep';
export type MatrixName = 'bayer4' | 'bayer8' | 'blue';
export interface Params { morph: number; fade: number; cx: number; cy: number; scale: number; orbitTarget: 0 | 1 | 2; sweep: number; dir: 0 | 1 }
export interface PlateOptions {
  scene: SceneName; cell?: number; matrix?: MatrixName; animate?: boolean; staticT?: number; params?: Partial<Params>;
  /** Seconds a full sweep takes (sweep scene only). */
  sweepSeconds?: number;
  /** Called each time a sweep plate has come to rest, with the sweep value it rests at. */
  onSettle?: (sweep: number) => void;
}
export interface Plate {
  set(p: Partial<Params>, instant?: boolean): void;
  /** Body positions as fractions of the plate (x right, y down), for placing crisp DOM labels. */
  layout(): { x: number; y: number; r: number }[];
  dispose(): void;
}

const DEFAULTS: Params = { morph: 0, fade: 1, cx: 0.5, cy: 0.5, scale: 1, orbitTarget: 0, sweep: 1, dir: 0 };
const MATRIX_ID: Record<MatrixName, number> = { bayer4: 0, bayer8: 1, blue: 2 };
const reduceQuery = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
const T0 = typeof performance !== 'undefined' ? performance.now() : 0;

interface Internal {
  canvas: HTMLCanvasElement; opts: Required<Omit<PlateOptions, 'params' | 'onSettle'>>; onSettle?: (sweep: number) => void; cur: Params; tgt: Params;
  orbit: { x: number; y: number; r: number }; visible: boolean; dirty: boolean; cols: number; rows: number; dpr: number; lastDraw: number;
}
const plates = new Set<Internal>();
let raf = 0; let lastNow = 0; let palette: Palette | null = null;

function readPalette(): Palette {
  return {
    bg: cssRgb('--dither-bg', [11, 13, 16]), c1: cssRgb('--color-droplet', [110, 193, 245]), c2: cssRgb('--color-solid', [255, 148, 71]),
    c3: cssRgb('--color-gas', [86, 211, 193]), ink: cssRgb('--color-ink', [232, 234, 237]),
  };
}

/* ---------- WebGL2 backend ---------- */
interface GL { gl: WebGL2RenderingContext; canvas: HTMLCanvasElement; u: Record<string, WebGLUniformLocation | null>; w: number; h: number; blue: WebGLTexture | null }
let glState: GL | null | undefined;

/** Mitchell best-candidate sampling gives a 32x32 blue-noise-like rank texture without shipping an asset. */
function blueNoise(n = 32): Uint8Array {
  const total = n * n; const rank = new Uint8Array(total); const pts: number[] = []; let seed = 1337;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const dist2 = (a: number, b: number) => { let dx = Math.abs((a % n) - (b % n)), dy = Math.abs(Math.floor(a / n) - Math.floor(b / n)); dx = Math.min(dx, n - dx); dy = Math.min(dy, n - dy); return dx * dx + dy * dy; };
  const used = new Uint8Array(total);
  for (let i = 0; i < total; i++) {
    let best = -1; let bestD = -1;
    const k = i === 0 ? 1 : 8;
    for (let c = 0; c < k; c++) {
      let cand = Math.floor(rnd() * total); let guard = 0;
      while (used[cand] && guard++ < 64) cand = (cand + 1) % total;
      if (used[cand]) continue;
      let d = Infinity; for (const p of pts) d = Math.min(d, dist2(cand, p));
      if (d > bestD) { bestD = d; best = cand; }
    }
    if (best < 0) best = used.indexOf(0);
    used[best] = 1; pts.push(best); rank[best] = Math.floor((i / total) * 255);
  }
  return rank;
}

function initGL(): GL | null {
  try {
    const canvas = document.createElement('canvas'); canvas.width = 16; canvas.height = 16;
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: true, premultipliedAlpha: true, depth: false, stencil: false, powerPreference: 'low-power' });
    if (!gl) return null;
    const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader'); return s; };
    const prog = gl.createProgram()!; gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u: GL['u'] = {};
    for (const n of ['uCells', 'uT', 'uScene', 'uMatrix', 'uBlue', 'uBg', 'uC1', 'uC2', 'uC3', 'uInk', 'uMorph', 'uFade', 'uCenter', 'uScale', 'uBody0', 'uBody1', 'uBody2', 'uOrbit', 'uSweep', 'uDir']) u[n] = gl.getUniformLocation(prog, n);
    const tex = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, 32, 32, 0, gl.RED, gl.UNSIGNED_BYTE, blueNoise());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.uniform1i(u.uBlue!, 0);
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); glState = null; markAllDirty(); });
    return { gl, canvas, u, w: 16, h: 16, blue: tex };
  } catch { return null; }
}

function state(p: Internal): SceneState {
  const b = orbitLayout(p.cols, p.rows);
  return { morph: p.cur.morph, fade: p.cur.fade, cx: p.cur.cx, cy: p.cur.cy, scale: p.cur.scale, bodies: b, orbit: p.orbit };
}

function renderGL(g: GL, p: Internal, t: number, pal: Palette): boolean {
  const { gl, u } = g; const { cols, rows } = p;
  if (g.canvas.width < cols || g.canvas.height < rows) { g.canvas.width = Math.max(g.canvas.width, cols); g.canvas.height = Math.max(g.canvas.height, rows); g.w = g.canvas.width; g.h = g.canvas.height; }
  gl.viewport(0, 0, cols, rows);
  const st = state(p);
  gl.uniform2f(u.uCells!, cols, rows); gl.uniform1f(u.uT!, t); gl.uniform1i(u.uScene!, p.opts.scene === 'flame' ? 0 : p.opts.scene === 'orbit' ? 1 : 2); gl.uniform1f(u.uSweep!, p.cur.sweep); gl.uniform1i(u.uDir!, p.tgt.dir); gl.uniform1i(u.uMatrix!, MATRIX_ID[p.opts.matrix]);
  gl.uniform3fv(u.uBg!, pal.bg.map((v) => v / 255)); gl.uniform3fv(u.uC1!, pal.c1.map((v) => v / 255)); gl.uniform3fv(u.uC2!, pal.c2.map((v) => v / 255));
  gl.uniform3fv(u.uC3!, pal.c3.map((v) => v / 255)); gl.uniform3fv(u.uInk!, pal.ink.map((v) => v / 255));
  gl.uniform1f(u.uMorph!, st.morph); gl.uniform1f(u.uFade!, st.fade); gl.uniform2f(u.uCenter!, st.cx, 1 - st.cy); gl.uniform1f(u.uScale!, st.scale);
  st.bodies.forEach((b, i) => gl.uniform4f(u[`uBody${i}`]!, b.x, rows - b.y, b.r, 0));
  gl.uniform3f(u.uOrbit!, st.orbit.x, rows - st.orbit.y, st.orbit.r);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  const ctx = p.canvas.getContext('2d'); if (!ctx) return false;
  ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, p.canvas.width, p.canvas.height);
  const cell = p.opts.cell * p.dpr;
  ctx.drawImage(g.canvas, 0, g.h - rows, cols, rows, 0, 0, cols * cell, rows * cell);
  return true;
}

/* ---------- Canvas 2D fallback (coarser cells, same scenes) ---------- */
let scratch: HTMLCanvasElement | null = null;
function renderCPU(p: Internal, t: number, pal: Palette) {
  const ctx = p.canvas.getContext('2d'); if (!ctx) return;
  const f = 2; const cols = Math.ceil(p.cols / f), rows = Math.ceil(p.rows / f);
  scratch ??= document.createElement('canvas'); scratch.width = cols; scratch.height = rows;
  const sctx = scratch.getContext('2d')!; const img = sctx.createImageData(cols, rows);
  const st = { ...state(p) }; // the layout is in full cells; shrink to the coarse grid
  const sc = (b: Body): Body => ({ x: b.x / f, y: b.y / f, r: b.r / f });
  const small: SceneState = { ...st, bodies: st.bodies.map(sc) as SceneState['bodies'], orbit: { x: st.orbit.x / f, y: st.orbit.y / f, r: st.orbit.r / f } };
  const m4 = p.opts.matrix !== 'bayer8';
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const yUp = rows - 1 - y;
    if (p.opts.scene === 'sweep') {
      const ramp = p.tgt.dir === 0 ? y / rows : x / cols; const lvl = p.cur.sweep * 1.5 - ramp * 0.5;
      const th2 = m4 ? (BAYER4[(y & 3) * 4 + (x & 3)]! + 0.5) / 16 : (BAYER8[(y & 7) * 8 + (x & 7)]! + 0.5) / 64;
      const i2 = (y * cols + x) * 4; const col = lvl > th2 ? pal.c1 : pal.bg;
      img.data[i2] = col[0]; img.data[i2 + 1] = col[1]; img.data[i2 + 2] = col[2]; img.data[i2 + 3] = lvl > th2 + 0.07 ? 0 : 255;
      continue;
    }
    const px = p.opts.scene === 'flame' ? flamePixel(x, yUp, cols, rows, t, { ...small, cy: 1 - st.cy }, pal) : orbitPixel(x, rows - y, t, { ...small, bodies: small.bodies.map((b) => ({ ...b, y: rows - b.y })) as SceneState['bodies'], orbit: { ...small.orbit, y: rows - small.orbit.y } }, pal);
    const th = m4 ? (BAYER4[(y & 3) * 4 + (x & 3)]! + 0.5) / 16 : (BAYER8[(y & 7) * 8 + (x & 7)]! + 0.5) / 64;
    const c = px[3] * st.fade > th ? px : [...pal.bg, 1];
    const i = (y * cols + x) * 4; img.data[i] = c[0]!; img.data[i + 1] = c[1]!; img.data[i + 2] = c[2]!; img.data[i + 3] = 255;
  }
  sctx.putImageData(img, 0, 0); ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, p.canvas.width, p.canvas.height);
  ctx.drawImage(scratch, 0, 0, cols, rows, 0, 0, cols * f * p.opts.cell * p.dpr, rows * f * p.opts.cell * p.dpr);
}

/* ---------- Loop ---------- */
const reduced = () => !!reduceQuery?.matches;
function markAllDirty() { plates.forEach((p) => { p.dirty = true; }); schedule(); }

function size(p: Internal) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = p.canvas.clientWidth, h = p.canvas.clientHeight; if (!w || !h) return false;
  const cw = Math.round(w * dpr), ch = Math.round(h * dpr);
  if (p.canvas.width !== cw || p.canvas.height !== ch) { p.canvas.width = cw; p.canvas.height = ch; }
  p.dpr = dpr; p.cols = Math.ceil(w / p.opts.cell); p.rows = Math.ceil(h / p.opts.cell);
  return true;
}

function ease(p: Internal, dt: number, instant: boolean) {
  const k = instant ? 1 : 1 - Math.exp(-dt * 5);
  for (const key of ['morph', 'fade', 'cx', 'cy', 'scale'] as const) p.cur[key] += (p.tgt[key] - p.cur[key]) * k;
  // The sweep moves linearly so its duration is predictable.
  const step = instant ? 1 : dt / p.opts.sweepSeconds; const dS = p.tgt.sweep - p.cur.sweep;
  p.cur.sweep = Math.abs(dS) <= step ? p.tgt.sweep : p.cur.sweep + Math.sign(dS) * step;
  const b = orbitLayout(p.cols, p.rows)[p.tgt.orbitTarget]; const kk = instant ? 1 : 1 - Math.exp(-dt * 3.2);
  const rTarget = b.r * 1.38;
  if (!p.orbit.r) { p.orbit = { x: b.x, y: b.y, r: rTarget }; }
  p.orbit.x += (b.x - p.orbit.x) * kk; p.orbit.y += (b.y - p.orbit.y) * kk; p.orbit.r += (rTarget - p.orbit.r) * kk;
}

function settled(p: Internal) { return (['morph', 'fade', 'cx', 'cy', 'scale', 'sweep'] as const).every((k) => Math.abs(p.tgt[k] - p.cur[k]) < 0.002); }

function draw(p: Internal, now: number, dt: number) {
  if (!size(p)) return;
  const animated = p.opts.animate && !reduced();
  ease(p, dt, !animated && !(p.opts.scene === 'sweep' && !reduced()));
  palette ??= readPalette();
  const t = animated ? (now - T0) / 1000 : p.opts.staticT;
  glState ??= initGL();
  const ok = glState ? renderGL(glState, p, t, palette) : false;
  if (!ok) renderCPU(p, t, palette);
  p.dirty = !animated && !settled(p);
  if (p.opts.scene === 'sweep' && settled(p)) p.onSettle?.(p.cur.sweep);
}

function frame(now: number) {
  raf = 0;
  const dt = Math.min(0.1, (now - lastNow) / 1000 || 0.016); lastNow = now;
  let any = false;
  plates.forEach((p) => {
    if (!p.visible) return;
    const animated = p.opts.animate && !reduced();
    if (animated) {
      // Fallback path is heavier, so it renders at about 20 fps.
      if (!glState && glState !== undefined && now - p.lastDraw < 48) { any = true; return; }
      p.lastDraw = now; draw(p, now, dt); any = true;
    } else if (p.dirty) { draw(p, now, dt); any = any || p.dirty; }
    // Sweep plates are not "animated" but are mid-flight while the ramp has not arrived.
    else if (!settled(p)) { p.dirty = true; any = true; }
  });
  if (any) raf = requestAnimationFrame(frame);
}
function schedule() { if (!raf && typeof document !== 'undefined' && !document.hidden) { lastNow = performance.now(); raf = requestAnimationFrame(frame); } }

let globals = 0; let themeObserver: MutationObserver | null = null;
function attachGlobals() {
  if (globals++) return;
  document.addEventListener('visibilitychange', onVis);
  reduceQuery?.addEventListener('change', markAllDirty);
  themeObserver = new MutationObserver(() => { palette = null; markAllDirty(); });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}
function detachGlobals() {
  if (--globals) return;
  document.removeEventListener('visibilitychange', onVis); reduceQuery?.removeEventListener('change', markAllDirty); themeObserver?.disconnect();
  if (raf) cancelAnimationFrame(raf); raf = 0;
}
function onVis() { if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = 0; } else markAllDirty(); }

export function createPlate(canvas: HTMLCanvasElement, options: PlateOptions): Plate {
  const params = { ...DEFAULTS, ...options.params };
  const p: Internal = {
    canvas, opts: { scene: options.scene, cell: options.cell ?? 3, matrix: options.matrix ?? 'bayer4', animate: options.animate ?? true, staticT: options.staticT ?? 2.4, sweepSeconds: options.sweepSeconds ?? 0.9 },
    onSettle: options.onSettle,
    cur: { ...params }, tgt: { ...params }, orbit: { x: 0, y: 0, r: 0 }, visible: false, dirty: true, cols: 0, rows: 0, dpr: 1, lastDraw: 0,
  };
  plates.add(p); attachGlobals();
  const io = new IntersectionObserver((e) => { p.visible = e[e.length - 1]?.isIntersecting ?? false; if (p.visible) { p.dirty = true; schedule(); } }, { rootMargin: '80px' });
  io.observe(canvas);
  const ro = new ResizeObserver(() => { p.dirty = true; if (p.visible) schedule(); }); ro.observe(canvas);
  return {
    set(next, instant) { Object.assign(p.tgt, next); if (instant) Object.assign(p.cur, next); p.dirty = true; if (p.visible) schedule(); },
    layout() { return orbitLayout(p.cols || 1, p.rows || 1).map((b) => ({ x: b.x / (p.cols || 1), y: b.y / (p.rows || 1), r: b.r / (p.rows || 1) })); },
    dispose() { io.disconnect(); ro.disconnect(); plates.delete(p); detachGlobals(); },
  };
}
