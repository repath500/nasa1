import { useEffect, useMemo, useState } from 'react';
import type { RejectedCell } from '@fire/contracts';
import { useAtlasModel } from '../atlas/data';
import { LedgerEggTip } from '../eggs';
import { Badge, CopyBtn, EmptyState, ErrorState, Skeleton, usePrefersReducedMotion } from '../atlas/_ui';

const REASON: Record<RejectedCell['reason'], string> = {
  'o2-out-of-range': 'O₂ outside 0 to 100%',
  'pressure-nonpositive': 'pressure at or below zero',
  'flow-negative': 'negative flow',
  unparseable: 'could not be parsed',
  'post-test-not-condition': 'post-test value, not a test condition',
  other: 'other',
};

/** Typeout plays once per browser session (the ledger is also a landing page teaser). */
let typedThisSession = false;
const SS_KEY = 'fa.ledger.typed';
function alreadyTyped(): boolean {
  if (typedThisSession) return true;
  try { return sessionStorage.getItem(SS_KEY) === '1'; } catch { return false; }
}
function markTyped() {
  typedThisSession = true;
  try { sessionStorage.setItem(SS_KEY, '1'); } catch { /* storage unavailable */ }
}

function RawCell({ value }: { value: string }) {
  return <LedgerEggTip rawValue={value}><span className="fa-ledger__raw">{value}</span></LedgerEggTip>;
}

export default function LedgerTab() {
  const model = useAtlasModel();
  const reduce = usePrefersReducedMotion();
  const [reason, setReason] = useState<RejectedCell['reason'] | 'all'>('all');
  const rejects = model.corpus?.rejects ?? [];
  const shown = useMemo(() => (reason === 'all' ? rejects : rejects.filter((r) => r.reason === reason)), [rejects, reason]);
  const reasons = useMemo(() => [...new Set(rejects.map((r) => r.reason))], [rejects]);

  /* typeout: reveal characters across all rows, bounded to about 3 s, once */
  const [animate] = useState(() => !alreadyTyped() && !reduce);
  const total = useMemo(() => rejects.reduce((n, r) => n + r.rawValue.length + 6, 0), [rejects]);
  const [p, setP] = useState(() => (animate ? 0 : Number.POSITIVE_INFINITY));
  useEffect(() => {
    if (!animate || model.status !== 'ready' || total === 0) return;
    const step = Math.max(1, Math.ceil(total / 120));
    const id = window.setInterval(() => setP((x) => { const n = x + step; if (n >= total) { window.clearInterval(id); markTyped(); return Number.POSITIVE_INFINITY; } return n; }), 25);
    return () => window.clearInterval(id);
  }, [animate, total, model.status]);
  useEffect(() => { if (model.status === 'ready' && !animate) markTyped(); }, [model.status, animate]);

  if (model.status === 'loading') return <Skeleton rows={5} height={52} label="Loading the ledger" />;
  if (model.status === 'error') return <ErrorState message={model.message} stillWorks="the About and Method pages." onRetry={model.retry} />;
  if (rejects.length === 0) {
    return (
      <EmptyState title="Code rejected nothing in this corpus">
        The parser refuses impossible cells, such as O₂ above 100%, pressure at or below zero or negative flow. None were found in this data file, which is a valid result.
      </EmptyState>
    );
  }

  let cursor = 0;
  return (
    <>
      <div className="fa-sec">
        <p><strong>Caught by code.</strong> Cells the parser refused to turn into numbers. None of these are plotted. <Badge kind="code" /></p>
        <div className="fa-chips" role="group" aria-label="Filter by reason">
          <button type="button" className="fa-chip" aria-pressed={reason === 'all'} onClick={() => setReason('all')}>all {rejects.length}</button>
          {reasons.map((r) => (
            <button key={r} type="button" className="fa-chip" aria-pressed={reason === r} onClick={() => setReason(r)}>{REASON[r]} {rejects.filter((x) => x.reason === r).length}</button>
          ))}
        </div>
      </div>
      <div className="fa-ledger" role="list" aria-label="Rejected cells">
        {shown.map((r, i) => {
          const start = cursor;
          const len = r.rawValue.length + 6;
          cursor += len;
          if (p < start) return null;
          const typing = p < start + len;
          const typed = typing ? r.rawValue.slice(0, Math.max(0, Math.floor(p - start))) : r.rawValue;
          return (
            <div className="fa-ledger__row" role="listitem" key={`${r.accession}-${r.rowIndex}-${r.column}-${i}`}>
              <div>{typing ? <span className="fa-ledger__raw fa-ledger__caret">{typed}</span> : <RawCell value={r.rawValue} />}</div>
              {!typing && (
                <>
                  <div>{REASON[r.reason]}</div>
                  <div className="fa-muted">{model.labelOf(r.accession) === r.accession ? r.accession : `${model.labelOf(r.accession)} · ${r.accession}`} · row {r.rowIndex} · column {r.column}</div>
                  {r.note && <div className="fa-muted" style={{ fontFamily: 'Geist, system-ui, sans-serif' }}>{r.note}</div>}
                  <div className="fa-hash fa-muted">source table SHA-256 {r.csvSha12} <CopyBtn variant="quiet" label="Copy hash" copiedLabel="Hash copied" text={r.csvSha12} /></div>
                </>
              )}
            </div>
          );
        })}
      </div>
      {shown.length === 0 && <EmptyState title="No rejected cell has this reason">Choose another reason or show all.</EmptyState>}
    </>
  );
}
