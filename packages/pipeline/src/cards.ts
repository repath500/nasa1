import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  FuelPhase,
  Gravity,
  HardwareFamily,
  InvestigationCard,
  Pillar,
  TestRow,
} from '@fire/contracts';
import type { ColumnMap } from './maps/types.ts';

export interface InvestigationJson {
  accession?: string;
  sourceLink?: string;
  investigationAcronym?: string;
  title?: string;
  objective?: string;
  doi?: string;
  licenseIdentifier?: string;
  version?: number | string;
  modifiedDate?: string;
  experimentHardwareLink?: string;
  publications?: unknown[];
}

const HARDWARE: Record<string, HardwareFamily> = {
  'PSI-98': 'Cygnus-Saffire',
  'PSI-99': 'Cygnus-Saffire',
  'PSI-100': 'Cygnus-Saffire',
  'PSI-26': 'MSG-duct',
  'PSI-25': 'MSG-duct',
  'PSI-69': 'CIR-MDCA',
  'PSI-102': 'SAME-glovebox',
  'PSI-101': 'SAME-glovebox',
  'PSI-107': 'MSG-duct',
  'PSI-20': 'CIR-ACME',
  'PSI-159': 'CIR-MDCA',
  'PSI-47': 'SAME-glovebox',
};

const PILLAR: Record<string, Pillar> = {
  'PSI-98': 'prevention',
  'PSI-99': 'prevention',
  'PSI-100': 'prevention',
  'PSI-26': 'prevention',
  'PSI-25': 'prevention',
  'PSI-69': 'suppression',
  'PSI-102': 'detection',
  'PSI-101': 'detection',
  'PSI-107': 'fundamental',
  'PSI-20': 'fundamental',
  'PSI-159': 'fundamental',
  'PSI-47': 'detection',
};

const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

export function hardwareFamilyFor(accession: string): HardwareFamily {
  return HARDWARE[accession] ?? 'unknown';
}

export function pillarFor(accession: string): Pillar {
  return PILLAR[accession] ?? 'unknown';
}

export function psiModifiedToIso(raw: string | undefined): string | null {
  if (!raw) return null;
  const match = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec(raw.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = MONTHS[(match[2] ?? '').toLowerCase()];
  const year = Number(match[3]);
  if (!month || !Number.isInteger(day) || !Number.isInteger(year)) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function firstUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  for (const part of raw.split(',')) {
    const value = part.trim();
    if (/^https?:\/\//.test(value)) return value;
  }
  return null;
}

export function readInvestigationJson(psiJsonDir: string, accession: string): InvestigationJson {
  const path = join(psiJsonDir, `${accession}.json`);
  return JSON.parse(readFileSync(path, 'utf8')) as InvestigationJson;
}

function unique<T>(values: T[]): T[] {
  const seen = new Set<T>();
  const out: T[] = [];
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

export interface TableFileInfo {
  fileName: string;
  sha12: string;
  bytes: number;
}

export function buildCard(input: {
  accession: string;
  meta: InvestigationJson;
  rows: TestRow[];
  tables: TableFileInfo[];
  maps: ColumnMap[];
}): InvestigationCard {
  const { accession, meta, rows, tables, maps } = input;
  const fuelPhases: FuelPhase[] = unique(rows.map((row) => row.fuel.phase));
  const gravityRegimes: Gravity[] = unique(rows.map((row) => row.gravity));
  const caveats = unique(maps.flatMap((map) => map.caveats));
  return {
    accession,
    acronym: (meta.investigationAcronym ?? accession).trim(),
    title: (meta.title ?? '').trim(),
    doi: meta.doi && meta.doi.trim() !== '' ? meta.doi.trim() : null,
    license: (meta.licenseIdentifier ?? 'CC0-1.0').trim(),
    objective: (meta.objective ?? '').trim(),
    hardwareFamily: hardwareFamilyFor(accession),
    pillarPrimary: pillarFor(accession),
    pillarSecondary: null,
    evidenceTier: null,
    evidenceTierRule: null,
    fuelPhases: fuelPhases.length > 0 ? fuelPhases : ['unknown'],
    gravityRegimes: gravityRegimes.length > 0 ? gravityRegimes : ['unknown'],
    psiVersion: meta.version === undefined ? null : String(meta.version),
    psiModified: psiModifiedToIso(meta.modifiedDate),
    tableFiles: tables,
    paperIds: [],
    equipmentLink: firstUrl(meta.experimentHardwareLink),
    caveats,
    cardState: 'metadata_only',
    rowCount: rows.length,
    fixture: false,
  };
}
