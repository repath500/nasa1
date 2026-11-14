import { beforeEach, describe, expect, it } from 'vitest';
import { router, type RouterDeps } from '../src/router.ts';
import { createRateLimiter } from '../src/http.ts';
import { resetMemoryKv } from '../src/kv.ts';

const deps = (): RouterDeps => ({ rateLimiter: createRateLimiter({ capacity: 1000, refillPerSec: 1000 }) });

const post = (body: unknown, headers?: Record<string, string>): Request =>
  new Request('http://localhost/api/narrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(headers ?? {}) },
    body: JSON.stringify(body),
  });

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

  it('serves a custom scenario to anyone (free, no licence), with the full segment set', async () => {
    const res = await router(post({ customScenario: { o2Pct: 30, totalKpa: 70.3, concern: 'suppression' } }), {}, deps());
    expect(res.status).toBe(200);
    const manifest = await res.json();
    expect(manifest.segments.map((segment: { id: string }) => segment.id)).toEqual(['intro', 'air', 'tested', 'gap', 'read', 'limits', 'outro']);
  });

  it('rejects an unknown scenario key', async () => {
    const unknown = await router(post({ scenarioKey: 'made-up' }), {}, deps());
    expect(unknown.status).toBe(400);
  });

  it('rejects invalid custom values', async () => {
    const res = await router(
      post({ customScenario: { o2Pct: 300, totalKpa: -1, concern: 'suppression' } }),
      {},
      deps(),
    );
    expect(res.status).toBe(400);
  });
});
