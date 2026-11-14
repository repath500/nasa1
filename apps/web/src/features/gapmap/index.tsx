import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { MagnifyingGlassMinus, MagnifyingGlassPlus } from '@phosphor-icons/react';
import { scaleLinear, scaleLog } from 'd3-scale';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';
import { quadtree } from 'd3-quadtree';
import type { FuelPhase, GapMapProps, Scenario, TestRow } from '@fire/contracts';
import { boxHit, formatPressure, groupRows, midpoint, nearestDirectional, pressureAxisTicks, pressureValue, type RowGroup } from './helpers';
import TableView from './TableView';
import { exportFooter, saveChart } from './export';
import './style.css';

const WIDTH = 900, HEIGHT = 500, LEFT = 115, RIGHT = 865, TOP = 35, BOTTOM = 410;
const phases: FuelPhase[] = ['liquid-droplet', 'solid', 'gas', 'aerosol', 'unknown'];
const names: Record<FuelPhase, string> = { 'liquid-droplet': 'Droplet', solid: 'Solid', gas: 'Gas', aerosol: 'Aerosol', unknown: 'Unknown' };
const colors: Record<FuelPhase, string> = { 'liquid-droplet': '--color-droplet', solid: '--color-solid', gas: '--color-gas', aerosol: '--color-aerosol', unknown: '--color-unknown' };
type Point = { x: number; y: number; group: RowGroup };
const links = new Map<string, Set<(transform: ZoomTransform) => void>>();

function mark(context: CanvasRenderingContext2D, phase: FuelPhase, x: number, y: number, hollow: boolean) {
  context.beginPath();
  if (phase === 'solid') context.rect(x - 5, y - 5, 10, 10);
  else if (phase === 'gas') { context.moveTo(x, y - 6); context.lineTo(x + 6, y + 5); context.lineTo(x - 6, y + 5); context.closePath(); }
  else if (phase === 'aerosol') { context.moveTo(x, y - 6); context.lineTo(x + 6, y); context.lineTo(x, y + 6); context.lineTo(x - 6, y); context.closePath(); }
  else context.arc(x, y, 5, 0, Math.PI * 2);
  if (!hollow) context.fill(); context.stroke();
}

type GapMapPropsExt = GapMapProps & { citation?: { corpusHash: string; sourcesLine: string; dateIso: string } };

export default function GapMap(props: GapMapPropsExt) {
  const { rows, scenario, unit, compact, linkKey } = props;
  const [localTolerances, setLocalTolerances] = useState(props.tolerances);
  useEffect(() => setLocalTolerances(props.tolerances), [props.tolerances]);
  const tolerances = props.editableBox ? localTolerances : props.tolerances;
  const canvas = useRef<HTMLCanvasElement>(null), surface = useRef<SVGSVGElement>(null), transform = useRef<ZoomTransform>(zoomIdentity);
  const clipId = `gapmap-${useId().replaceAll(':', '')}`;
  const receiving = useRef(false);
  const behavior = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null), frame = useRef(0), points = useRef<Point[]>([]);
  const tree = useRef<ReturnType<typeof quadtree<Point>> | null>(null), drag = useRef<{ x: number; y: number } | null>(null);
  const [revision, setRevision] = useState(0), [linear, setLinear] = useState(false), [table, setTable] = useState(false), [explain, setExplain] = useState(false);
  const [hidden, setHidden] = useState<FuelPhase[]>([]), [hover, setHover] = useState<Point | null>(null), [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [spider, setSpider] = useState<string | null>(null), [selection, setSelection] = useState<{ x: number; y: number; x2: number; y2: number } | null>(null);
  const [navigation, setNavigation] = useState(false);
  const [navigationPoint, setNavigationPoint] = useState<Point | null>(null);
  const [selectArea, setSelectArea] = useState(false);
  const boxDrag = useRef<{ kind: string; x: number; y: number; pressure: number; oxygen: number } | null>(null);
  const minimapDrag = useRef(false);
  const groups = useMemo(() => groupRows(rows), [rows]);
  const solidMaximum = useMemo(() => {
    const values = rows.filter(row => row.fuel.phase === 'solid' && row.o2Location === 'ambient').map(row => row.o2Pct.max ?? row.o2Pct.min).filter((value): value is number => value !== null);
    return values.length ? Math.max(...values) : null;
  }, [rows]);
  const maxPressure = Math.max(150, scenario.totalKpa * 1.5, ...rows.map(row => midpoint(row.pressureKpa) ?? 0));
  const maxOxygen = Math.max(45, scenario.o2Pct + 10, ...rows.map(row => midpoint(row.o2Pct) ?? 0));
  const xbase = useMemo(() => (linear ? scaleLinear() : scaleLog()).domain(linear ? [0, maxPressure * 1.1] : [1, maxPressure * 1.1]).range([LEFT, RIGHT]), [linear, maxPressure]);
  const ybase = useMemo(() => scaleLinear().domain([0, Math.min(110, maxOxygen * 1.1)]).range([BOTTOM, TOP]), [maxOxygen]);
  const x = transform.current.rescaleX(xbase), y = transform.current.rescaleY(ybase);
  const selected = useMemo(() => new Set(props.highlightedRowIds ?? []), [props.highlightedRowIds]);
  const draw = useCallback(() => {
    const element = canvas.current; if (!element) return;
    const ratio = window.devicePixelRatio || 1, bounds = element.getBoundingClientRect();
    element.width = Math.round(bounds.width * ratio); element.height = Math.round(bounds.height * ratio);
    const context = element.getContext('2d'); if (!context) return;
    context.setTransform(element.width / WIDTH, 0, 0, element.height / HEIGHT, 0, 0); context.clearRect(0, 0, WIDTH, HEIGHT);
    const xs = transform.current.rescaleX(xbase), ys = transform.current.rescaleY(ybase), computed = getComputedStyle(element);
    const plotted: Point[] = [];
    for (const group of groups) {
      const row = group.rows[0]; if (!row) continue;
      const pointX = group.pressure === null ? LEFT - 34 : xs(group.pressure), pointY = group.oxygen === null ? BOTTOM + 28 : ys(group.oxygen);
      if (pointX < LEFT - 40 || pointX > RIGHT || pointY < TOP || pointY > BOTTOM + 35) continue;
      const active = !hidden.includes(row.fuel.phase) && (!props.phaseFilter?.length || props.phaseFilter.includes(row.fuel.phase));
      const highlighted = group.rows.some(item => selected.has(item.id));
      const faded = props.timelineCutoff && (!row.date || row.date > props.timelineCutoff);
      context.globalAlpha = (active ? 1 : 0.1) * (selected.size && !highlighted ? 0.2 : 1) * (faded ? 0.16 : 1);
      context.fillStyle = computed.getPropertyValue(row.o2Location === 'burner' ? '--color-burner' : colors[row.fuel.phase]).trim() || '#8a94a3'; context.strokeStyle = context.fillStyle; context.lineWidth = 1.5;
      if (highlighted || group.rows.some(item => item.id === props.selectedRowId)) { context.shadowColor = context.fillStyle; context.shadowBlur = 14; }
      mark(context, row.fuel.phase, pointX, pointY, row.o2Location === 'burner'); context.shadowBlur = 0;
      if (group.rows.some(item => item.id === props.selectedRowId)) { context.beginPath(); context.arc(pointX, pointY, 10, 0, Math.PI * 2); context.stroke(); }
      if (group.rows.length > 1) { context.font = 'bold 11px sans-serif'; context.fillText(String(group.rows.length), pointX + 7, pointY - 7); }
      plotted.push({ x: pointX, y: pointY, group });
    }
    context.globalAlpha = 1; points.current = plotted; tree.current = quadtree<Point>().x(point => point.x).y(point => point.y).addAll(plotted);
  }, [groups, hidden, props.phaseFilter, props.selectedRowId, props.timelineCutoff, selected, xbase, ybase]);
  const schedule = useCallback(() => { cancelAnimationFrame(frame.current); frame.current = requestAnimationFrame(() => { draw(); setRevision(value => value + 1); }); }, [draw]);
  useEffect(() => { draw(); const observer = new ResizeObserver(draw); if (canvas.current) observer.observe(canvas.current); return () => { observer.disconnect(); cancelAnimationFrame(frame.current); }; }, [draw]);
  useEffect(() => {
    const element = surface.current; if (!element) return;
    const zoomer = zoom<SVGSVGElement, unknown>().scaleExtent([1, 40]).extent([[LEFT, TOP], [RIGHT, BOTTOM]]).filter(event => (!event.shiftKey || event.type === 'dblclick') && !selectArea && !boxDrag.current && !minimapDrag.current).on('zoom', event => {
      transform.current = event.transform; schedule();
      if (linkKey && !receiving.current) links.get(linkKey)?.forEach(listener => listener(event.transform));
    });
    behavior.current = zoomer; select(element).call(zoomer).call(zoomer.transform, transform.current);
    const receive = (next: ZoomTransform) => { if (next === transform.current) return; receiving.current = true; select(element).call(zoomer.transform, next); receiving.current = false; };
    if (linkKey) { const listeners = links.get(linkKey) ?? new Set(); listeners.add(receive); links.set(linkKey, listeners); }
    return () => { select(element).on('.zoom', null); if (linkKey) links.get(linkKey)?.delete(receive); };
  }, [linkKey, schedule, selectArea]);
  const changeZoom = (factor: number) => { if (surface.current && behavior.current) select(surface.current).call(behavior.current.scaleBy, factor); };
  const reset = () => { if (surface.current && behavior.current) select(surface.current).call(behavior.current.transform, zoomIdentity); };
  const fit = (target: Scenario) => {
    const left = xbase(Math.max(linear ? 0 : 1, target.totalKpa * (1 - tolerances.pressureFrac))), right = xbase(target.totalKpa * (1 + tolerances.pressureFrac));
    const top = ybase(target.o2Pct + tolerances.o2PctPoints), bottom = ybase(target.o2Pct - tolerances.o2PctPoints);
    const scale = Math.min(40, Math.max(1, Math.min((RIGHT - LEFT) / ((right - left) * 1.4), (BOTTOM - TOP) / ((bottom - top) * 1.4))));
    const next = zoomIdentity.translate((LEFT + RIGHT) / 2 - scale * (left + right) / 2, (TOP + BOTTOM) / 2 - scale * (top + bottom) / 2).scale(scale);
    if (surface.current && behavior.current) { const element = surface.current, zoomer = behavior.current, start = transform.current, started = performance.now(); const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450; const animate = (now: number) => { const progress = duration ? Math.min(1, (now - started) / duration) : 1, eased = 1 - (1 - progress) ** 3; const current = zoomIdentity.translate(start.x + (next.x - start.x) * eased, start.y + (next.y - start.y) * eased).scale(start.k + (next.k - start.k) * eased); select(element).call(zoomer.transform, current); if (progress < 1) requestAnimationFrame(animate); }; requestAnimationFrame(animate); }
  };
  const coordinates = (event: React.MouseEvent<SVGSVGElement>) => { const bounds = event.currentTarget.getBoundingClientRect(); return { x: (event.clientX - bounds.left) * WIDTH / bounds.width, y: (event.clientY - bounds.top) * HEIGHT / bounds.height }; };
  const box = (target: Scenario, faint: boolean) => { const left = x(target.totalKpa * (1 - tolerances.pressureFrac)), right = x(target.totalKpa * (1 + tolerances.pressureFrac)), top = y(target.o2Pct + tolerances.o2PctPoints), bottom = y(target.o2Pct - tolerances.o2PctPoints); return <g key={target.id} opacity={faint ? .3 : 1}><rect x={left} y={top} width={right - left} height={bottom - top} fill="var(--color-accent)" fillOpacity=".08" stroke="var(--color-accent)" strokeWidth="2" tabIndex={!faint && props.editableBox ? 0 : undefined} aria-label={!faint && props.editableBox ? 'Editable habitat box. Use arrow keys to move.' : undefined} onKeyDown={event => { if (!props.editableBox || faint || !event.key.startsWith('Arrow')) return; event.stopPropagation(); event.preventDefault(); const step = event.shiftKey ? 5 : 1; props.onScenarioDrag?.({ totalKpa: Math.max(1, target.totalKpa + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0)), o2Pct: Math.max(0, Math.min(100, target.o2Pct + (event.key === 'ArrowUp' ? step : event.key === 'ArrowDown' ? -step : 0))) }); }} /><text x={left + 4} y={top - 5}>{target.label}</text>{!faint && props.editableBox && [left, (left + right) / 2, right].flatMap(horizontal => [top, bottom].map(vertical => <rect key={`${horizontal}:${vertical}`} x={horizontal - 4} y={vertical - 4} width="8" height="8" fill="var(--color-accent)" />))}</g>; };
  const handleKey = (event: React.KeyboardEvent) => {
    if (event.key.toLowerCase() === 'm') { event.preventDefault(); setNavigation(current => !current); setNavigationPoint(points.current[0] ?? null); return; }
    if (navigation && event.key.startsWith('Arrow')) { event.preventDefault(); setNavigationPoint(current => current ? nearestDirectional(points.current, current, event.key) ?? current : points.current[0] ?? null); return; }
    if (navigation && event.key === 'Enter') { props.onSelectRow?.(navigationPoint?.group.rows[0]?.id ?? null); return; }
    if (event.key === '+' || event.key === '=') changeZoom(2); else if (event.key === '-') changeZoom(.5); else if (event.key === '0') reset(); else if (event.key.startsWith('Arrow') && surface.current && behavior.current) { event.preventDefault(); const step = event.shiftKey ? 80 : 20; select(surface.current).call(behavior.current.translateBy, event.key === 'ArrowLeft' ? step : event.key === 'ArrowRight' ? -step : 0, event.key === 'ArrowUp' ? step : event.key === 'ArrowDown' ? -step : 0); }
  };
  const toggle = (phase: FuelPhase, solo: boolean) => setHidden(current => solo ? phases.filter(item => item !== phase) : current.includes(phase) ? current.filter(item => item !== phase) : [...current, phase]);
  void revision;
  return <section className={`gapmap ${props.className ?? ''}`} aria-label="Gap map">
    {!compact && <div className="gapmap-toolbar"><button onClick={() => setLinear(value => !value)}>{linear ? 'Linear pressure' : 'Log pressure'}</button><button onClick={() => changeZoom(2)} aria-label="Zoom in" title="Zoom in"><MagnifyingGlassPlus size={20}/></button><button onClick={() => changeZoom(.5)} aria-label="Zoom out" title="Zoom out"><MagnifyingGlassMinus size={20}/></button><button onClick={reset}>Fit all</button><button onClick={() => fit(scenario)}>Zoom to habitat</button><button aria-pressed={selectArea} onClick={() => setSelectArea(value => !value)}>Select area</button><button onClick={() => setTable(value => !value)}>{table ? 'Map view' : 'Table view'}</button><button onClick={() => setExplain(value => !value)}>Explain this chart</button><button onClick={() => { if (canvas.current && surface.current) void saveChart(canvas.current, surface.current, exportFooter(props.citation, rows.map(row => row.csvSha12))); }}>Save image</button></div>}
    {rows.some(row => row.fixture) && <strong className="gapmap-fixture">FIXTURE</strong>}
    <p className="gapmap-sr" aria-live="polite">{navigation ? `Mark navigation. ${navigationPoint?.group.rows[0]?.accession ?? 'No mark'} ${navigationPoint?.group.rows[0]?.testLabel ?? ''}` : `${rows.length} test rows. ${rows.filter(row => midpoint(row.pressureKpa) === null).length} have no reported pressure; ${rows.filter(row => midpoint(row.o2Pct) === null).length} have no reported oxygen. ${scenario.label} is selected.`}</p>
    {table ? <TableView rows={rows.filter(row => !hidden.includes(row.fuel.phase) && (!props.phaseFilter?.length || props.phaseFilter.includes(row.fuel.phase)) && (!props.timelineCutoff || !!row.date && row.date <= props.timelineCutoff))} unit={unit} onSelect={props.onSelectRow} /> : <div className="gapmap-chart">
      <canvas ref={canvas} aria-hidden="true" />
      <svg ref={surface} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} tabIndex={0} role="application" aria-label="Interactive gap map. Use plus and minus to zoom, arrows to pan, zero to reset, and M for mark navigation." onKeyDown={handleKey}
        onPointerMove={event => {
          const position = coordinates(event);
          setCursor(position);
          if (boxDrag.current) {
            const start = boxDrag.current;
            if (start.kind === 'move') {
              props.onScenarioDrag?.({ totalKpa: Math.max(1, start.pressure + x.invert(position.x) - x.invert(start.x)), o2Pct: Math.max(0, Math.min(100, start.oxygen + y.invert(position.y) - y.invert(start.y))) });
            } else {
              setLocalTolerances(current => ({
                ...current,
                pressureFrac: /[ew]/.test(start.kind) ? Math.max(.01, Math.min(.95, Math.abs(x.invert(position.x) - start.pressure) / start.pressure)) : current.pressureFrac,
                o2PctPoints: /[ns]/.test(start.kind) ? Math.max(.1, Math.min(50, Math.abs(y.invert(position.y) - start.oxygen))) : current.o2PctPoints,
              }));
              props.onScenarioDrag?.({ totalKpa: start.pressure, o2Pct: start.oxygen });
            }
            return;
          }
          if (minimapDrag.current && surface.current && behavior.current) {
            const baseX = LEFT + (position.x - 700) / 150 * (RIGHT - LEFT);
            const baseY = TOP + (position.y - 300) / 75 * (BOTTOM - TOP);
            const current = transform.current;
            select(surface.current).call(behavior.current.transform, zoomIdentity.translate((LEFT + RIGHT) / 2 - current.k * baseX, (TOP + BOTTOM) / 2 - current.k * baseY).scale(current.k));
            return;
          }
          if (drag.current) { setSelection({ ...drag.current, x2: position.x, y2: position.y }); return; }
          const point = tree.current?.find(position.x, position.y, 12) ?? null;
          setHover(point);
          props.onHoverRow?.(point?.group.rows[0]?.id ?? null);
        }}
        onPointerLeave={() => { setHover(null); setCursor(null); props.onHoverRow?.(null); }}
        onPointerDownCapture={event => {
          const position = coordinates(event);
          if (!compact && position.x >= 700 && position.x <= 850 && position.y >= 300 && position.y <= 375) { minimapDrag.current = true; event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); return; }
          const hit = props.editableBox && boxHit(position.x, position.y, x(scenario.totalKpa * (1 - tolerances.pressureFrac)), y(scenario.o2Pct + tolerances.o2PctPoints), x(scenario.totalKpa * (1 + tolerances.pressureFrac)), y(scenario.o2Pct - tolerances.o2PctPoints));
          if (hit) { boxDrag.current = { kind: hit, ...position, pressure: scenario.totalKpa, oxygen: scenario.o2Pct }; event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); return; }
          if (event.shiftKey || selectArea) { drag.current = position; event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); }
        }}
        onPointerUp={event => {
          if (boxDrag.current || minimapDrag.current) { boxDrag.current = null; minimapDrag.current = false; return; }
          if (!drag.current) return;
          const end = coordinates(event), start = drag.current;
          drag.current = null; setSelection(null);
          props.onBoxSelect?.(points.current.filter(point => point.x >= Math.min(start.x, end.x) && point.x <= Math.max(start.x, end.x) && point.y >= Math.min(start.y, end.y) && point.y <= Math.max(start.y, end.y)).flatMap(point => point.group.rows.map(row => row.id)));
        }}
        onClick={event => { if (event.shiftKey || selectArea) return; const position = coordinates(event); if ((!compact && position.x >= 700 && position.x <= 850 && position.y >= 300 && position.y <= 375) || props.editableBox && boxHit(position.x, position.y, x(scenario.totalKpa * (1 - tolerances.pressureFrac)), y(scenario.o2Pct + tolerances.o2PctPoints), x(scenario.totalKpa * (1 + tolerances.pressureFrac)), y(scenario.o2Pct - tolerances.o2PctPoints))) return; const point = tree.current?.find(position.x, position.y, 12); if (!point) { props.onSelectRow?.(null); return; } if (point.group.rows.length > 1 && spider !== point.group.rows[0]?.id) setSpider(point.group.rows[0]?.id ?? null); else props.onSelectRow?.(point.group.rows[0]?.id ?? null); }}>
        <defs><clipPath id={clipId}><rect x={LEFT} y={TOP} width={RIGHT - LEFT} height={BOTTOM - TOP} /></clipPath></defs>
        <g className="gapmap-grid">{pressureAxisTicks(x.domain() as [number, number], unit, !linear, 8).map(tick => <g key={tick.kpa}><line x1={x(tick.kpa)} x2={x(tick.kpa)} y1={TOP} y2={BOTTOM}/><text x={x(tick.kpa)} y={BOTTOM + 57} textAnchor="middle">{tick.label}</text></g>)}{y.ticks(7).map(value => <g key={value}><line x1={LEFT} x2={RIGHT} y1={y(value)} y2={y(value)}/><text x={LEFT - 8} y={y(value) - 4} textAnchor="end">{value}</text></g>)}</g>
        <g clipPath={`url(#${clipId})`}>{(props.otherScenarios ?? []).map(item => box(item, true))}{box(scenario, false)}<line className="gapmap-reference" x1={x(101.3)} x2={x(101.3)} y1={TOP} y2={BOTTOM}/><line className="gapmap-reference" x1={LEFT} x2={RIGHT} y1={y(21)} y2={y(21)}/>{[10, 21].map(partial => <path key={partial} className="gapmap-reference" d={Array.from({ length: 100 }, (_, index) => { const pressure = Math.max(1, maxPressure * 1.1 * (index + 1) / 100); return `${index ? 'L' : 'M'}${x(pressure)},${y(partial * 100 / pressure)}`; }).join(' ')} />)}</g>
        <text x={LEFT} y={18}>O2 (% by volume)</text><text x={RIGHT} y={HEIGHT - 5} textAnchor="end">Total pressure ({unit})</text><text x={LEFT - 38} y={BOTTOM + 47} textAnchor="middle">Pressure not reported</text><text x={RIGHT - 4} y={BOTTOM + 28} textAnchor="end">O2 not reported</text><text x={RIGHT - 4} y={TOP + 15} textAnchor="end">Equal O2 partial pressure, not equal flammability</text>
        {props.editableBox && [x(scenario.totalKpa * (1 - tolerances.pressureFrac)), x(scenario.totalKpa * (1 + tolerances.pressureFrac))].map(edge => <rect key={edge} x={edge - 4} y={y(scenario.o2Pct) - 4} width="8" height="8" fill="var(--color-accent)" />)}
        {solidMaximum !== null && y(solidMaximum) > TOP + 45 && <text x={LEFT + 12} y={Math.max(TOP + 35, y(solidMaximum) - 12)}>No solid-fuel row reports O2 above {solidMaximum}%</text>}
        {explain && <g className="gapmap-annotation"><text x={LEFT + 10} y={TOP + 20}>1  Marks: individual tests</text><text x={LEFT + 10} y={TOP + 38}>2  Box: habitat tolerance</text><text x={LEFT + 10} y={TOP + 56}>3  Rails: not reported</text></g>}
        {cursor && <g className="gapmap-crosshair"><line x1={cursor.x} x2={cursor.x} y1={TOP} y2={BOTTOM}/><line x1={LEFT} x2={RIGHT} y1={cursor.y} y2={cursor.y}/></g>}
        {cursor && cursor.x >= LEFT && cursor.x <= RIGHT && cursor.y >= TOP && cursor.y <= BOTTOM && <text x={LEFT + 8} y={BOTTOM - 10}>{y.invert(cursor.y).toFixed(1)}% O2 · {x.invert(cursor.x).toFixed(1)} kPa{unit !== 'kPa' ? ` · ${formatPressure(x.invert(cursor.x), unit)}` : ''}</text>}
        {navigation && navigationPoint && <circle cx={navigationPoint.x} cy={navigationPoint.y} r="11" fill="none" stroke="var(--color-focus)" strokeWidth="2" />}
        {selection && <rect x={Math.min(selection.x, selection.x2)} y={Math.min(selection.y, selection.y2)} width={Math.abs(selection.x2 - selection.x)} height={Math.abs(selection.y2 - selection.y)} fill="var(--color-accent)" fillOpacity=".15" stroke="var(--color-accent)"/>}
        {spider && points.current.filter(point => point.group.rows[0]?.id === spider).flatMap(point => point.group.rows.map((row, index) => { const angle = index * Math.PI * 2 / point.group.rows.length, cx = point.x + Math.cos(angle) * 24, cy = point.y + Math.sin(angle) * 24; return <g key={row.id} onClick={event => { event.stopPropagation(); props.onSelectRow?.(row.id); }}><line x1={point.x} y1={point.y} x2={cx} y2={cy} stroke="var(--color-ink)"/><circle cx={cx} cy={cy} r="6" fill="var(--color-accent)"/></g>; }))}
        {!compact && <g aria-label="Overview map"><rect x="700" y="300" width="150" height="75" fill="var(--color-bg)" stroke="var(--color-border-strong)" />{groups.map(group => group.pressure !== null && group.oxygen !== null ? <circle key={group.rows[0]?.id} cx={700 + (xbase(group.pressure) - LEFT) / (RIGHT - LEFT) * 150} cy={300 + (ybase(group.oxygen) - TOP) / (BOTTOM - TOP) * 75} r="1.5" fill={`var(${colors[group.rows[0]!.fuel.phase]})`} /> : null)}<rect x={700 + (transform.current.invertX(LEFT) - LEFT) / (RIGHT - LEFT) * 150} y={300 + (transform.current.invertY(TOP) - TOP) / (BOTTOM - TOP) * 75} width={150 / transform.current.k} height={75 / transform.current.k} fill="var(--color-accent)" fillOpacity=".12" stroke="var(--color-accent)" /></g>}
      </svg>
      {hover && <div className="gapmap-tooltip"><strong>{hover.group.rows[0]?.accession} {hover.group.rows[0]?.testLabel}</strong><br/>{hover.group.rows[0]?.fuel.name ?? 'Fuel not reported'}<br/>O2: {hover.group.oxygen === null ? 'Not reported' : `${hover.group.oxygen.toFixed(1)}%`}<br/>Pressure: {hover.group.pressure === null ? 'Not reported' : formatPressure(hover.group.pressure, unit)}<br/>{hover.group.rows[0]?.date ?? 'Date not reported'}</div>}
    </div>}
    {!compact && <><div className="gapmap-legend">{phases.map(phase => <button key={phase} aria-pressed={!hidden.includes(phase)} onClick={event => toggle(phase, event.altKey)}><span style={{ color: `var(${colors[phase]})` }}>●</span> {names[phase]}</button>)}<span>○ Burner O2: excluded from counts</span></div>{explain && <ol><li>Each shape represents a fuel phase; stacked marks show a count.</li><li>The outlined box shows the habitat tolerance, not a prediction.</li><li>Rails contain conditions that were not reported.</li></ol>}</>}
  </section>;
}
