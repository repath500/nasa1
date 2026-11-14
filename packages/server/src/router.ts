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
import type { CheckoutOptions, StripeCallOptions } from './billing/stripe.ts';
import { health } from './handlers/health.ts';
import { rank } from './handlers/rank.ts';
import { ask } from './handlers/ask.ts';
import { explain } from './handlers/explain.ts';
import { narrate } from './handlers/narrate.ts';
import { checkout } from './handlers/checkout.ts';
import { licenseClaim, licenseInfo } from './handlers/license.ts';
import { portal } from './handlers/portal.ts';
import { stripeWebhook } from './handlers/webhook.ts';

export interface RouterDeps {
  rateLimiter?: RateLimiter;
  rank?: LadderOptions;
  ask?: ModelCallOptions;
  explain?: ModelCallOptions;
  render?: RenderOptions;
  stripe?: StripeCallOptions & CheckoutOptions;
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
    if (path === '/api/license') {
      if (method !== 'GET') return methodNotAllowed('GET');
      return await licenseInfo(req, env);
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
    if (path === '/api/checkout') {
      if (method !== 'POST') return methodNotAllowed('POST');
      return await checkout(req, env, deps?.stripe);
    }
    if (path === '/api/license/claim') {
      if (method !== 'POST') return methodNotAllowed('POST');
      return await licenseClaim(req, env, deps?.stripe);
    }
    if (path === '/api/portal') {
      if (method !== 'POST') return methodNotAllowed('POST');
      return await portal(req, env, deps?.stripe);
    }
    if (path === '/api/stripe/webhook') {
      if (method !== 'POST') return methodNotAllowed('POST');
      return await stripeWebhook(req, env, deps?.stripe);
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
  'POST /api/checkout',
  'POST /api/license/claim',
  'GET /api/license',
  'POST /api/portal',
  'POST /api/stripe/webhook',
] as const;

export { json };
