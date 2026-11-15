# Fire Atlas corpus reject ledger

Generated: 2026-11-15T04:59:39.089Z
Corpus hash: `4d3a7aa6d1e8ecf3adb844bf4bb1887983aca2ce29b53f9eff002fe4eb45bd7f`
Rejected cells: 11

## Counts by reason

| Reason | Count |
| --- | ---: |
| o2-out-of-range | 2 |
| pressure-nonpositive | 1 |
| flow-negative | 8 |

## Cells

| Accession | Row index | Column | Raw value | Reason | Note |
| --- | ---: | --- | --- | --- | --- |
| PSI-69 | 113 | Ambient pressure; mmHg | 0 | pressure-nonpositive | Pressure must be greater than 0 kPa, got 0 |
| PSI-107 | 294 | Air Rate (cm/s) | -0.28 | flow-negative | Flow must not be negative, got -0.28 cm/s |
| PSI-107 | 296 | Air Rate (cm/s) | -0.28 | flow-negative | Flow must not be negative, got -0.28 cm/s |
| PSI-107 | 297 | Air Rate (cm/s) | -0.28 | flow-negative | Flow must not be negative, got -0.28 cm/s |
| PSI-107 | 298 | Air Rate (cm/s) | -0.28 | flow-negative | Flow must not be negative, got -0.28 cm/s |
| PSI-107 | 299 | Air Rate (cm/s) | -0.28 | flow-negative | Flow must not be negative, got -0.28 cm/s |
| PSI-107 | 335 | Air Rate (cm/s) | -5.92 | flow-negative | Flow must not be negative, got -5.92 cm/s |
| PSI-107 | 336 | Air Rate (cm/s) | -5.92 | flow-negative | Flow must not be negative, got -5.92 cm/s |
| PSI-107 | 337 | Air Rate (cm/s) | -5.92 | flow-negative | Flow must not be negative, got -5.92 cm/s |
| PSI-20 | 4 | Oxygen Conc (percent) | 3400% | o2-out-of-range | O2 must be 0 to 100 percent by volume, got 3400 |
| PSI-20 | 7 | Oxygen Conc (percent) | 2100% | o2-out-of-range | O2 must be 0 to 100 percent by volume, got 2100 |
