# Plan: MODIS/VIIRS Hot Spots + Earth System Trend Detective

Prepared: 2026-11-14 · Author: planning sub-agent (Claude Haiku 5.5 #1) · Deadline: Sun 15 Nov 2026, 11:59 p.m. local
Sources: `research/challenges/modis-and-viirs-hot-spots.md`, `research/challenges/earth-system-trend-detective.md`, `research/findings/ds1-sar-fire-farms.md` (§4, fire), `research/findings/grok-b-flame-trend-spherex.md` (§2, trend), `research/debate/VERDICT.md`, `research/debate/r1-{grok,sonnet,gpt,gemini,beam,kimi}.md`.

**Human decision required.** This plan lists options. It does not pick one. The team chooses one direction per challenge (or one per challenge plus a stretch), then the build plan below applies.

Verification legend: **VERIFIED** = fetched or run today by this agent. **PARTIAL** = page exists, detail unconfirmed. **UNVERIFIED** = not tested; treat as a question. **JUDGMENT** = my opinion.

---

## 0. What I tested today (small fetches only, no bulk downloads)

| Check | Result | Status |
|---|---|---|
| FIRMS area API, no key (`/api/area/csv/DEMO_KEY/...`) | HTTP 400, body `Invalid MAP_KEY.` | VERIFIED: a real key is required; the team must get one (emailed, minutes). I did not have a key. |
| FIRMS data_availability, no key | HTTP 401, `Invalid MAP_KEY.` | VERIFIED. **Errors come back as 4xx here, not HTTP 200** (ds1 said 200; correct that in the build). |
| FIRMS archive readme `download/Readme.txt` | HTTP 200; saved first 60 lines to `research/plans/samples/firms_readme_head.txt` | VERIFIED. Line 50: standard MCD14ML has a ~3-month lag, distributed by FIRMS. |
| Earthdata SNPP / MODIS-VIIRS transition alert page | HTTP 200 | VERIFIED that the page exists; the SNPP end date (2 Nov 2026) comes from ds1 and r1-grok. |
| Giovanni site and user manual | HTTP 200 | VERIFIED |
| Giovanni time-series API `api.giovanni.earthdata.nasa.gov/timeseries`, no token | HTTP 401 `{"message":"Unauthorized"}` | VERIFIED that it needs a bearer token. The point-only behaviour is still **UNVERIFIED** (forum claim). |
| AppEEARS API root | HTTP 200 | VERIFIED |
| PyPI `pymannkendall` | version 1.4.3, license MIT | VERIFIED |
| `pymannkendall` 1.4.3 installed in an isolated venv (scratchpad), synthetic series | `original_test`, `seasonal_test`, `hamed_rao_modification_test` and others all import. A rising, a falling and a weak series gave the expected calls (see §3.2). | VERIFIED locally. Not yet tested on real Giovanni data (needs Earthdata login). |

**Consequence for the plan:** every data path below needs a team-held FIRMS `MAP_KEY` and an Earthdata Login. Neither is blocked, but both must be obtained in hour 1. Precomputed samples are the fallback.

---

## Part A: MODIS/VIIRS Hot Spots

### A.0 Challenge requirements (quoted)

- "build a web application that harmonizes these records into a burning activity calendar based on active fire hotspots"
- "combining the extensive historical series of MODIS with the continuity and greater detail of VIIRS"
- "a user could select a region and a specific date range, then download analytics and visualizations of fire activity"
- "A calendar of burning activity showing the number of hotspots detected from the early 2000s to the present, built on the harmonized hotspots dataset"
- "Historical comparisons, including anomalies against multi-year averages"
- "A downloadable CSV File of hot spots detected during a search"
- "consider using accessible color ramps"
- Audience: "early warning and emergency responders, scientists, land managers, and firefighters"

**Facts that must appear on screen (from the 2026 sensor transition, VERIFIED in ds1 and r1-grok):** Suomi NPP VIIRS science data ceased 2 Nov 2026 (FIRMS stopped new SNPP active-fire data that day). NOAA-20 and NOAA-21 continue. MODIS Terra/Aqua are ending, but sources disagree on dates (Aqua: Aug 2026 with possible extension, late 2026/early 2027, or Sep 2027; Terra: Jan 2027 to Apr 2027). **Show the dates as "source conflict, verify on FIRMS data availability" rather than picking one.**

### A.1 Direction F1 (recommended by the research): "Sensor-Seam Calendar"

**Concept.** A single-AOI burning calendar, 12 months × years 2003–2026, showing the harmonized count and an anomaly against a sensor-specific baseline. The sensor timeline is drawn on the axis, so the user sees where the record changes sensor. Raw counts sit beside the harmonized view. A CSV of every filtered detection and the monthly matrix can be downloaded.

**Why it qualifies.** It meets every must-include item: web app, user-chosen AOI and date range, calendar from early 2000s, anomalies, accessible ramp, CSV download. It shows a method, not only a merge (ds1 hidden hook (b)).

#### Data pipeline (A)

| Step | Source / endpoint | Spatial / temporal subset | Auth | Licence / citation |
|---|---|---|---|---|
| 1. Recent hotspots | FIRMS area API: `https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/{SOURCE}/{W,S,E,N}/{DAY_RANGE}/{DATE}` | bbox only (no polygons); `DAY_RANGE` 1–5 per request | `MAP_KEY` (emailed; 5,000 transactions / 10 min) | NASA open; cite FIRMS and each sensor product. LANCE disclaimer applies. |
| 2. Sources | `MODIS_SP`, `VIIRS_NOAA20_SP`, `VIIRS_NOAA21_SP`, `VIIRS_SNPP_SP` | confirm min/max per source with `/api/data_availability/csv/{MAP_KEY}/{SOURCE}` before the build | `MAP_KEY` | as above |
| 3. Long archive | FIRMS archive download (`firms.modaps.eosdis.nasa.gov/download/`), MCD14ML monthly files (MODIS, C6.1, standard quality) and VIIRS fire_archive files | Pre-clip to the demo AOIs; do not keep global files in the app | Free registration/email link (**PARTIAL**: exact step not tested) | NASA open. Standard quality has a ~3-month lag (VERIFIED in readme). |
| 4. Product definitions | MODIS C6.1 user guide; VNP14IMG/VJ114IMG/VJ214IMG (VIIRS 375 m, V002) | — | — | cite DOIs/user guides |
| 5. Context (optional) | MODIS MCD12Q1 land cover (LP DAAC, Earthdata Login) | 500 m, per AOI | Earthdata Login | NASA open |

**Test-fetch status.** Could not fetch data (no `MAP_KEY` available to this agent). **Hour-1 test for the team:** `curl` the data_availability endpoint for each source with the real key; then pull one 1-day area CSV for a 0.5° box over the demo AOI. Record the row count in `research/plans/samples/`.

**Fallback if the API or key fails:** use the FIRMS archive download (pre-clipped by bbox), or a pre-built CSV of demo AOIs stored in the repo. Do not depend on a live call at judging.

**Harmonization method (recommended: Level 1 + Level 2 + Level 4):**

1. **Filter.** MODIS: confidence ≥ 30 (nominal + high). VIIRS: nominal and high. State both thresholds in the UI. MODIS `type` = 0 (vegetation) only. VIIRS has no `type` field in FIRMS NRT: flag and exclude persistent hot cells (gas flares, volcanoes) using a static mask from the MODIS `type` field in the same cell.
2. **Dedupe.** Within a day, drop VIIRS and MODIS detections whose centres lie within 1 km of each other (same day). A single fire is then counted once, not once per sensor or pixel. Show the dedup count.
3. **Overlap-based correction (optional lens, not the default).** For the overlap window (MODIS and SNPP: 2012–2026; NOAA-20: 2018–2026; NOAA-21: 2024–2026), compute the monthly ratio VIIRS/MODIS per AOI. Apply the inverse to MODIS. Report a bootstrap interval over overlap months. **Caution:** count ratios are scene-dependent; grid-cell ratios are noisy. Keep the correction as a visible, switchable lens.
4. **Anomaly (default calendar).** Compute a month-of-year baseline per sensor epoch (MODIS 2003–2025 when available; VIIRS 2013–2025 / 2019–2025). Show the anomaly as a percentile rank or a robust z-score (median/MAD), not a plain z-score (small counts).
5. **FRP lens.** Sum FRP per month beside counts. FRP is less sensitive to pixel size than counts. Show it as a second panel.
6. **Sensor-seam marker.** Draw a vertical rule at each sensor change (MODIS to SNPP 2012, NOAA-20 2018, NOAA-21 2024, SNPP end 2 Nov 2026, MODIS end date as "source conflict").

**Honest limits to print under the chart:** detections are not burned area or a census of fires; detection probability differs (ds1: ~78% MODIS vs ~88% VIIRS for powerful fires); overpass and diurnal sampling differ; NRT and standard data must not be mixed silently; small counts are noisy.

#### Architecture (A)

- **Frontend:** static SPA (Vite or plain ES modules), Leaflet for the AOI rectangle (pick by lat/lon and bbox), Observable Plot or D3 for the calendar heatmap. Dither applied to the map background only, never to numbers.
- **Backend:** none for the demo. A Python script (pandas or DuckDB) runs once: pull FIRMS, filter, dedupe, aggregate to `aoi/year/month` JSON and CSV, commit to `public/data/`. Live API call is an optional "Refresh" button, guarded by cache.
- **Where things sit:**
  - Code: all aggregation, filters, dedupe, overlap ratio, baseline and anomaly. **Deterministic. No model.**
  - Jev: typed routing only (see schemas below). Never writes a number.
  - Gemini (`gemini-4-hydrogen`): one short briefing per AOI-month, grounded on the computed JSON it receives. It may quote numbers from the input only.

**Jev question schemas** (team-written; "model confidence" only, never a validation):

```
Jev schema A1 — user question router (choice)
  question_text: box (free text, max 240 chars)
  view: choice [
    "calendar_peak_season",     // which months are busiest?
    "year_vs_history",          // how does this year compare?
    "current_month_vs_baseline",// is this month unusual?
    "sensor_check"              // does the record change sensor here?
  ]
  criteria: "Pick the view whose answer the question asks for. If it asks for a cause, pick 'none' and say so."
  (add option "none" → UI shows a 'not supported' card)

Jev schema A2 — caveat applicability (score 1–5, noul-style check)
  question: "Does this month include a sensor change or missing NRT data?"
  input: the computed sensor-mix row (never the raw counts alone)
  output: score 1–5 with confidence
  Use: decides which caveat banner to show. The banner text is fixed, not generated.

Jev schema A3 — driver hypothesis (STRETCH ONLY, hidden without land cover)
  choice: ["agricultural_burn_hypothesis", "wildfire_hypothesis", "land_clearing_hypothesis", "industrial_flare_hypothesis", "unknown"]
  criteria: "Choose only from land cover + season + confidence mix shown. Default 'unknown'. Label as hypothesis."
  Gate: shown only if MCD12Q1 class is available for the AOI.
```

**Gemini prompt (briefing).** Input: the AOI-month JSON from the code (counts by sensor, dedup count, anomaly percentile, FRP median, coverage days, sensor epoch, caveats list). Instruction: "Write three sentences for a fire manager. Quote only numbers present in the input. Name the sensor epoch. Say what the data cannot show. Do not name a cause."

Structured output schema:

```json
{
  "type": "object",
  "required": ["briefing", "evidence", "caveats", "check_locally"],
  "properties": {
    "briefing": {"type": "string", "maxLength": 400},
    "evidence": {
      "type": "array", "maxItems": 4,
      "items": {"type": "object", "required": ["claim","input_field","value"],
        "properties": {"claim":{"type":"string"},"input_field":{"type":"string"},"value":{"type":"number"}}}
    },
    "caveats": {"type": "array", "maxItems": 3, "items": {"type": "string"}},
    "check_locally": {"type": "string", "maxLength": 200}
  }
}
```

A post-check in code rejects any `value` that does not match its `input_field` (exact match). Reject and show the fixed caveat text instead.

**Cost and latency (estimates, not measured; check current AI Studio pricing):** input ≈ 2–4k tokens per AOI-month, output ≈ 300 tokens. Precompute briefings for the demo AOIs (about 26 years × 12 months × 2 AOIs ≈ 624 calls, or only the 24 demo months: ~24 calls). Live latency ≈ 2–5 s per call. **Precompute; do not call at judging.**

#### Dither UI (A): screens

1. **Setup.** Map (AOI rectangle or lat/lon + radius), date range, confidence threshold, sensor toggles. Dither: ordered 2-tone stipple on the basemap only. Type: a grotesk for labels, tabular numerals for counts.
2. **Calendar (hero).** 12 columns (months) × 26 rows (years). Each cell is a square. Fill = harmonized anomaly on a colour-blind-safe diverging ramp (e.g. ColorBrewer `RdBu` or `PuOr`), **with a second channel**: a dither density by count (dot grid), so the state is not only colour. Vertical seam rules at sensor changes. Hairline grid.
3. **Month detail.** Click a cell: counts by sensor (three bars, crisp), dedup count, FRP median, coverage days, anomaly percentile, Gemini briefing (text), caveats list, "check locally" line.
4. **Method panel.** Toggles: raw counts / harmonized / FRP; overlap correction on or off. Shows the parameters and dedupe rule. The "sensor seam" timeline is a horizontal strip with dated markers.
5. **Export.** CSV preview (first 20 rows), download buttons: filtered detections CSV and monthly matrix CSV. Method and citation box.

**Type and tokens:** `--ink #111`, `--paper #F7F5F0`, `--ramp-neg #2166AC`, `--ramp-pos #B2182B`, `--rule #CFCBC2`. Body 16 px. Numerals tabular. Dither must not reduce the contrast of a number below 4.5:1.

**30-second hero moment.** The calendar fills with 26 years of fire seasons in one sweep. The record crosses the vertical seam at 2012 (SNPP starts), 2018 (NOAA-20), 2024 (NOAA-21), and 2026 (SNPP ends). Click a bright 2024 cell: the panel shows "Counts from NOAA-20; overlap-corrected anomaly +2.1 percentile; check locally." Flip to raw counts and the seam becomes obvious. **The message: the app knows the record has a seam.**

#### Build plan (A) — see §C for the combined schedule

Roles: **Data** (FIRMS pull, filter, dedupe, aggregates), **ML/AI** (Jev routes, Gemini briefings, post-check), **Frontend** (map, calendar, panel, CSV), **Story/design** (dither, caveats copy, slides).

#### Demo script (A)

See §D.

#### Attribution and compliance (A)

| Item | Licence / terms | Note |
|---|---|---|
| FIRMS / NASA Earthdata active-fire data (MODIS, VIIRS) | NASA open data | Cite "NASA FIRMS (Fire Information for Resource Management System)" and the product name and version (MCD14ML C6.1, VNP14IMG V002, VJ114IMG/VJ214IMG V002). Keep the LANCE "not for tactical use" disclaimer on screen. |
| MODIS C6.1 user guide | NASA | cite |
| pymannkendall (if used in B only) | MIT | cite doi:10.21105/joss.01556 |
| Leaflet | BSD-2 | cite |
| Observable Plot / D3 | ISC / BSD-3 | cite |
| Gemini 4 Hydrogen | Google API terms; **18+ only** (VERDICT) | no child-facing use |
| Jev | team's TypeSafe stack | record model version |
| **AI disclosure text** | — | "Briefings are drafted by Gemini from numbers computed in code and checked against the input. Routing uses Jev. Model outputs are not validation of fire conditions." |
| **Watermark plan** | Space Apps rule: watermark generated images/video | Put "AI-generated text" label on each Gemini block. Any generated image: visible watermark "AI-generated". |
| **No-NASA-logo check** | NASA logos restricted | Use the words "Data: NASA FIRMS". No NASA insignia, no "NASA-approved" phrasing. Check the final slide and footer. |

#### Risks and mitigations (A)

| Risk | Mitigation |
|---|---|
| FIRMS key delayed or rate-limited (5,000 / 10 min) | Hour-1 key; cache per AOI; precomputed CSVs. |
| NOAA-20/21 standard products lag the API names (**UNVERIFIED**) | Use NRT for the newest months and label it. Check data_availability. |
| Aqua MODIS end date conflicts across sources | Show the conflict on the timeline; do not claim an end date. |
| Harmonized anomaly looks like a rigorous answer when it is a ratio | Show the uncorrected counts beside it; print the limits. |
| Model narrates a cause | Gemini only quotes numbers from input; Jev's driver desk is a stretch and hidden without land cover. |
| Accessible colour ramp fails in greyscale | Second channel: dot density by count. |

#### Pre-mortem (A): why this lost

"The team spent 30 hours on a fire map with a nice calendar and a chatbot. The sensor seam was a footnote. A judge with a fire background asked how the MODIS and VIIRS counts were made comparable, and the answer was a ratio on a few overlap months. The FIRMS key worked only on the laptop, the demo ran on a cached file, and the AI briefing read as confident prose about a cause nobody measured."

#### Directions F2 and F3 (options)

- **F2 "Seam Test" (lens-only, lower build).** Same AOI and calendar, but the hero is three calendars side by side: MODIS-only, VIIRS-only, harmonized. Sliders for confidence and dedupe radius. Story: "a rising trend in raw counts becomes 'no significant change' once the sensor is held fixed." Build cost: low. Validity: high if the sliders are honest. Presentation: strong, but the calendar is the same genre as F1.
- **F3 "Fire-weather fingerprint" (stretch).** F1 plus NASA POWER monthly temperature and precipitation (no auth; VERIFIED in ds1) for the same AOI. Shows whether a high-count month is also hot and dry. Risk: correlations look like causes; present them as co-occurrence only. Build cost: medium. Not recommended for a 36-hour build unless F1 is done by T-12h.

---

## Part B: Earth System Trend Detective

### B.0 Challenge requirements (quoted)

- "create a tool that can select variables measured by Earth science missions or produced by Earth science models, visualize how they change over time, and determine what is changing, where it is changing, how much it is changing, and if these changes are what scientists call 'significant.'"
- "a measured Earth science data variable can trend one way in one region and the opposite way in another"
- "perform a basic statistical analysis of that time series, indicating the rate of change over time, and to test the trend's significance using methods such as a t-test, the Mann-Kendall test, or confidence intervals"
- "Finding a trend is interesting even if it doesn't reach the level of significance."
- "Trends can be non-linear, and some are not evident unless regular cycles, such as the seasonal cycle, are removed"
- "daily and monthly data are likely the easiest to process"
- "providing simple definitions of the variables would help these users considerably"
- Audience: high school and college students, science-literate public.

### B.1 Direction T1 (recommended): "Two-Region Detective"

**Concept.** The user asks one question (or picks from a short menu), the tool proposes one variable and two regions where the same process should show up. It returns a plain-language definition, two monthly series, Sen's slope with a 95% interval, a seasonal Mann-Kendall p-value, and an ordinary least-squares slope with its t-test beside it. The preset shows the same variable with opposite signs in two regions. A second preset is a real trend that fails the test. The sentence "a longer record may be what this needs" is printed from a code flag, not a model.

**Why it qualifies.** It covers every element (variable, region, time series, rate, significance, non-significant trend, opposite signs). It is the most checkable product in the set (grok, r1-grok).

#### Data pipeline (B)

| Step | Source | Subset | Auth | Licence / citation |
|---|---|---|---|---|
| 1. Variable catalogue (~12 variables, team-written) | Giovanni (`giovanni.gsfc.nasa.gov`) menus: MERRA-2 (air temp, precipitation, winds, humidity), GLDAS (soil moisture, evaporation), GPM (precipitation), MODIS/AIRS/OMI as available | Monthly, area-average, 2000–2025 minimum 15 years | Earthdata Login | NASA open. Cite each dataset DOI from its Giovanni export header. |
| 2. Time series CSV | Giovanni web download (CSV) | One AOI box per region; user regions limited to presets for the demo | Earthdata Login (guest mode limited; download needs login, VERIFIED in manual) | as above |
| 3. Alternative | AppEEARS (`appeears.earthdatacloud.nasa.gov`, API root 200 VERIFIED): point or polygon sample, CSV | Samples in MB | Earthdata Login → bearer token (~48 h) | LP DAAC cite |
| 4. Station (stretch) | NOAA CDO (`ncei.noaa.gov/cdo-web`) | one station | free token | NOAA |

**Test-fetch status.** Giovanni home and manual return HTTP 200. The time-series API returns HTTP 401 without a token (VERIFIED). **Not tested:** an authenticated area-average download. **Hour-1 test for the team:** log in, download one monthly CSV (one region, one variable), check for an area-average column and the year range. Record the header in `research/plans/samples/`.

**Fallback:** precompute six Giovanni monthly CSVs (two regions × three variables) and bundle them. The live button is optional. ds1 and grok-b both recommend this; it protects the demo from a login outage.

**Statistics (code, not models):**

```python
import numpy as np, pymannkendall as mk
from scipy import stats

x = monthly_series            # np.array, monthly, no gaps (interpolate ≤2 months, else flag)
t = np.arange(len(x))

seasonal = mk.seasonal_test(x, period=12, alpha=0.05)  # seasonal Mann-Kendall (Hirsch-Slack)
# seasonal.trend in {'increasing','decreasing','no trend'}, seasonal.p, seasonal.slope
#   units: slope appears scaled per cycle (per year when period=12). VERIFIED locally: a 0.02/month
#   synthetic trend gave original_test slope ≈ 0.017/step but seasonal_test slope ≈ 0.22.
#   Check the units once against a known series and label the axis accordingly.

sen = stats.theilslopes(x, t)          # Sen slope + 95% CI (low_slope, high_slope) on the raw series
ols = stats.linregress(t, x)           # OLS slope, p-value (t-test on slope)

hr = mk.hamed_rao_modification_test(x) # autocorrelation-corrected MK (show beside seasonal)
```

**Print under the chart:** seasonal MK removes the regular cycle, not autocorrelation. Autocorrelation can make p-values too small; the Hamed–Rao result is shown beside it. Define significance as p < 0.05 by the stated test.

**Local synthetic check (VERIFIED, 20 years monthly, seasonal + noise):**

| Series | original_test | seasonal_test p | Interpretation |
|---|---|---|---|
| A (+0.02/month) | increasing, p ≈ 0 | increasing, p ≈ 0 | rising, significant |
| B (−0.02/month) | decreasing, p ≈ 0 | decreasing, p ≈ 0 | falling, significant (opposite sign) |
| C (+0.002/month, noise ×2) | no trend, p = 0.84 | no trend, p = 0.29 | real-looking but not significant: the preset for "a longer record may be what this needs" |

Script: `research/plans/samples/mk_synthetic_check.py` (copy of the scratchpad test). Run with `python -I` inside a venv.

#### Architecture (B)

- **Frontend:** static SPA. Two-region map (Leaflet, two rectangles), two line charts (Observable Plot), a stat row (slope, interval, p-value, test name). Dither applied to the map only.
- **Backend:** none for the demo. A Python build step reads the CSVs and writes JSON per preset. Optional Flask endpoint only if a live AppEEARS task is included (stretch).
- **Where things sit:** Code computes every number and p-value. Jev chooses from a fixed catalogue. Gemini writes definitions and captions from **the team's own catalogue text**.

**Jev question schemas** (team-written catalogue of ~12 variables; "model confidence", not significance):

```
Jev schema B1 — variable choice (choice)
  question_text: box (free text, max 240 chars)
  variable: choice [
    "air_temp_2m_monthly",      // "how hot is it"
    "precipitation_monthly",    // "rain / rainfall"
    "soil_moisture_surface",    // "soil wetness" — NOT rainfall
    "evaporation_land",
    "total_column_ozone_or_aerosol",   // catalogue item if available
    ...                          // 12 total
    "none_match"
  ]
  criteria (team-written):
    - "soil moisture is not rainfall"
    - "pick 'none_match' if the question asks about a cause or a forecast"
  Use: decides which catalogue entry loads. The definition text is looked up, not generated.

Jev schema B2 — definition check (noul)
  claim: "The one-line definition matches the dataset's official long name."
  input: { definition_text, dataset_long_name }
  output: yes / no, with confidence
  Use: blocks the card if 'no'.
```

Do **not** ask Jev whether a trend is significant or the slope is positive (grok-b; VERDICT ruling 2).

**Gemini (`gemini-4-hydrogen`) prompt — definition and caption.** Input: variable catalogue entry (official long name, units, sensor), the computed statistics JSON, and the preset's flags (`opposite_sign`, `significant`, `longer_record_flag`). Instruction: "Write one sentence defining the variable for a high-school reader. Write one caption (≤ 40 words) that states the slope, the test and the p-value exactly as given. Do not say the trend is or is not important. Do not invent numbers."

```json
{
  "type": "object",
  "required": ["definition", "caption", "confounder_warning"],
  "properties": {
    "definition": {"type": "string", "maxLength": 200},
    "caption": {"type": "string", "maxLength": 260},
    "confounder_warning": {"type": "string", "maxLength": 200}
  }
}
```

Post-check: every number in `caption` must appear in the input JSON; otherwise show the fixed caption template.

**Cost and latency (estimates):** ~1.5k input tokens and ~150 output tokens per preset. Precompute for all presets. Latency 2–4 s; not needed at judging.

#### Dither UI (B): screens

1. **Ask.** A short question box plus a menu of three presets (opposite signs; real but not significant; seasonal trap). Dither: ordered stipple on the header band only.
2. **Where.** Two rectangles on a basemap, labelled A and B, with their region names. Stippled background; the rectangles stay sharp.
3. **Result (hero).** Two monthly line charts stacked, one per region, crisp vector lines. Each chart shows: raw series (thin), the seasonal-removed trend line (thick), Sen's slope with 95% band (dither fill at low density — the band is a *shape*, not the data). Stat row: slope (units/yr), interval, seasonal MK p-value, Hamed–Rao p-value, OLS p-value. Sign shown by a glyph (▲ ▼) and by a colour pair, never colour alone.
4. **Season stripped.** Three small charts: raw, climatology, remainder. Remainder slope and its p-value. Caption from Gemini (checked).
5. **Definition and export.** One-sentence definition, source citation, CSV download of the two series, method note.

**Type and tokens:** `--ink #111`, `--paper #F7F5F0`, `--up #B45309` (amber), `--down #1D4ED8` (blue), `--rule #CFCBC2`. Dither is decorative on the map and header only. **Numbers, axes and p-values are never dithered.** Colour is never the only sign cue (glyph + text).

**30-second hero moment.** Two lines, one rising and one falling, with the same process label. The stat row reads "p = 0.00 — increasing" and "p = 0.00 — decreasing". Then the third chart: a weak line with "p = 0.29 — not significant. A longer record may be what this needs." The judge sees that the tool is honest about a non-result.

#### Build plan (B) — see §C

#### Demo script (B)

See §D.

#### Attribution and compliance (B)

| Item | Licence / terms | Note |
|---|---|---|
| Giovanni series (MERRA-2, GLDAS, GPM, MODIS, AIRS, OMI as used) | NASA; cite each dataset DOI from the export header | NASA-led products are generally open (ds5 / grok-b); check each product's citation. |
| AppEEARS | NASA/LP DAAC | cite per product |
| NOAA CDO (stretch) | NOAA open data | cite |
| pymannkendall 1.4.3 | MIT | cite doi:10.21105/joss.01556 |
| SciPy | BSD-3 | cite |
| Leaflet, Observable Plot / D3 | BSD-2 / ISC | cite |
| Gemini 4 Hydrogen | Google API terms; 18+ only | |
| Jev | team stack | record version |
| **AI disclosure text** | — | "Definitions and captions were drafted by Gemini from the team's catalogue and checked against the statistics computed in code. Significance tests are computed in code (pymannkendall, SciPy). Not a scientific validation of any trend." |
| **Watermark plan** | Space Apps: watermark generated images/video | Label any generated text block "AI-drafted". No generated images in this direction. |
| **No-NASA-logo check** | NASA logos restricted | Use "Data: NASA Giovanni" in words. No insignia. |

#### Risks and mitigations (B)

| Risk | Mitigation |
|---|---|
| Giovanni login or area-average download fails on stage | Precomputed CSVs for all presets. |
| Giovanni time-series API is point-only (**UNVERIFIED**) | Use the website download for area averages; use the API only for a point, and test in hour 1. |
| Seasonal MK slope units confused (per cycle vs per year) | Checked on synthetic data: the slope is per cycle (period 12 → per year). Label the axis from the code, not by hand. |
| p-value too small due to autocorrelation | Show Hamed–Rao beside seasonal MK; print the caveat. |
| Model announces significance | Jev and Gemini are barred from p-value and significance; code-only test; post-check on captions. |
| Looks like a Giovanni wrapper | The opposite-sign preset and the non-significant preset are the product. Keep both on screen. |
| Two line charts are hard to make dramatic in 30 s | Use the stat row and the sign glyph; cut to the third chart as the payoff. |

#### Pre-mortem (B): why this lost

"The tool was a Giovanni download with a p-value box. The regions were picked by hand. The seasonal test was called without checking what it removed, and the autocorrelation caveat was not printed. The live login failed during the demo; the precomputed fallback had only one region. A judge asked why the opposite-sign example was chosen and the answer was 'it looked good'."

#### Directions T2 and T3 (options)

- **T2 "Season Stripped" (lesson-first, lowest data risk).** One monthly series (≥ 15 years). Three panels: raw, monthly climatology, remainder. Test on the remainder with the same MK and OLS. The story: "the summer swing looked like a trend; the remainder slope is modest and may lose significance." Build cost: low. Validity: high. Presentation: good, but less of a detective. Can be folded into T1 as a third screen (recommended if time allows).
- **T3 "Record-Length Explorer" (a lens on the non-significant trend).** One variable, one region. A slider for start year (earliest to latest − 10 years) re-runs the seasonal MK and shows p falling or rising with record length. Direct response to the challenge line "Sometimes all a trend needs to become significant is a longer period." Build cost: low–medium (code only; the slider is just a loop over start years, which is fast on monthly data). Validity: high, but a p-value that crosses 0.05 by changing the start year is itself a warning sign for p-hacking: label the panel "sensitivity to start year, not a conclusion". Presentation: the most distinctive of the three.

---

## C. Build plan (both challenges, one team)

**Assumptions (state these in the team kickoff):** T0 = about 12:00 Sat 14 Nov 2026 (local); the deadline is Sun 15 Nov 2026, 23:59 local, about T+36h. Adjust if the team starts later. **Cut-lines:** T-12h = 11:59 Sun 15 Nov; T-4h = 19:59 Sun 15 Nov.

| Time (from T0) | Data | ML/AI | Frontend | Story/design |
|---|---|---|---|---|
| H0–H1 | Get FIRMS MAP_KEY and Earthdata Login (both teams). Hour-1 test: data_availability for all sources; one Giovanni CSV. | Jev and Gemini keys; test one structured-output call with the schema above. | Scaffold SPA (Vite, Leaflet, Plot). | Pick direction per challenge (team decision); write the 7-slide outline. |
| H1–H4 | FIRMS: pull 25 years for 2 AOIs (pre-clipped, per year files). Giovanni: 6 CSVs (2 regions × 3 vars). | Write Jev catalogue (B1, A1) and the code-first stats module. | Calendar view with mock data; trend chart with mock data. | Dither palette and tokens. Caveat copy (from the limits lists above). |
| H4–H8 | Filter, dedupe, aggregate → JSON + CSV. Seasonal MK + Sen + OLS on the Giovanni CSVs. | Gemini briefings for demo months; post-check (number match). | Replace mocks with JSON. Month panel. Two-region map. | Stipple map; trend-chart styling; citations panel. |
| H8–H12 | Overlap correction lens (F1 step 3). Hamed–Rao beside MK. | Jev routing wired (A1, B1), with 'none' card. | CSV downloads; method panel; sensor seam strip. | Hero-moment animation (calendar sweep, trend lines). |
| H12–H18 | Verify numbers on screen = numbers in CSV (spot-check 5). | Gemini captions for presets. | Responsive layout at phone width; accessibility pass (contrast, greyscale). | Record 30-s raw footage. |
| H18–H24 | Bug-fix only. | Freeze prompts. | Freeze UI. | Edit 30-s video; watermark check; no-NASA-logo check. |
| H24–H30 | Slides (7). Attribution page. | — | — | Final slides. |
| H30–H36 | Submission package; README with data sources, licences and disclosure. | — | — | Submit by T+30h (buffer). |

**Cut-lines:**
- **T-12h (drop):** F3 weather fingerprint (fire); T3 record-length explorer (trend); Jev A3 driver desk (fire); AppEEARS polygon path (trend); custom region drawing (both). Keep: F1 calendar with the seam; T1 two-region with the three charts. If T1 has only one region, keep the precomputed presets.
- **T-4h (drop):** overlap-correction lens (fire) → keep the raw and anomaly views only, with the limit printed. Gemini live calls (both) → show precomputed briefings only. Hamed–Rao panel (trend) → keep it as a single number with caveat.

---

## D. Demo script

### D.1 30-second storyboard (shot by shot), fire direction F1

| Shot | Time | Visual | Audio/caption |
|---|---|---|---|
| 1 | 0–4 s | Calendar empty grid, dither dots on a dark map, the title "Burn Calendar" | Voice: "Two decades of fire records. Two sensors that do not agree." |
| 2 | 4–10 s | Calendar fills year by year, anomaly colours rise; seam rules appear at 2012, 2018, 2024 | "MODIS, then VIIRS, then NOAA-20 and NOAA-21." |
| 3 | 10–16 s | Click the 2024 cell; panel opens: counts by sensor, anomaly percentile, "check locally" | "This month is unusual. Which sensor saw it?" |
| 4 | 16–22 s | Switch raw ↔ harmonized; the seam strip stays; SNPP end marker 2 Nov 2026 | "The sensor changes. The app shows where." |
| 5 | 22–27 s | Download CSV; the file appears in a shot | "Every detection, with its sensor and confidence." |
| 6 | 27–30 s | Title card: "Data: NASA FIRMS. Briefing: AI-drafted from computed numbers. Not for tactical use." | End card |

### D.2 30-second storyboard, trend direction T1 (if the team picks trend)

| Shot | Time | Visual | Audio/caption |
|---|---|---|---|
| 1 | 0–4 s | Question box: "Is the land getting wetter?" | "Pick a variable, then a place." |
| 2 | 4–12 s | Two regions: A rising (▲), B falling (▼) | "The same process, opposite signs." |
| 3 | 12–20 s | Stat row: "p = 0.00 — increasing / p = 0.00 — decreasing" | "Significant, in both directions." |
| 4 | 20–27 s | Preset 3: weak trend, "p = 0.29 — not significant. A longer record may be what this needs." | "Not every trend is real. The tool says so." |
| 5 | 27–30 s | Citations, pymannkendall MIT, Data: NASA Giovanni | End card |

### D.3 Seven-slide outline (fire F1)

1. **Problem.** The record is split: MODIS, VIIRS, and in 2026 SNPP ended (2 Nov). Show the seam.
2. **Method.** Filter → dedupe → overlap lens → anomaly vs sensor baseline. One line per step, with the thresholds.
3. **Calendar.** Screenshot of the hero calendar with the seam rules.
4. **Seam test.** Raw vs harmonized for the same month; what changed and why.
5. **Honest limits.** Detection ≠ burned area; detection probability differs; NRT vs standard; the source conflict on MODIS end dates.
6. **Use.** Who uses it (emergency managers, land managers): one scenario, the question the calendar answers.
7. **Attribution and AI use.** Data: NASA FIRMS. Jev routing and Gemini briefings; numbers from code; the disclosure text.

### D.4 Seven-slide outline (trend T1)

1. **Problem.** One process, opposite signs in two regions.
2. **Variables.** The catalogue (12), with plain-language definitions.
3. **Two-region result.** The hero chart and the stat row.
4. **Significance.** What p means here; seasonal MK; Sen's slope and interval.
5. **Season stripped.** Raw vs remainder (T2 lesson).
6. **Not significant, on purpose.** The weak trend and the longer-record sentence.
7. **Attribution and AI use.** Giovanni citations, pymannkendall, disclosure text, "not a scientific validation".

---

## E. Attribution and compliance (combined)

- **Data:** NASA FIRMS (MODIS, VIIRS); NASA Giovanni datasets (MERRA-2, GLDAS, GPM, and any others used). Cite each DOI from the export header. Use the words "Data: NASA …", not NASA insignia.
- **Libraries:** pymannkendall (MIT, JOSS doi:10.21105/joss.01556); SciPy (BSD-3); Leaflet (BSD-2); Observable Plot (ISC) or D3 (ISC/BSD-3); Vite (MIT).
- **Models:** Jev (team stack), Gemini 4 Hydrogen (Google API terms, 18+ only). Gemini gemini-decision-1 is a fallback only.
- **AI disclosure text (paste on the About page and slide 7):** "Routing uses Jev. Briefings and captions are drafted by Gemini from numbers computed in code and checked against those numbers. Significance tests and fire statistics are computed in code. Model confidence is not scientific validation."
- **Watermark plan:** label AI-drafted text blocks; any generated image gets a visible "AI-generated" watermark (Space Apps rule).
- **No-NASA-logo check:** search the built site and the slides for the NASA logo and the "meatball" mark. Zero hits required.
- **Licence of this repo:** Apache-2.0 (Space Apps expectation; VERDICT: OSI-licensed dependencies).

---

## F. Scores (1–5)

Scores are JUDGMENT. The team can change them after it picks the direction.

| Direction | Impact | Creativity | Validity | Relevance | Presentation | Why |
|---|---|---|---|---|---|---|
| **F1 Sensor-Seam Calendar** | 4 | 3 | 4 | 5 | 4 | Clear users and the 2026 seam are real. Creativity is limited by a crowded fire-map genre; the seam panel is the differentiator. Validity held back by harmonization being a ratio on few overlap months. |
| F2 Seam Test (three calendars) | 3 | 3 | 4 | 5 | 4 | Stronger validity story, same genre. |
| F3 Fire-weather fingerprint | 3 | 3 | 2 | 4 | 3 | Correlation looks like causation; more build. |
| **T1 Two-Region Detective** | 4 | 3 | 5 | 4 | 3 | Most checkable test; opposite-sign and non-significant presets cover the challenge's hidden tests. Presentation hard in 30 s (line charts). |
| T2 Season Stripped | 3 | 2 | 5 | 4 | 3 | Best lesson; less a detective. Recommended as a screen inside T1. |
| T3 Record-Length Explorer | 3 | 4 | 4 | 4 | 4 | Most distinctive; start-year sensitivity must be labelled honestly. |

---

## G. Risks and pre-mortem (combined)

- **Keys and logins (both):** team must hold a FIRMS key and an Earthdata Login before H1. If not by H1, switch to samples and say so on slide 5 / slide 4.
- **Source conflicts (fire):** SNPP end is confirmed by the Earthdata alert page (HTTP 200) and two prior reports; MODIS end dates conflict. Print "source conflict" rather than a date.
- **NOAA-20/21 standard data (fire):** UNVERIFIED. Use NRT for the newest months and label it.
- **Model overreach (both):** the biggest threat to Validity, and the thing judges will test. Keep Jev to routing and Gemini to quoting. Post-check numbers in code.
- **Dither vs numbers (both):** dither on backgrounds only; numbers crisp; contrast ≥ 4.5:1; greyscale test.
- **Idea origin:** this plan proposes options. The human team picks. Do not let a model choose the direction.

---

## H. Open questions for the team (hour 1)

1. Which FIRMS `MAP_KEY` and Earthdata account will the team use? Can it run `data_availability` for `MODIS_SP`, `VIIRS_NOAA20_SP`, `VIIRS_NOAA21_SP`?
2. Does an authenticated Giovanni CSV download return an area-average column for a box, and for which variables?
3. Which two AOIs (fire) and which two regions (trend) do the team want as demo presets? They should be places the team can check against a local source.
4. Which direction does the team pick for each challenge (F1/F2/F3; T1/T2/T3)?
5. Is the Gemini key 18+-compliant in the team's use (no child-facing UI)?

---

## Appendix: files written

- `research/plans/plan-earth-hotspots-trend.md` (this file)
- `research/plans/samples/firms_readme_head.txt` (first 60 lines of FIRMS archive readme, VERIFIED fetch)
- `research/plans/samples/mk_synthetic_check.py` (synthetic seasonal-MK check; run with `python -I` in a venv containing `pymannkendall` and `numpy`)
