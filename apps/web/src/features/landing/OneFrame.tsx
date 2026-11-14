import { lazy, Suspense, useMemo } from 'react';
import { DEFAULT_TOLERANCES, PRESETS } from '@fire/contracts';
import { useAtlas } from '../../state/store';
import { useCorpus } from '../../data/useCorpus';
import { Skeleton } from '../../components/Skeleton';
import { NumberTween } from '../../components/NumberTween';
import { countNear, maxO2 } from '../../shell/near';
import { formatPressure } from '../../shell/units';

const GapMap = lazy(() => import('../gapmap'));

/** One frame: a real, live compact Gap Map with the lunar example box, not a screenshot. */
export function OneFrame() {
  const state = useCorpus(); const unit = useAtlas((s) => s.unit);
  const lunar = PRESETS['lunar-cabin-example'];
  const corpus = state.status === 'ready' ? state.corpus : null;
  const counts = useMemo(() => (corpus ? countNear(corpus.rows, lunar, DEFAULT_TOLERANCES) : null), [corpus, lunar]);
  const solid = useMemo(() => (corpus ? maxO2(corpus.rows, 'solid') : null), [corpus]);
  return (
    <section aria-labelledby="frame-h" className="border-t border-hairline">
      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-16 lg:grid-cols-[1.6fr_1fr] lg:py-24">
        <div className="relative aspect-[16/10] w-full border border-hairline bg-surface">
          {!corpus && <Skeleton className="absolute inset-0" label="Loading the example map" />}
          {corpus && <Suspense fallback={<Skeleton className="absolute inset-0" label="Loading the example map" />}>
            <GapMap compact className="absolute inset-0" rows={corpus.rows} scenario={lunar} tolerances={DEFAULT_TOLERANCES} selectedRowId={null} unit={unit} />
          </Suspense>}
        </div>
        <div className="flex flex-col justify-center">
          <h2 id="frame-h" className="text-3xl md:text-4xl">One frame shows the whole idea.</h2>
          <ol className="mt-6 space-y-5">
            <li className="grid grid-cols-[2rem_1fr] gap-3"><span className="mono text-accent">1</span><p>The box is the air: <span className="num">{lunar.o2Pct}% O₂</span> at <span className="num">{formatPressure(lunar.totalKpa, unit)}</span>, the Moon base example.</p></li>
            <li className="grid grid-cols-[2rem_1fr] gap-3"><span className="mono text-accent">2</span><p>Each dot is one parsed test row. <span aria-live="polite">{counts ? <><NumberTween value={counts.covers} className="font-semibold" /> {counts.covers === 1 ? 'test sits' : 'tests sit'} in the box.</> : 'Counting.'}</span></p></li>
            <li className="grid grid-cols-[2rem_1fr] gap-3"><span className="mono text-accent">3</span><p>{solid === null ? 'Empty space is information too: the atlas shows what no row reports.' : <>No solid-fuel row in this set reports O₂ above <span className="num">{solid}%</span>. That is an absence of rows, not a limit.</>}</p></li>
          </ol>
        </div>
      </div>
    </section>
  );
}
