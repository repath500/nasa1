import { z } from 'zod';
import type { Env } from '../env.ts';
import { keyFor, readLicenseRecord, writeLicenseRecord, type Kv, type LicenseRecord } from '../kv.ts';
import { PlanForToken, StripeSessionSchema, StripeSubscriptionSchema } from '../ai/schemas.ts';
import { customerIdFrom, retrieveSubscriptionEnd, type StripeCallOptions } from './stripe.ts';

export const StripeEventSchema = z
  .object({
    id: z.string().min(3).optional(),
    type: z.string().min(3).max(120),
    data: z.object({ object: z.record(z.string(), z.unknown()) }),
  })
  .passthrough();

const isoFromUnix = (value: number | null | undefined): string | null =>
  typeof value === 'number' && Number.isFinite(value) ? new Date(value * 1000).toISOString() : null;

const planFor = (raw: string | null | undefined, fallback: LicenseRecord['plan']): LicenseRecord['plan'] =>
  raw === 'researcher' || raw === 'lab' ? PlanForToken(raw) : raw === 'support' ? 'explorer' : fallback;

/**
 * Update the KV licence record so a deleted or unpaid subscription fails
 * verification. No personal data beyond the Stripe customer id and plan.
 */
export const processStripeEvent = async (
  env: Env,
  kv: Kv,
  event: unknown,
  options?: StripeCallOptions,
): Promise<'handled' | 'ignored' | 'duplicate'> => {
  const parsed = StripeEventSchema.safeParse(event);
  if (!parsed.success) return 'ignored';
  const { id, type, data } = parsed.data;
  if (id) {
    const seen = await kv.get(keyFor.stripeEvent(id));
    if (seen) return 'duplicate';
  }

  let result: 'handled' | 'ignored' = 'ignored';

  if (type === 'checkout.session.completed') {
    const session = StripeSessionSchema.safeParse(data.object);
    if (session.success) {
      const customer = customerIdFrom(session.data.customer);
      if (customer) {
        const subscription = customerIdFrom(session.data.subscription);
        let expiresAt: string | null = null;
        let status: LicenseRecord['status'] = 'active';
        if (subscription) {
          try {
            const sub = await retrieveSubscriptionEnd(env, subscription, options);
            expiresAt = isoFromUnix(sub.currentPeriodEnd);
            if (sub.status === 'canceled' || sub.status === 'unpaid' || sub.status === 'incomplete_expired') {
              status = 'revoked';
            }
          } catch {
            // The session is paid; keep active even if the subscription read fails.
          }
        }
        await writeLicenseRecord(kv, {
          customer,
          plan: planFor(session.data.metadata?.plan, 'researcher'),
          status,
          expiresAt,
          updatedAt: new Date().toISOString(),
        });
        result = 'handled';
      }
    }
  } else if (type === 'customer.subscription.updated' || type === 'customer.subscription.deleted') {
    const subscription = StripeSubscriptionSchema.safeParse(data.object);
    if (subscription.success) {
      const customer = customerIdFrom(subscription.data.customer);
      if (customer) {
        const existing = await readLicenseRecord(kv, customer);
        const status: LicenseRecord['status'] =
          type === 'customer.subscription.deleted' ||
          ['canceled', 'unpaid', 'incomplete_expired'].includes(subscription.data.status ?? '')
            ? 'revoked'
            : 'active';
        await writeLicenseRecord(kv, {
          customer,
          plan: planFor(subscription.data.metadata?.plan, existing?.plan ?? 'researcher'),
          status,
          expiresAt: isoFromUnix(subscription.data.current_period_end) ?? existing?.expiresAt ?? null,
          updatedAt: new Date().toISOString(),
        });
        result = 'handled';
      }
    }
  }

  if (id) await kv.put(keyFor.stripeEvent(id), new Date().toISOString());
  return result;
};
