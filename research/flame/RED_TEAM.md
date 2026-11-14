# RED TEAM: Flame in Freefall (Direction A default, B stretch)

Reviewer: red-team sub-agent · 14 Nov 2026, about 06:00–07:30 UTC · Deadline (brief): Sun 15 Nov 23:59 local
Scope: attack `research/plans/plan-flame.md`, the verdict, the r2 debate, and the findings. Test the data and rule claims live. No application code. No authenticated model calls (no keys).

Labels: **[T]** checked today (curl, gh, or PDF parse). **[X]** pre-existing file in `research/flame/samples/` (hash and size checked, content parsed here; origin not recorded in this session). **[P]** carried from the plan or earlier files, not re-checked.

---

## 0. Verdict

**CONDITIONAL GO, narrowed.** Build only if gates K0–K6 (§9) pass by hour 4. Otherwise switch to Trend Detective.

- **The PSI "404 blocker" is solved for experimental tables.** The PSI web app's own endpoint returns anonymous presigned links. All eight planned tables download, and their sizes match metadata byte for byte. The plan's `datamanager` URL was never the real route. It is still unsolved for PDFs and zips.
- **Direction A's hero is not supported as written.** The Saffire tables show 21.5–22.1 % O₂. No table row has O₂, pressure and flow together. Test pressure appears in one full text (BASS, 1 atm). The only in-band (≥30 % O₂, ≤10.2 psi) statement is one summary bullet in SoFIE.
- **Direction A is already public.** ember-index ships the same three presets with weight sliders. OSAMABASAM has a live demo. flaregrain ranks 24 investigations. Creativity 5 requires "never been attempted before" (judging guide, verified).
- **AI origination is the first rule risk.** AI chose the direction and wrote the research. The human team must choose and own the concept.
- **The corpus is bigger than the plan says.** Seven full-text documents are already in `samples/`, including BASS (58 pp), the SAME final report (68 pp), the 2018 Saffire presentation (29 pp) and SoFIE (21 pp). The plan's "no complete PDF obtained" line is stale.

---

## 1. Findings register (severity-ranked)

**blocker** = the plan fails or is ineligible unless fixed. **major** = likely to cost Validity, Relevance or a rule point. **minor** = fix before submission.

| ID | Sev | Area | Finding | Evidence | Action |
|---|---|---|---|---|---|
| B1 | blocker | Rules | AI chose the direction and wrote the research. The guide says: "SI should not be used to (come up with your idea of how to solve the challenge)." | Submission guide [T]; plan header [P] | The human team writes the concept and a dated decision log. Mark all AI files "background, not the idea." |
| B2 | blocker | Competition | Direction A already exists publicly. ember-index has the same presets (lunar ≥30 % O₂ and ≤10.2 psi, suit 100 % and 4.3 psi, ISS) and weight sliders. OSAMABASAM has a live demo and a 1-min video. flaregrain ranks 24 PSI investigations with source-linked values. | GitHub READMEs [T] | The team names one differentiator it can show on screen (human decision) by H4, or switches (K2). |
| B3 | blocker | Validity | The cabin filter cannot run on most records. Test pressure appears in one full text (BASS, 1 atm). Other pressure mentions are reference atmospheres (2018 NTRS slide, SoFIE) or safety limits (SPICE). Tables give pressure only for FLEX (mmHg). The storyboard claim "Saffire and BASS rise for the lunar cabin" fails: Saffire-I, -II and -III show ≤22.1 % O₂. | Table scan [T]; text scan [X] | Remove the Saffire lunar claim. The lunar reorder needs at least one accepted, in-band, initial-condition record (K5). |
| B4 | blocker | Licence | A verbatim-quote corpus cannot ship. 94 of 126 PSI publications carry DOIs (publisher copyright). NTRS 20210022402 (Gollner) is flagged `MAY_INCLUDE_COPYRIGHT_MATERIAL`. Space Apps requires third-party materials to be public or OSI-licensed and every source cited. | NTRS and PSI JSON [T]; legal text [P] | Commit locators, DOIs and the team's own paraphrase. Verbatim quotes only from PUBLIC NTRS items and CC0 PSI records. Check each enclosed PDF's own rights, not just the record licence. |
| B5 | blocker | Model path | The SI path is untested. No authenticated Jev or Hydrogen call exists. Jev returns 403 "Must supply an API key". Gemini returns 403 for a known model and for `gemini-4-hydrogen` alike, so existence cannot be tested without a key. Flame's reason to exist (the "SI" ranker) depends on these calls. | Probes [T] | H1: one real call each to Jev, Hydrogen and the Decision-1 adapter. Record model ID, status and latency. Fail by H2 → switch (K0). |
| M1 | major | Science | The composite index is still in the plan: `100 × (0.45R + 0.35E + 0.20P)`. The brief says drop it. | plan-flame.md [P] | Remove from BUILD_PLAN and UI. Show ordinal columns and a sensitivity table. |
| M2 | major | AI | Jev "model confidence" is misdescribed. Docs define confidence as the concentration of the answer distribution, not correctness. Noul has none. Decision-1 yes/no returns its own confidence score. The 0.8 review and 0.85 act thresholds are unvalidated. A 12/15 smoke test has a Wilson 95 % CI of 0.55–0.93. | typesafe-confidence.md [T]; Decision-1 page [T]; CI computed [T] | Show per-question distributions with the question text. No thresholds in the UI. No calibration language. |
| M3 | major | AI | The verbatim check is necessary but not sufficient. It matched 3 of 3 test strings in the NTRS text. It cannot catch a correct quote with a wrong number, a quote from the wrong page, or a quote from a different text layer than the locator used. | Live test on NTRS text [T] | Match the quote within the locator's page text. Match each number to its cell or row. Visually check every numeric row against the PDF page. |
| M4 | major | AI | Hydrogen → Jev errors are correlated through the same span. The weak field is oxygen basis. BRE's O₂ column reads "as diluted with nitrogen" with no chamber or burner tag. CFI-G's 85 % is burner stream only. | BRE table [T]; challenge text [P] | Require `oxygen_location` (ambient, burner, unknown). Jev never sees a numeric O₂ without its basis. Show the no-model baseline beside Jev. |
| M5 | major | Science | The lunar preset conflicts with the sources. The 2018 NTRS slide says 30 % O₂ and 10.2 psia was "historically" the shuttle pre-EVA atmosphere and that future exploration "extends to 34 % O₂, 8.2 psia". SoFIE repeats 34 % and 8.2 psia as an "exploration atmosphere". The challenge says "30 % or greater" and "10.2 psi or less". pO₂ is 3.06 psi (30 %, 10.2 psi) and 3.09 psi (21 %, 14.7 psi). | NTRS 20180004258 txt lines 64–65 [X]; SoFIE text [X]; challenge [T] | Label presets as scenarios with sources. Show O₂ fraction and total pressure separately. Never claim equal pO₂ means equal flammability. |
| M6 | major | Data | The PSI table route is an undocumented app endpoint. Bulk files are unresolved: `added[]` entries have no `_id`, and `resource_id` returns 404 "File not found". The `psi.ndc.nasa.gov` file host does not resolve here. Signed URLs last about 1 h. The earlier pass's table hashes match ours, so the table route reproduces across sessions. | Probe log [T]; earlier logs [X] | Cache the eight tables and records with SHA-256 and access date (manifest). Never call PSI live in the demo. Do not link to psi.ndc. |
| M7 | major | Data | Table integrity problems. BRE O₂ has "2100%" and "3400%". BRE has multi-valued cells ("21; 26.5; 34; 40"). BASS-II post-test "final O₂" reaches 39.1 % and 40.4 %, which parse as conditions. One FLEX row has 0 mmHg ambient pressure. FLEX O₂ is a mole fraction (0–0.7) while others use percent. FLEX pressure is in mmHg (0–2,320 = 0–44.9 psi). Saffire-I and -III length and width are swapped (I: 40.6 × 94 cm; III: 94 × 40.6 cm). Saffire-II thickness is in mm. The header "Samle" is misspelled. | CSV scans [T] | Typed parser, unit normalisation, physical-range rejection, and a visible "source errors rejected" ledger. Keep initial and post-test O₂ in separate fields. |
| M8 | major | Science and claims | "No partial-gravity data" is true only of PSI. Gollner (NTRS 20210022402) says "Lunar and Martian gravity levels could actually enhance the propensity for concurrent-flow flame spread". The limited testing so far used aircraft parabolas or a drop-tower centrifuge. The challenge says microgravity and 1 g results "could bound" intermediate gravity. The team's rule forbids that inference. | Gollner text [X]; challenge [T] | Say "none in PSI", never "none exists". Never say lunar gravity is safer. Drop the "0 g and 1 g bound the Moon" stretch. |
| M9 | major | Compliance | The SI disclosure covers planning only. The guide requires acknowledgement, in text and metadata, of SI-generated code and data. Codex-written code and Hydrogen-proposed records both count. | Submission guide [T]; plan disclosure [P] | Manifest per record (origin, model, date, reviewer). Code provenance in the README. SI-use statement naming where and how each model was used. |
| M10 | major | Licence | Cached Jev and Hydrogen outputs in a public repo: provider terms not read here. The legal text says non-NASA materials must be OSI-licensed or freely available. | GPT-A open question 1 [P] | Read the terms. If redistribution is unclear, ship no model output in the repo. Ship fixtures labelled "human-authored, not model output." |
| M11 | major | Operations | Jev returns 429 (rate limit) and 529 (overloaded), with retry guidance and no published quota. Decision-1 free tier is 200 RPM, 50k TPM and 10k RPD. Hydrogen's quota is not in the extracted rate-limit text. | typesafe-errors.md [T]; rate-limits page [T] | Pre-cache every demo scenario with model ID and date. Show "cached" unless live. Cap live waits at 5 s. |
| M12 | major | Scope | 42 hours for 3–5 people. The plan has 8 investigations, 3 human-checked records, four screens, two modes, dither, live and cached paths, export and a source drawer. The plan's own H2 and H4 gates will slip first. | Plan schedule [P] | Cut to 3–4 investigations and one flow. Drop B's chart. Decide by H4 (§9). |
| M13 | major | Direction B | B's gate ("two compatible series by H4") is not met by the PSI tables. The only same-fuel pair is Saffire-I and -III (SIBAL fabric, 20 vs 30 cm/s, length and width swapped, III has no O₂). The better contrast is in BASS: Nomex-III at 1 g and 0 g (p.27). But the note on p.26 says "samples narrower on ISS", so geometry confounds the gravity comparison. | Tables [T]; BASS pp.26–27 [X] | B stays a stretch and becomes a confounded-comparison exercise. Verify the 0 g and 1 g pair before anyone builds on it. |
| M14 | major | Competition | The plan's competitor count (≈59) and "the opening is still empty" are outdated. 111 flame- or fire-related repos were created since 1 Oct (of 244 unique hits across 8 queries). 74 of 111 are unlicensed. Several use the same presets and the same PSI endpoint. | GitHub scan [T] | Drop novelty language from all writeups. Keep the scan as the prior-art record. |
| M15 | major | Plan | The plan says no complete PDF was obtained. That was true for its own planning pass. Seven full-text documents now sit in `research/flame/samples/` (BASS 58 pp, SAME report 68 pp, 2018 Saffire presentation 29 pp, SoFIE 21 pp, SPICE 28 pp, Saffire-I objectives 6 pp, Gollner 11 pp). | File scan [X] | Update the plan's evidence section. Use these as first gold-record candidates, subject to rights (§3c). |
| m1 | minor | AI | Prompt injection. No instruction-like text found in the 2018 NTRS source (grep). PSI free-text metadata and any PDF are untrusted. | Grep [T] | Disable tools in extraction calls (no URL context, search or code execution). Schema-constrained output. Planted-text canary at H1. |
| m2 | minor | Operations | Timezone. The plan assumes Europe/Dublin. A Halifax local event (flaregrain's description) would put the deadline about 4 h later in UTC. | GitHub README [T] | Confirm the Local Event time in H0. |
| m3 | minor | Demo | Limits. Slides include title and intro, so a separate title slide makes eight, which is ineligible for Global. Video must be ≤30 s. Non-English narration needs English subtitles. The 30-second storyboard has about 10 beats. | Submission guide [T] | Seven slides, no title slide. Video under 25 s, rehearsed. |
| m4 | minor | Branding | No meatball, worm, seal, mission patch, Space Apps logo or PSI logo unless checked. The Space Apps brand page was not read. | Guide [T]; brand page [P] | Text attribution only. |
| m5 | minor | Dither | Dither is a display transform of NASA stills, not SI-generated. Disclose it as a transform. No watermark unless a generated image appears. | Findings [P] | Keep numbers, axes and quotes undithered. |
| m6 | minor | Operations | Judges' web filters may block a new site. The guide suggests asking FortiGuard to classify it. | Guide [T] | Do this at deploy. |
| m7 | minor | Claims | Hydrogen's "more than 5× fewer fabricated claims" is a vendor claim. | aistudio page [P] | Keep it out of slides. |
| m8 | minor | Docs | The grok-b findings still contain the old 4.1 formula `P(overlap) × evidence × pillar`. | Findings [P] | Mark it superseded. |
| m9 | minor | Jev | Box is experimental and always returns a box. | typesafe docs [T] | Skip for MVP. |
| m10 | minor | Audience | Gemini API terms restrict child-directed clients. The audience (professors, graduate students) is fine. | r2-gemini [P] | Keep API calls server-side and adult-only. |

---

## 2. Scientific validity: what a NASA combustion judge will object to

### 2a. Objections, evidence and required fix

| # | Objection | What the sources say | Must do |
|---|---|---|---|
| S1 | "Equal pO₂ is not equal flammability." | Lunar preset 30 % at 10.2 psi gives pO₂ 3.06 psi. Earth 21 % at 14.7 psi gives 3.09 psi. The 2018 NTRS slides tie flammability maps to O₂ fraction and flow [X]. | Show fraction and total pressure. Never equate pO₂. |
| S2 | "Which oxygen? Chamber or burner?" | CFI-G's 85 % is burner stream (challenge). The BRE column reads "as diluted with nitrogen" and does not say chamber or burner [T]. BASS gives "ambient oxygen atmospheres 17 % to 21.5 % (cabin air)" [X]. | Required `oxygen_location`. Unknown means excluded from the scenario filter. |
| S3 | "You are comparing a 1 m fabric with a 1 mm droplet." | Saffire-I sample 40.6 × 94 cm. Saffire-II 5 × 29 cm silicone. FLEX droplets in mm. BRE 25 mm burner on ethylene gas. BASS 2 cm samples [T][X]. | Geometry is a compatibility key. No cross-geometry ranking without a label. |
| S4 | "Is 20 cm/s habitat-relevant?" | The 2018 NTRS slides say ECLSS flows are "around 15–20 cm/s" [X]. Tables range 5–30 cm/s. Saffire tables record flow direction (concurrent or opposed). | Anchor the flow filter to the 15–20 cm/s line. Show direction. |
| S5 | "What gravity? Zero?" | ISS is microgravity; "0 g" in the plan is loose. BASS p.27 writes "(0g)" for ISS runs [X]. Saffire-II has "?-g" and "1-g" columns [T]. Gollner says partial-g tests are scarce [X]. | Say "microgravity (ISS)". Never interpolate. "None in PSI", not "none". |
| S6 | "Visible extinction is not a limit." | FLEX: "visible flame extinction diameter" [T]. SoFIE separates blowoff and quench in 0 g [X]. | Use the paper's word. "Visible disappearance" unless the paper defines an extinction limit. |
| S7 | "Your 0 g versus 1 g comparison is confounded by sample width." | BASS p.26 notes "samples narrower on ISS". Nomex-III on ISS "shrinking in width until it extinguished" as width fell below about 1 cm [X, p.27]. | Show width as a confound. No "gravity effect" without a width-matched pair. |
| S8 | "Investigation dates are not run dates." | PSI-98 and PSI-102 carry 2001 and 2008 investigation dates [T]. | Label them "investigation dates." Use paper run dates only. |
| S9 | "You showed 3400 % oxygen." | BRE table has "3400%" and "2100%" [T]. | Code rejects; show the "rejected source errors" count. |
| S10 | "Partial gravity is the point of a lunar base." | Challenge: no partial-gravity data in PSI; microgravity and normal-gravity results "could bound" intermediate gravity. Gollner: lunar and Martian gravity could increase concurrent-flow spread [X]. | Show the gap. Explain why the bound rule exists. Do not build a bound control. |

### 2b. Never-claim list (lint these strings in the UI and deck)

- "probability the science or fire is true"; "fire risk"; "safe" or "unsafe" for any atmosphere.
- "validated", "calibrated", "predicts flammability", "predictive model".
- Any lunar- or partial-gravity result; "0 g and 1 g bound the Moon"; "lunar gravity is safer."
- "No partial-gravity combustion data or tests exist." Write "none in PSI."
- "Equal pO₂ means equal flammability"; "more flammable" from pO₂ alone.
- "Extinction limit" for visible disappearance.
- "Saffire, BASS or FLEX show lunar-cabin flammability."
- Any value without a page, table or row locator, and any AI-derived number presented as a measurement.
- "Artemis III site"; "Artemis IV in 2028" (only as NASA's stated target, with attribution).
- "NASA endorses", "NASA-approved", "certified".
- "First", "only", "novel", "unprecedented".
- "CFI-G's 85 % O₂ is cabin air" (burner stream only).
- "SAME shows detector performance" unless the paper says so.
- Any significance language (not part of this project).

---

## 3. Data and access

### 3a. PSI route tests run today

| # | Route tested | Result | Meaning |
|---|---|---|---|
| 1 | Plan's constructed `/datamanager/file/Home/psi-data/...csv` (4 spellings, 2 user agents) | 404 on all 5 | Dead path. The web app bundle has zero references to `datamanager` [T]. |
| 2 | `https://psi.nasa.gov/` | 200, redirects to `science.nasa.gov/biological-physical/data/` | Front door has moved. Search app still at `/physci/repo/search` [T]. |
| 3 | `psi.ndc.nasa.gov/mpglobal/api/athena/file/...` (file host in records) | DNS fails | Do not link to it [T]. |
| 4 | `geode-py/ws/repo/investigations/PSI-<n>` (8 records) | 8 of 8 HTTP 200, JSON | Metadata works without a key [T]. |
| 5 | **`geode-py/ws/studies/PSI-98/download?file=<experimentalTable _id>&version=1&redirect=false`** | 200. Body is a presigned S3 URL on `psi-repo-prod`, valid about 1 h | **The working route.** Found in the front-end bundle (`downloadStudyFile` → `getPresignedURL`) [T]. |
| 6 | Same route for all 8 experimental tables, then download | 8 of 8 HTTP 200. Bytes match metadata: 469, 1,973, 239, 4,726, 16,590, 24,776, 1,113, 331 | 50,217 bytes in total. SHA-256 logged [T]. |
| 7 | Same endpoint with a non-table file (`added[].resource_id`, Saffire PDF) | 404 "File not found" | Non-table file keys remain unresolved [T]. |
| 8 | `geode-py/ws/studies/PSI-98` and `.../files` | 403 | Not public. Do not use [T]. |
| 9 | AWS bucket `nasa-psi` (registry: "no restrictions on the use of this data") | ListBucket 200, but no `psi-data/PSI-98/` prefix (top level: `DSI/`, `OASIS/`, `pk4/`) | Not the PSI record store. Use the registry licence as a backup citation only [T]. |
| 10 | `psi-repo-prod` bucket, direct or listed | 403 AccessDenied | Only presigned access works [T]. |
| 11 | NTRS 20180004258 full PDF | 200, 2,430,800 bytes, `%PDF-1.5`, ends `%%EOF`, about 29 pages | Complete. The earlier 2 MB "prefix" was a sampling artefact [T]. |
| 12 | Jev `POST /v1/systemone`, no key | 403 `authentication_error` | Reachable. Needs a key [T]. |
| 13 | Gemini v1beta, known model `gemini-2.5-flash` and `gemini-4-hydrogen` | 403 for both | Existence cannot be tested without a key. The single 404 from an earlier run did not reproduce [T]. |

**Limit:** the working endpoint belongs to the PSI web app and is not documented. Use cached copies in the demo.

### 3b. The eight planned investigations

| PSI | Acronym | Licence | Archive GB | Pubs / DOI / NTRS links | Table bytes | Rows with numbers | O₂ in table | Test pressure | Flow in table | Gravity columns | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 98 | SAFFIRE-I | CC0 | 12.25 | 6 / 3 / 0 | 469 | 2 | 21.5–21.7 % | none | 20 cm/s | none | Two test rows only |
| 99 | SAFFIRE-II | CC0 | 16.93 | 7 / 5 / 1 | 1,973 | 9 | 21.5–22.1 % | none | 20 cm/s | "?-g" and "1-g" columns | Placeholders in header |
| 100 | SAFFIRE-III | CC0 | 35.21 | 3 / 0 / 1 | 239 | 2 | no O₂ column | none | 30 cm/s | none | Length and width swapped vs PSI-98 |
| 26 | BASS | CC0 | 163.55 | 10 / 7 / 0 | 4,726 | 122 | no O₂ column | none | no flow column | none | Six columns only (date, test, sample, material) |
| 25 | BASS-II | CC0 | 274.63 | 17 / 9 / 0 | 16,590 | 129 | initial 13.6–22.2 %; **post-test up to 40.4 %** | none | flow restrictor only | none | Post-test O₂ is a trap |
| 69 | FLEX | CC0 | 923.83 | 51 / 45 / 0 | 24,776 | 274 | mole fraction, 0–0.7 | 0–2,320 mmHg (0–44.9 psi); one row at 0 | none | none | Unit mix |
| 20 | ACME BRE | CC0 | 2,035.57 | 16 / 15 / 0 | 1,113 | 18 | 21–40 %, multi-valued; **2100 % and 3400 %** | not identified | none | none | Impossible values |
| 102 | SAME | CC0 | 0.66 | 16 / 10 / 1 | 331 | 8 | no O₂ column | none | 5 and 10 cm/s | none | Materials weight-loss test matrix |

**Totals [T]:** 3,462.6 GB of archives; 50,217 bytes of tables; 126 publications, 94 with DOIs, 3 NTRS links across the eight records.

The earlier pass's `psi_json/` folder holds 24 combustion records, including richer tables: PSI-107 SPICE (31 KB), PSI-159 CFI-G (22 KB and 39 KB), PSI-10 ACME Flame Design (27 KB) and PSI-68 FLEX-2 (1 KB) [X].

### 3c. Rights for what may ship

| Item | Rights, as recorded | Ship? |
|---|---|---|
| NTRS 20180004258, Ruff, Saffire and crew safety presentation (29 pp) | distribution PUBLIC; determination `GOV_PUBLIC_USE_PERMITTED`; export NO [T] | Yes, with citation. |
| NTRS 20140011099, BASS POIWG presentation (58 pp) | PUBLIC; `PUBLIC_USE_PERMITTED` [T] | Yes, with citation. Key for Nomex-III at pp.26–27. |
| NTRS 20200000361, SoFIE presentation (21 pp) | PUBLIC; `PUBLIC_USE_PERMITTED` [T] | Yes. Summary bullets only; the slides contain no test data. |
| NTRS 20210022402, Gollner white paper (11 pp) | **`MAY_INCLUDE_COPYRIGHT_MATERIAL`**; licence NO [T] | **No.** Cite it. Paraphrase only, and confirm rights first. |
| PSI-102 SAME final science report (68 pp, "no papers attached") | Record is CC0. The report's own notice not checked [X] | Check the notice before shipping. Cite regardless. |
| PSI-107 SPICE final report (28 pp); PSI-98 Saffire-I objectives (6 pp) | Record is CC0. Enclosed notices not checked [X] | Same as above. |
| Publisher papers (DOIs) | Copyright | Cite DOI only. |

### 3d. Corpus-size realism

- **Downloads.** Archives total 3.46 TB, and none should be fetched. Tables total 50 KB. Full text already in hand is seven documents, about 180,000 characters in the SAME report alone. This is a curation problem, not a download problem.
- **Numbers.** O₂, pressure and flow together appear in **zero** table rows. Test pressure appears in one full text (BASS, 1 atm). Other pressure mentions are reference atmospheres or safety limits.
- **First candidate records (not accepted):**
  1. BASS p.26–27: Nomex-III at 22 % O₂, 1 atm, 14 cm/s, microgravity. Ultem and Nomex HT90-40 did not burn at 21–22 % O₂ on ISS at about 15 cm/s, with samples narrower on ISS [X].
  2. SoFIE summary slide: "few materials rated even in 1g at 34 % O₂, 8.2 psia (exploration atmosphere)" [X]. This is the only in-band statement, with no test detail.
  3. SAME final report: test matrix at 2–8 cm/s with sample temperatures and materials [X].
  4. Saffire-II table rows: 21.5–22.1 % O₂, 20 cm/s, with 1-g and microgravity columns [T].
  Each needs human acceptance.
- **Verdict.** Three human-checked records by H2 is now plausible, so K1 is at risk rather than closed. The lunar band is still thin. Keep the corpus to 4–5 investigations and label coverage on screen.

---

## 4. AI architecture

| Risk | Evidence | Fix |
|---|---|---|
| Correlated errors within one span. Hydrogen extracts and Jev judges the same span. The vendors differ, so the shared cause is the source text and schema, not the vendor. | Plan contract and kimi r2 [P] | `oxygen_location` enforced in code. Jev gets numeric O₂ only with its basis. The no-model baseline is shown beside Jev. |
| Jev rate limits and outages | 429 and 529 with retry guidance, no published quota [T]. Decision-1 free tier 200 RPM, 50k TPM, 10k RPD [T]. Hydrogen quota not in extracted text [T]. | Cache every demo scenario. Live wait ≤5 s. Visible "cached" label. |
| Reachable is not the same as working | Jev 403 without a key. Gemini 403 for known and new model names alike [T]. | H1 real calls. Record model ID, status and latency. |
| Prompt injection via paper text | No instruction-like text in the 2018 NTRS source (grep) [T]. PSI free text and any PDF are untrusted. | Disable tools. Schema output. H1 canary: plant an instruction line in a copy of the source; the output must ignore it. |
| Hallucinated quotes | Exact match after whitespace normalisation found 3 of 3 test strings [T]. | Also match within the locator's page. Match numbers to the cell. Visual PDF check for numeric rows. Mismatch means reject, not repair. |
| Quote right, number wrong | Example: BASS p.27 "22 % O₂" is correct, but a model could attach it to the 21.5 % Saffire row [X]. | Number-to-cell check. Pass or fail per field. |
| Calibration misuse | Confidence is distribution concentration [T]. Wilson 95 % for 12 of 15 is 0.55–0.93 [T]. The 0.8 and 0.85 thresholds are unvalidated [P]. | Drop thresholds from the UI. Report accuracy with n and its CI. |
| Decision-1 is a different API | `decisions.create`; `input` not `state`; yes/no returns a 0.01–0.99 probability and a confidence score [T]. | Adapter with fixture replay. Not a model-string swap. |
| Box (Jev 1.14) | Always returns a box; experimental [T]. | Skip. |

---

## 5. Rules and compliance

| Rule | Status | Evidence | Action |
|---|---|---|---|
| SI must not originate the idea | **Not met** (AI chose the direction) | Guide [T] | B1. Human decision log. |
| Disclose where and how SI was used | Partial | Guide [T]; plan disclosure covers planning only [P] | M9. Per-model, per-role statement. |
| Generated code, data and audio acknowledged in text and metadata | **Not met** | Guide [T] | M9. Manifest and README. |
| Visible watermark on generated images and video | Met (none planned) | Plan [P] | Keep it that way. Dithered stills are transforms (m5). |
| No NASA branding or insignia in generated content | Met in plan | Guide [T] | m4. |
| Cite every source and its licence | Partial | Terms [P] | Per-source manifest with licence and DOI. |
| Third-party materials public or OSI-licensed | **At risk** | B4, M10 | Commit only CC0 and PUBLIC items. |
| At least one NASA data source | Met | PSI and NTRS [T] | None. |
| Video ≤30 s or slides ≤7 including title and intro | Met if no title slide | m3 | None. |
| English subtitles for non-English video | Not applicable unless used | Guide [T] | None. |
| No images or likeness of anyone under 18 | Met by plan | Guide [T] | Check demo footage. |
| Export control | None found (NTRS export NO) | NTRS [T] | None. |

---

## 6. Competition

### 6a. Scan

- **Query set.** 8 queries × 2 modes on GitHub search, `created >= 2026-10-01`. Result: 244 unique repos. 111 are flame- or fire-related. 74 of the 111 are unlicensed. 13 have at least one star. Each query is capped at 100 hits, so treat this as a lower bound, not a census. Output: `research/flame/samples/competitor-github-scan-2026-11-14.tsv` [T].
- **Description keywords** across the 111: "SI" or "AI" in 38; "dashboard" in 21; "evidence", "source", "cited" or "NASA" in 64; "rank" in 7; "Moon", "lunar", "habitat", "rover" or "suit" in 7 [T].
- **Stack convergence.** `api.typesafe.ai` appears in 93 of the first 100 code-search hits. `gemini-4-hydrogen` appears in 19. `psi.nasa.gov/geode-py` appears in 17. Code search is not limited to this challenge [T].

### 6b. Closest competitors

| Repo (created) | Licence | What it does | Threat to A | Threat to B |
|---|---|---|---|---|
| ansonboby/ember-index (11 Nov) | none | ISS, lunar base (≥30 % O₂, ≤10.2 psi), pressurised rover, spacesuit (100 % O₂, 4.3 psi), Mars transit. Weight sliders. Crew-officer game mode. | **Very high.** Same presets and ranking idea. | Medium |
| OSAMABASAM/NASA_flame_in_freefall (1 Nov) | MIT | "Find out in seconds which NASA microgravity fire experiments matter for a crew habitat, and why." Live Vercel demo; 1-minute video. | **Very high.** Same outcome, with a working public demo. | Low |
| jpss2004-bot/flaregrain (13 Nov) | none | Static site ranking 24 PSI investigations. Conflicting NASA numbers shown. Pre-generated, checked model text. | **High.** Same trust angle. | Medium |
| Mohammed-Ayman-2023/Flame-in-FreeFall (13 Nov) | Apache-2.0 | Ranking for a 30 % O₂ and 0.69 atm habitat. "Models trained on the measurements", with uncertainty. | High. **Overclaims prediction**; a judge will flag it. | Medium |
| desanv01/fire-evidence-explorer (11 and 14 Nov) | none | "Research workbench for comparing NASA combustion experiments and tracing evidence." | Low | **Very high.** This is B's pitch. |
| tatuhin09/Sira-firelab (13 Nov) | Apache-2.0 | "Evidence-grounded research dashboard." | Medium | High |
| G3hamza/astrofire (14 Nov); sahanyafernando/astrofire-ai (14 Nov) | none | "Explores, compares, ranks, and interprets NASA PSI microgravity combustion research" (the brief's own wording). | High | High |
| eres0045/spica-firelab, "The 34% Question" (11 Nov) | none | Built on the same O₂-threshold narrative as the lunar hero. | High (hero overlap) | Medium |
| harshita713lab/NASA-Hackathon-flameguard (1 Nov) | none | RAG console (FastAPI, Pinecone, Groq). | Medium | Medium |
| hibawaheed/ember-atlas (9 Nov); MahmudulHasanJoy/FlameAtlas (1 Oct) | MIT; other | 3D flame lab; "AI-powered fire safety advisor … Moon and Mars." | Medium | Low |

### 6c. What the team must do differently (decision points for humans)

These are options for the human team to choose. They are not an AI-chosen idea.

1. **Refuse first.** Show a comparison that refuses incomparable pairs and says why (geometry, O₂ basis, gravity). Most competitors show ranks. Few show refusals.
2. **Show the cleaning ledger.** Display each rejected value and its reason (3400 %, 2100 %, swapped length and width, post-test O₂). None of the READMEs above mention data-error detection.
3. **No predictions.** Avoid "models trained on the measurements" and any risk score.
4. **Evidence-gap hero.** Lead with what the PSI tables cannot answer: no row has O₂, pressure and flow together across the eight investigations, and 126 publications link to only 3 NTRS documents. This is checkable on screen.
5. **Human origin on the first slide.** A dated decision log and an AI-use statement set the project apart from the "SI-powered" crowd.

---

## 7. Judge Q&A: the 10 hardest

Answers are templates. Each must be true for the build by H12. Bracketed text is for the team to fill in.

1. **"Your lunar cabin is 30 % at 10.2 psi, which has the same O₂ partial pressure as Earth's air. Why is it more flammable?"**
   It is not partial pressure. The challenge says flammability depends strongly on oxygen concentration. We show oxygen fraction and total pressure separately and never claim equal pO₂ means equal risk.

2. **"Where do 30 % and 10.2 psi come from?"**
   They are the challenge's expected lunar-cabin level ("30 % or greater", "10.2 psi or less"). NASA's 2018 presentation (NTRS 20180004258) calls 30 % at 10.2 psia the historical shuttle pre-EVA atmosphere, and 34 % at 8.2 psia a future exploration target. We show both as scenarios.

3. **"Did any of these tests run at lunar gravity?"**
   No. Every PSI record we use is microgravity or 1 g. PSI has no partial-gravity combustion data. Partial-gravity tests exist in the literature, using aircraft parabolas and a drop-tower centrifuge. We cite them and make no inference from them.

4. **"What does your score mean?"**
   There is no single score. We show rubric columns: evidence tier, O₂ basis, pressure, flow, gravity and pillar. [Humans] set the weights, and the sensitivity table shows which orders change when they do.

5. **"Did AI invent the numbers?"**
   No. Numbers come only from human-accepted records. Each has a page, table or row locator. Model output is marked "proposed" until a person accepts it. On our three check records: [X of Y fields matched after one retry].

6. **"How do you know the quotes are real, and that the numbers in them are right?"**
   Code matches each quote to the locator's page text, exact after whitespace normalisation. Numbers are checked against the cell or the PDF page. Source errors such as BRE's 3400 % O₂ are listed as rejected, not hidden.

7. **"Why use a model at all? A chatbot could do this."**
   We do not claim Jev is right. We show a no-model baseline beside it. On [6] labelled pairs, [result]. If the baseline ties, we say so.

8. **"Who on your team checked the science?"**
   [Name, role, and what they checked.] If no combustion specialist checked it, say so and show exactly what was checked and by whom.

9. **"This looks like ember-index or flaregrain. What is different?"**
   [One differentiator, shown on screen by 0:20. For example: the refusal-first comparison and the cleaning ledger.]

10. **"Who had the idea? Did the AI?"**
    The human team chose the question and the approach from options that AI tools helped research. The decision log is in the repo, and the AI-use statement is on the project page. [Name the human decision.]

---

## 8. Pre-mortem: five likely ways to lose

| # | How it loses | Early warning sign | Mitigation |
|---|---|---|---|
| 1 | **Sameness.** A judge has seen many preset-sorted PSI dashboards. Creativity scores 2 or 3. | By H8 the first screen matches ember-index or flaregrain. The team cannot finish "Unlike X, we…" | Choose one differentiator by H4 (human decision). Cut the generic rank to a table. |
| 2 | **One visible error.** A combustion judge finds a wrong number, a lunar claim, or "no partial-gravity tests exist." | Any displayed value without a locator. The never-claim lint fails. Zero human-checked records at H12. | Freeze accepted records. Run the never-claim lint in CI. A named reviewer signs off the claims page. |
| 3 | **Corpus stall.** Most records lack test pressure. The cabin filter returns nothing and the hero is empty. | By H4, fewer than 3 accepted records with locators, or no in-band record. | Scope to 3–4 investigations with open sources (BASS, the 2018 presentation, SoFIE, the SAME report). Label coverage. Apply K5. |
| 4 | **Compliance.** Idea origin undocumented; AI-generated code or records unacknowledged; copyrighted quotes committed; NASA marks in the UI. | No decision log by H6. Manifest without hashes. Quotes from DOI papers in the repo. | Repo lint for copyrighted text. Disclosure generated from the manifest. Per-PDF rights check. |
| 5 | **Live path fails on demo day.** 429 or 529, quota, revoked key or latency. The judge sees an error or an unlabelled cache. | H12 "API timeout and cached mode" rehearsal fails. Two 429 or 529 responses in rehearsal. A scenario not pre-cached. | Pre-cache every demo scenario with model ID and date. Show "cached" honestly. Never say "live" unless it is live. Static-first page. |

---

## 9. Kill criteria: hours 0–4, with the switch to Trend Detective

Trend Detective is the backup. It has its own gates, so run them in parallel from H0.

| When | Test | Pass | If it fails |
|---|---|---|---|
| H0 | **Trend entry (K0c):** Earthdata login, plus one Giovanni monthly CSV with units. The Giovanni API returns 401 without a token [T]. | CSV in hand, with units | Backup is dead, so no switch is possible. Continue Flame in cached-evidence scope and say so. |
| H0 | **PSI reproduction:** fetch the PSI-98 table through the working route. SHA-256 matches the manifest. | Match | Use cached copies. Not a kill. |
| H1 | **Model path (K0):** one real Jev call, one Hydrogen extraction of one PUBLIC NTRS document, one Decision-1 adapter call. | Schema-valid output, or a documented error, within 10 s | If neither Jev nor Hydrogen works by end of H2, **switch.** |
| H1 | **Canary (m1):** a planted instruction line in a copy of the BASS text. | Output ignores it | Disable tools and rerun. Not a switch. |
| H2 | **K1 gold records:** three records, each with O₂ and basis, pressure, flow, gravity, one quote and a locator, checked independently by two people. | 3 records, at least 5 of 7 fields each | **Switch** if fewer than 3. |
| H3 | **K3 extraction against gold:** Hydrogen run on the three records. | Numeric fields (O₂, pressure, flow, gravity) match gold on at least 95 % after one retry. Zero quote misses after normalisation. Zero invented values. | **Switch** if numeric fields fail, unless the team keeps a human-only list with no SI value. |
| H3 | **K4 Jev against baseline:** six labelled pairs, top-3 relevance. | Model beats baseline, or the tie is reported honestly | Tie plus K3 failure → **switch.** |
| H4 | **K2 differentiator:** one sentence the team can show on screen, absent from the READMEs of ember-index, OSAMABASAM and flaregrain. | Written and checkable | **Switch** if none exists. |
| H4 | **K5 lunar band:** the scenario at ≥30 % O₂ and ≤10.2 psi returns at least one accepted record with initial O₂ in band and ambient basis. | Pass | No record → drop the lunar hero. With one more failure → **switch.** |
| H4 | **K6 licence gate:** every committed item is CC0 or PUBLIC NTRS, with no verbatim publisher text. | Pass | If the only numeric sources are publisher papers → **switch.** |
| H4 | **Switch rule.** K0, K1 or K2 failing alone switches the project. Otherwise, any two of K3, K4, K5 and K6 switch it. | — | **Trend Detective.** Its gates: Earthdata login passed at H0; monthly CSV with units by H2; seasonal Mann–Kendall by H4 with slope per year. |

---

## 10. What this review did not verify

- No authenticated model call. Jev, Hydrogen and Decision-1 quotas and output quality remain unverified.
- Provider terms for cached outputs (M10) were not read. Enclosed-PDF rights for the SAME, SPICE and Saffire-I reports (B4) were not checked individually.
- The Space Apps brand page and the Local Event timezone were not read.
- The r1 debate files were not re-read. I used the VERDICT and the r2 files. The grok-b file was read to line 332 of 439. The rest is the SPHEREx section and was not needed.
- The files in `research/flame/samples/` that predate this review were not created here. I checked their hashes, sizes and text, not their origin.
- Nothing here is a rights clearance.

---

## 11. Files

**New in this review** (`research/flame/samples/`):
- `psi-route-probe-log.tsv` (route tests, no signed URLs)
- `psi-PSI-{98,99,100,26,25,69,20,102}.json` (eight investigation records)
- `psi{NN}-table-PSI-{NN}.csv` (eight experimental tables)
- `ntrs-{20180004258,20140011099,20200000361,20210022402}.json` (rights records)
- `ntrs-20180004258-full.pdf` (complete NTRS presentation)
- `competitor-github-scan-2026-11-14.tsv` (GitHub scan)
- `judging-guide.html`, `typesafe-models.md`, `typesafe-confidence.md`, `typesafe-errors.md`, `gemini4-hydrogen.html`, `gemini-decision-1.html`, `gemini-rate-limits.html` (rule and vendor snapshots)
- `MANIFEST.tsv` (SHA-256 for everything in the folder, with provenance noted)

**Text extractions** (kept out of the repo because some are copyrighted): `/private/tmp/claude-501/-Users-repathkhan--t3-projects-nasa1/66f46353-d14a-4880-99a5-28780c66174d/scratchpad/pdftext/`

**Not done:** no application code, no bulk downloads (archives total 3.46 TB).
