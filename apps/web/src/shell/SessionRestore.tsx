import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PRESETS, type ScenarioId } from '@fire/contracts';
import { Button } from '../components/Button';
import { KEYS, lsGetJson, lsRemove, lsSetJson } from './storage';

interface Saved { path: string; search: string; at: number }
const SKIP = ['/', '/checkout/success', '/checkout/cancel', '/present'];

/** SPEC §7: "Continue where you left off". Saves the last working view and offers it on a bare landing visit. */
export function SessionRestore() {
  const { pathname, search } = useLocation(); const navigate = useNavigate();
  const [saved, setSaved] = useState<Saved | null>(null);

  useEffect(() => { // read once, on first mount only
    const s = lsGetJson<Saved | null>(KEYS.session, null);
    if (s && s.path && !SKIP.includes(s.path) && Date.now() - s.at < 7 * 864e5 && pathname === '/' && !search) setSaved(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (SKIP.includes(pathname) || pathname === '/pricing') return;
    const t = setTimeout(() => lsSetJson(KEYS.session, { path: pathname, search, at: Date.now() } satisfies Saved), 400);
    return () => clearTimeout(t);
  }, [pathname, search]);

  if (!saved || pathname !== '/') return null;
  const h = new URLSearchParams(saved.search).get('h') as ScenarioId | null;
  const where = saved.path === '/atlas' ? 'the atlas' : saved.path.replace('/', '');
  const air = h && h in PRESETS ? PRESETS[h as Exclude<ScenarioId, 'custom'>].label : h === 'custom' ? 'Custom air' : null;
  return (
    <div role="region" aria-label="Continue where you left off" className="border-b border-hairline bg-raised">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-3 px-4 py-2 text-sm">
        <span className="min-w-0 flex-1">Continue where you left off{air ? `: ${air}` : ''} in {where}?</span>
        <Button size="sm" variant="primary" onClick={() => { navigate({ pathname: saved.path, search: saved.search }); setSaved(null); }}>Continue</Button>
        <Button size="sm" variant="ghost" onClick={() => { lsRemove(KEYS.session); setSaved(null); }}>Dismiss</Button>
      </div>
    </div>
  );
}
