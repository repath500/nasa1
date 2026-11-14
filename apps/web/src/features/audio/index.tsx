import { useEffect, useId, useReducer, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClosedCaptioning, ListBullets, Pause, Play, SkipBack, SkipForward, Waveform as WaveIcon } from '@phosphor-icons/react';
import type { NarrationCue } from '@fire/contracts';
import { useAtlas } from '../../state/store';
import { Button } from '../../components/Button';
import { Tip } from '../../components/Tooltip';
import { Waveform, usePeaks } from './Waveform';
import { Transcript } from './Transcript';
import { fmtTime, useNarration } from './useNarration';

export { useNarration } from './useNarration';
export { LANDING_FALLBACK } from './landingScript';

const RATES = [0.75, 1, 1.25, 1.5];

// Single instance guard: the shell mounts the bar on /atlas, and AtlasWorkspace may also compose one. The first mounted instance wins.
const owners: string[] = []; const subs = new Set<() => void>();
const notify = () => subs.forEach((f) => f());

/** SPEC §4.3. Audio bar: narration player, chapter ticks, captions, transcript, Follow along. */
export default function AudioBar() {
  const id = useId(); const [, rerender] = useReducer((x: number) => x + 1, 0);
  useEffect(() => { owners.push(id); subs.add(rerender); notify(); return () => { owners.splice(owners.indexOf(id), 1); subs.delete(rerender); notify(); }; }, [id]);
  if (owners[0] !== id) return null;
  return <Bar />;
}

function Bar() {
  const navigate = useNavigate();
  const habitat = useAtlas((s) => s.habitat); const concern = useAtlas((s) => s.concern);
  const audio = useAtlas((s) => s.audio); const mode = useAtlas((s) => s.mode);
  const key = audio.scenarioKey ?? (habitat === 'custom' ? null : `${habitat}__${concern}`);
  const n = useNarration(key);
  const [captions, setCaptions] = useState(true); const [transcript, setTranscript] = useState(false);
  const [paused, setPaused] = useState(false); // following paused by the user
  const barRef = useRef<HTMLDivElement>(null);
  const sliderId = useId();
  const peaks = usePeaks(n.manifest?.audioUrl ?? null, n.manifest?.scriptHash ?? 'none');
  const follow = useRef(audio.following); follow.current = audio.following;

  // Store -> engine (the L key and Listen mode set audio.playing).
  useEffect(() => { if (n.load !== 'ready') return; if (audio.playing && !n.playing) n.play(); else if (!audio.playing && n.playing) n.pause(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [audio.playing, n.load]);
  // Engine -> store.
  useEffect(() => { const s = useAtlas.getState(); if (s.audio.playing !== n.playing && n.load === 'ready') s.set({ audio: { ...s.audio, playing: n.playing } }); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [n.playing]);
  useEffect(() => { const s = useAtlas.getState(); if (s.audio.scenarioKey !== key) s.set({ audio: { ...s.audio, scenarioKey: key } }); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [key]);

  // Cues -> store. Never while the user has taken over.
  useEffect(() => {
    const apply = (cues: NarrationCue[]) => {
      if (!follow.current) return;
      const s = useAtlas.getState();
      for (const c of cues) {
        if (c.kind === 'focusHabitat') s.set({ habitat: c.habitat });
        else if (c.kind === 'highlightRows') s.set({ highlightedRowIds: c.rowIds });
        else if (c.kind === 'filterPhase') s.set({ fuelFilter: c.phases });
        else if (c.kind === 'openLedger') s.set({ panelTab: 'ledger' });
        else if (c.kind === 'openStudy') navigate(`/study/${encodeURIComponent(c.accession)}${window.location.search}`);
        else if (c.kind === 'clear') s.set({ highlightedRowIds: [], fuelFilter: [], panelTab: 'studies' });
      }
    };
    n.onCues(apply); return () => n.onCues(null);
  }, [n, navigate]);

  // Any user interaction in the workspace pauses following.
  useEffect(() => {
    if (!n.playing || !audio.following) return;
    const main = document.getElementById('main'); if (!main) return;
    const stop = (e: Event) => {
      if (barRef.current?.contains(e.target as Node)) return;
      if (e instanceof KeyboardEvent && ['Shift', 'Control', 'Alt', 'Meta', 'Tab'].includes(e.key)) return;
      const s = useAtlas.getState(); s.set({ audio: { ...s.audio, following: false } }); setPaused(true);
    };
    main.addEventListener('pointerdown', stop); main.addEventListener('wheel', stop, { passive: true }); main.addEventListener('keydown', stop);
    return () => { main.removeEventListener('pointerdown', stop); main.removeEventListener('wheel', stop); main.removeEventListener('keydown', stop); };
  }, [n.playing, audio.following]);

  const setFollowing = (v: boolean) => { const s = useAtlas.getState(); s.set({ audio: { ...s.audio, following: v } }); setPaused(false); if (v) { follow.current = true; n.seek(n.position); } };

  // Media Session (lock-screen controls).
  useEffect(() => {
    if (!('mediaSession' in navigator) || !n.manifest) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title: 'Fire Atlas briefing', artist: n.manifest.voice.provider === 'elevenlabs' ? 'AI-generated voice (ElevenLabs)' : 'Device voice', album: n.manifest.scenarioKey });
    navigator.mediaSession.setActionHandler('play', n.play); navigator.mediaSession.setActionHandler('pause', n.pause);
    navigator.mediaSession.setActionHandler('seekbackward', () => n.seek(n.position - 10)); navigator.mediaSession.setActionHandler('seekforward', () => n.seek(n.position + 10));
    try { navigator.mediaSession.setActionHandler('seekto', (d) => { if (typeof d.seekTime === 'number') n.seek(d.seekTime); }); } catch { /* unsupported */ }
    navigator.mediaSession.playbackState = n.playing ? 'playing' : 'paused';
  }, [n]);

  // Space toggles when the bar has focus.
  const onKeyDown = (e: React.KeyboardEvent) => { if (e.key === ' ' && (e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'INPUT') { e.preventDefault(); n.toggle(); } };

  const cur = n.sentences.find((s) => n.position >= s.start && n.position < s.end) ?? n.sentences[0];
  const chapter = n.chapters.filter((c) => c.start <= n.position).pop();
  const label = n.source === 'elevenlabs' ? 'AI-generated voice (ElevenLabs)' : n.source === 'device' ? 'Device voice (your browser, synthetic)' : 'Captions only';
  const disabled = n.load !== 'ready';
  const speed = RATES.includes(n.rate) ? n.rate : 1;

  return (
    <section ref={barRef} onKeyDown={onKeyDown} aria-label="Audio briefing" data-audio-bar data-testid="audio-bar" className="border-t border-strong bg-surface" style={{ position: 'relative', zIndex: 'var(--z-sticky)' as unknown as number }}>
      {paused && n.playing && (
        <div className="absolute -top-11 left-1/2 -translate-x-1/2">
          <Button size="sm" variant="primary" onClick={() => setFollowing(true)} data-testid="resume-following">Resume following</Button>
        </div>
      )}
      {captions && !disabled && cur && (
        <p className="mx-auto max-w-[1100px] truncate px-4 pt-2 text-sm text-ink md:whitespace-normal" data-testid="captions">{cur.text}</p>
      )}
      {n.load === 'missing' && (
        <p className="px-4 pt-2 text-sm text-muted">{habitat === 'custom' ? <>No pre-rendered overview for custom air. Live voice generation is part of the Researcher plan. <Link to="/pricing">See plans</Link>.</> : 'No audio overview has been built for this scenario yet. Everything else still works.'}</p>
      )}
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 md:flex-nowrap">
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Back 10 seconds" disabled={disabled} onClick={() => n.seek(n.position - 10)} className="grid size-9 place-items-center hover:bg-raised disabled:opacity-40"><SkipBack size={18} /></button>
          <button type="button" aria-label={n.playing ? 'Pause briefing' : 'Play briefing'} data-testid="audio-play" disabled={disabled}
            onClick={() => { const s = useAtlas.getState(); s.set({ audio: { ...s.audio, playing: !n.playing, following: true }, ...(n.playing ? {} : {}) }); setPaused(false); }}
            className="grid size-11 place-items-center rounded-[2px] border border-accent bg-accent text-accent-ink active:scale-[0.98] disabled:opacity-40">
            {n.playing ? <Pause size={22} weight="fill" /> : <Play size={22} weight="fill" />}
          </button>
          <button type="button" aria-label="Forward 10 seconds" disabled={disabled} onClick={() => n.seek(n.position + 10)} className="grid size-9 place-items-center hover:bg-raised disabled:opacity-40"><SkipForward size={18} /></button>
        </div>
        <span className="num w-[5.5rem] shrink-0 text-xs text-muted" aria-hidden>{fmtTime(n.position)} / {fmtTime(n.duration)}</span>

        <div className="relative order-last h-10 w-full min-w-0 flex-1 md:order-none md:w-auto">
          <Waveform peaks={peaks} progress={n.duration ? n.position / n.duration : 0} />
          {n.duration > 0 && n.chapters.map((c) => <span key={c.title + c.start} aria-hidden title={c.title} className="pointer-events-none absolute bottom-0 top-0 w-px bg-ink opacity-60" style={{ left: `${(c.start / n.duration) * 100}%` }} />)}
          <label htmlFor={sliderId} className="sr-only">Seek in briefing</label>
          <input id={sliderId} type="range" min={0} max={Math.max(1, Math.floor(n.duration))} step={1} value={Math.floor(n.position)} disabled={disabled}
            onChange={(e) => n.seek(Number(e.target.value))} aria-valuetext={`${fmtTime(n.position)} of ${fmtTime(n.duration)}${chapter ? `, chapter ${chapter.title}` : ''}`}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]" style={{ background: 'transparent' }} />
        </div>

        <div className="flex items-center gap-1">
          <label className="sr-only" htmlFor={`${sliderId}-rate`}>Playback speed</label>
          <select id={`${sliderId}-rate`} value={speed} onChange={(e) => n.setRate(Number(e.target.value))} disabled={disabled} className="num min-h-9 rounded-[2px] border border-strong bg-transparent px-1 text-xs text-ink">
            {RATES.map((r) => <option key={r} value={r} className="bg-surface">{r}x</option>)}
          </select>
          <Tip content="Captions"><button type="button" aria-pressed={captions} aria-label="Captions" onClick={() => setCaptions(!captions)} className={`grid size-9 place-items-center rounded-[2px] border ${captions ? 'border-accent text-accent' : 'border-transparent hover:bg-raised'}`}><ClosedCaptioning size={18} /></button></Tip>
          <Tip content="Transcript"><button type="button" aria-label="Open transcript" disabled={disabled} onClick={() => setTranscript(true)} className="grid size-9 place-items-center rounded-[2px] hover:bg-raised disabled:opacity-40"><ListBullets size={18} /></button></Tip>
          <label className="flex min-h-9 cursor-pointer items-center gap-2 px-1 text-[13px]">
            <input type="checkbox" checked={audio.following} onChange={(e) => setFollowing(e.target.checked)} className="size-4 accent-[var(--color-accent)]" data-testid="follow-toggle" />Follow along
          </label>
        </div>
      </div>
      <p className="mono flex items-center gap-2 px-4 pb-2 text-[11px] text-muted"><WaveIcon size={12} aria-hidden /><span data-testid="voice-label">{label}</span>{mode === 'listen' && <span className="text-accent">· Listen mode</span>}</p>
      <Transcript open={transcript} onOpenChange={setTranscript} n={n} />
    </section>
  );
}
