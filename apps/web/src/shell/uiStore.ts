import { create } from 'zustand';
import { KEYS, lsGet, lsSet } from './storage';

/** UI-only state owned by W1. Not URL-synced. */
interface UiState {
  paletteOpen: boolean;
  cheatOpen: boolean;
  navOpen: boolean;
  /** Material chosen in the wizard or palette (store has no material slice yet). */
  material: string | null;
  eggsOff: boolean;
  coachOpen: boolean;
  set: (p: Partial<Omit<UiState, 'set'>>) => void;
}
export const useUi = create<UiState>((set) => ({
  paletteOpen: false, cheatOpen: false, navOpen: false, material: null, coachOpen: false,
  eggsOff: lsGet(KEYS.eggsOff) === '1',
  set: (p) => set(p),
}));
export function setEggsOff(v: boolean) { lsSet(KEYS.eggsOff, v ? '1' : '0'); useUi.getState().set({ eggsOff: v }); }
