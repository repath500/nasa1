import { describe, expect, it, vi } from 'vitest';
import { claimLint, numberGuard } from '../src/core-bridge.ts';
import { buildJevQuestions, buildJevState, judgeWithJev, medianJudgements } from '../src/ai/jev.ts';
import { buildDecisionRequest, judgeWithDecision1 } from '../src/ai/decision1.ts';
import { CORE_STUDIES } from '../src/ai/studies.ts';
import type { JudgeContext } from '../src/ai/jev.ts';

const ctx: JudgeContext = {
  study: CORE_STUDIES.find((study) => study.accession === 'PSI-69')!,
  scenario: { id: 'lunar-cabin-example', label: 'Moon base (example)', o2Pct: 30, totalKpa: 70.3 },
  concern: 'suppression',
};

const scoreProbs = { '0': 0, '1': 0.57, '2': 0.43, '3': 0 };
const jevAnswer = {
  model: 'jev-1.14.0',
  answers: {
    pillar: {
      type: 'choice',
      choice: 'suppression',
      confidence: 0.62,
      probabilities: { suppression: 0.62, fundamental: 0.24, prevention: 0.1, detection: 0.02, unknown: 0.02 },
    },
    regime_relevance: { type: 'noul', noul: 0.8 },
    evidence_directness: { type: 'score', score: 1.43, confidence: 0.55, probabilities: scoreProbs },
  },
  usage: { input_tokens: 10, output_tokens: 2 },
};

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('guards', () => {
  it('accepts only numerals traceable to the scenario', () => {
    expect(numberGuard('At 30 percent oxygen and 70.3 kPa.', [30, 70.3]).ok).toBe(true);
    const bad = numberGuard('At 41 percent oxygen.', [30, 70.3]);
    expect(bad.ok).toBe(false);
    expect(bad.missing).toContain('41');
  });

  it('rejects never-claim wording and em dashes', () => {
    expect(claimLint('The material is safe.').ok).toBe(false);
    expect(claimLint('This predicts spread.').ok).toBe(false);
    expect(claimLint('A calm sentence about oxygen.').ok).toBe(true);
    expect(claimLint('an em \u2014 dash').ok).toBe(false);
  });
});

describe('Jev request', () => {
  it('has no numerals in instructions or criteria', () => {
    const text = JSON.stringify(buildJevQuestions());
    expect(text).not.toMatch(/\d/);
  });

  it('keeps null (not zero) for absent corpus evidence in state', () => {
    const state = buildJevState(ctx) as { accepted_evidence: Record<string, unknown> };
    expect(state.accepted_evidence.n_rows_parsed).toBeNull();
    expect(state.accepted_evidence.n_rows_near_scenario).toBeNull();
  });

  it('maps a score probability vector to the weighted level', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(jevAnswer)) as unknown as typeof fetch;
    const judgement = await judgeWithJev(
      { TYPESAFE_API_KEY: 'test' },
      ctx,
      { fetchImpl, now: () => new Date('2026-11-14T00:00:00Z') },
    );
    expect(judgement.evidenceDirectness).toBe(1.43);
    expect(judgement.regimeRelevance).toBe(0.8);
    expect(judgement.source).toBe('jev-live');
    expect(judgement.pillar?.choice).toBe('suppression');
  });

  it('rejects an out-of-range upstream probability', async () => {
    const bad = structuredClone(jevAnswer) as typeof jevAnswer;
    bad.answers.regime_relevance.noul = 1.5;
    const fetchImpl = vi.fn(async () => jsonResponse(bad)) as unknown as typeof fetch;
    await expect(judgeWithJev({ TYPESAFE_API_KEY: 'test' }, ctx, { fetchImpl })).rejects.toThrow();
  });

  it('rejects score probabilities that do not sum to one', async () => {
    const bad = structuredClone(jevAnswer) as typeof jevAnswer;
    bad.answers.evidence_directness.probabilities = { '0': 0.2, '1': 0.2, '2': 0.2, '3': 0.2 };
    const fetchImpl = vi.fn(async () => jsonResponse(bad)) as unknown as typeof fetch;
    await expect(judgeWithJev({ TYPESAFE_API_KEY: 'test' }, ctx, { fetchImpl })).rejects.toThrow();
  });

  it('medians repeated calls', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ ...jevAnswer, answers: { ...jevAnswer.answers, regime_relevance: { type: 'noul', noul: 0.5 } } }))
      .mockResolvedValueOnce(jsonResponse({ ...jevAnswer, answers: { ...jevAnswer.answers, regime_relevance: { type: 'noul', noul: 0.7 } } }))
      .mockResolvedValueOnce(jsonResponse({ ...jevAnswer, answers: { ...jevAnswer.answers, regime_relevance: { type: 'noul', noul: 0.9 } } })) as unknown as typeof fetch;
    const calls = await Promise.all([
      judgeWithJev({ TYPESAFE_API_KEY: 'test' }, ctx, { fetchImpl }),
      judgeWithJev({ TYPESAFE_API_KEY: 'test' }, ctx, { fetchImpl }),
      judgeWithJev({ TYPESAFE_API_KEY: 'test' }, ctx, { fetchImpl }),
    ]);
    expect(medianJudgements(calls).regimeRelevance).toBe(0.7);
  });
});

describe('decision-1 adapter', () => {
  it('sends input, not state, and is labelled decision-1', () => {
    const body = buildDecisionRequest(ctx);
    expect(body).toHaveProperty('input');
    expect(body).not.toHaveProperty('state');
    expect(body.model).toBe('gemini-decision-1');
    expect(typeof body.input).toBe('string');
  });

  it('maps the score vector and never claims to be Jev', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ answers: jevAnswer.answers })) as unknown as typeof fetch;
    const judgement = await judgeWithDecision1({ GEMINI_API_KEY: 'test' }, ctx, { fetchImpl });
    expect(judgement.source).toBe('decision-1');
    expect(judgement.modelId).toBe('gemini-decision-1');
    expect(judgement.evidenceDirectness).toBe(1.43);
  });
});

describe('Hydrogen Ask adapter', () => {
  it('uses the Interactions API, revision header and a JSON schema, with no tools', async () => {
    const filters = {
      material: 'PMMA',
      fuelPhase: 'solid',
      scenarioId: 'lunar-cabin-example',
      concern: 'prevention',
      o2Pct: 30,
      totalKpa: 70.3,
    };
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ output_text: JSON.stringify(filters) }),
    ) as unknown as typeof fetch;
    const { askWithHydrogen } = await import('../src/ai/hydrogen.ts');
    const result = await askWithHydrogen({ GEMINI_API_KEY: 'test' }, 'PMMA near moon air?', { fetchImpl });
    expect(result.filters).toEqual(filters);
    const mock = fetchImpl as unknown as ReturnType<typeof vi.fn>;
    const [url, init] = mock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/interactions');
    expect((init.headers as Record<string, string>)['Api-Revision']).toBe('2026-05-20');
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('test');
    const body = JSON.parse(String(init.body)) as Record<string, any>;
    expect(body.model).toBe('gemini-4-hydrogen');
    expect(body.response_format.mime_type).toBe('application/json');
    expect(body.response_format.schema.type).toBe('object');
    expect(body).not.toHaveProperty('tools');
  });

  it('falls back to the keyword parser and converts pressure units', async () => {
    const { parseKeywords } = await import('../src/ai/hydrogen.ts');
    const filters = parseKeywords('Will Nomex ignite in a spacesuit at 4.3 psi and 100 percent oxygen?');
    expect(filters.scenarioId).toBe('suit');
    expect(filters.material).toBe('Nomex');
    expect(filters.concern).toBe('prevention');
    expect(filters.o2Pct).toBe(100);
    expect(filters.totalKpa).toBeCloseTo(29.6, 0);
  });
});
