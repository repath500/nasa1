import type { Env } from '../env.ts';

export interface CacheStore {
  read(key: string): Promise<unknown | null>;
  write(key: string, value: unknown): Promise<boolean>;
}

const defaultCacheDir = (): string => new URL('../../cache/', import.meta.url).pathname;

/**
 * JSON file cache. Node and the dev server write to packages/server/cache/.
 * On Cloudflare there is no writable filesystem; reads fail closed and the
 * ladder moves on to the next layer. Live model output is only written when
 * CACHE_RECORD=1 (authoring), never in the judged build (R8).
 */
export const fileCache = (env: Env, prefix: 'rank' | 'narration'): CacheStore => ({
  async read(key: string) {
    try {
      const { readFile } = await import('node:fs/promises');
      const dir = (env.CACHE_DIR?.trim() || defaultCacheDir()).replace(/\/?$/, '/');
      const text = await readFile(dir + prefix + '-' + key + '.json', 'utf8');
      return JSON.parse(text) as unknown;
    } catch {
      return null;
    }
  },
  async write(key: string, value: unknown) {
    try {
      const { mkdir, writeFile } = await import('node:fs/promises');
      const dir = (env.CACHE_DIR?.trim() || defaultCacheDir()).replace(/\/?$/, '/');
      await mkdir(dir, { recursive: true });
      await writeFile(dir + prefix + '-' + key + '.json', JSON.stringify(value, null, 2) + '\n', 'utf8');
      return true;
    } catch {
      return false;
    }
  },
});

export const memoryCache = (seed?: Record<string, unknown>): CacheStore => {
  const store = new Map<string, unknown>(Object.entries(seed ?? {}));
  return {
    async read(key) {
      return store.has(key) ? store.get(key) : null;
    },
    async write(key, value) {
      store.set(key, value);
      return true;
    },
  };
};
