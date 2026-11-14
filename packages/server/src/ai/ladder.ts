import type { Concern, JevJudgement, LadderLevel, RankResponse, ScenarioId } from '@fire/contracts';
import { geminiConfigured, jevConfigured, type Env } from '../env.ts';
import { presetScenario, scriptHash } from '../core-bridge.ts';
import { CORE_STUDIES } from './studies.ts';
import { judgeWithJevRepeats, JEV_MODEL, type JudgeContext, type JudgeOptions } from './jev.ts';
import { DECISION_MODEL, judgeWithDecision1 } from './decision1.ts';
import { fileCache, type CacheStore } from './cache.ts';
import { CachedRankSchema, JevJudgementsSchema } from './schemas.ts';
import { FIXTURE_NOTE, fixtureJudgements } from './fixtures.ts';

export const RUBRIC_VERSION = 'rubric-v1';

export interface RankInput {
  scenarioId: Exclude<ScenarioId, 'custom'>;
  concern: Concern;
  corpusHash: string;
}

export interface LadderOptions extends JudgeOptions {
  cache?: CacheStore;
  repeats?: number;
}

export const cacheKeyFor = async (input: RankInput, model: string): Promise<string> =>
  scriptHash({
    corpusHash: input.corpusHash,
    rubricVersion: RUBRIC_VERSION,
    model,
    scenarioId: input.scenarioId,
    concern: input.concern,
  });

const contexts = (input: RankInput): JudgeContext[] => {
  const scenario = presetScenario(input.scenarioId);
  if (!scenario) throw new Error('unknown preset');
  return CORE_STUDIES.map((study) => ({ study, scenario, concern: input.concern }));
};

const fixtures = (input: RankInput): RankResponse => ({
  ladder: 'L3-baseline',
  judgements: fixtureJudgements(input.scenarioId),
  note: FIXTURE_NOTE + ' Baseline ranking is the default order.',
});

const cached = async (
  cache: CacheStore,
  input: RankInput,
  model: string,
): Promise<RankResponse | null> => {
  const key = await cacheKeyFor(input, model);
  const raw = await cache.read(key);
  if (!raw) return null;
  const parsed = CachedRankSchema.safeParse(raw);
  if (!parsed.success) return null;
  const judgements: JevJudgement[] = parsed.data.judgements.map((item) => ({
    ...item,
    source: 'cache',
    modelId: parsed.data.modelId,
    recordedAt: parsed.data.recordedAt,
  }));
  const checked = JevJudgementsSchema.safeParse(judgements);
  if (!checked.success) return null;
  return {
    ladder: 'L2-cache',
    judgements,
    note: 'Cached response, recorded ' + parsed.data.recordedAt + ', model ' + parsed.data.modelId + '.',
  };
};

const writeCache = async (
  env: Env,
  cache: CacheStore,
  input: RankInput,
  model: string,
  level: 'L0-live' | 'L1-decision-1',
  judgements: JevJudgement[],
): Promise<void> => {
  if (env.CACHE_RECORD !== '1') return;
  const key = await cacheKeyFor(input, model);
  await cache.write(key, {
    level,
    modelId: model,
    recordedAt: judgements[0]?.recordedAt ?? new Date().toISOString(),
    judgements,
  });
};

/**
 * SPEC §11 runtime order:
 * L0 live Jev (5 s) -> L1 live decision-1 (5 s) -> L2 recorded cache -> L3 baseline.
 * With no keys the app still gets clearly labelled fixtures so the FIXTURE
 * column works; the ladder level says L3-baseline and the note says fixture.
 */
export const rankWithLadder = async (
  env: Env,
  input: RankInput,
  options?: LadderOptions,
): Promise<RankResponse> => {
  const cache = options?.cache ?? fileCache(env, 'rank');
  const repeats = options?.repeats ?? Math.max(1, Math.min(3, Number(env.JEV_REPEATS) || 1));
  const judgeOptions: JudgeOptions = {
    fetchImpl: options?.fetchImpl,
    timeoutMs: options?.timeoutMs,
    now: options?.now,
    baseUrl: options?.baseUrl,
  };

  if (jevConfigured(env)) {
    try {
      const judgements = await Promise.all(
        contexts(input).map((ctx) => judgeWithJevRepeats(env, ctx, repeats, judgeOptions)),
      );
      await writeCache(env, cache, input, JEV_MODEL, 'L0-live', judgements);
      return { ladder: 'L0-live', judgements, note: null };
    } catch {
      // fall through, never surface provider detail
    }
  }

  if (geminiConfigured(env)) {
    try {
      const judgements = await Promise.all(
        contexts(input).map((ctx) => judgeWithDecision1(env, ctx, judgeOptions)),
      );
      await writeCache(env, cache, input, DECISION_MODEL, 'L1-decision-1', judgements);
      return {
        ladder: 'L1-decision-1',
        judgements,
        note: 'Jev unavailable. Judgements come from gemini-decision-1, not Jev.',
      };
    } catch {
      // fall through
    }
  }

  const fromCache = await cached(cache, input, JEV_MODEL);
  if (fromCache) return fromCache;
  const decisionCache = await cached(cache, input, DECISION_MODEL);
  if (decisionCache) return decisionCache;

  return fixtures(input);
};

export const ladderOrder: LadderLevel[] = ['L0-live', 'L1-decision-1', 'L2-cache', 'L3-baseline'];
