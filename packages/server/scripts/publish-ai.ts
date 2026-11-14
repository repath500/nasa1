import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { JevJudgementSchema } from '../src/ai/schemas.ts';
import { parseEnvFile } from '../src/env-file.ts';

const root = new URL('../../../', import.meta.url).pathname;

export async function publishRecordings(repoRoot: string): Promise<number> {
  let consent = '';
  try {
    const text = await readFile(join(repoRoot, '.env.local'), 'utf8');
    consent = parseEnvFile(text).MODEL_OUTPUT_REDISTRIBUTION_OK ?? '';
  } catch {
    // A missing local consent file must fail closed.
  }
  if (consent !== '1') {
    throw new Error('Publication refused: read the provider terms and set MODEL_OUTPUT_REDISTRIBUTION_OK=1 in the repo-root .env.local.');
  }

  const inputDir = join(repoRoot, 'cache/model_responses');
  const files = (await readdir(inputDir)).filter((file) => file.endsWith('.json')).sort();
  if (files.length === 0) throw new Error('No recorded model responses found; nothing was published.');
  const judgements = [];
  for (const file of files) {
    const record: unknown = JSON.parse(await readFile(join(inputDir, file), 'utf8'));
    if (typeof record !== 'object' || record === null || !('median' in record) ||
      !('responses' in record) || !Array.isArray(record.responses) || record.responses.length !== 3 ||
      !('requestHash' in record) || typeof record.requestHash !== 'string' || !/^[a-f0-9]{64}$/.test(record.requestHash) ||
      !('corpusHash' in record) || typeof record.corpusHash !== 'string' || !/^[a-f0-9]{64}$/.test(record.corpusHash)) {
      throw new Error(`Invalid recording: ${file}`);
    }
    const parsed = JevJudgementSchema.safeParse(record.median);
    if (!parsed.success || !['jev-live', 'decision-1'].includes(parsed.data.source)) {
      throw new Error(`Recording is not a validated model judgement: ${file}`);
    }
    judgements.push({ ...parsed.data, source: 'cache' as const });
  }
  const destination = join(repoRoot, 'apps/web/public/data/judgements.v1.json');
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, JSON.stringify({ judgements }, null, 2) + '\n');
  return judgements.length;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  publishRecordings(root).then((count) => {
    console.log(`Published ${count} recorded judgements.`);
  }).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Publication failed.');
    process.exitCode = 1;
  });
}
