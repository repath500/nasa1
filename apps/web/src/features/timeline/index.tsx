import { useEffect, useRef, useState } from 'react';
import type { TestRow } from '@fire/contracts';

export default function Timeline({ rows, value, onChange }: { rows: TestRow[]; value: number | null; onChange: (year: number | null) => void }) {
  const [playing, setPlaying] = useState(false);
  const callback = useRef(onChange); callback.current = onChange;
  useEffect(() => {
    if (!playing) return;
    const start = performance.now(); let frame = 0;
    const tick = (now: number) => { const progress = Math.min(1, (now - start) / 6000); callback.current(progress === 1 ? null : 2009 + Math.floor(progress * 13)); if (progress < 1) frame = requestAnimationFrame(tick); else { setPlaying(false); window.dispatchEvent(new CustomEvent('fa:timeline-end')); } };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [playing]);
  const undated = rows.filter(row => !row.date).length;
  return <section aria-label="Test timeline" className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-1.5 text-xs">
    <button type="button" onClick={() => setPlaying(!playing)} className="min-h-7 min-w-14 rounded-[2px] border border-strong px-3 hover:border-accent">{playing ? 'Pause' : 'Play'}</button>
    <label className="flex items-center gap-2"><span className="label-mono">Year</span><input type="range" min="2009" max="2022" value={value ?? 2022} className="w-40 accent-[var(--color-accent)] sm:w-64" onChange={event => { setPlaying(false); const year = Number(event.target.value); onChange(year === 2022 ? null : year); }} aria-valuetext={value === null ? 'All years' : String(value)} /></label>
    <output className="num min-w-16 text-ink">{value ?? 'All years'}</output>
    <span className="text-muted">{undated} undated rows appear at the end</span>
  </section>;
}
