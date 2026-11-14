# Data and science

## Sources
- **NASA Physical Sciences Informatics (PSI)**, combustion investigations, all **CC0-1.0**. Twelve are in the corpus:
  PSI-98, 99, 100 (Saffire I to III), PSI-26 (BASS), PSI-25 (BASS-II), PSI-69 (FLEX), PSI-102 (SAME), PSI-101 (SAME-R),
  PSI-107 (SPICE), PSI-20 (ACME BRE), PSI-159 (ACME CFI-G, two tables), PSI-47 (DAFT).
- Tables were downloaded once through PSI's web-app route (see `research/flame/BUILD_PLAN.md` §2.1) and are cached in
  `research/flame/samples/psi_tables/` with SHA-256 hashes. The app never calls PSI at runtime.
- **NASA NTRS** documents are cited by ID with their copyright determination. Verbatim quotes only from
  `PUBLIC_USE_PERMITTED` / `GOV_PUBLIC_USE_PERMITTED`; `GOV_PERMITTED` (20210011385) is paraphrase only; 20210022402
  is excluded. No figures are copied. Raw archives (hundreds of GB to TB) are never downloaded.

## How a CSV becomes a row (`packages/pipeline`)
1. Read bytes, hash them, decode (FLEX is cp1252; others UTF-8 with BOM).
2. A column map per table (`src/maps/PSI-*.ts`) names the fuel, phase, O₂ column (and its basis: ambient, burner or
   unknown), pressure and flow with units, date and test label. Maps were proposed by an agent and marked
   "needs human check".
3. Cell rules: `~ 21.5` is approximate; `21.5 - 21.7` is a range; `21; 26.5; 40` is a **discrete list** (tested value
   by value, never as a continuous range); units inside cells are read; mole fractions become percent; mmHg, atm, psi
   and bar become kPa.
4. Impossible values are **rejected with a reason** and shown in the "Caught by code" ledger: O₂ outside 0 to 100%
   (BRE `3400%`, `2100%`), pressure ≤ 0 (FLEX #114), negative flow (SPICE). A rejected cell nulls that field; the row
   keeps its other values.
5. Post-test O₂ is stored separately and is never a test condition (BASS-II reaches 40.4% after burning).

## Overlap: what "near this air" means (`packages/core/src/science.ts`)
A habitat is an O₂ percentage and a total pressure, with a tolerance box (default O₂ ±3 percentage points, pressure
±15%). Each row is classified:

| O₂ inside band | Pressure inside band | Class |
|---|---|---|
| yes | yes | **covers** (counted as "inside the box") |
| yes | no | near-O₂ only |
| no | yes | near-pressure only |
| no | no | none |
| any field not reported | | **unknown** (never "none") |
| burner-stream O₂ | | excluded (not cabin air) |

Unknown-basis O₂ (ACME BRE) is excluded from cabin overlap. Discrete lists match only if a listed value is inside.

## Ranking
- **Baseline (code):** lexicographic over a human-approved priority order of four keys: purpose match, rows that cover
  the air, evidence tier, rows near the air. No composite score, no weights. Ties by accession. A sensitivity badge
  re-ranks under all 24 orders. Only human-reviewed ("gold") cards are ranked; until then the table is a labelled preview.
- **Jev (AI):** its own lexicographic order over binned relevance, evidence directness and purpose probability, shown
  beside the baseline with a code-written agreement sentence and Spearman ρ. See [ai-and-voice.md](ai-and-voice.md).

## Guardrails (enforced in code and by `pnpm lint:claims`)
- "Partial-gravity combustion data: none in PSI." No interpolation between microgravity and 1 g.
- Equal O₂ partial pressure is not equal flammability; fraction and total pressure are always shown separately.
- "Visible flame extinction diameter", never "extinction limit". "Investigation date" vs test date.
- Presets are illustrative examples with sources: Moon base 30% at 10.2 psi (challenge text), exploration 34% at
  8.2 psia (NTRS 20180004258), suit 100% at 4.3 psi (challenge text).
- Never: safe, unsafe, certified, validated, calibrated, predicts, fire risk, first, novel, NASA-approved.

## Numbers you can quote (corpus v1)
- 1,476 parsed test rows from 12 investigations; 11 cells rejected by code.
- FLEX: 274 rows; 24 at ≥30% O₂ (any pressure); **8 inside the Moon-base example box** at default tolerances.
- BASS-II initial O₂ 13.6 to 22.2%. Highest ambient O₂ in any solid-fuel row that reports O₂: **22.2%**.
- Five solid-fuel tables report no O₂: their overlap is unknown, not absent.

## Verification
- Every number in a narration or AI explanation must pass `numberGuard`; banned phrases fail `claimLint`.
- `verifyQuote` checks verbatim quotes against the source page text after normalisation; `pnpm review` re-checks each
  candidate row against the raw CSV bytes.
- Independent audits: [reviews/LEAD-science-audit.md](reviews/LEAD-science-audit.md) (12 random rows traced to the
  CSVs) and `reviews/ov2-science-audit.py` (`python3 docs/reviews/ov2-science-audit.py`).
