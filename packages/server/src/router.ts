import type { Env } from './env.ts';
import {
  ApiError,
  clientIp,
  defaultRateLimiter,
  errorResponse,
  isCrossSite,
  json,
  methodNotAllowed,
  type RateLimiter,
} from './http.ts';
import type { LadderOptions } from './ai/ladder.ts';
import type { ModelCallOptions } from './ai/hydrogen.ts';
import type { RenderOptions } from './narration/index.ts';
import { health } from './handlers/health.ts';
import { rank } from './handlers/rank.ts';
import { ask } from './handlers/ask.ts';
import { explain } from './handlers/explain.ts';
import { narrate } from './handlers/narrate.ts';

export interface RouterDeps {
  rateLimiter?: RateLimiter;
  rank?: LadderOptions;
  ask?: ModelCallOptions;
  explain?: ModelCallOptions;
  render?: RenderOptions;
}

const routeKey = (req: Request): { method: string; path: string } => {
  const url = new URL(req.url);
  const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : url.pathname;
  return { method: req.method.toUpperCase(), path };
};

/** SPEC §12 routes only. */
export const router = async (req: Request, env: Env, deps?: RouterDeps): Promise<Response> => {
  try {
    if (isCrossSite(req)) return errorResponse(403, 'Cross-site requests are not allowed');
    const limiter = deps?.rateLimiter ?? defaultRateLimiter(env.RATE_LIMIT_PER_MINUTE);
    const bucket = limiter.take(clientIp(req));
    if (!bucket.ok) {
      return errorResponse(429, 'Too many requests', { 'Retry-After': String(Math.max(1, bucket.retryAfterSec)) });
    }

    const { method, path } = routeKey(req);
    if (path === '/api/health') {
      if (method !== 'GET') return methodNotAllowed('GET');
      return await health(req, env);
    }
    if (path === '/api/rank') {
      if (method !== 'POST') return methodNotAllowed('POST');
      return await rank(req, env, deps?.rank);
    }
    if (path === '/api/ask') {
      if (method !== 'POST') return methodNotAllowed('POST');
      return await ask(req, env, deps?.ask);
    }
    if (path === '/api/explain') {
      if (method !== 'POST') return methodNotAllowed('POST');
      return await explain(req, env, deps?.explain);
    }
    if (path === '/api/narrate') {
      if (method !== 'POST') return methodNotAllowed('POST');
      return await narrate(req, env, deps?.render);
    }
    return errorResponse(404, 'Not found');
  } catch (error) {
    if (error instanceof ApiError) return errorResponse(error.status, error.message);
    // Never echo an exception message: it can contain upstream detail or values.
    return errorResponse(500, 'Internal error');
  }
};

export const routeTable = [
  'GET /api/health',
  'POST /api/rank',
  'POST /api/ask',
  'POST /api/explain',
  'POST /api/narrate',
] as const;

export { json };
