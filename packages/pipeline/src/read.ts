import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

export type Encoding = 'utf-8-bom' | 'utf-8' | 'windows-1252';

export interface RawTable {
  path: string;
  fileName: string;
  bytes: Buffer;
  byteLength: number;
  text: string;
  encoding: Encoding;
  sha256: string;
  sha12: string;
}

export function sha256Hex(input: Uint8Array | string): string {
  return createHash('sha256').update(input).digest('hex');
}

export function sha12Of(bytes: Uint8Array): string {
  return sha256Hex(bytes).slice(0, 12);
}

/**
 * UTF-8 with optional BOM, falling back to windows-1252 (FLEX PSI-69).
 * TextDecoder strips a UTF-8 BOM by default.
 */
export function decodeTableBytes(bytes: Uint8Array): { text: string; encoding: Encoding } {
  const hasBom = bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return { text, encoding: hasBom ? 'utf-8-bom' : 'utf-8' };
  } catch {
    const text = new TextDecoder('windows-1252').decode(bytes);
    return { text, encoding: 'windows-1252' };
  }
}

export function readTable(path: string, fileName?: string): RawTable {
  const bytes = readFileSync(path);
  const decoded = decodeTableBytes(bytes);
  const sha256 = sha256Hex(bytes);
  return {
    path,
    fileName: fileName ?? path.split('/').pop() ?? path,
    bytes,
    byteLength: bytes.length,
    text: decoded.text,
    encoding: decoded.encoding,
    sha256,
    sha12: sha256.slice(0, 12),
  };
}

/**
 * RFC 4180 style CSV reader: quotes, escaped quotes, embedded commas and
 * newlines, CRLF or LF. Headers are trimmed by the caller.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (ch === '\r') {
      if (text[i + 1] === '\n') i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

export interface ParsedCsv {
  headers: string[];
  records: string[][];
}

export function readCsv(text: string): ParsedCsv {
  const raw = parseCsv(text);
  const first = raw[0];
  if (!first) return { headers: [], records: [] };
  const headers = first.map((h) => h.trim());
  const records = raw.slice(1).filter((r) => r.some((c) => c.trim() !== ''));
  return { headers, records };
}

export function recordFromRow(headers: string[], row: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < headers.length; i += 1) {
    const key = headers[i];
    if (key === undefined || key === '') continue;
    out[key] = row[i] ?? '';
  }
  return out;
}
