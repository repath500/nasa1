import type { NarrationManifest, NarrationSegment } from '@fire/contracts';
import { estimateTimings, scriptHash, type BuiltNarrationScript } from '../core-bridge.ts';

export interface Alignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

export interface ManifestOptions {
  scenarioKey: string;
  voiceProvider: 'elevenlabs' | 'device';
  voiceId?: string | null;
  modelId?: string | null;
  audioUrl?: string | null;
  generatedAt?: string;
}

const round3 = (value: number): number => Math.round(value * 1000) / 1000;

export const joinedText = (segments: NarrationSegment[]): string => segments.map((segment) => segment.text).join('\n\n');

export const hashForScript = async (script: BuiltNarrationScript, options: ManifestOptions): Promise<string> =>
  scriptHash({
    scenarioKey: options.scenarioKey,
    text: joinedText(script.segments),
    voice: { provider: options.voiceProvider, voiceId: options.voiceId ?? null, modelId: options.modelId ?? null },
  });

export interface MappedNarration {
  segments: NarrationSegment[];
  words: { w: string; start: number; end: number }[] | null;
  durationSec: number;
}

/**
 * Map a character alignment to segment boundaries and word timings.
 * Cue `at` values in the script are offsets from the segment start; here they
 * become absolute times on the track.
 */
export const mapAlignmentToSegments = (
  segments: NarrationSegment[],
  alignment: Alignment,
): MappedNarration => {
  const text = joinedText(segments);
  const starts = alignment.character_start_times_seconds;
  const ends = alignment.character_end_times_seconds;
  const duration = ends.length > 0 ? ends[ends.length - 1] ?? 0 : 0;
  const exact = alignment.characters.length === text.length && starts.length === text.length && ends.length === text.length;

  const timeAt = (index: number): { start: number; end: number } => {
    if (exact) return { start: starts[index] ?? 0, end: ends[index] ?? 0 };
    const ratio = text.length > 0 ? index / text.length : 0;
    return { start: duration * ratio, end: duration * ratio };
  };

  let cursor = 0;
  const mapped = segments.map((segment) => {
    const offset = cursor;
    cursor += segment.text.length + 2;
    let first = -1;
    let last = -1;
    for (let i = 0; i < segment.text.length; i += 1) {
      if (!/\s/.test(segment.text[i] ?? '')) {
        if (first === -1) first = i;
        last = i;
      }
    }
    const start = first === -1 ? timeAt(offset).start : timeAt(offset + first).start;
    const end = last === -1 ? timeAt(offset + segment.text.length).end : timeAt(offset + last).end;
    return {
      ...segment,
      startSec: round3(start),
      endSec: round3(Math.max(start, end)),
      cues: segment.cues.map((cue) => ({ ...cue, at: round3(start + cue.at) })),
    };
  });

  let words: { w: string; start: number; end: number }[] | null = null;
  if (exact) {
    words = [];
    const matcher = /\S+/g;
    for (;;) {
      const match = matcher.exec(text);
      if (!match) break;
      const startIndex = match.index;
      const endIndex = match.index + match[0].length - 1;
      words.push({
        w: match[0],
        start: round3(starts[startIndex] ?? 0),
        end: round3(ends[endIndex] ?? 0),
      });
    }
  }

  return { segments: mapped, words, durationSec: round3(duration) };
};

export const buildElevenLabsManifest = (
  script: BuiltNarrationScript,
  options: ManifestOptions & { voiceId: string; modelId: string; audioUrl: string | null },
  alignment: Alignment,
  hash: string,
): NarrationManifest => {
  const mapped = mapAlignmentToSegments(script.segments, alignment);
  return {
    scenarioKey: options.scenarioKey,
    scriptHash: hash,
    segments: mapped.segments,
    words: mapped.words,
    audioUrl: options.audioUrl,
    voice: { provider: 'elevenlabs', voiceId: options.voiceId, modelId: options.modelId },
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    disclosure: script.disclosure,
  };
};

/** No key: device voice. Timings are estimated so captions and cues still run. */
export const buildDeviceManifest = (
  script: BuiltNarrationScript,
  hash: string,
  options?: { scenarioKey?: string; generatedAt?: string },
): NarrationManifest => {
  const estimated = estimateTimings(script.segments);
  return {
    scenarioKey: options?.scenarioKey ?? script.scenarioKey,
    scriptHash: hash,
    segments: estimated,
    words: null,
    audioUrl: null,
    voice: { provider: 'device', voiceId: null, modelId: null },
    generatedAt: options?.generatedAt ?? new Date().toISOString(),
    disclosure: script.disclosure,
  };
};
