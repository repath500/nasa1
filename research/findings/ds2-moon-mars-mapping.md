# DS2 findings: Moon/Mars mapping, Earth analogs, and the 2026 AI stack

Research date: **2026-11-14** (Space Apps weekend is 2026-11-14/15).
Scope: three 2026 challenges — `permanent-moon-base-locations-and-mars`,
`lunar-landing-site-navigator`, `interplanetary-survival-guide-martian-map` — plus the
cross-cutting topics requested: planetary GIS tooling and licenses, Earth analog site
databases, Jev for multi-criteria ranking, and Gemini 4 Hydrogen for orbital-image
interpretation.

## Verification legend

| Mark | Meaning |
|---|---|
| **VERIFIED** | I fetched the page/API and got a live response; for data services I downloaded a sample tile, GeoTIFF, image, or JSON. |
| **PARTIAL** | The page is live but JavaScript-rendered or bot-blocked (CloudFront/403); content was confirmed from the page's own metadata, a search snippet, or a secondary official source. |
| **UNVERIFIED** | I could not directly confirm the claim. Treat as a hypothesis, not a fact. |
| **LICENSE-UNVERIFIED** | The data are publicly downloadable, but I found no explicit license file/terms. |

Method note: WebFetch is unreliable in this environment (SSL/CloudFront), so most checks
were done with `curl -sL`, HTTP status codes, directory listings, service metadata, and
small sample downloads. I did not write application code.

---

# 0. The 2026 AI stack: what is real, what it costs, and where it fits

## 0.1 Jev (TypeSafe) — the decision model the user named

**What it is.** Jev is the flagship "System One" model from **TypeSafe AI**, a startup
founded by Diogo Almeida (ex-OpenAI). It is **not a chat model**. You send a `state`
(text, JSON, or text + images) and typed questions; it returns typed answers with
calibrated probabilities, not generated prose. It launched in early access on **2026-09-15** (TypeSafe blog:
`https://typesafe.ai/blog/introducing-system-one-models-and-jev`); **Jev 1.14** shipped
**2026-10-14** (`https://docs.typesafe.ai/models`).

**VERIFIED facts (official docs):**

| Item | Detail | Source |
|---|---|---|
| Endpoint | `POST https://api.typesafe.ai/v1/systemone` | `https://docs.typesafe.ai/api` |
| Models | `jev-1.14.0` (current), `jev-1.13.0`; aliases `jev-latest`, `~typesafe/jev-latest` | `https://docs.typesafe.ai/models` |
| Price | **$0.042 per 1M input tokens** ($42 per 1B); **output tokens free** | `https://docs.typesafe.ai/models` |
| Context | **64k per request / 32k per question**; optional `TypeSafe-Danger-Zone-Long-Context: true` raises both to **262k** (slower, less accurate) | `https://docs.typesafe.ai/models` |
| Question types | **Choice** (one option + probabilities + confidence), **Score** (ordered rubric + probability-weighted position), **Noul** (probability of yes), **Box** (bounding box in an image; Jev 1.14 only) | `https://docs.typesafe.ai/primitives`, `/primitives/box` |
| Inputs | Text and **PNG/JPEG images**; no native audio/video | `https://docs.typesafe.ai/models` |
| Images | **Experimental / "Dreamer-ready"**: requires header `TypeSafe-Danger-Zone-Images: true`; accuracy may change between releases; not production-ready | `https://docs.typesafe.ai/images` |
| Latency | Vendor claims **70–500 ms** end-to-end | `https://typesafe.ai/blog/introducing-system-one-models-and-jev` |
| Access | TypeSafe console key (`https://console.typesafe.ai/keys`), early access; also on **OpenRouter** as `typesafe/jev-1.13` via `POST https://openrouter.ai/api/alpha/decisions` with an OpenRouter key; no separate TypeSafe signup needed there | `https://openrouter.ai/docs/guides/community/jev-tutorial` |
| SDKs | Python, JavaScript, raw HTTP | `https://docs.typesafe.ai/sdk` |
| Limits | 255 options per Choice, up to 10 levels per Score (docs recommend 2–10); 429 on rate limits, 529 when overloaded | `https://docs.typesafe.ai/primitives/score`; unofficial but consistent `https://jev-agent.com/api-reference` |

**What Jev is good for.** Atomic, well-scoped judgments that code can branch on:
routing, classification, rubric scoring, ranking, "does this meet the constraint?".
The official **composite scoring** pattern is exactly multi-criteria ranking: score each
dimension separately, normalize in code, apply your own weights
(`https://docs.typesafe.ai/patterns/composite-scoring`).

**What Jev is not.** It does not compute slope from a DEM, does not georeference, does
not explain its answer, and does not return a reasoning trace. It is a judge, not a
calculator. Its "can't hallucinate" claim is a **vendor claim** about type-safe outputs;
it still depends on the state and rubric you give it. Its image support is explicitly
experimental, so do not make image understanding the critical path.

**Access risk.** Early access may be gated; OpenRouter is the no-waitlist fallback but
currently exposes `typesafe/jev-1.13`, not 1.14. Budget a few dollars at most: a
1,500-token site description scored on 8 rubrics is about $0.00006 per site.

## 0.2 Gemini 4 Hydrogen — the multimodal interpreter

**What it is.** Google DeepMind's **Gemini 4 Hydrogen** launched **2026-11-12**
(`https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-hydrogen/`). It is a
Gemini 4 family model adapted from Gemini 4 Carbon, positioned for fast agentic and
multimodal work rather than deepest long-horizon reasoning (Carbon/Argon are the frontier
reasoners). It is available in the Gemini API, AI Studio, Gemini app, Search, Gemini for
business, Google Antigravity, and Google Cloud's Gemini Enterprise Agent Platform
(Vertex-lineage).

**VERIFIED facts (official docs/pricing):**

| Item | Detail | Source |
|---|---|---|
| Model ID | `gemini-4-hydrogen` | `https://ai.google.dev/gemini-api/docs/models/gemini-4-hydrogen` |
| Modalities | Input **text, image, video, audio, PDF**; output **text only**; no image generation; no Live API | `https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/4-hydrogen` |
| Context | **1,048,576 unified input+output tokens**; default synchronous output 65,536; long decode up to 1,048,576 | same |
| Thinking | `low`, `medium`, `high` (default), `xhigh`; `minimal` is rejected | same |
| Capabilities | Structured outputs, function calling, code execution, URL context, computer use, agentic video understanding, implicit context caching; no tuning | same |
| Image limits | **Per-request cap differs by doc surface:** the Cloud Gemini 4 Hydrogen model page says **3,000 images/documents combined**, while the general Gemini API image guide says **3,600 image files**; verify on the API surface you use. 258 tokens if both dimensions ≤384 px; larger images tile into 768×768 tiles at 258 tokens each; default resolution 1,120 tokens/image; max 256 MB inline, 2 GiB from Cloud Storage, 15 MiB public URL | `https://ai.google.dev/gemini-api/docs/image-understanding`; Cloud model page |
| Video/audio/PDF | ~45 min video with audio (1 h without), 10 videos/prompt; ~8.4 h audio, 1,000 audio files; 3,000 pages/documents; PDF/Office accepted | Cloud model page |
| Price | **$1.50/M input, $7.50/M output**; Batch **$0.75/$3.75**; Flex **$0.75/$3.75**; cache read $0.075; free tier available | `https://ai.google.dev/gemini-api/docs/pricing` |
| Knowledge cutoff | **March 2026** | Cloud model page |
| Benchmarks (vendor) | MKA 53.4%, Chartography 66.6%, HLE-Diamond 58.8%, Terminal-Bench 4.1 57.0%, OSWorld-2.1 77.6% | `https://deepmind.google/models/model-cards/gemini-4-hydrogen/` |

**Why it matters for planetary imagery.** Gemini 4 Hydrogen is trained for enhanced
**object detection and segmentation**, not just captioning. It can return normalized
bounding boxes (`[ymin, xmin, ymax, xmax]`, 0–1000) and segmentation masks (base64 PNG
probability maps) for objects you name. That is directly usable for boulders, craters,
scarps, dunes, skylights, and candidate sample targets — but the accuracy on
out-of-distribution planetary images is **UNVERIFIED** and must be measured on a small
labeled set before you trust it.

**Known limitations (official).** Hallucinations are possible; no georeferencing;
image coordinates are relative; small features below a few pixels are missed; the
knowledge cutoff is March 2026; it is a short-term GA release with a 45-day retirement
notice policy. Use it as an **interpreter/narrator**, never as the measurement instrument.

## 0.3 The rest of the 2026 model menu that actually fits

| Model/tool | What it does | Access/pricing | License/terms | Fit |
|---|---|---|---|---|
| **Gemini Decision 1** (`gemini-decision-1`, Decisions API) | Multimodal decision model: text, image, video, audio, PDF; **262,144-token** shared input; **1,000 questions/request**; Noul/Choice/Score; calibrated probabilities; **zero output tokens** | Gemini API/Vertex; **$0.10/M input**, free tier; no Batch API | Proprietary Google API terms | Direct Jev competitor; better for image/video-heavy ranking, Jev is cheaper/faster for text. **VERIFIED** at `https://ai.google.dev/gemini-api/docs/models/gemini-decision-1` |
| **Gemini Embedding 2** (`gemini-embedding-2`) | First multimodal embedding model: text, image, video, audio, PDF → one embedding space; 8,192 input tokens; 128–3,072 dims (recommended 768/1,536/3,072) | Gemini API; **$0.20/M text**, **$0.45/M image** (~$0.00012/image), $6.50/M audio, $12/M video; free tier | Proprietary Google API terms | Image-similarity search for Earth analogs and terrain chips. **VERIFIED** at `https://ai.google.dev/gemini-api/docs/models/gemini-embedding-2` |
| **Prithvi-EO-2.0** (IBM/NASA/Jülich) | Earth-observation foundation model (ViT-MAE, 3D spatiotemporal), pretrained on 4.2M HLS 30 m samples, 6 bands; fine-tunes for land cover, crop, flood | Hugging Face weights; TerraTorch | **Apache-2.0 weights**, MIT code | Earth analog land-cover/segmentation features. **VERIFIED** at `https://huggingface.co/ibm-nasa-geospatial/Prithvi-EO-2.0-300M` |
| **SAM 2** (Meta) | Promptable image/video segmentation | Open weights/code | Apache-2.0 (check model card) | Optional local segmentation if Gemini is too coarse; **UNVERIFIED** for planetary accuracy |
| **Gemma 4** (E2B/E4B/12B; Google DeepMind) | Open-weight, natively multimodal (text, image, video frames; audio on E2B/E4B/12B); 128K context (small) / 256K (12B); function calling, structured JSON; runs offline on phones, Raspberry Pi, Jetson | Google AI Edge / LiteRT-LM; open weights | **Apache-2.0** | Offline HUD/tablet mode: local captioning/triage when the relay link is down; not a substitute for Gemini's frontier geology reasoning. **VERIFIED** at `https://ai.google.dev/gemma/docs/core/model_card_4` |
| **CesiumJS** | Web 3D globes, Moon/Mars ellipsoids, WMTS imagery, 3D Tiles | Free/open source | **Apache-2.0** | Map engine. **VERIFIED** |
| **MMGIS** (NASA-AMMOS) | Mission-proven 2D/3D planetary GIS, COGs, STAC, TiTiler | Docker/open source | **Apache-2.0** | Mars map prior art/base. **VERIFIED** |
| **Lunaserv** (LROC/ASU) | OGC WMS 1.1.1, 352 named entries in GetCapabilities, dynamic illumination, PSR, LEND, Diviner ice depth, Cesium terrain format | Public WMS | **BSD-3-Clause** | Lunar map/illumination engine. **VERIFIED** |

## 0.4 Division of labor for a 48-hour planetary app

```
human idea + criteria/weights
        |
        +-- deterministic GIS  -> measurements: slope, horizon, illumination %,
        |   (GDAL/rasterio/       Earth visibility, temperature, ice proxies, route cost
        |    pyproj/SPICE)        (never ask an LLM to compute these)
        |
        +-- Gemini 4 Hydrogen  -> eyes + narrator: image interpretation, segmentation,
        |   (vision-language)    hazard/science target extraction, field notes, audio/video
        |
        +-- Jev (System One)   -> calibrated judge: rubric scores for qualitative criteria,
        |   (decision model)     hard-constraint Nouls, archetype Choice, confidence gating
        |
        +-- Gemini Embedding 2 -> similarity search: Earth<->Moon/Mars image chips,
            (optional)            terrain analog retrieval, clustering
```

This is the key architectural insight for 2026: **do not use a generative model for
measurement, and do not use a decision model for description.** Gemini sees and explains;
Jev judges; GIS calculates; the human owns the idea and the weights.

## 0.5 Space Apps 2026 AI/attribution rules (important, and easy to lose points on)

**VERIFIED** from the official Project Submission Guide
(`https://www.spaceappschallenge.org/resources/project-submission-guide/`), Participant
FAQs (`https://www.spaceappschallenge.org/resources/participant-faqs/`), the legal terms
(`https://www.spaceappschallenge.org/legal/`), and NASA's GitHub discussion
(`https://github.com/nasa/spaceapps/discussions/1849`):

- **At least one NASA data source from the challenge's own Resources list** is required
  for Global Awards eligibility. Other NASA/partner data are encouraged but optional.
- **AI/SI is permitted as an execution tool**, but the 2026 guide says it **should not be
  used to come up with the idea** of how to solve the challenge. The idea must be yours;
  AI can help build, analyze, visualize, and explain it.
- **Disclose where and how** AI/SI was used. The submission form has a "Use of Super
  Intelligence (SI)" field; the guide says the answer is for data collection and is not
  shown to judges, but indicators in the project are visible.
- **AI-generated images and videos must carry a visible watermark** saying they are
  AI-generated. **Audio** must be acknowledged in descriptive text and metadata.
  **Code and data** must be acknowledged in descriptive text and metadata.
- **AI-generated content must not use, contain, or modify NASA branding/design elements**
  (logos, flags, mission identifiers). Unaltered NASA photographs are generally fine.
- **Team size** for Universal Event global judging: **2–6** people, all registered for the
  same event. Local Event teams can be 1+.
- **Demo**: 30-second video **or** 7-slide deck (including title/intro). Longer submissions
  are not eligible for Global Judging.
- **Open source**: original content must be OSI-compliant; if you do not specify a license,
  NASA distributes it under Apache 2.0. **Cite every source**, including open-source ones.
  Third-party materials must be freely/publicly available or OSI-licensed.
- **2026 terminology**: the Participant FAQ says the U.S. executive branch uses **"Super
  Intelligence" / "SI"** in place of "AI" per the 2026-09-29 Executive Order. Use "SI" in
  the submission field and "AI" in normal prose if you prefer; don't be confused by the
  wording.
- **Judging criteria** (Project Submission Guide): **Impact, Creativity, Validity,
  Relevance, Presentation**, scored 1–5. The guide says the majority of evaluation is the
  written project submission, not the demo; a strong demo helps the Presentation score.

**Practical implication for this research:** the dither UI is a human design idea; Jev and
Gemini are execution/analysis tools. Disclose them, watermark any AI-generated imagery
(dither filters applied to real NASA images are not "AI-generated" if no generative model
made them — say so explicitly), and put a credits panel in the app.

---

# 1. Challenge A — Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars

## 1.1 Challenge in one paragraph

**The real ask.** Use open Earth, Moon, and Mars data to find and characterize terrestrial
places that are useful analogs for future lunar base/landing sites and Mars landing/
exploration sites — not just places that look similar, but places that share geology,
terrain, temperature, illumination, dust/aeolian processes, water/ice, habitability, caves/
subsurface conditions, or operational constraints. Present the result as a map,
visualization, similarity-ranking system, ML tool, field guide, or story, and explain
**what makes the analogy strong, where it breaks down, and how studying the site would
help exploration**.

**Hidden judging hooks.**
- "**Surprise us**": the challenge explicitly says not to rediscover Atacama/Haughton/
  Death Valley. A previously unrecognized analog scores better than a famous one.
- "**An analogy does not have to match everything**": the best submission will show a
  match/mismatch profile, not a single similarity score.
- "**Think beyond visual similarity**": use data, not photos alone.
- "**Process as well as place**": dust storms, volcanism, erosion, ice dynamics, and
  water-driven alteration can be the analog, not just the location.
- "**Scale**": a small crater, cave, or lava field inside a larger region can be the
  analog; do not treat a whole desert as one site.
- "**Earth's limits**": reduced gravity, vacuum, thin atmosphere, radiation cannot be
  reproduced; saying this explicitly is part of good analysis.
- "**Connect to exploration**": explain how the site helps test instruments, operations,
  resources, habitability, or risk reduction.

**Must include.** At least one NASA data source from the challenge Resources list; open
Earth + Moon/Mars data; a map/visualization/tool/report; characterization of one or more
sites; an explicit discussion of similarities and differences; a connection to lunar or
Mars exploration; clear credits/licenses; AI/SI disclosure if used.

## 1.2 Data and resources

### Challenge-listed resources (must credit; at least one required for Global Awards)

| Name | URL | Format | Access/auth | Size | License | Verified? | Notes |
|---|---|---|---|---|---|---|---|
| NASA Earthdata Search | https://search.earthdata.nasa.gov/ | Web catalog; download in native formats (HDF, GeoTIFF, NetCDF, CSV) | Search open; **Earthdata Login** (`urs.earthdata.nasa.gov`) for most downloads | Petabytes | NASA-led data **CC0** unless marked; some partner data restricted | **VERIFIED** page live; login page live | Primary Earth data portal. Use for MODIS/VIIRS, EMIT, ECOSTRESS, GEDI, ICESat-2, SMAP, Landsat, etc. |
| NASA Worldview | https://worldview.earthdata.nasa.gov/ | Web map; WMTS/WMS via GIBS; PNG/JPEG snapshots | No auth | Daily global imagery, petabytes behind it | NASA imagery CC0; code **NASA Open Source Agreement 1.3** | **VERIFIED** page live; license in page source | Fast visual recon and storytelling; GIBS WMTS at `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi` |
| NASA Planetary Data System (PDS) | https://pds.nasa.gov/ | PDS3/PDS4 (`.img`+`.lbl`/`.xml`), GeoTIFF, JP2, CSV, tables | No auth; HTTP directory/bundle download; ODE/PILOT search | Petabytes | NASA public domain; partner data subject to provider terms | **VERIFIED** | Long-term archive for LRO, MRO, MSL, MGS, Odyssey, etc. |
| NASA LRO (PDS Geosciences) | https://pds-geosciences.wustl.edu/missions/lro/ | PDS4 bundles; `.img`, `.tab`, GeoTIFF, JP2 | No auth | LROC alone 200+ TB; LOLA/Diviner/LEND/Mini-RF additional TB | NASA public domain | **VERIFIED**; Release 67 (2026-09) live | LROC, LOLA, Diviner, LEND, Mini-RF, Radio Science, SPICE |
| NASA LRO Diviner Lunar Data | https://pds-geosciences.wustl.edu/missions/lro/diviner.htm | PDS4; RDR, GCP, PCP, **PRP**, GHRM, EPF | No auth | PRP table ~604.8 MB; full derived bundles larger | NASA public domain | **VERIFIED**; PRP directory listing | Surface temperatures at 500 m scales; polar seasonal temps; resource products; ice stability via Lunaserv |
| CSA RADARSAT Constellation Mission (RCM) | https://donnees-data.asc-csa.gc.ca/en/dataset/rcm | SAR imagery (GeoTIFF/TIFF), metadata | **Account/EODMS**; public vs vetted profiles | Archive-scale | **RCM Public User License**: royalty-free, commercial OK, attribution required; some products restricted | **VERIFIED** pages live | C-band SAR; useful for ice, dunes, roughness, change detection; not global high-res public coverage |
| CSA RADARSAT-1 | https://donnees-data.asc-csa.gc.ca/en/dataset/radarsat1 | SAR TIFF | EODMS; also AWS Open Data | Archive-scale | **Open Government Licence – Canada** | **VERIFIED** page live | Historical C-band SAR; useful for analog change/ice studies |
| CSA SAR Python Tutorial | https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial | Python/QGIS tutorial | Public GitHub | Small | **MIT** (CSA copyright) | **VERIFIED** repo/license | Practical SAR access/visualization recipe |
| ESA Copernicus Data Space Ecosystem | https://dataspace.copernicus.eu/ | Sentinel-1/2/3/5P; SAFE, GeoTIFF, JP2; APIs | **Free account**; APIs | Petabytes | Sentinel data **free, full, open**; attribution "Copernicus Sentinel data [Year]"; portal content non-commercial | **VERIFIED** page/terms live | Best open SAR/optical combo for Earth analogs; quota/fair-use rules |
| ESA Open Science Catalog | https://opensciencedata.esa.int/ | Catalog of geoscience datasets/products/workflows | Open catalog; individual datasets vary | Varies | Individual dataset licenses; often open | **VERIFIED** page live | Discovery layer, not a single archive |
| JAXA G-Portal | https://gportal.jaxa.jp/gpr/index/index | GCOM-C/W, GPM/GSMaP, ALOS, EarthCARE, etc.; GeoTIFF/HDF/NetCDF | **Account required**; CSW + SFTP after 2026-10 renewal | Petabytes | Free, commercial OK with **attribution** and **prior notice** for commercial use; some ALOS/Himawari restricted | **VERIFIED** page/terms live | Rainfall, snow/ice, vegetation, ocean color; useful for analog climate/dust/ice |

### Extra resources that make this challenge winnable

| Name | URL | Format | Access/auth | Size | License | Verified? | Notes |
|---|---|---|---|---|---|---|---|
| USGS Terrestrial Analogs Data Portal (TADP) | https://tadp.astrogeology.usgs.gov/ | ScienceBase records; **OGC WMS/WFS/CSW**; files vary | Open | Archive-scale | USGS public domain/CC0; individual datasets vary | **VERIFIED** page live; TADP text says ScienceBase + OGC WMS/WFS/CSW | The single most relevant analog database. It is a data archive, **not a similarity engine** — that gap is the opportunity. |
| USGS PAAD (Planetary Aeolian Analog Database) | https://www.usgs.gov/data/paad-planetary-aeolian-analog-database | Tabular/geospatial data release | Open | 45 dune-field sites | **CC0 1.0** | **PARTIAL** (DOI page 403 to curl; confirmed via USGS search snippet) | Dune/aeolian analogs for Mars; core attributes (bedforms, climate, sand source, composition, lat/lon, elevation, area) |
| USGS Known Terrestrial Analog Sites for Planetary Science | https://doi.org/10.5066/P9J72921 | Point layer (shapefile/GeoJSON) | Open | Count not verified | USGS public domain (no explicit license on page) | **PARTIAL** (DOI page 403; metadata via data.gov) | Point layer of craters, dunes, volcanoes, etc.; ideal seed list for a ranking app |
| USGS Catalog of Existing Field Guides | https://www.usgs.gov/centers/astrogeology-science-center/catalog-existing-field-guides | Web/PDF field guides | Open | Small | USGS public domain | **PARTIAL** (403 to curl; search snippet) | Southwestern US, Hawai'i, Mexico analog field guides; great for "field guide" concepts |
| NASA Analog Missions | https://www.nasa.gov/analog-missions/ | Web; mission descriptions | Open | Small | NASA public domain | **VERIFIED** | Active/past analogs: CHAPEA, HERA, NEEMO, Antarctic stations, ARGOS, :envihab, Kraken, NBL, etc. |
| NASA Planetary Analog Explorer | https://science.nasa.gov/solar-system/analog-explorer/ | Interactive side-by-side gallery | Open | Small | NASA public domain | **VERIFIED** | Earth site ↔ other world pairs; good inspiration/UX reference |
| NASA Astrobiology Field Sites | https://astrobiology.nasa.gov/research-locations/ | Web list | Open | Small | NASA public domain | **VERIFIED** | Atacama, Kilauea, Mojave, etc.; habitability/biosignature angle |
| ESA Catalogue of Planetary Analogues (CAFE TN2) | https://esamultimedia.esa.int/docs/gsp/The_Catalogue_of_Planetary_Analogues.pdf | PDF (2012) | Open | Page count not checked | ESA study; cite authors | **VERIFIED** PDF live | Most comprehensive analog catalogue; static, not queryable. Good source of site names/attributes. |
| IMEWG "Mars on Earth" analogues | https://imewg.org/joint-initiatives/mars-on-earth-analogues/ | Web; database **in development** | Open | Unknown | IMEWG/agency terms | **VERIFIED** page live | Cesium-based interactive database planned; not a live public DB yet. Opportunity to build the missing tool. |
| Mars Society analog stations | http://houston.marssociety.org/Analog_Projects.html | Web table | Open | Small | Mars Society | **VERIFIED** | MDRS (Utah), Flashline (Devon Island), etc.; operational analogs |
| Portuguese Space Analogue Catalogue | https://www.ptspace.pt/wp-content/uploads/2024/07/PTspace-misso%CC%83es-analogas_v8.pdf | PDF | Open | Small | Portuguese Space Agency | **VERIFIED** PDF live | Example of a national analog catalogue; useful methodology |
| USGS STAC API | https://stac.astrogeology.usgs.gov/ | STAC 1.0 JSON; COG assets on AWS S3 | No auth | 18 collections; HiRISE/CTX DTMs, THEMIS, LOLA | **CC0-1.0** (collection license) | **VERIFIED**; sample item with COG assets | Modern, analysis-ready planetary data; excellent for Earth-analog terrain and Mars/Moon layers |
| Moon Trek WMTS | https://trek.nasa.gov/moon/ | OGC WMTS tiles (JPG/PNG) | No auth | 1,096 EQ + 396 south-polar + 173 north-polar layers | NASA public domain | **VERIFIED**; sample tiles downloaded | Moon target layers for comparison (WAC, LOLA, Diviner, LEND, Mini-RF, candidate sites) |
| Mars Trek WMTS | https://trek.nasa.gov/mars/ | OGC WMTS tiles | No auth | 146 EQ + 6 south-polar + 7 north-polar layers | NASA public domain | **VERIFIED**; sample tiles downloaded | Mars target layers for comparison (MOLA, THEMIS, TES, CTX, HiRISE, Viking, HRSC) |
| Prithvi-EO-2.0 | https://huggingface.co/ibm-nasa-geospatial/Prithvi-EO-2.0-300M | PyTorch weights; TerraTorch | Hugging Face | 300M/600M params | **Apache-2.0 weights**; MIT code | **VERIFIED** | Earth land-cover/segmentation embeddings; optional analog feature extractor |
| Gemini Embedding 2 | https://ai.google.dev/gemini-api/docs/models/gemini-embedding-2 | Embeddings API | Gemini API key | 128–3,072 dims | Proprietary Google terms | **VERIFIED** | Image/text similarity for "find Earth chips that look like this lunar chip" |

**What I would actually use in 48 hours:** TADP/Known Sites + PAAD for the seed list;
NASA Earthdata/Worldview + GIBS for Earth features; Moon/Mars Trek WMTS for target
context; LOLA/MOLA/Diviner/SWIM for target features; USGS STAC for high-resolution
terrain; Jev for ranking; Gemini for paired-image interpretation; Embedding 2 for a
"surprise me" similarity search.

## 1.3 Open-source and prior art

| Project/tool | What to borrow | License | Link |
|---|---|---|---|
| **TADP** | Analog data model, ScienceBase/OGC services, metadata fields | USGS public domain | https://tadp.astrogeology.usgs.gov/ |
| **PAAD** | Structured dune analog attributes; a model for a compact, curated analog DB | CC0 1.0 | https://www.usgs.gov/data/paad-planetary-aeolian-analog-database |
| **ESA Catalogue of Planetary Analogues** | Feature-class → site mapping (impact, volcanic, fluvial, aeolian, ice, astrobiology) | ESA study | https://esamultimedia.esa.int/docs/gsp/The_Catalogue_of_Planetary_Analogues.pdf |
| **IMEWG Mars on Earth** | Cesium-based site registry concept | IMEWG | https://imewg.org/joint-initiatives/mars-on-earth-analogues/ |
| **NASA Planetary Analog Explorer** | Side-by-side "Earth vs other world" UX | NASA public domain | https://science.nasa.gov/solar-system/analog-explorer/ |
| **NASA Astrobiology Field Sites** | Site narratives, habitability framing | NASA public domain | https://astrobiology.nasa.gov/research-locations/ |
| **Prithvi-EO-2.0** | Earth feature embeddings/land-cover model | Apache-2.0 weights | https://github.com/NASA-IMPACT/Prithvi-EO-2.0 |
| **Gemini Embedding 2** | Cross-modal image/text similarity | Proprietary API | https://ai.google.dev/gemini-api/docs/models/gemini-embedding-2 |
| **QGIS / GDAL** | Zonal stats, reprojection, slope, map production | GPL-2 / MIT | https://qgis.org/ ; https://gdal.org/ |
| **CesiumJS / MMGIS** | 3D Earth/Moon/Mars globes and mission-style map UI | Apache-2.0 | https://github.com/CesiumGS/cesium ; https://github.com/NASA-AMMOS/MMGIS |
| **Space Apps 2018 "Mission to the Moon" (Galgos PUC-Rio)** | Landing-site scoring + rover routing; shows judges reward decision-support framing | Public project page | https://2018.spaceappschallenge.org/challenges/universe-beauty-and-wonder/mission-mars/teams/galgos-puc-rio/project/ |
| **Space Apps 2018 "Space Whales"** | Landing-site criteria (slope, sunlight, geology, water) | Public project page | https://2018.spaceappschallenge.org/challenges/universe-beauty-and-wonder/mission-mars/teams/space-whales/project/ |
| **Space Apps 2022 "Mars 3D Home"** | Mars habitat/resource storytelling; Best Mission Concept | Public project page | https://www.spaceappschallenge.org/blog/2022-global-winners/ |

**Prior-art gap.** Existing analog resources are either static catalogues (ESA PDF),
data archives without a similarity engine (TADP), point layers without characterization
(Known Sites), or in-development registries (IMEWG). No widely known tool lets a user
pick a lunar/Mars target and systematically rank Earth analogs by multiple weighted
criteria with an explicit match/mismatch profile. That is the opening.

## 1.4 Project concepts

### A1. **Analog Atlas** — "Find Earth's best stand-ins for a Moon or Mars site — and where the analogy breaks."

**Pitch line.** Pick a target (Shackleton, Jezero, a lava-tube skylight); Analog Atlas ranks
terrestrial sites by physics and process, not looks, and shows the match/mismatch profile.

**Target user.** Mission planners choosing analog field campaigns; instrument teams;
educators; science communicators.

**Core experience / demo "wow".** A 3D/2D globe with a target panel (Moon/Mars layers)
and a ranked list of Earth sites. Selecting a site opens a "twin card": paired dithered
imagery, a radar chart of six criteria, and a plain-language "why this is analogous / where
it breaks" brief. The wow moment: an unexpected site (e.g., a high-altitude Andean salt
flat, an Icelandic lava field, or a Namib dune field) outranks the obvious Atacama on a
specific dimension, and the app explains exactly why.

**How it uses 2026 AI.**
- **Jev:** one `Score` per qualitative dimension (geology, terrain, climate, dust/aeolian,
  water/ice, habitability/operations, analog fidelity) + `Noul` hard gates (access,
  protection, logistics) + `Choice` archetype. State = normalized feature JSON + a short
  site description + optional image. Output = calibrated scores/confidence. Code
  normalizes and weights; confidence gates "needs review".
- **Gemini 4 Hydrogen:** paired-image interpretation (Earth vs Moon/Mars) with structured
  JSON: terrain units, hazards, evidence, mismatch notes; writes the field-note narrative.
- **Gemini Embedding 2 (optional):** embed image chips to retrieve visually/structurally
  similar Earth candidates before the expensive interpretation step.
- **Prithvi-EO-2.0 (optional):** land-cover/segmentation features for Earth candidates.

**Data pipeline.**
1. Seed candidates from TADP/Known Sites/PAAD + a hand-curated list.
2. Pull Earth features: NASADEM/Copernicus DEM (slope, roughness), MODIS/VIIRS LST,
   EMIT (mineralogy), GEDI/ICESat-2 (canopy/ice/elevation), SMAP (soil moisture), MODIS
   AOD (dust), Landsat/Sentinel-2 (optical), Sentinel-1/RCM (SAR).
3. Pull target features: LOLA (Moon slope/illumination), Diviner (temperature), LEND
   (WEH), Mini-RF (CPR), MOLA/THEMIS/TES/CRISM/SWIM (Mars).
4. Normalize each criterion to 0–1 with direction; compute deterministic similarity
   (weighted distance/cosine) as a baseline.
5. Jev scores the qualitative/mismatch dimensions; combine in code with transparent
   weights; produce a Pareto frontier and a sensitivity band.
6. Gemini writes the paired-site brief; UI renders dithered cards and a map.

**48-hour MVP.**
- 1 target (e.g., Shackleton or Jezero), 10–12 Earth candidates, 6 criteria.
- Precompute all features into a static JSON; no live Earthdata calls in the demo.
- 2D MapLibre/Leaflet map + ranked cards + 3 paired-image briefs.
- Jev ranking (one request per site, ~12 requests); Gemini 6–10 image interpretations.
- A "surprise me" button that shows the highest-novelty non-famous site.

**Stretch.** User-defined target coordinates; global candidate search; Embedding 2
retrieval; Prithvi features; field-guide PDF export; multi-target comparison.

**Dither UI fit.** A 1-bit "match/mismatch" matrix (filled/half-tone/empty cells), paired
halftone Earth/Moon images, stipple density for similarity, amber accent for "caution:
analogy breaks here". This is mission-control, not retro kitsch.

**Risks.** Feature comparability (Earth vs Moon/Mars sensors); missing Earth data; false
positives; overclaiming "analog"; license/attribution mistakes; Jev rubric sensitivity.
Mitigation: show confidence and mismatch, cite every dataset, keep the human in the loop.

**Scores (1–10):** Impact **9**, Feasibility **7**, Novelty **8**, Judge appeal **9**, AI fit **8**.

---

### A2. **Polar Twins** — "The coldest places on Earth as Moon/Mars testbeds."

**Pitch line.** A focused comparison of five extreme-cold Earth sites (Antarctic Dry
Valleys, Devon Island, Atacama, Mauna Kea, Iceland/Svalbard) against lunar south-polar
and Mars mid-latitude sites, using temperature, illumination, ice, and terrain data.

**Target user.** Analog campaign planners; cold-regions scientists; educators.

**Core experience / demo "wow".** A "twin" view: Earth site on the left, Moon/Mars site
on the right, synchronized layers (temperature, slope, ice, illumination). A "day in the
life" timeline shows how the analog diverges (Earth day/night vs lunar 29.5-day cycle).

**How it uses 2026 AI.** Jev scores environmental similarity per dimension; Gemini writes
the "what you can/can't test here" brief and interprets paired images; Embedding 2 optional.

**Data pipeline.** MODIS/VIIRS LST, ERA5 (via Copernicus), ICESat-2, Sentinel-1, ArcticDEM/
REMA; Diviner/LOLA/LEND/Mini-RF; MOLA/THEMIS/SWIM. Precompute seasonal profiles.

**48-hour MVP.** 5 Earth sites × 2 target sites; 4 criteria; 2D map; 5 twin cards; one
timeline; Jev ranking; 4 Gemini briefs.

**Stretch.** Add radiation/UV; add biological extremophiles; add field logistics.

**Dither UI fit.** 1-bit temperature bands, halftone ice, dot-density illumination;
snow/ice whitespace; amber alerts for "not analogous".

**Risks.** Earth cold-desert data gaps; seasonal mismatch; overgeneralizing.

**Scores:** Impact **8**, Feasibility **8**, Novelty **7**, Judge **8**, AI **7**.

---

### A3. **Lava Tube Analog Hunter** — "Find Earth caves that train astronauts for lunar and Martian lava tubes."

**Pitch line.** A cave/lava-tube analog finder that combines Earth DEM/lidar/SAR with
lunar pits and Martian cave candidates, ranking sites by skylight geometry, tube size,
access, and geological similarity.

**Target user.** Cave/planetary geology teams; astronaut training; ISRU/shelter planners.

**Core experience / demo "wow".** A map of known lunar pits (Mare Tranquillitatis,
Marius Hills) and Mars cave candidates next to Earth lava tubes (Lava Beds, Craters of the
Moon, Kilauea, Iceland, Lanzarote). Selecting a site shows a cross-section, skylight
diameter, slope, and a "what you could test" brief. The wow: a previously underused
terrestrial tube matches the lunar pit's skylight/slope signature better than the famous
tourist caves.

**How it uses 2026 AI.** Gemini detects/segments skylights, pit rims, and tube openings in
orbital imagery (bounding boxes/masks); Jev scores analog fidelity and operational
suitability; Embedding 2 retrieves similar cave morphologies.

**Data pipeline.** LROC NAC/WAC, LOLA DEM, Mini-RF; HiRISE/CTX/MOLA; Earth: NASADEM/
Copernicus DEM, GEDI/ICESat-2, Sentinel-1, airborne lidar where available; TADP/known
sites. Precompute cave/pit features.

**48-hour MVP.** 10 lunar/Mars pits + 20 Earth caves; 2D map; 6 cards; Gemini 10 image
interpretations; Jev ranking.

**Stretch.** 3D tube models; thermal stability; radiation shielding; field guide.

**Dither UI fit.** 1-bit cave cross-sections, halftone skylights, stipple for shadow;
strong black/white contrast for underground.

**Risks.** Cave data scarcity; semantic ambiguity ("cave" vs "lava tube"); AI detection
accuracy; access/permits.

**Scores:** Impact **8**, Feasibility **6**, Novelty **9**, Judge **8**, AI **8**.

---

### A4. **Analog Field Guide Generator** — "A field guide for the best Earth analog of your lunar/Mars site."

**Pitch line.** Pick a target; get a generated, data-grounded field guide to its best
Earth analog: geology, logistics, instruments, risks, permits, and a 3-day campaign plan.

**Target user.** Analog mission leads; educators; science communicators; instrument teams.

**Core experience / demo "wow".** A polished dithered field guide (web + PDF) with maps,
site cards, "why here", "what to test", "what not to conclude", and a packing list. The
wow: the guide cites the exact datasets and shows a confidence/uncertainty box.

**How it uses 2026 AI.** Gemini writes the guide from structured data + TADP/ESA catalogue
text + image interpretation; Jev scores completeness/validity and flags unsupported claims;
human edits. Embedding 2 optional for site retrieval.

**Data pipeline.** TADP/Known Sites/ESA catalogue + Earthdata features + Moon/Mars target
features; a template with structured sections; Gemini structured output; Jev rubric.

**48-hour MVP.** 1 target, 1 analog, 1 guide (6 sections), 1 map, 3 images; PDF export.

**Stretch.** Multi-site guides; itinerary/logistics; permit database; translations.

**Dither UI fit.** 1-bit manual/field-guide aesthetic: black/white plates, halftone photos,
monospace tables, "equipment checklist" grids. Very strong for storytelling.

**Risks.** Generative text hallucinating logistics/permits; must label AI-generated text
and verify facts; low visual interactivity.

**Scores:** Impact **7**, Feasibility **9**, Novelty **7**, Judge **7**, AI **9**.

---

### A5. **Dust Bowl** — "Aeolian process analogs between Earth dune fields and Mars."

**Pitch line.** Use PAAD + Earthdata + Mars THEMIS/MARCI/MOLA to compare dune-field
morphology, activity, and wind regimes, and rank Earth dune fields as Mars analog sites.

**Target user.** Mars aeolian scientists; PAAD contributors; educators.

**Core experience / demo "wow".** A dune-field comparator: slip-face orientation, crest
spacing, sand composition, activity, wind regime; Mars vs Earth side-by-side; a "dust
storm season" timeline.

**How it uses 2026 AI.** Gemini interprets dune patterns/segments crests; Jev scores
analog fidelity per attribute; Embedding 2 retrieves similar dune textures.

**Data pipeline.** PAAD attributes, Sentinel-2/Landsat, NASADEM, ERA5 winds, MODIS AOD;
Mars: CTX/HiRISE, THEMIS, MOLA, MARCI, TES composition. Precompute dune metrics.

**48-hour MVP.** 8 Earth dune fields, 4 Mars dune fields, 5 attributes, 2D map, 6 cards.

**Stretch.** Global dune-field search; activity detection; wind-tunnel links.

**Dither UI fit.** 1-bit dune crest maps, halftone sand, stipple for activity; wind arrows.

**Risks.** Narrow audience; attribute mismatch; AI dune segmentation accuracy.

**Scores:** Impact **7**, Feasibility **7**, Novelty **7**, Judge **7**, AI **7**.

## 1.5 Recommendation for Challenge A

**Build A1 Analog Atlas.** It is the only concept that directly answers "search globally
and systematically" and "surprise us", uses all three data domains (Earth, Moon, Mars),
and has a clear 48-hour MVP. The match/mismatch card is the judging differentiator: it
shows scientific maturity (the challenge explicitly asks where the analogy breaks) and
gives the dither UI a meaningful job. Add A3 Lava Tube Hunter as a "surprise" second
scenario if the team has a cave/geology enthusiast; it is the most novel angle and pairs
well with Gemini segmentation.

**Why not the others:** A2 is strong but narrow (cold analogs only); A4 is feasible but
risks becoming an AI-written brochure; A5 is scientifically neat but too narrow for a
global challenge. A1 can absorb A2/A5 as filter presets ("polar", "aeolian") without
extra scope.

**Winning narrative:** "We didn't just find a place that looks like the Moon. We built a
transparent, multi-criteria analog ranker that tells you what matches, what doesn't, and
what you can actually test there — and it found an analog you didn't expect."

---

# 2. Challenge B — Lunar Landing Site Navigator

## 2.1 Challenge in one paragraph

**The real ask.** Build an intuitive tool that lets mission planners, educators, and the
public compare lunar landing sites and dates quickly, visualizing **Sun and Earth positions
relative to the horizon** to assess **solar power generation** and **direct-to-Earth (DTE)
communication windows**. The south pole is the hard case: extreme illumination and Earth-
visibility variations over lunar days/seasons; small changes in site or date change
feasibility dramatically; existing tools (QuickMap, Moon Trek, JPL Horizons) are powerful
but built for detailed analysis, not rapid scenario comparison.

**Hidden judging hooks.**
- "**Rapid comparison**" is the gap, not raw data. A single-site sun-angle tool is not
  enough; you need side-by-side/matrix comparison of sites × dates.
- "**Sun and Earth relative to the horizon**": show both, not just solar elevation.
- "**Time remaining before sunset or Earthset**": a countdown is a memorable UX win.
- "**Power and communication assessment**": solar elevation/duration + Earth visibility
  windows; a simple, transparent power model beats a black box.
- "**Topography matters**": horizon must use LOLA terrain, not a smooth sphere; no
  atmospheric refraction on the Moon.
- "**Temporal dynamics**": timeline/animation over a lunar day or multiple days.
- "**Curated sites + custom coordinates**": Apollo, CLPS, commercial, international, and
  user lat/lon.
- "**What if launch slips?**": date flexibility is the core mission-planning pain.
- "**Accessibility**": mission planners + educators + public; progressive disclosure.

**Must include.** Interactive site selection/comparison; date/time selection; Sun and
Earth positions relative to the horizon; power and communication metrics; multiple
visualization approaches; temporal dynamics; accessibility across skill levels; at least
one challenge-listed NASA source (QuickMap, Moon Trek, or Horizons).

## 2.2 Data and resources

### Challenge-listed resources

| Name | URL | Format | Access/auth | Size | License | Verified? | Notes |
|---|---|---|---|---|---|---|---|
| LROC QuickMap | https://quickmap.lroc.asu.edu/ | Web 2D/3D map; layers; draw/search; data cube export | No auth | LROC archive 200+ TB behind it | LROC data NASA public domain; QuickMap UI ASU/ACT (not open source); **Lunaserv** engine BSD-3 | **VERIFIED** page live; Lunaserv live | Best lunar browse/analysis UI. It has slope, illumination, PSR, LEND, Diviner, Mini-RF, NAC/WAC; but it is single-scenario and complex. No documented public API found; use Lunaserv WMS/PDS for programmatic access. |
| Moon Trek | https://trek.nasa.gov/moon/ | Web 2D/3D; OGC WMTS; Sun-angle tool; elevation profile | No auth | 1,096 EQ + 396 SP + 173 NP layers | NASA public domain | **VERIFIED**; sample WMTS tile downloaded | Great global/polar context; WMTS is the reusable API. Sun-angle tool exists but is single-site and not a comparison workflow. |
| JPL Horizons System | https://ssd.jpl.nasa.gov/horizons/ | Web; **API** (`https://ssd.jpl.nasa.gov/api/horizons.api`), text/JSON | No key | Ephemeris on demand | NASA/JPL public domain | **VERIFIED**; Sun/Earth az/el tables downloaded | Authoritative Sun/Earth positions; supports `CENTER='coord@301'` and `SITE_COORD='lon,lat,alt'`; airless/no refraction. Use for validation/ground truth. |
| CSA Moon Exploration | https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/ | Web portal | No auth | Small | CSA terms | **VERIFIED** | Context on Canadian lunar contributions/Artemis; useful for international framing, not a data source. |

### Extra resources

| Name | URL | Format | Access/auth | Size | License | Verified? | Notes |
|---|---|---|---|---|---|---|---|
| Lunaserv WMS (LROC/ASU) | https://wms.im-ldi.com/ ; docs https://lunaserv.im-ldi.com/about.html | **OGC WMS 1.1.1**; PNG/TIFF/JPEG/VICAR/32-bit TIFF/`application/x-cesium-terrain` | No auth | 352 named entries in GetCapabilities; 640 KB capabilities | **BSD-3-Clause** (Lunaserv) | **VERIFIED**; `luna_illumination` PNG and terrain response downloaded | The killer API: dynamic Sun illumination (`TIME`), polar illumination %, PSR, LEND WEH, Diviner ice depth, WAC DTM numeric, NAC PSR mosaics. Also `mars_illumination`. |
| LOLA PDS | https://pds-geosciences.wustl.edu/missions/lro/lola.htm | PDS4; `.img`+`.xml`, JP2; GDR/SLDEM | No auth | 4.25 GB per 128 ppd tile; 3.68 GB per 5 m polar DEM; SLDEM global 2.83 GB | NASA public domain | **VERIFIED**; directory listings/sizes | The elevation backbone for horizon/slope. Polar 5/10/20/30/60 m; global 4/16/128/256/512 ppd; SLDEM2015 global 128 ppd (~237 m) 2.83 GB + 512 ppd tiles (~59 m). |
| Diviner PDS | https://pds-geosciences.wustl.edu/missions/lro/diviner.htm | PDS4; RDR, GCP, PCP, **PRP**, GHRM, EPF | No auth | PRP table 604.8 MB | NASA public domain | **VERIFIED**; PRP listing | Thermal context; polar summer/winter avg/max/min; rock abundance; ice stability (via Lunaserv). |
| LEND PDS | https://pds-geosciences.wustl.edu/missions/lro/lend.htm | PDS4; EDR/RDR | No auth | Archive-scale | NASA public domain | **VERIFIED** | Water-equivalent hydrogen 75–90°; ice proxy. |
| Mini-RF PDS | https://pds-geosciences.wustl.edu/missions/lro/mrf.htm | PDS4/PDS3; global mosaics, bistatic | No auth | Archive-scale | NASA public domain | **VERIFIED** | CPR 15 m/px; roughness/ice proxy; Malapert layer in Moon Trek. |
| LROC PDS | https://pds.lroc.asu.edu/ | EDR/CDR/RDR; NAC/WAC; DTMs | No auth | 200+ TB | NASA public domain | **VERIFIED** | NAC 0.5 m/px, WAC 100 m/px; NAC DTM 1–5 m; monthly/quarterly releases. |
| USGS LGRS Artemis III grids | https://doi.org/10.5066/P1MEQ6UK | Shapefiles; 1 km/100 m/10 m; LTM/LPS projections | Open | 9 regions | **CC0 1.0** | **PARTIAL** (USGS DOI page 403; USGS search snippet + ScienceBase record) | Astronaut-readable Lunar Grid Reference System grids for the 9 downselected regions. Perfect for a "real navigation" layer. |
| NASA 2024 Artemis III regions | https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/ | Web release | Open | Small | NASA public domain | **VERIFIED** | 9 regions, no priority order; diverse geology; flexibility. |
| NASA 2022 Artemis III regions | https://www.nasa.gov/news-release/nasa-identifies-candidate-regions-for-landing-next-americans-on-moon/ | Web release | Open | Small | NASA public domain | **VERIFIED** | 13 regions; each ~15×15 km; landing site ~100 m radius; within 6° of pole. |
| NASA SVS Artemis III visualizations | https://svs.gsfc.nasa.gov/5013 | Videos/images | Open | Small | NASA public domain | **VERIFIED** | 13-region flyovers; good for demo/story. |
| NTRS Artemis III site-selection update | https://ntrs.nasa.gov/citations/20250011660 | Abstract | Open | Small | NASA public domain | **VERIFIED** | Documents 13→9 downselection; criteria; 5.75–6.25-day surface stay; NRHO/DTE; seasonal illumination shifts. |
| Artemis III current status | https://www.nasa.gov/missions/artemis/nasas-artemis-iii-mission-to-test-future-moon-lander-operations/ | Web release (2026-10-23) | Open | Small | NASA public domain | **VERIFIED** | Artemis III is now a **2027 LEO test** with Blue Origin/SpaceX lander test articles; first crewed landing is **Artemis IV in 2028**. |
| Artemis IV acceleration | https://www.nasa.gov/missions/artemis/nasa-shares-plans-to-accelerate-artemis-return-to-moon/ | Web release (2026-11-04) | Open | Small | NASA public domain | **VERIFIED** | Confirms Artemis III 2027 LEO, Artemis IV 2028 landing; two ~2-hour moonwalks for initial surface missions. |
| Artemis II | https://www.nasa.gov/mission/artemis-ii/ | Web | Open | Small | NASA public domain | **VERIFIED** | April 1–10, 2026 (PDT; April 11 UTC) crewed lunar flyby; context for "why now". |
| SPICE toolkit / NAIF | https://naif.jpl.nasa.gov/naif/ | C/Fortran/Python APIs; kernels | Free | Kernels vary | **NAIF/SPICE license**: free, commercial OK, but redistribution restrictions; not OSI | **VERIFIED** rules page | High-fidelity geometry/libration; `spiceypy` wrapper MIT. For 48h, Horizons is easier. |
| CesiumJS | https://github.com/CesiumGS/cesium | JS library; 3D Tiles/WMTS | Free | ~MB | **Apache-2.0** | **VERIFIED** | `Ellipsoid.MOON`, `Ellipsoid.MARS`; WMTS imagery; 3D Tiles. |
| Cesium Moon | https://cesium.com/platform/cesium-ion/content/cesium-moon/ | 3D Tiles | Cesium ion account | Global; 5 m polar terrain | Cesium ion terms; free Community non-commercial; commercial $149/mo | **VERIFIED** page/asset ID 2684829 | Beautiful 3D lunar terrain; licensing caveat. |
| MMGIS | https://github.com/NASA-AMMOS/MMGIS | Web app; 2D/3D; COGs/STAC | Open source; Docker | App + data | **Apache-2.0** | **VERIFIED** | Mission-proven; can be a base for site planning. |
| USGS STAC | https://stac.astrogeology.usgs.gov/ | STAC/COG | No auth | 18 collections | **CC0-1.0** | **VERIFIED** | LOLA shot observations; Kaguya DTMs; good for terrain/validation. |
| QuickMap examples | https://lroc-examples.quickmap.io/ | Web examples | Open | Small | ASU/LROC | **VERIFIED** | Shows QuickMap's "plan your Moon base", shadow casting, slope/illumination workflows. |

**Current-status caveat that matters for framing.** As of **2026-10**, NASA has redefined
**Artemis III as a 2027 low-Earth-orbit test** of Orion with Blue Origin/SpaceX lander test
articles; the first crewed lunar landing is **Artemis IV, targeted for 2028**. The **nine
2024 candidate regions are Artemis III-specific** and NASA has not said whether they carry
over to Artemis IV. Therefore:
- Do **not** title the app "Artemis III Landing Site Selector" only.
- Frame it as a **south-pole landing/site navigator for Artemis IV, CLPS, commercial, and
  future base planning**, with the 9 regions as a curated "candidate regions (2024)" set.
- Judges who know the program will reward this nuance; teams that say "Artemis III lands
  at these sites in 2026" will look out of date.

### 2.2a The Artemis candidate regions, precisely

**2022 — 13 candidate regions** (NASA, 2022-08-19): Faustini Rim A, Peak Near Shackleton,
Connecting Ridge, Connecting Ridge Extension, de Gerlache Rim 1, de Gerlache Rim 2,
de Gerlache-Kocher Massif, Haworth, Malapert Massif, Leibnitz Beta Plateau, Nobile Rim 1,
Nobile Rim 2, Amundsen Rim. Each region is about **15×15 km**; a landing site inside a
region has an approximate **100 m radius**; all are within **6° of the south pole**.

**2024 — 9 downselected regions** (NASA, 2024-10-28; NTRS 2026 update): **Peak near
Cabeus B, Haworth, Malapert Massif, Mons Mouton Plateau, Mons Mouton, Nobile Rim 1,
Nobile Rim 2, de Gerlache Rim 2, Slater Plain**. The downselection considered end-to-end
mission availability (launch opportunities, transit/rendezvous geometry, NRHO access),
terrain safety (slope variability, craters, blocks, rough terrain), Earth visibility for
DTE, and illumination robustness across mission windows. Surface stay is ~5.75–6.25 days
depending on epoch; south-polar illumination shifts ~2–3 weeks per year.

**Coordinates caveat.** NASA published **names, not official point coordinates**. The USGS
LGRS data release (CC0) provides 1 km/100 m/10 m navigation grids for the nine regions and
is the best public footprint source; a community Zenodo dataset (CC-BY-4.0) provides
approximate locations but is **not official**. For the app, let users pick a point inside
the USGS grid/region and clearly label it "user-selected point", not "NASA landing site".

| Region (2024) | Why it is interesting | Data notes |
|---|---|---|
| Peak near Cabeus B | High, illuminated peak near a PSR; volatile access | LOLA 5/10 m, Diviner, LEND; LROC NAC coverage |
| Haworth | Southern massif; long illumination/PSR juxtaposition | LOLA 5 m, Haworth site layers in Moon Trek |
| Malapert Massif | Prominent massif; Earth visibility/illumination trade-offs | LOLA 5 m; Mini-RF CPR 15 m; NAC 0.67 m mosaic |
| Mons Mouton / Plateau | Broad high terrain; base/landing trade-offs | LOLA 5/10 m; Diviner; LROC |
| Nobile Rim 1 / 2 | Crater-rim terrain; diverse geology | Site06/DM2 layers in Moon Trek |
| de Gerlache Rim 2 | Rim terrain near PSRs | Site11 layers; LOLA 5 m |
| Slater Plain | High-plain site; different terrain class | LOLA 5/10 m; check coverage |

### 2.2b LOLA / LROC / PDS deep dive (illumination and slope maps)

**LOLA (Lunar Orbiter Laser Altimeter).** LOLA is the elevation backbone. The PDS
Geosciences archive (Release 67, 2026-09) provides:
- **Global gridded DEMs** at 4, 16, 128, 256, and 512 pixels/degree (ppd). The 128 ppd
  cylindrical file is **4.25 GB**; 256/512 ppd are tiled at ~4.25 GB per tile. 4 ppd is
  ~4 MB; 16 ppd is ~66 MB. 128 ppd is ~237 m at the equator; 512 ppd is ~59 m.
- **Polar DEMs** (south and north): 45° at 100 m (3.32 GB), 60° at 60 m (3.85 GB), 75° at
  30 m (3.72 GB), 80° at 20 m (3.70 GB), 85° at 10 m (3.68 GB), 87.5° at 5 m (3.68 GB).
  Lower-resolution variants (200/400 m, 120/240 m, 60/120 m, 40/80 m, 20/40 m, 10/20 m)
  are available for faster work.
- **SLDEM2015** (LOLA + SELENE/Kaguya Terrain Camera): 128 ppd global 60S–60N, **2.83 GB**;
  512 ppd tiles (~59 m) for regional work.
- **Formats:** PDS4 `.img` + `.xml`, plus JP2 and browse; `GDAL` PDS4 driver reads them.
- **Derived products:** slope (from DEM), hillshade, color slope masks (<5°, <10°, <15°,
  <20°, >20°), roughness, PSR masks, polar illumination percentage.
- **Access:** PDS Geosciences Node directory listings (no auth), LOLA Data Node at MIT
  (`imbrium.mit.edu`), Moon Trek WMTS, Lunaserv WMS.
- **Why it matters:** horizon profiles, slope safety, illumination fraction, and terrain
  occlusion all come from LOLA. A 5 m polar DEM is the difference between a real horizon
  and a cartoon.

**LROC (Lunar Reconnaissance Orbiter Camera).** LROC is the optical/context backbone:
- **WAC** (Wide Angle Camera): global mosaic at ~100 m/px (303 ppd); color and morphology
  products; 7 bands.
- **NAC** (Narrow Angle Camera): ~0.5 m/px; targeted images; NAC stereo DTMs at 1–5 m
  post spacing; NAC mosaics for candidate sites (e.g., 0.67 m/px Malapert, 1 m/px south
  pole).
- **Archive:** EDR/CDR/RDR; 200+ TB reported (2013 LPSC; larger now); monthly EDR/CDR
  releases, quarterly RDR.
- **Access:** LROC PDS node (`https://pds.lroc.asu.edu/`), QuickMap, Lunaserv WMS.
- **Why it matters:** boulders, craters, skylights, surface texture, and visual context;
  the optical layer that makes the slope/illumination layers interpretable.

**Diviner.** Surface temperature at 500 m horizontal scales; PDS4 derived bundles:
Global Cumulative Products (GCP), Polar Cumulative Products (PCP), **Polar Resource
Products (PRP)**, Regional Cumulative Products (RCP), Global High-Resolution Mosaics
(GHRM), Emission Phase Function (EPF). The PRP table is **604.8 MB**. Key polar products:
summer/winter average/max/min temperature, rock abundance, ice stability depth (via
Lunaserv). Why it matters: thermal margins, ice stability, and hardware survival.

**LEND.** Neutron detector; water-equivalent hydrogen (WEH) maps at 75–90°; PDS4 EDR/RDR.
Lunaserv layer `luna_lend_weh` encodes up to ~0.5 wt% (south) / ~0.4 wt% (north). Why it
matters: a direct ice proxy, complementing PSR masks and Mini-RF CPR.

**Mini-RF.** Synthetic aperture radar; CPR (circular polarization ratio) at ~15 m/px;
global mosaics + bistatic data; PDS4/PDS3. High CPR can indicate rough/ice-rich surfaces
but is not definitive. Why it matters: a radar check on ice/roughness before you trust a
PSR-adjacent site.

**PDS access model.** PDS Geosciences (WUSTL), Imaging (JPL), Atmospheres (NMSU), NAIF, and
PPI nodes expose HTTP directory listings and PDS4 bundles; no auth; public domain. Search
via PDS Data Set Search, the Orbital Data Explorer (ODE), and PILOT. Sizes are large
(LOLA 128 ppd 4.25 GB; LROC 200+ TB), so preprocess offline and ship tiles/COGs, not raw
archives.

**Illumination and slope maps — the practical stack:**
1. LOLA DEM → `gdaldem slope` / hillshade → COG/tiles.
2. LOLA + Horizons Sun vector → ray-marched horizon → direct-sun mask at each time step.
3. Lunaserv `luna_polar_illumination_pct` (88–90°, 12 lunations) for the long-term average.
4. Lunaserv `luna_illumination` (`TIME`) for an instant visual at a chosen date/time.
5. Moon Trek `LRO_LOLA_Illumination_SPole65S_240m` (PSR) and `ColorSlope_*` layers for
   context.
6. Diviner temperatures and LEND WEH for thermal/ice context.
7. Mini-RF CPR for radar roughness/ice sanity check.
This is enough for a credible, transparent site comparison without building a flight-
dynamics tool.

## 2.3 Open-source and prior art

| Project/tool | What to borrow | License | Link |
|---|---|---|---|
| **LROC QuickMap** | Layer catalog, slope/illumination/PSR workflows, data cube export, "plan your Moon base" | UI proprietary; Lunaserv BSD-3 | https://quickmap.lroc.asu.edu/ |
| **Lunaserv** | WMS 1.1.1, dynamic illumination, polar illumination %, PSR, LEND, Diviner ice depth, Cesium terrain | **BSD-3-Clause** | https://lunaserv.im-ldi.com/ |
| **Moon Trek** | WMTS layer catalog, Sun-angle tool, elevation profile, 3D | NASA public domain | https://trek.nasa.gov/moon/ |
| **JPL Horizons** | Authoritative Sun/Earth az/el; observer tables; API | NASA public domain | https://ssd.jpl.nasa.gov/horizons/ |
| **SPICE / SpiceyPy** | High-fidelity geometry, libration, sub-solar point, camera pointing | NAIF license / MIT wrapper | https://naif.jpl.nasa.gov/naif/ ; https://github.com/AndrewAnnex/SpiceyPy |
| **USGS LGRS** | Astronaut-readable grid coordinates for the 9 regions | CC0 1.0 | https://doi.org/10.5066/P1MEQ6UK |
| **NASA SVS 5013** | Region flyovers/visualizations | NASA public domain | https://svs.gsfc.nasa.gov/5013 |
| **CesiumJS / Cesium Moon** | 3D lunar globe, terrain, WMTS | Apache-2.0 / Cesium ion terms | https://github.com/CesiumGS/cesium ; https://cesium.com/platform/cesium-ion/content/cesium-moon/ |
| **MMGIS** | Mission-style 2D/3D planning UI | Apache-2.0 | https://github.com/NASA-AMMOS/MMGIS |
| **Space Apps 2022 "Brute Force"** | Lunar landing spatial optimization; shows the theme is judge-friendly | Public project page | https://www.spaceappschallenge.org/blog/2022-global-winners/ |
| **Space Apps 2023 "Lunar Trek"** | 3D Moon + data storytelling; Best Use of Science | Public repo/project | https://github.com/mohammadhelaly/lunar-trek |
| **Space Apps 2024 lunar winners** | 3D lunar visuals/seismic storytelling | Public project pages | https://www.spaceappschallenge.org/blog/the-nasa-space-apps-challenge-live-global-winners-announcement/ |

**Prior-art gap.** Existing tools answer "what is the sun angle at this site at this time?"
(QuickMap, Moon Trek, Horizons, Lunaserv). They do not answer "compare these 9 sites across
these 30 launch dates, show me where power and DTE both work, and let me slide the launch
date." The side-by-side/matrix workflow is the opening.

## 2.4 Project concepts

### B1. **Sun/Earth Horizon Studio** — "Compare lunar landing sites and dates like a mission planner, in one screen."

**Pitch line.** Pick 2–4 sites and a date range; see horizon silhouettes, Sun and Earth
paths, sunset/Earthset countdowns, and power/comms scores side by side — then slide the
launch date and watch the windows move.

**Target user.** Mission planners (CLPS/Artemis IV/commercial), educators, public.

**Core experience / demo "wow".** A "mission-control" split screen: each site has a
horizon panorama computed from LOLA (not a smooth sphere), with the Sun arc and Earth arc
drawn relative to the horizon. A timeline scrubber moves through a lunar day; a
sunset/Earthset countdown ticks; a power/comms scorecard updates. The wow: at Shackleton
on 2026-12-01, the Sun is only ~1.5° above the horizon and Earth is **below** the horizon
— so DTE is blacked out even though the Sun is up. That single fact sells the challenge.

**How it uses 2026 AI.**
- **Jev:** rank site-date combinations with `Score` rubrics (power margin, DTE margin,
  thermal margin, science value, operational simplicity) and `Noul` hard gates (Sun above
  horizon? Earth above horizon? slope < 15°?). Confidence gates "recommend / review /
  reject". Use one request per site-date, or batch a shortlist.
- **Gemini 4 Hydrogen:** writes a 5-sentence "mission brief" per scenario (why the window
  works/fails; what to watch; what to verify), and an educator-mode explanation. It can
  also read a LOLA hillshade/horizon image to sanity-check the terrain description.
- **Optional:** Gemini Embedding 2 to retrieve similar horizon profiles.

**Data pipeline.**
1. Curated sites: 9 Artemis candidate regions (2024), Apollo 11/12/14/15/16/17, CLPS/
   commercial/international sites (Blue Ghost, IM-1/2, Chang'e 4/5/6, Chandrayaan-3,
   SLIM), plus custom lat/lon.
2. DEM: LOLA 5 m (87.5°S), 10 m (85°S), 20 m (80°S), 30 m (75°S), 60 m (60°S), SLDEM2015
   (60N–60S). For each site, cut a 10–30 km DEM window; compute a 360° horizon profile
   by ray-marching the DEM (no atmosphere; include lunar curvature).
3. Ephemeris: JPL Horizons API for Sun (10) and Earth (399) az/el at the site, at 10–60 min
   steps; validate with SPICE for libration. Earth angular diameter ~1.9°; include it in
   the horizon test (Earth center + radius).
4. Illumination: `luna_illumination` WMS tiles (GLD100, `TIME`) for instant visual; compute
   quantitative direct-sun fraction from DEM + Sun vector for the selected window.
5. Power: solar constant ~1361 W/m²; incidence angle; simple array model with efficiency,
   shadowing, and a user-adjustable derate; report margin, not just "watts".
6. Comms: DTE when Earth disk clears the terrain horizon; report window length, next
   Earthset, and total DTE minutes; optional relay note (NRHO/LLO) but do not fake a link
   budget.
7. Thermal context: Diviner summer/winter avg/max/min; LEND WEH; Mini-RF CPR; PSR distance.
8. Jev ranks; Gemini briefs; UI renders.

**48-hour MVP.**
- 9 curated sites; 1-year date range; 1-hour steps; 2D horizon panorama + timeline;
  compare 2 sites side by side; power/comms scorecard; sunset/Earthset countdown.
- Precompute all ephemeris/horizon data into JSON; no live API calls in the demo.
- Jev ranking for 9 sites × 12 monthly dates; Gemini 5 briefs.
- 3D optional; if included, a simple Cesium globe with a horizon overlay.

**Stretch.** Custom coordinates; multi-year; 3D Cesium; live Horizons; shareable scenario
URLs; mission-window matrix (B2); LGRS coordinate readout.

**Dither UI fit.** 1-bit horizon silhouettes (black terrain, white sky), Bayer-dithered Sun
and Earth arcs, a mission clock, amber/red alert bands for "no power" / "no DTE". This is
the most natural dither aesthetic of the three challenges.

**Risks.** Horizon algorithm accuracy; DEM resolution at steep polar terrain; Earth disk
size/libration; "no atmosphere" assumption; API rate limits; overclaiming power/comms
without a link budget. Mitigation: show assumptions; compare to Horizons/SPICE; label
"planning-grade, not flight-dynamic".

**Scores:** Impact **10**, Feasibility **8**, Novelty **8**, Judge **10**, AI **7**.

---

### B2. **Mission Window Matrix** — "A heatmap of every site × every launch date."

**Pitch line.** A single matrix shows which site-date combinations satisfy illumination,
Earth visibility, power, and slope constraints; slide the launch date and watch the
viable windows shift.

**Target user.** Mission planners responding to launch slips; CLPS providers; program
managers.

**Core experience / demo "wow".** A 9×365 heatmap; green = viable, amber = marginal,
black = no DTE/no Sun. Click a cell to open a horizon view. A "launch slip" slider
animates the matrix. The wow: a site that looks good in January is blacked out in July;
the matrix makes schedule risk obvious.

**How it uses 2026 AI.** Jev scores each cell's qualitative "operational robustness" and
flags marginal cases; Gemini explains why a window closes and suggests alternatives.
Deterministic constraints do the heavy lifting.

**Data pipeline.** Same as B1, but precompute daily metrics instead of hourly; store a
site × date table; render a canvas heatmap.

**48-hour MVP.** 9 sites × 365 days; 4 constraints; heatmap + click-through; Jev flags;
Gemini 3 explanations.

**Stretch.** Hourly windows; multi-year; custom sites; "show me the best 10 windows";
export CSV.

**Dither UI fit.** 1-bit/Bayer heatmap: filled = viable, half-tone = marginal, empty =
no; amber threshold lines; monospace labels. Extremely legible.

**Risks.** Visual monotony; over-simplifying constraints; needs a good click-through.

**Scores:** Impact **9**, Feasibility **9**, Novelty **7**, Judge **9**, AI **6**.

---

### B3. **South Pole Base Planner** — "Find a site you can live at, not just land at."

**Pitch line.** A multi-year site-ranking tool for a permanent south-pole base: continuous
power, Earth visibility, ice access, slope, thermal stability, and traversability — with
Jev ranking and Gemini site briefs.

**Target user.** Moon-base architects; Artemis IV+ planners; ISRU/resource teams.

**Core experience / demo "wow".** A "base scorecard" for 9 regions: a radar chart of six
criteria, a 5-year power/comms timeline, and a "what breaks first" risk panel. The wow:
the best landing site is not the best base site; the app shows the trade-off.

**How it uses 2026 AI.** Jev scores qualitative criteria (science value, constructability,
operational risk, resource access) and hard gates; Gemini writes the "base concept" brief
and interprets terrain images; Embedding 2 optional.

**Data pipeline.** LOLA 5/10/20 m DEM + slope; Lunaserv polar illumination %; Horizons
Earth visibility; Diviner temps; LEND WEH; Mini-RF CPR; PSR masks; Jev ranking.

**48-hour MVP.** 9 regions; 6 criteria; 5-year monthly metrics; radar/scorecards; 1 map;
Jev ranking; 3 Gemini briefs.

**Stretch.** 3D terrain; traverse to PSR; power system sizing; habitat layout.

**Dither UI fit.** 1-bit radar charts, halftone terrain, stipple ice, mission-control
scorecards; amber "risk" bands.

**Risks.** Overlapping with B1; "base" claims need more engineering; data gaps.

**Scores:** Impact **9**, Feasibility **7**, Novelty **8**, Judge **8**, AI **8**.

---

### B4. **Lunar Field Trip** — "Survive a lunar day at the site you choose."

**Pitch line.** An educational game/story: pick a site and date, manage power and comms
through a lunar day, and learn why the south pole is hard.

**Target user.** Students, museums, public; educators.

**Core experience / demo "wow".** A dithered comic-panel interface; each "hour" you choose
to charge, science, or call Earth; the Sun/Earth horizon view shows consequences; a
"mission log" explains what happened. The wow: the same site is easy in one season and
impossible in another.

**How it uses 2026 AI.** Gemini narrates events and generates mission-log text from the
simulation state; Jev scores decisions and chooses event branches; human-authored game
rules do the simulation.

**Data pipeline.** Precomputed B1 metrics for 9 sites × 12 dates; a simple state machine;
Gemini templates; no live data.

**48-hour MVP.** 3 sites × 4 seasons; 24 turns; 3 decision types; mission log; shareable
score.

**Stretch.** More sites; random events; classroom mode; audio narration.

**Dither UI fit.** Perfect: 1-bit comic panels, halftone Sun/Earth, pixel typography,
mission patches (no NASA logos).

**Risks.** Game balance; educational claims; less "mission planner" credibility.

**Scores:** Impact **8**, Feasibility **8**, Novelty **8**, Judge **8**, AI **8**.

---

### B5. **Horizon AR** — "Point your phone at the lunar horizon."

**Pitch line.** A WebXR/AR view that overlays the Sun/Earth paths on a 3D lunar horizon
for a chosen site/date.

**Target user.** Public/education; mission outreach.

**Core experience / demo "wow".** Phone camera + 3D horizon; Sun/Earth arcs; "Earthset in
2h 14m". Very shareable.

**How it uses 2026 AI.** Gemini writes the narration; Jev scores scenarios; little AI in
the core.

**Data pipeline.** B1 horizon/ephemeris; WebXR; 3D tiles.

**48-hour MVP.** One site, one date, AR overlay; no custom coordinates.

**Stretch.** Multi-site; audio guide; classroom mode.

**Dither UI fit.** AR overlay with 1-bit lines and labels; high contrast.

**Risks.** Device/browser support; tracking; demo fragility; 48h risk high.

**Scores:** Impact **7**, Feasibility **5**, Novelty **9**, Judge **8**, AI **7**.

## 2.5 Recommendation for Challenge B

**Build B1 Sun/Earth Horizon Studio, with B2 Mission Window Matrix as the second view.**
This is the most direct answer to the challenge's core complaint: existing tools are
single-scenario and hard to compare. B1 gives the emotional, visual "wow" (horizon +
Sun/Earth arcs + countdown); B2 gives the planner's power tool (site × date matrix).
Together they cover mission planners, educators, and the public.

**Why not the others:** B3 is a strong stretch but risks overlapping B1 and making claims
about base engineering the team can't validate in 48h. B4 is charming but may be judged as
a game rather than a mission-planning tool. B5 is too fragile for a live demo.

**Winning narrative:** "We turned three expert tools into one comparison screen. Pick two
sites, pick a date, and see — on the actual LOLA horizon — whether the Sun and Earth are
up, for how long, and what that means for power and DTE. Then slide the launch date."

**Technical credibility checklist for judges:** use Horizons/SPICE for ephemeris; LOLA for
horizon; state "no atmospheric refraction"; include Earth's angular diameter/libration;
show assumptions and uncertainty; compare a computed case to QuickMap/Moon Trek.

**Worked verification example I ran (2026-12-01, 0°E, 89.9°S, 0 km):**
- Sun: azimuth 280.06° → 277.02°, elevation 1.487° → 1.481° over 00:00–06:00 UTC.
- Earth: azimuth 6.67° → 6.72°, elevation **−1.51° → −1.70°** over 00:00–03:00 UTC
  (below the horizon; DTE blackout).
This is exactly the kind of counterintuitive result the app should make visible.

---

# 3. Challenge C — Interplanetary Survival Guide: Martian Map

## 3.1 Challenge in one paragraph

**The real ask.** Create a layered, integrated, **hyperlocal** view of a Mars location or
route that pulls together data from multiple NASA science missions and could help a human
explorer plan and carry out a successful Marswalk. It must include at least **three kinds
of data** (optical, thermal, spectral, topographic, geophysical, atmospheric, radiation,
chemical), support **astronaut safety** (hazards, radiation, comms, mobility), and ideally
a **route map** that avoids obstacles and serves science objectives. It can be a habitat
display, tablet app, helmet HUD, or another format; static or interactive; past/predicted/
no specific time frame.

**Hidden judging hooks.**
- "**Hyperlocal**": Mars Trek and USGS maps are regional/global; the gap is meter-scale,
  route-level, astronaut-usable.
- "**At least three kinds of data**": show five or more, and explain what each contributes
  to a decision. A layer pile without a decision model is weak.
- "**Astronaut safety**": radiation, slope, boulders, dust, temperature, comms, EVA
  mobility; safety must be visible in the UI, not a footnote.
- "**Route map**": avoid large rocks/steep slopes; show EVA timeline; suit/portable life
  support constraints; sample stops.
- "**POV images**": use Perseverance/Curiosity images so the astronaut knows what to expect.
- "**Current conditions**": be honest about latency; use MEDA/MCS/MARCI and label "latest
  available sol", not "real-time".
- "**Format**": a HUD/tablet/habitat display is more memorable than another web map; design
  for gloves, sunlight, low power, offline.
- "**Science goals**": pick a real objective (e.g., boxwork at Mount Sharp, delta
  stratigraphy at Jezero) and let it drive the route.
- "**Robotic support**": consider rover/Ingenuity collaboration, pairs, cached supplies.

**Must include.** Layered integrated view; multiple NASA missions; ≥3 data types; safety;
route; POV imagery; hyperlocal scale; NASA data from the challenge Resources list (Mars
Trek, USGS Planetary Geologic Mapping, Curiosity route map, Worldview, Perseverance raw
images); credits/licenses; AI/SI disclosure.

## 3.2 Data and resources

### Challenge-listed resources

| Name | URL | Format | Access/auth | Size | License | Verified? | Notes |
|---|---|---|---|---|---|---|---|
| JPL Mars Trek | https://trek.nasa.gov/mars/ | Web 2D/3D; OGC WMTS; Sun-angle/elevation tools | No auth | 146 EQ + 6 SP + 7 NP layers | NASA public domain | **VERIFIED**; MOLA sample tile downloaded; layer catalog queried | Global/regional context; includes MOLA, THEMIS, TES, CTX, HiRISE, Viking, HRSC; **no SHARAD/CRISM layers** (verified absence). Built for regional/global, not hyperlocal — the challenge's stated gap. |
| USGS-NASA Planetary Geologic Mapping Program | https://astrogeology-usgs.hub.arcgis.com/pages/interactive-maps-mars | ArcGIS Hub interactive maps | Open | Varies | USGS public domain | **VERIFIED** page live (JS app); content via Hub | Geologic maps/context; use the global Mars geologic map (SIM 3292) as a layer/legend. |
| Curiosity route map example | https://science.nasa.gov/resource/curiositys-proposed-path-up-mount-sharp/ | Animation/video; map | Open | Small | NASA public domain | **VERIFIED** | Shows annotated route + flyover; good UX reference and science objective (Mount Sharp boxwork). |
| NASA Worldview | https://worldview.earthdata.nasa.gov/ | Web map; GIBS WMTS | No auth | Daily global Earth | NASA imagery CC0; code NOSA 1.3 | **VERIFIED** | For Earth-analog context or "Earth from space" storytelling; not Mars data. |
| Mars Perseverance Raw Images | https://mars.nasa.gov/mars2020/multimedia/raw-images/ | JPEG/PNG; JSON API | No auth | **1M+ images**; API returns 5/page in test | NASA public domain | **VERIFIED**; API JSON returned images | POV imagery for waypoints; API `https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020&feedtype=json` |

### Extra resources

| Name | URL | Format | Access/auth | Size | License | Verified? | Notes |
|---|---|---|---|---|---|---|---|
| HiRISE | https://www.uahirise.org/ ; PDS https://hirise-pds.lpl.arizona.edu/PDS | JP2, PDS EDR/RDR/DTM; browse JPEG | No auth | Archive-scale; images up to 20,000×65,000 px | NASA/JPL/UA public domain; credit | **VERIFIED** pages live | 25–32 cm/px; DTM 1–2 m post spacing; 900+ DTMs; best for boulders/route hazards. |
| CTX | https://www.msss.com/mro/ctx/index.html ; PDS https://pds-imaging.jpl.nasa.gov/volumes/mro.html | PDS EDR/RDR; mosaics | No auth | Archive-scale | NASA/JPL-Caltech/MSSS public domain; credit | **VERIFIED** | 6 m/px, 30 km swath; context for HiRISE/CRISM; global mosaic (Caltech) available. |
| MOLA | https://pds-geosciences.wustl.edu/missions/mgs/mola.html ; MEGDR https://pds-geosciences.wustl.edu/missions/mgs/megdr.html | PDS4 `.img`; 4/16/32/64/128 ppd; polar | No auth | 128 ppd ~4.25 GB; 64 ppd ~1.06 GB (approx.) | NASA public domain | **VERIFIED** | Global topography; 128 ppd ~463 m; MOLA/HRSC blend 200 m in Mars Trek. |
| THEMIS | https://pds-geosciences.wustl.edu/missions/odyssey/themis.html | PDS; IR day/night; controlled mosaics | No auth | Archive-scale; 100 m global mosaics | NASA/JPL-Caltech/ASU public domain | **VERIFIED** | Thermal inertia/dust/rock context; day/night IR. |
| CRISM | https://pds-geosciences.wustl.edu/missions/mro/crism.htm | PDS; TRDR/DDR/MTRDR; hyperspectral cubes | No auth | Targeted, large | NASA/JPL/JHUAPL public domain | **VERIFIED** | ~18 m/px, 544 bands (instrument spec); visible-infrared hyperspectral mapper; mineralogy (clays, sulfates, carbonates); not global. |
| SHARAD | https://pds-geosciences.wustl.edu/missions/mro/sharad.htm ; 3D https://pds-geosciences.wustl.edu/missions/mro/sharad_3d_pds4.htm ; PSI https://sharad.psi.edu/ | PDS; 2D radargrams, 3D volumes (SEG-Y), clutter simulations | No auth | 3D volumes tens–hundreds GB | NASA/JPL-Caltech/ASI/PSI public domain; credit | **VERIFIED** | Subsurface ice/radar stratigraphy; local verification for SWIM. |
| SWIM (Subsurface Water Ice Mapping) | https://swim.psi.edu/ ; products https://swim.psi.edu/SWIM4MIMProducts.php | GeoTIFF/PNG/TIFF; 3 km/px; shapefile recon zones | No auth | ~25 MB per composite GeoTIFF | NASA-funded; publicly downloadable; **no explicit license found** (LICENSE-UNVERIFIED) | **VERIFIED**; `SWIM4MIM_Ci_0_1.tif` downloaded (25,133,056 bytes) | Best global buried-ice layer; 0–1 m, 1–5 m, >5 m, SWIM 1.0; 0–360E, 60S–60N; supports human landing site studies. |
| MARCI daily global maps | https://astrogeology.usgs.gov/search/map/mars_mro_marci_daily_global_weather_maps_pds4_archive | PDS4 TIFF; 0.05° and 0.1°; 7 filters | No auth | **1.1 TB** | NASA/JPL-Caltech/MSSS; USGS archive; cite authors | **VERIFIED** | Daily global weather/dust/cloud maps; 13 orbits/day; v2 covers >6 Mars years to ~MY34 (not "current"); use as climatology/seasonal context. |
| MCS | https://atmos.nmsu.edu/data_and_services/atmospheres_data/MARS/mcs.html | PDS; temperature/dust/ice profiles | No auth | Archive-scale | NASA/JPL-Caltech public domain | **VERIFIED** | Atmospheric profiles; dust/ice; supports "current conditions" context. |
| MEDA | https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/PERSEVERANCE/meda.html ; bundle DOI 10.17189/1522849 | PDS4; **CSV** tables + SkyCam images | No auth | Archive-scale | NASA/JPL-Caltech/CAB/CSIC-INTA public domain | **VERIFIED** (bundle metadata); PDS collection stop date 2025-12-28 | Pressure, air/surface temp, humidity, wind, solar/IR radiation, dust opacity; ongoing. Best "latest sol" surface weather for Jezero. |
| MSL RAD | https://pds-ppi.igpp.ucla.edu/mission/Mars%20Science%20Laboratory/msl/RAD | PDS; EDR/RDR | No auth | Archive-scale | NASA/JPL-Caltech/SwRI public domain | **VERIFIED** page link from PDS MSL | Surface radiation environment; not spatially resolved; use as dose context + terrain shielding model. |
| MSL REMS | https://atmos.nmsu.edu/data_and_services/atmospheres_data/MARS/curiosity/rems.html | PDS; EDR/RDR | No auth | Archive-scale | NASA/JPL-Caltech/CAB public domain | **VERIFIED** link from PDS MSL | Gale surface weather; archive; less current than MEDA. |
| USGS STAC (Mars) | https://stac.astrogeology.usgs.gov/ | STAC 1.0; COG assets on S3 | No auth | 18 collections; HiRISE/CTX DTMs, THEMIS, LOLA | **CC0-1.0** | **VERIFIED**; sample COG item | Analysis-ready HiRISE/CTX DTMs, THEMIS mosaics; best 48h path to high-res terrain. |
| USGS SIM 3292 Geologic Map of Mars | https://pubs.usgs.gov/sim/3292/ | PDF, database ZIP (790 MB), GIS | Open | 790 MB database | USGS public domain | **VERIFIED** | 1:20M global geologic map; unit polygons/legend; great context layer. |
| MMGIS | https://github.com/NASA-AMMOS/MMGIS | Web 2D/3D; COGs/STAC | Open source | App + data | **Apache-2.0** | **VERIFIED** | Mission-proven on MSL/InSight/Mars 2020; 2D/3D, TiTiler, STAC; strong prior art/base. |
| JMARS | https://jmars.asu.edu/ | Desktop GIS | Free | App + data | **GPL** | **VERIFIED** | Mission planning/data analysis; good reference for layer catalog; not web. |
| HiView | https://www.uahirise.org/hiview/ | JP2/JPIP viewer | Free | App | UA | **VERIFIED** | HiRISE browse; useful for inspecting full-res images without downloading. |
| Mars24 | https://www.giss.nasa.gov/tools/mars24/ | Java/web sun clock | Free | Small | NASA/GISS | **VERIFIED** | Mars local time/solar longitude; useful for EVA timeline. |
| Mars Climate Database | https://www-mars.lmd.jussieu.fr/mars/access.html | Model outputs; web/API | Free for research (registration/terms) | Large | LMD/ESA/CNES; academic terms | **VERIFIED** page live | Atmosphere/dust/climatology; use for seasonal context, not "current". |
| NASA Eyes on the Solar System | https://eyes.nasa.gov/apps/solar-system/ | Web 3D | Free | Small | NASA/JPL | **VERIFIED** | Inspiration for 3D/real-time storytelling. |
| Perseverance location map | https://science.nasa.gov/mission/mars-2020-perseverance/location-map/ | Web map | Free | Small | NASA/JPL-Caltech | **VERIFIED** | HiRISE/HRSC + DEM + traverse; exact prior art for a rover map. |

**Current-status/data-latency caveat.** "Current conditions" on Mars are not real-time.
MEDA is the best surface weather (latest available sol; the PDS collection we checked
stops 2025-12-28, so a Nov 2026 demo may lag by months unless a newer release is used).
MARCI v2 daily maps are a climatology (through ~MY34), not today's weather. MCS gives
orbital profiles. Be explicit in the UI: **"Latest available: Sol X, [date]"**, not "live".

### 3.2a Mars data deep dive: HiRISE, CTX, MOLA, SHARAD, SWIM

**HiRISE (High Resolution Imaging Science Experiment, MRO).**
- **Imagery:** 25–32 cm/px; images up to ~20,000×65,000 px; ~6 km swath; targeted, not
  global.
- **DTM:** 1–2 m post spacing, vertical precision in the tens of cm, from stereo pairs;
  **900+ DTMs** delivered to PDS (as of the USGS STAC release).
- **Products:** EDR, RDR, DTM; JP2 + PDS labels; browse JPEGs.
- **Access:** HiRISE PDS (`hirise-pds.lpl.arizona.edu/PDS`), HiView (JP2), USGS STAC (COG
  DTMs), Mars Trek WMTS (selected mosaics).
- **Use for the map:** boulders >1 m, scarps, fractures, bedrock, sample targets, route
  hazards. This is the highest-value optical layer for a human EVA.
- **Credit:** NASA/JPL/University of Arizona.

**CTX (Context Camera, MRO).**
- **Imagery:** 6 m/px, 30 km swath; grayscale; global mosaic available (Caltech/Murray Lab
  beta01, ~5–6 m/px); stereo pairs for DTMs.
- **DTM:** ~18 m post spacing (USGS/Ames Stereo Pipeline products in STAC).
- **Use for the map:** context around HiRISE; regional slope/roughness; route corridors
  where HiRISE coverage is absent.
- **Credit:** NASA/JPL-Caltech/MSSS.

**MOLA (Mars Orbiter Laser Altimeter, MGS).**
- **MEGDR:** global DEMs at 4, 16, 32, 64, and 128 ppd; 128 ppd is ~463 m; polar products;
  PDS4 bundle + PDS3 archive. 128 ppd global is ~4.25 GB; 64 ppd ~1.06 GB (approx.).
- **Blend:** MOLA/HRSC 200 m color hillshade in Mars Trek; excellent global context.
- **Use for the map:** global elevation, regional slope, horizon/terrain shielding,
  georeferencing base. Not enough for meter-scale hazards; pair with HiRISE/CTX DTMs.
- **Credit:** NASA/MGS/MOLA Science Team.

**SHARAD (Shallow Radar, MRO).**
- **What:** 20 MHz radar sounder; penetrates hundreds of meters; detects subsurface
  interfaces/ice; 2D radargrams, 3D volumes, clutter simulations.
- **Products:** EDR/RDR; 3D radargrams in SEG-Y (tens to hundreds of GB); browse images.
- **Access:** PDS Geosciences, PSI (`sharad.psi.edu`), 3D bundle DOI.
- **Use for the map:** local verification of SWIM ice; subsurface cross-sections at a
  drill site; not a global layer.
- **Credit:** NASA/JPL-Caltech/ASI/PSI.

**SWIM (Subsurface Water Ice Mapping).**
- **What:** NASA-funded project (PSI/JPL) combining neutron, thermal, radar, and
  geomorphology data to map ice consistency in the upper meters.
- **Products (SWIM4IMIM):** combined ice consistency **0–1 m**, **1–5 m**, **>5 m**, and
  SWIM 1.0; individual datasets (geomorphology, neutron, thermal, radar surface power,
  dielectric); reconnaissance zones shapefile.
- **Format/resolution:** GeoTIFF/PNG/TIFF, **3 km/pixel**, simple cylindrical, 0–360°E,
  60°S–60°N; ~25 MB per composite GeoTIFF. Direct sample verified:
  `https://swim.psi.edu/output/SWIM4MIM/Global/Composite/SWIM4MIM_Ci_0_1.tif`
  (25,133,056 bytes).
- **Use for the map:** first-class buried-ice layer; site screening; "ice access" criterion.
- **Caveat:** 3 km resolution is regional, not local; pair with SHARAD/HiRISE for a drill
  site. License is **LICENSE-UNVERIFIED** (publicly downloadable, NASA-funded).
- **Credit:** NASA/JPL-Caltech/PSI.

**Stack for a 48h hyperlocal map:**
- Base/context: Mars Trek MOLA/Viking/HRSC WMTS.
- Detail: HiRISE + CTX (WMTS or COG/STAC).
- Terrain: HiRISE/CTX DTM from USGS STAC (COG), or MOLA for regional.
- Thermal: THEMIS day/night + TES thermal inertia.
- Spectral: CRISM (targeted) + TES mineralogy.
- Ice: SWIM (regional) + SHARAD (local).
- Atmosphere: MARCI daily maps + MCS profiles + MEDA latest sol.
- Radiation: RAD dose + terrain shielding.
- POV: Perseverance/Curiosity raw images.
- Geology: USGS SIM 3292.
This is more than enough for the challenge's "at least three kinds of data".

## 3.3 Open-source and prior art

| Project/tool | What to borrow | License | Link |
|---|---|---|---|
| **MMGIS** | 2D/3D mission mapping, COGs, STAC, TiTiler, layer CMS, deep links | **Apache-2.0** | https://github.com/NASA-AMMOS/MMGIS |
| **Mars Trek** | WMTS layer catalog, MOLA/THEMIS/TES/CTX/HiRISE, Sun-angle/elevation tools | NASA public domain | https://trek.nasa.gov/mars/ |
| **USGS STAC** | Analysis-ready HiRISE/CTX DTMs, THEMIS, COGs | CC0-1.0 | https://stac.astrogeology.usgs.gov/ |
| **USGS Planetary Geologic Mapping** | Geologic map/units, cartographic standards | USGS public domain | https://astrogeology-usgs.hub.arcgis.com/pages/interactive-maps-mars |
| **HiRISE / CTX / MOLA / THEMIS / CRISM / SHARAD / MARCI / MCS / MEDA / RAD** | The actual data layers | NASA public domain | See table above |
| **SWIM** | Buried ice consistency maps | NASA-funded; license unverified | https://swim.psi.edu/ |
| **Ames Stereo Pipeline (ASP)** | Generate DTMs from CTX/HiRISE stereo | **Apache-2.0** | https://github.com/NeoGeographyToolkit/StereoPipeline |
| **ISIS** | Planetary image processing/cartography | **CC0** | https://github.com/USGS-Astrogeology/ISIS3 |
| **GDAL** | Raster/vector I/O, slope, hillshade, tiling | **MIT** | https://gdal.org/ |
| **CesiumJS** | 3D Mars globe/terrain | **Apache-2.0** | https://github.com/CesiumGS/cesium |
| **Cesium Mars** | 3D Tiles of Mars, Jezero/Gale high-res | Cesium ion terms | https://cesium.com/platform/cesium-ion/content/cesium-mars/ |
| **JMARS** | Mission-planning layer catalog | GPL | https://jmars.asu.edu/ |
| **HiView** | HiRISE JP2 viewing | UA free | https://www.uahirise.org/hiview/ |
| **Mars24** | Mars local time/solar longitude | NASA/GISS | https://www.giss.nasa.gov/tools/mars24/ |
| **Mars Climate Database** | Atmospheric climatology | Academic terms | https://www-mars.lmd.jussieu.fr/mars/access.html |
| **Space Apps 2022 "Mars 3D Home"** | Mars habitat/resource storytelling; Best Mission Concept | Public project | https://www.spaceappschallenge.org/blog/2022-global-winners/ |
| **Space Apps 2018 "Mission to Mars"** | Landing-site/route decision support | Public projects | https://2018.spaceappschallenge.org/ |

**Prior-art gap.** Mars Trek and the USGS map are regional/global and layer-centric; the
Perseverance location map is rover-centric, not human-EVA-centric. MMGIS is mission-proven
but generic. The gap is a **human Marswalk map**: meter-scale hazards, suit mobility,
radiation/comms, POV previews, and a route tied to a science objective, in a display an
astronaut could actually use.

## 3.4 Project concepts

### C1. **Marswalk Mission Map** — "A hyperlocal, layered map for one astronaut EVA."

**Pitch line.** Pick a science objective and a landing site; get a meter-scale Marswalk
map with optical, thermal, spectral, topographic, geophysical, atmospheric, and radiation
layers, a safe route, and POV previews at every waypoint.

**Target user.** Astronaut crews; mission planners; EVA trainers; educators.

**Core experience / demo "wow".** A tablet/HUD-style map of a 5×5 km area (Jezero delta or
Gale/Mount Sharp). Layers toggle: HiRISE optical, CTX context, HiRISE/CTX DTM hillshade,
THEMIS night IR, CRISM mineralogy, TES thermal inertia, SWIM ice, MOLA. Draw a route; the
app returns slope/roughness/boulder/radiation/comms profiles and a "go/no-go" per segment.
At a waypoint, a POV Perseverance/Curiosity image shows what the astronaut will see. The
wow: the route avoids a boulder field that looks harmless in optical but is obvious in
HiRISE + slope, and the POV image matches the map.

**How it uses 2026 AI.**
- **Gemini 4 Hydrogen:** interprets HiRISE/CTX/CRISM + POV images; returns structured JSON
  with terrain units, hazards (label, normalized bbox, severity, confidence), science
  targets, and "what to verify in GIS"; writes waypoint briefs and an audio guide.
  Segmentation masks for boulders/crater rims/scarps; cross-check with slope/DEM.
- **Jev:** scores route/waypoint options on safety, science value, energy/time, comms, and
  thermal margin; `Noul` hard gates (slope > 15°, boulder density too high, no relay pass);
  `Choice` "recommend / alternate / reject"; confidence gating.
- **Gemini Decision 1 (optional):** fast multimodal triage of many image chips if Jev's
  text-only scoring is too coarse.
- **Gemini Embedding 2 (optional):** find terrain chips similar to a reference waypoint.

**Data pipeline.**
1. Choose site + science objective (Jezero delta; or Gale/Mount Sharp boxwork).
2. Pull HiRISE/CTX COGs or Mars Trek WMTS; DTM from USGS STAC (HiRISE 1–2 m, CTX 18 m) or
   Mars Trek/MOLA for context.
3. Compute slope/aspect/roughness/hillshade with GDAL; boulder density from HiRISE
   (Gemini masks + size-frequency); thermal inertia/dust from TES/THEMIS; mineralogy from
   CRISM; ice from SWIM/SHARAD; atmosphere from MARCI/MCS/MEDA; radiation from RAD + terrain
   shielding.
4. Build a cost raster: slope + roughness + boulder density + radiation + distance; apply
   constraints; run A*/Dijkstra for a route; compute EVA time (walking speed in suit,
   suit limits); add sample stops.
5. Gemini interprets images and writes waypoint briefs; Jev scores route options; UI renders.
6. Export a "mission card" (PDF/PNG) with route, timeline, hazards, POV thumbnails.

**48-hour MVP.**
- 1 site (Jezero or Gale), 5×5 km, 5 layers (HiRISE/CTX optical, DTM/hillshade, THEMIS,
  CRISM/TES, SWIM/MOLA), 1 route, 6 waypoints, POV cards.
- Precompute rasters/route; no live rover data; MEDA/MCS conditions panel labeled "latest
  available".
- Gemini 10–15 image interpretations; Jev 6 route-option scores; 2D MapLibre/Leaflet +
  dither HUD skin.
- A "why this route" panel with hazard/slope/comms contributions.

**Stretch.** 3D Cesium; Gale + Jezero modes; real-time MEDA/MCS; multi-day EVA; rover/
Ingenuity support; offline PWA; helmet HUD mode.

**Dither UI fit.** A 1-bit HUD: halftone terrain, black/white hazard glyphs, a bold route
line, amber "no-go" bands, large glove-friendly controls, sunlight-readable contrast.
This is the most distinctive UI of the three challenges.

**Risks.** Data volume/georeferencing; AI hallucination on unusual terrain; "current"
latency; route safety overclaim; 48h scope. Mitigation: precompute one site; use COGs/
browse images; validate Gemini against DEM/slope; label planning-grade; show uncertainty.

**Scores:** Impact **9**, Feasibility **7**, Novelty **8**, Judge **9**, AI **8**.

---

### C2. **Ice First** — "Plan a Marswalk to the water."

**Pitch line.** A mid-latitude ice-resource map: use SWIM + SHARAD + HiRISE/CTX to find the
shallowest accessible ice, then plan a safe EVA to characterize/extract it.

**Target user.** ISRU/resource teams; human landing site planners; Mars base architects.

**Core experience / demo "wow".** A "ice depth" map (0–1 m, 1–5 m, >5 m) with a drill site
candidate; a cross-section from SHARAD; a route with slope/thermal/radiation; a "water
budget" estimate. The wow: the ice boundary is not where the obvious visual terrain
suggests; SWIM + SHARAD together narrow it.

**How it uses 2026 AI.** Gemini interprets SHARAD radargrams and HiRISE/CTX surface
morphology (scarps, polygons, lobate debris aprons) and writes a "what to drill" brief;
Jev scores sites on ice confidence, depth, access, slope, thermal, and science value.

**Data pipeline.** SWIM GeoTIFFs (3 km), SHARAD radargrams/3D, HiRISE/CTX, MOLA, THEMIS/
TES, CRISM (hydrated minerals), MEDA/MCS; GDAL; route cost; Jev; Gemini.

**48-hour MVP.** 1 region (Arcadia/Deuteronilus), 3 candidate sites, SWIM layers, 2 SHARAD
radargrams, 1 route, Jev ranking, 3 Gemini briefs.

**Stretch.** 3D subsurface; drill/ISRU model; multi-region ranking; SHARAD 3D volume.

**Dither UI fit.** 1-bit ice-consistency bands, halftone radargrams, stipple depth,
cross-section "blueprint" look.

**Risks.** SHARAD data complexity; SWIM resolution (3 km) vs local hazards; ice confidence
overclaim; license ambiguity.

**Scores:** Impact **9**, Feasibility **6**, Novelty **9**, Judge **8**, AI **7**.

---

### C3. **Mars Survival Field Guide** — "The map an astronaut actually carries."

**Pitch line.** An in-world tablet/HUD field guide: today's conditions, hazards, route,
science targets, POV previews, emergency shelters, and a go/no-go checklist — a survival
guide, not just a map.

**Target user.** Astronaut crews; EVA planners; educators/public (exploration-mode).

**Core experience / demo "wow".** A rugged-tablet frame with a dithered map, a "TODAY"
panel (latest MEDA/MCS: pressure, temperature, wind, dust opacity, radiation dose), a
"ROUTE" timeline, a "HAZARDS" strip, and a "SCIENCE" target card. Tap a waypoint: POV
image, expected terrain, sample priority, and "verify in GIS" notes. The wow: the app tells
the astronaut **not** to take the obvious shortest route because of a boulder field + no
relay pass, and offers a safer alternative with a better science stop.

**How it uses 2026 AI.**
- **Gemini 4 Hydrogen:** image interpretation/segmentation + natural-language field notes
  + audio guide; reads POV images and describes what to expect; structured JSON for hazards/
  science targets.
- **Jev:** go/no-go scoring per route/waypoint; `Noul` hard gates; `Choice` "proceed /
  alternate / abort"; confidence gating; one request per option.
- **Gemini Decision 1 (optional):** multimodal triage of waypoint chips.
- **Gemma 4 on-device (stretch):** run E2B/E4B locally on the tablet for offline captioning/
  triage when the relay link is down; Gemini handles the high-value interpretations.
- **Human-authored** survival rules, thresholds, and science priorities (AI is not the
  idea generator).

**Data pipeline.** Same as C1/C2, plus MEDA/MCS/MARCI conditions, RAD dose, comms/relay
passes, POV images, and a precomputed route. For 48h, use Jezero (MEDA + Perseverance
images) and a 5×5 km EVA.

**48-hour MVP.** Jezero, 5 layers, 1 route, 6 waypoints, TODAY panel (latest available),
HAZARDS strip, POV cards, Jev go/no-go, Gemini 8–12 image interpretations, tablet frame.

**Stretch.** Gale/Mount Sharp boxwork mode; real-time MEDA/MCS; 3D Cesium; multi-day EVA;
rover/Ingenuity support; offline PWA; helmet HUD.

**Dither UI fit.** The best fit: 1-bit HUD/field-guide aesthetic, halftone terrain, hazard
glyphs, mission-clock typography, amber alerts, high contrast for sunlight. It feels like
declassified mission software, not a sci-fi game.

**Risks.** "Current conditions" latency; AI hallucination; route safety overclaim; scope
creep; data licensing/credits. Mitigation: label data times; show uncertainty; keep the
route human-reviewed; precompute one site.

**Scores:** Impact **9**, Feasibility **8**, Novelty **9**, Judge **10**, AI **8**.

---

### C4. **Radargram Explorer** — "Read the ice under Mars."

**Pitch line.** An interactive SHARAD radargram explorer linked to SWIM and HiRISE/CTX:
click a reflector, see the corresponding surface terrain, and get an AI-assisted
interpretation of the subsurface.

**Target user.** Mars radar/ice scientists; landing site teams; advanced students.

**Core experience / demo "wow".** A radargram with picked reflectors, a surface context
image, and a depth cross-section. Gemini describes the reflector geometry/stratigraphy;
Jev scores "confidence in ice" and "landing relevance". The wow: a buried interface that
is invisible in optical is obvious in radar.

**How it uses 2026 AI.** Gemini interprets radargram textures/reflectors and surface
morphology; Jev scores interpretation confidence and site relevance; human validates.

**Data pipeline.** SHARAD 2D radargrams/3D volumes, SWIM, HiRISE/CTX, MOLA; GDAL/custom
reader; Jev; Gemini.

**48-hour MVP.** 3 radargrams, 1 region, linked surface/depth view, Jev scores, Gemini
briefs.

**Stretch.** 3D volume slicing; automatic reflector picking; multi-region.

**Dither UI fit.** 1-bit radargram, halftone depth, cross-section blueprint; very strong
visually.

**Risks.** Radargram parsing is hard; 48h feasibility low; niche audience.

**Scores:** Impact **7**, Feasibility **6**, Novelty **9**, Judge **7**, AI **7**.

---

### C5. **Boxwork Hunt** — "Follow Curiosity's boxwork clue up Mount Sharp."

**Pitch line.** A science-driven traverse map for Gale/Mount Sharp boxwork formations:
HiRISE/CTX + Curiosity images + CRISM, with AI-assisted outcrop detection and a route to
the best outcrops.

**Target user.** Mars geologists; MSL science team; educators.

**Core experience / demo "wow".** A map of boxwork-bearing terrain; Gemini segments
boxwork-like ridges; Jev ranks outcrops by science value/access/safety; a route connects
the top 3; POV Curiosity images show what the rover saw. The wow: the app connects orbital
texture to rover-scale boxwork.

**How it uses 2026 AI.** Gemini detects/segments boxwork-like structures in HiRISE/CTX and
Curiosity images; Jev scores outcrops; human validates.

**Data pipeline.** HiRISE/CTX, CRISM, MOLA, Curiosity raw images, USGS geologic map, route
cost; Jev; Gemini.

**48-hour MVP.** Gale boxwork area, 3 outcrops, 1 route, 5 POV images, Jev ranking, Gemini
briefs.

**Stretch.** Jezero mode; 3D; multi-day; sample analysis integration.

**Dither UI fit.** 1-bit structural maps, halftone outcrops, annotated field-guide cards.

**Risks.** Boxwork identification ambiguity; AI accuracy; limited data coverage.

**Scores:** Impact **8**, Feasibility **7**, Novelty **8**, Judge **9**, AI **8**.

## 3.5 Recommendation for Challenge C

**Build C3 Mars Survival Field Guide, using C1's map engine.** The challenge title is
"Interplanetary Survival Guide: Martian Map" — a survival-guide framing is directly
responsive, and a tablet/HUD format is more memorable than another web map. The map must
still be deep: 5+ data types, meter-scale hazards, a route, POV previews, and a transparent
go/no-go. C1 alone is a strong map; C3 adds the story and the astronaut-facing UX that
judges will remember.

**Site choice.** **Jezero Crater** is the best 48h choice: Perseverance raw images (1M+),
MEDA current weather, HiRISE 25 cm, CTX, CRISM, SHARAD, USGS STAC DTMs, MMGIS precedent,
and a compelling science story (ancient lake/delta, potential biosignatures). **Gale/Mount
Sharp** is the alternate if the team wants to use the challenge's boxwork example; it has
Curiosity images and excellent HiRISE/CRISM coverage, but less current surface weather.
Offer Gale as a stretch "science mode".

**Why not the others:** C2 Ice First is the most novel and ties to SWIM/SHARAD, but the
radar data complexity and 3 km ice resolution make a 48h demo risky. C4 Radargram Explorer
is too niche/technical for a general judging panel. C5 Boxwork Hunt is a great science
mode but narrower than a survival guide.

**Winning narrative:** "Mars Trek shows you the planet. We show you the walk. Pick a
science target, see the actual hazards at 25 cm, get a route your suit can handle, know
when Earth is above the horizon, and see what you'll see when you get there — on a tablet
that works in sunlight and gloves."

---

# 4. Planetary GIS tooling with licenses

This is the shared stack across all three challenges. The goal is a browser app that can
display Moon/Mars terrain and imagery, compute deterministic metrics, and feed Jev/Gemini.

## 4.1 Core tooling table

| Tool | What it gives you | License | Verified? | Practical note |
|---|---|---|---|---|
| **CesiumJS** | 3D globes; `Ellipsoid.MOON`, `Ellipsoid.MARS`; WMTS imagery; 3D Tiles; glTF; camera/terrain | **Apache-2.0** | **VERIFIED** | Best for 3D Moon/Mars. Use `WebMapTileServiceImageryProvider` with a custom `GeographicTilingScheme` for Trek WMTS. |
| **Cesium ion** | Hosted Moon/Mars 3D Tiles (Cesium Moon asset 2684829; Cesium Mars 3644333); terrain/imagery | Proprietary SaaS; **Community free for personal/non-commercial**; **Commercial $149/mo**; attribution; no sublicensing | **VERIFIED** pricing/terms | Great for a hackathon demo; a public/commercial product needs a license. Alternative: self-host Trek WMTS + custom terrain. |
| **NASA Trek WMTS** | Moon: 1,096 EQ + 396 SP + 173 NP layers; Mars: 146 EQ + 6 SP + 7 NP; OGC WMTS REST | NASA public domain; no auth | **VERIFIED**; sample tiles downloaded | URL template: `https://trek.nasa.gov/tiles/{Body}/{Projection}/{layer}/1.0.0/default/default028mm/{z}/{y}/{x}.{ext}`, where Projection is EQ, NP, or SP and ext is jpg or png. GetCapabilities at `.../1.0.0/WMTSCapabilities.xml`. Imagery only, not terrain. |
| **GDAL** | Raster/vector I/O; PDS/PDS4/ISIS3/VICAR/GeoTIFF; reproject; slope/hillshade; COG/tiles | **MIT/X** | **VERIFIED**; PDS4/ISIS3/VICAR docs live | `gdalinfo`, `gdal_translate`, `gdalwarp`, `gdaldem`, `gdal2tiles`; Python `rasterio`. Reads LOLA/MOLA `.img`+`.lbl`/`.xml`. Not a SHARAD radargram reader. |
| **USGS ISIS** | Planetary image processing/cartography; camera models; mosaics; PDS/ISIS3 | **CC0** | **VERIFIED** | Heavy install (~2.5 GB binaries + data); use only if you need rigorous photogrammetry. |
| **USGS Ames Stereo Pipeline (ASP)** | Stereo DTMs from CTX/HiRISE; point clouds | **Apache-2.0** | **VERIFIED** | For custom DTMs; overkill for 48h if USGS STAC already has a DTM. |
| **USGS STAC API** | STAC 1.0 catalog; 18 collections; HiRISE/CTX DTMs, THEMIS, LOLA; **COG assets on AWS S3**; CC0 | **CC0-1.0** | **VERIFIED**; sample item with COG | The fastest path to analysis-ready high-res terrain. Query by bbox/collection; load COG in TiTiler/Leaflet/Cesium. |
| **USGS PILOT** | Raw planetary image locator/search (Moon, Mars, Jupiter, Saturn, Mercury) | USGS public domain | **VERIFIED** | Find raw images/footprints; useful for source data. |
| **USGS Map-a-Planet 2 / Imagery Processing Cloud** | Map-project/clip/convert global/regional mosaics; outputs ISIS, PDS3, GeoTIFF, JPEG, PNG | USGS public domain | **VERIFIED** | No-code preprocessing; email when done. |
| **USGS Astropedia** | Searchable catalog of planetary maps/products | USGS public domain | **VERIFIED** | Product pages include metadata/links; good for geologic maps. |
| **USGS TADP / PAAD** | Terrestrial analog data + OGC services | USGS public domain / CC0 | **VERIFIED/PARTIAL** | See section 5. |
| **Lunaserv** | OGC WMS 1.1.1; dynamic illumination; polar illumination %; PSR; LEND WEH; Diviner ice depth; numeric WAC DTM; Cesium terrain format | **BSD-3-Clause** | **VERIFIED**; illumination PNG + terrain response | The lunar secret weapon. Use for instant sun/shadow and ice context. The `application/x-cesium-terrain` response looks like a raw heightmap, not quantized-mesh; treat as **not drop-in** until tested. |
| **MMGIS** | 2D/3D planetary GIS; COGs; STAC; TiTiler; mission CMS; deep links | **Apache-2.0** | **VERIFIED** | Mission-proven; can be a base or a reference. Docker deploy may take time in 48h. |
| **JMARS** | Desktop planetary GIS; mission planning; layer catalog | **GPL** | **VERIFIED** | Great reference for data layers; not a web app. |
| **QGIS** | Desktop GIS; planetary CRS; WMS/WMTS; raster/vector | **GPL-2** | **VERIFIED** | Use for preprocessing/inspection; can consume Lunaserv/Trek. |
| **OpenLayers** | 2D web map; WMS/WMTS | **BSD-2-Clause** | **VERIFIED** (project) | Lighter than Cesium for 2D horizon/matrix views. |
| **Leaflet** | 2D web map | **BSD-2-Clause** | **VERIFIED** | Simple, but custom planetary projections need proj4leaflet. |
| **MapLibre GL JS** | 2D/3D vector/raster maps | **BSD-3-Clause** | **VERIFIED** | Good for dither/canvas overlays; custom planetary projections need work. |
| **deck.gl** | GPU data viz layers | **MIT** | **VERIFIED** | Great for heatmaps, paths, point clouds; pairs with MapLibre. |
| **NASA WorldWind** | 3D globe (Java/Web) | **Apache-2.0** | **VERIFIED** | Alternative to Cesium; smaller ecosystem. |
| **SPICE Toolkit / NAIF** | High-fidelity geometry, ephemerides, libration, camera pointing | **NAIF/SPICE license**: free, commercial OK, redistribution restrictions; **not OSI** | **VERIFIED** rules | Use `spiceypy` (MIT) for Python. For 48h, Horizons is easier; SPICE for validation/stretch. |
| **TiTiler** | Dynamic COG tiling/styling | **MIT** | **VERIFIED** | Serve USGS STAC COGs with band math/colormaps; no pre-tiling. |
| **GDAL PDS/PDS4/ISIS3/VICAR drivers** | Read planetary formats | Part of GDAL (MIT/X) | **VERIFIED** | PDS4 driver live; ISIS3 driver live; VICAR driver live. |

## 4.2 NASA Trek WMTS: the concrete API

**Base pattern (verified):**

```
https://trek.nasa.gov/tiles/{Body}/{Projection}/{layer}/1.0.0/default/default028mm/{z}/{y}/{x}.jpg
https://trek.nasa.gov/tiles/{Body}/{Projection}/{layer}/1.0.0/WMTSCapabilities.xml
```

- `Body`: `Moon`, `Mars`, `Vesta`, `Ceres`, `Mercury`, `Titan`, etc.
- `Projection`: `EQ` (equirectangular), `NP` (north polar), `SP` (south polar).
- `default028mm` is the tile matrix set used by the public samples; some layers use
  `.png` and some `.jpg` — read the GetCapabilities `ResourceURL`.
- **No auth.** NASA public domain. Credit the instrument team.
- **Layer catalog** (verified):
  `https://trek.nasa.gov/{moon|mars}/TrekServices/ws/index/{eq|polar}/searchItems?...`
  returns JSON with `productLabel`, `title`, `item_UUID`, bbox, thumbnail.
- **Counts I measured** (2026-11-14):
  - Moon EQ: **1,096** layers.
  - Moon south polar: **396** layers.
  - Moon north polar: **173** layers.
  - Mars EQ: **146** layers.
  - Mars south polar: **6** layers.
  - Mars north polar: **7** layers.
- **Sample tile checks:** Moon WAC global 303 ppd → HTTP 200, `image/jpeg`, 49,475 bytes.
  Mars MOLA color hillshade 463 m → HTTP 200, `image/jpeg`, 62,976 bytes. Moon south
  polar LOLA 5 m DEM → HTTP 200, `image/png`, 966 bytes at z0 (small because polar tile).
- **Important:** Trek WMTS is **imagery**, not quantized-mesh terrain. For 3D terrain,
  use Cesium ion, Lunaserv's terrain format (with caution), or generate heightmaps/
  quantized mesh from LOLA/MOLA with GDAL/ASP.

**Useful Moon south-polar layers (verified names):**
- `LRO_LOLA_DEM_SPole875_5mp_v04` — 5 m/px DEM (87.5°S–90°S).
- `LRO_LOLA_Shade_SPole875_5mp_v04`, `Slope_LRO_LOLA_DEM_SPole875_5mp_v04`,
  `ColorSlope_LRO_LOLA_DEM_SPole875_5mp_v04`.
- `ColorSlope_05below/10below/15below/20below_LRO_LOLA_DEM_SPole875_5m` — slope masks.
- `LRO_LOLA_Illumination_SPole65S_240m` — PSR map (despite the name, the title says
  "LOLA Permanently Shadowed Regions Southpole 240m").
- `LRO_Diviner_Temp_Avg_Clr_SPole80_135mp`, `Diviner_avg_RockAbundance_SP`.
- `LRO_NAC_Mosaic_1mpp_SP`, `LRO_NAC_Mosaic_0_67mpp_Malapert_Massif_SP`.
- Candidate-site DEM/slope layers: `Site01...` (Connecting Ridge), `Site04...` (Shackleton
  Rim), `Site06...` (Nobile Rim 1), `Site07...` (Peak Near Shackleton), `Site11...`
  (de Gerlache Rim), `Site20...` (Leibnitz Beta Plateau), `Site23...` (Malapert Massif),
  `DM2...` (Nobile Rim 2), `Haworth...`.
- `minirf_s1_Clr49dnorm` — Mini-RF CPR 15 m/px at Malapert.
- `LRO_LOLA_DEM_SPole45_100mp_v04` — 100 m, 45°S–90°S context.

**Useful Mars layers (verified names):**
- `Mars_MGS_MOLA_ClrShade_merge_global_463m` — global color hillshade, 463 m.
- `Mars_MOLA_blend200ppx_HRSC_ClrShade_clon0dd_200mpp_lzw` — MOLA/HRSC blend, 200 m.
- `mola_roughness` — global roughness.
- `TES_Thermal_Inertia`, `TES_Dust`, `tes_ruffdust`, `TES_Clinopyroxene`,
  `TES_Plagioclase`, `TES_Glass_Clay` — thermal/mineralogy.
- `THEMIS_DayIR_ControlledMosaics_100m_v2_oct2018`, `THEMIS_NightIR_...` — 100 m.
- `Gale_CTX_BlockAdj_dd`, `JEZ_ctx_B_soc_008_orthoMosaic_6m...`, `curiosity_ctx_mosaic`.
- `JEZ_hirise_soc_006_orthoMosaic_25cm...`, `curiosity_hirise_mosaic`, `HiRISE_Global`.
- `Mars_Viking_MDIM21_ClrMosaic_global_232m`.
- **No SHARAD/CRISM layers in Mars Trek** (verified absence) — use PDS/STAC separately.

## 4.3 CesiumJS with Moon/Mars terrain: three practical options

1. **Cesium ion (fastest).** `Cesium.Ellipsoid.default = Cesium.Ellipsoid.MOON` (or
   `MARS`); `Cesium3DTileset.fromIonAssetId(2684829)` for Moon, `3644333` for Mars.
   Disable the globe, base layer picker, geocoder (per Cesium's examples). Cost/licensing:
   Community free is personal/non-commercial; commercial $149/mo; attribution required.
2. **Trek WMTS imagery + custom terrain.** Use `WebMapTileServiceImageryProvider` for
   imagery; generate a heightmap/quantized-mesh terrain from LOLA/MOLA with GDAL/ASP or
   `cesium-terrain-builder` (license **UNVERIFIED**; check before use). This avoids Cesium
   ion licensing but is more work.
3. **Lunaserv terrain format.** Lunaserv advertises `application/x-cesium-terrain`; my
   sample response was a 256×256 float-like heightmap with an extra byte, **not** a
   quantized-mesh tile. Cesium's `CesiumTerrainProvider` expects quantized-mesh;
   `CustomHeightmapTerrainProvider` can adapt heightmaps but needs a custom loader. Treat
   this as a promising **stretch**, not a 48h dependency.

**CesiumJS caveats:** custom ellipsoid + tiling scheme; WMTS tile matrix labels; CORS;
Cesium ion terms; performance on low-end laptops; 2D/Columbus view limitations for global
3D Tiles.

## 4.4 GDAL: the preprocessing workhorse

- **Read:** LOLA `.img` + `.xml` (PDS4), MOLA MEGDR `.img` + `.lbl` (PDS3), HiRISE DTM,
  CTX, THEMIS, CRISM cubes (ISIS3), GeoTIFF/COG, JP2.
- **Compute:** `gdaldem slope`, `gdaldem hillshade`, `gdaldem roughness`; `gdalwarp` to
  polar stereographic/LTM/LPS; `gdal_translate -of COG`; `gdal2tiles` for WMTS/XYZ.
- **Python:** `rasterio`, `rioxarray`, `numpy`, `pyproj`, `shapely`, `geopandas`.
- **Not enough for:** SHARAD radargrams (custom PDS readers), SPICE geometry, HiRISE JP2
  huge images (use HiView/GDAL JPEG2000 driver), 3D quantized mesh (ASP/terrain builder).
- **License:** MIT/X; safe for the hackathon and commercial use with attribution.

## 4.5 USGS Astrogeology services: what to use when

| Service | Use it for | License | Access |
|---|---|---|---|
| **ISIS** | Rigorous planetary image processing/cartography; camera models; mosaics | CC0 | Install via conda; heavy |
| **ASP** | Stereo DTMs from CTX/HiRISE; point clouds | Apache-2.0 | Install; heavy |
| **STAC API** | Analysis-ready HiRISE/CTX DTMs, THEMIS, LOLA; COGs | CC0-1.0 | `https://stac.astrogeology.usgs.gov/api/` |
| **PILOT** | Raw image search/footprints | USGS public domain | `https://pilot.wr.usgs.gov/` |
| **Map-a-Planet 2** | Map-project/clip/convert; GeoTIFF/ISIS/PDS3 | USGS public domain | `https://astrogeology.usgs.gov/tools/map-a-planet-2` |
| **Astropedia** | Searchable map/product catalog | USGS public domain | `https://astrogeology.usgs.gov/search` |
| **Planetary Geologic Mapping Hub** | Interactive geologic maps; ArcGIS | USGS public domain | `https://astrogeology-usgs.hub.arcgis.com/` |
| **TADP / PAAD** | Terrestrial analogs; OGC services | USGS public domain / CC0 | See section 5 |
| **LGRS** | Lunar astronaut navigation grids | CC0-1.0 | `https://doi.org/10.5066/P1MEQ6UK` |

**NASA open-source discovery.** `code.nasa.gov` (NASA software catalog), `github.com/nasa`
(agency repos), `github.com/NASA-IMPACT` (Prithvi, IMPACT tools), `github.com/NASA-AMMOS`
(MMGIS, mission operations tools), and `github.com/USGS-Astrogeology` (ISIS) are the best
starting points. All checked live on 2026-11-14. Licenses vary per repo; check each.

**Coordinate-system gotchas:** Moon uses IAU_2015:30100 (planetocentric) or ESRI:104903;
Mars uses IAU_2015:49901/49900 and planetographic vs planetocentric latitudes. HiRISE/
CTX/MOLA products are typically planetocentric, positive-east. MOLA elevations are relative
to the Mars aeroid; LOLA to a mean lunar radius. Always check the label; do not mix.

---

# 5. Earth analog site databases

The challenge's core difficulty is that terrestrial analog knowledge is scattered across
PDFs, point layers, and project archives. Here is the actual landscape.

| Database/resource | What it contains | Format | Access | License | Verified? | Gap/opportunity |
|---|---|---|---|---|---|---|
| **USGS Terrestrial Analogs Data Portal (TADP)** | Data/metadata for analog field research; ScienceBase-backed; OGC WMS/WFS/CSW | Web + OGC services; files vary | Open | USGS public domain/CC0; datasets vary | **VERIFIED** page; JS text confirms ScienceBase/OGC | It is a **data archive**, not a similarity/ranking tool. Build the search/ranking layer on top. |
| **USGS PAAD** | 45 dune-field analog sites; bedforms, climate class, sand source/composition, lat/lon, elevation, area | Data release (tabular/geospatial) | Open | **CC0 1.0** | **PARTIAL** (DOI 403; USGS snippet) | Dune/aeolian only; great for a Mars aeolian filter. |
| **USGS Known Terrestrial Analog Sites** | Point layer of craters, dunes, volcanoes, etc. | Shapefile/GeoJSON | Open | USGS public domain (no explicit license) | **PARTIAL** (DOI 403; data.gov metadata) | Points without rich attributes; needs characterization. |
| **ESA Catalogue of Planetary Analogues (CAFE TN2)** | Feature-class → site mapping for Moon/Mars (impact, volcanic, fluvial, aeolian, ice, astrobiology); site access/logistics | PDF (2012) | Open | ESA study; cite authors | **VERIFIED** PDF | Static, old, not queryable. Good source to seed a DB. |
| **IMEWG "Mars on Earth"** | Planned interactive Mars analog site database, Cesium-based | Web; in development | Open | IMEWG/agency terms | **VERIFIED** page | Not a live public DB yet. A Space Apps team could ship the missing MVP. |
| **NASA Analog Missions** | Active/past analog missions/facilities (CHAPEA, HERA, NEEMO, Antarctic stations, etc.) | Web | Open | NASA public domain | **VERIFIED** | Mission/facility focus, not site attributes. |
| **NASA Planetary Analog Explorer** | Side-by-side Earth/other-world image pairs | Web gallery | Open | NASA public domain | **VERIFIED** | Inspirational, not quantitative. |
| **NASA Astrobiology Field Sites** | Field sites with habitability/biosignature context | Web | Open | NASA public domain | **VERIFIED** | Text-heavy; no structured attributes. |
| **Mars Society analog stations** | MDRS (Utah), Flashline (Devon Island), etc. | Web table | Open | Mars Society | **VERIFIED** | Operational/human-factors analogs, not geological attributes. |
| **Portuguese Space Analogue Catalogue** | National analog sites/facilities; methodology | PDF | Open | Portuguese Space Agency | **VERIFIED** | Example of how to structure a national catalogue. |
| **USGS Catalog of Existing Field Guides** | Field guides for Southwestern US, Hawai'i, Mexico analogs | Web/PDF | Open | USGS public domain | **PARTIAL** (403; search snippet) | Great content for field-guide concepts. |

**What is missing (the opportunity).**
- No public, queryable **multi-criteria analog similarity** service.
- No unified **feature schema** across TADP, PAAD, Known Sites, ESA catalogue.
- No **match/mismatch** explanation; most resources say "this is an analog" without
  quantifying where it fails.
- No **link from an analog site to a specific Moon/Mars base/landing site** with data.

A 48h project can define a small schema (terrain, climate, geology, water/ice, biology,
operations), populate it for 20–50 sites from TADP/PAAD/ESA/Known Sites + Earthdata, and
use Jev + Gemini to rank/explain. That is novel and defensible.

---

# 6. How Jev could perform multi-criteria site ranking

## 6.1 Architecture

```
candidate sites
   |
   +-- deterministic feature extraction (GIS) --> normalized criteria table
   |                                             (slope, illumination, Earth vis,
   |                                              temperature, ice proxy, roughness,
   |                                              dust, access, etc.)
   |
   +-- Jev (one request per site) -------------> qualitative rubric scores + confidence
   |   Score x N criteria
   |   Noul x hard gates
   |   Choice x archetype
   |
   +-- code: normalize, weight, rank, Pareto, sensitivity
   |
   +-- Gemini: explain the ranking, write site briefs, interpret images
```

**Why Jev and not just a weighted overlay?** Because some criteria are qualitative and
context-dependent: "science value", "analog fidelity", "traversability", "operational
risk", "constructability". A weighted overlay needs a number for these; Jev provides a
calibrated, rubric-based number with confidence, and can flag when the state is ambiguous.
The deterministic criteria (slope, illumination, distance) should **never** be outsourced
to Jev; compute them in GIS.

## 6.2 Criteria and rubrics (lunar south-pole example)

| Criterion | Type | Example rubric (0–4) | Source of truth |
|---|---|---|---|
| Slope safety | Deterministic + Jev sanity check | 0 >25°, 1 20–25°, 2 15–20°, 3 10–15°, 4 <10° | LOLA DEM `gdaldem slope` |
| Illumination | Deterministic | 0 <20%, 1 20–40%, 2 40–60%, 3 60–80%, 4 >80% of mission window | LOLA DEM + Horizons Sun vector; Lunaserv polar illumination % |
| Earth visibility (DTE) | Deterministic | 0 <10%, 1 10–30%, 2 30–50%, 3 50–70%, 4 >70% | Horizons Earth az/el + terrain horizon; Earth angular diameter |
| Ice access | Deterministic + Jev | 0 >20 km from PSR/WEH, 1 10–20 km, 2 5–10 km, 3 1–5 km, 4 <1 km + WEH >0.5 wt% | LEND WEH, PSR mask, Mini-RF CPR, Diviner ice depth |
| Thermal margin | Deterministic | 0 outside equipment limits, 1 marginal, 2 heaters needed, 3 good, 4 benign | Diviner summer/winter avg/max/min |
| Traversability | Deterministic + Jev | 0 impassable, 1 >30°, 2 20–30°, 3 10–20°, 4 <10° with smooth paths | LOLA slope/roughness; route cost |
| Science value | **Jev Score** | 0 common terrain, 1 some interest, 2 diverse units, 3 contact/unique feature, 4 PSR/volatile access + diverse geology | Site description + images + GIS context |
| Operational risk | **Jev Score** | 0 unacceptable, 1 high, 2 moderate, 3 low, 4 very low | Text + image + constraints |
| Analog/archetype | **Jev Choice** | ridge / crater rim / plateau / massif / plain | Site description |

**Rubric design rules (important):**
- Use **atomic** questions: one dimension per Score. Do not ask "rate this site" — ask
  "rate the science value", "rate the traversability", etc. The official composite-scoring
  guide says exactly this.
- Use **descriptive levels**, not numbers. Jev judges each level against the state; the
  words are the prompt surface. Rewriting the levels moves the probabilities more than
  anything else.
- Use `Noul` for **hard gates** where a yes/no is meaningful: "Is the mean slope below
  15°?", "Is Earth above the horizon for at least 30% of the surface stay?", "Is the site
  within 10 km of a PSR?".
- Use `Choice` for **archetype/route type**, not for ranking a continuous scale.
- **Confidence**: if confidence is low, do not auto-rank; show "needs review" and ask for
  more data. The docs recommend three bands: high = act, medium = confirm, low = gather
  more info.

## 6.3 Example Jev request (data shape, not app code)

```json
{
  "model": "jev-latest",
  "state": {
    "site": "Connecting Ridge",
    "features": {
      "mean_slope_deg": 8.4,
      "max_slope_deg": 14.1,
      "illumination_pct": 72,
      "earth_visibility_pct": 41,
      "dist_to_psr_km": 3.2,
      "weh_wt_pct": 0.18,
      "summer_max_temp_k": 310,
      "winter_min_temp_k": 95
    },
    "description": "A ridge near Shackleton with long illuminated segments and access to a PSR; steep sections near the crater rim; limited DTE."
  },
  "questions": {
    "slope_safety": {
      "type": "score",
      "instructions": "How safe is the terrain for landing and surface operations?",
      "criteria": [
        "Slopes above 25 degrees; unacceptable",
        "20-25 degrees; high risk",
        "15-20 degrees; marginal",
        "10-15 degrees; acceptable with care",
        "Below 10 degrees; safe"
      ]
    },
    "science_value": {
      "type": "score",
      "instructions": "How scientifically valuable is this site for a south-pole mission?",
      "criteria": [
        "Common terrain; little unique science",
        "Some interesting geology",
        "Diverse geologic units or a contact",
        "Unique feature or strong volatile access",
        "Exceptional: PSR/volatile access plus diverse, well-exposed geology"
      ]
    },
    "traversability": {
      "type": "score",
      "instructions": "How traversable is the site for suited astronauts and a rover?",
      "criteria": [
        "Impassable",
        "Slopes above 30 degrees or dense hazards",
        "20-30 degrees; difficult",
        "10-20 degrees; manageable",
        "Below 10 degrees with smooth paths"
      ]
    },
    "hard_gate": {
      "type": "noul",
      "instructions": "Does the site meet the slope and DTE minimums for a crewed surface stay?"
    },
    "archetype": {
      "type": "choice",
      "instructions": "Which archetype best describes the site?",
      "criteria": {
        "ridge": "An elongated ridge or connecting saddle",
        "crater_rim": "A crater rim or massif",
        "plateau": "A broad plateau or plain",
        "psr_margin": "The margin of a permanently shadowed region"
      }
    }
  }
}
```

What comes back (shape): each Score has `score` (0–4, may be fractional),
`probabilities`, `confidence`; Noul has `noul` (0–1); Choice has `choice`,
`probabilities`, `confidence`. Code normalizes Score/4, applies weights, and ranks.

## 6.4 Combining scores in code (the important part)

1. **Normalize** each Score to 0–1: `score / (levels - 1)`. For 5 levels, divide by 4.
2. **Direction**: some criteria are benefits (science, illumination), some are costs
   (risk, slope). Invert costs (`1 - normalized`) or define the rubric so higher is always
   better (as above).
3. **Weights**: start with mission-phase profiles:
   - **Science profile**: science 35%, illumination 15%, DTE 15%, ice 20%, safety 15%.
   - **Operations profile**: safety 30%, illumination 25%, DTE 25%, ice 10%, science 10%.
   - **Resource profile**: ice 35%, illumination 20%, DTE 15%, safety 20%, science 10%.
4. **Composite**: weighted sum; also show the **Pareto frontier** (which sites are not
   dominated on all criteria) and a **sensitivity band** (min/max rank across plausible
   weights).
5. **Hard gates**: if a Noul is below your threshold (e.g., <0.9), mark "fail" or
   "needs review" rather than averaging it away.
6. **Confidence**: if the average confidence is low, show "ranking uncertain"; do not
   present a single winner.
7. **Explainability**: show each criterion's contribution; Gemini writes the narrative
   from the contribution table (not from scratch).

## 6.5 Cost, latency, and batching

- **One site** with 8 questions and a 1,500-token state ≈ 2,000 tokens → **$0.000084** at
  $0.042/M. Nine sites ≈ **$0.0008**. Even 100 sites is under a cent.
- **Latency** 70–500 ms per request; 9 requests in parallel ≈ 1–2 s. Use a thread pool/
  async; respect rate limits (429/529 with backoff).
- **Context**: 64k per request/32k per question; a site state + 8 rubrics fits easily.
  If you need long reports, use the 262k long-context header (slower/less accurate).
- **Images**: experimental; do not put 20 images in a Jev request. Use Gemini for images,
  Jev for text/structured features. If you must, one small image + `Box` (1.14) for a
  feature location; validate.
- **Batching**: one request per site, not one request for all sites (Jev answers per
  question, not per candidate). If you have 100 sites, batch 10 concurrent requests.

## 6.6 Pitfalls

- **Asking Jev to compute**: "What is the slope?" is a GIS question. Give it the slope and
  ask "Is this slope safe for landing?".
- **Too many dimensions in one Score**: decompose; the docs warn that multi-dimensional
  questions are ambiguous and lower confidence.
- **Weights hidden in prose**: keep weights in code, visible in the UI; Jev should not
  decide the policy.
- **Over-trusting confidence**: confidence is a shape statistic, not ground truth; calibrate
  on a few expert-labeled sites.
- **Rubric wording**: the option/level descriptions are the entire prompt surface; test
  two versions and compare ranks.
- **Vendor claims**: "can't hallucinate" is about type errors, not scientific truth; the
  state can be wrong, the rubric can be bad, the site description can mislead.
- **Access**: early access/rate limits; have an OpenRouter fallback and cache results.

## 6.7 Which model for which ranking task

| Task | Best fit | Why |
|---|---|---|
| Rank 9 lunar sites on 8 text/feature criteria | **Jev** | Cheapest/fastest; calibrated scores; structured features; no image dependency |
| Rank 100 Earth image chips by visual analog | **Gemini Decision 1** or **Gemini Embedding 2** | Multimodal; 262k/1,000 questions; embeddings for retrieval |
| Score a site from a mix of text + images + PDF | **Gemini Decision 1** | Native image/video/audio/PDF; 0 output tokens |
| Locate a feature in one image (bbox) | **Jev Box** (1.14) or **Gemini** segmentation | Jev Box is experimental; Gemini gives masks/boxes with more context |
| Write the "why" narrative | **Gemini 4 Hydrogen** | Generative explanation from contribution table + images |
| Find visually similar terrain chips | **Gemini Embedding 2** | Cross-modal embeddings; cheap per image |

**Recommendation:** use **Jev as the primary ranking judge** (the user asked for it), and
**Gemini Decision 1 as a multimodal second opinion** on a shortlist. If Jev access fails,
Gemini Decision 1 is a credible fallback at $0.10/M input. This also gives you a nice
"model ensemble" story for judges: two independent decision models agree on the top sites.

---

# 7. How Gemini 4 Hydrogen could interpret orbital imagery

## 7.1 What it can and cannot do

**Can (verified in docs):**
- Caption/classify/describe images; visual question answering.
- **Object detection** with bounding boxes normalized to 0–1000.
- **Segmentation** with contour masks (base64 PNG probability maps) inside bounding boxes.
- Multi-image reasoning (3,000 images/documents per the Cloud model page; the general Gemini API image guide says 3,600 image files; 1M context).
- Video understanding (flyovers), audio (narration/transcription), PDF (PDS SIS, papers).
- Structured outputs (JSON schema) for reliable parsing.
- Code execution/function calling for simple calculations/tools.
- Grounding with Google Search/Maps (not useful for planetary nomenclature; avoid or
  cross-check).

**Cannot / should not:**
- Georeference an image or return lat/lon.
- Measure slope, elevation, or distance precisely from pixels.
- Guarantee feature detection on out-of-distribution planetary imagery.
- Replace a DEM/GIS calculation.
- Generate images (no image output); do not fake surface imagery.
- Know post-March-2026 mission facts from its weights; use NASA docs.

## 7.2 Preprocessing that makes orbital imagery legible

1. **Choose the right product:** HiRISE (0.25–0.5 m) for boulders/route hazards; CTX (6 m)
   for context; LROC NAC (0.5 m) for lunar; LOLA/MOLA hillshade for terrain; THEMIS night
   IR for thermal; CRISM for mineralogy; MARCI for weather.
2. **Convert to 8-bit PNG/JPEG** with a sensible stretch; preserve a linear version for
   analysis. Do not send 16-bit cubes directly.
3. **Add a scale bar, north arrow, and coordinate grid** in the image or prompt. State the
   m/px, sun azimuth/elevation, instrument, band composite, and location.
4. **Tile large images** into 768×768 or 1,024×1,024 chips with overlap; keep a manifest
   mapping chip → parent extent. This is essential for token control and georeferencing.
5. **Pair context + detail:** CTX context chip + HiRISE detail chip + DEM hillshade; ask
   Gemini to reconcile.
6. **Include a "reference" image** of a known feature (e.g., a boulder field, a scarp) if
   you want consistent labels.
7. **Avoid compression artifacts**; use lossless PNG for small chips; JPEG quality 90+ for
   large.

## 7.3 Prompt pattern for a route/hazard interpretation

```
Role: You are a planetary geologist supporting a crewed Mars EVA.
Inputs:
- Image A: HiRISE ortho, 0.25 m/px, north up, sun az 135 deg, elev 35 deg.
- Image B: CTX context, 6 m/px, same area.
- Image C: HiRISE DTM hillshade, 1 m/px.
- Metadata: Jezero crater, lat 18.4N, lon 77.5E; mission objective: delta stratigraphy.
Task:
1) Describe terrain units and their boundaries.
2) Identify hazards for a suited astronaut: boulders >1 m, steep scarps, sand traps,
   craters, fractured bedrock. Give box_2d [ymin,xmin,ymax,xmax] normalized 0-1000,
   severity, and confidence.
3) Identify science targets: outcrops, stratigraphic contacts, sample-worthy rocks.
4) For each waypoint, write a 2-sentence "what to expect" note.
5) List what must be verified in GIS/DEM (slope, height, distance) and what you are
   uncertain about.
Output: JSON matching the provided schema. Do not invent coordinates; boxes are
image-relative. Mark low-confidence items.
```

**Structured output schema (shape):**

```json
{
  "type": "object",
  "properties": {
    "terrain_units": {"type": "array", "items": {"type": "string"}},
    "hazards": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "label": {"type": "string"},
          "box_2d": {"type": "array", "items": {"type": "integer"}},
          "severity": {"type": "string"},
          "confidence": {"type": "number"}
        }
      }
    },
    "science_targets": {"type": "array", "items": {"type": "object"}},
    "traverse_notes": {"type": "array", "items": {"type": "string"}},
    "verification": {"type": "array", "items": {"type": "string"}}
  }
}
```

## 7.4 Multi-image and multi-layer strategies

- **Optical + topographic:** ask Gemini to compare a HiRISE image with a hillshade and flag
  features that look like scarps but may be lighting artifacts.
- **Optical + thermal:** ask whether a dark patch is likely bedrock, sand, or shadow; the
  thermal layer can disambiguate.
- **Optical + spectral:** ask whether a bright unit is likely sulfate/clay/ice; CRISM
  context helps, but Gemini should not identify minerals without spectral data.
- **Surface + POV:** give Gemini the orbital chip and the Perseverance/Curiosity POV image;
  ask whether the POV is consistent with the mapped terrain unit and what to expect next.
- **Video:** a flyover can be used for a route briefing; ask for a shot list/feature log,
  not precise measurements.
- **PDF:** feed a PDS SIS or a site report for context; ask for a summary of data caveats.

## 7.5 Verification and evaluation (do not skip)

1. **Label a small test set:** 20–30 image chips with known features (boulders, crater
   rims, scarps, dunes, bedrock). Count precision/recall for Gemini's boxes/labels.
2. **Overlay boxes on the image** and visually inspect; check that boxes are not
   hallucinated.
3. **Cross-check with GIS:** compute slope/height for each detected hazard; reject
   detections that are inconsistent with the DEM.
4. **Measure size-frequency:** use the image scale to convert masks/boxes to meters; compare
   to known boulder distributions.
5. **Report uncertainty:** show confidence and "verify in GIS" flags in the UI.
6. **Do not overclaim:** say "AI-assisted interpretation, validated against DEM/slope" not
   "AI mapped the site".

## 7.6 Token/cost math for a 48h demo

- A 2,048×2,048 HiRISE chip → roughly 3×3 = 9 tiles of 768×768 → 9×258 = **2,322 tokens**.
- 20 chips → **46,440 tokens**; with prompts/metadata ~60k → **$0.09** input at $1.50/M.
- Output 10k tokens → **$0.075**. Total under **$0.20** for a demo.
- A 4,000×4,000 chip → ~25 tiles → 6,450 tokens; 20 chips → 129k tokens → **$0.19** input.
- Use `thinking_level=low` for triage, `high`/`xhigh` for complex geology; use the Batch
  API (half price) for offline processing.
- The per-request image cap (3,000 images/documents on the Cloud model page; 3,600 image
  files in the general Gemini API guide) and the 1M context mean you can feed a whole
  EVA's worth of chips in one request, but cost/latency scale; batch by waypoint.

## 7.7 Where Gemini genuinely adds value

- **Field notes and narration:** turn structured features into readable waypoint briefs,
  audio guides, and public explanations.
- **Hazard candidate generation:** propose boulders/scarps/sand traps for human/GIS review.
- **Cross-layer reconciliation:** explain why optical and thermal disagree.
- **Science target triage:** rank outcrops by apparent stratigraphic interest (with human
  validation).
- **POV interpretation:** tell the astronaut what they are looking at and what to sample.
- **Accessibility:** captions, alt text, translated/plain-language versions, audio.

## 7.8 Where it must not be used

- Computing slope, elevation, distance, illumination, or Earth visibility.
- Deciding alone whether a route is safe or a landing site is viable.
- Identifying minerals without spectral data.
- Generating fake surface imagery or "artist's concepts" presented as data.
- Making mission-critical decisions without human review.

---

## 7.9 Cross-challenge recommendation (if the team wants one core engine)

All three challenges can share one **planetary site-intelligence engine**:

| Layer | Shared component |
|---|---|
| Map/3D | CesiumJS or MapLibre + Trek WMTS + USGS STAC COGs; GDAL preprocessing |
| Terrain | LOLA/MOLA DEM + HiRISE/CTX DTMs; slope/hillshade/roughness |
| Site features | illumination, Earth visibility, temperature, ice proxies, hazards, access |
| Decision | Jev rubric scoring + code weights + Pareto/sensitivity |
| Vision | Gemini 4 Hydrogen image interpretation/segmentation + briefs |
| Similarity | Gemini Embedding 2 image/text chips (optional) |
| UI | dither design system: 1-bit map tiles, Bayer arcs, mission-control type |

Three skins: **Analog Atlas** (Challenge A), **Sun/Earth Horizon Studio** (Challenge B),
**Mars Survival Field Guide** (Challenge C). If the team has 3–5 people, build one skin
deeply rather than three shallowly. The shared engine is the 48h multiplier: the same
LOLA/MOLA slope code, the same Jev ranking wrapper, and the same dither map components
serve all three.

**Suggested 3–5 person split:** 1 GIS/data engineer (GDAL, tiles, ephemeris), 1
frontend/3D designer (Cesium/MapLibre, dither system), 1 AI engineer (Jev/Gemini prompts,
evaluation, caching), 1 domain scientist/storyteller (site selection, geology, script),
and — if available — 1 designer/demo lead. The domain scientist is not optional: the
challenge rewards scientific validity and "where the analogy breaks".

# 8. Key findings

- **The Artemis framing has changed.** As of 2026-10, Artemis III is a **2027 LEO test**;
  the first crewed landing is **Artemis IV, targeted for 2028**. The nine 2024 candidate
  regions are Artemis III-specific and may not carry over. Any lunar app should say this;
  judges will notice.
- **Lunaserv is the lunar secret weapon.** It is a live, BSD-3, OGC WMS 1.1.1 service with
  **352 named entries in GetCapabilities**, including dynamic Sun illumination (`TIME`), polar illumination
  percentages, PSR masks, LEND water-equivalent hydrogen, Diviner ice-stability depth, and
  numeric WAC elevation. It also advertises a Cesium terrain format (though my sample
  looked like a raw heightmap, not quantized-mesh). QuickMap's engine is available to you.
- **Horizons gives the demo moment.** At 0°E, 89.9°S on 2026-12-01, the Sun is ~1.49° above
  the horizon while **Earth is ~−1.5° below it** — sunlight but no DTE. That is the
  challenge in one screenshot.
- **Moon Trek and Mars Trek are real, no-auth WMTS APIs.** I measured **1,096 Moon EQ +
  396 south-polar + 173 north-polar** layers and **146 Mars EQ + 6 south-polar + 7
  north-polar** layers. Sample tiles downloaded. They are imagery, not terrain; pair them
  with LOLA/MOLA/STAC for 3D.
- **USGS STAC is the fastest path to Mars high-res terrain.** It exposes CC0-1.0 STAC
  collections with **COG assets on S3** for HiRISE/CTX DTMs, THEMIS, and LOLA — no auth,
  analysis-ready. This is a major 48h accelerator.
- **The Mars ice stack is real and directly downloadable.** SWIM provides 3 km GeoTIFFs
  (0–1 m, 1–5 m, >5 m) at ~25 MB each; SHARAD provides radargrams/3D volumes; CRISM/TES
  provide mineralogy/thermal context. Ice is a first-class layer, not a footnote.
- **Jev is real and uniquely suited to calibrated multi-criteria ranking.** $0.042/M input,
  64k context, 70–500 ms (vendor-claimed), Choice/Score/Noul, images/Box experimental. Use it as a judge,
  not a calculator; precompute features in GIS.
- **Gemini 4 Hydrogen is real (2026-11-12) and is the right vision-language interpreter.**
  1M context, text/image/video/audio/PDF input, structured outputs, object detection/
  segmentation, $1.50/$7.50. Use it for eyes/narration, not measurement.
- **Gemini Decision 1 is a direct Jev competitor** with multimodal input, 262k context,
  1,000 questions, zero output tokens, $0.10/M — a credible fallback/ensemble partner.
  **Gemini Embedding 2** adds cheap image/text similarity for analog search.
- **Space Apps 2026 AI rules are strict on attribution.** AI is an execution tool, not an
  idea generator; watermark AI-generated images/videos; no NASA branding in AI content;
  cite every source; at least one challenge-listed NASA data source; 30s/7 slides; team
  2–6 (Universal Event). The 2026 term is **"Super Intelligence (SI)"**.

# 9. Open questions

1. **Artemis IV site selection:** Will NASA reuse the nine 2024 Artemis III candidate
   regions, or publish a new set for Artemis IV? NASA has not said. The app should not
   assume.
2. **Official region polygons/coordinates:** NASA published names, not point coordinates.
   The USGS LGRS grids (CC0) are the best public footprint source; community datasets
   (e.g., Zenodo CC-BY-4.0) are approximations, not official.
3. **Lunaserv Cesium terrain format:** Is `application/x-cesium-terrain` a raw heightmap,
   a heightmap-1.0 tile, or a custom format? My sample was 256×256 float-like + 1 byte.
   Needs a loader test before using it as a 3D dependency.
4. **Jev access for the whole team:** early access/waitlist vs OpenRouter (`jev-1.13`).
   Will 1.14 be on OpenRouter by the hackathon? Rate limits? Test on day 0.
5. **Jev image/Box accuracy on planetary images:** explicitly experimental; no public
   planetary benchmark. Measure on 20–30 labeled chips before trusting it.
6. **Gemini 4 Hydrogen planetary accuracy:** no public planetary benchmark; out-of-
   distribution. Build a small labeled test set and report precision/recall.
7. **Mars "current conditions" latency:** MEDA PDS collection we checked stops 2025-12-28;
   MARCI v2 is climatology through ~MY34. Is there a newer MEDA/MARCI release for Nov 2026?
   If not, label "latest available" and use MCS/MCD for context.
8. **SWIM license:** publicly downloadable, NASA-funded, but no explicit license file.
   Confirm before redistributing; credit PSI/JPL.
9. **Cesium ion licensing:** Community free is personal/non-commercial; a public/commercial
   product needs $149/mo. For a hackathon demo, fine; for a winner's product, plan around
   it (self-host Trek WMTS + terrain).
10. **Earth analog feature comparability:** Earth sensors and Moon/Mars sensors measure
    different things at different scales. A weighted similarity can be misleading without
    uncertainty. What is the minimum defensible feature set?
11. **"SI" vs "AI" in the submission:** the 2026 FAQ says use "SI"; judges may use either.
    Use "SI" in the form and define it once in the project description.
12. **Does the dither aesthetic hurt data legibility?** Test with users; provide an
    "analysis mode" toggle. Dither should encode data, not just decorate it.






