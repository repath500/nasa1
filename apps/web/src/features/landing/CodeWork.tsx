import { DEFAULT_TOLERANCES, PRESETS } from '@fire/contracts';
import { overlap } from '@fire/core';
import { useMemo } from 'react';
import { useCorpus } from '../../data/useCorpus';
import { Reveal } from './Reveal';
import { SdkDither } from './SdkDither';

/**
 * "Where code does the science, and why": the code that answers the challenge, as opposed to the code that draws the app.
 * Layout family: numbered ledger beside a dithered plate. Figures are computed from the loaded corpus.
 */
export function CodeWork() {
  const state = useCorpus(); const c = state.status === 'ready' ? state.corpus : null;
  const live = useMemo(() => {
    if (!c) return null;
    const lunar = PRESETS['lunar-cabin-example'];
    let inBox = 0, unknown = 0, burner = 0;
    for (const row of c.rows) {
      const cls = overlap(row, lunar, DEFAULT_TOLERANCES);
      if (cls === 'covers') inBox++; else if (cls === 'unknown') unknown++; else if (cls === 'excluded-burner') burner++;
    }
    const tables = new Set(c.rows.map((row) => row.csvSha12)).size;
    return { rows: c.rows.length, rejects: c.rejects.length, inBox, unknown, burner, tables };
  }, [c]);
  const n = (value: number | undefined) => (value === undefined ? '…' : value.toLocaleString('en-US'));

  const steps: { title: string; what: string; why: string }[] = [
    {
      title: 'Read NASA’s tables, exactly as published',
      what: `Code parses ${n(live?.tables)} experiment tables from the PSI archive into ${n(live?.rows)} test rows. It handles old file encodings, units written inside cells, approximate values like “~ 21.5”, ranges and lists, and converts mmHg, atm and psi to kPa.`,
      why: 'The challenge says the results are hard to find and harder to compare. Each table has its own columns and units, so nothing can be compared until a program reads them all the same way.',
    },
    {
      title: 'Catch values that cannot be true',
      what: `${n(live?.rejects)} cells are rejected with a reason, such as 3400% oxygen, a pressure of zero and negative air flow. They stay visible in the “Caught by code” ledger instead of being fixed by guesswork.`,
      why: 'One impossible number on a fire-safety map would undo the trust in all the others. A rule in code applies the same check to every cell, every time.',
    },
    {
      title: 'Place every test against the air people will breathe',
      what: `For each habitat, code asks whether a test’s oxygen and pressure fall inside the habitat’s window. For the Moon-base example: ${n(live?.inBox)} rows inside, ${n(live?.unknown)} that cannot be placed because a table leaves out pressure or oxygen, and ${n(live?.burner)} burner-stream rows set aside because that oxygen is not cabin air.`,
      why: 'This is the challenge’s core question: which investigations matter for spacecraft, stations and bases on the Moon and Mars. A missing value is shown as unknown, never as “not tested”, because that would be a false finding.',
    },
    {
      title: 'Rank two ways, side by side',
      what: 'A transparent rule ranks the studies (purpose, rows covering the air, evidence tier, rows nearby), with no hidden score. The AI ranking sits beside it, and code writes one plain sentence on whether they agree.',
      why: 'The challenge asks for an SI-powered ranking. Showing the plain rule next to it lets a judge see whether the AI adds anything, instead of taking it on trust.',
    },
    {
      title: 'Check every sentence the AI writes',
      what: 'Before any AI explanation is shown, code checks that every number in it came from the data, and blocks safety verdicts, approval claims and forecasts about how a material will burn. If a check fails, a sentence written by code is shown instead.',
      why: 'AI is good at language and bad at being exactly right about numbers. Fire-safety evidence needs the second, so code stands between the model and the screen.',
    },
    {
      title: 'Fingerprint the data and let people sign',
      what: 'Every table and the whole dataset carry SHA-256 fingerprints. Key claims, like the Moon-base headline, stay hidden until two of us check the source rows and sign them off with our own names.',
      why: 'Anyone can rebuild the dataset and get the same fingerprint, and no claim reaches the screen on a model’s word alone.',
    },
  ];

  return (
    <Reveal aria-labelledby="code-h" className="border-t border-hairline">
      <div className="mx-auto grid max-w-[1280px] gap-12 px-4 py-20 md:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:py-28">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <h2 id="code-h" className="text-4xl leading-[1.05] md:text-5xl">Where code does the science, and why</h2>
          <p className="mt-5 max-w-[46ch] text-muted">Apart from building the app itself, we used code to answer the challenge: to read, check, compare and rank NASA’s fire tests in a way anyone can repeat. AI helps with language. Code owns every number.</p>
          <div className="relative mt-8 hidden aspect-[4/3] overflow-hidden border border-hairline lg:block">
            <SdkDither shape="dots" matrix="8x8" speed={0.25} scale={0.9} size={3} />
            <div className="lp-panel absolute bottom-4 left-4 right-4 p-3 mono text-[13px] leading-5 text-ink">
              CSV cells → checked values → rows in the habitat box → two rankings → checked sentences
            </div>
          </div>
        </div>
        <ol className="grid gap-px border border-hairline bg-hairline" aria-label="Where code does the work">
          {steps.map((step, index) => (
            <li key={step.title} className="bg-bg p-5 md:p-7">
              <div className="flex items-baseline gap-4">
                <span className="mono text-sm text-accent" aria-hidden>{String(index + 1).padStart(2, '0')}</span>
                <h3 className="text-xl leading-snug md:text-2xl">{step.title}</h3>
              </div>
              <p className="mt-3 max-w-[64ch] text-ink/90">{step.what}</p>
              <p className="mt-3 max-w-[64ch] text-sm text-muted"><span className="mono text-[12px] uppercase tracking-wider text-muted">Why </span>{step.why}</p>
            </li>
          ))}
        </ol>
      </div>
    </Reveal>
  );
}
