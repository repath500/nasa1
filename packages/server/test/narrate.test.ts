import { beforeEach, describe, expect, it } from 'vitest';
import { router, type RouterDeps } from '../src/router.ts';
import { createRateLimiter } from '../src/http.ts';
import { signLicenseToken } from '../src/billing/license.ts';
import { resetMemoryKv, getKv, readUsage } from '../src/kv.ts';

const deps = (): RouterDeps => ({ rateLimiter: createRateLimiter({ capacity: 1000, refillPerSec: 1000 }) });

const post = (body: unknown, headers?: Record<string, string>): Request =>
  new Request('http://localhost/api/narrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(headers ?? {}) },
    body: JSON.stringify(body),
  });

const future = (): number => Math.floor(Date.now() / 1000) + 3600;

describe('narration handler', () => {
  beforeEach(() => resetMemoryKv());

  it('serves a preset manifest to a free user with no key', async () => {
    const res = await router(post({ scenarioKey: 'lunar-cabin-example__prevention' }), {}, deps());
    expect(res.status).toBe(200);
    const manifest = await res.json();
    expect(manifest.voice.provider).toBe('device');
    expect(manifest.audioUrl).toBeNull();
    expect(manifest.segments).toHaveLength(7);
    expect(manifest.disclosure).toContain('device voice');
    expect(manifest.segments[0].cues[0].kind).toBe('focusHabitat');
  });

  it('requires a licence for a custom scenario', async () => {
    const env = { LICENSE_SECRET: 'narration-secret' };
    const none = await router(post({ customScenario: { o2Pct: 30, totalKpa: 70.3, concern: 'suppression' } }), env, deps());
    expect(none.status).toBe(401);

    const expiredToken = await signLicenseToken(
      { plan: 'researcher', customer: 'cus_x', exp: Math.floor(Date.now() / 1000) - 10, nonce: 'nonce-abcdefgh' },
      'narration-secret',
    );
    const expired = await router(
      post(
        { customScenario: { o2Pct: 30, totalKpa: 70.3, concern: 'suppression' } },
        { authorization: 'License ' + expiredToken },
      ),
      env,
      deps(),
    );
    expect(expired.status).toBe(401);
  });

  it('serves a custom scenario to a researcher and counts usage', async () => {
    const env = { LICENSE_SECRET: 'narration-secret' };
    const token = await signLicenseToken(
      { plan: 'researcher', customer: 'cus_researcher', exp: future(), nonce: 'nonce-abcdefgh' },
      'narration-secret',
    );
    const res = await router(
      post(
        { customScenario: { o2Pct: 30, totalKpa: 70.3, concern: 'suppression' } },
        { authorization: 'License ' + token },
      ),
      env,
      deps(),
    );
    expect(res.status).toBe(200);
    const manifest = await res.json();
    expect(manifest.segments.map((segment: { id: string }) => segment.id)).toEqual([
      'intro',
      'air',
      'tested',
      'gap',
      'read',
      'limits',
      'outro',
    ]);
    const usage = await readUsage(getKv(env), 'cus_researcher');
    expect(usage.audioMinutes).toBeGreaterThan(0);
  });

  it('rejects an unknown scenario key and a missing licensing secret', async () => {
    const unknown = await router(post({ scenarioKey: 'made-up' }), {}, deps());
    expect(unknown.status).toBe(400);
    const noSecret = await router(
      post(
        { customScenario: { o2Pct: 30, totalKpa: 70.3, concern: 'suppression' } },
        { authorization: 'License abcdefghijklmnopqrst' },
      ),
      {},
      deps(),
    );
    expect(noSecret.status).toBe(503);
  });

  it('rejects invalid custom values', async () => {
    const env = { LICENSE_SECRET: 'narration-secret' };
    const res = await router(
      post({ customScenario: { o2Pct: 300, totalKpa: -1, concern: 'suppression' } }),
      env,
      deps(),
    );
    expect(res.status).toBe(400);
  });
});
