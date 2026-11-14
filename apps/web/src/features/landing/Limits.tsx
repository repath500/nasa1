import { useCorpus } from '../../data/useCorpus';
import { Reveal } from './Reveal';

/** Layout family: typographic stack of ruled statements. Plain limits, said first and said loudly. */
export function Limits() {
  const state = useCorpus(); const c = state.status === 'ready' ? state.corpus : null;
  const rows: [string, string, string][] = [
    ['L1', 'Partial-gravity combustion data: none in PSI.', 'Every row is a microgravity test on the space station. Nothing here says what happens at lunar gravity.'],
    ['L2', 'A literature-screening tool, not safety guidance.', 'Use it to decide what to read first. Decisions about fire safety belong to the engineers and standards that own them.'],
    ['L3', 'A curated subset of NASA PSI, not every test.', c ? `${c.rows.length} rows from ${c.cards.length} investigations are loaded. A blank area on the map means no row in this set, not that no test was ever run.` : 'A blank area on the map means no row in this set, not that no test was ever run.'],
  ];
  return (
    <Reveal aria-labelledby="limits-h" className="border-t border-hairline bg-surface">
      <div className="mx-auto max-w-[1280px] px-4 py-20 md:px-8 lg:py-28">
        <h2 id="limits-h" className="text-4xl leading-[1.05] md:text-5xl">What it does not do</h2>
        <ul className="mt-12 border-t border-strong">
          {rows.map(([k, line, note]) => (
            <li key={k} className="grid gap-4 border-b border-hairline py-8 md:grid-cols-[4rem_minmax(0,7fr)_minmax(0,5fr)] md:gap-8 md:py-10">
              <span className="mono text-sm text-accent">{k}</span>
              <p className="lp-limit-line">{line}</p>
              <p className="max-w-[44ch] text-[15px] leading-6 text-muted md:pt-2">{note}</p>
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}
