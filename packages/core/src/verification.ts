import type { TestRow } from '@fire/contracts';
export function normalizeQuote(text: string): string { return text.normalize('NFKC').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—−]/g, '-').replace(/\u00ad/g, '').replace(/-\s*\r?\n\s*/g, '').replace(/\s+/g, ' ').trim(); }
const numbers = (text: string): string[] => text.match(/(?<![\p{L}\p{N}_])[-+]?(?:\d+(?:\.\d+)?|\.\d+)/gu) ?? [];
export function verifyQuote(quote: string, pageText: string, expectedNumbers: Array<number | string> = []): boolean {
  const normalized = normalizeQuote(quote);
  const found = numbers(normalized).map(Number);
  return normalized.length >= 25 && normalizeQuote(pageText).includes(normalized) && expectedNumbers.every(value => found.includes(Number(value)));
}
export function verifyTableRow(row: TestRow, csvCells: Record<string, string>, sha12: string): boolean {
  const keys = Object.keys(row.raw);
  return /^[a-f\d]{12}$/i.test(sha12) && row.csvSha12.toLowerCase() === sha12.toLowerCase() && keys.length === Object.keys(csvCells).length && keys.every(key => Object.hasOwn(csvCells, key) && row.raw[key] === csvCells[key]);
}
export function numberGuard(text: string, allowedNumbers: Array<number | string>): string[] {
  const allowed = new Set(allowedNumbers.map(value => Number(value)));
  return [...new Set(numbers(text).filter(value => !allowed.has(Number(value))))];
}
const banned: Array<[RegExp, string]> = [
  [/\b(?:unsafe|safe|certif(?:y|ied|ication)|validated|calibrated|predicts?|predictive model|fire risk|first|only|novel|unprecedented)\b/i, 'prohibited wording'],
  [/\b(?:none exists?|extinction limit|more flammable|equal p[oO₂2]+ means equal flammability)\b/i, 'unsupported claim'],
  [/(?:lunar gravity is safer|0\s*g and 1\s*g bound the moon|nasa[- ]approved|nasa endorses|probability the science or fire is true)/i, 'unsupported claim'],
  [/[—–]/, 'em or en dash'],
];
export function claimLint(text: string): string[] { return banned.filter(([pattern]) => pattern.test(text)).map(([, message]) => message); }
