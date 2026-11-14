import { ApiError, json, readLicenseHeader } from '../http.ts';
import { stripeConfigured, type Env } from '../env.ts';
import { classifyStripeError, createPortalSession, type CheckoutOptions } from '../billing/stripe.ts';
import { verifyLicenseToken } from '../billing/license.ts';
import { getKv, readLicenseRecord } from '../kv.ts';

export const portal = async (req: Request, env: Env, options?: CheckoutOptions): Promise<Response> => {
  if (!stripeConfigured(env)) throw new ApiError(503, 'Billing not configured');
  const token = readLicenseHeader(req);
  if (!token) throw new ApiError(401, 'Licence required');
  const verified = await verifyLicenseToken(token, env.LICENSE_SECRET ?? '');
  if (!verified.ok) throw new ApiError(401, 'Invalid licence');
  const record = await readLicenseRecord(getKv(env), verified.payload.customer);
  if (record?.status === 'revoked') throw new ApiError(403, 'Licence revoked');
  try {
    const session = await createPortalSession(env, verified.payload.customer, options);
    return json({ url: session.url });
  } catch (error) {
    return classifyStripeError(error);
  }
};
