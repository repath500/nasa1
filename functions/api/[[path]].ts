/**
 * Cloudflare Pages Function: every /api/* request goes to the shared server router (packages/server).
 * Bind secrets and the LICENSES KV namespace in the Pages project (see wrangler.toml and packages/server/README.md).
 * With no keys the router serves the labelled no-AI baseline, so the judged site still works.
 */
import { router, type Env } from '../../packages/server/src/index.ts';

interface PagesContext {
  request: Request;
  env: Record<string, unknown>;
}

export const onRequest = (context: PagesContext): Promise<Response> =>
  router(context.request, { ...(context.env as unknown as Env), KV_FILE: undefined } as Env);
