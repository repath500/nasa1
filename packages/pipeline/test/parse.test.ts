import { describe, expect, it } from 'vitest';
import type { ColumnMap, NumericSpec } from '../src/index.ts';
import {
  flowToCmS,
  parseFuelName,
  parseMdyDate,
  parseNumericCell,
  parseSize,
  pressureToKpa,
} from '../src/index.ts';

const o2Percent: NumericSpec = { column: 'O2', unit: 'percent' };
const o2Fraction: NumericSpec = { column: 'O2', unit: 'fraction' };
const pressureMmHg: NumericSpec = { column: 'P', unit: 'mmHg' };
const flowCms: NumericSpec = { column: 'F', unit: 'cm/s' };

describe('O2 cell parser', () => {
  it('parses an approximate value', () => {
    const cell = parseNumericCell('~ 21.5', o2Percent, 'o2');
    expect(cell.reject).toBeNull();
    expect(cell.approx).toBe(true);
    expect(cell.range).toEqual({ min: 21.5, max: 21.5 });
  });

  it('parses a range', () => {
    const cell = parseNumericCell('21.5 - 21.7', o2Percent, 'o2');
    expect(cell.reject).toBeNull();
    expect(cell.range).toEqual({ min: 21.5, max: 21.7 });
  });

  it('parses a range written with "to"', () => {
    const cell = parseNumericCell('22.1 to 22.0', o2Percent, 'o2');
    expect(cell.range).toEqual({ min: 22, max: 22.1 });
  });

  it('parses a multi-value cell to min and max', () => {
    const cell = parseNumericCell('21; 26.5; 40', o2Percent, 'o2');
    expect(cell.reject).toBeNull();
    expect(cell.range).toEqual({ min: 21, max: 40 });
  });

  it('converts a mole fraction to percent', () => {
    const cell = parseNumericCell('0.34', o2Fraction, 'o2');
    expect(cell.range).toEqual({ min: 34, max: 34 });
  });

  it('rejects O2 above 100 percent', () => {
    const cell = parseNumericCell('3400%', o2Percent, 'o2');
    expect(cell.reject?.reason).toBe('o2-out-of-range');
    expect(cell.range).toEqual({ min: null, max: null });
    expect(parseNumericCell('2100%', o2Percent, 'o2').reject?.reason).toBe('o2-out-of-range');
  });

  it('treats missing tokens as unknown, not zero', () => {
    const cell = parseNumericCell('n/a', o2Percent, 'o2');
    expect(cell.reject).toBeNull();
    expect(cell.range).toEqual({ min: null, max: null });
  });

  it('rejects an unparseable O2 cell', () => {
    const cell = parseNumericCell('twenty one', o2Percent, 'o2');
    expect(cell.reject?.reason).toBe('unparseable');
    expect(cell.range).toEqual({ min: null, max: null });
  });
});

describe('pressure and flow cell parser', () => {
  it('converts mmHg to kPa', () => {
    const cell = parseNumericCell('760', pressureMmHg, 'pressure');
    expect(cell.range.min).toBeCloseTo(101.32, 2);
    expect(cell.range.max).toBeCloseTo(101.32, 2);
  });

  it('converts a unit inside the cell', () => {
    const atm = parseNumericCell('1 atm', pressureMmHg, 'pressure');
    expect(atm.range.min).toBeCloseTo(101.325, 1);
    const psi = parseNumericCell('14.7 psi', pressureMmHg, 'pressure');
    expect(psi.range.min).toBeCloseTo(101.35, 1);
    const bar = parseNumericCell('1 bar', pressureMmHg, 'pressure');
    expect(bar.range.min).toBe(100);
  });

  it('rejects non-positive pressure', () => {
    const cell = parseNumericCell('0', pressureMmHg, 'pressure');
    expect(cell.reject?.reason).toBe('pressure-nonpositive');
    expect(cell.range).toEqual({ min: null, max: null });
  });

  it('parses flow with a unit inside the cell', () => {
    const cell = parseNumericCell('20 cm/s', flowCms, 'flow');
    expect(cell.range).toEqual({ min: 20, max: 20 });
  });

  it('rejects negative flow', () => {
    const cell = parseNumericCell('-5.92', flowCms, 'flow');
    expect(cell.reject?.reason).toBe('flow-negative');
    expect(cell.range).toEqual({ min: null, max: null });
  });

  it('converts flow units', () => {
    expect(flowToCmS(100, 'mm/s')).toBe(10);
    expect(flowToCmS(1, 'm/s')).toBe(100);
    expect(pressureToKpa(1, 'atm')).toBeCloseTo(101.325, 6);
  });
});

describe('dates, names and sizes', () => {
  it('parses two-digit and four-digit years', () => {
    expect(parseMdyDate('3/5/2009')).toBe('2009-03-05');
    expect(parseMdyDate('10/24/09')).toBe('2009-10-24');
  });

  it('returns null for broken dates', () => {
    expect(parseMdyDate('6/29/`12')).toBeNull();
    expect(parseMdyDate('5/15/2103')).toBeNull();
    expect(parseMdyDate('21-Jul')).toBeNull();
  });

  it('strips a note after a colon in a fuel name', () => {
    const name = parseFuelName(
      { Material: 'Kapton: same conditions as 1-4' },
      { fuelName: 'Material', fuelNameTransform: 'before-colon' } as unknown as ColumnMap,
    );
    expect(name).toBe('Kapton');
  });

  it('keeps units from headers or values in a size string', () => {
    const size = parseSize(
      { 'Sample Thickness (cm)': '0.37', 'Sample Length (cm)': '40.6', 'Sample Width (cm)': '94' },
      { kind: 'saffire-dims', columns: ['Sample Thickness (cm)', 'Sample Length (cm)', 'Sample Width (cm)'] },
    );
    expect(size).toBe('0.37 x 40.6 x 94 cm');
    const mixed = parseSize(
      { 'Samle Thickness': '0.27 mm', 'Sample Length': '29 cm', 'Sample Width (cm)': '5 cm' },
      { kind: 'saffire-dims', columns: ['Samle Thickness', 'Sample Length', 'Sample Width (cm)'] },
    );
    expect(mixed).toBe('0.27 mm x 29 cm x 5 cm');
  });
});
