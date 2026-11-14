/** Pure layout helpers for the Gap Map: plot geometry, label placement and badge placement. No DOM, so they are unit tested. */

export interface Rect { x1: number; y1: number; x2: number; y2: number }
export const rect = (x: number, y: number, width: number, height: number): Rect => ({ x1: x, y1: y, x2: x + width, y2: y + height });
export const overlaps = (a: Rect, b: Rect, pad = 0): boolean => a.x1 < b.x2 + pad && a.x2 > b.x1 - pad && a.y1 < b.y2 + pad && a.y2 > b.y1 - pad;
const overlapArea = (a: Rect, b: Rect): number => Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1)) * Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1));
const inside = (a: Rect, bounds: Rect): boolean => a.x1 >= bounds.x1 && a.x2 <= bounds.x2 && a.y1 >= bounds.y1 && a.y2 <= bounds.y2;

export interface Geometry {
  /** viewBox size. One unit is one CSS pixel unless the map is wider than MAX_W. */
  W: number; H: number;
  /** Plot area. */
  L: number; R: number; T: number; B: number;
  /** CSS pixels per viewBox unit. */
  scale: number;
  /** Strip left of the plot for rows with no reported pressure (x is the strip, y follows O2). */
  railX: number; railW: number;
  /** Strip below the plot for rows with no reported O2. */
  railY: number; railH: number;
  /** Centre of the strip cells, where marks sit. */
  markRailX: number; markRailY: number;
  compact: boolean;
}

export const MAX_W = 1100;
const TICK_W = 30;

/** Width and height are the measured container in CSS pixels. `fill` means the container height is meaningful. */
export function computeGeometry(width: number, height: number, opts: { compact: boolean; fill: boolean }): Geometry {
  const w = Math.max(240, width);
  const scale = w > MAX_W ? w / MAX_W : 1;
  const W = w / scale;
  const wide = W >= 700;
  const H = opts.fill && height > 0 ? Math.max(240, height / scale) : wide ? Math.round(W * 0.56) : Math.max(opts.compact ? 230 : 320, Math.round(W * (opts.compact ? 0.72 : 0.95)));
  const railW = opts.compact ? 34 : W < 520 ? 46 : 52, railH = opts.compact ? 30 : 38;
  const railX = TICK_W + 6;
  const L = railX + railW + 4, R = W - 12;
  const T = opts.compact ? 24 : 34;
  const B = H - (opts.compact ? 70 : 82);
  const railY = B + 20;
  return { W, H, L, R, T, B, scale, railX, railW, railY, railH, markRailX: railX + railW - 12, markRailY: railY + railH - 12, compact: opts.compact };
}

/** Coarse spatial hash so label placement stays cheap with thousands of marks. */
export class ObstacleGrid {
  private cells = new Map<number, Rect[]>();
  constructor(private cell = 40) {}
  private key(cx: number, cy: number) { return cx * 100003 + cy; }
  add(r: Rect) {
    for (let cx = Math.floor(r.x1 / this.cell); cx <= Math.floor(r.x2 / this.cell); cx++) for (let cy = Math.floor(r.y1 / this.cell); cy <= Math.floor(r.y2 / this.cell); cy++) {
      const k = this.key(cx, cy), list = this.cells.get(k); if (list) list.push(r); else this.cells.set(k, [r]);
    }
  }
  /** Sum of overlap with every obstacle touching r (an obstacle in several cells is counted once). */
  overlap(r: Rect, pad = 0): number {
    const seen = new Set<Rect>(); let total = 0;
    for (let cx = Math.floor((r.x1 - pad) / this.cell); cx <= Math.floor((r.x2 + pad) / this.cell); cx++) for (let cy = Math.floor((r.y1 - pad) / this.cell); cy <= Math.floor((r.y2 + pad) / this.cell); cy++) {
      for (const o of this.cells.get(this.key(cx, cy)) ?? []) {
        if (seen.has(o)) continue; seen.add(o);
        if (overlaps(r, o, pad)) total += Math.max(1, overlapArea(r, o));
      }
    }
    return total;
  }
}

export interface Candidate { x: number; y: number; /** true when the label sits away from its target and needs a leader line. */ leader?: boolean }
export interface LabelRequest {
  id: string;
  width: number; height: number;
  /** Highest first. Earlier candidates win, so list the tidy spots first. */
  candidates: Candidate[];
  priority: number;
  /** Lower-priority labels are dropped when nothing is free; essential ones fall back to the least bad spot. */
  essential?: boolean;
}
export interface Placement { id: string; x: number; y: number; width: number; height: number; leader: boolean; overlapped: boolean }

/** Greedy, deterministic: higher priority first, first free candidate wins. Placed labels become obstacles for later ones. */
export function placeLabels(requests: LabelRequest[], marks: ObstacleGrid, bounds: Rect, pad = 2): Map<string, Placement> {
  const placed = new ObstacleGrid(), out = new Map<string, Placement>();
  const ordered = [...requests].sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
  for (const request of ordered) {
    let best: { c: Candidate; score: number } | null = null;
    for (const c of request.candidates) {
      const r = rect(c.x, c.y, request.width, request.height);
      if (!inside(r, bounds)) continue;
      const score = marks.overlap(r, pad) + placed.overlap(r, pad) * 4;
      if (score === 0) { best = { c, score }; break; }
      if (!best || score < best.score) best = { c, score };
    }
    if (!best) continue;
    if (best.score > 0 && !request.essential) continue;
    const r = rect(best.c.x, best.c.y, request.width, request.height);
    placed.add(r);
    out.set(request.id, { id: request.id, x: best.c.x, y: best.c.y, width: request.width, height: request.height, leader: !!best.c.leader, overlapped: best.score > 0 });
  }
  return out;
}

/** Candidate spots for a label of size (w, h) around a box: tidy corners first, then stacked above, then leader-line spots further out. */
export function boxLabelCandidates(box: Rect, w: number, h: number, gap = 3): Candidate[] {
  const out: Candidate[] = [
    { x: box.x1, y: box.y1 - h - gap }, { x: box.x2 - w, y: box.y1 - h - gap },
    { x: box.x1, y: box.y2 + gap }, { x: box.x2 - w, y: box.y2 + gap },
    { x: box.x2 + gap + 2, y: box.y1 }, { x: box.x1 - w - gap - 2, y: box.y1 },
  ];
  const cx = (box.x1 + box.x2) / 2, cy = (box.y1 + box.y2) / 2;
  for (const distance of [26, 48, 74, 104]) {
    // Eight directions around the box, up and down first because the plot is wider than tall.
    for (const [dx, dy] of [[0, -1], [0, 1], [1, -1], [-1, -1], [1, 1], [-1, 1], [1, 0], [-1, 0]] as const) {
      const halfW = (box.x2 - box.x1) / 2, halfH = (box.y2 - box.y1) / 2;
      const x = cx + dx * (halfW + distance) - (dx < 0 ? w : dx === 0 ? w / 2 : 0);
      const y = cy + dy * (halfH + distance) - (dy < 0 ? h : dy === 0 ? h / 2 : 0);
      out.push({ x, y, leader: true });
    }
  }
  return out;
}

/** Candidate spots sliding along a horizontal line: just above it, then just below it. */
export function lineLabelCandidates(y: number, xFrom: number, xTo: number, w: number, h: number, step = 24): Candidate[] {
  const out: Candidate[] = [];
  for (let x = xFrom; x + w <= xTo; x += step) out.push({ x, y: y - h - 3 });
  for (let x = xFrom; x + w <= xTo; x += step) out.push({ x, y: y + 3 });
  return out;
}

/** Candidate spots sliding along a vertical line: right of it, then left of it, from the top downwards. */
export function verticalLineLabelCandidates(x: number, yFrom: number, yTo: number, w: number, h: number, step = 22): Candidate[] {
  const out: Candidate[] = [];
  for (let y = yFrom; y + h <= yTo; y += step) out.push({ x: x + 4, y });
  for (let y = yFrom; y + h <= yTo; y += step) out.push({ x: x - w - 4, y });
  return out;
}

/** `left` and `bottom` marks sit on a rail next to its caption, so their badges stay beside the mark instead of above it. */
export interface BadgeRequest { id: string; x: number; y: number; width: number; height: number; count: number; rail?: 'left' | 'bottom' }
/** Count badges: biggest stack first, each tries the four corners of its mark and is dropped if all four collide. */
export function placeBadges(requests: BadgeRequest[], offset = 7): Map<string, Rect> {
  const taken = new ObstacleGrid(32), out = new Map<string, Rect>();
  for (const b of [...requests].sort((p, q) => q.count - p.count || p.id.localeCompare(q.id))) {
    const middle = -b.height / 2;
    const spots: [number, number][] = b.rail === 'left' ? [[-offset - b.width, middle], [-offset - b.width, -offset - b.height + 2], [-offset - b.width, offset - 2]]
      : b.rail === 'bottom' ? [[offset, middle], [-offset - b.width, middle]]
      : [[offset, -offset - b.height], [-offset - b.width, -offset - b.height], [offset, offset - 2], [-offset - b.width, offset - 2]];
    for (const [dx, dy] of spots) {
      const r = rect(b.x + dx, b.y + dy, b.width, b.height);
      if (taken.overlap(r, 1) === 0) { taken.add(r); out.set(b.id, r); break; }
    }
  }
  return out;
}

/** Equal O2 partial pressure curve: O2 % at a total pressure for a partial pressure in kPa. */
export const o2AtPartialPressure = (partialKpa: number, totalKpa: number): number => (partialKpa * 100) / totalKpa;
