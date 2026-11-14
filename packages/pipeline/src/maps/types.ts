import type { FuelPhase, Gravity, OxygenLocation } from '@fire/contracts';

export type NumericUnit =
  | 'percent'
  | 'fraction'
  | 'mmHg'
  | 'atm'
  | 'psi'
  | 'bar'
  | 'kPa'
  | 'cm/s'
  | 'mm/s'
  | 'm/s';

export interface NumericSpec {
  column: string;
  unit: NumericUnit;
  /** Set when the table's own note calls the values approximate. */
  approxDefault?: boolean;
}

export type SizeKind = 'flex-droplet' | 'saffire-dims' | 'nozzle' | 'burner' | 'none';

export interface SizeSpec {
  kind: SizeKind;
  columns?: string[];
}

export type DateFormat = 'mdy' | 'bre' | 'none';

export interface DateSpec {
  format: DateFormat;
  columns: string[];
}

export type RowFilter = 'any' | 'saffire' | 'bass';

export interface ColumnMap {
  accession: string;
  fileName: string;
  sha256: string;
  sha12: string;
  fuelPhase: FuelPhase;
  gravity: Gravity;
  o2Location: OxygenLocation;
  rowFilter: RowFilter;
  testLabel?: { column: string; prefix?: string };
  date?: DateSpec;
  fuelName: string;
  fuelNameTransform?: 'before-colon';
  size: SizeSpec;
  o2?: NumericSpec;
  o2Final?: NumericSpec;
  pressure?: NumericSpec;
  flow?: NumericSpec;
  caveats: string[];
}
