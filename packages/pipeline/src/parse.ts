import type {
  FuelPhase,
  Gravity,
  OxygenLocation,
  Range,
  RejectedCell,
  TestRow,
} from '@fire/contracts';
import type { ColumnMap, DateSpec, NumericSpec, SizeSpec } from './maps/types.ts';
import type { RawTable } from './read.ts';
import { parseCsv, recordFromRow } from './read.ts';

export type NumericKind = 'o2' | 'o2-final' | 'pressure' | 'flow';

export interface CellReject {
  reason: RejectedCell['reason'];
  note: string;
}

export interface CellParse {
  range: Range;
  approx: boolean;
  reject: CellReject | null;
  /** Discrete values when the cell is a ";" list (never treated as a continuous range). */
  values?: number[];
}

export interface ParsedTableFile {
  rows: TestRow[];
  rejects: RejectedCell[];
}

const NULL_RANGE: Range = { min: null, max: null };

const MISSING_TOKENS = new Set([
  '',
  '-',
  '--',
  '—',
  '–',
  '~',
  'n/a',
  'na',
  'none',
  'null',
  'unknown',
  'not reported',
  'not identified',
  'insignificant',
  'see fig',
  'see fig.',
  'see fig. 5',
  'see fig 5',
  'tbd',
]);

function isMissingValue(value: string): boolean {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, ' ');
  return MISSING_TOKENS.has(normalized);
}

export function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function pressureToKpa(value: number, unit: string): number {
  switch (unit) {
    case 'mmHg':
      return value * 0.133322;
    case 'atm':
      return value * 101.325;
    case 'psi':
      return value * 6.894757;
    case 'bar':
      return value * 100;
    case 'kPa':
      return value;
    default:
      return value;
  }
}

export function flowToCmS(value: number, unit: string): number {
  switch (unit) {
    case 'cm/s':
      return value;
    case 'mm/s':
      return value / 10;
    case 'm/s':
      return value * 100;
    default:
      return value;
  }
}

function normalizeUnit(raw: string): string {
  const compact = raw.toLowerCase().replace(/\s+/g, '');
  if (compact === 'mmhg') return 'mmHg';
  if (compact === 'atm') return 'atm';
  if (compact === 'psi') return 'psi';
  if (compact === 'bar') return 'bar';
  if (compact === 'kpa') return 'kPa';
  if (compact === 'pa') return 'Pa';
  if (compact === 'cm/s') return 'cm/s';
  if (compact === 'mm/s') return 'mm/s';
  if (compact === 'm/s') return 'm/s';
  return raw;
}

interface UnitDetection {
  unit: string;
  before: string;
  after: string;
}

function detectUnit(text: string, kind: NumericKind): UnitDetection | null {
  if (kind === 'pressure') {
    const match = /(mm\s*hg|atm|psi|bar|kpa|pa)\b/i.exec(text);
    if (match) {
      return {
        unit: normalizeUnit(match[0]),
        before: text.slice(0, match.index),
        after: text.slice(match.index + match[0].length),
      };
    }
    return null;
  }
  if (kind === 'flow') {
    const match = /(cm\s*\/\s*s|mm\s*\/\s*s|m\s*\/\s*s)\b/i.exec(text);
    if (match) {
      return {
        unit: normalizeUnit(match[0]),
        before: text.slice(0, match.index),
        after: text.slice(match.index + match[0].length),
      };
    }
    return null;
  }
  const percent = text.indexOf('%');
  if (percent >= 0) {
    return {
      unit: 'percent',
      before: text.slice(0, percent),
      after: text.slice(percent + 1),
    };
  }
  return null;
}

function stripApprox(text: string): { text: string; approx: boolean } {
  const match = /^\s*(?:~|~=|approx\.?|approximately)\s*/i.exec(text);
  if (!match) return { text: text.trim(), approx: false };
  return { text: text.slice(match[0].length).trim(), approx: true };
}

function parseScalarToken(token: string): number[] | null {
  const cleaned = token.trim().replace(/^or\s+/i, '').replace(/\.$/, '').trim();
  if (cleaned === '') return null;
  const rangeMatch = /^(-?\d+(?:\.\d+)?)\s*(?:-|to)\s*(-?\d+(?:\.\d+)?)$/i.exec(cleaned);
  if (rangeMatch) {
    const a = Number(rangeMatch[1]);
    const b = Number(rangeMatch[2]);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    return [a, b];
  }
  if (!/^[+-]?\d+(?:\.\d+)?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  return [value];
}

/**
 * Parse a numeric table cell: `~ 21.5`, `21.5 - 21.7`, `22.1 to 22.0`,
 * `21; 26.5; 40`, `20 cm/s`, `1 atm`. Ranges become min/max. Rejects are
 * returned with a reason; the caller nulls the field and keeps the row.
 */
export function parseNumericCell(rawValue: string, spec: NumericSpec, kind: NumericKind): CellParse {
  const raw = rawValue ?? '';
  if (isMissingValue(raw)) return { range: { ...NULL_RANGE }, approx: false, reject: null };

  const approxStripped = stripApprox(raw);
  let text = approxStripped.text;
  let unit = spec.unit as string;
  const detected = detectUnit(text, kind);
  if (detected) {
    unit = detected.unit;
    text = `${detected.before} ${detected.after}`.trim();
  }
  text = text.replace(/[–—]/g, '-');
  if (text === '' || isMissingValue(text)) {
    return { range: { ...NULL_RANGE }, approx: approxStripped.approx, reject: null };
  }

  const tokens = text.split(';').map((t) => t.trim()).filter((t) => t !== '');
  const values: number[] = [];
  for (const token of tokens) {
    const parsed = parseScalarToken(token);
    if (parsed === null) {
      return {
        range: { ...NULL_RANGE },
        approx: approxStripped.approx,
        reject: {
          reason: 'unparseable',
          note: `Could not parse ${kind} cell as a number, range or list`,
        },
      };
    }
    values.push(...parsed);
  }
  if (values.length === 0) {
    return { range: { ...NULL_RANGE }, approx: approxStripped.approx, reject: null };
  }

  if (kind === 'o2' || kind === 'o2-final') {
    const percentValues = values.map((v) => (unit === 'fraction' ? v * 100 : v));
    const bad = percentValues.find((v) => v < 0 || v > 100);
    if (bad !== undefined) {
      return {
        range: { ...NULL_RANGE },
        approx: approxStripped.approx,
        reject: {
          reason: 'o2-out-of-range',
          note: `O2 must be 0 to 100 percent by volume, got ${bad}`,
        },
      };
    }
    const parsedO2 = rangeFrom(percentValues, approxStripped.approx || (spec.approxDefault ?? false), 2);
    // A ';' list is a set of discrete tested values, not a continuous range: keep the set for overlap.
    if (tokens.length > 1) parsedO2.values = percentValues.map((v) => roundTo(v, 2));
    return parsedO2;
  }

  if (kind === 'pressure') {
    const kpaValues = values.map((v) => pressureToKpa(v, unit));
    const bad = kpaValues.find((v) => v <= 0);
    if (bad !== undefined) {
      return {
        range: { ...NULL_RANGE },
        approx: false,
        reject: {
          reason: 'pressure-nonpositive',
          note: `Pressure must be greater than 0 kPa, got ${bad}`,
        },
      };
    }
    return rangeFrom(kpaValues, spec.approxDefault ?? false, 2);
  }

  const flowValues = values.map((v) => flowToCmS(v, unit));
  const bad = flowValues.find((v) => v < 0);
  if (bad !== undefined) {
    return {
      range: { ...NULL_RANGE },
      approx: false,
      reject: {
        reason: 'flow-negative',
        note: `Flow must not be negative, got ${bad} cm/s`,
      },
    };
  }
  return rangeFrom(flowValues, spec.approxDefault ?? false, 2);
}

function rangeFrom(values: number[], approx: boolean, digits: number): CellParse {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return {
    range: { min: roundTo(min, digits), max: roundTo(max, digits) },
    approx,
    reject: null,
  };
}

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function isoDate(year: number, month: number, day: number): string | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (year < 2000 || year > 2030) return null;
  if (month < 1 || month > 12) return null;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > daysInMonth) return null;
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export function parseMdyDate(raw: string): string | null {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(raw.trim());
  if (!match) return null;
  const month = Number(match[1]);
  const day = Number(match[2]);
  let year = Number(match[3]);
  if (match[3] !== undefined && match[3].length === 2) year += 2000;
  return isoDate(year, month, day);
}

export function parseBreDate(yearRaw: string, monthRaw: string, dayRaw: string): string | null {
  const year = Number(yearRaw.trim());
  const month = MONTHS[monthRaw.trim().toLowerCase()];
  const day = Number(dayRaw.trim());
  if (month === undefined) return null;
  return isoDate(year, month, day);
}

export function parseTestDate(record: Record<string, string>, spec: DateSpec | undefined): string | null {
  if (!spec || spec.format === 'none') return null;
  if (spec.format === 'mdy') {
    const column = spec.columns[0];
    if (!column) return null;
    return parseMdyDate(record[column] ?? '');
  }
  if (spec.format === 'bre') {
    const [yearCol, monthCol, dayCol] = spec.columns;
    if (!yearCol || !monthCol || !dayCol) return null;
    return parseBreDate(record[yearCol] ?? '', record[monthCol] ?? '', record[dayCol] ?? '');
  }
  return null;
}

function cleanName(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function parseFuelName(
  record: Record<string, string>,
  map: ColumnMap,
): string | null {
  const value = record[map.fuelName] ?? '';
  let name = cleanName(value);
  if (name === '') return null;
  if (map.fuelNameTransform === 'before-colon') {
    name = name.split(':')[0]?.trim() ?? name;
  }
  return name === '' ? null : name;
}

function unitFromHeader(header: string): string {
  const match = /\(([^)]+)\)/.exec(header);
  if (!match || match[1] === undefined) return '';
  return match[1].trim();
}

function valueHasUnit(value: string): boolean {
  return /(?:^|\s)(?:mm|cm|m)\b/i.test(value);
}

export function parseSize(record: Record<string, string>, spec: SizeSpec): string | null {
  if (!spec || spec.kind === 'none') return null;
  if (spec.kind === 'flex-droplet') {
    const column = spec.columns?.[0];
    const value = column ? (record[column] ?? '').trim() : '';
    if (value === '' || isMissingValue(value)) return null;
    return valueHasUnit(value) ? value : `${value} mm`;
  }
  if (spec.kind === 'nozzle' || spec.kind === 'burner') {
    const column = spec.columns?.[0];
    const value = column ? (record[column] ?? '').trim() : '';
    if (value === '' || isMissingValue(value)) return null;
    return valueHasUnit(value) ? value : `${value} mm`;
  }
  const columns = spec.columns ?? [];
  const values = columns.map((c) => (record[c] ?? '').trim()).filter((v) => v !== '' && !isMissingValue(v));
  if (values.length === 0) return null;
  const join = values.join(' x ');
  if (values.some(valueHasUnit)) return join;
  const units = new Set(columns.map(unitFromHeader).filter((u) => u !== ''));
  if (units.size === 1) {
    const unit = [...units][0];
    return `${join} ${unit}`;
  }
  return join;
}

function geometryFor(spec: SizeSpec): string | null {
  if (spec.kind === 'flex-droplet') return 'droplet';
  if (spec.kind === 'saffire-dims') return 'flat sheet';
  if (spec.kind === 'nozzle' || spec.kind === 'burner') return 'burner flame';
  return null;
}

function testLabelFor(record: Record<string, string>, map: ColumnMap): string | null {
  if (!map.testLabel) return null;
  const value = cleanName(record[map.testLabel.column] ?? '');
  if (value === '') return null;
  return `${map.testLabel.prefix ?? ''}${value}`;
}

function passesRowFilter(record: Record<string, string>, map: ColumnMap): boolean {
  if (map.rowFilter === 'saffire') {
    const label = record['Sample Number'] ?? '';
    return /^(?:S\d+|\d+-\d+)$/.test(label.trim());
  }
  if (map.rowFilter === 'bass') {
    return (record['As Run Test #'] ?? '').trim() !== '';
  }
  return Object.values(record).some((v) => v.trim() !== '');
}

export interface ParseFileOptions {
  rowIndexOffset?: number;
  accession?: string;
}

export function parseTableFile(
  table: RawTable,
  map: ColumnMap,
  options: ParseFileOptions = {},
): ParsedTableFile {
  const rawRows = parseCsv(table.text);
  const headerRow = rawRows[0] ?? [];
  const headers = headerRow.map((header) => header.trim());
  const records = rawRows.slice(1);
  const rows: TestRow[] = [];
  const rejects: RejectedCell[] = [];
  const accession = options.accession ?? map.accession;
  const offset = options.rowIndexOffset ?? 0;

  for (let i = 0; i < records.length; i += 1) {
    const record = recordFromRow(headers, records[i] ?? []);
    const isEmpty = Object.values(record).every((value) => value.trim() === '');
    if (isEmpty) continue;
    if (!passesRowFilter(record, map)) continue;

    const rowIndex = offset + i;
    const rowRejects: RejectedCell[] = [];

    const parseField = (
      spec: NumericSpec | undefined,
      kind: NumericKind,
    ): { range: Range; approx: boolean; values?: number[] } => {
      if (!spec) return { range: { ...NULL_RANGE }, approx: false };
      const cell = parseNumericCell(record[spec.column] ?? '', spec, kind);
      if (cell.reject) {
        rowRejects.push({
          accession,
          rowIndex,
          column: spec.column,
          rawValue: record[spec.column] ?? '',
          reason: cell.reject.reason,
          note: cell.reject.note,
          csvSha12: table.sha12,
        });
      }
      return { range: cell.range, approx: cell.approx, values: cell.values };
    };

    const o2 = parseField(map.o2, 'o2');
    const finalO2 = parseField(map.o2Final, 'o2-final');
    const pressure = parseField(map.pressure, 'pressure');
    const flow = parseField(map.flow, 'flow');

    const raw: Record<string, string> = {};
    for (const header of headers) {
      if (header === '') continue;
      const value = record[header] ?? '';
      if (value.trim() !== '') raw[header] = value;
    }

    const fuelPhase: FuelPhase = map.fuelPhase;
    const gravity: Gravity = map.gravity;
    const o2Location: OxygenLocation = map.o2Location;

    rows.push({
      id: `${accession}:${rowIndex}`,
      accession,
      rowIndex,
      testLabel: testLabelFor(record, map),
      date: parseTestDate(record, map.date),
      fuel: {
        name: parseFuelName(record, map),
        phase: fuelPhase,
        geometry: geometryFor(map.size),
        size: parseSize(record, map.size),
      },
      o2Pct: o2.range,
      ...(o2.values ? { o2ValuesPct: o2.values } : {}),
      o2Location,
      o2Approx: o2.approx,
      o2FinalPct: finalO2.range.min,
      pressureKpa: pressure.range,
      flowCmS: flow.range,
      gravity,
      raw,
      csvSha12: table.sha12,
      fixture: false,
    });

    rejects.push(...rowRejects);
  }

  return { rows, rejects };
}
