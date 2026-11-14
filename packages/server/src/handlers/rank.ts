import { ApiError, json, readJsonBody } from '../http.ts';
import { RankRequestSchema } from '../ai/schemas.ts';
import { rankWithLadder, type LadderOptions } from '../ai/ladder.ts';
import type { Env } from '../env.ts';

export const rank = async (req: Request, env: Env, options?: LadderOptions): Promise<Response> => {
  const body = await readJsonBody(req);
  const parsed = RankRequestSchema.safeParse(body);
  if (!parsed.success) throw new ApiError(400, 'Invalid rank request');
  const result = await rankWithLadder(env, parsed.data, options);
  return json(result);
};
