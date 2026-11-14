/**
 * OpenRouter client for Gemini 4 Hydrogen (`google/gemini-4-hydrogen`).
 * One OpenAI-compatible endpoint, JSON-schema structured output, hard timeout, no secrets in errors.
 * Used for: Ask (question -> filters), study explanations, and the fallback judge when Jev is unavailable.
 */
import type { Env } from '../env.ts';
import { UpstreamError, parseModelJson, upstreamJson } from './upstream.ts';
import { consumeProviderCall } from './budget.ts';

export const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const openRouterModel = (env: Env): string => env.OPENROUTER_MODEL?.trim() || 'google/gemini-4-hydrogen';
export const openRouterConfigured = (env: Env): boolean => typeof env.OPENROUTER_API_KEY === 'string' && env.OPENROUTER_API_KEY.trim().length > 0;

export interface OpenRouterCall {
  schemaName: string;
  schema: Record<string, unknown>;
  system: string;
  user: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export async function openRouterJson(env: Env, call: OpenRouterCall): Promise<{ value: unknown; modelId: string; ms: number }> {
  if (!openRouterConfigured(env)) throw new UpstreamError('OpenRouter is not configured', 503);
  consumeProviderCall(env, 'openrouter');
  const model = openRouterModel(env);
  const started = Date.now();
  const data = await upstreamJson({
    fetchImpl: call.fetchImpl,
    url: OPENROUTER_URL,
    timeoutMs: call.timeoutMs ?? 8000,
    provider: 'Hydrogen (OpenRouter)',
    init: {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'Fire Atlas',
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          { role: 'system', content: call.system },
          { role: 'user', content: call.user },
        ],
        response_format: { type: 'json_schema', json_schema: { name: call.schemaName, strict: true, schema: call.schema } },
      }),
    },
  });
  const content = (data as { choices?: { message?: { content?: unknown } }[] })?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new UpstreamError('Hydrogen (OpenRouter) returned no content', 502);
  return { value: parseModelJson(content), modelId: model, ms: Date.now() - started };
}
