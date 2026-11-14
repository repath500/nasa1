import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowSquareOut, X } from '@phosphor-icons/react';
import type { EvidenceRecord, InvestigationCard, TestRow } from '@fire/contracts';
import { useAtlas } from '../../state/store';
import { bestRecordFor, isFixtureRecord, useAtlasModel, type AtlasModel } from '../atlas/data';
import { Badge, Banner, Btn, CopyBtn, EmptyState, ErrorState, IconBtn, Skeleton } from '../atlas/_ui';
import { apaRow, bibtexRow, apaCard, bibtexCard } from '../atlas/cite';
import { GRAVITY_LABEL, NOT_AVAILABLE, NOT_REPORTED, OVERLAP_LABEL, OVERLAP_TITLE, PHASE_LABEL, csvCell, fmtFlow, fmtO2, fmtPressure, kpaTo } from '../atlas/format';
import { overlap } from '../atlas/science';

export interface EvidenceDrawerProps {
  rowId: string | null;
  onClose: () => void;
  /** Optional: open a quote or paraphrase record instead of a table row (used by the study page). */
  recordId?: string | null;
}

function sourceLink(sourceId: string, card: InvestigationCard | undefined): { href: string; label: string } | null {
  const ntrs = /^ntrs:(\d+)$/.exec(sourceId);
  if (ntrs) return { href: `https://ntrs.nasa.gov/citations/${ntrs[1]}`, label: `NTRS ${ntrs[1]}` };
  if (card?.doi) return { href: `https://doi.org/${card.doi}`, label: `DOI ${card.doi}` };
  return null;
}

function rowCsv(r: TestRow): string {
  const head = ['row_id', 'accession', 'test', 'date', 'fuel', 'fuel_phase', 'o2_pct_min', 'o2_pct_max', 'o2_location', 'pressure_kpa_min', 'pressure_kpa_max', 'flow_cm_s_min', 'flow_cm_s_max', 'gravity', 'source_table_sha12'];
  const v = [r.id, r.accession, r.testLabel, r.date, r.fuel.name, r.fuel.phase, r.o2Pct.min, r.o2Pct.max, r.o2Location, r.pressureKpa.min, r.pressureKpa.max, r.flowCmS.min, r.flowCmS.max, r.gravity, r.csvSha12];
  return `${head.join(',')}\n${v.map(csvCell).join(',')}\n`;
}

function KV({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="fa-kv" style={{ margin: 0 }}>
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: 'contents' }}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function RecordBlock({ rec, card }: { rec: EvidenceRecord; card: InvestigationCard | undefined }) {
  const link = sourceLink(rec.sourceId, card);
  const fixture = isFixtureRecord(rec);
  const accepted = rec.review.state === 'accepted';
  const loc = rec.locator.page != null ? `page ${rec.locator.page}` : rec.locator.rowIndex != null ? `CSV row ${rec.locator.rowIndex}` : 'locator not confirmed yet';
  return (
    <section className="fa-sec" aria-label={`${rec.evidenceKind} evidence`}>
      <h3>{rec.evidenceKind === 'quote' ? 'Quote' : rec.evidenceKind === 'paraphrase' ? 'Paraphrase' : 'Table row record'}</h3>
      <div className="fa-chips">
        {fixture && <Badge kind="fixture" />}
        {accepted && <Badge kind="reviewed" name={rec.review.by?.join(', ') || undefined} />}
        {rec.evidenceKind === 'quote' && accepted && <Badge kind="code" label="CHECKED AGAINST SOURCE TEXT BY CODE" hover="The quote is a verbatim substring of the page text, checked by the verifier before a human accepted it." />}
      </div>
      {rec.evidenceKind === 'quote' && rec.quote && <blockquote className="fa-quote">“{rec.quote}”</blockquote>}
      {rec.evidenceKind === 'paraphrase' && (
        <>
          <p className="fa-muted fa-mono" style={{ fontSize: 11 }}>Paraphrase (team), not quoted</p>
          <blockquote className="fa-quote fa-quote--paraphrase">{rec.paraphrase ?? NOT_AVAILABLE}</blockquote>
        </>
      )}
      <KV rows={[
        ['Locator', loc],
        ['Source', link ? <a href={link.href} target="_blank" rel="noreferrer">{link.label} <ArrowSquareOut size={12} aria-hidden="true" /></a> : rec.sourceId],
        ['Limits', rec.limitations.length ? rec.limitations.join(' ') : NOT_AVAILABLE],
      ]} />
      {rec.evidenceKind === 'quote' && rec.quote && <div className="fa-chips"><CopyBtn label="Copy quote" copiedLabel="Quote copied" text={rec.quote} /></div>}
    </section>
  );
}

function RowBody({ row, card, model, rec }: { row: TestRow; card: InvestigationCard | undefined; model: AtlasModel; rec: EvidenceRecord | undefined }) {
  const unit = useAtlas((s) => s.unit);
  const tol = useAtlas((s) => s.tolerances);
  const cls = overlap(row, model.scenario, tol);
  const pr = row.pressureKpa;
  const pressureText = pr.min == null && pr.max == null ? NOT_REPORTED : `${fmtPressure(pr, unit)}${unit === 'kPa' ? '' : ` (${fmtPressure(pr, 'kPa')})`}`;
  return (
    <>
      <div className="fa-chips">
        <span className="fa-chip fa-chip--edit" title="Every PSI combustion row is a microgravity flight test. Partial gravity: none in PSI.">{GRAVITY_LABEL[row.gravity]}</span>
        <span className="fa-chip fa-chip--edit" title={row.o2Location === 'burner' ? 'The O₂ value is the burner stream, not the cabin air. Excluded from overlap.' : undefined}>
          O₂ location: {row.o2Location === 'ambient' ? 'ambient' : row.o2Location === 'burner' ? 'burner stream' : NOT_REPORTED}
        </span>
        {row.fixture && <Badge kind="fixture" />}
        {rec && <Badge kind="reviewed" name={rec.review.by?.join(', ') || undefined} />}
      </div>

      <section className="fa-sec">
        <h3>Raw cells as written</h3>
        <div className="fa-raw">
          {Object.entries(row.raw).map(([k, v]) => (
            <div key={k} style={{ display: 'contents' }}><div>{k}</div><div>{v === '' ? '(empty)' : v}</div></div>
          ))}
        </div>
      </section>

      <section className="fa-sec">
        <h3>Parsed values <Badge kind="code" /></h3>
        <KV rows={[
          ['Test', row.testLabel ?? NOT_REPORTED],
          ['Fuel', row.fuel.name ?? NOT_REPORTED],
          ['Fuel phase', PHASE_LABEL[row.fuel.phase]],
          ['Geometry and size', [row.fuel.geometry, row.fuel.size].filter(Boolean).join(', ') || NOT_REPORTED],
          ['O₂ initial', `${fmtO2(row.o2Pct)}${row.o2Approx ? ' (approximate in source)' : ''}`],
          ['O₂ after test', row.o2FinalPct == null ? NOT_REPORTED : `${row.o2FinalPct.toFixed(1)} % (post-test measurement, not a condition)`],
          ['Pressure', pressureText],
          ['Flow', fmtFlow(row.flowCmS)],
          ['Test date', row.date ?? NOT_REPORTED],
        ]} />
      </section>

      <section className="fa-sec">
        <h3>Against the selected air <Badge kind="code" /></h3>
        <KV rows={[
          [model.scenario.label, `${model.scenario.o2Pct.toFixed(1)}% O₂, ${kpaTo(unit, model.scenario.totalKpa).toFixed(unit === 'mmHg' ? 0 : 1)} ${unit}`],
          ['Overlap', <span title={OVERLAP_TITLE[cls]}>{OVERLAP_LABEL[cls]}</span>],
        ]} />
        <p className="fa-muted" style={{ fontSize: 12 }}>{OVERLAP_TITLE[cls]}. Equal O₂ partial pressure is not equal flammability.</p>
      </section>

      <section className="fa-sec">
        <h3>Source</h3>
        <KV rows={[
          ['Table SHA-256', <span className="fa-hash">{row.csvSha12} <CopyBtn variant="quiet" label="Copy hash" copiedLabel="Hash copied" text={row.csvSha12} /></span>],
          ['Row index', row.rowIndex],
          ['PSI accession', card ? <Link to={`/study/${row.accession}`}>{row.accession} · {card.acronym}</Link> : row.accession],
          ['DOI', card?.doi ? <a href={`https://doi.org/${card.doi}`} target="_blank" rel="noreferrer">{card.doi} <ArrowSquareOut size={12} aria-hidden="true" /></a> : NOT_AVAILABLE],
          ['Licence', card?.license ?? NOT_AVAILABLE],
        ]} />
      </section>

      <section className="fa-sec">
        <h3>Transfer limits</h3>
        <ul className="fa-list">
          <li>Gravity: microgravity on the ISS. Partial gravity: none in PSI, so nothing here describes lunar or Martian gravity.</li>
          <li>Geometry and apparatus differ between investigations. A row is a test condition, not a limit.</li>
          {row.o2Location === 'burner' && <li>O₂ here is the burner stream, not the cabin air.</li>}
          {(card?.caveats ?? []).map((c) => <li key={c}>{c}</li>)}
        </ul>
      </section>
    </>
  );
}

export default function EvidenceDrawer({ rowId, onClose, recordId = null }: EvidenceDrawerProps) {
  const model = useAtlasModel();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement | null>(null);
  const open = rowId !== null || recordId !== null;
  const lastRef = useRef<{ rowId: string | null; recordId: string | null }>({ rowId: null, recordId: null });
  if (open) lastRef.current = { rowId, recordId };
  const shown = open ? { rowId, recordId } : lastRef.current;

  const row = useMemo(() => (shown.rowId ? model.corpus?.rows.find((r) => r.id === shown.rowId) : undefined), [model.corpus, shown.rowId]);
  const rec = useMemo(() => (shown.recordId ? model.records.find((r) => r.id === shown.recordId) : undefined), [model.records, shown.recordId]);
  const card = model.cardsByAcc.get(row?.accession ?? rec?.accession ?? '');
  const siblings = useMemo(
    () => (row && model.corpus ? model.corpus.rows.filter((r) => r.accession === row.accession).sort((a, b) => a.rowIndex - b.rowIndex) : []),
    [row, model.corpus],
  );
  const idx = row ? siblings.findIndex((r) => r.id === row.id) : -1;
  const go = (d: -1 | 1) => {
    const next = siblings[idx + d];
    if (next) useAtlas.getState().set({ selectedRowId: next.id });
  };
  const relatedRecords = useMemo(
    () => (row ? model.records.filter((r) => r.accession === row.accession && r.evidenceKind !== 'table_row' && r.id !== shown.recordId) : []),
    [row, model.records, shown.recordId],
  );

  /* focus: remember the opener, move focus in, restore on close */
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const t = window.setTimeout(() => ref.current?.focus(), 0);
    return () => { window.clearTimeout(t); opener?.focus?.(); };
  }, [open]);

  /* keys: Esc closes, [ and ] step through rows of the same investigation */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      if (e.key === 'Escape' && !e.defaultPrevented) { if (document.querySelector('[role="dialog"][data-state="open"]')) return; onClose(); }
      else if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey && e.key === '[') { e.preventDefault(); go(-1); }
      else if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey && e.key === ']') { e.preventDefault(); go(1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const title = row ? `${card?.acronym ?? row.accession} · ${row.testLabel ? `test ${row.testLabel}` : `row ${row.rowIndex}`}` : rec ? `${card?.acronym ?? rec.accession} · ${rec.evidenceKind}` : 'Evidence';
  const d = reduce ? 0 : 0.2;

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key="evidence"
          ref={ref as React.Ref<HTMLElement>}
          tabIndex={-1}
          role="dialog"
          aria-modal="false"
          aria-label={`Evidence: ${title}`}
          className="fa fa-drawer"
          initial={{ x: reduce ? 0 : 48, opacity: reduce ? 1 : 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: reduce ? 0 : 48, opacity: reduce ? 1 : 0 }}
          transition={{ duration: d, ease: [0.2, 0, 0, 1] }}
        >
          <>
            <div className="fa-drawer__head">
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="fa-mono fa-muted" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{row ? 'Source row' : 'Source evidence'}</p>
                <h2 style={{ fontSize: 15, overflowWrap: 'anywhere' }} aria-live="polite">{title}</h2>
              </div>
              {row && (
                <>
                  <IconBtn label="Previous row ([)" disabled={idx <= 0} onClick={() => go(-1)}><ArrowLeft size={16} /></IconBtn>
                  <span className="fa-mono fa-muted" style={{ fontSize: 11 }} aria-label={`Row ${idx + 1} of ${siblings.length} in this investigation`}>{idx + 1}/{siblings.length}</span>
                  <IconBtn label="Next row (])" disabled={idx < 0 || idx >= siblings.length - 1} onClick={() => go(1)}><ArrowRight size={16} /></IconBtn>
                </>
              )}
              <IconBtn label="Close evidence (Esc)" onClick={onClose}><X size={16} /></IconBtn>
            </div>

            <div className="fa-drawer__body">
              {model.status === 'loading' && <Skeleton rows={6} height={34} label="Loading the source row" />}
              {model.status === 'error' && <ErrorState message={model.message} stillWorks="the map and the other panels that already loaded." onRetry={model.retry} />}
              {model.status === 'ready' && !row && !rec && (
                <EmptyState title="This source row is not in the loaded corpus" actions={<Btn onClick={onClose}>Close</Btn>}>
                  The link may come from a different corpus build ({shown.rowId ?? shown.recordId}). Nothing is guessed in its place.
                </EmptyState>
              )}
              {model.status === 'ready' && row && <RowBody row={row} card={card} model={model} rec={bestRecordFor(model.records, row)} />}
              {model.status === 'ready' && rec && <RecordBlock rec={rec} card={card} />}
              {model.status === 'ready' && relatedRecords.length > 0 && (
                <section className="fa-sec">
                  <h3>More evidence for {card?.acronym ?? row?.accession}</h3>
                  {relatedRecords.map((r) => <RecordBlock key={r.id} rec={r} card={card} />)}
                </section>
              )}
              {model.status === 'ready' && model.corpus?.fixture && <Banner tone="flag">Fixture corpus. Values here are placeholders for layout testing.</Banner>}
            </div>

            {model.status === 'ready' && (row || rec) && (
              <div className="fa-drawer__foot">
                {row && card && (
                  <>
                    <CopyBtn label="Copy citation (APA)" copiedLabel="Citation copied" text={() => apaRow(row, card, model.corpus)} />
                    <CopyBtn label="Copy citation (BibTeX)" copiedLabel="BibTeX copied" text={() => bibtexRow(row, card, model.corpus)} />
                    <CopyBtn label="Copy row as CSV" copiedLabel="CSV copied" text={() => rowCsv(row)} />
                  </>
                )}
                {!row && card && (
                  <>
                    <CopyBtn label="Copy citation (APA)" copiedLabel="Citation copied" text={() => apaCard(card, model.corpus)} />
                    <CopyBtn label="Copy citation (BibTeX)" copiedLabel="BibTeX copied" text={() => bibtexCard(card, model.corpus)} />
                  </>
                )}
                {card && <Link className="fa-btn" to={`/study/${card.accession}`}>Open study</Link>}
              </div>
            )}
          </>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
