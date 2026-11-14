/** 4x4 Bayer ordered dither. SPEC §6.2: imagery only, never numbers, axes, text or data marks. */
export const BAYER4 = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
] as const;

export function bayerThreshold(x: number, y: number): number {
  return ((BAYER4[((y & 3) << 2) | (x & 3)] ?? 0) + 0.5) / 16;
}

/** Read a CSS colour token to [r,g,b]. Falls back when the document has no such variable. */
export function cssRgb(name: string, fallback: [number, number, number]): [number, number, number] {
  if (typeof document === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const m = /^#([0-9a-f]{6})$/i.exec(v);
  if (!m) return fallback;
  const n = parseInt(m[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Paint a 1-bit duotone from a luminance function (0..1) onto a canvas.
 * `cell` is the pixel size of one dither cell, so low resolution fields scale up crisply.
 */
export function paintDither(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cell: number,
  lum: (x: number, y: number) => number,
  fg: [number, number, number],
  bg: [number, number, number],
) {
  const cols = Math.ceil(w / cell);
  const rows = Math.ceil(h / cell);
  const img = ctx.createImageData(cols, rows);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const on = lum(x / cols, y / rows) > bayerThreshold(x, y);
      const i = (y * cols + x) * 4;
      const c = on ? fg : bg;
      img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 255;
    }
  }
  const off = document.createElement('canvas');
  off.width = cols; off.height = rows;
  off.getContext('2d')!.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, 0, 0, cols * cell, rows * cell);
}
