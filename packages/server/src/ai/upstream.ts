/** Upstream fetch with a hard timeout, so a slow provider cannot hold a route. */

export class UpstreamError extends Error {
  status: number | null;
  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = 'UpstreamError';
    this.status = status;
  }
}

export interface UpstreamOptions {
  fetchImpl?: typeof fetch;
  url: string;
  init: RequestInit;
  timeoutMs: number;
  provider: string;
}

export const upstreamJson = async (options: UpstreamOptions): Promise<unknown> => {
  const fetcher = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new UpstreamError(options.provider + ' timed out', 504));
    }, options.timeoutMs);
  });
  const work = (async () => {
    const response = await fetcher(options.url, { ...options.init, signal: controller.signal });
    if (!response.ok) throw new UpstreamError(options.provider + ' request failed', response.status);
    const text = await response.text();
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new UpstreamError(options.provider + ' returned invalid JSON', 502);
    }
  })();
  try {
    return await Promise.race([work, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

/** JSON parse for model text fields, with no detail leaked to the client. */
export const parseModelJson = (value: string): unknown => {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new UpstreamError('model returned invalid JSON', 502);
  }
};
