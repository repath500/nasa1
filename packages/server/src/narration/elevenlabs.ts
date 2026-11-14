import { apiBase, elevenLabsModel, type Env } from '../env.ts';
import { UpstreamError, upstreamJson } from '../ai/upstream.ts';
import { ElevenLabsResponseSchema } from '../ai/schemas.ts';
import { base64ToBytes } from '../http.ts';
import { consumeProviderCall } from '../ai/budget.ts';

export const ELEVENLABS_BASE = 'https://api.elevenlabs.io';

/**
 * VERIFIED against https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps
 * (checked 14 Nov 2026): POST /v1/text-to-speech/{voice_id}/with-timestamps,
 * header xi-api-key, JSON {text, model_id}, response {audio_base64, alignment}.
 */
export const synthesize = async (
  env: Env,
  text: string,
  options?: { fetchImpl?: typeof fetch; timeoutMs?: number; baseUrl?: string; outputFormat?: string },
): Promise<{
  audio: Uint8Array;
  alignment: {
    characters: string[];
    character_start_times_seconds: number[];
    character_end_times_seconds: number[];
  };
  modelId: string;
  voiceId: string;
}> => {
  if (!env.ELEVENLABS_API_KEY || !env.ELEVENLABS_VOICE_ID) throw new UpstreamError('ElevenLabs is not configured', 503);
  consumeProviderCall(env, 'elevenlabs');
  const voiceId = env.ELEVENLABS_VOICE_ID;
  const modelId = elevenLabsModel(env);
  const format = options?.outputFormat ?? 'mp3_44100_64';
  const url =
    apiBase(options?.baseUrl ?? env.ELEVENLABS_API_BASE, ELEVENLABS_BASE) +
    '/v1/text-to-speech/' +
    encodeURIComponent(voiceId) +
    '/with-timestamps?output_format=' +
    encodeURIComponent(format);
  const data = await upstreamJson({
    fetchImpl: options?.fetchImpl,
    url,
    timeoutMs: options?.timeoutMs ?? 60000,
    provider: 'ElevenLabs',
    init: {
      method: 'POST',
      headers: {
        'xi-api-key': env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, model_id: modelId }),
    },
  });
  const parsed = ElevenLabsResponseSchema.safeParse(data);
  if (!parsed.success) throw new UpstreamError('ElevenLabs returned an unexpected shape', 502);
  const alignment = parsed.data.alignment ?? parsed.data.normalized_alignment;
  if (!alignment) throw new UpstreamError('ElevenLabs returned no alignment', 502);
  const { characters, character_start_times_seconds: starts, character_end_times_seconds: ends } = alignment;
  if (characters.length !== starts.length || characters.length !== ends.length) {
    throw new UpstreamError('ElevenLabs alignment arrays differ in length', 502);
  }
  return {
    audio: base64ToBytes(parsed.data.audio_base64),
    alignment: { characters, character_start_times_seconds: starts, character_end_times_seconds: ends },
    modelId,
    voiceId,
  };
};
