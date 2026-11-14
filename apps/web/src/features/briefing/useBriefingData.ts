import { useMemo } from 'react';
import type { Corpus, FuelPhase } from '@fire/contracts';
import { useAtlas } from '../../state/store';
import { useCorpus } from '../../data/useCorpus';
import { useUi } from '../../shell/uiStore';
import { countNear, maxO2, type NearCounts } from '../../shell/near';

export interface BriefingData {
  status: 'loading' | 'ready' | 'error'; message?: string; corpus: Corpus | null; counts: NearCounts; solidMax: number | null;
  materials: { name: string; phase: FuelPhase }[];
}
/** Live counts for the wizard. Local helper until @fire/core lands. */
export function useBriefingData(): BriefingData {
  const state = useCorpus();
  const habitat = useAtlas((s) => s.habitat); const custom = useAtlas((s) => s.custom); const tol = useAtlas((s) => s.tolerances);
  const fuel = useAtlas((s) => s.fuelFilter); const material = useAtlas((x) => x.material);
  const corpus = state.status === 'ready' ? state.corpus : null;
  const scenario = useMemo(() => useAtlas.getState().scenario(), [habitat, custom]); // eslint-disable-line react-hooks/exhaustive-deps
  const counts = useMemo(() => (corpus ? countNear(corpus.rows, scenario, tol, fuel, material) : { covers: 0, byPhase: {}, unplaceable: 0, total: 0 }), [corpus, scenario, tol, fuel, material]);
  const solidMax = useMemo(() => (corpus ? maxO2(corpus.rows, 'solid') : null), [corpus]);
  const materials = useMemo(() => {
    const m = new Map<string, FuelPhase>(); corpus?.rows.forEach((r) => { if (r.fuel.name && !m.has(r.fuel.name)) m.set(r.fuel.name, r.fuel.phase); });
    return [...m.entries()].map(([name, phase]) => ({ name, phase })).sort((a, b) => a.name.localeCompare(b.name));
  }, [corpus]);
  return { status: state.status, message: state.status === 'error' ? state.message : undefined, corpus, counts, solidMax, materials };
}
