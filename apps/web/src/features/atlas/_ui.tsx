/**
 * Minimal local UI kit for W5 (SPEC section 6.5 badges, 3.18 system states). W1 ships Button, Chip and Drawer
 * in components/; swap these for those later. Names are local on purpose so nothing collides.
 */
import { useCallback, useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowClockwise, Check, Copy, X } from '@phosphor-icons/react';
import type { Pillar } from '@fire/contracts';
import { DIRECTNESS_NAMES, PILLAR_LABEL, copyText } from './format';
import { FIXTURE_LABEL } from '../studies/fixtures';
import './atlas.css';

export function Root({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`fa ${className}`}>{children}</div>;
}

/* ---------- provenance badges: identical everywhere ---------- */
export type BadgeKind = 'code' | 'si' | 'reviewed' | 'fixture' | 'proposed';
export function Badge({ kind, modelId, name, hover, label }: { kind: BadgeKind; modelId?: string; name?: string; hover?: string; label?: string }) {
  const text =
    label ??
    (kind === 'code' ? 'CODE'
      : kind === 'si' ? `SI · ${modelId ?? 'model'}`
      : kind === 'reviewed' ? (name ? `REVIEWED · ${name}` : 'REVIEWED')
      : kind === 'proposed' ? 'PROPOSED'
      : 'FIXTURE');
  const card =
    hover ??
    (kind === 'code' ? 'Computed by deterministic code from parsed rows. No model is involved.'
      : kind === 'fixture' ? FIXTURE_LABEL
      : kind === 'proposed' ? 'Proposed default. A human has not signed this yet.'
      : undefined);
  return (
    <span className={`fa-badge fa-badge--${kind}`} tabIndex={card ? 0 : undefined} aria-label={card ? `${text}. ${card}` : text}>
      {text}
      {card && <span className="fa-badge__card" role="tooltip">{card}</span>}
    </span>
  );
}

export function FixtureNote() {
  return <span className="fa-flag fa-mono" style={{ fontSize: 11 }}>{FIXTURE_LABEL}</span>;
}

/* ---------- buttons ---------- */
export function Btn({ variant = 'default', icon, children, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'primary' | 'quiet'; icon?: ReactNode }) {
  const v = variant === 'primary' ? ' fa-btn--primary' : variant === 'quiet' ? ' fa-btn--quiet' : '';
  return (
    <button type="button" className={`fa-btn${v} ${className}`} {...rest}>
      {icon}
      {children}
    </button>
  );
}

export function IconBtn({ label, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button type="button" className="fa-btn fa-btn--quiet fa-btn--icon" aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}

/** Copy button with a visible "Copied" state (a toast is the shell's job, this works without one). */
export function CopyBtn({ text, label, copiedLabel = 'Copied', variant = 'default' }: { text: string | (() => string); label: string; copiedLabel?: string; variant?: 'default' | 'quiet' }) {
  const [done, setDone] = useState(false);
  const t = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(t.current), []);
  return (
    <>
      <Btn
        variant={variant === 'quiet' ? 'quiet' : 'default'}
        icon={done ? <Check size={14} /> : <Copy size={14} />}
        onClick={async () => {
          const ok = await copyText(typeof text === 'function' ? text() : text);
          if (ok) {
            setDone(true);
            window.clearTimeout(t.current);
            t.current = window.setTimeout(() => setDone(false), 1600);
          }
        }}
      >
        {done ? copiedLabel : label}
      </Btn>
      <span className="fa-sr" role="status" aria-live="polite">{done ? copiedLabel : ''}</span>
    </>
  );
}

/* ---------- pillar chip and ordinal glyph ---------- */
export function PillarChip({ pillar }: { pillar: Pillar | null | undefined }) {
  if (!pillar) return <span className="fa-muted fa-mono">not available</span>;
  return <span className={`fa-pillar fa-pillar--${pillar}`}>{PILLAR_LABEL[pillar]}</span>;
}

/** Four cell ordinal glyph, filled cells = level + 1 (UI_SPEC 2.5). Never the only cue: the label carries the level. */
export function Glyph({ level }: { level: number | null }) {
  if (level == null) return <span className="fa-muted fa-mono">not available</span>;
  const name = DIRECTNESS_NAMES[level] ?? '';
  return (
    <span className="fa-glyph" role="img" aria-label={`Evidence directness (Jev) level ${level} of 0 to 3: ${name}. Rubric level, not probability.`} title={`Level ${level}: ${name}`}>
      {[0, 1, 2, 3].map((i) => <i key={i} data-on={i <= level} />)}
    </span>
  );
}

/* ---------- system states (SPEC 3.18) ---------- */
export function Skeleton({ rows = 4, height = 36, label = 'Loading' }: { rows?: number; height?: number; label?: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} style={{ display: 'grid', gap: 1 }}>
      {Array.from({ length: rows }, (_, i) => <div key={i} className="fa-skel" style={{ height }} />)}
      <span className="fa-sr">{label}</span>
    </div>
  );
}

export function EmptyState({ title, children, actions }: { title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="fa-state" role="status">
      <h3>{title}</h3>
      {children && <p className="fa-muted">{children}</p>}
      {actions && <div className="fa-state__row">{actions}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Something did not load', message, onRetry, stillWorks, actionLabel = 'Retry' }: { title?: string; message: string; onRetry?: () => void; stillWorks?: string; actionLabel?: string }) {
  return (
    <div className="fa-state fa-state--error" role="alert">
      <h3>{title}</h3>
      <p>{message}</p>
      {stillWorks && <p className="fa-muted">What still works: {stillWorks}</p>}
      {onRetry && <div className="fa-state__row"><Btn icon={<ArrowClockwise size={14} />} onClick={onRetry}>{actionLabel}</Btn></div>}
    </div>
  );
}

export function Banner({ tone = 'neutral', children, action }: { tone?: 'neutral' | 'flag' | 'accent'; children: ReactNode; action?: ReactNode }) {
  return (
    <div className={`fa-banner${tone === 'flag' ? ' fa-banner--flag' : tone === 'accent' ? ' fa-banner--accent' : ''}`} role="status">
      <div style={{ flex: 1 }}>{children}</div>
      {action}
    </div>
  );
}

/** One label per intent: "Open source row". */
export const LABEL_OPEN_ROW = 'Open source row';

/* ---------- modal sheet (Radix Dialog + Motion) ---------- */
export function Sheet({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const reduce = useReducedMotion();
  const d = reduce ? 0 : 0.2;
  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div className="fa-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: d }} />
            </Dialog.Overlay>
            <Dialog.Content asChild aria-describedby={undefined}>
              <motion.div className="fa fa-sheet" initial={{ x: reduce ? 0 : 40, opacity: reduce ? 1 : 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: reduce ? 0 : 40, opacity: reduce ? 1 : 0 }} transition={{ duration: d, ease: [0.2, 0, 0, 1] }}>
                <div className="fa-sheet__head">
                  <Dialog.Title asChild><h2 style={{ fontSize: 15, flex: 1 }}>{title}</h2></Dialog.Title>
                  <Dialog.Close asChild><IconBtn label="Close"><X size={16} /></IconBtn></Dialog.Close>
                </div>
                <div className="fa-sheet__body">{children}</div>
                {footer && <div className="fa-drawer__foot">{footer}</div>}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

/** Hook: returns true after `ms`, for typeout style reveals. */
export function useNow(): number {
  const [n, setN] = useState(() => Date.now());
  const tick = useCallback(() => setN(Date.now()), []);
  useEffect(() => { const t = window.setInterval(tick, 1000); return () => window.clearInterval(t); }, [tick]);
  return n;
}

export function usePrefersReducedMotion(): boolean {
  return !!useReducedMotion();
}
