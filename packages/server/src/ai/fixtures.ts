import type { JevJudgement, Pillar, ScenarioId } from '@fire/contracts';
import { CORE_STUDIES } from './studies.ts';

/**
 * HUMAN-AUTHORED FIXTURES, NOT MODEL OUTPUT.
 * SPEC §11 and R8: the public build ships fixtures until provider terms are read.
 * They are labelled source 'fixture' and must render the FIXTURE chip.
 * Values are ordinal stand-ins for a scenario, never probabilities that the
 * science is true.
 */
export const FIXTURE_MODEL_ID = 'fixture-placeholder-v1';
export const FIXTURE_RECORDED_AT = '2026-11-14T00:00:00.000Z';
export const FIXTURE_NOTE =
  'FIXTURE: placeholder values, not model output, not yet reviewed. Judgements are ordinal stand-ins for this scenario, not probabilities that the science is true.';

type PresetId = Exclude<ScenarioId, 'custom'>;

interface FixtureRow {
  accession: string;
  regimeRelevance: number;
  directnessProbs: [number, number, number, number];
}

const RELEVANCE: Record<PresetId, Record<string, number>> = {
  'earth-iss': {
    'PSI-98': 0.57,
    'PSI-99': 0.54,
    'PSI-100': 0.56,
    'PSI-26': 0.71,
    'PSI-25': 0.8,
    'PSI-69': 0.66,
    'PSI-102': 0.63,
    'PSI-101': 0.6,
    'PSI-107': 0.45,
    'PSI-20': 0.58,
  },
  'lunar-cabin-example': {
    'PSI-98': 0.38,
    'PSI-99': 0.36,
    'PSI-100': 0.35,
    'PSI-26': 0.4,
    'PSI-25': 0.47,
    'PSI-69': 0.84,
    'PSI-102': 0.44,
    'PSI-101': 0.42,
    'PSI-107': 0.6,
    'PSI-20': 0.41,
  },
  'exploration-upper': {
    'PSI-98': 0.34,
    'PSI-99': 0.33,
    'PSI-100': 0.32,
    'PSI-26': 0.36,
    'PSI-25': 0.41,
    'PSI-69': 0.62,
    'PSI-102': 0.4,
    'PSI-101': 0.39,
    'PSI-107': 0.66,
    'PSI-20': 0.37,
  },
  suit: {
    'PSI-98': 0.07,
    'PSI-99': 0.06,
    'PSI-100': 0.06,
    'PSI-26': 0.08,
    'PSI-25': 0.09,
    'PSI-69': 0.14,
    'PSI-102': 0.11,
    'PSI-101': 0.1,
    'PSI-107': 0.12,
    'PSI-20': 0.08,
  },
};

type Probs = [number, number, number, number];

const DIRECTNESS: Record<string, Probs> = {
  'PSI-98': [0.03, 0.12, 0.34, 0.51],
  'PSI-99': [0.04, 0.13, 0.34, 0.49],
  'PSI-100': [0.03, 0.14, 0.35, 0.48],
  'PSI-26': [0.05, 0.19, 0.37, 0.39],
  'PSI-25': [0.04, 0.16, 0.36, 0.44],
  'PSI-69': [0.02, 0.1, 0.31, 0.57],
  'PSI-102': [0.06, 0.22, 0.38, 0.34],
  'PSI-101': [0.07, 0.23, 0.38, 0.32],
  'PSI-107': [0.12, 0.3, 0.34, 0.24],
  'PSI-20': [0.1, 0.28, 0.38, 0.24],
};

const PILLAR_PROBS: Record<string, { choice: Pillar; probabilities: Partial<Record<Pillar, number>>; confidence: number }> = {
  'PSI-98': { choice: 'suppression', probabilities: { suppression: 0.62, fundamental: 0.24, prevention: 0.1, detection: 0.02, unknown: 0.02 }, confidence: 0.62 },
  'PSI-99': { choice: 'suppression', probabilities: { suppression: 0.6, fundamental: 0.26, prevention: 0.1, detection: 0.02, unknown: 0.02 }, confidence: 0.6 },
  'PSI-100': { choice: 'suppression', probabilities: { suppression: 0.61, fundamental: 0.25, prevention: 0.1, detection: 0.02, unknown: 0.02 }, confidence: 0.61 },
  'PSI-26': { choice: 'prevention', probabilities: { prevention: 0.66, fundamental: 0.24, suppression: 0.06, detection: 0.02, unknown: 0.02 }, confidence: 0.66 },
  'PSI-25': { choice: 'prevention', probabilities: { prevention: 0.71, fundamental: 0.19, suppression: 0.06, detection: 0.02, unknown: 0.02 }, confidence: 0.71 },
  'PSI-69': { choice: 'suppression', probabilities: { suppression: 0.58, fundamental: 0.31, prevention: 0.06, detection: 0.03, unknown: 0.02 }, confidence: 0.58 },
  'PSI-102': { choice: 'detection', probabilities: { detection: 0.68, fundamental: 0.18, suppression: 0.06, prevention: 0.04, unknown: 0.04 }, confidence: 0.68 },
  'PSI-101': { choice: 'detection', probabilities: { detection: 0.64, fundamental: 0.22, suppression: 0.06, prevention: 0.04, unknown: 0.04 }, confidence: 0.64 },
  'PSI-107': { choice: 'fundamental', probabilities: { fundamental: 0.55, suppression: 0.3, prevention: 0.08, detection: 0.04, unknown: 0.03 }, confidence: 0.55 },
  'PSI-20': { choice: 'prevention', probabilities: { prevention: 0.48, fundamental: 0.38, suppression: 0.08, detection: 0.03, unknown: 0.03 }, confidence: 0.48 },
};

const weightedLevel = (probs: Probs): number =>
  Number(probs.reduce((sum, p, index) => sum + p * index, 0).toFixed(2));

const buildRows = (scenarioId: PresetId): FixtureRow[] =>
  CORE_STUDIES.map((study) => ({
    accession: study.accession,
    regimeRelevance: RELEVANCE[scenarioId][study.accession] ?? 0.2,
    directnessProbs: DIRECTNESS[study.accession] ?? [0.25, 0.25, 0.25, 0.25],
  }));

export const fixtureJudgements = (scenarioId: PresetId): JevJudgement[] =>
  buildRows(scenarioId).map((row) => {
    const pillar = PILLAR_PROBS[row.accession] ?? null;
    return {
      accession: row.accession,
      scenarioId,
      regimeRelevance: row.regimeRelevance,
      evidenceDirectness: weightedLevel(row.directnessProbs),
      directnessProbs: [...row.directnessProbs],
      pillar: pillar ? { choice: pillar.choice, probabilities: { ...pillar.probabilities }, confidence: pillar.confidence } : null,
      source: 'fixture',
      modelId: FIXTURE_MODEL_ID,
      recordedAt: FIXTURE_RECORDED_AT,
    };
  });
