import './landing.css';
import { Hero } from './Hero';
import { Challenge } from './Challenge';
import { Why } from './Why';
import { How } from './How';
import { Caught } from './Caught';
import { Limits } from './Limits';
import { Final } from './Final';
import { CodeWork } from './CodeWork';
import { Process } from './Process';
import { AccessBand } from './AccessBand';
import { WipeProvider } from './Wipe';

/** Landing: dithered hero, the challenge, a big access band, why, where code does the science, how it works, caught by code, how we built it, limits, final band. Text credit only, no agency logos. */
export default function LandingPage() {
  return (
    <WipeProvider>
      <div className="lp" data-testid="landing">
        <Hero /><Challenge />
        <AccessBand id="access-1-h" testId="cta-enter-band" title="See what NASA has tested near Moon-base air." sub="The atlas opens on the Moon-base example. Every dot is a real test row you can open." />
        <Why /><CodeWork /><How /><Caught /><Process /><Limits /><Final />
      </div>
    </WipeProvider>
  );
}
