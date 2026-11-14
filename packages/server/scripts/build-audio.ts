/**
 * pnpm audio:build
 * Pre-renders the landing overview and 4 presets x 4 concerns.
 * With no ELEVENLABS_API_KEY it writes device-voice manifests only.
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { PRESETS, type Concern, type ScenarioId } from '@fire/contracts';
import type { Env } from '../src/env.ts';
import { loadEnvFile } from '../src/env-file.ts';
import { buildNarrationScript, presetScenario } from '../src/core-bridge.ts';
import { renderNarration } from '../src/narration/index.ts';

const repoRoot = new URL('../../../', import.meta.url).pathname;
const outDir = new URL('../../../apps/web/public/audio/', import.meta.url).pathname;
const concerns: Concern[] = ['prevention', 'detection', 'suppression', 'explore'];
const presetIds: Exclude<ScenarioId, 'custom'>[] = ['earth-iss', 'lunar-cabin-example', 'exploration-upper', 'suit'];

const keys = [
  { key: 'landing', landing: true, scenarioId: null as Exclude<ScenarioId, 'custom'> | null, concern: null as Concern | null },
  ...presetIds.flatMap((scenarioId) =>
    concerns.map((concern) => ({
      key: scenarioId + '__' + concern,
      landing: false,
      scenarioId,
      concern,
    })),
  ),
];

const main = async (): Promise<void> => {
  await loadEnvFile(repoRoot + '.env.local');
  await mkdir(outDir, { recursive: true });
  const env = process.env as unknown as Env;
  const live = Boolean(env.ELEVENLABS_API_KEY && env.ELEVENLABS_VOICE_ID);
  let rendered = 0;
  let fallback = 0;

  for (const item of keys) {
    const scenario = item.scenarioId ? presetScenario(item.scenarioId) ?? undefined : undefined;
    const script = item.landing
      ? buildNarrationScript({ scenarioKey: item.key, kind: 'landing', voiceProvider: live ? 'elevenlabs' : 'device' })
      : buildNarrationScript({
          scenarioKey: item.key,
          kind: 'scenario',
          scenario: scenario ?? undefined,
          concern: item.concern ?? 'explore',
          voiceProvider: live ? 'elevenlabs' : 'device',
        });
    try {
      const result = await renderNarration(env, script, {
        skipCache: true,
        audioUrl: live ? '/audio/' + item.key + '.mp3' : null,
      });
      if (live && result.audio) {
        await writeFile(outDir + item.key + '.mp3', result.audio);
        rendered += 1;
      } else if (live) {
        fallback += 1;
      }
      await writeFile(outDir + item.key + '.json', JSON.stringify(result.manifest, null, 2) + '\n', 'utf8');
    } catch {
      await rm(outDir + item.key + '.mp3', { force: true });
      const device = buildNarrationScript({
        scenarioKey: item.key,
        kind: item.landing ? 'landing' : 'scenario',
        scenario,
        concern: item.concern ?? 'explore',
        voiceProvider: 'device',
      });
      const result = await renderNarration({ ...env, ELEVENLABS_API_KEY: undefined }, device, {
        skipCache: true,
        audioUrl: null,
      });
      await writeFile(outDir + item.key + '.json', JSON.stringify(result.manifest, null, 2) + '\n', 'utf8');
      fallback += 1;
    }
  }

  await writeFile(
    outDir + 'index.json',
    JSON.stringify(
      { generatedAt: new Date().toISOString(), voice: live ? 'elevenlabs' : 'device', keys: keys.map((item) => item.key) },
      null,
      2,
    ) + '\n',
    'utf8',
  );
  console.log(
    'audio build: ' +
      keys.length +
      ' manifests, ' +
      rendered +
      ' mp3 files, ' +
      fallback +
      ' device fallbacks. Voice: ' +
      (live ? 'ElevenLabs' : 'device'),
  );
  console.log('Presets available: ' + Object.keys(PRESETS).join(', '));
};

main().catch(() => {
  console.error('audio build failed');
  process.exitCode = 1;
});
