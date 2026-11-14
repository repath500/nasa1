import { useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { cssRgb, paintDither } from '../design/dither';

/**
 * Procedural 1-bit duotone plate (SPEC §6.2: imagery only). `lum(u, v, t)` returns 0..1, with u,v in 0..1 and t in seconds.
 * Animates with rAF only while on screen and only when motion is allowed; otherwise paints one static frame.
 */
export function DitherCanvas({ lum, cell = 4, animate = true, className = '', label, staticT = 0, fgVar = '--dither-fg' }: {
  lum: (u: number, v: number, t: number) => number; cell?: number; animate?: boolean; className?: string; label?: string; staticT?: number;
  /** CSS variable for the 1-bit foreground, for example --color-accent. */
  fgVar?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const lumRef = useRef(lum);
  lumRef.current = lum;

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let raf = 0; let visible = true; let t0 = performance.now();
    const draw = (now: number) => {
      const w = canvas.clientWidth; const h = canvas.clientHeight;
      if (!w || !h) return;
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      const fg = cssRgb(fgVar, [232, 234, 237]); const bg = cssRgb('--dither-bg', [11, 13, 16]);
      const t = animate && !reduce ? (now - t0) / 1000 : staticT;
      paintDither(ctx, w, h, cell, (u, v) => lumRef.current(u, v, t), fg, bg);
    };
    const loop = (now: number) => { if (visible) draw(now); raf = requestAnimationFrame(loop); };
    draw(performance.now());
    const ro = new ResizeObserver(() => draw(performance.now())); ro.observe(canvas);
    const mo = new MutationObserver(() => draw(performance.now())); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const io = new IntersectionObserver((e) => { visible = e[0]?.isIntersecting ?? true; }); io.observe(canvas);
    if (animate && !reduce) raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); mo.disconnect(); io.disconnect(); };
  }, [animate, reduce, cell, staticT, fgVar]);

  return <canvas ref={ref} className={`dither-img block ${className}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} />;
}
