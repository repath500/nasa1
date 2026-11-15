import { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { Play } from '@phosphor-icons/react';
import type { FuelPhase, Scenario, ScenarioId, TestRow, Tolerances } from '@fire/contracts';
import { overlap } from '@fire/core';
import { createMission, type MatchClass, type MissionApi, type MissionDest, type MissionView as View } from './engine';
import './mission.css';

/**
 * Mission view: the planning prototype's dithered stage inside the Atlas, on the same data, habitat, filters and
 * selection as the Gap Map. Clicking a flame selects the row (the Atlas opens its evidence drawer).
 */
export interface MissionViewProps {
  rows: TestRow[];
  habitat: ScenarioId;
  scenario: Scenario;
  tolerances: Tolerances;
  selectedRowId: string | null;
  highlightedRowIds: string[];
  phaseFilter: FuelPhase[];
  onSelectRow: (id: string | null) => void;
  onHoverRow: (id: string | null) => void;
}

const VIEWS: { id: View; label: string; hint: string }[] = [
  { id: 'orbit', label: 'Orbit', hint: 'Tests circle Earth; the ones run in air like this habitat travel to it' },
  { id: 'map', label: 'Air map', hint: 'Oxygen across, pressure up' },
  { id: 'ladder', label: 'Oxygen ladder', hint: 'Every test stacked by oxygen' },
  { id: 'time', label: 'Timeline', hint: 'Every test by the year it ran' },
];
const LEGEND: { cls: string; label: string }[] = [
  { cls: 'drop', label: 'Liquid droplet' }, { cls: 'solid', label: 'Solid' }, { cls: 'gas', label: 'Gas' }, { cls: 'burner', label: 'Burner-stream O₂ (not cabin air)' },
];

function destFor(habitat: ScenarioId, scenario: Scenario, tol: Tolerances): MissionDest {
  const body = habitat === 'lunar-cabin-example' || habitat === 'suit' ? 'moon' : habitat === 'exploration-upper' ? 'mars' : habitat === 'earth-iss' ? 'earth' : null;
  return { key: habitat === 'suit' ? 'suit' : habitat, name: scenario.label, o2Pct: scenario.o2Pct, totalKpa: scenario.totalKpa, body, o2Points: tol.o2PctPoints, pressureFrac: tol.pressureFrac };
}

export default function MissionView(props: MissionViewProps) {
  const { rows, habitat, scenario, tolerances, selectedRowId, highlightedRowIds, phaseFilter, onSelectRow, onHoverRow } = props;
  const reduce = !!useReducedMotion();
  const canvas = useRef<HTMLCanvasElement>(null), labels = useRef<HTMLDivElement>(null), api = useRef<MissionApi | null>(null);
  const handlers = useRef({ onSelectRow, onHoverRow }); handlers.current = { onSelectRow, onHoverRow };
  const [view, setView] = useState<View>('orbit');
  const [year, setYear] = useState<number | null>(null);
  const [tip, setTip] = useState<{ row: TestRow; x: number; y: number } | null>(null);
  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);
  const byIdRef = useRef(byId); byIdRef.current = byId;

  const classify = useMemo(() => (row: TestRow): MatchClass => {
    const cls = overlap(row, scenario, tolerances);
    return cls === 'covers' ? 'match' : cls === 'unknown' ? 'unknown' : cls === 'excluded-burner' ? 'burner' : 'none';
  }, [scenario, tolerances]);
  const counts = useMemo(() => {
    let match = 0, unknown = 0;
    for (const r of rows) { const c = classify(r); if (c === 'match') match++; else if (c === 'unknown') unknown++; }
    return { match, unknown };
  }, [rows, classify]);

  useEffect(() => {
    if (!canvas.current || !labels.current) return;
    const bounds = () => canvas.current!.parentElement!.getBoundingClientRect();
    api.current = createMission(canvas.current, labels.current, {
      onHover: (id, x, y) => {
        handlers.current.onHoverRow(id);
        const row = id ? byIdRef.current.get(id) : undefined; const b = bounds();
        setTip(row ? { row, x: x - b.left, y: y - b.top } : null);
      },
      onSelect: (id) => handlers.current.onSelectRow(id),
      onReplayYear: (y) => setYear(y),
    }, reduce);
    return () => { api.current?.destroy(); api.current = null; };
  }, [reduce]);

  useEffect(() => { api.current?.setData(rows, classify); }, [rows, classify]);
  const destKey = `${habitat}|${scenario.o2Pct}|${scenario.totalKpa}|${tolerances.o2PctPoints}|${tolerances.pressureFrac}`;
  const firstDest = useRef(true);
  useEffect(() => { api.current?.setDest(destFor(habitat, scenario, tolerances), firstDest.current); firstDest.current = false; /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [destKey]);
  useEffect(() => { api.current?.setView(view); }, [view]);
  useEffect(() => { api.current?.setSelected(selectedRowId); }, [selectedRowId]);
  useEffect(() => { api.current?.setHighlights(highlightedRowIds); }, [highlightedRowIds]);
  useEffect(() => { api.current?.setPhaseFilter(phaseFilter); }, [phaseFilter]);

  const fmt = (r: { min: number | null; max: number | null }, unit: string) =>
    r.min === null && r.max === null ? 'not reported' : r.min === null || r.max === null || r.min === r.max ? `${r.min ?? r.max}${unit}` : `${r.min} to ${r.max}${unit}`;

  return (
    <div className="mv" data-testid="mission-view">
      <div className="mv-bar">
        <div className="mv-seg" role="group" aria-label="Mission view">
          {VIEWS.map((v) => (
            <button key={v.id} type="button" aria-pressed={view === v.id} title={v.hint} onClick={() => setView(v.id)}>{v.label}</button>
          ))}
        </div>
        <button type="button" className="mv-btn" onClick={() => api.current?.replay()} disabled={reduce} title={reduce ? 'Replay is off because reduced motion is on' : 'Watch the tests appear by the date they ran'}>
          <Play size={13} weight="fill" aria-hidden /> Replay by date
        </button>
        <p className="mv-count" aria-live="polite">
          <b>{counts.match}</b> tests inside {/air$/i.test(scenario.label) ? scenario.label : `${scenario.label} air`}{counts.unknown ? <span> · {counts.unknown} cannot be placed</span> : null}
        </p>
      </div>
      <div className="mv-stage">
        <canvas ref={canvas} className="mv-canvas" role="img" aria-label={`Dithered mission view, ${VIEWS.find((v) => v.id === view)!.label}. ${counts.match} tests are inside the ${scenario.label} window. Use the Gap Map table view for a list.`} />
        <div ref={labels} className="mv-labels" aria-hidden />
        {year !== null && <div className="mv-year" aria-live="polite">{year}</div>}
        {tip && (
          <div className="mv-tip" style={{ transform: `translate(${Math.round(tip.x + 14)}px, ${Math.round(tip.y + 12)}px)` }} role="tooltip">
            <b>{tip.row.accession} {tip.row.testLabel ?? ''}</b>
            <span>{tip.row.fuel.name ?? 'fuel not named'} · {tip.row.fuel.phase}</span>
            <span>O₂ {fmt(tip.row.o2Pct, '%')} ({tip.row.o2Location}) · pressure {fmt(tip.row.pressureKpa, ' kPa')}</span>
            <span className="mv-tip-hint">Click to open the source row</span>
          </div>
        )}
      </div>
      <ul className="mv-legend" aria-label="Legend">
        {LEGEND.map((l) => <li key={l.cls}><i className={`mv-dot mv-${l.cls}`} aria-hidden />{l.label}</li>)}
        <li className="mv-legend-note">Bright: inside this air. Dim: outside or cannot be placed. Planets are illustrations; a flame's place in orbit has no meaning.</li>
      </ul>
    </div>
  );
}
