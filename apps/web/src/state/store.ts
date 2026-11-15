import { create } from 'zustand';
import {
  DEFAULT_PRIORITY, DEFAULT_TOLERANCES, PRESETS,
  type BaselineKey, type Concern, type FuelPhase, type LadderLevel, type Mode, type PanelTab,
  type PressureUnit, type Scenario, type ScenarioId, type Theme, type Tolerances,
} from '@fire/contracts';

/** SPEC §13. One store, five slices. Continuous values (map transform, audio time) do NOT live here per frame. */
export interface AtlasState {
  // scenario slice
  habitat: ScenarioId;
  custom: { o2Pct: number; totalKpa: number };
  concern: Concern;
  fuelFilter: FuelPhase[];
  /** Material chosen in the wizard or palette, e.g. "PMMA". */
  material: string | null;
  tolerances: Tolerances;
  priority: BaselineKey[];
  // view slice
  mode: Mode;
  theme: Theme;
  unit: PressureUnit;
  expert: boolean;
  panelTab: PanelTab;
  /** Which picture fills the atlas: the Gap Map chart or the dithered Mission view. */
  atlasView: 'gap' | 'mission';
  selectedRowId: string | null;
  highlightedRowIds: string[];
  boxSelection: string[];
  timelineYear: number | null;
  mapDomain: { x: [number, number]; y: [number, number] } | null;
  // ai slice
  ladder: LadderLevel | null;
  // audio slice
  audio: { playing: boolean; following: boolean; scenarioKey: string | null };
  // actions
  set: (patch: Partial<Omit<AtlasState, 'set' | 'scenario'>>) => void;
  scenario: () => Scenario;
}

export const useAtlas = create<AtlasState>((set, get) => ({
  habitat: 'lunar-cabin-example',
  custom: { o2Pct: 30, totalKpa: 70.3 },
  concern: 'prevention',
  fuelFilter: [],
  material: null,
  tolerances: DEFAULT_TOLERANCES,
  priority: DEFAULT_PRIORITY,
  mode: 'explore',
  theme: 'night',
  unit: 'kPa',
  expert: false,
  panelTab: 'studies',
  atlasView: 'gap',
  selectedRowId: null,
  highlightedRowIds: [],
  boxSelection: [],
  timelineYear: null,
  mapDomain: null,
  ladder: null,
  audio: { playing: false, following: true, scenarioKey: null },
  set: (patch) => set(patch),
  scenario: () => {
    const s = get();
    if (s.habitat === 'custom') {
      return { id: 'custom', label: 'Custom air', o2Pct: s.custom.o2Pct, totalKpa: s.custom.totalKpa, sourceNote: 'Set by you', isExample: true };
    }
    return PRESETS[s.habitat];
  },
}));
