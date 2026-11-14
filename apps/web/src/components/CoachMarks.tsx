import { useEffect, useLayoutEffect, useState } from 'react';
import { Button } from './Button';
import { useUi } from '../shell/uiStore';
import { KEYS, lsGetJson, lsSetJson } from '../shell/storage';

export interface CoachStep { id: string; /** CSS selector of the element to point at. */ target: string; title: string; body: string }

/** Default atlas tour. Targets need `data-coach="habitat-box"`, `data-coach="dot"` and `data-coach="studies"` on those elements. */
export const ATLAS_COACH_STEPS: CoachStep[] = [
  { id: 'habitat', target: '[data-coach="habitat-box"]', title: 'Your habitat air', body: 'This box is the air you picked. Drag it in Custom mode to ask what if.' },
  { id: 'dot', target: '[data-coach="dot"]', title: 'Every dot is a test', body: 'Click any dot to open its source row, hash and DOI.' },
  { id: 'studies', target: '[data-coach="studies"]', title: 'Read these studies', body: 'Studies are ranked for your concern and your air. Press ? any time to see this tour again.' },
];

/** SPEC §3.2: 3 dismissible coach marks, never shown twice. Exported for the atlas. Press `?` then Tour to reopen. */
export function CoachMarks({ steps = ATLAS_COACH_STEPS, storageKey = 'atlas', autoStart = true }: { steps?: CoachStep[]; storageKey?: string; autoStart?: boolean }) {
  const reopen = useUi((s) => s.coachOpen);
  const [i, setI] = useState<number | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!autoStart) return;
    const seen = lsGetJson<Record<string, boolean>>(KEYS.coach, {});
    if (!seen[storageKey]) { const t = setTimeout(() => setI(0), 900); return () => clearTimeout(t); }
  }, [autoStart, storageKey]);
  useEffect(() => { if (reopen) { setI(0); useUi.getState().set({ coachOpen: false }); } }, [reopen]);

  const step = i !== null ? steps[i] : undefined;
  const close = () => {
    setI(null);
    const seen = lsGetJson<Record<string, boolean>>(KEYS.coach, {});
    lsSetJson(KEYS.coach, { ...seen, [storageKey]: true });
  };
  useLayoutEffect(() => {
    if (!step) return;
    const measure = () => setRect(document.querySelector(step.target)?.getBoundingClientRect() ?? null);
    measure();
    window.addEventListener('resize', measure); window.addEventListener('scroll', measure, true);
    const t = setInterval(measure, 500);
    return () => { window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true); clearInterval(t); };
  }, [step]);
  useEffect(() => {
    if (!step) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  if (!step || i === null) return null;
  const last = i === steps.length - 1;
  const W = 300;
  const style: React.CSSProperties = rect
    ? { left: Math.min(Math.max(8, rect.left), window.innerWidth - W - 8), top: Math.min(rect.bottom + 12, window.innerHeight - 190) }
    : { left: Math.max(8, (window.innerWidth - W) / 2), top: Math.max(8, window.innerHeight / 2 - 90) };
  return (
    <>
      {rect && <div aria-hidden className="pointer-events-none fixed border-2 border-accent" style={{ left: rect.left - 4, top: rect.top - 4, width: rect.width + 8, height: rect.height + 8, zIndex: 'var(--z-palette)' as unknown as number }} />}
      <div role="dialog" aria-label="Atlas tour" aria-live="polite" className="fixed border border-accent bg-raised p-4" style={{ ...style, width: W, maxWidth: 'calc(100vw - 16px)', zIndex: 'var(--z-palette)' as unknown as number }}>
        <p className="font-medium">{step.title}</p>
        <p className="mt-1 text-sm text-muted">{step.body}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="num text-xs text-muted">{i + 1} / {steps.length}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={close}>Skip</Button>
            <Button size="sm" variant="primary" autoFocus onClick={() => (last ? close() : setI(i + 1))}>{last ? 'Done' : 'Next'}</Button>
          </div>
        </div>
      </div>
    </>
  );
}
