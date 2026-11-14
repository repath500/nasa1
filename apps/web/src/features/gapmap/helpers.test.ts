import { describe, expect, it } from 'vitest';
import type { TestRow } from '@fire/contracts';
import { formatPressure, groupRows, nearestPoint, niceTicks } from './helpers';

describe('gap map helpers', () => {
  it('generates readable ticks', () => expect(niceTicks(0, 100, 5)).toEqual([0, 20, 40, 60, 80, 100]));
  it('formats pressure units', () => expect(formatPressure(101.325, 'atm')).toBe('1.00 atm'));
  it('groups equal conditions deterministically', () => { const row = { id: 'b', pressureKpa: { min: 100, max: 100 }, o2Pct: { min: 21, max: 21 }, fuel: { phase: 'solid' }, o2Location: 'ambient' } as TestRow; expect(groupRows([row, { ...row, id: 'a' }])[0]?.rows.map(item => item.id)).toEqual(['a', 'b']); });
  it('finds nearby points without returning distant ones', () => { const points = [{ x: 1, y: 1 }, { x: 10, y: 10 }]; expect(nearestPoint(points, 2, 2, 3)).toBe(points[0]); expect(nearestPoint(points, 5, 5, 1)).toBeUndefined(); });
});
