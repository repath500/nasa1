import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { CircleHalf, Command, Flame, Link as LinkIcon, List, Moon, PresentationChart, Sliders, Sun, SpeakerHigh } from '@phosphor-icons/react';
import type { PressureUnit, Theme } from '@fire/contracts';
import { useAtlas } from '../state/store';
import { StatusChip, type Status } from '../components/StatusChip';
import { Tip } from '../components/Tooltip';
import { Kbd } from '../components/Kbd';
import { Sheet } from '../components/Sheet';
import { toast } from '../components/ToastHost';
import { useHealth } from './api';
import { useUi } from './uiStore';
import { cycleTheme, THEME_LABEL, useListen } from './shortcuts';
import { KEYS, lsSet } from './storage';

const NAV = [{ to: '/atlas', label: 'Atlas' }, { to: '/learn', label: 'Learn' }, { to: '/pricing', label: 'Pricing' }, { to: '/about', label: 'About' }] as const;
const UNITS: PressureUnit[] = ['kPa', 'psi', 'atm', 'mmHg'];
const THEME_ICON: Record<Theme, typeof Moon> = { night: Moon, paper: Sun, contrast: CircleHalf };

export function useStatus(): Status {
  const h = useHealth(); const mode = useAtlas((s) => s.mode); const ladder = useAtlas((s) => s.ladder);
  if (mode === 'no-ai' || mode === 'learn') return { kind: 'no-ai' };
  if (h.status === 'offline') return { kind: 'offline' };
  if (h.status === 'loading') return { kind: 'fixture' };
  const s = h.health.services;
  if (!s.jev && !s.gemini) return { kind: 'fixture' };
  if (ladder === 'L2-cache') return { kind: 'cached', date: new Date(h.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) };
  if (ladder === 'L3-baseline') return { kind: 'no-ai' };
  return { kind: 'live' };
}

export async function copyLink() {
  try { await navigator.clipboard.writeText(window.location.href); toast('Link copied'); }
  catch { toast('Copy failed. Copy the address bar instead.'); }
}

function ToggleBtn({ pressed, onClick, icon: Icon, label, kbd, testId }: { pressed: boolean; onClick: () => void; icon: typeof Moon; label: string; kbd: string; testId: string }) {
  return (
    <Tip content={<span className="flex items-center gap-2">{label} <Kbd>{kbd}</Kbd></span>}>
      <button type="button" aria-pressed={pressed} aria-label={label} data-testid={testId} onClick={onClick}
        className={`inline-flex min-h-10 min-w-10 items-center justify-center gap-2 rounded-[2px] border px-2.5 text-[13px] transition-colors duration-[var(--dur-step)] active:scale-[0.98] ${pressed ? 'border-accent bg-accent text-accent-ink' : 'border-transparent hover:bg-raised'}`}>
        <Icon size={18} aria-hidden /><span className="hidden xl:inline">{label.replace(' mode', '')}</span>
      </button>
    </Tip>
  );
}

function Controls({ stacked = false }: { stacked?: boolean }) {
  const s = useAtlas(); const toggleListen = useListen(); const navigate = useLocation();
  const ThemeIcon = THEME_ICON[s.theme];
  return (
    <div className={stacked ? 'flex flex-col items-stretch gap-2' : 'flex items-center gap-1'}>
      <ToggleBtn testId="toggle-expert" pressed={s.expert} icon={Sliders} label="Expert mode" kbd="E" onClick={() => s.set({ expert: !s.expert })} />
      <ToggleBtn testId="toggle-listen" pressed={s.mode === 'listen'} icon={SpeakerHigh} label="Listen mode" kbd="L" onClick={toggleListen} />
      <Tip content={<span className="flex items-center gap-2">Present mode <Kbd>P</Kbd></span>}>
        <Link to="/present" aria-label="Present mode" data-testid="toggle-present" aria-current={navigate.pathname === '/present' ? 'page' : undefined}
          className="inline-flex min-h-10 min-w-10 items-center justify-center gap-2 rounded-[2px] border border-transparent px-2.5 text-[13px] text-ink no-underline hover:bg-raised">
          <PresentationChart size={18} aria-hidden /><span className="hidden xl:inline">Present</span>
        </Link>
      </Tip>
      <Tip content={<span className="flex items-center gap-2">Theme: {THEME_LABEL[s.theme]} <Kbd>T</Kbd></span>}>
        <button type="button" aria-label={`Theme: ${THEME_LABEL[s.theme]}. Change theme`} data-testid="toggle-theme" onClick={cycleTheme}
          className="inline-flex min-h-10 min-w-10 items-center justify-center gap-2 rounded-[2px] border border-transparent px-2.5 text-[13px] hover:bg-raised">
          <ThemeIcon size={18} aria-hidden /><span className="hidden xl:inline">{THEME_LABEL[s.theme]}</span>
        </button>
      </Tip>
      <label className="relative inline-flex min-h-10 items-center">
        <span className="sr-only">Pressure unit</span>
        <select value={s.unit} data-testid="unit-select" onChange={(e) => { const u = e.target.value as PressureUnit; s.set({ unit: u }); lsSet(KEYS.unit, u); }}
          className="mono min-h-10 rounded-[2px] border border-transparent bg-transparent px-2 text-[13px] text-ink hover:bg-raised">
          {UNITS.map((u) => <option key={u} value={u} className="bg-surface">{u}</option>)}
        </select>
      </label>
      <Tip content="Copy link to this exact view">
        <button type="button" onClick={() => void copyLink()} data-testid="copy-link" aria-label="Copy link"
          className="inline-flex min-h-10 min-w-10 items-center justify-center gap-2 rounded-[2px] border border-transparent px-2.5 text-[13px] hover:bg-raised">
          <LinkIcon size={18} aria-hidden /><span className="hidden 2xl:inline">Copy link</span>
        </button>
      </Tip>
    </div>
  );
}

export function TopBar() {
  const [menu, setMenu] = useState(false);
  const status = useStatus();
  return (
    <header className="border-b border-hairline bg-bg" style={{ position: 'sticky', top: 0, zIndex: 'var(--z-sticky)' as unknown as number }}>
      <div className="mx-auto flex h-14 max-w-[1800px] items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2 text-ink no-underline hover:no-underline" aria-label="Fire Atlas, home">
          <Flame size={22} weight="fill" className="text-accent" aria-hidden />
          <span className="text-[17px] font-semibold tracking-tight">Fire Atlas</span>
        </Link>
        <nav aria-label="Primary" className="ml-4 hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => `inline-flex min-h-10 items-center border-b-2 px-3 text-sm no-underline hover:no-underline ${isActive ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'}`}>{n.label}</NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden sm:inline-flex"><StatusChip status={status} /></span>
          <div className="hidden lg:block"><Controls /></div>
          <button type="button" data-testid="open-palette" onClick={() => useUi.getState().set({ paletteOpen: true })}
            className="inline-flex min-h-10 items-center gap-2 rounded-[2px] border border-strong px-3 text-[13px] text-muted hover:border-accent hover:text-ink" aria-label="Open command palette">
            <Command size={16} aria-hidden /><span className="hidden md:inline">Search or ask</span><Kbd className="hidden md:inline-flex">⌘K</Kbd>
          </button>
          <button type="button" className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-[2px] border border-strong lg:hidden" aria-label="Open menu" onClick={() => setMenu(true)}><List size={20} /></button>
        </div>
      </div>
      <Sheet open={menu} onOpenChange={setMenu} title="Menu">
        <nav aria-label="Primary mobile" className="compartments mb-6">
          {NAV.map((n) => <NavLink key={n.to} to={n.to} onClick={() => setMenu(false)} className="flex min-h-12 items-center px-4 text-base text-ink no-underline">{n.label}</NavLink>)}
        </nav>
        <div className="mb-4"><StatusChip status={status} /></div>
        <Controls stacked />
      </Sheet>
    </header>
  );
}
