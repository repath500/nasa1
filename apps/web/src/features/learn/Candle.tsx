import { animate, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { DitherCanvas } from '../../components/DitherCanvas';
import { flameLum } from '../../components/flame';

/** SPEC §3.14 item 1. Teardrop (1 g) to sphere (microgravity) on a toggle. Imagery only, dithered. */
export function Candle() {
  const reduce = useReducedMotion();
  const [micro, setMicro] = useState(false); const [m, setM] = useState(0); const cur = useRef(0);
  useEffect(() => {
    if (reduce) { cur.current = micro ? 1 : 0; setM(cur.current); return; }
    const c = animate(cur.current, micro ? 1 : 0, { duration: 1.2, ease: [0.2, 0, 0, 1], onUpdate: (v) => { cur.current = v; setM(v); } });
    return () => c.stop();
  }, [micro, reduce]);
  return (
    <section aria-labelledby="candle-h" className="grid items-center gap-8 md:grid-cols-[320px_1fr]">
      <div>
        <div className="border border-hairline bg-bg p-3">
          <DitherCanvas lum={(u, v, t) => flameLum(u, v, t, m)} cell={5} fgVar={m > 0.9 ? '--color-accent' : '--color-flag-text'} className="aspect-[4/5] w-full" label={micro ? 'A dim blue spherical flame' : 'A teardrop-shaped candle flame'} />
        </div>
      </div>
      <div>
        <h2 id="candle-h" className="text-3xl">Why a flame looks different in space</h2>
        <div role="radiogroup" aria-label="Gravity" className="mt-5 inline-flex border border-strong">
          {([['On Earth, 1 g', false], ['In microgravity', true]] as const).map(([label, v]) => (
            <label key={label} className={`cursor-pointer px-4 py-2 text-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--color-focus)] ${micro === v ? 'bg-accent text-accent-ink' : 'hover:bg-raised'}`}>
              <input type="radio" name="gravity" className="sr-only" checked={micro === v} onChange={() => setMicro(v)} data-testid={v ? 'gravity-micro' : 'gravity-earth'} />{label}
            </label>
          ))}
        </div>
        <p className="mt-5 max-w-[56ch] text-lg" aria-live="polite" data-testid="candle-text">
          {micro ? 'With no buoyancy, hot gas does not rise. Oxygen reaches the flame only by slow diffusion, so the flame settles into a dim blue sphere.'
            : 'On Earth, hot gas rises. That buoyancy stretches the flame into a teardrop and pulls fresh air in from below.'}
        </p>
        <p className="mt-3 text-sm text-muted">Source: the Flame in Freefall challenge text: a candle flame becomes a dim blue sphere in microgravity.</p>
      </div>
    </section>
  );
}
