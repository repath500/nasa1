import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowSquareOut, ArrowsLeftRight } from '@phosphor-icons/react';
import type { EvidenceRecord, InvestigationCard, TestRow } from '@fire/contracts';
import { useAtlas } from '../../state/store';
import GapMap from '../gapmap';
import EvidenceDrawer from '../evidence';
import { useAtlasModel } from '../atlas/data';
import { Badge, Banner, Btn, CopyBtn, EmptyState, ErrorState, Glyph, PillarChip, Root, Skeleton } from '../atlas/_ui';
import { apaCard, bibtexCard } from '../atlas/cite';
import { GRAVITY_LABEL, KIND_LABEL, NOT_AVAILABLE, NOT_REPORTED, OVERLAP_LABEL, PHASE_LABEL, fmtFlow, fmtNum, fmtO2, fmtPressure } from '../atlas/format';
import { overlap } from '../atlas/science';
import { measuredColumns, studyFacts, variedColumns } from '../atlas/stats';
import { modalLevel } from '../studies/fixtures';

const HARDWARE: Record<string, string> = {
  'CIR-MDCA': 'Combustion Integrated Rack, Multi-user Droplet Combustion Apparatus',
  'CIR-ACME': 'Combustion Integrated Rack, Advanced Combustion via Microgravity Experiments',
  'MSG-duct': 'Microgravity Science Glovebox, flow duct',
  'Cygnus-Saffire': 'Saffire enclosure in a Cygnus cargo vehicle',
  'SAME-glovebox': 'Smoke and Aerosol Measurement Experiment in the glovebox',
  other: 'Other hardware, see the PSI record',
  unknown: 'Hardware not reported',
};
const ROW_PAGE = 60;

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section className="fa-sec" id={id} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`}>{title}</h2>
      {children}
    </section>
  );
}

export default function StudyPage() {
  const { accession = '' } = useParams();
  const model = useAtlasModel();
  const navigate = useNavigate();
  const unit = useAtlas((s) => s.unit);
  const tol = useAtlas((s) => s.tolerances);
  const concern = useAtlas((s) => s.concern);
  const selectedRowId = useAtlas((s) => s.selectedRowId);
  const set = useAtlas((s) => s.set);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [onlyCovers, setOnlyCovers] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [other, setOther] = useState('');

  const card: InvestigationCard | undefined = model.cardsByAcc.get(accession);
  const rows: TestRow[] = useMemo(() => (model.corpus?.rows ?? []).filter((r) => r.accession === accession), [model.corpus, accession]);
  const facts = useMemo(() => studyFacts(rows, card), [rows, card]);
  const varied = useMemo(() => variedColumns(rows), [rows]);
  const measured = useMemo(() => measuredColumns(rows), [rows]);
  const classes = useMemo(() => new Map(rows.map((r) => [r.id, overlap(r, model.scenario, tol)])), [rows, model.scenario, tol]);
  const records: EvidenceRecord[] = model.records.filter((r) => r.accession === accession && r.evidenceKind !== 'table_row');
  const rankRow = model.ranked.find((r) => r.accession === accession);
  const unranked = model.notRanked.some((c) => c.accession === accession);
  const j = model.jev.get(accession);
  const related = model.cards.filter((c) => c.accession !== accession && card && c.hardwareFamily === card.hardwareFamily && c.hardwareFamily !== 'unknown');
  const shownRows = rows.filter((r) => !onlyCovers || classes.get(r.id) === 'covers');
  const pageRows = showAll ? shownRows : shownRows.slice(0, ROW_PAGE);

  if (model.status === 'loading') return <Root><main className="fa-page"><Skeleton rows={8} height={40} label="Loading the study" /></main></Root>;
  if (model.status === 'error') return <Root><main className="fa-page"><ErrorState message={model.message} stillWorks="the About, Method and Credits pages." onRetry={() => window.location.reload()} /></main></Root>;
  if (!card) {
    return (
      <Root>
        <main className="fa-page fa-page--narrow">
          <EmptyState title={`${accession || 'This study'} is not in the loaded corpus`} actions={<Link className="fa-btn" to="/atlas">Back to the atlas</Link>}>
            The accession may be outside the investigations chosen for this build, or the link may point at a different corpus. Nothing is guessed in its place.
          </EmptyState>
        </main>
      </Root>
    );
  }

  const baseSentence = rankRow
    ? `Baseline rank ${rankRow.rank} of ${model.ranked.length} for ${concern === 'explore' ? 'a general look' : concern} near ${model.scenario.label}. Pillar match: ${rankRow.pillarMatch}. ${rankRow.overlap.covers} rows cover this air, ${rankRow.overlap.nearO2Only + rankRow.overlap.nearPressureOnly} are near on one axis, ${rankRow.overlap.unknown} are unknown. Evidence tier: ${rankRow.evidenceTier ?? 'not reviewed'}.`
    : unranked ? 'This study has metadata only so far, so it is not ranked. Rows from its table are still counted by code below.' : NOT_AVAILABLE;
  const gold = card.cardState === 'gold';

  return (
    <Root>
      <main className="fa-page" id="main">
        <header className="fa-page__head">
          <p className="fa-mono fa-muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Study · {card.accession}</p>
          <h1>{card.acronym}: {card.title}</h1>
          <div className="fa-chips">
            {card.doi ? <a className="fa-chip fa-chip--edit" href={`https://doi.org/${card.doi}`} target="_blank" rel="noreferrer">DOI {card.doi} <ArrowSquareOut size={12} aria-hidden="true" /></a> : <span className="fa-chip fa-chip--edit">DOI not available</span>}
            <span className="fa-chip fa-chip--edit">PSI version {card.psiVersion ?? NOT_AVAILABLE}</span>
            <span className="fa-chip fa-chip--edit">Licence {card.license}</span>
            <PillarChip pillar={card.pillarPrimary} />
            {card.pillarSecondary && <PillarChip pillar={card.pillarSecondary} />}
            {gold ? <Badge kind="reviewed" /> : <span className="fa-chip fa-chip--edit" title="Humans have not reviewed this card yet, so its tags are proposals">metadata only, unreviewed</span>}
            {card.fixture && <Badge kind="fixture" />}
          </div>
          <p>
            <strong>Evidence tier:</strong> {card.evidenceTier == null ? <span className="fa-muted">not reviewed</span> : <span className="fa-num">{card.evidenceTier}</span>}
            {card.evidenceTierRule && <span className="fa-muted"> . {card.evidenceTierRule}</span>}
          </p>
          <div className="fa-chips fa-noprint">
            <CopyBtn label="Copy citation (APA)" copiedLabel="Citation copied" text={() => apaCard(card, model.corpus)} />
            <CopyBtn label="Copy citation (BibTeX)" copiedLabel="BibTeX copied" text={() => bibtexCard(card, model.corpus)} />
            <span className="fa-field">
              <label className="fa-bar__label" htmlFor="cmp-other">Compare with</label>
              <select id="cmp-other" className="fa-select" value={other} onChange={(e) => setOther(e.target.value)}>
                <option value="">choose a study</option>
                {model.cards.filter((c) => c.accession !== accession).map((c) => <option key={c.accession} value={c.accession}>{c.acronym} ({c.accession})</option>)}
              </select>
              <Btn icon={<ArrowsLeftRight size={14} />} disabled={!other} onClick={() => navigate(`/compare?a=${accession}&b=${other}`)}>Compare</Btn>
            </span>
          </div>
          <nav className="fa-toc fa-noprint" aria-label="On this page">
            {[['objective', 'Objective'], ['fuels', 'Fuels'], ['conditions', 'Conditions'], ['variables', 'Variables'], ['measurements', 'Measurements'], ['hardware', 'Hardware'], ['why', 'Why this rank'], ['limits', 'Transfer limits'], ['earth', 'Earth applications'], ['rows', 'All rows'], ['related', 'Related']].map(([id, l]) => <a key={id} className="fa-chip fa-chip--edit" href={`#${id}`}>{l}</a>)}
          </nav>
        </header>

        <Section id="objective" title="Objective">
          <p className="fa-prose">{card.objective || NOT_AVAILABLE}</p>
          <p className="fa-muted" style={{ fontSize: 12 }}>Text from the PSI record {card.accession}, version {card.psiVersion ?? NOT_AVAILABLE}.</p>
        </Section>

        <Section id="fuels" title="Fuels and sample geometry">
          {rows.length === 0 ? (
            <EmptyState title="No parsed rows for this study">The table has no rows that passed the parser, or the table is not part of this build. Fuels are not guessed.</EmptyState>
          ) : (
            <div className="fa-grid2">
              <div className="fa-card">
                <strong>Fuels in the table ({facts.fuels.length})</strong>
                <p>{facts.fuels.length ? facts.fuels.slice(0, 12).join(', ') + (facts.fuels.length > 12 ? ', and more' : '') : NOT_REPORTED}</p>
                <p className="fa-muted">Phases: {facts.phases.map((p) => PHASE_LABEL[p]).join(', ') || NOT_REPORTED}</p>
              </div>
              <div className="fa-card">
                <strong>Geometry and size</strong>
                <p>{facts.geometries.length ? facts.geometries.slice(0, 8).join('; ') + (facts.geometries.length > 8 ? '; and more' : '') : NOT_REPORTED}</p>
                <p className="fa-muted">Geometry is a confound when comparing studies: a droplet and a fabric sheet are not the same fire problem.</p>
              </div>
            </div>
          )}
        </Section>

        <Section id="conditions" title="Conditions tested">
          <div className="fa-grid2">
            <div className="fa-minimap" aria-label={`Mini Gap Map of ${card.acronym} rows with the selected habitat box`}>
              <GapMap rows={rows} scenario={model.scenario} tolerances={tol} selectedRowId={selectedRowId} unit={unit} compact onSelectRow={(id) => set({ selectedRowId: id })} />
            </div>
            <div className="fa-card">
              <dl className="fa-kv" style={{ margin: 0 }}>
                {([
                  ['Rows', <span className="fa-num">{facts.n}</span>],
                  ['O₂ (ambient rows)', fmtO2(facts.o2)],
                  ['Pressure', fmtPressure(facts.pressure, unit)],
                  ['Flow', fmtFlow(facts.flow)],
                  ['Rows with no O₂', <span className="fa-num">{facts.unknownO2}</span>],
                  ['Rows with no pressure', <span className="fa-num">{facts.unknownPressure}</span>],
                  ['Burner stream O₂ rows', <span className="fa-num">{facts.burnerRows}</span>],
                ] as [string, React.ReactNode][]).map(([k, v]) => <div key={k} style={{ display: 'contents' }}><dt>{k}</dt><dd>{v}</dd></div>)}
              </dl>
              <p className="fa-muted" style={{ fontSize: 12 }}>The box is {model.scenario.label}. Unknown means the table did not report it, never zero.</p>
            </div>
          </div>
        </Section>

        <Section id="variables" title="Variables: how its tests differed">
          {varied.length === 0 ? <p className="fa-muted">No table column varied between rows, or the table has fewer than two rows.</p> : (
            <ul className="fa-list">{varied.map((v) => <li key={v.column}><span className="fa-mono">{v.column}</span> <span className="fa-muted">{v.distinct} distinct values</span></li>)}</ul>
          )}
          <Badge kind="code" label="CODE · from table headers" />
        </Section>

        <Section id="measurements" title="Sensors and measurements">
          {measured.length === 0 ? <p className="fa-muted">No measurement columns recognised in the table. The sensor list is in the PSI record.</p> : (
            <ul className="fa-list">{measured.map((m) => <li key={m} className="fa-mono">{m}</li>)}</ul>
          )}
          <p className="fa-muted" style={{ fontSize: 12 }}>Listed from table column names only. See the PSI record for instruments.</p>
        </Section>

        <Section id="hardware" title="Hardware family">
          <p><strong>{card.hardwareFamily}</strong> <span className="fa-muted">{HARDWARE[card.hardwareFamily] ?? ''}</span></p>
          {card.equipmentLink && <p><a href={card.equipmentLink} target="_blank" rel="noreferrer">Equipment page <ArrowSquareOut size={12} aria-hidden="true" /></a></p>}
        </Section>

        <Section id="why" title="Why this rank">
          <div className="fa-card">
            <p><Badge kind="code" /> {baseSentence}</p>
            <p className="fa-muted" style={{ fontSize: 12 }}>The order uses your priority list. It is a reading order, not a finding about {model.scenario.label}.</p>
          </div>
          {!model.noAi && (
            <div className="fa-card">
              <div className="fa-chips"><strong>Jev judgement</strong>{j?.source === 'fixture' ? <Badge kind="fixture" /> : j ? <Badge kind="si" modelId={j.modelId} /> : null}</div>
              {j ? (
                <dl className="fa-kv" style={{ margin: 0 }}>
                  <dt>Relevance</dt><dd>{j.regimeRelevance != null ? `P(yes) ${fmtNum(j.regimeRelevance, 2)}` : NOT_AVAILABLE}</dd>
                  <dt>Directness</dt><dd><span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><Glyph level={modalLevel(j)} /> level {modalLevel(j) ?? NOT_AVAILABLE}</span></dd>
                  <dt>Pillar</dt><dd>{j.pillar ? <PillarChip pillar={j.pillar.choice} /> : NOT_AVAILABLE}</dd>
                </dl>
              ) : <p className="fa-muted">Jev judgement not available for this study and air. The baseline above does not depend on it.</p>}
              <p className="fa-muted" style={{ fontSize: 12 }}>Ordinal model judgement, not a probability that the science is true. Explanation text from Hydrogen: not available in this build.</p>
            </div>
          )}
        </Section>

        <Section id="limits" title="Transfer limits">
          <ul className="fa-list">
            <li>Gravity: {facts.gravity.map((g) => GRAVITY_LABEL[g]).join(', ') || 'microgravity (ISS)'}. Partial gravity: none in PSI, so these rows say nothing about lunar or Martian gravity.</li>
            <li>Geometry, fuel and apparatus differ across investigations. A test row is a condition that was run, not a limit.</li>
            <li>Equal O₂ partial pressure is not equal flammability.</li>
            {facts.burnerRows > 0 && <li>{facts.burnerRows} rows report O₂ in the burner stream, not the cabin air. They are excluded from overlap.</li>}
            {card.caveats.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </Section>

        <Section id="earth" title="Earth applications">
          {card.pillarPrimary === 'detection' || card.acronym.startsWith('SAME') || card.acronym.startsWith('DAFT') ? (
            <p className="fa-prose">The challenge asks how PSI data might inform fire safety on Earth. {card.acronym} studies smoke or particle sensing, a topic that overlaps with smoke detector design. <a href="https://spinoff.nasa.gov/" target="_blank" rel="noreferrer">NASA Spinoff <ArrowSquareOut size={12} aria-hidden="true" /></a> collects documented Earth uses of NASA technology. No specific Earth result is claimed here.</p>
          ) : <p className="fa-muted">No Earth application is recorded for this study in this build.</p>}
        </Section>

        {records.length > 0 && (
          <Section id="records" title="Evidence records">
            <ul className="fa-list" style={{ listStyle: 'none', padding: 0 }}>
              {records.map((r) => (
                <li key={r.id}>
                  <Btn onClick={() => setRecordId(r.id)}>Open {KIND_LABEL[r.evidenceKind]}</Btn>{' '}
                  <span className="fa-muted fa-mono" style={{ fontSize: 11 }}>{r.id}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section id="rows" title={`All rows (${rows.length})`}>
          {rows.length === 0 ? <p className="fa-muted">No rows for this study.</p> : (
            <>
              <label className="fa-field" style={{ fontSize: 12 }}>
                <input type="checkbox" checked={onlyCovers} onChange={(e) => { setOnlyCovers(e.target.checked); setShowAll(false); }} /> Only rows that cover {model.scenario.label}
              </label>
              <div className="fa-tablewrap" style={{ maxHeight: 520 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                  <thead>
                    <tr className="fa-trow--head" style={{ position: 'sticky', top: 0, background: 'var(--fa-raised)' }}>
                      {['Test', 'Fuel', 'Phase', 'O₂', `Pressure (${unit})`, 'Flow', 'Overlap (code)', ''].map((h, i) => <th key={i} scope="col" className="fa-tcell" style={{ textAlign: 'left', fontFamily: 'var(--fa-mono)', fontSize: 10.5, textTransform: 'uppercase', fontWeight: 500, color: 'var(--fa-muted)' }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((r) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--fa-hair)', background: selectedRowId === r.id ? 'color-mix(in srgb, var(--fa-accent) 14%, transparent)' : undefined }}>
                        <td className="fa-tcell fa-mono">{r.testLabel ?? `row ${r.rowIndex}`}</td>
                        <td className="fa-tcell">{r.fuel.name ?? NOT_REPORTED}</td>
                        <td className="fa-tcell">{PHASE_LABEL[r.fuel.phase]}</td>
                        <td className="fa-tcell fa-mono">{fmtO2(r.o2Pct)}{r.o2Location === 'burner' ? ' burner' : ''}</td>
                        <td className="fa-tcell fa-mono">{fmtPressure(r.pressureKpa, unit)}</td>
                        <td className="fa-tcell fa-mono">{fmtFlow(r.flowCmS)}</td>
                        <td className="fa-tcell">{OVERLAP_LABEL[classes.get(r.id) ?? 'unknown']}</td>
                        <td className="fa-tcell"><Btn variant="quiet" onClick={() => set({ selectedRowId: r.id })} aria-label={`Open source row ${r.id}`}>Open source row</Btn></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {shownRows.length === 0 && <EmptyState title="No row covers this air in this study">That is a valid result: this study ran nothing inside the box.</EmptyState>}
              {!showAll && shownRows.length > ROW_PAGE && <Btn onClick={() => setShowAll(true)}>Show all {shownRows.length} rows</Btn>}
            </>
          )}
        </Section>

        <Section id="related" title="Related studies, same hardware family">
          {related.length === 0 ? <p className="fa-muted">No other study in this build shares this hardware family.</p> : (
            <div className="fa-chips">{related.map((c) => <Link key={c.accession} className="fa-chip fa-chip--edit" to={`/study/${c.accession}`}>{c.acronym} · {c.accession}</Link>)}</div>
          )}
        </Section>

        {model.corpus?.fixture && <Banner tone="flag">Fixture corpus. Objective and tags are placeholders until the real corpus is loaded.</Banner>}
      </main>
      <EvidenceDrawer rowId={selectedRowId} recordId={recordId} onClose={() => { set({ selectedRowId: null }); setRecordId(null); }} />
    </Root>
  );
}
