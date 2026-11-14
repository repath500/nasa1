/**
 * Local bridge to the functions W3 owns in @fire/core.
 *
 * The lead swaps this file for re-exports from @fire/core once that package
 * lands. Keep the names and signatures here stable:
 * buildNarrationScript, numberGuard, claimLint, scriptHash.
 * Nothing in this file invents corpus numbers: the only numerals are the
 * preset atmosphere values from @fire/contracts, plus code-computed phrases
 * added by W3 later.
 */
import type { Concern, FuelPhase, NarrationCue, NarrationSegment, ScenarioId } from '@fire/contracts';
import { PRESETS } from '@fire/contracts';
import type { NarrationFacts } from './narration/facts.ts';

export interface BridgeScenario {
  id: ScenarioId;
  label: string;
  o2Pct: number;
  totalKpa: number;
}

export interface NarrationScriptInput {
  scenarioKey: string;
  kind: 'landing' | 'scenario';
  scenario?: BridgeScenario;
  concern?: Concern;
  voiceProvider: 'elevenlabs' | 'device';
  /** Corpus facts computed by @fire/core. Without them the script explains the map but states no findings. */
  facts?: NarrationFacts;
}

export interface BuiltNarrationScript {
  scenarioKey: string;
  segments: NarrationSegment[];
  /** Numerals the script is allowed to state, as written in the text. */
  allowedNumbers: string[];
  disclosure: string;
}

export const ELEVENLABS_DISCLOSURE = 'This overview uses an AI-generated voice (ElevenLabs).';
export const DEVICE_DISCLOSURE = 'This overview uses a device voice. No AI voice service is called.';

const CONCERN_PHASE: Record<Concern, FuelPhase | null> = {
  prevention: 'solid',
  detection: 'aerosol',
  suppression: 'liquid-droplet',
  explore: null,
};

const CONCERN_STUDY: Record<Concern, string> = {
  prevention: 'PSI-25',
  detection: 'PSI-102',
  suppression: 'PSI-69',
  explore: 'PSI-69',
};

const cue = (at: number, value: NarrationCue): NarrationCue => ({ ...value, at });

const fmt = (n: number): string => {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
};

export const presetScenario = (id: ScenarioId): BridgeScenario | null => {
  if (id === 'custom') return null;
  const preset = PRESETS[id];
  return preset ? { id: preset.id, label: preset.label, o2Pct: preset.o2Pct, totalKpa: preset.totalKpa } : null;
};

export const parseScenarioKey = (scenarioKey: string): { id: ScenarioId; concern: Concern } | null => {
  if (scenarioKey === 'landing') return null;
  const [id, concern, ...rest] = scenarioKey.split('__');
  if (rest.length > 0 || !id || !concern) return null;
  const scenarioIds: ScenarioId[] = ['earth-iss', 'lunar-cabin-example', 'exploration-upper', 'suit', 'custom'];
  const concerns: Concern[] = ['prevention', 'detection', 'suppression', 'explore'];
  if (!scenarioIds.includes(id as ScenarioId)) return null;
  if (!concerns.includes(concern as Concern)) return null;
  return { id: id as ScenarioId, concern: concern as Concern };
};

const landingSegments = (disclosure: string): NarrationSegment[] => [
  {
    id: 'intro',
    title: 'Intro',
    text: disclosure + ' Fire Atlas maps NASA microgravity fire tests against the air of future habitats. Every dot opens its source.',
    claimIds: [],
    cues: [],
    startSec: null,
    endSec: null,
  },
  {
    id: 'map',
    title: 'The map',
    text: 'Pick a habitat, then read the map. Oxygen and pressure are plotted only when a table reports them. Rows without a value are marked unknown. The gap sentence is computed by code from those rows.',
    claimIds: [],
    cues: [],
    startSec: null,
    endSec: null,
  },
  {
    id: 'outro',
    title: 'Outro',
    text: 'The map shows what has been tested near a chosen atmosphere, and what has not. NASA does not endorse this project. The evidence stays free.',
    claimIds: [],
    cues: [],
    startSec: null,
    endSec: null,
  },
];

const PHASE_WORDS: Record<FuelPhase, string> = { solid: 'solid', 'liquid-droplet': 'liquid droplet', gas: 'gas', aerosol: 'aerosol', unknown: 'unknown fuel' };

const listWords = (items: string[]): string =>
  items.length <= 1 ? (items[0] ?? '') : items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];

const factSentences = (facts: NarrationFacts | undefined) => {
  if (!facts) return { tested: '', gap: '', read: '' };
  const phases = Object.entries(facts.coversByPhase).map(([phase, n]) => n + ' ' + PHASE_WORDS[phase as FuelPhase]);
  const tested = facts.covers > 0
    ? ' Of ' + facts.totalRows + ' parsed rows, ' + facts.covers + ' sit inside this box: ' + listWords(phases) + '. '
    : ' None of the ' + facts.totalRows + ' parsed rows sits inside this box. That empty box is the gap. ';
  const rest = facts.nearO2Only + ' more match the oxygen but not the pressure, and ' + facts.unknown + ' cannot be placed because their table leaves out pressure or oxygen.';
  const gap = ' Code also set aside ' + facts.rejects + ' source cells it could not trust, such as impossible oxygen values.';
  const read = facts.previewTop3.length
    ? ' In the unreviewed preview order, the leading studies are ' + listWords(facts.previewTop3) + '. The team still has to review these cards.'
    : '';
  return { tested: tested + rest, gap, read };
};

const scenarioSegments = (
  scenario: BridgeScenario,
  concern: Concern,
  disclosure: string,
  facts?: NarrationFacts,
): NarrationSegment[] => {
  const extra = factSentences(facts);
  const phase = CONCERN_PHASE[concern];
  const study = CONCERN_STUDY[concern];
  const introCue = cue(0, { kind: 'focusHabitat', habitat: scenario.id, at: 0 });
  const testedCues = phase
    ? [cue(0.4, { kind: 'filterPhase', phases: [phase], at: 0 })]
    : [];
  return [
    {
      id: 'intro',
      title: 'Intro',
      text: disclosure + ' This is a briefing for ' + scenario.label + '. The preset is an illustrative atmosphere, not a design value.',
      claimIds: ['scenario:' + scenario.id],
      cues: [introCue],
      startSec: null,
      endSec: null,
    },
    {
      id: 'air',
      title: 'The air',
      text:
        scenario.label +
        ' is shown at ' +
        fmt(scenario.o2Pct) +
        ' percent oxygen and ' +
        fmt(scenario.totalKpa) +
        ' kPa. The map draws a tolerance box around that air, three oxygen points and fifteen percent of pressure. Every test row inside the box is counted by code.',
      claimIds: ['scenario:' + scenario.id],
      cues: [cue(0, { kind: 'focusHabitat', habitat: scenario.id, at: 0 })],
      startSec: null,
      endSec: null,
    },
    {
      id: 'tested',
      title: 'What was tested',
      text:
        'Each mark is one parsed test row. Shape and colour show the fuel phase. Hollow marks are burner-stream oxygen and are left out of counts. A row with no reported pressure sits on the pressure not reported rail.' +
        extra.tested,
      claimIds: ['scenario:' + scenario.id, ...(facts?.coverRowIds ?? [])],
      cues: facts?.coverRowIds.length
        ? [cue(0.2, { kind: 'highlightRows', rowIds: facts.coverRowIds, at: 0 }), ...testedCues]
        : testedCues,
      startSec: null,
      endSec: null,
    },
    {
      id: 'gap',
      title: 'The gap',
      text:
        'The gap sentence is written by code from reported rows. Tables that do not report oxygen are counted as unknown, never as absent. No model writes the counts, and no curve is fitted to the marks.' +
        extra.gap,
      claimIds: ['scenario:' + scenario.id],
      cues: [cue(0, { kind: 'openLedger', at: 0 })],
      startSec: null,
      endSec: null,
    },
    {
      id: 'read',
      title: 'Where to start',
      text:
        'Use the study list to compare the transparent baseline with the model judgement. The baseline sorts by purpose, overlap, evidence tier and nearby rows. The model column is an ordinal judgement, not a probability that the science is true.' +
        extra.read,
      claimIds: [study],
      cues: [cue(0.3, { kind: 'openStudy', accession: study, at: 0 })],
      startSec: null,
      endSec: null,
    },
    {
      id: 'limits',
      title: 'Limits',
      text:
        'These maps support literature screening. Gravity, hardware and fuel geometry differ between tests. Partial gravity is not represented in the NASA data here. The atlas does not assess flammability, judge materials or replace expert review.',
      claimIds: ['scenario:' + scenario.id],
      cues: [cue(0, { kind: 'clear', at: 0 })],
      startSec: null,
      endSec: null,
    },
    {
      id: 'outro',
      title: 'Outro',
      text:
        'Open any dot for its source row, hash and licence. The Gap Brief collects the result for a chosen air. NASA does not endorse this project.',
      claimIds: ['scenario:' + scenario.id],
      cues: [cue(0, { kind: 'clear', at: 0 })],
      startSec: null,
      endSec: null,
    },
  ];
};

export const buildNarrationScript = (input: NarrationScriptInput): BuiltNarrationScript => {
  const disclosure = input.voiceProvider === 'elevenlabs' ? ELEVENLABS_DISCLOSURE : DEVICE_DISCLOSURE;
  if (input.kind === 'landing') {
    return { scenarioKey: input.scenarioKey, segments: landingSegments(disclosure), allowedNumbers: [], disclosure };
  }
  if (!input.scenario || !input.concern) throw new Error('scenario and concern are required');
  return {
    scenarioKey: input.scenarioKey,
    segments: scenarioSegments(input.scenario, input.concern, disclosure, input.facts),
    allowedNumbers: [
      fmt(input.scenario.o2Pct), fmt(input.scenario.totalKpa), '3', '15',
      ...(input.facts
        ? [input.facts.totalRows, input.facts.covers, input.facts.nearO2Only, input.facts.unknown, input.facts.rejects, ...Object.values(input.facts.coversByPhase)].map(String)
        : []),
    ],
    disclosure,
  };
};

export interface GuardResult {
  ok: boolean;
  missing: string[];
  reason: string | null;
}

const numerals = (text: string): string[] => text.match(/-?\d+(?:\.\d+)?/g) ?? [];

/** Every numeral in the text must appear in the allowed set. */
export const numberGuard = (text: string, allowed: (string | number)[]): GuardResult => {
  const allowedSet = new Set(
    allowed.flatMap((value) => {
      const raw = String(value).trim();
      const out = [raw];
      const n = Number(raw);
      if (Number.isFinite(n)) {
        out.push(String(n));
        out.push(n.toFixed(1));
        out.push(String(Math.round(n)));
      }
      return out;
    }),
  );
  const missing = numerals(text).filter((value) => !allowedSet.has(value) && !allowedSet.has(String(Number(value))));
  return { ok: missing.length === 0, missing, reason: missing.length === 0 ? null : 'numeral not traceable to a record' };
};

const CLAIM_RULES: [RegExp, string][] = [
  [/\b(un)?safe\b/i, 'safety verdict language'],
  [/\bcertif(y|ied|icate|ication)\b/i, 'certification language'],
  [/\bvalidated\b/i, 'validation language'],
  [/\bpredicts?\b/i, 'prediction language'],
  [/\bfire risk\b/i, 'risk language'],
  [/\bnone exists?\b/i, 'absence claim'],
  [/\b(first|novel|unprecedented)\b(?![-_])/i, 'novelty claim'],
  [/\bextinction limit\b/i, 'wrong extinction term'],
  [/\b(approved|guarantee|guaranteed)\b/i, 'approval language'],
  [/\bwill not ignite\b/i, 'ignition guarantee'],
  [/\blunar result\b/i, 'partial-gravity inference'],
];

/** Never-claim and dash lint for text that reaches a user. */
export const claimLint = (text: string): GuardResult => {
  if (/[\u2014\u2013]/.test(text)) {
    return { ok: false, missing: [], reason: 'em or en dash in user-facing text' };
  }
  for (const [pattern, reason] of CLAIM_RULES) {
    const match = text.match(pattern);
    if (match) return { ok: false, missing: [match[0]], reason };
  }
  return { ok: true, missing: [], reason: null };
};

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  const record = value as Record<string, unknown>;
  return (
    '{' +
    Object.keys(record)
      .sort()
      .map((key) => JSON.stringify(key) + ':' + stableStringify(record[key]))
      .join(',') +
    '}'
  );
};

export const sha256Hex = async (input: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
};

/** Stable script hash over text, voice and model, so a voice change misses the cache. */
export const scriptHash = async (value: unknown): Promise<string> => sha256Hex(stableStringify(value));

/** Fallback timing for device voice, at 156 words per minute. */
export const estimateTimings = (segments: NarrationSegment[], wordsPerMinute = 156): NarrationSegment[] => {
  const perWord = 60 / wordsPerMinute;
  let cursor = 0;
  return segments.map((segment) => {
    const count = segment.text.trim().split(/\s+/).filter(Boolean).length;
    const duration = Math.max(0.8, count * perWord);
    const start = cursor;
    const end = cursor + duration;
    cursor = end + 0.35;
    return {
      ...segment,
      startSec: Number(start.toFixed(2)),
      endSec: Number(end.toFixed(2)),
      cues: segment.cues.map((c) => ({ ...c, at: Number((start + c.at).toFixed(2)) })),
    };
  });
};
