import { describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import { signLicenseToken, verifyLicenseToken } from '../src/billing/license.ts';
import { parseStripeSignature, verifyStripeSignature } from '../src/billing/stripe.ts';

const secret = 'test-license-secret';
const now = 1_800_000_000;

const payload = { plan: 'researcher' as const, customer: 'cus_test123', exp: now + 3600, nonce: 'nonce-12345678' };

describe('licence token', () => {
  it('signs and verifies a token', async () => {
    const token = await signLicenseToken(payload, secret);
    expect(token.split('.')).toHaveLength(2);
    const result = await verifyLicenseToken(token, secret, now);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.payload).toEqual(payload);
  });

  it('rejects a tampered payload and a tampered signature', async () => {
    const token = await signLicenseToken(payload, secret);
    const [body, signature] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ ...payload, plan: 'lab' })).toString('base64url');
    expect((await verifyLicenseToken(forged + '.' + signature, secret, now)).ok).toBe(false);
    const flipped = (signature?.[0] === 'A' ? 'B' : 'A') + (signature ?? '').slice(1);
    expect((await verifyLicenseToken(body + '.' + flipped, secret, now)).ok).toBe(false);
  });

  it('rejects a token signed with another secret', async () => {
    const token = await signLicenseToken(payload, 'other-secret');
    expect((await verifyLicenseToken(token, secret, now)).ok).toBe(false);
  });

  it('rejects an expired token but can expose it for status display', async () => {
    const expired = await signLicenseToken({ ...payload, exp: now - 10 }, secret);
    expect(await verifyLicenseToken(expired, secret, now)).toEqual({ ok: false, reason: 'expired' });
    const tolerant = await verifyLicenseToken(expired, secret, now, true);
    expect(tolerant.ok).toBe(true);
  });

  it('rejects malformed tokens', async () => {
    expect((await verifyLicenseToken('nope', secret, now)).ok).toBe(false);
    expect((await verifyLicenseToken('a.b.c', secret, now)).ok).toBe(false);
  });
});

describe('Stripe webhook signature', () => {
  const webhookSecret = 'whsec_test_secret';

  const sign = (timestamp: number, body: string): string =>
    't=' + timestamp + ',v1=' + createHmac('sha256', webhookSecret).update(timestamp + '.' + body).digest('hex');

  it('accepts a valid signature', async () => {
    const body = '{"id":"evt_1","type":"customer.subscription.deleted"}';
    expect(await verifyStripeSignature(sign(now, body), body, webhookSecret, now)).toBe(true);
  });

  it('rejects a changed body and a wrong secret', async () => {
    const body = '{"id":"evt_1"}';
    expect(await verifyStripeSignature(sign(now, body), body + ' ', webhookSecret, now)).toBe(false);
    expect(await verifyStripeSignature(sign(now, body), body, 'whsec_other', now)).toBe(false);
  });

  it('rejects a stale timestamp outside the five minute tolerance', async () => {
    const body = '{"id":"evt_1"}';
    expect(await verifyStripeSignature(sign(now - 400, body), body, webhookSecret, now)).toBe(false);
    expect(await verifyStripeSignature(sign(now - 200, body), body, webhookSecret, now)).toBe(true);
  });

  it('accepts any one of multiple v1 signatures', async () => {
    const body = '{"id":"evt_1"}';
    const good = createHmac('sha256', webhookSecret).update(now + '.' + body).digest('hex');
    const header = 't=' + now + ',v1=' + '0'.repeat(64) + ',v1=' + good;
    expect(await verifyStripeSignature(header, body, webhookSecret, now)).toBe(true);
  });

  it('parses a header and rejects a malformed one', () => {
    expect(parseStripeSignature('t=' + now + ',v1=' + 'a'.repeat(64))?.timestamp).toBe(now);
    expect(parseStripeSignature('v1=' + 'a'.repeat(64))).toBeNull();
    expect(parseStripeSignature(null)).toBeNull();
  });
});
