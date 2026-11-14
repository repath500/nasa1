import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import { ArrowsOutLineVertical, Export, NotePencil, Prohibit, Rows, Selection, X } from '@phosphor-icons/react';
import { PRESETS, type FuelPhase, type PanelTab, type ScenarioId } from '@fire/contracts';
import { useAtlas } from '../../state/store';
import { writeUrl } from '../../state/url';
import GapMap from '../gapmap';
import Timeline from '../timeline';
import EvidenceDrawer from '../evidence';
import StudiesTab from '../studies';
import SelectionTab from '../selection';
import LedgerTab from '../ledger';
import NotesTab from '../notes';
import { useNotes } from '../notes/notesStore';
import { CoachMarks } from '../../components/CoachMarks';
import { useAtlasModel } from './data';
import { Badge, ErrorState, IconBtn } from './_ui';
import { CONCERN_LABEL, PHASE_LABEL, kpaTo, parsePressure } from './format';
import { describeView, diffSummary } from './science';
import './atlas.css';

/* The shell mounts the one persistent AudioBar on /atlas (OV-1 B7), so the workspace never mounts a second. */

const HABITATS: ScenarioId[] = ['earth-iss', 'lunar-cabin-example', 'exploration-upper', 'suit', 'custom'];
const PHASES: FuelPhase[] = ['solid', 'liquid-droplet', 'gas', 'aerosol'];
const TABS: { id: PanelTab; label: string; icon: typeof Rows }[] = [
  { id: 'studies', label: 'Studies', icon: Rows },
  { id: 'selection', label: 'Selection', icon: Selection },
  { id: 'ledger', label: 'Caught by code', icon: Prohibit },
  { id: 'notes', label: 'Notes', icon: NotePencil },
];

function CustomAir() {
  const custom = useAtlas((s) => s.custom);
  const unit = useAtlas((s) => s.unit);
  const set = useAtlas((s) => s.set);
  const [o2, setO2] = useState(String(custom.o2Pct));
  const [p, setP] = useState(`${kpaTo(unit, custom.totalKpa).toFixed(unit === 'mmHg' ? 0 : 1)} ${unit}`);
  useEffect(() => { setO2(String(Number(custom.o2Pct.toFixed(1)))); setP(`${kpaTo(unit, custom.totalKpa).toFixed(unit === 'mmHg' ? 0 : 1)} ${unit}`); }, [custom, unit]);
  const o2n = Number(o2);
  const o2Bad = o2.trim() === '' || !Number.isFinite(o2n) || o2n <= 0 || o2n > 100;
  const kpa = parsePressure(p, unit);
  const commit = () => {
    if (!o2Bad && kpa != null) set({ custom: { o2Pct: o2n, totalKpa: kpa } });
  };
  return (
    <span className="fa-field" role="group" aria-label="Custom air">
      <label className="fa-bar__label" htmlFor="fa-custom-o2">O₂ %</label>
      <input id="fa-custom-o2" className="fa-input fa-input--num" inputMode="decimal" value={o2} aria-invalid={o2Bad} onChange={(e) => setO2(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') commit(); }} />
      <label className="fa-bar__label" htmlFor="fa-custom-p">Pressure</label>
      <input id="fa-custom-p" className="fa-input" style={{ width: 104 }} value={p} aria-invalid={kpa == null} aria-describedby="fa-custom-hint" onChange={(e) => setP(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') commit(); }} />
      <span id="fa-custom-hint" className="fa-muted fa-mono" style={{ fontSize: 11 }}>{kpa == null ? 'try 10.2 psi, 0.7 atm, 530 mmHg' : `= ${kpa.toFixed(1)} kPa`}</span>
    </span>
  );
}

export default function AtlasWorkspace() {
  const model = useAtlasModel();
  const habitat = useAtlas((s) => s.habitat);
  const concern = useAtlas((s) => s.concern);
  const fuelFilter = useAtlas((s) => s.fuelFilter);
  const unit = useAtlas((s) => s.unit);
  const tol = useAtlas((s) => s.tolerances);
  const panelTab = useAtlas((s) => s.panelTab);
  const selectedRowId = useAtlas((s) => s.selectedRowId);
  const highlighted = useAtlas((s) => s.highlightedRowIds);
  const timelineYear = useAtlas((s) => s.timelineYear);
  const boxSelection = useAtlas((s) => s.boxSelection);
  const set = useAtlas((s) => s.set);
  const notes = useNotes();
  const location = useLocation();
  const fromBriefing = (location.state as { fromBriefing?: boolean } | null)?.fromBriefing === true;
  const root = useRef<HTMLDivElement>(null);
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [sheetH, setSheetH] = useState(320);
  const [changed, setChanged] = useState<string | null>(null);
  const snap = useRef<{ key: string; nearby: number; top: string | null } | null>(null);
  const dragRef = useRef<{ y: number; h: number } | null>(null);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  /* The shell docks the AudioBar under <main>. Publish its height and the top bar's bottom edge so the fixed sheet and drawer leave room for both. */
  useEffect(() => {
    const element = root.current; if (!element) return;
    let observer: ResizeObserver | null = null, watched: Element | null = null;
    const measure = () => {
      const main = document.getElementById('main'), bar = document.querySelector('[data-audio-bar]');
      element.style.setProperty('--shell-top', `${Math.round(main?.getBoundingClientRect().top ?? 0)}px`);
      element.style.setProperty('--fa-audio-h', `${Math.round(bar?.getBoundingClientRect().height ?? 0)}px`);
      if (bar && bar !== watched) { observer?.disconnect(); watched = bar; observer = new ResizeObserver(measure); observer.observe(bar); }
    };
    measure();
    const poll = window.setInterval(measure, 400); // the bar is lazy, so it may arrive after first paint
    window.addEventListener('resize', measure);
    return () => { window.clearInterval(poll); window.removeEventListener('resize', measure); observer?.disconnect(); };
  }, []);

  /* "What changed" pill after a habitat switch (SPEC section 7). Code written diff. */
  useEffect(() => {
    if (model.status !== 'ready') return;
    const cur = { key: habitat, nearby: model.nearbyCount, top: model.topLabel };
    const prev = snap.current;
    if (prev && prev.key !== cur.key) setChanged(diffSummary(prev, cur));
    snap.current = cur;
  }, [model.status, habitat, model.nearbyCount, model.topLabel]);
  useEffect(() => {
    if (!changed) return;
    const t = window.setTimeout(() => setChanged(null), 12000);
    return () => window.clearTimeout(t);
  }, [changed]);

  const scenario = model.scenario;
  const others = useMemo(() => Object.values(PRESETS).filter((s) => s.id !== scenario.id), [scenario.id]);
  const rows = model.corpus?.rows ?? [];
  const seeing = useMemo(
    () => (model.status === 'ready' ? describeView(scenario, concern, { total: model.rows.length, near: model.nearbyCount, unit, fuelFilter }) : ''),
    [model.status, model.rows.length, model.nearbyCount, scenario, concern, unit, fuelFilter],
  );
  const exportHref = `/brief/${habitat}?${writeUrl('')}`;
  const cutoff = timelineYear ? `${timelineYear}-12-31` : null;

  const toggleFuel = (p: FuelPhase) => set({ fuelFilter: fuelFilter.includes(p) ? fuelFilter.filter((x) => x !== p) : [...fuelFilter, p] });

  /* resizable sheet (tablet) */
  const maxH = () => Math.round(window.innerHeight * 0.85);
  const clampH = (h: number) => Math.max(88, Math.min(maxH(), h));
  const onHandleDown = (e: PointerEvent<HTMLButtonElement>) => { dragRef.current = { y: e.clientY, h: sheetH }; e.currentTarget.setPointerCapture(e.pointerId); };
  const onHandleMove = (e: PointerEvent<HTMLButtonElement>) => { if (dragRef.current) setSheetH(clampH(dragRef.current.h + (dragRef.current.y - e.clientY))); };
  const onHandleUp = () => { dragRef.current = null; };
  const onHandleKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowUp') { e.preventDefault(); setSheetH((h) => clampH(h + 48)); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSheetH((h) => clampH(h - 48)); }
  };

  const counts: Partial<Record<PanelTab, number>> = { studies: model.ranked.length, selection: boxSelection.length, ledger: model.corpus?.rejects.length, notes: notes.length };

  return (
    <div ref={root} className="fa fa-atlas" style={{ ['--fa-sheet-h' as string]: `${sheetH}px` }}>
      <CoachMarks autoStart={fromBriefing} />
      {/* scenario bar */}
      <header className="fa-bar" aria-label="Scenario">
        <span className="fa-field">
          <label className="fa-bar__label" htmlFor="fa-habitat">Habitat</label>
          <select id="fa-habitat" className="fa-select" value={habitat} onChange={(e) => set({ habitat: e.target.value as ScenarioId })} title={habitat === 'custom' ? 'Set by you' : `${PRESETS[habitat].sourceNote}. Illustrative, not a design value.`}>
            {HABITATS.map((h) => <option key={h} value={h}>{h === 'custom' ? 'Custom air' : PRESETS[h].label}</option>)}
          </select>
        </span>
        {habitat === 'custom' && <CustomAir />}
        <span className="fa-field">
          <label className="fa-bar__label" htmlFor="fa-concern">Concern</label>
          <select id="fa-concern" className="fa-select" value={concern} onChange={(e) => set({ concern: e.target.value as typeof concern })}>
            {(Object.keys(CONCERN_LABEL) as (keyof typeof CONCERN_LABEL)[]).map((c) => <option key={c} value={c}>{CONCERN_LABEL[c]}</option>)}
          </select>
        </span>
        <span className="fa-field" role="group" aria-label="Fuel filter">
          <span className="fa-bar__label">Fuel</span>
          {PHASES.map((p) => (
            <button key={p} type="button" className="fa-chip" aria-pressed={fuelFilter.includes(p)} onClick={() => toggleFuel(p)}>{PHASE_LABEL[p]}</button>
          ))}
          {fuelFilter.length === 0 && <span className="fa-muted" style={{ fontSize: 12 }}>all fuels</span>}
        </span>
        <span className="fa-field">
          <label className="fa-bar__label" htmlFor="fa-unit">Units</label>
          <select id="fa-unit" className="fa-select" value={unit} onChange={(e) => set({ unit: e.target.value as typeof unit })}>
            {(['kPa', 'psi', 'atm', 'mmHg'] as const).map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </span>
        <span className="fa-bar__spacer" />
        {model.corpus?.fixture && <Badge kind="fixture" />}
        {model.noAi && <span className="fa-chip">NO-AI</span>}
        {!online && <span className="fa-chip" title="Static data still works offline">OFFLINE</span>}
        <Link className="fa-btn" to="/briefing">New briefing</Link>
        <Link className="fa-btn fa-btn--primary" to={exportHref}><Export size={14} /> Export brief</Link>
      </header>

      {/* what you are seeing, hero */}
      <section className="fa-seeing" aria-label="What you are seeing">
        {model.status === 'loading' && <div className="fa-skel" style={{ height: 18, width: '70%' }} role="status" aria-label="Loading summary" />}
        {model.status === 'error' && <p className="fa-flag">The data file did not load, so the summary is unavailable.</p>}
        {model.status === 'ready' && (
          <>
            <p className="fa-seeing__line" aria-live="polite">
              <span className="fa-bar__label" style={{ marginRight: 8 }}>What you are seeing</span>
              {seeing}
            </p>
            {model.gap.allowed && model.gap.sentence ? (
              <>
                <h1 className="fa-hero">{model.gap.sentence} <Badge kind="code" /></h1>
                <p className="fa-hero__scope">{model.gap.scopeLine}</p>
              </>
            ) : (
              <p className="fa-muted" style={{ fontSize: 12 }}>
                Gap sentence withheld until a human signs it off (gate K5). Count by code: <span className="fa-num">{model.gap.counts.rowsNear}</span> rows cover this air.
              </p>
            )}
            {changed && (
              <p className="fa-pill" role="status">
                What changed: {changed}
                <IconBtn label="Dismiss" onClick={() => setChanged(null)}><X size={12} /></IconBtn>
              </p>
            )}
            <p className="fa-muted" style={{ fontSize: 11.5 }}>
              {scenario.sourceNote}. Illustrative, not a design value. Gravity: microgravity (ISS). Partial-gravity combustion data: none in PSI.
            </p>
          </>
        )}
      </section>

      {/* map and panel */}
      <div className="fa-main">
        <div className="fa-map" aria-label="Gap Map">
          {model.status === 'loading' && <div className="fa-skel" style={{ width: '100%', height: '100%' }} role="status" aria-label="Loading the Gap Map" />}
          {model.status === 'error' && <div style={{ padding: 16 }}><ErrorState message={model.message} stillWorks="the About, Method and Credits pages." onRetry={model.retry} /></div>}
          {model.status === 'ready' && (
            <GapMap
              rows={rows}
              scenario={scenario}
              tolerances={tol}
              otherScenarios={others}
              selectedRowId={selectedRowId}
              highlightedRowIds={highlighted}
              phaseFilter={fuelFilter.length ? fuelFilter : undefined}
              timelineCutoff={cutoff}
              unit={unit}
              editableBox={habitat === 'custom'}
              coach
              fill
              onTolerancesChange={(next) => set({ tolerances: next })}
              onSelectRow={(id) => set({ selectedRowId: id })}
              onBoxSelect={(ids) => set({ boxSelection: ids, panelTab: ids.length ? 'selection' : panelTab })}
              onScenarioDrag={(next) => set({ habitat: 'custom', custom: next })}
              onHoverRow={(id) => set({ highlightedRowIds: id ? [id] : [] })}
            />
          )}
        </div>

        <aside className="fa-panel" aria-label="Side panel">
          <button type="button" className="fa-handle" role="separator" aria-orientation="horizontal" aria-label="Resize panel" aria-valuemin={88} aria-valuemax={Math.round((typeof window === 'undefined' ? 800 : window.innerHeight) * 0.85)} aria-valuenow={sheetH} onPointerDown={onHandleDown} onPointerMove={onHandleMove} onPointerUp={onHandleUp} onKeyDown={onHandleKey}>
            <ArrowsOutLineVertical size={12} /> drag or use arrow keys
          </button>
          <Tabs.Root value={panelTab} onValueChange={(v) => set({ panelTab: v as PanelTab })} style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
            <Tabs.List className="fa-tabs" aria-label="Panel">
              {TABS.map((t) => (
                <Tabs.Trigger key={t.id} value={t.id} className="fa-tab" data-coach={t.id === 'studies' ? 'studies' : undefined}>
                  <t.icon size={14} aria-hidden="true" />
                  {t.label}
                  {counts[t.id] != null && <span className="fa-num fa-muted" style={{ fontSize: 11 }}>{counts[t.id]}</span>}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            <Tabs.Content value="studies" className="fa-tabpanel"><StudiesTab /></Tabs.Content>
            <Tabs.Content value="selection" className="fa-tabpanel"><SelectionTab /></Tabs.Content>
            <Tabs.Content value="ledger" className="fa-tabpanel"><LedgerTab /></Tabs.Content>
            <Tabs.Content value="notes" className="fa-tabpanel"><NotesTab /></Tabs.Content>
          </Tabs.Root>
        </aside>
      </div>

      {/* timeline and audio */}
      <footer className="fa-bottom">
        <Timeline rows={rows} value={timelineYear} onChange={(v) => set({ timelineYear: v })} />
      </footer>

      <EvidenceDrawer rowId={selectedRowId} onClose={() => set({ selectedRowId: null })} />
    </div>
  );
}

