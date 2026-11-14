import { useState } from 'react';
import { Check } from '@phosphor-icons/react';
import { LinkButton } from '../../components/Button';
import { NumberTween } from '../../components/NumberTween';
import { PayButton, useBilling } from './PayButton';
import { PLANS, PRINCIPLE, type PlanCopy } from './plans';

type Interval = 'month' | 'year';

function Features({ items }: { items: string[] }) {
  return <ul className="mt-5 space-y-2 text-sm">{items.map((f) => <li key={f} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden /><span>{f}</span></li>)}</ul>;
}

/** SPEC §5. Explorer, Researcher (the wide highlighted column), Lab, and Support. */
export default function PricingPage() {
  const [interval, setInterval] = useState<Interval>('month');
  const billing = useBilling();
  const [explorer, researcher, lab, support] = PLANS as [PlanCopy, PlanCopy, PlanCopy, PlanCopy];
  const rPrice = interval === 'year' ? researcher.price.year ?? 0 : researcher.price.month ?? 0;
  const saving = (researcher.price.month ?? 0) * 12 - (researcher.price.year ?? 0);
  const [amount, setAmount] = useState<number>(15); const [custom, setCustom] = useState('');
  const customNum = Number(custom); const amountDollars = custom ? customNum : amount;
  const validAmount = Number.isFinite(amountDollars) && amountDollars >= 1 && amountDollars <= 500;

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-20 pt-10 md:pt-16" data-testid="pricing">
      <h1 className="max-w-[18ch] text-[clamp(2rem,4.6vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.03em]" data-testid="principle">{PRINCIPLE}</h1>
      <p className="mt-4 max-w-[60ch] text-muted">The Gap Map, rankings, sources, ledger, Learn mode, preset audio overviews and print-to-PDF stay free. Paid plans cover what costs money to run, or saves a team time.</p>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <div role="radiogroup" aria-label="Billing interval" className="inline-flex border border-strong">
          {(['month', 'year'] as const).map((i) => (
            <label key={i} className={`cursor-pointer px-4 py-2 text-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--color-focus)] ${interval === i ? 'bg-accent text-accent-ink' : 'hover:bg-raised'}`}>
              <input type="radio" name="interval" className="sr-only" checked={interval === i} onChange={() => setInterval(i)} data-testid={`interval-${i}`} />{i === 'month' ? 'Monthly' : 'Yearly'}
            </label>
          ))}
        </div>
        <p className="text-sm text-muted" aria-live="polite">{interval === 'year' ? <>Yearly saves <span className="num text-ink">${saving}</span> on Researcher.</> : 'Switch to yearly to save on Researcher.'}</p>
      </div>

      <div className="compartments mt-6 md:grid-cols-[1fr_1.7fr_1fr]">
        <section className="flex flex-col p-6" aria-labelledby="p-explorer">
          <h2 id="p-explorer" className="text-xl">{explorer.name}</h2>
          <p className="num mt-2 text-4xl font-semibold">Free</p>
          <p className="mt-2 text-sm text-muted">{explorer.tagline}</p>
          <Features items={explorer.features} />
          <div className="mt-auto pt-6"><LinkButton to="/atlas" size="lg" className="w-full">{explorer.cta}</LinkButton></div>
        </section>

        <section className="flex flex-col !bg-raised p-6 md:p-8 md:outline md:outline-2 md:-outline-offset-2 md:outline-[var(--color-accent)]" aria-labelledby="p-researcher">
          <div className="flex items-baseline justify-between gap-3"><h2 id="p-researcher" className="text-2xl">{researcher.name}</h2><span className="mono text-xs text-accent">Built for researchers</span></div>
          <p className="mt-2 flex items-baseline gap-2" aria-live="polite"><span className="text-5xl font-semibold">$<NumberTween value={rPrice} /></span><span className="text-muted">/ {interval}</span></p>
          {interval === 'year' && <p className="num text-sm text-muted">${((researcher.price.year ?? 0) / 12).toFixed(2)} a month, billed yearly</p>}
          <p className="mt-2 max-w-[44ch] text-sm text-muted">{researcher.tagline}</p>
          <div className="grid gap-x-6 md:grid-cols-2"><Features items={researcher.features.slice(0, 3)} /><Features items={researcher.features.slice(3)} /></div>
          <div className="mt-auto max-w-[360px] pt-6"><PayButton billing={billing} testId="pay-researcher" label={researcher.cta} req={{ plan: 'researcher', interval }} /></div>
        </section>

        <section className="flex flex-col p-6" aria-labelledby="p-lab">
          <h2 id="p-lab" className="text-xl">{lab.name}</h2>
          <p className="mt-2 flex items-baseline gap-2"><span className="text-4xl font-semibold">$<NumberTween value={lab.price.month ?? 0} /></span><span className="text-muted">/ month</span></p>
          <p className="mt-2 text-sm text-muted">{lab.tagline}{interval === 'year' ? ' Billed monthly.' : ''}</p>
          <Features items={lab.features} />
          <div className="mt-auto pt-6"><PayButton billing={billing} testId="pay-lab" label={lab.cta} variant="secondary" req={{ plan: 'lab', interval: 'month' }} /></div>
        </section>
      </div>

      <section className="mt-3 grid gap-6 border border-hairline p-6 md:grid-cols-[1fr_auto] md:items-end" aria-labelledby="p-support">
        <div>
          <h2 id="p-support" className="text-xl">{support.name}</h2>
          <p className="mt-1 max-w-[60ch] text-sm text-muted">{support.tagline}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Support amount">
            {[5, 15].map((a) => (
              <label key={a} className={`num cursor-pointer border px-4 py-2 text-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--color-focus)] ${!custom && amount === a ? 'border-accent bg-accent text-accent-ink' : 'border-strong hover:border-accent'}`}>
                <input type="radio" name="amount" className="sr-only" checked={!custom && amount === a} onChange={() => { setAmount(a); setCustom(''); }} />${a}</label>
            ))}
            <label className="flex items-center gap-2 text-sm"><span className="sr-only">Custom amount in dollars</span>
              <span className="num">$</span><input inputMode="decimal" placeholder="Other" value={custom} onChange={(e) => setCustom(e.target.value.replace(/[^\d.]/g, ''))} aria-invalid={!!custom && !validAmount} className="num min-h-10 w-24 rounded-[2px] border border-strong bg-bg px-3" />
            </label>
            {custom && !validAmount && <span className="text-xs text-[color:var(--color-danger-text)]">Enter 1 to 500 dollars.</span>}
          </div>
        </div>
        <div className="w-full md:w-60">
          <PayButton billing={validAmount ? billing : { enabled: false, reason: 'Enter an amount from 1 to 500 dollars', test: false }} testId="pay-support" variant="secondary" label={`Support with $${validAmount ? amountDollars : '…'}`}
            req={{ plan: 'support', interval: 'once', amountCents: validAmount ? Math.round(amountDollars * 100) : undefined }} />
        </div>
      </section>

      {billing.test && <p className="mt-4 text-sm text-muted">Judges can use the test card <span className="num text-ink">4242 4242 4242 4242</span> with any future date and any code. No real charge is made.</p>}
      <p className="mt-6 max-w-[70ch] text-xs text-muted">Prices are proposals for the hackathon build. Payments are handled by Stripe Checkout: no card details touch this site.</p>
    </div>
  );
}
