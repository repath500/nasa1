# DS1 findings: SAR, MODIS/VIIRS fire hotspots, and farms

Prepared: 2026-11-14

Scope: the three 2026 challenges assigned to this sub-agent, read in full from `research/challenges/`:

- `dancing-with-the-sars.md`
- `modis-and-viirs-hot-spots.md`
- `adapting-farms-with-nasa-data.md`

Verification legend used throughout:

- **VERIFIED** — I fetched the official page/API on 2026-11-14 and confirmed the claim; URL given.
- **PARTIAL** — an official page exists, but a key detail (current date coverage, exact licence, approval latency) could not be confirmed.
- **UNVERIFIED** — I could not confirm it; treat it as a hypothesis or a question to resolve.
- **JUDGMENT** — my assessment, not a factual claim.

The short version: the fire challenge is the most winnable of the three; the farms challenge has the highest ceiling but needs agronomic discipline; the SAR challenge has the highest novelty but carries NISAR data-maturity and interpretation risk. Across all three, access is not the blocker — Earthdata Login is free and effectively instant, FIRMS keys are emailed, POWER/GLAM need no auth, and OpenET keys are self-serve. The real constraints are data volume, sensor bias, local validation, and honest AI use.

---

## 0. Executive summary

- **Fire is the best 48-hour bet.** FIRMS is the only resource in the challenge's Resources tab, the API is simple, the harmonization gap is real, and the 2026 sensor transition gives a strong story. The winning differentiator is not another fire map; it is a documented, uncertainty-aware harmonization of MODIS and VIIRS into a burning calendar.
- **The fire record is at an inflection point.** Suomi NPP VIIRS science data ceased on 2 November 2026, and MODIS Terra/Aqua are ending in 2026–2027. A team that ignores this will build a tool that is already stale. A team that handles it explicitly will look like the only adults in the room.
- **NISAR is live but young.** Validated L-band products were released 6 November 2026 for acquisitions from 21 October 2026; the validated record is only weeks long. PROVISIONAL products cover June–October 2026, and BETA products cover earlier. Use PROVISIONAL for time series and label maturity clearly.
- **OPERA is the practical SAR shortcut.** DISP-S1 (2016–present, North America), DSWx-S1 (water), DIST-ALERT-S1 (disturbance) and RTC-S1 (backscatter) are analysis-ready and far smaller than raw NISAR. DISP-NI is not available; ASF says production is expected in February 2027 at the earliest.
- **HyP3 is Sentinel-1 only.** It is excellent for on-demand RTC/InSAR, with 8,000 free credits per month, but it cannot process NISAR. Do not design a NISAR pipeline around HyP3.
- **Auth is easy; volume and interpretation are hard.** Earthdata Login: free, email activation, minutes. FIRMS MAP_KEY: emailed, instant, 5,000 transactions/10 min. OpenET: free account and key, quotas. NASA POWER and GLAM: no auth. NISAR S-band via ISRO Bhoonidhi is the one access path with an unknown approval latency.
- **Cloud-native access is uneven.** HLS and OPERA are COGs; OPERA DISP exposes Zarr assets; NISAR, SMAP and GPM are HDF5. Use `earthaccess` + CMR-STAC for discovery, COG range reads for imagery, DuckDB/Parquet for FIRMS, and precompute derived assets for the demo.
- **AI fit is clear if you split the work.** Gemini 4 Hydrogen is the narrative/multimodal layer (1M context, free tier, PDF/image/audio/video input). Jev 1.13 is the typed decision layer (choice/noul/score, 262K context, $0.042 per 1M input tokens, ~0.08 s P50). Prithvi is the EO classifier (crop/burn-scar, Apache 2.0) — but note that the Prithvi Sen1Floods11 checkpoint uses Sentinel-2 optical bands, not Sentinel-1 SAR.
- **Space Apps rules are strict on disclosure.** AI is allowed, but AI-generated images/videos need a visible watermark, audio and code/data need acknowledgement in text/metadata, all sources and licences must be cited, and submissions default to Apache 2.0. AI-generated content must not use NASA branding.

---

## 1. AI model verification (cross-cutting)

The team goals name two models specifically. Both exist and are usable, but they are very different tools. Do not treat either as a general-purpose oracle.

### 1.1 Jev 1.13 (TypeSafe)

**What it is.** Jev is TypeSafe's flagship "System One" model: a structured decision model that takes an unstructured state and returns typed answers with probabilities rather than free-form text. The primitives are:

- **Choice** — pick one option from a set you define, returning a probability per option.
- **Noul** — answer yes/no, returning the probability of yes.
- **Score** — place the input on an ordered scale you define, returning a probability-weighted position.
- **Box** — return a bounding box (useful for images).

It also understands images. It does not write explanations, code, or prose. TypeSafe describes it as "unstructured state in, typed probabilistic decisions out" and claims it "can't hallucinate" because it does not generate strings. Treat that as a vendor claim, not a guarantee: the probabilities can still be miscalibrated for your domain, and the questions/criteria you write can be leading.

**Access and price (VERIFIED, 2026-11-14).**

- OpenRouter model page: <https://openrouter.ai/typesafe/jev-1.13>
- OpenRouter tutorial: <https://openrouter.ai/docs/guides/community/jev-tutorial>
- TypeSafe docs: <https://docs.typesafe.ai/concepts/system-one>
- Model ID: `typesafe/jev-1.13`
- Endpoint: `POST https://openrouter.ai/api/alpha/decisions`
- Auth: `Authorization: Bearer $OPENROUTER_API_KEY`
- Context: **262K tokens** (OpenRouter model page). A third-party site claims 64K; the official OpenRouter page is the source I trust. Mark the 64K claim **UNVERIFIED/conflicting**.
- Price: **$0.042 per 1M input tokens; output free** (OpenRouter).
- Latency: P50 ~0.08 s on TypeSafe's hosted provider (OpenRouter performance table).
- Released: 18 September 2026 (OpenRouter).
- Availability: TypeSafe early access/waitlist is mentioned in the TypeSafe launch post; OpenRouter is the practical no-waitlist route if you have an OpenRouter account and credits. **VERIFIED** that OpenRouter hosts it; **UNVERIFIED** that every account has immediate access without credit/region checks.

**Why it fits a hackathon.** It is cheap, fast, and returns a value your UI can branch on directly. It is ideal for "alert level", "which process is this?", "is this rotation water-safe?" and "which sensor is driving the anomaly?" It is not the right tool for writing the farmer briefing or the fire narrative.

**Constraints.**

- It cannot explain itself. You must generate the explanation separately (Gemini) or from templates.
- It is a classifier/ranker, not a geospatial model. You must compute the features (backscatter change, anomaly z-score, soil moisture, etc.) yourself.
- Its probabilities are only as good as the state and criteria you provide. Keep the state compact, numeric, and dated.
- The `/api/alpha/decisions` endpoint is alpha; pin the model and have a deterministic fallback.

### 1.2 Gemini 4 Hydrogen (Google DeepMind)

**What it is.** Gemini 4 Hydrogen is a Gemini 4-family multimodal model released 12 November 2026, positioned for fast agentic and coding workflows rather than the deepest long-horizon reasoning (that is Gemini 4 Carbon/Argon). It is adapted from Gemini 4 Carbon.

**Capabilities (VERIFIED, official model card and AI Studio docs).**

- Model ID: `gemini-4-hydrogen`
- Model card: <https://deepmind.google/models/model-cards/gemini-4-hydrogen/>
- AI Studio model docs: <https://aistudio.google.com/docs/models/gemini-4-hydrogen>
- Developer guide: <https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/guides/gemini-4-hydrogen>
- Inputs: text, images, audio, video, PDF, and Office/OpenDocument files.
- Outputs: text (no image or audio generation).
- Context: **1,048,576 tokens unified input+output**.
- Output: 65,536 tokens default synchronous; up to 1,048,576 via long decode/background.
- Thinking levels: LOW, MEDIUM, HIGH (default), XHIGH.
- Tools: structured outputs, function calling, code execution, computer use, Google Search/Maps grounding, URL context, file search.
- Caching: implicit only; explicit caching not supported (until the announced 2027 cache-control change).
- API surfaces: Gemini API (`GenerateContent`, Interactions), Google AI Studio, Gemini for business, Vertex/Google Cloud; OpenAI-compatible Chat Completions is supported.
- Limits: custom temperature/top_p/top_k are ignored; context caching is implicit; grounding is billed per query; free tier is rate-limited and uses your content to improve products (paid tier does not). This last point matters for farmer data.

**Price (VERIFIED, 2026-11-14).**

- Pricing page: <https://ai.google.dev/gemini-api/docs/pricing>
- Free tier: **free of charge, rate-limited**. No published per-model RPM/TPM/RPD numbers; check AI Studio for your project.
- Paid standard: **$1.50 per 1M input tokens; $7.50 per 1M output tokens** (including thinking tokens).
- Implicit cache: $0.075 per 1M cached input tokens.
- Batch/Flex: $0.75 input / $3.75 output per 1M.
- Priority: $2.70 input / $13.50 output per 1M.
- Grounding with Google Search: 5,000 free requests/month shared across Gemini 3+ models, then $14 per 1,000 requests, daily cap 1,500.

**Why it fits.** It can read a soil-test PDF, a fire-management plan, a map screenshot, or a farmer's voice note, and return structured JSON plus a plain-language explanation. The 1M context lets you feed a whole season of statistics and several documents without chunking. The free tier is enough for a demo; use the paid tier for any sensitive farm data.

**Constraints.**

- It is not a GIS engine. It cannot compute a z-score or a water balance reliably; compute those deterministically and let Gemini explain them.
- It can hallucinate citations, dates and physical mechanisms. Constrain it with structured inputs, a schema, and a "say UNKNOWN if not in the data" instruction.
- Free-tier data may be used to improve Google products. For farmer data, prefer paid tier or anonymize.
- Image/audio/video input is supported, but output is text only; do not promise generated imagery.

### 1.3 Prithvi and other EO models

**Prithvi-EO-2.0 (NASA/IBM/Jülich).** A ViT-based masked-autoencoder EO foundation model pretrained on HLS v2 at 30 m, six bands (Blue, Green, Red, Narrow NIR, SWIR1, SWIR2), with 3D patch embeddings and optional time/location embeddings. Sizes: tiny, 100M, 300M, 600M; TL variants include time/location. Licence: **Apache-2.0** (Hugging Face model cards; verified).

- Model family: <https://huggingface.co/ibm-nasa-geospatial>
- 300M: <https://huggingface.co/ibm-nasa-geospatial/Prithvi-EO-2.0-300M>
- 600M: <https://huggingface.co/ibm-nasa-geospatial/Prithvi-EO-2.0-600M>
- Fine-tuning: TerraTorch (Apache-2.0; <https://github.com/IBM/terratorch>).
- Crop example: <https://github.com/NASA-IMPACT/Prithvi-EO-2.0/blob/main/examples/example_multitemporalcrop.ipynb>.
- Burn-scar checkpoint: <https://huggingface.co/ibm-nasa-geospatial/Prithvi-EO-2.0-300M-BurnScars> (Apache-2.0).
- Important: the Prithvi Sen1Floods11 checkpoint uses **Sentinel-2 optical bands**, not Sentinel-1 SAR. It is not a SAR flood model. The benchmark includes Sentinel-1, but this checkpoint's inputs are Blue/Green/Red/Narrow NIR/SWIR1/SWIR2. Do not claim SAR input. (VERIFIED from the model card.)

**Prithvi-EO-1.0 crop model.** The crop-specific checkpoint is `Prithvi-EO-1.0-100M-multi-temporal-crop-classification` (Apache-2.0). It is fine-tuned on HLS + USDA CDL, 13 classes, input chips 224×224×18 (6 bands × 3 timesteps), and reports mIoU 0.4269 / aAcc 60.64% on its held-out split. That is a useful baseline, not a production crop classifier, and it is U.S.-CDL-biased. (VERIFIED: <https://huggingface.co/ibm-nasa-geospatial/Prithvi-EO-1.0-100M-multi-temporal-crop-classification>.)

**Other AI options worth considering.**

- **Gemini embeddings / file search** for local crop guides, fire-management plans, and extension bulletins; useful for retrieval-augmented explanation, but not necessary for a 48-hour MVP.
- **Prithvi burn-scar** for fire-scar mapping from HLS; strong optional layer for the fire challenge.
- **On-device models**: not needed for a web app; avoid adding complexity.
- **Generic LLM agents**: Gemini 4 Hydrogen already covers tool use and structured output; a separate agent framework is optional, not required.

### 1.4 Space Apps AI, attribution and licensing rules

These are the rules I could verify for 2026. They matter for judging and for disqualification risk.

**AI is permitted, with disclosure.** The NASA Space Apps team states that AI tools are permitted, but generated content may not use/contain/modify NASA branding or design elements (logos, flags, mission identifiers). Teams must clearly indicate where and how AI was used:

- Images and videos: visible watermark indicating AI-generated.
- Audio: acknowledgement in descriptive text and metadata.
- Code and data: acknowledgement in descriptive text and metadata.

Sources: <https://github.com/nasa/spaceapps/discussions/1849>, <https://github.com/nasa/spaceapps/discussions/1947>.

**Global Awards require a listed NASA data source.** For Global Awards, the project must use at least one NASA data source included in the challenge's Resources tab. Other NASA/partner data is encouraged but optional. All sources, including open-source code, must be cited. Source: <https://github.com/nasa/spaceapps/discussions/1827>.

**Open source and licensing.** All posted solutions must be freely available without restriction or OSI-approved open source. If you do not specify a licence, NASA distributes original content under Apache 2.0. Third-party materials must also be open/free, and all licences must be identified in the documentation. Source: <https://www.spaceappschallenge.org/legal/>.

**Timing and team size.** Challenge-specific development must happen during the official hackathon (14–15 November 2026; 9 am local start). Pre-work such as research, resource review and team formation is allowed. For Global Judging at the Universal Event, teams need 2–6 participants. The demo is a video of no more than 30 seconds or a presentation of no more than seven slides including title/closing. Sources: <https://github.com/nasa/spaceapps/discussions/1827>, <https://github.com/nasa/spaceapps/discussions/1947>.

**Practical implication.** Put an "AI use" panel in the app and README: model names/versions, what was AI-generated, what was deterministic, prompts/inputs summary, and a visible watermark on any AI-generated imagery. Do not use the NASA logo or a mission patch in AI-generated art. Credit every dataset with its DOI/URL and licence.

---

## 2. Access and cloud-native patterns (cross-cutting)

### 2.1 Auth/API-key cheat sheet

| Service / dataset | Auth needed | How to get it | Time to get | Notes |
|---|---|---|---|---|
| NASA Earthdata Login (NISAR, Sentinel-1 via ASF, OPERA, SMAP, HLS, GPM, GEDI, SRTM, NLDAS/GLDAS, MODIS/VIIRS via LP DAAC) | Earthdata Login username/password or bearer token | <https://urs.earthdata.nasa.gov/users/new>; verify email | **Minutes** (email activation) | One account works across EOSDIS DAACs. Some DAACs/services may ask you to approve an application; usually automatic. VERIFIED: <https://urs.earthdata.nasa.gov/documentation/for_users/how_to_register>. |
| FIRMS API / WMS / WFS | FIRMS `MAP_KEY` (not EDL) | <https://firms.modaps.eosdis.nasa.gov/api/map_key/>; enter email; click confirmation | **Minutes / effectively instant** | Key is emailed. Limit 5,000 transactions per 10 minutes. The key travels in the URL path, so do not log full URLs. VERIFIED: <https://firms.modaps.eosdis.nasa.gov/api/map_key/>. |
| OpenET API | OpenET account + API key | <https://etdata.org/api/>; create account; generate key in dashboard | **Minutes** (self-serve) | Free but quota-limited; up to 50,000 acres/query, 50 polygons/query, 100 field IDs/query. Terms: visible attribution, no bulk redistribution; Data Explorer licence is personal/non-commercial; API terms allow commercial applications but not IP rights in the API/data. VERIFIED: <https://etdata.org/api/>, <https://etdata.org/terms-of-service/>. |
| NASA POWER | None | — | Immediate | Public REST API; no key. VERIFIED: endpoint returned 200 JSON on 2026-11-14. |
| GLAM (GIMMS) | None | — | Immediate | Public `gettbl`/`getplt` API. VERIFIED: <https://glam1.gsfc.nasa.gov/api/doc/about>. |
| Gemini API | Google AI Studio API key | <https://aistudio.google.com/apikey> | **Minutes** | Free tier rate-limited; paid tier requires billing. New keys are auth keys bound to a service account by default (since 28 May 2026). VERIFIED: <https://ai.google.dev/gemini-api/docs/api-key>. |
| Jev via OpenRouter | OpenRouter API key + credits | <https://openrouter.ai/settings/keys> | **Minutes** | Model `typesafe/jev-1.13`; $0.042/1M input, output free. Alpha decisions endpoint. VERIFIED: <https://openrouter.ai/typesafe/jev-1.13>. |
| Prithvi / TerraTorch | None for public HF models; HF token optional | Hugging Face download; `pip install terratorch` | **Minutes** | Apache-2.0 models; no gated approval observed. GPU recommended. VERIFIED: HF model cards. |
| Copernicus Sentinel-2 / Data Space | Copernicus Data Space account | <https://dataspace.copernicus.eu> | **Minutes** | Free/open; attribution required. PARTIAL on exact approval flow. |
| ERA5 / CDS | CDS account + API key | <https://cds.climate.copernicus.eu> | **Minutes** | Copernicus licence; free. PARTIAL on exact approval flow. |
| ISRO Bhoonidhi (NISAR S-band) | ISRO/Bhoonidhi registration | <https://bhoonidhi.nrsc.gov.in> | **Unknown; possibly manual** | S-band is not on ASF. Allow a day; do not make it the critical path. **UNVERIFIED** latency. |
| USDA QuickStats | API key | <https://quickstats.nass.usda.gov/api> | **Minutes** | Free; U.S. data. PARTIAL. |
| USDA Ag Data Commons | None for most datasets | <https://data.nal.usda.gov> | Immediate | Licences vary per dataset; check each. PARTIAL. |
| PRISM | None | <https://prism.oregonstate.edu> | Immediate | Free with attribution; data are copyrighted by Oregon State University but freely reproducible/distributed with the required citation. VERIFIED: <https://prism.oregonstate.edu/terms/>. |

**Bottom line:** if the team has one Earthdata Login, one FIRMS key, one OpenRouter key and one Gemini key, it can build any of the three projects. The only access risk is NISAR S-band, which is not needed for an L-band project.

### 2.2 earthaccess

`earthaccess` is a Python library that handles Earthdata Login, CMR search, downloads and temporary S3 credentials. Licence: **MIT** (verified from the repository LICENSE and PyPI classifier). Current version observed: 0.19.0 (PyPI, 2026-11-14).

- Docs: <https://earthaccess.readthedocs.io/en/stable/>
- Quick start: <https://earthaccess.readthedocs.io/en/stable/user/quick-start/>
- Auth: `earthaccess.login()` with environment variables, `.netrc`, or interactive prompt.
- Search: `earthaccess.search_data(short_name=..., temporal=..., bounding_box=...)`.
- Access: `earthaccess.download(...)` or `earthaccess.open(...)`; S3 credentials are valid for **1 hour**.
- NISAR caveat: the NISAR docs say you must pass the NISAR-specific S3 endpoint (`https://nisar.asf.earthdatacloud.nasa.gov/s3credentials`) to `get_s3_filesystem`; using `daac='ASF'` errors. Direct S3 access is only available from AWS `us-west-2`. VERIFIED: <https://nisar-docs.asf.alaska.edu/earthaccess/>.

Why it matters: one auth/session layer for NISAR, HLS, SMAP, GPM, OPERA and Sentinel-1 metadata. It is the fastest way to get from an idea to a reproducible data pull without writing auth code.

### 2.3 STAC

STAC (SpatioTemporal Asset Catalog) is a metadata standard for searchable geospatial assets. It is not a data format; it points to assets (COG, HDF5, Zarr, etc.) with geometry/time/properties.

Verified live endpoints (2026-11-14):

- NASA CMR-STAC root: <https://cmr.earthdata.nasa.gov/stac/> (200, JSON).
- ASF provider catalog: <https://cmr.earthdata.nasa.gov/stac/ASF> — includes NISAR validated/provisional collections, Sentinel-1A/C/D, OPERA DISP-S1/RTC-S1/CSLC-S1/DIST-ALERT-S1, ARIA, ALOS, UAVSAR.
- LP DAAC provider catalog: <https://cmr.earthdata.nasa.gov/stac/LPCLOUD> — includes `HLSL30_2.0`, `HLSS30_2.0`, GEDI, ECOSTRESS, etc.
- PO.DAAC provider catalog: <https://cmr.earthdata.nasa.gov/stac/POCLOUD> — includes OPERA DSWx-S1/DSWx-HLS.
- NSIDC provider catalog: <https://cmr.earthdata.nasa.gov/stac/NSIDC_CPRD> — includes SMAP.
- Microsoft Planetary Computer STAC: <https://planetarycomputer.microsoft.com/api/stac/v1> — includes `hls2-l30` and `hls2-s30`. This is a useful alternative for HLS without EDL, using Planetary Computer SAS tokens; check the collection licence/attribution.

Example NISAR STAC item path (verified): the ASF `NISAR_L2_GCOV_V1_1` collection exposes items whose assets include an S3 prefix (`s3://sds-n-cumulus-prod-nisar-products/...`) and an S3 credentials endpoint. STAC metadata is open; the data assets still require EDL/S3 credentials.

Libraries: `pystac` (Apache-2.0), `pystac-client` (Apache-2.0), `odc-stac`, `stackstac`. `pystac-client` is enough to search a collection by bbox/datetime and read asset hrefs.

### 2.4 COGs

A Cloud Optimized GeoTIFF is a GeoTIFF with internal tiling and overviews, designed for HTTP range reads. You can read a small window of a huge image without downloading the whole file. This is the right format for web maps and time-series subsets.

Where it is used:

- **HLS L30/S30**: every band is a separate COG (verified: <https://hls.gsfc.nasa.gov/data-access-and-tools/>).
- **OPERA RTC-S1, DSWx-S1, DIST-ALERT-S1**: COG/GeoTIFF products (verified via CMR summaries; RTC sample 6.8 MB per granule).
- **Landsat/Sentinel-2**: COG or tiled GeoTIFF depending on provider.
- **OPERA DISP-S1**: the Earthdata catalog lists netCDF-4, PNG and Zarr assets; the product docs describe HDF5. Treat the format as "HDF5/netCDF-4 with Zarr sidecars; verify the asset you need." **PARTIAL.**

Tools: `rio-tiler` (BSD-3), `titiler` (MIT), `rasterio` (BSD-3), `rioxarray`, `GDAL`. For a 48-hour app, precompute the COG windows you need into small PNG/GeoTIFF tiles; do not build a tile server unless someone on the team has done it before.

### 2.5 Zarr

Zarr is a chunked N-dimensional array format for cloud storage. It is excellent for time-series cubes and parallel reads, but it is not universal in NASA data.

Where it is used:

- **OPERA DISP-S1**: the Earthdata catalog lists Zarr, and CMR granules include `.zarr.json.gz` assets (verified from a sample granule). This is the best case for `xarray` + `zarr`.
- **Some cloud-native collections** in Earthdata Cloud and Planetary Computer.
- **Not** NISAR (HDF5), **not** SMAP (HDF5), **not** GPM (HDF5/NetCDF), **not** FIRMS (CSV/API).

Tools: `zarr` (MIT), `xarray`, `dask`, `fsspec`. For NISAR/SMAP/GPM, use `h5py`/`xarray` with `h5netcdf` and download or stream the HDF5; do not assume Zarr.

**Common library licences (for the attribution section).**

| Library | Licence |
|---|---|
| earthaccess | MIT |
| asf_search | BSD-3-Clause |
| hyp3_sdk | BSD-3-Clause |
| pystac / pystac-client | Apache-2.0 |
| rio-tiler | BSD-3-Clause |
| titiler | MIT |
| rasterio | BSD-3-Clause |
| rioxarray | Apache-2.0 |
| xarray | Apache-2.0 |
| dask | BSD-3-Clause |
| h5py | BSD-3-Clause |
| zarr | MIT |
| pandas | BSD-3-Clause |
| DuckDB | MIT |
| GDAL | MIT/X11 |
| PyTorch | BSD-3-Clause |
| TerraTorch | Apache-2.0 |

Frontend choices depend on the team: React and Next.js are MIT; deck.gl is MIT; MapLibre GL JS is BSD-3-Clause. Verify the exact version's licence before submission.

### 2.6 Practical pipeline patterns

**Pattern A — fire calendar (best for 48h).**

1. Pull FIRMS MODIS_SP and VIIRS NOAA-20/21 SP for the AOI, or the archive download for the long record.
2. Store raw detections as Parquet partitioned by sensor/year/month.
3. Filter confidence, remove duplicates, aggregate to monthly counts on a 0.1° or 0.25° grid.
4. Harmonize with an overlap-period correction; compute anomalies vs a 2003–2025 baseline.
5. Serve a JSON matrix + CSV; render the calendar and map in the browser.
6. Use Gemini for the narrative and Jev for the alert/driver classification.

**Pattern B — NISAR change flipbook.**

1. Search ASF for NISAR GCOV over the study area and date range; choose 3–6 granules from one track/polarization.
2. Download (0.8 GB each) or stream from S3 in `us-west-2`.
3. Read the GCOV covariance terms with `h5py`/`xarray`; convert to gamma0 dB.
4. Co-register by the product grid (GCOV is already geocoded/terrain-corrected); subset/decimate.
5. Compute log-ratio/dB difference and a simple change mask; export PNG/COG.
6. Dither the PNGs, build the scrubber, and let Gemini/Jev explain the change.

**Pattern C — farm field brief.**

1. Draw a field polygon; get area and soil map units (SSURGO in the U.S.; SoilGrids globally).
2. Pull POWER daily climate (no auth), IMERG precipitation (EDL), SMAP L4 soil moisture (EDL), OpenET ET (key), HLS/GLAM NDVI (EDL/no auth).
3. Reduce each to monthly/seasonal features on the field; store as a small table.
4. Score 3+ rotations with a transparent multi-criteria model.
5. Use Prithvi for current crop classification (optional), Gemini to explain the evidence table, Jev to score water safety/risk.
6. Export a one-page field brief (PDF/CSV) with evidence chips and caveats.

**Caching.** For a 48-hour demo, precompute everything you can: monthly FIRMS aggregates, NISAR PNGs, HLS NDVI series, OpenET monthly ET, and AI narratives for the demo AOIs. The live app should not depend on a 4 GB download during judging.

---

## 3. Challenge: Dancing with the SARs

### 3.1 Challenge in one paragraph

Build an interactive application that uses **NISAR** radar data to track and visualize one or more types of surface change at a location on Earth. The real ask is not "make a SAR viewer"; it is "translate complex radar observations into actionable insight for non-specialists." Hidden judging hooks: (a) you actually use NISAR, not only Sentinel-1; (b) you pick a specific study area and tell a physical story with a time series; (c) you correctly handle polarizations/frequencies and explain what the radar is sensitive to (roughness, dielectric constant, structure); (d) you contextualize with optical/GIS/population/land-cover data; (e) you hypothesize drivers and state uncertainty; (f) the result is open-source, user-friendly and visually compelling. Must-include items from the text: an interactive application, NISAR data, one or more surface-change types, a location, a time series, and an accessible summary in any medium (app, story map, video, report).

**Critical 2026 context.** NISAR launched 30 July 2025 into a 747 km sun-synchronous orbit with a 12-day repeat and an average ~6-day revisit using ascending and descending passes. It carries an L-band (24 cm) and an S-band (9.4 cm) radar; the L-band is global, while S-band is acquired over India and cal/val sites. L-band penetrates vegetation, which is why it is useful for agriculture, wetlands and biomass. L-band data are archived at ASF; S-band is at ISRO Bhoonidhi. Validated L-band products were released 6 November 2026 for acquisitions from 21 October 2026; PROVISIONAL products cover 17 June–part of 23 October 2026; BETA products cover earlier acquisitions. The validated record is only weeks long as of the hackathon. Any multi-date story must either use PROVISIONAL/BETA data with clear maturity labels, or combine NISAR with Sentinel-1/OPERA for the historical context. (VERIFIED: <https://science.nasa.gov/mission/nisar/mission-overview/>, <https://nisar-docs.asf.alaska.edu/availability-overview/>, <https://nisar-docs.asf.alaska.edu/products-overview/>.)

### 3.2 Data and resources table

Official challenge resources plus the extras that matter.

| Name | URL | Format | Access/auth | Size | License | Verified? | Notes |
|---|---|---|---|---|---|---|---|
| NASA Earthdata Search | <https://search.earthdata.nasa.gov/search> | Web UI / CMR | Earthdata Login for download | Catalog | NASA open (CC0 default) | Yes | Discovery across all EOSDIS holdings. |
| ASF Data Search Vertex | <https://search.asf.alaska.edu/> | Web UI / API | Earthdata Login for download | Catalog | NASA/ASF open; Sentinel data Copernicus | Yes | Best SAR search: NISAR, Sentinel-1, OPERA, ARIA, ALOS, UAVSAR. |
| NISAR Data User Guide | <https://nisar-docs.asf.alaska.edu/> | Docs | None | — | NASA | Yes | Products, access, tutorials, citation. |
| Intro to Remote Sensing | <https://www.earthdata.nasa.gov/learn/earth-observation-data-basics/remote-sensing> | Web | None | — | NASA | Yes | Background. |
| Intro to SAR | <https://www.earthdata.nasa.gov/learn/earth-observation-data-basics/sar> | Web | None | — | NASA | Yes | Frequency, polarization, scattering. |
| NASA ARSET | <https://appliedsciences.nasa.gov/get-involved/training> | Web/training | None | — | NASA | Yes | SAR/NISAR intro materials in English/Spanish. |
| NISAR StoryMaps | <https://nisar.jpl.nasa.gov/applications/arcgis-storymaps/> | Web maps | None | — | NASA | Yes | Floods, wildfire, subsidence, oil slicks, glaciers. |
| NISAR Applications White Papers | <https://nisar.jpl.nasa.gov/applications/societal-benefit/> | PDF | None | ~2 pages each | NASA | Yes | Application framing. |
| UAVSAR Postcards | <https://uavsar.jpl.nasa.gov/education/postcards.html> | Images | None | — | NASA | Yes | False-color SAR examples; good for visual literacy. |
| RCM data (CSA) | <https://donnees-data.asc-csa.gc.ca/en/dataset/rcm> | SAR products | CSA registration | Varies | Open (check CSA terms) | Yes | Canadian C-band SAR; optional. |
| CSA SAR Python tutorial | <https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial> | Python/QGIS | None | — | Check repo licence | Yes | Practical SAR visualization; verify licence before reuse. |
| RADARSAT-1 data | <https://donnees-data.asc-csa.gc.ca/en/dataset/radarsat1> | SAR products | CSA registration | Varies | Open (CSA) | Yes | Historical C-band; optional. |
| SAOCOM Catalogue | <https://catalogos.conae.gov.ar/catalogo/catalogoSatSaocomInfo.html> | SAR products | CONAE registration | Varies | CONAE terms | Yes | L-band; optional. |
| SAOCOM registration | <https://www.argentina.gob.ar/noticias/la-informacion-saocom-cada-vez-mas-accesible> | Web | CONAE registration | — | CONAE terms | Yes | "One Click" profile. |
| **NISAR GCOV** | <https://nisar-docs.asf.alaska.edu/gcov/> | HDF5 | Earthdata Login; S3 | ~0.8 GB/granule (sample) | NASA open | Yes | Best product for change detection; 10/20/80 m; gamma0 RTC; covariance terms. |
| **NISAR GSLC** | <https://nisar-docs.asf.alaska.edu/products-overview/> | HDF5 | Earthdata Login; S3 | ~4.35 GB/granule (sample) | NASA open | Yes | Phase-preserving; for interferometry/coherence. |
| **NISAR GUNW** | <https://nisar-docs.asf.alaska.edu/products-overview/> | HDF5 | Earthdata Login; S3 | ~1.4 GB/granule (sample) | NASA open | Yes | Unwrapped interferogram; displacement; 80 m (20 m wrapped). |
| **NISAR SME2** | <https://nisar-docs.asf.alaska.edu/products-overview/> | HDF5 | Earthdata Login; S3 | 200 m product | NASA open | Yes | L3 soil moisture; validated SME2 not yet available as of Nov 2026. |
| **Sentinel-1 (A/C/D)** | <https://search.asf.alaska.edu/> | SLC/GRD/OCN | Earthdata Login | SLC ~4–8 GB; GRD ~1 GB (approx.) | Copernicus open, attribution | Yes | Historical context and cross-sensor validation. S1A ended 30 Jun 2026; S1C/S1D operational, 6-day repeat. |
| **OPERA DISP-S1** | <https://www.earthdata.nasa.gov/data/catalog/asf-opera-l3-disp-s1-v1-1> | HDF5/netCDF-4/Zarr | Earthdata Login | ~136 MB/granule (sample) | NASA open; contains modified Copernicus data | Yes | 2016–present, North America, 30 m; surface displacement. |
| **OPERA RTC-S1** | <https://www.earthdata.nasa.gov/data/catalog/asf-opera-l2-rtc-s1-v1-1> | HDF5/GeoTIFF | Earthdata Login | ~6.8 MB/granule (sample) | NASA open; Copernicus attribution | Yes | Near-global 30 m; Jan 2022 onward. |
| **OPERA DSWx-S1** | <https://cmr.earthdata.nasa.gov/search/concepts/C2949811996-POCLOUD.html> | GeoTIFF | Earthdata Login | 30 m product | NASA open; Copernicus attribution | Yes | Surface water >3 ha/200 m wide; 6–12 day; forward production Sept 2024. |
| **OPERA DIST-ALERT-S1** | <https://www.earthdata.nasa.gov/data/catalog/asf-opera-l3-dist-alert-s1-v1-1> | GeoTIFF | Earthdata Login | 30 m product | NASA open; Copernicus attribution | Yes | Vegetation/surface disturbance alerts; validated 2026. |
| **OPERA CSLC-S1** | <https://www.earthdata.nasa.gov/data/catalog/asf-opera-l2-cslc-s1-v1-1> | HDF5 | Earthdata Login | Varies | NASA open; Copernicus attribution | Yes | Coregistered SLC; input to DISP. |
| **HyP3** | <https://hyp3-docs.asf.alaska.edu/> | On-demand RTC/InSAR | Earthdata Login | RTC 30 m; InSAR 80/40 m | ASF/NASA; Sentinel data Copernicus | Yes | Sentinel-1 only. 8,000 free credits/month; RTC 5, InSAR 15; products expire 14 days. |
| **asf_search** | <https://github.com/asfadmin/Discovery-asf_search> | Python | Earthdata Login for download | — | BSD-3-Clause | Yes | Programmatic ASF search. |
| **earthaccess** | <https://earthaccess.readthedocs.io/> | Python | Earthdata Login | — | MIT | Yes | CMR search + S3 creds. |
| **NISAR Cookbook** | <https://github.com/ASFOpenSARlab/NISAR_Cookbook> | Jupyter | None (data access needs EDL) | — | Apache-2.0 | Yes | GCOV access/loading/backscatter tutorials. |
| **OpenSARLab change detection** | <https://github.com/ASFOpenSARlab/opensarlab-notebooks> | Jupyter | None | — | Check repo licence | Yes | Log-ratio, percentile-difference, coefficient-of-variation methods. |
| **NISAR S-band (ISRO)** | <https://bhoonidhi.nrsc.gov.in/NISAR/NisarProducts.html> | SAR products | ISRO/Bhoonidhi registration | Varies | ISRO terms | Yes | ~48 h latency; not on ASF. Do not put on critical path. |
| **Copernicus DEM** | <https://dataspace.copernicus.eu> | COG/DEM | Copernicus account | 30/90 m | Copernicus | Yes | Used in NISAR/OPERA processing; useful for terrain context. |
| **WorldPop / GPW** | <https://www.worldpop.org/> | Raster | None/registration | 100 m–1 km | CC BY 4.0 (check) | Partial | Population context for impact stories. |

**NISAR sample availability (searched 2026-11-14, ASF API).** GCOV products were returned for the Amazon (2 Nov 2026), Netherlands (4 Nov 2026), California (27 Oct 2026), Bangladesh (11 Nov 2026, urgent response) and Kenya (28 Oct 2026). That is enough for a multi-date demo, but the products are a mix of provisional/validated/urgent-response collections; filter by collection and state maturity. Sample granule IDs are in the appendix.

### 3.3 What NISAR gives you, product by product

**GCOV (Geocoded Polarimetric Covariance).** This is the workhorse for a 48-hour change-detection app. It is Level 2, geocoded to UTM/polar stereographic, radiometrically terrain-corrected to gamma0, and delivered as HDF5. Pixel spacing is 10, 20 or 80 m depending on the acquisition. The diagonal covariance terms (HHHH, HVHV, VVVV, etc.) are real-valued backscatter intensity; off-diagonal terms are complex and only present for quad-pol. For most change detection, use HH/HV or VV/VH diagonal terms in dB. It is already analysis-ready: no SLC processing, no terrain correction, no geocoding. That is why it is the right choice. (VERIFIED: <https://nisar-docs.asf.alaska.edu/gcov/>.)

**GSLC (Geocoded Single Look Complex).** Phase-preserving, 5–40 m, geocoded; useful for coherence and interferometry, but 4.35 GB/granule in the sample. Only use it if you have a SAR-literate teammate and a specific coherence question.

**GUNW (Geocoded Unwrapped Interferogram).** 80 m (20 m wrapped), with unwrapped phase, coherence, connected components and ionospheric phase screen. It is the product for earthquakes, subsidence and glaciers. 1.4 GB/granule. It requires a pair of acquisitions; not every track has a suitable pair. High story value, high technical risk.

**SME2 (Soil Moisture).** Level 3, 200 m, three soil-moisture estimates (disaggregation, physical model inversion, time-series ratio). Validated SME2 is not yet available as of November 2026; PROVISIONAL exists. Do not build a farm-moisture product on validated NISAR soil moisture yet.

**RSLC/GSLC/GUNW/GOFF/ROFF/RIFG/RUNW.** Level 1/2 products for advanced users. A 48-hour team should not start here unless the project is explicitly about interferometry.

**Maturity levels.** BETA (February 2026; pre-calibration; subset of Oct 2025–Jan 2026), PROVISIONAL (July 2026; calibrated, partially validated; 17 June–part of 23 October 2026), VALIDATED (6 November 2026; L0–L2; acquisitions from 21 October 2026). Do not mix maturity levels in a trend without labeling; ASF explicitly warns that BETA and PROVISIONAL should not be analyzed together without care. The February 2026 BETA release alone was more than 100,000 products and more than 500 TB, which is why a 48-hour team must subset aggressively. (VERIFIED: <https://nisar-docs.asf.alaska.edu/availability-overview/>.)

**S-band.** ISRO's Bhoonidhi portal serves NISAR S-band products over India and cal/val sites, with ~48 h latency. It is not in the ASF archive. If your story is global, use L-band. If your story is India-specific, S-band is a bonus but adds an access dependency.

### 3.4 Sentinel-1, ASF and OPERA: the supporting cast

**Sentinel-1.** C-band, free and open, global, with a 6-day repeat since Sentinel-1C and Sentinel-1D reached their final configuration in June 2026. Sentinel-1A ended operations on 30 June 2026; Sentinel-1B failed in December 2021 and ended in 2022. The archive remains; new data come from S1C/S1D. ASF Vertex is the easiest search/download for NASA users; EDL is required. Use Sentinel-1 for the historical context that NISAR does not yet have, and as a cross-sensor sanity check. (VERIFIED: <https://sentinels.copernicus.eu/-/copernicus-sentinel%E2%80%911a-satellite-end-of-operations-after-12-years-of-service>, <https://sentiwiki.copernicus.eu/web/s1-mission>.)

**ASF DAAC / Vertex.** ASF operates the NASA SAR archive and the NISAR L-band archive. Vertex is the GUI; `asf_search` is the Python API; both support NISAR, Sentinel-1, OPERA, ARIA, ALOS, UAVSAR and more. Metadata search is open; downloads require EDL. The ASF API is convenient for counting/listing granules without downloading. (VERIFIED: <https://search.asf.alaska.edu/>, <https://nisar-docs.asf.alaska.edu/asf-search/>.)

**OPERA.** The Observational Products for End-Users from Remote Sensing Analysis project produces analysis-ready products from Sentinel-1 and HLS:

- **RTC-S1**: 30 m radiometric terrain-corrected backscatter, near-global, Jan 2022 onward; ~6.8 MB/granule.
- **CSLC-S1**: coregistered SLC, North America, 2016 onward; input to DISP.
- **DISP-S1**: 30 m surface displacement, North America, 2016–present; ~136 MB/granule; HDF5/netCDF-4/Zarr.
- **DSWx-S1**: 30 m surface water extent, near-global, 6–12 day, forward production Sept 2024; maps water >3 ha and >200 m wide.
- **DIST-ALERT-S1**: 30 m surface disturbance alerts, validated 2026.
- **DISP-NI**: NISAR surface displacement — **not available**; ASF says production expected February 2027 at the earliest. Do not promise it.
- **DSWx-NI**: NISAR surface water — scheduled/in development; check current status before relying on it.
- **TROPO**: global tropospheric zenith radar delay, 0.07°, sensor-agnostic, July 2016 onward; useful as an atmospheric correction layer.
- **DSWx-HLS / DIST-HLS**: the optical siblings of DSWx-S1/DIST-S1, 30 m; useful context even in a SAR project.
- **VLM-S1 / VLM-NI**: vertical land motion products planned for 2028; not hackathon material.

Why OPERA matters: it lets a team tell a SAR story without processing SLCs. For a 48-hour project, DISP-S1 (subsidence), DSWx-S1 (water) and DIST-ALERT-S1 (disturbance) are far more feasible than raw NISAR interferometry. (VERIFIED: <https://www.jpl.nasa.gov/go/opera/products/>, <https://www.earthdata.nasa.gov/data/catalog/asf-opera-l3-disp-s1-v1-1>, <https://cmr.earthdata.nasa.gov/search/concepts/C2949811996-POCLOUD.html>.)

**HyP3.** ASF's on-demand processing service for Sentinel-1 only. It produces RTC (10/20/30 m) and InSAR (80/40 m), plus burst InSAR and autoRIFT. HyP3 Basic gives 8,000 free credits/month; RTC 30 m costs 5 credits, InSAR 40 m costs 15, burst InSAR costs 1–110 depending on pairs. Products expire after 14 days. HyP3+ sells credits at $0.05 each. Auth is EDL; the API is REST/OpenAPI; `hyp3_sdk` wraps it. It is not a NISAR service. (VERIFIED: <https://hyp3-docs.asf.alaska.edu/>, <https://hyp3-docs.asf.alaska.edu/using/credits/>.)

### 3.5 Open-source and prior art

| Project / model | What it gives you | Licence | Link |
|---|---|---|---|
| ASF NISAR Cookbook | GCOV data access, loading, backscatter visualization | Apache-2.0 | <https://github.com/ASFOpenSARlab/NISAR_Cookbook> |
| OpenSARLab notebooks | SAR change detection (log ratio, percentile difference, CV) | Check repo licence | <https://github.com/ASFOpenSARlab/opensarlab-notebooks> |
| `asf_search` | Search ASF holdings programmatically | BSD-3-Clause | <https://github.com/asfadmin/Discovery-asf_search> |
| `hyp3_sdk` | Submit HyP3 jobs programmatically | BSD-3-Clause | <https://github.com/ASFHyP3/hyp3-sdk> |
| `dolphin` | OPERA DISP InSAR time-series algorithm | BSD-3-Clause or Apache-2.0 | <https://github.com/isce-framework/dolphin> |
| `disp-s1` | OPERA DISP-S1 science algorithm | BSD-3-Clause or Apache-2.0 | <https://github.com/opera-adt/disp-s1> |
| `earthaccess` | Auth/search/S3 | MIT | <https://github.com/earthaccess-dev/earthaccess> |
| `pystac` / `pystac-client` | STAC search | Apache-2.0 | <https://github.com/stac-utils/pystac-client> |
| `rio-tiler` / `titiler` | COG tile serving | BSD-3 / MIT | <https://github.com/cogeotiff/rio-tiler>, <https://github.com/developmentseed/titiler> |
| ASF Displacement Portal | OPERA DISP browsing | NASA/ASF | <https://displacement.asf.alaska.edu/> |
| 2019 Space Apps "Massa" | SAR oil-spill tracking/warning (Galactic Impact) | Unknown | <https://2019.spaceappschallenge.org/challenges/living-our-world/spot-fire-v20/> |
| NISAR StoryMaps | Application narratives for floods/fire/subsidence/glaciers | NASA | <https://nisar.jpl.nasa.gov/applications/arcgis-storymaps/> |

**Prior-art lesson.** The 2019 Massa project shows that a SAR story with a clear societal hook can win. The NISAR Cookbook shows that the technical barrier is now much lower: GCOV is analysis-ready, geocoded, terrain-corrected gamma0. The differentiator is interpretation and storytelling, not raw processing.

### 3.6 Project concepts

Scores are 1–10. "AI fit" means how much the new AI models genuinely add, not whether AI is mentioned.

#### S1. "Surface Waltz" — a dithered NISAR change flipbook

- **Pitch:** Pick a place on Earth and watch its surface dance in radar light: a six-frame, 1-bit flipbook of NISAR backscatter that reveals floods, harvests, deforestation, and ice moving in time.
- **Target user:** educators, local resource managers, journalists, and the curious public; SAR experts can inspect provenance.
- **Core experience:** choose a study area (Bangladesh haor, Netherlands polder, Amazon frontier, Kenya rangeland, California coast); the app loads 3–6 NISAR GCOV dates in HH/HV or VV/VH, plus optional Sentinel-1/OPERA DSWx; a dithered B/W sequence with a scrubber; a "change lens" highlights log-ratio changes; clicking a patch opens a "what changed?" panel with the evidence.
- **Demo wow:** the "breathing wetland" animation. The AI narration: "Between these two 12-day acquisitions, HV backscatter fell about 9 dB over ~1,200 ha. That is consistent with standing water; the optical image is cloud-covered, but radar sees through. Alternative explanation: a smooth bare-soil surface — check the coherence and the optical pre-image." The honesty is the wow.
- **How it uses AI:** Jev takes a compact state (dB change HH/HV, coherence, area, shape, land-cover class, season, optical NDVI change) and answers `is_significant` (noul), `process` (choice: flood, agriculture, deforestation, fire, subsidence, other), `confidence` (score). Gemini 4 Hydrogen takes the change statistics + a map PNG + optional optical image and returns a structured JSON explanation with physical mechanism, alternative explanations, and caveats. It can also answer follow-up questions about polarization.
- **Data pipeline:** ASF search -> download 3–6 GCOV (~0.8 GB each) -> read covariance terms with `h5py`/`xarray` -> gamma0 dB -> log-ratio -> decimate/export PNG/COG -> dither -> web app. Cache derived PNGs; never make the demo depend on live S3.
- **48-hour MVP:** one study area, three dates, one polarization pair, log-ratio change mask, dithered flipbook, Jev classification, Gemini explanation, provenance panel with product IDs and maturity levels. Stretch: three study areas, coherence from GSLC, OPERA DSWx overlay, user-drawn AOI, time-series chart, audio narration.
- **Dither UI fit:** excellent. 1-bit Bayer/ordered dithering on SAR amplitude makes speckle feel intentional; halftone change masks; mission-control typography; a "smooth/high-contrast" toggle for accessibility. Avoid fake CRT scanlines; use precise grids and restrained color.
- **Risks:** NISAR validated record is short; provisional/validated mixing; GCOV data volume; HDF5 reading; misinterpretation of layover/shadow; AI overclaiming. Mitigate with maturity labels, one track, and a "what this is not" panel.
- **Scores:** Impact 9, Feasibility 7, Novelty 8, Judge appeal 9, AI fit 7.

#### S2. "Sinking Cities" — a 10-year subsidence story with OPERA + NISAR

- **Pitch:** A city is sinking, but the ground moves slowly enough that no one sees it. Scroll through ten years of radar displacement and watch the basin deepen.
- **Target user:** urban planners, water managers, coastal communities, journalists.
- **Core experience:** choose a North American city (Houston, Mexico City, New Orleans, Phoenix) or a coastal delta; load OPERA DISP-S1 (2016–present) as a cumulative displacement/velocity map; overlay NISAR GUNW/GSLC for 2026; dithered contour lines; a "years of sinking" metric; compare with groundwater or population layers.
- **Demo wow:** "Mexico City's subsidence bowl, drawn in 1-bit contours, with a 2026 NISAR update. The AI explains why the radar line-of-sight sees vertical motion and where the phase unwrapping is uncertain."
- **How it uses AI:** Jev answers `is_displacement_significant` (noul), `driver` (choice: groundwater withdrawal, compaction, tectonics, landslide, other), `severity` (score). Gemini takes the velocity/contour PNG, the DISP metadata, and optional groundwater context and writes a planner brief with InSAR caveats.
- **Data pipeline:** OPERA DISP-S1 from ASF (136 MB/granule) -> xarray/Zarr -> cumulative displacement/velocity -> contour/PNG -> dither; NISAR GUNW optional for 2026. Use the ASF Displacement Portal for quick visual checks.
- **48-hour MVP:** one city, DISP-S1 time series, velocity map, dithered contour, AI brief, caveat panel. Stretch: NISAR GUNW 2026, groundwater overlay, multiple cities, "what would happen if pumping stopped" scenario.
- **Dither UI fit:** strong. Contour maps look like engravings; 1-bit dithering makes the slow motion legible; a "sinking" scroll animation is memorable.
- **Risks:** DISP-S1 is North America only; DISP-NI is not available (Feb 2027 earliest); GUNW is 1.4 GB and pair-dependent; InSAR interpretation is easy to get wrong; vegetation decorrelation. Mitigate by using DISP-S1, not raw InSAR, and by stating line-of-sight/vertical assumptions.
- **Scores:** Impact 9, Feasibility 6, Novelty 8, Judge appeal 9, AI fit 7.

#### S3. "Crop Pulse" — SAR agriculture watch

- **Pitch:** See a field's season in radar: planting, growth, harvest, and flood, even under clouds.
- **Target user:** agronomists, cooperatives, crop insurers, food-security analysts.
- **Core experience:** choose an agricultural region; combine NISAR GCOV time series (VV/VH) with HLS NDVI; a dithered "field pulse" calendar; detect bare soil, planting, peak growth, harvest, and flood; compare with rainfall.
- **Demo wow:** "The radar sees the harvest before the optical satellite does: HV backscatter drops as the canopy is removed; the dithered calendar shows the field's rhythm."
- **How it uses AI:** Prithvi crop classification on HLS (13 classes; optional), Jev `stage` (choice: bare, planting, growing, harvest, flood), Gemini agronomist narrative. Be honest that Prithvi is U.S.-CDL-biased.
- **Data pipeline:** HLS COG + NISAR GCOV -> co-register to the field -> NDVI/backscatter time series -> phenology metrics -> calendar; Prithvi inference optional.
- **48-hour MVP:** one region, three dates, VV/VH, HLS NDVI, calendar, AI, caveats. Stretch: crop-type map, flood detection, yield proxy, multi-field.
- **Dither UI fit:** good. A 1-bit field mosaic and halftone calendar feel like an agricultural ledger; green accent.
- **Risks:** NISAR GCOV resolution (10/20 m) and mixed pixels; crop model bias; data volume; cloud gaps in HLS. Mitigate with one crop/region and a clear "not a yield forecast" disclaimer.
- **Scores:** Impact 7, Feasibility 7, Novelty 7, Judge appeal 7, AI fit 7.

#### S4. "Quake Lens" — a coseismic deformation explainer

- **Pitch:** An earthquake in four dimensions: see the ground shift in a NISAR interferogram, then explore the fringes in a dithered 1-bit map.
- **Target user:** students, science communicators, emergency planners.
- **Core experience:** choose a recent earthquake with NISAR GUNW coverage; show wrapped/unwrapped interferogram, coherence, line-of-sight displacement; dithered fringe map; before/after slider; explain magnitude/depth and why the fringes look the way they do.
- **Demo wow:** "The ground moved X cm; the fringe pattern is the earthquake's fingerprint." The AI explains the difference between surface rupture and deep slip, and where the model is uncertain.
- **How it uses AI:** Gemini explains the interferogram and uncertainty; Jev answers `is_deformation_seismic` (noul), `mechanism` (choice: shallow rupture, deep slip, landslide, anthropogenic, other), `confidence` (score).
- **Data pipeline:** NISAR GUNW (pre/post) -> xarray -> displacement/coherence -> PNG -> dither; event catalog with USGS metadata.
- **48-hour MVP:** one event, one GUNW pair, fringe map, AI explainer, caveats. Stretch: multiple events, GNSS comparison, InSAR tutorial.
- **Dither UI fit:** excellent visually; 1-bit fringes are striking. Risk: beauty can obscure uncertainty; add a "what the fringes mean" panel.
- **Risks:** GUNW pairs may be sparse; 1.4 GB/granule; phase unwrapping errors; not all earthquakes covered; requires SAR literacy. Highest technical risk of the five.
- **Scores:** Impact 8, Feasibility 5, Novelty 8, Judge appeal 8, AI fit 6.

#### S5. "Wetland Watch" — a local story of loss and recovery

- **Pitch:** A wetland's biography, told in radar: see water return after restoration, or disappear under development.
- **Target user:** wetland managers, conservation groups, local communities, educators.
- **Core experience:** choose a wetland (Mesopotamia marshes, Louisiana coast, Amazon varzea, Sundarbans); NISAR GCOV + Sentinel-1 + OPERA DSWx; water-extent time series; dithered maps; a "water calendar"; compare with restoration/development events.
- **Demo wow:** "The marsh came back: water extent rose X% after restoration; radar saw it through clouds." The AI separates water from wet soil and names the alternative explanations.
- **How it uses AI:** Jev `water_present` (noul), `change_driver` (choice: restoration, drought, development, agriculture, other), `confidence` (score); Gemini writes a community brief with caveats.
- **Data pipeline:** NISAR GCOV + OPERA DSWx-S1 (30 m water extent) + Sentinel-1; aggregate water fraction per date; time series; dither.
- **48-hour MVP:** one wetland, three dates, water mask, AI brief. Stretch: three wetlands, restoration timeline, community stories, audio.
- **Dither UI fit:** strong. 1-bit water masks and halftone shorelines look like a field notebook; cyan accent.
- **Risks:** NISAR coverage; DSWx-S1 only from Sept 2024; wetland/water classification; data gaps. Mitigate by combining DSWx-S1 with GCOV and being explicit about dates.
- **Scores:** Impact 8, Feasibility 8, Novelty 7, Judge appeal 8, AI fit 7.

### 3.7 Recommendation

**Build S1 "Surface Waltz", with S5 "Wetland Watch" as the narrative spine.** Reasons:

1. It directly matches the challenge metaphor ("Earth's surface is an endless dance") and the required "time series + interactive visualization + broad audience."
2. It uses NISAR GCOV, which is analysis-ready, geocoded, terrain-corrected, and small enough (0.8 GB/granule) to download 3–6 dates in a hackathon.
3. It has a genuine AI role: Jev classifies the change; Gemini explains the physics and the uncertainty. The AI is not decorative.
4. The dither aesthetic is native to radar: 1-bit backscatter and halftone change masks look intentional, not gimmicky.
5. It can be honest about NISAR maturity: show the product IDs, collection maturity, and acquisition dates. Judges reward that.

If the team has an InSAR specialist, S2 "Sinking Cities" has a higher story ceiling and a 10-year record via OPERA. If the team is generalist, S1 is the safer win.

---

## 4. Challenge: Harmonization of MODIS and VIIRS Hot Spots

### 4.1 Challenge in one paragraph

Build a web application that harmonizes NASA FIRMS active-fire hotspots from MODIS and VIIRS into a consistent "burning activity calendar" for a user-selected area and date range, so that the sensor of origin no longer matters. The real ask is a **harmonized data product plus an accessible decision-support UI**, not a fire map. Hidden judging hooks: (a) you explicitly address the differences between MODIS (1 km, 0–100% confidence, Terra/Aqua overpasses) and VIIRS (375 m, low/nominal/high confidence, SNPP/NOAA-20/NOAA-21); (b) you show a method, not just a merge; (c) you handle the 2026 sensor transition; (d) the calendar shows seasonal patterns, year-to-year variability, and anomalies vs a multi-year baseline; (e) the UI supports an AOI and date range, accessible color ramps, and CSV download; (f) you state uncertainty and false-positive caveats. Must-include items from the text: a web app, user-selected region and date range, a burning calendar from the early 2000s to present, historical comparisons/anomalies, and a downloadable CSV. The challenge says "you may consider harmonizing NASA Earthdata FIRMS hotspots" — FIRMS is the only resource in the Resources tab, so use it for Global Awards eligibility.

**Critical 2026 context.** Suomi NPP VIIRS science data ceased on **2 November 2026**; FIRMS production/delivery of new SNPP active-fire data ceased at 13:00 UTC that day. NOAA-20 and NOAA-21 are the continuation; JPSS-4/NOAA-22 is planned for 2027, with JPSS-3/NOAA-23 later. MODIS Terra/Aqua are also ending: NASA's transition page says late 2026/early 2027; the MODIS instrument status presentation gives Aqua decommissioning around August 2026 (possible extension) and Terra around April 2027; other NASA/CAMS pages give Aqua around September 2027 and Terra January 2027. The dates conflict, so treat "MODIS is historical/near-historical" as the safe assumption and verify current status before relying on recent MODIS. A harmonized calendar that does not show the sensor timeline will mislead users. (VERIFIED: <https://www.earthdata.nasa.gov/news/blog/transitioning-from-suomi-npp-viirs-omps-what-firms-users-need-know>, <https://www.earthdata.nasa.gov/data/alerts-outages/transition-from-modis-viirs>, <https://modis.gsfc.nasa.gov/sci_team/meetings/202603/presentations/Session%201/Jones%20and%20Chiang%20-%20MODISInstOps_2026.pdf>.)

### 4.2 Data and resources table

| Name | URL | Format | Access/auth | Size | License | Verified? | Notes |
|---|---|---|---|---|---|---|---|
| **FIRMS** (official challenge resource) | <https://www.earthdata.nasa.gov/data/tools/firms> | Web/API/CSV/SHP/KML | FIRMS MAP_KEY for API/WMS/WFS; no EDL for the API key | Global archive; AOI queries MBs | NASA open; cite; LANCE disclaimer | Yes | Near-real-time and archive hotspots; MODIS + VIIRS + Landsat. |
| **FIRMS API — area** | <https://firms.modaps.eosdis.nasa.gov/api/area/> | CSV | `MAP_KEY` | 1–5 days/request | NASA open | Yes | Endpoint: `/api/area/csv/[MAP_KEY]/[SOURCE]/[W,S,E,N]/[DAY_RANGE]/[DATE]`. Bbox or `world`; no polygons. |
| **FIRMS API — data availability** | <https://firms.modaps.eosdis.nasa.gov/api/data_availability/> | CSV | `MAP_KEY` | Small | NASA open | Yes | Check current min/max dates per source. |
| **FIRMS API — map key** | <https://firms.modaps.eosdis.nasa.gov/api/map_key/> | Web | Email | — | NASA | Yes | Key emailed; 5,000 transactions/10 min. |
| **FIRMS archive download** | <https://firms.modaps.eosdis.nasa.gov/download/> | CSV/SHP/KML | Email/registration | Large; email link | NASA open | Yes | Best for the 2000–present record; standard quality has ~3-month lag. |
| **MODIS MCD14ML** | <https://firms.modaps.eosdis.nasa.gov/download/Readme.txt> | ASCII/CSV | FIRMS archive | Monthly global file; tens of MB | NASA open | Yes | Standard-quality monthly fire locations, Collection 6.1, 1 km; ~3-month lag; fields: YYYYMMDD, HHMM, sat, lat, lon, T21, T31, sample, FRP, conf, type, dn. Distributed via the FIRMS archive; an exact CMR short-name search returned 0 (CMR has the NRT `MCD14DL` collection). |
| **MODIS MCD14DL** | <https://modaps.modaps.eosdis.nasa.gov/services/about/products/c61-nrt/MCD14DL-NRT.html> | TXT/SHP/KML | FIRMS API/archive | AOI MBs | NASA open | Yes | NRT vector, 1 km, C6.1; within ~3 h globally; RT/URT minutes in US/Canada. |
| **MODIS MOD14/MYD14** | <https://lpdaac.usgs.gov/products/mod14a1v061/> | HDF | Earthdata Login (LP DAAC) | Swath ~5 min | NASA open | Yes | L2 swath 1 km; the algorithm behind MCD14. The LP DAAC page covers the tiled L3 product; the L2 swath is distributed via LAADS/LP DAAC. |
| **MODIS MOD14A1/MYD14A1** | <https://lpdaac.usgs.gov/products/mod14a1v061/> | HDF | Earthdata Login | Daily 1 km tile | NASA open | Yes | L3 daily fire mask; useful for burn-scar/context. |
| **VIIRS VNP14IMG (SNPP)** | <https://www.earthdata.nasa.gov/data/catalog/lpcloud-vnp14img-002> | NetCDF | Earthdata Login | ~5 MB/granule (sample) | NASA open | Yes | 6-min L2 swath 375 m, V002; 2012-01-17 to **2026-11-02** (ceased). |
| **VIIRS VJ114IMG (NOAA-20)** | <https://www.earthdata.nasa.gov/data/catalog/lpcloud-vj114img-002> | NetCDF | Earthdata Login | ~0.65 MB/granule (sample) | NASA open | Yes | 6-min L2 swath 375 m, V002; 2018-01-01 to present. |
| **VIIRS VJ214IMG (NOAA-21)** | <https://www.earthdata.nasa.gov/data/catalog/lpcloud-vj214img-002> | NetCDF | Earthdata Login | Similar to VJ114 | NASA open | Yes | 6-min L2 swath 375 m, V002; 2023-02-10 to present. |
| **FIRMS NRT vector products** | <https://firms.modaps.eosdis.nasa.gov/content/academy/data_api/firms_api_use.html> | CSV | `MAP_KEY` | AOI MBs | NASA open | Yes | Sources: MODIS_NRT, MODIS_SP, VIIRS_SNPP_NRT/SP, VIIRS_NOAA20_NRT/SP, VIIRS_NOAA21_NRT/SP, LANDSAT_NRT. |
| **NASA GIBS** | <https://worldview.earthdata.nasa.gov/> | WMTS/imagery | None | — | NASA open | Yes | Visual context; FIRMS layers. |
| **MODIS MCD12Q1 land cover** | <https://lpdaac.usgs.gov/products/mcd12q1v061/> | HDF | Earthdata Login | Yearly 500 m | NASA open | Yes | Context for fire regimes/biomes. |
| **NASA POWER** | <https://power.larc.nasa.gov/> | JSON/CSV/NetCDF | None | Small | NASA open | Yes | Temperature, precipitation, wind, radiation for fire-weather context. |
| **ERA5** | <https://cds.climate.copernicus.eu> | NetCDF/GRIB | CDS account + API key | Large | Copernicus | Yes | Optional fire-weather context; hourly. |
| **HLS L30/S30** | <https://hls.gsfc.nasa.gov/> | COG | Earthdata Login | ~20 MB/band | NASA open | Yes | For burn-scar context / Prithvi. |
| **Prithvi burn-scar** | <https://huggingface.co/ibm-nasa-geospatial/Prithvi-EO-2.0-300M-BurnScars> | PyTorch | None | Model weights | Apache-2.0 | Yes | HLS 6-band 512×512; optional scar mapping. |
| **GWIS / GFAS** | <https://gwis.jrc.ec.europa.eu/>, <https://atmosphere.copernicus.eu/> | Maps/data | Varies | Global | Copernicus | Partial | Context/benchmark; not required. |
| **Population (WorldPop/GPW)** | <https://www.worldpop.org/> | Raster | None/registration | 100 m–1 km | CC BY 4.0 (check) | Partial | Exposure context. |

**Product-name note.** The challenge text says "MODIS MCD14 / VIIRS VNP14 / VJ114." The precise NASA product names are:

- MODIS: `MCD14ML` (standard-quality monthly fire locations), `MCD14DL` (NRT vector), `MOD14`/`MYD14` (L2 swath), `MOD14A1`/`MYD14A1` (L3 daily).
- VIIRS: `VNP14IMG` (Suomi NPP), `VJ114IMG` (NOAA-20), `VJ214IMG` (NOAA-21), all "Active Fires 6-min L2 Swath 375 m V002." FIRMS NRT vector names add `TDL_NRT` (e.g., `VNP14IMGTDL_NRT`).
- FIRMS standard archive files use `fire_archive_M-C61`, `fire_archive_SV-C2`, etc.; the README says standard quality for NOAA-20/21 is "not yet available," while the API lists `VIIRS_NOAA20_SP`/`VIIRS_NOAA21_SP`. This is a **PARTIAL/conflicting** point; verify with `/api/data_availability` before relying on NOAA-20/21 standard data.

**Start dates (from the FIRMS API tutorial, 2025 example).** MODIS_SP starts 2000-11-01; VIIRS_SNPP_SP starts 2012-01-20; VIIRS_NOAA20_SP starts 2018-04-01; VIIRS_NOAA21_SP starts 2024-01-17. The max dates move; check `/api/data_availability` at runtime. If the NOAA-20/21 SP archives are incomplete, fall back to NRT for the recent period and label it clearly.

**FIRMS API gotcha.** FIRMS often returns errors as HTTP 200 with a plain-text body (for example `Invalid MAP_KEY.`). Check the content type/body before parsing CSV, and redact the key from logs because it travels in the URL path. A `mapkey_status` endpoint can tell you remaining transactions. (PARTIAL: observed in community documentation; verify against your key.)

### 4.3 Why MODIS and VIIRS are not directly comparable

This is the technical heart of the challenge. The differences are not cosmetic:

1. **Spatial resolution.** MODIS fire pixels are ~1 km at nadir and grow toward the swath edge. VIIRS 375 m pixels are ~375 m at nadir and aggregate toward the edge. A single MODIS detection can contain multiple VIIRS detections. Raw counts therefore differ even for the same fire.
2. **Detection sensitivity.** VIIRS detects smaller/cooler fires. Csiszar et al. (2013) found VIIRS produced ~26% more detections than MODIS in the central 3-pixel aggregation zone and ~70% more outside it. Sofiev & Kouznetsov (2026) estimate a nadir night detection limit of ~3.7 MW for MODIS (up to ~40 MW for a daytime side view) versus ~0.5 MW for VIIRS at night. Global average detection probability for powerful fires: ~78% MODIS, ~88% VIIRS; some equatorial regions are below 30%/40%.
3. **Confidence semantics.** MODIS reports 0–100% confidence, with classes low (<30%), nominal (30–80%), high (80–100%). VIIRS reports low/nominal/high classes, with different algorithm tests. A "nominal" VIIRS pixel is not the same as a "nominal" MODIS pixel.
4. **Overpass schedule.** MODIS Terra is the only morning overpass (its crossing time has drifted earlier over the mission), and Aqua is afternoon; VIIRS SNPP/NOAA-20/NOAA-21 are afternoon orbits. The diurnal cycle sampled is different, especially after Terra ends. A monthly count is partly a count of overpasses, not just fires.
5. **Swath/scan geometry.** MODIS pixel area grows strongly with view angle; VIIRS is aggregated to limit growth. Detection thresholds and FRP retrievals are view-angle dependent. Kaur et al. (2019) show a quantile-mapping correction for MODIS gridded FRP that reduces the swath-dependent bias.
6. **Product latency and processing.** MODIS `MCD14ML` standard quality has a ~3-month lag; NRT `MCD14DL` is within ~3 h. VIIRS NRT is similar; standard products lag. Mixing NRT and standard data without labeling creates artificial jumps.
7. **False positives.** Gas flares, volcanoes, industrial hot spots, and sun glint can be flagged. MODIS `MCD14ML` has a `type` field (0 vegetation, 1 volcano, 2 other static, 3 offshore) that helps; VIIRS does not have an equivalent `type` field in the FIRMS NRT table. A fire calendar should filter or flag these.

**VERIFIED sources:** Csiszar et al. 2013, <https://doi.org/10.1002/2013JD020453>; Sofiev & Kouznetsov 2026, <https://doi.org/10.5194/gmd-19-10123-2026>; Kaur et al. 2019, <https://doi.org/10.3390/rs11101205>; MODIS C6.1 User Guide, <https://www.earthdata.nasa.gov/s3fs-public/2023-09/MODIS_C6_C6.1_Fire_User_Guide_1.0.pdf>; FIRMS attributes, <https://www.earthdata.nasa.gov/data/tools/firms/active-fire-data-attributes-modis-viirs>.

### 4.4 Harmonization methods that fit a 48-hour build

There are four levels of ambition. Pick one primary method and show the others as sensitivity checks.

**Level 1 — Common grid + confidence filter + deduplication (must-have).**

- Reproject both sensors to a common grid (0.1° or 0.25° for a calendar; 1 km for a map).
- Filter MODIS to nominal/high confidence (or conf ≥ 30/80) and VIIRS to nominal/high. State the threshold.
- Deduplicate cross-sensor detections within a space-time window (e.g., same day, within 1–2 km) so a single fire is not counted once per sensor/pixel. This is the "duplicate-detection correction" idea used by Zheng et al. (2026), whose correction-before-fusion framework reported a ~3.82x increase in detected fire pixels versus the original MODIS product — a useful illustration of how large the raw-count gap can be.
- Aggregate to monthly counts per grid cell/AOI.
- This alone removes the most egregious double counting, but it does not remove sensitivity bias.

**Level 2 — Overlap-period ratio/quantile correction (recommended).**

- Use the period when both sensors are active (2012–2026 for MODIS + SNPP; 2018–2026 for NOAA-20; 2023–2026 for NOAA-21) to estimate a sensor correction.
- For each month/grid cell (or biome/month stratum), compute the ratio of VIIRS to MODIS detections during overlap, or fit a quantile mapping of monthly counts. Apply the inverse to MODIS to bring it onto the VIIRS reference scale.
- Use a smoothed/robust estimator (median ratio, not mean) and shrink small-sample cells toward a regional ratio.
- Show the correction factor in the UI. This is the "method" judges will look for.
- Kaur et al. (2019) is the clean citation for quantile mapping; Zheng et al. (2026) for a correction-before-fusion framework; the Copernicus GFAS work for FRP bias correction.

**Level 3 — FRP/detection-limit matching (strong stretch).**

- Instead of counts, compare fire radiative power (FRP) density above a common detection threshold (e.g., ≥10 MW) so both sensors are measuring a comparable fire intensity class.
- Correct MODIS FRP for view-angle bias (quantile mapping) and use VIIRS as the reference. This is more physically grounded but harder to explain and slower to compute.
- For a calendar, counts are easier for users; use FRP matching as a validation panel, not the main metric.

**Level 4 — Anomaly-first presentation (best communication).**

- Compute a sensor-specific monthly climatology (e.g., 2003–2025 for MODIS; 2013–2025 for SNPP; 2019–2025 for NOAA-20).
- Show the standardized anomaly (z-score or percentile) rather than raw counts as the primary calendar color.
- This is robust to absolute sensor bias and is what fire managers actually need ("is this month unusual for this place?").
- Show raw counts in a secondary view and label the sensor era.

**Recommended combination:** Level 1 + Level 2 + Level 4. Use VIIRS NOAA-20/21 as the reference for the modern era, correct MODIS to that scale during overlap, and present anomalies as the primary calendar. Add a "raw counts" toggle and a sensor timeline. This is implementable in 48 hours with pandas/DuckDB and is honest about uncertainty.

**Concrete formula (conceptual).** For month `m` and grid cell `g`:

`H(g,m) = median_s [ C_s(g,m) / (D_s(g,m) * E_s) * k_s(g,m) ]`

where `C_s` is the count from sensor `s`, `D_s` is the number of sensor-days with data, `E_s` is a detection-efficiency factor, and `k_s` is the overlap-period correction. In practice, use the ratio estimator rather than a hand-tuned `E_s`, and show the sensitivity to the choice.

**Uncertainty.** Use Poisson/bootstrap intervals for counts; flag cells with <10 detections; show the number of sensors/days contributing; grey out months with no data rather than plotting zero. A "data coverage" strip under the calendar is essential.

### 4.5 Open-source and prior art

| Project | What it gives you | Licence | Link |
|---|---|---|---|
| NASA FIRMS API tutorial | Python examples for MAP_KEY, area, availability, pandas | NASA (open) | <https://firms.modaps.eosdis.nasa.gov/content/academy/data_api/firms_api_use.html> |
| FIRMS API guide (community) | Practical notes on MAP_KEY, quotas, back-off | Unknown | <https://archanacontent.github.io/nasa-firms-api-guide/> |
| 2024 Space Apps "GROW" | FIRMS dashboard + voice AI; Top 10 global finalist | MIT | <https://github.com/Florianopolis-NASA-Space-Apps/wildfires_chat_dashboard> |
| 2022 Space Apps "Starflock" | Wildfire smoke chemical dispersion; Best Use of Data | Unknown | Space Apps 2022 project gallery |
| 2019 Space Apps "c.a.w.s.t.o.n." | Spot That Fire V2.0; Best Mission Concept | Unknown | <https://2019.spaceappschallenge.org/challenges/living-our-world/spot-fire-v20/> |
| 2020 Space Apps "FireWay" | Dynamic wildfire routing; Best Use of Technology | Unknown | Space Apps 2020 project gallery |
| 2023 "PREDICTO" | Fire monitoring/prediction system (Poland) | Unknown | <https://kosmonauta.net/2023/10/system-do-monitorowania-zagrozen-pozarowych-zwycieskim-projektem-najwiekszego-kosmicznego-hackathonu-w-europie/> |
| MODIS C6.1 User Guide | Algorithm, confidence classes, MCD14ML fields | NASA | <https://www.earthdata.nasa.gov/s3fs-public/2023-09/MODIS_C6_C6.1_Fire_User_Guide_1.0.pdf> |
| GFAS bias correction | FRP bias correction for MODIS/SEVIRI/VIIRS | Copernicus | <https://atmosphere.copernicus.eu/node/1029> |

**Prior-art lesson.** Fire dashboards are crowded. GROW won attention with a voice co-pilot and a polished map, not with harmonization. The 2026 challenge explicitly asks for harmonization, so the winning project should invert that: make the **method and uncertainty** the hero, and use the UI/AI to make it understandable. A "sensor seam" panel is more novel than another red-dot map.

### 4.6 Project concepts

#### F1. "Fire Season Atlas" — the harmonized burning calendar

- **Pitch:** Draw your region. See 26 years of fire seasons as one dithered calendar, with the sensor seams made visible and explained.
- **Target user:** fire managers, emergency responders, land managers, scientists; also journalists and the public.
- **Core experience:** draw an AOI or enter lat/lon + radius; choose 2000–2026; the app shows a 12-month × year calendar of harmonized hotspot activity, an anomaly stripe vs the 2003–2025 median, a sensor timeline, top-5 months, and a map of hotspot density. Click a month for a detail panel: counts by sensor, confidence mix, FRP, coverage days, and a short AI briefing. Download CSV of the filtered hotspots and the monthly matrix.
- **Demo wow:** "The calendar fills with 26 years of fire seasons. The 2024 anomaly glows. Click it: 'February 2024 is 2.8σ above the 2003–2025 median. 71% of detections are VIIRS NOAA-20; confidence is nominal/high. The pattern is consistent with agricultural burning, but field verification is needed.' The sensor timeline shows SNPP ending in November 2026 — the app already knows the record has a seam."
- **How it uses AI:** Jev state = AOI, month, harmonized anomaly z-score, raw counts by sensor, confidence mix, FRP median, land-cover class, precipitation/temperature anomaly. Questions: `is_anomalous` (noul), `driver` (choice: agricultural burning, wildfire, land clearing, industrial/flare, other), `severity` (score 0–4), `confidence` (score). Gemini 4 Hydrogen gets the calendar matrix, stats, sensor metadata, and an optional map screenshot; returns structured JSON with a 3-sentence briefing, evidence bullets, caveats, and "what to check locally." Function calling can fetch the exact stats so the narrative cannot invent numbers.
- **Data pipeline:** FIRMS API for recent + archive for history -> Parquet (sensor/year/month partitions) -> confidence filter -> dedupe -> monthly grid/AOI counts -> overlap correction -> anomalies -> JSON/CSV -> web app. Precompute the demo AOIs.
- **48-hour MVP:** one AOI, 2003–2026, MODIS_SP + VIIRS NOAA-20/21 SP (plus SNPP historical if available), confidence filter, dedupe, overlap ratio, calendar, anomaly, sensor timeline, CSV, Jev + Gemini. Stretch: multiple AOIs, SNPP full history, Prithvi burn scars, forecast/alert, shareable story.
- **Dither UI fit:** excellent. The calendar is a natural 1-bit heatmap; anomaly stripes become halftone bands; the map becomes a dot-density field. Add a "smooth/accessible" toggle with a colorblind-safe ramp (viridis/cividis) and a "1-bit" default.
- **Risks:** API limits; archive size; sensor transition; standard-product lag; false positives; small-count noise; AI overclaiming. Mitigate with precomputed data, explicit coverage, confidence thresholds, and a "not for tactical decisions" disclaimer (FIRMS itself says this).
- **Scores:** Impact 9, Feasibility 9, Novelty 8, Judge appeal 9, AI fit 9.

#### F2. "Sensor Reconciliation Lab" — make the seam the product

- **Pitch:** The fire record has a seam. Move it, measure it, and see how much your conclusions change.
- **Target user:** scientists, data journalists, fire analysts, judges.
- **Core experience:** same AOI; show MODIS-only, VIIRS-only, and harmonized calendars side by side; sliders for confidence threshold, FRP threshold, dedupe radius, and overlap correction; live metrics (counts, anomaly, trend, rank of current year); a "sensor seam" timeline; export the method and the data.
- **Demo wow:** "Switch from raw counts to harmonized anomalies and the trend flips from 'more fires' to 'no significant change.' The app shows exactly which sensor and which months caused the flip."
- **How it uses AI:** Gemini explains the effect of each slider in plain language; Jev answers `is_trend_robust` (noul), `which_sensor_drives` (choice), `confidence` (score).
- **Data pipeline:** same as F1 + precomputed sensitivity variants; DuckDB for fast re-aggregation.
- **48-hour MVP:** one AOI, three views, four sliders, metrics, AI. Stretch: global comparison, uncertainty bands, method export, teaching mode.
- **Dither UI fit:** strong side-by-side 1-bit calendars; the "lab" aesthetic fits the mission-control brief.
- **Risks:** complexity and user confusion; needs clear defaults and a guided tour.
- **Scores:** Impact 7, Feasibility 9, Novelty 8, Judge appeal 8, AI fit 7.

#### F3. "Fire Weather Story" — why the season exploded

- **Pitch:** Why did this fire season explode? Overlay hotspots with rainfall, heat, and wind to find the fingerprint.
- **Target user:** fire managers, climate communicators, journalists.
- **Core experience:** AOI; FIRMS calendar + POWER/ERA5 monthly temperature, precipitation, wind; anomaly correlations; "hot/dry/windy" fingerprint; compare the current month to historical analog years; AI narrative.
- **Demo wow:** "The 2024 anomaly coincides with the driest 3-month spell in 20 years and 2°C above normal. The AI finds the closest analog year and explains the difference."
- **How it uses AI:** Gemini multimodal (charts + map) writes the story; Jev `driver` (choice: fuel, drought, heat, wind, ignition, other) with probabilities.
- **Data pipeline:** FIRMS + POWER (no auth) or ERA5 (CDS key) -> monthly aggregates -> z-scores -> correlation -> JSON.
- **48-hour MVP:** one AOI, three climate variables, anomaly chart, AI. Stretch: seasonal forecast, lightning, land cover, fire weather index.
- **Dither UI fit:** good; climate stripes and halftone maps; amber/red accent.
- **Risks:** reanalysis resolution; correlation vs causation; extra data not in the challenge resources (allowed, but cite it); data latency.
- **Scores:** Impact 8, Feasibility 8, Novelty 7, Judge appeal 8, AI fit 9.

#### F4. "Burn Scar Detective" — hotspots meet scars

- **Pitch:** Hotspots show where fire was burning; burn scars show what it left behind. Match them.
- **Target user:** land managers, scientists, recovery teams.
- **Core experience:** AOI; FIRMS hotspots + Prithvi burn-scar inference on HLS; map burn scars; compare hotspot clusters to scar polygons; "did the hotspot become a scar?"; recovery timeline.
- **Demo wow:** "The app matches a cluster of VIIRS detections to a 4,000 ha burn scar and shows the pre/post HLS image. It also explains why a small agricultural burn left no scar."
- **How it uses AI:** Prithvi burn-scar segmentation (HLS 6-band 512×512); Gemini explains; Jev `is_scar` / `confidence`.
- **Data pipeline:** FIRMS + HLS COG -> Prithvi inference -> scar mask -> overlay; hotspot clustering.
- **48-hour MVP:** one AOI, 1–2 HLS dates, burn-scar inference, overlay, AI. Stretch: multi-year recovery, severity, carbon.
- **Dither UI fit:** strong; 1-bit scar masks and halftone recovery maps.
- **Risks:** GPU/time; HLS clouds; model generalization; scar latency.
- **Scores:** Impact 8, Feasibility 7, Novelty 8, Judge appeal 8, AI fit 8.

#### F5. "Smoke Signal" — from hotspot to downwind community

- **Pitch:** Follow the smoke: connect fire hotspots to aerosol plumes and downwind communities.
- **Target user:** public health, air quality, emergency managers.
- **Core experience:** AOI; FIRMS hotspots + aerosol optical depth + wind; plume direction; "who is downwind?"; dithered plume map; AI health advisory with caveats.
- **Demo wow:** "The app traces a plume from the hotspot to a city 300 km away and estimates who is downwind."
- **How it uses AI:** Gemini explains the plume and health caveats; Jev `is_health_threat` / `confidence`.
- **Data pipeline:** FIRMS + aerosol (MODIS/GEOS) + wind (POWER/ERA5) -> plume trajectory -> map.
- **48-hour MVP:** one AOI, one event, plume overlay, AI. Stretch: HYSPLIT, population exposure, alerts.
- **Dither UI fit:** good; 1-bit plume and halftone exposure map.
- **Risks:** aerosol data not in the challenge resources; plume modeling complexity; attribution; health claims. High risk for 48h.
- **Scores:** Impact 8, Feasibility 6, Novelty 8, Judge appeal 7, AI fit 7.

### 4.7 Recommendation

**Build F1 "Fire Season Atlas", with F2's "sensor seam" panel as a core feature.** Reasons:

1. It matches every must-have in the challenge: web app, AOI, date range, calendar, historical comparison/anomaly, color ramps, CSV.
2. FIRMS is the only official resource; using it is straightforward and satisfies Global Awards eligibility.
3. The harmonization method is the differentiator, and it can be implemented in 48 hours with a defensible Level 1+2+4 approach.
4. The 2026 sensor transition gives a timely, memorable story that most teams will miss.
5. The dither calendar is visually distinctive without sacrificing readability.
6. Jev and Gemini both add real value: Jev for the typed alert/driver decision, Gemini for the cited briefing.

If the team wants a more "research" project, F2 is the strongest; if it wants a more emotional project, F3. But F1 is the best combination of winnability and substance.

---

## 5. Challenge: Field Shift: Adapting Farms with NASA Data

### 5.1 Challenge in one paragraph

Build a decision-support tool that combines NASA Earth observations with local soil information, crop characteristics, and farmer priorities to help farmers explore crop-rotation strategies that could improve soil health and adapt to changing conditions. The real ask is **not** a crop recommender; it is a transparent, humble exploration tool that compares at least three rotation strategies (including the existing one), explains why each was suggested, what evidence supports it, what benefits it may offer, where information gaps exist, and what risks need local review. Hidden judging hooks: (a) at least three strategies, including the current rotation; (b) NASA data + local soil + crop traits + farmer priorities; (c) explicit uncertainty and "support, not replace" language; (d) comparison across water, soil, nutrients, erosion, pests, forage, market; (e) farmer-friendly UX for low technical/geospatial literacy; (f) resolution harmonization (SMAP 9 km, ECOSTRESS 70 m, GPM 0.1°, Landsat/HLS 30 m, soil maps) and an explanation of how the model handles it. The challenge text uses "SI" repeatedly without defining it; treat it as AI/ML/statistical inference. I could not find an official definition of "SI" in the challenge text (**UNVERIFIED**), so do not overclaim a specific technique.

**Critical context.** The challenge lists many USDA/U.S.-only datasets (SSURGO, CDL, Web Soil Survey, NAIP, NLCD, PRISM, QuickStats, Market News). A U.S. field is the easiest demo; a global tool needs fallbacks (SoilGrids, ESA WorldCereal, FAO prices) and must be honest about gaps. OpenET is U.S.-focused and its terms are non-commercial/attribution, which matters for an open-source hackathon project. HLS is not in the farms Resources tab, but it is a NASA dataset and the input to Prithvi; using it as an extra is fine as long as the project also uses at least one listed resource (SMAP, POWER, ECOSTRESS, etc.) for Global Awards.

### 5.2 Data and resources table

| Name | URL | Format | Access/auth | Size | License | Verified? | Notes |
|---|---|---|---|---|---|---|---|
| **SMAP** | <https://www.earthdata.nasa.gov/data/platforms/space-based-platforms/smap> | HDF5 | Earthdata Login | L4 ~139 MB/file, 8/day | NASA open | Yes | Surface/root-zone soil moisture, 2–3 day global coverage; L4 9 km 3-hourly. |
| **SMAP L4 SPL4SMGP V8** | <https://nsidc.org/data/spl4smgp/versions/8> | HDF5 | Earthdata Login | ~139 MB/file; ~1.1 GB/day global | NASA open | Yes | 9 km, 3-hourly, 2015-03-31–present; surface/root-zone/profile soil moisture, surface/soil temp, snow. |
| **SMAP L3 SPL3SMP_E V6** | <https://nsidc.org/data/spl3smp_e/versions/6> | HDF5 | Earthdata Login | Daily 9 km | NASA open | Yes | Daily enhanced 9 km soil moisture; useful for field-scale context. |
| **GPM & IMERG** | <https://gpm.nasa.gov/data> | HDF5/NetCDF | Earthdata Login | 0.1° global; small subsets | NASA open | Yes | Precipitation rate/accumulation; Early/Late/Final. |
| **GPM_3IMERGDF V07** | <https://www.earthdata.nasa.gov/data/catalog/ges-disc-gpm-3imergdf-07> | HDF5 | Earthdata Login | 0.1° daily | NASA open | Yes | 1998-01-01–present; daily final. |
| **GPM_3IMERGHHE/L/F V07** | <https://gpm.nasa.gov/data/imerg> | HDF5 | Earthdata Login | 0.1° half-hourly | NASA open | Yes | Early/Late/Final; 1998–present. |
| **Landsat 8/9** | <https://earthexplorer.usgs.gov/> | GeoTIFF/COG | USGS/EDL | 30 m tiles | Public domain (US Gov) | Yes | Reflectance, NDVI, land cover; 16-day per satellite, 8-day combined. |
| **MODIS** | <https://lpdaac.usgs.gov/products/> | HDF | Earthdata Login | 250 m–1 km | NASA open | Yes | MOD13Q1 NDVI 250 m 16-day; land cover; LST. |
| **VIIRS** | <https://search.earthdata.nasa.gov/search?q=VIIRS> | HDF/NetCDF | Earthdata Login | 375 m–1 km | NASA open | Yes | NDVI, LST, active fire; continuity. |
| **NASA POWER** | <https://power.larc.nasa.gov/> | JSON/CSV/NetCDF/ICASA | None | Point/regional; small | NASA open | Yes | 0.5° meteorology / 1° solar; 1981–present; 20 params/point; 2–7 day latency. |
| **SRTM** | <https://www.earthdata.nasa.gov/data/instruments/srtm> | GeoTIFF | Earthdata Login | 30/90 m | Public domain (US Gov) | Yes | Slope, runoff, erosion context. NASADEM on LP DAAC. |
| **GRACE / GRACE-FO** | <https://podaac.jpl.nasa.gov/GRACE> | NetCDF | Earthdata Login | Monthly mascons; ~300 km | NASA open | Yes | Terrestrial water storage/groundwater trends; GRACE 2002–2017, GRACE-FO 2018–present. |
| **ECOSTRESS** | <https://ecostress.jpl.nasa.gov/data> | HDF5/COG | Earthdata Login | 70 m | NASA open | Yes | LST, ET, ESI, WUE; ISS orbit; 2018–present; not daily global. |
| **USDA Ag Data Commons** | <https://www.nal.usda.gov/services/agdatacommons> | Mixed | Mostly none | Varies | Varies per dataset | Partial | Soils, crops, climate, management, phenology; check each licence. |
| **Web Soil Survey** | <https://websoilsurvey.nrcs.usda.gov/app/> | Web/SSURGO | None | U.S. soils | Public domain (US Gov) | Yes | Official U.S. soil maps, properties, drainage, erosion, suitability. |
| **CDL / CropScape** | <https://nassgeodata.gmu.edu/CropScape/> | GeoTIFF | None | 30 m annual U.S. | Public domain (US Gov) | Yes | Crop type labels; essential for U.S. rotations and Prithvi labels. |
| **PRISM** | <https://prism.oregonstate.edu> | Gridded/tabular | None | 4 km/800 m; daily/monthly/normals | Free with attribution; OSU copyright | Yes | U.S. climate, frost dates, normals; cite PRISM Group, OSU, URL, access date. |
| **SSURGO/STATSGO2** | <https://www.nrcs.usda.gov/resources/data-and-reports/soils> | Vector/tabular | None/Soil Data Access | U.S. | Public domain (US Gov) | Yes | Texture, organic matter, drainage, hydrologic group, erosion factors, water-holding capacity. |
| **NAIP** | <https://naip-usdaonline.hub.arcgis.com/> | Imagery | None | 1 m; U.S. growing season | Public domain (US Gov) | Yes | Field boundaries, bare soil, crop development. |
| **NLCD** | <https://www.usgs.gov/centers/eros/science/national-land-cover-database> | Raster | None | 30 m; U.S. | Public domain (US Gov) | Yes | Land cover context; multi-decade. |
| **NLDAS/GLDAS** | <https://www.earthdata.nasa.gov/> | HDF/NetCDF | Earthdata Login | NLDAS 0.125° hourly 1979+; GLDAS 0.25° 3-hourly 2000+ | NASA open | Yes | Continuous climate/soil moisture/ET proxies. |
| **FAO GAEZ** | <https://gaez.fao.org> | Raster/tabular | Registration | Global | Check FAO terms | Partial | Agro-climatic suitability; licence unclear; do not assume commercial reuse. |
| **CoCoRaHS** | <https://www.cocorahs.org/Maps> | Tabular/maps | None/registration | North America | Check terms | Partial | Crowd-sourced precipitation; good for validation. |
| **USGS NWIS** | <https://waterdata.usgs.gov/nwis> | Tabular/API | None | U.S. | Public domain (US Gov) | Yes | Streamflow, groundwater, water quality. |
| **USDA AMS Market News** | <https://www.ams.usda.gov/market-news> | Web/API | Some API keys | U.S. | Public domain (US Gov) | Yes | Commodity prices/demand. |
| **USDA NASS QuickStats** | <https://quickstats.nass.usda.gov> | API | Free API key | U.S. | Public domain (US Gov) | Yes | County/state yields, acreage, production. |
| **OpenET** | <https://openetdata.org> | API/CSV/JSON/GeoTIFF | OpenET account + API key | Monthly 2000+, daily 2016+ | OpenET ToS: attribution, no bulk redistribution; Data Explorer licence is personal/non-commercial; API terms allow commercial applications but not IP rights in the API/data | Yes | Field-scale ET; U.S.-focused; quotas: 50,000 acres/query, 50 polygons, 100 field IDs. |
| **LANDFIRE** | <https://www.landfire.gov> | Raster | None | U.S. | US Gov (check) | Partial | Vegetation/fuel layers; context for perennial cover. |
| **GEDI** | <https://gedi.umd.edu/data> | HDF5 | Earthdata Login | 25 m footprints | NASA open | Yes | Canopy height/biomass; 2019–2023 (check current). |
| **Sentinel-2** | <https://dataspace.copernicus.eu> | COG/JPEG2000 | Copernicus account | 10–20 m; 5-day | Copernicus open, attribution | Yes | NDVI/EVI, bare soil, crop stress; complements Landsat. |
| **ERA5** | <https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels> | NetCDF/GRIB | CDS account + API key | Hourly global | Copernicus | Yes | Climate time series; gap filling. |
| **HLS L30/S30 (extra)** | <https://hls.gsfc.nasa.gov/> | COG | Earthdata Login | 30 m; 1.6-day combined | NASA open | Yes | Not in the farms Resources tab, but ideal for Prithvi and field-level NDVI. |
| **GLAM (GIMMS)** | <https://glam1.gsfc.nasa.gov/> | API/CSV/PNG/GeoTIFF | None | MODIS 250 m, VIIRS 500 m, OLCI 300 m | NASA/USDA open; OLCI Copernicus | Yes | NDVI time series by admin/crop mask; `gettbl` v4, `getplt` v5. |
| **Harvest GLAM** | <https://glam.nasaharvest.org/> | Web/COG | None | MODIS/VIIRS/CHIRPS/ESI | NASA/USDA; check layers | Yes | Alternative GLAM UI with crop masks, anomalies, COG export. |
| **Prithvi crop model** | <https://huggingface.co/ibm-nasa-geospatial/Prithvi-EO-1.0-100M-multi-temporal-crop-classification> | PyTorch | None | 100M params | Apache-2.0 | Yes | 13 classes; 18 bands (6×3); 224×224; mIoU 0.4269; U.S. CDL bias. |
| **Prithvi-EO-2.0** | <https://huggingface.co/ibm-nasa-geospatial/Prithvi-EO-2.0-300M> | PyTorch | None | 300M/600M | Apache-2.0 | Yes | General EO backbone; HLS 6 bands; fine-tune with TerraTorch. |
| **TerraTorch** | <https://github.com/IBM/terratorch> | Python | None | — | Apache-2.0 | Yes | Fine-tuning framework for Prithvi. |
| **SoilGrids (global fallback)** | <https://soilgrids.org/> | WCS/COG/VRT | None | 250 m; global | CC BY 4.0 | Yes | Global soil properties; use outside the U.S. |
| **ESA WorldCereal (global fallback)** | <https://esa-worldcereal.org/> | Raster | None | 10–20 m; global | Check ESA terms | Partial | Global crop maps; verify licence. |

### 5.3 What the data actually supports (and what it does not)

**SMAP.** L4 SPL4SMGP gives 9 km, 3-hourly surface/root-zone soil moisture from 2015. SMAP's radar failed in 2015; the L-band radiometer continues, and the L4 product is a model estimate constrained by radiometer brightness temperatures, not a direct 9 km measurement. The radiometer footprint is ~36 km and the 9 km grid is interpolated. Do not treat a 9 km cell as a field measurement. It is good for drought stress, seasonal water availability, and infiltration context. (VERIFIED: <https://nsidc.org/data/spl4smgp/versions/8>.)

**POWER.** Global 0.5° meteorology and 1° solar, 1981–present, no auth. It is MERRA-2/GEOS-IT reanalysis, not a weather station; the current month is low-latency and replaced later. It is excellent for long-term climate context and crop water-use estimates, not for field-level microclimate. The API allows up to 20 parameters per point and one parameter per regional request; chunk long time series rather than requesting the whole archive at once. (VERIFIED: <https://power.larc.nasa.gov/docs/services/api/temporal/daily/>.)

**HLS.** 30 m, L30 from 2013 and S30 from 2015, ~1.6-day combined revisit, 2–3 day latency, COG, EDL. It is the best field-level optical time series for this challenge and the input to Prithvi. HLS is not in the farms Resources tab, so use it as an extra and make sure a listed resource is also used. (VERIFIED: <https://hls.gsfc.nasa.gov/data-access-and-tools/>.)

**OpenET.** Field-scale ET for the U.S. (challenge text says western U.S.), monthly 2000–present and daily 2016–present; models include Ensemble, geeSEBAL, SSEBop, SIMS, DisALEXI, PTJPL, eeMETRIC. API key required; free with quotas. The terms require attribution and prohibit bulk redistribution; the Data Explorer licence is personal/non-commercial, while the API terms allow commercial applications but not IP rights in the API/data. Treat OpenET as a restricted source, not CC0. It is the best ET source for a U.S. field, but not a global solution. (VERIFIED: <https://etdata.org/api/>, <https://openet.gitbook.io/docs/reference/api-reference>, <https://etdata.org/terms-of-service/>.)

**GLAM.** GIMMS GLAM provides global NDVI time series from MODIS 250 m, VIIRS 500 m, and Sentinel-3 OLCI 300 m, with administrative/crop-mask queries and no auth (`gettbl` v4, `getplt` v5). It is a quick way to get a multi-year seasonal NDVI curve for a region without downloading tiles. Harvest GLAM adds CHIRPS, soil water index, ESI, and COG export. (VERIFIED: <https://glam1.gsfc.nasa.gov/api/doc/gettbl>, <https://glam1.gsfc.nasa.gov/api/doc/getplt>.)

**Earthdata tooling.** Use Earthdata Search for discovery, AppEEARS for point/area extraction (it supports SMAP L4 and HLS among many products), and Harmony for cloud subsetting/transformation (SMAP L2–L4 support was added in October 2025). These services can turn a full granule into a small field-scale table, which is exactly what a 48-hour farm app needs. (VERIFIED: <https://search.earthdata.nasa.gov/>, <https://appeears.earthdatacloud.nasa.gov/>, <https://nsidc.org/data/user-resources/data-announcements/user-notice-nasa-earthdata-harmony-data-transformation-services-now-available-smap-l2-l4-data-sets>.)

**Prithvi crop model.** The 1.0 crop checkpoint classifies 13 classes (natural vegetation, forest, corn, soybeans, wetlands, developed/barren, open water, winter wheat, alfalfa, fallow/idle, cotton, sorghum, other) from 18 HLS bands (6 bands × 3 timesteps), 224×224 chips. Its mIoU is 0.4269 and overall accuracy 60.64% on a U.S. CDL-labeled split. That is useful for a demo but not a reliable global crop map; CDL labels are noisy and U.S.-specific. Prithvi-EO-2.0 is a stronger general backbone but needs fine-tuning for crop segmentation. (VERIFIED: HF model cards; TerraTorch.)

**Soil.** In the U.S., SSURGO gives field-scale texture, organic matter, drainage, hydrologic group, erosion factors, and water-holding capacity. Outside the U.S., SoilGrids 250 m (CC BY 4.0) is a credible fallback but much coarser and less certain. Web Soil Survey is the user-facing entry point; SSURGO is the data. (VERIFIED: USDA/ISRIC.)

**Resolution and uncertainty.** Put every source on a common **field-month** table: SMAP 9 km (aggregate to field), GPM 0.1° (area-weighted), HLS 30 m (zonal mean), ECOSTRESS 70 m (snapshot, flag gaps), soil map units (area fraction), POWER 0.5° (point/grid). Do not upsample a coarse product to 30 m and imply field-level certainty; show the native resolution in the evidence ledger. Propagate uncertainty as ranges (e.g., SMAP 5th–95th percentile, OpenET model spread, precipitation ensemble spread) rather than single numbers, and label any indicator that is based on a coarse or modeled product. This is a judging hook: the challenge explicitly asks how the model interprets uncertainty and where local expertise is needed.

**Climate.** PRISM is high-quality U.S. climate with topographic effects, free with attribution. ERA5 is global but coarser. CoCoRaHS and NWIS are validation/ground-truth sources, not primary layers. (VERIFIED/PARTIAL as noted.)

**GRACE / GRACE-FO.** Monthly terrestrial water-storage anomalies at roughly 300 km resolution, from 2002–2017 (GRACE) and 2018–present (GRACE-FO). They are excellent for long-term groundwater/water-storage trends and for contextualizing a local water problem, but they are not field-scale and should not be used to estimate a single field's water balance. (VERIFIED: <https://podaac.jpl.nasa.gov/GRACE>.)

**Markets.** USDA AMS Market News and NASS QuickStats are U.S.-only; FAO GIEWS/FPMA can provide international price context (licence check needed). Market suitability is a farmer priority, but it is not a NASA dataset; be explicit about the source and date. (VERIFIED for USDA; PARTIAL for FAO.)

### 5.4 Open-source and prior art

| Project | What it gives you | Licence | Link |
|---|---|---|---|
| 2024 Galactic Impact "NVS-knot" | Soil-moisture risk model for localized crops | Unknown | Space Apps 2024 project gallery |
| 2024 Galactic Impact "2Plant or not 2Plant" | Satellite + hydrology planting-window tool | Unknown | <https://vitechteam.com/blog/how-vitech-s-agtech-innovation-won-the-nasa-space-apps-challenge> |
| 2024 "Canopy" | Farmer-centric water insights from NASA data | Unknown | <https://grad.illinois.edu/news/graduate-students-win-chicago-round-nasa-hackathon> |
| 2025 "FarmHero" | Turn-based farm simulator using NASA data; Rosario winner/global nominee | No licence file found | <https://github.com/Repetto-A/FarmHero> |
| 2025 "DemeterEye" | HLS phenology + Prophet forecasting; Best Use of Data (Seattle) | Unknown | <https://akvelon.com/engineering-an-end-to-end-geospatial-prototype-with-nasa-earth-data/> |
| 2020 "Project L.L.O.C.U.S.T" | SMAP + MODIS soil-moisture locust migration; Galactic Impact | Unknown | Space Apps 2020 project gallery |
| NASA HLS Data Resources | HLS tutorials, SuPER script, STAC/ODC examples | No root LICENSE found; check repo | <https://github.com/nasa/HLS-Data-Resources> |
| NASA LP DAAC Data Resources | HLS/SMAP/GEDI tutorials | No root LICENSE found; check repo | <https://github.com/nasa/LPDAAC-Data-Resources> |
| NASA-IMPACT hls-foundation-os | Prithvi fine-tuning examples (flood, burn scar, crop) | Apache-2.0 | <https://github.com/NASA-IMPACT/hls-foundation-os> |
| NASA-IMPACT Prithvi-EO-2.0 | Prithvi 2.0 code/examples | MIT | <https://github.com/NASA-IMPACT/Prithvi-EO-2.0> |
| TerraTorch | Fine-tuning framework | Apache-2.0 | <https://github.com/IBM/terratorch> |

**Prior-art lesson.** The space is crowded with "planting window" and "crop recommendation" apps. The gap is **rotation strategy exploration with an evidence ledger**: show the farmer why, show the data behind each claim, show the uncertainty, and let them weigh priorities. That is what the challenge actually asks for, and it is differentiated from the 2024 winners.

### 5.5 Project concepts

#### A1. "Rotation Studio" — a portfolio for the field

- **Pitch:** Design your next rotation like a portfolio: balance water, soil, nitrogen, forage, and market risk, with NASA evidence behind every trade-off.
- **Target user:** farmers, agronomists, extension agents; low technical/geospatial literacy.
- **Core experience:** draw/select a field; confirm the current rotation; set priorities with sliders (water, soil organic matter, nitrogen fixation, erosion, forage, market, risk). The app proposes 3+ candidate rotations (including the existing one) from a curated crop-trait library, scores each on six indicators, and shows an **evidence ledger**: every claim is a chip linked to the exact SMAP/OpenET/POWER/SSURGO/HLS series and the date range. Scenario sliders adjust rainfall (−20%) and temperature (+2°C). Export a one-page PDF/CSV.
- **Demo wow:** the farmer drags the water priority slider; the three rotations re-rank in real time; the evidence ledger opens to show the SMAP root-zone moisture and OpenET water use that drove the change. The AI does not say "plant this"; it says "this rotation uses 18% less water in the 2015–2025 record, but it has a 30% higher frost risk in April; here is the evidence and the uncertainty."
- **How it uses AI:** Prithvi crop classification (what is in the field now; optional), Gemini 4 Hydrogen (parse a soil-test PDF or photo; explain the trade-offs; generate the farmer brief; multimodal), Jev (`water_safe` noul, `best_fit` choice among the 3 rotations, `risk` score). The scoring model stays deterministic and inspectable; the AI is the translator, not the source of truth.
- **Data pipeline:** field polygon -> HLS/GLAM NDVI + SMAP L4 + IMERG + POWER + OpenET ET + SSURGO/SoilGrids + CDL/crop traits + market data -> monthly/seasonal features -> multi-criteria scoring -> evidence ledger -> AI explanation -> UI/PDF.
- **48-hour MVP:** one U.S. field, three rotations, five indicators (water, soil organic matter, nitrogen, erosion, market), HLS/SMAP/POWER/OpenET/SSURGO, evidence ledger, Jev + Gemini. Stretch: Prithvi crop map, scenario sliders, multi-field, global SoilGrids, PDF export, local language.
- **Dither UI fit:** excellent. A 1-bit field map, halftone soil texture, monospaced evidence ledger, "paper/ink" aesthetic; green/amber accent; a smooth/accessible toggle.
- **Risks:** OpenET U.S./terms-restricted; SSURGO U.S.-only; crop-trait library curation; AI hallucination; local validation; data latency. Mitigate with a U.S. demo field, explicit gaps, citations, and "support, not replace" language.
- **Scores:** Impact 10, Feasibility 8, Novelty 9, Judge appeal 10, AI fit 9.

#### A2. "Water Bank" — the field's water account

- **Pitch:** Your field's water account: see how each rotation spends and saves water across the season.
- **Target user:** irrigators, water managers, dryland farmers.
- **Core experience:** field; water balance from SMAP soil moisture, IMERG precipitation, OpenET ET, POWER ET0; a "water bank" chart; compare rotations by seasonal water use and stress days; rainfall scenario slider; AI recommendations.
- **Demo wow:** "The water bank drains during the dry spell; switching to a deep-rooted cover crop reduces stress days by X%."
- **How it uses AI:** Gemini explains the water balance; Jev `water_safe` / `best_fit` / `risk`.
- **Data pipeline:** SMAP + IMERG + OpenET + POWER + soil texture -> water balance -> indicators -> UI.
- **48-hour MVP:** one field, two rotations, water balance, AI. Stretch: irrigation scheduling, multi-season, groundwater.
- **Dither UI fit:** strong; 1-bit water ledger and halftone.
- **Risks:** ET model uncertainty; SMAP 9 km scale; irrigation data missing; OpenET coverage.
- **Scores:** Impact 8, Feasibility 8, Novelty 7, Judge appeal 8, AI fit 8.

#### A3. "Climate Rotation Cards" — a deck for the kitchen table

- **Pitch:** A deck of cards for the future farm: each card is a rotation strategy, scored and explained, ready for the kitchen table.
- **Target user:** smallholders, extension agents, community groups; low connectivity.
- **Core experience:** printable A5 cards + mobile web; each card shows a rotation, five indicators, climate resilience, water/soil benefits, risks, local evidence; QR code to the live field map; AI generates localized card text from NASA data; dither illustrations.
- **Demo wow:** "The farmer flips a card and sees the exact rainfall/soil-moisture evidence for their field; the card is beautiful enough to pin on the wall."
- **How it uses AI:** Gemini generates farmer-friendly card text and illustrations (with AI watermark); Jev scores fit/risk; Prithvi crop classification.
- **Data pipeline:** same as A1, output static cards + QR.
- **48-hour MVP:** six cards, one region, PDF + web, AI text. Stretch: local language, print-on-demand, workshop kit.
- **Dither UI fit:** excellent; 1-bit card illustrations, halftone, print aesthetic.
- **Risks:** print quality; localization; AI text accuracy; data coverage.
- **Scores:** Impact 8, Feasibility 9, Novelty 9, Judge appeal 9, AI fit 8.

#### A4. "Farm Future Simulator" — play the next 10 years

- **Pitch:** Play the next 10 years: change rainfall, heat, and prices, and see which rotation keeps the farm resilient.
- **Target user:** students, extension agents, farmers; gamified.
- **Core experience:** field; 10-year climate scenarios based on POWER/ERA5 trends; rotation choices; simulate soil organic matter, water, erosion, profit; dithered "farm dashboard"; AI coach.
- **Demo wow:** "The 10-year simulation shows the farm surviving the drought scenario only with the legume rotation; the AI coach explains why."
- **How it uses AI:** Gemini as coach; Jev as decision evaluator; Prithvi crop map.
- **Data pipeline:** climate scenarios + soil/water models + crop traits -> simulation -> UI.
- **48-hour MVP:** one field, three scenarios, three rotations, simplified model, AI. Stretch: multi-field, market prices, carbon.
- **Dither UI fit:** strong; 1-bit simulation dashboard.
- **Risks:** model complexity; false precision; data gaps; 48h time.
- **Scores:** Impact 8, Feasibility 7, Novelty 8, Judge appeal 9, AI fit 8.

#### A5. "Market Match" — feed the soil and the bank account

- **Pitch:** A rotation that feeds the soil and the bank account: match soil-health crops to local market demand.
- **Target user:** commercial farmers, cooperatives, extension agents.
- **Core experience:** field; candidate rotations; market data (USDA AMS/QuickStats; FAO for global); demand/price trends; forage value; contract availability; score; AI negotiation brief.
- **Demo wow:** "The app finds a cover crop with a local forage market and shows the price trend; the farmer sees a new income stream."
- **How it uses AI:** Gemini extracts market reports/PDFs; Jev `market_fit` / `risk`; Prithvi crop map.
- **Data pipeline:** market data + crop traits + NASA indicators -> score -> UI.
- **48-hour MVP:** one region, three crops, market data, AI. Stretch: contracts, buyers, logistics.
- **Dither UI fit:** good; 1-bit market ledger.
- **Risks:** market data coverage; price volatility; local buyers; not a financial advisor.
- **Scores:** Impact 7, Feasibility 8, Novelty 6, Judge appeal 7, AI fit 7.

### 5.6 Recommendation

**Build A1 "Rotation Studio", with A3 "Climate Rotation Cards" as the outreach/design layer.** Reasons:

1. It hits every must-have: 3+ rotations including the current one, NASA data, local soil, crop traits, farmer priorities, evidence, gaps, risks, and "support not replace."
2. It is genuinely useful: farmers can see the trade-offs, not just a recommendation.
3. It has a strong demo: the priority slider + evidence ledger is interactive, visual, and defensible.
4. It uses AI where AI is good: Prithvi for crop classification, Gemini for explanation and document parsing, Jev for typed decisions. The scoring stays deterministic.
5. The dither aesthetic can make the evidence ledger feel like a precision instrument, not a chatbot.
6. It is feasible for a U.S. demo field in 48 hours; global fallbacks are a stretch goal, not a blocker.

If the team is strong in design and storytelling, A3 could be the public-facing layer and A1 the engine. If the team is strong in hydrology, A2 is a credible narrower project. But A1 is the best combination of impact, novelty and winnability.

---

## 6. Cross-challenge comparison

| Criterion | SAR (Dancing with the SARs) | Fire (MODIS/VIIRS hotspots) | Farms (Field Shift) |
|---|---|---|---|
| Data access | Medium (EDL, S3, 0.8–4 GB granules) | Easy (FIRMS key, CSV/API) | Medium (EDL + OpenET + USDA) |
| Data volume | High | Low–medium | Medium |
| Technical difficulty | High (SAR interpretation) | Medium (harmonization) | Medium–high (agronomy + fusion) |
| Novelty | High | Medium (crowded) | High (if evidence-led) |
| Judge appeal | High (NISAR is new) | High (clear societal use) | Very high (farmer impact) |
| AI fit | Medium (Jev/Gemini; no strong SAR FM) | High (Jev/Gemini/Prithvi) | High (Prithvi/Gemini/Jev) |
| 48h feasibility | Medium | High | Medium |
| Best team profile | SAR/remote sensing + design | Full-stack + data science | Agronomy/remote sensing + design |
| Main risk | NISAR maturity/coverage | Sensor transition/bias | Local validation/licensing |

**Which is most winnable?** Fire, for a generalist 3–5 person team. The data is easy, the must-haves are explicit, the harmonization method can be rigorous without being impossible, and the 2026 sensor transition gives a timely narrative. The competition will be crowded, so the differentiator must be method + honesty + design, not another map.

**Which has the highest ceiling?** Farms. A truly farmer-centered rotation tool with an evidence ledger and honest uncertainty could win a global award. It requires agronomic knowledge and careful licensing, but the impact story is strongest.

**Which is the biggest swing?** SAR. NISAR is new, the data is exciting, and a beautiful dithered SAR story could stand out. But the validated record is short, the products are large, and misinterpretation is easy. Only choose it if someone on the team can read a SAR image and explain coherence/polarization.

**Shared technical stack (JUDGMENT).** A small team can build any of the three with:

- Python for data prep (`earthaccess`, `pystac-client`, `rioxarray`, `xarray`, `h5py`, `duckdb`, `pandas`).
- A static frontend (React/Next.js or plain HTML/Canvas/WebGL) with precomputed JSON/PNG/COG assets.
- A tiny API only for AI calls and optional live queries; keep keys server-side.
- Precomputed demo data so judging does not depend on a live download.
- A dither renderer that runs once on the server (or in a WebGL shader) and caches PNGs; do not dither per frame on the CPU.
- An "AI use" panel and a "data provenance" panel.

---

## Appendix A: NISAR sample granules observed on 2026-11-14

These are ASF search results, not recommendations. They show that GCOV data exist over diverse regions; filter by collection/maturity before use.

| Area | Sample granule | Acquisition |
|---|---|---|
| Amazon | `NISAR_L2_PR_GCOV_034_140_D_090_4005_DHDH_A_20261102T221630_20261102T221704_P05036_N_F_J_001` | 2026-11-02 |
| Netherlands | `NISAR_L2_PR_GCOV_034_167_D_062_2005_DHDH_A_20261104T185739_20261104T185814_P05036_N_F_J_001` | 2026-11-04 |
| California | `NISAR_L2_PR_GCOV_034_042_D_069_4005_DHDH_A_20261027T025605_20261027T025640_P05036_N_F_J_001` | 2026-10-27 |
| Bangladesh | `NISAR_L2_UR_GCOV_035_091_D_077_2000_DVNA_M_20261111T123455_20261111T123529_P05036_F_F_J_001` | 2026-11-11 (urgent response) |
| Kenya | `NISAR_L2_PR_GCOV_034_057_A_001_4005_DHDH_A_20261028T031540_20261028T031615_P05036_N_F_J_001` | 2026-10-28 |

## Appendix B: Quick verification log

Fetched live on 2026-11-14:

- ASF NISAR availability, products, access, GCOV, earthaccess docs: HTTP 200, content checked.
- ASF Vertex, ASF STAC, LP DAAC STAC, PO.DAAC STAC, NSIDC STAC: HTTP 200, JSON checked.
- NISAR GCOV/GSLC/GUNW CMR collections and sample granule sizes: queried CMR, values recorded.
- OPERA DISP-S1/RTC-S1/DSWx-S1/DIST-ALERT-S1 CMR collections: queried, summaries recorded.
- HyP3 docs, credits, API: HTTP 200, content checked.
- FIRMS API, map key, data availability, readme, attributes: HTTP 200, content checked.
- MODIS C6.1 user guide, VNP14IMG/VJ114IMG/VJ214IMG CMR pages: checked; SNPP cessation confirmed.
- SMAP L4 V8 NSIDC, GPM IMERG CMR, POWER API (actual JSON request), HLS access, OpenET API/terms, GLAM gettbl/getplt, Prithvi HF model cards, TerraTorch LICENSE: checked.
- earthaccess docs, CMR-STAC, Planetary Computer STAC, pystac/rio-tiler/titiler licences: checked.
- Space Apps legal/AI discussions: checked.
- Jev OpenRouter model page/tutorial, Gemini 4 Hydrogen model card/pricing/AI Studio docs: checked.

Marked PARTIAL/UNVERIFIED where noted in the text.

---

## Appendix C: One-page recommendation

If the team wants the highest probability of a strong global submission with a 3–5 person generalist team: **Fire Season Atlas (F1)**. Build the harmonized calendar, make the sensor seam visible, add Jev for the typed anomaly/driver decision and Gemini for the cited briefing, and use the dither calendar as the visual signature.

If the team has SAR/InSAR depth and wants a high-novelty story: **Surface Waltz (S1)**, with NISAR GCOV and a wetland/flood narrative. Do not attempt raw GUNW unless someone has done interferometry before.

If the team has agronomy/remote-sensing depth and wants the highest impact ceiling: **Rotation Studio (A1)**, with an evidence ledger and a U.S. demo field. Do not promise a global crop advisory; be explicit about gaps.

In all three: precompute the demo data, disclose AI use, cite every dataset and licence, and make the uncertainty part of the interface rather than a footnote.

---

## Key findings

1. **The fire challenge is the most winnable.** FIRMS is the only listed resource, the API is simple, and the harmonization gap is real. The 2026 sensor transition (SNPP ended 2 Nov 2026; MODIS ending 2026–2027) makes sensor-aware design essential and gives a strong story.
2. **NISAR is live but young.** Validated L-band products were released 6 Nov 2026 for acquisitions from 21 Oct 2026; PROVISIONAL covers Jun–Oct 2026; BETA covers earlier. Use GCOV (0.8 GB/granule) for change detection, label maturity, and do not assume a long validated time series.
3. **OPERA is the SAR shortcut.** DISP-S1 (2016–present, North America), DSWx-S1 (water), DIST-ALERT-S1 (disturbance) and RTC-S1 (backscatter) are analysis-ready and much smaller than raw NISAR. DISP-NI is not available; production is expected Feb 2027 at the earliest.
4. **HyP3 is Sentinel-1 only.** 8,000 free credits/month; RTC 5 credits, InSAR 15; products expire after 14 days. Great for custom Sentinel-1, useless for NISAR.
5. **Auth is not the blocker.** Earthdata Login is free with email activation (minutes); FIRMS MAP_KEY is emailed (instant); OpenET keys are self-serve; POWER and GLAM need no auth. The hard parts are volume, bias correction, and interpretation.
6. **Cloud-native access is uneven.** HLS/OPERA are COGs; OPERA DISP has Zarr; NISAR/SMAP/GPM are HDF5. Use `earthaccess` + CMR-STAC for discovery, COG range reads for imagery, DuckDB/Parquet for FIRMS, and precompute derived assets for the demo.
7. **AI fit is best when split.** Gemini 4 Hydrogen for narrative/multimodal explanation (1M context, free tier, PDF/image/audio/video input); Jev 1.13 for typed decisions (262K context, $0.042/1M input, ~0.08 s P50); Prithvi for EO classification (Apache 2.0, HLS, U.S.-CDL bias). Do not use an LLM for deterministic calculations.
8. **Space Apps rules require disclosure.** AI is allowed, but AI images/videos need a visible watermark; audio and code/data need acknowledgement; all sources/licences must be cited; submissions default to Apache 2.0; AI-generated content must not use NASA branding.
9. **Licensing traps exist.** OpenET is a restricted source (attribution, no bulk redistribution; Data Explorer licence is personal/non-commercial; API terms allow commercial applications but not IP rights in the API/data), not CC0; PRISM is free with attribution; Copernicus needs attribution; USDA is mostly public domain; GAEZ/CoCoRaHS/Ag Data Commons need per-dataset checks; HLS-Data-Resources and FarmHero have no root licence file, so do not copy code without checking.
10. **The dither aesthetic is a differentiator only if functional.** Use 1-bit ordered/Bayer dithering on SAR/water/fire rasters, halftone calendars, high-contrast toggles, and accessible color ramps. Avoid retro-kitsch filters, fake CRT scanlines, and illegible microtext. The aesthetic should say "mission-control precision," not "old computer."

---

## Open questions

1. **Is Aqua MODIS still collecting data on 14 November 2026?** Sources conflict: NASA's transition page says late 2026/early 2027; the March 2026 MODIS status deck gives Aqua decommissioning around August 2026 with a possible extension; a February 2026 CAMS article says Aqua around September 2027. Check the current MODIS status page and FIRMS data availability before relying on recent MODIS.
2. **Does FIRMS have NOAA-20/21 standard-quality (SP) data through 2026?** The API lists `VIIRS_NOAA20_SP`/`VIIRS_NOAA21_SP`; the archive README says standard quality for NOAA-20/21 is "not yet available." Query `/api/data_availability` with a key and verify the max dates.
3. **What is the exact NISAR validated coverage and latency by track?** ASF search returns a mix of validated/provisional/urgent-response collections. Filter by collection and check granule dates; do not assume every acquisition after 21 October 2026 is already validated.
4. **Will DISP-NI arrive before the hackathon?** No. ASF says production is expected February 2027 at the earliest. Treat NISAR displacement as GUNW-only for now.
5. **What are Gemini 4 Hydrogen's free-tier rate limits?** Google does not publish per-model RPM/TPM/RPD numbers; check AI Studio for the project. If the demo needs many calls, budget for paid tier.
6. **What are Jev's rate limits and quotas on OpenRouter?** The model page gives price/context/latency but not per-account limits. Check the OpenRouter dashboard; have a deterministic fallback.
7. **Is OpenET coverage adequate for the chosen AOI?** OpenET is U.S.-focused and the challenge says western U.S. Check the coverage map before promising a global farm tool.
8. **How well does the Prithvi crop model generalize outside the U.S. CDL domain?** The checkpoint is trained on U.S. CDL labels; expect degradation in other regions. Fine-tune with local labels or label the output as "U.S. demo only."
9. **What are the licences for GAEZ, CoCoRaHS and individual Ag Data Commons datasets?** Do not assume CC0. Check each dataset's terms before redistribution or commercial use.
10. **What are the 2026 judging weights?** Not published in the challenge text. The objectives emphasize impact, use of NASA data, AI/technical execution, storytelling and feasibility; design for all five.
11. **Will the Resources tabs be updated before the hackathon?** The challenge pages say more resources may be added. Re-check the Resources tabs at the start; a newly added dataset could change the best concept.
12. **Can the team use OpenET data in an open-source public repo?** The terms require attribution and prohibit bulk redistribution; the Data Explorer licence is personal/non-commercial, while the API terms allow commercial applications but not IP rights in the API/data. Do not commit raw OpenET data; query the API and show derived results with attribution, and check the terms for your use case.
