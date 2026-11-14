import { describe, expect, it } from 'vitest';
import type { NarrationSegment } from '@fire/contracts';
import { buildNarrationScript, estimateTimings, presetScenario } from '../src/core-bridge.ts';
import { buildDeviceManifest, mapAlignmentToSegments } from '../src/narration/manifest.ts';

const segments: NarrationSegment[] = [
  {
    id: 'one',
    title: 'One',
    text: 'Hello world.',
    claimIds: [],
    cues: [{ at: 0.2, kind: 'focusHabitat', habitat: 'earth-iss' }],
    startSec: null,
    endSec: null,
  },
  {
    id: 'two',
    title: 'Two',
    text: 'Second line.',
    claimIds: [],
    cues: [{ at: 0, kind: 'openLedger' }],
    startSec: null,
    endSec: null,
  },
];

const alignmentFor = (text: string, step = 0.1) => ({
  characters: [...text],
  character_start_times_seconds: [...text].map((_, index) => index * step),
  character_end_times_seconds: [...text].map((_, index) => (index + 1) * step),
});

describe('narration timing', () => {
  it('maps segment boundaries, cues and words from a character alignment', () => {
    const joined = 'Hello world.\n\nSecond line.';
    const mapped = mapAlignmentToSegments(segments, alignmentFor(joined));
    expect(mapped.segments[0]?.startSec).toBe(0);
    expect(mapped.segments[0]?.endSec).toBe(1.2);
    expect(mapped.segments[1]?.startSec).toBe(1.4);
    expect(mapped.segments[1]?.endSec).toBe(2.6);
    // Cue offsets become absolute track times.
    expect(mapped.segments[0]?.cues[0]?.at).toBe(0.2);
    expect(mapped.segments[1]?.cues[0]?.at).toBe(1.4);
    expect(mapped.words?.map((word) => word.w)).toEqual(['Hello', 'world.', 'Second', 'line.']);
    expect(mapped.words?.[0]).toMatchObject({ start: 0, end: 0.5 });
    expect(mapped.durationSec).toBe(2.6);
  });

  it('returns word timings as null when the alignment length does not match', () => {
    const mapped = mapAlignmentToSegments(segments, {
      characters: ['H'],
      character_start_times_seconds: [0],
      character_end_times_seconds: [0.1],
    });
    expect(mapped.words).toBeNull();
    expect(mapped.segments[0]?.startSec).toBe(0);
  });

  it('estimates device timings so captions and cues still work without a key', () => {
    const script = buildNarrationScript({
      scenarioKey: 'not-a-preset',
      kind: 'scenario',
      scenario: presetScenario('earth-iss') ?? undefined,
      concern: 'prevention',
      voiceProvider: 'device',
    });
    const estimated = estimateTimings(script.segments);
    expect(estimated.every((segment) => typeof segment.startSec === 'number')).toBe(true);
    expect(estimated.every((segment) => (segment.endSec ?? 0) > (segment.startSec ?? 0))).toBe(true);
    const manifest = buildDeviceManifest(script, 'a'.repeat(64));
    expect(manifest.voice.provider).toBe('device');
    expect(manifest.audioUrl).toBeNull();
    expect(manifest.disclosure).toContain('device voice');
    expect(manifest.words).toBeNull();
  });
});

describe('ElevenLabs manifest', () => {
  it('turns a sample alignment into a manifest and tags the mp3', async () => {
    const { renderNarration, dataUrlAudioStore } = await import('../src/narration/index.ts');
    const { memoryCache } = await import('../src/ai/cache.ts');
    const script = buildNarrationScript({
      scenarioKey: 'earth-iss__suppression',
      kind: 'scenario',
      scenario: presetScenario('earth-iss') ?? undefined,
      concern: 'suppression',
      voiceProvider: 'elevenlabs',
    });
    const text = script.segments.map((segment) => segment.text).join('\n\n');
    const chars = [...text];
    const alignment = {
      characters: chars,
      character_start_times_seconds: chars.map((_, index) => index * 0.05),
      character_end_times_seconds: chars.map((_, index) => (index + 1) * 0.05),
    };
    const audio = Uint8Array.from([0xff, 0xfb, 0x90, 0x00]);
    const fetchImpl = (async () =>
      new Response(
        JSON.stringify({
          audio_base64: Buffer.from(audio).toString('base64'),
          alignment,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )) as unknown as typeof fetch;
    const cache = memoryCache();
    const first = await renderNarration(
      { ELEVENLABS_API_KEY: 'test', ELEVENLABS_VOICE_ID: 'voice_1' },
      script,
      { fetchImpl, audioStore: dataUrlAudioStore, cache },
    );
    expect(first.cached).toBe(false);
    expect(first.manifest.voice.provider).toBe('elevenlabs');
    expect(first.manifest.disclosure).toContain('ElevenLabs');
    expect(first.manifest.audioUrl?.startsWith('data:audio/mpeg;base64,')).toBe(true);
    expect(first.manifest.words?.length).toBeGreaterThan(10);
    expect(first.manifest.segments[0]?.startSec).toBe(0);
    expect(first.audio?.[0]).toBe(0x49);
    expect(first.audio?.[1]).toBe(0x44);
    expect(first.audio?.[2]).toBe(0x33);

    const second = await renderNarration(
      { ELEVENLABS_API_KEY: 'test', ELEVENLABS_VOICE_ID: 'voice_1' },
      script,
      { fetchImpl, audioStore: dataUrlAudioStore, cache },
    );
    expect(second.cached).toBe(true);
    expect(second.manifest.scriptHash).toBe(first.manifest.scriptHash);
  });
});
