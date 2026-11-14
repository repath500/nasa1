import { useEffect, useMemo, useState } from 'react';
import type {
  Agreement, BaselineRankRow, Corpus, EvidenceRecord, GapStatement, InvestigationCard, JevJudgement, Scenario, ScenarioId, Sensitivity, TestRow,
} from '@fire/contracts';
import { PRESETS } from '@fire/contracts';
import { useAtlas } from '../../state/store';
import { useCorpus } from '../../data/useCorpus';
import { FIXTURE_RECORDS, fixtureJudgement } from '../studies/fixtures';
import {
  agreement, baselineRank, baselineRankAll, gapStatement, jevRank, overlap, sensitivity, splitRanked, verifyCorpusHash, type HashState,
} from './science';

/** Human sign-off files (SPEC 10.4). The shape is a guess: signed means a non empty string `approver`. Lead: confirm. */
async function readSignoff(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return false;
    const type = res.headers.get('content-type') ?? '';
    if (!type.includes('json')) return false;
    const j = (await res.json()) as { approver?: unknown };
    return typeof j.approver === 'string' && j.approver.trim().length > 0;
  } catch {
    return false;
  }
}
let signoffs: Promise<{ k5: boolean; d5: boolean }> | null = null;
function useSignoffs() {
  const [v, setV] = useState({ k5: false, d5: false });
  useEffect(() => {
    signoffs ??= Promise.all([readSignoff('/data/reviews/k5.json'), readSignoff('/data/reviews/d5.json')]).then(([k5, d5]) => ({ k5, d5 }));
    let live = true;
    signoffs.then((s) => { if (live) setV(s); });
    return () => { live = false; };
  }, []);
  return v;
}

const hashCache = new Map<string, Promise<HashState>>();
function useHashState(corpus: Corpus | null): HashState | 'pending' {
  const [h, setH] = useState<HashState | 'pending'>('pending');
  useEffect(() => {
    if (!corpus) return;
    const key = corpus.corpusHash;
    let p = hashCache.get(key);
    if (!p) { p = verifyCorpusHash(corpus); hashCache.set(key, p); }
    let live = true;
    p.then((s) => { if (live) setH(s); });
    return () => { live = false; };
  }, [corpus]);
  return h;
}

export interface AtlasModel {
  status: 'loading' | 'error' | 'ready';
  message: string;
  corpus: Corpus | null;
  cards: InvestigationCard[];
  cardsByAcc: Map<string, InvestigationCard>;
  records: EvidenceRecord[];
  scenario: Scenario;
  /** Rows after the fuel filter. */
  rows: TestRow[];
  nearbyCount: number;
  baseline: BaselineRankRow[];
  ranked: BaselineRankRow[];
  notRanked: InvestigationCard[];
  preview: boolean;
  jev: Map<string, JevJudgement | null>;
  jevRanks: Map<string, number>;
  agreement: Agreement | null;
  sens: Sensitivity | null;
  gap: GapStatement;
  k5Signed: boolean;
  d5Signed: boolean;
  hash: HashState | 'pending';
  noAi: boolean;
  labelOf: (accession: string) => string;
  topLabel: string | null;
}

export function scenarioFor(habitat: ScenarioId, custom: { o2Pct: number; totalKpa: number }): Scenario {
  if (habitat === 'custom') return { id: 'custom', label: 'Custom air', o2Pct: custom.o2Pct, totalKpa: custom.totalKpa, sourceNote: 'Set by you', isExample: true };
  return PRESETS[habitat];
}

export function useAtlasModel(): AtlasModel {
  const cs = useCorpus();
  const habitat = useAtlas((s) => s.habitat);
  const custom = useAtlas((s) => s.custom);
  const concern = useAtlas((s) => s.concern);
  const fuelFilter = useAtlas((s) => s.fuelFilter);
  const tol = useAtlas((s) => s.tolerances);
  const priority = useAtlas((s) => s.priority);
  const mode = useAtlas((s) => s.mode);
  const ladder = useAtlas((s) => s.ladder);
  const { k5, d5 } = useSignoffs();
  const corpus = cs.status === 'ready' ? cs.corpus : null;
  const hash = useHashState(corpus);
  const scenario = useMemo(() => scenarioFor(habitat, custom), [habitat, custom]);
  const noAi = mode === 'no-ai' || ladder === 'L3-baseline';

  return useMemo<AtlasModel>(() => {
    const cards = corpus?.cards ?? [];
    const cardsByAcc = new Map(cards.map((c) => [c.accession, c]));
    const allRows = corpus?.rows ?? [];
    const rows = fuelFilter.length ? allRows.filter((r) => fuelFilter.includes(r.fuel.phase)) : allRows;
    const accepted = (corpus?.records ?? []).filter((r) => r.review.state === 'accepted');
    const records = corpus ? (corpus.fixture ? [...accepted, ...FIXTURE_RECORDS] : accepted) : [];
    const labelOf = (a: string) => cardsByAcc.get(a)?.acronym ?? a;
    const nearbyCount = rows.reduce((n, r) => n + (overlap(r, scenario, tol) === 'covers' ? 1 : 0), 0);
    const baseline = baselineRank(cards, rows, scenario, tol, concern, priority);
    const split = splitRanked(cards, baseline);
    const jev = new Map<string, JevJudgement | null>(split.ranked.map((r) => [r.accession, fixtureJudgement(r.accession, scenario.id)]));
    const judgements = [...jev.values()].filter((j): j is JevJudgement => j !== null);
    const jr = jevRank(judgements, split.ranked, concern);
    const jevRanks = new Map(jr.map((j) => [j.accession, j.rank]));
    const ag = judgements.length > 0 ? agreement(split.ranked, jr, labelOf) : null;
    const all = baselineRankAll(cards, rows, scenario, tol, concern);
    const goldSet = new Set(split.ranked.map((r) => r.accession));
    const sens = split.ranked.length >= 2 ? sensitivity(all, priority, goldSet) : null;
    const gap = gapStatement(scenario, rows, tol, { k5Signed: k5 });
    return {
      status: cs.status, message: cs.status === 'error' ? cs.message : '', corpus, cards, cardsByAcc, records, scenario, rows, nearbyCount,
      baseline, ranked: split.ranked, notRanked: split.notRanked, preview: split.preview, jev, jevRanks, agreement: ag, sens, gap,
      k5Signed: k5, d5Signed: d5, hash, noAi, labelOf, topLabel: split.ranked[0] ? labelOf(split.ranked[0].accession) : null,
    };
  }, [cs.status, corpus, scenario, concern, fuelFilter, tol, priority, k5, d5, hash, noAi]); // eslint-disable-line react-hooks/exhaustive-deps
}

export const isFixtureRecord = (r: EvidenceRecord) => r.id.startsWith('FIXTURE-');

export function bestRecordFor(records: EvidenceRecord[], row: TestRow): EvidenceRecord | undefined {
  return records.find((r) => r.accession === row.accession && r.locator.kind === 'csv-row' && r.locator.rowIndex === row.rowIndex);
}

export function retryLoad() {
  window.location.reload();
}
