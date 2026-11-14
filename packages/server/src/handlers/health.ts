import type { HealthResponse } from '@fire/contracts';
import { elevenLabsConfigured, geminiConfigured, jevConfigured, type Env } from '../env.ts';
import { json } from '../http.ts';

export const health = async (_req: Request, env: Env): Promise<Response> => {
  const body: HealthResponse = {
    ok: true,
    services: {
      jev: jevConfigured(env),
      gemini: geminiConfigured(env),
      elevenlabs: elevenLabsConfigured(env),
    },
  };
  return json(body);
};
