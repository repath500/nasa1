import { describe, expect, it } from 'vitest';
import { keepJevColumn, spearman, wilson95 } from '../src/ai/g3.ts';

describe('G3 statistics', () => {
  it('calculates Spearman with averaged tied ranks', () => {
    expect(spearman([1, 2, 3, 4], [4, 3, 2, 1])).toBeCloseTo(-1);
    expect(spearman([1, 1, 2], [1, 1, 2])).toBeCloseTo(1);
    expect(spearman([1, 1], [1, 2])).toBeNull();
    expect(spearman([1], [1])).toBeNull();
  });

  it('calculates the Wilson interval and rejects invalid counts', () => {
    const interval = wilson95(5, 10)!;
    expect(interval.lower).toBeCloseTo(0.2366, 4);
    expect(interval.upper).toBeCloseTo(0.7634, 4);
    expect(wilson95(1, 0)).toBeNull();
  });

  it('requires both non-inferiority and a human finding', () => {
    const input = { adjudicatedPairs: 16, independentLabellers: 2, baselineTop3HitRate: 0.5, jevTop3HitRate: 0.5, informativeDisagreement: true, reviewersPreferJev: false };
    expect(keepJevColumn(input)).toBe(true);
    expect(keepJevColumn({ ...input, informativeDisagreement: false })).toBe(false);
    expect(keepJevColumn({ ...input, jevTop3HitRate: 0.4 })).toBe(false);
    expect(keepJevColumn({ ...input, adjudicatedPairs: 15 })).toBe(false);
  });
});
