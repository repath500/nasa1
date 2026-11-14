# Plan: Earth Information Jukebox + Abandoned but Not Forgotten (Storytelling)

Prepared: 2026-11-14 · Author: planning sub-agent (Claude Haiku 5.5) · Deadline: Sun 15 Nov 2026, 11:59 p.m. local
Sources: `research/plans/PLAN_BRIEF.md`, `research/debate/VERDICT.md`, `research/findings/ds4-jukebox-storytelling.md` (main source; section numbers cited as ds4 §x), `research/challenges/the-earth-information-jukebox.md`, `research/challenges/nasas-discarded-equipment-storytelling.md`, `research/plans/plan-earth-hotspots-trend.md` (format reference).
Test-fetch outputs: `research/plans/samples/` (see §0 and `research/plans/samples/jukebox-storytelling-fetch-log.json`).

**Human decision required.** This plan lists options. It does not pick a challenge, a direction, or a team split. The team chooses.

**One thing the team must see before choosing:** the debate ranked the two challenges very differently. Jukebox has 8 points (4 of 6 votes in the top four). Discarded Equipment storytelling has 1 point (one vote, 4th place). Both plans below are written to the brief's constraints, but the verdict did not endorse storytelling as a top option. That is a fact for the team to weigh, not something this plan decides.

Verification legend: **VERIFIED** = fetched or run by this agent today (2026-11-14). **VERIFIED (ds4)** = checked by the earlier research pass, not re-run here. **UNTESTED** = not run; a question to settle in hour 1–2. **THIRD-PARTY** = a secondary source. **JUDGMENT** = opinion. **INFERRED** = arithmetic or reasoning from verified facts.

Constraints applied (from the brief and the verdict):
- **Jukebox:** the sound must be the data. A deterministic mapping card drives every note. AI music or voice is optional garnish only, labelled and watermarked. The Gemini API terms are 18+.
- **Storytelling:** the story is human-written. AI does captioning (alt text) and choice (which beat or postcard comes next) only. No AI-written prose, facts, quiz questions or narration. Public-domain sources only for images. LROC website images are copyrighted, so they are excluded.
- Both: code measures, Jev judges, Gemini perceives and captions, code enforces policy. Every direction has a no-model path. Dither never obscures data or text.

---

## 0. What I tested today (small fetches only)

| Check | Result | Status |
|---|---|---|
| GIBS WMTS, EPSG:4326, layer `MODIS_Terra_CorrectedReflectance_TrueColor`, `default`, 2024-01-15, `250m`, z1/y0/x0 | HTTP 200, `image/jpeg`, 512×512, 83,083 bytes. Saved as `samples/gibs_wmts_epsg4326_modis_terra_truecolor_z1.jpg` | **VERIFIED** |
| GIBS WMTS, layer `VIIRS_SNPP_DayNightBand_ENCC` (the night-lights layer), 4326/500m and 3857/Level8, 2024-01-15 | HTTP 404 both. The layer id exists in `gibs_caps.xml`, so the date or matrix set is wrong. | **UNTESTED** for a working tile. Fix with `DescribeDomains` before relying on it. |
| GIBS 3857 `MODIS_Terra...` with `GoogleMapsCompatible_Level6` | HTTP 400 (matrix set invalid for that layer) | **VERIFIED**: check the layer's own matrix set in the caps file. |
| images.nasa.gov API, `q=surveyor 3`, `media_type=image` | HTTP 200, **89 hits**. Items include AS12-48-7121 "View of Surveyor III in its crater" (JSC, 1969-11-20), AS12-48-7133, S69-55553 (artist concept), AS12-48-7134. Saved to `samples/images_api_surveyor3.json`. | **VERIFIED** |
| images.nasa.gov API, `q=lunar module descent stage` | HTTP 200, **41 hits**. Saved to `samples/images_api_lunar_module.json`. (ds4 reported 1,762 for a different query, "lunar module". The difference is the query, not the API.) | **VERIFIED** |
| LROC anthropogenic shapefile URL | HTTP 302 to `https://data.lroc.im-ldi.com/lroc/view_rdr/SHAPEFILE_ANTHROPOGENIC_OBJECTS`. Only the redirect was checked here. The 71-record parse was done in ds4. | Redirect **VERIFIED**; ZIP re-download **UNTESTED** today; 71 records **VERIFIED (ds4)** |
| NSSDC record Apollo 11 LM (`1969-059C`) | HTTP 200 (HEAD) | **VERIFIED** |
| SVS `5313/` (Night Lights) | HTTP 200 (HEAD). Frame-set download URLs were **not** tested. | Page **VERIFIED**; frame sets **UNTESTED** |
| HiRISE `ESP_050177_1780` | HTTP 200 (HEAD) | **VERIFIED** |
| JPL Horizons, `COMMAND='-31'` (Voyager 1), observer, geocentre, 1-day step, 2026-11-14 → 15 | HTTP 200, `$$SOE` block present. Range **173.067682711 AU** (14 Nov), 173.083248374 AU (15 Nov). Matches ds4's 173.07 AU. Saved to `samples/horizons_voyager1_2026-11-14.txt`. | **VERIFIED** |
| Horizons IDs for Pioneer 10 (-23), Pioneer 11 (-24), Voyager 2 (-32) | Not fetched today. ds4 lists them. | **VERIFIED (ds4)**; re-run **UNTESTED** |
| Gemini / Jev / Lyria endpoints, keys, latency | Not called (no keys in this sandbox). Model facts are from ds4 docs review. | **VERIFIED (ds4)** for specs; latency **UNTESTED** |

**Fallbacks if a fetch fails in the build:** SVS MP4 (32.7 MB H.265 for 5313) instead of frame sets; a pre-rendered PNG of the night-lights frame from the SVS page; the static LROC PDS product in place of the GIBS tile. None of the demo paths depends on live GIBS.

**No Earthdata Login is needed** for anything in either plan (GIBS, SVS, images API, LROC PDS, NSSDC, HiRISE, Horizons). Do not spend hour 1 on URS.

---

## 1. Shared decisions the team must make (options, not picks)

| # | Decision | Options | Plan default if the team does nothing |
|---|---|---|---|
| D1 | Which challenge | (a) Jukebox · (b) Storytelling · (c) both as separate tracks (not recommended for 48 h) | Plans below are written for both. |
| D2 | Gemini age terms | (a) Authoring-time only: Gemini generates alt text in our build pipeline; the shipped app makes no Gemini calls. (b) No Gemini at all: human-written alt text. (c) Open-weight captioner (e.g. a local VLM), no 18+ terms. | **(a)**, with a written check that authoring-time use is not "child-directed". Option (b) is the safest and costs time. |
| D3 | Jev access | (a) Waitlist approved and live calls · (b) precomputed decisions only · (c) OpenRouter `typesafe/jev-1.14` if it works for us | **(b)** until a live call succeeds. Gemini Decision 1 is the fallback for (b). |
| D4 | AI voice | (a) None: use the OS screen reader and browser speech (not AI) · (b) Gemini 3.8 Flash TTS, pre-generated, labelled | Jukebox: **(a)** (also the cleanest for accessibility). Storytelling: **(a)**, because the brief says AI does captioning and choice only. |
| D5 | Storytelling age band | 9–12 or 11–14 (ds4 §2.2) | 11–14: longer text, more source detail. |
| D6 | Jukebox scope | 3 tracks (safe) or 6 tracks (ds4 target) | 3 tracks. |

---

# Part A: Earth Information Jukebox

## A.0 Challenge requirements (quoted from `the-earth-information-jukebox.md`)

- "an interface, script, or application that pairs EIC visual frames with dynamic sonifications generated in real time"
- "Accessibility is a core theme of this challenge. You could explore adding features that support blind and low-vision users, such as screen-reader compatibility, tactile feedback, or rich descriptive text accompanying your audio."
- "Consider the balance between strict data translation and musicality. A direct pixel-to-sound translation might result in chaotic noise; you may want to apply artistic rulesets, musical scales, or harmonies to make the audio engaging and pleasant to listen to."
- "Documenting your process can help others understand your vision."
- Resources: the EIC/SVS gallery and the nine listed visualizations. For Global Awards eligibility, at least one challenge NASA resource must be used (ds4 §3.3, from the Space Apps FAQ).
- Team constraint (brief): the **sound is the data**. A deterministic mapping card on SVS/GIBS frames. AI music or voice is optional garnish, watermarked.

## A.1 Direction J-A: "EARTH/1 — Literal Liner Notes" (the data plays the record)

**Concept.** A three-track "record player" for SVS frame sets. Each track is a sonification defined by a published **mapping card**. The same frame always produces the same notes (a hash of `notes.json` proves it). The screen shows the frame, the scan line, and the card. Lyria or Jev are optional and never write a note.

**Requirements it meets.**
- "pairs EIC visual frames with dynamic sonifications" — frame sets from SVS, played in sync.
- "Show the mapping" (ds4 §1.2) — the mapping card is on screen and downloadable.
- "a direct pixel-to-sound translation might result in chaotic noise" — handled with a scale (C minor pentatonic), 8 pitch bands, and a velocity floor.
- "rich descriptive text" — Gemini alt text per frame, reviewed by a human.
- Sound is the data: every note traces to a cell value on the card.

**Tracks (MVP: 3 of the 6 in ds4).** Chosen for contrast and for the licence check in §A.4.
1. **SVS 5313 — Change in Night Lights 2012–2023.** High contrast. Hero track.
2. **SVS 3912 — Global Sea Surface Currents and Temperature.** Continuous, slow motion.
3. **SVS 4950 — GEDI Forest Height.** Colour to pitch; many frame sets.

Each is a frame set (UNTESTED download) or a 960×540 PNG derived from one. If frame sets fail, use the MP4 and extract frames with ffmpeg (LGPL build; ds4 §1.5).

### A.1.1 Data pipeline (J-A)

| Step | Source / endpoint | Subset | Auth | Licence / credit | Status |
|---|---|---|---|---|---|
| 1. Frames | SVS frame sets for IDs 5313, 3912, 4950 (`svs.gsfc.nasa.gov/<id>/`) | 960×540 downscale, 1 frame per SVS step, first 16 frames per track for MVP | none | NASA/GSFC SVS; credit SVS and producers; NASA media guidelines | Page **VERIFIED**; frame-set download **UNTESTED** |
| 2. Licensed music check | SVS description for 14696 and 14568 credits licensed music; check the three chosen pages | Use frames only, never the produced soundtrack | none | per-page credits | **VERIFIED (ds4)**; per-page check for our 3 **UNTESTED** |
| 3. Live backdrop (stretch only) | GIBS `MODIS_Terra_CorrectedReflectance_TrueColor`, 4326, 250m | one tile | none | GIBS acknowledgement (§A.4) | **VERIFIED** (512×512 JPEG sample) |
| 4. Night-lights tile (stretch) | GIBS `VIIRS_SNPP_DayNightBand_ENCC` | one tile | none | GIBS acknowledgement | **UNTESTED** (404 at two matrix sets with 2024-01-15) |
| 5. Feature extraction (offline) | Python + OpenCV/Pillow on the frames | 32×18 luma grid per frame; warm-pixel ratio; bright-cluster count; motion (frame diff) | n/a | n/a | **Plan**: write `features.json` per track |
| 6. Mapping card → notes | Deterministic code (no model) | Per §A.1.3 | n/a | n/a | **Plan** |
| 7. Alt text | Gemini 4 Hydrogen, one call per frame, structured JSON (§A.1.4) | 3 frames per track for MVP | Gemini key (authoring only) | output is text, disclose | **Plan**; latency UNTESTED |
| 8. Optional dream bed | Lyria 3.5 clip, 30–60 s instrumental, or Lyria RealTime | off by default | Gemini key | SynthID; disclose | **VERIFIED (ds4)** specs; RealTime price UNVERIFIED |

**Fallback:** if SVS frame sets fail in hour 2, the team uses the MP4 (5313 is 32.7 MB H.265) and extracts frames offline. If that also fails, use the SVS PNG stills on the page. The mapping card runs on any of these.

### A.1.2 Architecture (J-A)

- **Frontend:** static web app (Vite + TypeScript, or plain JS). No server. Canvas dither, Tone.js, a card component.
- **Backend:** none. Everything is pre-built into `public/data/<track>/` (frames, `features.json`, `notes.json`, `alt.json`).
- **Where each piece sits:**
  - **Code:** feature extraction, mapping card, `notes.json`, dithering, playback, the hash check, the accessibility layer.
  - **Jev (optional):** chooses which *already-defined* layer is foregrounded for the next 8 bars. It never picks a pitch, a note or a velocity. Off by default; precomputed decisions are logged in `decisions.json`.
  - **Gemini (authoring only):** alt text and short frame description. No live calls in the shipped app.
  - **Lyria (optional):** a pre-generated clip that plays under the data layer, labelled "AI-generated music — not data".
- **Cost and latency.** Jev: $0.042 per 1M input tokens, 70–500 ms per call (VERIFIED (ds4) from docs); a call is about 1–2k tokens, so about $0.0001 per call. Gemini Hydrogen: $1.50/$7.50 per 1M in/out; a call with one frame is about 3–4k tokens in and about 400 out, so about $0.008 per call; 3 tracks × 3 frames = 9 calls ≈ $0.07 (JUDGMENT). Latency per call: UNTESTED (JUDGMENT 5–15 s). Lyria 3.5: $0.08 per song (VERIFIED (ds4)).

### A.1.3 Mapping card (the core deliverable) — deterministic

Written once per track, in `mapping.json`, and shown on screen.

| Musical parameter | Data feature | Rule |
|---|---|---|
| Time | Frame index | 1 frame = 1 bar at 90 BPM (4 beats, 16 steps). Frames play in order. |
| Scan (step) | Column x of a 32×18 grid | Left → right across 16 steps. Each step reads 2 columns (mean). |
| Pitch | Row band y (8 bands; top = high) | 8 bands → C minor pentatonic, two octaves (10 notes). Band 0 = top = highest note. |
| Loudness (velocity) | Mean luma of that cell, 0–1 | velocity = round(127 × luma), and zero below 0.05 (suppresses dark noise). |
| Stereo pan | Column x | pan = −1 … +1 across the grid. |
| Timbre | Cell colour class | Bright cluster (luma > 0.7) → bell (FM); warm pixel (R > G > B) → triangle pad; otherwise → sine. |
| Motion (filter) | Frame-to-frame difference (mean abs) | Low-pass cut-off scales with motion (0.1 → 0.9). |
| Reproducibility | notes.json | SHA-256 of `notes.json` is shown on the card. Re-running the extraction gives the same hash (test on frame 0 at hour 6). |

**What a judge hears (expected; verify on the real frames before the hero is built).** Night Lights: the scan crosses dark ocean (silence) and then the lit cluster of Europe and South Asia (dense bells on the upper bands, panned to the right). The dither shows the same cells. The region names are our reading of the frame, not checked against the SVS caption yet.

**What we do not claim.** The mapping is a choice, not a scientific measurement. The card says so. Pitch is not temperature; it is row position. (This is the honest caveat judges will test.)

### A.1.4 Structured schemas

**Jev question schema (optional DJ, J-A).** Jev answers from the mapping features, never from audio.

```json
{
  "model": "jev-latest",
  "state": {
    "track": "svs_5313_night_lights",
    "frame_index": 7,
    "features": {"mean_luma": 0.18, "warm_pixel_ratio": 0.02, "bright_clusters": 312, "motion": 0.07},
    "layers": ["bell_bright_clusters", "pad_warm", "sine_base"],
    "user_mode": "literal"
  },
  "questions": {
    "foreground_layer": {
      "type": "choice",
      "instructions": "Which data layer should be foregrounded (louder, not added) for the next 8 bars?",
      "criteria": {
        "bell_bright_clusters": "The bright-cluster layer, when bright clusters are the main feature",
        "pad_warm": "The warm-pixel layer, when warm pixels dominate",
        "sine_base": "The base layer, when neither dominates"
      }
    },
    "change_now": {
      "type": "noul",
      "instructions": "Is the feature change at this frame large enough that the foreground should switch now?"
    }
  }
}
```

Code rule: apply `foreground_layer` only if its confidence is ≥ 0.7 and `change_now` ≥ 0.7; otherwise keep the current foreground. Log every decision. Jev confidence is "model confidence", not scientific validation (VERDICT).

**Gemini JSON schema (alt text, J-A, one call per frame; text output only).**

```json
{
  "type": "object",
  "required": ["frame_id", "alt_text", "description", "visible_features", "uncertain"],
  "properties": {
    "frame_id": {"type": "string"},
    "alt_text": {"type": "string", "maxLength": 125},
    "description": {"type": "string", "maxLength": 400},
    "visible_features": {
      "type": "array",
      "items": {"type": "object", "required": ["label", "where"],
        "properties": {"label": {"type": "string"}, "where": {"type": "string", "enum": ["upper", "middle", "lower", "left", "centre", "right"]}}}
    },
    "legible_text": {"type": "array", "items": {"type": "string"}},
    "uncertain": {"type": "array", "items": {"type": "string"}},
    "nasa_logo_visible": {"type": "boolean"}
  }
}
```

Prompt sketch: "You caption one frame of a NASA visualization for blind and low-vision listeners. Describe only what is visible. Do not infer causes or quantities. Put anything you cannot read or verify in `uncertain`. Set `nasa_logo_visible` true if any NASA insignia or logotype appears." A human checks every caption against the SVS caption.

### A.1.5 Dither UI — three screens

Tokens: background `#0B0B0C`; ink `#EDEDE8`; single accent `#E8A33D` (signal amber, deliberately not NASA red); mono labels `IBM Plex Mono` or `JetBrains Mono` (verify font licence); body `Inter` (OFL). Dither: Bayer 4×4 for animation, Atkinson for stills, 2 px cells on the 960×540 canvas, rendered at 1× and upscaled with `image-rendering: pixelated`. Reduced-motion turns off the threshold sweep.

1. **Record shelf (home).** 3 tall "sleeves" in a row, each a Bayer-dithered thumbnail of its frame; a mono title and "SVS 5313" under each. Under the shelf, a three-way toggle: `Literal` · `Audio only` · `Dream (optional)`. The toggle is text with a visible focus ring. Each sleeve is a button with alt text.
2. **Playback.** A 960×540 dither canvas on the left (32×18 cell grid, 30 px cells on screen). A vertical amber scan line sweeps 16 steps per bar. A 16-dot step row under the canvas lights as notes sound. Right column: the mapping card (§A.1.5-3 below). Transport: play/pause, "next bar", a keyboard shortcut list. Colour is never the only carrier: bright clusters also get a dot marker.
3. **Mapping card.** A printed-style card. Six rows (Time, Scan, Pitch, Velocity, Pan, Timbre), each with a 40×40 Bayer legend swatch showing the dither level that matches the value range. Footer: `notes.json SHA-256 …` and a "download mapping" button. Numbers in mono, never dithered.

**Hero moment (0:12–0:20 in the video).** The scan line reaches the lit cluster on Night Lights. The dither threshold sweep reveals the cluster cell by cell, and the bell layer fires on exactly those cells, with the step dots lighting in sync. The card row "Timbre: bright cluster → bell" flashes amber. The judge sees and hears one data event, and the card says why.

### A.1.6 30-second storyboard (J-A)

| Time | Shot | On screen | Audio |
|---|---|---|---|
| 0:00–0:03 | Black. Mono title "EARTH/1 — Literal Liner Notes". | Title, amber underline. | Silence, then one low pad note. |
| 0:03–0:07 | Record shelf. Cursor selects Night Lights. | Sleeves, toggle on Literal. | Pad fades in. |
| 0:07–0:12 | Playback starts. Scan line sweeps the dark ocean. | Canvas, step dots, card visible. | Sparse sine base. |
| 0:12–0:20 | **Hero.** Scan crosses the lit cluster. Dither resolves. Bell cluster fires. | "Timbre: bright cluster → bell" flashes. | Dense bells, panned right. |
| 0:20–0:25 | Click "Audio only": screen goes dark, card stays as text. | Text card, focus visible. | The same notes, no picture. |
| 0:25–0:30 | Card, hash line highlighted, then end card with SVS credit. | "notes.json SHA-256 …" + "Image: NASA's Scientific Visualization Studio". | Two bars of the bell motif. |

### A.1.7 Risks and pre-mortem (J-A)

- **R1 Mapping reads as "random notes".** Mitigation: the card, the pentatonic scale, and the velocity floor; test with a non-expert.
- **R2 Frame-set download is slow or huge.** Mitigation: frames at 960×540, 16 per track, pre-built; MP4 fallback.
- **R3 Judges see a visualizer, not a jukebox.** Mitigation: the audio-only toggle is in the 30 s video.
- **R4 Jev never goes live.** Mitigation: Jev is optional; precomputed decisions; the demo does not depend on it.
- **R5 AI music sounds like the product.** Mitigation: Lyria off by default; labelled.
- **Pre-mortem: why this lost.** "It was a pretty player with a clever card, but the sound was a fixed pentatonic walk through pixels. Judges asked what a pitch means, got an answer, and then had no reason to remember it. The blind-user story was a toggle, not a design, and nobody who was blind had tested it."

### A.1.8 Scores (JUDGMENT, 1–5)

| Criterion | Score | Why |
|---|---|---|
| Impact | 4 | Clear public value; less emotional than a story unless the Night Lights hero lands. |
| Creativity | 4 | The mapping card as the artwork; a literal record player. |
| Validity | 5 | Every note traces to a cell value; reproducible by hash. The caveat is on the card. |
| Relevance | 5 | Uses SVS frames and sonifies them, as asked. |
| Presentation | 4 | The 30 s video is strong if the hero is clean; the card is text-heavy. |

---

## A.2 Direction J-B: "Listen to the Planet" — audio-first sound walk

**Concept.** The same deterministic mapping as J-A, but the primary experience is a spatial "sound walk" for screen-reader and keyboard users. The picture is optional for sighted allies. The user moves through the grid by region, solos a region, and hears the band that matches. Descriptions are text, read by the user's own screen reader. No AI voice.

**Requirements it meets.**
- "screen-reader compatibility … rich descriptive text accompanying your audio" — the description timeline and region labels are the primary UI.
- "tactile feedback" — optional Gamepad vibration or keyboard "bump" on region edges (stretch).
- "a direct pixel-to-sound translation might result in chaotic noise" — the same scale and velocity floor as J-A, plus "solo" to isolate one region.
- Sound is the data: the region solo plays the same notes from `notes.json`.

**Tracks (MVP: 2).** SVS 5313 (Night Lights) and SVS 3912 (Ocean Currents). A third is a stretch.

### A.2.1 Data pipeline (J-B)

Same as J-A steps 1, 2, 5 and 6. Differences:

| Step | What changes |
|---|---|
| 7. Descriptions | Gemini alt text (same schema, §A.1.4) becomes the description timeline: one entry per scene (4 scenes per track). A human writes or edits every description. The text is the primary output. |
| 8. Regions | The 32×18 grid is grouped into 4×4 regions (16 regions). Each region has a label from the Gemini caption and a fixed key 1–9, a–g. |
| 9. Lyria | Not used in J-B (keeps the audio entirely data-driven). |

### A.2.2 Architecture (J-B)

- **Frontend:** static web app. Keyboard-first, with ARIA live regions for the scan and for region changes. Tone.js for audio. The canvas is `aria-hidden` and optional.
- **Backend:** none.
- **Code:** all audio, the region solo logic, the timeline, keyboard map, and the hash check.
- **Jev (optional):** chooses the next region to suggest ("explore", "compare", "explain"). Precomputed in `decisions.json`.
- **Gemini (authoring only):** alt text and scene descriptions; disclosed in metadata.
- **Speech:** the user's own screen reader. No TTS file ships in J-B (keeps D4 option (a)).
- **Cost and latency:** the same as J-A. 2 tracks × 4 scenes → about 8 Gemini calls ≈ $0.06 (JUDGMENT).

### A.2.3 Jev question schema (J-B, optional)

```json
{
  "model": "jev-latest",
  "state": {
    "track": "svs_5313_night_lights",
    "user_intent_last_3": ["solo:bright_cluster_region_c3", "back", "solo:dark_ocean_region_a1"],
    "regions_visited": 5,
    "desc_level": "short"
  },
  "questions": {
    "next_action": {
      "type": "choice",
      "instructions": "What should the walk suggest next to the listener?",
      "criteria": {
        "explore": "A region with a different brightness band from the last one soloed",
        "compare": "The mirror region (same row, other side of the scan) for a stereo comparison",
        "explain": "Re-read the current scene's description"
      }
    },
    "detail": {
      "type": "score",
      "instructions": "How much detail should the next description give?",
      "criteria": ["one idea", "two ideas", "full scene"]
    }
  }
}
```

Code rule: suggestions only. Never auto-moves the listener. Threshold 0.7 for a suggestion to appear.

### A.2.4 Dither UI — three screens (J-B; the picture is optional)

1. **Start.** One large text button "Start sound walk" (keyboard Enter). Under it: track name, length (90 s), and the keys (1–9, a–g, arrows, Space). Dither is a 3-px-cell Bayer tile in the corner, decorative (`alt=""`).
2. **Walk (screen-reader first).** The region grid is a visible 4×4 dither grid for sighted allies, with each region labelled `A1`–`D4` in mono. Focus follows the scan. The live region reads: "Scene 2 of 4. Region B3. Bright band, 14 lit cells. Pan right." The solo key plays the region alone; Esc returns.
3. **Descriptions.** Text panel: the current scene's description, the source line, and the "what changed" line. Each scene has a "replay scene" button. A transcript of the whole walk is downloadable.

**Hero moment.** A screen-reader user, without a mouse, solos the bright-cluster region, hears the bell motif, and answers a question about the scene from the sound and the description. Record it with consent; no under-18 voices.

### A.2.5 30-second storyboard (J-B)

| Time | Shot | On screen | Audio |
|---|---|---|---|
| 0:00–0:04 | Keyboard hands only. Text title "Listen to the Planet." | Start screen. | Silence, then the walk begins. |
| 0:04–0:10 | Scan steps through scene 1 (dark). | Live region text. | Sparse sine, panned slowly. |
| 0:10–0:20 | **Hero.** User presses `3` then `c`; solo on the bright-cluster region; bells, panned right. | Region label, "14 lit cells". | Solo bells, then the mix returns. |
| 0:20–0:26 | Descriptions panel: "bright cluster over South Asia" (human-edited caption). | Text panel, source line. | Silence (screen reader reads it). |
| 0:26–0:30 | End card: credit, "Descriptions and mapping: team-written; Gemini drafts alt text, human-checked." | AI disclosure line. | Two bars. |

### A.2.6 Risks and pre-mortem (J-B)

- **R1 Only one tester.** Blind users are not on the team. Mitigation: invite one tester in hour 1; if none, the submission says "not user-tested with BVI users", and cites the Chandra design principles instead (ds4 open question 7).
- **R2 The picture is missing from the demo.** Mitigation: the video shows the text and waveform too.
- **R3 Judges see "just sound".** Mitigation: the mapping card is shown in the video as a text overlay.
- **Pre-mortem: why this lost.** "It was beautifully accessible and nobody could see it. The judges watched a 30-second video of a text box and a waveform. They trusted the accessibility claim without a blind tester, and the mapping card was too small to read."

### A.2.7 Scores (JUDGMENT, 1–5)

| Criterion | Score | Why |
|---|---|---|
| Impact | 5 | Accessibility is the core ask, and this is the only direction built for it first. |
| Creativity | 4 | Spatial sound-walk with solo keys is novel for this challenge. |
| Validity | 4 | Same deterministic mapping; the descriptions need careful human checks. |
| Relevance | 5 | Directly answers "screen-reader compatibility" and "descriptive text". |
| Presentation | 3 | Hard to show in 30 seconds without seeing it; the video has to be designed for it. |

---

# Part B: Abandoned but Not Forgotten (Storytelling)

## B.0 Challenge requirements (quoted from `nasas-discarded-equipment-storytelling.md`)

- "tell the story of some or all of this equipment that introduces school-age space enthusiasts to the hardware and the science it made possible."
- "showing your audience how these missions operated rather than listing facts about them."
- "Accuracy is important throughout!"
- "How accessible is the format you chose to use?"
- "an interactive map of the Moon with clickable 'ghost rovers'" (the challenge's own example).
- Summary: "Moon, Mars, and deep space." Include at least one deep-space object (ds4 §2.1).
- Team constraint (brief): **the story is human-written**. AI does captioning and choice only.

## B.1 Direction S-A: "Still Here — A Field Guide to the Forgotten" (Moon-first)

**Concept.** A dithered field guide to a dozen objects on the Moon, Mars and in deep space. A Moon map is built from the LROC 71-record shapefile. Each object has a plate: a public-domain still, a short human-written story in two clearly separate tabs ("From the records" and "Imagined from mission records"), and a source drawer where every claim has a quote and a link. Gemini writes alt text only. Jev chooses which beat comes next.

**Requirements it meets.**
- "interactive map of the Moon with clickable ghost rovers" — the LROC map with 8–12 pins.
- "showing your audience how these missions operated" — each plate has one mechanism the object did (e.g. the LRV's wheels, the descent stage as a launch pad).
- "Accuracy is important throughout" — the source drawer, the known/inferred/unlocated patterns.
- "How accessible is the format" — alt text, keyboard map, reduced motion, no colour-only encoding.
- "at least one deep-space object" — Pioneer 10 appears as a short plate (or is shown only in S-B; see §B.1.8).

### B.1.1 Data pipeline (S-A)

| Step | Source / endpoint | Subset | Auth | Licence / credit | Status |
|---|---|---|---|---|---|
| 1. Moon inventory | LROC PDS point shapefile `SHAPEFILE_ANTHROPOGENIC_OBJECTS` (71 records, updated 2026-08-14 per ds4) | Filter to 8–12 object IDs (e.g. A11_LM, A12_LM, A15_LRV, A17_LM, Surveyor3, A12_ALSEP, A12_LMAS, Chang'e 6, SLIM, Blue Ghost 1 retroreflector) | none | PDS: public domain; cite the LROC citation in the README (Wagner et al. 2017 per ds4) | Redirect **VERIFIED**; 71-record parse **VERIFIED (ds4)**; ZIP re-download **UNTESTED** |
| 2. Object facts | NSSDCA record pages (e.g. `1969-059C` HEAD 200; `1971-063C`, `1969-099C` per ds4) | Hand-curated facts (no API) | none | NASA public domain; cite record URL | HEAD **VERIFIED**; text **UNTESTED** today |
| 3. Mission pages (Mars, deep space) | science.nasa.gov mission pages (Viking 1, Opportunity, InSight, Ingenuity, Pioneer 10) | Status, landing site, final state | none | NASA public domain | **VERIFIED (ds4)**; not re-fetched |
| 4. Still images (Moon) | images.nasa.gov API: `q=surveyor 3` returned 89 hits, e.g. AS12-48-7121 (Surveyor III in its crater, JSC, 1969-11-20) | 1 still per object | none | NASA media guidelines; check each item's own rights note | **VERIFIED** (query + metadata) |
| 5. LROC imagery (Moon, optional) | **PDS products only**, not website images (ds4 §2.4 image IDs e.g. M131494509L, M175252641R) | 1 frame per object, cropped | none | PDS: public domain; credit NASA/GSFC/ASU | PDS path **UNTESTED**. Website images: **excluded** (copyrighted). |
| 6. Mars still (optional) | HiRISE `ESP_050177_1780` (Opportunity) | one crop | none | Public domain; credit "NASA/JPL/University of Arizona" (ds4 §3.2) | Page HEAD **VERIFIED**; image download **UNTESTED** |
| 7. Captions (AI, authoring) | Gemini 4 Hydrogen, one call per still | JSON alt text (§B.1.4) | Gemini key | text output; disclose | **Plan**; latency UNTESTED |
| 8. Map basemap | none verified. Options: a plain lat/lon grid drawn in code (no basemap), or a Moon basemap after licence check | — | — | **UNVERIFIED**: OpenPlanetaryMap licence | Plan: code-drawn grid (no licence risk) |
| 9. Choice | Jev (optional, D3) or a precomputed path | §B.1.3 | Jev key | per TypeSafe terms | **UNTESTED** access |

**Fallback:** if LROC PDS crops are not ready by hour 14, use the images.nasa.gov stills only (all NASA, public domain). The map and the source drawer do not depend on LROC imagery.

### B.1.2 Architecture (S-A)

- **Frontend:** static site. Vite + TypeScript or plain HTML. The Moon map is an SVG/canvas lat/lon grid; pins come from `artifacts.json`. Tabs for Moon / Mars / deep space (Mars and deep space as text plates only if time is short).
- **Backend:** none. `artifacts.json` and `beats.json` are built offline and committed.
- **Where each piece sits:**
  - **Human:** writes every story beat, the "From the records" facts, the "Imagined" first-person text, and checks every date, coordinate and quote.
  - **Gemini (authoring only):** alt text and a factual caption per still (§B.1.4). No prose, no story text, no quiz questions.
  - **Jev (optional, D3):** picks the next beat or the next artifact from the human-written set (§B.1.3). It never writes text.
  - **Code:** the map, the source drawer, the "From the records" / "Imagined" tabs, the known/inferred/unlocated patterns, keyboard map, and the claims check (every factual line must have a `source_url` and a quote).
  - **No TTS** (D4 option (a)).
- **Cost and latency.** Jev: ~$0.0001 per call. Gemini: 12 stills × 1 call ≈ 12 calls × ~$0.008 ≈ $0.10 (JUDGMENT). Latency UNTESTED.

### B.1.3 Jev question schema (S-A)

Jev chooses from the human-written beat graph. The state contains the excerpts the human has already checked.

```json
{
  "model": "jev-latest",
  "state": {
    "artifact": "Surveyor 3",
    "mission": "Surveyor 3 / Apollo 12",
    "reading_level": "grade 6",
    "beats_seen": ["landing"],
    "user_question": "what did it find?",
    "checked_excerpts": [
      {"id": "nssdc_1967_surveyor3", "quote": "(human-checked quote from NSSDCA)", "url": "https://nssdc.gsfc.nasa.gov/ (record URL)"}
    ]
  },
  "questions": {
    "next_beat": {
      "type": "choice",
      "instructions": "Which human-written beat should come next for this reader?",
      "criteria": {
        "the_experiment": "What the lander measured and why it mattered",
        "apollo_12_visit": "How a later mission landed nearby and returned parts",
        "the_end": "What happened to the lander and what remains"
      }
    },
    "detail": {
      "type": "score",
      "instructions": "How much of the beat should show?",
      "criteria": ["one idea", "two ideas", "full beat"]
    },
    "route_check": {
      "type": "noul",
      "instructions": "Does the user's question match the beat's own topic? (route only, not a fact check)"
    }
  }
}
```

Code rule: `next_beat` only if its confidence ≥ 0.7; else the default order in `beats.json`. `route_check` is a routing flag only. A human fact-check is always required, because Jev can be wrong (ds4 §2.9).

### B.1.4 Gemini JSON schema (S-A; captions only)

```json
{
  "type": "object",
  "required": ["still_id", "alt_text", "caption", "visible_elements", "uncertain"],
  "properties": {
    "still_id": {"type": "string"},
    "alt_text": {"type": "string", "maxLength": 125},
    "caption": {"type": "string", "maxLength": 240, "description": "Describe what is visible. No history, no causes, no quotes."},
    "visible_elements": {
      "type": "array",
      "items": {"type": "object", "required": ["label", "where"],
        "properties": {"label": {"type": "string"}, "where": {"type": "string"}}}
    },
    "legible_text": {"type": "array", "items": {"type": "string"}},
    "uncertain": {"type": "array", "items": {"type": "string"}},
    "nasa_logo_visible": {"type": "boolean"}
  }
}
```

Prompt sketch: "Caption this public-domain photo for a blind student. Describe only what you can see. Do not give dates, names, causes or quotes; if text is legible, list it. Put anything you cannot verify in `uncertain`. Set `nasa_logo_visible` true if an insignia appears." The human writes the factual spine; the caption is accessibility text only.

### B.1.5 Dither UI — three screens (S-A)

Tokens as in §A.1.5 (ink `#EDEDE8`, background `#0B0B0C`, accent `#E8A33D`). Dither: Atkinson for stills (1–2 px cells); Bayer 4×4 for the "resolve" transition. Map basemap dithered at low contrast; pins, labels and numbers are crisp vector (never dithered).

1. **Moon map.** A lat/lon grid in dither (very low contrast), 8–12 pins. A pin's dither pattern shows its status: solid Bayer = "confirmed on the LROC record"; sparse blue-noise = "approximate coordinates"; dashed outline = "not located". A legend under the map explains the three. Tabs: Moon · Mars · Deep space.
2. **Plate.** Left: a dithered still (Atkinson, 1-bit, amber on black) with alt text beneath. Right: the title (e.g. "Surveyor 3, landed 1967 · Ocean of Storms"), two tabs: **"From the records"** (human facts, each with a source chip) and **"Imagined from mission records"** (human first-person, with a dashed amber border and a banner saying so). Bottom: "Source drawer" button.
3. **Source drawer.** A table of claims. Each row: the claim, the quote, the source (NSSDCA / LROC PDS / NASA page), the licence (public domain / CC BY-SA …), and "checked by" initials. Confirmed rows are solid; inferred rows are dashed. A link to every record.

**Hero moment (0:14–0:22).** Start on the Moon map. Zoom into Tranquility Base. Click the Apollo 11 descent-stage pin. The still resolves from dither noise into the 1969 photograph (Bayer threshold sweep) while the "From the records" tab shows the one sourced fact (e.g. the LM was left as a launch pad, per the NSSDCA record). Then flip to "Imagined" and show the banner.

### B.1.6 30-second storyboard (S-A)

| Time | Shot | On screen | Audio |
|---|---|---|---|
| 0:00–0:04 | Dither Moon. Title "Still Here". | Title, amber rule. | Silence. |
| 0:04–0:10 | Map. Pins appear, one by one. | Legend shows the three patterns. | Soft click per pin (no voice). |
| 0:10–0:22 | **Hero.** Zoom to the Apollo 11 pin; the still resolves; tab "From the records" then "Imagined" with the banner. | Dashed amber border on the imagined tab. | Sound: none (text-first). Or a 2-second archival clip from NASA Historical Sounds (check licence). |
| 0:22–0:27 | Source drawer opens; a row turns solid. | Quote, source chip, licence. | Silence. |
| 0:27–0:30 | End card: "Every factual line has a source. AI wrote alt text only." Credit NASA/GSFC/ASU (PDS). | Disclosure line. | — |

### B.1.7 Risks and pre-mortem (S-A)

- **R1 A factual error in a plate.** This sinks the entry (ds4 §2.2). Mitigation: a second human checks every number and quote; the source drawer is on every plate; the claims check blocks a line without a source.
- **R2 Too many artifacts for 48 h.** Mitigation: cut to 8 at T-12h (the ds4 list: Apollo 11 LM, Apollo 15 LRV, Surveyor 3, Viking 1, Opportunity, InSight, Ingenuity, Pioneer 10).
- **R3 LROC image licence.** Mitigation: PDS products only; website images excluded (VERIFIED (ds4)).
- **R4 Map basemap licence unknown.** Mitigation: code-drawn grid.
- **R5 AI-written feel.** Mitigation: AI writes no prose; the human voice is the product.
- **Pre-mortem: why this lost.** "It was a careful, accurate map with a lot of tabs. The judges clicked three pins, found a sourced fact and a clean drawer, and forgot it. The one hero moment (the dither resolve) was too slow for a 30 s video, and the 'Imagined' tab read as a story about the machines, not the science."

### B.1.8 Scores (JUDGMENT, 1–5)

| Criterion | Score | Why |
|---|---|---|
| Impact | 4 | Kids can click a Moon map and read a sourced plate; the emotional hook depends on the writing. |
| Creativity | 4 | The dither "resolve" and two-tab honesty device are distinctive; a map is common. |
| Validity | 4 | Source drawer and claims check; the risk is human error, not the method. |
| Relevance | 5 | Matches the challenge's own example (ghost-rover map) and uses its NASA resource (NSSDCA). |
| Presentation | 5 | The map plus the resolve gives a clear 30 s hero. |

---

## B.2 Direction S-B: "The Long Orbit — postcards from the machines still going"

**Concept.** A deep-space wing built on live-ish ephemerides. Pioneer 10, Pioneer 11, Voyager 1 and Voyager 2 are placed on a dithered orbit diagram from JPL Horizons. Each has a human-written postcard. The app shows the one-way light time to each spacecraft. A birthday slider shows where it was on the reader's birth date. Gemini captions the public-domain plaque and spacecraft images. Jev chooses which postcard comes next.

**Requirements it meets.**
- "at least one deep-space object" and the summary's "Moon, Mars, and deep space" — this direction is the deep-space answer.
- "showing your audience how these missions operated" — the light-time counter shows the engineering constraint (a message takes a day to arrive).
- "Accuracy is important" — the numbers are computed from a cited ephemeris, not written by hand.
- "How accessible" — text-first; the orbit diagram has a table alternative.
- Team constraint: the postcards are human-written; AI only captions and chooses.

**Why it is safer on accuracy than S-A:** the distances come from a single JPL source, and the code (not a model) computes every number.

### B.2.1 Data pipeline (S-B)

| Step | Source / endpoint | Subset | Auth | Licence / credit | Status |
|---|---|---|---|---|---|
| 1. Positions and distances | JPL Horizons `https://ssd.jpl.nasa.gov/api/horizons.api` with `COMMAND='-31'` (Voyager 1), observer, centre `500@399`, `EPHEM_TYPE='OBSERVER'`, `QUANTITIES='20'` | One value per day for the birthday slider (cache at build) | none | JPL/NASA public domain; credit JPL Horizons | **VERIFIED**: 200; 173.067682711 AU on 2026-11-14 (matches ds4). Sample: `samples/horizons_voyager1_2026-11-14.txt` |
| 2. Other spacecraft | Same API with -23 (Pioneer 10), -24 (Pioneer 11), -32 (Voyager 2) | As above | none | as above | IDs **VERIFIED (ds4)**; re-run **UNTESTED** |
| 3. Light time | Code: one-way light time = distance (AU) × 499.005 s/AU | Per spacecraft, per date | n/a | n/a | INFERRED: 173.07 AU ≈ 86,360 s ≈ 24 h one-way |
| 4. Facts | NASA mission pages (`science.nasa.gov/mission/pioneer-10/`, Voyager pages) and NSSDCA | Launch, status, instruments | none | NASA public domain | **VERIFIED (ds4)** for Pioneer 10/11 pages; Voyager pages **UNTESTED** |
| 5. Images | images.nasa.gov API search for "Pioneer plaque" / "Voyager Golden Record" (query not yet run). Plaques and spacecraft renders are typically NASA public domain; check each item's rights note. | 1 image per spacecraft | none | NASA media guidelines | **UNTESTED** (query not run) |
| 6. Captions (AI) | Gemini 4 Hydrogen, one call per image | JSON (§B.2.4) | Gemini key | disclose | **Plan**; latency UNTESTED |
| 7. Choice | Jev (optional, D3) | §B.2.3 | Jev key | per TypeSafe terms | UNTESTED access |

**Scope note.** Kepler, Dawn and NEAR Shoemaker appear in ds4 as deep-space or small-body entries. They are not heliocentric probes, so they are not in S-B's orbit diagram. Include them as plates only if time allows. Horizons was not tested for them.

**Fallback:** if Horizons is slow or down, use the cached values in `samples/horizons_voyager1_2026-11-14.txt` and precompute a 365-day table at build time.

### B.2.2 Architecture (S-B)

- **Frontend:** static site. Orbit diagram in SVG (log scale for distance, with a table alternative for screen readers). Postcards as text. Birthday slider as an input with a date picker.
- **Backend:** none. `ephemeris.json` (daily distances per spacecraft, from Horizons) and `postcards.json` (human-written) built offline.
- **Where each piece sits:**
  - **Code:** distances, light time, the orbit diagram, the slider, the table alternative.
  - **Human:** postcards, one per spacecraft, each with a single engineering detail and a source line.
  - **Gemini (authoring only):** captions for the images.
  - **Jev (optional):** chooses which postcard comes next, based on the reader's interest.
- **Cost and latency.** About 4 Gemini caption calls ≈ $0.03; Jev ~$0.0001 per call (JUDGMENT). Latency UNTESTED.

### B.2.3 Jev question schema (S-B)

```json
{
  "model": "jev-latest",
  "state": {
    "reader_interest": ["engineering", "distance"],
    "reader_birth_year": 2014,
    "spacecraft_seen": ["voyager_1"],
    "light_time_hours_voyager_1": 24.0,
    "reading_level": "grade 6"
  },
  "questions": {
    "next_postcard": {
      "type": "choice",
      "instructions": "Which human-written postcard should the reader see next?",
      "criteria": {
        "pioneer_10": "The first probe past the asteroid belt; plaque and early engineering",
        "pioneer_11": "The sister probe; the same route, a different instrument set",
        "voyager_1": "The farthest human-made object; the light-time story",
        "voyager_2": "The only probe to visit all four giant planets"
      }
    },
    "wonder_vs_tech": {
      "type": "score",
      "instructions": "Should the next postcard lean toward wonder or toward the engineering?",
      "criteria": ["wonder", "balanced", "engineering"]
    }
  }
}
```

Code rule: `next_postcard` only with confidence ≥ 0.7; otherwise the default order. Light times and distances are computed by code, never by Jev.

### B.2.4 Gemini JSON schema (S-B; captions only)

Same shape as §B.1.4, with `still_id` set to the image's `nasa_id` and `caption` capped at 240 characters. One addition for plaques:

```json
{ "legible_text": ["(exact text read from the plaque, verbatim)"], "uncertain": ["(anything the model cannot read)"] }
```

The human checks the plaque text against the NASA source. The model is not allowed to "interpret" the plaque.

### B.2.5 Dither UI — three screens (S-B)

Tokens as in §A.1.5. Dither: Bayer 4×4 for the starfield (decorative, `alt=""`), Atkinson for the spacecraft images.

1. **Orbit diagram.** Sun at centre (a single dither dot). Four spacecraft as markers on rays, each marker a Bayer-dithered square. Labels are crisp mono text: name, AU, one-way light time in hours. A visible "table view" toggle below the diagram.
2. **Postcard.** Dither starfield at 20% density behind a text card. A human-written postcard (60–80 words), a plaque or spacecraft image (Atkinson) with its alt text, a light-time counter ("this message is 24 h old by the time it arrives" for Voyager 1, computed by code), and a source line.
3. **Birthday slider.** A date input (your birth date). The orbit diagram re-draws with each spacecraft's distance on that date. A line of text: "On [date], Voyager 1 was 17x.xx AU from the Sun." All numbers from `ephemeris.json`; none are typed by hand.

**Hero moment (0:16–0:24).** The birthday slider: a judge types their birth year, and the diagram redraws; the distances shift and the light-time counter updates in the same frame. The dither starfield thins as the spacecraft recedes.

### B.2.6 30-second storyboard (S-B)

| Time | Shot | On screen | Audio |
|---|---|---|---|
| 0:00–0:04 | Dither starfield. Title "The Long Orbit". | Title. | Silence. |
| 0:04–0:10 | Orbit diagram. Four markers appear. | AU and light-time labels. | Silence. |
| 0:10–0:16 | Click Voyager 1; postcard appears. | Postcard, source line. | Silence. |
| 0:16–0:24 | **Hero.** Birthday slider: type a year; diagram redraws; light time updates. | "On [date], Voyager 1 was …" | Silence. |
| 0:24–0:30 | Table view toggle; source line; end card. | Table, AI disclosure line. | — |

(No audio in this storyboard by design; the text carries the story. A narrated version would need D4 option (b), which the brief does not allow for storytelling.)

### B.2.7 Risks and pre-mortem (S-B)

- **R1 Relevance judged against the title.** The title says Moon and Mars; this direction is deep space. Mitigation: state in the submission that it is the deep-space wing of a multi-object story, and combine it with S-A's Moon plates if the team chooses both.
- **R2 Horizons queries for dates are slow or rate-limited.** Mitigation: precompute the daily table at build.
- **R3 "Feels like a planetarium."** Mitigation: postcards carry the human story; the light-time detail is the engineering hook.
- **R4 Fewer images.** Mitigation: text-first is acceptable; the orbit diagram carries the visuals.
- **Pre-mortem: why this lost.** "It was accurate and cold. The distances were right, and the birthday slider was clever, but the judges wanted a rover or a lander they could picture. The story was 'it's far away', and the Moon and Mars entries were more emotional."

### B.2.8 Scores (JUDGMENT, 1–5)

| Criterion | Score | Why |
|---|---|---|
| Impact | 4 | The light-time and birthday hooks are memorable; less emotional for kids than a rover. |
| Creativity | 4 | A birthday-distance slider with light time is an unusual frame for this challenge. |
| Validity | 5 | Numbers come from one cited JPL source and are computed in code. |
| Relevance | 4 | Covers the deep-space part of the brief; title and summary mismatch is a risk. |
| Presentation | 3 | The slider is good live; a 30 s video of text cards and a diagram is weaker. |

---

# Part C: Shared build plan (both challenges; one team)

**Assumption (change it if wrong).** Kickoff K = Sat 14 Nov 2026, 12:00 local. Deadline = K + 36 h (Sun 15 Nov 23:59 local). Cut-lines: **T-12h = K + 24 h (Sun 11:59 local)** and **T-4h = K + 32 h (Sun 19:59 local)**. If the team's kickoff differs, shift these lines to match.

**Roles.** D = data (fetch, parse, features). A = AI/ML (Gemini captions, Jev wiring, the no-model path). F = frontend. S = story/design (writing, dither, the demo). In a 3-person team, one person covers two roles.

### C.1 Hour by hour

| Hour | D (data) | A (AI) | F (frontend) | S (story/design) | Gate |
|---|---|---|---|---|---|
| H0–1 | Confirm the chosen challenge and direction. The §0 samples are already fetched. Re-check SVS frame-set URLs for 5313 / 3912 / 4950 (or S-A's LROC ZIP). | Get keys: Gemini AI Studio, TypeSafe (Jev waitlist). Measure one Gemini call's latency (UNTESTED). | Scaffold the app (static). Choose the stack. | Write the 30 s storyboard for the chosen direction (§A.1.6 or §B.1.6 or §A.2.5 or §B.2.6). Write the age band (D5). | Keys in hand; storyboard agreed. |
| H1–3 | Frame sets downloaded; 960×540 downscale; 16 frames per track (J) or LROC shapefile parsed + 8–12 IDs (S-A) or Horizons daily table (S-B). | Gemini caption prompt and JSON schema tested on 3 images; keep the output schema. | Dither canvas (Bayer and Atkinson) on one still; reduced-motion switch. | Draft 3 story beats or 1 postcard by hand. Find the NSSDCA facts for each object. | **Go/no-go on data.** If the frame sets or the LROC ZIP fail, use the fallback in §0. |
| H3–6 | `features.json` (J) or `artifacts.json` (S-A) or `ephemeris.json` (S-B). Reproducibility test: hash of `notes.json` on frame 0 (J). | Gemini captions for all MVP images, human-checked. Jev access test (or D3 fallback). | Record shelf / map / orbit diagram (home screen). | Write all MVP story beats or postcards in full. Second human checks every number and quote. | Data is frozen for the MVP. |
| H6–9 | Mapping card → `notes.json` (J) / source drawer data (S-A) / light-time code (S-B). | Jev decision log (precomputed, or live if D3 passes). Gemini alt text into the app. | Playback (J) / plate and tabs (S-A) / slider (S-B). | Write the source drawer rows; licence column; AI disclosure text (§C.3). | Mapping card or source drawer works on one item end to end. |
| H9–12 | Tone.js playback (J) / claims check (S-A). | Jev choice wired to the one allowed UI control (J: foreground; S-A: next beat). | Dither hero moment built. Keyboard map. | Hero moment storyboard frame by frame. Draft the 7-slide outline. | **Hero moment works in the browser.** |
| H12–16 | Remaining tracks or artifacts (J: 3rd track; S-A: up to 8). | Lyria clip (optional, J only) or nothing. | Screen-reader pass; ARIA live regions. | Credits and watermark check (§C.2). | Feature freeze at H16 for anything not on the storyboard. |
| H16–20 | Fix data errors found in review. | Re-run the captions only where a human flagged an error. | Responsive layout at phone width; no horizontal scroll. | Write the Use of AI section. | — |
| H20–23 | Freeze data. | Freeze AI outputs. | Bug list only. | Record the demo footage (screen capture). | — |
| **H24 = T-12h (cut-line 1)** | — | — | — | — | **Drop:** Lyria; 3rd J track (keep 2); S-A artifacts above 8 (keep 8); S-B's Horizons live birthday slider (keep precomputed); any TTS or AI voice; Jev live (keep precomputed). Keep the hero moment and the storyboard. |
| H24–28 | Final data check against the sources (licence column). | — | Fix layout and keyboard map. | Edit the 30 s video. | — |
| H28–32 | — | — | Accessibility check (keyboard only; screen reader on at least one screen). | 7-slide deck draft. | — |
| **H32 = T-4h (cut-line 2)** | — | — | — | — | **Code freeze.** Only crash and factual fixes. No new AI calls. The video is final or it is cut to the version that exists. |
| H32–35 | — | — | — | Submit the 7-slide deck (or the 30 s video). Submit the project page with the Use of AI section and credits. | — |
| H35–36 | — | — | — | Buffer. | Submit before 23:59 local. |

**What the cut-lines mean.** At T-12h the team stops building and starts polishing. At T-4h the team stops changing the product and only records and submits. A feature not in the storyboard by T-12h is cut.

### C.2 Attribution and compliance list (shared)

Each row: the source, its licence or terms, the required credit, and the check.

**Data and media**

| Item | Licence / terms | Credit to show | Check before submit |
|---|---|---|---|
| SVS / EIC visualizations (5313, 3912, 4950; S-A/S-B none) | NASA/GSFC SVS; NASA media guidelines; some EIC videos embed licensed music (14696, 14568 per ds4) | "Visualization: NASA's Scientific Visualization Studio" + producer name from the page | Use frame sets/PNGs only; confirm each page's credits; never use a produced soundtrack |
| NASA Image and Video Library (images.nasa.gov) | NASA media guidelines; third-party items marked | "Image: NASA/[centre]" or the item's own credit | Check each item's rights note; drop items marked with third-party copyright |
| LROC PDS products (S-A) | Public domain (PDS) | "Image: NASA/GSFC/Arizona State University" | PDS only. **Exclude LROC website images** (copyrighted) |
| LROC shapefile (S-A) | Public domain (PDS / LROC) | Cite the LROC README citation (Wagner et al. 2017 per ds4 — verify the exact citation in the README) | Cite the record date (updated 2026-08-14) |
| HiRISE (S-A, optional) | Public domain | "Image: NASA/JPL/University of Arizona" | Check credit line on the HiRISE page |
| NSSDCA records (S-A) | NASA public domain | "Source: NSSDCA, [record URL]" | Cite each record |
| JPL Horizons (S-B) | NASA/JPL public domain | "Ephemeris: JPL Horizons" | Cite the query parameters in the footer |
| GIBS (J stretch; backdrop) | ESDIS content generally not copyrighted; attribution requested | "We acknowledge the use of imagery provided by services from NASA's Global Imagery Browse Services (GIBS), part of NASA's Earth Science Data and Information System (ESDIS)." | Only if used on screen |
| Apollo audio / NASA Historical Sounds (optional) | NASA audio; check collection notes | "Audio: NASA" | Short clips only; do not use third-party synchronised Apollo footage |
| Wikipedia (cross-check only) | CC BY-SA 4.0 | Attribute if any text is reused | Prefer NASA pages |
| azmth Mars dataset (THIRD-PARTY) | CC BY 4.0 per site | Attribute | Verify each row against NASA; not used in MVP plan |

**Software and models**

| Item | Licence | Use | Note |
|---|---|---|---|
| Tone.js | MIT | J-A, J-B audio | Credit in the page footer |
| Web Audio API / Web Speech (browser) | W3C standard / browser | J-B audio; screen reader | not AI |
| canvas-dither | MIT | Dither (optional) | — |
| @thi.ng/pixel-dither | Apache-2.0 | Dither (optional) | — |
| ditherjs | CC BY-SA 4.0 | **Do not use** (share-alike) | ds4 §1.8 |
| ffmpeg | LGPL build (no GPL codecs) | frame extraction (offline) | Use an LGPL build |
| OpenCV / Pillow | Apache-2.0 / HPND | feature extraction (offline) | — |
| MapLibre / Leaflet | BSD-3 / BSD-2 | S-A map (only if a basemap is licensed) | Plan uses a code-drawn grid (no dependency) |
| OpenPlanetaryMap basemap | **UNVERIFIED** | not used in plan | Check licence before use |
| Fonts (JetBrains Mono, Inter) | OFL (verify on the font's page) | UI | Confirm licence at the download page |
| Gemini 4 Hydrogen (Google) | Gemini API Additional Terms; **18+** age terms | Authoring-time captions only | D2 decision; text output; disclose |
| Gemini 3.8 Flash TTS | Gemini API terms; 18+ | **Not used** (D4) | — |
| Lyria 3.5 / RealTime (Google) | Gemini API terms; SynthID | J-A optional bed only | Label "AI-generated music — not data" and disclose in metadata |
| Jev (TypeSafe AI) | TypeSafe terms (**UNVERIFIED** for child-facing use) | Optional decisions | Precomputed by default |

**AI-use disclosure (draft text, for the project page; edit to match what was used).**

> "We used AI tools in three limited ways. Gemini 4 Hydrogen wrote draft alt text for images; a human checked every caption against the source. Jev (TypeSafe AI) chose the order of human-written beats [or: which of three sonification layers to foreground]; code made all factual and numerical output. [Optional: Lyria 3.5 generated one background music clip, labelled as AI-generated and not data.] No AI wrote the stories, the facts, the quiz questions or the sonification mapping. Every AI-generated output is labelled."

**Watermark plan.** AI-generated still images: none planned (both directions use NASA stills and frames). If an AI image is added, it carries a visible corner label naming the tool ("AI-generated with [tool]"). AI audio (Lyria, if used): visible label in the player and an audio metadata tag. AI text (alt text, captions): disclosed in the page footer and in each caption's metadata field (`"source": "gemini-4-hydrogen, reviewed by [initials]"`). Watermark text must name the actual tool (the ds4 example text names Claude; use the team's real tools).

**No-NASA-logo check (run before submit).**
- [ ] No NASA insignia (blue "meatball"), logotype (red "worm") or seal in the UI, the favicon, the Open Graph image, the video or any AI output.
- [ ] Gemini captions have `nasa_logo_visible` = false for every item used; any true → remove that item.
- [ ] Mission patches in photos are allowed only if unaltered and part of a historical photo; do not use them as app icons.
- [ ] The accent colour is not NASA red (`#E8A33D` in the plan).
- [ ] NASA is named in credits as text and links, not as a logo.
- [ ] No endorsement claim: no line implies NASA endorses the project.

**Other compliance**
- [ ] At least one challenge-listed NASA resource is used and linked (SVS/EIC for J; NSSDCA for S-A/S-B).
- [ ] Demo is 30 s video or 7 slides (ds4 §3.3, from the Space Apps FAQ; re-check the official guide).
- [ ] Under-18 team members: parental registration; no photos or voices of under-18s in the submission.
- [ ] No cloned voices of real people (D4 is "none").
- [ ] Every factual line in S-A has a source; "Imagined" text is labelled and separated.
- [ ] Captions and alt text exist for every image; transcripts for any audio.

---

## 2. Cross-direction comparison

| | J-A Literal Liner Notes | J-B Listen to the Planet | S-A Still Here (Moon-first) | S-B The Long Orbit (deep space) |
|---|---|---|---|---|
| Challenge | Jukebox | Jukebox | Storytelling | Storytelling |
| Core deterministic output | notes from the mapping card | notes + region solo | sourced plates + map | distances + light time (code) |
| Gemini role | alt text (authoring) | scene descriptions (authoring) | alt text / captions (authoring) | captions (authoring) |
| Jev role | optional foreground choice | optional suggestion | next beat (human-written) | next postcard (human-written) |
| AI voice | none | none | none | none |
| AI music | optional, labelled | none | none | none |
| Accessibility | secondary (audio-only toggle) | primary | good (alt text, keyboard) | text-first |
| Main risk | "pretty player, unclear mapping" | "no picture for judges" | factual error | "cold; title mismatch" |
| Verified data today | SVS page HEAD; GIBS tile 200 | SVS page HEAD | images.nasa.gov 89 hits; LROC redirect; NSSDC; HiRISE | Horizons 200, Voyager 1 173.07 AU |

## 3. Open questions for the team (hour 1)

1. Which challenge? (The verdict's ranking favours Jukebox; the storytelling challenge had one vote.)
2. D2: is authoring-time Gemini use acceptable under the 18+ terms, or do we go with human alt text only?
3. D3: is Jev live access available, and if not, is precomputed use acceptable for the demo?
4. Storytelling age band (D5): 9–12 or 11–14?
5. Do we have a blind or low-vision tester by hour 6? If not, the submission says so.
6. Which Moon object plates for S-A (8–12)? The team picks from the 71 LROC records.
7. Kickoff time: does K = Sat 12:00 local hold? If not, shift the cut-lines in §C.1.

## 4. Files written

- `research/plans/plan-jukebox-storytelling.md` (this file)
- `research/plans/samples/gibs_wmts_epsg4326_modis_terra_truecolor_z1.jpg` (GIBS tile, 512×512 JPEG, VERIFIED)
- `research/plans/samples/images_api_surveyor3.json` (images.nasa.gov, VERIFIED)
- `research/plans/samples/images_api_lunar_module.json` (images.nasa.gov, VERIFIED)
- `research/plans/samples/horizons_voyager1_2026-11-14.txt` (JPL Horizons, VERIFIED)
- `research/plans/samples/jukebox-storytelling-fetch-log.json` (all tests, status per item)
