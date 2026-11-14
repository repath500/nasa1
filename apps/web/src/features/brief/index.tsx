import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DownloadSimple, Printer } from '@phosphor-icons/react';
import { PRESETS, type FuelPhase, type ScenarioId } from '@fire/contracts';
import pkg from '../../../package.json';
import { useAtlas } from '../../state/store';
import { writeUrl } from '../../state/url';
import GapMap from '../gapmap';
import { useAtlasModel } from '../atlas/data';
import { Badge, Banner, Btn, EmptyState, ErrorState, Root, Skeleton } from '../atlas/_ui';
import { apaCard, bibtexAll } from '../atlas/cite';
import { CONCERN_LABEL, NOT_AVAILABLE, PHASE_LABEL, downloadText, fmtScenarioPressure } from '../atlas/format';
import { overlap } from '../atlas/science';
import { useNotes } from '../notes/notesStore';
import QrSvg from './qr';

const PHASES: FuelPhase[] = ['solid', 'liquid-droplet', 'gas', 'aerosol'];
const LAB_KEY = 'fa.brief.lab';

export default function BriefPage() {
  const { scenario: param = '' } = useParams();
  const model = useAtlasModel();
  const set = useAtlas((s) => s.set);
  const habitat = useAtlas((s) => s.habitat);
  const concern = useAtlas((s) => s.concern);
  const tol = useAtlas((s) => s.tolerances);
  const unit = useAtlas((s) => s.unit);
  const plan = useAtlas((s) => s.license.plan);
  const selectedRowId = useAtlas((s) => s.selectedRowId);
  const notes = useNotes();
  const [paper, setPaper] = useState<'a4' | 'letter'>(() => (navigator.language === 'en-US' ? 'letter' : 'a4'));
  const [lab, setLab] = useState(() => { try { return localStorage.getItem(LAB_KEY) ?? ''; } catch { return ''; } });
  const [withNotes, setWithNotes] = useState(true);
  const paid = plan !== 'explorer';

  /* the route segment is the habitat id and wins over the stored one */
  useEffect(() => {
    if (param && param !== habitat && (['earth-iss', 'lunar-cabin-example', 'exploration-upper', 'suit', 'custom'] as string[]).includes(param)) set({ habitat: param as ScenarioId });
  }, [param]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { try { localStorage.setItem(LAB_KEY, lab); } catch { /* storage unavailable */ } }, [lab]);

  const rows = model.corpus?.rows ?? [];
  const scenario = model.scenario;
  const by = useMemo(() => {
    const m = new Map<FuelPhase, { covers: number; near: number; unknown: number }>();
    for (const p of PHASES) m.set(p, { covers: 0, near: 0, unknown: 0 });
    for (const r of model.rows) {
      const cell = m.get(r.fuel.phase);
      if (!cell) continue;
      const c = overlap(r, scenario, tol);
      if (c === 'covers') cell.covers++;
      else if (c === 'near-o2-only' || c === 'near-pressure-only') cell.near++;
      else if (c === 'unknown') cell.unknown++;
    }
    return m;
  }, [model.rows, scenario, tol]);

  const top = model.ranked.slice(0, 5);
  const link = `${window.location.origin}/atlas?${writeUrl('')}`;
  const includeNotes = paid && withNotes && notes.length > 0;
  const noteAccs = new Set(notes.map((n) => n.accession).filter((a): a is string => !!a));
  const citeCards = model.cards.filter((c) => top.some((t) => t.accession === c.accession) || (includeNotes && noteAccs.has(c.accession)));
  const hashLine = model.corpus ? `corpus ${model.corpus.corpusHash.slice(0, 16)}${model.corpus.corpusHash.length > 16 ? '...' : ''} · built ${model.corpus.builtAt.slice(0, 10)}` : NOT_AVAILABLE;
  const pO2 = (scenario.o2Pct / 100) * scenario.totalKpa;
  const phaseGaps = PHASES.filter((p) => (by.get(p)?.covers ?? 0) === 0);

  if (model.status === 'loading') return <Root><main className="fa-page"><Skeleton rows={8} height={44} label="Loading the brief" /></main></Root>;
  if (model.status === 'error') return <Root><main className="fa-page"><ErrorState message={model.message} stillWorks="the About, Method and Credits pages." onRetry={model.retry} /></main></Root>;

  const printCss = `@page{size:${paper === 'a4' ? 'A4' : 'Letter'};margin:12mm}@media print{body :is(header,nav,footer,[role="banner"],[role="contentinfo"],[data-sonner-toaster],.fa-noprint){display:none!important}}`;

  return (
    <Root>
      <style>{printCss}</style>
      <main className="fa-brief-wrap" id="main">
        <div className="fa-brief-tools fa-noprint fa" aria-label="Export options">
          <Btn variant="primary" icon={<Printer size={14} />} onClick={() => window.print()}>Print or save as PDF</Btn>
          <span className="fa-field">
            <label className="fa-bar__label" htmlFor="brief-paper">Paper</label>
            <select id="brief-paper" className="fa-select" value={paper} onChange={(e) => setPaper(e.target.value as 'a4' | 'letter')}><option value="a4">A4</option><option value="letter">Letter</option></select>
          </span>
          <Btn icon={<DownloadSimple size={14} />} onClick={() => downloadText('fire-atlas-references.bib', bibtexAll(model.cards, model.corpus), 'application/x-bibtex')}>BibTeX</Btn>
          <span className="fa-field" role="group" aria-label="Researcher plan export">
            <label className="fa-bar__label" htmlFor="brief-lab">Lab name</label>
            <input id="brief-lab" className="fa-input" value={lab} disabled={!paid} onChange={(e) => setLab(e.target.value)} maxLength={80} style={{ width: 160 }} />
            <label className="fa-field" style={{ fontSize: 12 }}><input type="checkbox" checked={withNotes} disabled={!paid} onChange={(e) => setWithNotes(e.target.checked)} /> Include notes</label>
          </span>
          {!paid && <span className="fa-muted" style={{ fontSize: 12 }}>PDF with notes and your lab name is part of the Researcher plan. <Link to="/pricing">See plans</Link>. Printing the brief stays free.</span>}
        </div>

        {model.rows.length === 0 && model.corpus && model.corpus.rows.length > 0 && (
          <div className="fa-brief-tools fa-noprint"><EmptyState title="No rows match the fuel filter">The brief would be empty. Clear the fuel filter in the atlas before exporting.</EmptyState></div>
        )}

        <article className="fa-brief fa" data-paper={paper} aria-label="Gap Brief">
          <section className="fa-brief__top">
            <div style={{ display: 'grid', gap: 4 }}>
              <p className="fa-mono" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4F5661' }}>Gap Brief{paid && lab ? ` · ${lab}` : ''}</p>
              <h1>{scenario.label}: {CONCERN_LABEL[concern].toLowerCase()}</h1>
              <p style={{ color: '#4F5661' }}>Generated {new Date().toISOString().slice(0, 10)} · app version {pkg.version}{model.corpus?.fixture ? ' · ' : ''}{model.corpus?.fixture && <Badge kind="fixture" />}</p>
            </div>
            <div className="fa-brief__qr"><QrSvg text={link} label="QR code linking to this exact view in the atlas" /></div>
          </section>

          <section>
            <h2>Scenario and sources</h2>
            <table>
              <tbody>
                <tr><th scope="row">Air</th><td className="fa-num">{scenario.o2Pct.toFixed(1)}% O₂ at {fmtScenarioPressure(scenario.totalKpa, 'kPa')} ({fmtScenarioPressure(scenario.totalKpa, 'psi')})</td></tr>
                <tr><th scope="row">O₂ partial pressure</th><td className="fa-num">{pO2.toFixed(1)} kPa, context only. Equal O₂ partial pressure is not equal flammability.</td></tr>
                <tr><th scope="row">Window</th><td className="fa-num">O₂ ±{tol.o2PctPoints} points, pressure ±{Math.round(tol.pressureFrac * 100)}%{model.d5Signed ? '' : ' (proposed, not yet signed)'}</td></tr>
                <tr><th scope="row">Source of this air</th><td>{habitat === 'custom' ? 'Set by the reader.' : `${PRESETS[habitat].sourceNote}.`} Illustrative, not a design value.</td></tr>
                <tr><th scope="row">Data</th><td>NASA Physical Sciences Informatics, Combustion Science. {model.cards.length} investigations, {rows.length} parsed test rows. Licence CC0-1.0.</td></tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2>Gap Map snapshot</h2>
            <div className="fa-brief__snap">
              <GapMap rows={rows} scenario={scenario} tolerances={tol} selectedRowId={selectedRowId} unit={unit} compact phaseFilter={undefined} />
            </div>
            <p style={{ fontSize: 10.5, color: '#4F5661', marginTop: 4 }}>One mark per test row, placed by pressure and O₂. The box is the selected air. Rows that report no pressure or no O₂ sit on the rails, never at zero.</p>
          </section>

          <section>
            <h2>What the data shows near this air</h2>
            {model.gap.allowed && model.gap.sentence ? (
              <><p style={{ fontWeight: 600 }}>{model.gap.sentence}</p><p style={{ color: '#4F5661', fontSize: 11 }}>{model.gap.scopeLine}</p></>
            ) : (
              <p style={{ color: '#4F5661' }}>The headline sentence is withheld until a human signs it off (gate K5). Counted by code: {model.gap.counts.rowsNear} rows cover this air.</p>
            )}
            <table style={{ marginTop: 6 }}>
              <thead><tr><th>Tested near this air, by fuel</th><th className="fa-num">Cover</th><th className="fa-num">Near on one axis</th><th className="fa-num">Unknown</th></tr></thead>
              <tbody>
                {PHASES.map((p) => { const c = by.get(p)!; return <tr key={p}><td>{PHASE_LABEL[p]}</td><td className="fa-num">{c.covers}</td><td className="fa-num">{c.near}</td><td className="fa-num">{c.unknown}</td></tr>; })}
              </tbody>
            </table>
          </section>

          <section>
            <h2>Not tested, or unknown</h2>
            <ul>
              {phaseGaps.length > 0 ? phaseGaps.map((p) => <li key={p}>No PSI row covers this air for {PHASE_LABEL[p]} fuel. None in PSI, which is not the same as none anywhere.</li>) : <li>Every fuel phase has at least one covering row.</li>}
              <li>{model.gap.counts.unknownO2Tables.length} {model.gap.counts.unknownO2Tables.length === 1 ? 'table reports' : 'tables report'} no O₂{model.gap.counts.unknownO2Tables.length ? ` (${model.gap.counts.unknownO2Tables.join(', ')})` : ''}. They are unknown, not absent.</li>
              <li>Partial-gravity combustion data: none in PSI.</li>
            </ul>
          </section>

          <section>
            <h2>Start here</h2>
            {top.length === 0 ? <p style={{ color: '#4F5661' }}>No ranked study yet.</p> : (
              <ol>
                {top.map((t) => {
                  const c = model.cardsByAcc.get(t.accession);
                  return (
                    <li key={t.accession}>
                      <strong>{c?.acronym ?? t.accession}</strong> ({t.accession}): {t.overlap.covers} rows cover this air, {t.overlap.nearO2Only + t.overlap.nearPressureOnly} near, {t.overlap.unknown} unknown. Pillar match: {t.pillarMatch}. Tier: {t.evidenceTier ?? 'not reviewed'}.
                    </li>
                  );
                })}
              </ol>
            )}
            {model.preview && <p style={{ color: '#8A4B00', fontSize: 11 }}>Preview: cards not yet human-reviewed.</p>}
            {model.agreement && !model.noAi && <p style={{ fontSize: 11, color: '#4F5661' }}>Second ranker (Jev, fixture values): {model.agreement.sentence}</p>}
          </section>

          {includeNotes && (
            <section>
              <h2>Notes{paid && lab ? ` from ${lab}` : ''}</h2>
              <ul>{notes.map((n) => <li key={n.id}>{n.rowId ? <span className="fa-mono">{n.rowId}: </span> : null}{n.text || 'pinned row'}</li>)}</ul>
            </section>
          )}

          <section>
            <h2>Limits</h2>
            <ul>
              <li>All rows are microgravity flight tests on the ISS. Partial-gravity combustion data: none in PSI. Nothing here describes lunar or Martian gravity.</li>
              <li>Only ambient O₂ counts. Burner stream O₂ rows are excluded.</li>
              <li>Geometry and apparatus differ between investigations. A test row is a condition that was run, not a limit.</li>
              <li>Rank orders a reading list. It is not a finding about any atmosphere.</li>
            </ul>
          </section>

          <section>
            <h2>Citations</h2>
            <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
              {citeCards.length === 0 ? <li>{NOT_AVAILABLE}</li> : citeCards.map((c) => <li key={c.accession} style={{ fontSize: 11 }}>{apaCard(c, model.corpus)}</li>)}
            </ul>
          </section>

          <section className="fa-brief__foot">
            <span>{hashLine} · app version {pkg.version}</span>
            <span>View: {link}</span>
            <span>NASA does not endorse this project. Data from NASA PSI, CC0-1.0. Not safety guidance.</span>
          </section>
        </article>
        {model.corpus?.fixture && <div className="fa-brief-tools fa-noprint"><Banner tone="flag">Fixture corpus. This brief is a layout sample.</Banner></div>}
      </main>
    </Root>
  );
}
