import type { BaselineKey, Concern, Corpus, NarrationCue, NarrationSegment, Scenario, Tolerances } from '@fire/contracts';
import { baselineRank, gapStatement, overlap } from '../science.ts';
import { canonicalJson, sha256Hex } from '../hash.ts';

export function buildNarrationScript(corpus: Corpus, scenario: Scenario, concern: Concern, tol: Tolerances, opts: { k5SignedOff: boolean; priority?: BaselineKey[] }): NarrationSegment[] {
  const nearby = corpus.rows.filter(row => overlap(row, scenario, tol) === 'covers');
  const gap = gapStatement(corpus.rows, corpus.cards, scenario, tol, opts);
  const rank = baselineRank(corpus.cards, corpus.rows, scenario, concern, tol, opts.priority);
  const card = corpus.cards.find(item => item.accession === rank[0]?.accession);
  const segment = (id: string, title: string, text: string, claimIds: string[], cues: NarrationCue[]): NarrationSegment => ({ id, title, text, claimIds, cues, startSec: null, endSec: null });
  return [
    segment('intro', 'Intro', 'This overview uses an AI-generated voice. Explore the evidence in Fire Atlas.', [], [{ at: 0, kind: 'clear' }]),
    segment('air', 'The air', `The selected example is ${scenario.label}, with ${scenario.o2Pct}% oxygen and ${scenario.totalKpa} kilopascals of total pressure.`, [scenario.id], [{ at: 0, kind: 'focusHabitat', habitat: scenario.id }]),
    segment('tested', 'What was tested', `The map contains ${nearby.length} tests near these conditions.`, nearby.map(row => row.id), [{ at: 0, kind: 'highlightRows', rowIds: nearby.map(row => row.id) }]),
    segment('gap', 'The gap', gap.sentence ?? 'The gap statement awaits human review.', gap.allowed ? corpus.rows.filter(row => row.fuel.phase === 'solid' || nearby.includes(row)).map(row => row.id) : [], [{ at: 0, kind: 'filterPhase', phases: ['solid'] }]),
    segment('reading', 'What to read', card ? `The current reading order begins with ${card.acronym}.` : 'No reviewed study is currently ranked.', card ? [card.accession] : [], card ? [{ at: 0, kind: 'openStudy', accession: card.accession }] : []),
    segment('limits', 'Limits', 'These are reported test conditions, not guidance for a habitat. Missing oxygen values remain unknown. Gravity and equipment can differ.', [], [{ at: 0, kind: 'openLedger' }]),
    segment('outro', 'Outro', 'Open a study to inspect its sources and limitations.', [], [{ at: 0, kind: 'clear' }]),
  ];
}
export const scriptHash = (segments: NarrationSegment[]): string => sha256Hex(canonicalJson(segments));
