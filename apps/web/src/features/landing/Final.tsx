import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from '@phosphor-icons/react';
import { PRESETS } from '@fire/contracts';
import { buttonClass } from '../../components/Button';
import type { Plate } from './dither/engine';
import { orbitLayout } from './dither/scenes';
import { DitherPlate, useCell } from './Plate';
import { Reveal } from './Reveal';
import { WipeLink } from './Wipe';
import { ACCESS_PATH, CREDIT } from './Hero';

const BODIES = [
  { id: 'earth-iss', name: 'Earth air' }, { id: 'lunar-cabin-example', name: 'Moon base example' }, { id: 'exploration-upper', name: 'Exploration atmosphere' },
] as const;

/** Orbit plate with crisp DOM labels. Hovering or focusing the access button drifts the test flames toward the Moon: it previews where the button goes. */
function OrbitBand() {
  const cell = useCell(4, 3); const box = useRef<HTMLDivElement>(null); const plate = useRef<Plate | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => { const el = box.current; if (!el) return; const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight })); ro.observe(el); return () => ro.disconnect(); }, []);
  useEffect(() => {
    const hint = (e: Event) => plate.current?.set({ orbitTarget: (e as CustomEvent<{ moon: boolean }>).detail.moon ? 1 : 0 });
    window.addEventListener('lp:orbit', hint); return () => window.removeEventListener('lp:orbit', hint);
  }, []);
  const lay = size.w ? orbitLayout(size.w, size.h) : null;
  return (
    <div ref={box} className="relative h-[460px] w-full overflow-hidden border-b border-hairline md:h-[440px]">
      <DitherPlate scene="orbit" cell={cell} onReady={(p) => { plate.current = p; }} />
      {lay && BODIES.map((b, i) => {
        const s = PRESETS[b.id]; const body = lay[i]!;
        return (
          <div key={b.id} className="lp-panel lp-label px-3 py-2 text-[13px] leading-5" style={{ left: Math.min(Math.max(body.x, 90), size.w - 90), top: Math.min(body.y + body.r + 12, size.h - 62) }}>
            <span className="block text-ink">{b.name}</span><span className="mono text-muted">{s.o2Pct}% O₂{b.id === 'lunar-cabin-example' ? ' or more' : ''}</span>
          </div>
        );
      })}
    </div>
  );
}

const hint = (moon: boolean) => window.dispatchEvent(new CustomEvent('lp:orbit', { detail: { moon } }));

/** Final band: the orbit, one primary action, then the footer with credit, data credit and the non-endorsement line. Text only, no agency logos. */
export function Final() {
  return (
    <>
      <Reveal aria-labelledby="final-h" className="border-t border-hairline">
        <OrbitBand />
        <div className="mx-auto flex max-w-[1280px] flex-col gap-8 px-4 py-16 md:flex-row md:items-end md:justify-between md:px-8 md:py-24">
          <div>
            <h2 id="final-h" className="max-w-[18ch] text-4xl leading-[1.05] md:text-6xl">Start at the Moon base air.</h2>
            <p className="mt-4 max-w-[46ch] text-muted">The atlas opens with the example habitat set and the question on prevention. Change either one once you are inside.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
            <span onMouseEnter={() => hint(true)} onMouseLeave={() => hint(false)} onFocus={() => hint(true)} onBlur={() => hint(false)}>
              <WipeLink to={ACCESS_PATH} data-testid="cta-enter-final" className={buttonClass('primary', 'lg', 'w-full no-underline hover:no-underline sm:w-auto')}>Enter the Atlas<ArrowRight size={18} aria-hidden /></WipeLink>
            </span>
            <Link to="/briefing" className={buttonClass('secondary', 'lg', 'no-underline hover:no-underline')}>Take the briefing</Link>
          </div>
        </div>
      </Reveal>
      <footer className="border-t border-hairline bg-surface" data-testid="landing-footer">
        <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-10 text-sm text-muted md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:px-8">
          <div className="space-y-3">
            <p className="max-w-[62ch] text-ink">{CREDIT}</p>
            <p className="max-w-[62ch]">Test data: NASA Physical Sciences Informatics archive (CC0-1.0) and NASA Technical Reports Server (NTRS). NASA does not endorse this project.</p>
            <p className="max-w-[62ch]">AI models and AI coding agents helped build it, and the voice is AI-generated.</p>
          </div>
          <nav aria-label="Landing footer" className="grid grid-cols-2 content-start gap-x-6 gap-y-2">
            <Link className="lp-link" to="/about">About</Link><Link className="lp-link" to="/credits">Credits</Link>
            <Link className="lp-link" to="/credits#si">Use of AI disclosure</Link><Link className="lp-link" to="/method">Method and limits</Link>
            <a className="lp-link" href="https://github.com/repath500/nasa1" target="_blank" rel="noopener noreferrer">Source on GitHub</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
