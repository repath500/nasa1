/** SPEC §9. Registry of easter eggs. Never on data surfaces or inside numbers, never near the incident content, one global off switch. */
export interface Egg { id: string; trigger: string; where: string; description: string }

export const EGGS: Egg[] = [
  { id: 'candle', trigger: 'Type "candle" outside a field', where: 'anywhere except Learn incidents', description: 'The dither plate flame morphs from a teardrop to a sphere (challenge text).' },
  { id: 'moon', trigger: 'Click the Moon three times', where: 'landing hero caption or orbit scene', description: 'Partial pressure card (UI_SPEC S1).' },
  { id: 'konami', trigger: 'Konami code', where: 'anywhere', description: 'Unlocks /flight-rules.' },
  { id: 'console', trigger: 'Open the browser console', where: 'any page', description: 'ASCII flame with corpus hash and counts.' },
  { id: 'ledger-3400', trigger: 'Hover the 3400% cell for 3 seconds', where: 'Caught by code ledger', description: 'Tooltip from the ledger (LedgerEggTip).' },
  { id: '404', trigger: 'Visit a missing page', where: '*', description: 'Drifting dithered droplet.' },
  { id: 'timeline-end', trigger: 'Play the timeline to the end', where: 'timeline', description: 'Status line with real counts (fa:timeline-end).' },
  { id: 'cool-flames', trigger: 'Type "cool flames" in the palette', where: 'palette', description: 'Opens the CFI study.' },
];

export const CANDLE_CAPTION = 'In microgravity there is no buoyancy, so a candle flame becomes a dim blue sphere.';
export const MOON_CARD = '30% O₂ at 10.2 psi has almost the same O₂ partial pressure as Earth air. That does not make it equally flammable.';
export const LEDGER_3400_TIP = 'Even a spacecraft cannot hold 3400% oxygen. Code rejected this one.';

/** One rule per line. The lint opt-out marks lines that quote banned phrases on purpose. */
export const FLIGHT_RULES: { id: string; rule: string }[] = [
  { id: 'FR-01', rule: 'Say "none in PSI", never "none exists".' }, // lint-claims-ignore
  { id: 'FR-02', rule: 'Count tests nearby. Do not write "fire risk".' }, // lint-claims-ignore
  { id: 'FR-03', rule: 'Never call an air mix "safe" or "unsafe". The atlas shows where tests were run, not where fire is acceptable.' }, // lint-claims-ignore
  { id: 'FR-04', rule: 'Write "visible flame extinction diameter", never "extinction limit".' }, // lint-claims-ignore
  { id: 'FR-05', rule: 'Unknown is not zero. A missing value is shown as not reported.' },
  { id: 'FR-06', rule: 'Every result carries a gravity chip. Partial-gravity combustion data: none in PSI.' },
  { id: 'FR-07', rule: 'Equal O₂ partial pressure is context. It is not equal flammability.' },
  { id: 'FR-08', rule: 'Burner-stream oxygen is shown hollow and never counted.' },
  { id: 'FR-09', rule: 'Presets are illustrative examples, not design values.' },
  { id: 'FR-10', rule: 'An AI voice is always disclosed, spoken and written.' },
  { id: 'FR-11', rule: 'Humans approve the science. Agents prepare it.' },
  { id: 'FR-12', rule: 'No agency insignia, no endorsement. Text credit only.' },
];
