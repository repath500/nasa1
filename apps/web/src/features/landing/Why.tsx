import { useMemo } from 'react';
import { DEFAULT_TOLERANCES, PRESETS } from '@fire/contracts';
import { overlap } from '@fire/core';
import { useCorpus } from '../../data/useCorpus';
import { NumberTween } from '../../components/NumberTween';
import { Skeleton } from '../../components/Skeleton';
import { Chip } from '../../components/Chip';
import { Reveal } from './Reveal';

/** Layout family: big-number compartments. Every figure is computed from the loaded corpus and never typed in. */
export function Why() {
  const state = useCorpus(); const c = state.status === 'ready' ? state.corpus : null;
  const inBox = useMemo(() => (c ? c.rows.filter((r) => overlap(r, PRESETS['lunar-cabin-example'], DEFAULT_TOLERANCES) === 'covers').length : null), [c]);
  const stats: [string, number | undefined, string][] = [
    ['test rows parsed', c?.rows.length, 'Each row is one test condition read from a NASA PSI table.'],
    ['investigations', c?.cards.length, 'Experiments such as FLEX, BASS and SAME, each with its own source.'],
    ['cells rejected by code', c?.rejects.length, 'Values that cannot be true, kept out of the map with a reason.'],
    ['rows inside the Moon base box', inBox ?? undefined, 'Tests within 3 points of O₂ and 15% of pressure of the example air.'],
  ];
  return (
    <Reveal aria-labelledby="why-h" className="border-t border-hairline bg-surface">
      <div className="mx-auto max-w-[1280px] px-4 py-20 md:px-8 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:gap-20">
          <h2 id="why-h" className="text-4xl leading-[1.05] md:text-5xl">NASA has the data. It is hard to find, compare and read.</h2>
          <div className="space-y-4 text-muted lg:pt-3">
            <p className="max-w-[52ch]">The Physical Sciences Informatics archive holds test results from years of fire experiments on the space station, spread across many tables with different columns and units.</p>
            <p className="max-w-[52ch]">We built Fire Atlas to show what has been tested near a habitat's air, what has not, and where to read first. Every dot opens its source row, with the file hash and DOI beside it.</p>
          </div>
        </div>
        <dl className="mt-14 grid grid-cols-2 gap-px border border-hairline bg-hairline lg:grid-cols-4" aria-label="Live from the loaded corpus">
          {stats.map(([label, value, note]) => (
            <div key={label} className="flex min-h-[210px] flex-col bg-bg p-4 md:p-6">
              {/* dt must come first inside dl > div; CSS order keeps the number on top visually. */}
              <dt className="order-2 mt-auto mono text-[13px] text-ink">{label}</dt>
              <dd className="order-1 m-0">{value === undefined ? <Skeleton className="h-12 w-24" /> : <span className="lp-big-num"><NumberTween value={value} duration={0.9} format={(n) => Math.round(n).toLocaleString("en-US")} /></span>}</dd>
              <dd className="order-3 m-0 mt-2 text-[13px] leading-5 text-muted">{note}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 flex flex-wrap items-center gap-3 text-[13px] text-muted">Counted in your browser from the corpus file, when the page loads. {c?.fixture && <Chip tone="flag">FIXTURE</Chip>}</p>
      </div>
    </Reveal>
  );
}
