# FIRE ATLAS: full product and build spec (v2)

Status: master spec for the multi-agent build. Written Sat 14 Nov 2026, about 20:00 GMT. Space Apps deadline Sun 15 Nov, 23:59 local.
Working name **Fire Atlas** (the human team picks the final name).
This file supersedes `research/flame/IMPLEMENTATION_PLAN.md`. Science, data and AI rules still come from `research/flame/BUILD_PLAN.md`, `RED_TEAM.md`, `OVERSIGHT.md` (rulings R1 to R8) and `research/debate/VERDICT.md`. Where this file is silent, those files win.

> **Space Apps rule.** AI may not originate the idea. The human team owns the concept and records its decisions in `DECISIONS.md`. Agents build; humans approve science (gold records, rubric order, claims).

---

## 0. Rules for every agent (read first)

1. **Stay in your lane.** Edit only the directories your workstream owns (§17). If you need something from another lane, code against the contract in `packages/contracts` and leave a `TODO(contract):` note in your PR summary. Never edit `packages/contracts` without the lead's approval. Propose changes in your final report.
2. **Contracts are law.** All shared types live in `packages/contracts/src/index.ts`. Import from `@fire/contracts`. Do not redefine shared shapes locally.
3. **No invented science.** Every number shown to a user comes from a parsed table row, a code-verified quote, or a human-accepted record. Never hard-code a finding. If data is missing, show "unknown" or "not reported", never 0.
4. **Never fake human approval.** `review.by`, `approver` and `approved_on` are typed by humans only. Agents may create records with `review.state: "proposed"`.
5. **Never put secrets in the client or in the repo.** Keys live in server env vars (`.env.local` in development, untracked). `VITE_*` variables never hold secrets.
6. **Fixtures are labelled.** Any hand-written or mock data carries `"fixture": true` and renders a `FIXTURE` chip.
7. **Copy rules.** No em dashes or en dashes in any user-visible string. No "safe", "unsafe", "certified", "validated", "predicts", "fire risk", "first", "novel", "none exists". Write "none in PSI". `pnpm lint:claims` enforces this.
8. **Accessibility is not optional.** Keyboard path, visible focus, AA contrast, reduced motion and screen-reader labels ship with each component, not later.
9. **Tests ship with code.** Every core function has unit tests. Every screen has at least one Playwright smoke path.
10. **Finish with a report.** Say what you built, which acceptance items pass, what is stubbed, and which contract changes you propose.

---

## 1. Product

### 1.1 The promise
**Pick where people will live in space. See every NASA microgravity fire test plotted against that air. Learn in a minute what has been tested near it, what has not, and what to read first. Every dot opens its source.**

### 1.2 Who it is for
| Persona | Need | What they leave with |
|---|---|---|
| Graduate researcher / aerospace engineer (primary) | A defensible literature screen for a habitat atmosphere | A ranked reading list, the evidence gaps, and a citable brief |
| Professor / lab lead | Teach and scope experiments | Gap maps for proposals and a shareable link |
| Undergraduate / curious adult | Understand why fire behaves differently in space | Learn mode, narrated tour, the candle demo |
| Space Apps judge | Find the insight in 30 seconds and trust it | Present mode, Gap Map reveal, the "Caught by code" ledger |

### 1.3 Jobs to be done
1. "Which NASA tests ran at conditions near my habitat air?"
2. "Where is the evidence thin or missing?"
3. "Which studies should I read first for prevention, detection or suppression, and why?"
4. "Show me the exact source row so I can cite it."
5. "Explain this to me (or my class, or my boss) in two minutes."

### 1.4 Non-goals
Not a fire-risk predictor. Not a material approval tool. No partial-gravity inference. Not a chatbot. No raw-archive browsing (FLEX alone is 924 GB). No paywall on NASA-derived evidence (§6).

---

## 2. Experience architecture

### 2.1 Routes
| Route | Screen | Owner |
|---|---|---|
| `/` | Landing (hero with dithered orbit, two CTAs, pricing teaser below) | W1 |
| `/briefing` | Mission Briefing wizard (4 screens) | W1 |
| `/atlas` | Workspace: Gap Map + side panel + timeline + audio bar | W4 (map) + W5 (panels) |
| `/study/:accession` | Study page | W5 |
| `/compare?a=PSI-69&b=PSI-25` | Compare | W5 |
| `/duel?h1=earth-iss&h2=lunar-cabin-example` | Duel mode: two habitats, split map | W4 |
| `/learn` | Learn mode (no live AI) | W1 |
| `/present` | Present / judge mode (fullscreen, 7 beats) | W1 |
| `/brief/:scenario` | Gap Brief (print-ready, export PDF) | W5 |
| `/pricing` | Plans and pay buttons | W1 |
| `/account` | Licence, plan, usage, manage billing | W1 |
| `/checkout/success`, `/checkout/cancel` | Post-payment | W1 |
| `/about`, `/method`, `/credits` | About, method and limits, attribution, SI disclosure | W5 |
| `/flight-rules` | Hidden easter-egg page (§9) | W1 |
| `*` | 404 "drifted out of the corpus" | W1 |

### 2.2 Modes (cross-cutting, set in the store and the URL as `?mode=`)
| Mode | What changes | Entry |
|---|---|---|
| **Explore** (default) | Full workspace, all panels | Landing CTA "Explore the map" |
| **Briefing** | Wizard, then workspace with coach marks | Landing CTA "Start briefing" |
| **Listen** | Audio overview drives the UI: the map, highlights and drawers follow the narration cues | Play button on the audio bar, `L` key |
| **Present** | Fullscreen, 1.25x type, 7 beats, clicker keys (arrows, PageUp/PageDown, space), optional narration | `/present`, `P` key |
| **Learn** | Plain language, bigger visuals, the candle demo, glossary always on, **no live AI calls** (Gemini is 18+), pre-rendered audio only | `/learn` |
| **Expert** | Raw columns, units as written, hashes, model distributions, request inspector | Toggle in the top bar, `E` key |
| **Duel** | Two habitats side by side with linked zoom | `/duel`, from the scenario bar |
| **No-AI** | Baseline only; AI columns hidden with a banner | Automatic when keys are absent; manual toggle |
| Themes | **Night Ops** (dark, default), **Paper** (light, print), **High Contrast** | Top-bar menu, `T` key |

Modes are composable where sensible (Expert + Duel, Listen + Present). Learn forces No-AI for live calls.

### 2.3 End-to-end journey (the golden path; must work in 3 clicks and under 20 seconds)
```
Landing ──"Start briefing"──► Briefing (habitat → concern → fuel → summary)
   │                                       │
   └──"Explore the map"──────────────────► Atlas workspace
                                           ├─ Gap Map lights up the habitat box (hero sentence on top)
                                           ├─ Side panel: Studies (baseline | Jev), Selection, Caught by code
                                           ├─ Timeline scrubber 2009 → 2021
                                           └─ Audio bar: "Listen to this briefing" (2 min)
                                                 │
                       click a dot / row ────────► Evidence drawer (row + hash + DOI) ──► Study page ──► Compare
                                                 │
                                       "Export brief" ──► Gap Brief (PDF / link / BibTeX)
```

---

## 3. Screens and components

### 3.1 Landing `/` (taste rules apply: hero ≤ 2-line headline, ≤ 20-word subtext, 2 CTAs, no eyebrow spam)
- **Hero, asymmetric split.** Left: headline "Where will astronauts breathe, and has NASA tested fire there?" (team may change), subtext "Every NASA microgravity fire test, mapped against the air of future habitats. Every dot opens its source." CTAs: **Start briefing** (primary), **Explore the map** (secondary).
- Right: the **Orbit scene** (ported from `app/fire-atlas.html`): dithered Earth, Moon and a Mars-class body, with test flames orbiting Earth. On CTA hover, a handful of flames drift toward the Moon (motivated motion: it previews what happens next).
- **Below the hero (in this order, each a different layout family):**
  1. "One frame" strip: an annotated, real screenshot-like *live* mini Gap Map (a real component, not a fake screenshot) showing the lunar box.
  2. Three-beat explainer as a horizontal scroll-snap rail: *Pick the air* / *See what was tested* / *Open the source*. Each beat has a 4-second looping muted capture or a live mini component.
  3. "Caught by code" teaser: 3 real rejected cells (3400% O₂, 0 mmHg, -5.92 cm/s) typed out like a teleprinter.
  4. Audio teaser: play the 30-second landing overview (ElevenLabs, captions shown).
  5. Pricing teaser (Free / Researcher / Lab) linking to `/pricing`.
  6. Data credit + non-endorsement + SI disclosure links.
- No logos of NASA or Space Apps. Text credit only.

### 3.2 Mission Briefing wizard `/briefing`
Goal: a first-time user gets a meaningful view without knowing any jargon. Four screens, a progress track of habitat glyphs (no "Step 1 of 4" labels), Back/Next, `Esc` to skip to the atlas, everything mirrored to the URL so the finish link is shareable.

| Screen | Question (plain) | Inputs | Live feedback |
|---|---|---|---|
| Habitat | "Where will crews breathe?" | Cards: ISS / Earth air (21%, 101.3 kPa), Moon base example (30%, 70.3 kPa), Exploration atmosphere (34%, 56.5 kPa, NTRS 20180004258), Spacesuit (100%, 29.6 kPa), Custom (O₂ and pressure sliders, unit-aware text inputs accept "10.2 psi", "0.7 atm", "530 mmHg") | Mini Gap Map preview with the habitat box and a live count "N tests nearby" |
| Concern | "What worries you most?" | Prevention: "Will materials catch and spread fire?" / Detection: "Will we notice smoke early?" / Suppression: "Can we put it out?" / "Just exploring" | One-line note on what PSI covers for that concern |
| Fuel (optional) | "Anything specific?" | Chips: Solid (fabric, plastic) / Liquid droplet / Gas; material autocomplete from the corpus (PMMA, Nomex, SIBAL, heptane, methanol…) | Count updates with a number tween |
| Summary | "Your briefing" | Code-written sentence, e.g. "Prevention evidence near 30% O₂ at 70 kPa, solid materials: 0 tests in PSI report oxygen this high. N liquid-droplet tests are nearby." (all counts computed by code; never hard-code them)" | Buttons: **Open the atlas**, **Listen first** (starts Listen mode) |

After the wizard: 3 coach marks in the atlas (habitat box, any dot, Studies panel), each dismissible, never shown twice (localStorage, wrapped in try/catch). `?` reopens the tour. A "New briefing" button lives in the scenario bar.

### 3.3 Atlas workspace `/atlas`
Layout (desktop ≥ 1024 px): top **Scenario bar** (habitat chip, concern chip, fuel chip, each editable inline; status chip; mode toggles; Export brief). Main: **Gap Map** (fluid, left). Right: **side panel** 420 px with tabs *Studies*, *Selection*, *Caught by code*, *Notes*. Bottom: **Timeline scrubber** and **Audio bar**.
Tablet: side panel becomes a resizable bottom sheet. Phone (375 px): map on top (55vh), tabs below, drawers become full-height sheets.

Above the map, a one-line **"What you are seeing"** sentence in plain words (generated by code) and the **hero gap sentence** with its scope line (only if gate K5 passed).

### 3.4 The Gap Map (hero component, W4). Detailed spec
**Encodes:** x = total pressure (kPa), log scale by default (toggle linear), y = O₂ (% by volume, ambient), every parsed test row as one mark.
- Shape = fuel phase: circle droplet, square solid, triangle gas, diamond aerosol. Colour = fuel phase too (data palette, §7.3), never the only cue.
- Burner-stream O₂ rows (CFI-G): hollow marks, excluded from counts, legend says so.
- Rows with unknown pressure: placed on a **"pressure not reported" rail** to the left of the axis at their O₂ value. Rows with unknown O₂: a **rail below** the axis. Unknown is never plotted as 0.
- Habitat targets: tolerance rectangles (O₂ ±3 points, pressure ±15%, from the store). Selected habitat is solid outline + label; others are faint.
- Reference marks: Earth sea level (101.3 kPa), 21% O₂ line, constant-pO₂ curves (dashed, labelled "equal O₂ partial pressure, not equal flammability"), and the "no solid-fuel row reports O₂ above 22.2%" band shown as a text annotation on the empty region (an absence of rows, not a limit).
- **No curves fitted. No "safe zone". No limit lines.**

**Interactions (all must work with mouse, touch and keyboard):**
| Interaction | Behaviour |
|---|---|
| Zoom | Wheel / trackpad pinch (zoom to cursor), touch pinch, double-click zoom in, Shift+double-click out, `+`/`-` keys, on-screen zoom buttons. Range 1x to 40x. Axes re-tick to "nice" values on every zoom |
| Pan | Drag, two-finger drag, arrow keys when the map has focus (Shift = faster) |
| Zoom to habitat | Clicking a habitat chip animates (450 ms, ease-out, spring-free) to fit its box with 20% padding |
| Reset | `0` key or "Fit all" button |
| Minimap | Bottom-right inset showing the full domain with the current viewport rectangle; drag the rectangle to pan |
| Hover | Crosshair with live readout ("31.0% O₂ · 71.2 kPa · 10.3 psi"), nearest mark highlighted, tooltip: investigation, test ID, fuel, O₂, pressure, date |
| Click a mark | Opens the Evidence drawer for that row; mark gets a selection ring; URL updates `sel=PSI-69:19` |
| Stacked marks | Identical conditions (common in FLEX) render as one mark with a count badge; clicking fans them out in a small radial "spider" (deterministic order) |
| Box select | Drag with Shift (or the "Select area" tool) to select a rectangle; side panel switches to *Selection* with counts by investigation and fuel |
| Drag the habitat | In Custom habitat, the tolerance box itself is draggable and its edges resizable; O₂/pressure inputs update live. This is the "what if" moment |
| Legend filters | Click a legend item to toggle; Alt-click to solo. Filtered marks fade to 10% (never vanish without a count) |
| Linked highlighting | Hover a study row in the side panel: its marks glow, others dim. Hover a mark: its study row highlights |
| Timeline | Scrubber 2009 → 2021 by test date. Play animates marks appearing in date order (6 s total). Marks without a date appear at the end with a note |
| Units | Toggle kPa / psi / atm / mmHg for the x-axis and readouts |
| Snapshot | "Save image" exports PNG with a citation footer (sources, corpus hash, date) |
| Accessible alternative | "Table view" toggle swaps the canvas for a sortable data table with the same filters; screen-reader summary sentence updates on every change; arrow keys jump mark to nearest mark when in "mark navigation" (`M` key) |

**Rendering and performance:** Canvas 2D for marks (devicePixelRatio aware), SVG overlay for axes, labels, boxes and annotations (crisp text, never dithered). `d3-zoom` for the transform, `d3-scale` for scales, `d3-quadtree` for hit testing (rebuild only on data change). Zoom transform lives outside React state (ref + rAF). Target: 60 fps pan/zoom on 2,000 marks on a mid laptop; hover hit-test under 2 ms. Respect reduced motion (no animated transitions; instant zoom).

### 3.5 Orbit scene (W4)
Port the dithered scene from `app/fire-atlas.html` into `features/orbit`. Uses: landing hero, wizard habitat screen background, the transition into the atlas (camera flies to the chosen body, cross-fades into the Gap Map, 900 ms). Lazy-loaded. Paused when off-screen (IntersectionObserver) and under reduced motion (static frame). Mars-class body is labelled "Exploration atmosphere", never "Mars result".

### 3.6 Side panel (W5)
**Studies tab.** The two-ranker table (BUILD_PLAN §3.5, §3.6): Base # · Jev # · Δ · Study · Pillar (human) · Tier (human) · Overlap (code) · Evidence kind · Jev relevance · Jev directness (ordinal glyph) · Jev pillar. Metadata-only studies grouped below as "not ranked". Above the table: **Agreement strip** (code-written sentence: "Top 3 identical. Jev adds no reordering here." or "Jev moves FLEX to #1"), and the sensitivity badge. Row reorder animates with Motion `layout` (120 ms). Sticky header, `aria-sort`, roving tabindex, Enter opens the study. "Ranking priorities" opens a sheet to reorder the four baseline keys (drag or arrow buttons) and edit tolerances; re-sorts live; labelled PROPOSED until D5 is signed.
**Selection tab.** Counts of the current box selection by investigation, fuel phase and overlap class; "Copy as CSV"; "Open in compare".
**Caught by code tab.** Ledger of rejected cells: raw value, reason, investigation, row, source hash. Animated typeout on first open (once). Filter by reason.
**Notes tab** (Researcher plan feature; free users get 3 notes): pin rows and write notes; included in the Gap Brief.

### 3.7 Evidence drawer (W5)
Slides from the right (sheet on phone). Three evidence kinds, each with its own layout:
- **Table row:** the raw CSV cells as written (mono), the parsed values with units, the SHA-256 (first 12 hex, copy button), row index, PSI accession, DOI link, licence CC0-1.0.
- **Quote:** the verbatim quote, page number, a "checked against the source text by code" badge, DOI / NTRS link.
- **Paraphrase:** team paraphrase labelled "Paraphrase (team), not quoted", locator, DOI.
Plus: gravity chip ("microgravity (ISS)"), O₂ location (ambient / burner / unknown), transfer limits, "Copy citation" (APA, BibTeX), prev/next row arrows (`[` and `]`), `Esc` closes and returns focus to the mark.

### 3.8 Study page `/study/:accession` (W5)
Header: acronym, title, DOI, PSI version, licence, pillar chips, evidence tier with its one-line rule. Sections: Objective (from PSI JSON) · Fuels and sample geometry · Conditions tested (mini Gap Map of this study only, with the current habitat box) · Variables (how its tests differed) · Sensors / measurements · Hardware family (CIR-MDCA, CIR-ACME, MSG duct, Saffire) · Why this rank (code template, plus Hydrogen explanation if it passed the number guard) · Transfer limits · Earth applications (spinoff links where relevant: SAME detector) · All rows table · Related studies (same hardware family).

### 3.9 Compare `/compare` (W5)
Two studies side by side, aligned rows: objective, fuel phase, geometry, O₂ range, pressure range, flow range, gravity, hardware, sensors. Mismatched cells are written as text. **Refusal-first:** if fuel phase or geometry scale differs by >10x, a banner explains why a direct comparison is not meaningful ("1 m fabric vs 1 mm droplet"), and lists what *can* be compared.

### 3.10 Duel mode `/duel` (W4)
Two Gap Maps side by side, linked zoom/pan, each with its own habitat. Center column: the counts diff ("Moon base: 24 tests nearby, 0 solid. ISS air: 412 tests nearby, 160 solid."). Great for the demo.

### 3.11 Ask / Command palette (W1 UI, W6 backend)
`⌘K` / `Ctrl+K`. Typing matches studies, habitats, materials, actions ("toggle expert mode", "export brief") instantly (local fuzzy search, `cmdk`). If the input reads like a question ("has PMMA burned near Moon base air?"), a row "Ask the atlas" sends it to `POST /api/ask`. Result renders as editable **filter chips** (material=PMMA, habitat=lunar, phase=solid) plus a **pipeline trace** (`HYDROGEN parsed` → `CODE matched 0 rows, 3 nearby` → `JEV judged relevance`), each step with timing and model ID. The answer is always computed by code from rows; the model only parses language. Offline or No-AI: a labelled keyword parser does the parsing.

### 3.12 Audio bar and Listen mode (W1 UI, W6 backend). See §4.

### 3.13 Present mode `/present` (W1)
Seven beats that mirror the deck: Title → The problem → Gap Map reveal (Moon) → Two rankers → Evidence and Caught by code → How the AI is used and tested → Limits and team. Each beat drives the real app state (not screenshots). Keys: →, ←, space, PageUp/PageDown (clicker), `N` toggles narration, `Esc` exits. A small presenter timer and beat counter appear only on hover. This mode is also how we record the optional ≤ 25 s video.

### 3.14 Learn mode `/learn` (W1)
Plain-language explainer for students and the curious, **no live AI calls**:
1. The candle demo: a dithered flame that morphs from a teardrop (1 g) to a sphere (microgravity) on a toggle, with a two-sentence explanation (buoyancy, diffusion), citing the challenge text.
2. "Why more oxygen matters": slider for O₂ %, showing which PSI rows exist at that level (data, not a prediction).
3. "Three ways to stay safe": prevention / detection / suppression with one real study each.
4. "Real incidents" panel: Apollo 1, Apollo 13, Mir, written respectfully with NASA links (no jokes, no easter eggs anywhere near this content).
5. Glossary always visible. Pre-rendered audio narration (no live generation).

### 3.15 Gap Brief `/brief/:scenario` (W5)
A one-page, print-ready brief (A4 / Letter, Paper theme): scenario and sources; Gap Map snapshot; tested near this air (counts by fuel phase); not tested / unknown; read first (top 5 with why); limits; citations (APA); corpus hash, date, app version, QR code linking back to the exact view. Export: Print to PDF (CSS print styles, free), **PDF with notes and your lab name** (Researcher), BibTeX download (free).

### 3.16 Pricing, checkout and account (W1 UI, W6 backend). See §5.

### 3.17 About, Method, Credits (W5)
Method: rubric, tolerances, priority order, sensitivity, the baseline vs Jev result with n, the verifier, what "rank" means. Limits: gravity (none in PSI), burner O₂, pO₂, unknowns, geometry. Credits: every PSI accession and NTRS record with licence, software licences, model services, ElevenLabs voice credit, the SI disclosure, NASA non-endorsement.

### 3.18 System states (every component must implement)
Loading (skeleton matching final layout; never a bare spinner), Empty (a valid result with a next step, e.g. "No PSI test in this set matches 100% O₂ at 4.3 psi. That is the gap." + "Show nearest rows"), Error (inline, with Retry and what still works), Partial (some AI answers missing: "not available", never blank), Offline (static data still works; chip says OFFLINE), Fixture (FIXTURE chip).

---

## 4. Audio overviews (ElevenLabs)

### 4.1 What it is
A narrated, captioned, two-minute "mission briefing" for any scenario, plus a 30-second landing overview. In **Listen mode** the narration drives the UI: each script segment carries **cues** (zoom to habitat, highlight rows, open a study, show the ledger), synced by word timestamps.

### 4.2 Pipeline
1. **Script (code first).** `packages/core/narration` builds the script from the corpus with templates and code-computed facts only (counts, ranges, study names, the gap sentence). Every numeral is traceable to a record. Segments: Intro (with the disclosure line "This overview uses an AI-generated voice") → The air → What was tested → The gap → What to read first → Limits → Outro.
2. **Optional polish.** Hydrogen may rephrase the script for flow. The rephrased text must pass `numberGuard` and `claimLint`, or the template text is used.
3. **Voice.** ElevenLabs text-to-speech. Request word/character timestamps so captions and cues sync. Endpoint and model are configuration (`ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL_ID`); **the exact endpoint for timestamps and the current model IDs are UNVERIFIED: W6 confirms them against the official ElevenLabs API docs before coding**, and writes what it found into `packages/server/README.md`. Header `xi-api-key` from server env only. Use a stock voice from the ElevenLabs library that the plan allows for commercial use. **No cloned or impersonated voices of real people, no NASA voice imitation.**
4. **Cache.** Pre-render the landing overview and the 4 preset scenarios × 4 concerns at build time (`pnpm audio:build`) into `apps/web/public/audio/{scenarioKey}.mp3` + `.json` (segments, cues, word timings, script hash, voice, model, date). Live generation is a Researcher feature for custom scenarios, rate-limited and cached by script hash.
5. **Fallback.** No key or failure: the browser `speechSynthesis` reads the same script (labelled "device voice"), or captions-only mode.

### 4.3 Player UI (Audio bar)
Docked at the bottom of the atlas. Play/pause (space when focused), scrub, 0.75x/1x/1.25x/1.5x, chapter ticks on the track, captions toggle (on by default), transcript drawer (each sentence clickable to seek; every number is a link to its source), "Follow along" toggle (on in Listen mode: the UI obeys cues; any user interaction pauses following with a "Resume following" pill). A dithered waveform (precomputed peaks, 1-bit bars). Visible label: "AI-generated voice (ElevenLabs)". Media Session API for lock-screen controls.

### 4.4 Cue contract
```ts
type Cue =
  | { at: number; kind: 'focusHabitat'; habitat: ScenarioId }
  | { at: number; kind: 'highlightRows'; rowIds: string[] }
  | { at: number; kind: 'filterPhase'; phases: FuelPhase[] }
  | { at: number; kind: 'openStudy'; accession: string }
  | { at: number; kind: 'openLedger' }
  | { at: number; kind: 'clear' };
```
(Defined in `@fire/contracts` as `NarrationCue`.)

---

## 5. Monetization and payments (Stripe, test mode for the hackathon)

### 5.1 Principles
- **NASA-derived evidence is never paywalled.** The Gap Map, rankings, sources, ledger, Learn mode, preset audio overviews and print-to-PDF are free forever. Paid plans cover things that cost money to run or save time: live AI and voice generation, branded exports, saved workspaces, API access, alerts.
- **The hackathon build runs in Stripe test mode.** Every pay button shows a small "Test mode, no real charge" label while `STRIPE_MODE=test`. Judges can use test card 4242 4242 4242 4242.
- **Human decision D20:** keep pay buttons in the judged build or hide them behind `?billing=1`. Risk: a judge may see payments on NASA open data as off-mission. Mitigation is the principle above, stated on the pricing page.

### 5.2 Plans (prices are proposals, D21)
| Plan | Price | Includes |
|---|---|---|
| **Explorer** | Free | Everything evidence-related, preset audio overviews, 3 notes, print brief, share links |
| **Researcher** | $9 / month or $79 / year | Live Jev and Ask, custom-scenario audio overviews (30 / month), branded PDF brief, unlimited notes and saved workspaces, CSV / JSON provenance export, priority on new PSI data alerts |
| **Lab** | $49 / month (up to 10 seats) | Researcher for the team, shared workspaces, API key for the corpus and rankings, bulk briefs, invoice billing |
| **Support the mission** | One-off $5 / $15 / custom | Keeps the free tier free; name on the credits page (opt-in) |

### 5.3 Pay buttons that feel good
- One primary button per plan with a single-line label ("Start Researcher", "Start Lab", "Support"). Monthly/yearly toggle animates the price with a number tween and shows the saving.
- States: idle → pressed (scale 0.98) → loading (button keeps its width, label becomes "Opening checkout", progress bar inside the button) → redirect. Errors inline below the button with Retry.
- Stripe Checkout (hosted) handles cards, Apple Pay and Google Pay. No card fields in our UI.
- Success page: a dithered "mission patch-style" badge generated from the plan name (our own geometric design, **no NASA insignia**), the licence status, and next steps. Confetti-like dither sparkle, skipped under reduced motion.
- Account page: plan, renewal date, usage meters (audio minutes, Ask calls), "Manage billing" (Stripe Customer Portal), "Restore purchase" (enter email to re-issue licence).

### 5.4 Entitlement model (no full auth system)
1. `POST /api/checkout` creates a Checkout Session (price ID from env, `success_url` with `{CHECKOUT_SESSION_ID}`).
2. Success page calls `POST /api/license/claim { sessionId }`; the server retrieves the session from Stripe, checks `payment_status`, and returns a **signed licence token** (HMAC-SHA256 with `LICENSE_SECRET`; payload: plan, customer id, expiry, nonce).
3. The client stores the token (localStorage, try/catch) and sends it as `Authorization: License <token>` to paid endpoints. The server verifies the signature and expiry on every call.
4. `POST /api/stripe/webhook` verifies the Stripe signature and records subscription changes in a KV store (Cloudflare KV in production, a JSON file in dev) so revoked subscriptions fail verification.
5. Everything works with **no Stripe keys**: pricing shows "Billing not configured" and the buttons are disabled with that reason.
Use Stripe's REST API with `fetch` (Workers-compatible); webhook signature verification implemented with Web Crypto.

---

## 6. Design system

### 6.1 Design read
**Reading this as: a scientific instrument web app for researchers and judges, with a tactical-telemetry language (mission control, not retro kitsch), leaning toward Vite + React + Tailwind v4 tokens, Motion for UI transitions, Canvas/SVG for data, and dither only on imagery.**
Dials: product surfaces `DESIGN_VARIANCE 5 · MOTION_INTENSITY 5 · VISUAL_DENSITY 7`. Landing and pricing `8 · 6 · 4`.

### 6.2 Visual language
- Tactical telemetry archetype, adapted: dark substrate, monospace for every number and label, 0 px radius on panels, tables and drawers; 2 px on inputs and buttons; pill only for status and SI chips. Compartments drawn with `display:grid; gap:1px` over a hairline-coloured parent. ASCII framing (`[ CACHED ]`, `>>>`) allowed in status chips and the pipeline trace only.
- **Accent is cool blue, not hazard red.** On a fire topic, red reads as an alarm and as a safety verdict (UI_SPEC §1.2). Flame imagery provides the warmth.
- Dither (4×4 Bayer, 1-bit duotone) on imagery, the orbit scene, the waveform and decorative plates only. **Never on numbers, axes, text or data marks.**
- Scanlines: only on the orbit scene layer, very subtle, off under reduced motion and in High Contrast.
- Grain: one fixed, pointer-events-none overlay at 3% opacity, never on scrolling containers.

### 6.3 Tokens (CSS variables in `apps/web/src/design/tokens.css`, exposed to Tailwind v4 via `@theme`)
Base colours from UI_SPEC §1.4.1 (contrast already checked): `--color-bg #0B0D10`, `--color-surface #12161B`, `--color-raised #1A1F26`, `--color-hairline #232A33`, `--color-ink #E8EAED`, `--color-muted #9AA1AB`, `--color-accent #7CC4F2`, `--color-accent-ink #06121A`, `--color-focus #A8DCFF`, `--color-border-strong #6B7480`, `--color-flag-text #F2B66B`. Paper theme values from the same section. High Contrast: pure-ish ink on bg, accent `#9AD8FF`, borders 2 px.
Data palette (fuel phase; both themes checked ≥ 3:1 against the map background by W1 with `samples/contrast_check.py`): droplet `#6EC1F5`, solid `#FF9447`, gas `#56D3C1`, aerosol `#C7B7FF`, burner (hollow) `#9A90CC`, unknown `#8A94A3`. Selection ring = accent.
Type: **Geist Sans** for UI and headings, **JetBrains Mono** (tabular figures) for numbers, IDs, labels. Both SIL OFL 1.1; self-host woff2 with licence files in `apps/web/public/fonts/licenses/` (W1 verifies the licence file at install). Scale from UI_SPEC §1.4.3 (12 px floor).
Spacing: 4/8 px scale. Radii: 0 / 2 / pill. Elevation: none; overlays use a scrim. Z-index scale in `src/design/z.ts` (map 0, panel 10, sticky bars 20, drawer 30, palette 40, toast 50, grain 60).
Motion: `--dur-step 120ms`, `--dur-fade 200ms`, `--dur-fly 450ms`, `--dur-scene 900ms`, ease `cubic-bezier(0.2,0,0,1)`. All go to 0 under `prefers-reduced-motion`. Every animation has a one-line reason (feedback, state change, hierarchy, story).
Icons: Phosphor (`@phosphor-icons/react`), one weight (regular), no hand-drawn icon paths.

### 6.4 Copy voice
Precise, plain, calm. Plain words on screen, precise words on hover ("Tested near this air" → tooltip "O₂ within ±3 points and pressure within ±15%"). Units always shown. O₂ written with `<sub>`. No em or en dashes. One label per intent across the app (e.g. always "Open source row", never also "View row").

### 6.5 Provenance badges (identical everywhere)
`CODE` (grey, square): computed by deterministic code. `SI · model-id` (accent outline, pill): from Hydrogen / Jev / decision-1, with a hover card (model, date, live/cached, the question asked). `REVIEWED · name` (outline): human-accepted. `FIXTURE` (flag text). Status chip in the top bar: `LIVE`, `CACHED · date`, `FIXTURE`, `NO-AI`, `OFFLINE`.

---

## 7. Quality-of-life and micro-interactions catalogue
Each item is small; together they make it feel like a product. Owners in brackets.

**Navigation and state**
- Every view state lives in the URL (habitat, concern, fuel, zoom, selection, mode, tab); Back/Forward work; "Copy link" button with toast "Link copied" [W1].
- Session restore: reopening the app offers "Continue where you left off" [W1].
- Undo / redo for filter and habitat changes (`⌘Z` / `⇧⌘Z`), with a toast showing what was undone [W1].
- Keyboard shortcuts with a `?` cheat-sheet overlay: `/` or `⌘K` palette, `1–5` habitats, `E` expert, `L` listen, `P` present, `T` theme, `0` fit map, `M` mark navigation, `[`/`]` prev/next row, `Esc` close [W1].
- Recent items in the palette (last 5 studies / scenarios) [W1].

**Feedback**
- Number tweens on every count change (200 ms, off under reduced motion) [W1 utility, used by all].
- Skeletons that match final layouts; no layout shift (CLS < 0.05) [all].
- Toasts only for transient confirmations (copied, saved, exported); errors inline [W1].
- Button press feedback (scale 0.98), loading states that keep button width [W1].
- "What changed" pill after a habitat switch: "+12 tests nearby, top study changed to FLEX" (code-written diff) [W5].

**Data comfort**
- Unit-aware inputs everywhere ("10.2 psi", "0.7 atm", "70 kPa") with a live conversion hint [W1 component].
- Units toggle global (kPa / psi / atm / mmHg) [W1 store].
- Hover-to-define glossary terms (dotted underline): microgravity, PSI, O₂ fraction, partial pressure, concurrent / opposed flow, burner stream, extinction diameter [W5 content, W1 component].
- Copy citation (APA / BibTeX) on every study and row; copy row as CSV [W5].
- Sticky table headers, column visibility menu, density toggle (comfortable / compact) [W5].
- Linked brushing between map, table and timeline [W4 + W5 via store].
- "Explain this chart" toggle overlays numbered annotations on the Gap Map [W4].

**Resilience**
- Abort in-flight requests on scenario change; drop stale responses by request id [W6 client].
- Fallback ladder with a visible chip (Live Jev → decision-1 → cached → baseline) [W6 + W1 chip].
- Offline-ready: corpus and preset audio cached by a service worker after first load [W1].
- Corpus hash check at load; mismatch blocks ranking with an explanation [W5].

---

## 8. Wow moments (judge-facing, ranked)
1. **Gap Map reveal**: Moon base chosen → orbit camera flies to the Moon → cross-fade into the map → tolerance box snaps on → the FLEX droplet rows inside the box light up (8 in corpus v1 at default tolerances; 24 FLEX rows are at ≥30% O₂ across all pressures) → solid-fuel cloud stops below 22.2% → hero sentence types in.
2. **Listen mode**: press play and the app gives the briefing itself, zooming and highlighting in sync with an AI voice, captions on.
3. **Drag the habitat box** and watch counts, ranks and the gap sentence update live.
4. **Click any dot** → raw CSV row + hash + DOI.
5. **Caught by code** ledger typing out real rejected cells.
6. **Two rankers + honest agreement strip.**
7. **Timeline replay**: 12 years of ISS fire research filling the map.
8. **Duel mode**: Earth air vs Moon base side by side.
9. **Ask the atlas** with the visible pipeline trace.
10. **Gap Brief** export with a QR code back to the live view.

---

## 9. Easter eggs (registry in `apps/web/src/features/eggs/registry.ts`, W1)
Rules: never on data surfaces or inside numbers; never near the Apollo 1 / Apollo 13 / Mir content; every fact cited from the corpus or challenge text; all animated eggs respect reduced motion; one global off switch in settings; no NASA insignia.
| Trigger | Egg |
|---|---|
| Type `candle` anywhere (not in an input) | The dither plate flame morphs from teardrop to sphere with the caption "In microgravity there is no buoyancy, so a candle flame becomes a dim blue sphere." (challenge text) |
| Click the Moon three times in the orbit scene | Card: "30% O₂ at 10.2 psi has almost the same O₂ partial pressure as Earth air. That does not make it equally flammable." (UI_SPEC S1) |
| Konami code | "Flight rules" unlocked: `/flight-rules` shows the never-claim list styled as flight rules ("FR-01: Say 'none in PSI', never 'none exists'.") |
| Open devtools console | ASCII flame, the corpus hash, rows parsed and rejected, a link to the repo and the method page |
| Hover the 3400% cell in the ledger for 3 s | Tooltip: "Even a spacecraft cannot hold 3400% oxygen. Code rejected this one." |
| 404 page | A dithered droplet drifting slowly: "This page drifted out of the corpus." with links home |
| Play the timeline to the end | Status line: "2009 to 2021: N tests in M investigations. More to come from LUCI and FM2." (challenge text names them) |
| Type `cool flames` in the palette | Opens the CFI study with a note on cool flames (from the PSI objective text only) |

---

## 10. Data and science (W2 + W3)

### 10.1 Corpus
Sources already in the repo (no network needed): `research/flame/samples/psi_tables/*.csv` (16 tables), `research/flame/samples/psi_json/*.json` (investigation metadata), `research/flame/samples/ntrs/*` (NTRS text + metadata), `research/flame/samples/psi_reports/*.pdf`. Hashes in `research/flame/samples/MANIFEST.tsv`, `psi_tables_log.json`.
Core investigations (BUILD_PLAN §2.3): PSI-98, 99, 100 (Saffire I-III), 26 (BASS), 25 (BASS-II), 69 (FLEX), 102 (SAME), 101 (SAME-R), 107 (SPICE), 20 (ACME BRE); reserve PSI-159 (CFI-G, burner O₂ trap), PSI-47 (DAFT). PSI-68 (FLEX-2) is a design range, not tests: label it so if used.
Output: `data/corpus.v1.json` (+ copy at `apps/web/public/data/corpus.v1.json`) matching `Corpus` in contracts, with `corpusHash` = sha256 of canonical JSON.

### 10.2 Parsing rules (code only, no LLM in the number path)
FLEX is cp1252; others UTF-8 with BOM. Headers have trailing spaces and typos ("Samle"). Cells: `~ 21.5` → approx flag + 21.5; `21.5 - 21.7` → min/max; `21; 26.5; 40` → multi-value (expand to separate condition values, keep the raw); units inside cells ("20 cm/s", "0.27 mm"); pressure in mmHg / atm / psi / bar → kPa; FLEX O₂ is a mole fraction → percent. Reject with a reason: O₂ outside 0-100 (e.g. `3400%`, `2100%`), pressure ≤ 0 (FLEX #114 `0`), negative flow (SPICE -5.92 cm/s). BASS-II: "Calibrated initial O2 % by vol" is the condition; "final O2" is a post-test measurement and never a condition. CFI-G O₂ is `burner`. Ranges stored as min/max; unknown is `null`.
Expected checks (tests): FLEX has 274 rows and 24 rows with O₂ ≥ 30%; BASS-II initial O₂ spans 13.6 to 22.2%; Saffire tables have no pressure; Saffire-III and BASS have no O₂.

### 10.3 Guardrails (enforced in code and tests)
Gravity chip everywhere, "partial gravity: none in PSI"; only ambient O₂ counts; pO₂ shown as context only; unknown ≠ none; geometry confounds shown; "visible flame extinction diameter", never "extinction limit"; "investigation date" vs test date; ECLSS flow band 15-20 cm/s annotated; presets labelled "illustrative, not a design value" with sources; `claimLint` over UI strings, narration and AI output.

### 10.4 Human gates (agents cannot pass these; they prepare them)
G1: 3-4 gold records double-coded by humans (W2 prepares `data/reviews/candidates.json`). K5: lunar hero go/no-go (W3's `gapStatement` returns `{ allowed:false }` until `data/reviews/k5.json` has a human sign-off). D5: rubric order and tolerances (store default = proposal, chip says PROPOSED until `data/reviews/d5.json` is signed). G3: Jev earns its place (W6 builds the metrics script; humans label pairs).

---

## 11. AI architecture (W6, rules from BUILD_PLAN §3.6-3.8)
| Role | Model | Endpoint (from research, confirm at first call) | Use |
|---|---|---|---|
| Judge | Jev `jev-1.14.0` (TypeSafe) | `POST https://api.typesafe.ai/v1/systemone`, `Authorization: Bearer` | Per (study, scenario): `regime_relevance` (noul), `evidence_directness` (score 0-3), `pillar` (choice). 3 calls, median, bin 0.1. No numerals in criteria text |
| Judge fallback | `gemini-decision-1` | `POST https://generativelanguage.googleapis.com/v1beta/decisions`, body uses `input` not `state` | Same questions via an adapter; always labelled `decision-1` |
| Parse / extract / explain | Gemini 4 Hydrogen | `POST .../v1beta/interactions`, header `Api-Revision: 2026-05-20`, `response_format` with JSON schema | Column-map proposals and paper extracts (build time); Ask parsing (runtime); explanations and narration polish (must pass numberGuard) |
| Voice | ElevenLabs | §4 | Audio overviews |
Runtime order: L0 live (≤ 5 s) → L1 decision-1 → L2 recorded cache (labelled with date) → L3 baseline only. Cached responses are keyed by `sha256(corpusHash + rubricVersion + modelId + request)`. Until the provider terms are read (R8), the public build ships **fixtures** labelled `FIXTURE · human-authored, not model output`. Jev values are "model judgement (ordinal)", never "probability the science is true". No thresholds in the end-user UI.

---

## 12. Backend API (W6). Handlers are `(req: Request, env: Env) => Promise<Response>`, runnable on Cloudflare Pages Functions and in a Node 22 dev server
| Method + path | Body | Returns | Notes |
|---|---|---|---|
| `GET /api/health` | | `{ ok, services: { jev, gemini, elevenlabs, stripe } }` (booleans: configured or not) | Drives the status chip |
| `POST /api/rank` | `{ scenarioId, concern, corpusHash }` (allowlisted ids only) | `RankResponse` | Ladder L0-L3; never free text |
| `POST /api/ask` | `{ question (≤ 200 chars) }` | `AskResponse` (parsed filters + trace) | Hydrogen with schema, tools disabled; keyword fallback |
| `POST /api/explain` | `{ accession, scenarioId }` | `{ text, claimIds, source }` | numberGuard + claimLint or template |
| `POST /api/narrate` | `{ scenarioKey }` or `{ customScenario }` (Researcher) | `NarrationManifest` + audio URL | Cache by script hash |
| `POST /api/checkout` | `{ plan, interval }` | `{ url }` | Stripe Checkout Session |
| `POST /api/license/claim` | `{ sessionId }` | `{ token, plan, expiresAt }` | |
| `GET /api/license` | header `Authorization: License …` | `{ plan, status, usage }` | |
| `POST /api/portal` | licence header | `{ url }` | Stripe Customer Portal |
| `POST /api/stripe/webhook` | Stripe event | 200 | Signature verified (Web Crypto) |
Security: same-origin only (reject `sec-fetch-site: cross-site`), 12 KB body cap, per-IP token bucket, monthly spend cap per provider (env), schema-validated responses (zod). Env vars: `TYPESAFE_API_KEY`, `GEMINI_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL_ID`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_RESEARCHER_MONTH`, `STRIPE_PRICE_RESEARCHER_YEAR`, `STRIPE_PRICE_LAB_MONTH`, `STRIPE_PRICE_SUPPORT`, `STRIPE_MODE`, `LICENSE_SECRET`, `PUBLIC_ORIGIN`. `.env.example` lists them with no values.

---

## 13. Frontend architecture
- `apps/web`: Vite + React 18 + TypeScript strict + Tailwind v4 (`@tailwindcss/vite`) + React Router + Zustand (store) + Motion (`motion/react`) + `cmdk` + Radix primitives (Dialog, Popover, Tooltip, Tabs, Slider, Toggle) + `sonner` (toasts) + d3 modules (`d3-zoom`, `d3-scale`, `d3-quadtree`, `d3-selection`) + `@phosphor-icons/react` + `zod`.
- No GSAP, no Three.js. Motion for UI only; the map and orbit run their own rAF loops outside React state.
- Store slices (in `apps/web/src/state/store.ts`, created in the skeleton): `scenario` (habitat, custom O₂/kPa, concern, fuel filters, tolerances, priority order), `view` (mode, theme, units, expert, zoom transform snapshot, selection, panel tab), `ai` (status, ladder level), `audio` (playing, position, following), `license` (plan, token). URL sync through `apps/web/src/state/url.ts` (schema in contracts: `UrlState`).
- Data loading: `apps/web/src/data/useCorpus.ts` loads `/data/corpus.v1.json` (fallback `/data/corpus.fixture.json`), verifies the hash, memoises derived indexes.
- Science logic is imported from `@fire/core` (never re-implemented in components).

---

## 14. Performance budgets
Initial JS ≤ 250 KB gzip (orbit, audio, pricing lazy). Corpus ≤ 1.5 MB raw. LCP < 2.5 s on fast 4G; INP < 200 ms; CLS < 0.05. Map 60 fps at 2,000 marks. Audio files ≤ 2.5 MB per 2-minute overview (mp3 64-96 kbps).

## 15. Accessibility
WCAG 2.2 AA: keyboard path through every flow, visible 2 px focus, targets ≥ 24 px (44 preferred), contrast per tokens, colour never the only cue, reduced motion, captions for all audio, transcripts, `aria-live` for count and status changes, map table alternative, skip links, `lang`, landmarks. axe-core in Playwright must report 0 serious/critical issues.

## 16. Testing and CI
- `pnpm test` (Vitest): core (units, overlap, rank, sensitivity, gap, agreement, verifier negative tests, numberGuard, claimLint, narration builder), pipeline (parser edge cases and expected counts in §10.2), server (handlers with mocked fetch: ladder, signature verification, licence tokens).
- `pnpm e2e` (Playwright): golden path (landing → briefing → atlas → dot → evidence), keyboard-only path, Listen mode cues fire, Present mode beats, pricing with billing unconfigured, 375 px viewport, axe scan.
- `pnpm lint:claims`: never-claim and dash lint over `apps/web/src`, narration templates and fixtures.
- `pnpm secret-scan`: grep `dist/`, `public/`, git history for key patterns.
- `pnpm typecheck` across the workspace. All must pass before merge.

## 17. Workstreams, owners and merge protocol

| ID | Workstream | Agent | Owns (edit only these) |
|---|---|---|---|
| W1 | Shell, design system, landing, briefing wizard, modes (Learn, Present), palette UI, audio bar UI, pricing / checkout / account UI, QoL utilities, easter eggs | Claude Sonnet 5.5 (A) | `apps/web/src/{app,design,shell,modes,components}/`, `apps/web/src/features/{landing,briefing,learn,present,palette,audio,pricing,account,eggs,notfound}/`, `apps/web/index.html`, `apps/web/public/fonts/` |
| W2 | Data pipeline and corpus | DeepSeek V4.1 Flash (A) | `packages/pipeline/`, `data/` (except `data/reviews/*` sign-offs) |
| W3 | Science core + narration script builder | GPT-6.1 Terra (A) | `packages/core/` |
| W4 | Gap Map, Orbit scene, Timeline, Duel | GPT-6.1 Terra (B) | `apps/web/src/features/{gapmap,orbit,timeline,duel}/` |
| W5 | Workspace panels, evidence, study, compare, ledger, brief, about/method/credits | Claude Sonnet 5.5 (B) | `apps/web/src/features/{atlas,studies,selection,ledger,notes,evidence,study,compare,brief,about}/` |
| W6 | Server: AI adapters, ladder, cache, Ask, ElevenLabs narration, Stripe, licences, dev server, audio build script | DeepSeek V4.1 Flash (B) | `packages/server/`, `apps/web/public/audio/` |
| OV | Overseer: reviews spec and each merge for coherence, science rules and integration | GPT-6.1 Sol | Read-only + review notes in `docs/reviews/` |
| Lead | Integration, routes table, contracts, store, merges | Claude Opus 5.5 (this session) | `packages/contracts/`, `apps/web/src/{state,data,routes.tsx,main.tsx}`, root config |

**Merge protocol.** Each worker runs in its own git worktree and branch (`ws/w1-shell`, …), commits early and often, and keeps commits inside its owned paths. The lead merges in dependency order: contracts (done) → W3 core → W2 corpus → W6 server → W4 map → W5 panels → W1 shell (W1 imports feature entry points by the names in §18). Dependency additions: the skeleton already declares all planned deps in `apps/web/package.json` and each package's `package.json`; if a worker needs another, it adds it in its own package and says so in its report.

## 18. Feature entry points (so the shell can mount features before they exist)
Each feature folder exports a default React component from `index.tsx` with these names. The skeleton ships placeholder versions; workers replace them.
`features/landing` → `LandingPage` · `features/briefing` → `BriefingWizard` · `features/atlas` → `AtlasWorkspace` (composes `GapMap`, side panel, `Timeline`, `AudioBar`) · `features/gapmap` → `GapMap` (props `GapMapProps` in contracts) · `features/orbit` → `OrbitScene` · `features/timeline` → `Timeline` · `features/duel` → `DuelPage` · `features/study` → `StudyPage` · `features/compare` → `ComparePage` · `features/brief` → `BriefPage` · `features/learn` → `LearnPage` · `features/present` → `PresentPage` · `features/pricing` → `PricingPage` · `features/account` → `AccountPage` (+ `CheckoutSuccess`, `CheckoutCancel` named exports) · `features/about` → `AboutPage` (+ `MethodPage`, `CreditsPage`) · `features/audio` → `AudioBar` · `features/palette` → `CommandPalette` · `features/evidence` → `EvidenceDrawer` · `features/eggs` → `EggHost` + `FlightRulesPage` · `features/notfound` → `NotFoundPage`.

## 19. Milestones (outcome-based; agents work in parallel)
- **M0 Skeleton** (lead, done before workers start): workspace, contracts, store, routes, placeholders, fixture corpus, tokens stub.
- **M1 Real data on screen**: corpus builds; Gap Map renders real rows with zoom/pan/hover/click; baseline rank in the panel; evidence drawer opens a real row.
- **M2 Complete flow**: wizard, landing, study, compare, ledger, brief, About; fixture AI columns with chips; agreement strip.
- **M3 Services**: server ladder with fixtures and live when keys exist; Ask; narration build + Listen mode cues; Stripe test checkout and licences.
- **M4 Polish**: modes (Present, Learn, Duel, Expert), QoL catalogue, easter eggs, themes, a11y and perf budgets met.
- **M5 Ship**: claim lint clean, secret scan clean, deploy, deck (7 slides incl. title), submission text, SI disclosure (now naming ElevenLabs and Stripe test mode), credits.

## 20. Decisions for the human team
| ID | Decision | Default |
|---|---|---|
| D1 | Final name and concept statement | "Fire Atlas" (placeholder) |
| D5 | Ranking priority order and tolerances | pillar > covers > tier > near; ±3 points O₂, ±15% pressure |
| D12 | Human contribution statement | Team writes it |
| D20 | Pay buttons visible in judged build? | Visible, test mode, with the "evidence is free" principle |
| D21 | Prices | §5.2 |
| D22 | ElevenLabs voice choice | A stock library voice cleared for commercial use |
| D23 | Fonts | Geist + JetBrains Mono (UI_SPEC's Inter is the fallback) |
| K5 | Lunar hero | Human sign-off in `data/reviews/k5.json` |
| G1 | Gold records | Two humans in `data/reviews/` |
| G3 | Keep Jev ranking column | Metrics rule (BUILD_PLAN §4.2) |

## 21. Compliance additions for v2
- SI disclosure must name: planning docs (AI-drafted), code written by AI coding agents (Claude, GPT, DeepSeek workers), Hydrogen (extraction, parsing, explanations), Jev and decision-1 (judgements), **ElevenLabs (AI-generated voice; spoken and visible disclosure in every overview)**.
- AI-generated audio is acknowledged in text and metadata (ID3 comment + manifest JSON).
- Stripe test mode clearly labelled; no real charges during judging; no personal data stored beyond the Stripe customer id and plan in KV.
- Keep: no NASA insignia, worm, seal or mission patches; "NASA does not endorse this project"; every source cited with licence.
