import { scaleLinear, scaleLog } from 'd3-scale';
import type { PressureUnit, TestRow } from '@fire/contracts';

export const midpoint = (range: { min: number | null; max: number | null }): number | null => range.min === null ? range.max : range.max === null ? range.min : (range.min + range.max) / 2;
export const pressureValue = (value: number, unit: PressureUnit): number => value * ({ kPa: 1, psi: 0.1450377377, atm: 1 / 101.325, mmHg: 7.50061683 }[unit]);
export const formatPressure = (value: number, unit: PressureUnit): string => `${pressureValue(value, unit).toFixed(unit === 'atm' ? 2 : 1)} ${unit}`;
export const niceTicks = (min: number, max: number, count = 6): number[] => scaleLinear().domain([min, max]).ticks(count);
export interface RowGroup { pressure: number | null; oxygen: number | null; rows: TestRow[] }
export function groupRows(rows: TestRow[]): RowGroup[] {
  const groups = new Map<string, RowGroup>();
  for (const row of rows) {
    const pressure = midpoint(row.pressureKpa), oxygen = midpoint(row.o2Pct);
    const key = `${pressure}:${oxygen}:${row.fuel.phase}:${row.o2Location}`;
    const group = groups.get(key);
    if (group) group.rows.push(row); else groups.set(key, { pressure, oxygen, rows: [row] });
  }
  return [...groups.values()].map(group => ({ ...group, rows: group.rows.sort((left, right) => left.id.localeCompare(right.id)) }));
}
export function nearestPoint<T extends { x: number; y: number }>(points: T[], x: number, y: number, radius: number): T | undefined {
  let best: T | undefined; let distance = radius * radius;
  for (const point of points) { const next = (point.x - x) ** 2 + (point.y - y) ** 2; if (next <= distance) { distance = next; best = point; } }
  return best;
}

export function nearestDirectional<T extends { x: number; y: number }>(points: T[], origin: T, direction: string): T | undefined {
  const axis = direction === 'ArrowLeft' ? [-1, 0] : direction === 'ArrowRight' ? [1, 0] : direction === 'ArrowUp' ? [0, -1] : [0, 1];
  return points.filter(point => point !== origin && (point.x - origin.x) * axis[0]! + (point.y - origin.y) * axis[1]! > 0)
    .sort((left, right) => Math.hypot(left.x - origin.x, left.y - origin.y) - Math.hypot(right.x - origin.x, right.y - origin.y))[0];
}

export function boxHit(x: number, y: number, left: number, top: number, right: number, bottom: number, tolerance = 10): string | null {
  if (x < left - tolerance || x > right + tolerance || y < top - tolerance || y > bottom + tolerance) return null;
  const horizontal = Math.abs(x - left) <= tolerance ? 'w' : Math.abs(x - right) <= tolerance ? 'e' : '';
  const vertical = Math.abs(y - top) <= tolerance ? 'n' : Math.abs(y - bottom) <= tolerance ? 's' : '';
  return vertical + horizontal || 'move';
}

const UNIT_FACTOR: Record<PressureUnit, number> = { kPa: 1, psi: 0.1450377377, atm: 1 / 101.325, mmHg: 7.50061683 };
const compact = (v: number): string => (v >= 100 ? v.toFixed(0) : v >= 10 ? String(Number(v.toFixed(1))) : String(Number(v.toPrecision(2))));

/** Pressure axis ticks chosen in the display unit (so psi shows 5, 10, 20), mapped back to kPa for placement.
 *  Log axes keep only 1-2-5 mantissas so labels never collide. */
export function pressureAxisTicks(domainKpa: [number, number], unit: PressureUnit, log: boolean, count = 7): { kpa: number; label: string }[] {
  const f = UNIT_FACTOR[unit];
  const lo = Math.max(Math.min(domainKpa[0], domainKpa[1]) * f, 1e-6), hi = Math.max(domainKpa[0], domainKpa[1]) * f;
  let values: number[];
  if (log) {
    values = scaleLog().domain([lo, hi]).ticks(count);
    const major = values.filter((v) => { const m = v / 10 ** Math.floor(Math.log10(v) + 1e-9); return [1, 2, 5].some((k) => Math.abs(m - k) < 1e-6); });
    if (major.length >= 3) values = major;
    if (values.length > 9) { const step = Math.ceil(values.length / 8); values = values.filter((_, i) => i % step === 0); }
  } else {
    values = scaleLinear().domain([lo, hi]).ticks(count);
  }
  return values.filter((v) => v > 0).map((v) => ({ kpa: v / f, label: compact(v) }));
}
