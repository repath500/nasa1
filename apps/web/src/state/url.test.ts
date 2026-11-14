import { describe, expect, it } from 'vitest';
import { readUrl, writeUrl } from './url';
import { useAtlas } from './store';

describe('URL sync rules', () => {
  it('preserves non-atlas parameters (compare, duel, Stripe) when writing', () => {
    const out = new URLSearchParams(writeUrl('a=PSI-69&b=PSI-25&session_id=cs_test_1&h=suit'));
    expect(out.get('a')).toBe('PSI-69');
    expect(out.get('b')).toBe('PSI-25');
    expect(out.get('session_id')).toBe('cs_test_1');
    expect(out.get('h')).toBe(useAtlas.getState().habitat);
  });
  it('returns nothing for links without atlas keys, so plain pages do not reset state', () => {
    expect(readUrl('a=PSI-69&b=PSI-25')).toEqual({});
  });
  it('resets absent keys to defaults when a link carries atlas keys', () => {
    const patch = readUrl('h=earth-iss');
    expect(patch).toMatchObject({ habitat: 'earth-iss', fuelFilter: [], selectedRowId: null, expert: false, material: null });
  });
  it('accepts 0% O2 custom air and rejects malformed values', () => {
    expect(readUrl('h=custom&o2=0&kpa=70').custom).toEqual({ o2Pct: 0, totalKpa: 70 });
    expect(readUrl('h=custom&o2=-5&kpa=70').custom).toBeUndefined();
    expect(readUrl('h=nope&sel=bad').habitat).toBe('lunar-cabin-example');
    expect(readUrl('h=nope&sel=bad').selectedRowId).toBeNull();
  });
});
