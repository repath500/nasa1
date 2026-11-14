import type { JevJudgement } from '@fire/contracts';
import { apiBase, type Env } from '../env.ts';
import { UpstreamError, upstreamJson } from './upstream.ts';
import { DecisionUpstreamSchema, toPillarRecord } from './schemas.ts';
import { buildJevQuestions, buildJevState, type JudgeContext, type JudgeOptions } from './jev.ts';
import { consumeProviderCall } from './budget.ts';

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

export const judgeWithDecision1 = async (
  env: Env,
  ctx: JudgeContext,
  options?: JudgeOptions,
): Promise<JevJudgement> => {
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

