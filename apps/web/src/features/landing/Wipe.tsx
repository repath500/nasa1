import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReducedMotion } from 'motion/react';

const WipeContext = createContext<(to: string) => void>(() => undefined);
export const useWipe = () => useContext(WipeContext);

/**
 * Access transition: pressing the main button fades the page to the background colour while a thin accent line draws
 * across, then routes. Navigation is driven by a timer, not by an animation event, so it can never stall.
 * Instant under reduced motion.
 */
const FADE_MS = 380;
export function WipeProvider({ children }: { children: ReactNode }) {
  const nav = useNavigate(); const reduce = useReducedMotion(); const [dest, setDest] = useState<string | null>(null);
  const go = useCallback((to: string) => { if (reduce) nav(to); else setDest((d) => d ?? to); }, [nav, reduce]);
  useEffect(() => {
    if (!dest) return;
    const t = window.setTimeout(() => nav(dest), FADE_MS);
    return () => window.clearTimeout(t);
  }, [dest, nav]);
  return (
    <WipeContext.Provider value={go}>
      {children}
      {dest && (
        <div className="lp-wipe" role="status" aria-live="polite" style={{ animationDuration: `${FADE_MS}ms` }}>
          <span className="sr-only">Opening the atlas</span>
          <span className="lp-wipe-line" aria-hidden style={{ animationDuration: `${FADE_MS}ms` }} />
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
