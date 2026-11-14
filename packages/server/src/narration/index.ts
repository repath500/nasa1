import type { NarrationManifest } from '@fire/contracts';
import { elevenLabsConfigured, elevenLabsModel, type Env } from '../env.ts';
import { bytesToBase64 } from '../http.ts';
import { fileCache } from '../ai/cache.ts';
import { NarrationManifestSchema } from '../ai/schemas.ts';
import type { BuiltNarrationScript } from '../core-bridge.ts';
import { synthesize } from './elevenlabs.ts';
import { buildDeviceManifest, buildElevenLabsManifest, hashForScript } from './manifest.ts';
import { withId3Comment } from './id3.ts';

export interface AudioStore {
  save(hash: string, bytes: Uint8Array): Promise<string | null>;
}

const liveAudioDir = (): string => new URL('../../../../apps/web/public/audio/live/', import.meta.url).pathname;

export const nodeAudioStore: AudioStore = {
  async save(hash, bytes) {
    try {
      const { mkdir, writeFile } = await import('node:fs/promises');
      const dir = liveAudioDir();
      await mkdir(dir, { recursive: true });
      await writeFile(dir + hash + '.mp3', bytes);
      return '/audio/live/' + hash + '.mp3';
    } catch {
      return null;
    }
  },
};

export const dataUrlAudioStore: AudioStore = {
  async save(_hash, bytes) {
    return 'data:audio/mpeg;base64,' + bytesToBase64(bytes);
  },
};

export const defaultAudioStore = (): AudioStore =>
  typeof process !== 'undefined' && process.versions?.node ? nodeAudioStore : dataUrlAudioStore;

export interface RenderOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  baseUrl?: string;
  audioStore?: AudioStore;
  cache?: ReturnType<typeof fileCache>;
  generatedAt?: string;
  /** Build script writes the mp3 next to the manifest itself. */
  skipCache?: boolean;
  audioUrl?: string | null;
}

export interface RenderedNarration {
  manifest: NarrationManifest;
  audio: Uint8Array | null;
  cached: boolean;
}

/**
 * One manifest per script hash. With no key the manifest is device voice and
 * audioUrl is null; the browser reads the same script with speechSynthesis.
 */
export const renderNarration = async (
  env: Env,
  script: BuiltNarrationScript,
  options?: RenderOptions,
): Promise<RenderedNarration> => {
  const useEleven = elevenLabsConfigured(env);
  const hash = await hashForScript(script, {
    scenarioKey: script.scenarioKey,
    voiceProvider: useEleven ? 'elevenlabs' : 'device',
    voiceId: useEleven ? env.ELEVENLABS_VOICE_ID ?? null : null,
    modelId: useEleven ? elevenLabsModel(env) : null,
  });

  if (!useEleven) {
    return {
      manifest: buildDeviceManifest(script, hash, { scenarioKey: script.scenarioKey, generatedAt: options?.generatedAt }),
      audio: null,
      cached: false,
    };
  }

  const cache = options?.cache ?? fileCache(env, 'narration');
  if (!options?.skipCache) {
    const raw = await cache.read(hash);
    if (raw) {
      const parsed = NarrationManifestSchema.safeParse(raw);
      if (parsed.success && parsed.data.audioUrl) {
        return { manifest: parsed.data as NarrationManifest, audio: null, cached: true };
      }
    }
  }

  const result = await synthesize(env, script.segments.map((segment) => segment.text).join('\n\n'), {
    fetchImpl: options?.fetchImpl,
    timeoutMs: options?.timeoutMs,
    baseUrl: options?.baseUrl,
  });
  const tagged = withId3Comment(
    result.audio,
    'AI-generated voice (ElevenLabs). Fire Atlas, NASA Space Apps 2026.',
    'Fire Atlas overview',
  );
  const store = options?.audioStore ?? defaultAudioStore();
  const audioUrl = options?.audioUrl !== undefined ? options.audioUrl : await store.save(hash, tagged);
  const manifest = buildElevenLabsManifest(
    script,
    {
      scenarioKey: script.scenarioKey,
      voiceProvider: 'elevenlabs',
      voiceId: result.voiceId,
      modelId: result.modelId,
      audioUrl,
      generatedAt: options?.generatedAt,
    },
    result.alignment,
    hash,
  );
  if (!options?.skipCache) await cache.write(hash, manifest);
  return { manifest, audio: tagged, cached: false };
};

export { buildDeviceManifest, buildElevenLabsManifest, mapAlignmentToSegments, hashForScript } from './manifest.ts';
export { synthesize } from './elevenlabs.ts';
export { withId3Comment } from './id3.ts';
