import type { AskResponse, Concern, HealthResponse, NarrationManifest, RankRequest, RankResponse, ScenarioId } from '@fire/contracts';

export class ApiError extends Error {
  constructor(message: string, readonly status: number | null, readonly requestId: string) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  signal?: AbortSignal;
  requestId?: string;
}

async function request<ResponseBody>(path: string, body?: unknown, options: RequestOptions = {}): Promise<ResponseBody> {
  const requestId = options.requestId ?? crypto.randomUUID();
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (options.signal?.aborted) controller.abort();
  else options.signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, 5000);
  try {
    const headers = new Headers({ 'X-Request-Id': requestId });
    if (body !== undefined) headers.set('Content-Type', 'application/json');
    const response = await fetch(path, {
      method: body === undefined ? 'GET' : 'POST',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const payload: unknown = await response.json();
    if (!response.ok) {
      const message = typeof payload === 'object' && payload !== null && 'error' in payload && typeof payload.error === 'string'
        ? payload.error : 'API request failed';
      throw new ApiError(message, response.status, requestId);
    }
    return payload as ResponseBody;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(controller.signal.aborted ? 'Request cancelled or timed out' : 'Network request failed', null, requestId);
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', abort);
  }
}

export const api = {
  health: (options?: RequestOptions) => request<HealthResponse>('/api/health', undefined, options),
  rank: (body: RankRequest, options?: RequestOptions) => request<RankResponse>('/api/rank', body, options),
  explain: (body: { accession: string; scenarioId: Exclude<ScenarioId, 'custom'> }, options?: RequestOptions) =>
    request<{ text: string; claimIds: string[]; source: 'hydrogen' | 'template' }>('/api/explain', body, options),
  ask: (question: string, options?: RequestOptions) => request<AskResponse>('/api/ask', { question }, options),
  narrate: (body: { scenarioKey: string } | { customScenario: { o2Pct: number; totalKpa: number; concern: Concern } }, options?: RequestOptions) =>
    request<NarrationManifest>('/api/narrate', body, options),
};
