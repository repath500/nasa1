import { describe, expect, it } from 'vitest';
import { buildCorpus, canonicalJson, corpusHashOf, sha256Hex } from '../src/index.ts';
import type { BuildResult } from '../src/index.ts';

const builtAt = '2026-11-14T00:00:00.000Z';
const result: BuildResult = buildCorpus({ builtAt });
const corpus = result.corpus;

function rowsOf(accession: string) {
  return corpus.rows.filter((row) => row.accession === accession);
}

describe('expected corpus facts', () => {
  it('parses FLEX with 274 rows and 24 rows at 30 percent O2 or more', () => {
    const rows = rowsOf('PSI-69');
    expect(rows.length).toBe(274);
    const atLeast30 = rows.filter((row) => row.o2Pct.min !== null && row.o2Pct.min >= 30);
    expect(atLeast30.length).toBe(24);
    expect(Math.min(...rows.map((row) => row.o2Pct.min ?? Infinity))).toBe(12);
    expect(Math.max(...rows.map((row) => row.o2Pct.max ?? -Infinity))).toBe(34);
  });

  it('parses BASS-II initial O2 from 13.6 to 22.2 percent', () => {
    const rows = rowsOf('PSI-25');
    expect(rows.length).toBe(129);
    const initial = rows.map((row) => row.o2Pct.min).filter((v): v is number => v !== null);
    expect(Math.min(...initial)).toBe(13.6);
    expect(Math.max(...initial)).toBe(22.2);
  });

  it('keeps post-test O2 separate from the condition', () => {
    const rows = rowsOf('PSI-25');
    const maxFinal = Math.max(
      ...rows.map((row) => row.o2FinalPct).filter((v): v is number => v !== null),
    );
    expect(maxFinal).toBe(40.4);
    expect(rows.every((row) => (row.o2Pct.max ?? 0) <= 22.2)).toBe(true);
  });

  it('has no pressure in the Saffire tables', () => {
    for (const accession of ['PSI-98', 'PSI-99', 'PSI-100']) {
      expect(rowsOf(accession).every((row) => row.pressureKpa.min === null)).toBe(true);
    }
  });

  it('has no O2 column in Saffire-III and BASS', () => {
    expect(rowsOf('PSI-100').every((row) => row.o2Pct.min === null)).toBe(true);
    expect(rowsOf('PSI-26').every((row) => row.o2Pct.min === null)).toBe(true);
    expect(rowsOf('PSI-100').every((row) => row.o2Pct.min !== 0)).toBe(true);
  });

  it('marks CFI-G O2 as burner oxygen', () => {
    const rows = rowsOf('PSI-159');
    expect(rows.length).toBe(333);
    expect(rows.every((row) => row.o2Location === 'burner')).toBe(true);
    const normal = rows.filter((row) => row.rowIndex < 179);
    const inverse = rows.filter((row) => row.rowIndex >= 179);
    expect(normal.length).toBe(179);
    expect(inverse.length).toBe(154);
    expect(new Set(rows.map((row) => row.id)).size).toBe(rows.length);
  });

  it('parses Saffire-II 1-g comparison columns as data, not conditions', () => {
    const row = rowsOf('PSI-99')[0];
    expect(row?.o2Pct).toEqual({ min: 21.5, max: 21.5 });
    expect(row?.flowCmS).toEqual({ min: 20, max: 20 });
    expect(row?.gravity).toBe('microgravity');
    expect(row?.raw['1-g Burn Length']).toBe('Complete');
  });

  it('keeps gravity microgravity for every ISS table', () => {
    expect(corpus.rows.every((row) => row.gravity === 'microgravity')).toBe(true);
  });
});

describe('rejects', () => {
  it('rejects BRE 3400 percent and 2100 percent O2 cells', () => {
    const bre = corpus.rejects.filter((reject) => reject.accession === 'PSI-20');
    expect(bre.map((reject) => reject.rawValue).sort()).toEqual(['2100%', '3400%']);
    expect(bre.every((reject) => reject.reason === 'o2-out-of-range')).toBe(true);
  });

  it('rejects the FLEX 114 zero pressure cell and keeps the row', () => {
    const reject = corpus.rejects.find(
      (entry) => entry.accession === 'PSI-69' && entry.rowIndex === 113,
    );
    expect(reject?.reason).toBe('pressure-nonpositive');
    expect(reject?.rawValue).toBe('0');
    const row = corpus.rows.find((entry) => entry.id === 'PSI-69:113');
    expect(row?.testLabel).toBe('#114');
    expect(row?.pressureKpa).toEqual({ min: null, max: null });
    expect(row?.o2Pct).toEqual({ min: 20, max: 20 });
  });

  it('rejects the SPICE negative flow cells', () => {
    const spice = corpus.rejects.filter((reject) => reject.accession === 'PSI-107');
    expect(spice.length).toBe(8);
    expect(spice.every((reject) => reject.reason === 'flow-negative')).toBe(true);
    expect(spice.some((reject) => reject.rawValue === '-5.92')).toBe(true);
  });

  it('has no other reject reasons', () => {
    expect(new Set(corpus.rejects.map((reject) => reject.reason))).toEqual(
      new Set(['o2-out-of-range', 'pressure-nonpositive', 'flow-negative']),
    );
  });
});

describe('cards and metadata', () => {
  it('builds one metadata-only card per accession with proposed pillars', () => {
    expect(corpus.cards.map((card) => card.accession)).toEqual([
      'PSI-98',
      'PSI-99',
      'PSI-100',
      'PSI-26',
      'PSI-25',
      'PSI-69',
      'PSI-102',
      'PSI-101',
      'PSI-107',
      'PSI-20',
      'PSI-159',
      'PSI-47',
    ]);
    for (const card of corpus.cards) {
      expect(card.cardState).toBe('metadata_only');
      expect(card.evidenceTier).toBeNull();
      expect(card.fixture).toBe(false);
      expect(card.rowCount).toBe(rowsOf(card.accession).length);
      expect(card.license).toBe('CC0-1.0');
      expect(card.doi).toMatch(/^10\.60555\//);
    }
    const byId = new Map(corpus.cards.map((card) => [card.accession, card]));
    expect(byId.get('PSI-69')?.hardwareFamily).toBe('CIR-MDCA');
    expect(byId.get('PSI-20')?.hardwareFamily).toBe('CIR-ACME');
    expect(byId.get('PSI-25')?.hardwareFamily).toBe('MSG-duct');
    expect(byId.get('PSI-98')?.hardwareFamily).toBe('Cygnus-Saffire');
    expect(byId.get('PSI-102')?.hardwareFamily).toBe('SAME-glovebox');
    expect(byId.get('PSI-69')?.pillarPrimary).toBe('suppression');
    expect(byId.get('PSI-98')?.pillarPrimary).toBe('prevention');
    expect(byId.get('PSI-102')?.pillarPrimary).toBe('detection');
    expect(byId.get('PSI-20')?.pillarPrimary).toBe('fundamental');
  });

  it('records caveats for the known table traps', () => {
    const byId = new Map(corpus.cards.map((card) => [card.accession, card]));
    expect(byId.get('PSI-159')?.caveats).toContain('Burner-stream O2: excluded from cabin overlap.');
    expect(byId.get('PSI-25')?.caveats).toContain(
      'Post-test O2 is a measurement, not a condition.',
    );
    expect(byId.get('PSI-100')?.caveats).toContain('Table reports no O2.');
    expect(byId.get('PSI-99')?.caveats).toContain(
      'Saffire-II 1-g comparison columns are not microgravity conditions.',
    );
  });

  it('keeps sources free of presigned URLs', () => {
    for (const source of corpus.sources) {
      expect(source.url).toBeNull();
      expect(source.license).toBe('CC0-1.0');
    }
    expect(corpus.sources.some((source) => source.kind === 'psi-table')).toBe(true);
    expect(corpus.sources.some((source) => source.kind === 'psi-json')).toBe(true);
  });
});

describe('corpus integrity', () => {
  it('computes the hash over canonical JSON of cards, rows, rejects and records', () => {
    const recomputed = sha256Hex(
      canonicalJson({
        cards: corpus.cards,
        rows: corpus.rows,
        rejects: corpus.rejects,
        records: corpus.records,
      }),
    );
    expect(recomputed).toBe(corpus.corpusHash);
    expect(corpusHashOf(corpus)).toBe(corpus.corpusHash);
  });

  it('is deterministic for the same inputs and build time', () => {
    const again = buildCorpus({ builtAt });
    expect(again.corpus.corpusHash).toBe(corpus.corpusHash);
    expect(JSON.stringify(again.corpus)).toBe(JSON.stringify(corpus));
  });

  it('stays under the 1.5 MB budget', () => {
    expect(Buffer.byteLength(JSON.stringify(corpus), 'utf8')).toBeLessThanOrEqual(1_500_000);
  });

  it('has 11 rejected cells and no accepted evidence records yet', () => {
    expect(corpus.rejects.length).toBe(11);
    expect(result.rejectCounts).toEqual({
      'o2-out-of-range': 2,
      'pressure-nonpositive': 1,
      'flow-negative': 8,
    });
    expect(corpus.records).toEqual([]);
  });

  it('prepares three proposed gold-record candidates for humans', () => {
    expect(result.candidates.candidates.map((candidate) => candidate.id)).toEqual([
      'candidate:PSI-69:18',
      'candidate:PSI-99:0',
      'candidate:PSI-25:0',
    ]);
    for (const candidate of result.candidates.candidates) {
      expect(candidate.review.state).toBe('proposed');
      expect(candidate.review.by).toBeNull();
    }
    const flex = result.candidates.candidates[0];
    expect(flex?.row.fuel.name).toBe('Heptane');
    expect(flex?.row.o2Pct).toEqual({ min: 34, max: 34 });
    expect(flex?.row.pressureKpa).toEqual({ min: 71.87, max: 71.87 });
  });
});
