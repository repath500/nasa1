import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildCorpus, type CandidateFile } from '../src/corpus.ts';
import { acceptedRecords, runReview, runSign, statusOf, verifyCandidate, type Paths, type ReviewLog } from '../src/review.ts';

const base = buildCorpus({ builtAt: '2026-11-14T00:00:00.000Z' });
const candidates = base.candidates.candidates;

function tempPaths(): Paths {
  const root = mkdtempSync(join(tmpdir(), 'fa-review-'));
  const reviewsDir = join(root, 'data/reviews');
  mkdirSync(reviewsDir, { recursive: true });
  writeFileSync(join(reviewsDir, 'candidates.json'), JSON.stringify(base.candidates));
  return { root, reviewsDir, webReviewsDir: join(root, 'web/reviews'), corpus: join(root, 'data/corpus.json'), candidates: join(reviewsDir, 'candidates.json'), log: join(reviewsDir, 'records.json') };
}
const scripted = (answers: string[]) => async () => answers.shift() ?? '';
const quiet = () => {};

describe('human review tooling', () => {
  it('re-verifies candidates against the raw CSV bytes and rejects tampered cells', () => {
    for (const candidate of candidates) expect(verifyCandidate(candidate).passed).toBe(true);
    const first = candidates[0]!;
    const tampered = { ...first, row: { ...first.row, raw: { ...first.row.raw, 'Ambient pressure; mmHg': '600' } } };
    expect(verifyCandidate(tampered).passed).toBe(false);
  });

  it('needs two different reviewers and any reject wins', () => {
    const at = '2026-11-14T00:00:00Z';
    expect(statusOf([{ name: 'Ada', decision: 'accept', note: '', at }]).state).toBe('needs-second');
    expect(statusOf([{ name: 'Ada', decision: 'accept', note: '', at }, { name: 'ada ', decision: 'accept', note: '', at }]).state).toBe('needs-second');
    expect(statusOf([{ name: 'Ada', decision: 'accept', note: '', at }, { name: 'Lin', decision: 'accept', note: '', at }]).state).toBe('accepted');
    expect(statusOf([{ name: 'Ada', decision: 'accept', note: '', at }, { name: 'Lin', decision: 'reject', note: '', at }]).state).toBe('rejected');
  });

  it('records typed names, refuses a repeat reviewer, and only accepted records reach the corpus as gold', async () => {
    const paths = tempPaths();
    const k5 = candidates.find((candidate) => candidate.id === 'candidate:PSI-69:24')!;
    const skipsUntil = (id: string, decision: string) => candidates.flatMap((candidate) => (candidate.id === id ? [decision, 'checked cells'] : ['s']));
    await runReview(scripted(['Ada Reviewer', ...skipsUntil(k5.id, 'a')]), quiet, paths, undefined, () => '2026-11-14T10:00:00Z');
    await runReview(scripted(['Ada Reviewer', ...skipsUntil(k5.id, 'a')]), quiet, paths); // same person again: ignored
    let log = JSON.parse(readFileSync(paths.log, 'utf8')) as ReviewLog;
    expect(statusOf(log.reviews[k5.id]).state).toBe('needs-second');
    await runReview(scripted(['Lin Second', ...skipsUntil(k5.id, 'a')]), quiet, paths, undefined, () => '2026-11-14T11:00:00Z');
    log = JSON.parse(readFileSync(paths.log, 'utf8')) as ReviewLog;
    const records = acceptedRecords(candidates, log);
    expect(records.map((record) => record.review.by)).toEqual([['Ada Reviewer', 'Lin Second']]);

    const rebuilt = buildCorpus({ builtAt: '2026-11-14T00:00:00.000Z', acceptedRecords: records });
    expect(rebuilt.corpus.cards.find((card) => card.accession === 'PSI-69')?.cardState).toBe('gold');
    expect(rebuilt.corpus.cards.filter((card) => card.cardState === 'gold')).toHaveLength(1);
    expect(rebuilt.corpus.corpusHash).not.toBe(base.corpus.corpusHash);

    writeFileSync(paths.corpus, JSON.stringify(rebuilt.corpus));
    const gate = await runSign('k5', scripted(['Ada Reviewer', 'go']), quiet, paths, () => '2026-11-14T12:00:00Z');
    expect(gate?.approver).toBe('Ada Reviewer');
    expect(gate?.corpusHash).toBe(rebuilt.corpus.corpusHash);
    expect(gate?.recordIds).toEqual(records.map((record) => record.id));
    expect(existsSync(join(paths.webReviewsDir, 'k5.json'))).toBe(true);
  });

  it('will not sign K5 without accepted records inside the box, and no-go publishes no approver', async () => {
    const paths = tempPaths();
    writeFileSync(paths.corpus, JSON.stringify(base.corpus));
    expect(await runSign('k5', scripted(['Ada', 'go']), quiet, paths)).toBeNull();
    const d5 = await runSign('d5', scripted(['Ada Reviewer', 'no-go']), quiet, paths);
    expect(d5?.decision).toBe('no-go');
    expect(d5?.approver).toBeUndefined();
    expect(d5?.rubricHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('never accepts a blank name', async () => {
    const paths = tempPaths();
    await runReview(scripted(['', ' ', 'Real Person', ...candidates.map(() => 's')]), quiet, paths);
    expect(existsSync(paths.log)).toBe(false);
  });
});

export type { CandidateFile };
