# Findings: Flame in Freefall, Earth System Trend Detective, Planet X and SPHEREx

Research date: 14 November 2026. Scope is the three challenges named in the task. No application code was written.

**How to read claim labels**

- **VERIFIED** means this pass opened the page, API, or file and read the fact there. A URL is given.
- **VENDOR CLAIM** means the maker states it on an official page. It was not re-measured here.
- **UNVERIFIED** means a secondary page, a search snippet, or memory suggested it, and this pass did not confirm the primary text. Do not build a demo on an unverified fact.
- Leaderboard ranks for Jev from secondary sites conflict with each other and were not re-run. They are omitted as facts.

**Models, in one place**

| Model | What it actually is | What this pass confirmed |
| --- | --- | --- |
| Jev (TypeSafe) | A decision model. A `state` (text and/or PNG/JPEG) and typed questions go in. Each answer is a choice, a score, a yes/no probability (`noul`), or, on 1.14 only, a box on an image. It returns probabilities. It does not write essays and it does not watch video. | **VERIFIED** from [Models](https://docs.typesafe.ai/models.md) and [Quick start](https://docs.typesafe.ai/introduction/quickstart.md), fetched 14 Nov 2026. Current IDs: `jev-1.14.0` (from 14 Oct 2026) and `jev-1.13.0`. Alias `jev-latest` points at `jev-1.14.0`. Endpoint `POST https://api.typesafe.ai/v1/systemone` with `Authorization: Bearer`. `GET https://api.typesafe.ai/v1/models` is live and returns an authentication error with no key. Price on the docs page: $0.042 per million input tokens ($42 per billion); output tokens are free. Default context: 64k tokens per request and 32k per question. Header `TypeSafe-Danger-Zone-Long-Context: true` raises both to 262k; the same page says that mode is slower and less accurate. Inputs: text plus PNG and JPEG. The docs say it does not accept audio or video. Question types on 1.13: Choice, Score, Noul. Box requires 1.14. Rate limits are per organization (429). Docs say customer requests are not used for training. **This pass did not run an inference.** |
| gemini-4-hydrogen (Google) | A fast multimodal Gemini 4 model for reading text, images, video, audio, and PDFs, and for writing text, including structured JSON. | **VERIFIED** from [What's new in Gemini 4 Hydrogen](https://aistudio.google.com/docs/whats-new-gemini-4-hydrogen) and the [model card](https://aistudio.google.com/docs/models/gemini-4-hydrogen), fetched 14 Nov 2026. Model ID `gemini-4-hydrogen`. Paid price on that page: $1.50 / 1M input, $7.50 / 1M output. Unified context window 1,048,576 tokens covering input, thinking, and output. Thinking levels `low`, `medium`, `high` (default), `xhigh`. Synchronous output default 65,536 tokens; longer outputs use background execution up to the shared 1M window. Available on free and paid tiers, Interactions API and GenerateContent. Inputs on the model card: text, image, video, audio, PDF. Output: text. Supported: structured outputs, function calling, code execution, file search, URL context, Google Search grounding, Maps grounding, batch, and agentic video understanding. Agentic video is supported and **defaults to static**. Image generation, audio generation, and the Live API are not supported. Explicit context caching is not supported; implicit caching is. Latest update listed as November 2026. The "more than 5x fewer fabricated claims" line is a **VENDOR CLAIM** on that page. Blog benchmark percentages (MKA, Agents' Last Exam) were **not** on the pages fetched here and stay **UNVERIFIED**. Office/OpenDocument input is described in search snippets of the Cloud guide; the AI Studio model card lists PDF, so treat `.docx` input as **UNVERIFIED** until a live call succeeds. NTRS papers are PDFs, so the verified path does not need Office input. |
| Other | Prithvi-EO-2.0 is a geospatial foundation model, not a trend test. pyMannKendall is the significance test. | Prithvi-EO-2.0 weights: Apache-2.0 on the Hugging Face model card for `ibm-nasa-geospatial/Prithvi-EO-2.0-300M` (**VERIFIED** via the README fetched in search). Pretraining described there is masked autoencoding on NASA HLS (six optical bands). It does not emit a p-value. pyMannKendall 1.4.3 is MIT (**VERIFIED** from the PyPI JSON on 14 Nov 2026). Cite Hussain & Mahmud, JOSS 2019, doi:10.21105/joss.01556. |

**Where each model earns its place**

Jev is the ranker. Hydrogen is the reader. Arithmetic and statistical tests stay in ordinary code.

- Give Hydrogen a PDF, a figure, or a short flame clip. Ask for a structured record: fuel, shape, oxygen percent, pressure, flow speed, gravity level, what was measured, the result, a short quote, and the page or timestamp. Its 1M window can hold a review paper plus several articles. Its video path can see flame shape and extinction. Jev cannot.
- Give Jev that short record, plus a written rubric, and ask atomic questions: which fire-safety pillar, does this atmosphere overlap a lunar cabin, how strong is the evidence. Read the probabilities. Rank on those numbers.
- Do not ask either model to decide whether 31 is between 30 and 40, or whether a Mann-Kendall p-value is below 0.05. That is code.
- Do not put the whole PSI archive or a 900 GB video set into either model. Hydrogen's practical video path is a short public clip or a cut of tens of seconds. The general Gemini video guide says default sampling is about 1 frame per second and that a 1M-context model handles about 1 hour at default resolution or about 3 hours at low resolution ([Video understanding](https://ai.google.dev/gemini-api/docs/video-understanding)). Agentic mode, off by default on Hydrogen, can look harder at a short window. A 1 fps pass will miss a fast blowoff. Cut the clip to ignition and extinction first.
- Jev's per-question context is 32k tokens. Score one extracted record at a time. The 262k header is a fallback the vendor says is less accurate.

**Space Apps rules that touch all three**

- The challenge statements themselves say "super intelligence (SI)". **VERIFIED** in the local challenge files.
- A NASA Space Apps GitHub reply states that SI tools are allowed, that the submission must say where and how they were used, that AI-generated images and video need a visible watermark, that audio, code, and data need an acknowledgement in text and metadata, and that generated content may not use or modify NASA logos, flags, or mission identifiers. Global awards require at least one NASA resource listed on that challenge. Source: [nasa/spaceapps discussion 1849](https://github.com/nasa/spaceapps/discussions/1849) and [discussion 1947](https://github.com/nasa/spaceapps/discussions/1947). **VERIFIED** as the text returned from those threads.
- The participant FAQ is described, in search indexing of [the FAQ](https://www.spaceappschallenge.org/resources/participant-faqs/), as tying the words "Super Intelligence" and "SI" to a 29 September 2026 U.S. executive order, and as requiring a description of SI use. The live FAQ HTML is a client-rendered app; this pass did not extract that sentence from the rendered body. Treat the executive-order date as **UNVERIFIED** detail. The disclosure requirement is repeated in the GitHub replies above.
- The legal page ([spaceappschallenge.org/legal](https://www.spaceappschallenge.org/legal/)) returned HTTP 200. Indexed text of that page says submitted solutions are under Apache-2.0, third-party materials must be public and OSI-licensed, every source must be cited, and the project must not contain export-controlled information. This pass did not re-parse the rendered legal HTML. Treat Apache-2.0 and the citation rule as **VERIFIED** from that indexed legal text, and re-read the live page before submission.
- NASA Earth science data from NASA-led missions are CC0 unless a product is marked otherwise, and NASA asks for a citation anyway. **VERIFIED** from [Earthdata data-use guidance](https://www.earthdata.nasa.gov/engage/open-data-services-software-policies/data-use-guidance). PSI investigation records checked below are `CC0-1.0`.

**Dither, as a scientific display rather than a costume**

Use ordered (Bayer) dither locked to the pixel grid inside the image well only. Error diffusion (Floyd-Steinberg) on video invents frame-to-frame shimmer that reads as false motion. That is fatal for flame video and for a sky blink. Floyd-Steinberg is acceptable on a single still poster frame.

Keep axes, numbers, p-values, coordinates, and legends crisp and undithered. A judge must be able to read "31% O2" and "p = 0.04".

Palette: warm off-white ground, near-black ink, one amber and one blue used only as the two scientific signs (sooting flame vs blue flame; rising vs falling trend; positive vs negative sky residual). Hairline rules and tabular numerals. No scanlines, no fake CRT, no sepia.

Offer a one-click "science view" that shows the original stretch beside the dithered well. The dither is a display transform. It is not a new measurement.

---

## 1. Flame in Freefall

### 1. Challenge in one paragraph

The ask is a web dashboard that summarizes, ranks, and interprets NASA microgravity combustion results so a person can pull fire-safety implications for spacecraft, stations, lunar and Martian habitats, and pressurized rovers. The judging hooks are hidden in the considerations: compare investigations on fuel geometry, oxygen, flow, and sensors; separate prevention, detection, and suppression; treat gaseous ACME flames as weaker fire-safety evidence than solids except where BRE emulates a material; apply the result to a real atmosphere (suit 100% O2 at 4.3 psi; expected lunar cabin at or above 30% O2 and at or below 10.2 psi; Earth 14.7 psi); and say plainly that partial-gravity combustion data are not in PSI yet. Rocket propulsion is out of scope. The words "super intelligence" are in the title, so a chat box with no auditable rank will look like a miss. Earth spinoffs (water mist, nuisance-free smoke detection, firefighter gear) are invited and easy to over-weight.

### 2. Data and resources

PSI is a JavaScript app. The useful machine interface found in the app bundle is `GET https://psi.nasa.gov/geode-py/ws/repo/search` (Elasticsearch JSON; `term`, `size`, `type`) and `GET https://psi.nasa.gov/geode-py/ws/repo/investigations/{PSI-id}`. Both returned HTTP 200 with no API key on 14 Nov 2026. `totalFileSize` below is the number in that JSON, divided by 1e9. It was not re-summed from objects. A term search for "combustion" also returned a solder study and a fluid-physics experiment. Filter on research area.

SoFIE, LUCI, and FM2 do not have their own PSI investigations in this search. A search for `SoFIE` returned only BASS-II (a mention, not a SoFIE dataset). Searches for `LUCI` and `FM2` returned zero hits. SoFIE is ISS microgravity solid-fuel work in the Combustion Integrated Rack, documented on NASA Science and in papers, and it is not a downloadable PSI corpus yet. The challenge text already says partial-gravity data are absent and names LUCI and FM2 as future.

| Name | URL | Format | Access / auth | Size | License | Verified? | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PSI combustion search (official resource) | https://psi.nasa.gov/physci/repo/search?q=combustion | HTML app; data via the JSON API above | No key observed for search or investigation JSON | Search payload ~145 KB | Per-investigation; see rows below | VERIFIED, HTTP 200 | Start here. Do not scrape the HTML. |
| PSI JSON search | https://psi.nasa.gov/geode-py/ws/repo/search?term=combustion&size=100 | JSON | No key observed | — | — | VERIFIED | 26 hits, not all combustion. |
| PSI-98 Saffire-I | https://psi.nasa.gov/geode-py/ws/repo/investigations/PSI-98 | JSON metadata; files are pdf, xlsx, docx, zip | File URLs point at `psi.ndc.nasa.gov` and `s3://` style paths under `psi-data/`. A byte download was not completed | 12.25 GB `totalFileSize` | CC0-1.0, doi:10.60555/0t15-1z43 | VERIFIED | 6 linked publications. Experimental table is a 469-byte CSV. Recent file list is documents and zips, not loose mp4s. |
| PSI-99 Saffire-II | same pattern | same | same | 16.93 GB | CC0-1.0, doi:10.60555/2chp-m469 | VERIFIED | Cygnus. 7 publications in the record. |
| PSI-100 Saffire-III | same | same | same | 35.21 GB | CC0-1.0, doi:10.60555/040q-4h36 | VERIFIED | Related to PSI-98 and PSI-99. |
| PSI-69 FLEX | same | same | same | 923.83 GB | CC0-1.0, doi:10.60555/mbq8-0451 | VERIFIED | Droplets, MDCA in CIR. 51 publications. This is why "download the data" is not a 48-hour plan. |
| PSI-68 FLEX-2 | https://psi.nasa.gov/physci/repo/data/investigations/PSI-68 | listed in search | JSON record not size-checked this pass | UNVERIFIED size | License not re-read; sibling records are CC0 | Search record VERIFIED; size UNVERIFIED | Real-fuel follow-on to FLEX. |
| PSI-39 CFI | investigation JSON | same | same | 718.89 GB | CC0-1.0, doi:10.60555/m6pj-a914 | VERIFIED | Cool flames of n-dodecane droplets. Related to PSI-69. |
| PSI-26 BASS | investigation JSON | same | same | 163.55 GB | CC0-1.0, doi:10.60555/58h4-dy80 | VERIFIED | Solids in the MSG. 10 publications. |
| PSI-25 BASS-II | investigation JSON | same | same | 274.63 GB | CC0-1.0, doi:10.60555/4qc4-de67 | VERIFIED | 17 publications. Related to PSI-26. |
| PSI-102 SAME | investigation JSON | same | same | 0.66 GB | CC0-1.0, doi:10.60555/gd4k-8h62 | VERIFIED | Smoke droplet sizes. The only small flight corpus in this size sample. 16 publications. |
| PSI-101 SAME-R | search hit | — | — | UNVERIFIED | UNVERIFIED (likely CC0) | Search record VERIFIED | Reflight of SAME. |
| PSI-47 DAFT / DAFT-2 | search hit | — | — | UNVERIFIED | UNVERIFIED | Search record VERIFIED | Same particle counter, used for dust. The challenge calls this out. |
| PSI-20 ACME BRE | investigation JSON | same | same | 2035.57 GB | CC0-1.0, doi:10.60555/vb93-3y72 | VERIFIED | Gaseous burner used as a materials-flammability emulator. 16 publications. |
| PSI-21 ACME CLD Flame | search hit | — | — | UNVERIFIED | UNVERIFIED | Search record VERIFIED | Coflow laminar diffusion flames. CIR. |
| PSI-22 ACME E-FIELD Flames | search hit | — | — | UNVERIFIED | UNVERIFIED | Search record VERIFIED | Electric field used as a stand-in for partial gravity. CIR. Related PSI-23. |
| PSI-23 ACME s-Flames | search hit | — | — | UNVERIFIED | UNVERIFIED | Search record VERIFIED | Spherical diffusion flames. CIR. |
| PSI-10 ACME Flame Design | search hit | — | — | UNVERIFIED | UNVERIFIED | Search record VERIFIED | Soot-inception limits. CIR. |
| PSI-159 ACME CFI-G | search hit | JSON fetch exceeded a short timeout (2.4 MB body, parse failed) | — | UNVERIFIED | UNVERIFIED | Accession VERIFIED in search | Cool flames of propane, n-butane, n-pentane. Challenge says oxygen in the burner stream up to 85%. Confirm that number from the record during the hackathon. |
| PSI-107 SPICE | search hit | — | — | UNVERIFIED | UNVERIFIED | Search record VERIFIED | Smoke point, MSG. |
| PSI-106 SLICE | search hit | — | — | UNVERIFIED | UNVERIFIED | Search record VERIFIED | Liftoff and structure. Hardware field in the search hit was empty. Challenge says the SPICE flow duct in the MSG. |
| PSI-142 and PSI-117, PSI-60, PSI-62, PSI-115 | search hits | ground reanalyses | — | UNVERIFIED | UNVERIFIED | Search records VERIFIED | Ground studies that reuse flight data. Useful as "interpretation" and weaker as primary evidence. |
| NASA combustion science page (official) | https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/ | HTML | Public | — | NASA website | Not re-fetched this pass; URL is the official resource | Narrative overview. |
| PSI investigations by area | https://www.nasa.gov/physical-sciences-informatics-psi/psi-investigations-by-research-area/ | HTML | Public | — | NASA website | VERIFIED, page text extracted | Combustion list matches the search. SoFIE is absent. Status flags say Complete. |
| Researcher's guide, combustion (official) | https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/ | Web page pointing at a 2015 PDF | Public | ~50 pages, per the challenge | NASA | URL is the official resource; PDF not re-read this pass | Best single Hydrogen input for objectives and hardware. |
| PSI researcher's guide (2015 PDF) | https://www.nasa.gov/wp-content/uploads/2020/05/psi_researchers_guide-tagged.pdf | PDF | Public | fetched | NASA | VERIFIED text extract | Confirms video and images are first-class PSI objects and that the UI has changed since the guide. |
| PSI database guide | https://assets.science.nasa.gov/content/dam/science/bps/bps-general/bps-data_osdr_psi/Complete_PSI_Database_Guide.pdf | PDF | Public | — | NASA | VERIFIED text extract | Folders for raw vs analyzed, reduced gravity vs Earth gravity. Bulk download is a zip of checked files. |
| AWS open-data registry entry | https://registry.opendata.aws/nasa-psi/ | Registry page | Public listing | — | "No restrictions on the use of this data" | VERIFIED from the registry text in search | Use as the license backup citation. Confirm the bucket name before a bulk sync. |
| ScienceCast video (official) | https://www.youtube.com/watch?v=W1oXykoz9zg | YouTube, 3.6 min, 2018 | Public | short | YouTube / NASA | URL is the official resource | Hydrogen can take a public YouTube URL per the Gemini video guide. Good demo clip. Too short to be the science. |
| NTRS 20180004258, spacecraft fire safety | https://ntrs.nasa.gov/api/citations/20180004258/downloads/20180004258.pdf | PDF | Public, no key | short | NASA NTRS, public domain in the US | VERIFIED PDF text | States Saffire-I goals (spread rate, mass, heat release), Saffire-II (oxygen limits), Saffire-III (different flow). |
| NTRS 20210022402, Gollner | https://ntrs.nasa.gov/api/citations/20210022402/downloads/217-_GollnerMichaelJ.pdf | PDF | Public | — | NASA NTRS | VERIFIED text extract | Says microgravity flammability limits are expanded vs 1g, and that stopping ventilation may not stop a fire that can keep burning by diffusion or reignite when flow returns. |
| NTRS 20140011099, BASS thickness and preheating | https://ntrs.nasa.gov/citations/20140011099 | citation page | Public | — | NASA NTRS | Search snippet only; PDF not read | Low-speed flames can flare if flow suddenly rises. |
| NTRS 20210015913, ACME overview | https://ntrs.nasa.gov/citations/20210015913 | citation page | Public | — | NASA NTRS | Search snippet only | Six-experiment hardware context. |
| NTRS 20200000361, SoFIE project | https://ntrs.nasa.gov/api/citations/20200000361/downloads/20200000361.pdf | PDF | Public | slides | NASA NTRS | VERIFIED text extract | Five inserts in CIR: MIST (PMMA cylinders), SMμRF (sheets, engineering materials), NCA, RTDFS (thin sheets), GEL (PMMA spheres). Explicitly about exploration atmospheres and EVA suits. |
| SoFIE project page | https://science.nasa.gov/biological-physical/investigations/sofie/ | HTML | Public | — | NASA | Search snippet | Insert for CIR. Not in PSI. |
| SoFIE-GEL paper | https://doi.org/10.1016/j.combustflame.2025.114244 | journal | paywall likely | — | publisher copyright | Abstract VERIFIED via the DOI page snippet | PMMA spheres, 4 cm, flows 0.2–80 cm/s, oxygen 13–34%, pressure 0.15–1.1 atm. Extinction boundary is a truncated U. Minimum oxygen slightly under 14% at 1 atm. About 7 hours of microgravity burn time. |
| Apollo 1, Apollo 13, Mir 1997 (official) | challenge links on sma.nasa.gov and nasa.gov/history | HTML | Public | — | NASA | Not re-read | Use as case cards, not as PSI evidence. |
| Spinoff: firefighter tanks, smoke detector, fire clothing (official) | spinoff.nasa.gov nodes 9582, 9407, 9918 | HTML | Public | — | NASA | Not re-read | Earth-benefit tab. Keep it secondary so the dashboard stays about habitat atmospheres. |
| images.nasa.gov API | https://api.nasa.gov/ | JSON API docs | API key (free demo key exists) | — | NASA media, check per asset | Docs page VERIFIED as fetched | Practical source of short public flame videos when PSI zips are too big. |
| FlameGuard repo | https://github.com/harshita713lab/NASA-Hackathon-flameguard | code | public repo | — | UNVERIFIED, LICENSE file not opened | README VERIFIED via search fetch | 2026 Space Apps RAG console (FastAPI, Pinecone, MiniLM, Groq). Competing prior art. A retrieval chatbot is already in the field. |
| Flaregrain | https://github.com/jpss2004-bot/flaregrain | static site | public | — | see NOTICE.md, not opened | README VERIFIED via search | Ranks 24 PSI investigations, keeps conflicting NASA numbers visible, model text is pre-generated and checked. Closest thing to the right product. Differentiate with live probabilities and video. |

Hardware map, consistent across the challenge text and the PSI records: ACME's six gaseous experiments (BRE, CLD Flame, E-FIELD, Flame Design, s-Flames, CFI-G) share CIR. FLEX, FLEX-2, and CFI burn droplets in MDCA inside CIR. BASS, BASS-II, SPICE, and SLICE use the MSG flow duct. Saffire I–III burn large samples in Cygnus after the vehicle leaves the station.

Atmospheres to rank against, from the challenge text (**VERIFIED** in the local challenge file): suit, 100% oxygen at 4.3 psi; Earth sea level, 14.7 psi and about 21% oxygen; expected lunar base and rover, 30% oxygen or more at 10.2 psi or less. The challenge says that is more than a 40% increase in oxygen concentration relative to Earth and that materials are much more flammable. There is no partial-gravity combustion data in PSI. E-FIELD is the only partial-gravity stand-in, and it is an electric-field effect on ions, which the UI must label as a stand-in.

### 3. Open-source and prior art

- PSI metadata API and CC0 investigation records, as above. Cite each investigation's DOI.
- NTRS PDFs. US government work, public domain in the United States; still cite the NTRS id.
- Hydrogen for extraction, Jev for ranking. Both are closed APIs. Disclose them. Do not claim the project is only open-source code if the demo calls them.
- FlameGuard and Flaregrain, above. Judges may see several RAG dashboards. The opening that is still empty is an auditable rank tied to a habitat atmosphere, plus a real flame image.
- NASA Glenn combustion pages and the 2015 researcher's guide are the right corpus index. They are not code.
- No NASA GitHub library found this pass that already ranks PSI combustion for habitats. Absence of a search hit is not proof none exists.

### 4. Project concepts

#### 4.1 Habitat rank desk (recommended)

- **Pitch.** Pick a cabin atmosphere. The desk ranks every PSI combustion investigation for that cabin and shows the probability, the evidence, and the sentence it is based on.
- **User.** A graduate student or aerospace engineer screening materials and fire-control ideas for a lunar habitat or a rover, who will not read 50 papers tonight.
- **Experience and wow.** Three presets: ISS (21% O2, 14.7 psi), lunar cabin (≥30% O2, ≤10.2 psi), suit (100% O2, 4.3 psi). The list reorders. Saffire and BASS rise for the lunar cabin. A pure soot-inception gaseous flame drops, unless it is BRE. Opening a row shows oxygen, flow, fuel shape, a quote, the DOI, and a Bayer-dithered still of the flame with the raw frame beside it. The wow is the reorder, with every score expandable to a probability.
- **Jev.** State = one Hydrogen-extracted record (a few hundred tokens). Questions, all in one call: Choice `pillar` = prevention / detection / suppression / fundamental; Noul `overlaps_habitat` with the preset's oxygen and pressure written into the criteria; Score `evidence` with a rubric (flight limit measurement > flight observation > ground reanalysis > model only); Noul `quote_supports_number` checking that the quoted sentence contains the oxygen value in the record. Rank = `P(overlap) × evidence × pillar weight`. Show the three factors. Pillar weights are a human choice, displayed, not a hidden model opinion. Box on `jev-1.14.0` can outline the luminous flame on a JPEG still if you want a check that the still is actually a flame.
- **Hydrogen.** Input = NTRS PDF or the researcher's guide, plus 2–4 JPEG frames or one short public video. Output = the structured record and a three-sentence brief that may only use numbers present in the record. Agentic video only on a cut around ignition and extinction. Thinking level `high` for papers, `medium` for frames.
- **Pipeline.** (1) Cache the combustion investigation JSON. (2) Hydrogen extracts 8–12 papers, not 900 GB of video. (3) Code checks numeric fields against the JSON objectives when both exist. (4) Jev scores each record. (5) The UI sorts. (6) A second Jev pass nouls each sentence of the brief.
- **48-hour MVP.** Metadata for the combustion set, extracts for Saffire I–III, BASS, BASS-II, FLEX, BRE, SAME, and the SoFIE overview marked "not in PSI". Three presets. One public video. Citations and an SI disclosure panel. **Stretch:** a small SAME or Saffire zip actually opened; an O2–flow scatter with one point per extracted test; a "0g and 1g bound the Moon" control that is labeled as a bound, not a measurement.
- **Dither.** Image wells only. Bayer, 4×4 or 8×8, two inks so a blue cool flame and a yellow sooting flame do not become the same gray. Playback uses the same matrix origin every frame. Legend and probabilities stay crisp. Science-view toggle.
- **Risks.** Invented oxygen values. Scoring the model on arithmetic. Stuffing many PDFs into one Jev question and blowing the 32k per-question limit. Looking identical to FlameGuard. Saffire and FLEX file sizes making a "live PSI browser" fail on stage.
- **Scores.** Impact 8. Feasibility 6. Novelty 7. Judge appeal 9. AI fit 9.

#### 4.2 Flame film reader

- **Pitch.** A short, cited film of how a flame changes when buoyancy goes away, tied to the test conditions on screen.
- **User.** The same engineer, plus a professor teaching the difference between a teardrop and a sphere.
- **Experience and wow.** A clip plays in the dithered well. At extinction the frame holds and a label says quench or blowoff, with the timestamp. Conditions (fuel, O2, flow) sit in a crisp sidebar.
- **Jev.** On exported JPEG frames only: Noul "the visible flame is roughly spherical", Noul "the flame is blue rather than yellow", Box around the flame on 1.14. These are checks on Hydrogen's description.
- **Hydrogen.** The reader. Public YouTube or a short mp4 via the File API. Ask for timestamps of ignition, steady burning, and extinction, and for shape and color. Default video sampling is about 1 fps, so the clip must already be the interesting 20 seconds. Agentic mode for the extinction second.
- **Pipeline.** Pick three public clips (ScienceCast, one Saffire, one droplet). Do not start from the 924 GB FLEX archive.
- **48-hour MVP.** Three annotated clips and the condition sidebar. **Stretch:** link each clip to its PSI accession and DOI.
- **Dither.** As above. If the dithered playback shimmers, the matrix is not locked.
- **Risks.** Pretty and thin. Judges asked for a rank across investigations. This concept is a panel inside 4.1, not a whole entry, unless the annotations are dense.
- **Scores.** Impact 6. Feasibility 7. Novelty 5. Judge appeal 6. AI fit 8.

#### 4.3 Limit map across investigations

- **Pitch.** One oxygen–velocity chart with Saffire, BASS, SoFIE-GEL, and FLEX extinction points, each point traced to a paper.
- **User.** Someone comparing flammability limits, who thinks in maps rather than lists.
- **Experience and wow.** The lunar-cabin oxygen band is a vertical tint. Points inside it are the ones that matter. Hovering a point opens the quote. SoFIE-GEL's U-shaped boundary (from the 2025 abstract) can be drawn as literature, visually distinct from PSI points.
- **Jev.** Only for rows Hydrogen pulled out of prose, where the number might be a peak, a limit, or an example. Noul: "this number is an extinction limit". Code plots anything already in a table.
- **Hydrogen.** Table and figure reading from the PDFs. This is its strongest paper skill.
- **Pipeline.** Manual gold table of ~30 points beats a fully automatic extractor for the demo. Use Hydrogen to propose rows and a person to accept them. Jev nouls the accepted rows overnight so the team sleeps.
- **48-hour MVP.** One chart, two investigations, literature overlay for SoFIE marked "paper, not PSI". **Stretch:** flow on a log axis, separate quench and blowoff.
- **Dither.** Points can be stippled. Axes, the 30% line, and error bars stay crisp. Do not dither the error bars.
- **Risks.** Mixing a limit, a test condition, and a model prediction on one axis. The SoFIE boundary is not PSI data.
- **Scores.** Impact 8. Feasibility 6. Novelty 7. Judge appeal 8. AI fit 7.

#### 4.4 Earth spinoff shelf

- **Pitch.** The same physics shelf, with a second tab for water mist, dust-rejecting smoke detection, and firefighter gear.
- **User.** A visitor who asks "why does this matter on Earth?"
- **Experience and wow.** A small tab, not the home screen. Each card is a NASA spinoff page plus the PSI investigation that sits underneath the idea (SAME for detection, FLEX for suppression by dilution).
- **Jev / Hydrogen.** Weak fit. The spinoff pages are short. A model adds little. Hydrogen can draft the card from the spinoff page; a person checks it.
- **Pipeline.** Three official spinoff URLs already in the challenge.
- **48-hour MVP.** Three cards linked from the rank desk. Do not make this the product.
- **Dither.** A single still per card.
- **Risks.** Drifting into a history site. The challenge says the dashboard is for exploration fire safety.
- **Scores.** Impact 4. Feasibility 8. Novelty 3. Judge appeal 4. AI fit 2.

### 5. Recommendation

Build **4.1**, and put **4.3**'s chart on the investigation page and **4.2**'s one clip in the header. Leave **4.4** as a footer.

Reasons: the challenge asks for a rank, the archives are hundreds of gigabytes to terabytes, and two 2026 repos already do generic retrieval. Jev is useful here because the rank is a judgment under a rubric (habitat overlap, pillar, evidence), which is what its probabilities are for. Hydrogen is useful because the evidence is in PDFs and flame pictures, which Jev cannot read as video. Code owns the numeric comparisons once the record exists. A 48-hour demo can be honest if it ranks papers and metadata and shows one real clip, and if SoFIE, LUCI, and FM2 are labeled as not in the database.

---

## 2. Be an Earth System Trend Detective

### 1. Challenge in one paragraph

The ask is a tool that helps a student pick an Earth-science variable, pull it for a region, plot a long time series, and say what is changing, where, by how much, and whether that change is statistically significant. The judging hooks are the ones a careful scientist will notice: the same process can trend up in one region and down in another; daily or monthly data are enough; a non-significant trend is still worth showing; seasonal cycles can fake a trend; linear trend plus a t-test, Mann-Kendall, or a confidence interval is the intended statistics, not a climate model. SI is optional. The challenge says it could suggest variables from a place (a desert, a rainforest, a city) or from news. Definitions of the variables matter because the audience is high school, college, and scientifically literate public. Hiding a p-value behind a chatbot is a way to lose.

### 2. Data and resources

| Name | URL | Format | Access / auth | Size | License | Verified? | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Giovanni (official) | https://giovanni.gsfc.nasa.gov/ | Web app; time series download is CSV; maps as PNG | Earthdata Login for full download. Guest mode is limited. User manual says plots can be made with limited access and downloads need login, and that GES DISC must be authorized | A time series CSV is small. Do not download global grids | NASA Earthdata; cite the dataset. NASA-led products generally CC0 | Site HTTP 200 on 14 Nov 2026. Manual text VERIFIED from the fetched user-manual HTML | This is the 48-hour data path. It already subsets by variable, place, and time. |
| Giovanni time-series API | https://api.giovanni.earthdata.nasa.gov/timeseries | Text header plus CSV | Earthdata bearer token | One point, not an area average | same | **UNVERIFIED by a live call.** Documented in pvlib's MERRA-2 module and in an Earthdata Forum reply (forum topic 7628) which says the service is point-only | Use the website for area averages. Use this API only for a station-like point, and test it in hour 1. |
| Hydrology time series (official) | https://disc.gsfc.nasa.gov/information/tools?title=Hydrology%20Time%20Series | Web tool on GES DISC | Earthdata Login likely | small extracts | NASA, cite | Not re-tested | GLDAS and related hydrology. Good second preset (soil moisture, runoff). |
| AppEEARS (official) | https://appeears.earthdatacloud.nasa.gov/ | Point or polygon samples; CSV and GeoTIFF via API | Earthdata Login. `POST /api/login` returns a bearer token, about 48 h. Documented at https://appeears.earthdatacloud.nasa.gov/api/ | Samples are MB, not global archives | LP DAAC / NASA; cite each product | Site HTTP 200. API docs VERIFIED as fetched | Right tool when the user draws a polygon. Too slow to be the only path if the task queue stalls during a demo. Precompute two areas. |
| Climate Data Online (official) | https://www.ncei.noaa.gov/cdo-web/ | Station observations, map UI | Free. A token is commonly required; this pass did not re-read the token docs | small | NOAA open data; cite NCEI | URL is the official resource | Use one city station as a sanity check on a satellite series. |
| SeaWiFS chlorophyll paper (official) | https://ntrs.nasa.gov/api/citations/20090042747/downloads/20090042747.pdf | PDF | Public | paper | NASA NTRS | Not re-read this pass | A worked example of a coastal time series and a significance test. Hydrogen can summarize the method. The dataset itself is old. |
| KNMI Climate Explorer (official partner) | https://climexp.knmi.nl/ | Web analysis tool | Public scientific tool; read their citation rules on the site | — | KNMI / mixed input datasets | Not re-tested | Strong prior art. A winning student tool has to be clearer than this, not more powerful. |
| Trend-test blog posts (official links) | Medium article and a Statsig marketing guide, URLs in the challenge | HTML | Public | — | copyrighted pages | Not used | Weak sources. Use the Mann-Kendall definition and pyMannKendall's JOSS paper instead. |
| RCM data (CSA) | https://donnees-data.asc-csa.gc.ca/en/dataset/rcm | SAR products | Account likely; not confirmed this pass | large scenes | CSA terms; check before use | Not re-tested | Poor 48-hour fit. Radar backscatter is a hard first trend variable. |
| geo.ca | http://geo.ca/ | Catalog | Public | varies | Canada's Open Government Licence on many sets; check each | Not re-tested | Context layers for a Canadian place. |
| SWOT (official partner) | https://www.asc-csa.gc.ca/eng/satellites/swot/ | Mission page; data via PO.DAAC / Earthdata, typically netCDF | Earthdata | large | NASA/CNES; cite | Page not re-read | Stretch: one lake's water level. Not the core demo. |
| CSA ecosystem page | https://www.asc-csa.gc.ca/eng/satellites/everyday-lives/monitoring-and-protecting-our-ecosystems-from-space.asp | HTML | Public | — | CSA | Not re-read | Motivation copy only. |
| SAR Python tutorial | https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial | Jupyter | Public | small | UNVERIFIED, LICENSE not opened | Not re-read | Skip for this challenge unless the team already knows SAR. |
| MERRA-2 | GES DISC, via Giovanni | Hourly or monthly reanalysis, netCDF if taken in bulk | Earthdata, and GES DISC authorization | Global hourly is huge; a Giovanni CSV is not | NASA, cite | Named in the challenge; access path is Giovanni | Temperature, winds, humidity. Monthly means are the right resolution. |
| GLDAS | GES DISC, via Giovanni or the hydrology tool | Model land fields | Earthdata | same advice | NASA, cite | Named in the challenge | Soil moisture, evaporation, runoff. |
| MODIS, OMI, AIRS, GPM | via Giovanni and, for land products, AppEEARS | Gridded products | Earthdata | same advice | NASA, cite each DOI | Named in the challenge body | MODIS land via AppEEARS; atmospheric and rain via Giovanni. |
| pyMannKendall 1.4.3 | https://pypi.org/project/pymannkendall/ | Python | pip | tiny | MIT. Cite doi:10.21105/joss.01556 | VERIFIED on PyPI | `original_test`, `seasonal_test`, Sen's slope. This is the significance engine. |
| Prithvi-EO-2.0 | https://huggingface.co/ibm-nasa-geospatial/Prithvi-EO-2.0-300M | weights | Hugging Face | hundreds of MB | Apache-2.0 | VERIFIED from the model-card README | Optional stretch for "did the landscape embedding change". It is not a trend test and it is trained on HLS optical bands, so it does not interpret AIRS or MERRA-2. |
| Earthdata use guidance | https://www.earthdata.nasa.gov/engage/open-data-services-software-policies/data-use-guidance | HTML | Public | — | CC0 unless a product says otherwise; cite anyway | VERIFIED | Put the citation on the chart. |

### 3. Open-source and prior art

- Giovanni and KNMI Climate Explorer already plot time series. The gap is a guided choice of variable, a plain-language definition, a significance test the user can see, and a second region with the opposite sign.
- pyMannKendall (MIT) plus SciPy's linear regression for the t-test the challenge also names. SciPy is BSD. Statsmodels (BSD) can supply a confidence interval on the slope.
- AppEEARS API docs are the polygon path.
- Prithvi is the wrong backbone for a 48-hour significance tool. A fine-tune will not finish, and a p-value would still have to come from the time series.
- 2025 Space Apps winners are only loosely related. A third-party page maps "Twisters" (weather) and "QUEÑARIS" toward this challenge. That mapping is their judgment, not NASA's. Do not cite them as official ancestors.

### 4. Project concepts

#### 4.1 Two-region detective (recommended)

- **Pitch.** Ask a question, get two places, one variable, two slopes, and an honest significance call, including a call of "not significant".
- **User.** A high-school or college student, or a science-literate adult, learning what a trend is.
- **Experience and wow.** A short interview: what (water, heat, plants, air), where (pick two regions on a map). The tool returns a definition of the variable in one sentence, a monthly series for each region, Sen's slope, a 95% interval, and a Mann-Kendall p-value. One preset is significant in opposite directions. One preset is a real trend that fails the test, with the sentence "a longer record may be what this needs", which the challenge explicitly invites. The wow is the opposite signs on one screen, with the p-values visible.
- **Jev.** After code has computed the statistics, Jev only does language judgments. Choice: which of 12 Giovanni variable IDs best matches the user's question, with criteria written by the team ("soil moisture is not rainfall"). Noul: "this one-sentence definition matches the dataset's official long name". Do not ask Jev whether the trend is significant.
- **Hydrogen.** Draft the variable definition from NASA's variable glossary or a short PDF, and list confounders as warnings (seasonal cycle, El Niño, a sensor change). It does not compute the slope. Thinking level `low` or `medium`. If a news paragraph is used to suggest a region, keep the paragraph on screen and watermark nothing unless an image was generated. Citing a news outlet is required.
- **Pipeline.** Precompute six Giovanni CSV downloads (two regions × three variables) so the demo survives a login outage. Live path: Earthdata session, Giovanni or AppEEARS, CSV, `pymannkendall.seasonal_test` on monthly data, Sen slope, and an ordinary least-squares slope with a t-test beside it. Show both. Remove the seasonal cycle by using the seasonal Mann-Kendall test, and say so. Autocorrelation can make a p-value too small; print that caveat under the chart.
- **48-hour MVP.** Two regions, three variables, definitions, both tests, dithered map of the two regions, download of the CSV, citations. **Stretch:** user-drawn polygon through a pre-run AppEEARS task; a station from CDO next to the satellite series.
- **Dither.** The map well uses stipple density for the absolute slope and ink color for the sign. A crisp hatch or outline marks p < 0.05. The time-series line, the fit, and the numbers stay vector-sharp. Do not dither the line chart. Bayer on a choropleth is enough.
- **Risks.** Letting a model announce significance. Using daily data without a seasonal or autocorrelation story. A live Giovanni call failing on stage. Looking like a thin wrapper: the opposite-region question and the "not significant" preset are what make it a detective.
- **Scores.** Impact 8. Feasibility 8. Novelty 6. Judge appeal 8. AI fit 7.

#### 4.2 Variable router only

- **Pitch.** Type "a drying forest" and get the five variables worth testing, with reasons.
- **User.** Someone who does not know the difference between precipitation, evaporation, and soil moisture.
- **Experience and wow.** Five ranked chips, each with a one-line definition and a "why this one" probability.
- **Jev.** This is the whole product. State = the user's sentence plus a catalog of 20 variables (name, long name, units, sensor). Choice or Score per variable for relevance. The catalog must be written by the team from Giovanni, not invented by the model.
- **Hydrogen.** Optional rewrite of long names into plain language, checked by the Noul above.
- **Pipeline.** Static catalog JSON. No time series yet, so this fails the challenge unless it is the front door of 4.1.
- **48-hour MVP.** Front door only.
- **Dither.** Not the point.
- **Risks.** Shipping a menu.
- **Scores.** Impact 4. Feasibility 9. Novelty 4. Judge appeal 3. AI fit 6.

#### 4.3 Season stripped

- **Pitch.** Show the monthly series, the seasonal cycle, and the remainder, and let the user see the trend appear only in the remainder.
- **User.** A student who has just been told that summer is not climate change.
- **Experience and wow.** Three small charts. The raw series looks dramatic. The remainder's slope is modest and may lose significance. That is the lesson.
- **Jev / Hydrogen.** Almost none. Hydrogen can write the caption. The math is a monthly climatology subtraction plus the same Mann-Kendall tests.
- **Pipeline.** One Giovanni monthly CSV of at least 15 years.
- **48-hour MVP.** One variable, one region, three panels, as a mode inside 4.1.
- **Dither.** Leave the charts sharp.
- **Risks.** Too much of a statistics lecture if it is the whole submission. As a toggle, it is what an Earth-science judge hopes to see.
- **Scores.** Impact 7. Feasibility 8. Novelty 5. Judge appeal 8. AI fit 3.

#### 4.4 Embedding change map (stretch, not the entry)

- **Pitch.** Two HLS dates go through Prithvi; the map shows where the embedding moved; a click runs Mann-Kendall on NDVI for that patch.
- **User.** A college student who has heard of foundation models.
- **Experience and wow.** A landscape "difference" that is then either confirmed or rejected by the time series.
- **Jev.** Noul on a text summary only. The embedding distance is code.
- **Hydrogen.** Caption the patch.
- **Pipeline.** Prithvi-EO-2.0 tiny or 100M if the laptop can run it. Apache-2.0. HLS tiles from Earthdata. This is a day of work by itself.
- **48-hour MVP.** Do not start here. If 4.1 is done by hour 30, one patch is a stretch.
- **Dither.** Stipple the embedding distance. Keep the NDVI chart sharp.
- **Risks.** A model demo with no significance test, which misses the challenge. GPU hassle.
- **Scores.** Impact 5. Feasibility 3. Novelty 7. Judge appeal 5. AI fit 6.

### 5. Recommendation

Build **4.1** with the seasonal toggle from **4.3** and the router from **4.2** as the front door. Leave Prithvi out unless the core demo is already solid.

Reasons: the success criteria are explicit and testable, Giovanni already solves access, and the scientific risk is fake significance rather than missing data. Jev earns a narrow, real job: choosing a variable from a fixed catalog and checking that a definition matches the official name. Hydrogen earns a narrow job: plain-language definitions and confounder warnings, with the source on screen. pyMannKendall earns the result. That split is what "SI where it helps" looks like on a challenge that said SI is optional.

---

## 3. Planet X and SPHEREx

### 1. Challenge in one paragraph

The ask is a public web page: the user enters right ascension and declination, and the page plays that patch of SPHEREx sky across time so a moving or varying object is easy to see. It must be tried on Barnard's Star, Epsilon Indi B (a brown-dwarf pair around a star), WISE 0855 (the challenge gives RA 08h55m10.831s, Dec −07°14′42.53″), and the variable stars RW Aurigae and R Draconis. The judging hooks are in the considerations: keep up with new releases; use the 102 bands (summing each of the six detector arrays is the suggested shortcut; a live spectrum is extra credit); add and subtract epochs; let the user change the field of view; offer Gaia or WISE overlays; put coordinates in the URL; show contamination flags. The name "Planet X" is the historical and citizen-science frame (Pluto, then Backyard Worlds: Planet 9). The deliverable is a blink tool. A claim that the tool will find Planet Nine is not supported by the wavelength range, and it will read as a miss to an astrophysics judge.

### 2. Data and resources

SPHEREx launched in March 2025 and maps the sky about every six months from 0.75 to 5.0 μm with a linear-variable-filter imager, six detectors, 102 spectral channels. **VERIFIED** on the IRSA mission page and the Quick Release overview, fetched 14 Nov 2026.

Releases, from those pages: QR1 started July 2025 and was retired February 2026. QR2 started October 2025; headers were fixed April 2026; QR2 is no longer in search but remains downloadable through February 2027. QR3 started September 2026. DR1 was released November 2026 and reprocesses QR2 so that DR1 plus QR3 are one consistent spectral-image set. Cite dois **VERIFIED** on the QR overview: QR1 `10.26131/IRSA629`, QR2 `10.26131/IRSA652`, QR3 `10.26131/IRSA662`. A DR1 DOI was not on the QR overview or the mission page text extracted here. Find it in the explanatory supplement before publication. Required acknowledgement, **VERIFIED**: "This publication makes use of data products from the Spectro-Photometer for the History of the Universe, Epoch of Reionization and Ices Explorer (SPHEREx), which is a joint project of the Jet Propulsion Laboratory and the California Institute of Technology, and is funded by the National Aeronautics and Space Administration."

| Name | URL | Format | Access / auth | Size | License | Verified? | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| IRSA SPHEREx mission page (official) | https://irsa.ipac.caltech.edu/Missions/spherex.html | HTML | Public | — | NASA / IPAC; acknowledgement above | VERIFIED, HTTP 200, text extracted | Band resolving powers: 0.75–1.1 μm R≈39; 1.1–1.6 R≈41; 1.6–2.4 R≈41; 2.4–3.8 R≈35; 3.8–4.4 R≈112; 4.4–5.0 R≈128. |
| QR overview | https://irsa.ipac.caltech.edu/data/SPHEREx/docs/overview_qr.html | HTML | Public | — | same | VERIFIED text extract | Release history and QR DOIs. |
| Data products guide | https://caltech-ipac.github.io/spherex-archive-documentation/spherex-data-products/ | HTML, dated 12 Nov 2026 | Public | — | project docs | VERIFIED text extract | See the format notes under this table. |
| Data access guide | https://irsa.ipac.caltech.edu/spherex-archive-documentation/spherex-data-access/ | HTML | Public | — | project docs | VERIFIED text extract | SIA2, cutouts, AWS, astroquery. Examples use `wget` and `curl` with no credentials. |
| Tutorial notebooks (official) | https://caltech-ipac.github.io/irsa-tutorials/spherex/ | Jupyter | Public | small | Check the repo license before copying code | HTTP 200 | Also `spherex-hipscube` notebook. HiPS base cited in that notebook: `https://irsa.ipac.caltech.edu/data/hips/SPHEREx/spherex_allsky_cube` and cube files under `.../ibe/data/spherex/dr1/hips5_cube/hips_20261026`. |
| SIA2 | `https://irsa.ipac.caltech.edu/SIA?COLLECTION=spherex_dr1&POS=circle+RA+DEC+RADIUS` and `COLLECTION=spherex_qr3` | VOTable or HTML | No key in the documented examples | A hit list is small | acknowledgement above | VERIFIED from the access guide's examples | Also a deep-field collection and a DR1 cube collection; the guide says to search DR1 and QR3 together for all current images, and to use the uniform all-sky collection when deep fields would confuse the coverage. SIA can lag the files by about a day. |
| Cutout service | Append `?center=RA,DEC&size=DEG` to an image URL, as in the access guide's `curl` example | FITS MEF, cropped | Public HTTPS in the example | A 0.1° cutout is far smaller than 70 MB | same | VERIFIED as a documented example; a cutout file was not downloaded this pass | This is the hackathon interface. |
| Spectral image MEF | `level2_[obs]D[detector]_spx_l2b-v[ver]-[date].fits` | FITS, 6 extensions | directories on-prem and on AWS | about 70 MB each; 6 detectors per pointing | same | VERIFIED in the products guide | IMAGE 2040×2040, MJy/sr, zodiacal light **not** subtracted. FLAGS, VARIANCE, ZODI, ePSF (DR1/QR3) or PSF (QR2), WCS-WAVE. Bands: 0.75–1.09, 1.10–1.62, 1.63–2.41, 2.42–3.82, 3.83–4.41, 4.42–5.00 μm. |
| DR1 all-sky cube | `Npix[index]_cube.fits`, HEALPix order 5 NESTED, 12,288 tiles | FITS, 5 extensions | DR1 only | 512×512×102 per tile | same | VERIFIED in the products guide | 12.9 arcsec/pixel, about 1.8° tiles. Zodiacal light **is** subtracted. Channels 51 and 52 are empty (dichroic gap, keyword `BLANKCH`). Helium 1.083 μm stripes in band 1. HiPS PNGs are 0–40 MJy/sr and are for display, not measurement. HPX projection distorts in many FITS viewers. |
| WiseView (official prior art) | http://byw.tools/wiseview | Web app | Public, HTTP 200 | — | UNVERIFIED | VERIFIED live | The interaction model: coordinates, blink, field of view. Built for WISE. Hundreds of citizen discoveries, per the challenge. |
| Gaia DR3 (official) | https://archive.stsci.edu/missions-and-data/gaia | Catalog | MAST; DR3 is public | TAP queries can be small | ESA Gaia; use the official acknowledgement | URL is the official resource; archive page not re-parsed | Overlay stars and proper motions. The challenge says use DR3, not an older release. Barnard's Star moves so fast that the epoch of the coordinate matters. Take proper motions from Gaia rather than from memory. |
| NEOSSat pages and tutorial (CSA) | challenge links: mission page, CADC, GitHub tutorial, data.asc-csa.gc.ca dataset | mixed | likely an account for data | — | CSA terms; tutorial license UNVERIFIED | Not re-tested | Optional "other telescope" overlay. Not required to win. |
| Aladin Lite | https://github.com/cds-astro/aladin-lite | JavaScript HiPS viewer | embed | small | LGPL-3.0-or-later | VERIFIED from the GitHub license field via search | OSI license, so it can sit in a Space Apps repo if the license file ships with it. Cite Bonnarel et al. and Boch & Fernique. |
| astroquery | https://astroquery.readthedocs.io/ | Python | pip | small | BSD-3-Clause | VERIFIED from the project's license page | IRSA module for SIA. Use it in a small API route, not in the browser. |
| Astropy, reproject | astropy.org | Python | pip | small | BSD-3 | Standard; license not re-fetched this pass | WCS, cutout alignment before a difference image. Confirm the license file in the pinned version. |
| Backyard Worlds: Planet 9 | https://www.jpl.nasa.gov/news/nasa-funded-website-lets-the-public-search-for-new-nearby-worlds/ | citizen-science context | — | — | NASA/JPL news | Page text VERIFIED via search fetch | WISE blink movies. The social ancestor of this challenge. Most known brown dwarfs of some classes and many comets came from this style of search, per the challenge text. |
| Planet Nine proposal | Batygin & Brown 2016, Astronomical Journal | paper | — | — | journal | Not re-read this pass; the result is standard and widely cited | A distant planet of roughly Neptune-to-super-Earth mass was proposed to explain clustered extreme Kuiper-belt orbits. Mass, distance, and sky position remain uncertain. No confirmed detection. |
| IRAS + AKARI search | PASA, doi:10.1017/pasa.2025.10018 (Cambridge page fetched) | paper | — | — | journal | Abstract and body text VERIFIED via the fetched page | Far-infrared, epochs 23 years apart, 500–700 AU window, 13 pairs, one candidate that still needs a follow-up orbit. This is the actual Planet Nine search wavelength: far infrared. |
| SPHEREx brown-dwarf spectra | NASA news https://www.nasa.gov/missions/spherex/nasas-spherex-telescope-sees-menagerie-of-brown-dwarfs/ and ApJ doi:10.3847/1538-4357/ae9d66 | news + paper | — | — | NASA; journal | Abstracts VERIFIED via search | SPHEREx is already publishing 0.75–5 μm spectra of nearby L/T/Y dwarfs, with water, methane, CO, CO2. That is the science the 102 bands are for. |
| Comet 3I/ATLAS SPHEREx images | linked from the IRSA mission page | spectral images | public IRSA | — | SPHEREx acknowledgement | Link VERIFIED on the mission page; files not opened | A moving solar-system target with real SPHEREx data. A good extra demo besides the five required stars. |

**Planet Nine and this survey.** A thermal spectrum peaks near 2900 μm·K / T. An object near 40 K peaks near 70 μm. SPHEREx stops at 5 μm, on the short-wavelength side of that peak, where a 40 K blackbody is extremely faint. This is a back-of-envelope from Wien's displacement law, not a published SPHEREx sensitivity limit (**label it as such**). WISE and IRAS/AKARI were the surveys aimed at that cold population. SPHEREx's verified strengths in this dataset are nearby brown dwarfs (hundreds of kelvin, molecular bands inside 0.75–5 μm), comet ices, and variables. The tool should say that in a side panel so a visitor who came for Planet X learns something true. WISE 0855 is a cold brown dwarf, not Planet Nine, and it is one of the five required tests because it moves quickly and is faint in the infrared.

**Coordinates.** Use the challenge's WISE 0855 position exactly. For the other four, query Gaia DR3 or SIMBAD at runtime. This pass tried a SIMBAD ASCII URL and got HTTP 404, so no coordinates were copied from SIMBAD. Barnard's Star's proper motion is on the order of 10 arcsec per year, so a coordinate from the year 2000 will miss the star in a small cutout at the epoch of a 2025–2026 image. Epsilon Indi B is a tight brown-dwarf binary; SPHEREx will not split the pair in an all-sky cube at 12.9 arcsec per pixel. The demo is the system's motion and its infrared spectrum, not a resolved orbit. RW Aurigae and R Draconis are variables: the tool has to show brightness change, not only position. R Draconis is a Mira-class star whose period is many months, so a six-month cadence is the right sampling. Confirm the period from a catalog rather than hardcoding it.

**Native plate scale** of the 2040×2040 spectral image was not in the section extracted here. The cube scale, 12.9 arcsec per pixel, was. Fast movers and Barnard's Star want the spectral-image cutouts, not only the cube.

### 3. Open-source and prior art

- WiseView is the interaction to match: URL with coordinates, blink, zoom.
- Aladin Lite (LGPL-3.0-or-later) displays HiPS. Use it for context. Do the difference image yourself, because the HiPS PNGs are a fixed 0–40 MJy/sr stretch and will hide faint movers.
- astroquery (BSD-3) plus Astropy for SIA and WCS.
- Gaia DR3 for the overlay and for proper motion.
- Backyard Worlds as the social proof, WISE as the previous dataset.
- IRSA's own notebooks are the access code to adapt, with their license checked before copying.
- A 2025 Space Apps winner, Resonant Exoplanets ("Best Use of Data"), is sometimes grouped with this theme by third parties. That grouping is not NASA's. The technique here is blinking and spectra, not a transit search.

### 4. Project concepts

#### 4.1 Blink bench for the five required targets (recommended)

- **Pitch.** A link is a patch of sky. Press play and see what moved or changed brightness since SPHEREx's last pass.
- **User.** A curious adult and a student, the same audience as Backyard Worlds, plus an astronomer who pastes coordinates.
- **Experience and wow.** Five preset buttons for the required objects, a coordinate box, a field-of-view slider, and play. Two epochs blink. A third control subtracts them. A mover shows up as a black-and-white dipole in the dithered difference. A variable shows up as a single spot that changes weight. The URL updates (`?ra=&dec=&fov=&band=`) so a discovery can be shared. The wow is WISE 0855 or Barnard's Star stepping between frames, on real DR1/QR3 cutouts, with the frame date on screen.
- **Jev.** Optional, and only on a small JPEG of the difference image. Noul questions with criteria the team writes: "a compact dipole consistent with a mover", "a long stripe consistent with the helium artifact", "a residual at a bright star consistent with misalignment". Return the probabilities beside a "send to a human" button. This is a triage hint. It is not a discovery.
- **Hydrogen.** Optional caption: given a tiny extracted spectrum (numbers computed in code from the cutouts) and the Gaia overlay, write two sentences a newcomer can read, and refuse to name an object type if the spectrum is too thin. Also the Planet X side panel, drafted from the JPL Backyard Worlds page and the IRAS/AKARI abstract, then edited by the team so the wavelength limitation stays accurate.
- **Pipeline.** Server route calls SIA for `spherex_dr1` and `spherex_qr3` at the coordinate, requests one band-summed cutout per epoch (or one detector to start), aligns with Astropy WCS, writes a PNG. Browser blinks PNGs. Cache the five required targets the night before. Difference is `epoch2 - epoch1` after a simple background match. Flags HDU: if a pixel is flagged, mark it, do not average it in silently.
- **48-hour MVP.** Five presets, blink, one detector or a sum of the six images in a single epoch, URL state, dates, acknowledgement, a raw-vs-dither toggle. **Stretch:** subtract; FOV slider; Gaia overlay; contamination flags; a 17-point spectrum by summing channels; comet 3I/ATLAS as a sixth preset; Jev triage on the difference JPEG.
- **Dither.** Bayer locked to sky pixels, same origin every epoch, or the blink lies. Difference well: amber ink for positive residual, blue ink for negative, empty paper for zero. A true mover is a dipole. A helium stripe is a long ruled pattern and looks different, which is the point. Do not use error diffusion. Do not blink the official HiPS PNGs for the discovery view; their stretch clips faint sources. HiPS in Aladin can be the finder chart.
- **Risks.** Wrong epoch for Barnard's Star. Promising a resolved Epsilon Indi binary. Treating cube channels 51–52 or the helium stripe as a detection. Downloading the survey. Building a Planet Nine hunter. FITS-in-the-browser eating the whole weekend: render on the server.
- **Scores.** Impact 8. Feasibility 7. Novelty 7. Judge appeal 9. AI fit 6.

#### 4.2 Six-ink spectrum

- **Pitch.** The same patch, six detector sums, displayed as six halftone separations, plus a spectrum at the cursor.
- **User.** Someone who wants to know why 102 bands beat a single infrared picture.
- **Experience and wow.** Click a star. A coarse spectrum appears (one point per channel, or 17 points per detector). Water or methane bands are marked from a static wavelength list, not from a model guess. The wow is RW Aurigae or R Draconis changing brightness in one band more than another.
- **Jev.** Unused, or a Noul that the caption's named molecule is inside the wavelength list the team provided.
- **Hydrogen.** Turns the spectrum array into two cautious sentences. The fluxes themselves are code.
- **Pipeline.** For each detector, average the spectral-image pixels along the LVF after reading WCS-WAVE, or, faster, sample the DR1 cube's 102 channels at one sky pixel. The products guide says WCS-WAVE is for visualization and that science wavelengths should come from the spectral-WCS calibration product. For a hackathon, label the spectrum "approximate".
- **48-hour MVP.** Only if 4.1 is done. One cursor readout on the cube is a few hours. Full-resolution spectral images are a stretch.
- **Dither.** Six small wells, one ink each, like print separations. The spectrum chart itself stays a crisp line.
- **Risks.** Mis-stating a molecular detection. Using the HiPS stretch as if it were flux.
- **Scores.** Impact 7. Feasibility 5. Novelty 8. Judge appeal 8. AI fit 5.

#### 4.3 Artifact triage

- **Pitch.** The difference image is full of stripes and bad channels. A decision model sorts "look here" from "this is the helium line".
- **User.** A volunteer who would otherwise click every stripe.
- **Experience and wow.** A short list of crops, each with three probabilities.
- **Jev.** This is the product. JPEG crop in, three Nouls out. Criteria must mention channels 51–52 and the 1.083 μm stripe so the model is not guessing from a generic astronomy prompt.
- **Hydrogen.** Can describe the crop, and that description becomes part of Jev's state. Running both on every crop is slower and adds a second failure mode. Prefer Jev on the image plus a few numbers (pixel scale, channel, flag fraction).
- **Pipeline.** Code finds crops above a threshold. Models only rank the crops.
- **48-hour MVP.** A side panel on 4.1, ten cached crops. Not the whole entry.
- **Dither.** The crop is already dithered; Jev should see the raw JPEG, because dithering destroys the evidence it is judging.
- **Risks.** Presenting a probability as a discovery. Training the audience to trust a model over the flags HDU.
- **Scores.** Impact 5. Feasibility 6. Novelty 6. Judge appeal 6. AI fit 8.

#### 4.4 Planet X essay

- **Pitch.** A long explanation of the search for a ninth planet, with SPHEREx as the hero.
- **User.** A general reader.
- **Experience and wow.** A story.
- **Jev / Hydrogen.** Hydrogen can draft it. That is a gimmick relative to the challenge, which asks for a working sky tool.
- **Pipeline.** None.
- **48-hour MVP.** Do not. Fold a one-screen honest panel into 4.1.
- **Dither.** Irrelevant.
- **Risks.** Scientific overclaim. An astrophysics judge will know SPHEREx's wavelength range.
- **Scores.** Impact 3. Feasibility 8. Novelty 2. Judge appeal 2. AI fit 3.

### 5. Recommendation

Build **4.1**, with the spectrum readout from **4.2** if time remains, and the Planet X panel as a short, accurate caveat. Use Jev only in the optional triage panel, and only on raw difference crops. Use Hydrogen only to caption a code-computed spectrum and to help write the caveat.

Reasons: the data access is the best of the three challenges (anonymous SIA and cutouts, a November 2026 DR1, a documented Python path), the success test is five named objects, and WiseView shows exactly what the interaction should feel like. The 102 bands and the difference image are the novelty. The Planet X name is context. The science the pixels support is movers, brown dwarfs, comets, and variables.

---

## Where Jev, Hydrogen, and the dither UI earn their place

**Jev earns a place when the output is a probability over a rubric the team wrote.**

- Flame: rank investigations for a chosen cabin atmosphere. Inputs are short extracted records. Outputs are pillar, overlap probability, evidence score, and a check that the quote contains the number.
- Trend: pick a variable from a fixed Giovanni catalog, and check a one-line definition against the official long name. It does not decide significance.
- SPHEREx: optional triage of difference-image crops into mover, stripe, or misalignment. It does not discover a planet.
- It does not earn a place as a narrator, a video watcher, or a calculator. It has no video input. Its honest context for a single question is 32k tokens.

**Hydrogen earns a place when the source is a PDF, a figure, or a short video and the output is a structured record or a caption tied to that source.**

- Flame: read NTRS PDFs and a short flame clip into a schema. Then stop. A second pass can draft three sentences that use only schema fields.
- Trend: write the variable definition and the confounder warning from NASA's own description.
- SPHEREx: caption a spectrum that code already measured. Draft the Planet X caveat from cited pages, then a person edits the wavelength claim.
- It does not earn a place computing Mann-Kendall, aligning FITS, or ranking with an uncalibrated paragraph. Agentic video is off by default; turn it on for a short extinction clip, not for an hour of raw ISS footage. The vendor's claim of fewer fabricated numbers is not a substitute for the quote-check Noul.

**Dither earns a place when density or a two-ink residual carries the measurement, and nowhere else.**

- Flame video: ordered Bayer, matrix locked across frames, two inks for blue vs yellow, raw frame one toggle away. Error diffusion will fake flicker.
- Trend map: stipple density equals absolute slope, ink equals sign, crisp hatch equals p < 0.05. The time series stays a sharp vector.
- Infrared sky: Bayer difference image. A mover is a dipole. A helium stripe is a line. HiPS preview PNGs are the finder chart, not the measurement, because they are clipped at 0–40 MJy/sr.
- Numbers, axes, coordinates, flags, and p-values stay undithered. The look is a print of a mission notebook: off-white, black, one amber, one blue.

---

## Key findings

- PSI combustion metadata is open and keyless at `https://psi.nasa.gov/geode-py/ws/repo/search` and `.../investigations/PSI-##`. The flight archives are not demo-sized. Measured `totalFileSize`: SAME 0.66 GB, Saffire-I 12.25 GB, Saffire-II 16.93 GB, Saffire-III 35.21 GB, BASS 164 GB, BASS-II 275 GB, CFI 719 GB, FLEX 924 GB, ACME BRE 2.04 TB. All of those checked records are CC0-1.0 with `10.60555` DOIs.
- The six ACME gaseous experiments, FLEX, FLEX-2, CFI, BASS, BASS-II, SPICE, SLICE, SAME, SAME-R, DAFT, and Saffire I–III are in the PSI search index. SoFIE, LUCI, and FM2 are not separate PSI datasets. SoFIE exists as papers and as a CIR insert; the 2025 GEL abstract is the solid-fuel extinction map to show as literature.
- Rank flame work by a habitat rubric (overlap × evidence × pillar), with Jev supplying the probabilities and Hydrogen supplying the records from PDFs and short clips. Code compares numbers. Two 2026 repos already built retrieval chatbots.
- For trends, Giovanni CSV plus seasonal Mann-Kendall (pyMannKendall, MIT) meets the challenge. The hidden test is opposite signs in two regions, and a trend that is real but not significant. Jev may choose the variable from a catalog. It should not speak the p-value.
- SPHEREx DR1 (November 2026) plus QR3 are the current products. Spectral images are ~70 MB FITS MEFs, 2040×2040, six HDUs, zodiacal light not removed. The DR1 cube is 12,288 HEALPix tiles, 512×512×102, 12.9 arcsec/pixel, zodiacal light removed, channels 51–52 empty, helium stripes at 1.083 μm. Access is anonymous SIA2 and cutouts. HiPS PNGs are a display stretch.
- The five required sky tests need proper motion (Barnard's Star, WISE 0855), an unresolved brown-dwarf pair (Epsilon Indi B), and brightness change (RW Aurigae, R Draconis). A canonical ~40 K Planet Nine peaks near 70 μm. SPHEREx's job in this challenge is the blink tool and the brown-dwarf, comet, and variable science.
- Dither is a display of those measurements: locked Bayer on video and sky differences, stipples on trend maps, crisp type everywhere else.
- Space Apps allows SI, requires disclosure, watermarks generated images and video, and expects Apache-2.0 solutions with OSI-licensed dependencies and citations. Global awards need a NASA resource from that challenge's list. PSI, Giovanni or AppEEARS, and IRSA SPHEREx each satisfy that, one per challenge.
- Of the three, SPHEREx is the most shippable public demo, the trend tool is the most scientifically straightforward, and the flame desk is the strongest use of both named models if the team ranks papers and clips instead of downloading FLEX.

## Open questions

- Does a direct download of a PSI file from `psi.ndc.nasa.gov` or the AWS bucket work without a login? Metadata calls did. A byte download was not finished.
- Are FLEX and ACME BRE `totalFileSize` values current objects only, or do they include superseded versions? The ranking demo does not need the answer. A bulk mirror does.
- What is the DR1 DOI, and what is the native plate scale of the 2040×2040 spectral image? Both should be copied from the explanatory supplement.
- What are the exact SIA collection names for the deep fields and the all-sky cube? The access guide's examples confirm `spherex_dr1` and `spherex_qr3`.
- Will `gemini-4-hydrogen` accept a YouTube science clip and a 20-page NTRS PDF in one request on the free tier during the event? The docs say yes. A live call was not made.
- What are Jev's actual rate limits on a new account, and does Box-on-JPEG work well enough on a flame still to be worth using 1.14? Docs describe it. No inference was run.
- Is the Giovanni time-series API enabled for the team's Earthdata user, and does AppEEARS return a sample inside a few minutes? Both need an hour-1 spike.
- Which Gaia DR3 query (MAST or ESA) is the one the team will pin for proper motion, and what epoch should the five presets use?
- Do the FlameGuard and Flaregrain licenses allow reuse of their curated tables? Their LICENSE files were not opened. Prefer rebuilding the table from PSI JSON and NTRS.
