# Plan: Lunar Landing Site Navigator + Earth Analogs for Moon/Mars Bases

Planning wave 3, assignment "Claude Haiku 5.5 #2". Research and plan only. The human team picks; AI did not originate these directions.
Deadline: **Sun 15 Nov 2026, 11:59 p.m. local**. Verified on 14 Nov 2026 (about 42 h of build time from the time of writing).

Sources read: `research/plans/PLAN_BRIEF.md`, `research/debate/VERDICT.md`, `research/findings/ds2-moon-mars-mapping.md` (sections 1, 2, 5, 6, 0), `research/challenges/lunar-landing-site-navigator.md`, `research/challenges/permanent-moon-base-locations-and-mars.md`, and the disputes in `research/debate/r1-beam.md`, `r1-gpt.md`, `r1-grok.md`, `r1-kimi.md`, `r1-sonnet.md`, `r1-gemini.md`.
Not read in full: `ds5-data-resource-audit.md` and `gpt-a-ai-tech-design-rules.md` (named in the brief). Licence facts below come from ds2 and my own test fetches. Re-check them against ds5 before submission.

Sample fetches: `research/plans/samples/` (small files only).

---

## 0. Verified data checks (what I actually ran, 14 Nov 2026)

| # | Endpoint | Test | Result | Use |
|---|---|---|---|---|
| V1 | `https://ssd.jpl.nasa.gov/api/horizons.api` (JPL Horizons, Sun COMMAND='10', CENTER='coord@301', SITE_COORD='0,-89.9,0', 2026-12-01 00:00–06:00 UT, 1 h, QUANTITIES='4', CSV) | HTTP 200. Table present. Atmospheric refraction = NO. | Sun az 280.061 → 277.021°, el **1.4876 → 1.4810°** (matches ds2). Saved: `samples/horizons_sun_sample.txt` | Sun track |
| V2 | Same API, COMMAND='399' (Earth), 00:00–03:00 UT | HTTP 200. | Earth az 6.669 → 6.716°, el **−1.5109 → −1.7018°** (below horizon: DTE blackout). Saved: `samples/horizons_earth_sample.txt` | Earth track; the hero fact |
| V3 | Lunaserv WMS `https://wms.im-ldi.com/` GetCapabilities | HTTP 200, 640 KB. Lists `luna_illumination`, `luna_polar_illumination`, `luna_polar_illumination_pct`, `mars_illumination`. Saved: `samples/lunaserv_caps.xml` | Layer names confirmed | Illumination layer |
| V4 | Lunaserv GetMap `LAYERS=luna_illumination`, `TIME=2026-12-01T00:00:00`, 512×256 PNG | HTTP 200, PNG 94 KB. Saved: `samples/lunaserv_illum_2026-12-01.png` | Works, no key | Illumination map |
| V5 | Moon Trek WMTS tile `trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/...` | HTTP 200, JPEG 49 KB. Saved: `samples/trek_wac_tile_sample.jpg` | Base map |
| V6 | USGS STAC `https://stac.astrogeology.usgs.gov/api/collections` | HTTP 200, 18 collections incl. `lunar_orbiter_laser_altimeter`. LOLA collection licence **CC0-1.0** (checked in the collection JSON). | Open LOLA shots and DTMs |
| V7 | NASA GIBS WMTS tile `gibs.earthdata.nasa.gov/.../MODIS_Terra_CorrectedReflectance_TrueColor/default/2024-06-01/250m/0/0/0.jpg` | HTTP 200, JPEG 54 KB. Caps XML is 5.3 MB, so do not fetch caps in the app. | Earth imagery, no key |
| V8 | NASA POWER `power.larc.nasa.gov/api/temporal/monthly/point` (Atacama, 2020, T2M + ALLSKY_SFC_SW_DWN) | HTTP 200, JSON 1 KB. Saved: `samples/power_atacama_2020.json` | Earth climate, no key |
| V9 | USGS TADP `tadp.astrogeology.usgs.gov` | HTTP 200 | Analog archive (not a similarity engine) |
| V10 | NASA Planetary Analog Explorer `science.nasa.gov/solar-system/analog-explorer/` | HTTP 200 | Prior art / UX reference |
| V11 | USGS PAAD DOI page `usgs.gov/data/paad-planetary-aeolian-analog-database` | **HTTP 403** from curl | **Not verified.** Use the fallback in §2. |
| V12 | ScienceBase (`sciencebase.gov/catalog/...`) | **HTTP 403** (Cloudflare challenge) | **Not verified.** The USGS LGRS grid (Artemis) and Known Sites layers are unconfirmed via this route. |
| V13 | Known Sites DOI `doi.org/10.5066/P9J72921` | HTTP 302 (redirect; target not followed) | Unverified data content |

Not verified by me, only by ds2 or the debate: Artemis 2024 candidate names (NASA release); LGRS grid CC0 licence; LOLA polar DEM sizes (5 m polar 3.68 GB); Diviner PRP size (604.8 MB); the Artemis III 2027 LEO status (NASA pages, read 14 Nov per grok). Re-check the Artemis status page before the deck is final.

---

## 1. Lunar Landing Site Navigator

### 1.1 Challenge requirements (quoted)

- "compare landing sites and dates quickly, visualizing Sun and Earth positions relative to the horizon to assess power generation potential and direct-to-Earth communication windows."
- "Interactive site selection and comparison … curated list … such as past Apollo missions, future CLPS mission targets … as well as … custom lunar coordinates … side-by-side or sequential comparison."
- "Date and time flexibility … how mission schedule adjustments affect feasibility."
- "Power and communication assessment … solar elevation angle … duration of sunlight, and Earth visibility windows."
- "Temporal dynamics: … animations or timeline views."
- "Consider how to handle the Moon's lack of atmosphere when calculating horizon positions." / "Consider accounting for the Moon's actual topography."

### 1.2 Debate position (what the dispute is)

- **Crowded:** about 60 GitHub repos match "lunar landing site" (r1-sonnet). A judge may have seen several. The differentiator is the horizon quality and the 30-second payoff.
- **Terrain is the trap:** a spherical horizon is a teaching baseline, not a terrain-aware south-pole result. Label it as an approximation and do not claim comms feasibility (r1-beam, r1-grok, r1-gpt).
- **Timing:** Artemis III is a 2027 LEO test. The first crewed landing is Artemis IV (2028). Do not title the app "Artemis III site selector". The 2024 nine candidate regions are Artemis III-specific, and NASA has not said whether they carry over (ds2 §2.2a; r1-grok).
- **Gimmick test:** "Sun above horizon?" and "DTE available?" are code predicates. Jev should not decide them (r1-kimi, r1-sonnet D11). Jev is optional, for qualitative items only.

### Direction L1. Sun/Earth Horizon Studio (recommended, from ds2 B1)

**Concept.** Pick two or three sites and one date. See a horizon silhouette per site, the Sun and Earth tracks against it, a sunset and Earthset countdown, and a power and DTE scorecard side by side. Then slide the launch date and watch the windows move. The hero fact is at 0°E, 89.9°S on 2026-12-01: the Sun is about 1.5° up while Earth is about 1.5° below the horizon. That means power is available and DTE is blacked out.

**Satisfies:** site selection and comparison, date flexibility, Sun/Earth relative to the horizon, power and comms metrics, timeline, countdown.

**Pipeline**

1. Sites: curated list (Apollo 11/12/14/15/16/17; the nine 2024 candidate regions named in the NASA release; CLPS/commercial/international targets such as Blue Ghost, IM-1/2, Chang'e 4/5/6, Chandrayaan-3, SLIM; any user lat/lon). Label every point "user-selected point", not "NASA landing site". NASA published names, not official point coordinates.
2. Ephemeris (verified V1, V2): Horizons API, with the params used above. Use `CENTER='coord@301'`, `COORD_TYPE='GEODETIC'`, `SITE_COORD='lon,lat,altkm'`, `QUANTITIES='4'`, `CSV_FORMAT='YES'`. Parse between `$$SOE` and `$$EOE`. Check the payload for an error string: Horizons can return HTTP 200 with an error in the body. Cache the result as JSON. The demo must not call the API live.
3. Terrain horizon: LOLA. Use the STAC LOLA collection (V6, CC0) or the Moon Trek/Lunaserv terrain for quick cuts. Full polar DEMs are too big for 48 h: 5 m at 87.5°S is 3.68 GB, 10 m at 85°S is 3.68 GB. **Fallback (default):** a spherical horizon with lunar radius 1737.4 km, plus a precomputed terrain mask for **three** south-pole points only, labelled "LOLA-derived, planning grade". Show a spherical control beside it. Untested: GDAL `/vsicurl` range reads of the PDS `.img` tiles. Only attempt if hour 6 has slack.
4. Illumination map (verified V4): Lunaserv `luna_illumination` WMS, `TIME=` param, 1.1.1, no key. Use it for the background map, not for the numbers.
5. Power: solar constant about 1361 W/m² × sin(elevation) with a user derate. Show margin, not just watts. Label it "planning model".
6. Comms: DTE when the Earth disk (angular radius about 0.95°, so include it) clears the horizon. Report window length, next Earthset, total DTE minutes. Do not invent a link budget. Relay (NRHO/LLO) is a note only.
7. Thermal context (optional): Diviner polar temperatures (listing only, verified via ds2). Do not download the 604.8 MB PRP table in the build window.
8. Gemini writes the caption from the numbers only. Jev is optional (see architecture).

**Test case for judges (replicable):** Horizons sample V1/V2 above. A judge can recompute it in 2 minutes. This is the "three numbers a judge can recompute" from r1-grok.

**Fallback if the Horizons fetch fails:** ship the JSON cache from V1/V2 (two sites, one date). If Horizons is down all day, use the saved samples in `research/plans/samples/`.

### Direction L2. Mission Window Matrix (from ds2 B2)

**Concept.** A heat-map of sites × launch dates. Each cell is "Sun up + Earth up" for the chosen window. Slide the date and watch the viable windows shift. This is the planner's tool for a launch slip.

**Satisfies:** rapid comparison across many site-date pairs, date flexibility, temporal dynamics. Weakest on terrain unless L1's masks exist.

**Pipeline:** same Horizons cache (sites × 12 monthly dates × 1 day hourly). Lunaserv illumination for the cell colours. Decision in code: `sun_up AND earth_up` per hour, then sum. No Jev needed.

**Fallback:** if terrain masks are absent, the matrix uses sphere-only horizons and says so on the legend.

### Direction L3. "Move the Date": educator clock for the public (from r1-beam direction 3)

**Concept.** One big clock and a date slider. The lunar day runs slowly, the Sun's arc rises and sets over days, and Earth sits in and out of the sky. The user sees why a power budget and a comms plan do not line up. It is for the "educators and the public" half of the challenge.

**Satisfies:** accessibility across skill levels, "why small date changes have large impacts", temporal dynamics. Least technical, weakest on "assess power potential" unless the power numbers from L1 are shown.

**Pipeline:** the same Horizons cache, one site, one-day slider. Gemini writes the reading-level text. Gemini is 18+ per the verdict, so the product is not child-facing.

### 1.3 Architecture (applies to L1–L3)

- **Frontend:** static web page (Vite or plain HTML/JS, plus Canvas or SVG for the horizon). Dither applied to the terrain and sky only. Numbers and axes stay crisp.
- **Backend:** none for the demo. A Python script (`scripts/fetch_horizons.py`) writes the JSON cache. Optional small Node proxy only if needed. Static hosting.
- **Where code sits:** all ephemeris parsing, horizon test, power and comms maths are in code. Jev (if used) gets only the qualitative rubric. Gemini gets the numbers and writes words. Gemini never traces the horizon.

**Jev (optional, qualitative only). Question schemas**

```jsonc
// Q1: Score (rubric) on the site's documented science value. Input: cited site description, 200–400 tokens.
{ "type": "score", "id": "science_value",
  "question": "How strong is the scientific case for a landing at this site, based only on the supplied description?",
  "levels": ["none stated", "minor", "moderate", "strong", "exceptional"] }

// Q2: Choice on mission archetype fit. Code applies the user's profile after, not Jev.
{ "type": "choice", "id": "archetype",
  "question": "Which mission archetype does this site suit best, given the supplied site description?",
  "options": ["power-first (CLPS demo)", "comms-first (crew-support)", "science-first (sampling)", "balanced (base-prep)", "unsure"] }

// Q3: Noul hallucination guard on Gemini's caption. Input: caption + the numeric JSON it cites.
{ "type": "noul", "id": "caption_supported",
  "question": "Is every number and claim in the caption supported by the supplied scenario JSON?" }
```

Jev does **not** get: Sun above horizon, slope below 15°, DTE available. Those are code. If the top sites match a transparent weighted sort, drop Jev and show the sort (r1-kimi).

Jev latency and cost (from ds2 §0.1, vendor claim for latency): 70–500 ms per call. $0.042 per 1M input tokens. About $0.00006 per site with 8 rubrics. Negligible.

**Gemini 4 Hydrogen prompt (`gemini-4-hydrogen`) with structured output**

System prompt (exact text to use):
> You write a scenario brief for a lunar landing planner. Use ONLY the numbers in the JSON input. Do not add any number, fact or claim that is not in the input. If a field is null, say "not computed". Never say a site is safe, approved or NASA-selected. Output JSON matching the schema.

Response schema:
```json
{
  "type": "object",
  "required": ["headline", "sun", "earth", "dte_blackout_min", "caveats", "verify_next"],
  "properties": {
    "headline": {"type": "string", "maxLength": 140},
    "sun": {"type": "string", "maxLength": 200},
    "earth": {"type": "string", "maxLength": 200},
    "dte_blackout_min": {"type": ["number", "null"]},
    "caveats": {"type": "array", "items": {"type": "string"}, "maxItems": 4},
    "verify_next": {"type": "array", "items": {"type": "string"}, "maxItems": 3}
  }
}
```

**Cost and latency estimate:** Gemini 4 Hydrogen, about 800 input and 250 output tokens per brief. Pricing per ds2 §0.2. Roughly a few cents at most for the whole demo. Latency is an estimate of 1–3 s per call; **not measured**. Test in hour 1.

### 1.4 Dither UI: screens (L1 recommended)

Shared tokens:
- `--ink: #111111` (horizon, text)
- `--paper: #efeadb` (sky, background)
- `--sun: #e8a300` (amber, Sun track and "power ok")
- `--earth: #3f7fbf` (blue, Earth track). Use with a dither pattern, never as the only cue. Add a dashed line for "below horizon".
- `--alert: #c4412c` (red, "no DTE")
- Dither: 4×4 Bayer, 2 levels, only on terrain fill and sky gradient. Never on digits, ticks, axes or the countdown.
- Type: IBM Plex Mono (OFL) for every number; IBM Plex Sans for labels. Minimum 14 px on the numeric readout.

**Screen 1. Home / hero (the 30-second moment).** Full-width horizon panorama for Site A (spherical or masked, labelled). Sun arc (solid amber) and Earth arc (dashed blue) overlaid. Under the arc: two big numbers, "Sun elevation +1.49°" and "Earth elevation −1.51°". A red chip reads "DTE: none". Caption (Gemini, from JSON): "The Sun is up. Earth is not. Power yes, comms no."

**Screen 2. Two-site compare.** Two columns, each with its horizon panorama and a shared 24 h timeline below. A scrubber at the bottom. Countdown tiles: "time to sunset" and "time to Earthset" in mono type.

**Screen 3. Date slider with the matrix (L2 as a strip).** A horizontal strip of 30 days. Each day is a tile: amber = power, blue = DTE, both = green-dither. Moving the slider updates Screen 2.

**Screen 4. Scorecard.** A table with rows: solar elevation (max, min), sunlit fraction, DTE minutes, next Earthset, model confidence (Jev, optional). A footer line: "Planning model. No atmosphere. Spherical horizon unless marked LOLA. Not for flight decisions."

**Screen 5. Method drawer.** Opens from any screen. Lists source (Horizons, DE441, verified date), horizon method, lunar radius, Earth angular radius, power constant, and uncertainty. This is the Validity screen. Judges will open it.

### 1.5 Build plan (L1 recommended; hours from 14 Nov 05:30 local, deadline T+42 h)

| Hours | Data | ML/AI | Frontend | Story / design | Notes |
|---|---|---|---|---|---|
| 0–2 | Confirm Horizons V1/V2 reproduce; freeze 3 site list | Test Gemini latency and key | Repo, Vite, layout grid | Pick the hero case; write the 30 s script draft | Hour-1 API tests |
| 2–6 | Horizons cache script, 1-hour steps, 1 year, 5 sites | Gemini caption schema tested on 5 cases | Horizon panorama (sphere) + Sun/Earth arcs | Dither palette, type, tokens | |
| 6–10 | LOLA: try 3 precomputed masks; if it fails, skip | Jev Q1 (optional) on 5 site descriptions | Screen 2 two-site compare | Storyboard shot list | Decision point at hour 10: masks yes or no |
| 10–14 | Power/comms maths + tests against V1/V2 | — | Screen 3 date strip | Slide 1–3 draft | |
| 14–18 | Method drawer numbers; validation against Horizons | Gemini briefs (5) | Countdown, scrubber | Screen 4 | |
| 18–24 | Freeze data. Run judge-recompute check | — | Mobile layout pass | Slides 4–7 draft | |
| 24–30 | — | — | Bug pass | Video record: first take | |
| 30–36 | — | — | Polish | Final video, 30 s | |
| 36–40 | Attribution file, AI disclosure | — | Deploy static | Submit draft | |
| 40–42 | — | — | — | Submit | Leave two hours spare |

**Cut-line at T-12 h (Sun 11:59 local):** drop LOLA masks (keep spherical control, labelled); drop Screen 3; use templated text instead of Gemini if the API is slow.
**Cut-line at T-4 h (Sun 19:59):** drop Jev entirely; show the weighted sort; freeze the video from the saved build.

### 1.6 Demo script

**30-second storyboard (L1)**

| Shot | Time | Visual | Audio/caption |
|---|---|---|---|
| 1 | 0–4 s | Black screen, then the Moon's south pole rotating slowly | "Launch day. Which site, which date?" |
| 2 | 4–10 s | Screen 1 hero: horizon, Sun arc up, Earth arc below | "The Sun is up. Earth is not." |
| 3 | 10–16 s | Numbers: +1.49° / −1.51°, red "DTE: none" | "Power yes. Comms no." |
| 4 | 16–22 s | Two-site compare, one site's Earth track rises | "Site B gets Earth at 14:20." |
| 5 | 22–27 s | Date slider moves; strip turns green on the right dates | "Slip the launch two days. Look what changes." |
| 6 | 27–30 s | Title card: "Lunar Landing Site Navigator" + "Planning model. Not for flight." | (silence or one tone) |

**7-slide outline (L1)**
1. Problem: existing tools answer one question at a time. Quote the challenge.
2. The hero fact: Sun up, Earth down, at 0°E 89.9°S on 2026-12-01 (Horizons table).
3. How it works: Horizons ephemeris + horizon test + power/comms maths. Show the pipeline.
4. Compare: two sites, slider, the matrix.
5. Honesty: what is approximate (spherical vs LOLA), what is not modelled (link budget, libration), and the Artemis III/IV status.
6. The method drawer: sources, versions, a judge can recompute.
7. Who uses it: planners, educators, the public. Next steps.

If L2 or L3 is chosen, replace slides 4 and 5 with that direction's screen.

### 1.7 Attribution and compliance (L1)

| Item | Licence / terms | Status |
|---|---|---|
| JPL Horizons API | NASA/JPL public domain (ds2) | Verified: API responded |
| LOLA data (PDS, STAC) | NASA public domain; STAC collection CC0-1.0 | Verified: STAC collection licence |
| Lunaserv WMS | Engine BSD-3-Clause. Imagery is LROC/NASA public domain. Hosted service terms not read. | Verified: WMS responds. **Check hosted terms before any commercial claim.** |
| LROC QuickMap (reference only) | UI ASU/ACT, not open source | Do not copy UI |
| Moon Trek WMTS | NASA public domain | Verified: tile |
| CesiumJS (if 3D) | Apache-2.0 | Not used in the MVP |
| IBM Plex fonts | SIL OFL 1.1 | To check |
| Jev (TypeSafe) | Proprietary API | Disclose |
| Gemini 4 Hydrogen (Google) | Proprietary API | Disclose |

**AI-use disclosure (draft text, use verbatim or edit):**
> Ephemerides are from NASA/JPL Horizons. Illumination maps are from the Lunaserv WMS (LROC data). Horizon and power/communication calculations are open-source code in this repository, written by the team. Google Gemini 4 Hydrogen wrote the one-paragraph captions from computed numbers. [If used: TypeSafe Jev rated a qualitative science-value rubric.] The AI did not originate the idea, the data or the calculations. Model outputs are labelled "model confidence", not scientific validation. Numbers are for planning, not flight decisions.

**Watermark plan:** small text in the footer of every exported image: "Planning model · NASA/JPL Horizons data · not an official NASA product". Dither textures are generated by our code, not taken from NASA imagery.

**No-NASA-logo check:** no NASA meatball, no "NASA-approved", no Artemis logo. "Artemis" appears only in text, and only with the 2027/2028 status line.

### 1.8 Risks, mitigations, pre-mortem (L1)

- **Risk:** the horizon is a sphere presented as terrain. **Mitigation:** the label on the horizon, the spherical control, and the method drawer. **Pre-mortem:** a judge who knows LOLA finds the sphere and reads it as naive.
- **Risk:** the Artemis III/IV framing is wrong. **Mitigation:** the 2027/2028 status line, verified on the day.
- **Risk:** Horizons API is down or rate-limits. **Mitigation:** the JSON cache.
- **Risk:** crowded topic (about 60 repos). **Mitigation:** the hero fact plus the judge recompute. **Pre-mortem:** we looked like the 60 others because the first screen was a sun-angle plot without the Earth track.
- **Risk:** Gemini invents a number. **Mitigation:** the schema, the caption guard (Jev Q3, optional), and "use ONLY the numbers in the JSON".

### 1.9 Scores (L1)

| Criterion | Score | Justification |
|---|---|---|
| Impact | 4 | Directly addresses the challenge's launch-slip problem for planners and educators. |
| Creativity | 3 | Horizon-plus-tracks is strong; the form is familiar. |
| Validity | 3 | Good if the sphere is labelled and Horizons is reproduced. Drops to 2 without the method drawer. |
| Relevance | 5 | Almost every "may consider" bullet is covered. |
| Presentation | 5 | One screen, one hero fact, 30 s. |

Scores for L2 and L3: L2 Impact 4, Creativity 3, Validity 4 (ephemeris-only is clean), Relevance 5, Presentation 4. L3 Impact 3, Creativity 4, Validity 3, Relevance 4, Presentation 5.

---

## 2. Earth analogs for Moon / Mars bases

### 2.1 Challenge requirements (quoted)

- "identify and characterize new terrestrial analogs for future bases or landing sites … then present your findings as a map, visualization, or other tool."
- "Think beyond visual similarity … Use data to explain why your proposed Earth location is a meaningful analogy."
- "Your analog does not need to match the Moon or Mars in every way. Explain which characteristics or processes provide a strong analogy, where the analogy breaks down."
- "Look beyond well-known analog sites" / "Surprise us."
- "Remember Earth's limits as an analog … reduced gravity, the lunar vacuum, the thin Martian atmosphere, or their radiation environments."

### 2.2 Debate position

- **Least crowded:** about 3 recent repos (r1-sonnet). Rubric-shaped brief.
- **Scientific validity of the score:** the risk is a similarity number with no ground truth. Grok (score 4) says an embedding that "discovers" an analog just finds texture. Kimi and Sonnet (8) want a deterministic feature set first, and Jev only on residual judgments.
- **Ground truth:** a planetary scientist or a field-campaign person must check the match/mismatch labels. Gemini adds that local and Indigenous consent and access matter for any field-site recommendation (r1-gemini).
- **Consensus:** make the product a purpose-specific match/mismatch comparison of a few researched sites, not a global discovery engine.

### Direction A1. Analog Atlas: purpose-specific match/mismatch (recommended, from ds2 A1)

**Concept.** Pick one target (Shackleton-area south pole, Jezero, a lava-tube skylight) and one test purpose (thermal, instrument, navigation, ISRU, habitat operations). The tool ranks 5–8 Earth candidates on a short list of measured dimensions, shows the match/mismatch profile, and writes "what this analog can test" and "where it breaks".

**Satisfies:** map or visualization; characterization of sites; explicit similarity and difference; connection to exploration; Earth's limits.

**Pipeline**

1. Earth candidates: hand-curated from TADP (V9), the Analog Explorer gallery (V10), the NASA Astrobiology Field Sites list, and NASA Analog Missions list (ds2). Target 5–8, one per different process. Not Atacama or Haughton as the surprise (the challenge says so), but include one as the control.
2. Measurements per candidate, all from open data:
   - Temperature: NASA POWER monthly T2M (**verified V8**, Atacama 2020 sample). Use monthly min/max, not one average.
   - Surface and terrain: slope and roughness from the candidate's DEM (Copernicus DEM / SRTM via Earthdata; not fetched by me).
   - Surface imagery: GIBS (**verified V7**) for context; no classification.
   - Target side: LOLA (V6) for the Moon; Mars Trek / USGS STAC MOLA/HiRISE DTMs (listed in STAC, not fetched).
3. Shared feature table with units and uncertainty, and a "not measured" flag. Missing data is missing; do not impute.
4. Scoring: per-dimension normalized distance in code (weights shown). Jev only for residual, evidence-anchored items.
5. Output: match/mismatch card per candidate. "Why analogous", "where it breaks", "what you can test here", "what it cannot test" (gravity, vacuum, radiation).

**Fallback:** if PAAD (V11) cannot be fetched, use TADP plus the Analog Explorer list, and cite each candidate to its primary paper or NASA page. Do not say "the USGS database says". If POWER fails, use cached JSON from the saved sample and the candidate list.

**Surprise scenario (A3, optional):** add one lava-tube or aeolian candidate from the process-first list (A3 below) as the "unexpected" card.

### Direction A2. Polar Twins: cold analogs for the lunar south pole and Mars mid-latitudes (from ds2 A2)

**Concept.** Five extreme-cold Earth sites (Antarctic Dry Valleys, Devon Island, Atacama high-altitude, Mauna Kea summit, Svalbard or Iceland) against the lunar south pole and a Mars mid-latitude site. A synchronised two-panel view: temperature, slope, illumination, ice proxy.

**Satisfies:** the "temperature, illumination and environmental extremes" and "water, ice" dimensions. Strong on validity: the data are close to measurable.

**Pipeline:** POWER (verified V8) for Earth T2M and ALLSKY; Lunaserv `luna_polar_illumination_pct` (WMS, not fetched by me; `luna_illumination` verified V4); Diviner polar temperatures (listing only; ds2). Keep the set to 3 Earth sites in the MVP.

**Weakness:** it's cold-only. Rated "narrow" by ds2 and gemini; use as a filter preset inside A1.

### Direction A3. Process Analog Finder: lava tubes and aeolian dunes (from ds2 A3 and r1-sonnet B)

**Concept.** Start from a process, not a place. Show Earth examples that share it: dune fields (USGS PAAD, if accessible), lava-tube skylights, permafrost ice. Each example carries a match/mismatch card.

**Satisfies:** "process as well as place", "surprise us", "caves/lava tubes".

**Pipeline:** the process seed list needs a source. PAAD is blocked from curl (V11). Option: the ds2 PAAD description (45 sites, CC0) is not verified. **Fallback:** a hand-built seed of 6–8 lava-tube and dune sites from TADP and the Analog Explorer, each with a cited primary paper.

**Weakness:** a process seed without a source table is weak Validity. Only build if PAAD or TADP's CSV is confirmed by hour 6.

### 2.3 Architecture (applies to A1–A3)

- **Frontend:** static web page. A 2D map (Leaflet or MapLibre with GIBS/Trek tiles) and a card view. Dither on the Moon/Mars target panel only.
- **Backend:** none. One Python script builds the candidate JSON from POWER, GIBS and any DEM.
- **Where code sits:** all measurements and distance maths in code. Jev answers residual qualitative questions. Gemini reads a paired image set and writes a structured caveat record. Gemini does not classify the images for the score (r1-grok, r1-kimi).

**Jev question schemas (A1, residual only)**

```jsonc
// Q1: Score (rubric) on geology match, from the cited evidence only.
{ "type": "score", "id": "geology_match",
  "question": "Using only the supplied evidence, how closely does the candidate's surface geology match the target's for the stated process?",
  "levels": ["no evidence of match", "weak", "partial", "strong", "near-identical process"] }

// Q2: Choice on test purpose fit.
{ "type": "choice", "id": "fit_for_test_purpose",
  "question": "For which single test purpose is this candidate most useful, based on the supplied evidence?",
  "options": ["thermal", "instrument", "navigation/mobility", "ISRU/ice", "habitat operations", "none supported"] }

// Q3: Noul on counter-evidence.
{ "type": "noul", "id": "analogy_contradicted",
  "question": "Does the supplied counter-evidence contradict the proposed analogy for this test purpose?" }
```

Jev must **not** get the similarity number. It gets the cited evidence and the rubric. The score comes from the code.

**Gemini prompt (paired-image record) with structured output**

System prompt:
> You compare two images: a planetary target tile and an Earth candidate tile. Describe only visible features with image-relative locations. Do not assign a similarity score. Do not claim geology, age or composition that is not visible. List what is not visible or not measured. Output JSON matching the schema.

Response schema:
```json
{
  "type": "object",
  "required": ["visible_matches", "visible_mismatches", "not_visible", "image_notes"],
  "properties": {
    "visible_matches": {"type": "array", "maxItems": 5, "items": {"type": "object", "required": ["feature", "target_xy", "candidate_xy"], "properties": {"feature": {"type": "string"}, "target_xy": {"type": "array", "items": {"type": "number"}, "minItems": 2, "maxItems": 2}, "candidate_xy": {"type": "array", "items": {"type": "number"}, "minItems": 2, "maxItems": 2}}}},
    "visible_mismatches": {"type": "array", "maxItems": 5, "items": {"type": "string"}},
    "not_visible": {"type": "array", "items": {"type": "string"}},
    "image_notes": {"type": "string", "maxLength": 300}
  }
}
```

**Cost and latency estimate:** POWER and GIBS are free. Jev about $0.00006 per candidate (ds2). Gemini 4 Hydrogen: about 2 images plus 400 output tokens per candidate, roughly a few cents for the whole demo. Latency 1–3 s per call, **not measured**.

### 2.4 Dither UI: screens (A1 recommended)

Tokens: same as §1.4 with `--earth-ochre: #b8763a` and `--target: #5b6b7c`. Dither is used on the card's image frame and the Moon/Mars globe only. Numbers, units and the "not measured" flags stay crisp.

**Screen 1. Atlas (home).** Left: a 2D map with the target fixed at the top-left (Moon or Mars layer from Trek WMTS). Right: a ranked list of 5–8 Earth candidates. Each row: name, country, one-line process, and a small match bar that is labelled "profile", not "score".

**Screen 2. Twin card (the hero).** Two dithered tiles side by side: the target (Trek or HiRISE, if chosen) and the candidate (GIBS or Sentinel). Under them, a six-row profile table: temperature range, slope, roughness, illumination, ice or water proxy, dust or wind. Each row has a status chip: matches / partial / breaks / not measured. Below: "Why analogous", "Where it breaks", "What you can test here", "What it cannot test".

**Screen 3. Earth's limits.** A fixed panel listing gravity, vacuum, thin atmosphere, radiation. Each item links to the reason. Always visible in the card.

**Screen 4. Method drawer.** Sources, date fetched, weights, normalization, the "not measured" policy, and the note that the profile is not a probability of analogy.

**Screen 5 (optional). Surprise card.** The A3 unexpected candidate, shown last, with the same six-row profile.

### 2.5 Build plan (A1 recommended; T+42 h)

| Hours | Data | ML/AI | Frontend | Story / design | Notes |
|---|---|---|---|---|---|
| 0–2 | Pick the target and 5–8 candidates from TADP and the Analog Explorer; confirm each citation | Test Gemini latency | Repo, map shell | Choose the target and the surprise candidate | Decide the test purpose list |
| 2–6 | POWER and GIBS pulls for each candidate; a sample DEM for one | Gemini image record on 2 pairs | Atlas list (Screen 1) | Dither tokens | PAAD check at hour 6 |
| 6–10 | Feature table with units and uncertainty; distance in code | Jev Q1–Q3 on 5 candidates (optional) | Twin card (Screen 2) | Storyboard | Decision: Jev in or out, hour 10 |
| 10–16 | Lunar and Mars target side: LOLA or MOLA, Trek layers | Gemini caveat records (all candidates) | Earth's limits panel; method drawer | Slide draft | |
| 16–22 | Expert check (one domain person, if available) | — | Mobile pass | Slides 1–4 | Ask the domain person for corrections |
| 22–30 | Freeze candidates | — | Bug pass | Video first take | |
| 30–36 | — | — | Polish | Final video | |
| 36–40 | Attribution, AI disclosure, consent note | — | Deploy static | Submit draft | |
| 40–42 | — | — | — | Submit | |

**Cut-line at T-12 h:** keep 5 candidates, drop the surprise card, drop Gemini image records (use the text caveats written by hand).
**Cut-line at T-4 h:** drop Jev; show the weighted profile with weights visible; freeze.

### 2.6 Demo script

**30-second storyboard (A1)**

| Shot | Time | Visual | Audio/caption |
|---|---|---|---|
| 1 | 0–4 s | Moon south pole, slow pan | "Where could we test a Moon base?" |
| 2 | 4–10 s | Atlas list: five Earth candidates, one unexpected name at the top | "Not the usual suspects." |
| 3 | 10–18 s | Twin card: target and candidate tiles; profile rows with chips | "Matches in temperature and slope. Breaks in gravity and vacuum." |
| 4 | 18–24 s | The "Earth's limits" panel | "Earth cannot be the Moon. Here is what it can test." |
| 5 | 24–30 s | Title and "Analog profile, not a probability of analogy" | (silence) |

**7-slide outline (A1)**
1. The question: a base needs a test site, and famous analogs are already used (challenge quote).
2. Method: measured dimensions, units, "not measured", why not one score.
3. Atlas: the candidate list and the one surprise.
4. Twin card: the match/mismatch profile for the surprise candidate.
5. Where it breaks: gravity, vacuum, radiation; what cannot be tested there.
6. Validity: sources, method drawer, what a domain expert checked, and what was not checked.
7. Use: which campaign or instrument test this supports; next step.

### 2.7 Attribution and compliance (A1)

| Item | Licence / terms | Status |
|---|---|---|
| NASA POWER | NASA open data; cite as NASA POWER | Verified V8 |
| NASA GIBS / Worldview imagery | NASA imagery CC0 (per ds2); software NOSA 1.3 | Verified V7 (tile). Licence per ds2, not re-read. |
| USGS TADP | USGS public domain / CC0 per dataset; check each | V9 reachable; per-dataset licence unverified |
| NASA Analog Explorer | NASA public domain (ds2) | V10 reachable |
| USGS PAAD | CC0 1.0 (ds2) | **Not verified** (403 via curl) |
| Copernicus DEM / Sentinel | Copernicus open licence; attribution "Copernicus Sentinel data [year]" | Not fetched; needs account |
| LOLA, Trek WMTS, STAC MOLA/HiRISE | NASA public domain; STAC collection CC0 | V6 verified (LOLA collection) |
| Jev (TypeSafe) | Proprietary API | Disclose |
| Gemini 4 Hydrogen (Google) | Proprietary API | Disclose |
| Gemini Embedding 2 | Proprietary (ds2) | **Not used.** The "surprise" search by embedding is rejected (see §2.2). |

**AI-use disclosure (draft text):**
> Earth-side measurements come from NASA POWER and NASA GIBS. Lunar and Martian reference values come from NASA LRO/LOLA and Mars Trek layers, where available. The feature table, units and distances are computed by open-source code in this repository. Google Gemini 4 Hydrogen described visible features in paired images and listed what was not visible. [If used: TypeSafe Jev rated residual questions, with "model confidence" labels.] The AI did not choose the candidate sites, invent the measurements or decide the analogy. A similarity profile is not a probability that a site is a valid analog. Field use requires local expert and rights-holder agreement.

**Watermark plan:** footer on all exports: "Analog profile · NASA/USGS/Copernicus data · not a field recommendation."

**No-NASA-logo check:** no NASA logo; "NASA data" in text only. Do not say "NASA-approved analog".

**Consent and rights note (include on the candidate card):** "Access, permits and local or Indigenous rights are not assessed here." This comes from r1-gemini.

### 2.8 Risks, mitigations, pre-mortem (A1)

- **Risk:** the similarity profile is read as a scientific probability. **Mitigation:** the label "profile, not probability", the "not measured" flag, the method drawer. **Pre-mortem:** a planetary scientist says the weights are arbitrary and the judges agree.
- **Risk:** the candidate is a famous site (Atacama, Haughton). **Mitigation:** the surprise card; a famous site only as a control.
- **Risk:** PAAD and the USGS Known Sites are blocked. **Mitigation:** TADP and the Analog Explorer, each cited to primary sources.
- **Risk:** Gemini calls two images "the same". **Mitigation:** the image-record schema forbids a score and requires "not visible" items.
- **Risk:** no domain expert on the team. **Mitigation:** ask the local event's space-geology or campus contact for 15 minutes on the feature list (hour 16). If no one, say so in the disclosure.

### 2.9 Scores (A1)

| Criterion | Score | Justification |
|---|---|---|
| Impact | 4 | A usable way to choose which field test fits which purpose. Used by mission teams and educators. |
| Creativity | 3 | The match/mismatch card is the differentiator. Surprise candidate adds novelty. |
| Validity | 3 | Good if the features are measured and the weights are shown. Drops to 2 without a domain check. |
| Relevance | 5 | "Surprise us", "where it breaks", "Earth's limits" are all covered. |
| Presentation | 4 | The twin card photographs well. Dither must not obscure the profile. |

Scores for A2: Impact 3, Creativity 3, Validity 4, Relevance 4, Presentation 4. A3: Impact 4, Creativity 5, Validity 3, Relevance 4, Presentation 4 (validity depends on the seed source).

---

## 3. Team decision points (the human team picks)

1. **Lunar:** L1 (horizon studio, recommended) or L2 (matrix)? Recommend L1 with L2 as the second view if time allows.
2. **Lunar terrain:** spherical horizon with a control, or three LOLA masks? Decide at hour 10.
3. **Analog:** A1 (recommended), A2 as presets, or A3 as the surprise card? Recommend A1 with A3 as a single surprise card.
4. **Jev in or out:** for both challenges, Jev is optional. Recommend out unless the team has tested latency and accuracy by hour 10.
5. **Domain expert:** do we have a space-geology or planetary-science person for the analog feature list? If not, the disclosure must say so.

Two items I could not check and the team should re-check before submission: the PAAD/ScienceBase route (403 from curl), and the Artemis III/IV status on NASA's current page.
