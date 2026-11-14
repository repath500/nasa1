import { ApiError, json, readRawBody } from '../http.ts';
import { stripeConfigured, type Env } from '../env.ts';
import { verifyStripeSignature, type StripeCallOptions } from '../billing/stripe.ts';
import { processStripeEvent } from '../billing/webhook.ts';
import { getKv } from '../kv.ts';

export const stripeWebhook = async (req: Request, env: Env, options?: StripeCallOptions): Promise<Response> => {
  if (!stripeConfigured(env) || !env.STRIPE_WEBHOOK_SECRET) throw new ApiError(503, 'Billing not configured');
  const raw = await readRawBody(req);
  const valid = await verifyStripeSignature(
    req.headers.get('stripe-signature'),
    raw,
    env.STRIPE_WEBHOOK_SECRET,
    Math.floor(Date.now() / 1000),
  );
  if (!valid) throw new ApiError(400, 'Invalid signature');
  let event: unknown;
  try {
    event = JSON.parse(raw) as unknown;
  } catch {
    throw new ApiError(400, 'Invalid event');
  }
  const result = await processStripeEvent(env, getKv(env), event, options);
  return json({ received: true, result });
};
