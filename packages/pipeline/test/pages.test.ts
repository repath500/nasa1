import { describe, expect, it } from 'vitest';
import { verifyQuote } from '@fire/core';
import { extractPages, mayQuote } from '../src/pages.ts';

describe('local page extraction', () => {
  it('splits form-feed page boundaries and normalizes text', () => {
    const document = extractPages('20140011099', 'First  page\ntext.\fSecond page text.\f', 'PUBLIC_USE_PERMITTED');
    expect(document.pageMarkersFound).toBe(true);
    expect(document.pages).toEqual({ '1': 'First page text.', '2': 'Second page text.' });
    expect(document.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it('marks an unpaginated document rather than inventing page numbers', () => {
    const document = extractPages('20180004258', 'One document without a page boundary.', 'GOV_PUBLIC_USE_PERMITTED');
    expect(document.pageMarkersFound).toBe(false);
    expect(Object.keys(document.pages)).toEqual(['1']);
  });

  it('fails closed on restricted and excluded sources', () => {
    expect(mayQuote('20210011385', 'GOV_PERMITTED')).toBe(false);
    expect(mayQuote('20210022402', 'PUBLIC_USE_PERMITTED')).toBe(false);
    expect(mayQuote('20140011099', 'PUBLIC_USE_PERMITTED')).toBe(true);
    expect(mayQuote('unknown', 'UNKNOWN')).toBe(false);
  });

  it('rejects fabricated and wrong-page quotations', () => {
    const quote = 'This quoted sentence includes 30 percent oxygen.';
    const document = extractPages('20140011099', `${quote}\fA different page has unrelated text.`, 'PUBLIC_USE_PERMITTED');
    expect(verifyQuote(quote, document.pages['1']!, [30])).toBe(true);
    expect(verifyQuote(quote, document.pages['2']!, [30])).toBe(false);
    expect(verifyQuote('This fabricated sentence includes 30 percent oxygen.', document.pages['1']!, [30])).toBe(false);
  });
});
