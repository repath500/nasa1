/**
 * Human review tooling (SPEC §10.4, BUILD_PLAN §2.4, OV-1 B3).
 *
 * Agents never sign. Every name in these files is typed by a person at the prompt.
 * - Gold records (G1): a candidate becomes accepted only when TWO different people accept it, nobody rejected it,
 *   and code re-verified it against the raw CSV bytes at review time.
 * - Gates (K5, D5): a person reads exactly what is being attested and types "go" or "no-go". The gate file is bound
 *   to the corpus hash (and the rubric hash for D5), so a rebuilt corpus invalidates it.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { DEFAULT_PRIORITY, DEFAULT_TOLERANCES, PRESETS, type Corpus, type EvidenceRecord } from '@fire/contracts';
import { canonicalJson, gapStatement, overlap, sha256Hex as coreSha256 } from '@fire/core';
import type { CandidateFile, CandidateRecord } from './corpus.ts';
import { psiTablesDir, repoRoot } from './paths.ts';
import { readCsv, readTable, recordFromRow } from './read.ts';

export type Ask = (question: string) => Promise<string>;
export type Say = (line: string) => void;

export interface ReviewEntry { name: string; decision: 'accept' | 'reject'; note: string; at: string }
export interface ReviewLog { version: 'v1'; reviews: Record<string, ReviewEntry[]> }
export interface Verification { passed: boolean; problems: string[] }

export interface GateFile {
  gate: 'k5' | 'd5';
  decision: 'go' | 'no-go';
  /** Present only for "go": the web app treats a non-empty approver as signed. */
  approver?: string;
  signedBy: string;
  at: string;
  corpusHash: string;
  rubricHash: string | null;
  recordIds: string[];
  attested: string[];
}

export interface Paths { root: string; reviewsDir: string; webReviewsDir: string; corpus: string; candidates: string; log: string }

export function defaultPaths(root = repoRoot()): Paths {
  const reviewsDir = resolve(root, 'data/reviews');
  return {
    root,
    reviewsDir,
    webReviewsDir: resolve(root, 'apps/web/public/data/reviews'),
    corpus: resolve(root, 'data/corpus.v1.json'),
    candidates: join(reviewsDir, 'candidates.json'),
    log: join(reviewsDir, 'records.json'),
  };
}

const readJson = <T>(path: string, fallback: T): T => (existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as T) : fallback);
const writeJson = (path: string, value: unknown) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); };

export const loadLog = (paths: Paths): ReviewLog => readJson<ReviewLog>(paths.log, { version: 'v1', reviews: {} });

/** Re-read the source CSV and confirm the candidate's file hash and every raw cell, now. */
export function verifyCandidate(candidate: CandidateRecord, tablesDir = psiTablesDir()): Verification {
  const problems: string[] = [];
  const path = join(tablesDir, candidate.tableFile);
  if (!candidate.tableFile || !existsSync(path)) return { passed: false, problems: [`Source table not found: ${candidate.tableFile || '(none)'}`] };
  const table = readTable(path, candidate.tableFile);
  if (table.sha12 !== candidate.csvSha12) problems.push(`File hash changed: expected ${candidate.csvSha12}, found ${table.sha12}`);
  const csv = readCsv(table.text);
  // The pipeline may offset rowIndex for a second table of the same accession; locate the row by its raw cells.
  const expected = candidate.row.raw;
  const match = csv.records.map((cells) => recordFromRow(csv.headers, cells)).find((record) =>
    Object.entries(expected).every(([header, value]) => (record[header] ?? '') === value));
  if (!match) problems.push('No row in the source CSV has exactly these raw cells.');
  return { passed: problems.length === 0, problems };
}

export function statusOf(entries: ReviewEntry[] = []): { state: 'accepted' | 'rejected' | 'needs-second' | 'unreviewed'; acceptors: string[] } {
  if (entries.some((entry) => entry.decision === 'reject')) return { state: 'rejected', acceptors: [] };
  const acceptors = [...new Set(entries.filter((entry) => entry.decision === 'accept').map((entry) => entry.name.trim().toLowerCase()))];
  const names = [...new Set(entries.filter((entry) => entry.decision === 'accept').map((entry) => entry.name.trim()))];
  if (acceptors.length >= 2) return { state: 'accepted', acceptors: names };
  return { state: acceptors.length === 1 ? 'needs-second' : 'unreviewed', acceptors: names };
}

/** Accepted, verifier-passing candidates as corpus evidence records (table rows only in v1). */
export function acceptedRecords(candidates: CandidateRecord[], log: ReviewLog, tablesDir = psiTablesDir()): EvidenceRecord[] {
  const out: EvidenceRecord[] = [];
  for (const candidate of candidates) {
    const entries = log.reviews[candidate.id] ?? [];
    const status = statusOf(entries);
    if (status.state !== 'accepted' || !verifyCandidate(candidate, tablesDir).passed) continue;
    const latest = entries.map((entry) => entry.at).sort().at(-1) ?? null;
    out.push({
      id: `R-${candidate.row.id.replace(/[^A-Z0-9]+/gi, '-').toUpperCase()}-${String(candidate.row.rowIndex).padStart(3, '0')}`,
      accession: candidate.accession,
      sourceId: candidate.sourceId,
      origin: 'table_row',
      evidenceKind: 'table_row',
      locator: { ...candidate.locator },
      quote: null,
      paraphrase: null,
      limitations: ['Microgravity (ISS) result. Partial-gravity combustion data: none in PSI.'],
      review: { state: 'accepted', by: status.acceptors, at: latest, notes: entries.map((entry) => entry.note).filter(Boolean).join(' | ') || null },
    });
  }
  return out;
}

const DECISIONS = new Set(['a', 'accept', 'r', 'reject', 's', 'skip']);

async function askName(ask: Ask, say: Say): Promise<string> {
  for (;;) {
    const name = (await ask('Your full name (typed by you, recorded as the reviewer): ')).trim();
    if (name.length >= 2) return name;
    say('A name is required. Agents and scripts never fill this in.');
  }
}

/** Interactive G1 review. One session = one reviewer. */
export async function runReview(ask: Ask, say: Say, paths = defaultPaths(), tablesDir = psiTablesDir(), now = () => new Date().toISOString()): Promise<ReviewLog> {
  const file = readJson<CandidateFile | null>(paths.candidates, null);
  if (!file) { say('No candidates. Run `pnpm corpus` first.'); return loadLog(paths); }
  const log = loadLog(paths);
  const name = await askName(ask, say);
  say(`\nReviewing as "${name}". Each record needs two different reviewers. Answer a (accept), r (reject) or s (skip).\n`);
  for (const candidate of file.candidates) {
    const entries = log.reviews[candidate.id] ?? [];
    const status = statusOf(entries);
    if (status.state === 'accepted' || status.state === 'rejected') { say(`${candidate.id}: already ${status.state}.`); continue; }
    if (entries.some((entry) => entry.name.trim().toLowerCase() === name.toLowerCase())) { say(`${candidate.id}: you already reviewed this; it needs a different second reviewer.`); continue; }
    const check = verifyCandidate(candidate, tablesDir);
    const row = candidate.row;
    say('─'.repeat(72));
    say(`${candidate.id}   ${candidate.tableFile}   data row ${candidate.rowIndex}   sha256 ${candidate.csvSha12}…`);
    say(`Why proposed: ${candidate.review.notes}`);
    say('Raw cells exactly as in the CSV:');
    for (const [header, value] of Object.entries(row.raw)) say(`   ${header.padEnd(46)} ${value}`);
    say(`Parsed by code: fuel ${row.fuel.name ?? 'unknown'} (${row.fuel.phase}); O2 ${row.o2Pct.min ?? 'not reported'}${row.o2Pct.max !== row.o2Pct.min ? `-${row.o2Pct.max}` : ''}% (${row.o2Location}); pressure ${row.pressureKpa.min ?? 'not reported'} kPa; flow ${row.flowCmS.min ?? 'not reported'} cm/s; ${row.gravity}`);
    say(`Code check against the CSV file now: ${check.passed ? 'PASS' : `FAIL: ${check.problems.join('; ')}`}`);
    if (entries.length) say(`Already accepted by: ${status.acceptors.join(', ')}`);
    if (!check.passed) { say('Cannot be accepted while the code check fails. Skipping.'); continue; }
    say('Check: is O2 the initial AMBIENT chamber value? Are the units right? Does the parsed line match the raw cells?');
    let decision = '';
    while (!DECISIONS.has(decision)) decision = (await ask('Decision [a/r/s]: ')).trim().toLowerCase();
    if (decision.startsWith('s')) continue;
    const note = (await ask('Note (optional, what you checked): ')).trim();
    log.reviews[candidate.id] = [...entries, { name, decision: decision.startsWith('a') ? 'accept' : 'reject', note, at: now() }];
    writeJson(paths.log, log);
    say(`Recorded. Status: ${statusOf(log.reviews[candidate.id]).state}.`);
  }
  say('\nDone. Run `pnpm corpus` to rebuild with accepted records, then sign gates with `pnpm review:sign k5` / `d5`.');
  return log;
}

export const rubricHash = () => coreSha256(canonicalJson({ priority: DEFAULT_PRIORITY, tolerances: DEFAULT_TOLERANCES }));

/** What a K5 or D5 signature attests, computed by code from the current corpus. */
export function attestationFor(gate: 'k5' | 'd5', corpus: Corpus): { lines: string[]; recordIds: string[]; ready: boolean; reason: string | null } {
  if (gate === 'd5') {
    return {
      lines: [
        `Baseline ranking priority order: ${DEFAULT_PRIORITY.join(' > ')}`,
        `Tolerances: O2 ±${DEFAULT_TOLERANCES.o2PctPoints} percentage points, pressure ±${DEFAULT_TOLERANCES.pressureFrac * 100}%, flow factor ${DEFAULT_TOLERANCES.flowFactor} (displayed only)`,
        'No composite score and no weights are used. These are scientific judgements made by the team.',
      ],
      recordIds: [],
      ready: true,
      reason: null,
    };
  }
  const lunar = PRESETS['lunar-cabin-example'];
  const inBand = corpus.records.filter((record) => {
    if (record.review.state !== 'accepted' || (record.review.by?.length ?? 0) < 2 || record.locator.kind !== 'csv-row') return false;
    const row = corpus.rows.find((r) => r.accession === record.accession && r.rowIndex === record.locator.rowIndex && r.csvSha12 === record.locator.csvSha12);
    return !!row && row.o2Location === 'ambient' && overlap(row, lunar, DEFAULT_TOLERANCES) === 'covers';
  });
  const gap = gapStatement(corpus.rows, corpus.cards, lunar, DEFAULT_TOLERANCES, { k5SignedOff: true });
  const lines = [
    `Corpus ${corpus.corpusHash.slice(0, 12)}…: ${corpus.rows.length} rows, ${gap.counts.rowsNear} inside the Moon-base example box (code-computed).`,
    `Accepted, two-reviewer records with initial ambient O2 inside the box: ${inBand.length ? inBand.map((record) => record.id).join(', ') : 'none'}`,
    `Headline that will be shown: ${gap.sentence ?? '(none)'}`,
    `Scope line shown beneath it: ${gap.scopeLine ?? '(none)'}`,
    'By signing "go" you confirm the O2 in these records is initial ambient chamber O2 and the pressures are initial conditions.',
  ];
  return {
    lines,
    recordIds: inBand.map((record) => record.id),
    ready: inBand.length > 0,
    reason: inBand.length ? null : 'K5 needs at least one accepted (two-reviewer) record inside the Moon-base box. Review the K5 candidates first, then run `pnpm corpus`.',
  };
}

export async function runSign(gate: 'k5' | 'd5', ask: Ask, say: Say, paths = defaultPaths(), now = () => new Date().toISOString()): Promise<GateFile | null> {
  if (!existsSync(paths.corpus)) { say('No corpus. Run `pnpm corpus` first.'); return null; }
  const corpus = JSON.parse(readFileSync(paths.corpus, 'utf8')) as Corpus;
  const attestation = attestationFor(gate, corpus);
  say(`\nGate ${gate.toUpperCase()}: you are attesting to the following.\n`);
  for (const line of attestation.lines) say(`  • ${line}`);
  if (!attestation.ready) { say(`\nNot ready: ${attestation.reason}`); return null; }
  const name = await askName(ask, say);
  let decision = '';
  while (decision !== 'go' && decision !== 'no-go') decision = (await ask('Type "go" or "no-go": ')).trim().toLowerCase();
  const file: GateFile = {
    gate,
    decision: decision as 'go' | 'no-go',
    ...(decision === 'go' ? { approver: name } : {}),
    signedBy: name,
    at: now(),
    corpusHash: corpus.corpusHash,
    rubricHash: gate === 'd5' ? rubricHash() : null,
    recordIds: attestation.recordIds,
    attested: attestation.lines,
  };
  writeJson(join(paths.reviewsDir, `${gate}.json`), file);
  writeJson(join(paths.webReviewsDir, `${gate}.json`), file);
  say(`\nWritten data/reviews/${gate}.json and published it to the web app (${decision}). Commit both files.`);
  return file;
}
