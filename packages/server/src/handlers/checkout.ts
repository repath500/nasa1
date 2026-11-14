import { ApiError, json, readJsonBody } from '../http.ts';
import { stripeConfigured, type Env } from '../env.ts';
import { CheckoutRequestSchema } from '../ai/schemas.ts';
import { classifyStripeError, createCheckoutSession, type CheckoutOptions } from '../billing/stripe.ts';

export const checkout = async (req: Request, env: Env, options?: CheckoutOptions): Promise<Response> => {
  if (!stripeConfigured(env)) throw new ApiError(503, 'Billing not configured');
  const body = await readJsonBody(req);
  const parsed = CheckoutRequestSchema.safeParse(body);
  if (!parsed.success) throw new ApiError(400, 'Invalid checkout request');
  try {
    const session = await createCheckoutSession(env, parsed.data, options);
    return json({ url: session.url });
  } catch (error) {
    return classifyStripeError(error);
  }
};
