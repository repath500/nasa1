import type { Concern } from '@fire/contracts';
import { ApiError, json, readJsonBody, readLicenseHeader } from '../http.ts';
import { elevenLabsConfigured, licenseConfigured, type Env } from '../env.ts';
import { NarrateRequestSchema } from '../ai/schemas.ts';
import { buildNarrationScript, parseScenarioKey, presetScenario, type BuiltNarrationScript } from '../core-bridge.ts';
import { renderNarration, type RenderOptions } from '../narration/index.ts';
import { verifyLicenseToken } from '../billing/license.ts';
import { bumpUsage, getKv, readLicenseRecord } from '../kv.ts';

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

  let customer: string | null = null;
  let script: BuiltNarrationScript;
  if (parsed.data.customScenario) {
    if (!licenseConfigured(env)) throw new ApiError(503, 'Licensing not configured');
    const token = readLicenseHeader(req);
    if (!token) throw new ApiError(401, 'Licence required');
    const verified = await verifyLicenseToken(token, env.LICENSE_SECRET ?? '');
    if (!verified.ok) throw new ApiError(401, 'Invalid licence');
    if (verified.payload.plan !== 'researcher' && verified.payload.plan !== 'lab') {
      throw new ApiError(402, 'Live narration requires a Researcher or Lab licence');
    }
    const record = await readLicenseRecord(getKv(env), verified.payload.customer);
    if (record?.status === 'revoked') throw new ApiError(403, 'Licence revoked');
    if (record?.expiresAt && Date.parse(record.expiresAt) <= Date.now()) throw new ApiError(403, 'Licence expired');
    customer = verified.payload.customer;
    const custom = parsed.data.customScenario;
    script = buildNarrationScript({
      scenarioKey: 'custom__' + custom.concern,
      kind: 'scenario',
      scenario: { id: 'custom', label: 'the custom habitat', o2Pct: custom.o2Pct, totalKpa: custom.totalKpa },
      concern: custom.concern,
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
        voiceProvider: elevenLabsConfigured(env) ? 'elevenlabs' : 'device',
      });
    }
  }

  const rendered = await renderNarration(env, script, options);
  if (customer) {
    const seconds = rendered.manifest.segments.reduce((max, segment) => Math.max(max, segment.endSec ?? 0), 0);
    const minutes = Math.max(1, Math.ceil(seconds / 60));
    await bumpUsage(getKv(env), customer, 'audioMinutes', minutes);
  }
  return json(rendered.manifest);
};
