import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MagnifyingGlassMinus, MagnifyingGlassPlus } from '@phosphor-icons/react';
import { scaleLinear, scaleLog } from 'd3-scale';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';
import { quadtree } from 'd3-quadtree';
import { PRESETS, type FuelPhase, type GapMapProps, type Scenario, type Tolerances } from '@fire/contracts';
import { boxHit, formatPressure, groupRows, midpoint, nearestDirectional, pressureAxisTicks, type RowGroup } from './helpers';
import { ObstacleGrid, boxLabelCandidates, computeGeometry, lineLabelCandidates, o2AtPartialPressure, placeBadges, placeLabels, rect, verticalLineLabelCandidates, type BadgeRequest, type LabelRequest, type Rect } from './layout';
import TableView from './TableView';
import { exportFooter, saveChart } from './export';
import './style.css';

const phases: FuelPhase[] = ['liquid-droplet', 'solid', 'gas', 'aerosol', 'unknown'];
const names: Record<FuelPhase, string> = { 'liquid-droplet': 'Droplet', solid: 'Solid', gas: 'Gas', aerosol: 'Aerosol', unknown: 'Unknown' };
const colors: Record<FuelPhase, string> = { 'liquid-droplet': '--color-droplet', solid: '--color-solid', gas: '--color-gas', aerosol: '--color-aerosol', unknown: '--color-unknown' };
const EARTH = PRESETS['earth-iss'];
const MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
type Point = { x: number; y: number; group: RowGroup };
const links = new Map<string, Set<(transform: ZoomTransform) => void>>();

/** Mark outline shared by the canvas, the legend and the SVG overlays so shapes always agree. */
function shapePath(phase: FuelPhase, x: number, y: number, r = 1): string {
  if (phase === 'solid') return `M${x - 5 * r},${y - 5 * r}h${10 * r}v${10 * r}h${-10 * r}Z`;
  if (phase === 'gas') return `M${x},${y - 6 * r}L${x + 6 * r},${y + 5 * r}L${x - 6 * r},${y + 5 * r}Z`;
  if (phase === 'aerosol') return `M${x},${y - 6 * r}L${x + 6 * r},${y}L${x},${y + 6 * r}L${x - 6 * r},${y}Z`;
  return `M${x - 5 * r},${y}a${5 * r},${5 * r} 0 1 0 ${10 * r},0a${5 * r},${5 * r} 0 1 0 ${-10 * r},0Z`;
}
function mark(context: CanvasRenderingContext2D, phase: FuelPhase, x: number, y: number, hollow: boolean) {
  context.beginPath();
  if (phase === 'solid') context.rect(x - 5, y - 5, 10, 10);
  else if (phase === 'gas') { context.moveTo(x, y - 6); context.lineTo(x + 6, y + 5); context.lineTo(x - 6, y + 5); context.closePath(); }
  else if (phase === 'aerosol') { context.moveTo(x, y - 6); context.lineTo(x + 6, y); context.lineTo(x, y + 6); context.lineTo(x - 6, y); context.closePath(); }
  else context.arc(x, y, 5, 0, Math.PI * 2);
  if (!hollow) context.fill();
  context.stroke();
}

let measurer: CanvasRenderingContext2D | null | undefined;
const widths = new Map<string, number>();
function textWidth(text: string, font: string): number {
  const key = `${font}|${text}`, cached = widths.get(key); if (cached !== undefined) return cached;
  if (measurer === undefined) measurer = typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d');
  let width = text.length * 6.4;
  if (measurer) { measurer.font = font; width = measurer.measureText(text).width; }
  widths.set(key, width); return width;
}
const LABEL_FONT = '12px system-ui, sans-serif', SMALL_FONT = '11px system-ui, sans-serif', BADGE_FONT = `600 10px ${MONO}`;

type GapMapPropsExt = GapMapProps & {
  citation?: { corpusHash: string; sourcesLine: string; dateIso: string };
  /** Atlas only: expose the tour anchors (habitat box, one dot). */
  coach?: boolean;
  /** Fill the parent's height instead of keeping a fixed aspect ratio. Compact maps always fill. */
  fill?: boolean;
  /** Edge resize of the custom habitat box. The centre still goes through onScenarioDrag. Proposed for GapMapProps (OV-1 B7). */
  onTolerancesChange?: (next: Tolerances) => void;
};

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const o2 = 'O₂';

export default function GapMap(props: GapMapPropsExt) {
  const { rows, scenario, unit, compact, linkKey } = props;
  const fill = !!(props.fill || compact);
  const [localTolerances, setLocalTolerances] = useState(props.tolerances);
  useEffect(() => setLocalTolerances(props.tolerances), [props.tolerances]);
  const tolerances = props.onTolerancesChange ? props.tolerances : props.editableBox ? localTolerances : props.tolerances;
  const tolRef = useRef(tolerances); tolRef.current = tolerances;
  const applyTolerances = (next: Tolerances) => { tolRef.current = next; if (props.onTolerancesChange) props.onTolerancesChange(next); else setLocalTolerances(next); };

  const section = useRef<HTMLElement>(null), holder = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null), surface = useRef<SVGSVGElement>(null), transform = useRef<ZoomTransform>(zoomIdentity);
  const clipId = `gapmap-${useId().replaceAll(':', '')}`;
  const receiving = useRef(false), flight = useRef(0), moving = useRef(false), settle = useRef(0);
  const behavior = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null), frame = useRef(0), points = useRef<Point[]>([]);
  const tree = useRef<ReturnType<typeof quadtree<Point>> | null>(null), drag = useRef<{ x: number; y: number } | null>(null);
  const [revision, setRevision] = useState(0), [linear, setLinear] = useState(false), [table, setTable] = useState(false), [explain, setExplain] = useState(false);
  const [hidden, setHidden] = useState<FuelPhase[]>([]), [hover, setHover] = useState<Point | null>(null), [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [spider, setSpider] = useState<string | null>(null), [selection, setSelection] = useState<{ x: number; y: number; x2: number; y2: number } | null>(null);
  const [navigation, setNavigation] = useState(false), navigationOn = useRef(false);
  const [navigationKey, setNavigationKey] = useState<string | null>(null);
  const [selectArea, setSelectArea] = useState(false);
  const boxDrag = useRef<{ kind: string; x: number; y: number; pressure: number; oxygen: number } | null>(null);
  const minimapDrag = useRef(false);
  const [size, setSize] = useState({ w: 640, h: 400 });

  useLayoutEffect(() => {
    const element = holder.current; if (!element) return;
    const measure = () => setSize(current => { const w = Math.round(element.clientWidth), h = Math.round(element.clientHeight); return current.w === w && current.h === h ? current : { w, h }; });
    measure();
    const observer = new ResizeObserver(measure); observer.observe(element);
    return () => observer.disconnect();
  }, [table]);
  const geo = useMemo(() => computeGeometry(size.w, size.h, { compact: !!compact, fill }), [size.w, size.h, compact, fill]);
  const { W, H, L, R, T, B } = geo;

  const groups = useMemo(() => groupRows(rows), [rows]);
  const solidMaximum = useMemo(() => {
    const values = rows.filter(row => row.fuel.phase === 'solid' && row.o2Location === 'ambient').map(row => row.o2Pct.max ?? row.o2Pct.min).filter((value): value is number => value !== null);
    return values.length ? Math.max(...values) : null;
  }, [rows]);
  const maxPressure = Math.max(150, scenario.totalKpa * 1.5, ...rows.map(row => midpoint(row.pressureKpa) ?? 0));
  const maxOxygen = Math.max(45, scenario.o2Pct + 10, ...rows.map(row => midpoint(row.o2Pct) ?? 0));
  const xbase = useMemo(() => (linear ? scaleLinear() : scaleLog()).domain(linear ? [0, maxPressure * 1.1] : [1, maxPressure * 1.1]).range([L, R]), [linear, maxPressure, L, R]);
  const ybase = useMemo(() => scaleLinear().domain([0, Math.min(110, maxOxygen * 1.1)]).range([B, T]), [maxOxygen, T, B]);
  const x = transform.current.rescaleX(xbase), y = transform.current.rescaleY(ybase);
  const selected = useMemo(() => new Set(props.highlightedRowIds ?? []), [props.highlightedRowIds]);
  // A highlight that only echoes the mark under the pointer must not dim the rest of the map.
  const externalHighlight = (set: Set<string>, over: Point | null) => set.size > 0 && !(over && over.group.rows.some(item => set.has(item.id)));

  const plotGroups = useCallback((xs: (value: number) => number, ys: (value: number) => number): Point[] => {
    const out: Point[] = [];
    for (const group of groups) {
      if (!group.rows[0]) continue;
      const px = group.pressure === null ? geo.markRailX : xs(group.pressure), py = group.oxygen === null ? geo.markRailY : ys(group.oxygen);
      if (group.pressure !== null && (px < L - 3 || px > R + 5)) continue;
      if (group.oxygen !== null && (py < T - 5 || py > B + 5)) continue;
      out.push({ x: px, y: py, group });
    }
    return out;
  }, [groups, geo, L, R, T, B]);
  const badgeLayout = useCallback((plotted: Point[]) => {
    const requests: BadgeRequest[] = [];
    plotted.forEach((point, index) => { if (point.group.rows.length > 1) requests.push({ id: String(index), x: point.x, y: point.y, width: textWidth(String(point.group.rows.length), BADGE_FONT) + 8, height: 13, count: point.group.rows.length, rail: point.group.pressure === null ? 'left' : point.group.oxygen === null ? 'bottom' : undefined }); });
    return placeBadges(requests);
  }, []);

  const draw = useCallback(() => {
    const element = canvas.current; if (!element) return;
    const ratio = window.devicePixelRatio || 1, bounds = element.getBoundingClientRect();
    const wantW = Math.round(bounds.width * ratio), wantH = Math.round(bounds.height * ratio);
    if (element.width !== wantW || element.height !== wantH) { element.width = wantW; element.height = wantH; } // resizing reallocates the canvas: only when needed
    const context = element.getContext('2d'); if (!context) return;
    context.setTransform(element.width / W, 0, 0, element.height / H, 0, 0); context.clearRect(0, 0, W, H);
    const xs = transform.current.rescaleX(xbase), ys = transform.current.rescaleY(ybase), computed = getComputedStyle(element);
    const token = (name: string, fallback: string) => computed.getPropertyValue(name).trim() || fallback;
    const ink = token('--color-ink', '#e8eaed'), background = token('--color-bg', '#0b0d10'), accent = token('--color-accent', '#7cc4f2');
    const palette = new Map<string, string>(); const colorOf = (name: string) => { let value = palette.get(name); if (value === undefined) { value = token(name, '#8a94a3'); palette.set(name, value); } return value; };
    const plotted = plotGroups(xs, ys);
    const activeSet = (group: RowGroup) => { const row = group.rows[0]!; return !hidden.includes(row.fuel.phase) && (!props.phaseFilter?.length || props.phaseFilter.includes(row.fuel.phase)); };
    const dim = externalHighlight(selected, hover);
    const alphaOf = (group: RowGroup) => {
      const row = group.rows[0]!, highlighted = group.rows.some(item => selected.has(item.id));
      const faded = props.timelineCutoff && (!row.date || row.date > props.timelineCutoff);
      return (activeSet(group) ? 1 : 0.1) * (dim && !highlighted ? 0.2 : 1) * (faded ? 0.16 : 1);
    };
    // Plot marks are clipped to the plot, rail marks to their strip, so nothing bleeds onto tick labels.
    const regions: { test: (group: RowGroup) => boolean; clip: Rect }[] = [
      { test: group => group.pressure !== null && group.oxygen !== null, clip: { x1: L - 3, y1: T - 5, x2: R + 5, y2: B + 5 } },
      { test: group => group.pressure === null && group.oxygen !== null, clip: { x1: geo.railX, y1: T - 5, x2: geo.railX + geo.railW, y2: B + 5 } },
      { test: group => group.pressure !== null && group.oxygen === null, clip: { x1: L - 3, y1: geo.railY, x2: R + 5, y2: geo.railY + geo.railH } },
      { test: group => group.pressure === null && group.oxygen === null, clip: { x1: geo.railX, y1: geo.railY, x2: geo.railX + geo.railW, y2: geo.railY + geo.railH } },
    ];
    for (const region of regions) {
      context.save(); context.beginPath(); context.rect(region.clip.x1, region.clip.y1, region.clip.x2 - region.clip.x1, region.clip.y2 - region.clip.y1); context.clip();
      for (const point of plotted) {
        if (!region.test(point.group)) continue;
        const row = point.group.rows[0]!, burner = row.o2Location === 'burner', isSelected = point.group.rows.some(item => item.id === props.selectedRowId);
        context.globalAlpha = alphaOf(point.group);
        context.fillStyle = colorOf(burner ? '--color-burner' : colors[row.fuel.phase]); context.strokeStyle = context.fillStyle; context.lineWidth = burner ? 2 : 1.5;
        if (point.group.rows.some(item => selected.has(item.id)) && dim) { context.shadowColor = context.fillStyle; context.shadowBlur = 14; }
        mark(context, row.fuel.phase, point.x, point.y, burner); context.shadowBlur = 0;
        if (isSelected) {
          context.globalAlpha = 1; context.lineWidth = 3; context.strokeStyle = background; context.beginPath(); context.arc(point.x, point.y, 12.5, 0, Math.PI * 2); context.stroke();
          context.lineWidth = 2; context.strokeStyle = accent; context.beginPath(); context.arc(point.x, point.y, 10, 0, Math.PI * 2); context.stroke();
        }
      }
      context.restore();
    }
    // Count badges: dark pill, light text, placed at a free corner or dropped (the tooltip still states the count).
    context.globalAlpha = 1; context.font = BADGE_FONT; context.textBaseline = 'middle'; context.textAlign = 'center';
    if (!moving.current) badgeLayout(plotted).forEach((box, id) => {
      const point = plotted[Number(id)]!; context.globalAlpha = Math.max(0.35, alphaOf(point.group));
      context.fillStyle = background; context.strokeStyle = ink; context.lineWidth = 1;
      context.beginPath(); if (context.roundRect) context.roundRect(box.x1, box.y1, box.x2 - box.x1, box.y2 - box.y1, 6.5); else context.rect(box.x1, box.y1, box.x2 - box.x1, box.y2 - box.y1); context.fill(); context.globalAlpha *= 0.7; context.stroke(); context.globalAlpha = Math.max(0.35, alphaOf(point.group));
      context.fillStyle = ink; context.fillText(String(point.group.rows.length), (box.x1 + box.x2) / 2, (box.y1 + box.y2) / 2 + 0.5);
    });
    context.globalAlpha = 1; context.textBaseline = 'alphabetic'; context.textAlign = 'start';
    points.current = plotted;
    if (!moving.current) tree.current = quadtree<Point>().x(point => point.x).y(point => point.y).addAll(plotted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, hidden, props.phaseFilter, props.selectedRowId, props.timelineCutoff, selected, hover, xbase, ybase, geo, plotGroups, badgeLayout]);
  const schedule = useCallback(() => { cancelAnimationFrame(frame.current); frame.current = requestAnimationFrame(() => { draw(); setRevision(value => value + 1); }); }, [draw]);
  useEffect(() => { draw(); setRevision(value => value + 1); const observer = new ResizeObserver(draw); if (canvas.current) observer.observe(canvas.current); return () => { observer.disconnect(); cancelAnimationFrame(frame.current); }; }, [draw, table]);
  useEffect(() => {
    const element = surface.current; if (!element) return;
    const zoomer = zoom<SVGSVGElement, unknown>().scaleExtent([1, 40]).extent([[L, T], [R, B]]).filter(event => (!event.shiftKey || event.type === 'dblclick') && !selectArea && !boxDrag.current && !minimapDrag.current).on('start', event => { if (event.sourceEvent) { cancelAnimationFrame(flight.current); moving.current = true; window.clearTimeout(settle.current); } }).on('end', () => { window.clearTimeout(settle.current); settle.current = window.setTimeout(() => { moving.current = false; schedule(); }, 90); }).on('zoom', event => {
      transform.current = event.transform; schedule();
      if (linkKey && !receiving.current) links.get(linkKey)?.forEach(listener => listener(event.transform));
    });
    behavior.current = zoomer; select(element).call(zoomer).call(zoomer.transform, transform.current);
    const receive = (next: ZoomTransform) => { if (next === transform.current) return; receiving.current = true; select(element).call(zoomer.transform, next); receiving.current = false; };
    if (linkKey) { const listeners = links.get(linkKey) ?? new Set(); listeners.add(receive); links.set(linkKey, listeners); }
    return () => { select(element).on('.zoom', null); if (linkKey) links.get(linkKey)?.delete(receive); };
  }, [linkKey, schedule, selectArea, L, R, T, B, table]);

  const changeZoom = (factor: number) => { cancelAnimationFrame(flight.current); if (surface.current && behavior.current) select(surface.current).call(behavior.current.scaleBy, factor); };
  const reset = () => { cancelAnimationFrame(flight.current); if (surface.current && behavior.current) select(surface.current).call(behavior.current.transform, zoomIdentity); };
  const fit = (target: Scenario) => {
    const tol = tolRef.current;
    const left = xbase(Math.max(linear ? 0 : 1, target.totalKpa * (1 - tol.pressureFrac))), right = xbase(target.totalKpa * (1 + tol.pressureFrac));
    const top = ybase(target.o2Pct + tol.o2PctPoints), bottom = ybase(target.o2Pct - tol.o2PctPoints);
    const scale = Math.min(40, Math.max(1, Math.min((R - L) / ((right - left) * 1.4), (B - T) / ((bottom - top) * 1.4))));
    const next = zoomIdentity.translate((L + R) / 2 - scale * (left + right) / 2, (T + B) / 2 - scale * (top + bottom) / 2).scale(scale);
    if (surface.current && behavior.current) {
      const element = surface.current, zoomer = behavior.current, start = transform.current, started = performance.now();
      const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450;
      const animate = (now: number) => { const progress = duration ? Math.min(1, (now - started) / duration) : 1, eased = 1 - (1 - progress) ** 3; const current = zoomIdentity.translate(start.x + (next.x - start.x) * eased, start.y + (next.y - start.y) * eased).scale(start.k + (next.k - start.k) * eased); select(element).call(zoomer.transform, current); if (progress < 1) flight.current = requestAnimationFrame(animate); };
      cancelAnimationFrame(flight.current); flight.current = requestAnimationFrame(animate);
    }
  };

  const navigationPoint = navigation && navigationKey ? points.current.find(point => point.group.rows[0]?.id === navigationKey) ?? null : null;
  const toggleNavigation = (force?: boolean) => {
    const next = force ?? !navigationOn.current; navigationOn.current = next; setNavigation(next);
    if (next) { setNavigationKey(points.current[0]?.group.rows[0]?.id ?? null); surface.current?.focus({ preventScroll: true }); }
  };
  // Window events from the shell and the narration. Each key has one handler: when the map itself has focus handleKey acts and stops the
  // event, otherwise the shell turns the key into fa:shortcut and the maps below answer.
  const latest = useRef({ reset, fit, toggleNavigation, scenario });
  latest.current = { reset, fit, toggleNavigation, scenario };
  const pendingFocus = useRef<string | null>(null);
  useEffect(() => {
    if (compact) return;
    const onShortcut = (event: Event) => {
      const action = (event as CustomEvent<{ action?: string }>).detail?.action;
      const owner = document.activeElement?.closest?.('.gapmap');
      if (owner && owner !== section.current) return; // two maps (Duel): only the focused one answers
      if (action === 'fit') latest.current.reset(); else if (action === 'mark-nav' && surface.current) latest.current.toggleNavigation();
    };
    const onFocusHabitat = (event: Event) => {
      const id = (event as CustomEvent<{ habitat?: string }>).detail?.habitat; if (!id) return;
      if (id === latest.current.scenario.id) latest.current.fit(latest.current.scenario); else pendingFocus.current = id;
    };
    window.addEventListener('fa:shortcut', onShortcut); window.addEventListener('fa:focus-habitat', onFocusHabitat);
    return () => { window.removeEventListener('fa:shortcut', onShortcut); window.removeEventListener('fa:focus-habitat', onFocusHabitat); };
  }, [compact]);
  useEffect(() => { if (pendingFocus.current && pendingFocus.current === scenario.id) { pendingFocus.current = null; latest.current.fit(scenario); } }, [scenario]);

  const coordinates = (event: React.MouseEvent<SVGSVGElement>) => { const bounds = event.currentTarget.getBoundingClientRect(); return { x: (event.clientX - bounds.left) * W / bounds.width, y: (event.clientY - bounds.top) * H / bounds.height }; };
  const boxRect = (target: Scenario): Rect => ({ x1: x(target.totalKpa * (1 - tolerances.pressureFrac)), x2: x(target.totalKpa * (1 + tolerances.pressureFrac)), y1: y(target.o2Pct + tolerances.o2PctPoints), y2: y(target.o2Pct - tolerances.o2PctPoints) });
  const mini = { x: R - 128, y: B - 72, w: 120, h: 64 };
  const showMini = !compact && transform.current.k > 1.02;
  const inMini = (position: { x: number; y: number }) => showMini && position.x >= mini.x && position.x <= mini.x + mini.w && position.y >= mini.y && position.y <= mini.y + mini.h;

  const handleKey = (event: React.KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key === 'm') { event.preventDefault(); event.stopPropagation(); toggleNavigation(); return; }
    if (event.key === '0') { event.preventDefault(); event.stopPropagation(); reset(); return; }
    if (navigation && event.key.startsWith('Arrow')) { event.preventDefault(); const current = navigationPoint; const next = current ? nearestDirectional(points.current, current, event.key) ?? current : points.current[0] ?? null; setNavigationKey(next?.group.rows[0]?.id ?? null); return; }
    if (navigation && event.key === 'Enter') { props.onSelectRow?.(navigationPoint?.group.rows[0]?.id ?? null); return; }
    if (event.key === '+' || event.key === '=') changeZoom(2); else if (event.key === '-') changeZoom(.5); else if (event.key.startsWith('Arrow') && surface.current && behavior.current) { event.preventDefault(); const step = event.shiftKey ? 80 : 20; select(surface.current).call(behavior.current.translateBy, event.key === 'ArrowLeft' ? step : event.key === 'ArrowRight' ? -step : 0, event.key === 'ArrowUp' ? step : event.key === 'ArrowDown' ? -step : 0); }
  };
  const toggle = (phase: FuelPhase, solo: boolean) => setHidden(current => solo ? phases.filter(item => item !== phase) : current.includes(phase) ? current.filter(item => item !== phase) : [...current, phase]);

  // ---- overlay layout (labels, rails, reference lines), recomputed on every transform ----
  void revision;
  const plotRect: Rect = { x1: L, y1: T, x2: R, y2: B };
  const plotted = plotGroups(x, y);
  const overlay = useMemo(() => {
    if (table) return null;
    const marks = new ObstacleGrid();
    plotted.forEach(point => { if (point.group.pressure !== null && point.group.oxygen !== null) marks.add(rect(point.x - 7, point.y - 7, 14, 14)); });
    badgeLayout(plotted).forEach((box, id) => { if (plotted[Number(id)]?.group.pressure !== null && plotted[Number(id)]?.group.oxygen !== null) marks.add(box); });
    const requests: LabelRequest[] = [];
    const clipBox = (box: Rect): Rect | null => { const clipped = { x1: Math.max(box.x1, L), x2: Math.min(box.x2, R), y1: Math.max(box.y1, T), y2: Math.min(box.y2, B) }; return clipped.x2 - clipped.x1 > 4 && clipped.y2 - clipped.y1 > 4 ? clipped : null; };
    const boxes: { scenario: Scenario; box: Rect; visible: Rect; main: boolean; width: number }[] = [];
    for (const [target, main] of [...(props.otherScenarios ?? []).map(item => [item, false] as const), [scenario, true] as const]) {
      const box = boxRect(target), visible = clipBox(box); if (!visible) continue;
      const width = textWidth(target.label, main ? LABEL_FONT : SMALL_FONT) + 4; boxes.push({ scenario: target, box, visible, main, width });
      requests.push({ id: `box:${target.id}`, width, height: main ? 15 : 13, priority: main ? 10 : 3, essential: main, candidates: boxLabelCandidates(visible, width, main ? 15 : 13) });
    }
    const refs: { id: string; text: string; kind: 'v' | 'h' | 'curve' | 'note'; at?: number; kpa?: number; width: number }[] = [];
    const seaX = x(EARTH.totalKpa), earthY = y(EARTH.o2Pct);
    if (seaX > L + 2 && seaX < R - 2) { const text = `Earth sea level, ${formatPressure(EARTH.totalKpa, unit)}`; const width = textWidth(text, SMALL_FONT) + 4; refs.push({ id: 'sea', text, kind: 'v', at: seaX, width }); requests.push({ id: 'sea', width, height: 13, priority: 7, candidates: verticalLineLabelCandidates(seaX, T + 4, B - 4, width, 13) }); }
    if (earthY > T + 2 && earthY < B - 2) { const text = `Earth air, ${EARTH.o2Pct}% ${o2}`; const width = textWidth(text, SMALL_FONT) + 4; refs.push({ id: 'earth-o2', text, kind: 'h', at: earthY, width }); requests.push({ id: 'earth-o2', width, height: 13, priority: 6, candidates: lineLabelCandidates(earthY, L + 6, R - 6, width, 13).reverse() }); }
    const curves = [{ id: 'p-earth', kpa: EARTH.totalKpa * EARTH.o2Pct / 100, who: 'Earth air' }];
    const own = scenario.totalKpa * scenario.o2Pct / 100;
    if (Math.abs(own - curves[0]!.kpa) / curves[0]!.kpa > 0.05) curves.push({ id: 'p-own', kpa: own, who: scenario.label });
    for (const curve of curves) {
      const text = `p${o2} ${formatPressure(curve.kpa, unit)}, ${curve.who}`; const width = textWidth(text, SMALL_FONT) + 4;
      const candidates = [];
      for (let f = 0.1; f <= 0.96; f += 0.045) { const px = L + f * (R - L), py = y(o2AtPartialPressure(curve.kpa, x.invert(px))); candidates.push({ x: px + 5, y: py - 17 }, { x: px + 5, y: py + 5 }); }
      refs.push({ id: curve.id, text, kind: 'curve', kpa: curve.kpa, width }); requests.push({ id: curve.id, width, height: 13, priority: 5, candidates });
    }
    if (solidMaximum !== null && y(solidMaximum) > T + 18 && y(solidMaximum) < B) { const text = `No solid-fuel row reports ${o2} above ${solidMaximum}%`; const width = textWidth(text, SMALL_FONT) + 4; refs.push({ id: 'solid-note', text, kind: 'note', at: y(solidMaximum), width }); requests.push({ id: 'solid-note', width, height: 13, priority: 8, candidates: lineLabelCandidates(y(solidMaximum), L + 8, R - 8, width, 13).slice(0, 40) }); }
    const placement = placeLabels(requests, marks, plotRect);
    return { boxes, refs, placement };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plotted, scenario, props.otherScenarios, tolerances, unit, solidMaximum, geo, table, badgeLayout]);
  const placementOf = (id: string) => overlay?.placement.get(id);
  const leaderFor = (label: { x: number; y: number; width: number; height: number }, box: Rect) => {
    const cx = clamp((box.x1 + box.x2) / 2, label.x, label.x + label.width), cy = clamp((box.y1 + box.y2) / 2, label.y, label.y + label.height);
    return { x1: cx, y1: cy, x2: clamp(cx, box.x1, box.x2), y2: clamp(cy, box.y1, box.y2) };
  };
  const coachDot = props.coach ? (() => { const centre = { x: x(scenario.totalKpa), y: y(scenario.o2Pct) }; let best: Point | null = null, distance = Infinity; for (const point of plotted) { if (point.group.pressure === null || point.group.oxygen === null || hidden.includes(point.group.rows[0]!.fuel.phase)) continue; const d = (point.x - centre.x) ** 2 + (point.y - centre.y) ** 2; if (d < distance) { distance = d; best = point; } } return best as Point | null; })() : null;
  const hasTolerances = !!props.editableBox;
  const pressureTicks = pressureAxisTicks(x.domain() as [number, number], unit, !linear, geo.W < 520 ? 5 : 8).filter(tick => x(tick.kpa) >= L - 0.5 && x(tick.kpa) <= R + 0.5);
  const tooShort = B - T < 150;
  const yTitle = `${o2} (% by volume, ambient)`;
  const hovered = hover?.group.rows[0];
  const tooltipFlip = hover ? hover.x * geo.scale > size.w * 0.58 : false;

  return <section ref={section} className={`gapmap ${fill ? 'gapmap--fill' : ''} ${props.className ?? ''}`} aria-label="Gap map">
    {!compact && <div className="gapmap-toolbar"><button onClick={() => setLinear(value => !value)}>{linear ? 'Linear pressure' : 'Log pressure'}</button><button onClick={() => changeZoom(2)} aria-label="Zoom in" title="Zoom in"><MagnifyingGlassPlus size={18}/></button><button onClick={() => changeZoom(.5)} aria-label="Zoom out" title="Zoom out"><MagnifyingGlassMinus size={18}/></button><button onClick={reset}>Fit all</button><button onClick={() => fit(scenario)}>Zoom to habitat</button><button aria-pressed={selectArea} onClick={() => setSelectArea(value => !value)}>Select area</button><button onClick={() => setTable(value => !value)}>{table ? 'Map view' : 'Table view'}</button><button aria-pressed={explain} onClick={() => setExplain(value => !value)}>Explain this chart</button><button onClick={() => { if (canvas.current && surface.current) void saveChart(canvas.current, surface.current, exportFooter(props.citation, rows.map(row => row.csvSha12))); }}>Save image</button>{rows.some(row => row.fixture) && <strong className="gapmap-fixture">FIXTURE</strong>}</div>}
    {compact && rows.some(row => row.fixture) && <strong className="gapmap-fixture gapmap-fixture--corner">FIXTURE</strong>}
    <p className="gapmap-sr" aria-live="polite">{navigation ? `Mark navigation. ${navigationPoint?.group.rows[0]?.accession ?? 'No mark'} ${navigationPoint?.group.rows[0]?.testLabel ?? ''}` : `${rows.length} test rows. ${rows.filter(row => midpoint(row.pressureKpa) === null).length} have no reported pressure; ${rows.filter(row => midpoint(row.o2Pct) === null).length} have no reported oxygen. ${scenario.label} is selected.`}</p>
    {table ? <TableView rows={rows.filter(row => !hidden.includes(row.fuel.phase) && (!props.phaseFilter?.length || props.phaseFilter.includes(row.fuel.phase)) && (!props.timelineCutoff || !!row.date && row.date <= props.timelineCutoff))} unit={unit} onSelect={props.onSelectRow} /> : <div className="gapmap-chart" ref={holder} style={fill ? undefined : { height: H * geo.scale }}>
      <canvas ref={canvas} aria-hidden="true" />
      <svg ref={surface} viewBox={`0 0 ${W} ${H}`} data-plot={`${L},${R},${T},${B}`} data-y-domain={ybase.domain().join(',')} data-x-domain={xbase.domain().join(',')} tabIndex={0} role="application" aria-label="Interactive gap map. Use plus and minus to zoom, arrows to pan, zero to reset, and M for mark navigation." onKeyDown={handleKey}
        onPointerMove={event => {
          const position = coordinates(event);
          setCursor(position);
          if (boxDrag.current) {
            const start = boxDrag.current;
            if (start.kind === 'move') {
              props.onScenarioDrag?.({ totalKpa: Math.max(1, start.pressure + x.invert(position.x) - x.invert(start.x)), o2Pct: Math.max(0, Math.min(100, start.oxygen + y.invert(position.y) - y.invert(start.y))) });
            } else {
              const current = tolRef.current;
              applyTolerances({
                ...current,
                pressureFrac: /[ew]/.test(start.kind) ? Math.max(.01, Math.min(.95, Math.abs(x.invert(position.x) - start.pressure) / start.pressure)) : current.pressureFrac,
                o2PctPoints: /[ns]/.test(start.kind) ? Math.max(.1, Math.min(50, Math.abs(y.invert(position.y) - start.oxygen))) : current.o2PctPoints,
              });
              props.onScenarioDrag?.({ totalKpa: start.pressure, o2Pct: start.oxygen });
            }
            return;
          }
          if (minimapDrag.current && surface.current && behavior.current) {
            const baseX = L + (position.x - mini.x) / mini.w * (R - L);
            const baseY = T + (position.y - mini.y) / mini.h * (B - T);
            const current = transform.current;
            select(surface.current).call(behavior.current.transform, zoomIdentity.translate((L + R) / 2 - current.k * baseX, (T + B) / 2 - current.k * baseY).scale(current.k));
            return;
          }
          if (drag.current) { setSelection({ ...drag.current, x2: position.x, y2: position.y }); return; }
          const point = tree.current?.find(position.x, position.y, 12) ?? null;
          setHover(current => (current?.group === point?.group ? current : point));
          props.onHoverRow?.(point?.group.rows[0]?.id ?? null);
        }}
        onPointerLeave={() => { setHover(null); setCursor(null); props.onHoverRow?.(null); }}
        onPointerDownCapture={event => {
          const position = coordinates(event);
          if (inMini(position)) { minimapDrag.current = true; event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); return; }
          const box = boxRect(scenario);
          const hit = props.editableBox && boxHit(position.x, position.y, box.x1, box.y1, box.x2, box.y2);
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
        onClick={event => {
          if (event.shiftKey || selectArea) return;
          const position = coordinates(event), box = boxRect(scenario);
          if (inMini(position) || (props.editableBox && boxHit(position.x, position.y, box.x1, box.y1, box.x2, box.y2))) return;
          const point = tree.current?.find(position.x, position.y, 12);
          if (!point) { props.onSelectRow?.(null); return; }
          if (point.group.rows.length > 1 && spider !== point.group.rows[0]?.id) setSpider(point.group.rows[0]?.id ?? null); else props.onSelectRow?.(point.group.rows[0]?.id ?? null);
        }}>
        <defs><clipPath id={clipId}><rect x={L} y={T} width={R - L} height={B - T} /></clipPath></defs>
        <g className="gapmap-rails" aria-hidden="true">
          <rect x={geo.railX} y={T} width={geo.railW} height={B - T} /><rect x={L} y={geo.railY} width={R - L} height={geo.railH} /><rect x={geo.railX} y={geo.railY} width={geo.railW} height={geo.railH} />
          <text className="gapmap-railtext" transform={`translate(${geo.railX + 11} ${(T + B) / 2}) rotate(-90)`} textAnchor="middle">{tooShort ? 'No pressure' : 'Pressure not reported'}</text>
          <text className="gapmap-railtext" x={L + 6} y={geo.railY + 12}>{o2} not reported</text>
        </g>
        <g className="gapmap-grid">{pressureTicks.map(tick => <g key={tick.kpa}><line x1={x(tick.kpa)} x2={x(tick.kpa)} y1={T} y2={B}/><text x={x(tick.kpa)} y={B + 13} textAnchor="middle">{tick.label}</text></g>)}{y.ticks(Math.max(3, Math.round((B - T) / 44))).filter(value => y(value) >= T - 0.5 && y(value) <= B + 0.5).map(value => <g key={value}><line x1={L} x2={R} y1={y(value)} y2={y(value)}/><text x={geo.railX - 4} y={y(value)} dy="0.32em" textAnchor="end" className="gapmap-ytick">{value}</text></g>)}</g>
        <g clipPath={`url(#${clipId})`}>
          {(props.otherScenarios ?? []).map(item => { const b = boxRect(item); return <rect key={item.id} className="gapmap-box gapmap-box--faint" x={b.x1} y={b.y1} width={b.x2 - b.x1} height={b.y2 - b.y1} />; })}
          <rect data-coach={props.coach ? 'habitat-box' : undefined} data-habitat-box={scenario.id} className="gapmap-box" x={boxRect(scenario).x1} y={boxRect(scenario).y1} width={boxRect(scenario).x2 - boxRect(scenario).x1} height={boxRect(scenario).y2 - boxRect(scenario).y1} tabIndex={hasTolerances ? 0 : undefined} role={hasTolerances ? 'group' : undefined} aria-label={hasTolerances ? 'Editable habitat box. Arrow keys move it, Alt plus arrow keys resize it.' : undefined}
            onKeyDown={event => {
              if (!hasTolerances || !event.key.startsWith('Arrow')) return; event.stopPropagation(); event.preventDefault();
              if (event.altKey) { const current = tolRef.current; applyTolerances({ ...current, pressureFrac: clamp(current.pressureFrac + (event.key === 'ArrowRight' ? .01 : event.key === 'ArrowLeft' ? -.01 : 0), .01, .95), o2PctPoints: clamp(current.o2PctPoints + (event.key === 'ArrowUp' ? .5 : event.key === 'ArrowDown' ? -.5 : 0), .1, 50) }); return; }
              const step = event.shiftKey ? 5 : 1; props.onScenarioDrag?.({ totalKpa: Math.max(1, scenario.totalKpa + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0)), o2Pct: Math.max(0, Math.min(100, scenario.o2Pct + (event.key === 'ArrowUp' ? step : event.key === 'ArrowDown' ? -step : 0))) });
            }} />
          <line className="gapmap-reference" x1={x(EARTH.totalKpa)} x2={x(EARTH.totalKpa)} y1={T} y2={B}/><line className="gapmap-reference" x1={L} x2={R} y1={y(EARTH.o2Pct)} y2={y(EARTH.o2Pct)}/>
          {(overlay?.refs ?? []).filter(item => item.kind === 'curve').map(item => <path key={item.id} className="gapmap-reference gapmap-curve" d={Array.from({ length: 121 }, (_, index) => { const px = L + (R - L) * index / 120; return `${index ? 'L' : 'M'}${px},${y(o2AtPartialPressure(item.kpa!, x.invert(px)))}`; }).join(' ')} />)}
        </g>
        {hasTolerances && (() => { const b = boxRect(scenario), mid = (b.y1 + b.y2) / 2; return [b.x1, (b.x1 + b.x2) / 2, b.x2].flatMap(horizontal => [b.y1, b.y2].map(vertical => <rect key={`${horizontal}:${vertical}`} className="gapmap-handle" x={horizontal - 4} y={vertical - 4} width="8" height="8" />)).concat([b.x1, b.x2].map(edge => <rect key={`m${edge}`} className="gapmap-handle" x={edge - 4} y={mid - 4} width="8" height="8" />)); })()}
        {overlay?.boxes.map(item => { const place = placementOf(`box:${item.scenario.id}`); if (!place) return null; const leader = place.leader ? leaderFor(place, item.visible) : null; return <g key={item.scenario.id} className={item.main ? 'gapmap-label gapmap-label--main' : 'gapmap-label gapmap-label--faint'} data-habitat={item.scenario.id}>{leader && <line className="gapmap-leader" {...leader} />}<text x={place.x + 2} y={place.y + place.height - 3.5} style={{ font: item.main ? LABEL_FONT : SMALL_FONT }}>{item.scenario.label}</text></g>; })}
        {overlay?.refs.map(item => { const place = placementOf(item.id); if (!place) return null; return <text key={item.id} className="gapmap-reftext" data-ref={item.id} x={place.x + 2} y={place.y + place.height - 3}>{item.text}</text>; })}
        <text className="gapmap-axis" x={6} y={T - 14}>{yTitle}</text><text className="gapmap-axis" x={R} y={H - 6} textAnchor="end">Total pressure ({unit})</text>
        {explain && <g className="gapmap-annotation"><text x={L + 10} y={T + 20}>1  Marks: individual tests</text><text x={L + 10} y={T + 38}>2  Box: habitat tolerance</text><text x={L + 10} y={T + 56}>3  Rails: not reported</text></g>}
        {cursor && cursor.x >= L && cursor.x <= R && cursor.y >= T && cursor.y <= B && <g className="gapmap-crosshair"><line x1={cursor.x} x2={cursor.x} y1={T} y2={B}/><line x1={L} x2={R} y1={cursor.y} y2={cursor.y}/></g>}
        {cursor && cursor.x >= L && cursor.x <= R && cursor.y >= T && cursor.y <= B && <text className="gapmap-readout" x={L + 8} y={B - 8}>{y.invert(cursor.y).toFixed(1)}% {o2} · {x.invert(cursor.x).toFixed(1)} kPa{unit !== 'kPa' ? ` · ${formatPressure(x.invert(cursor.x), unit)}` : ''}</text>}
        {hover && <g className="gapmap-hover" aria-hidden="true"><circle cx={hover.x} cy={hover.y} r="15" className="gapmap-hover-bg" /><circle cx={hover.x} cy={hover.y} r="13" className="gapmap-hover-ring" /></g>}
        {navigation && navigationPoint && <circle cx={navigationPoint.x} cy={navigationPoint.y} r="11" fill="none" stroke="var(--color-focus)" strokeWidth="2.5" />}
        {coachDot && <circle data-coach="dot" cx={coachDot.x} cy={coachDot.y} r="9" fill="none" pointerEvents="none" />}
        {selection && <rect x={Math.min(selection.x, selection.x2)} y={Math.min(selection.y, selection.y2)} width={Math.abs(selection.x2 - selection.x)} height={Math.abs(selection.y2 - selection.y)} fill="var(--color-accent)" fillOpacity=".15" stroke="var(--color-accent)"/>}
        {spider && points.current.filter(point => point.group.rows[0]?.id === spider).flatMap(point => point.group.rows.map((row, index) => { const angle = index * Math.PI * 2 / point.group.rows.length, cx = point.x + Math.cos(angle) * 26, cy = point.y + Math.sin(angle) * 26; return <g key={row.id} className="gapmap-spider" onClick={event => { event.stopPropagation(); props.onSelectRow?.(row.id); }}><line x1={point.x} y1={point.y} x2={cx} y2={cy} /><path d={shapePath(row.fuel.phase, cx, cy, 1.2)} style={{ fill: `var(${colors[row.fuel.phase]})` }} /></g>; }))}
        {showMini && <g aria-label="Overview map"><rect className="gapmap-mini" x={mini.x} y={mini.y} width={mini.w} height={mini.h} />{groups.map(group => group.pressure !== null && group.oxygen !== null ? <circle key={group.rows[0]?.id} cx={mini.x + (xbase(group.pressure) - L) / (R - L) * mini.w} cy={mini.y + (ybase(group.oxygen) - T) / (B - T) * mini.h} r="1.5" fill={`var(${colors[group.rows[0]!.fuel.phase]})`} /> : null)}<rect x={mini.x + (transform.current.invertX(L) - L) / (R - L) * mini.w} y={mini.y + (transform.current.invertY(T) - T) / (B - T) * mini.h} width={mini.w / transform.current.k} height={mini.h / transform.current.k} fill="var(--color-accent)" fillOpacity=".18" stroke="var(--color-accent)" /></g>}
      </svg>
      {hover && hovered && <div className={`gapmap-tooltip ${tooltipFlip ? 'gapmap-tooltip--left' : ''}`} style={{ left: hover.x * geo.scale + (tooltipFlip ? -14 : 14), top: Math.max(4, hover.y * geo.scale - 12) }}><strong>{hovered.accession} {hovered.testLabel}</strong><br/>{hovered.fuel.name ?? 'Fuel not reported'}<br/>{o2}: {hover.group.oxygen === null ? 'Not reported' : `${hover.group.oxygen.toFixed(1)}%${hovered.o2Location === 'burner' ? ' (burner stream)' : ''}`}<br/>Pressure: {hover.group.pressure === null ? 'Not reported' : formatPressure(hover.group.pressure, unit)}<br/>{hovered.date ?? 'Date not reported'}{hover.group.rows.length > 1 && <><br/><em>{hover.group.rows.length} rows share these conditions. Click to fan them out.</em></>}</div>}
    </div>}
    {!compact && <><div className="gapmap-legend">{phases.map(phase => <button key={phase} aria-pressed={!hidden.includes(phase)} onClick={event => toggle(phase, event.altKey)}><svg width="14" height="14" viewBox="-7 -7 14 14" aria-hidden="true"><path d={shapePath(phase, 0, 0)} style={{ fill: `var(${colors[phase]})`, stroke: `var(${colors[phase]})` }} strokeWidth="1.5" /></svg>{names[phase]}</button>)}<span className="gapmap-note"><svg width="14" height="14" viewBox="-7 -7 14 14" aria-hidden="true"><circle r="5" fill="none" stroke="var(--color-burner)" strokeWidth="2" /></svg>Hollow: burner-stream {o2}, not cabin air, excluded from counts</span><span className="gapmap-note"><svg width="22" height="10" viewBox="0 0 22 10" aria-hidden="true"><line x1="1" x2="21" y1="5" y2="5" className="gapmap-reference" style={{ opacity: 1 }} /></svg>Dashed curves: equal {o2} partial pressure, not equal flammability</span></div>{explain && <ol className="gapmap-explain"><li>Each shape represents a fuel phase; stacked marks show a count.</li><li>The outlined box shows the habitat tolerance, not a prediction.</li><li>Rails contain conditions that were not reported.</li></ol>}</>}
  </section>;
}
