import type { JevJudgement } from '@fire/contracts';
import { apiBase, type Env } from '../env.ts';
import { UpstreamError, upstreamJson } from './upstream.ts';
import { DecisionUpstreamSchema, toPillarRecord } from './schemas.ts';
import { buildJevQuestions, buildJevState, type JudgeContext, type JudgeOptions } from './jev.ts';
import { consumeProviderCall } from './budget.ts';
import { openRouterConfigured, openRouterJson } from './openrouter.ts';
import { z } from 'zod';

export const DECISION_MODEL = 'gemini-decision-1';
export const DECISION_BASE = 'https://generativelanguage.googleapis.com';
export const DECISION_PATH = '/v1beta/decisions';

export interface DecisionRequest {
  model: string;
  input: string;
  questions: Record<string, unknown>;
}

/** The fallback adapter: same questions, `input` instead of `state`. */
export const buildDecisionRequest = (ctx: JudgeContext): DecisionRequest => ({
  model: DECISION_MODEL,
  input: JSON.stringify(buildJevState(ctx)),
  questions: buildJevQuestions(),
});

const sum = (values: number[]): number => values.reduce((total, value) => total + value, 0);

const levelsFrom = (probabilities: Record<string, number>): [number, number, number, number] => {
  const levels: [number, number, number, number] = [
    probabilities['0'] ?? 0,
    probabilities['1'] ?? 0,
    probabilities['2'] ?? 0,
    probabilities['3'] ?? 0,
  ];
  if (Object.keys(probabilities).some((key) => !['0', '1', '2', '3'].includes(key))) {
    throw new UpstreamError('decision-1 returned an unknown level', 502);
  }
  if (Math.abs(sum(levels) - 1) > 0.02) throw new UpstreamError('decision-1 probabilities do not sum to one', 502);
  return levels;
};

const PILLARS = ['prevention', 'detection', 'suppression', 'fundamental', 'unknown'] as const;
const prob = { type: 'number', minimum: 0, maximum: 1 };
const HYDROGEN_JUDGE_SCHEMA = {
  type: 'object',
  properties: {
    regime_relevance: { ...prob, description: 'Probability the answer to the regime_relevance question is yes.' },
    evidence_directness: {
      type: 'object',
      properties: { level_0: prob, level_1: prob, level_2: prob, level_3: prob },
      required: ['level_0', 'level_1', 'level_2', 'level_3'],
      additionalProperties: false,
      description: 'Probability of each criterion, in the order given; must sum to 1.',
    },
    pillar: {
      type: 'object',
      properties: {
        choice: { type: 'string', enum: [...PILLARS] },
        probabilities: { type: 'object', properties: Object.fromEntries(PILLARS.map((p) => [p, prob])), required: [...PILLARS], additionalProperties: false },
        confidence: prob,
      },
      required: ['choice', 'probabilities', 'confidence'],
      additionalProperties: false,
    },
  },
  required: ['regime_relevance', 'evidence_directness', 'pillar'],
  additionalProperties: false,
};
const HydrogenJudgeSchema = z.object({
  regime_relevance: z.number().min(0).max(1),
  evidence_directness: z.object({ level_0: z.number().min(0).max(1), level_1: z.number().min(0).max(1), level_2: z.number().min(0).max(1), level_3: z.number().min(0).max(1) }),
  pillar: z.object({ choice: z.enum(PILLARS), probabilities: z.record(z.number().min(0).max(1)), confidence: z.number().min(0).max(1) }),
});

/**
 * Fallback judge: Gemini 4 Hydrogen via OpenRouter answers the same three questions Jev is asked, as typed JSON.
 * Its probabilities are the model's own stated distribution, not calibrated and not a probability that the science
 * is true. Always labelled hydrogen-fallback, never Jev.
 */
export const judgeWithHydrogenFallback = async (env: Env, ctx: JudgeContext, options?: JudgeOptions): Promise<JevJudgement> => {
  const result = await openRouterJson(env, {
    schemaName: 'fire_atlas_judgement',
    schema: HYDROGEN_JUDGE_SCHEMA,
    system: 'You judge NASA microgravity combustion evidence for a literature screen. Answer only the questions given, using only the state given. Do not assess fire safety. Return only the JSON object.',
    user: JSON.stringify({ state: buildJevState(ctx), questions: buildJevQuestions() }),
    timeoutMs: options?.timeoutMs ?? 6000,
    fetchImpl: options?.fetchImpl,
  });
  const parsed = HydrogenJudgeSchema.safeParse(result.value);
  if (!parsed.success) throw new UpstreamError('Hydrogen judgement failed validation', 502);
  const d = parsed.data;
  const raw = [d.evidence_directness.level_0, d.evidence_directness.level_1, d.evidence_directness.level_2, d.evidence_directness.level_3];
  const total = sum(raw);
  if (Math.abs(total - 1) > 0.05) throw new UpstreamError('Hydrogen directness probabilities do not sum to one', 502);
  const levels = raw.map((p) => p / total) as [number, number, number, number];
  const pillarTotal = sum(Object.values(d.pillar.probabilities));
  if (Math.abs(pillarTotal - 1) > 0.05) throw new UpstreamError('Hydrogen pillar probabilities do not sum to one', 502);
  const probabilities = toPillarRecord(Object.fromEntries(Object.entries(d.pillar.probabilities).map(([k, v]) => [k, v / pillarTotal])));
  return {
    accession: ctx.study.accession,
    scenarioId: ctx.scenario.id,
    regimeRelevance: d.regime_relevance,
    evidenceDirectness: Number(levels.reduce((acc, p, i) => acc + p * i, 0).toFixed(2)),
    directnessProbs: levels,
    pillar: { choice: d.pillar.choice, probabilities, confidence: d.pillar.confidence },
    source: 'hydrogen-fallback',
    modelId: result.modelId,
    recordedAt: (options?.now?.() ?? new Date()).toISOString(),
  };
};

export const judgeWithDecision1 = async (
  env: Env,
  ctx: JudgeContext,
  options?: JudgeOptions,
): Promise<JevJudgement> => {
  // Gemini decision-1 is not available on OpenRouter; with an OpenRouter key the fallback judge is Hydrogen.
  if (openRouterConfigured(env)) return judgeWithHydrogenFallback(env, ctx, options);
  if (!env.GEMINI_API_KEY) throw new UpstreamError('decision-1 is not configured', 503);
  consumeProviderCall(env, 'gemini');
  const body = buildDecisionRequest(ctx);
  const data = await upstreamJson({
    fetchImpl: options?.fetchImpl,
    url: apiBase(options?.baseUrl ?? env.GEMINI_API_BASE, DECISION_BASE) + DECISION_PATH,
    timeoutMs: options?.timeoutMs ?? 5000,
    provider: 'decision-1',
    init: {
      method: 'POST',
      headers: { 'x-goog-api-key': env.GEMINI_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  });
  const parsed = DecisionUpstreamSchema.safeParse(data);
  if (!parsed.success) throw new UpstreamError('decision-1 returned an unexpected shape', 502);
  const answer = parsed.data.answers;
  const levels = levelsFrom(answer.evidence_directness.probabilities);
  const probabilities = toPillarRecord(answer.pillar.probabilities);
  if (Object.keys(probabilities).length === 0) throw new UpstreamError('decision-1 choice has no known options', 502);
  if (Math.abs(sum(Object.values(probabilities)) - 1) > 0.02) {
    throw new UpstreamError('decision-1 choice probabilities do not sum to one', 502);
  }
  if (!(answer.pillar.choice in probabilities)) throw new UpstreamError('decision-1 choice is unknown', 502);
  return {
    accession: ctx.study.accession,
    scenarioId: ctx.scenario.id,
    regimeRelevance: answer.regime_relevance.noul,
    evidenceDirectness: Number(levels.reduce((total, probability, index) => total + probability * index, 0).toFixed(2)),
    directnessProbs: levels,
    pillar: {
      choice: answer.pillar.choice,
      probabilities,
      confidence: answer.pillar.confidence,
    },
    // Always labelled decision-1, never Jev.
    source: 'decision-1',
    modelId: DECISION_MODEL,
    recordedAt: (options?.now?.() ?? new Date()).toISOString(),
  };
};

