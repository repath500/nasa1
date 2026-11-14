/**
 * `pnpm ai:record`: record real Jev judgements for every core study x preset x concern, three calls each.
 *
 * Writes one file per (study, scenario, concern) to cache/model_responses/ (gitignored), in the exact format
 * `pnpm ai:publish` validates: the three raw judgements, their median, model id, date, latency, request hash and
 * corpus hash. Nothing is committed and nothing is shown in the app until the team runs ai:publish after reading the
 * provider terms (rule R8). Without TYPESAFE_API_KEY it exits without changing anything.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Concern, JevJudgement } from '@fire/contracts';
import { canonicalJson, sha256Hex } from '@fire/core';
import type { Env } from '../src/env.ts';
import { parseEnvFile } from '../src/env-file.ts';
import { JEV_MODEL, judgeWithJev, medianJudgements, type JudgeContext, type JudgeOptions } from '../src/ai/jev.ts';
import { RUBRIC_VERSION } from '../src/ai/ladder.ts';
import { CORE_STUDIES } from '../src/ai/studies.ts';
import { presetScenario } from '../src/core-bridge.ts';
import { UpstreamError } from '../src/ai/upstream.ts';

const PRESET_IDS = ['earth-iss', 'lunar-cabin-example', 'exploration-upper', 'suit'] as const;
const CONCERNS: Concern[] = ['prevention', 'detection', 'suppression'];
const REPEATS = 3;

export interface RecordOptions {
  repoRoot: string;
  env: Env;
  maxCalls: number;
  judge?: (env: Env, ctx: JudgeContext, options?: JudgeOptions) => Promise<JevJudgement>;
  sleep?: (ms: number) => Promise<void>;
  log?: (line: string) => void;
  now?: () => number;
}

export interface RecordSummary { written: number; skipped: number; calls: number; stoppedAtCap: boolean; meanLatencyMs: number | null }

/** Retries 429 (rate limit) and 529 (overloaded) with exponential backoff; other errors propagate. */
async function withBackoff<T>(fn: () => Promise<T>, sleep: (ms: number) => Promise<void>, log: (line: string) => void): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const status = error instanceof UpstreamError ? error.status : null;
      if ((status === 429 || status === 529) && attempt < 4) {
        const wait = 1000 * 2 ** attempt;
        log(`  provider busy (${status}); retrying in ${wait / 1000}s`);
        await sleep(wait);
        continue;
      }
      throw error;
    }
  }
}

export async function recordJudgements(options: RecordOptions): Promise<RecordSummary> {
  const judge = options.judge ?? judgeWithJev;
  const sleep = options.sleep ?? ((ms) => new Promise((done) => setTimeout(done, ms)));
  const log = options.log ?? console.log;
  const now = options.now ?? Date.now;
  if (!options.env.TYPESAFE_API_KEY) throw new Error('TYPESAFE_API_KEY is not set in the repo-root .env.local; nothing was recorded.');

  const corpus = JSON.parse(await readFile(join(options.repoRoot, 'data/corpus.v1.json'), 'utf8')) as { corpusHash: string };
  const outDir = join(options.repoRoot, 'cache/model_responses');
  await mkdir(outDir, { recursive: true });

  const summary: RecordSummary = { written: 0, skipped: 0, calls: 0, stoppedAtCap: false, meanLatencyMs: null };
  const latencies: number[] = [];
  for (const scenarioId of PRESET_IDS) {
    const scenario = presetScenario(scenarioId);
    if (!scenario) continue;
    for (const concern of CONCERNS) {
      for (const study of CORE_STUDIES) {
        const requestHash = sha256Hex(canonicalJson({ model: JEV_MODEL, rubric: RUBRIC_VERSION, corpusHash: corpus.corpusHash, accession: study.accession, scenarioId, concern }));
        const file = join(outDir, `${requestHash}.json`);
        if (existsSync(file)) { summary.skipped++; continue; }
        if (summary.calls + REPEATS > options.maxCalls) { summary.stoppedAtCap = true; break; }
        const ctx: JudgeContext = { study, scenario, concern };
        const responses: JevJudgement[] = [];
        const started = now();
        for (let i = 0; i < REPEATS; i++) {
          responses.push(await withBackoff(() => judge(options.env, ctx), sleep, log));
          summary.calls++;
        }
        const latencyMs = Math.round((now() - started) / REPEATS);
        latencies.push(latencyMs);
        const record = {
          provider: 'typesafe', modelId: JEV_MODEL, rubricVersion: RUBRIC_VERSION, recordedAt: new Date().toISOString(),
          requestHash, corpusHash: corpus.corpusHash, accession: study.accession, scenarioId, concern,
          latencyMs, responses, median: medianJudgements(responses),
        };
        await writeFile(file, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
        summary.written++;
        log(`  ${scenarioId} / ${concern} / ${study.acronym}: recorded (${latencyMs} ms per call)`);
      }
      if (summary.stoppedAtCap) break;
    }
    if (summary.stoppedAtCap) break;
  }
  summary.meanLatencyMs = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : null;
  return summary;
}

async function main() {
  const repoRoot = new URL('../../../', import.meta.url).pathname;
  let fileEnv: Record<string, string> = {};
  try { fileEnv = parseEnvFile(await readFile(join(repoRoot, '.env.local'), 'utf8')); } catch { /* no local env file */ }
  const env = { ...process.env, ...fileEnv } as unknown as Env;
  const maxCalls = Number(fileEnv.AI_RECORD_MAX_CALLS ?? process.env.AI_RECORD_MAX_CALLS ?? 400);
  console.log(`Recording ${JEV_MODEL}: ${CORE_STUDIES.length} studies x ${PRESET_IDS.length} presets x ${CONCERNS.length} concerns x ${REPEATS} calls (cap ${maxCalls} calls).`);
  console.log('Jev input pricing is about $0.042 per million tokens; a full run is roughly 360 calls of ~1.5k tokens (well under $0.05).');
  const summary = await recordJudgements({ repoRoot, env, maxCalls });
  console.log(`\nDone: ${summary.written} written, ${summary.skipped} already recorded, ${summary.calls} calls, mean ${summary.meanLatencyMs ?? 'n/a'} ms per call${summary.stoppedAtCap ? ', stopped at the call cap' : ''}.`);
  console.log('Recordings are in cache/model_responses/ (gitignored). Publish only after reading the provider terms: pnpm ai:publish');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error: Error) => { console.error(error.message); process.exit(1); });
}

