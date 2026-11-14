import type { Env } from '../env.ts';
import { ApiError } from '../http.ts';

/**
 * In-memory monthly call cap per provider (MONTHLY_CALL_CAP).
 * It is a spend guard for one isolate, not a billing system. Unset or 0 means off.
 */
const counters = new Map<string, { month: string; count: number }>();

const monthKey = (): string => new Date().toISOString().slice(0, 7);

export const consumeProviderCall = (env: Env, provider: string): void => {
  const cap = Number(env.MONTHLY_CALL_CAP);
  if (!Number.isFinite(cap) || cap <= 0) return;
  const month = monthKey();
  const current = counters.get(provider);
  const next = current && current.month === month ? { month, count: current.count + 1 } : { month, count: 1 };
  counters.set(provider, next);
  if (next.count > cap) throw new ApiError(429, 'Provider budget reached');
};

export const resetProviderBudget = (): void => counters.clear();
