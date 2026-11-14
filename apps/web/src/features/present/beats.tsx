import type { ReactNode } from 'react';

export interface Beat { id: string; title: string; kind: 'slide' | 'app'; tab?: 'studies' | 'ledger'; render: (ctx: BeatCtx) => ReactNode }
export interface BeatCtx { nearMoon: number | null; solidMax: number | null; rows: number | null; cards: number | null; rejects: number | null }

const Big = ({ children }: { children: ReactNode }) => <h2 className="max-w-[20ch] text-[clamp(2.5rem,6vw,5.5rem)] font-semibold leading-[1.02] tracking-[-0.035em]">{children}</h2>;
const Lead = ({ children }: { children: ReactNode }) => <p className="mt-6 max-w-[34ch] text-[clamp(1.1rem,2vw,1.6rem)] text-muted">{children}</p>;

/** SPEC §3.13: the seven beats, mirroring the deck. Beats 3 to 5 drive the real workspace; the others are type. */
export const BEATS: Beat[] = [
  { id: 'title', title: 'Title', kind: 'slide', render: () => (<><Big>Where will astronauts breathe, and has NASA tested fire there?</Big><Lead>Fire Atlas maps test conditions from NASA microgravity fire experiments against the air of future habitats.</Lead><p className="mono mt-10 text-sm text-muted">NASA Space Apps 2026 · Flame in Freefall</p></>) },
  { id: 'problem', title: 'The problem', kind: 'slide', render: () => (<><Big>Fire behaves differently when nothing falls.</Big>
    <Lead>The challenge text names air that is richer in oxygen and lower in pressure than Earth: 30% O₂ at 10.2 psi, and 100% O₂ at 4.3 psi in a suit.</Lead>
    <p className="mt-4 max-w-[40ch] text-[clamp(1rem,1.6vw,1.3rem)]">Researchers need to know what has been tested near that air, and what has not.</p></>) },
  { id: 'gap', title: 'Gap Map reveal', kind: 'app', render: (c) => (<>
    <h2 className="text-[clamp(1.6rem,3vw,2.6rem)] font-semibold leading-tight">The Moon base example box.</h2>
    <p className="mt-3 text-[clamp(1rem,1.6vw,1.3rem)]" aria-live="polite">{c.nearMoon === null ? 'Counting tests.' : `${c.nearMoon} ${c.nearMoon === 1 ? 'test sits' : 'tests sit'} in the box.`}{c.solidMax === null ? '' : ` No solid-fuel row in this set reports O₂ above ${c.solidMax}%. That is an absence of rows, not a limit.`}</p></>) },
  { id: 'rankers', title: 'Two rankers', kind: 'app', tab: 'studies', render: () => (<>
    <h2 className="text-[clamp(1.6rem,3vw,2.6rem)] font-semibold leading-tight">Two ways to rank what to read next.</h2>
    <p className="mt-3 text-[clamp(1rem,1.6vw,1.3rem)]">A code baseline and a model judgement, side by side. The agreement strip says plainly where they match and where they differ.</p></>) },
  { id: 'evidence', title: 'Evidence and Caught by code', kind: 'app', tab: 'ledger', render: (c) => (<>
    <h2 className="text-[clamp(1.6rem,3vw,2.6rem)] font-semibold leading-tight">Every dot opens its source.</h2>
    <p className="mt-3 text-[clamp(1rem,1.6vw,1.3rem)]">Raw row, hash and DOI. Code also rejects cells that cannot be true, like 3400% oxygen{c.rejects !== null ? `, ${c.rejects} in this data set` : ''}, and lists each one in the ledger.</p></>) },
  { id: 'ai', title: 'How the AI is used and tested', kind: 'slide', render: () => (<><Big>Code decides every number. Models read the words.</Big>
    <div className="compartments mt-10 max-w-[1000px] md:grid-cols-3">
      {[['Code', 'Parses tables, counts rows, writes sentences. No model touches the number path.'], ['Models', 'Read questions, judge relevance, polish narration. Always labelled SI, never a verdict.'], ['Checks', 'A number guard and a claim linter run on all AI text. Humans approve the science.']].map(([t, d]) => (
        <div key={t} className="p-5"><h3 className="text-xl">{t}</h3><p className="mt-2 text-muted">{d}</p></div>))}
    </div><p className="mt-6 text-sm text-muted">The voice is AI-generated (ElevenLabs) and disclosed on screen and in audio.</p></>) },
  { id: 'limits', title: 'Limits and team', kind: 'slide', render: () => (<><Big>What this does not claim.</Big>
    <ul className="mt-8 max-w-[44ch] space-y-3 text-[clamp(1.05rem,1.8vw,1.4rem)]">
      <li>No partial-gravity result is in PSI.</li><li>Burner-stream oxygen is shown hollow and never counted.</li><li>Unknown is not none.</li><li>Presets are illustrative examples, not design values.</li>
    </ul><p className="mt-8 max-w-[50ch] text-sm text-muted">NASA does not endorse this project. Test data: NASA Physical Sciences Informatics, CC0-1.0. The team and its contribution statement are on the About page.</p></>) },
];
