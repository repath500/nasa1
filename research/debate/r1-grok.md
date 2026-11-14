# Round 1 — grok (red team / contrarian)

Lens: attack the consensus, the over-hyped model uses, and the crowded ideas. Argue for what the AI-fit rankings buried. This is options and trade-offs for the human team. It is not a pick.

Hackathon clock: submissions close Sun 15 Nov 2026, 11:59 p.m. local. Team of 3–5. Demo is 30 seconds or 7 slides. Judges score Impact, Creativity, Validity, Relevance, Presentation. The stack the team wants is Jev (typed probabilities, text and images), gemini-4-hydrogen (multimodal in, text out), gemini-decision-1 as the fallback, and a dither UI. SI must not be the author of the idea.

Claims below that drive a score were re-checked on 14 Nov 2026 with `curl`. **VERIFIED** means this pass read it at the URL. **DISPUTED** means a finding states it and this pass does not.

---

## 1. Scores (1–10) for this team and this stack

A high score means a 3–5 person team can ship something a NASA-literate judge will not wince at, inside ~40 hours, where Jev or Hydrogen does a job that code cannot, and the 30-second shot is one screen. A challenge that only wins if a model writes the science scores lower.

| # | Challenge | Score | One-line reason |
| --- | --- | --- | --- |
| 1 | MODIS / VIIRS hot spots | **7** | The 2026 sensor death is real and FIRMS is the only easy global API in the set. A hotspot-count "harmonization" is also the easiest way to be scientifically wrong. |
| 2 | Lunar landing site navigator | **7** | The demo (Sun up, Earth down) is one cached Horizons query. The model is optional. A terrain-occluded south-pole horizon is not a weekend. |
| 3 | Earth system trend detective | **6** | The only challenge whose success test is a p-value a judge can recompute. Dither fights a line chart, and Jev must not be allowed to speak significance. Underrated by the AI-fit tables. |
| 4 | Flame in freefall | **6** | Best nominal fit for a ranker, and the brief asks for one. The archives are not demo-sized, two 2026 repos already built the chatbot, and there is no partial-gravity combustion data to support a lunar-cabin claim. |
| 5 | Planet X and SPHEREx | **6** | DR1 is new and the cutout path is anonymous. WiseView already is the product. Jev-as-discoverer, and any Planet Nine claim, will lose an astrophysics judge. |
| 6 | Earth information jukebox | **5** | Frames are public and an Art & Technology path exists. Lyria is paid, not on the free tier, and a musical bed is not sonification. NASA already has a sonification playbook. |
| 7 | Adapting farms | **5** | The decision shape matches Jev. The data that makes it local is U.S.-only, OpenET is not CC0, and telling a farmer what to plant from a 9 km soil-moisture cell is malpractice dressed as impact. |
| 8 | Dancing with the SARs | **4** | NISAR's validated record is weeks old. Speckle plus dither double-encodes noise. A wrong polarization story is worse than no story. |
| 9 | Earth analogs of Moon and Mars | **4** | "Surprise us" plus an embedding is how you rediscover Atacama with a confidence interval. Incommensurable sensors do not become a similarity score in 40 hours. |
| 10 | Martian map | **4** | Mars Trek, HiRISE, and a decade of hackathon Mars maps already exist. Gemini outlining "hazards" on an orbital image is an untested claim about astronaut safety. The challenge's own Worldview link is an Earth browser. |
| 11 | Junior astronaut trainer | **4** | DONKI's new API is live, so the data excuse is gone. The audience is 7–12, Gemini's API terms are 18+, the demo may not show a minor, and a 1-bit UI fights the age. |
| 12 | Discarded-equipment storytelling | **3** | The LROC inventory is a gift. An SI-written voice for a dead rover is the failure mode the rules tell judges to score for originality. Jev has nothing to decide. |
| 13 | Space mission design game | **3** | Four-player negotiation plus a real mass/power/link budget is two products. GMAT does not run in the browser. The field is Kerbal-shaped. |
| 14 | Health monitoring | **2** | The resource list is essays, not a stream. A probability next to a vital sign is a medical claim. HELIOS (Oct 2026) already occupies the "not a medical device" dashboard. |

Consensus this pass is attacking: gpt-a's portfolio puts SPHEREx, Flame, and analogs at 43/42/40 out of 50. grok-a's portfolio puts Flame, lunar, and analogs at the top and SPHEREx at 12th. Both reward "the model has a job-shaped hole." Neither punishes prior art, a false lunar atmosphere, or a similarity score with no ground truth hard enough.

---

## 2. Shortlist

Six challenges. Each has directions, not a winner. Evidence for and against is limited to claims checked in the findings or re-checked here.

### 2.1 MODIS and VIIRS hot spots — the one the AI rankings buried

gpt-a scored it 38/50 and called harmonization "statistical, not AI." grok-a scored dither fit 5/10 because the brief wants color ramps. ds1 correctly calls it the most winnable of SAR/fire/farms and then bolts Jev on as a burn-type classifier. The first half is right. The classifier is the trap.

**For.** FIRMS is the only resource on the challenge list, so the Global Award "use a listed source" rule is trivial to meet. On 14 Nov 2026 the Earthdata page still says new FIRMS Suomi-NPP active-fire data "will cease at 13:00 UTC on November 2, 2026," and the same page's alert says Suomi NPP is no longer delivering new data. VERIFIED: https://www.earthdata.nasa.gov/news/blog/transitioning-from-suomi-npp-viirs-omps-what-firms-users-need-know. A calendar that draws the seam will look like the only adult project in a crowded fire-map field. ds1's own section 4.3 is the scientific core: VIIRS 375 m sees small fires MODIS misses, so a raw count jumps when the sensor changes; monthly counts are also counts of overpasses.

**Against.** Fire dashboards are the most crowded Earth genre in Space Apps (ds1 cites GROW and a decade of red-dot maps). FIRMS already serves MODIS and VIIRS separately. A weekend "overlap ratio" presented as harmonization will make a fire scientist wince. Accessible color ramps are in the brief; a 1-bit calendar that hides the anomaly fails the ask. Jev labeling a month "agricultural burning" from a z-score and a land-cover class is a gimmick: the land-cover join is code, and the label is a guess.

**Directions**

1. **Sensor-seam calendar.** One AOI, MODIS standard product plus NOAA-20/21, a monthly matrix, the SNPP end date drawn on the axis, CSV download. Harmonization is a documented ratio or an FRP sum, with the uncorrected count beside it. Jev is absent. Hydrogen writes three sentences that may only quote numbers already in the matrix.
2. **The trend that flips.** Same AOI, three calendars: raw counts, FRP, overlap-corrected. The point of the demo is that "more fires" becomes "no significant change" when the sensor is removed. This is the Validity entry. A Mann-Kendall on the corrected series is code (pyMannKendall is MIT; grok-b verified the package). Jev does not announce the p-value.
3. **Burn-type desk (the one to treat as a stretch, not the product).** Jev `choice` over agricultural / wildfire / flare, but only after code has attached a land-cover class, a season, and a confidence mix, and the UI shows the class. If the land cover is missing, the choice is hidden. Gemini does not get to invent the driver.

**Where the models are real.** Hydrogen, grounded on the computed matrix, as a briefing the judge can check. gemini-decision-1 only if a still of the calendar must be scored and Jev's image path is off. **Where they are a gimmick.** Any model that classifies the fire, forecasts the season, or "explains" a hotspot the table does not contain.

### 2.2 Lunar landing site navigator — a clock, not a chatbot

grok-a is right that this is a decision product. It is wrong that Jev is a 9/10 fit. Sun elevation and Earth visibility are ephemerides. A model that re-ranks a table the code already sorted will not be missed if the key fails on stage.

**For.** The challenge's complaint is true: QuickMap, Moon Trek, and Horizons exist and are miserable for "two sites, two dates." ds2 ran a case at 0°E, 89.9°S on 2026-12-01 with the Sun near +1.5° and Earth near −1.5°. That single frame is the 30-second demo, and it does not need a model. Horizons needs no key. Trek WMTS needs no key (ds2 downloaded tiles).

**Against.** Artemis III is no longer a landing. NASA's Artemis III page, read 14 Nov 2026: the mission "will carry out a series of objectives in low Earth orbit" to demonstrate systems "needed for future lunar landings, beginning with Artemis IV," launch 2027. VERIFIED: https://www.nasa.gov/mission/artemis-iii/. A news line on that page is "NASA, Partners Accelerate Lander Development for 2028 Moon Missions" (23 Oct 2026). Any UI that says "pick Artemis III's landing site" is false. The nine 2024 candidate regions are Artemis-III-era. South-pole illumination is terrain-occluded; a spherical horizon is the wrong answer at Shackleton, and a real horizon mask is a research product. Lunaserv already serves dynamic illumination (ds2). The gap is comparison UX, not missing physics. Dither on a 1.5° elevation tick will hide the only number that matters.

**Directions**

1. **Two-site horizon.** Five curated sites, dates from a cached Horizons table, a crisp elevation plot, time-to-sunset and time-to-Earthset as numerals. No Jev. Hydrogen writes the one-sentence "why this feels wrong" caption from those numerals only.
2. **Site × date matrix.** Rows are sites, columns are a lunar day of dates, cells are sunlight hours and Earth-visibility hours computed in code. Jev `score` is allowed only for a qualitative criterion the code does not have (for example "how badly does a 48-hour slip hurt science at this site"), with the weights on screen. If that criterion is hand-waved, drop Jev.
3. **Three real horizons, labeled as such.** Precompute LOLA horizon masks for three south-pole points before the demo, and show one spherical-horizon control beside them so the terrain effect is the point. Do not promise the whole polar grid. Gemini does not trace the horizon.

**Where the models are real.** Almost nowhere in the core loop. A caption grounded on computed angles is the honest Hydrogen job. **Where they are a gimmick.** Asking Jev which site is "best," asking Hydrogen to read a DEM, or generating a lunar landscape.

### 2.3 Earth system trend detective — the validity sleeper

grok-a ranked this 13th of 14 because "SI is optional" and "dither does little for a line chart." That is an argument about the stack, not about winning. The challenge text says what a 5 on Validity looks like: a variable, a region, a time series, a rate, and a significance test, including a trend that is real and not significant. Giovanni already plots the series. The gap is the opposite-sign pair and the honest non-result. KNMI Climate Explorer is the prior art a student tool has to be clearer than, not more powerful than (grok-b).

**For.** The test is checkable in the room. Daily or monthly data are enough. pyMannKendall is MIT. Precomputed Giovanni CSVs survive a login failure. A model is not required, which is an advantage when keys fail, and a liability only if the team believes the stack must be visible to count.

**Against.** A thin wrapper on Giovanni loses Creativity. Autocorrelation makes p-values too small; seasonal cycles fake trends; grok-b states both and they are the ways to lose. The 30-second video of two line charts is a hard Presentation problem. Dither on the chart itself is a mistake. Search-grounded Hydrogen is paid-tier only (gpt-a and grok-a agree; this pass did not re-read the grounding paragraph).

**Directions**

1. **Two regions, one variable, two slopes.** One preset with opposite signs. One preset that fails the test, with the sentence the challenge invites: a longer record may be what this needs. Definitions in one sentence, source long-name on screen. No model in the statistic.
2. **Season stripped.** Raw series, monthly climatology, remainder. The lesson is that summer is not a trend. Hydrogen may write the caption. Jev may not.
3. **Variable front door.** A catalog of ~20 Giovanni variables the team wrote. Jev `choice` picks which ID matches the user's sentence ("soil moisture is not rainfall"). The catalog is the product's guardrail. Shipping the door without the series fails the challenge (grok-b concept 4.2).

**Where the models are real.** Jev as a router over a fixed catalog. Hydrogen as a definition writer checked against the official long name. **Where they are a gimmick.** A model that says "significant," a Prithvi embedding difference with no p-value, or a news-driven region suggestion with the article off screen.

### 2.4 Flame in freefall — the consensus favorite, with the fatal flaws attached

This is the only brief that says "summarizes, ranks, and interprets," which is why both AI memos put it first or second. The red-team case against starting here:

- The bytes are not a weekend. This pass re-read the keyless investigation JSON. `totalFileSize` was 657,608,178 bytes for SAME (PSI-102, about 0.66 GB), 12,250,600,201 for Saffire-I (PSI-98, about 12.3 GB), 923,832,535,657 for FLEX (PSI-69, about 924 GB), and 2,035,568,427,496 for ACME BRE (PSI-20, about 2.04 TB). DOIs on those four records match the `10.60555` identifiers grok-b cited. The search itself, `GET https://psi.nasa.gov/geode-py/ws/repo/search?term=combustion&size=2`, returned HTTP 200 and `hits.total` 26, with no key. A live "PSI browser" will die on stage. The experimental tables are tiny (SAME 331 bytes, Saffire-I 469 bytes); the demo can rank those, not the videos.
- Partial-gravity combustion data are not in PSI. The challenge says so, and names LUCI and FM2 as future. A rank "for the lunar cabin" is an extrapolation. E-FIELD is an electric-field stand-in and must be labeled as one. An SME who sees a lunar-habitat score on a gaseous soot-inception flame will wince.
- Prior art is already in the 2026 field. FlameGuard (https://github.com/harshita713lab/NASA-Hackathon-flameguard) and Flaregrain (https://github.com/jpss2004-bot/flaregrain) both returned HTTP 200 on 14 Nov 2026. grok-b read them as a RAG console and a 24-investigation ranker. Another chatbot loses.
- Hydrogen extracts numbers from PDFs. The failure mode is an oxygen percentage that appears in the extracted record and in the "supporting quote" because both were written together. A Noul that checks "the quote contains the number" does not catch that. Code can only check numbers that already exist in a table.
- gpt-a's own sample request labels a habitat `"lunar surface, 14.7 psi / 21% O2"`. That is Earth's sea-level atmosphere. The challenge's lunar cabin is ≥30% O2 at ≤10.2 psi. Do not copy that example into a demo.

**For.** The brief really does want a rank, the investigations are public (CC0 on the records grok-b opened), NTRS PDFs are the right Hydrogen input, and a three-preset reorder (ISS / lunar cabin / suit) is a clean 30-second shot if every score opens onto a quote and a DOI. Dither belongs on the flame still, with the raw frame one toggle away. Microgravity flames are high contrast; the look can be a plate rather than a costume.

**Directions**

1. **Habitat rank of papers, not of terabytes.** Eight to twelve investigations. Hydrogen fills a schema from one NTRS PDF each. A human accepts the oxygen, pressure, fuel, and flow fields before they are shown. Jev then scores pillar, habitat-overlap, and evidence strength on that accepted record. Rank = the product the team writes in code, weights on screen. SoFIE, LUCI, and FM2 appear as "not in PSI."
2. **Limit chart with a gold table.** ~30 extinction points the team typed from papers, Hydrogen proposing rows, a person accepting them. The lunar-cabin oxygen band is a tint. SoFIE-GEL's boundary, if used, is marked literature, not PSI (grok-b). Jev only nouls "is this number an extinction limit" on rows that came from prose.
3. **One clip, as a panel.** A public short (the ScienceCast is the listed one) in a Bayer well with the matrix locked. It is not the entry. Flame film as the whole product misses the rank.

**Where the models are real.** This is the strongest real use of both: Hydrogen reads PDFs and a short clip; Jev ranks a rubric the team wrote; neither does arithmetic. **Where they are a gimmick.** A RAG box over the PSI HTML, a model that averages 0 g and 1 g and calls it lunar gravity, Box-on-flame as a feature (experimental, and it should be paired with a presence check), and any Earth-spinoff tab that takes over the home screen.

### 2.5 Planet X and SPHEREx — a blink tool that must not discover a planet

gpt-a gives it the highest total in the portfolio (AI fit 9, dither 10). grok-a ranks it 12th and says decision models do not help until there are candidates. grok-b is the one to trust: AI fit 6, feasibility 7 for a cached blink of the five required targets, and a wavelength warning. Split the difference. Do not build gpt-a's version.

**For.** The success test is five named objects, including WISE 0855 at the coordinates in the brief. grok-b verified anonymous SIA and cutout examples, a November 2026 DR1, and the acknowledgement text. WiseView (http://byw.tools/wiseview) shows the interaction to copy. A difference image where a mover is a dipole is a better dither demo than a map, if the Bayer matrix is locked to sky pixels.

**Against.** WiseView, Aladin Lite, and IRSA's own notebooks already display sky time series. The 102-band spectrum is the novelty and it is a stretch (WCS-WAVE is for visualization; grok-b says label any hackathon spectrum "approximate"). Barnard's Star's proper motion will miss a small cutout if the epoch is wrong. Epsilon Indi B will not resolve at 12.9 arcsec/pixel. Channels 51–52 are empty and the 1.083 μm helium stripe is an artifact. A claim that this finds Planet Nine is false on wavelength: a ~40 K object peaks near 70 μm; SPHEREx stops at 5 μm (grok-b, labeled there as a back-of-envelope, not a sensitivity paper). Jev `box` always returning a box, which gpt-a warns about, is a discovery-shaped bug. HiPS PNGs clipped at 0–40 MJy/sr will hide the faint mover.

**Directions**

1. **Five-target blink.** Presets, play, dates on screen, URL state, raw-vs-dither, acknowledgement. One detector or a sum. Cache the cutouts. No model.
2. **Difference and artifact key.** Subtract two epochs. Amber and blue ink for the sign of the residual. A legend that shows a dipole (mover) versus a stripe (helium). Jev `noul` on a raw JPEG crop — mover / stripe / misalignment — as a side list of probabilities with a "send to a human" button. The model sees the raw crop, not the dither. It does not get a "planet" class.
3. **Coarse spectrum, labeled approximate.** One cursor, one point per detector or a handful of channels, molecules marked only from a wavelength list the team wrote. Hydrogen writes two sentences and must refuse a type if the spectrum is thin.

**Where the models are real.** Optional triage of crops the code already cut, and a caption of a spectrum the code measured. **Where they are a gimmick.** A Planet X essay, a model that names a brown dwarf from a blink, Box-as-detection, and Hydrogen "finding" the mover in a video of HiPS previews.

### 2.6 Earth information jukebox — only if the sound is the data

ds4's recommended concept stacks Hydrogen, Jev, Gemini TTS, and Lyria RealTime on six tracks. That is four models for a mapping a synthesizer can do. The challenge is accessibility and a defensible sight-to-sound rule. Chandra / SYSTEM Sounds already did scan-direction, brightness-to-loudness, separated stems, and testing with blind users (ds4). Judges who know that work will not be impressed by a generative bed.

**For.** SVS frame sets for the listed EIC pieces returned HTTP 200 in ds4's pass. A jukebox of three silent frame sets, a mapping card, and an audio-only mode can be the Art & Technology entry. The dither can be the same luminance field that drives the synth, which is the rare case where dither is the data path rather than a filter. Some EIC videos embed licensed music (ds4 names Universal Production Music, Pond5, Shutterstock on specific IDs). Use frame sets, not the produced soundtrack.

**Against.** Lyria 3.5 is $0.08 per song and not on the free tier. VERIFIED on https://aistudio.google.com/docs/pricing (Lyria 3.5 full song, paid tier only). A live "dream mode" needs billing, a WebSocket, and a label, and it can make the piece sound like generic generated music. Gemini TTS exists as a page (title "Gemini 3.8 Flash TTS" returned with the docs) but a kids-or-public live call sits under the 18+ API terms ds3 and ds4 both flag. Pixel-to-pitch without a scale is noise. Accessibility claimed without a blind listener is a claim.

**Directions**

1. **Three mapping cards.** Night lights, one ocean, one forest or lightning. Tone.js or the Web Audio API. Each parameter names the visual feature. A screen-reader path and a transcript. No Lyria. Jev unused. Hydrogen drafts alt text, labeled SI, human-edited.
2. **Literal versus musical, both audible.** Same frames. Mode A is the strict map. Mode B quantizes onto a scale so it is listenable, and the card says what was thrown away. The toggle is the science. Still no generative model.
3. **Lyria as a labeled encore, or not at all.** One pre-generated paid clip, SynthID / SI acknowledgement, never the data layer. If the key or the quota fails, mode A still plays. Do not make RealTime the demo.

**Where the models are real.** Hydrogen writing alt text and a "what to listen for" script from the mapping card. **Where they are a gimmick.** Jev as conductor, Lyria as the planet, TTS as the voice of the data.

### Explicitly off the shortlist

- **Analogs.** A match/mismatch card is the right UI and the wrong epistemology for 40 hours. Gemini image similarity between a HiRISE chip and a desert photo matches texture, not process. The challenge says Earth cannot reproduce gravity, vacuum, or radiation, and that famous sites should not be the answer. Field-validated analogs took campaigns. An embedding that "discovers" one will not survive a geologist.
- **Farms.** Highest impact ceiling in ds1, and the highest chance of giving bad advice. SMAP L4 is a 9 km modeled field, not a farm (ds1). Prithvi's crop checkpoint is ~0.43 mIoU on U.S. CDL (ds1). OpenET's terms are not a NASA open license. The brief says support, not replace. A 30-second slider that re-ranks rotations will be heard as "plant this."
- **Health, both games, storytelling, SAR, Mars map.** Scores in section 1. The shared failure is a model performing a measurement, a diagnosis, or a story the team did not write, on top of a genre the judges have already seen.

---

## 3. Findings to correct

1. **Jev's context is 64k per request and 32k per question. 262k is a downgrade switch, not the default.** VERIFIED: https://docs.typesafe.ai/models.md. The header `TypeSafe-Danger-Zone-Long-Context: true` raises both limits to 262k, and the same page says that mode is slower and less accurate. **DISPUTED:** ds1, which tells the team to trust OpenRouter's "262K" over a conflicting 64k claim. OpenRouter's own FAQ text does say "Jev 1.13 has a 262,144 token context window" (https://openrouter.ai/typesafe/jev-1.13, read this pass). That advertisement omits the header and the accuracy warning. Do not plan a multi-PDF Jev call. Score one short record at a time. gpt-a, grok-a, grok-b, and ds3 already have the official numbers right.

2. **ds1 builds on `jev-1.13` and a P50 latency of ~0.08 s.** The current model is `jev-1.14.0` (14 Oct 2026); Box exists only there. The 0.08 s figure is an OpenRouter performance table, not a budget. grok-a already says not to plan on unpublished rate numbers. Same warning for latency.

3. **ds5 is wrong that Flame has no machine interface and is "document mining."** The PSI search and investigation JSON answered with no key in this pass (HTTP 200, 26 combustion-term hits, not all of them combustion). grok-b's endpoint is real. ds5 is still right that the HTML app is a JavaScript shell and that multi-gigabyte downloads are not a live demo. "Login-gated" applies to bulk files until someone finishes a byte download. It does not apply to the metadata this pass fetched. ds5's "PSI license: PD" is looser than grok-b's per-investigation CC0; cite the DOI on the record, not a blanket public-domain claim.

4. **Suomi-NPP active-fire data has stopped.** ds1 is right, and it is now checked rather than inherited. The article body still uses "will cease … November 2, 2026" (it was written as a notice). The page alert is present tense: Suomi NPP is no longer delivering new data. A calendar that still treats SNPP as the live sensor is stale. MODIS Terra/Aqua end dates remain in conflict inside ds1's own open questions. This pass did not resolve Aqua. Do not ship a "current month" MODIS cell without hitting FIRMS `data_availability`.

5. **Artemis III is a 2027 low-Earth-orbit demonstration. Landings are framed as starting with Artemis IV.** VERIFIED: https://www.nasa.gov/mission/artemis-iii/. ds2's key finding is right on the substance. The "targeted for 2028" half is a news headline on that page ("2028 Moon Missions," 23 Oct 2026), not a sentence this pass found that says "Artemis IV launches in 2028." Lunar demos should say "future south-pole landing," not "Artemis III site." The challenge is about lighting and direct-to-Earth, which survives the schedule change.

6. **DONKI moved, and the new API works. ds3's "old URL returned 404" did not reproduce.** `https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR?startDate=2026-01-01&endDate=2026-01-07` returned HTTP 200 and flare records, with no key, on 14 Nov 2026. The old `api.nasa.gov/DONKI/FLR?...` returned **403**, not 404, in this environment (a missing key is a plausible cause; this pass did not retry with `DEMO_KEY`). The CCMC announcements page describes the replacement of `kauai.ccmc.gsfc.nasa.gov` by `ccmc.gsfc.nasa.gov`, not a dated death of `api.nasa.gov`. VERIFIED announcement text: https://ccmc.gsfc.nasa.gov/news/major-updates/. Use the new base. Label cached events as archived.

7. **Lyria is not a free-tier instrument.** Pricing page: Lyria 3.5 full song is "Not available" on the free tier and $0.08 per song on paid. ds4's model-page citations for Lyria, TTS, Decision 1, and gemini-3.8-live all returned real titles this pass, so those IDs are not rumors. The jukebox plan still fails if it assumes a live generative bed on the Hydrogen free tier. Hydrogen itself does not emit audio. That correction in ds4 is right.

8. **gpt-a's lunar-habitat example is Earth's atmosphere.** 14.7 psi and 21% oxygen is sea level. The challenge's suit is 100% oxygen at 4.3 psi; the expected lunar cabin is ≥30% oxygen at ≤10.2 psi. A rank built on the sample JSON teaches the wrong fire.

9. **Do not treat OpenRouter as the Jev source of truth when it disagrees with docs.typesafe.ai.** ds2 and ds1 both offer OpenRouter `typesafe/jev-1.13` as the no-waitlist path. It is a real page. It is one version behind, it is an alpha decisions endpoint, and its context sentence conflicts with the vendor. Prefer `api.typesafe.ai` and `jev-1.14.0` if a key exists. gemini-decision-1 is the documented fallback: the model page text extracted here includes a 262,144-token input and yes/no plus single-select questions. Pricing was not re-extracted past the model blurb; grok-a and gpt-a's $0.10 per million and 200 RPM / 10k RPD free tier were not re-read this pass. Treat those quotas as standing only if the next wave opens the rate-limit page.

10. **Worldview cannot save the Mars challenge.** ds5 is right: https://worldview.earthdata.nasa.gov/ is Earth imagery. It is listed on the Martian-map resource list. Using it as a Mars layer is a relevance error. It remains a legitimate GIBS front end for the Earth challenges.

11. **"Can't hallucinate" is a vendor sentence.** ds1 repeats it. Jev cannot emit a free-form string. It can still assign a high probability to a bad rubric, and the rubric can be leading. Calibration is aggregate (gpt-a, grok-a). A 0.9 on one investigation is not a measurement.

12. **Flame prior art is not hypothetical.** Both GitHub URLs above answered HTTP 200. Licenses were not opened. Do not fork them. Do not ship a lookalike RAG console and call it the rank.

---

## 4. Open questions the next wave has to close before anyone commits

1. **FIRMS, hour one.** With a real `MAP_KEY`, what is `data_availability` for `MODIS_SP`, `VIIRS_SNPP_SP`, `VIIRS_NOAA20_SP`, and `VIIRS_NOAA21_SP`? ds1 already suspects NOAA-20/21 standard products may lag the API names. A calendar demo that 404s on the recent months is not a demo.
2. **One PSI byte.** Does `psi.ndc.nasa.gov` or the AWS open-data bucket serve a small SAME or Saffire CSV without a guest account? Metadata is open. The file is the question ds5 and grok-b still disagree on.
3. **Keys on Saturday morning.** Does the TypeSafe console issue `jev-1.14.0` immediately, and what tokens/second does a new org get? If not, does gemini-decision-1's free tier actually answer a `noul` in AI Studio for this project? Unpublished Hydrogen RPM is the same test. Do not discover this during the video.
4. **Aqua MODIS.** ds1's sources disagree (August 2026, late 2026, September 2027). The live FIRMS feed is the authority. The SNPP fact is not.
5. **SPHEREx cutout, one target.** Download one WISE 0855 cutout from the documented SIA URL, record the epoch, and confirm Barnard's Star's Gaia proper motion against that epoch. grok-b did not download a cutout. The whole challenge is that file.
6. **Three lunar numbers a judge can recompute.** Publish the Horizons request for one south-pole site and one date, and say whether the horizon is spherical or a LOLA mask. ds2's 2026-12-01 example is the right shape. It needs a second person to recompute it, and it needs a label that Artemis III is not landing there.
7. **Lyria and TTS, only if jukebox is alive.** Confirm paid-tier access and that generated audio will be acknowledged in the file metadata. If billing is not on, delete directions that mention Lyria before the team debates them.
8. **OpenET and GAEZ, only if farms is alive.** Can a public Apache-2.0 repo show OpenET-derived numbers under those terms, or only a live query with attribution? ds5 marks GAEZ as CC-BY-NC-SA-3.0-IGO. This pass did not re-read the FAO license. A non-commercial layer inside a project NASA may redistribute is a legal problem, not a footnote.
9. **Gaia overlay license.** ds5 marks the MAST Gaia page as CC-BY-NC-3.0-IGO. This pass did not re-read it. If that stands, an SPHEREx tool can query Gaia at runtime and cite it, and should not vendor a catalog extract.
10. **Who is in the room.** Hot spots needs someone who will refuse a raw count. Flame needs someone who will reject a lunar score on a gaseous flame. Lunar needs someone who will recompute one ephemeris. Jukebox needs someone who will listen to the strict map and say whether it communicates. Analogs, health, and the two games need a domain person the team does not appear to have budgeted. If that person is absent, those challenges get worse, not more "creative."

---

## What this round will not concede

The stack is a ranker plus a reader plus a plate. It is not a scientist, a doctor, a composer, or a mission designer. The two challenges where removing the model would actually change the answer are a flame-paper rubric and a fire calendar's optional driver label. Everywhere else, code, a statistical test, or an ephemeris is the product, and the model is a caption. Captions can still win Presentation. They do not survive a judge who turns the key off.

The underrated pair is hot spots and trend detective. They look weak on an "AI fit" axis and strong on Validity, which is the axis a careless model will lose. Flame and SPHEREx stay on the table only in the narrow directions above. Lunar stays on the table as a clock. The jukebox stays on the table as a mapping, not as a concert.
