import { useState } from 'react';
import type { CheckoutRequest } from '@fire/contracts';
import { Button } from '../../components/Button';
import { InlineError } from '../../components/InlineError';
import { apiFetch, useHealth } from '../../shell/api';

export interface BillingState { enabled: boolean; reason: string | null; test: boolean }
/** SPEC §5.3 / §5.4: buttons disable with a visible reason when billing is not configured. */
export function useBilling(): BillingState {
  const h = useHealth();
  if (h.status === 'loading') return { enabled: false, reason: 'Checking billing', test: false };
  if (h.status === 'offline') return { enabled: false, reason: 'Billing needs the server, which is not reachable right now', test: false };
  if (!h.health.services.stripe || h.health.stripeMode === 'off') return { enabled: false, reason: 'Billing not configured', test: false };
  return { enabled: true, reason: null, test: h.health.stripeMode === 'test' };
}

export function PayButton({ req, label, billing, variant = 'primary', testId }: { req: CheckoutRequest; label: string; billing: BillingState; variant?: 'primary' | 'secondary'; testId: string }) {
  const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null);
  const run = async () => {
    setLoading(true); setError(null);
    const r = await apiFetch<{ url: string }>('/api/checkout', { method: 'POST', body: JSON.stringify(req), timeoutMs: 12000 });
    if (r.ok && typeof r.data?.url === 'string') { window.location.assign(r.data.url); return; }
    setLoading(false); setError(r.ok ? 'Checkout did not return a link.' : r.message);
  };
  return (
    <div>
      <Button variant={variant} size="lg" className="w-full" loading={loading} loadingLabel="Opening checkout" disabled={!billing.enabled} onClick={() => void run()} data-testid={testId} aria-describedby={billing.reason ? `${testId}-why` : undefined}>{label}</Button>
      {billing.reason && <p id={`${testId}-why`} className="mt-2 text-xs text-muted" data-testid="billing-reason">{billing.reason}.</p>}
      {billing.test && !billing.reason && <p className="mono mt-2 text-[11px] text-flag">Test mode, no real charge</p>}
      {error && <InlineError className="mt-2" message={error} stillWorks="Nothing was charged. Everything evidence-related is still free." onRetry={() => void run()} />}
    </div>
  );
}
