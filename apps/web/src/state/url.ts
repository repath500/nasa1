import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { type Concern, type FuelPhase, type Mode, type PanelTab, type PressureUnit, type ScenarioId } from '@fire/contracts';
import { useAtlas, type AtlasState } from './store';

/**
 * SPEC §13 / contracts UrlState. Two-way sync between the query string and the store.
 * - Only the atlas keys below are owned here; every other parameter (compare a/b, duel h1/h2,
 *   any other feature's keys) is preserved untouched.
 * - Back/Forward and pasted links rehydrate the store; our own writes are not re-read (no echo loop).
 * - Committed choices (habitat, concern, fuel, material, mode) push a history entry; continuous
 *   changes (custom O2/pressure drags, selection, tab, units, timeline) replace it.
 */
const HABITATS: ScenarioId[] = ['earth-iss', 'lunar-cabin-example', 'exploration-upper', 'suit', 'custom'];
const CONCERNS: Concern[] = ['prevention', 'detection', 'suppression', 'explore'];
const PHASES: FuelPhase[] = ['solid', 'liquid-droplet', 'gas', 'aerosol', 'unknown'];
const MODES: Mode[] = ['explore', 'briefing', 'listen', 'present', 'learn', 'duel', 'no-ai'];
const TABS: PanelTab[] = ['studies', 'selection', 'ledger', 'notes'];
const UNITS: PressureUnit[] = ['kPa', 'psi', 'atm', 'mmHg'];

const ATLAS_KEYS = ['h', 'o2', 'kpa', 'q', 'f', 'm', 'mode', 'tab', 'sel', 'u', 't', 'ex'] as const;
const COMMITTED_KEYS = ['h', 'q', 'f', 'm', 'mode'] as const;
/** Routes whose view depends on atlas state; other pages (learn, about) keep clean URLs. */
const SYNCED_ROUTES = ['/atlas', '/briefing', '/study', '/compare', '/brief', '/duel'];

type UrlPatch = Partial<Pick<AtlasState, 'habitat' | 'custom' | 'concern' | 'fuelFilter' | 'material' | 'mode' | 'panelTab' | 'selectedRowId' | 'unit' | 'timelineYear' | 'expert'>>;

const isSynced = (pathname: string) => SYNCED_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'));

/** Returns the complete URL-owned slice (defaults for absent keys) when the link carries atlas keys; {} otherwise. */
export function readUrl(search: string): UrlPatch {
  const p = new URLSearchParams(search);
  if (!ATLAS_KEYS.some((key) => p.has(key))) return {};
  const h = p.get('h') as ScenarioId | null;
  const o2 = Number(p.get('o2'));
  const kpa = Number(p.get('kpa'));
  const q = p.get('q') as Concern | null;
  const mode = p.get('mode') as Mode | null;
  const tab = p.get('tab') as PanelTab | null;
  const sel = p.get('sel');
  const u = p.get('u') as PressureUnit | null;
  const t = Number(p.get('t'));
  const m = p.get('m');
  const patch: UrlPatch = {
    habitat: h && HABITATS.includes(h) ? h : 'lunar-cabin-example',
    concern: q && CONCERNS.includes(q) ? q : 'prevention',
    fuelFilter: (p.get('f') ?? '').split(',').filter((x): x is FuelPhase => PHASES.includes(x as FuelPhase)),
    material: m && m.length <= 60 ? m : null,
    mode: mode && MODES.includes(mode) ? mode : 'explore',
    panelTab: tab && TABS.includes(tab) ? tab : 'studies',
    selectedRowId: sel && /^PSI-\d+:\d+$/.test(sel) ? sel : null,
    unit: u && UNITS.includes(u) ? u : 'kPa',
    timelineYear: p.has('t') && Number.isInteger(t) && t > 2000 && t < 2100 ? t : null,
    expert: p.get('ex') === '1',
  };
  if (p.has('o2') && p.has('kpa') && Number.isFinite(o2) && o2 >= 0 && o2 <= 100 && Number.isFinite(kpa) && kpa > 0 && kpa <= 1000) {
    patch.custom = { o2Pct: o2, totalKpa: kpa };
  }
  return patch;
}

/** The atlas keys for the current state, as an ordered list of [key, value]. */
export function atlasParams(s: AtlasState = useAtlas.getState()): [string, string][] {
  const out: [string, string][] = [['h', s.habitat]];
  if (s.habitat === 'custom') out.push(['o2', String(s.custom.o2Pct)], ['kpa', String(s.custom.totalKpa)]);
  out.push(['q', s.concern]);
  if (s.fuelFilter.length) out.push(['f', s.fuelFilter.join(',')]);
  if (s.material) out.push(['m', s.material]);
  if (s.mode !== 'explore') out.push(['mode', s.mode]);
  if (s.panelTab !== 'studies') out.push(['tab', s.panelTab]);
  if (s.selectedRowId) out.push(['sel', s.selectedRowId]);
  if (s.unit !== 'kPa') out.push(['u', s.unit]);
  if (s.timelineYear) out.push(['t', String(s.timelineYear)]);
  if (s.expert) out.push(['ex', '1']);
  return out;
}

/** Merge atlas keys into an existing query string, preserving every non-atlas parameter. */
export function writeUrl(existingSearch: string, s: AtlasState = useAtlas.getState()): string {
  const p = new URLSearchParams(existingSearch);
  for (const key of ATLAS_KEYS) p.delete(key);
  for (const [key, value] of atlasParams(s)) p.set(key, value);
  return p.toString();
}

const committedOf = (search: string) => {
  const p = new URLSearchParams(search);
  return COMMITTED_KEYS.map((key) => p.get(key) ?? '').join('|');
};

/** Mount once inside the router. */
export function useUrlSync() {
  const location = useLocation();
  const navigate = useNavigate();
  const lastWritten = useRef<string | null>(null);
  const hydrating = useRef(false);

  // Rehydrate on every navigation that we did not cause ourselves (first load, Back/Forward, pasted links).
  useEffect(() => {
    const search = location.search.replace(/^\?/, '');
    if (search === lastWritten.current) return;
    const patch = readUrl(search);
    if (Object.keys(patch).length) {
      hydrating.current = true;
      useAtlas.getState().set(patch);
      hydrating.current = false;
    }
  }, [location.key, location.search]);

  // Write atlas keys back when the URL-owned slice changes.
  useEffect(() => {
    let previous = atlasParams().map((entry) => entry.join('=')).join('&');
    return useAtlas.subscribe((state) => {
      if (hydrating.current || !isSynced(window.location.pathname)) return;
      const current = atlasParams(state).map((entry) => entry.join('=')).join('&');
      if (current === previous) return;
      previous = current;
      const existing = window.location.search.replace(/^\?/, '');
      const next = writeUrl(existing, state);
      if (next === existing) return;
      lastWritten.current = next;
      navigate({ search: next }, { replace: committedOf(next) === committedOf(existing) });
    });
  }, [navigate]);

  // Atlas routes opened without keys get them once, so the view is shareable as-is.
  useEffect(() => {
    if (!isSynced(location.pathname)) return;
    const existing = location.search.replace(/^\?/, '');
    if (new URLSearchParams(existing).has('h')) return;
    const next = writeUrl(existing);
    lastWritten.current = next;
    navigate({ search: next }, { replace: true });
  }, [location.pathname, location.search, navigate]);
}

