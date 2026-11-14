import type { LicenseInfo } from '@fire/contracts';
import { ApiError, json, readJsonBody, readLicenseHeader } from '../http.ts';
import { stripeConfigured, type Env } from '../env.ts';
import { PlanForToken, LicenseClaimSchema } from '../ai/schemas.ts';
import {
  classifyStripeError,
  retrieveCheckoutSession,
  retrieveSubscriptionEnd,
  type StripeCallOptions,
} from '../billing/stripe.ts';
import { newNonce, signLicenseToken, verifyLicenseToken } from '../billing/license.ts';
import { getKv, readLicenseRecord, readUsage, writeLicenseRecord } from '../kv.ts';

export const licenseClaim = async (req: Request, env: Env, options?: StripeCallOptions): Promise<Response> => {
  if (!stripeConfigured(env)) throw new ApiError(503, 'Billing not configured');
  const body = await readJsonBody(req);
  const parsed = LicenseClaimSchema.safeParse(body);
  if (!parsed.success) throw new ApiError(400, 'Invalid session id');
  try {
    const session = await retrieveCheckoutSession(env, parsed.data.sessionId, options);
    if (session.status !== 'complete') throw new ApiError(409, 'Checkout is not complete');
    if (session.paymentStatus !== 'paid' && session.paymentStatus !== 'no_payment_required') {
      throw new ApiError(409, 'Checkout is not paid');
    }
    const customer = session.customer;
    if (!customer) throw new ApiError(409, 'Checkout has no customer');
    const purchased = session.plan;
    if (purchased !== 'researcher' && purchased !== 'lab' && purchased !== 'support') {
      throw new ApiError(400, 'Checkout has no plan');
    }
    const plan = purchased === 'support' ? 'explorer' : PlanForToken(purchased);
    let expiresAtSec: number;
    if (session.subscription) {
      try {
        const subscription = await retrieveSubscriptionEnd(env, session.subscription, options);
        expiresAtSec = subscription.currentPeriodEnd ?? Math.floor(Date.now() / 1000) + 40 * 86400;
      } catch {
        expiresAtSec = Math.floor(Date.now() / 1000) + 40 * 86400;
      }
    } else {
      expiresAtSec = Math.floor(Date.now() / 1000) + 365 * 86400;
    }
    const token = await signLicenseToken(
      { plan, customer, exp: expiresAtSec, nonce: newNonce() },
      env.LICENSE_SECRET ?? '',
    );
    const expiresAt = new Date(expiresAtSec * 1000).toISOString();
    await writeLicenseRecord(getKv(env), {
      customer,
      plan,
      status: 'active',
      expiresAt,
      updatedAt: new Date().toISOString(),
    });
    return json({ token, plan, expiresAt });
  } catch (error) {
    return classifyStripeError(error);
  }
};

export const licenseInfo = async (req: Request, env: Env): Promise<Response> => {
  if (!stripeConfigured(env)) throw new ApiError(503, 'Billing not configured');
  const token = readLicenseHeader(req);
  if (!token) throw new ApiError(401, 'Licence required');
  const verified = await verifyLicenseToken(token, env.LICENSE_SECRET ?? '', Math.floor(Date.now() / 1000), true);
  if (!verified.ok) throw new ApiError(401, 'Invalid licence');
  const { payload } = verified;
  const kv = getKv(env);
  const record = await readLicenseRecord(kv, payload.customer);
  const usage = await readUsage(kv, payload.customer);
  const expired =
    payload.exp <= Math.floor(Date.now() / 1000) ||
    (record?.expiresAt ? Date.parse(record.expiresAt) <= Date.now() : false);
  const status: LicenseInfo['status'] = record?.status === 'revoked' ? 'revoked' : expired ? 'expired' : 'active';
  const info: LicenseInfo = {
    plan: payload.plan,
    status,
    expiresAt: record?.expiresAt ?? new Date(payload.exp * 1000).toISOString(),
    usage: { audioMinutes: usage.audioMinutes, askCalls: usage.askCalls },
  };
  return json(info);
};
