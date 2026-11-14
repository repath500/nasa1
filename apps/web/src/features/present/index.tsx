import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, SpeakerHigh, X } from '@phosphor-icons/react';
import { DEFAULT_TOLERANCES, PRESETS } from '@fire/contracts';
import { useAtlas } from '../../state/store';
import { useCorpus } from '../../data/useCorpus';
import { countNear, maxO2 } from '../../shell/near';
import { Kbd } from '../../components/Kbd';
import { isTypingTarget } from '../eggs/keys';
import { BEATS } from './beats';

const AtlasWorkspace = lazy(() => import('../atlas'));
const AudioBar = lazy(() => import('../audio'));

/** SPEC §3.13. Fullscreen, 1.25x type, seven beats. Beats 3 to 5 set real store state and show the live workspace. */
export default function PresentPage() {
  const navigate = useNavigate();
  const [beat, setBeat] = useState(0); const [narr, setNarr] = useState(false); const [elapsed, setElapsed] = useState(0);
  const state = useCorpus(); const corpus = state.status === 'ready' ? state.corpus : null;
  const prev = useRef<{ mode: ReturnType<typeof useAtlas.getState>['mode']; habitat: string } | null>(null);
  const b = BEATS[beat]!;

  useEffect(() => { // enter present mode, restore on exit
    const s = useAtlas.getState(); prev.current = { mode: s.mode, habitat: s.habitat }; s.set({ mode: 'present' });
    const t0 = Date.now(); const id = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 1000);
    return () => { clearInterval(id); const st = useAtlas.getState(); if (st.mode === 'present') st.set({ mode: prev.current?.mode === 'present' ? 'explore' : prev.current?.mode ?? 'explore' }); };
  }, []);
  useEffect(() => { // each beat drives real app state
    const s = useAtlas.getState();
    if (b.kind === 'app') s.set({ habitat: 'lunar-cabin-example', concern: 'prevention', panelTab: b.tab ?? s.panelTab, ...(b.id === 'gap' ? { fuelFilter: [], highlightedRowIds: [], selectedRowId: null } : {}) });
  }, [b]);

  const go = (n: number) => setBeat(Math.min(BEATS.length - 1, Math.max(0, n)));
  const exit = () => navigate({ pathname: '/atlas', search: window.location.search });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); setBeat((x) => Math.min(BEATS.length - 1, x + 1)); }
      else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); setBeat((x) => Math.max(0, x - 1)); }
      else if (e.key === 'Home') setBeat(0); else if (e.key === 'End') setBeat(BEATS.length - 1);
      else if (e.key.toLowerCase() === 'n') setNarr((v) => !v);
      else if (e.key === 'Escape' && !document.querySelector('[role="dialog"]')) exit();
      else if (e.key.toLowerCase() === 'f') { if (document.fullscreenElement) void document.exitFullscreen(); else void document.documentElement.requestFullscreen?.().catch(() => undefined); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ctx = useMemo(() => ({
    nearMoon: corpus ? countNear(corpus.rows, PRESETS['lunar-cabin-example'], DEFAULT_TOLERANCES).covers : null,
    solidMax: corpus ? maxO2(corpus.rows, 'solid') : null,
    rows: corpus?.rows.length ?? null, cards: corpus?.cards.length ?? null, rejects: corpus?.rejects.length ?? null,
  }), [corpus]);

  const app = b.kind === 'app';
  const mm = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;
  return (
    <div className="group fixed inset-0 flex flex-col bg-bg" data-testid="present" role="region" aria-roledescription="presentation" aria-label={`Present mode, beat ${beat + 1} of ${BEATS.length}: ${b.title}`}>
      {/* live workspace, mounted for the app beats */}
      <div className={`absolute inset-0 ${narr ? '' : '[&_[data-audio-bar]]:hidden'} ${app ? '' : 'invisible'}`} aria-hidden={!app}>
        {(app || beat > 2) && <Suspense fallback={null}><AtlasWorkspace /></Suspense>}
      </div>
      {app ? (
        <div className="pointer-events-none absolute bottom-6 left-6 z-20 max-w-[min(560px,calc(100vw-48px))]">
          <div className="pointer-events-auto border border-strong bg-surface p-5" data-testid="beat-card" aria-live="polite">{b.render(ctx)}</div>
        </div>
      ) : (
        <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-center overflow-auto px-[max(1.5rem,6vw)] py-12" data-testid="beat-slide" key={b.id}>{b.render(ctx)}</div>
      )}

      {/* chrome: appears on hover or focus only */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between p-4 opacity-0 transition-opacity duration-[var(--dur-fade)] group-focus-within:opacity-100 group-hover:opacity-100">
        <p className="pointer-events-auto num border border-hairline bg-surface px-3 py-1.5 text-sm" data-testid="beat-counter">{beat + 1} / {BEATS.length} · {b.title} · {mm}</p>
        <div className="pointer-events-auto flex gap-2">
          <button type="button" onClick={() => setNarr(!narr)} aria-pressed={narr} className={`inline-flex min-h-10 items-center gap-2 border px-3 text-sm ${narr ? 'border-accent bg-accent text-accent-ink' : 'border-strong bg-surface'}`}><SpeakerHigh size={16} aria-hidden />Narration <Kbd>N</Kbd></button>
          <button type="button" onClick={exit} className="inline-flex min-h-10 items-center gap-2 border border-strong bg-surface px-3 text-sm"><X size={16} aria-hidden />Exit <Kbd>Esc</Kbd></button>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-center justify-end gap-2 p-4 opacity-0 transition-opacity duration-[var(--dur-fade)] group-focus-within:opacity-100 group-hover:opacity-100">
        <button type="button" aria-label="Previous beat" onClick={() => go(beat - 1)} disabled={beat === 0} data-testid="beat-prev" className="pointer-events-auto grid size-11 place-items-center border border-strong bg-surface disabled:opacity-40"><ArrowLeft size={18} /></button>
        <button type="button" aria-label="Next beat" onClick={() => go(beat + 1)} disabled={beat === BEATS.length - 1} data-testid="beat-next" className="pointer-events-auto grid size-11 place-items-center border border-accent bg-accent text-accent-ink disabled:opacity-40"><ArrowRight size={18} /></button>
      </div>
      <div className="absolute inset-x-0 top-0 z-30 flex h-1 gap-px" aria-hidden>{BEATS.map((x, i) => <span key={x.id} className={`h-full flex-1 ${i <= beat ? 'bg-accent' : 'bg-hairline'}`} />)}</div>
      {narr && <div className="absolute inset-x-0 bottom-0 z-40"><Suspense fallback={null}><AudioBar /></Suspense></div>}
    </div>
  );
}
