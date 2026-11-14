import { describe, expect, it } from 'vitest';
import { createRateLimiter, resetRateLimiter } from '../src/http.ts';
import { router, type RouterDeps } from '../src/router.ts';
import type { Env } from '../src/env.ts';

const deps = (overrides?: Partial<RouterDeps>): RouterDeps => ({
  rateLimiter: createRateLimiter({ capacity: 1000, refillPerSec: 1000 }),
  ...overrides,
});

const post = (path: string, body: unknown, headers?: Record<string, string>): Request =>
  new Request('http://localhost' + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(headers ?? {}) },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

const get = (path: string, headers?: Record<string, string>): Request =>
  new Request('http://localhost' + path, { headers });

describe('router security', () => {
  it('rejects cross-site requests', async () => {
    const res = await router(get('/api/health', { 'sec-fetch-site': 'cross-site' }), {}, deps());
    expect(res.status).toBe(403);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('caps the request body at 12 KB', async () => {
    const res = await router(post('/api/ask', { question: 'x'.repeat(13000) }), {}, deps());
    expect(res.status).toBe(413);
  });

  it('rate limits per IP with a token bucket', async () => {
    const limiter = createRateLimiter({ capacity: 1, refillPerSec: 0 });
    const first = await router(get('/api/health'), {}, { rateLimiter: limiter });
    const second = await router(get('/api/health'), {}, { rateLimiter: limiter });
    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
    expect(second.headers.get('retry-after')).toBeTruthy();
  });

  it('returns 405 with an Allow header and 404 for unknown routes', async () => {
    const wrong = await router(get('/api/rank'), {}, deps());
    expect(wrong.status).toBe(405);
    expect(wrong.headers.get('allow')).toBe('POST');
    const missing = await router(get('/api/nope'), {}, deps());
    expect(missing.status).toBe(404);
  });

  it('reports health and service configuration without values', async () => {
    const off = await (await router(get('/api/health'), {}, deps())).json();
    expect(off).toEqual({
      ok: true,
      services: { jev: false, gemini: false, elevenlabs: false, stripe: false },
      stripeMode: 'off',
    });
    const env: Env = {
      TYPESAFE_API_KEY: 't',
      GEMINI_API_KEY: 'g',
      ELEVENLABS_API_KEY: 'e',
      ELEVENLABS_VOICE_ID: 'v',
      STRIPE_SECRET_KEY: 's',
      LICENSE_SECRET: 'l',
      STRIPE_MODE: 'test',
    };
    const on = await (await router(get('/api/health'), env, deps())).json();
    expect(on.services).toEqual({ jev: true, gemini: true, elevenlabs: true, stripe: true });
    expect(on.stripeMode).toBe('test');
    expect(JSON.stringify(on)).not.toContain('"t"');
  });

  it('returns 503 Billing not configured from every billing endpoint', async () => {
    const endpoints: [string, Request][] = [
      ['checkout', post('/api/checkout', { plan: 'researcher', interval: 'month' })],
      ['claim', post('/api/license/claim', { sessionId: 'cs_test_1234567890' })],
      ['license', get('/api/license', { authorization: 'License abcdefghijklmnop' })],
      ['portal', post('/api/portal', {})],
      ['webhook', post('/api/stripe/webhook', { id: 'evt_1', type: 'x', data: { object: {} } })],
    ];
    for (const [, request] of endpoints) {
      const res = await router(request, {}, deps());
      expect(res.status, request.url).toBe(503);
      expect(await res.json()).toEqual({ error: 'Billing not configured' });
    }
  });
});

describe('rank and ask validation', () => {
  it('accepts only allowlisted rank ids and a hex corpus hash', async () => {
    const badScenario = await router(
      post('/api/rank', { scenarioId: 'custom', concern: 'prevention', corpusHash: 'a'.repeat(64) }),
      {},
      deps(),
    );
    expect(badScenario.status).toBe(400);
    const badHash = await router(
      post('/api/rank', { scenarioId: 'earth-iss', concern: 'prevention', corpusHash: 'not-hex' }),
      {},
      deps(),
    );
    expect(badHash.status).toBe(400);
  });

  it('returns labelled fixtures with no keys', async () => {
    const res = await router(
      post('/api/rank', { scenarioId: 'lunar-cabin-example', concern: 'prevention', corpusHash: 'b'.repeat(64) }),
      { CACHE_DIR: '/tmp/fire-atlas-test-cache' },
      deps(),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ladder).toBe('L3-baseline');
    expect(body.judgements[0].source).toBe('fixture');
    expect(body.note).toContain('not model judgement');
  });

  it('parses Ask offline and enforces the 200 character limit', async () => {
    const ok = await router(post('/api/ask', { question: 'Will PMMA ignite near moon base air?' }), {}, deps());
    expect(ok.status).toBe(200);
    const body = await ok.json();
    expect(body.source).toBe('keyword-parser');
    expect(body.filters.material).toBe('PMMA');
    expect(body.filters.scenarioId).toBe('lunar-cabin-example');
    expect(body.filters.concern).toBe('prevention');
    expect(body.trace[0].actor).toBe('PARSER');

    const tooLong = await router(post('/api/ask', { question: 'x'.repeat(201) }), {}, deps());
    expect(tooLong.status).toBe(400);
  });

  it('explains with the code template when no model is configured', async () => {
    const res = await router(post('/api/explain', { accession: 'PSI-69', scenarioId: 'lunar-cabin-example' }), {}, deps());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('template');
    expect(body.claimIds).toContain('PSI-69');
    expect(body.text).toContain('30 percent oxygen');
  });
});

describe('reset helper', () => {
  it('clears the shared limiter for other suites', () => {
    resetRateLimiter();
    expect(true).toBe(true);
  });
});
