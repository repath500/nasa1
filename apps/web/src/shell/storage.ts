/** localStorage wrapped in try/catch (SPEC §7, §3.2). Always renders without it. */
export function lsGet(key: string): string | null {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
export function lsSet(key: string, value: string): boolean {
  try { window.localStorage.setItem(key, value); return true; } catch { return false; }
}
export function lsRemove(key: string): void {
  try { window.localStorage.removeItem(key); } catch { /* storage blocked */ }
}
export function lsGetJson<T>(key: string, fallback: T): T {
  const raw = lsGet(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}
export function lsSetJson(key: string, value: unknown): boolean {
  try { return lsSet(key, JSON.stringify(value)); } catch { return false; }
}
export const KEYS = {
  session: 'fa.session',
  recent: 'fa.recent',
  coach: 'fa.coach.seen',
  eggsOff: 'fa.eggs.off',
  konami: 'fa.konami',
  theme: 'fa.theme',
  unit: 'fa.unit',
} as const;
