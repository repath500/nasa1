import type { FuelPhase, Scenario, TestRow, Tolerances } from '@fire/contracts';

/**
 * Local helper for live counts until @fire/core lands (SPEC §10.3: only ambient O2 counts, unknown is not none).
 * TODO(contract): swap for the @fire/core overlap classifier.
 */
export interface NearCounts {
  /** Rows with both O2 and pressure reported and inside the tolerance box. */
  covers: number;
  byPhase: Partial<Record<FuelPhase, number>>;
  /** Rows that cannot be placed because O2 or pressure was not reported. */
  unplaceable: number;
  total: number;
}

const overlaps = (min: number | null, max: number | null, lo: number, hi: number): boolean => {
  if (min === null && max === null) return false;
  const a = min ?? max!; const b = max ?? min!;
  return a <= hi && b >= lo;
};

export function isNear(row: TestRow, s: Pick<Scenario, 'o2Pct' | 'totalKpa'>, tol: Tolerances): boolean {
  if (row.o2Location !== 'ambient') return false;
  return overlaps(row.o2Pct.min, row.o2Pct.max, s.o2Pct - tol.o2PctPoints, s.o2Pct + tol.o2PctPoints)
    && overlaps(row.pressureKpa.min, row.pressureKpa.max, s.totalKpa * (1 - tol.pressureFrac), s.totalKpa * (1 + tol.pressureFrac));
}

export function countNear(rows: TestRow[], s: Pick<Scenario, 'o2Pct' | 'totalKpa'>, tol: Tolerances, phases: FuelPhase[] = [], material: string | null = null): NearCounts {
  const out: NearCounts = { covers: 0, byPhase: {}, unplaceable: 0, total: 0 };
  for (const r of rows) {
    if (phases.length && !phases.includes(r.fuel.phase)) continue;
    if (material && (r.fuel.name ?? '').toLowerCase() !== material.toLowerCase()) continue;
    out.total++;
    const noO2 = r.o2Pct.min === null && r.o2Pct.max === null;
    const noP = r.pressureKpa.min === null && r.pressureKpa.max === null;
    if (r.o2Location === 'ambient' && (noO2 || noP)) out.unplaceable++;
    if (isNear(r, s, tol)) { out.covers++; out.byPhase[r.fuel.phase] = (out.byPhase[r.fuel.phase] ?? 0) + 1; }
  }
  return out;
}

/** Highest reported ambient O2 among rows of a phase, or null when no row reports one. */
export function maxO2(rows: TestRow[], phase: FuelPhase): number | null {
  let m: number | null = null;
  for (const r of rows) {
    if (r.fuel.phase !== phase || r.o2Location !== 'ambient') continue;
    const v = r.o2Pct.max ?? r.o2Pct.min;
    if (v !== null && (m === null || v > m)) m = v;
  }
  return m;
}

export const PHASE_LABEL: Record<FuelPhase, string> = {
  solid: 'solid', 'liquid-droplet': 'liquid-droplet', gas: 'gas', aerosol: 'aerosol', unknown: 'unknown-phase',
};

/** Code-written briefing sentence (SPEC §3.2 summary). Counts only, no verdicts. */
export function briefingSentence(opts: { concern: string; scenario: Pick<Scenario, 'o2Pct' | 'totalKpa' | 'label'>; counts: NearCounts; phases: FuelPhase[]; solidMax: number | null; kpaLabel: string }): string {
  const { concern, scenario, counts, phases, solidMax, kpaLabel } = opts;
  const lead = concern === 'explore' ? 'Evidence' : `${concern[0]!.toUpperCase()}${concern.slice(1)} evidence`;
  const scope = phases.length ? `${phases.map((p) => PHASE_LABEL[p]).join(' and ')} fuels` : 'all fuel types';
  const near = `${counts.covers} ${counts.covers === 1 ? 'test is' : 'tests are'} nearby`;
  const solidNote = solidMax === null
    ? ''
    : scenario.o2Pct > solidMax ? ` No solid-fuel row in this set reports O₂ above ${solidMax}%.` : '';
  return `${lead} near ${scenario.o2Pct}% O₂ at ${kpaLabel}, ${scope}: ${near}.${solidNote}`;
}
