import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';
import AppShell from './shell/AppShell';
import { useUrlSync } from './state/url';

/** SPEC §2.1 + §18. Lead owns this file. Features are lazy so each lane can ship independently. */
const L = (f: () => Promise<{ default: React.ComponentType }>) => { const C = lazy(f); return <C />; };
const named = <K extends string>(f: () => Promise<Record<K, React.ComponentType>>, k: K) =>
  L(() => f().then((m) => ({ default: m[k] })));

function Root({ children }: { children?: ReactNode }) {
  useUrlSync();
  return <AppShell><Suspense fallback={null}>{children ?? <Outlet />}</Suspense></AppShell>;
}

export const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      { path: '/', element: L(() => import('./features/landing')) },
      { path: '/briefing', element: L(() => import('./features/briefing')) },
      { path: '/atlas', element: L(() => import('./features/atlas')) },
      { path: '/study/:accession', element: L(() => import('./features/study')) },
      { path: '/compare', element: L(() => import('./features/compare')) },
      { path: '/duel', element: L(() => import('./features/duel')) },
      { path: '/learn', element: L(() => import('./features/learn')) },
      { path: '/present', element: L(() => import('./features/present')) },
      { path: '/brief/:scenario', element: L(() => import('./features/brief')) },
      { path: '/about', element: L(() => import('./features/about')) },
      { path: '/method', element: named(() => import('./features/about'), 'MethodPage') },
      { path: '/credits', element: named(() => import('./features/about'), 'CreditsPage') },
      { path: '/flight-rules', element: named(() => import('./features/eggs'), 'FlightRulesPage') },
      { path: '*', element: L(() => import('./features/notfound')) },
    ],
  },
]);
