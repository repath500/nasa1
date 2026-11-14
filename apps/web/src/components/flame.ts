/** Luminance fields for dithered imagery (SPEC §3.14 candle demo, §9 eggs, 404 droplet). Imagery only. */
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

/** m = 0: teardrop under gravity (buoyancy lifts hot gas). m = 1: sphere (diffusion only). */
export function flameLum(u: number, v: number, t: number, m: number): number {
  const x = (u - 0.5) * 2; const y = (0.5 - v) * 2; // y up, -1..1
  const flicker = (1 - m) * (Math.sin(t * 7 + y * 5) * 0.025 + Math.sin(t * 11.3 + y * 9) * 0.012);
  const taper = 0.9 * (1 - m);
  const yy = (y + 0.15 * (1 - m) + 0.1) / (1 + 0.8 * (1 - m)); // taller teardrop
  const wide = 1 - taper * smooth(-0.4, 1.0, yy);
  const xx = (x + flicker * (yy + 1)) / Math.max(0.12, wide);
  const d = Math.hypot(xx, yy) / 0.5;
  let l = d < 1 ? Math.pow(1 - d * d, 0.8) : 0;
  l *= 0.55 + 0.45 * smooth(1, 0, d); // hotter core
  if (m >= 0.99) l *= 0.8; // the microgravity flame is dimmer
  const wick = Math.abs(x) < 0.025 && y < -0.35 && y > -0.85 ? 0.7 : 0; // candle wick
  const wax = y < -0.85 && Math.abs(x) < 0.35 ? 0.55 : 0;
  return Math.max(l, wick, wax);
}

export function dropletLum(u: number, v: number, t: number): number {
  const x = (u - 0.5) * 2; const y = (0.5 - v) * 2 + Math.sin(t * 0.6) * 0.03;
  const d = Math.hypot(x, y) / 0.7; if (d > 1) return 0;
  const z = Math.sqrt(1 - d * d);
  const light = clamp(0.25 + 0.75 * (-x * 0.4 + y * 0.5 + z * 0.75));
  const rim = smooth(0.85, 1, d) * 0.35;
  return clamp(light - rim);
}
