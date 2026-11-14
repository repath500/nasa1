import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';
import type { Plate } from './dither/engine';
import { DitherPlate, useCell } from './Plate';

/**
 * Threshold sweep: the section sits under a page-coloured dither cover that dissolves cell by cell the first time the
 * section scrolls into view (IntersectionObserver, no scroll listener). Reason: it tells the reader a new section begins
 * and keeps the dither language alive between the big plates. Skipped entirely under reduced motion.
 */
export function Reveal({ children, className = '', as: Tag = 'section', ...rest }: { children: ReactNode; className?: string; as?: 'section' | 'div' | 'footer'; 'aria-labelledby'?: string }) {
  const reduce = useReducedMotion(); const box = useRef<HTMLDivElement>(null);
  const plate = useRef<Plate | null>(null); const seen = useRef(false);
  const [done, setDone] = useState(false); const cell = useCell(6, 5);
  const fire = () => { if (seen.current) plate.current?.set({ sweep: 1 }); };
  useEffect(() => {
    if (reduce || !box.current) return;
    const io = new IntersectionObserver((e) => { if (e[0]?.isIntersecting) { seen.current = true; io.disconnect(); fire(); } }, { threshold: 0.12 });
    io.observe(box.current);
    const failsafe = window.setTimeout(() => setDone(true), 25000); // never leave content covered if the engine stalls
    return () => { io.disconnect(); clearTimeout(failsafe); };
  }, [reduce]);
  return (
    <Tag {...rest} className={`lp-reveal ${done || reduce ? 'is-done' : ''} ${className}`}>
      <div ref={box}>{children}</div>
      {!reduce && !done && (
        <DitherPlate className="lp-cover" scene="sweep" cell={cell} matrix="bayer8" animate={false} sweepSeconds={1.1} params={{ sweep: 0, dir: 0 }}
          onReady={(p) => { plate.current = p; fire(); }} onSettle={(s) => { if (s >= 1) setDone(true); }} />
      )}
    </Tag>
  );
}
