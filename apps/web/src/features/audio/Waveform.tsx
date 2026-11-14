import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { bayerThreshold, cssRgb } from '../../design/dither';

/** Peaks from decoded audio when possible, else deterministic pseudo-peaks seeded by the script hash. */
export function usePeaks(audioUrl: string | null, seed: string, bins = 160): number[] {
  const [peaks, setPeaks] = useState<number[]>(() => seeded(seed, bins));
  useEffect(() => {
    setPeaks(seeded(seed, bins));
    if (!audioUrl) return;
    let live = true;
    (async () => {
      try {
        const buf = await (await fetch(audioUrl)).arrayBuffer();
        const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctx(); const audio = await ctx.decodeAudioData(buf); void ctx.close();
        const ch = audio.getChannelData(0); const step = Math.floor(ch.length / bins) || 1;
        const out: number[] = [];
        for (let i = 0; i < bins; i++) { let m = 0; for (let j = 0; j < step; j += 64) m = Math.max(m, Math.abs(ch[i * step + j] ?? 0)); out.push(m); }
        const mx = Math.max(...out, 0.001);
        if (live) setPeaks(out.map((v) => Math.pow(v / mx, 0.7)));
      } catch { /* keep seeded peaks */ }
    })();
    return () => { live = false; };
  }, [audioUrl, seed, bins]);
  return peaks;
}
function seeded(seed: string, n: number): number[] {
  let h = 2166136261; for (const c of seed) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  const out: number[] = []; let x = h >>> 0;
  for (let i = 0; i < n; i++) { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; const base = 0.25 + 0.55 * Math.abs(Math.sin(i / 7 + (h % 9))); out.push(Math.min(1, base * (0.6 + (x / 4294967296) * 0.7))); }
  return out;
}

/** Dithered 1-bit bar waveform (SPEC §4.3). Imagery only: it is decoration over a real slider. */
export function Waveform({ peaks, progress, className = '' }: { peaks: number[]; progress: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = c.getContext('2d'); if (!ctx) return;
    const draw = () => {
      const w = c.clientWidth; const h = c.clientHeight; if (!w || !h) return;
      c.width = w; c.height = h;
      const done = cssRgb('--color-accent', [124, 196, 242]); const rest = cssRgb('--color-border-strong', [107, 116, 128]);
      const cell = 2; const barW = Math.max(2, Math.floor(w / peaks.length)); const rows = Math.floor(h / cell); const mid = rows / 2;
      for (let i = 0; i < peaks.length; i++) {
        const x = i * barW; if (x + barW > w) break;
        const col = (i + 0.5) / peaks.length <= progress ? done : rest;
        ctx.fillStyle = `rgb(${col[0]} ${col[1]} ${col[2]})`;
        const amp = peaks[i]! * mid;
        for (let r = 0; r < rows; r++) { const d = Math.abs(r + 0.5 - mid); if (d < amp - 1 || (d < amp && bayerThreshold(i, r) < 0.5)) ctx.fillRect(x, r * cell, barW - 1, cell); }
      }
    };
    draw();
    const ro = new ResizeObserver(draw); ro.observe(c);
    const mo = new MutationObserver(draw); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => { ro.disconnect(); mo.disconnect(); };
  }, [peaks, progress, reduce]);
  return <canvas ref={ref} aria-hidden className={`dither-img block h-full w-full ${className}`} />;
}
