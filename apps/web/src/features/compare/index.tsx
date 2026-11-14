import { useMemo, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowsLeftRight } from '@phosphor-icons/react';
import type { InvestigationCard, Range } from '@fire/contracts';
import { useAtlas } from '../../state/store';
import { useAtlasModel } from '../atlas/data';
import { Badge, Banner, Btn, EmptyState, ErrorState, PillarChip, Root, Skeleton } from '../atlas/_ui';
import { GRAVITY_LABEL, NOT_AVAILABLE, NOT_REPORTED, PHASE_LABEL, fmtFlow, fmtO2, fmtPressure } from '../atlas/format';
import { measuredColumns, studyFacts, type StudyFacts } from '../atlas/stats';

const HW: Record<string, string> = {
  'CIR-MDCA': 'CIR, droplet apparatus (MDCA)', 'CIR-ACME': 'CIR, ACME', 'MSG-duct': 'MSG flow duct', 'Cygnus-Saffire': 'Saffire in Cygnus',
  'SAME-glovebox': 'SAME glovebox', other: 'other hardware', unknown: NOT_REPORTED,
};

function fmtMm(mm: number | null): string {
  if (mm == null) return NOT_REPORTED;
  if (mm < 10) return `${mm.toFixed(mm < 1 ? 2 : 1)} mm`;
  if (mm < 1000) return `${(mm / 10).toFixed(1)} cm`;
  return `${(mm / 1000).toFixed(2)} m`;
}
const rangesApart = (a: Range, b: Range): boolean | null => {
  if ((a.min == null && a.max == null) || (b.min == null && b.max == null)) return null;
  const aLo = (a.min ?? a.max) as number, aHi = (a.max ?? a.min) as number, bLo = (b.min ?? b.max) as number, bHi = (b.max ?? b.min) as number;
  return aHi < bLo || bHi < aLo;
};

interface Side { card: InvestigationCard; facts: StudyFacts; measured: string[] }
interface Line { label: string; a: ReactNode; b: ReactNode; differs: boolean | null; note?: string }

function buildLines(A: Side, B: Side, unit: Parameters<typeof fmtPressure>[1]): Line[] {
  const txt = (s: string[]) => (s.length ? s.join(', ') : NOT_REPORTED);
  const phases = (f: StudyFacts) => f.phases.filter((p) => p !== 'unknown').map((p) => PHASE_LABEL[p]);
  const sameSet = (x: string[], y: string[]) => x.length === y.length && x.every((v) => y.includes(v));
  const o2Apart = rangesApart(A.facts.o2, B.facts.o2);
  const pApart = rangesApart(A.facts.pressure, B.facts.pressure);
  const fApart = rangesApart(A.facts.flow, B.facts.flow);
  const objShort = (c: InvestigationCard) => (c.objective.length > 420 ? `${c.objective.slice(0, 420)}...` : c.objective || NOT_AVAILABLE);
  return [
    { label: 'Objective', a: objShort(A.card), b: objShort(B.card), differs: null },
    { label: 'Fuel phase', a: txt(phases(A.facts)), b: txt(phases(B.facts)), differs: !sameSet(phases(A.facts), phases(B.facts)) },
    { label: 'Fuels', a: txt(A.facts.fuels.slice(0, 8)), b: txt(B.facts.fuels.slice(0, 8)), differs: !sameSet(A.facts.fuels, B.facts.fuels) },
    { label: 'Geometry', a: `${txt(A.facts.geometries.slice(0, 4))}. Typical scale ${fmtMm(A.facts.scaleMm)}`, b: `${txt(B.facts.geometries.slice(0, 4))}. Typical scale ${fmtMm(B.facts.scaleMm)}`, differs: A.facts.scaleMm != null && B.facts.scaleMm != null ? Math.max(A.facts.scaleMm, B.facts.scaleMm) / Math.min(A.facts.scaleMm, B.facts.scaleMm) > 3 : null },
    { label: 'O₂ range', a: fmtO2(A.facts.o2), b: fmtO2(B.facts.o2), differs: o2Apart, note: o2Apart ? 'The tested O₂ ranges do not overlap.' : o2Apart === null ? 'At least one study reports no O₂, so no match or mismatch is claimed.' : undefined },
    { label: 'Pressure range', a: fmtPressure(A.facts.pressure, unit), b: fmtPressure(B.facts.pressure, unit), differs: pApart, note: pApart ? 'The tested pressure ranges do not overlap.' : pApart === null ? 'At least one study reports no pressure, so no match or mismatch is claimed.' : undefined },
    { label: 'Flow range', a: fmtFlow(A.facts.flow), b: fmtFlow(B.facts.flow), differs: fApart },
    { label: 'Gravity', a: txt(A.facts.gravity.map((g) => GRAVITY_LABEL[g])), b: txt(B.facts.gravity.map((g) => GRAVITY_LABEL[g])), differs: !sameSet(A.facts.gravity, B.facts.gravity) },
    { label: 'Hardware', a: HW[A.card.hardwareFamily] ?? A.card.hardwareFamily, b: HW[B.card.hardwareFamily] ?? B.card.hardwareFamily, differs: A.card.hardwareFamily !== B.card.hardwareFamily },
    { label: 'Measured columns', a: txt(A.measured.slice(0, 8)), b: txt(B.measured.slice(0, 8)), differs: null },
    { label: 'Test rows', a: `${A.facts.n} (${A.facts.unknownO2} without O₂)`, b: `${B.facts.n} (${B.facts.unknownO2} without O₂)`, differs: null },
    { label: 'Pillar (human)', a: <PillarChip pillar={A.card.pillarPrimary} />, b: <PillarChip pillar={B.card.pillarPrimary} />, differs: A.card.pillarPrimary !== B.card.pillarPrimary },
    { label: 'Evidence tier', a: A.card.evidenceTier ?? 'not reviewed', b: B.card.evidenceTier ?? 'not reviewed', differs: null },
  ];
}

export default function ComparePage() {
  const model = useAtlasModel();
  const [params, setParams] = useSearchParams();
  const unit = useAtlas((s) => s.unit);
  const a = params.get('a') ?? '';
  const b = params.get('b') ?? '';
  const cardA = model.cardsByAcc.get(a);
  const cardB = model.cardsByAcc.get(b);

  const sides = useMemo(() => {
    if (!model.corpus || !cardA || !cardB) return null;
    const mk = (card: InvestigationCard): Side => {
      const rows = model.corpus!.rows.filter((r) => r.accession === card.accession);
      return { card, facts: studyFacts(rows, card), measured: measuredColumns(rows) };
    };
    return { A: mk(cardA), B: mk(cardB) };
  }, [model.corpus, cardA, cardB]);

  const setSide = (k: 'a' | 'b', v: string) => { const n = new URLSearchParams(params); if (v) n.set(k, v); else n.delete(k); setParams(n, { replace: true }); };
  const swap = () => setParams(new URLSearchParams({ a: b, b: a }), { replace: true });

  const picker = (
    <div className="fa-chips fa-noprint">
      {(['a', 'b'] as const).map((k) => (
        <span className="fa-field" key={k}>
          <label className="fa-bar__label" htmlFor={`cmp-${k}`}>Study {k.toUpperCase()}</label>
          <select id={`cmp-${k}`} className="fa-select" value={k === 'a' ? a : b} onChange={(e) => setSide(k, e.target.value)}>
            <option value="">choose a study</option>
            {model.cards.map((c) => <option key={c.accession} value={c.accession}>{c.acronym} ({c.accession})</option>)}
          </select>
        </span>
      ))}
      <Btn icon={<ArrowsLeftRight size={14} />} onClick={swap} disabled={!a || !b}>Swap</Btn>
    </div>
  );

  return (
    <Root>
      <main className="fa-page" id="main">
        <header className="fa-page__head">
          <p className="fa-mono fa-muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Compare</p>
          <h1>{cardA && cardB ? `${cardA.acronym} and ${cardB.acronym}` : 'Compare two studies'}</h1>
          <p className="fa-muted fa-prose">Rows are aligned. Where the studies cannot be matched, the cell says so in words. There is no combined score.</p>
          {model.status === 'ready' && picker}
        </header>

        {model.status === 'loading' && <Skeleton rows={8} height={42} label="Loading comparison" />}
        {model.status === 'error' && <ErrorState message={model.message} stillWorks="the About, Method and Credits pages." onRetry={model.retry} />}

        {model.status === 'ready' && !sides && (
          <EmptyState title={a && b && (!cardA || !cardB) ? 'One of these studies is not in the loaded corpus' : 'Choose two studies to compare'} actions={<Link className="fa-btn" to="/atlas">Back to the atlas</Link>}>
            {a && b && (!cardA || !cardB) ? `${!cardA ? a : b} could not be found. Nothing is guessed in its place.` : 'Pick Study A and Study B above, or open a study and use Compare with.'}
          </EmptyState>
        )}

        {sides && (() => {
          const { A, B } = sides;
          const ph = (f: StudyFacts) => f.phases.filter((p) => p !== 'unknown');
          const phaseMismatch = ph(A.facts).length > 0 && ph(B.facts).length > 0 && !ph(A.facts).some((p) => ph(B.facts).includes(p));
          const ratio = A.facts.scaleMm != null && B.facts.scaleMm != null ? Math.max(A.facts.scaleMm, B.facts.scaleMm) / Math.min(A.facts.scaleMm, B.facts.scaleMm) : null;
          const geomMismatch = ratio != null && ratio > 10;
          const refuse = phaseMismatch || geomMismatch;
          const lines = buildLines(A, B, unit);
          return (
            <>
              {refuse ? (
                <div className="fa-banner fa-banner--flag" role="alert">
                  <div style={{ display: 'grid', gap: 6 }}>
                    <strong>A direct comparison is not meaningful here.</strong>
                    <ul className="fa-list">
                      {phaseMismatch && <li>Fuel phase differs: {A.card.acronym} is {ph(A.facts).map((p) => PHASE_LABEL[p]).join(', ')}, {B.card.acronym} is {ph(B.facts).map((p) => PHASE_LABEL[p]).join(', ')}.</li>}
                      {geomMismatch && ratio != null && <li>Geometry scale differs by about {Math.round(ratio)}x: {A.card.acronym} is typically {fmtMm(A.facts.scaleMm)}, {B.card.acronym} is typically {fmtMm(B.facts.scaleMm)}.</li>}
                    </ul>
                    <span>What can be compared: objectives, hardware, gravity regime, the O₂ and pressure ranges that were tested, and which columns each table measured. Outcomes such as burn time or extinction diameter should not be set side by side.</span>
                  </div>
                </div>
              ) : (
                <Banner tone="accent">
                  Fuel phase and geometry scale are within 10x of each other, so a side by side reading is reasonable. Apparatus and test method still differ, and partial gravity is none in PSI.
                </Banner>
              )}
              {(A.facts.scaleMm == null || B.facts.scaleMm == null) && <Banner>Geometry scale is not reported for {A.facts.scaleMm == null ? A.card.acronym : B.card.acronym}, so the 10x check could not run on it.</Banner>}

              <div className="fa-cmp" role="table" aria-label="Side by side comparison">
                <div className="fa-cmp__h" role="columnheader">Field</div>
                <div className="fa-cmp__h" role="columnheader"><Link to={`/study/${A.card.accession}`}>{A.card.acronym}</Link> <span className="fa-muted">{A.card.accession}</span></div>
                <div className="fa-cmp__h" role="columnheader"><Link to={`/study/${B.card.accession}`}>{B.card.acronym}</Link> <span className="fa-muted">{B.card.accession}</span></div>
                {lines.map((l) => (
                  <div key={l.label} style={{ display: 'contents' }} role="row">
                    <div className="fa-cmp__h" role="rowheader">{l.label}{l.differs ? <span className="fa-flag"> (differs)</span> : null}</div>
                    <div role="cell" data-mismatch={l.differs === true}>{l.a}{l.note && <p className="fa-muted" style={{ fontSize: 11.5, marginTop: 4 }}>{l.note}</p>}</div>
                    <div role="cell" data-mismatch={l.differs === true}>{l.b}</div>
                  </div>
                ))}
              </div>
              <p className="fa-muted" style={{ fontSize: 12 }}><Badge kind="code" /> Ranges and counts are computed from parsed rows. Unknown is never shown as zero.</p>
            </>
          );
        })()}
      </main>
    </Root>
  );
}
