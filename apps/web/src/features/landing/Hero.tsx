import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from '@phosphor-icons/react';
import { useReducedMotion } from 'motion/react';
import { buttonClass } from '../../components/Button';
import type { Plate } from './dither/engine';
import { DitherPlate, useCell } from './Plate';
import { WipeLink } from './Wipe';

export const ACCESS_PATH = '/atlas?h=lunar-cabin-example&q=prevention';
export const CHALLENGE_URL = 'https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/';
export const CREDIT = 'An experimental app for NASA Space Apps x HackAthlone hackathon 2026, by Jay\u00a0Popat & Repath\u00a0Khan';
/** Who built it. Affiliations are for identification only; this is a personal hackathon project, not endorsed by any employer. */
export const TEAM = [
  { name: 'Jay\u00a0Popat', now: 'currently at Fidelity\u00a0Investments' },
  { name: 'Repath\u00a0Khan', now: 'currently at Leemer\u00a0Group' },
] as const;
export const TEAM_NOTE = 'Affiliations are for identification only. This is a personal hackathon project, not endorsed by our employers.';

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
    p.set(narrow ? { cx: 0.5, cy: 300 / Math.max(el.clientHeight, 1), scale: 0.62 } : { cx: 0.74, cy: 0.54, scale: 0.72 }, true);
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
      <div className="relative z-10 flex h-full flex-col justify-between gap-6 px-4 py-6 max-md:gap-[280px] md:px-14 md:py-12">
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
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <WipeLink to={ACCESS_PATH} data-testid="cta-enter"
              className="inline-flex min-h-[64px] w-full items-center justify-center gap-3 bg-accent px-9 text-xl font-semibold text-accent-ink no-underline transition-transform duration-150 hover:no-underline active:scale-[0.98] sm:w-auto md:min-h-[72px] md:px-12">
              Enter the Atlas<ArrowRight size={24} weight="bold" aria-hidden />
            </WipeLink>
            <Link to="/briefing" data-testid="cta-briefing" className={buttonClass('secondary', 'lg', 'no-underline hover:no-underline')}>Take the briefing</Link>
          </div>
          <a href={CHALLENGE_URL} target="_blank" rel="noopener noreferrer" data-testid="view-challenge" className="lp-link mt-4 inline-flex items-center gap-1 text-[15px]">View the challenge on Space Apps<ArrowUpRight size={14} aria-hidden /></a>
          <div className="mt-5 max-w-[64ch] border-t border-hairline pt-4 text-[13px] leading-5 text-muted">
            <p>An experimental app for NASA Space Apps x HackAthlone hackathon 2026, by {TEAM[0].name} ({TEAM[0].now}) and {TEAM[1].name} ({TEAM[1].now}).</p>
          </div>
        </div>
      </div>
    </section>
  );
}
