export type Status = { kind: 'live' } | { kind: 'cached'; date?: string } | { kind: 'fixture' } | { kind: 'no-ai' } | { kind: 'offline' };

const copy: Record<Status['kind'], { text: string; hint: string; tone: string }> = {
  live: { text: 'LIVE', hint: 'AI services answered just now.', tone: 'border-[var(--color-ok-text)] text-[color:var(--color-ok-text)]' },
  cached: { text: 'CACHED', hint: 'AI answers come from a recorded cache. The data itself is unchanged.', tone: 'border-accent text-accent' },
  fixture: { text: 'FIXTURE', hint: 'Hand-written example data, not model output.', tone: 'border-flag text-flag' },
  'no-ai': { text: 'NO-AI', hint: 'Baseline only. AI columns are hidden.', tone: 'border-strong text-muted' },
  offline: { text: 'OFFLINE', hint: 'No server reachable. Static data still works.', tone: 'border-strong text-muted' },
};

/** SPEC §6.5 top-bar chip: LIVE, CACHED date, FIXTURE, NO-AI, OFFLINE. ASCII framing is allowed here. */
export function StatusChip({ status, className = '' }: { status: Status; className?: string }) {
  const c = copy[status.kind];
  const label = status.kind === 'cached' && status.date ? `${c.text} · ${status.date}` : c.text;
  return (
    <span role="status" aria-label={`Status: ${label}. ${c.hint}`} title={c.hint}
      className={`mono inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-[2px] text-[11px] tracking-[0.04em] ${c.tone} ${className}`}>
      <span aria-hidden>[</span>{label}<span aria-hidden>]</span>
    </span>
  );
}
