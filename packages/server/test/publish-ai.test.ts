import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { publishRecordings } from '../scripts/publish-ai.ts';

it('refuses publication without explicit consent in the local file', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'fire-publish-'));
  try {
    await writeFile(join(directory, '.env.local'), 'MODEL_OUTPUT_REDISTRIBUTION_OK=0\n');
    await expect(publishRecordings(directory)).rejects.toThrow('Publication refused');
    await expect(readFile(join(directory, 'apps/web/public/data/judgements.v1.json'))).rejects.toThrow();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
