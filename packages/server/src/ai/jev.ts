import type { Concern, JevJudgement, Pillar } from '@fire/contracts';
import { apiBase, type Env } from '../env.ts';
import { UpstreamError, upstreamJson } from './upstream.ts';
import { JevUpstreamSchema, PILLARS, toPillarRecord } from './schemas.ts';
import { consumeProviderCall } from './budget.ts';
import type { BridgeScenario } from '../core-bridge.ts';
import type { StudyMeta } from './studies.ts';

export const JEV_MODEL = 'jev-1.14.0';
export const JEV_BASE = 'https://api.typesafe.ai';
export const JEV_PATH = '/v1/systemone';

export interface JudgeContext {
  study: StudyMeta;
  scenario: BridgeScenario;
  concern: Concern;
}

const CHOICE_CRITERIA: Record<Pillar, string> = {
  prevention: 'material flammability or ignition of solids',
  detection: 'smoke or particle sensing',
  suppression: 'extinguishing, dilution or quenching of flames',
  fundamental: 'basic flame science without a direct safety-control finding',
  unknown: 'the evidence does not say',
};

export const DIRECTNESS_CRITERIA = [
  'No measurement of burning behaviour is described, or only a model result',
  'Context or secondary reanalysis of measurements made elsewhere',
  'Direct flight observation, but test conditions are only partly identified',
  'Direct flight measurement with identified conditions and stated limitations',
];

/** No numerals in criteria text: the model does not see level numbers. */
export const buildJevQuestions = (): Record<string, unknown> => ({
  pillar: {
    type: 'choice',
    instructions:
      'Which fire-safety purpose is most directly served by the evidence described? Judge what the evidence supports, not what would be desirable.',
    criteria: CHOICE_CRITERIA,
  },
  regime_relevance: {
    type: 'noul',
    instructions:
      'Does the described evidence cover combustion conditions (oxygen, pressure, fuel type) close enough to the scenario to be a useful starting point for a literature review, even though gravity, apparatus and fuel differ? This is not a statement that the scenario is safe or validated.',
  },
  evidence_directness: {
    type: 'score',
    instructions:
      'How directly does the described evidence measure combustion behaviour that a reader could cite for this scenario? Judge directness only, not the prestige of the study.',
    criteria: DIRECTNESS_CRITERIA,
  },
});

export const buildJevState = (ctx: JudgeContext): Record<string, unknown> => ({
  investigation: {
    accession: ctx.study.accession,
    acronym: ctx.study.acronym,
    title: ctx.study.title,
    objective: ctx.study.objective,
    fuel_phases: ctx.study.phases,
    hardware: ctx.study.hardware,
    gravity: ctx.study.gravity,
  },
  accepted_evidence: {
    // The request has no corpus payload. Null means not provided, never zero.
    n_rows_parsed: null,
    n_rows_near_scenario: null,
    o2_pct_range_tested: null,
    pressure_kpa_range_tested: null,
    oxygen_location: 'ambient',
    sample_quotes: [],
  },
  scenario: {
    id: ctx.scenario.id,
    label: ctx.scenario.label,
    o2_pct: ctx.scenario.o2Pct,
    total_kpa: ctx.scenario.totalKpa,
    note: 'illustrative preset atmosphere, not a design value',
  },
  question_context: {
    pillar: ctx.concern === 'explore' ? ctx.study.pillar : ctx.concern,
  },
});

const sum = (values: number[]): number => values.reduce((total, value) => total + value, 0);

const levelProbabilities = (record: Record<string, number>): [number, number, number, number] => {
  const levels: [number, number, number, number] = [
    record['0'] ?? 0,
    record['1'] ?? 0,
    record['2'] ?? 0,
    record['3'] ?? 0,
  ];
  const keys = Object.keys(record);
  if (keys.some((key) => !['0', '1', '2', '3'].includes(key))) {
    throw new UpstreamError('score returned an unknown level', 502);
  }
  if (Math.abs(sum(levels) - 1) > 0.02) throw new UpstreamError('score probabilities do not sum to one', 502);
  return levels;
};

const weightedLevel = (levels: [number, number, number, number]): number =>
  Number(levels.reduce((total, probability, index) => total + probability * index, 0).toFixed(2));

const readPillar = (answer: {
  choice: Pillar;
  confidence: number;
  probabilities: Record<string, number>;
}): JevJudgement['pillar'] => {
  const probabilities = toPillarRecord(answer.probabilities);
  if (Object.keys(probabilities).length === 0) throw new UpstreamError('choice has no known options', 502);
  if (Math.abs(sum(Object.values(probabilities)) - 1) > 0.02) {
    throw new UpstreamError('choice probabilities do not sum to one', 502);
  }
  if (!(answer.choice in probabilities)) throw new UpstreamError('choice is not one of the options', 502);
  return { choice: answer.choice, probabilities, confidence: answer.confidence };
};

export interface JudgeOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  now?: () => Date;
  baseUrl?: string;
}

export const judgeWithJev = async (
  env: Env,
  ctx: JudgeContext,
  options?: JudgeOptions,
): Promise<JevJudgement> => {
  if (!env.TYPESAFE_API_KEY) throw new UpstreamError('Jev is not configured', 503);
  consumeProviderCall(env, 'typesafe');
  const data = await upstreamJson({
    fetchImpl: options?.fetchImpl,
    url: apiBase(options?.baseUrl ?? env.TYPESAFE_API_BASE, JEV_BASE) + JEV_PATH,
    timeoutMs: options?.timeoutMs ?? 5000,
    provider: 'Jev',
    init: {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + env.TYPESAFE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: JEV_MODEL,
        state: buildJevState(ctx),
        questions: buildJevQuestions(),
      }),
    },
  });
  const parsed = JevUpstreamSchema.safeParse(data);
  if (!parsed.success) throw new UpstreamError('Jev returned an unexpected shape', 502);
  const answer = parsed.data.answers;
  const levels = levelProbabilities(answer.evidence_directness.probabilities);
  const pillar = readPillar(answer.pillar);
  return {
    accession: ctx.study.accession,
    scenarioId: ctx.scenario.id,
    regimeRelevance: answer.regime_relevance.noul,
    evidenceDirectness: weightedLevel(levels),
    directnessProbs: levels,
    pillar,
    source: 'jev-live',
    modelId: parsed.data.model,
    recordedAt: (options?.now?.() ?? new Date()).toISOString(),
  };
};

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle] ?? 0;
  return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
};

/**
 * At authoring time Jev varies by a few hundredths. Median the repeats, keep
 * the probability vector, and let ranking bin to 0.1.
 */
export const medianJudgements = (judgements: JevJudgement[]): JevJudgement => {
  const first = judgements[0];
  if (!first) throw new UpstreamError('no Jev answers', 502);
  const probs = [0, 1, 2, 3].map((index) =>
    median(judgements.map((item) => item.directnessProbs?.[index] ?? 0)),
  );
  const levels: [number, number, number, number] = [probs[0] ?? 0, probs[1] ?? 0, probs[2] ?? 0, probs[3] ?? 0];
  const total = sum(levels);
  const normalised: [number, number, number, number] = levels.map((p) => p / total) as [
    number,
    number,
    number,
    number,
  ];
  const pillarKeys = PILLARS;
  const pillarProbabilities: Partial<Record<Pillar, number>> = {};
  for (const key of pillarKeys) {
    const values = judgements
      .map((item) => item.pillar?.probabilities[key])
      .filter((value): value is number => typeof value === 'number');
    if (values.length > 0) pillarProbabilities[key] = median(values);
  }
  const pillarTotal = sum(Object.values(pillarProbabilities));
  let best: Pillar = 'unknown';
  let bestValue = -1;
  for (const key of pillarKeys) {
    const value = pillarProbabilities[key] ?? 0;
    if (value > bestValue) {
      best = key;
      bestValue = value;
    }
  }
  return {
    accession: first.accession,
    scenarioId: first.scenarioId,
    regimeRelevance: median(judgements.map((item) => item.regimeRelevance ?? 0)),
    evidenceDirectness: weightedLevel(normalised),
    directnessProbs: normalised,
    pillar: {
      choice: best,
      probabilities: pillarProbabilities,
      confidence: pillarTotal > 0 ? (pillarProbabilities[best] ?? 0) / pillarTotal : 0,
    },
    source: first.source,
    modelId: first.modelId,
    recordedAt: first.recordedAt,
  };
};

export const judgeWithJevRepeats = async (
  env: Env,
  ctx: JudgeContext,
  repeats: number,
  options?: JudgeOptions,
): Promise<JevJudgement> => {
  if (repeats <= 1) return judgeWithJev(env, ctx, options);
  const calls = await Promise.all(
    Array.from({ length: repeats }, () => judgeWithJev(env, ctx, options)),
  );
  return medianJudgements(calls);
};
