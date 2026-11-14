import { useEffect, useState } from 'react';
import type { HealthResponse } from '@fire/contracts';

/** Thin fetch helpers. Every call tolerates failure (offline, no server, no keys). */
export async function apiFetch<T>(path: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), init.timeoutMs ?? 8000);
  try {
    const headers = new Headers(init.headers);
    if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json');
    const res = await fetch(path, { ...init, headers, signal: init.signal ?? ctrl.signal });
    if (!res.ok) {
      let message = `Request failed (${res.status}).`;
      try { const j = (await res.json()) as { error?: string; message?: string }; message = j.error ?? j.message ?? message; } catch { /* not json */ }
      return { ok: false, status: res.status, message };
    }
    return { ok: true, data: (await res.json()) as T };
  } catch (e) {
    return { ok: false, status: 0, message: e instanceof Error && e.name === 'AbortError' ? 'The request timed out.' : 'Could not reach the server.' };
  } finally { clearTimeout(t); }
}

export type HealthState = { status: 'loading' } | { status: 'ok'; health: HealthResponse; at: number } | { status: 'offline' };
let current: HealthState = { status: 'loading' };
const listeners = new Set<() => void>();
const publish = (s: HealthState) => { current = s; listeners.forEach((l) => l()); };
let timer: ReturnType<typeof setInterval> | null = null;

export async function pollHealth(): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) { publish({ status: 'offline' }); return; }
  const r = await apiFetch<HealthResponse>('/api/health', { timeoutMs: 4000 });
  publish(r.ok && r.data && typeof r.data === 'object' && 'services' in r.data ? { status: 'ok', health: r.data, at: Date.now() } : { status: 'offline' });
}

/** Shared health poll, one interval for the whole app. */
export function useHealth(): HealthState {
  const [s, setS] = useState(current);
  useEffect(() => {
    const l = () => setS(current);
    listeners.add(l);
    if (!timer) { void pollHealth(); timer = setInterval(() => void pollHealth(), 30_000); window.addEventListener('online', () => void pollHealth()); window.addEventListener('offline', () => publish({ status: 'offline' })); }
    l();
    return () => { listeners.delete(l); };
  }, []);
  return s;
}
