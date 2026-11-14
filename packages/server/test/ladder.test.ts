import { describe, expect, it, vi } from 'vitest';
import { cacheKeyFor, rankWithLadder, type RankInput } from '../src/ai/ladder.ts';
import { memoryCache } from '../src/ai/cache.ts';
import { JEV_MODEL } from '../src/ai/jev.ts';
import { FIXTURE_MODEL_ID } from '../src/ai/fixtures.ts';
import { fixtureJudgements } from '../src/ai/fixtures.ts';

const input: RankInput = {
  scenarioId: 'lunar-cabin-example',
  concern: 'prevention',
  corpusHash: 'a'.repeat(64),
};

const jevAnswer = {
  model: 'jev-1.14.0',
  answers: {
    pillar: {
      type: 'choice',
      choice: 'suppression',
      confidence: 0.6,
      probabilities: { suppression: 0.6, fundamental: 0.2, prevention: 0.1, detection: 0.05, unknown: 0.05 },
    },
    regime_relevance: { type: 'noul', noul: 0.7 },
    evidence_directness: {
      type: 'score',
      score: 2,
      confidence: 0.5,
      probabilities: { '0': 0.05, '1': 0.15, '2': 0.4, '3': 0.4 },
    },
  },
};

const ok = (body: unknown): Response =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
const fail = (): Response => new Response(JSON.stringify({ error: 'down' }), { status: 500 });

describe('fallback ladder', () => {
  it('L0 live Jev when the key works', async () => {
    const fetchImpl = vi.fn(async () => ok(jevAnswer)) as unknown as typeof fetch;
    const result = await rankWithLadder({ TYPESAFE_API_KEY: 'test', CACHE_DIR: '/tmp/none' }, input, {
      fetchImpl,
      cache: memoryCache(),
    });
    expect(result.ladder).toBe('L0-live');
    expect(result.judgements).toHaveLength(10);
    expect(result.judgements.every((item) => item.source === 'jev-live')).toBe(true);
    expect((fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls.length).toBe(10);
    const urls = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls.map((call) => String((call as unknown[])[0]));
    expect(urls.every((url) => url.includes('api.typesafe.ai/v1/systemone'))).toBe(true);
  });

  it('L1 decision-1 when Jev fails, labelled decision-1', async () => {
    const fetchImpl = vi.fn(async (url: unknown) => {
      if (String(url).includes('typesafe.ai')) return fail();
      return ok({ answers: jevAnswer.answers });
    }) as unknown as typeof fetch;
    const result = await rankWithLadder(
      { TYPESAFE_API_KEY: 'test', GEMINI_API_KEY: 'test', CACHE_DIR: '/tmp/none' },
      input,
      { fetchImpl, cache: memoryCache() },
    );
    expect(result.ladder).toBe('L1-decision-1');
    expect(result.judgements.every((item) => item.source === 'decision-1')).toBe(true);
    expect(result.judgements.every((item) => item.modelId === 'gemini-decision-1')).toBe(true);
    expect(result.note).toContain('not Jev');
  });

  it('L2 recorded cache when both live layers fail', async () => {
    const key = await cacheKeyFor(input, JEV_MODEL);
    const cache = memoryCache({
      [key]: {
        level: 'L0-live',
        modelId: JEV_MODEL,
        recordedAt: '2026-11-14T00:00:00.000Z',
        judgements: fixtureJudgements(input.scenarioId),
      },
    });
    const fetchImpl = vi.fn(async () => fail()) as unknown as typeof fetch;
    const result = await rankWithLadder(
      { TYPESAFE_API_KEY: 'test', GEMINI_API_KEY: 'test', CACHE_DIR: '/tmp/none' },
      input,
      { fetchImpl, cache },
    );
    expect(result.ladder).toBe('L2-cache');
    expect(result.judgements.every((item) => item.source === 'cache')).toBe(true);
    expect(result.note).toContain('Cached response');
  });

  it('L3 baseline with clearly labelled fixtures when nothing is configured', async () => {
    const result = await rankWithLadder({ CACHE_DIR: '/tmp/none' }, input, { cache: memoryCache() });
    expect(result.ladder).toBe('L3-baseline');
    expect(result.judgements.every((item) => item.source === 'fixture')).toBe(true);
    expect(result.judgements.every((item) => item.modelId === FIXTURE_MODEL_ID)).toBe(true);
    expect(result.note).toContain('FIXTURE: placeholder values, not model output');
  });

  it('L3 when upstream data is invalid', async () => {
    const bad = structuredClone(jevAnswer) as typeof jevAnswer;
    bad.answers.regime_relevance.noul = 2;
    const fetchImpl = vi.fn(async () => ok(bad)) as unknown as typeof fetch;
    const result = await rankWithLadder({ TYPESAFE_API_KEY: 'test', CACHE_DIR: '/tmp/none' }, input, {
      fetchImpl,
      cache: memoryCache(),
    });
    expect(result.ladder).toBe('L3-baseline');
    expect(result.judgements[0]?.source).toBe('fixture');
  });

  it('aborts a hanging provider at the timeout', async () => {
    const fetchImpl = vi.fn(
      (_url: unknown, init: unknown) =>
        new Promise<Response>((_resolve, reject) => {
          const signal = (init as RequestInit).signal;
          signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    ) as unknown as typeof fetch;
    const started = Date.now();
    const result = await rankWithLadder({ TYPESAFE_API_KEY: 'test', CACHE_DIR: '/tmp/none' }, input, {
      fetchImpl,
      cache: memoryCache(),
      timeoutMs: 20,
    });
    expect(Date.now() - started).toBeLessThan(1000);
    expect(result.ladder).toBe('L3-baseline');
  });
});
