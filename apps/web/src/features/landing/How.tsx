import { lazy, Suspense } from 'react';
import { DEFAULT_TOLERANCES, PRESETS } from '@fire/contracts';
import { useCorpus } from '../../data/useCorpus';
import { useAtlas } from '../../state/store';
import { Skeleton } from '../../components/Skeleton';
import { Chip } from '../../components/Chip';
import { formatPressure } from '../../shell/units';
import { Reveal } from './Reveal';

const GapMap = lazy(() => import('../gapmap'));

const LEDGER = [
  { chip: <Chip>CODE</Chip>, title: 'Code measures', body: 'Code parses every table row, rejects cells that cannot be true, and decides which tests sit near a habitat. No model touches a number.' },
  { chip: <Chip tone="accent" pill>SI · labelled</Chip>, title: 'AI judges and explains, and says so', body: 'Jev orders investigations by relevance. Gemini Hydrogen turns questions into filters and writes explanations that must pass a number check. An ElevenLabs voice reads the briefing aloud. Each carries its model name.' },
  { chip: <Chip tone="ok">REVIEWED</Chip>, title: 'People sign off key claims', body: 'A claim shows a reviewer name only after a person has accepted it. Until then it stays marked as proposed.' },
];

/** Layout family: ledger beside a live component. The map is the real Gap Map, not a picture of it. */
export function How() {
  const state = useCorpus(); const unit = useAtlas((s) => s.unit); const corpus = state.status === 'ready' ? state.corpus : null;
  const lunar = PRESETS['lunar-cabin-example'];
  return (
    <Reveal aria-labelledby="how-h" className="border-t border-hairline">
      <div className="mx-auto grid max-w-[1280px] gap-12 px-4 py-20 md:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:py-28">
        <div>
          <h2 id="how-h" className="text-4xl leading-[1.05] md:text-5xl">How it works, honestly</h2>
          <ol className="mt-10 divide-y divide-hairline border-y border-hairline">
            {LEDGER.map((l, i) => (
              <li key={l.title} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 py-6">
                <span className="mono text-sm text-accent">{String(i + 1).padStart(2, '0')}</span>
                <div><div className="flex flex-wrap items-center gap-3"><h3 className="text-lg">{l.title}</h3>{l.chip}</div><p className="mt-2 max-w-[52ch] text-[15px] leading-6 text-muted">{l.body}</p></div>
              </li>
            ))}
          </ol>
        </div>
        <figure className="m-0 lg:self-center">
          <div className="relative aspect-[16/11] w-full border border-hairline bg-surface md:aspect-[16/10]">
            {!corpus && <Skeleton className="absolute inset-0" label="Loading the live map" />}
            {corpus && <Suspense fallback={<Skeleton className="absolute inset-0" label="Loading the live map" />}>
              <GapMap compact className="absolute inset-0" rows={corpus.rows} scenario={lunar} tolerances={DEFAULT_TOLERANCES} selectedRowId={null} unit={unit} />
            </Suspense>}
          </div>
          <figcaption className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted"><Chip>CODE</Chip><span>Live Gap Map. The box is the Moon base example: <span className="num text-ink">{lunar.o2Pct}% O₂</span> at <span className="num text-ink">{formatPressure(lunar.totalKpa, unit)}</span>. Each mark is a test row.</span></figcaption>
        </figure>
      </div>
    </Reveal>
  );
}
