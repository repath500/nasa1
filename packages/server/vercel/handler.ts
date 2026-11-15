/**
 * Vercel Node.js function entry: adapts a Node (req, res) pair to the shared Web-standard router in src/router.ts.
 * Bundled by scripts/vercel-build.mjs into .vercel/output/functions/api.func/index.mjs.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { router } from '../src/router.ts';
import type { Env } from '../src/env.ts';

const MAX_BODY = 64 * 1024;

async function readBody(req: IncomingMessage): Promise<Buffer | undefined> {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined;
  const chunks: Buffer[] = []; let size = 0;
  for await (const chunk of req) {
    const b = typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer);
    size += b.length; if (size > MAX_BODY) break; // the router enforces its own 12 KB cap
    chunks.push(b);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const host = (req.headers['x-forwarded-host'] as string | undefined) ?? req.headers.host ?? 'localhost';
  const proto = (req.headers['x-forwarded-proto'] as string | undefined) ?? 'https';
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  }
  const body = await readBody(req);
  const request = new Request(`${proto}://${host}${req.url ?? '/'}`, { method: req.method, headers, body: body && body.length ? body : undefined });
  const env = {
    ...(process.env as Record<string, string | undefined>),
    PUBLIC_ORIGIN: process.env.PUBLIC_ORIGIN ?? `${proto}://${host}`,
    CACHE_DIR: process.env.CACHE_DIR ?? '/tmp/fire-atlas-cache', // the deployment filesystem is read-only except /tmp
    KV_FILE: '/tmp/fire-atlas-kv.json',
  } as unknown as Env;
  const response = await router(request, env);
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(Buffer.from(await response.arrayBuffer()));
}
