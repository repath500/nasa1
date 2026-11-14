import './landing.css';
import { Hero } from './Hero';
import { Challenge } from './Challenge';
import { Why } from './Why';
import { How } from './How';
import { Caught } from './Caught';
import { Limits } from './Limits';
import { Final } from './Final';
import { WipeProvider } from './Wipe';

/** SPEC §3.1 as rebuilt by WL2: dithered hero, then six sections, each in a different layout family. Text credit only, no agency logos. */
export default function LandingPage() {
  return (
    <WipeProvider>
      <div className="lp" data-testid="landing">
        <Hero /><Challenge /><Why /><How /><Caught /><Limits /><Final />
      </div>
    </WipeProvider>
  );
}
