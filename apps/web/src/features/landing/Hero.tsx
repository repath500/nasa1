import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from '@phosphor-icons/react';
import { useReducedMotion } from 'motion/react';
import { buttonClass } from '../../components/Button';
import type { Plate } from './dither/engine';
import { DitherPlate, useCell } from './Plate';
import { WipeLink } from './Wipe';

export const ACCESS_PATH = '/atlas?h=lunar-cabin-example&q=prevention';
export const CREDIT = 'An experimental app for NASA Space Apps x HackAthlone hackathon 2026, by Jay Popat & Repath Khan';

const CAPTION = {
  g1: 'In 1 g, hot gas rises. Buoyancy stretches the flame into a flickering teardrop.',
  micro: 'In microgravity there is no buoyancy. Oxygen arrives by diffusion and the flame becomes a sphere.',
};

/**
 * Full-bleed hero. The flame plate breathes and morphs from the 1 g teardrop to the microgravity sphere:
 * on load (story), when the toggle is pressed (control), and as the hero scrolls away (the IntersectionObserver ratio drives the uniform).
 */
export function Hero() {
  const reduce = useReducedMotion(); const cell = useCell(4, 3);
  const root = useRef<HTMLElement>(null); const plate = useRef<Plate | null>(null);
  const ratio = useRef(1); const base = useRef<0 | 1>(0); const touched = useRef(false);
  const [mode, setMode] = useState<'g1' | 'micro'>(reduce ? 'micro' : 'g1');

  const apply = () => {
    const p = plate.current; if (!p) return;
    p.set({ morph: Math.max(base.current, 1 - ratio.current), fade: Math.min(1, 0.2 + ratio.current * 1.3) });
  };
  const place = () => {
    const p = plate.current; const el = root.current; if (!p || !el) return;
    const narrow = el.clientWidth < 900;
    p.set(narrow ? { cx: 0.5, cy: 0.27, scale: 0.6 } : { cx: 0.74, cy: 0.54, scale: 0.72 }, true);
  };
  const choose = (m: 'g1' | 'micro') => { touched.current = true; setMode(m); };

  useEffect(() => { base.current = mode === 'micro' ? 1 : 0; apply(); }, [mode]);
  useEffect(() => {
    if (reduce || touched.current) return;
    const t = window.setTimeout(() => { if (!touched.current) setMode('micro'); }, 1800);
    return () => clearTimeout(t);
  }, [reduce]);
  useEffect(() => {
    const el = root.current; if (!el) return;
    const io = new IntersectionObserver((e) => { ratio.current = e[e.length - 1]?.intersectionRatio ?? 1; apply(); }, { threshold: Array.from({ length: 21 }, (_, i) => i / 20) });
    io.observe(el);
    const ro = new ResizeObserver(place); ro.observe(el);
    return () => { io.disconnect(); ro.disconnect(); };
  }, []);

  return (
    <section ref={root} aria-labelledby="hero-h" className="lp-hero">
      <DitherPlate scene="flame" cell={cell} matrix="bayer4" params={{ morph: reduce ? 1 : 0, cx: 0.74, cy: 0.54, scale: 0.72 }}
        onReady={(p) => { plate.current = p; place(); apply(); }} />
      <div className="relative z-10 flex h-full flex-col justify-between gap-6 px-4 py-6 md:px-14 md:py-12">
        <div className="lp-panel p-3 md:max-w-[400px] md:self-end md:p-4">
          <div role="group" aria-label="Flame gravity" className="lp-seg">
            <button type="button" aria-pressed={mode === 'g1'} onClick={() => choose('g1')}>1 g</button>
            <button type="button" aria-pressed={mode === 'micro'} onClick={() => choose('micro')}>Microgravity</button>
          </div>
          <p className="mt-3 text-[13px] leading-5 text-muted" aria-live="polite">{mode === 'g1' ? CAPTION.g1 : CAPTION.micro}</p>
        </div>
        <div className="lp-panel p-5 md:max-w-[780px] md:p-8">
          <h1 id="hero-h" className="lp-h1">Where will astronauts breathe, and has NASA tested fire there?</h1>
          <p className="mt-4 max-w-[52ch] text-base text-muted md:text-lg">NASA microgravity fire tests, mapped against the air of future Moon bases. Every dot opens its source row.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <WipeLink to={ACCESS_PATH} data-testid="cta-enter" className={buttonClass('primary', 'lg', 'no-underline hover:no-underline')}>Enter the Atlas<ArrowRight size={18} aria-hidden /></WipeLink>
            <Link to="/briefing" data-testid="cta-briefing" className={buttonClass('secondary', 'lg', 'no-underline hover:no-underline')}>Take the briefing</Link>
          </div>
          <p className="mt-5 max-w-[60ch] border-t border-hairline pt-4 text-[13px] leading-5 text-muted">{CREDIT}</p>
        </div>
      </div>
    </section>
  );
}
