import type { AskResponse, PipelineStep } from '@fire/contracts';
import { ApiError, json, readJsonBody } from '../http.ts';
import { geminiConfigured, type Env } from '../env.ts';
import { AskRequestSchema } from '../ai/schemas.ts';
import { askWithHydrogen, parseKeywords } from '../ai/hydrogen.ts';
import type { ModelCallOptions } from '../ai/hydrogen.ts';

export const ask = async (req: Request, env: Env, options?: ModelCallOptions): Promise<Response> => {
  const body = await readJsonBody(req);
  const parsed = AskRequestSchema.safeParse(body);
  if (!parsed.success) throw new ApiError(400, 'Invalid question');
  const question = parsed.data.question;
  const trace: PipelineStep[] = [];

  if (geminiConfigured(env)) {
    try {
      const result = await askWithHydrogen(env, question, options);
      trace.push({
        actor: 'HYDROGEN',
        message: 'parsed filters with a JSON schema, tools disabled',
        ms: result.ms,
        modelId: result.modelId,
      });
      trace.push({
        actor: 'CODE',
        message: 'filters ready; row matching runs against the loaded corpus',
        ms: 0,
        modelId: null,
      });
      const response: AskResponse = { filters: result.filters, trace, source: 'hydrogen' };
      return json(response);
    } catch {
      trace.push({
        actor: 'HYDROGEN',
        message: 'not available, keyword parser used',
        ms: 0,
        modelId: null,
      });
    }
  }

  const started = Date.now();
  const filters = parseKeywords(question);
  trace.push({
    actor: 'PARSER',
    message: 'parsed filters with the offline keyword parser',
    ms: Date.now() - started,
    modelId: null,
  });
  trace.push({
    actor: 'CODE',
    message: 'filters ready; row matching runs against the loaded corpus',
    ms: 0,
    modelId: null,
  });
  const response: AskResponse = { filters, trace, source: 'keyword-parser' };
  return json(response);
};
