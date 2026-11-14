# Flame in Freefall: overseer review of BUILD_PLAN, UI_SPEC and RED_TEAM

Reviewer: orchestrator (Claude Opus 5.5), Sat 14 Nov 2026, about 06:40 GMT.
Inputs reviewed:
- `BUILD_PLAN.md` (Sonnet 5.5): complete, sections 0–6. The rate limit hit after the file was written.
- `UI_SPEC.md` (Haiku 5.5): complete.
- `RED_TEAM.md` (Haiku 5.5): complete, sections 0–11. It attacked `plan-flame.md`, which BUILD_PLAN supersedes.

## Overall status: CONDITIONAL GO
BUILD_PLAN already fixes several red-team findings:
- PSI route solved and 16 tables fetched.
- No composite index.
- Code-parsed numbers.
- Rights-filtered NTRS list.
- Score semantics corrected.

The open items are conflicts *between* the files, plus red-team blockers that only the human team can clear.

## Verified facts I checked
- **Jev Score** is a probability-weighted position on the level index (0…N-1), and can fall between levels. Source: `samples/jev_score.md`, "multiply each level number by its probability". The BUILD_PLAN description is exact. UI_SPEC's "float" is the same value, and showing the modal level glyph is fine. There is no conflict.
- **PSI table route:** `geode-py/ws/studies/{id}/download?...&redirect=false` returns a presigned S3 URL. Confirmed in `samples/psi-route-probe-log.tsv`. The PSI-98 and PSI-102 SHA-256 values match across two sessions. Presigned URLs expire in about 1 hour, so cache the files and never call PSI live in the demo.
- **Saffire-I table:** O₂ is "21.5 - 21.7" and "~ 21.5". These are strings, so they need the parser. The table has no pressure column.

## Conflicts between files: rulings

| # | Conflict | Ruling | Files to change |
|---|---|---|---|
| R1 | **Ranking model.** UI_SPEC §2.5 sorts by a hidden weighted sum `0.45R + 0.35E + 0.20P` with weight sliders. BUILD_PLAN uses a **lexicographic baseline with a priority-order control and separate Jev columns, never composited**. RED_TEAM M1 says to remove the composite. | **BUILD_PLAN wins.** A weighted sum used only for sorting is still a composite. Replace the sliders with the priority-order control and visible tolerances (O₂ ±3 points, pressure ±15%, flow factor 2: proposed, decision D5). Jev columns sort independently. Show the agreement banner (top-3 overlap, Spearman). | UI_SPEC §0 D2/D3, §2.5 sort key, §3.3 S2, §3.5 S4 (rename it "Ranking priorities"), storyboard beat 0:12–0:17, component inventory |
| R2 | **Lunar hero.** The plan-flame storyboard implied Saffire and BASS "rise for the lunar cabin". RED_TEAM B3: Saffire is ≤22.1% O₂ and no solid-fuel row reaches the lunar band. BUILD_PLAN §0.3: FLEX has 24 rows at O₂ ≥ 0.30 at about 0.70 atm, while BASS-II solids sit at 13.6–22.2%. | Use the **evidence-gap hero**: "Near the lunar-cabin atmosphere, PSI has liquid-droplet (FLEX) tests. No solid-fuel test that reports oxygen goes above 22.2%." This is computed by code from rows, not by a model. It is conditional on K5: a human confirms that the FLEX O₂ is **ambient** chamber O₂ (`oxygen_location = ambient`) and that the pressures are initial conditions. If K5 fails, drop the lunar hero. | UI_SPEC storyboard and slide 3–4. BUILD_PLAN gate G1 must name K5 explicitly. |
| R3 | **Verbatim quotes versus copyright.** RED_TEAM B4: 94 of 126 PSI publications are publisher DOIs. BUILD_PLAN already limits quotes to PUBLIC NTRS and CC0 PSI and excludes Gollner. UI_SPEC assumes every record shows a verbatim quote. | Verbatim quotes come **only** from CC0 PSI records and NTRS items with `PUBLIC_USE_PERMITTED` or `GOV_PUBLIC_USE_PERMITTED`. Publisher papers show a **locator, DOI and team-written paraphrase**, labelled "Paraphrase (team) · not quoted". Tables show the CSV row and its hash. | UI_SPEC S3 (add a paraphrase state and a "table row" state). BUILD_PLAN record schema (add `evidence_kind: quote \| table_row \| paraphrase`). |
| R4 | **Scope.** RED_TEAM M12 says cut to 3–4 investigations. BUILD_PLAN ships 10 cards plus all table rows. | Keep **10 metadata cards** (code-generated from PSI JSON, cheap) and **all parsed table rows**, but only **3–4 deep, human-verified gold records** (K1). Cards without a gold record show "metadata only". Direction B stays a coverage strip only. | BUILD_PLAN §1.2 wording. UI_SPEC adds a "metadata only" state. |
| R5 | **Demo format.** BUILD_PLAN defaults to a 7-slide deck. UI_SPEC leads with a 30 s video. RED_TEAM m3: the title slide counts towards the 7. | The **deck is the default** (D9). Seven slides *including* the title. Video is a stretch only, under 25 s. | UI_SPEC §5.3 slide numbering, and its §5.1 header ("stretch"). |
| R6 | **Thresholds.** BUILD_PLAN keeps a 0.8 `claim_supported` triage heuristic for reviewers. RED_TEAM M2: no thresholds in the UI. | Keep the heuristic **in the reviewer tool only**. It is never shown to end users. The UI shows per-question distributions with the question text and **no calibration language**. | BUILD_PLAN §3 label rules (one line). |
| R7 | **Partial-gravity wording.** RED_TEAM M8. | Say "**None in PSI**", never "none exists". Never imply 0 g and 1 g bound the Moon, and never say lunar gravity is safer. Drop that stretch. | Both files: grep for "no partial-gravity data" and qualify it. |
| R8 | **SI disclosure scope.** RED_TEAM M9 and M10. | The disclosure covers **code, data and planning**. Add a per-record manifest (origin, model, date, reviewer). Ship **no cached model output** in the public repo until the TypeSafe and Google terms are read. Until then, use fixtures labelled "human-authored, not model output". | BUILD_PLAN §5. UI_SPEC S6. |

## Blockers only the human team can clear (no agent can do these)
1. **B1 · Idea origination.** The team picks the challenge and direction and writes its own concept and a dated decision log (BUILD_PLAN D12). All AI files are background.
2. **B2 · Differentiator (gate K2, by H4).** ember-index, OSAMABASAM and flaregrain already ship presets, sliders and rankers. The team writes **one on-screen differentiator** absent from their READMEs. Candidates from BUILD_PLAN: overlap computed from *actual PSI test rows*, a visible "rejected by code" data-error ledger, and an evidence-gap statement. The team must check these against the three READMEs.
3. **B5 · Model path (gate K0, H1).** One real Jev call, one Hydrogen call and one Decision-1 call, with keys. If neither Jev nor Hydrogen works by H2, switch to Trend Detective.
4. **D2 · Time zone.** Confirm the Local Event deadline. The plan assumes GMT, but a Halifax event would be about 4 hours later in UTC.

## Switch rule (adopted from RED_TEAM §9)
- **Any one of K0, K1 or K2 fails:** switch to Trend Detective.
- **Any two of K3–K6 fail:** switch.

Run Trend Detective's own H0 gate (Earthdata login plus one Giovanni CSV) in parallel, so the backup is live.

## Follow-up after the integration pass (06:55 GMT)
- **R2 hero wording corrected.** The integrator flagged that "no solid-fuel tests" overstates the data, because five solid-fuel tables do not report O₂. The hero now reads: *"Near the lunar-cabin atmosphere, PSI has liquid-droplet (FLEX) tests. No solid-fuel test that reports oxygen goes above 22.2%."* The scope line stays. The team approves the final wording.
- **`scenario_scope` defined** in the BUILD_PLAN record schema: preset IDs computed by code from initial ambient conditions. Unknown O₂ or pressure gives `[]` and the record is shown under "unknown".
- **Open for the team:**
  - Fixtures (FIXTURE label) must be hand-written before the static build.
  - D5: decide whether a flow-factor tolerance becomes an overlap key.
- **RED_TEAM M15 count corrected:** six PDFs plus one text file in samples/, not seven.
