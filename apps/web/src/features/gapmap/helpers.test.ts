import { describe, expect, it } from 'vitest';
import type { TestRow } from '@fire/contracts';
import { boxHit, formatPressure, groupRows, nearestDirectional, nearestPoint, niceTicks } from './helpers';
import { exportFooter } from './export';

describe('gap map helpers', () => {
  it('generates readable ticks', () => expect(niceTicks(0, 100, 5)).toEqual([0, 20, 40, 60, 80, 100]));
  it('formats pressure units', () => expect(formatPressure(101.325, 'atm')).toBe('1.00 atm'));
  it('groups equal conditions deterministically', () => { const row = { id: 'b', pressureKpa: { min: 100, max: 100 }, o2Pct: { min: 21, max: 21 }, fuel: { phase: 'solid' }, o2Location: 'ambient' } as TestRow; expect(groupRows([row, { ...row, id: 'a' }])[0]?.rows.map(item => item.id)).toEqual(['a', 'b']); });
  it('finds nearby points without returning distant ones', () => { const points = [{ x: 1, y: 1 }, { x: 10, y: 10 }]; expect(nearestPoint(points, 2, 2, 3)).toBe(points[0]); expect(nearestPoint(points, 5, 5, 1)).toBeUndefined(); });
  it('navigates to the nearest point in a direction', () => { const origin = { x: 5, y: 5 }; const right = { x: 7, y: 6 }; expect(nearestDirectional([origin, { x: 2, y: 5 }, right, { x: 20, y: 5 }], origin, 'ArrowRight')).toBe(right); });
  it('distinguishes box edges, corners and interior', () => { expect(boxHit(10, 10, 10, 10, 100, 100)).toBe('nw'); expect(boxHit(50, 50, 10, 10, 100, 100)).toBe('move'); expect(boxHit(150, 50, 10, 10, 100, 100)).toBeNull(); });
  it('makes a deterministic fallback citation', () => { expect(exportFooter(undefined, ['b', 'a', 'b'])[1]).toBe('Corpus: a, b'); });
});

import { pressureAxisTicks } from './helpers';
it('log pressure ticks keep 1-2-5 labels and never crowd', () => {
  const labels = pressureAxisTicks([1, 350], 'kPa', true).map((t) => t.label);
  expect(labels.length).toBeLessThanOrEqual(9);
  expect(labels).toContain('100');
  expect(labels.every((l) => /^[125]0*$|^0\.[125]$/.test(l))).toBe(true);
  const psi = pressureAxisTicks([1, 350], 'psi', true).map((t) => t.label);
  expect(psi).toContain('10');
});
