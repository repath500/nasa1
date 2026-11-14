# Round 1 — beam: design and UX

**Purpose and boundary.** These are comparative design critiques and exploratory directions for the human team to select and shape, not an AI-originated solution to adopt. Scores are subjective, relative to this team's stack, a 3–5-person weekend, and a ≤30-second demonstration; they are not predicted judging results. A score rewards legibility, a meaningful first interaction, honest data communication, accessibility and attainable scope as well as dither fit. AI access and actual dataset samples remain unproven until tested by the team.

## All 14 challenges

| Challenge | /10 | Design and UX reason |
|---|---:|---|
| Flame in Freefall | 9 | A flame image, experiment conditions and sourced comparison make an immediate story; rankings need visible evidence and scope. |
| Lunar Landing Site Navigator | 9 | Site/date → horizon → sunlight and Earth visibility is a crisp interaction; terrain-occlusion fidelity is a serious trap. |
| Earth Information Jukebox | 8 | An image-to-sound transformation is instantly demonstrable and accessibility is central; sound mapping and non-audio alternatives must be intelligible. |
| Earth analogs for Moon/Mars | 8 | Side-by-side terrain and explicit match/breakdown are visually compelling; appearances alone can falsely imply physical similarity. |
| MODIS/VIIRS Hot Spots | 8 | A sensor seam and corrected calendar can show an actual insight in seconds; detection/coverage differences must survive the design. |
| Discarded equipment storytelling | 8 | One artifact and its science make a human-scale first frame; sourced facts and imagined voice need unmistakable separation. |
| Dancing with the SARs | 7 | Before/after change is visually direct; radar speckle and processing uncertainty are easily mistaken for meaningful change. |
| Martian Map | 7 | One route and hazard layer are immediately understandable; attractive terrain can overstate operational safety and data coverage. |
| Adapting Farms | 7 | Three rotation choices and farmer priorities form a clear decision; coarse satellite cells must not look field-precise or prescriptive. |
| Earth System Trend Detective | 7 | A single series, slope and uncertainty can tell a strong story; a generic dashboard and decorative dither add little. |
| Junior Astronaut Mission Trainer | 6 | Tangible trade-offs are excellent for learning, but a dense monochrome console may exclude younger users and game balance needs testing. |
| Space Mission Design Game | 6 | A visible mass/power trade-off can engage immediately; a credible whole-mission game and understandable feedback are costly. |
| Planet X and SPHEREx | 6 | Blink comparison can make motion tangible, but dither may erase faint sources and the data workflow threatens the demo. |
| Health Monitoring Software | 4 | Legible status and action paths matter, but clinical-looking certainty and unvalidated advice can mislead in a safety-critical setting. |

## Shortlist: five challenge areas, options and trade-offs

The first five seconds should identify **whose problem, what data, and what changed or decision is at stake**. Each flow below starts with a real, preselected example, then allows exploration and exposes provenance. Use plain text credits, no NASA logo, and disclose AI use in accordance with the submission guide.

### Flame in Freefall — 9

- **Directions:** (1) evidence comparison: select a habitat condition, compare two experiments and inspect the source; (2) experiment finder: a human-defined question and filters surface relevant studies with source snippets; (3) visual experiment plate: compare a microgravity flame with its stated conditions and a clear evidence-limit label.
- **For:** challenge explicitly asks to summarize, rank and interpret NASA combustion findings; a flame plus a comparison gives a recognizable five-second hook. The original study conditions and a source drawer give the viewer a route from claim to evidence. **Against:** a visually persuasive flame is not proof of a fire-safety prediction; evidence extraction, incompatible experiments and PSI access may exceed the weekend. Limit to a small, explicitly curated corpus, and avoid presenting a study ranking as an operational safety recommendation.
- **Flow/hero:** “Which experiment informs this scenario?” → two study cards with conditions and relevance → one cited figure and what it does *not* establish. Dither the photo only, retain a clear original toggle and solid text.
- **AI:** Gemini can extract candidate conditions from cited documents for human verification; Jev can rank relevance against a human-written rubric and expose alternatives. It is a gimmick if it ranks on labels alone, if the same fixed sort suffices, or if a probability is shown as scientific confidence without validation. Fallback: explicit filters and documented rubric, with model availability labeled.

### Lunar Landing Site Navigator — 9

- **Directions:** (1) site/date horizon view, comparing Sun and Earth positions; (2) two-site side-by-side timeline of light and communication windows; (3) an educator-oriented “move the date” view connecting the geometry to power and communications.
- **For:** the challenge itself identifies complexity of existing interfaces; site/date → horizon → consequence has a clear visual and user need. **Against:** apparent line-of-sight can be wrong without local topography; an attractive smooth horizon can imply more precision than is computed. State coordinate, time, reference frame, model and whether terrain occlusion is included. Avoid labeling a site safe or ranked on a spherical approximation alone.
- **Flow/hero:** chosen south-pole site and date → solid horizon with separately labeled Sun and Earth indicators → compare duration/windows. A dithered terrain backdrop is optional, never the horizon or numeric result; show no-data/unknown distinctly.
- **AI:** Jev could help navigate documented trade-offs between already computed, validated candidate metrics, if the user can change priorities; Gemini could extract source metadata for review. Calculating positions, visibility and threshold rules with AI is a gimmick and a validity risk. Deterministic calculations and source links must work independently of the models.

### Earth Information Jukebox — 8

- **Directions:** (1) one variable mapped audibly to pitch over time, synchronized with its visual frame and chart; (2) compare two locations with the same published mapping; (3) a guided exploration with a user-selected variable and a sonification legend, transcript and tactile/visual equivalent.
- **For:** the challenge explicitly calls for real-time dynamic sonification of Earth Information Center frames, so sound is core rather than decoration; a synchronized change makes the transformation visible in the first five seconds. **Against:** arbitrary pleasant music can misrepresent data; users who cannot hear need equivalent text and visual access, while blind users need a keyboard and an audio-first path. Frame luminance is not automatically a physical measurement: avoid claiming its pitch represents a physical quantity without an audited mapping. Test timing, ranges, and whether the chosen EIC frames retain values or just colorized pixels.
- **Flow/hero:** choose a source → play/pause → move time → hear and read the same change; show source, legend, mapping and units. Keep original frames available; dither only a visual treatment, never alter the values that drive sound. Captions describe audio and data, not just music.
- **AI:** Gemini may assist with reviewed frame descriptions or navigation of sourced metadata; Jev may route among meaningful user-selected explorations. Neither is necessary to convert a known series to sound: use deterministic mappings, not model-generated music or a personality selector dressed up as scientific interpretation. A no-AI mode must retain the real-time data mapping.

### MODIS/VIIRS Hot Spots — 8

- **Directions:** (1) a sensor-seam comparison of raw and harmonized historical activity; (2) an area-of-interest calendar with sensor coverage and uncertainty; (3) compare two seasons with matching observation constraints and a visible data-quality panel.
- **For:** challenge asks specifically for harmonization and a burning activity calendar, giving the team a meaningful point of difference beyond a fire map. A before/after seam with a coverage strip can show the issue in seconds. **Against:** hotspot detections are not burned area or a census of fires; differences in detection and observation can create false trends. A harmonization method requires a defensible validation set and coverage treatment; an attractive calendar cannot supply either.
- **Flow/hero:** area + dates → raw sensor break → method and harmonized calendar → coverage and uncertainty alongside. Use solid, labeled values, a color/shape redundant legend and a non-dithered analytical view; pattern may distinguish missing observations from zero detections.
- **AI:** Gemini can help interpret metadata or draft reviewed descriptions; Jev may triage ambiguous descriptions for human review, not infer fire causes or fix sensor bias. Harmonization and uncertainty are numerical methods, not a decision-model opportunity merely because probabilities are available.

### Discarded equipment storytelling — 8

- **Directions:** (1) a sourced artifact field guide linking hardware to science; (2) a short illustrated journey from mission goal to object left behind; (3) an accessible map-to-object experience with a short fact and source for each stop.
- **For:** the official brief names Moon, Mars and deep space, and school-age enthusiasts; a single recognizable artifact with its scientific purpose works immediately. Existing mission records give anchors. **Against:** a simulated first-person voice can be mistaken for a real quotation; a map or long voiceover may displace the science and younger users may struggle with dense coordinates. Review the rights and provenance of each selected image, and label any imagined narrative separately from sourced fact.
- **Flow/hero:** artifact photo, name and one human-authored sentence about its science → location/context → source and short transcript. Dither can evoke archival print, but offer original images and alt text. If narration is used, captions and a text equivalent are required design features.
- **AI:** Gemini may help extract a draft fact table from source documents for human checking. Jev might select a user-requested topic from a small verified collection, but a simple filter is likely better. Generating the core creative idea, invented quotes or unsourced historical details is unacceptable; a deterministic, human-authored story can be stronger.

## Disputes and corrections

- **VERIFIED — authorship and demo constraints:** The official [submission guide](https://www.spaceappschallenge.org/resources/project-submission-guide/) says SI should not come up with the solution idea; generated images/video require visible watermarks, and generated audio, code and data require descriptive-text and metadata acknowledgement. It specifies a ≤30-second video or ≤7-slide deck. The directions above are analytical inputs, not authorization to adopt an AI-authored idea.
- **VERIFIED — dither is not an accessibility strategy by itself:** [WCAG text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) sets 4.5:1 for normal text and 3:1 for large text, with stated exceptions; [use of color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) requires another visual means when color conveys information. Solid text, labels, patterns and a non-dithered view are necessary design choices; passing contrast alone does not establish accessibility. Test keyboard, screen reader, zoom, captions, and reduced motion with representative users.
- **DISPUTED — universal Bayer-on-live-map recommendation in cross-cutting findings:** fixed ordered dither may be visually stable but can still obscure small labels, faint SPHEREx sources, gradients and map boundaries. Compare original and processed imagery at actual device sizes, and keep analytic layers undithered. Neither a static matrix nor a high-contrast palette proves data readability.
- **DISPUTED — “probability = calibrated confidence for this task” and universal act/review thresholds:** [TypeSafe's model documentation](https://docs.typesafe.ai/models.md) describes trained calibrated decisions and text/image inputs; it does not establish calibration for this project's chosen samples, rubric or deployment. Validate locally before exposing numeric confidence, and avoid using it as an instrument measurement or safety authorization. Generic thresholds are not evidence.
- **VERIFIED / DISPUTED — Hydrogen narration wording:** [Google's model page](https://aistudio.google.com/docs/models/gemini-4-hydrogen) lists text, image, video, audio and PDF inputs and **text output**. It can draft text, not itself output a spoken track. Some findings use “narrates” loosely; identify a separate audio tool, disclose it, and provide text. This verification does not establish account access or quota.
- **DISPUTED — terrain shortcut as an operational answer:** a spherical horizon is a useful teaching baseline, not a terrain-aware south-pole visibility result. The [challenge](https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/) explicitly centers horizon-relative Sun/Earth positions. Clearly label the approximation and do not claim communication windows are terrain-validated without a checked local horizon.
- **DISPUTED — one accent / 1-bit as universal default:** fire-calendar categories, missing coverage and uncertainty can need multiple independent encodings. A restrained palette can still be accessible, but priority is the data legend and distinguishability at zoom and grayscale, not a fixed aesthetic rule. NASA source imagery rights also vary; inspect each asset rather than assuming all NASA-linked imagery is unrestricted.
- **DISPUTED — model checks as a hallucination guard:** a second model's agreement is not independent source verification. Show the source span, retain a human review step, and distinguish extracted facts, interpretations and missing evidence. A readable UI is not evidence of scientific correctness.

## Questions for the next wave

1. Which direction will the **human team** originate and own, and can it explain the problem, user and value in the first five seconds without relying on AI-generated novelty?
2. For each finalist, can a real challenge-listed NASA sample, source credit and license be acquired, rendered and checked end to end in the first two hours? What is the fallback if authentication or a service fails?
3. Lunar: can a real terrain-aware horizon be computed and checked against a known reference site/date? If not, what exact approximation can the UI honestly show?
4. Flame: which specific experiments have comparable conditions and accessible figures/tables; can a reviewer trace each extracted claim to a source? Are two studies enough for a meaningful comparison?
5. Jukebox: which EIC source exposes numerical values or a documented color-to-value mapping, and can real-time sonification be demonstrated with a reproducible legend and a non-audio equivalent?
6. Hotspots: what are the coverage, detection limits and validated harmonization method for one area/period? How are no observation, zero detected hotspots and uncertainty distinguished?
7. Storytelling: which artifact, image rights, coordinates and science claim can be verified in primary records? Can a school-age user understand it without a narrated track?
8. Can Jev and the stated Gemini fallback be called using this team's actual accounts and quota? Are the selected questions better than deterministic alternatives on a small labeled set, including failure and timeout cases?
9. Can a representative user complete the core flow at 200% zoom, by keyboard, with a screen reader and reduced motion? Are captions/transcripts, alt text, contrast and a non-dithered view present? Test, do not claim compliance from a palette alone.
10. Can a human-written storyboard show problem → interaction → evidence/limitation within 30 seconds, with visible AI-image watermark where applicable and legible source credits? Test at ordinary playback size, not a desktop screenshot.
