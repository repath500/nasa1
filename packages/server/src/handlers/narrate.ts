import { PRESETS } from '@fire/contracts';
import type { Concern } from '@fire/contracts';
import { ApiError, json, readJsonBody } from '../http.ts';
import { elevenLabsConfigured, type Env } from '../env.ts';
import { NarrateRequestSchema } from '../ai/schemas.ts';
import { computeNarrationFacts, loadCorpusFromOrigin } from '../narration/facts.ts';
import { buildNarrationScript, parseScenarioKey, presetScenario, type BuiltNarrationScript } from '../core-bridge.ts';
import { renderNarration, type RenderOptions } from '../narration/index.ts';

const PRESET_CONCERNS: Concern[] = ['prevention', 'detection', 'suppression', 'explore'];

export const isAllowedScenarioKey = (scenarioKey: string): boolean => {
  if (scenarioKey === 'landing') return true;
  const parsed = parseScenarioKey(scenarioKey);
  if (!parsed || parsed.id === 'custom') return false;
  return PRESET_CONCERNS.includes(parsed.concern) && presetScenario(parsed.id) !== null;
};

export const narrate = async (req: Request, env: Env, options?: RenderOptions): Promise<Response> => {
  const body = await readJsonBody(req);
  const parsed = NarrateRequestSchema.safeParse(body);
  if (!parsed.success) throw new ApiError(400, 'Invalid narration request');

  let script: BuiltNarrationScript;
  if (parsed.data.customScenario) {
    const custom = parsed.data.customScenario;
    const customScenario = { id: 'custom' as const, label: 'the custom habitat', o2Pct: custom.o2Pct, totalKpa: custom.totalKpa };
    const corpus = await loadCorpusFromOrigin(env.PUBLIC_ORIGIN);
    script = buildNarrationScript({
      scenarioKey: 'custom__' + custom.concern,
      kind: 'scenario',
      scenario: customScenario,
      concern: custom.concern,
      facts: corpus ? computeNarrationFacts(corpus, { ...customScenario, sourceNote: 'Set by the user', isExample: true }, custom.concern) : undefined,
      voiceProvider: elevenLabsConfigured(env) ? 'elevenlabs' : 'device',
    });
  } else {
    const scenarioKey = parsed.data.scenarioKey ?? '';
    if (!isAllowedScenarioKey(scenarioKey)) throw new ApiError(400, 'Unknown scenario key');
    if (scenarioKey === 'landing') {
      script = buildNarrationScript({
        scenarioKey,
        kind: 'landing',
        voiceProvider: elevenLabsConfigured(env) ? 'elevenlabs' : 'device',
      });
    } else {
      const parsedKey = parseScenarioKey(scenarioKey);
      const scenario = parsedKey ? presetScenario(parsedKey.id) : null;
      if (!parsedKey || !scenario) throw new ApiError(400, 'Unknown scenario key');
      script = buildNarrationScript({
        scenarioKey,
        kind: 'scenario',
        scenario,
        concern: parsedKey.concern,
        facts: await loadCorpusFromOrigin(env.PUBLIC_ORIGIN).then((corpus) =>
          corpus && parsedKey.id !== 'custom' ? computeNarrationFacts(corpus, PRESETS[parsedKey.id], parsedKey.concern) : undefined),
        voiceProvider: elevenLabsConfigured(env) ? 'elevenlabs' : 'device',
      });
    }
  }

  // Custom air is free to narrate; the router's per-IP rate limit bounds voice costs.
  const rendered = await renderNarration(env, script, options);
  return json(rendered.manifest);
};
