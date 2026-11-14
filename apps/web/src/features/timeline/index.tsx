import { useEffect, useRef, useState } from 'react';
import type { TestRow } from '@fire/contracts';

export default function Timeline({ rows, value, onChange }: { rows: TestRow[]; value: number | null; onChange: (year: number | null) => void }) {
  const [playing, setPlaying] = useState(false);
  const callback = useRef(onChange); callback.current = onChange;
  useEffect(() => {
    if (!playing) return;
    const start = performance.now(); let frame = 0;
    const tick = (now: number) => { const progress = Math.min(1, (now - start) / 6000); callback.current(progress === 1 ? null : 2009 + Math.floor(progress * 13)); if (progress < 1) frame = requestAnimationFrame(tick); else setPlaying(false); };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [playing]);
  const undated = rows.filter(row => !row.date).length;
  return <section aria-label="Test timeline" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}><button onClick={() => setPlaying(!playing)}>{playing ? 'Pause' : 'Play'}</button><label>Year <input type="range" min="2009" max="2022" value={value ?? 2022} onChange={event => { setPlaying(false); const year = Number(event.target.value); onChange(year === 2022 ? null : year); }} aria-valuetext={value === null ? 'All years' : String(value)} /></label><output>{value ?? 'All years'}</output><span>{undated} undated rows appear at the end</span></section>;
}
