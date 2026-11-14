import type { Env, KvNamespaceLike } from './env.ts';

/**
 * Cloudflare KV in production, a JSON file in dev.
 * Only the Stripe customer id, plan and timestamps are stored (SPEC §21).
 */
export interface LicenseRecord {
  customer: string;
  plan: 'explorer' | 'researcher' | 'lab';
  status: 'active' | 'revoked';
  expiresAt: string | null;
  updatedAt: string;
}

export interface UsageRecord {
  audioMinutes: number;
  askCalls: number;
}

export interface Kv {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

export const keyFor = {
  license: (customer: string): string => 'license:' + customer,
  usage: (customer: string): string => 'usage:' + customer,
  stripeEvent: (id: string): string => 'stripe-event:' + id,
};

const defaultFile = (): string => new URL('../../../data/kv-dev.json', import.meta.url).pathname;

class FileKv implements Kv {
  private readonly path: string;
  private queue: Promise<void> = Promise.resolve();

  constructor(path: string) {
    this.path = path;
  }

  private async load(): Promise<Record<string, string>> {
    try {
      const { readFile } = await import('node:fs/promises');
      const text = await readFile(this.path, 'utf8');
      const parsed = JSON.parse(text) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, string>;
      return {};
    } catch {
      return {};
    }
  }

  private async save(data: Record<string, string>): Promise<void> {
    const { mkdir, writeFile } = await import('node:fs/promises');
    const dir = this.path.slice(0, this.path.lastIndexOf('/'));
    if (dir) await mkdir(dir, { recursive: true });
    await writeFile(this.path, JSON.stringify(data, null, 2) + '\n', 'utf8');
  }

  async get(key: string): Promise<string | null> {
    const data = await this.load();
    return Object.prototype.hasOwnProperty.call(data, key) ? data[key] ?? null : null;
  }

  async put(key: string, value: string): Promise<void> {
    this.queue = this.queue.then(async () => {
      const data = await this.load();
      data[key] = value;
      await this.save(data);
    });
    await this.queue;
  }

  async delete(key: string): Promise<void> {
    this.queue = this.queue.then(async () => {
      const data = await this.load();
      delete data[key];
      await this.save(data);
    });
    await this.queue;
  }
}

const memoryStore = new Map<string, string>();

const memoryKv: Kv = {
  async get(key) {
    return memoryStore.get(key) ?? null;
  },
  async put(key, value) {
    memoryStore.set(key, value);
  },
  async delete(key) {
    memoryStore.delete(key);
  },
};

export const resetMemoryKv = (): void => memoryStore.clear();

export const getKv = (env: Env): Kv => {
  const binding: KvNamespaceLike | undefined = env.LICENSES;
  if (binding) return binding;
  const path = env.KV_FILE?.trim();
  if (path) return new FileKv(path);
  // No binding in a test or on an isolate without KV: fail closed to memory.
  if (typeof process === 'undefined' || process.env.NODE_ENV === 'test') return memoryKv; // Workers: no filesystem
  return new FileKv(defaultFile());
};

export const readLicenseRecord = async (kv: Kv, customer: string): Promise<LicenseRecord | null> => {
  const raw = await kv.get(keyFor.license(customer));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as LicenseRecord;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.customer !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
};

export const writeLicenseRecord = async (kv: Kv, record: LicenseRecord): Promise<void> => {
  await kv.put(keyFor.license(record.customer), JSON.stringify(record));
};

export const readUsage = async (kv: Kv, customer: string): Promise<UsageRecord> => {
  const raw = await kv.get(keyFor.usage(customer));
  if (!raw) return { audioMinutes: 0, askCalls: 0 };
  try {
    const parsed = JSON.parse(raw) as Partial<UsageRecord>;
    return {
      audioMinutes: Number.isFinite(parsed.audioMinutes) ? Number(parsed.audioMinutes) : 0,
      askCalls: Number.isFinite(parsed.askCalls) ? Number(parsed.askCalls) : 0,
    };
  } catch {
    return { audioMinutes: 0, askCalls: 0 };
  }
};

export const bumpUsage = async (kv: Kv, customer: string, field: keyof UsageRecord, by: number): Promise<void> => {
  const usage = await readUsage(kv, customer);
  usage[field] = Math.max(0, usage[field] + by);
  await kv.put(keyFor.usage(customer), JSON.stringify(usage));
};
