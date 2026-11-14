import { createHash } from 'node:crypto';

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** JSON with object keys sorted recursively, arrays kept in order. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value as Json));
}

function canonicalize(value: Json): Json {
  if (Array.isArray(value)) return value.map((entry) => canonicalize(entry));
  if (isPlainObject(value)) {
    const out: { [key: string]: Json } = {};
    for (const key of Object.keys(value).sort()) {
      out[key] = canonicalize(value[key] as Json);
    }
    return out;
  }
  return value;
}

export function sha256Hex(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

export function corpusHashOf(input: {
  cards: unknown;
  rows: unknown;
  rejects: unknown;
  records: unknown;
}): string {
  return sha256Hex(
    canonicalJson({
      cards: input.cards,
      rows: input.rows,
      rejects: input.rejects,
      records: input.records,
    }),
  );
}
