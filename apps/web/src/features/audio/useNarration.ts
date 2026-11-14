import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NarrationCue, NarrationManifest } from '@fire/contracts';

export interface Sentence { seg: number; text: string; start: number; end: number }
export type VoiceSource = 'elevenlabs' | 'device' | 'captions';
export type LoadState = 'idle' | 'loading' | 'ready' | 'missing';

const WPS = 2.6; // estimated words per second for timelines without timestamps
const wordCount = (t: string) => t.split(/\s+/).filter(Boolean).length;
const splitSentences = (t: string) => t.split(/(?<=[.!?])\s+/).filter(Boolean);

/** Build per-sentence timings: manifest word timestamps when present, else segment times, else estimated reading speed. */
export function buildSentences(m: NarrationManifest): { sentences: Sentence[]; chapters: { title: string; start: number }[]; duration: number } {
  const sentences: Sentence[] = []; const chapters: { title: string; start: number }[] = [];
  let cursor = 0; let wi = 0;
  m.segments.forEach((seg, si) => {
    const parts = splitSentences(seg.text);
    const segStart = seg.startSec ?? cursor;
    const est = parts.map((p) => Math.max(1.2, wordCount(p) / WPS));
    const estTotal = est.reduce((a, b) => a + b, 0);
    const segEnd = seg.endSec ?? segStart + estTotal;
    chapters.push({ title: seg.title, start: segStart });
    let t = segStart;
    parts.forEach((p, i) => {
      const n = wordCount(p);
      let start = t; let end = t + (est[i]! / estTotal) * (segEnd - segStart);
      if (m.words && m.words[wi]) { start = m.words[wi]!.start; const last = m.words[Math.min(m.words.length - 1, wi + n - 1)]; if (last) end = last.end; }
      wi += n; sentences.push({ seg: si, text: p, start, end }); t = end;
    });
    cursor = segEnd;
  });
  return { sentences, chapters, duration: cursor };
}

export function cuesBetween(m: NarrationManifest, from: number, to: number): NarrationCue[] {
  return m.segments.flatMap((s) => s.cues).filter((c) => c.at > from && c.at <= to).sort((a, b) => a.at - b.at);
}
/** The state a seek should land in: the latest cue of each kind at or before `t`. */
export function cuesStateAt(m: NarrationManifest, t: number): NarrationCue[] {
  const all = m.segments.flatMap((s) => s.cues).filter((c) => c.at <= t).sort((a, b) => a.at - b.at);
  const lastClear = all.map((c) => c.kind).lastIndexOf('clear');
  const live = lastClear >= 0 ? all.slice(lastClear + 1) : all;
  const byKind = new Map<string, NarrationCue>(); live.forEach((c) => byKind.set(c.kind, c));
  return [...byKind.values()];
}

export interface Narration {
  load: LoadState; manifest: NarrationManifest | null; source: VoiceSource;
  sentences: Sentence[]; chapters: { title: string; start: number }[]; duration: number;
  playing: boolean; position: number; rate: number;
  play: () => void; pause: () => void; toggle: () => void; seek: (s: number) => void; setRate: (r: number) => void;
  /** Called for each cue crossed during playback, and for the settled state after a seek. */
  onCues: (cb: ((cues: NarrationCue[], reason: 'play' | 'seek') => void) | null) => void;
  audioEl: HTMLAudioElement | null;
}

/**
 * Narration engine (SPEC §4.3). ElevenLabs audio when manifest.audioUrl exists, else speechSynthesis "device voice", else a silent captions clock.
 * Position is held in a ref and published to React at about 10 Hz.
 */
export function useNarration(scenarioKey: string | null, opts: { fallback?: NarrationManifest; wantPlay?: boolean } = {}): Narration {
  const [load, setLoad] = useState<LoadState>('idle');
  const [manifest, setManifest] = useState<NarrationManifest | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [rate, setRateState] = useState(1);
  const cueCb = useRef<((c: NarrationCue[], r: 'play' | 'seek') => void) | null>(null);
  const posRef = useRef(0); const lastCuePos = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const clock = useRef({ base: 0, at: 0 });
  const sentIdx = useRef(0); const playingRef = useRef(false); const rateRef = useRef(1);

  const timeline = useMemo(() => (manifest ? buildSentences(manifest) : { sentences: [], chapters: [], duration: 0 }), [manifest]);
  const tlRef = useRef(timeline); tlRef.current = timeline;
  const source: VoiceSource = manifest?.audioUrl && manifest.voice.provider === 'elevenlabs' ? 'elevenlabs'
    : typeof window !== 'undefined' && 'speechSynthesis' in window ? 'device' : 'captions';
  const sourceRef = useRef(source); sourceRef.current = source;
  const manifestRef = useRef(manifest); manifestRef.current = manifest;

  // Load manifest.
  useEffect(() => {
    let live = true; setManifest(null); setPlaying(false); setPosition(0); posRef.current = 0; lastCuePos.current = 0;
    audioRef.current?.pause(); audioRef.current = null; if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (!scenarioKey) { setLoad('missing'); return; }
    setLoad('loading');
    (async () => {
      let m: NarrationManifest | null = null;
      try {
        const r = await fetch(`/audio/${encodeURIComponent(scenarioKey)}.json`);
        if (r.ok && (r.headers.get('content-type') ?? '').includes('json')) { const j = (await r.json()) as NarrationManifest; if (Array.isArray(j.segments)) m = j; }
      } catch { /* offline or not built */ }
      if (!live) return;
      m ??= opts.fallback ?? null;
      if (!m) { setLoad('missing'); return; }
      setManifest(m); setLoad('ready');
      if (m.audioUrl) {
        const a = new Audio(m.audioUrl); a.preload = 'metadata'; audioRef.current = a;
        a.addEventListener('ended', () => { setPlaying(false); playingRef.current = false; });
        void fetch(m.audioUrl, { priority: 'low' } as RequestInit).catch(() => undefined); // warms the offline cache
      }
    })();
    return () => { live = false; audioRef.current?.pause(); if ('speechSynthesis' in window) window.speechSynthesis.cancel(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioKey]);

  const emitCues = useCallback((to: number, reason: 'play' | 'seek', from: number) => {
    const m = manifestRef.current; if (!m || !cueCb.current) return;
    const cues = reason === 'seek' ? cuesStateAt(m, to) : cuesBetween(m, from, to);
    if (cues.length) cueCb.current(cues, reason);
  }, []);

  const stopSpeech = () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); };
  const speakFrom = useCallback((idx: number) => {
    const sents = tlRef.current.sentences; if (idx >= sents.length) { playingRef.current = false; setPlaying(false); return; }
    sentIdx.current = idx; const s = sents[idx]!;
    clock.current = { base: s.start, at: performance.now() };
    if (sourceRef.current !== 'device') return;
    const u = new SpeechSynthesisUtterance(s.text); u.rate = rateRef.current; u.lang = 'en-GB';
    u.onstart = () => { clock.current = { base: s.start, at: performance.now() }; };
    u.onend = () => { if (playingRef.current && sentIdx.current === idx) speakFrom(idx + 1); };
    window.speechSynthesis.speak(u);
  }, []);

  // Position loop.
  useEffect(() => {
    if (!playing) return;
    let raf = 0; let lastPub = 0;
    const loop = (now: number) => {
      let p: number;
      if (sourceRef.current === 'elevenlabs' && audioRef.current) p = audioRef.current.currentTime;
      else {
        const cur = tlRef.current.sentences[sentIdx.current];
        p = clock.current.base + ((now - clock.current.at) / 1000) * rateRef.current;
        if (sourceRef.current === 'device' && cur) p = Math.min(p, cur.end); // wait for the next utterance to start
        else if (sourceRef.current === 'captions' && cur && p > cur.end) { if (sentIdx.current + 1 < tlRef.current.sentences.length) { sentIdx.current++; } else { playingRef.current = false; setPlaying(false); return; } }
      }
      emitCues(p, 'play', lastCuePos.current); lastCuePos.current = p; posRef.current = p;
      if (now - lastPub > 100) { lastPub = now; setPosition(p); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, emitCues]);

  const play = useCallback(() => {
    if (!manifestRef.current) return;
    if (posRef.current >= tlRef.current.duration - 0.2) { posRef.current = 0; lastCuePos.current = 0; }
    playingRef.current = true; setPlaying(true);
    if (sourceRef.current === 'elevenlabs' && audioRef.current) { audioRef.current.playbackRate = rateRef.current; audioRef.current.currentTime = posRef.current; void audioRef.current.play().catch(() => { playingRef.current = false; setPlaying(false); }); }
    else {
      const idx = Math.max(0, tlRef.current.sentences.findIndex((s) => s.end > posRef.current));
      stopSpeech(); speakFrom(idx);
    }
  }, [speakFrom]);
  const pause = useCallback(() => {
    playingRef.current = false; setPlaying(false); audioRef.current?.pause(); stopSpeech();
    setPosition(posRef.current);
  }, []);
  const seek = useCallback((s: number) => {
    const t = Math.max(0, Math.min(tlRef.current.duration, s));
    posRef.current = t; lastCuePos.current = t; setPosition(t);
    if (audioRef.current) audioRef.current.currentTime = t;
    emitCues(t, 'seek', 0);
    if (playingRef.current && sourceRef.current !== 'elevenlabs') { stopSpeech(); speakFrom(Math.max(0, tlRef.current.sentences.findIndex((x) => x.end > t))); }
    else sentIdx.current = Math.max(0, tlRef.current.sentences.findIndex((x) => x.end > t));
  }, [emitCues, speakFrom]);
  const setRate = useCallback((r: number) => { rateRef.current = r; setRateState(r); if (audioRef.current) audioRef.current.playbackRate = r; if (playingRef.current && sourceRef.current === 'device') { stopSpeech(); speakFrom(sentIdx.current); } }, [speakFrom]);
  const toggle = useCallback(() => (playingRef.current ? pause() : play()), [play, pause]);
  const onCues = useCallback((cb: ((c: NarrationCue[], r: 'play' | 'seek') => void) | null) => { cueCb.current = cb; }, []);

  return { load, manifest, source, sentences: timeline.sentences, chapters: timeline.chapters, duration: timeline.duration || (audioRef.current?.duration ?? 0), playing, position, rate, play, pause, toggle, seek, setRate, onCues, audioEl: audioRef.current };
}

export const fmtTime = (s: number) => { const t = Math.max(0, Math.floor(s)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
