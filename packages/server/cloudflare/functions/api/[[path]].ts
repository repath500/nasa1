/**
 * Cloudflare Pages Function catch-all. Bind every env var from packages/server/README.md.
 * KV: bind LICENSES (namespace). The file cache is unavailable on Pages; the ladder
 * falls through to L3 baseline, which is the intended judged-build behaviour.
 */
import type { Env } from '../../../src/env.ts';
import { router } from '../../../src/router.ts';

interface PagesContext {
  request: Request;
  env: Record<string, unknown>;
}

export const onRequest = (context: PagesContext): Promise<Response> =>
  router(context.request, context.env as unknown as Env);
