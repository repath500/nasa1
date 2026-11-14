import { DEFAULT_PRIORITY } from '@fire/contracts';
import type { Agreement, BaselineKey, BaselineRankRow, Concern, FuelPhase, GapStatement, InvestigationCard, JevJudgement, OverlapClass, Range, Scenario, Sensitivity, StudyOverlap, TestRow, Tolerances } from '@fire/contracts';
function intersects(range: Range, min: number, max: number): boolean | null {
  if (range.min === null && range.max === null) return null;
  return (range.min ?? range.max!) <= max && (range.max ?? range.min!) >= min;
}
export function overlap(row: TestRow, scenario: Scenario, tolerances: Tolerances): OverlapClass {
  if (row.o2Location === 'burner') return 'excluded-burner';
  const oxygen = row.o2Location === 'ambient' ? intersects(row.o2Pct, scenario.o2Pct - tolerances.o2PctPoints, scenario.o2Pct + tolerances.o2PctPoints) : null;
  const pressure = intersects(row.pressureKpa, scenario.totalKpa * (1 - tolerances.pressureFrac), scenario.totalKpa * (1 + tolerances.pressureFrac));
  // Truth table (oxygen, pressure): in/in covers; in/out near-o2-only;
  // out/in near-pressure-only; out/out none; any unknown unknown.
  if (oxygen === null || pressure === null) return 'unknown';
  if (oxygen && pressure) return 'covers';
  if (oxygen) return 'near-o2-only';
  if (pressure) return 'near-pressure-only';
  return 'none';
}
export function studyOverlap(rows: TestRow[], scenario: Scenario, tol: Tolerances): StudyOverlap {
  const result: StudyOverlap = { accession: rows[0]?.accession ?? '', covers: 0, nearO2Only: 0, nearPressureOnly: 0, none: 0, unknown: 0, excludedBurner: 0, bestClass: 'unknown' };
  const keys = { covers: 'covers', 'near-o2-only': 'nearO2Only', 'near-pressure-only': 'nearPressureOnly', none: 'none', unknown: 'unknown', 'excluded-burner': 'excludedBurner' } as const;
  for (const row of rows) result[keys[overlap(row, scenario, tol)]]++;
  const order: OverlapClass[] = ['covers', 'near-o2-only', 'near-pressure-only', 'unknown', 'none', 'excluded-burner'];
  result.bestClass = order.find(item => result[keys[item]] > 0) ?? 'unknown';
  return result;
}
export function splitRanked(cards: InvestigationCard[]): { rankable: InvestigationCard[]; metadataOnly: InvestigationCard[] } {
  return { rankable: cards.filter(card => card.cardState !== 'metadata_only'), metadataOnly: cards.filter(card => card.cardState === 'metadata_only') };
}
export function baselineRankAll(cards: InvestigationCard[], rows: TestRow[], scenario: Scenario, concern: Concern, tolerances: Tolerances, priority: BaselineKey[] = DEFAULT_PRIORITY): BaselineRankRow[] {
  const ranked: BaselineRankRow[] = cards.map(card => {
    const summary = studyOverlap(rows.filter(row => row.accession === card.accession), scenario, tolerances);
    summary.accession = card.accession;
    const pillarMatch = concern !== 'explore' && card.pillarPrimary === concern ? 'primary' : concern !== 'explore' && card.pillarSecondary === concern ? 'secondary' : 'none';
    return { accession: card.accession, rank: 0, pillarMatch, overlap: summary, evidenceTier: card.evidenceTier };
  });
  const value = (row: BaselineRankRow, key: BaselineKey): number => ({ pillar_match: { primary: 2, secondary: 1, none: 0 }[row.pillarMatch], covers_count: row.overlap.covers, evidence_tier: row.evidenceTier ?? -1, near_count: row.overlap.nearO2Only + row.overlap.nearPressureOnly })[key];
  ranked.sort((left, right) => { for (const key of priority) { const difference = value(right, key) - value(left, key); if (difference) return difference; } return left.accession.localeCompare(right.accession); });
  return ranked.map((row, index) => ({ ...row, rank: index + 1 }));
}
export function baselineRank(cards: InvestigationCard[], rows: TestRow[], scenario: Scenario, concern: Concern, tolerances: Tolerances, priority: BaselineKey[] = DEFAULT_PRIORITY): BaselineRankRow[] {
  return baselineRankAll(splitRanked(cards).rankable, rows, scenario, concern, tolerances, priority);
}
function permutations<T>(items: T[]): T[][] { return items.length ? items.flatMap((item, index) => permutations(items.filter((_, other) => index !== other)).map(rest => [item, ...rest])) : [[]]; }
export function sensitivity(cards: InvestigationCard[], rows: TestRow[], scenario: Scenario, concern: Concern, tolerances: Tolerances, priority: BaselineKey[] = DEFAULT_PRIORITY): Sensitivity {
  const top = baselineRank(cards, rows, scenario, concern, tolerances, priority).slice(0, 3).map(row => row.accession).join('\0');
  const orders = permutations(DEFAULT_PRIORITY);
  const changingOrders = orders.filter(order => baselineRank(cards, rows, scenario, concern, tolerances, order).slice(0, 3).map(row => row.accession).join('\0') !== top);
  return { ordersTested: orders.length, top3Stable: changingOrders.length === 0, changingOrders };
}
export const scoreFromProbs = (probs: number[]): number => probs.reduce((sum, probability, index) => sum + index * probability, 0);
export function jevRank(judgements: JevJudgement[], concern: Concern, baselineOrder: string[]): JevJudgement[] {
  const bin = (value: number | null | undefined): number => value == null ? -1 : Math.floor((value + 1e-9) * 10);
  const score = (judgement: JevJudgement): number[] => [bin(judgement.regimeRelevance), bin(judgement.evidenceDirectness == null ? null : judgement.evidenceDirectness / 3), bin(concern === 'explore' ? null : judgement.pillar?.probabilities[concern])];
  return [...judgements].sort((left, right) => { const a = score(left), b = score(right); for (let index = 0; index < a.length; index++) { const diff = b[index]! - a[index]!; if (diff) return diff; } const leftIndex = baselineOrder.indexOf(left.accession), rightIndex = baselineOrder.indexOf(right.accession); return (leftIndex < 0 ? Infinity : leftIndex) - (rightIndex < 0 ? Infinity : rightIndex) || left.accession.localeCompare(right.accession); });
}
export function agreement(baselineOrder: string[], jevOrder: string[], names: Record<string, string> = {}): Agreement {
  const common = baselineOrder.filter(item => jevOrder.includes(item));
  const baseline = baselineOrder.filter(item => common.includes(item));
  const jev = jevOrder.filter(item => common.includes(item));
  const disagreements = baseline.map((accession, index) => ({ accession, baselineRank: index + 1, jevRank: jev.indexOf(accession) + 1 })).filter(item => item.baselineRank !== item.jevRank);
  const top3Overlap = baselineOrder.slice(0, 3).filter(item => jevOrder.slice(0, 3).includes(item)).length;
  const spearman = common.length < 3 ? null : 1 - 6 * baseline.reduce((sum, item, index) => sum + (index - jev.indexOf(item)) ** 2, 0) / (common.length * (common.length ** 2 - 1));
  const same = baselineOrder.length === jevOrder.length && baselineOrder.every((item, index) => item === jevOrder[index]);
  const leader = jevOrder[0];
  const sentence = same ? 'Baseline and Jev give the same order.' : leader && leader !== baselineOrder[0] ? `Jev moves ${names[leader] ?? leader} to #1.` : top3Overlap === Math.min(3, baselineOrder.length, jevOrder.length) ? 'Top 3 identical. Jev changes their order.' : 'Baseline and Jev differ in their top studies.';
  return { top3Overlap, spearman, sentence, disagreements };
}
export function gapStatement(rows: TestRow[], cards: InvestigationCard[], scenario: Scenario, tol: Tolerances, opts: { k5SignedOff: boolean }): GapStatement {
  const near = rows.filter(row => overlap(row, scenario, tol) === 'covers');
  const byPhase: Partial<Record<FuelPhase, number>> = {};
  for (const row of near) byPhase[row.fuel.phase] = (byPhase[row.fuel.phase] ?? 0) + 1;
  const solidAccessions = new Set(rows.filter(row => row.fuel.phase === 'solid').map(row => row.accession));
  const unknownO2Tables = [...solidAccessions].filter(accession => !rows.some(row => row.accession === accession && row.fuel.phase === 'solid' && row.o2Location === 'ambient' && (row.o2Pct.min !== null || row.o2Pct.max !== null))).sort();
  const counts = { rowsNear: near.length, byPhase, unknownO2Tables };
  if (!opts.k5SignedOff) return { allowed: false, sentence: null, scopeLine: null, counts, reasonIfBlocked: 'Awaiting human sign-off (gate K5)' };
  const phases = [...new Set(near.map(row => row.fuel.phase))];
  const studyNames = [...new Set(near.map(row => cards.find(card => card.accession === row.accession)?.acronym ?? row.accession))];
  const solidO2 = rows.filter(row => row.fuel.phase === 'solid' && row.o2Location === 'ambient').flatMap(row => [row.o2Pct.min, row.o2Pct.max]).filter((value): value is number => value !== null);
  const findings = near.length ? `Near ${scenario.label}, PSI has ${phases.join(', ')} tests (${studyNames.join(', ')}).` : `Near ${scenario.label}, PSI has no matching reported tests.`;
  const ceiling = solidO2.length ? ` No solid-fuel test that reports ambient oxygen in these rows goes above ${Math.max(...solidO2)}%.` : ' Ambient oxygen is not reported in the available solid-fuel rows.';
  return { allowed: true, sentence: findings + ceiling, scopeLine: 'Rows that report O2 only. Solid-fuel tables without O2 are counted as unknown, not absent.', counts, reasonIfBlocked: null };
}
export function describeView(rows: TestRow[], scenario: Scenario, tol: Tolerances): string { const count = rows.filter(row => overlap(row, scenario, tol) === 'covers').length; return `The map shows ${count} reported tests near ${scenario.label}, using the selected oxygen and pressure tolerances.`; }
export function diffSummary(prev: { nearby: number; topStudy: string | null }, next: { nearby: number; topStudy: string | null }): string { const delta = next.nearby - prev.nearby; const parts = delta ? [`${delta > 0 ? '+' : ''}${delta} tests nearby`] : []; if (prev.topStudy !== next.topStudy) parts.push(next.topStudy ? `top study changed to ${next.topStudy}` : 'no top study'); return parts.join(', ') || 'No change in nearby tests or top study'; }
