# Lead science audit (replaces the OV-2 review, which stopped at the ChatGPT usage limit)

Sat 14 Nov 2026, corpus `data/corpus.v1.json`. Independent re-check by the lead (Claude Opus 5.5), separate code from the pipeline.

## Random rows against the original CSV files
12 rows sampled (seeded) from 7 investigations. Each row's raw cells were matched to exactly one row of its source CSV
(found by file SHA-256 prefix), and O₂ and pressure were re-converted independently.

| Row | Source | Raw cells match | O₂ | Pressure |
|---|---|---|---|---|
| PSI-69:106 | FLEX | yes | 0.23 mole fraction → 23% | 535 mmHg → 71.33 kPa |
| PSI-69:5 | FLEX | yes | 0.21 → 21% | 760 mmHg → 101.32 kPa |
| PSI-25:9, PSI-25:40 | BASS-II | yes | 21% | not reported (null) |
| PSI-99:3, PSI-99:0 | Saffire-II | yes | 22.1%, 21.5% | not reported |
| PSI-107:28, :450 | SPICE | yes | not reported | not reported |
| PSI-101:103, :87 | SAME-R | yes | not reported | not reported |
| PSI-159:75, :188 | CFI-G | yes | 0.394 → 39.4%, 0.15 → 15% (**burner stream**, excluded) | n/a |

Result: 12 of 12 rows trace exactly to their source cells; every conversion checked is correct. Unknown values are
null, never 0.

## Headline facts (re-computed)
- FLEX 274 rows; 24 at ≥30% O₂ (any pressure); 8 inside the Moon-base example box (±3 pts, ±15%).
- BASS-II initial O₂ 13.6 to 22.2%. Highest ambient O₂ in any solid-fuel row reporting O₂: 22.2%.
- Rejected cells: 11 (2 O₂ out of range: 3400%, 2100%; 1 zero pressure: FLEX #114; 8 negative flows: SPICE).
- ACME BRE O₂ basis: unknown (excluded from cabin overlap). CFI-G O₂: burner (excluded).
- Core `corpusHash` equals the pipeline's hash (unit test `packages/core/test/corpus-hash.test.ts`).

## Not covered here (still worth a human look before submission)
- Golden-path walkthrough by a person on the deployed site (the 80 Playwright tests cover it automatically).
- Narration audio with a real ElevenLabs voice (only device-voice manifests exist until keys are added).
