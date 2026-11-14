import type { EvidenceRecord, JevJudgement, Pillar, ScenarioId } from '@fire/contracts';

/**
 * Fixture Jev judgements (SPEC section 11, rule R8). Shown with the label below and the FIXTURE chip.
 * DRAFT NOTE FOR THE TEAM: these values were drafted by a coding agent as placeholders so the two ranker
 * layout can be built and tested. A human on the team must replace or sign them before submission,
 * because the on screen label says they are human authored. They are not model output.
 */
export const FIXTURE_LABEL = 'FIXTURE · human-authored, not model output';
export const FIXTURE_RECORDED_AT = '2026-11-14T00:00:00Z';

type Preset = Exclude<ScenarioId, 'custom'>;
const SCENARIOS: Preset[] = ['earth-iss', 'lunar-cabin-example', 'exploration-upper', 'suit'];

interface Seed {
  /** regime relevance P(yes) per scenario, same order as SCENARIOS */
  rel: [number, number, number, number];
  /** modal evidence directness level 0..3 */
  dir: 0 | 1 | 2 | 3;
  pillar: Pillar;
}

const SEEDS: Record<string, Seed> = {
  'PSI-69': { rel: [0.62, 0.88, 0.84, 0.12], dir: 3, pillar: 'suppression' },
  'PSI-25': { rel: [0.9, 0.18, 0.08, 0.03], dir: 3, pillar: 'prevention' },
  'PSI-26': { rel: [0.83, 0.14, 0.07, 0.03], dir: 2, pillar: 'prevention' },
  'PSI-98': { rel: [0.86, 0.22, 0.1, 0.04], dir: 3, pillar: 'prevention' },
  'PSI-99': { rel: [0.88, 0.25, 0.12, 0.05], dir: 3, pillar: 'prevention' },
  'PSI-100': { rel: [0.7, 0.2, 0.1, 0.04], dir: 2, pillar: 'prevention' },
  'PSI-102': { rel: [0.74, 0.3, 0.2, 0.05], dir: 2, pillar: 'detection' },
  'PSI-101': { rel: [0.68, 0.28, 0.18, 0.05], dir: 2, pillar: 'detection' },
  'PSI-107': { rel: [0.4, 0.2, 0.1, 0.05], dir: 1, pillar: 'fundamental' },
  'PSI-20': { rel: [0.42, 0.35, 0.3, 0.1], dir: 1, pillar: 'fundamental' },
  'PSI-159': { rel: [0.2, 0.3, 0.28, 0.2], dir: 1, pillar: 'fundamental' },
  'PSI-47': { rel: [0.45, 0.2, 0.1, 0.05], dir: 1, pillar: 'detection' },
};

const PILLARS: Pillar[] = ['prevention', 'detection', 'suppression', 'fundamental', 'unknown'];

function dirProbs(level: number): number[] {
  const p = [0, 0, 0, 0];
  p[level] = 0.6;
  const nb = [level - 1, level + 1].filter((i) => i >= 0 && i <= 3);
  nb.forEach((i) => { p[i] = 0.4 / nb.length; });
  return p;
}

function build(accession: string, scenarioId: Preset): JevJudgement | null {
  const seed = SEEDS[accession];
  if (!seed) return null;
  const probs = dirProbs(seed.dir);
  const others = PILLARS.filter((p) => p !== seed.pillar);
  const probabilities: Partial<Record<Pillar, number>> = { [seed.pillar]: 0.7 };
  others.forEach((p, i) => { probabilities[p] = i < 2 ? 0.12 : i === 2 ? 0.04 : 0.02; });
  return {
    accession, scenarioId,
    regimeRelevance: seed.rel[SCENARIOS.indexOf(scenarioId)] ?? null,
    evidenceDirectness: probs.reduce((s, p, i) => s + p * i, 0),
    directnessProbs: probs,
    pillar: { choice: seed.pillar, probabilities, confidence: 0.7 },
    source: 'fixture', modelId: 'fixture', recordedAt: FIXTURE_RECORDED_AT,
  };
}

/** Judgement for one study and scenario. Custom air has no fixture: callers show "not available". */
export function fixtureJudgement(accession: string, scenarioId: ScenarioId): JevJudgement | null {
  if (scenarioId === 'custom') return null;
  return build(accession, scenarioId);
}

/** Modal level: the level with the highest probability (UI_SPEC 2.5). */
export function modalLevel(j: JevJudgement): number | null {
  const p = j.directnessProbs;
  if (!p || p.length === 0) return null;
  let best = 0;
  p.forEach((v, i) => { if (v > (p[best] ?? 0)) best = i; });
  return best;
}

/**
 * Fixture evidence records, merged only when the corpus itself is a fixture.
 * The quote text is a verbatim line from the NTRS 20180004258 slide text; its page is not yet confirmed.
 * review.by stays null: agents never set a reviewer name.
 */
export const FIXTURE_RECORDS: EvidenceRecord[] = [
  {
    id: 'FIXTURE-Q-001', accession: 'PSI-69', sourceId: 'ntrs:20180004258', origin: 'text_span', evidenceKind: 'quote',
    locator: { kind: 'page', page: null, rowIndex: null, csvSha12: null },
    quote: 'This has historically been 30% O2, 10.2 psia (shuttle pre-EVA atm)',
    paraphrase: null,
    limitations: ['Slide text about material screening conditions, not a FLEX result.', 'Page number not yet confirmed against the full PDF.'],
    review: { state: 'proposed', by: null, at: null, notes: null },
  },
  {
    id: 'FIXTURE-P-001', accession: 'PSI-25', sourceId: 'ntrs:20210011385', origin: 'human_entry', evidenceKind: 'paraphrase',
    locator: { kind: 'page', page: null, rowIndex: null, csvSha12: null },
    quote: null,
    paraphrase: 'FIXTURE text. A team written summary of the BASS-II report would appear here, with its locator and DOI.',
    limitations: ['Publisher or GOV_PERMITTED source, so paraphrase only (R3).'],
    review: { state: 'proposed', by: null, at: null, notes: null },
  },
];
