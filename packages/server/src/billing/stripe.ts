import type { CheckoutRequest } from '@fire/contracts';
import { apiBase, publicOrigin, type Env } from '../env.ts';
import { ApiError, hexToBytes, hmacVerify } from '../http.ts';
import { UpstreamError, upstreamJson } from '../ai/upstream.ts';
import {
  StripeCheckoutResponseSchema,
  StripePortalResponseSchema,
  StripeSessionSchema,
  StripeSubscriptionSchema,
} from '../ai/schemas.ts';

export const STRIPE_BASE = 'https://api.stripe.com';
export const STRIPE_TOLERANCE_SEC = 300;

export interface StripeCallOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  baseUrl?: string;
}

const formBody = (params: Record<string, string | number | undefined>): string => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    search.append(key, String(value));
  }
  return search.toString();
};

const callStripe = async (
  env: Env,
  method: 'GET' | 'POST',
  path: string,
  params: Record<string, string | number | undefined> | null,
  options?: StripeCallOptions,
): Promise<unknown> => {
  if (!env.STRIPE_SECRET_KEY) throw new ApiError(503, 'Billing not configured');
  const base = apiBase(options?.baseUrl ?? env.STRIPE_API_BASE, STRIPE_BASE);
  const isForm = method === 'POST';
  const query = !isForm && params ? '?' + formBody(params) : '';
  return upstreamJson({
    fetchImpl: options?.fetchImpl,
    url: base + path + query,
    timeoutMs: options?.timeoutMs ?? 10000,
    provider: 'Stripe',
    init: {
      method,
      headers: {
        Authorization: 'Bearer ' + env.STRIPE_SECRET_KEY,
        ...(isForm ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      },
      ...(isForm && params ? { body: formBody(params) } : {}),
    },
  });
};

export const priceIdFor = (env: Env, plan: CheckoutRequest['plan'], interval: CheckoutRequest['interval']): string | null => {
  if (plan === 'researcher') {
    if (interval === 'month') return env.STRIPE_PRICE_RESEARCHER_MONTH?.trim() || null;
    if (interval === 'year') return env.STRIPE_PRICE_RESEARCHER_YEAR?.trim() || null;
    return null;
  }
  if (plan === 'lab') {
    if (interval === 'month') return env.STRIPE_PRICE_LAB_MONTH?.trim() || null;
    if (interval === 'year') return env.STRIPE_PRICE_LAB_YEAR?.trim() || null;
    return null;
  }
  return env.STRIPE_PRICE_SUPPORT?.trim() || null;
};

export interface CheckoutOptions extends StripeCallOptions {
  origin?: string;
}

export const createCheckoutSession = async (
  env: Env,
  request: CheckoutRequest,
  options?: CheckoutOptions,
): Promise<{ url: string }> => {
  if (!env.STRIPE_SECRET_KEY) throw new ApiError(503, 'Billing not configured');
  const origin = options?.origin ?? publicOrigin(env);
  const params: Record<string, string | number | undefined> = {
    mode: request.plan === 'support' ? 'payment' : 'subscription',
    success_url: origin + '/checkout/success?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: origin + '/checkout/cancel',
    'metadata[plan]': request.plan,
    'metadata[interval]': request.interval,
  };
  if (request.plan === 'support' && request.amountCents !== undefined) {
    params['line_items[0][quantity]'] = 1;
    params['line_items[0][price_data][currency]'] = 'usd';
    params['line_items[0][price_data][unit_amount]'] = request.amountCents;
    params['line_items[0][price_data][product_data][name]'] = 'Fire Atlas support';
  } else {
    const price = priceIdFor(env, request.plan, request.interval);
    if (!price) throw new ApiError(503, 'Billing not configured');
    params['line_items[0][quantity]'] = 1;
    params['line_items[0][price]'] = price;
  }
  if (request.plan !== 'support') {
    params['subscription_data[metadata][plan]'] = request.plan;
    params['subscription_data[metadata][interval]'] = request.interval;
  }
  const data = await callStripe(env, 'POST', '/v1/checkout/sessions', params, options);
  const parsed = StripeCheckoutResponseSchema.safeParse(data);
  if (!parsed.success) throw new ApiError(502, 'Checkout could not be created');
  return { url: parsed.data.url };
};

export const customerIdFrom = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim()) return value;
  if (value && typeof value === 'object' && typeof (value as { id?: unknown }).id === 'string') {
    return (value as { id: string }).id;
  }
  return null;
};

export const retrieveCheckoutSession = async (
  env: Env,
  sessionId: string,
  options?: StripeCallOptions,
): Promise<{
  id: string;
  status: string | null;
  paymentStatus: string | null;
  mode: string | null;
  customer: string | null;
  subscription: string | null;
  plan: string | null;
  amountTotal: number | null;
}> => {
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) throw new ApiError(400, 'Invalid session id');
  if (!env.STRIPE_SECRET_KEY) throw new ApiError(503, 'Billing not configured');
  const data = await callStripe(env, 'GET', '/v1/checkout/sessions/' + sessionId, null, options);
  const parsed = StripeSessionSchema.safeParse(data);
  if (!parsed.success) throw new ApiError(502, 'Session could not be read');
  const session = parsed.data;
  return {
    id: session.id,
    status: session.status ?? null,
    paymentStatus: session.payment_status ?? null,
    mode: session.mode ?? null,
    customer: customerIdFrom(session.customer),
    subscription: customerIdFrom(session.subscription),
    plan: session.metadata?.plan ?? null,
    amountTotal: session.amount_total ?? null,
  };
};

export const retrieveSubscriptionEnd = async (
  env: Env,
  subscriptionId: string,
  options?: StripeCallOptions,
): Promise<{ currentPeriodEnd: number | null; status: string | null; customer: string | null; plan: string | null }> => {
  if (!env.STRIPE_SECRET_KEY) throw new ApiError(503, 'Billing not configured');
  const data = await callStripe(env, 'GET', '/v1/subscriptions/' + subscriptionId, null, options);
  const parsed = StripeSubscriptionSchema.safeParse(data);
  if (!parsed.success) throw new ApiError(502, 'Subscription could not be read');
  return {
    currentPeriodEnd: parsed.data.current_period_end ?? null,
    status: parsed.data.status ?? null,
    customer: customerIdFrom(parsed.data.customer),
    plan: parsed.data.metadata?.plan ?? null,
  };
};

export const createPortalSession = async (
  env: Env,
  customer: string,
  options?: CheckoutOptions,
): Promise<{ url: string }> => {
  if (!env.STRIPE_SECRET_KEY) throw new ApiError(503, 'Billing not configured');
  if (!/^cus_[A-Za-z0-9]+$/.test(customer)) throw new ApiError(400, 'No Stripe customer for this licence');
  const origin = options?.origin ?? publicOrigin(env);
  const data = await callStripe(
    env,
    'POST',
    '/v1/billing_portal/sessions',
    { customer, return_url: origin + '/account' },
    options,
  );
  const parsed = StripePortalResponseSchema.safeParse(data);
  if (!parsed.success) throw new ApiError(502, 'Billing portal could not be opened');
  return { url: parsed.data.url };
};

export interface ParsedSignature {
  timestamp: number;
  signatures: string[];
}

export const parseStripeSignature = (header: string | null): ParsedSignature | null => {
  if (!header) return null;
  let timestamp: number | null = null;
  const signatures: string[] = [];
  for (const part of header.split(',')) {
    const [key, value] = part.trim().split('=', 2);
    if (key === 't' && value && /^\d+$/.test(value)) timestamp = Number(value);
    if (key === 'v1' && value && /^[0-9a-f]{64}$/i.test(value)) signatures.push(value);
  }
  if (timestamp === null || signatures.length === 0) return null;
  return { timestamp, signatures };
};

/** Stripe-Signature = t=<unix>,v1=<hex HMAC of `${t}.${rawBody}`>. Five minute tolerance. */
export const verifyStripeSignature = async (
  header: string | null,
  rawBody: string,
  secret: string,
  nowSec = Math.floor(Date.now() / 1000),
  toleranceSec = STRIPE_TOLERANCE_SEC,
): Promise<boolean> => {
  const parsed = parseStripeSignature(header);
  if (!parsed) return false;
  if (Math.abs(nowSec - parsed.timestamp) > toleranceSec) return false;
  const signed = String(parsed.timestamp) + '.' + rawBody;
  let valid = false;
  for (const hex of parsed.signatures) {
    try {
      if (await hmacVerify(secret, signed, hexToBytes(hex))) valid = true;
    } catch {
      // try the next signature
    }
  }
  return valid;
};


export const classifyStripeError = (error: unknown): never => {
  if (error instanceof ApiError) throw error;
  if (error instanceof UpstreamError) throw new ApiError(502, 'Payment service unavailable');
  throw new ApiError(502, 'Payment service unavailable');
};
