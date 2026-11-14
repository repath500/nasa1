import { readFileSync } from 'node:fs';
import { test, expect } from 'vitest';
import { corpusHash } from '../src/index';
test('core corpusHash equals pipeline hash', () => {
  const c = JSON.parse(readFileSync(new URL('../../../data/corpus.v1.json', import.meta.url), 'utf8'));
  expect(corpusHash({ cards: c.cards, rows: c.rows, rejects: c.rejects, records: c.records })).toBe(c.corpusHash);
});
