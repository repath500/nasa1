import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { buildCorpus } from './corpus.ts';
import { repoRoot } from './paths.ts';

const MAX_CORPUS_BYTES = 1_500_000;

function writeJson(path: string, value: unknown): number {
  mkdirSync(dirname(path), { recursive: true });
  const text = `${JSON.stringify(value)}\n`;
  writeFileSync(path, text, 'utf8');
  return Buffer.byteLength(text, 'utf8');
}

function main(): void {
  const root = repoRoot();
  const result = buildCorpus({ rootDir: root });
  const { corpus } = result;

  const dataDir = resolve(root, 'data');
  const webDataDir = resolve(root, 'apps/web/public/data');
  const corpusPath = join(dataDir, 'corpus.v1.json');
  const webCorpusPath = join(webDataDir, 'corpus.v1.json');

  for (const gate of ['k5', 'd5']) {
    const publishedPath = join(webDataDir, 'reviews', `${gate}.json`);
    if (!existsSync(publishedPath)) continue;
    let valid = false;
    try {
      const attestation = JSON.parse(readFileSync(publishedPath, 'utf8')) as { corpusHash?: string };
      valid = attestation.corpusHash === corpus.corpusHash;
    } catch {
      valid = false;
    }
    if (!valid) {
      unlinkSync(publishedPath);
      console.warn(`WARNING: removed stale or invalid published ${gate.toUpperCase()} gate; human review is required.`);
    }
  }

  const corpusBytes = writeJson(corpusPath, corpus);
  const webCorpusBytes = writeJson(webCorpusPath, corpus);
  writeJson(join(dataDir, 'manifest.json'), result.manifest);
  mkdirSync(join(dataDir, 'reviews'), { recursive: true });
  writeFileSync(join(dataDir, 'rejects.report.md'), result.rejectReport, 'utf8');
  writeJson(join(dataDir, 'reviews/candidates.json'), result.candidates);

  if (corpusBytes > MAX_CORPUS_BYTES) {
    throw new Error(`corpus.v1.json is ${corpusBytes} bytes, over the ${MAX_CORPUS_BYTES} byte budget`);
  }

  const totalRows = corpus.rows.length;
  const totalRejects = corpus.rejects.length;
  process.stdout.write(`Corpus v1 written\n`);
  process.stdout.write(`  rows: ${totalRows}\n`);
  process.stdout.write(`  rejects: ${totalRejects}\n`);
  process.stdout.write(`  cards: ${corpus.cards.length}\n`);
  process.stdout.write(`  hash: ${corpus.corpusHash}\n`);
  process.stdout.write(`  bytes: ${corpusBytes} (web copy ${webCorpusBytes})\n`);
  for (const [accession, count] of Object.entries(result.rowCounts)) {
    process.stdout.write(`  ${accession}: ${count} rows\n`);
  }
  for (const [reason, count] of Object.entries(result.rejectCounts)) {
    process.stdout.write(`  reject ${reason}: ${count}\n`);
  }
}

main();
