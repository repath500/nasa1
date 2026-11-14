import { describe, expect, it } from 'vitest';
import { DEFAULT_TOLERANCES, PRESETS } from '@fire/contracts';
import type { Corpus, InvestigationCard, JevJudgement, TestRow } from '@fire/contracts';
import fixture from '../../contracts/fixtures/corpus.fixture.json';
import { agreement, baselineRank, baselineRankAll, buildNarrationScript, canonicalJson, claimLint, convertPressure, corpusHash, describeView, diffSummary, fromKpa, gapStatement, jevRank, moleFractionToPercent, normalizeQuote, numberGuard, overlap, parseUnitInput, partialPressureKpa, scoreFromProbs, scriptHash, sensitivity, sha256Hex, splitRanked, studyOverlap, toKpa, verifyQuote, verifyTableRow } from '../src';

const corpus = fixture as unknown as Corpus;
const scenario = PRESETS['lunar-cabin-example'];
const tol = DEFAULT_TOLERANCES;
const original = corpus.rows[0]!;
const row = (oxygen: number | null, pressure: number | null, location: TestRow['o2Location'] = 'ambient'): TestRow => ({ ...original, o2Pct: { min: oxygen, max: oxygen }, pressureKpa: { min: pressure, max: pressure }, o2Location: location });

describe('units', () => {
  it.each([[10.2, 'psi', 70.3], [14.7, 'psi', 101.4], [4.3, 'psi', 29.6], [760, 'mmHg', 101.3]] as const)('converts %s %s', (value, unit, expected) => expect(toKpa(value, unit)).toBeCloseTo(expected, 1));
  it('converts and parses all units', () => { expect(parseUnitInput('0.7 atm')).toBeCloseTo(70.9275); expect(parseUnitInput('530 mmHg')).toBeCloseTo(70.66, 1); expect(parseUnitInput('70 kPa')).toBe(70); expect(parseUnitInput('garbage')).toBeNull(); expect(fromKpa(toKpa(10, 'psi'), 'psi')).toBeCloseTo(10); expect(convertPressure(1, 'atm', 'mmHg')).toBeCloseTo(760); expect(moleFractionToPercent(0.3)).toBe(30); expect(partialPressureKpa(100, 30)).toBe(30); });
});
describe('overlap', () => {
  it.each([[30, 70, 'covers'], [30, 10, 'near-o2-only'], [10, 70, 'near-pressure-only'], [10, 10, 'none'], [null, 70, 'unknown'], [null, 10, 'unknown'], [30, null, 'unknown'], [10, null, 'unknown'], [null, null, 'unknown']] as const)('classifies %s and %s', (oxygen, pressure, expected) => expect(overlap(row(oxygen, pressure), scenario, tol)).toBe(expected));
  it('excludes burner and unknown location', () => { expect(overlap(row(30, 70, 'burner'), scenario, tol)).toBe('excluded-burner'); expect(overlap(row(30, 70, 'unknown'), scenario, tol)).toBe('unknown'); });
  it('intersects intervals', () => { expect(overlap({ ...row(20, 70), o2Pct: { min: 20, max: 28 } }, scenario, tol)).toBe('covers'); });
  it('counts each class', () => { const summary = studyOverlap([row(30, 70), row(null, 70), row(30, 70, 'burner')], scenario, tol); expect([summary.covers, summary.unknown, summary.excludedBurner, summary.bestClass]).toEqual([1, 1, 1, 'covers']); });
});
describe('ranking', () => {
  it('excludes metadata cards but provides preview', () => { expect(splitRanked(corpus.cards).metadataOnly.length).toBe(corpus.cards.length); expect(baselineRank(corpus.cards, corpus.rows, scenario, 'suppression', tol)).toEqual([]); expect(baselineRankAll(corpus.cards, corpus.rows, scenario, 'suppression', tol)).toHaveLength(corpus.cards.length); });
  it('sorts lexicographically and enumerates priorities', () => { const cards = corpus.cards.slice(0, 2).map((card, index) => ({ ...card, cardState: 'gold', pillarPrimary: index ? 'suppression' : 'prevention', evidenceTier: index ? null : 3 })) as InvestigationCard[]; expect(baselineRank(cards, corpus.rows, scenario, 'suppression', tol)[0]?.accession).toBe(cards[1]?.accession); expect(baselineRank(cards, corpus.rows, scenario, 'suppression', tol, ['evidence_tier', 'pillar_match', 'covers_count', 'near_count'])[0]?.accession).toBe(cards[0]?.accession); expect(sensitivity(cards, corpus.rows, scenario, 'suppression', tol).ordersTested).toBe(24); });
  it('orders Jev bins and uses baseline ties', () => { const make = (accession: string, relevance: number): JevJudgement => ({ accession, scenarioId: scenario.id, regimeRelevance: relevance, evidenceDirectness: 2, directnessProbs: null, pillar: null, source: 'fixture', modelId: 'fixture', recordedAt: '' }); expect(jevRank([make('B', 0.54), make('A', 0.59)], 'suppression', ['A', 'B']).map(item => item.accession)).toEqual(['A', 'B']); expect(scoreFromProbs([0, 0.57, 0.43])).toBe(1.43); });
  it('computes agreement and handles small samples', () => { expect(agreement(['a', 'b', 'c'], ['c', 'b', 'a'], { c: 'FLEX' })).toMatchObject({ top3Overlap: 3, spearman: -1, sentence: 'Jev moves FLEX to #1.' }); expect(agreement(['a'], ['a']).spearman).toBeNull(); });
});
describe('gaps and views', () => {
  it('enforces K5 and derives the solid ceiling', () => { const rows = [row(30, 70), { ...row(25, 70), fuel: { ...original.fuel, phase: 'solid' as const } }, { ...row(null, 70), accession: 'unknown', fuel: { ...original.fuel, phase: 'solid' as const } }]; expect(gapStatement(rows, corpus.cards, scenario, tol, { k5SignedOff: false })).toMatchObject({ allowed: false, reasonIfBlocked: 'Awaiting human sign-off (gate K5)' }); const gap = gapStatement(rows, corpus.cards, scenario, tol, { k5SignedOff: true }); expect(gap.sentence).toContain('25%'); expect(gap.counts.unknownO2Tables).toContain('unknown'); });
  it('summarizes changes', () => { expect(describeView([row(30, 70)], scenario, tol)).toContain('1 reported'); expect(diffSummary({ nearby: 1, topStudy: 'A' }, { nearby: 13, topStudy: 'FLEX' })).toBe('+12 tests nearby, top study changed to FLEX'); });
});
describe('verification and hashes', () => {
  it('normalizes quotations and rejects fabricated, wrong page and wrong numbers', () => { const quote = 'A measured ﬂame had 22 percent oxygen in air.'; const page = 'A measured flame had 22 percent oxy-\ngen in air.'; expect(verifyQuote(quote, page, [22])).toBe(true); expect(verifyQuote(quote, page, [25])).toBe(false); expect(verifyQuote(quote, 'wrong page')).toBe(false); expect(verifyQuote('A fabricated statement with sufficient length.', page)).toBe(false); expect(normalizeQuote('“x” — y\u00ad')).toBe('"x" - y'); });
  it('checks row cells and digest', () => { const sample = { ...original, raw: { oxygen: '22' }, csvSha12: '0123456789ab' }; expect(verifyTableRow(sample, { oxygen: '22' }, sample.csvSha12)).toBe(true); expect(verifyTableRow(sample, { oxygen: '25' }, sample.csvSha12)).toBe(false); expect(verifyTableRow(sample, sample.raw, 'aaaaaaaaaaaa')).toBe(false); });
  it('checks numeric and claim guards', () => { expect(numberGuard('There were 22 tests and 3 trials.', [22])).toEqual(['3']); expect(claimLint('This is safe — and novel.').length).toBeGreaterThan(0); expect(claimLint('This is an example.')).toEqual([]); });
  it('matches SHA vectors and canonical order', () => { expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'); expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'); expect(canonicalJson({ b: 1, a: 2 })).toBe('{"a":2,"b":1}'); expect(corpusHash(corpus)).toHaveLength(64); });
});
describe('narration', () => {
  it('provides cues, disclosure, gated gap, and deterministic hash', () => { const segments = buildNarrationScript(corpus, scenario, 'suppression', tol, { k5SignedOff: false }); expect(segments).toHaveLength(7); expect(segments[0]?.text).toContain('AI-generated voice'); expect(segments[3]?.text).toContain('awaits human review'); expect(segments.flatMap(segment => segment.cues).some(cue => cue.kind === 'openLedger')).toBe(true); expect(scriptHash(segments)).toBe(scriptHash(segments)); expect(segments.flatMap(segment => claimLint(segment.text))).toEqual([]); expect(numberGuard(segments[1]!.text, [scenario.o2Pct, scenario.totalKpa])).toEqual([]); });
});

import { overlap as overlapFn } from '../src/index';
import { PRESETS as P, DEFAULT_TOLERANCES as TOL } from '@fire/contracts';
it('discrete O2 lists are tested value by value, never as an envelope', () => {
  const base = { id: 'X:0', accession: 'X', rowIndex: 0, testLabel: null, date: null, fuel: { name: null, phase: 'gas' as const, geometry: null, size: null },
    o2Location: 'ambient' as const, o2Approx: false, o2FinalPct: null, pressureKpa: { min: 70, max: 70 }, flowCmS: { min: null, max: null }, gravity: 'microgravity' as const, raw: {}, csvSha12: 'x' };
  // 21; 26.5; 40 spans the lunar band 27-33 but no listed value is inside it.
  expect(overlapFn({ ...base, o2Pct: { min: 21, max: 40 }, o2ValuesPct: [21, 26.5, 40] }, P['lunar-cabin-example'], TOL)).toBe('near-pressure-only');
  expect(overlapFn({ ...base, o2Pct: { min: 21, max: 40 }, o2ValuesPct: [21, 30, 40] }, P['lunar-cabin-example'], TOL)).toBe('covers');
});
