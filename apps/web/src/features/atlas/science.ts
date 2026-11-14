/**
 * Presentation adapter over @fire/core. Scientific rules (overlap, ranking, Jev order, hashing) live in core;
 * this file keeps the UI-facing signatures and the plain-language sentences.
 *
 * Local rules follow research/flame/BUILD_PLAN.md section 3.5 and 3.6:
 *  - overlap uses interval intersection with O2 +/- tolerance points and pressure +/- tolerance fraction
 *  - a null field makes the row "unknown", never a mismatch
 *  - burner stream O2 rows are excluded
 *  - baseline sort is lexicographic over the priority order, ties by accession
 */
import type {
  Agreement, BaselineKey, BaselineRankRow, Concern, Corpus, FuelPhase, GapStatement, InvestigationCard,
  JevJudgement, OverlapClass, Pillar, Range, Scenario, Sensitivity, StudyOverlap, TestRow, Tolerances,
} from '@fire/contracts';
import { DEFAULT_PRIORITY } from '@fire/contracts';
import * as core from '@fire/core';
import { PHASE_LABEL, fmtScenarioPressure } from './format';

// Rules (overlap classes, burner exclusion, lexicographic baseline) come from @fire/core, the single source of truth.
export function overlap(row: TestRow, scenario: Scenario, tol: Tolerances): OverlapClass {
  return core.overlap(row, scenario, tol);
}

export function studyOverlap(accession: string, rows: TestRow[], scenario: Scenario, tol: Tolerances): StudyOverlap {
  return { ...core.studyOverlap(rows.filter((r) => r.accession === accession), scenario, tol), accession };
}

export function baselineRank(
  cards: InvestigationCard[], rows: TestRow[], scenario: Scenario, tol: Tolerances, concern: Concern,
  priority: BaselineKey[] = DEFAULT_PRIORITY,
): BaselineRankRow[] {
  // Preview ranks every card; splitRanked below decides what is shown as ranked vs preview.
  return core.baselineRankAll(cards, rows, scenario, concern, tol, priority);
}

function permutations<T>(xs: T[]): T[][] {
  if (xs.length <= 1) return [xs.slice()];
  return xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));
}

export function baselineRankAll(
  cards: InvestigationCard[], rows: TestRow[], scenario: Scenario, tol: Tolerances, concern: Concern,
): { order: BaselineKey[]; ranking: BaselineRankRow[] }[] {
  return permutations(DEFAULT_PRIORITY).map((order) => ({ order, ranking: baselineRank(cards, rows, scenario, tol, concern, order) }));
}

/**
 * Only human reviewed (gold) cards are ranked. Until any card is reviewed, show every card in a preview
 * ranking that is labelled as such, so the table is never empty in a fresh build.
 */
export function splitRanked(cards: InvestigationCard[], ranking: BaselineRankRow[]): { ranked: BaselineRankRow[]; notRanked: InvestigationCard[]; preview: boolean } {
  const gold = new Set(cards.filter((c) => c.cardState === 'gold').map((c) => c.accession));
  if (gold.size === 0) return { ranked: ranking, notRanked: [], preview: ranking.length > 0 };
  const ranked = ranking.filter((r) => gold.has(r.accession)).map((r, i) => ({ ...r, rank: i + 1 }));
  return { ranked, notRanked: cards.filter((c) => !gold.has(c.accession)), preview: false };
}

export function sensitivity(all: { order: BaselineKey[]; ranking: BaselineRankRow[] }[], current: BaselineKey[], goldOnly?: Set<string>): Sensitivity {
  const top3 = (rk: BaselineRankRow[]) => rk.filter((r) => !goldOnly || goldOnly.has(r.accession)).slice(0, 3).map((r) => r.accession).sort().join('|');
  const base = all.find((a) => a.order.join() === current.join()) ?? all[0];
  const ref = base ? top3(base.ranking) : '';
  const changing = all.filter((a) => top3(a.ranking) !== ref).map((a) => a.order);
  return { ordersTested: all.length, top3Stable: changing.length === 0, changingOrders: changing };
}

export function jevRank(judgements: JevJudgement[], baseline: BaselineRankRow[], concern: Concern): { accession: string; rank: number }[] {
  const order = baseline.map((b) => b.accession);
  const known = new Set(order);
  return core.jevRank(judgements.filter((j) => known.has(j.accession)), concern, order).map((j, i) => ({ accession: j.accession, rank: i + 1 }));
}

export function agreement(
  baseline: BaselineRankRow[], jev: { accession: string; rank: number }[], labelOf: (accession: string) => string,
): Agreement {
  const jevMap = new Map(jev.map((j) => [j.accession, j.rank]));
  const common = baseline.filter((b) => jevMap.has(b.accession));
  if (common.length === 0) return { top3Overlap: 0, spearman: null, sentence: 'No Jev judgements for these studies, so there is nothing to compare.', disagreements: [] };
  const bRanks = common.map((b, i) => ({ accession: b.accession, br: i + 1 }));
  const jSorted = [...common].sort((a, b) => (jevMap.get(a.accession) ?? 0) - (jevMap.get(b.accession) ?? 0));
  const jRankOf = new Map(jSorted.map((c, i) => [c.accession, i + 1]));
  const k = Math.min(3, common.length);
  const bTop = bRanks.slice(0, k).map((x) => x.accession);
  const jTop = jSorted.slice(0, k).map((x) => x.accession);
  const top3Overlap = bTop.filter((a) => jTop.includes(a)).length;
  let spearman: number | null = null;
  if (common.length >= 2) {
    const n = common.length;
    const d2 = bRanks.reduce((s, x) => s + (x.br - (jRankOf.get(x.accession) ?? 0)) ** 2, 0);
    spearman = 1 - (6 * d2) / (n * (n * n - 1));
  }
  const disagreements = bRanks.filter((x) => x.br !== jRankOf.get(x.accession)).map((x) => ({ accession: x.accession, baselineRank: x.br, jevRank: jRankOf.get(x.accession) ?? 0 }));
  let sentence: string;
  if (bTop.join() === jTop.join()) sentence = k >= 3 ? 'Top 3 identical. Jev adds no reordering here.' : `Top ${k} identical. Jev adds no reordering here.`;
  else if (bTop[0] !== jTop[0]) sentence = `Jev moves ${labelOf(jTop[0] as string)} to #1.`;
  else if (top3Overlap === k) sentence = `Top ${k} hold the same studies in a different order.`;
  else sentence = `Top 1 agrees. Jev brings ${labelOf(jTop.find((a) => !bTop.includes(a)) as string)} into the top ${k}.`;
  return { top3Overlap, spearman, sentence, disagreements };
}

export function gapStatement(
  scenario: Scenario, rows: TestRow[], tol: Tolerances, opts: { k5Signed: boolean },
): GapStatement {
  const byPhase: Partial<Record<FuelPhase, number>> = {};
  let covers = 0;
  let maxSolid: number | null = null;
  for (const r of rows) {
    if (r.o2Location !== 'ambient') continue;
    if (r.fuel.phase === 'solid' && (r.o2Pct.max ?? r.o2Pct.min) != null) {
      const v = (r.o2Pct.max ?? r.o2Pct.min) as number;
      maxSolid = maxSolid == null ? v : Math.max(maxSolid, v);
    }
    if (overlap(r, scenario, tol) === 'covers') { covers++; byPhase[r.fuel.phase] = (byPhase[r.fuel.phase] ?? 0) + 1; }
  }
  const tables = new Map<string, { n: number; noO2: number }>();
  for (const r of rows) {
    const t = tables.get(r.accession) ?? { n: 0, noO2: 0 };
    t.n++;
    if (r.o2Pct.min == null && r.o2Pct.max == null) t.noO2++;
    tables.set(r.accession, t);
  }
  const unknownO2Tables = [...tables].filter(([, t]) => t.n > 0 && t.noO2 === t.n).map(([a]) => a);
  const phases = Object.entries(byPhase).map(([p, n]) => `${n} ${PHASE_LABEL[p as FuelPhase]}`).join(', ');
  const solidClause = maxSolid != null ? ` No solid-fuel row that reports O₂ goes above ${maxSolid.toFixed(1)}%.` : '';
  const sentence = covers > 0
    ? `Near ${scenario.label}, PSI has ${covers} test ${covers === 1 ? 'row' : 'rows'} that cover this air (${phases}).${solidClause}`
    : `PSI has no test row that covers ${scenario.label}. That is the gap.${solidClause}`;
  const scope = `This describes rows that report O₂ and pressure. ${unknownO2Tables.length} ${unknownO2Tables.length === 1 ? 'table reports' : 'tables report'} no O₂ and ${unknownO2Tables.length === 1 ? 'is' : 'are'} counted as unknown, not as absent. Partial-gravity combustion data: none in PSI.`;
  return {
    allowed: opts.k5Signed,
    sentence: opts.k5Signed ? sentence : null,
    scopeLine: opts.k5Signed ? scope : null,
    counts: { rowsNear: covers, byPhase, unknownO2Tables },
    reasonIfBlocked: opts.k5Signed ? null : 'Awaiting human sign-off (gate K5). The count below is computed by code.',
  };
}

export function describeView(
  scenario: Scenario, concern: Concern, o: { total: number; near: number; unit: Parameters<typeof fmtScenarioPressure>[1]; fuelFilter: FuelPhase[] },
): string {
  const fuel = o.fuelFilter.length ? ` Fuel filter: ${o.fuelFilter.map((p) => PHASE_LABEL[p]).join(', ')}.` : '';
  const c = concern === 'explore' ? 'No concern selected.' : `Concern: ${concern}.`;
  return `Each mark is one PSI test row, placed by pressure and O₂. The box is ${scenario.label}: ${scenario.o2Pct.toFixed(1)}% O₂ at ${fmtScenarioPressure(scenario.totalKpa, o.unit)}. ${o.near} of ${o.total} rows sit inside it. ${c}${fuel}`;
}

export function diffSummary(
  prev: { nearby: number; top: string | null }, next: { nearby: number; top: string | null },
): string {
  const d = next.nearby - prev.nearby;
  const n = d === 0 ? 'same number of tests nearby' : `${d > 0 ? '+' : ''}${d} tests nearby`;
  const t = next.top == null ? 'no ranked study' : prev.top === next.top ? `top study stays ${next.top}` : `top study changed to ${next.top}`;
  return `${n}, ${t}`;
}

export type HashState = 'ok' | 'mismatch' | 'fixture' | 'unchecked';
export async function verifyCorpusHash(corpus: Corpus): Promise<HashState> {
  if (corpus.fixture || corpus.corpusHash === 'fixture') return 'fixture';
  try {
    return core.corpusHash(corpus) === corpus.corpusHash ? 'ok' : 'mismatch';
  } catch {
    return 'unchecked';
  }
}
