import http from 'node:http';
import { Readable } from 'node:stream';
import { pathToFileURL } from 'node:url';
import type { Env } from './env.ts';
import { router } from './router.ts';
import { loadEnvFile } from './env-file.ts';

const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT || 8787);
const repoRoot = new URL('../../../', import.meta.url).pathname;

export const startDevServer = async (): Promise<http.Server> => {
  await loadEnvFile(repoRoot + '.env.local');
  if (!process.env.KV_FILE) process.env.KV_FILE = new URL('../../../data/kv-dev.json', import.meta.url).pathname;
  if (!process.env.PUBLIC_ORIGIN) process.env.PUBLIC_ORIGIN = 'http://localhost:5173';

  const server = http.createServer(async (nodeReq, nodeRes) => {
    try {
      const headers = new Headers();
      for (const [key, value] of Object.entries(nodeReq.headers)) {
        if (Array.isArray(value)) {
          for (const item of value) headers.append(key, item);
        } else if (value !== undefined) {
          headers.set(key, value);
        }
      }
      const method = nodeReq.method ?? 'GET';
      const body =
        method === 'GET' || method === 'HEAD'
          ? undefined
          : (Readable.toWeb(nodeReq) as unknown as ReadableStream<Uint8Array>);
      const request = new Request('http://' + HOST + ':' + PORT + (nodeReq.url ?? '/'), {
        method,
        headers,
        body: body as BodyInit | undefined,
        // Node requires this for a streaming body.
        ...(body ? { duplex: 'half' } : {}),
      } as RequestInit);
      const response = await router(request, process.env as unknown as Env);
      const buffer = Buffer.from(await response.arrayBuffer());
      const outHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        outHeaders[key] = value;
      });
      nodeRes.writeHead(response.status, outHeaders);
      nodeRes.end(buffer);
    } catch {
      if (!nodeRes.headersSent) {
        nodeRes.writeHead(500, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      }
      nodeRes.end(JSON.stringify({ error: 'Internal error' }));
    }
  });

  return new Promise((resolve) => {
    server.listen(PORT, HOST, () => {
      // No env values in logs.
      console.log('Fire Atlas API listening on http://' + HOST + ':' + PORT);
      resolve(server);
    });
  });
};

const isMain = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;
if (isMain) {
  startDevServer().catch(() => {
    console.error('Fire Atlas API failed to start');
    process.exitCode = 1;
  });
}
