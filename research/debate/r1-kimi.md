# Round 1 — kimi · AI architecture depth

**Scope:** all 14 official challenges and all eight wave-1 findings read in full. This is an architecture stress test, not a solution selection. The human team must choose and shape the idea. All project directions below are options; no direction is an instruction to build.

## Architecture verdict

Use a decision model only when all three tests pass:

1. The answer space is closed and authored by the team (`noul`, `choice`, or an ordered `score`).
2. The state contains a genuinely qualitative judgment that deterministic code cannot supply more transparently.
3. Removing the model measurably worsens expert agreement, reviewer time, or decision quality against a baseline.

The defensible split is **code measures, Hydrogen extracts/perceives, Jev judges, code enforces policy**. Hydrogen is not a calculator or a source of truth; Jev is not a writer, scientist, or geospatial engine; `gemini-decision-1` is an availability fallback, not independent scientific validation. Every shortlisted direction also needs a no-model path: deterministic rules, cached model responses labelled as such, and the raw evidence always visible.

### Primary-source facts that drive the scores

| Claim | Status and consequence |
|---|---|
| Jev 1.14 supports text/PNG/JPEG state plus Choice, Score, Noul and experimental Box; 1.13 has no Box. Input is $0.042/M tokens, output free. Default context is 64k/request and 32k/question; 262k mode is explicitly slower and less accurate. | **VERIFIED:** [Jev models](https://docs.typesafe.ai/models.md), [Images](https://docs.typesafe.ai/images.md), [Box](https://docs.typesafe.ai/primitives/box.md). Keep one compact case per candidate and pin `jev-1.14.0`; do not make Box central. |
| Jev probabilities are calibrated across groups, not guaranteed per answer. Choice/Score `confidence` is derived from distribution shape; Noul has no separate confidence field. | **VERIFIED:** [System One](https://docs.typesafe.ai/concepts/system-one.md), [Confidence](https://docs.typesafe.ai/confidence.md). Threshold the option/level probability, use top-two margins, and calibrate on domain labels—not a universal 0.85. |
| Composite scoring is atomic Score questions normalized and weighted in code. | **VERIFIED:** [Composite scoring](https://docs.typesafe.ai/patterns/composite-scoring.md). A Score is an expected ordinal level, **not P(success)**. |
| Hydrogen takes text/image/video/audio/PDF and emits text, including structured JSON. The default synchronous cap is 65,536; thinking defaults to high. Paid price is $1.50/M input and $7.50/M output including thinking. No image/audio generation or Live API. | **VERIFIED:** [Hydrogen model](https://aistudio.google.com/docs/models/gemini-4-hydrogen), [What's new/pricing](https://aistudio.google.com/docs/whats-new-gemini-4-hydrogen). It suits source extraction and explanation, not per-frame live inference or media generation. |
| Hydrogen supports object boxes `[ymin,xmin,ymax,xmax]` in 0–1000 and segmentation masks as structured text/JSON. | **VERIFIED capability:** [Image understanding](https://aistudio.google.com/docs/image-understanding). Planetary/SAR/flame/mover accuracy remains unmeasured; capability is not validity. |
| Decision 1 accepts text/image/video/audio/PDF, emits zero text tokens, and supports Noul/Choice/Score over 262,144 tokens and up to 1,000 questions. It has no documented Box. Paid input is $0.10/M; free limits are 200 RPM, 50k TPM, 10k RPD. | **VERIFIED:** [Decision model](https://aistudio.google.com/docs/models/gemini-decision-1), [Decisions API](https://aistudio.google.com/docs/decisions-api), [Pricing](https://aistudio.google.com/docs/pricing#gemini-decision), [Rate limits](https://aistudio.google.com/docs/rate-limits#gemini-decision). It is a useful fallback and the better direct-video decision path. |
| Google's Gemini API terms require an 18+ operator and prohibit API clients directed toward or likely to be accessed by under-18s; they also forbid use in clinical practice or to provide medical advice. | **VERIFIED:** [Additional Terms, Age Requirements and Use Restrictions](https://aistudio.google.com/docs/terms). This materially lowers Junior Trainer, school-age live storytelling, and Health Monitoring. Adult authoring/offline content is different from child/clinical runtime. |

**Cost is not the main risk.** At documented text prices, dozens of compact Jev cases are far below a cent, and a few document-heavy Hydrogen jobs are still cheap. The real risks are unmeasured domain accuracy, extraction errors, default-thinking latency, unpublished Hydrogen interactive quota, TypeSafe quota/key availability, and correlated model mistakes. Measure P50/P95 on the actual payloads; do not use vendor latency claims as a service-level promise.

## 1. Scores for all 14 challenges

Score = fit for this small team and this exact decision/perception stack, not overall challenge quality. A high deterministic core lowers the AI bonus rather than inflating it.

| Challenge | Score | One-line architecture reason |
|---|---:|---|
| **Flame in Freefall** | **9** | The brief explicitly requires SI summarization, ranking and interpretation; closed rubrics over sourced combustion records are the cleanest genuine use of both models. |
| **Earth analogs for Moon/Mars bases** | **8** | Jev can add qualitative match/mismatch judgments beyond GIS similarity, but only alongside a deterministic baseline and explicit non-analogs. |
| **Field Shift: Adapting Farms** | **8** | Typed trade-offs and multimodal farmer/soil-document intake fit well; crop suitability, water balance and numeric “safe” claims must remain code and agronomy. |
| **Lunar Landing Site Navigator** | **7** | Excellent decision UX, but ephemeris, horizon and hard gates are deterministic; Jev is optional for science/operations preferences rather than the product's truth engine. |
| **Planet X and SPHEREx** | **6** | Blink/difference viewing is classical astronomy; Jev artifact triage could save volunteer time if it beats FLAGS and simple morphology, which is currently unproven. |
| **Martian Map** | **6** | Multimodal orbital/POV interpretation is useful for candidate hazards and field notes, but route safety and costs must not depend on out-of-distribution vision. |
| **Dancing with the SARs** | **5** | Models can narrate computed change, not establish SAR process or significance; dB/log-ratio/context features and physical alternatives dominate. |
| **MODIS/VIIRS Hot Spots** | **5** | Harmonization, coverage and anomalies are statistics; an AI burn-driver label is a causal overclaim unless treated strictly as a hypothesis. |
| **Earth System Trend Detective** | **5** | A fixed-catalog variable router is real but small; Mann–Kendall, seasonal handling, slopes and significance belong entirely in code. |
| **Earth Information Jukebox** | **5** | Data-literal sonification is more reproducible in code; Hydrogen semantic frame reading and Jev arrangement choices add flourish, not necessity. |
| **Space Mission Design Game** | **4** | Jev can choose review questions and assess rationales, but deterministic engineering, game balance and hot-seat collaboration carry the product. |
| **Discarded Equipment Storytelling** | **4** | Human-authored factual narrative should dominate; Jev branch routing is optional and live Gemini is unsuitable for the likely school-age audience. |
| **Junior Astronaut Mission Trainer** | **3** | Jev can select authored events but simple pedagogy heuristics are likely equivalent; Gemini's under-18 API-client restriction weakens the proposed two-model runtime. |
| **Health Monitoring Software** | **2** | High-stakes unvalidated triage, thin open clinical data, and explicit provider restrictions on medical advice make this a poor architecture fit. |

## 2. Shortlist: five architecture stress tests

These are shortlisted **questions**, not a ranked vote or five endorsed products. SPHEREx is included over Martian Map at the same score because its deterministic baseline is unusually clear: it offers a clean experiment on whether Jev adds anything beyond flags and image morphology.

### A. Flame in Freefall — strongest two-model fit

#### Direction A1 — Habitat-conditioned investigation ranker

- **Model work:** Hydrogen turns each PSI/NTRS PDF, table, figure or short clip into a compact record with fuel/form, oxygen, pressure, flow, gravity, measurements, exact quote and page/timestamp. Jev receives one sanitized record at a time: `pillar` Choice (prevention/detection/suppression/fundamental), `evidence_strength` Score (ground reanalysis → flight observation → flight limit measurement), `regime_relevance` Noul (whether the *combustion regime*, not merely oxygen percentage, transfers to the selected use case), and `claim_supported` Noul against the quote. Code performs numeric atmosphere overlap and schema checks, normalizes Score by its maximum level, applies visible human weights, and renders a Pareto/sensitivity view.
- **Real value:** semantic comparison across heterogeneous investigations, evidence triage, and a probability-bearing review queue. Removing AI would leave a small hand-curated table; a meaningful coverage/ranking gain is testable.
- **Gimmick to reject:** a generic PSI chat box, generated fire-safety advice, multiplying `P(overlap) × evidence`, or treating the model's oxygen arithmetic as measurement. Score is not a probability and the factors are not independent, so that product is not a calibrated joint probability.

#### Direction A2 — Flammability-limit evidence atlas

- **Model work:** Hydrogen proposes table/figure rows (test condition vs extinction limit vs model prediction) with source quotes; Jev Noul classifies ambiguous prose (“is this value an observed extinction limit?”), while code validates units and plots accepted rows.
- **Real value:** figure/PDF-to-structured-evidence extraction and semantic type checking. Human acceptance of a ~30-point gold table is an honest 48-hour path.
- **Gimmick to reject:** vision-derived flame/extinction measurements, an O2-flow chart assembled without error/type labels, or a claim that microgravity and 1g data interpolate lunar gravity.

#### Direction A3 — Short-clip evidence panel, subordinate to A1/A2

- **Model work:** Hydrogen examines a trimmed ignition/extinction clip and emits timestamped observations; Jev may assess a raw still for shape/color, with Box+Noul only as an experimental visual aid. Decision 1 is the cleaner direct-video fallback.
- **Real value:** native video perception that Jev lacks.
- **Gimmick to reject:** a film reader as the whole entry, 1 fps “blowoff detection,” or a bounding box presented as scientific segmentation. This panel does not satisfy the ranking requirement by itself.

**Strongest for:** the challenge literally asks for this architecture; keyless PSI search returned 26 combustion-term hits in my check, and PSI-69 exposes CC0-1.0, DOI `10.60555/mbq8-0451` ([PSI search](https://psi.nasa.gov/geode-py/ws/repo/search?term=combustion&size=100), [PSI-69](https://psi.nasa.gov/geode-py/ws/repo/investigations/PSI-69)).

**Strongest against:** PSI-69 FLEX metadata currently reports **923,832,535,657 bytes**, so “download the archive” is not a demo path. Prior RAG consoles exist; extracted oxygen/pressure/citations can be wrong; partial-gravity PSI data are absent; no domain calibration exists for habitat relevance. Use a curated corpus and direct small tables, not bulk archives.

### B. Earth analogs for Moon/Mars bases — strongest residual-judgment fit

#### Direction B1 — Match/mismatch atlas

- **Model work:** deterministic GIS first supplies slope, temperature, illumination, ice proxies, roughness, access and units. Jev then answers only residual questions: `geology_match` Score with evidence-anchored levels, `fit_for_test_purpose` Choice (instrument/operations/thermal/ISRU), and `analogy_contradicted` Noul against supplied counter-evidence. Code combines deterministic similarity and soft scores via visible weights and shows rank instability.
- **Real value:** interpreting qualitative geology/operational purpose and finding where an analogy breaks—the exact part a weighted raster cannot express.
- **Gimmick to reject:** a single scalar “Moon-ness,” posing Jev as an expert mission planner, or feeding famous-site prose into a model and rediscovering Atacama.

#### Direction B2 — Process-specific comparator (dunes, lava tubes, or polar sites)

- **Model work:** Hydrogen compares paired raw orbital/EO images and reports candidate morphology/mismatches with image-relative locations; Jev scores purpose-specific analog fidelity only after deterministic measurements. Human candidate families are chosen up front to prevent visual similarity becoming geological truth.
- **Real value:** cross-layer reconciliation and non-obvious qualitative mismatches.
- **Gimmick to reject:** embeddings as proof of analogy, segmentation as a DEM, or a global autonomous “new analog discovery” claim without a ground-truth set.

#### Direction B3 — Evidence-locked field-guide assistant

- **Model work:** Hydrogen drafts short field notes only from a human-authored fact spine; Jev Noul screens whether each statement is supported by the assigned excerpt. The guide foregrounds what can/cannot be tested and Earth limits (gravity, atmosphere, radiation).
- **Real value:** sourced communication and mismatch explanation for campaign/education users.
- **Gimmick to reject:** an AI-written brochure, invented access/permit/logistics claims, or support-Noul as a substitute for human fact-checking. This is the weakest standalone direction of the three and works better as a view on B1/B2.

**Strongest for:** the brief explicitly invites similarity metrics and asks where analogies fail. NASA Earthdata/PDS plus the live [USGS Terrestrial Analogs portal](https://tadp.astrogeology.usgs.gov/) support curated candidate construction without claiming a comprehensive global database.

**Strongest against:** Earth/Moon/Mars sensors, scales and physical environments are not commensurate; “surprising” has no ground truth; visual resemblance can dominate rubric wording; all-numeric candidate features make Jev redundant. The deterministic simple baseline must be shown first, with any Jev increment measured.

### C. Field Shift: Adapting Farms — strongest multimodal-intake fit

#### Direction C1 — Rotation explorer with an evidence ledger

- **Model work:** an agronomist/human authored set contains current rotation plus at least two alternatives. Code calculates local climate/soil features, constraints and scenario outcomes. Jev maps farmer text to `primary_priority` Choice (water/soil/market/forage/risk), identifies `missing_constraint` Choice (soil/market/equipment/none), rates `evidence_strength` Score from supplied provenance, and flags `local_review_required` Noul for pest/disease/equipment gaps. Code—not Jev—picks feasible scenarios and applies the user's weights.
- **Real value:** translating messy farmer intent and heterogeneous evidence into a transparent review workflow. Removing AI leaves the comparison engine, but loses intake and gap detection.
- **Gimmick to reject:** `water_safe` or `best_fit` treated as agronomic truth, invented “18% less water,” autonomous crop recommendation, or upsampling SMAP/POWER to pretend field precision.

#### Direction C2 — Soil-report and local-knowledge intake

- **Model work:** Hydrogen reads a soil-test PDF/photo or adult farmer voice note into a versioned schema with `UNKNOWN` allowed; Jev chooses the next clarification from a closed list and routes the case to suitable pre-authored rotation traits.
- **Real value:** this is the clearest necessary use of multimodality: unstructured real-world input becomes inspectable structured constraints.
- **Gimmick to reject:** accepting illegible values without a confirmation view, uploading identifiable farm data to a free training-enabled tier, or letting the model fill missing soil/market fields from priors.

#### Direction C3 — Water-stress scenario communicator

- **Model work:** code runs three rotation strategies under baseline/dry/hot scenarios and computes ranges; Jev selects which trade-off is most relevant to the stated priority and whether a material uncertainty deserves attention; Hydrogen writes only from those computed fields.
- **Real value:** adaptive explanation of actual trade-offs rather than generic prose.
- **Gimmick to reject:** AI-generated forecasts, irrigation prescriptions, or precise crop-water benefits unsupported by ET/irrigation data. The deterministic scenario tool survives model removal almost intact, so this is a supporting mode rather than the strongest standalone case.

**Strongest for:** the brief requires at least three rotations including the current one and emphasizes farmer priorities, uncertainty and local review. [NASA POWER documents subsetting APIs](https://power.larc.nasa.gov/docs/services/api/) that can feed small field-month feature tables without a massive archive.

**Strongest against:** local agronomy and licensing are harder than API calls; coarse/modelled data can be mistaken for field measurements; markets/pests/equipment are not in NASA telemetry; free-tier prompts are used to improve Google products. A local expert and a deterministic multi-criteria baseline are non-negotiable.

### D. Lunar Landing Site Navigator — good stack discipline, optional AI

#### Direction D1 — Horizon studio plus soft mission preferences

- **Model work:** code uses Horizons/terrain to calculate Sun/Earth az/el, occlusion, window durations and power/comms proxies. Jev evaluates qualitative `science_value` Score from cited site descriptions and `archetype` Choice, then code applies a user-selected mission profile. Hydrogen explains a computed scenario and its assumptions.
- **Real value:** soft science/operations comparison across many precomputed cells, with uncertainty surfaced instead of hidden in a ranking.
- **Gimmick to reject:** any Noul for “Sun above horizon?”, “slope below 15°?”, or “DTE available?”—those are exact code predicates. If the top sites match a transparent weighted baseline, show the baseline and drop Jev.

#### Direction D2 — Launch-slip mission-window matrix

- **Model work:** deterministic site × date matrix first; Jev identifies marginal cases needing human review and selects the most consequential trade-off to explain from a closed set.
- **Real value:** attention allocation across a large matrix, not geometry.
- **Gimmick to reject:** scoring every cell through an API live, treating confidence as flight clearance, or hiding a fast deterministic filter behind a slower model call.

#### Direction D3 — Educator/public what-if explainer

- **Model work:** Hydrogen turns the same deterministic scenario into reading-level-specific briefs; Jev chooses among authored misconceptions/examples (power vs comms, Sun vs Earth horizon, date vs site).
- **Real value:** adaptive explanation where the audience and pedagogical need are qualitative.
- **Gimmick to reject:** calling it a mission-planning AI, generating coordinates, or adding a chat interface to a single-site demo.

**Strongest for:** [Horizons explicitly supports topocentric ephemerides and API access](https://ssd.jpl.nasa.gov/horizons/manual.html), so the core numerical substrate is real and can be cached. The challenge's gap is rapid comparison, not another narrator.

**Strongest against:** horizon correctness and official site-coordinate uncertainty matter more than AI; the useful model contribution is small and may be indistinguishable from rules. This challenge should be selected for a strong deterministic product, **not** to justify the named models.

### E. Planet X and SPHEREx — explicit AI-value falsification test

#### Direction E1 — Five-target blink bench with optional triage

- **Model work:** code retrieves cutouts, WCS-aligns, matches backgrounds, subtracts epochs, applies FLAGS, and proposes candidate crops. Jev receives **raw, undithered** crops plus metadata: `morphology` Choice (dipole/stripe/single residual/other), `worth_human_review` Noul, and known-artifact choices (empty channel/helium/misregistration/saturation). Hydrogen only captions numeric spectra and source metadata.
- **Real value:** prioritizing volunteer attention after classical detection. This is a valid experiment only if review time or precision improves without suppressing true movers.
- **Gimmick to reject:** “Jev discovers planets,” dithered inputs to the model, or Box as a required component. A Box always returns edges even when no object exists; pair it with presence Noul, and prefer no Box for MVP.

#### Direction E2 — Artifact-review queue

- **Model work:** same as E1 but centered on many threshold-generated residuals, with a human confirmation button and a visible false-positive/false-negative log.
- **Real value:** measurable triage utility and uncertainty handling, rather than a cosmetic label on the blink viewer.
- **Gimmick to reject:** training a detector in the weekend, overriding the FLAGS HDU, or interpreting calibrated confidence as astrophysical posterior probability.

#### Direction E3 — Spectrum/variable-source explainer

- **Model work:** code calculates the spectrum/variability; Hydrogen gives a cautious two-sentence caption restricted to measured arrays and supplied molecular-band references. Jev is unnecessary.
- **Real value:** accessibility of unfamiliar infrared/spectral data.
- **Gimmick to reject:** molecular identifications from an image alone or a Planet Nine essay masquerading as the requested public sky tool.

**Strongest for:** [IRSA documents anonymous SIA2 access and cutouts, with DR1 and QR3 as the current collections](https://irsa.ipac.caltech.edu/spherex-archive-documentation/spherex-data-access/). Five prescribed targets make a reproducible deterministic test set possible.

**Strongest against:** the blink tool already works without AI; artifact examples are sparse and domain-shifted; Jev image mode is experimental; false negatives are much worse than a noisy review queue. Include this only if the team is willing to publish a negative result and remove the model when it does not beat the classical baseline.

## 3. Findings I dispute or that need correcting

1. **“Hydrogen cannot output precise bounding boxes” — DISPUTED.** DS4 says this; the official image guide demonstrates Hydrogen returning normalized boxes and segmentation masks in structured JSON ([image understanding](https://aistudio.google.com/docs/image-understanding)). The correction is not “trust planetary detection”: coordinates are image-relative, accuracy on planetary/SAR/sky imagery is still unbenchmarked, and text-only output does not make coordinates measurements.

2. **“Gemini Decision 1 is a drop-in replacement for Jev” — DISPUTED if taken literally.** The three conceptual primitives align, but the contracts differ ([Decisions API](https://aistudio.google.com/docs/decisions-api), [Jev models](https://docs.typesafe.ai/models.md), [Jev confidence](https://docs.typesafe.ai/confidence.md)):
   - request is `input`, not Jev's `state`; structured JSON should be serialized to text and put in content blocks;
   - Decision 1 returns confidence on Noul; Jev does not. Decision 1 confidence equals the top outcome probability or `max(noul,1-noul)`, unlike Jev's distribution-shape statistic;
   - Decision 1 offers 2–255 Score levels (2–10 recommended), alphabetically sorts Choice keys, and has no Box, caching, Batch, YouTube URLs, or `gs://` input.
   Build an adapter and contract tests; do not swap the model string and expect identical semantics.

3. **`P(overlap) × evidence × pillar weight` — DISPUTED as probability arithmetic.** Jev/Decision Score is an expected **ordinal array index**, not calibrated event probability, and the multiplied factors are not shown independent. Normalize each Score by its maximum level and use an explicit weighted sum/MCDA or Pareto method ([Decisions Score](https://aistudio.google.com/docs/decisions-api#score), [composite scoring](https://docs.typesafe.ai/patterns/composite-scoring.md)). Do not display the result as a joint probability.

4. **Jev Nouls for slope/Sun/anomaly/water/mass closure — DISPUTED architecture.** These are exact comparisons against computed quantities. Decision documentation explicitly says to compare numbers, dates and durations in code ([best practices](https://aistudio.google.com/docs/decisions-api#best-practices)). Code must own hard gates; models can assess ambiguous science value, fit, provenance or attention priority only. A Noul “cross-check” adds an error path without adding independent evidence.

5. **“Jev confidence is the probability the selected answer is right” — DISPUTED for Jev.** Official docs distinguish its distribution-shape confidence from top-option probability and note Noul has no separate confidence ([Confidence](https://docs.typesafe.ai/confidence.md)). Thresholds such as 0.85 ACT are not portable guarantees. Use labelled examples, per-action probability thresholds, top-two ratios, and a review band.

6. **A second Jev support-Noul or a two-decision-model ensemble is a hallucination guard — DISPUTED as validation.** Typed output prevents free-form type errors, not false judgments; calibration is aggregate. Both models can inherit the same bad extraction/rubric and are not independent scientific ground truth. Deterministic field/range checks, source spans, adversarial tests and human acceptance must carry validity. Model agreement may be a useful review signal, never the verdict.

7. **Jev 1.13 Box examples — DISPUTED.** DS1 assigns Box while describing Jev 1.13. Current official models say Box requires 1.14, images require `TypeSafe-Danger-Zone-Images: true`, and Box has no “not found” result ([models](https://docs.typesafe.ai/models.md), [Box](https://docs.typesafe.ai/primitives/box.md)). Use 1.14 plus presence Noul if experimenting.

8. **Routine live Gemini for Junior/school-age products and Gemini medical guidance — DISPUTED by provider terms, not merely a safety opinion.** The Additional Terms impose the under-18 API-client restriction and prohibit clinical practice/medical advice ([terms](https://aistudio.google.com/docs/terms)). Pre-authored offline educational content and adult/teacher tooling are safer patterns; a clinician reviewing an HRP evidence card still does not make an open-ended medical-advice runtime permissible.

9. **“Dither the image, then ask Jev to assess it” — DISPUTED as input hygiene.** This appears only implicitly in the visual concepts, but is important: dithering discards evidence and creates artificial edges. Models should receive the raw scientific crop with flags/scale metadata; dither belongs only in the presentation layer.

## 4. Open questions for the next research wave

### Cross-cutting, answer before committing

1. **Does each model beat the no-model baseline?** Pre-register metrics: expert top-k agreement, false-negative cost on must-review cases, precision of extracted numeric fields/citations, reviewer minutes saved, and rank stability under two rubric wordings. A model that only changes the prose should be removed, not celebrated.
2. **What are the real payload latency/quota/failure envelopes?** On the team's actual TypeSafe and Google projects, record key availability, model IDs, P50/P95, 400/429/5xx rates, and cost for one compact text case and one real image/PDF/video case. Hydrogen's interactive limits are project-specific; TypeSafe limits are organization-specific.
3. **Is the fallback genuinely contract-compatible?** Run the same labelled fixture through Jev and Decision 1; compare answer schema, confidence meaning, probability distributions, threshold policy, timeouts and fixture replay. Never average them or choose the prettier answer. Keep deterministic fixtures available offline.
4. **Can the evaluation set detect leakage and correlated failure?** Human labels must be hidden from the prompt/schema rubric examples used for tuning; include out-of-scope inputs, missing evidence, adversarial user text and known artifacts. Support-Noul should be compared to exact source spans and human adjudication, not used as it.

### Per shortlisted challenge

5. **Flame:** Which small PSI tables/files download directly without a guest-account/email detour? Can two people independently label ~30 investigation records for pillar, evidence strength and lunar-habitat relevance with acceptable agreement? Does Jev add ranking value over a transparent rubric computed solely from extracted fields? Which source excerpts establish that no partial-gravity inference is being made?
6. **Analogs:** What is the minimum common feature schema with commensurable units/uncertainty across Earth and target bodies? Who supplies independent match/mismatch labels and non-analogs? Does Jev change decisions beyond deterministic weighted distance, and is that change expert-approved rather than merely surprising?
7. **Farms:** Which crop traits/rotation candidates and local review rules are agronomist-approved and licensed? Which intake fields are truly available in the chosen field's soil report? Can the tool demonstrate value using only small computed feature tables, and where exactly do coarse SMAP/POWER/ET sources force “regional context, not field truth”?
8. **Lunar:** Does a spherical/LOLA horizon sample reproduce a Horizons validation case before any model is added? Which site coordinates are official versus user-selected approximations? Does soft Jev ranking differ from a simple user-weighted sort, and if not, will the team ship the simpler path?
9. **SPHEREx:** Which DR1/QR3 epochs and detectors yield valid pairs for all five required targets? Can the team label a balanced set of movers, variables, empty channels, helium stripes, saturation and misregistration? Does Jev reduce volunteer review time at fixed true-mover recall compared with FLAGS + matched-filter/centroid morphology?

**Bottom line:** Flame is the only challenge where removing both models fundamentally removes much of the required product. Analogs and Farms have meaningful but bounded roles for judgment and intake. Lunar and SPHEREx are strong deterministic products with optional AI that must earn its place experimentally. Everything else should prove necessity before the team spends scarce weekend time wrapping an API around an already-solved rule or statistic.
