import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from '@phosphor-icons/react';
import { WipeLink } from './Wipe';
import { SdkDither } from './SdkDither';
import { ACCESS_PATH, CHALLENGE_URL } from './Hero';

/**
 * The big way in. A full-width band on an animated dither field (Paper shaders SDK) with one oversized action.
 * The button sits on a solid panel so its label stays crisp and AA-contrast in every theme.
 */
export function AccessBand({ id, title, sub, testId }: { id: string; title: string; sub: string; testId: string }) {
  return (
    <section aria-labelledby={id} className="relative overflow-hidden border-t border-hairline">
      <SdkDither shape="warp" matrix="4x4" speed={0.3} scale={0.8} size={3} />
      <div className="relative mx-auto flex max-w-[1280px] flex-col items-start gap-8 px-4 py-20 md:px-8 md:py-28">
        <div className="lp-panel max-w-[760px] p-6 md:p-10">
          <h2 id={id} className="text-4xl leading-[1.05] md:text-6xl">{title}</h2>
          <p className="mt-4 max-w-[52ch] text-base text-muted md:text-lg">{sub}</p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <WipeLink to={ACCESS_PATH} data-testid={testId}
              className="lp-cta-xl inline-flex min-h-[72px] w-full items-center justify-center gap-3 bg-accent px-10 text-xl font-semibold text-accent-ink no-underline transition-transform duration-150 hover:no-underline active:scale-[0.98] sm:w-auto md:min-h-[84px] md:px-14 md:text-2xl">
              Enter the Atlas<ArrowRight size={26} weight="bold" aria-hidden />
            </WipeLink>
            <div className="flex flex-col gap-2 text-[15px]">
              <Link to="/briefing" className="lp-link">Take the 1-minute briefing first</Link>
              <a href={CHALLENGE_URL} target="_blank" rel="noopener noreferrer" className="lp-link inline-flex items-center gap-1">View the challenge<ArrowUpRight size={14} aria-hidden /></a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
