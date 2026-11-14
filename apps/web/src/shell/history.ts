import { useAtlas, type AtlasState } from '../state/store';
import { PRESETS } from '@fire/contracts';
import { toast } from '../components/ToastHost';

/** Undo/redo for scenario changes (SPEC §7): habitat, custom air, concern, fuel filter, tolerances, priority. */
type Snap = Pick<AtlasState, 'habitat' | 'custom' | 'concern' | 'fuelFilter' | 'tolerances' | 'priority'>;
const pick = (s: AtlasState): Snap => ({ habitat: s.habitat, custom: s.custom, concern: s.concern, fuelFilter: s.fuelFilter, tolerances: s.tolerances, priority: s.priority });
const key = (s: Snap) => JSON.stringify(s);

let past: Snap[] = []; let future: Snap[] = []; let last: Snap | null = null; let restoring = false; let started = false;
let lastPushAt = 0; let baselineUntil = 0;

export function describeChange(from: Snap, to: Snap): string {
  if (from.habitat !== to.habitat) return `habitat to ${to.habitat === 'custom' ? 'Custom air' : PRESETS[to.habitat].label}`;
  if (from.concern !== to.concern) return `concern to ${to.concern}`;
  if (key({ ...from, habitat: 'earth-iss' } as Snap) !== key({ ...to, habitat: 'earth-iss' } as Snap)) {
    if (JSON.stringify(from.fuelFilter) !== JSON.stringify(to.fuelFilter)) return 'fuel filter';
    if (JSON.stringify(from.custom) !== JSON.stringify(to.custom)) return 'custom air';
    if (JSON.stringify(from.tolerances) !== JSON.stringify(to.tolerances)) return 'tolerances';
    return 'ranking priorities';
  }
  return 'change';
}

export function startHistory() {
  if (started) return; started = true;
  last = pick(useAtlas.getState()); baselineUntil = Date.now() + 1200;
  useAtlas.subscribe((state) => {
    if (restoring) return;
    const now = pick(state);
    if (last && key(now) === key(last)) return;
    if (Date.now() < baselineUntil) { last = now; return; } // initial URL load is the baseline
    if (last) {
      // Coalesce a drag into one entry.
      if (Date.now() - lastPushAt > 600 || !past.length) past.push(last);
      lastPushAt = Date.now();
      if (past.length > 50) past.shift();
    }
    future = []; last = now;
  });
}
const apply = (snap: Snap) => { restoring = true; useAtlas.getState().set(snap); last = snap; restoring = false; };

export function undo() {
  const prev = past.pop(); if (!prev || !last) { toast('Nothing to undo'); return; }
  const cur = last; future.push(cur); apply(prev); toast(`Undid ${describeChange(prev, cur)}`);
}
export function redo() {
  const next = future.pop(); if (!next || !last) { toast('Nothing to redo'); return; }
  const cur = last; past.push(cur); apply(next); toast(`Redid ${describeChange(cur, next)}`);
}
export const canUndo = () => past.length > 0;
