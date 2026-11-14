# Flame in Freefall: implementation plan (v1, from all findings)

Written Sat 14 Nov 2026, 19:50 GMT. Deadline Sun 15 Nov, 23:59 local. **That leaves about 28 hours** if the local event runs on GMT. Confirm the time zone first (D2).
Builds on `BUILD_PLAN.md`, `UI_SPEC.md`, `RED_TEAM.md`, `OVERSIGHT.md` (rulings R1–R8), `debate/VERDICT.md`, and the current prototype `app/fire-atlas.html` + `app/server.mjs`.

> **Space Apps rule.** AI drafted this plan. The human team chooses and owns the idea. Every **DECISION** line below is the team's call. Record each decision, with its date, in `DECISIONS.md` (D12).

---

## 0. The product in one breath

**Pick where people will live (ISS, Moon base, exploration atmosphere, suit, or custom air). See every NASA microgravity fire test plotted against that air. Find out at once what has been tested near it, what has not, and which studies to read first. Every dot opens its source row.**

Three ideas carry it:

1. **The Gap Map (hero).** All of the roughly 1,000 parsed PSI test rows sit on one O₂-fraction × total-pressure chart. The habitat atmospheres are target boxes. Pick the Moon base and the box lights up. FLEX droplet rows sit inside it. Solid-fuel rows stop at 22.2% O₂. The evidence gap is visible in one frame. Code computes it from rows; no model is involved.
2. **Two rankers, side by side.** A transparent rule (code) and Jev (SI) each rank the studies. An agreement strip says in plain words whether they agree. This is the honesty hook judges remember.
3. **Every pixel traces to a source.** Click a dot, a rank or a sentence to get the CSV row with its SHA-256 hash, the page quote, and the DOI. A **"Caught by code"** ledger shows the rejected source errors (3400% O₂, 0 mmHg, −5.92 cm/s, post-test O₂ read as initial).

**This is not:** a fire-risk predictor, a safety certifier, a lunar-gravity inference, or a chatbot.

---

## 1. Where we are now (prototype audit)

The prototype `app/fire-atlas.html` (935 lines, single file) already has a dithered orbit scene, habitat destinations, Air map / Oxygen ladder / Timeline views, a test list with search, a Jev "next step" call through `server.mjs`, a developer view, a present mode, and a "Caught by code" panel. **That is a strong visual base. Keep the look and the orbit scene.** It has these problems against the findings:

| # | Problem in the prototype | Ruling or finding it breaks | Fix |
|---|---|---|---|
| P1 | Data is only FLEX + BRE, hand-embedded in `const DATA` | BUILD_PLAN §2.3 (10 investigations, all parsed rows, hashes) | Build-time pipeline → `corpus.v1.json` (§3.1) |
| P2 | "Solid tables match on oxygen alone" | §3.5: unknown is never a match | Use the overlap classes `covers / near-O₂ only / near-pressure only / none / unknown` |
| P3 | "Mars habitat 34% / 8.2 psia, 0.38 g" | NTRS calls it an *exploration atmosphere*; R7 forbids gravity inference | Rename it "Exploration atmosphere (NTRS 20180004258)". Show gravity as "none in PSI" |
| P4 | Suggestion chip "Would Nomex burn in a Moon base?" | Never-claim list (prediction) | Reword: "What Nomex tests exist near Moon-base air?" |
| P5 | Keyword parser "stands in for Hydrogen" | M9 disclosure; K0 | Real Hydrogen query parser with schema output. The keyword parser stays as a *labelled* fallback |
| P6 | Jev only judges a "next step" from 4 aggregate counts | Kimi seat: if removing the model changes nothing, drop it | Jev judges what code cannot: relevance, directness and pillar per study (§3.4) |
| P7 | Too many equal-weight entry points (Present, Briefing, 4 views, Developer, Ask) | UX clarity | One 3-step primary flow. Everything else is secondary (§4) |
| P8 | One file, so 3–5 people can't work in parallel | Team throughput | Split into a Vite project with modules (§3.6) |
| P9 | `model: 'jev-latest'` | BUILD_PLAN pins `jev-1.14.0` | Pin the model ID and record it in each cached response |

---

## 2. Architecture overview

```
 BUILD TIME (scripts, run by us)                         RUNTIME
 ─────────────────────────────────                      ──────────────────────────────────────────
 samples/psi_tables/*.csv  ─┐                            Browser (static, works with no keys)
 samples/ntrs/*.txt|pdf    ─┤  fetch+hash                 ├─ corpus.v1.json  (rows, cards, records, rejects)
 psi_json/*.json           ─┘      │                      ├─ cache/jev.v1.json (recorded or FIXTURE)
                                   ▼                      ├─ core (same TS code as build): overlap,
              parse (code, no LLM) + table_maps (human)   │   baselineRank, sensitivity, numberGuard
                                   │                      └─ UI: Gap Map, Rank, Evidence, Ledger
              reject ledger ◄──────┤                                │  only allowlisted ids
                                   ▼                                ▼
       Hydrogen proposes records from paper text   ──►    /api/rank  /api/ask  (one serverless fn)
       code verifies quotes + numbers (hard gate)          ├─ L0 Jev live (≤5 s)
       human accepts (two-person for gold)                 ├─ L1 gemini-decision-1 (labelled)
                                   │                       ├─ L2 recorded cache (labelled + date)
                                   ▼                       └─ L3 baseline only (banner)
       corpus.v1.json + corpus_hash  ──►  Jev 3× per (study, scenario), median, cache
```

**Division of labour (unanimous debate ruling).** Code measures and enforces. Hydrogen extracts and parses language. Jev judges. Humans approve. Every AI surface has a no-model path.

---

## 3. Components to build

### 3.1 Data pipeline (`scripts/`, `packages/core/parse`): owner D

| Component | Does | Done when |
|---|---|---|
| `fetch_psi` | Copies the 16 committed tables + 3 PDFs from `samples/` into `data/raw/`. Writes `manifest.json` (accession, file, sha256, bytes, fetched_at). Never calls PSI at runtime | Hashes match `MANIFEST.tsv` |
| `table_maps/PSI-XX.json` | Column → field, unit, parse hint. Hydrogen proposes each map; a human edits and accepts it | 10 maps accepted |
| `parseTable` | Decodes cp1252 (FLEX) or UTF-8 with BOM. Cleans header typos. Parses `~ 21.5`, `21.5 - 21.7` (min/max), `21; 26.5; 40` (multi-value), and units inside cells. Converts units: mmHg / atm / psi / bar → kPa, mole fraction → %. Keeps initial and post-test O₂ in separate fields | All rows parsed or rejected, with a reason |
| `rejects` | Physical-range guard: O₂ outside 0–100, pressure ≤ 0, negative flow, `3400%`. Each reject keeps its raw cell and reason | The ledger lists ≥ 5 distinct error types |
| `oxygen_location` | `ambient / burner / unknown`. CFI-G burner rows are `burner` and never count toward cabin overlap | Unit test passes |
| `cards/PSI-XX.card.json` | Card built by code from PSI JSON (objective, hardware, DOI, licence, version) plus human fields (pillar, evidence tier, caveats) | 10 cards |
| `records` (gold) | 3–4 deep records, two-person checked: FLEX #19 (heptane, 539.1 mmHg, 0.34 O₂), a Saffire-II or BASS-II row, a SAME report span, and BASS pp. 26–27 (Nomex-III) | **Gate G1** |
| `corpus.v1.json` | Frozen bundle + `corpus_hash`. Budget ≤ 1.5 MB | Builds in CI; same hash twice |

### 3.2 Science core (`packages/core`, TypeScript, shared by build, tests, function and browser): owner A

| Module | Logic |
|---|---|
| `units` | psi ↔ kPa ↔ mmHg ↔ atm. pO₂ is shown but **never used as a flammability proxy** |
| `overlap(row, scenario, tol)` | Default tolerances O₂ ±3 points, pressure ±15% (D5). Classes `covers / near-O₂ only / near-pressure only / none / unknown`. A null field means `unknown`, never `none` |
| `baselineRank` | Lexicographic over the human priority order (pillar match > covers count > evidence tier > near count). Ties break by accession. **No composite score and no weights** (R1) |
| `sensitivity` | Re-ranks under all 24 priority orders. Badge: "Top 3 stable under all orders" or "depends on priorities (n of 24)" |
| `gapStatement(scenario)` | Builds the hero sentence and its **scope line** from rows. It runs only if K5 passes. Unknown-O₂ solid tables (PSI-26, 100, 101, 102, 47) are counted as "unknown", not "absent" |
| `agreement` | Top-3 overlap and Spearman ρ between the baseline and Jev. Produces a code-written sentence ("Top 3 identical. Jev adds no reordering here.") |
| `verifyQuote` / `verifyTableRow` | NFKC normalisation, then substring match on the locator's own page, then number-to-cell check. Negative tests: fabricated quote, wrong page, wrong number, wrong document, hash mismatch |
| `numberGuard` + `claimLint` | Every numeral in AI text must exist in a cited record or the scenario. A banned-phrase regex catches `safe`, `certif`, `predicts`, `extinction limit`, `lunar result`, `none exists`, `first`, `novel`… The lint runs in CI over the UI copy and the deck text too |

### 3.3 AI layer (`functions/api`, `packages/core/ai`): owner A

| Call | Model | In → Out | Where it runs | Why code can't do it |
|---|---|---|---|---|
| **Column map** | Hydrogen (Interactions API, `Api-Revision: 2026-05-20`) | header + 3 rows → `{column → field, unit, hint}` | Build time | Messy, typo-laden headers |
| **Paper extract** | Hydrogen | page-marked text → schema records (quote + page) | Build time | Reading prose |
| **Ask (query parser)** | Hydrogen | free question → `{material?, fuel_phase?, scenario?, pillar?, o2?, kpa?}` (enum schema) | Runtime `/api/ask` | Language → structured filter. **Code** then answers from rows |
| **Study judgement** | Jev `jev-1.14.0` (`/v1/systemone`) | card + code summary → `regime_relevance` (noul), `evidence_directness` (score 0–3), `pillar` (choice) | Build-time cache; live optional | Judging relevance and directness from objectives and quotes |
| **Explain** | Hydrogen | accepted record + scenario → `{summary, claim_ids[], limitations[]}` | Build-time cache | Prose. It must pass `numberGuard` or a code template is shown instead |
| **Fallback** | `gemini-decision-1` (`/v1beta/decisions`, `input` not `state`) | same questions | Adapter | Used if Jev is down. Always labelled `decision-1`, never shown as Jev |

Jev rules: no numerals inside criteria text; call 3× and take the median; bin to 0.1; label "model confidence (ordinal), not a probability the science is true." Keys stay **only** in function env vars. The function accepts allowlisted IDs (or a question of 200 characters or fewer for `/api/ask`, schema-constrained, with tools disabled). It has a per-IP rate limit and a $5 spend cap.

**Gate G3 (Jev earns its place).** On ≥ 16 labelled (study × scenario) pairs, keep the Jev column only if it is not worse than the baseline on top-3 *and* adds a disagreement the reviewers find informative. Otherwise the UI says "The model did not improve on the baseline". That is still an honest, scoreable result.

### 3.4 Frontend components (`apps/web`, Vite + React + TS, SVG/Canvas, no chart library): owners F + S

| Component | Purpose | Notes |
|---|---|---|
| `AppShell` + `StatusChip` | Top bar: Explore · Rank · Sources · About. Chip shows `LIVE` / `CACHED <date>` / `FIXTURE` / `NO-AI` | Always visible; never lies |
| `HabitatPicker` | 4 presets + Custom (O₂ %, kPa sliders). Shows O₂ fraction, total pressure and pO₂ separately, plus the gravity chip "partial gravity: none in PSI" | Arrow-key radio group. State lives in the URL (`?s=lunar-cabin-example&p=prevention`) |
| `OrbitScene` (ported) | The existing dithered Earth → Moon → Mars-class scene. Matching tests fly to the chosen habitat | **Intro and transition only.** Pauses under reduced motion. Never carries data that isn't on the Gap Map |
| **`GapMap`** (hero) | Scatter of every row: x = total pressure (kPa, log), y = O₂ %. Shape = fuel phase (droplet / solid / gas). Habitat boxes = tolerance windows. Unknown-pressure rows go on a separate **"pressure not reported" rail**, not on the axis. Burner-O₂ rows are hollow and excluded. **No curves, no "safe zone", no limits** | Canvas for points, SVG for axes and labels (crisp). Tolerance box animates 300 ms. Hover → tooltip; click → `EvidenceDrawer` |
| `GapStatement` | Code-written hero sentence + scope line + "n of N rows" | Hidden if K5 fails |
| `RankTable` | Columns: Base # · Jev # · Δ · Study · Pillar (human) · Tier (human) · Overlap (code) · Evidence kind · Jev relevance / directness / pillar. Metadata-only studies are listed below as "not ranked" | Native `<table>`, `aria-sort`, roving tabindex. Jev cells say "not available", never blank |
| `AgreementStrip` | The one-sentence verdict comparing baseline and Jev, plus the sensitivity badge | The demo's key frame |
| `PrioritiesSheet` | Reorder the 4 baseline keys; edit tolerances. The rank re-sorts live | Labelled "PROPOSED" until D5 is signed |
| `StudyCard` | Objective, fuels and geometry, conditions tested vs scenario, hardware family, sensors, transfer limits (gravity, geometry, O₂ basis), equipment link (SAME → detector spinoff) | Covers the challenge's "consider displaying" list |
| `CompareDrawer` | Two studies side by side. Mismatches are written as text. **Refuses** incomparable pairs and says why (e.g. "1 m fabric vs 1 mm droplet") | Differentiator vs competitors (RED_TEAM §6c) |
| `EvidenceDrawer` | Shows one of three evidence kinds: **quote** (with "code-verified on p. N"), **table row** (raw cells + sha256 + row index), **paraphrase** ("team · not quoted"). Plus the DOI and the PSI record link | Every number in the app lands here in one click |
| `AskBar` | Free question → parsed chips the user can edit → code answer → optional Jev judgement. A **live pipeline trace** shows `HYDROGEN parsed → CODE matched 24 rows → JEV judged` | The prototype's step-trace idea, made real |
| `CaughtByCode` | Ledger of rejected cells, each with its raw value, reason and source row | Second wow moment; also a strong Validity signal |
| `DitherPlate` | A NASA microgravity flame still in 4×4 Bayer, 1-bit, with an Original/Dithered toggle and credit | Dither on imagery only, **never on numbers, axes or text** |
| `ProvenancePanel` | corpus_hash, model IDs, cache dates, reviewer names, download of the provenance CSV/JSON | Replaces the "Developer view" |
| `AboutPage` | Method, limits, SI disclosure, attribution, non-endorsement notice | Must stand alone for judges |

---

## 4. UX: one clear flow

**Rule: a judge who never reads instructions reaches the insight in 3 clicks and 20 seconds.**

```
 ① WHERE WILL PEOPLE LIVE?        ② WHAT HAS NASA TESTED NEAR THAT AIR?       ③ WHAT SHOULD I READ, AND WHY?
 [ISS] [Moon base] [Exploration]   Gap Map lights up  ·  hero gap sentence     RankTable (baseline | Jev) + AgreementStrip
 [Suit] [Custom…]                  "24 FLEX rows · 0 solid rows above 22.2%"   → click a study → StudyCard → EvidenceDrawer
```

- **First screen = step ①**, with the orbit scene behind it. One primary button per step. Present mode, the briefing and the provenance panel move into a secondary menu.
- **Instant first, AI second.** The code result (Gap Map, baseline rank) renders in under 100 ms from local data. Jev and Hydrogen results stream in after, with skeletons and a status chip. A slow model never blocks the screen.
- **Plain words on screen, precise words on hover.** "Tested near this air" (hover: "O₂ within ±3 points and pressure within ±15%"). "Pressure not reported" rather than "null".
- **Empty is a result.** Suit preset: "No PSI test in this set matches 100% O₂ at 4.3 psi. This is a valid result, and it is the gap." The chip offers "show nearest rows".
- **Honesty chips are consistent.** Grey = code. Blue = SI (Hydrogen/Jev) with the model ID. Outline = human-reviewed. These three badges are always in the same place.
- **Keyboard and accessibility.** Full keyboard path, 44 px targets, AA contrast in both themes, shape plus colour encoding on the map, a table fallback for the Gap Map, and `prefers-reduced-motion` (no orbit animation, instant transitions).
- **375 px works.** On a phone the Gap Map stacks above the table, and the drawers become sheets.

---

## 5. Wow factor for judges (ranked by impact per hour)

| # | Moment | Why it lands | Cost |
|---|---|---|---|
| 1 | **Gap Map reveal.** Click "Moon base": the orbit camera flies to the Moon, cross-fades into the Gap Map, the tolerance box snaps on, 24 FLEX droplets light up, and the solid-fuel cloud stops below 22.2% | One frame shows the challenge's own concern (more O₂ in lunar habitats) measured against NASA's real data | M (data ready; chart + transition) |
| 2 | **"Click any dot"** → raw CSV row + hash + DOI | Proves nothing is invented. A judge can check it themselves | S |
| 3 | **Caught by code** ledger, animated as rows are rejected on load | No competitor README shows data-error detection (RED_TEAM §6c) | S |
| 4 | **Baseline vs Jev agreement strip**, honest either way | Turns "SI-powered" into a measured claim, with n | M (needs G3) |
| 5 | **Ask in plain English → visible pipeline trace** (Hydrogen → Code → Jev) | Shows the AI division of labour live, in 3 seconds | M |
| 6 | **Compare that refuses** ("can't compare: 1 m fabric vs 1 mm droplet") | Expert-grade restraint; combustion judges will respect it | S |
| 7 | Dithered microgravity flame plate (blue spherical candle flame) | Signature look in the first 5 seconds | S |
| 8 | **Gap brief export**: one page per habitat (tested / untested / read first / limits), with citations | Real usefulness: a researcher leaves with something | S–M, stretch |

---

## 6. Scientific guardrails (built in as code and tests, not prose)

1. **Gravity.** Every row is labelled "microgravity (ISS)" or "1 g". Show "partial gravity: none in PSI" on every scenario. No interpolation, no "0 g and 1 g bound the Moon", no "safer" (R7).
2. **O₂ basis.** Only ambient O₂ counts toward overlap. Burner O₂ (CFI-G 85%) is excluded and drawn hollow. Initial and post-test O₂ are separate fields (BASS-II reaches 40.4% post-test).
3. **pO₂ ≠ flammability.** Show fraction and total pressure. Show pO₂ only as context, with the note "equal pO₂ is not equal flammability" (S1).
4. **Unknown ≠ none.** Null fields are counted and shown, never coded as zero.
5. **Geometry confound.** The compare drawer shows sample size and geometry. There is no cross-geometry claim, and the BASS width confound is noted (S7).
6. **Wording.** Write "visible flame extinction diameter", not "extinction limit". Write "investigation date", not "run date".
7. **Flow anchor.** Mark the 15–20 cm/s ECLSS cabin-flow band (NTRS 20180004258) on flow displays.
8. **Presets are sourced examples.** 30% / 10.2 psi comes from the challenge text. 34% / 8.2 psia comes from NTRS 20180004258. Each preset is labelled "illustrative, not a design value".
9. **CI lint** runs the never-claim list (RED_TEAM §2b) over UI strings, AI outputs and deck text. The build fails on a hit.

---

## 7. Making front end and back end smooth

- **Static first.** The judged site works with no keys, no function and no PSI access. The Jev cache (or labelled FIXTURE) ships with the build.
- **One core, run everywhere.** The same `packages/core` runs in build, tests, function and browser, so numbers can't drift between UI and backend.
- **Performance budget.** Corpus ≤ 1.5 MB gzip-friendly JSON, loaded once and memoised by scenario. Canvas draws ~1,000 points at 60 fps. Interaction under 100 ms. Lazy-load the orbit scene. Dither image ≤ 400 KB.
- **Request hygiene** (kept from the prototype). Abort in-flight requests on scenario change. Use request IDs so stale responses are dropped. Cap waits at 5 s, then fall back L0 → L1 → L2 → L3 with a visible chip.
- **Contract tests.** Validate every function response with the same JSON schema the UI uses. Bad model output becomes "not available", never a crash.
- **Failure drills** (rehearse before submission): no key; Jev 429/529; timeout; offline; corrupted cache (hash mismatch blocks ranking with a message).
- **Deploy.** Cloudflare Pages + one Pages Function (or Vercel). Run a secret scan on `dist/` and git history. Request FortiGuard classification for the new domain.

---

## 8. Team split and schedule (re-planned from now: Sat 19:50 GMT)

Roles: **D** data/science · **A** AI/backend · **F** frontend · **S** story/design/QA. The 4th/5th person is the independent reviewer for gold records and labels. With 3 people: D+S, A, F.

| Block (GMT) | D | A | F | S | Gate |
|---|---|---|---|---|---|
| **Sat 20:00–22:00** | Copy tables, manifest, start `parseTable` on FLEX/BASS-II/Saffire | **K0: one real Jev, Hydrogen and decision-1 call each**; record latency | Scaffold Vite+React+TS; port tokens and `OrbitScene`; URL state | Write `DECISIONS.md` (D1, D2, D4, D5, D7, D12); fix P2–P4 copy | **K0** by 22:00. If both models fail → baseline-only product, said honestly |
| **Sat 22:00–01:00** | Parse all 10 tables + rejects; 2 gold records double-coded | `core`: units, overlap, baselineRank, sensitivity + unit tests | `HabitatPicker`, `GapMap` on real corpus | K2 differentiator sentence (checked vs ember-index / OSAMABASAM / flaregrain); **save a draft submission** | **G1 + K5** (lunar hero go / no-go) |
| **Sun 01:00–07:00** | Sleep (on-call phone) | Sleep | Sleep | Sleep | — |
| **Sun 07:00–11:00** | Gold records 3–4; cards ×10; labelled pairs (2 labellers, ≥ 16) | verifyQuote + negative tests; Jev 3× runs → cache; decision-1 adapter | `RankTable`, `AgreementStrip`, `EvidenceDrawer`, `CaughtByCode` | Copy pass + claimLint; slides 1–4 draft | **G2** verifier green |
| **Sun 11:00–12:00** | Adjudicate labels | **G3** metrics; D8 keep/hide Jev | Wire fallback ladder + chips | — | **T-12h cut-line** (§9) |
| **Sun 12:00–16:00** | Spot-check 10 random claims vs sources | `/api/ask` (Hydrogen parser) + `numberGuard`; deploy; secret scan | `AskBar` + trace, `StudyCard`, `CompareDrawer`, `DitherPlate`, mobile + keyboard | Slides 5–7; About page; attribution; SI disclosure | Public URL works |
| **Sun 16:00–19:30** | Licence manifest, rights notes | Failure drills; perf check | Polish: transitions, empty states, reduced motion | Rehearse deck; record ≤ 25 s video (stretch) | — |
| **Sun 19:30** | | | | | **Freeze** (T-4h): fixes for wrong claims, links, secrets, deploy only |
| **Sun 21:30** | | | | | **Submitted and checked from a logged-out browser** |

## 9. Cut-lines (scope ladder)

- **Must ship (MVP):** the presets, Gap Map, baseline rank, EvidenceDrawer, CaughtByCode, status chips, About/disclosure, the 7-slide deck.
- **Should ship:** Jev column + AgreementStrip (if G3 passes), StudyCard, CompareDrawer, orbit → map transition.
- **Could ship (cut at T-12h if late):** AskBar with live Hydrogen, Custom atmosphere, PrioritiesSheet drag UI, gap brief export, video.
- **Won't:** raw-archive downloads (FLEX alone is 924 GB), any predictive model, partial-gravity anything, live PSI calls, a chatbot.

## 10. The 7-slide deck (default demo, title included)

1. Title + the question ("Which NASA fire tests inform a Moon-base atmosphere?") + the dithered flame.
2. Problem: 3.46 TB of archives, 126 publications, hard to compare. Our scope: 10 investigations, ~1,000 parsed rows.
3. **Gap Map screenshot** + the hero sentence and its scope line.
4. Rank: baseline vs Jev + the agreement strip, with real ρ and n.
5. Trust: evidence drawer (quote / row / paraphrase) + the Caught-by-code ledger.
6. How the AI is used and tested (code / Hydrogen / Jev boxes, G3 result) + limits (gravity: none in PSI; not a safety tool).
7. Team decisions (D12), links, licences, SI disclosure, next steps (add LUCI/FM2 partial-gravity data when it reaches PSI).

## 11. Decisions the team must make tonight

| ID | Decision | Proposed default |
|---|---|---|
| D1 | Direction: Gap Map + ranker desk built on the Fire Atlas visuals | Yes |
| D2 | Local deadline time zone | GMT (confirm) |
| D4 | User + outcome sentence | Grad researcher / engineer: "a defensible reading list and the evidence gaps for my habitat air" |
| D5 | Priority order + tolerances | pillar > covers > tier > near; ±3 pts O₂, ±15% pressure |
| D7 | Presets and wording | ISS, Moon base (example), Exploration (NTRS), Suit, Custom |
| D8 | Keep Jev column? | Decided at G3 by the rule |
| K2 | One differentiator sentence | Candidate: "Every dot is a real PSI test row you can open, and the app shows the data errors it rejected." |
| D12 | Human contribution statement | Written by the team, in its own words |

## 12. Definition of done

- [ ] Three presets go end to end on cached data in under 20 s and 3 clicks.
- [ ] Every number on screen opens a source (row + hash, or quote + page, or paraphrase + locator).
- [ ] Hero numbers (24 FLEX rows ≥ 30% O₂; solid max 22.2%) recomputed by two people.
- [ ] Verifier negative tests fail as designed; claimLint is clean in CI.
- [ ] Fallback drill passes: no key → baseline-only banner; Jev down → decision-1 (labelled) → cache → baseline.
- [ ] Secret scan clean; no NASA insignia; attribution + CC0 / NTRS rights listed; SI disclosure covers code, data and planning.
- [ ] Keyboard-only path, 375 px width, reduced motion and AA contrast checked.
- [ ] Deck has 7 slides including the title; site and repo are public; submission checked from a logged-out browser.
