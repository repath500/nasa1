import { useEffect, useRef, useState } from 'react';
import type { Plate, PlateOptions } from './dither/engine';

type Props = Omit<PlateOptions, 'onSettle'> & { className?: string; onReady?: (plate: Plate) => void; onSettle?: (sweep: number) => void };

/**
 * One canvas wired to the shared dither engine. The engine (and its WebGL2 context) loads lazily so it never blocks
 * first paint or the largest contentful paint, which is the crisp headline.
 */
export function DitherPlate({ className = 'lp-plate', onReady, onSettle, ...opts }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const first = useRef(opts); const cb = useRef({ onReady, onSettle }); cb.current = { onReady, onSettle };
  useEffect(() => {
    let plate: Plate | null = null; let dead = false;
    void import('./dither/engine').then((m) => {
      if (dead || !ref.current) return;
      plate = m.createPlate(ref.current, { ...first.current, onSettle: (s) => cb.current.onSettle?.(s) });
      cb.current.onReady?.(plate);
    });
    return () => { dead = true; plate?.dispose(); };
  }, []);
  return <canvas ref={ref} className={className} aria-hidden="true" />;
}

/** Cell size in CSS px: chunkier on small screens so the dither still reads. Read once, plates do not resize cells. */
export function useCell(desktop: number, mobile: number): number {
  const [v] = useState(() => (typeof matchMedia === 'function' && matchMedia('(max-width: 767px)').matches ? mobile : desktop));
  return v;
}
