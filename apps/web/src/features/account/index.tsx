import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useReducedMotion } from 'motion/react';
import type { LicenseInfo, Plan } from '@fire/contracts';
import { useAtlas } from '../../state/store';
import { apiFetch } from '../../shell/api';
import { KEYS, lsSet } from '../../shell/storage';
import { Button, LinkButton } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { DitherCanvas } from '../../components/DitherCanvas';
import { InlineError } from '../../components/InlineError';
import { Skeleton } from '../../components/Skeleton';
import { toast } from '../../components/ToastHost';

const PLAN_NAME: Record<Plan, string> = { explorer: 'Explorer', researcher: 'Researcher', lab: 'Lab' };
const AUDIO_LIMIT: Record<Plan, number | null> = { explorer: 0, researcher: 30, lab: 300 };

function Meter({ label, value, limit }: { label: string; value: number; limit: number | null }) {
  const pct = limit ? Math.min(100, (value / limit) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm"><span>{label}</span><span className="num text-muted">{value}{limit ? ` of ${limit}` : ' used'}</span></div>
      <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={limit ?? Math.max(1, value)} aria-valuenow={value} className="mt-1 h-2 bg-raised"><div className="h-2 bg-accent" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

/** SPEC §5.3 account: plan, renewal, usage meters, Manage billing, Restore purchase. */
export default function AccountPage() {
  const license = useAtlas((s) => s.license);
  const [info, setInfo] = useState<LicenseInfo | null>(null); const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [portalBusy, setPortalBusy] = useState(false); const [portalErr, setPortalErr] = useState<string | null>(null);
  const [email, setEmail] = useState(''); const [restoreBusy, setRestoreBusy] = useState(false); const [restoreMsg, setRestoreMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    if (!license.token) { setState('ready'); setInfo(null); return; }
    setState('loading');
    const r = await apiFetch<LicenseInfo>('/api/license');
    if (r.ok) { setInfo(r.data); setState('ready'); } else setState('error');
  }, [license.token]);
  useEffect(() => { void load(); }, [load]);

  const plan: Plan = info?.status === 'active' ? info.plan : license.token ? license.plan : 'explorer';
  const portal = async () => {
    setPortalBusy(true); setPortalErr(null);
    const r = await apiFetch<{ url: string }>('/api/portal', { method: 'POST' });
    if (r.ok && r.data?.url) { window.location.assign(r.data.url); return; }
    setPortalBusy(false); setPortalErr(r.ok ? 'No billing portal link was returned.' : r.message);
  };
  const restore = async (e: React.FormEvent) => {
    e.preventDefault(); setRestoreBusy(true); setRestoreMsg(null);
    // TODO(contract): POST /api/license/restore { email } is not in SPEC §12. Proposed for the lead.
    const r = await apiFetch<{ token: string; plan: Plan; expiresAt: string }>('/api/license/restore', { method: 'POST', body: JSON.stringify({ email }) });
    if (r.ok && r.data?.token) { storeLicense(r.data.token, r.data.plan); setRestoreMsg({ ok: true, text: `Licence restored: ${PLAN_NAME[r.data.plan]}.` }); toast('Purchase restored'); void load(); }
    else setRestoreMsg({ ok: false, text: r.ok ? 'Nothing found for that email.' : r.status === 404 ? 'Restore is not available on this server yet.' : r.message });
    setRestoreBusy(false);
  };

  return (
    <div className="mx-auto max-w-[900px] px-4 pb-20 pt-10 md:pt-16" data-testid="account">
      <h1 className="text-4xl">Account</h1>
      <p className="mt-2 text-muted">No sign-in. Your licence lives in this browser.</p>

      <section className="panel mt-8 p-6" aria-labelledby="plan-h">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 id="plan-h" className="text-xl">Plan</h2>
            {state === 'loading' ? <Skeleton className="mt-2 h-8 w-40" /> : <p className="mt-1 text-3xl font-semibold" data-testid="account-plan">{PLAN_NAME[plan]}</p>}</div>
          {info && <Chip tone={info.status === 'active' ? 'ok' : 'flag'} pill>{info.status.toUpperCase()}</Chip>}
        </div>
        {state === 'error' && <InlineError className="mt-4" message="Could not check your licence." stillWorks="Everything evidence-related still works." onRetry={() => void load()} />}
        {plan === 'explorer' && state === 'ready' && <p className="mt-3 max-w-[56ch] text-sm text-muted">You are on the free Explorer plan. Every piece of NASA-derived evidence is included. <Link to="/pricing">See plans</Link>.</p>}
        {info && <p className="mt-3 text-sm text-muted">{info.expiresAt ? <>Renews or ends on <span className="num text-ink">{new Date(info.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>.</> : 'No renewal date on record.'}</p>}
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Meter label="Audio minutes this month" value={info?.usage.audioMinutes ?? 0} limit={AUDIO_LIMIT[plan]} />
          <Meter label="Ask calls this month" value={info?.usage.askCalls ?? 0} limit={null} />
        </div>
        <div className="mt-6 flex flex-wrap items-start gap-3">
          <Button variant="primary" loading={portalBusy} loadingLabel="Opening portal" disabled={!license.token} onClick={() => void portal()} data-testid="manage-billing">Manage billing</Button>
          {!license.token && <p className="self-center text-xs text-muted">Billing is managed once you hold a paid licence.</p>}
        </div>
        {portalErr && <InlineError className="mt-3" message={portalErr} onRetry={() => void portal()} />}
      </section>

      <section className="panel mt-4 p-6" aria-labelledby="restore-h">
        <h2 id="restore-h" className="text-xl">Restore purchase</h2>
        <p className="mt-1 text-sm text-muted">Bought on another device? Enter the email you used at checkout to re-issue your licence.</p>
        <form onSubmit={(e) => void restore(e)} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="min-w-[240px] flex-1"><span className="mb-1 block text-[13px] text-muted">Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="min-h-10 w-full rounded-[2px] border border-strong bg-bg px-3 text-sm" /></label>
          <Button type="submit" loading={restoreBusy} loadingLabel="Checking">Restore</Button>
        </form>
        {restoreMsg && <p role={restoreMsg.ok ? 'status' : 'alert'} className={`mt-3 text-sm ${restoreMsg.ok ? 'text-[color:var(--color-ok-text)]' : 'text-[color:var(--color-danger-text)]'}`}>{restoreMsg.text}</p>}
      </section>
    </div>
  );
}

function storeLicense(token: string, plan: Plan) {
  useAtlas.getState().set({ license: { plan, token } });
  lsSet(KEYS.license, token);
}

/** Dithered geometric badge generated from the plan name. Our own design, no agency insignia. */
function badgeLum(plan: string, sparkle: boolean) {
  let h = 2166136261; for (const c of plan) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  const n = 3 + ((h >>> 3) % 5); const rot = ((h >>> 9) % 360) * (Math.PI / 180);
  return (u: number, v: number, t: number) => {
    const x = (u - 0.5) * 2; const y = (v - 0.5) * 2; const r = Math.hypot(x, y); const a = Math.atan2(y, x) + rot;
    const ring = r > 0.86 && r < 0.96 ? 0.95 : 0;
    const inner = r < 0.8 ? 0.28 + 0.5 * (0.5 + 0.5 * Math.cos(a * n)) * (1 - r) + 0.18 * (1 - r) : 0;
    const core = r < 0.22 ? 0.95 : r < 0.3 ? 0.1 : 0;
    const spark = sparkle && r >= 0.96 ? ((Math.sin(Math.floor(u * 90) * 12.9898 + Math.floor(v * 90) * 78.233 + Math.floor(t * 5)) * 43758.5453) % 1 + 1) % 1 > 0.97 ? 0.9 : 0 : 0;
    return Math.max(ring, inner, core, spark);
  };
}

export function CheckoutSuccess() {
  const [params] = useSearchParams(); const sessionId = params.get('session_id');
  const reduce = useReducedMotion();
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading'); const [msg, setMsg] = useState(''); const [claim, setClaim] = useState<{ plan: Plan; expiresAt: string | null } | null>(null);
  const run = useCallback(async () => {
    if (!sessionId) { setState('error'); setMsg('This page needs a checkout session. Start from the pricing page.'); return; }
    setState('loading');
    const r = await apiFetch<{ token: string; plan: Plan; expiresAt: string | null }>('/api/license/claim', { method: 'POST', body: JSON.stringify({ sessionId }), timeoutMs: 12000 });
    if (r.ok && r.data?.token) { storeLicense(r.data.token, r.data.plan); setClaim({ plan: r.data.plan, expiresAt: r.data.expiresAt }); setState('ready'); }
    else { setState('error'); setMsg(r.ok ? 'The payment could not be confirmed.' : r.message); }
  }, [sessionId]);
  useEffect(() => { void run(); }, [run]);
  const plan = claim?.plan ?? 'explorer';
  return (
    <div className="mx-auto grid max-w-[900px] items-center gap-10 px-4 py-16 md:grid-cols-[1fr_300px]" data-testid="checkout-success">
      <div>
        <h1 className="text-4xl">{state === 'ready' ? 'Payment confirmed' : state === 'error' ? 'Could not confirm yet' : 'Confirming your payment'}</h1>
        {state === 'loading' && <div role="status" className="mt-4 space-y-2"><Skeleton className="h-5 w-72" /><Skeleton className="h-5 w-56" /><p className="sr-only">Confirming</p></div>}
        {state === 'error' && <InlineError className="mt-4" message={msg} stillWorks="No charge is lost: your payment is safe with the payment provider. Everything evidence-related still works." onRetry={sessionId ? () => void run() : undefined} />}
        {state === 'ready' && claim && (
          <div className="mt-4 space-y-3">
            <p className="text-lg" data-testid="claim-plan">Licence active: {PLAN_NAME[claim.plan]}.{claim.expiresAt ? ` Valid until ${new Date(claim.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.` : ''}</p>
            <p className="text-muted">Next steps: open a custom scenario, make a branded brief, or check your usage on the account page.</p>
            <div className="flex flex-wrap gap-3 pt-2"><LinkButton to="/atlas" variant="primary">Open the atlas</LinkButton><LinkButton to="/account">Account</LinkButton></div>
          </div>
        )}
      </div>
      <div className="mx-auto w-full max-w-[280px]">
        <DitherCanvas lum={badgeLum(PLAN_NAME[plan], !reduce && state === 'ready')} cell={4} animate={state === 'ready'} fgVar="--color-accent" className="aspect-square w-full" label={`${PLAN_NAME[plan]} plan badge`} />
      </div>
    </div>
  );
}

export function CheckoutCancel() {
  return (
    <div className="mx-auto max-w-[640px] px-4 py-20" data-testid="checkout-cancel">
      <h1 className="text-4xl">Checkout cancelled</h1>
      <p className="mt-3 text-muted">No charge was made. Everything evidence-related stays free whether or not you subscribe.</p>
      <div className="mt-6 flex gap-3"><LinkButton to="/pricing" variant="primary">Back to plans</LinkButton><LinkButton to="/atlas">Open the atlas</LinkButton></div>
    </div>
  );
}
