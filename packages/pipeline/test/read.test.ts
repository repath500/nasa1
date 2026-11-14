import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { decodeTableBytes, parseCsv, psiTablesDir, readCsv, readTable, sha12Of } from '../src/index.ts';

describe('encoding detection', () => {
  it('decodes FLEX PSI-69 as windows-1252', () => {
    const path = join(psiTablesDir(), 'PSI-69_Experimental_table_FLEX.csv');
    const table = readTable(path);
    expect(table.encoding).toBe('windows-1252');
    expect(table.text).toContain('\u2013');
    expect(table.text).not.toContain('\u00e2\u20ac\u201c');
    expect(table.sha12).toBe('37c88ce8ae93');
  });

  it('detects UTF-8 with BOM and strips it from headers', () => {
    const path = join(psiTablesDir(), 'PSI-25_Experimental_table_BASS-II.csv');
    const table = readTable(path);
    expect(table.encoding).toBe('utf-8-bom');
    const csv = readCsv(table.text);
    expect(csv.headers[0]).toBe('PI');
    expect(csv.records.length).toBe(129);
  });

  it('falls back to windows-1252 when UTF-8 is invalid', () => {
    const bytes = Uint8Array.from([0x46, 0x96, 0x20, 0x32, 0x31]);
    const decoded = decodeTableBytes(bytes);
    expect(decoded.encoding).toBe('windows-1252');
    expect(decoded.text).toContain('\u2013');
  });
});

describe('csv parser', () => {
  it('handles quotes, embedded commas, escaped quotes and CRLF', () => {
    const text = 'a,b,c\r\n"x, y","he said ""hi""",z\r\n1,2,3\r\n';
    expect(parseCsv(text)).toEqual([
      ['a', 'b', 'c'],
      ['x, y', 'he said "hi"', 'z'],
      ['1', '2', '3'],
    ]);
  });

  it('handles LF and a final row without a newline', () => {
    expect(parseCsv('a,b\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('trims headers and drops all-empty records', () => {
    const csv = readCsv(' H1 , H2 \n1,2\n,\n3,4');
    expect(csv.headers).toEqual(['H1', 'H2']);
    expect(csv.records).toEqual([
      ['1', '2'],
      ['3', '4'],
    ]);
  });

  it('hashes to the first 12 hex characters', () => {
    expect(sha12Of(new TextEncoder().encode('abc'))).toBe('ba7816bf8f01');
  });
});
