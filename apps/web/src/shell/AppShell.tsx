import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAtlas } from '../state/store';
import { TooltipProvider } from '../components/Tooltip';
import { ToastHost } from '../components/ToastHost';
import CommandPalette from '../features/palette';
import EggHost from '../features/eggs';
import { TopBar } from './TopBar';
import { Footer } from './Footer';
import { CheatSheet, useShortcuts } from './shortcuts';
import { SessionRestore } from './SessionRestore';
import { ErrorBoundary } from './ErrorBoundary';
import { startHistory } from './history';
import { registerServiceWorker } from './sw';
import { KEYS, lsGet } from './storage';
import type { PressureUnit, Theme } from '@fire/contracts';

const AudioBar = lazy(() => import('../features/audio'));
const FIXED = ['/atlas', '/duel'];

/** SPEC §2 + §7. Receives children from the router. Theme lives on <html data-theme>, mode on <html data-mode>. */
export default function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const theme = useAtlas((s) => s.theme); const mode = useAtlas((s) => s.mode); const expert = useAtlas((s) => s.expert);
  useShortcuts();

  useEffect(() => { // restore saved theme and unit once, then register history and the service worker
    const st = lsGet(KEYS.theme) as Theme | null; const su = lsGet(KEYS.unit) as PressureUnit | null;
    const patch: Record<string, unknown> = {};
    if (st === 'paper' || st === 'night' || st === 'contrast') patch.theme = st;
    if (su === 'psi' || su === 'atm' || su === 'mmHg' || su === 'kPa') patch.unit = su;
    const q = new URLSearchParams(window.location.search);
    if (q.get('u')) delete patch.unit;
    if (Object.keys(patch).length) useAtlas.getState().set(patch);
    startHistory(); registerServiceWorker();
  }, []);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  useEffect(() => { document.documentElement.dataset.mode = mode; document.documentElement.dataset.expert = expert ? '1' : '0'; }, [mode, expert]);
  useEffect(() => { // new route: reset scroll and move focus to the main region for screen readers
    const m = document.getElementById('main'); if (m && !FIXED.includes(pathname)) { window.scrollTo(0, 0); }
  }, [pathname]);

  const present = pathname === '/present';
  const fixed = FIXED.includes(pathname);
  return (
    <TooltipProvider>
      <div className={`flex flex-col ${fixed ? 'h-[100dvh] overflow-hidden' : 'min-h-[100dvh]'}`}>
        <a href="#main" className="skip-link">Skip to content</a>
        {!present && <TopBar />}
        {!present && <SessionRestore />}
        <main id="main" tabIndex={-1} className={`min-h-0 flex-1 outline-none ${fixed ? 'relative overflow-auto' : ''}`}>
          <ErrorBoundary resetKey={pathname}>{children}</ErrorBoundary>
        </main>
        {pathname === '/atlas' && <ErrorBoundary resetKey="audio"><Suspense fallback={<div className="h-14 border-t border-hairline" aria-hidden />}><AudioBar /></Suspense></ErrorBoundary>}
        {!fixed && !present && <Footer />}
      </div>
      <CommandPalette />
      <CheatSheet />
      <EggHost />
      <ToastHost />
      <div aria-hidden className="grain" />
    </TooltipProvider>
  );
}
