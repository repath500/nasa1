import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAtlas } from '../../state/store';
import { useCorpus } from '../../data/useCorpus';
import { GLOSSARY } from '../../components/glossary';
import { Chip } from '../../components/Chip';
import { Skeleton } from '../../components/Skeleton';
import { Candle } from './Candle';
import { Oxygen } from './Oxygen';
import { Incidents } from './Incidents';

const PILLARS = [
  { id: 'prevention', title: 'Prevention', line: 'Stop a fire from starting or spreading.' },
  { id: 'detection', title: 'Detection', line: 'Notice smoke or heat early.' },
  { id: 'suppression', title: 'Suppression', line: 'Put a fire out.' },
] as const;

/** SPEC §3.14. Plain-language explainer. Forces the No-AI path: there are no live AI calls anywhere on this page. */
export default function LearnPage() {
  const state = useCorpus(); const corpus = state.status === 'ready' ? state.corpus : null;
  useEffect(() => { const prev = useAtlas.getState().mode; useAtlas.getState().set({ mode: 'learn' }); return () => { if (useAtlas.getState().mode === 'learn') useAtlas.getState().set({ mode: prev === 'learn' ? 'explore' : prev }); }; }, []);
  return (
    <div className="mx-auto grid max-w-[1200px] gap-12 px-4 pb-20 pt-10 lg:grid-cols-[1fr_300px] lg:pt-16" data-testid="learn">
      <div className="min-w-0 space-y-14">
        <header><h1 className="max-w-[18ch] text-[clamp(2rem,4.6vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.03em]">How fire behaves when nothing falls.</h1>
          <p className="mt-4 max-w-[56ch] text-lg text-muted">A short, plain tour. No account, no live AI, everything here is free.</p></header>
        <Candle />
        <Oxygen />
        <section aria-labelledby="pill-h" className="border-t border-hairline pt-12">
          <h2 id="pill-h" className="text-3xl">Three ways to stay ahead of fire</h2>
          <div className="compartments mt-6 md:grid-cols-3">
            {PILLARS.map((p) => {
              const card = corpus?.cards.find((c) => c.pillarPrimary === p.id);
              return (
                <article key={p.id} className="p-5" aria-labelledby={`pl-${p.id}`}>
                  <h3 id={`pl-${p.id}`} className="text-xl">{p.title}</h3><p className="mt-1 text-sm text-muted">{p.line}</p>
                  {!corpus ? <Skeleton className="mt-4 h-16" /> : card ? (
                    <div className="mt-4 border-t border-hairline pt-3 text-sm">
                      <p className="mono text-xs text-accent">{card.acronym} · {card.accession}{card.fixture && <> <Chip tone="flag">FIXTURE</Chip></>}</p>
                      <p className="mt-1">{card.title}</p>
                      <Link className="mt-2 inline-block" to={`/study/${card.accession}`}>Open this study</Link>
                    </div>
                  ) : <p className="mt-4 text-sm text-muted">No study in this set is tagged {p.id} yet.</p>}
                </article>
              );
            })}
          </div>
        </section>
        <Incidents />
      </div>
      <aside aria-labelledby="gloss-h" className="lg:sticky lg:top-20 lg:self-start">
        <h2 id="gloss-h" className="text-xl">Glossary</h2>
        <dl className="compartments mt-3" data-testid="glossary">
          {Object.values(GLOSSARY).map((g) => <div key={g.term} className="p-3"><dt className="text-sm font-medium">{g.term}</dt><dd className="m-0 mt-1 text-sm text-muted">{g.text}</dd></div>)}
        </dl>
      </aside>
    </div>
  );
}
