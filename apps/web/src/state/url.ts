import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Concern, FuelPhase, Mode, PanelTab, PressureUnit, ScenarioId } from '@fire/contracts';
import { useAtlas } from './store';

/** SPEC §13 / contracts UrlState. Two-way sync between the query string and the store. */
const HABITATS: ScenarioId[] = ['earth-iss', 'lunar-cabin-example', 'exploration-upper', 'suit', 'custom'];
const CONCERNS: Concern[] = ['prevention', 'detection', 'suppression', 'explore'];
const PHASES: FuelPhase[] = ['solid', 'liquid-droplet', 'gas', 'aerosol', 'unknown'];
const MODES: Mode[] = ['explore', 'briefing', 'listen', 'present', 'learn', 'duel', 'no-ai'];
const TABS: PanelTab[] = ['studies', 'selection', 'ledger', 'notes'];
const UNITS: PressureUnit[] = ['kPa', 'psi', 'atm', 'mmHg'];

export function readUrl(search: string) {
  const p = new URLSearchParams(search);
  const patch: Record<string, unknown> = {};
  const h = p.get('h') as ScenarioId | null;
  if (h && HABITATS.includes(h)) patch.habitat = h;
  const o2 = Number(p.get('o2')); const kpa = Number(p.get('kpa'));
  if (Number.isFinite(o2) && o2 > 0 && o2 <= 100 && Number.isFinite(kpa) && kpa > 0) patch.custom = { o2Pct: o2, totalKpa: kpa };
  const q = p.get('q') as Concern | null; if (q && CONCERNS.includes(q)) patch.concern = q;
  const f = p.get('f'); if (f) patch.fuelFilter = f.split(',').filter((x): x is FuelPhase => PHASES.includes(x as FuelPhase));
  const m = p.get('m'); if (m && m.length <= 60) patch.material = m;
  const mode = p.get('mode') as Mode | null; if (mode && MODES.includes(mode)) patch.mode = mode;
  const tab = p.get('tab') as PanelTab | null; if (tab && TABS.includes(tab)) patch.panelTab = tab;
  const sel = p.get('sel'); if (sel && /^PSI-\d+:\d+$/.test(sel)) patch.selectedRowId = sel;
  const u = p.get('u') as PressureUnit | null; if (u && UNITS.includes(u)) patch.unit = u;
  const t = Number(p.get('t')); if (Number.isInteger(t) && t > 2000 && t < 2100) patch.timelineYear = t;
  if (p.get('ex') === '1') patch.expert = true;
  return patch;
}

export function writeUrl(): string {
  const s = useAtlas.getState();
  const p = new URLSearchParams();
  p.set('h', s.habitat);
  if (s.habitat === 'custom') { p.set('o2', String(s.custom.o2Pct)); p.set('kpa', String(s.custom.totalKpa)); }
  p.set('q', s.concern);
  if (s.fuelFilter.length) p.set('f', s.fuelFilter.join(','));
  if (s.material) p.set('m', s.material);
  if (s.mode !== 'explore') p.set('mode', s.mode);
  if (s.panelTab !== 'studies') p.set('tab', s.panelTab);
  if (s.selectedRowId) p.set('sel', s.selectedRowId);
  if (s.unit !== 'kPa') p.set('u', s.unit);
  if (s.timelineYear) p.set('t', String(s.timelineYear));
  if (s.expert) p.set('ex', '1');
  return p.toString();
}

/** Mount once inside the router. */
export function useUrlSync() {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => { useAtlas.getState().set(readUrl(location.search)); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => useAtlas.subscribe(() => {
    const next = writeUrl();
    if (next !== location.search.replace(/^\?/, '')) navigate({ search: next }, { replace: true });
  }), [location.search, navigate]);
}
