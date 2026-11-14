/**
 * ADAPTER (W5). Thin local stand ins for the W3 science functions in @fire/core.
 * Every export here uses the exact name the @fire/core function will have, so the lead can replace
 * this file's body with re-exports from '@fire/core' in one edit. Components never re implement science,
 * they only call these names.
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
import { PHASE_LABEL, fmtScenarioPressure } from './format';

const inBand = (r: Range, center: number, halfWidth: number): boolean | null => {
  if (r.min == null && r.max == null) return null;
  const lo = (r.min ?? r.max) as number;
  const hi = (r.max ?? r.min) as number;
  return hi >= center - halfWidth && lo <= center + halfWidth;
};

export function overlap(row: TestRow, scenario: Scenario, tol: Tolerances): OverlapClass {
  if (row.o2Location === 'burner') return 'excluded-burner';
  if (row.o2Location === 'unknown') return 'unknown';
  const o2 = inBand(row.o2Pct, scenario.o2Pct, tol.o2PctPoints);
  const p = inBand(row.pressureKpa, scenario.totalKpa, scenario.totalKpa * tol.pressureFrac);
  if (o2 === null || p === null) return 'unknown';
  if (o2 && p) return 'covers';
  if (o2) return 'near-o2-only';
  if (p) return 'near-pressure-only';
  return 'none';
}

const CLASS_ORDER: OverlapClass[] = ['covers', 'near-o2-only', 'near-pressure-only', 'unknown', 'none', 'excluded-burner'];

export function studyOverlap(accession: string, rows: TestRow[], scenario: Scenario, tol: Tolerances): StudyOverlap {
  const out: StudyOverlap = { accession, covers: 0, nearO2Only: 0, nearPressureOnly: 0, none: 0, unknown: 0, excludedBurner: 0, bestClass: 'unknown' };
  const seen = new Set<OverlapClass>();
  for (const r of rows) {
    if (r.accession !== accession) continue;
    const c = overlap(r, scenario, tol);
    seen.add(c);
    if (c === 'covers') out.covers++;
    else if (c === 'near-o2-only') out.nearO2Only++;
    else if (c === 'near-pressure-only') out.nearPressureOnly++;
    else if (c === 'none') out.none++;
    else if (c === 'unknown') out.unknown++;
    else out.excludedBurner++;
  }
  out.bestClass = CLASS_ORDER.find((c) => seen.has(c)) ?? 'unknown';
  return out;
}

const matchOf = (card: InvestigationCard, concern: Concern): 'primary' | 'secondary' | 'none' => {
  if (concern === 'explore') return 'none';
  if (card.pillarPrimary === concern) return 'primary';
  if (card.pillarSecondary === concern) return 'secondary';
  return 'none';
};

function keyValue(r: BaselineRankRow, k: BaselineKey): number {
  switch (k) {
    case 'pillar_match': return r.pillarMatch === 'primary' ? 2 : r.pillarMatch === 'secondary' ? 1 : 0;
    case 'covers_count': return r.overlap.covers;
    case 'evidence_tier': return r.evidenceTier ?? -1;
    case 'near_count': return r.overlap.nearO2Only + r.overlap.nearPressureOnly;
  }
}

export function baselineRank(
  cards: InvestigationCard[], rows: TestRow[], scenario: Scenario, tol: Tolerances, concern: Concern,
  priority: BaselineKey[] = DEFAULT_PRIORITY,
): BaselineRankRow[] {
  const items: BaselineRankRow[] = cards.map((c) => ({
    accession: c.accession, rank: 0, pillarMatch: matchOf(c, concern),
    overlap: studyOverlap(c.accession, rows, scenario, tol), evidenceTier: c.evidenceTier,
  }));
  items.sort((a, b) => {
    for (const k of priority) {
      const d = keyValue(b, k) - keyValue(a, k);
      if (d !== 0) return d;
    }
    return a.accession.localeCompare(b.accession, 'en', { numeric: true });
  });
  items.forEach((it, i) => { it.rank = i + 1; });
  return items;
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

const bin = (x: number | null): number => (x == null ? -1 : Math.round(x * 10) / 10);

export function jevRank(judgements: JevJudgement[], baseline: BaselineRankRow[], concern: Concern): { accession: string; rank: number }[] {
  const base = new Map(baseline.map((b) => [b.accession, b.rank]));
  const rows = judgements.filter((j) => base.has(j.accession));
  const pSel = (j: JevJudgement) => (concern === 'explore' || !j.pillar ? null : (j.pillar.probabilities[concern as Pillar] ?? null));
  rows.sort((a, b) => {
    const d1 = bin(b.regimeRelevance) - bin(a.regimeRelevance);
    if (d1 !== 0) return d1;
    const d2 = bin(b.evidenceDirectness == null ? null : b.evidenceDirectness / 3) - bin(a.evidenceDirectness == null ? null : a.evidenceDirectness / 3);
    if (d2 !== 0) return d2;
    const d3 = bin(pSel(b)) - bin(pSel(a));
    if (d3 !== 0) return d3;
    return (base.get(a.accession) ?? 0) - (base.get(b.accession) ?? 0);
  });
  return rows.map((j, i) => ({ accession: j.accession, rank: i + 1 }));
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
  const scope = `This describes rows that report O₂ and pressure. ${unknownO2Tables.length} ${unknownO2Tables.length === 1 ? 'table reports' : 'tables report'} no O₂ and ${unknownO2Tables.length === 1 ? 'is' : 'are'} counted as unknown, not as absent. Partial gravity: none in PSI.`;
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

/** Canonical JSON with sorted keys. The lead must confirm W2 uses the same canonical form before enforcing the block. */
function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o).sort().map((k) => `${JSON.stringify(k)}:${canonical(o[k])}`).join(',')}}`;
  }
  return JSON.stringify(v);
}

export type HashState = 'ok' | 'mismatch' | 'fixture' | 'unchecked';
export async function verifyCorpusHash(corpus: Corpus): Promise<HashState> {
  if (corpus.fixture || corpus.corpusHash === 'fixture') return 'fixture';
  try {
    if (!globalThis.crypto?.subtle) return 'unchecked';
    const bytes = new TextEncoder().encode(canonical({ cards: corpus.cards, rows: corpus.rows, rejects: corpus.rejects, records: corpus.records }));
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
    return hex === corpus.corpusHash ? 'ok' : 'mismatch';
  } catch {
    return 'unchecked';
  }
}
