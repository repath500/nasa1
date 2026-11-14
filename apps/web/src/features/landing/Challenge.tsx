import { PRESETS, type ScenarioId } from '@fire/contracts';
import { formatPressure } from '../../shell/units';
import { DitherPlate, useCell } from './Plate';
import { Reveal } from './Reveal';

const ATMOSPHERES: { id: Exclude<ScenarioId, 'custom' | 'suit'>; name: string; note: string }[] = [
  { id: 'earth-iss', name: 'Earth air', note: 'The reference. Sea-level air.' },
  { id: 'lunar-cabin-example', name: 'Moon base example', note: 'The challenge expects "30% or greater" O₂ at "10.2 psi or less". We draw one example box inside that range.' },
  { id: 'exploration-upper', name: 'Exploration atmosphere', note: 'A NASA reference value (NTRS 20180004258).' },
];
const BASE: Record<string, string> = { 'earth-iss': '', 'lunar-cabin-example': 'or more', 'exploration-upper': '' };

/** Layout family: sticky split with a pull quote, then a paired-plate comparison, then ruled compartments and a quiet note. */
export function Challenge() {
  const cell = useCell(4, 3);
  return (
    <Reveal aria-labelledby="challenge-h" className="border-t border-hairline">
      <div className="mx-auto grid max-w-[1280px] gap-12 px-4 py-20 md:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20 lg:py-28">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <h2 id="challenge-h" className="text-4xl leading-[1.05] md:text-5xl">The challenge: Flame in Freefall</h2>
          <p className="mt-5 max-w-[42ch] text-muted">NASA Space Apps 2026 asks teams to make decades of microgravity combustion results easier to find, compare and understand.</p>
        </div>
        <figure className="m-0 border-l-2 border-accent pl-6 md:pl-8">
          <blockquote className="lp-quote m-0">
            Create an interactive, super intelligence (SI) powered dashboard that <mark>summarizes, ranks, and interprets</mark> those findings to deliver fire safety insights for human space exploration.
          </blockquote>
          <figcaption className="mt-4 text-sm text-muted">From the official challenge text, Flame in Freefall: SI-Powered Fire Safety Insights from Microgravity Combustion Data.</figcaption>
        </figure>
      </div>

      <div className="border-t border-hairline">
        <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-16 md:px-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16 lg:py-24">
          <div className="order-2 grid grid-cols-2 gap-px border border-hairline bg-hairline lg:order-1">
            {([['1 g', 0, 'Hot gas rises. A flickering teardrop.'], ['Microgravity', 1, 'No buoyancy. A ghostly blue sphere.']] as const).map(([label, morph, cap]) => (
              <figure key={label} className="m-0 bg-bg">
                <div className="relative aspect-[4/5] w-full overflow-hidden">
                  <DitherPlate scene="flame" cell={cell} params={{ morph, cx: 0.5, cy: 0.5, scale: 0.8 }} />
                </div>
                <figcaption className="border-t border-hairline p-3 text-[13px] leading-5"><span className="mono block text-ink">{label}</span><span className="text-muted">{cap}</span></figcaption>
              </figure>
            ))}
          </div>
          <div className="order-1 flex flex-col justify-center lg:order-2">
            <h3 className="text-2xl md:text-3xl">Why a flame in orbit looks different</h3>
            <p className="mt-4 max-w-[48ch] text-muted">On Earth, a flame heats the air around it and that hot gas rises, pulling in fresh air from below. In free fall nothing rises. Oxygen reaches the flame only by diffusion, so it grows into a slow, round, dim blue ball.</p>
            <p className="mt-4 max-w-[48ch] text-muted">Where a material burns, how fast, and when it goes out all change with that. So results from Earth cannot simply be carried over to a spacecraft.</p>
          </div>
        </div>
      </div>

      <div className="border-t border-hairline">
        <div className="mx-auto max-w-[1280px] px-4 py-16 md:px-8 lg:py-24">
          <h3 className="max-w-[28ch] text-2xl md:text-3xl">Why now: the air on the Moon is not Earth air</h3>
          <p className="mt-4 max-w-[60ch] text-muted">Suits run at low pressure, so planned Moon bases and pressurized rovers are expected to use more oxygen and less pressure than Earth. More oxygen makes materials burn more readily.</p>
          <dl className="mt-10 grid gap-px border border-hairline bg-hairline md:grid-cols-3">
            {ATMOSPHERES.map((a) => {
              const s = PRESETS[a.id];
              return (
                <div key={a.id} className="bg-surface p-5 md:p-6">
                  <dt className="lp-tick">{a.name}</dt>
                  <dd className="m-0 mt-4"><span className="lp-big-num text-[2.6rem] md:text-[3.2rem]">{s.o2Pct}%</span><span className="ml-2 text-sm text-muted">O₂{BASE[a.id] ? ` ${BASE[a.id]}` : ''}</span></dd>
                  <dd className="m-0 mt-2 mono text-sm text-ink">{a.id === 'lunar-cabin-example' ? 'at 10.2 psi or less' : `at ${formatPressure(s.totalKpa, 'psi')}`}</dd>
                  <dd className="m-0 mt-4 text-[13px] leading-5 text-muted">{a.note}</dd>
                </div>
              );
            })}
          </dl>
          <aside aria-labelledby="remember-h" className="mt-12 max-w-[72ch] border-l-2 border-strong pl-5">
            <h4 id="remember-h" className="text-base">What is at stake</h4>
            <p className="mt-2 text-[15px] leading-6 text-muted">In 1967 a fire in an oxygen-filled spacecraft during a pre-launch test killed the Apollo 1 crew. In 1970 an oxygen tank explosion endangered the Apollo 13 crew on the way to the Moon, and they returned. In 1997 a multinational crew survived a fire aboard the Mir space station that began with an oxygen generator failure. We remember them, and we read the evidence with care.</p>
          </aside>
        </div>
      </div>
    </Reveal>
  );
}
