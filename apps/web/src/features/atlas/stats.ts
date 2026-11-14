import type { FuelPhase, Gravity, InvestigationCard, Range, TestRow } from '@fire/contracts';

/** Pure helpers shared by the study, compare and brief pages. Code only, no model. */

export function span(rows: TestRow[], pick: (r: TestRow) => Range): Range {
  let min: number | null = null;
  let max: number | null = null;
  for (const r of rows) {
    const v = pick(r);
    if (v.min != null) min = min == null ? v.min : Math.min(min, v.min);
    if (v.max != null) max = max == null ? v.max : Math.max(max, v.max);
    if (v.min != null && v.max == null) max = max == null ? v.min : Math.max(max, v.min);
    if (v.max != null && v.min == null) min = min == null ? v.max : Math.min(min, v.max);
  }
  return { min, max };
}

export function distinct<T>(xs: (T | null | undefined)[]): T[] {
  return [...new Set(xs.filter((x): x is T => x != null && (x as unknown) !== ''))];
}

/** Largest dimension in a size string, in millimetres. "1.69 mm" is 1.69. "40.6 x 94 cm" is 940. Null if unparseable. */
export function sizeMm(text: string | null | undefined): number | null {
  if (!text) return null;
  let best: number | null = null;
  for (const m of text.matchAll(/(\d+(?:\.\d+)?(?:\s*x\s*\d+(?:\.\d+)?)*)\s*(mm|cm|microns?|µm|um|m)\b/gi)) {
    const u = (m[2] as string).toLowerCase();
    const f = u === 'mm' ? 1 : u === 'cm' ? 10 : u === 'm' ? 1000 : 0.001;
    for (const n of (m[1] as string).split(/x/i)) {
      const v = Number(n) * f;
      if (Number.isFinite(v)) best = best == null ? v : Math.max(best, v);
    }
  }
  return best;
}

export function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = xs.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? (s[m] as number) : ((s[m - 1] as number) + (s[m] as number)) / 2;
}

export interface StudyFacts {
  n: number;
  fuels: string[];
  phases: FuelPhase[];
  geometries: string[];
  scaleMm: number | null;
  o2: Range;
  pressure: Range;
  flow: Range;
  gravity: Gravity[];
  unknownO2: number;
  unknownPressure: number;
  burnerRows: number;
}

export function studyFacts(rows: TestRow[], card?: InvestigationCard): StudyFacts {
  const sizes = rows.map((r) => sizeMm(r.fuel.size) ?? sizeMm(r.fuel.name)).filter((x): x is number => x != null);
  return {
    n: rows.length,
    fuels: distinct(rows.map((r) => r.fuel.name?.trim())),
    phases: distinct([...rows.map((r) => r.fuel.phase), ...(card?.fuelPhases ?? [])]),
    geometries: distinct(rows.map((r) => [r.fuel.geometry, r.fuel.size].filter(Boolean).join(', ') || null)),
    scaleMm: median(sizes),
    o2: span(rows.filter((r) => r.o2Location === 'ambient'), (r) => r.o2Pct),
    pressure: span(rows, (r) => r.pressureKpa),
    flow: span(rows, (r) => r.flowCmS),
    gravity: distinct([...rows.map((r) => r.gravity), ...(card?.gravityRegimes ?? [])]),
    unknownO2: rows.filter((r) => r.o2Pct.min == null && r.o2Pct.max == null).length,
    unknownPressure: rows.filter((r) => r.pressureKpa.min == null && r.pressureKpa.max == null).length,
    burnerRows: rows.filter((r) => r.o2Location === 'burner').length,
  };
}

const ID_COL = /date|gmt|time stamp|identifier|^#|test #|number|index/i;
const MEASURE_COL = /measure|rate|duration|diameter|burn|spread|temperature|extinction|length|final|speed|mass|time/i;

/** Table columns whose values differed between rows (how the tests varied), from the raw headers. */
export function variedColumns(rows: TestRow[]): { column: string; distinct: number }[] {
  const keys = new Set<string>();
  rows.forEach((r) => Object.keys(r.raw).forEach((k) => keys.add(k)));
  const out: { column: string; distinct: number }[] = [];
  for (const k of keys) {
    if (ID_COL.test(k)) continue;
    const vals = new Set(rows.map((r) => (r.raw[k] ?? '').trim()).filter((v) => v !== ''));
    if (vals.size >= 2 && vals.size <= 40) out.push({ column: k.trim(), distinct: vals.size });
  }
  return out.sort((a, b) => a.distinct - b.distinct).slice(0, 12);
}

/** Columns that look like recorded measurements (from table headers only; sensor lists live in the PSI record). */
export function measuredColumns(rows: TestRow[]): string[] {
  const keys = new Set<string>();
  rows.forEach((r) => Object.keys(r.raw).forEach((k) => keys.add(k.trim())));
  return [...keys].filter((k) => MEASURE_COL.test(k) && !/ambient|initial/i.test(k)).slice(0, 14);
}
