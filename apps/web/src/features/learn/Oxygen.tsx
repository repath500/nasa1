import * as Slider from '@radix-ui/react-slider';
import { useMemo, useState } from 'react';
import type { FuelPhase, TestRow } from '@fire/contracts';
import { useCorpus } from '../../data/useCorpus';
import { NumberTween } from '../../components/NumberTween';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/Button';
import { Skeleton } from '../../components/Skeleton';
import { formatPressure } from '../../shell/units';
import { useAtlas } from '../../state/store';

const PH: { id: FuelPhase; label: string; color: string }[] = [
  { id: 'solid', label: 'Solid', color: 'var(--color-solid)' }, { id: 'liquid-droplet', label: 'Droplet', color: 'var(--color-droplet)' }, { id: 'gas', label: 'Gas', color: 'var(--color-gas)' },
];
const mid = (r: TestRow) => r.o2Pct.min !== null && r.o2Pct.max !== null ? (r.o2Pct.min + r.o2Pct.max) / 2 : r.o2Pct.min ?? r.o2Pct.max;

/** SPEC §3.14 item 2. Which PSI rows exist at the chosen O2. A lookup in the data, not a prediction. */
export function Oxygen() {
  const state = useCorpus(); const unit = useAtlas((s) => s.unit);
  const [o2, setO2] = useState(21); const [nearest, setNearest] = useState(false);
  const corpus = state.status === 'ready' ? state.corpus : null;
  const { hits, near } = useMemo(() => {
    const amb = (corpus?.rows ?? []).filter((r) => r.o2Location === 'ambient' && mid(r) !== null);
    const hits = amb.filter((r) => { const lo = r.o2Pct.min ?? mid(r)!; const hi = r.o2Pct.max ?? mid(r)!; return lo <= o2 + 1 && hi >= o2 - 1; });
    const near = [...amb].sort((a, b) => Math.abs(mid(a)! - o2) - Math.abs(mid(b)! - o2)).slice(0, 3);
    return { hits, near };
  }, [corpus, o2]);
  const byPhase = (p: FuelPhase) => hits.filter((r) => r.fuel.phase === p).length;
  return (
    <section aria-labelledby="o2-h" className="border-t border-hairline pt-12">
      <h2 id="o2-h" className="text-3xl">Why more oxygen matters</h2>
      <p className="mt-2 max-w-[60ch] text-muted">Slide to an oxygen level and see which NASA test rows were run near it, within 1 point. This is a lookup in the data, not a prediction.</p>
      <div className="mt-6 grid gap-8 md:grid-cols-[1fr_1fr]">
        <div>
          <label className="flex items-baseline justify-between"><span className="text-sm text-muted">Oxygen, percent by volume</span><span className="num text-4xl font-semibold" data-testid="o2-value"><NumberTween value={o2} format={(n) => `${Math.round(n)}%`} /></span></label>
          <Slider.Root className="relative mt-3 flex h-8 touch-none select-none items-center" min={10} max={100} step={1} value={[o2]} onValueChange={(v) => setO2(v[0] ?? 21)} aria-label="Oxygen percent">
            <Slider.Track className="relative h-[3px] grow bg-hairline"><Slider.Range className="absolute h-full bg-accent" /></Slider.Track>
            <Slider.Thumb className="block size-6 border-2 border-accent bg-bg" aria-label="Oxygen percent" data-testid="o2-slider" />
          </Slider.Root>
          <div className="num mt-1 flex justify-between text-xs text-muted"><span>10%</span><span>21% Earth air</span><span>100%</span></div>
        </div>
        <div aria-live="polite" data-testid="o2-result">
          {!corpus && <Skeleton className="h-32" label="Loading rows" />}
          {corpus && hits.length > 0 && (
            <>
              <p className="text-lg"><NumberTween value={hits.length} className="font-semibold" /> {hits.length === 1 ? 'test row reports' : 'test rows report'} O₂ near {o2}%.</p>
              <ul className="mt-3 flex flex-wrap gap-5">{PH.map((p) => <li key={p.id} className="flex items-baseline gap-2"><span aria-hidden className="size-2.5" style={{ background: p.color }} /><NumberTween value={byPhase(p.id)} className="text-xl font-semibold" /><span className="text-sm text-muted">{p.label}</span></li>)}</ul>
              <ul className="mono mt-3 space-y-1 text-xs text-muted">{hits.slice(0, 4).map((r) => <li key={r.id}>{r.id} · {r.fuel.name ?? 'fuel not named'} · {r.pressureKpa.min === null ? 'pressure not reported' : formatPressure(r.pressureKpa.min, unit)}</li>)}</ul>
            </>
          )}
          {corpus && hits.length === 0 && (
            <EmptyState title={`No PSI test row in this set reports ambient O₂ near ${o2}%.`} action={<Button variant="quiet" onClick={() => setNearest(!nearest)}>{nearest ? 'Hide nearest rows' : 'Show nearest rows'}</Button>}>
              That is the gap: an absence of rows, not a limit. {nearest && <span className="mono mt-2 block text-xs">{near.map((r) => `${r.id} at ${mid(r)}%`).join(' · ')}</span>}
            </EmptyState>
          )}
        </div>
      </div>
    </section>
  );
}
