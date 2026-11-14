import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReducedMotion } from 'motion/react';
import { DitherPlate } from './Plate';

const WipeContext = createContext<(to: string) => void>(() => undefined);
export const useWipe = () => useContext(WipeContext);

/**
 * Access transition: pressing the main button sweeps a dither across the whole screen, then routes.
 * Reason: it makes "entering" the atlas a visible event and hides the route change. Instant under reduced motion.
 */
export function WipeProvider({ children }: { children: ReactNode }) {
  const nav = useNavigate(); const reduce = useReducedMotion(); const [dest, setDest] = useState<string | null>(null);
  const go = useCallback((to: string) => { if (reduce) nav(to); else setDest((d) => d ?? to); }, [nav, reduce]);
  return (
    <WipeContext.Provider value={go}>
      {children}
      {dest && (
        <div className="fixed inset-0 z-[100]" role="status" aria-live="polite">
          <span className="sr-only">Opening the atlas</span>
          <DitherPlate className="lp-plate" scene="sweep" cell={6} matrix="bayer8" animate={false} sweepSeconds={0.7} params={{ sweep: 1, dir: 1 }}
            onReady={(p) => p.set({ sweep: 0 })} onSettle={(s) => { if (s <= 0) nav(dest); }} />
        </div>
      )}
    </WipeContext.Provider>
  );
}

/** Anchor that keeps normal link behaviour (new tab, copy link) and plays the wipe on a plain click. */
export function WipeLink({ to, className, children, ...rest }: { to: string; className?: string; children: ReactNode } & Record<string, unknown>) {
  const go = useWipe();
  return (
    <a href={to} className={className} {...rest} onClick={(e) => { if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; e.preventDefault(); go(to); }}>{children}</a>
  );
}
