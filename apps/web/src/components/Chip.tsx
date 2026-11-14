import type { ReactNode } from 'react';
import { Tip } from './Tooltip';

type Tone = 'neutral' | 'accent' | 'flag' | 'ok';
const tones: Record<Tone, string> = {
  neutral: 'border-strong text-muted',
  accent: 'border-accent text-accent',
  flag: 'border-flag text-flag',
  ok: 'border-[var(--color-ok-text)] text-[color:var(--color-ok-text)]',
};

/** Generic chip. Pill only for status and SI chips, square elsewhere (SPEC §6.2). */
export function Chip({ children, tone = 'neutral', pill = false, className = '', title }: { children: ReactNode; tone?: Tone; pill?: boolean; className?: string; title?: string }) {
  return (
    <span title={title} className={`mono inline-flex items-center gap-1 border px-1.5 py-[1px] text-[11px] leading-5 tracking-[0.04em] ${pill ? 'rounded-full px-2' : 'rounded-none'} ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

export type Provenance =
  | { kind: 'code' }
  | { kind: 'si'; modelId: string; recordedAt?: string; live?: boolean; question?: string }
  | { kind: 'reviewed'; by?: string }
  | { kind: 'fixture' };

/** SPEC §6.5, identical everywhere. */
export function ProvenanceBadge(p: Provenance & { className?: string }) {
  if (p.kind === 'code') return <Chip className={p.className} title="Computed by deterministic code from parsed rows">CODE</Chip>;
  if (p.kind === 'fixture') return <Chip tone="flag" className={p.className} title="Hand-written example data, not model output">FIXTURE</Chip>;
  if (p.kind === 'reviewed') return <Chip tone="ok" className={p.className} title="Accepted by a named human reviewer">{p.by ? `REVIEWED · ${p.by}` : 'REVIEWED'}</Chip>;
  return (
    <Tip
      content={
        <span className="block space-y-1">
          <span className="block mono text-[11px] text-muted">Model judgement (ordinal)</span>
          <span className="block"><span className="text-muted">Model </span><span className="mono">{p.modelId}</span></span>
          {p.recordedAt && <span className="block"><span className="text-muted">Date </span><span className="mono">{p.recordedAt}</span></span>}
          <span className="block"><span className="text-muted">Source </span>{p.live ? 'live' : 'cached'}</span>
          {p.question && <span className="block"><span className="text-muted">Question </span>{p.question}</span>}
        </span>
      }
    >
      <button type="button" className={`mono inline-flex items-center rounded-full border border-accent px-2 py-[1px] text-[11px] leading-5 tracking-[0.04em] text-accent ${p.className ?? ''}`}>
        SI · {p.modelId}
      </button>
    </Tip>
  );
}
