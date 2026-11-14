import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { normalizeQuote } from '@fire/core';
import { sha256Hex } from './read.ts';

export interface PageDocument {
  sourceId: string;
  sourceSha256: string;
  pageMarkersFound: boolean;
  rights: string;
  quoteAllowed: boolean;
  pages: Record<string, string>;
}

export function mayQuote(sourceId: string, determination: string): boolean {
  return sourceId !== '20210022402' &&
    ['PUBLIC_USE_PERMITTED', 'GOV_PUBLIC_USE_PERMITTED'].includes(determination);
}

export function extractPages(sourceId: string, text: string, rights: string): PageDocument {
  const markerFound = text.includes('\f');
  const segments = markerFound ? text.split('\f') : [text];
  if (markerFound && segments.at(-1)?.trim() === '') segments.pop();
  const pages: Record<string, string> = {};
  segments.forEach((page, index) => {
    pages[String(index + 1)] = normalizeQuote(page);
  });
  return {
    sourceId,
    sourceSha256: sha256Hex(text),
    pageMarkersFound: markerFound,
    rights,
    quoteAllowed: mayQuote(sourceId, rights),
    pages,
  };
}

export function buildPages(root: string, warn: (message: string) => void = console.warn): PageDocument[] {
  const input = join(root, 'research/flame/samples/ntrs');
  const output = join(root, 'data/pages');
  mkdirSync(output, { recursive: true });
  const documents: PageDocument[] = [];
  for (const filename of readdirSync(input).filter((name) => name.endsWith('.txt')).sort()) {
    const match = filename.match(/(\d{11})/);
    if (!match) {
      warn(`Skipping ${filename}: no NTRS source ID`);
      continue;
    }
    const sourceId = match[1]!;
    const metadata = JSON.parse(readFileSync(join(input, `${sourceId}.meta.json`), 'utf8')) as {
      copyright?: { determinationType?: string };
    };
    const text = readFileSync(join(input, filename), 'utf8');
    const document = extractPages(sourceId, text, metadata.copyright?.determinationType ?? 'UNKNOWN');
    if (!document.pageMarkersFound) {
      warn(`${filename}: no page markers; page 1 represents the entire document, not a verified PDF page`);
    }
    writeFileSync(join(output, `${sourceId}.pages.json`), `${JSON.stringify(document)}\n`);
    documents.push(document);
  }
  return documents;
}
