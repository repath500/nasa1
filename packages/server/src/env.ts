/**
 * Server environment. Values come from Cloudflare bindings or .env.local in dev.
 * No secret is ever logged, echoed in an error or written to a cache file.
 */

export interface KvNamespaceLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface Env {
  TYPESAFE_API_KEY?: string;
  GEMINI_API_KEY?: string;
  ELEVENLABS_API_KEY?: string;
  ELEVENLABS_VOICE_ID?: string;
  ELEVENLABS_MODEL_ID?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_RESEARCHER_MONTH?: string;
  STRIPE_PRICE_RESEARCHER_YEAR?: string;
  STRIPE_PRICE_LAB_MONTH?: string;
  STRIPE_PRICE_LAB_YEAR?: string;
  STRIPE_PRICE_SUPPORT?: string;
  STRIPE_MODE?: string;
  LICENSE_SECRET?: string;
  PUBLIC_ORIGIN?: string;
  /** Cloudflare KV binding for licence records. */
  LICENSES?: KvNamespaceLike;
  /** Dev only: JSON file backing the KV interface. */
  KV_FILE?: string;
  /** Test/dev only: directory for JSON caches. */
  CACHE_DIR?: string;
  /** Optional overrides, useful for tests and local proxies. */
  TYPESAFE_API_BASE?: string;
  GEMINI_API_BASE?: string;
  ELEVENLABS_API_BASE?: string;
  STRIPE_API_BASE?: string;
  GEMINI_MODEL?: string;
  /** Authoring only: persist live model responses as recorded cache. */
  CACHE_RECORD?: string;
  /** Per-provider monthly call cap, in-memory guard. */
  MONTHLY_CALL_CAP?: string;
  /** Authoring only: repeat Jev calls and take the median (1-3). */
  JEV_REPEATS?: string;
  /** Test/dev override for the public origin. */
  RATE_LIMIT_PER_MINUTE?: string;
}

const present = (value: string | undefined): boolean => typeof value === 'string' && value.trim().length > 0;

export const jevConfigured = (env: Env): boolean => present(env.TYPESAFE_API_KEY);
export const geminiConfigured = (env: Env): boolean => present(env.GEMINI_API_KEY);
export const elevenLabsConfigured = (env: Env): boolean =>
  present(env.ELEVENLABS_API_KEY) && present(env.ELEVENLABS_VOICE_ID);
export const licenseConfigured = (env: Env): boolean => present(env.LICENSE_SECRET);
export const stripeConfigured = (env: Env): boolean =>
  present(env.STRIPE_SECRET_KEY) && present(env.LICENSE_SECRET);

export type StripeMode = 'test' | 'live' | 'off';

export const stripeMode = (env: Env): StripeMode => {
  if (!stripeConfigured(env)) return 'off';
  return env.STRIPE_MODE === 'live' ? 'live' : 'test';
};

export const publicOrigin = (env: Env): string => {
  const raw = env.PUBLIC_ORIGIN?.trim();
  if (raw && /^https?:\/\/[^\s]+$/.test(raw)) return raw.replace(/\/+$/, '');
  return 'http://localhost:5173';
};

export const elevenLabsModel = (env: Env): string => env.ELEVENLABS_MODEL_ID?.trim() || 'eleven_multilingual_v2';
export const geminiModel = (env: Env): string => env.GEMINI_MODEL?.trim() || 'gemini-4-hydrogen';

export const apiBase = (value: string | undefined, fallback: string): string =>
  (value?.trim() || fallback).replace(/\/+$/, '');
