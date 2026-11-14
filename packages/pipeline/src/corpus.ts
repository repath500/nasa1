import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  Corpus,
  EvidenceRecord,
  InvestigationCard,
  RejectedCell,
  TestRow,
} from '@fire/contracts';
import { DEFAULT_TOLERANCES, PRESETS } from '@fire/contracts';
import { overlap } from '@fire/core';
import { buildCard, firstUrl, readInvestigationJson } from './cards.ts';
import { corpusHashOf } from './canonical.ts';
import { CORE_ACCESSIONS, TABLE_MAPS } from './maps/index.ts';
import type { ColumnMap } from './maps/types.ts';
import { parseTableFile } from './parse.ts';
import { psiJsonDir, psiTablesDir, repoRoot } from './paths.ts';
import { parseCsv, readTable, sha12Of, sha256Hex } from './read.ts';

export interface ManifestEntry {
  accession: string;
  kind: 'psi-table' | 'psi-json';
  file: string;
  sha256: string;
  bytes: number;
}

export interface Manifest {
  version: 'v1';
  generatedAt: string;
  corpusHash: string;
  sources: ManifestEntry[];
}

export interface CandidateRecord {
  id: string;
  accession: string;
  rowIndex: number;
  csvSha12: string;
  tableFile: string;
  sourceId: string;
  locator: {
    kind: 'csv-row';
    page: null;
    rowIndex: number;
    csvSha12: string;
  };
  row: TestRow;
  review: {
    state: 'proposed';
    by: null;
    at: null;
    notes: string;
  };
}

export interface CandidateFile {
  version: 'v1';
  generatedAt: string;
  corpusHash: string;
  note: string;
  candidates: CandidateRecord[];
}

export interface BuildResult {
  corpus: Corpus;
  manifest: Manifest;
  rejectReport: string;
  candidates: CandidateFile;
  rowCounts: Record<string, number>;
  rejectCounts: Record<string, number>;
}

export interface BuildOptions {
  rootDir?: string;
  /** Human-accepted, verifier-passing records (from data/reviews/records.json via review.ts). */
  acceptedRecords?: EvidenceRecord[];
  builtAt?: string;
}

const REJECT_ORDER: RejectedCell['reason'][] = [
  'o2-out-of-range',
  'pressure-nonpositive',
  'flow-negative',
  'unparseable',
  'post-test-not-condition',
  'other',
];

export function buildCorpus(options: BuildOptions = {}): BuildResult {
  const root = options.rootDir ?? repoRoot();
  const builtAt = options.builtAt ?? new Date().toISOString();
  const tablesDir = psiTablesDir(root);
  const jsonDir = psiJsonDir(root);

  const rowsByAccession = new Map<string, TestRow[]>();
  const rejectsByAccession = new Map<string, RejectedCell[]>();
  const tablesByAccession = new Map<string, { fileName: string; sha12: string; bytes: number }[]>();
  const mapsByAccession = new Map<string, ColumnMap[]>();
  const manifestSources: ManifestEntry[] = [];
  const offsets = new Map<string, number>();

  for (const map of TABLE_MAPS) {
    const path = join(tablesDir, map.fileName);
    const table = readTable(path, map.fileName);
    if (table.sha256 !== map.sha256) {
      throw new Error(
        `Hash mismatch for ${map.fileName}: expected ${map.sha256}, got ${table.sha256}`,
      );
    }
    const offset = offsets.get(map.accession) ?? 0;
    const parsed = parseTableFile(table, map, { rowIndexOffset: offset });
    const physicalDataRows = Math.max(0, parseCsv(table.text).length - 1);
    offsets.set(map.accession, offset + physicalDataRows);

    rowsByAccession.set(map.accession, [...(rowsByAccession.get(map.accession) ?? []), ...parsed.rows]);
    rejectsByAccession.set(map.accession, [
      ...(rejectsByAccession.get(map.accession) ?? []),
      ...parsed.rejects,
    ]);
    tablesByAccession.set(map.accession, [
      ...(tablesByAccession.get(map.accession) ?? []),
      { fileName: map.fileName, sha12: table.sha12, bytes: table.byteLength },
    ]);
    mapsByAccession.set(map.accession, [...(mapsByAccession.get(map.accession) ?? []), map]);

    manifestSources.push({
      accession: map.accession,
      kind: 'psi-table',
      file: `research/flame/samples/psi_tables/${map.fileName}`,
      sha256: table.sha256,
      bytes: table.byteLength,
    });
  }

  const cards: InvestigationCard[] = [];
  const rows: TestRow[] = [];
  const rejects: RejectedCell[] = [];
  const rowCounts: Record<string, number> = {};
  const sources: Corpus['sources'] = [];

  for (const accession of CORE_ACCESSIONS) {
    const accessionRows = (rowsByAccession.get(accession) ?? []).sort((a, b) => a.rowIndex - b.rowIndex);
    const accessionRejects = (rejectsByAccession.get(accession) ?? []).sort((a, b) => a.rowIndex - b.rowIndex);
    const tables = tablesByAccession.get(accession) ?? [];
    const maps = mapsByAccession.get(accession) ?? [];
    const meta = readInvestigationJson(jsonDir, accession);
    const jsonBytes = readFileSync(join(jsonDir, `${accession}.json`));
    const jsonSha12 = sha12Of(jsonBytes);
    const jsonSha256 = sha256Hex(jsonBytes);

    const card = buildCard({ accession, meta, rows: accessionRows, tables, maps });
    cards.push(card);
    rows.push(...accessionRows);
    rejects.push(...accessionRejects);
    rowCounts[accession] = accessionRows.length;

    for (const table of tables) {
      sources.push({
        id: `psi-table:${table.fileName}`,
        kind: 'psi-table',
        title: table.fileName,
        license: card.license,
        url: null,
        sha12: table.sha12,
      });
    }
    sources.push({
      id: `psi-json:${accession}`,
      kind: 'psi-json',
      title: `${accession} ${card.acronym} investigation record`,
      license: card.license,
      url: firstUrl(meta.sourceLink),
      sha12: jsonSha12,
    });
    manifestSources.push({
      accession,
      kind: 'psi-json',
      file: `research/flame/samples/psi_json/${accession}.json`,
      sha256: jsonSha256,
      bytes: jsonBytes.length,
    });
  }

  const records: EvidenceRecord[] = [...(options.acceptedRecords ?? [])];
  // A card becomes gold only with at least one accepted record reviewed by two different people (R4, G1).
  for (const card of cards) {
    if (records.some((record) => record.accession === card.accession && record.review.state === 'accepted' && (record.review.by?.length ?? 0) >= 2)) {
      card.cardState = 'gold';
    }
  }
  const corpusHash = corpusHashOf({ cards, rows, rejects, records });
  const corpus: Corpus = {
    version: 'v1',
    builtAt,
    corpusHash,
    fixture: false,
    cards,
    rows,
    rejects,
    records,
    sources,
  };

  const rejectCounts: Record<string, number> = {};
  for (const reject of rejects) {
    rejectCounts[reject.reason] = (rejectCounts[reject.reason] ?? 0) + 1;
  }

  const manifest: Manifest = {
    version: 'v1',
    generatedAt: builtAt,
    corpusHash,
    sources: manifestSources,
  };

  return {
    corpus,
    manifest,
    rejectReport: renderRejectReport(corpus, rejectCounts),
    candidates: buildCandidates(corpus, rows, tablesByAccession, builtAt),
    rowCounts,
    rejectCounts,
  };
}

function renderRejectReport(corpus: Corpus, counts: Record<string, number>): string {
  const total = corpus.rejects.length;
  const lines: string[] = [];
  lines.push('# Fire Atlas corpus reject ledger');
  lines.push('');
  lines.push(`Generated: ${corpus.builtAt}`);
  lines.push(`Corpus hash: \`${corpus.corpusHash}\``);
  lines.push(`Rejected cells: ${total}`);
  lines.push('');
  lines.push('## Counts by reason');
  lines.push('');
  lines.push('| Reason | Count |');
  lines.push('| --- | ---: |');
  for (const reason of REJECT_ORDER) {
    const count = counts[reason] ?? 0;
    if (count === 0) continue;
    lines.push(`| ${reason} | ${count} |`);
  }
  lines.push('');
  lines.push('## Cells');
  lines.push('');
  lines.push('| Accession | Row index | Column | Raw value | Reason | Note |');
  lines.push('| --- | ---: | --- | --- | --- | --- |');
  for (const reject of corpus.rejects) {
    lines.push(
      `| ${reject.accession} | ${reject.rowIndex} | ${escapeCell(reject.column)} | ${escapeCell(
        reject.rawValue,
      )} | ${reject.reason} | ${escapeCell(reject.note)} |`,
    );
  }
  lines.push('');
  return lines.join('\n');
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function buildCandidates(
  corpus: Corpus,
  rows: TestRow[],
  tablesByAccession: Map<string, { fileName: string; sha12: string; bytes: number }[]>,
  generatedAt: string,
): CandidateFile {
  const wanted: { accession: string; rowIndex: number; notes: string }[] = [
    {
      accession: 'PSI-69',
      rowIndex: 18,
      notes:
        'FLEX test #19: heptane droplet at 539.1 mmHg and O2 mole fraction 0.34 (34 percent). Proposed for double coding.',
    },
    {
      accession: 'PSI-99',
      rowIndex: 0,
      notes:
        'Saffire-II test 2-1: silicone at 20 cm/s and approximately 21.5 percent O2. Proposed for double coding.',
    },
    {
      accession: 'PSI-25',
      rowIndex: 0,
      notes:
        'BASS-II test B1: PMMA film with calibrated initial O2 22.2 percent. Post-test O2 is kept separate. Proposed for double coding.',
    },
  ];

  // K5 needs records inside the Moon-base example box: propose the first two ambient rows that code finds there.
  const lunar = PRESETS['lunar-cabin-example'];
  for (const row of rows.filter((r) => r.o2Location === 'ambient' && overlap(r, lunar, DEFAULT_TOLERANCES) === 'covers').slice(0, 2)) {
    if (wanted.some((w) => w.accession === row.accession && w.rowIndex === row.rowIndex)) continue;
    wanted.push({
      accession: row.accession,
      rowIndex: row.rowIndex,
      notes: `K5 candidate: ${row.testLabel ?? row.id}, ${row.fuel.name ?? 'fuel'} at ${row.o2Pct.min}% O2 and ${row.pressureKpa.min} kPa, inside the Moon-base example box. Check that O2 is initial ambient chamber O2.`,
    });
  }

  const candidates: CandidateRecord[] = [];
  for (const want of wanted) {
    const row = rows.find((r) => r.accession === want.accession && r.rowIndex === want.rowIndex);
    if (!row) {
      throw new Error(`Candidate row not found: ${want.accession}:${want.rowIndex}`);
    }
    const table = (tablesByAccession.get(want.accession) ?? []).find((t) => t.sha12 === row.csvSha12);
    candidates.push({
      id: `candidate:${row.id}`,
      accession: row.accession,
      rowIndex: row.rowIndex,
      csvSha12: row.csvSha12,
      tableFile: table?.fileName ?? '',
      sourceId: `psi-table:${table?.fileName ?? ''}`,
      locator: {
        kind: 'csv-row',
        page: null,
        rowIndex: row.rowIndex,
        csvSha12: row.csvSha12,
      },
      row,
      review: { state: 'proposed', by: null, at: null, notes: want.notes },
    });
  }

  return {
    version: 'v1',
    generatedAt,
    corpusHash: corpus.corpusHash,
    note:
      'Gold-record candidates prepared by code for human double coding. review.by is human only. No record is accepted until a human signs off.',
    candidates,
  };
}
