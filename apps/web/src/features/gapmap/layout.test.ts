import { describe, expect, it } from 'vitest';
import { ObstacleGrid, boxLabelCandidates, computeGeometry, lineLabelCandidates, o2AtPartialPressure, overlaps, placeBadges, placeLabels, rect } from './layout';

describe('gap map layout', () => {
  it('keeps 1 unit = 1 px below the max width and never lets the rails touch the plot', () => {
    const phone = computeGeometry(343, 0, { compact: false, fill: false });
    expect(phone.scale).toBe(1);
    expect(phone.W).toBe(343);
    expect(phone.railX + phone.railW).toBeLessThan(phone.L);
    expect(phone.railY).toBeGreaterThan(phone.B);
    const wide = computeGeometry(2200, 900, { compact: false, fill: true });
    expect(wide.W).toBe(1100);
    expect(wide.scale).toBe(2);
    expect(wide.H).toBe(450);
    expect(wide.R).toBeGreaterThan(wide.L);
    expect(wide.B).toBeGreaterThan(wide.T + 100);
  });

  it('puts the habitat label above its box when there is room and below it when there is not', () => {
    const box = rect(200, 100, 80, 40);
    const bounds = rect(0, 0, 600, 400);
    const free = placeLabels([{ id: 'a', width: 90, height: 14, priority: 1, candidates: boxLabelCandidates(box, 90, 14) }], new ObstacleGrid(), bounds);
    expect(free.get('a')).toMatchObject({ x: 200, y: 100 - 14 - 3, leader: false, overlapped: false });
    const marks = new ObstacleGrid(); marks.add(rect(205, 70, 60, 20));
    const moved = placeLabels([{ id: 'a', width: 90, height: 14, priority: 1, candidates: boxLabelCandidates(box, 90, 14) }], marks, bounds).get('a')!;
    expect(overlaps(rect(moved.x, moved.y, 90, 14), rect(205, 70, 60, 20))).toBe(false);
  });

  it('keeps labels apart from each other and from marks, with leader lines as a last resort', () => {
    const bounds = rect(0, 0, 500, 300);
    const box = rect(200, 120, 60, 30);
    const marks = new ObstacleGrid();
    // Ring of marks around the box so no tidy spot is free.
    for (let x = 150; x <= 320; x += 14) for (const y of [70, 84, 98, 160, 174, 188]) marks.add(rect(x, y, 12, 12));
    const requests = ['a', 'b', 'c'].map((id, i) => ({ id, width: 100, height: 14, priority: 3 - i, candidates: boxLabelCandidates(box, 100, 14), essential: true }));
    const out = placeLabels(requests, marks, bounds);
    const rects = [...out.values()].map((p) => rect(p.x, p.y, p.width, p.height));
    expect(rects).toHaveLength(3);
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) expect(overlaps(rects[i]!, rects[j]!)).toBe(false);
    expect([...out.values()].some((p) => p.leader)).toBe(true);
    for (const p of out.values()) expect(p.overlapped).toBe(false);
  });

  it('drops non-essential labels instead of drawing them over marks', () => {
    const marks = new ObstacleGrid(); marks.add(rect(0, 0, 500, 300));
    const out = placeLabels([{ id: 'n', width: 80, height: 14, priority: 1, candidates: lineLabelCandidates(100, 10, 400, 80, 14) }], marks, rect(0, 0, 500, 300));
    expect(out.has('n')).toBe(false);
  });

  it('places count badges at distinct corners and drops the ones that cannot fit', () => {
    const requests = [
      { id: 'big', x: 100, y: 100, width: 18, height: 13, count: 24 },
      { id: 'near', x: 106, y: 100, width: 18, height: 13, count: 2 },
    ];
    const out = placeBadges(requests);
    expect(out.size).toBeGreaterThanOrEqual(1);
    const rects = [...out.values()];
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) expect(overlaps(rects[i]!, rects[j]!, 1)).toBe(false);
    expect(out.has('big')).toBe(true);
  });

  it('computes the equal-pO2 curve from a partial pressure', () => {
    expect(o2AtPartialPressure(21.273, 101.3)).toBeCloseTo(21, 1);
    expect(o2AtPartialPressure(21.273, 50)).toBeCloseTo(42.546, 3);
  });
});
