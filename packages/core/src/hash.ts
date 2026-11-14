import type { Corpus } from '@fire/contracts';

export function canonicalJson(value: unknown): string {
  const normalize = (item: unknown): unknown => Array.isArray(item) ? item.map(normalize) : item !== null && typeof item === 'object' ? Object.fromEntries(Object.entries(item).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0).map(([key, entry]) => [key, normalize(entry)])) : item;
  const result = JSON.stringify(normalize(value));
  if (result === undefined) throw new TypeError('Value cannot be serialized');
  return result;
}
export function sha256Hex(text: string): string {
  const bytes = new TextEncoder().encode(text);
  const length = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(length); padded.set(bytes); padded[bytes.length] = 128;
  const view = new DataView(padded.buffer); const bitLength = bytes.length * 8;
  view.setUint32(length - 8, Math.floor(bitLength / 0x100000000)); view.setUint32(length - 4, bitLength >>> 0);
  const primes: number[] = []; for (let candidate = 2; primes.length < 64; candidate++) if (primes.every(prime => candidate % prime !== 0)) primes.push(candidate);
  const initial = primes.slice(0, 8).map(prime => (Math.sqrt(prime) % 1 * 0x100000000) >>> 0);
  const constants = primes.map(prime => (Math.cbrt(prime) % 1 * 0x100000000) >>> 0);
  const rotate = (value: number, count: number): number => (value >>> count) | (value << (32 - count));
  for (let offset = 0; offset < length; offset += 64) {
    const words = new Uint32Array(64); for (let index = 0; index < 16; index++) words[index] = view.getUint32(offset + index * 4);
    for (let index = 16; index < 64; index++) { const a = words[index - 15]!, b = words[index - 2]!; words[index] = (words[index - 16]! + (rotate(a, 7) ^ rotate(a, 18) ^ (a >>> 3)) + words[index - 7]! + (rotate(b, 17) ^ rotate(b, 19) ^ (b >>> 10))) >>> 0; }
    let [a, b, c, d, e, f, g, h] = initial as [number, number, number, number, number, number, number, number];
    for (let index = 0; index < 64; index++) { const one = (h + (rotate(e, 6) ^ rotate(e, 11) ^ rotate(e, 25)) + ((e & f) ^ (~e & g)) + constants[index]! + words[index]!) >>> 0; const two = ((rotate(a, 2) ^ rotate(a, 13) ^ rotate(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0; h = g; g = f; f = e; e = (d + one) >>> 0; d = c; c = b; b = a; a = (one + two) >>> 0; }
    [a, b, c, d, e, f, g, h].forEach((value, index) => { initial[index] = (initial[index]! + value) >>> 0; });
  }
  return initial.map(value => value.toString(16).padStart(8, '0')).join('');
}
export function corpusHash(corpus: Pick<Corpus, 'cards' | 'rows' | 'rejects' | 'records'>): string { return sha256Hex(canonicalJson({ cards: corpus.cards, rows: corpus.rows, rejects: corpus.rejects, records: corpus.records })); }
