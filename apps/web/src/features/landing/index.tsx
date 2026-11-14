import { Link } from 'react-router-dom';
import { Hero } from './Hero';
import { OneFrame } from './OneFrame';
import { Beats } from './Beats';
import { Teleprinter } from './Teleprinter';
import { AudioTeaser } from './AudioTeaser';
import { PricingTeaser } from './PricingTeaser';

/** SPEC §3.1. Hero, then five sections, each in a different layout family. No agency logos: text credit only. */
export default function LandingPage() {
  return (
    <div data-testid="landing">
      <Hero /><OneFrame /><Beats /><Teleprinter /><AudioTeaser /><PricingTeaser />
      <section aria-labelledby="credit-h" className="border-t border-hairline">
        <div className="mx-auto max-w-[1200px] px-4 py-12">
          <h2 id="credit-h" className="text-xl">Data credit</h2>
          <p className="mt-2 max-w-[70ch] text-sm text-muted">Test records come from the NASA Physical Sciences Informatics archive, released under CC0-1.0. NASA does not endorse this project. AI models and AI coding agents helped build it, and the voice is AI-generated. Read the <Link to="/credits">credits and AI disclosure</Link> and the <Link to="/method">method and limits</Link>.</p>
        </div>
      </section>
    </div>
  );
}
