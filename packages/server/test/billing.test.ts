import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRateLimiter } from '../src/http.ts';
import { router, type RouterDeps } from '../src/router.ts';
import { verifyLicenseToken } from '../src/billing/license.ts';
import { processStripeEvent } from '../src/billing/webhook.ts';
import { getKv, readLicenseRecord, resetMemoryKv } from '../src/kv.ts';
import type { Env } from '../src/env.ts';

const env: Env = {
  STRIPE_SECRET_KEY: 'sk_test_fake',
  STRIPE_WEBHOOK_SECRET: 'whsec_test_secret',
  LICENSE_SECRET: 'license-secret',
  STRIPE_PRICE_RESEARCHER_MONTH: 'price_researcher_month',
  STRIPE_PRICE_LAB_MONTH: 'price_lab_month',
  STRIPE_PRICE_SUPPORT: 'price_support',
  PUBLIC_ORIGIN: 'https://atlas.example',
  STRIPE_MODE: 'test',
};

const deps = (fetchImpl: typeof fetch): RouterDeps => ({
  rateLimiter: createRateLimiter({ capacity: 1000, refillPerSec: 1000 }),
  stripe: { fetchImpl, timeoutMs: 1000 },
});

const post = (path: string, body: unknown): Request =>
  new Request('http://localhost' + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const jsonResponse = (body: unknown): Response =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

describe('Stripe checkout', () => {
  it('creates a subscription session with the documented success url', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ url: 'https://checkout.stripe.com/c/pay/cs_test_123' }),
    ) as unknown as typeof fetch;
    const res = await router(post('/api/checkout', { plan: 'researcher', interval: 'month' }), env, deps(fetchImpl));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: 'https://checkout.stripe.com/c/pay/cs_test_123' });
    const mock = fetchImpl as unknown as ReturnType<typeof vi.fn>;
    const [url, init] = mock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.stripe.com/v1/checkout/sessions');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer sk_test_fake');
    const form = new URLSearchParams(String(init.body));
    expect(form.get('mode')).toBe('subscription');
    expect(form.get('line_items[0][price]')).toBe('price_researcher_month');
    expect(form.get('success_url')).toBe('https://atlas.example/checkout/success?session_id={CHECKOUT_SESSION_ID}');
    expect(form.get('cancel_url')).toBe('https://atlas.example/checkout/cancel');
    expect(form.get('metadata[plan]')).toBe('researcher');
  });

  it('creates a one-off support session with a custom amount', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ url: 'https://checkout.stripe.com/c/pay/cs_test_support' }),
    ) as unknown as typeof fetch;
    const res = await router(
      post('/api/checkout', { plan: 'support', interval: 'once', amountCents: 1500 }),
      env,
      deps(fetchImpl),
    );
    expect(res.status).toBe(200);
    const mock = fetchImpl as unknown as ReturnType<typeof vi.fn>;
    const form = new URLSearchParams(String((mock.mock.calls[0] as [string, RequestInit])[1].body));
    expect(form.get('mode')).toBe('payment');
    expect(form.get('line_items[0][price_data][unit_amount]')).toBe('1500');
    expect(form.get('line_items[0][price_data][currency]')).toBe('usd');
  });

  it('rejects an invalid plan and an unconfigured price', async () => {
    const bad = await router(post('/api/checkout', { plan: 'enterprise', interval: 'month' }), env, deps(fetch));
    expect(bad.status).toBe(400);
    const noPrice = await router(
      post('/api/checkout', { plan: 'lab', interval: 'year' }),
      env,
      deps(fetch),
    );
    expect(noPrice.status).toBe(400);
    const missing = await router(
      post('/api/checkout', { plan: 'researcher', interval: 'year' }),
      env,
      deps(fetch),
    );
    expect(missing.status).toBe(503);
  });
});

describe('licence claim', () => {
  beforeEach(() => resetMemoryKv());

  it('issues a token for a paid session and records the customer', async () => {
    const fetchImpl = vi.fn(async (url: unknown) => {
      if (String(url).includes('/v1/checkout/sessions/')) {
        return jsonResponse({
          id: 'cs_test_abc123',
          object: 'checkout.session',
          status: 'complete',
          payment_status: 'paid',
          mode: 'subscription',
          customer: 'cus_test123',
          subscription: 'sub_test123',
          metadata: { plan: 'researcher' },
        });
      }
      return jsonResponse({
        id: 'sub_test123',
        status: 'active',
        current_period_end: 1900000000,
        customer: 'cus_test123',
        metadata: { plan: 'researcher' },
      });
    }) as unknown as typeof fetch;
    const res = await router(
      post('/api/license/claim', { sessionId: 'cs_test_abc123' }),
      env,
      deps(fetchImpl),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.plan).toBe('researcher');
    expect(body.expiresAt).toBe(new Date(1900000000 * 1000).toISOString());
    const verified = await verifyLicenseToken(body.token, 'license-secret');
    expect(verified.ok).toBe(true);
    if (verified.ok) {
      expect(verified.payload.plan).toBe('researcher');
      expect(verified.payload.customer).toBe('cus_test123');
    }
    const record = await readLicenseRecord(getKv(env), 'cus_test123');
    expect(record?.status).toBe('active');
  });

  it('refuses an unpaid session', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        id: 'cs_test_abc123',
        status: 'complete',
        payment_status: 'unpaid',
        customer: 'cus_test123',
        metadata: { plan: 'researcher' },
      }),
    ) as unknown as typeof fetch;
    const res = await router(
      post('/api/license/claim', { sessionId: 'cs_test_abc123' }),
      env,
      deps(fetchImpl),
    );
    expect(res.status).toBe(409);
  });
});

describe('webhook KV updates', () => {
  beforeEach(() => resetMemoryKv());

  it('revokes a subscription on deletion', async () => {
    const kv = getKv(env);
    await processStripeEvent(env, kv, {
      id: 'evt_del_1',
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_test123',
          status: 'canceled',
          customer: 'cus_test123',
          current_period_end: 1900000000,
          metadata: { plan: 'researcher' },
        },
      },
    });
    const record = await readLicenseRecord(kv, 'cus_test123');
    expect(record?.status).toBe('revoked');
    expect(record?.plan).toBe('researcher');
  });

  it('ignores a duplicate event id', async () => {
    const kv = getKv(env);
    const event = {
      id: 'evt_same',
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_x', status: 'canceled', customer: 'cus_dup' } },
    };
    expect(await processStripeEvent(env, kv, event)).toBe('handled');
    expect(await processStripeEvent(env, kv, event)).toBe('duplicate');
  });
});
