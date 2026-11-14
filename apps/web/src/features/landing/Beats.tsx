import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DEFAULT_TOLERANCES, PRESETS, type FuelPhase, type ScenarioId } from '@fire/contracts';
import { useAtlas } from '../../state/store';
import { useCorpus } from '../../data/useCorpus';
import { NumberTween } from '../../components/NumberTween';
import { Skeleton } from '../../components/Skeleton';
import { countNear } from '../../shell/near';
import { formatPressure } from '../../shell/units';

const PHASES: { id: FuelPhase; label: string; color: string }[] = [
  { id: 'solid', label: 'Solid', color: 'var(--color-solid)' }, { id: 'liquid-droplet', label: 'Droplet', color: 'var(--color-droplet)' }, { id: 'gas', label: 'Gas', color: 'var(--color-gas)' },
];
const IDS: Exclude<ScenarioId, 'custom'>[] = ['earth-iss', 'lunar-cabin-example', 'exploration-upper', 'suit'];

/** Three-beat explainer as a scroll-snap rail. Every beat is a live component fed by the loaded records. */
export function Beats() {
  const state = useCorpus(); const habitat = useAtlas((s) => s.habitat); const unit = useAtlas((s) => s.unit);
  const pickId = habitat === 'custom' ? 'lunar-cabin-example' : habitat;
  const corpus = state.status === 'ready' ? state.corpus : null;
  const counts = useMemo(() => (corpus ? countNear(corpus.rows, PRESETS[pickId], DEFAULT_TOLERANCES) : null), [corpus, pickId]);
  const max = Math.max(1, ...PHASES.map((p) => counts?.byPhase[p.id] ?? 0));
  const row = corpus?.rows[0]; const card = corpus?.cards.find((c) => c.accession === row?.accession);
  const cell = 'min-w-[min(86vw,400px)] shrink-0 border border-hairline bg-surface p-5 sm:min-w-[400px]';
  return (
    <section aria-labelledby="beats-h" className="border-t border-hairline">
      <div className="mx-auto max-w-[1200px] px-4 pt-16 lg:pt-24">
        <h2 id="beats-h" className="max-w-[20ch] text-3xl md:text-4xl">Three moves from a habitat to a source.</h2>
      </div>
      <div className="scroll-snap-rail mt-8" role="region" aria-label="Three-beat explainer, scrollable" tabIndex={0}>
        <div className="mx-auto flex w-max gap-3 px-4 pb-16 lg:pb-24" style={{ paddingInline: 'max(1rem, calc((100vw - 1200px) / 2 + 1rem))' }}>
          <article className={cell} aria-labelledby="b1"><h3 id="b1" className="text-xl">Pick the air</h3>
            <p className="mt-1 text-sm text-muted">Four example atmospheres, all illustrative.</p>
            <div className="mt-4 grid gap-1" role="radiogroup" aria-label="Example habitat">
              {IDS.map((id) => <label key={id} className={`flex min-h-11 cursor-pointer items-center justify-between border px-3 text-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--color-focus)] ${pickId === id ? 'border-accent bg-raised' : 'border-hairline hover:border-strong'}`}>
                <input type="radio" name="beat-habitat" className="sr-only" checked={pickId === id} onChange={() => useAtlas.getState().set({ habitat: id })} /><span>{PRESETS[id].label}</span><span className="num text-xs text-muted">{PRESETS[id].o2Pct}% · {formatPressure(PRESETS[id].totalKpa, unit)}</span></label>)}
            </div>
          </article>
          <article className={cell} aria-labelledby="b2"><h3 id="b2" className="text-xl">See what was tested</h3>
            <p className="mt-1 text-sm text-muted">Tests near {PRESETS[pickId].label}, by fuel type.</p>
            <ul className="mt-4 space-y-3" aria-live="polite">
              {!counts && <Skeleton className="h-24" label="Counting tests" />}
              {counts && PHASES.map((p) => { const v = counts.byPhase[p.id] ?? 0; return (
                <li key={p.id}><div className="flex justify-between text-sm"><span>{p.label}</span><NumberTween value={v} className="font-semibold" /></div>
                  <div className="mt-1 h-2 bg-raised"><div className="h-2 transition-[width] duration-[var(--dur-fly)] ease-[var(--ease-out)]" style={{ width: `${(v / max) * 100}%`, background: p.color }} /></div></li>); })}
            </ul>
          </article>
          <article className={cell} aria-labelledby="b3"><h3 id="b3" className="text-xl">Open the source</h3>
            <p className="mt-1 text-sm text-muted">A real parsed row, exactly as written.</p>
            {!row && <Skeleton className="mt-4 h-28" label="Loading a row" />}
            {row && (
              <div className="mt-4 border border-hairline bg-bg p-3">
                <dl className="mono space-y-1 text-xs">
                  {Object.entries(row.raw).slice(0, 5).map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="min-w-0 truncate text-muted">{k}</dt><dd className="m-0 shrink-0">{v}</dd></div>)}
                </dl>
                <p className="mono mt-3 text-xs text-muted">{row.id} · sha256 {row.csvSha12}{row.fixture ? ' · FIXTURE' : ''}</p>
                {card && <Link className="mt-2 inline-block text-sm" to={`/study/${card.accession}`}>Open source row in {card.acronym}</Link>}
              </div>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}
