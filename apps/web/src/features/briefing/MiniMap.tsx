import { lazy, Suspense } from 'react';
import { useAtlas } from '../../state/store';
import { useCorpus } from '../../data/useCorpus';
import { Skeleton } from '../../components/Skeleton';
import { NumberTween } from '../../components/NumberTween';
import { InlineError } from '../../components/InlineError';
import type { NearCounts } from '../../shell/near';

const GapMap = lazy(() => import('../gapmap'));

/** Compact Gap Map preview with the habitat box and a live count (SPEC §3.2). */
export function MiniMap({ counts, className = '', filterPhase }: { counts: NearCounts; className?: string; filterPhase?: boolean }) {
  const state = useCorpus();
  const s = useAtlas();
  const scenario = s.scenario();
  return (
    <figure className={`m-0 ${className}`}>
      <div className="relative aspect-[4/3] w-full border border-hairline bg-surface" data-testid="mini-map">
        {state.status === 'loading' && <Skeleton className="absolute inset-0" label="Loading map preview" />}
        {state.status === 'error' && <div className="p-3"><InlineError message="The map preview could not load the records." stillWorks="You can still pick your air and continue." onRetry={() => window.location.reload()} /></div>}
        {state.status === 'ready' && (
          <Suspense fallback={<Skeleton className="absolute inset-0" label="Loading map preview" />}>
            <GapMap compact className="absolute inset-0" rows={state.corpus.rows} scenario={scenario} tolerances={s.tolerances} selectedRowId={null} unit={s.unit} phaseFilter={filterPhase && s.fuelFilter.length ? s.fuelFilter : undefined} />
          </Suspense>
        )}
      </div>
      <figcaption className="mt-2 flex items-baseline gap-2" aria-live="polite">
        <NumberTween value={counts.covers} className="text-3xl font-semibold" />
        <span className="text-sm text-muted">{counts.covers === 1 ? 'test nearby' : 'tests nearby'}</span>
      </figcaption>
    </figure>
  );
}
