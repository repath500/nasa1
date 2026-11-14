import { cpSync, mkdirSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Corpus, JevJudgement } from '@fire/contracts';
import { recordJudgements } from '../scripts/record-ai.ts';
import { adjudicate, computeMetrics, label } from '../scripts/g3.ts';
import { UpstreamError } from '../src/ai/upstream.ts';
import { CORE_STUDIES } from '../src/ai/studies.ts';

const repo = new URL('../../../', import.meta.url).pathname;
function tempRepo(): string {
  const root = mkdtempSync(join(tmpdir(), 'fa-ai-'));
  mkdirSync(join(root, 'data'), { recursive: true });
  cpSync(join(repo, 'data/corpus.v1.json'), join(root, 'data/corpus.v1.json'));
  return root;
}
const judgement = (accession: string, relevance: number): JevJudgement => ({
  accession, scenarioId: 'lunar-cabin-example', regimeRelevance: relevance, evidenceDirectness: 2, directnessProbs: [0, 0, 1, 0],
  pillar: { choice: 'prevention', probabilities: { prevention: 0.7 }, confidence: 0.5 }, source: 'jev-live', modelId: 'jev-1.14.0', recordedAt: '2026-11-14T00:00:00Z',
});
const scripted = (answers: string[]) => async () => answers.shift() ?? 'q';
const quiet = () => {};

describe('ai:record', () => {
  it('refuses without a key and changes nothing', async () => {
    const root = tempRepo();
    await expect(recordJudgements({ repoRoot: root, env: {} as never, maxCalls: 10 })).rejects.toThrow(/TYPESAFE_API_KEY/);
  });

  it('records three calls and a median per item, backs off on 529, stops at the call cap, and skips existing files', async () => {
    const root = tempRepo();
    let calls = 0, sleeps = 0, failedOnce = false;
    const judge = async (_env: unknown, ctx: { study: { accession: string } }) => {
      calls++;
      if (!failedOnce) { failedOnce = true; throw new UpstreamError('overloaded', 529); }
      return judgement(ctx.study.accession, 0.5);
    };
    const options = { repoRoot: root, env: { TYPESAFE_API_KEY: 'test' } as never, maxCalls: 9, judge: judge as never, sleep: async () => { sleeps++; }, log: quiet };
    const first = await recordJudgements(options);
    expect(first).toMatchObject({ written: 3, calls: 9, stoppedAtCap: true });
    expect(sleeps).toBe(1);
    const files = readdirSync(join(root, 'cache/model_responses'));
    expect(files).toHaveLength(3);
    const second = await recordJudgements({ ...options, maxCalls: 3 });
    expect(second.skipped).toBe(3);
    expect(calls).toBe(13);
  });
});

describe('G3', () => {
  it('needs two different people and records disagreements settled by a person', async () => {
    const root = tempRepo();
    const dir = join(root, 'data/labels');
    const first16 = Array.from({ length: 16 }, (_, i) => (i < 3 ? '2' : '0'));
    await label(dir, 'prevention', scripted(['Ada Reviewer', ...first16, 'q']), quiet);
    expect(await adjudicate(dir, scripted([]), quiet)).toBeNull();
    const second16 = Array.from({ length: 16 }, (_, i) => (i < 2 ? '2' : i === 2 ? '1' : '0'));
    await label(dir, 'prevention', scripted(['Lin Second', ...second16, 'q']), quiet);
    const result = await adjudicate(dir, scripted(['Sam Adjudicator', '2']), quiet);
    expect(result?.labellers).toEqual(['Ada Reviewer', 'Lin Second']);
    expect(result?.disagreements).toHaveLength(1);
    expect(Object.keys(result?.labels ?? {})).toHaveLength(16);
  });

  it('hides Jev when there are no recordings, and applies the keep rule when there are', () => {
    const corpus = JSON.parse(require('node:fs').readFileSync(join(repo, 'data/corpus.v1.json'), 'utf8')) as Corpus;
    const labels: Record<string, 0 | 1 | 2> = {};
    CORE_STUDIES.forEach((study, i) => { labels[`lunar-cabin-example|${study.accession}`] = i < 3 ? 2 : 0; labels[`earth-iss|${study.accession}`] = 0; });
    const adjudicated = { concern: 'prevention' as const, labellers: ['A', 'B'], adjudicator: null, at: '', labels, disagreements: [] };
    const none = computeMetrics(corpus, adjudicated, [], { informativeDisagreement: true, reviewersPreferJev: true });
    expect(none.keep).toBe(false);
    expect(none.sentence).toMatch(/cannot be decided/);
    const perfect = CORE_STUDIES.map((study, i) => ({ ...judgement(study.accession, i < 3 ? 0.9 : 0.1), scenarioId: 'lunar-cabin-example' as const }));
    const withJev = computeMetrics(corpus, adjudicated, perfect, { informativeDisagreement: true, reviewersPreferJev: false });
    expect(withJev.jev.top3HitRate).toBe(1);
    expect(withJev.keep).toBe(true);
    const unhelpful = computeMetrics(corpus, adjudicated, perfect, { informativeDisagreement: false, reviewersPreferJev: false });
    expect(unhelpful.keep).toBe(false);
  });
});
