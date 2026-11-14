import { Link } from 'react-router-dom';
import { LinkButton } from '../../components/Button';
import { PLANS, PRINCIPLE } from '../pricing/plans';

/** Free / Researcher / Lab teaser. Researcher is the wide column on purpose. */
export function PricingTeaser() {
  const [explorer, researcher, lab] = PLANS;
  return (
    <section aria-labelledby="price-h" className="border-t border-hairline">
      <div className="mx-auto max-w-[1200px] px-4 py-16 lg:py-24">
        <h2 id="price-h" className="max-w-[24ch] text-3xl md:text-4xl">{PRINCIPLE}</h2>
        <p className="mt-3 max-w-[56ch] text-muted">Paid plans cover what costs money to run: live AI, voice generation, branded exports and team workspaces.</p>
        <div className="compartments mt-8 md:grid-cols-[1fr_1.7fr_1fr]">
          {[explorer, researcher, lab].map((p) => p && (
            <div key={p.id} className={`p-5 ${p.id === 'researcher' ? '!bg-raised' : ''}`}>
              <h3 className="text-lg">{p.name}</h3>
              <p className="num mt-1 text-2xl font-semibold">{p.price.month === 0 ? 'Free' : `$${p.price.month}`}{p.price.month ? <span className="text-sm font-normal text-muted"> / month</span> : null}</p>
              <p className="mt-2 text-sm text-muted">{p.tagline}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center gap-4"><LinkButton to="/pricing" variant="primary">See plans</LinkButton><Link to="/learn" className="text-sm">Or start with Learn mode, always free</Link></div>
      </div>
    </section>
  );
}
