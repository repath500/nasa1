import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from '@phosphor-icons/react';
import { PRESETS, type ScenarioId } from '@fire/contracts';
import { useAtlas } from '../../state/store';
import { useCorpus } from '../../data/useCorpus';
import { Button } from '../../components/Button';
import { NumberTween } from '../../components/NumberTween';
import { Skeleton } from '../../components/Skeleton';

const OrbitScene = lazy(() => import('../orbit'));
const hint = (target: ScenarioId | null) => window.dispatchEvent(new CustomEvent('fa:orbit-hint', { detail: { target } }));
const BODIES: { id: Exclude<ScenarioId, 'custom' | 'suit'>; name: string }[] = [
  { id: 'earth-iss', name: 'Earth air' }, { id: 'lunar-cabin-example', name: 'Moon' }, { id: 'exploration-upper', name: 'Exploration atmosphere' },
];

/** SPEC §3.1: asymmetric split, two CTAs, live readout from the loaded corpus. */
export function Hero() {
  const navigate = useNavigate(); const corpus = useCorpus();
  const pick = (id: ScenarioId) => { useAtlas.getState().set({ habitat: id }); if (id === 'lunar-cabin-example') window.dispatchEvent(new CustomEvent('fa:moon-click')); };
  const c = corpus.status === 'ready' ? corpus.corpus : null;
  return (
    <section aria-labelledby="hero-h" className="mx-auto grid max-w-[1200px] gap-10 px-4 pb-16 pt-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14 lg:pb-24 lg:pt-20">
      <div className="flex flex-col justify-center">
        <h1 id="hero-h" className="text-[clamp(2.25rem,5.2vw,4rem)] font-semibold leading-[1.04] tracking-[-0.035em]">Where will astronauts breathe, and has NASA tested fire there?</h1>
        <p className="mt-5 max-w-[46ch] text-lg text-muted">Test conditions from NASA microgravity fire experiments, mapped against the air of future habitats. Every dot opens its source.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <span onMouseEnter={() => hint('lunar-cabin-example')} onMouseLeave={() => hint(null)} onFocus={() => hint('lunar-cabin-example')} onBlur={() => hint(null)}>
            <Button variant="primary" size="lg" data-testid="cta-briefing" onClick={() => navigate('/briefing')} icon={<ArrowRight size={18} aria-hidden />}>Start briefing</Button>
          </span>
          <Button size="lg" data-testid="cta-explore" onClick={() => navigate('/atlas')}>Explore the map</Button>
        </div>
        <dl className="compartments mt-12 max-w-[480px] grid-cols-3" aria-label="What is loaded">
          {([['tests parsed', c?.rows.length], ['investigations', c?.cards.length], ['cells rejected', c?.rejects.length]] as const).map(([k, v]) => (
            <div key={k} className="p-3">
              <dd className="m-0 text-2xl font-semibold">{v === undefined ? <Skeleton className="h-8 w-12" /> : <NumberTween value={v} />}</dd>
              <dt className="text-xs text-muted">{k}</dt>
            </div>
          ))}
        </dl>
        {c?.fixture && <p className="mt-2 text-xs text-flag">FIXTURE data is loaded. Counts are examples, not the archive.</p>}
      </div>
      <figure className="m-0">
        <div className="relative aspect-[4/5] max-h-[560px] w-full overflow-hidden border border-hairline bg-surface sm:aspect-square lg:aspect-[4/5]" data-testid="orbit-container">
          <Suspense fallback={<Skeleton className="absolute inset-0" label="Loading orbit scene" />}><div className="absolute inset-0 [&_main]:p-0"><OrbitScene /></div></Suspense>
        </div>
        <figcaption className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          <span>Habitats to try:</span>
          {BODIES.map((b) => <button key={b.id} type="button" onClick={() => pick(b.id)} title={`${PRESETS[b.id].o2Pct}% O₂ at ${PRESETS[b.id].totalKpa} kPa`} className="border-0 bg-transparent p-0 text-accent underline underline-offset-4 hover:text-ink">{b.name}</button>)}
        </figcaption>
      </figure>
    </section>
  );
}
