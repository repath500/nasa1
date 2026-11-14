import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PRESETS, type ScenarioId, type Theme } from '@fire/contracts';
import { useAtlas } from '../state/store';
import { useUi, setEggsOff } from './uiStore';
import { redo, undo } from './history';
import { eggConsumedLastKey, isTypingTarget } from '../features/eggs/keys';
import { Sheet } from '../components/Sheet';
import { Kbd } from '../components/Kbd';
import { toast } from '../components/ToastHost';
import { KEYS, lsSet } from './storage';

export const HABITAT_KEYS: ScenarioId[] = ['earth-iss', 'lunar-cabin-example', 'exploration-upper', 'suit', 'custom'];
const THEMES: Theme[] = ['night', 'paper', 'contrast'];
export const THEME_LABEL: Record<Theme, string> = { night: 'Night Ops', paper: 'Paper', contrast: 'High Contrast' };

export function cycleTheme() {
  const s = useAtlas.getState();
  const next = THEMES[(THEMES.indexOf(s.theme) + 1) % THEMES.length]!;
  s.set({ theme: next }); lsSet(KEYS.theme, next);
  toast(`Theme: ${THEME_LABEL[next]}`);
}
/** Map and table keys belong to other lanes. The shell announces them as a window event: detail.action. */
export const emitShortcut = (action: 'fit' | 'mark-nav' | 'prev-row' | 'next-row') => window.dispatchEvent(new CustomEvent('fa:shortcut', { detail: { action } }));

export function useListen() {
  const navigate = useNavigate(); const { pathname, search } = useLocation();
  return () => {
    const s = useAtlas.getState();
    if (s.mode === 'listen') { s.set({ mode: 'explore', audio: { ...s.audio, playing: false } }); return; }
    s.set({ mode: 'listen', audio: { ...s.audio, playing: true, following: true } });
    if (pathname !== '/atlas') navigate({ pathname: '/atlas', search });
  };
}

export function useShortcuts() {
  const navigate = useNavigate(); const { pathname } = useLocation();
  const toggleListen = useListen();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const ui = useUi.getState(); const s = useAtlas.getState();
      if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); ui.set({ paletteOpen: !ui.paletteOpen }); return; }
      if (isTypingTarget(e.target)) return;
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
      if (mod || e.altKey) return;
      if (eggConsumedLastKey()) return; // a secret word is being typed
      if (document.querySelector('[role="dialog"][data-state="open"]') && e.key !== '?') return;
      const k = e.key;
      if (k === '/') { e.preventDefault(); ui.set({ paletteOpen: true }); return; }
      if (k === '?') { e.preventDefault(); ui.set({ cheatOpen: !ui.cheatOpen }); return; }
      if (/^[1-5]$/.test(k)) { s.set({ habitat: HABITAT_KEYS[Number(k) - 1]! }); toast(`Habitat: ${HABITAT_KEYS[Number(k) - 1] === 'custom' ? 'Custom air' : PRESETS[HABITAT_KEYS[Number(k) - 1] as Exclude<ScenarioId, 'custom'>].label}`); return; }
      switch (k.toLowerCase()) {
        case 'e': s.set({ expert: !s.expert }); toast(s.expert ? 'Expert mode off' : 'Expert mode on'); break;
        case 'l': toggleListen(); break;
        case 'p': navigate(pathname === '/present' ? '/atlas' : '/present'); break;
        case 't': cycleTheme(); break;
        case '0': emitShortcut('fit'); break;
        case 'm': emitShortcut('mark-nav'); break;
        case '[': emitShortcut('prev-row'); break;
        case ']': emitShortcut('next-row'); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, pathname, toggleListen]);
}

const ROWS: { keys: string[]; what: string }[] = [
  { keys: ['/', '⌘K'], what: 'Open the command palette and Ask' },
  { keys: ['1', '…', '5'], what: 'Switch habitat (ISS, Moon, Exploration, Suit, Custom)' },
  { keys: ['E'], what: 'Expert mode: raw columns and units as written' },
  { keys: ['L'], what: 'Listen mode: the briefing drives the map' },
  { keys: ['P'], what: 'Present mode' },
  { keys: ['T'], what: 'Cycle theme: Night Ops, Paper, High Contrast' },
  { keys: ['0'], what: 'Fit all marks on the map' },
  { keys: ['M'], what: 'Mark navigation on the map' },
  { keys: ['[', ']'], what: 'Previous or next source row' },
  { keys: ['⌘Z', '⇧⌘Z'], what: 'Undo or redo a habitat, concern or filter change' },
  { keys: ['?'], what: 'This sheet' },
  { keys: ['Esc'], what: 'Close drawers and dialogs' },
];

export function CheatSheet() {
  const open = useUi((s) => s.cheatOpen); const eggsOff = useUi((s) => s.eggsOff);
  return (
    <Sheet open={open} onOpenChange={(o) => useUi.getState().set({ cheatOpen: o })} title="Keyboard shortcuts and settings" description="Single keys work when you are not typing in a field.">
      <ul className="compartments" aria-label="Shortcuts">
        {ROWS.map((r) => (
          <li key={r.what} className="flex items-center justify-between gap-4 p-3 text-sm">
            <span>{r.what}</span>
            <span className="flex shrink-0 gap-1">{r.keys.map((k) => <Kbd key={k}>{k}</Kbd>)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 space-y-3 border-t border-hairline pt-4">
        <button type="button" className="flex min-h-10 w-full items-center justify-between rounded-[2px] border border-strong px-3 text-left text-sm hover:border-accent"
          onClick={() => { useUi.getState().set({ cheatOpen: false, coachOpen: true }); }}>
          <span>Replay the atlas tour</span><span className="text-muted">3 steps</span>
        </button>
        <label className="flex min-h-10 cursor-pointer items-center justify-between gap-3 text-sm">
          <span>Hide hidden surprises<span className="block text-xs text-muted">One switch for every easter egg.</span></span>
          <input type="checkbox" checked={eggsOff} onChange={(e) => setEggsOff(e.target.checked)} className="size-5 accent-[var(--color-accent)]" />
        </label>
      </div>
    </Sheet>
  );
}
