import { Pause, Play } from '@phosphor-icons/react';
import { LANDING_FALLBACK, useNarration } from '../audio';
import { fmtTime } from '../audio/useNarration';

/** Plays the 30 second landing overview with captions. Falls back to device voice or captions-only when no audio is built. */
export function AudioTeaser() {
  const n = useNarration('landing', { fallback: LANDING_FALLBACK });
  const cur = n.sentences.find((s) => n.position >= s.start && n.position < s.end) ?? n.sentences[0];
  const label = n.source === 'elevenlabs' ? 'AI-generated voice (ElevenLabs)' : n.source === 'device' ? 'Device voice (your browser, synthetic)' : 'Captions only';
  return (
    <section aria-labelledby="audio-h" className="border-t border-hairline">
      <div className="mx-auto grid max-w-[1200px] items-center gap-8 px-4 py-16 lg:grid-cols-[auto_1fr] lg:gap-14 lg:py-24">
        <button type="button" onClick={n.toggle} disabled={n.load !== 'ready'} data-testid="landing-audio-play" aria-label={n.playing ? 'Pause the 30 second overview' : 'Play the 30 second overview'}
          className="grid size-24 place-items-center rounded-[2px] border border-accent bg-accent text-accent-ink transition-transform active:scale-[0.98] disabled:opacity-50">
          {n.playing ? <Pause size={36} weight="fill" /> : <Play size={36} weight="fill" />}
        </button>
        <div>
          <h2 id="audio-h" className="text-3xl md:text-4xl">Hear the 30 second version.</h2>
          <p className="mt-4 min-h-[3.5rem] max-w-[60ch] text-lg" data-testid="landing-caption" aria-live="off">{cur?.text ?? 'Loading the overview.'}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
            <span className="num">{fmtTime(n.position)} / {fmtTime(n.duration)}</span>
            <span className="mono">{label}</span>
            {n.manifest && <span>{n.manifest.disclosure}</span>}
          </div>
          <div className="mt-3 h-1 bg-raised" aria-hidden><div className="h-1 bg-accent" style={{ width: `${n.duration ? (n.position / n.duration) * 100 : 0}%` }} /></div>
        </div>
      </div>
    </section>
  );
}
