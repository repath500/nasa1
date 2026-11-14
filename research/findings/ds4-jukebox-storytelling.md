# Deep dive: The Earth Information Jukebox + Abandoned but Not Forgotten

**Prepared:** 14 November 2026, for the 2026 NASA International Space Apps Challenge (14–15 Nov 2026).
**Scope:** the two challenge files assigned to this sub-agent, read in full:
- `research/challenges/the-earth-information-jukebox.md`
- `research/challenges/nasas-discarded-equipment-storytelling.md`

**Verification convention**
- **VERIFIED** = I opened the page, API or file myself on 13–14 Nov 2026 and confirmed the claim at the URL given.
- **THIRD-PARTY** = a secondary source (blog, aggregator, Wikipedia, vendor comparison) says it; I did not confirm it at the primary source.
- **UNVERIFIED** = I could not confirm it. Do not put it in a pitch without checking.
- **INFERRED** = my judgement from confirmed facts, not a sourced claim.

Vendor benchmark numbers are deliberately not used as build-plan facts. The important claims are about access, modalities, limits and licences.

---

## 0. Executive summary

1. **Both named 2026 models are real and usable.** Jev is TypeSafe AI's "System One" decision model: typed Choice / Score / Noul / Box answers with calibrated probabilities, 70–500 ms, $0.042 per 1M input tokens and free output; it takes **text and images** and does **not** accept audio or video. Gemini 4 Hydrogen is a Google model released 12 Nov 2026: 1M unified context, text/image/audio/video/PDF input, **text output only**, $1.50/$7.50 per 1M tokens, 64K default output and 1M long decode. VERIFIED: https://docs.typesafe.ai/models.md and https://aistudio.google.com/docs/models/gemini-4-hydrogen

2. **Critical correction: Gemini 4 Hydrogen cannot generate audio.** It accepts audio and video as input but outputs text. For narration use **Gemini 3.8 Flash TTS** (`gemini-3.8-flash-tts`); for music use **Lyria 3.5** (`lyria-3.5`, full songs, $0.08/song) or **Lyria RealTime** (`lyria-realtime-exp`, experimental streaming instrumental music over WebSocket). VERIFIED: https://aistudio.google.com/docs/models/gemini-4-hydrogen, https://aistudio.google.com/docs/models/gemini-3.8-flash-tts, https://aistudio.google.com/docs/music-generation, https://aistudio.google.com/docs/realtime-music-generation

3. **Jev is not a storyteller or a composer.** It is a fast, calibrated decision layer. Its best role in both challenges is **director/DJ**: choose the next story beat or arrangement from a hand-authored set, score intensity or tone, and return probabilities that code can branch or crossfade on. It cannot generate prose, audio or music. VERIFIED: https://docs.typesafe.ai/introduction and https://docs.typesafe.ai/primitives/choice.md

4. **The Jukebox data is live and good for a 48-hour build.** The EIC gallery on SVS is up; all ten listed SVS pages (the nine EIC pieces plus Caldwell 73) return HTTP 200; several offer downloadable **frame sets** (for example SVS 5533 has a 1,801-item 5760×3240 frame set), plus PNG stills and MP4s. GIBS is a public, no-auth WMTS/WMS/tile service; Worldview is the browse front-end; Earthdata Login (URS) is only needed for protected data downloads. VERIFIED: links in §1.3.

5. **NASA already has a deep sonification playbook, and judges will know it.** Chandra/SYSTEM Sounds used scan direction, wavelength→instrument, brightness→loudness and position→pitch, published separated layers for reproducibility, and tested with blind and low-vision users. The challenge is not "make a synth"; it is "make a legible, reproducible, accessible mapping." VERIFIED: https://chandra.si.edu/sound/ and https://science.nasa.gov/open-science/astronomy-data-sonification/

6. **The Storytelling challenge has one killer dataset and one obvious gap.** LROC's PDS **Anthropogenic Features on the Moon** point shapefile is 1.5 MB, has **71 records** (parsed from the DBF), includes Apollo descent stages, LRVs, ALSEPs, Surveyors, Rangers, S-IVB impacts and modern landers (Blue Ghost 1, IM-2, Chang'e 6, SLIM, Chandrayaan-3), is public domain and was updated **2026-08-14**. There is **no comparable authoritative NASA inventory for Mars surface hardware**; the team must assemble one from NSSDCA, mission pages, HiRISE and the 2012 NASA catalogue. That gap is an opportunity. VERIFIED: https://wms.lroc.asu.edu/lroc/view_rdr/SHAPEFILE_ANTHROPOGENIC_OBJECTS (downloaded and parsed).

7. **Licensing is more nuanced than "NASA = public domain."** NASA content is generally not copyrighted in the US, but LROC **website** images are copyrighted (PDS products are public domain); some EIC videos contain licensed Universal Production Music / Pond5 / Shutterstock assets and must not be remixed; HiRISE is public domain; NSSDCA is NASA public domain; the NASA insignia, logotype and seal are protected. Space Apps also requires AI disclosure, visible watermarks on AI-generated images/videos, and **no NASA branding in AI-generated content**. VERIFIED: https://www.nasa.gov/nasa-brand-center/images-and-media/, https://www.lroc.asu.edu/about/terms, https://www.uahirise.org/media/usage.php, https://github.com/nasa/spaceapps/discussions/1849

8. **Gemini API terms are 18+.** A kids-facing app that calls the Gemini API live is a compliance risk ("directed towards or likely to be accessed by individuals under the age of 18"). For the school-age storytelling challenge, generate narration and captions at **authoring time** and ship a static kid-facing experience, or use open-weight models. Jev's B2B agreement has no equivalent age clause that I found, but it is a business service, not a child-directed SDK. VERIFIED: https://aistudio.google.com/docs/terms (Age Requirements); UNVERIFIED/INFERRED for Jev child-facing use.

9. **Best concepts in one line each.**
   - Jukebox: **"EARTH/1 — Audio Liner Notes"**, a six-track jukebox with a literal Tone.js sonification mode, a Lyria RealTime "dream" mode, a dither visualizer and an audio-first accessibility mode. Runner-up: "Listen to the Planet", audio-only.
   - Storytelling: **"Still Here — A Field Guide to the Forgotten"**, a dither atlas of 12 Moon/Mars/deep-space artifacts with first-person "memory" vignettes, a "what we know / what we infer" source drawer and a deep-space wing. Runner-up: "The Long Orbit".

10. **48-hour feasibility is good if scoped ruthlessly.** Six Jukebox tracks, six to twelve artifact stories, pre-generated frames and TTS, one map, one wow transition. Do not attempt live SVS streaming, live GIBS tiles, full 3D terrain or a general-purpose music model in the MVP.

---

# 1. The Earth Information Jukebox

## 1.1 Challenge in one paragraph

NASA's Earth Information Center (EIC) produces striking visualizations of the changing planet, but they are overwhelmingly visual, which excludes blind and low-vision users and limits how anyone can engage with the science. The challenge asks teams to build an **"Earth Jukebox"**: an interface, script or application that pairs **EIC visual frames** with **dynamic sonifications generated in real time**, translating sight into sound. The deliverable may be an interactive web/desktop jukebox, a backend API, or a curated playlist of original generated audio with an explanation. The ask is explicitly multi-sensory and accessibility-first, but it also demands a defensible mapping between data and sound, not just a pretty soundtrack. VERIFIED: challenge text in `research/challenges/the-earth-information-jukebox.md`.

## 1.2 What the judges are really looking for (hidden hooks)

- **Accessibility is the core, not a feature.** The challenge repeats blind/low-vision users, screen-reader compatibility, tactile feedback and rich descriptive text. A project that only adds sound to a visualizer misses the point. Build and demo an audio-first path.
- **Use actual EIC/SVS frames.** The Resources tab lists the SVS EIC gallery and nine specific visualizations. For Global Awards eligibility the project must use at least one NASA data source from the challenge Resources. Choose at least two SVS pieces and cite the exact IDs.
- **Balance data fidelity and musicality.** The text explicitly warns that direct pixel-to-sound can be chaos and suggests scales, harmonies and artistic rulesets. Judges will ask: what does pitch mean here? What does loudness mean? Can I reproduce it?
- **Show the mapping.** The Chandra sonifications publish separated layers and describe the translation. Do the same: a "liner notes" panel or downloadable mapping spec is a differentiator.
- **Emotional impact.** The challenge asks teams to reflect the urgency of climate change and the beauty of interconnected systems. A cold data-to-MIDI demo will not win; a demo that makes a judge feel the night-lights spread, or the ocean slow down, will.
- **Beginner/Youth level.** The challenge is marked Intermediate, Beginner/Youth. Clarity, polish and a tight 30-second demo can beat a technically dense but confusing build.
- **A curated playlist is allowed.** If the team is stronger in music/production than front-end, a six-track "album" with a static site and a rigorous process explanation is a legitimate submission. The live jukebox demos better.
- **AI disclosure.** All AI-generated audio must be acknowledged in descriptive text/metadata; AI-generated images/videos need a visible watermark. Do not put NASA logos or mission identifiers into AI-generated assets. VERIFIED: https://github.com/nasa/spaceapps/discussions/1849

## 1.3 Data and resources table

All URLs were opened on 13–14 Nov 2026. "Frame sets" counts are the number of "Frame sets" entries visible on the SVS page, not a guarantee of exact frame counts.

| Name | URL | Format | Access/auth | Size | License | Verified? | Notes |
|---|---|---|---|---|---|---|---|
| EIC Content Database (SVS gallery) | https://svs.gsfc.nasa.gov/gallery/earth-information-center/ | HTML gallery; links to MP4/PNG/frame sets | Public, no auth | Many GB across gallery | NASA/GSFC SVS; NASA media guidelines; some videos embed licensed music | VERIFIED | The challenge calls this the EIC content database. Gallery container IDs such as 40467 404 as direct pages; the visualization IDs below are the usable entry points. |
| Change in Night Lights 2012–2023 (EIC) | https://svs.gsfc.nasa.gov/5313/ | 7680×2160 MP4 (32.7 MB), ProRes MOV (4.0 GB), frame set | Public | ~4 GB ProRes; 32.7 MB H.265 | NASA/GSFC; credit SVS | VERIFIED | High contrast dark/bright; ideal for intensity→tempo/volume mapping. 1 frame-set entry. |
| Global Sea Surface Currents and Temperature | https://svs.gsfc.nasa.gov/3912/ | MP4/WebM; frame sets | Public | 244.4 MB (2048×1024 MP4); 278.6 MB flat version; 14.9 MB 960×540 WebM | NASA/GSFC; ECCO2/MITgcm model | VERIFIED | Fluid motion; good for continuous, evolving soundscapes. 3 frame-set entries. |
| GEOS Aerosols | https://svs.gsfc.nasa.gov/5669/ | Video; check page for stills | Public | Check page | NASA/GSFC/GMAO | VERIFIED (page 200) | Multi-layer aerosol types → multi-track instruments. No frame-set label on page at check. |
| Air Quality Model Runs | https://svs.gsfc.nasa.gov/5533/ | 5760×3240 MP4 (285.8–361.2 MB); 1,801-item and 3,031-item frame sets; PNG stills | Public | ~285–361 MB per MP4; frame sets many GB | NASA/GSFC/GMAO; GEOS-CF | VERIFIED | Best-documented frame-set example: `AirQuality_SphereWithLabels (5760x3240) [1801 Item(s)]`. 4 frame-set entries. |
| Perpetual Ocean 2: Western Boundary Currents | https://svs.gsfc.nasa.gov/5425/ | 1080p/2160p MP4; 2400×810 hyperwall; frame sets | Public | 1.2 GB (1080p), 5.0 GB (2160p) | NASA/GSFC | VERIFIED | High-contrast currents → rhythm/scale. 9 frame-set entries. |
| DYAMOND Global Carbon Dioxide | https://svs.gsfc.nasa.gov/5196/ | 1080p H.265 6.9 MB; 2160p 68.4 MB; frame sets | Public | 6.9–68.4 MB per movie | NASA/GSFC | VERIFIED | Global CO2 point cloud; good for evolving pads/textures. 5 frame-set entries. |
| Lightning Events from ISS 2017–2023 | https://svs.gsfc.nasa.gov/5011/ | 1080p MP4 127 MB; 4K 414.2 MB; 7680×2160 579.9 MB | Public | 127–580 MB | NASA/GSFC | VERIFIED | Punctuated sonification; percussive triggers. No frame-set label at check. |
| 3D Atmospheric River | https://svs.gsfc.nasa.gov/4960/ | 1080p MP4 410.9 MB; 4K 646.9 MB; WebM 68.6 MB; frame sets | Public | 69–647 MB | NASA/GSFC | VERIFIED | Narrated version exists; use silent frames for your own sonification. 3 frame-set entries. |
| GEDI Forest Height | https://svs.gsfc.nasa.gov/4950/ | 1080p60 MP4 17.7 MB; WebM 6.0 MB; 2160p30 61.5 MB; frame sets | Public | 6–61.5 MB | NASA/GSFC | VERIFIED | Color/luminance → pitch/rhythm; 12 frame-set entries. |
| Data Sonification: Caldwell 73 | https://svs.gsfc.nasa.gov/13786/ | 1920×1920 MP4 73.9 MB; WebM 5.6 MB | Public | 73.9 MB | NASA/GSFC; sonification by SYSTEM Sounds (M. Russo, A. Santaguida) | VERIFIED | Conceptual reference: radar scan, radius→pitch, choir/marimba/glockenspiel. Do not reuse as your own sonification; cite it. |
| NASA Data Sonifications hub | https://www.nasa.gov/data-sonifications/ | Web page; MP3/video links | Public | Varies | NASA; credit NASA/CXC/SAO/SYSTEM Sounds | VERIFIED | Chandra, Hubble, Webb, Spitzer sonifications; useful for the process section. |
| Chandra "A Universe of Sound" | https://chandra.si.edu/sound/ | Web page; audio/video; separated layers | Public | Varies | NASA/CXC/SAO; SYSTEM Sounds; credit required | VERIFIED | Best existing model for accessibility and reproducibility. |
| GIBS | https://nasa-gibs.github.io/gibs-api-docs/ | WMTS, WMS, TWMS, XYZ tiles | Public, no auth | Tile pyramid; global | NASA ESDIS; imagery generally not copyrighted; attribution requested | VERIFIED (HTTP 200) | Endpoints at `https://gibs.earthdata.nasa.gov/...`; EPSG:4326/3413/3031/3857; `best`/`std`/`nrt`/`all`. |
| Worldview | https://worldview.earthdata.nasa.gov/ | Web app; browse/export imagery | Public | N/A | NASA ESDIS | VERIFIED (HTTP 200) | Front-end over GIBS; useful to find dates/layers, not a data API itself. |
| Earthdata Login (URS) | https://urs.earthdata.nasa.gov/ | Account/auth service | Auth required for protected data | N/A | NASA | VERIFIED (HTTP 200) | Not needed for GIBS or SVS; needed for many DAAC downloads. |
| Earthdata data use guidance | https://www.earthdata.nasa.gov/engage/open-data-services-software-policies/data-use-guidance | Web page | Public | N/A | ESDIS content generally not copyrighted; CC0 unless marked; cite | VERIFIED | Key quote: "Unless the content is marked with a use restriction or license, data provided from a NASA-led mission are licensed as Creative Commons Zero (CC0)." |
| CMR API | https://cmr.earthdata.nasa.gov/search/ | JSON/XML/ATOM/UMM; collections & granules | Search public; download may need login | Metadata; not the data | NASA ESDIS | VERIFIED (HTTP 200) | `collections.json`, `granules.json`; no auth for search. |
| NASA Image and Video Library API | https://images-api.nasa.gov/search | JSON + asset links | Public, no auth | Varies | NASA media guidelines | VERIFIED | `media_type=image,audio,video`; good for stills and audio search. Example query returned 1,762 image hits for "lunar module". |
| SVS reproduction/credit | https://svs.gsfc.nasa.gov/5533/ (footer link) | Web | Public | N/A | NASA media guidelines | VERIFIED | SVS pages link to NASA's media guidelines. Credit "NASA's Scientific Visualization Studio" and the individual producers/datasets. |
| EIC portal | https://earth.gov/ | Web app; dashboards/interactives | Public | N/A | NASA and partner agencies | VERIFIED (HTTP 200) | Includes NASA Eyes on Earth, GEOS Earth Now, Rain Global, Hometown Dashboard, Planet Pen. Useful extra context, not required. |

**Important EIC caveat:** some EIC *videos* include licensed music and third-party imagery. SVS descriptions for ID 14696 and 14568 explicitly credit Universal Production Music, Pond5, Shutterstock and the Smithsonian, and say some imagery "may not be excised or remixed in other products." Use the **frame sets / PNG stills / silent visualizations** for your sonification, not the produced soundtrack. VERIFIED: EIC gallery page descriptions.

## 1.4 Earth data APIs in detail

### GIBS (Global Imagery Browse Services)

- **What it is:** pre-rendered visualizations of NASA Earth science observations served as a tile pyramid, built on OnEarth/MRF. VERIFIED: https://nasa-gibs.github.io/gibs-api-docs/
- **Access:** public, no auth. Four services:
  - **WMTS** (REST and KVP): `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/{Layer}/{style}/{Time}/{TileMatrixSet}/{z}/{y}/{x}.{ext}`
  - **WMS** (1.1.1 and 1.3.0): `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?`
  - **TWMS** for GDAL
  - **XYZ/TMS** by populating the WMTS REST fields
- **Projections:** EPSG:4326 (geographic), 3413 (Arctic), 3031 (Antarctic), 3857 (Web Mercator). Every 4326 layer is also in 3857; polar layers may use 1 km instead of 2 km tile sets.
- **Time:** `TIME=YYYY-MM-DD` or `YYYY-MM-DDTHH:MM:SSZ`; `default` returns the default date; `DescribeDomains` lists all dates (GetCapabilities only shows the latest 100).
- **Service tiers:** `best`, `std` (science quality), `nrt` (near real time), `all`.
- **Attribution:** "We acknowledge the use of imagery provided by services from NASA's Global Imagery Browse Services (GIBS), part of NASA's Earth Science Data and Information System (ESDIS)."
- **Licensing:** ESDIS content generally not copyrighted; CC0 unless marked; attribution strongly urged. VERIFIED: Earthdata data use guidance.
- **48h use:** do not build a tile server; fetch a handful of 256/512 px tiles for a live "current Earth" backdrop, or pre-render a small region to PNG. GIBS tiles are JPEG/PNG and generally CORS-friendly, but test from the browser origin before relying on it.

### Worldview

- **What it is:** NASA's web app for browsing GIBS layers, comparing dates and downloading imagery snapshots. It is not a separate API; the underlying service is GIBS. VERIFIED: https://worldview.earthdata.nasa.gov/
- **48h use:** use it to pick compelling dates and layers (night lights, aerosol plumes, sea ice) and then call GIBS directly or export stills. Do not scrape the Worldview UI.

### Earthdata Login / URS

- **What it is:** NASA's identity provider for Earthdata. Needed for protected DAAC data and some cloud access; not for GIBS tile reads or CMR searches.
- **48h use:** skip it unless you need Level-2/3 granules. If you do, budget 15–30 minutes for account creation and application authorization; never put credentials in client-side code. VERIFIED: https://urs.earthdata.nasa.gov/

### CMR (Common Metadata Repository)

- **What it is:** NASA's metadata search API for collections and granules. JSON, XML, ATOM and UMM; `collections.json` and `granules.json` endpoints. Search is public; granule downloads may need Earthdata Login.
- **48h use:** resolve a dataset name to a DOI/collection and show provenance. Example: `https://cmr.earthdata.nasa.gov/search/collections.json?keyword=GEOS-CF`. VERIFIED: HTTP 200 and CMR docs.

### SVS

- **What it is:** NASA Goddard's Scientific Visualization Studio. Produces the EIC visuals, frame sets, PNGs, MP4s and sonifications. Public, no auth, credit required.
- **48h use:** download a **frame set** for 3–6 visualizations, downscale to 960×540 or 1280×720, and ship the frames with the app. This avoids CORS, bandwidth and timing surprises in the demo. VERIFIED: SVS pages and file listings.

### NASA Image and Video Library

- **What it is:** `images.nasa.gov` and `images-api.nasa.gov`. Search returns JSON metadata and asset links; media types include image, audio and video.
- **48h use:** good for stills of hardware and for audio search, but **not** a substitute for SVS frame sets. The API works without a key. VERIFIED: a test query returned JSON and 1,762 image hits for "lunar module".

## 1.5 Sonification prior art and open-source stack

### The NASA/Chandra playbook (what to copy)

- **Scan direction is a musical decision.** Left-to-right, bottom-to-top, radial/clockwise or center-out. Each makes different structures audible.
- **Map dimensions to independent audio dimensions.** Chandra examples: brightness→volume, vertical position/radius→pitch, wavelength→instrument/timbre, stereo position→left/right location. VERIFIED: https://chandra.si.edu/sound/ and the Crab/M51/Bullet pages.
- **Publish separated layers.** The team releases isolated wavelength layers so listeners can hear the composition and so the mapping is reproducible. Quote from Dr. Kim Arcand: "It's not just about accessibility. It's also about reproducibility." VERIFIED: https://science.nasa.gov/open-science/astronomy-data-sonification/
- **Test with blind and low-vision users.** The project included consultant Christine Malec and ran a study; results showed learning gains, enjoyment and emotional response. VERIFIED: https://www.frontiersin.org/journals/communication/articles/10.3389/fcomm.2024.1288896/full
- **Explain the mapping in text.** Every Chandra sonification has a caption describing exactly what was mapped to what. Do the same in the app and in the submission.
- **Use musical scales to tame direct mapping.** The Sonification Handbook (open access) is the standard reference for parameter mapping, auditory display and perceptual trade-offs. VERIFIED: https://sonification.de/handbook/

### Earth-specific prior art

- **NASA Earthdata "From Data to Melody"** — NDVI and warming-stripes sonification; maps data to MIDI chords and velocity; discusses parameter mapping and reproducibility. VERIFIED: https://www.earthdata.nasa.gov/news/blog/from-data-melody-data-sonification-its-role-open-science
- **SYSTEM Sounds "Earth Day"** — NASA Earth science missions as guitar notes, orchestra sections by sphere (atmosphere/biosphere/etc.), a temperature map as a drone. VERIFIED: https://www.system-sounds.com/earth-day/
- **Climate Music** (2020) — temperature→tenor line/chords, Arctic ice→instruments; uses D3 + Tone.js. VERIFIED: http://beebe-west.com/viz/climate-music/
- **Sounding Climate** (NCAR) — climate model data, one instrument per variable, pitch per value, CO2 controls the scale. Good classroom reference. VERIFIED: https://scied.ucar.edu/activity/sounding-climate-classroom
- **Arcobaleno** — 2023 Space Apps Global Connection winner; sonifies 2D/3D images for blind users, maps SHL colors to notes and lets users choose a genre. Direct prior art for accessibility. VERIFIED: https://science.nasa.gov/directorates/smd/2023-nasa-international-space-apps-challenge-announces-10-global-winners/
- **Renaissance Quintet** — 2023 Boston winner; smart mirrors/frames that play NASA sonifications and a constellation sonification algorithm. Prior art for "sonification in daily life". VERIFIED: https://github.com/HSSBoston/renaissance-quintet
- **Cosmic Oscillator** — 2023 Dallas Art & Technology winner; OpenCV pixel extraction + Tone.js. A 24-hour proof that browser pixel sonification is feasible. VERIFIED: https://www.jamesccole.com/posts/Cosmic%20Oscillator
- **2026 Earth Jukebox repo** — a public 2026 Space Apps project for this exact challenge, using React/Three.js/Web Audio and Gemini 3.8 Flash for narration. Useful prior art and a caution: it is another team's interpretation, not a template to copy. VERIFIED: https://github.com/ahsanur-official/The-Earth-Information-Jukebox
- **NASA-IMPACT/data_sonification** — Streamlit app for sonifying data; **no license is shown on the repo**, so treat it as reference-only unless the team confirms terms. VERIFIED: https://github.com/NASA-IMPACT/data_sonification
- **Astronify** — STScI's BSD-3-Clause Python sonification library for light curves and astronomy. Good reference for parameter mapping; not Earth imagery. VERIFIED: https://github.com/spacetelescope/astronify
- **Ear2Earth** — AGPL-3.0 web sonification of environmental sensor data with Tone.js. Good ideas; AGPL is a copyleft risk for a closed demo. VERIFIED: https://github.com/OPEnSLab-OSU/Ear2Earth
- **Space Weather Audification Portal** — MIT; CDAWeb magnetic-field audification. Good example of a data-specific pipeline. VERIFIED: https://github.com/Sonified/space-weather-audio

### Browser audio stack and licenses

| Library / API | Role | License | Use in 48h? | Notes |
|---|---|---|---|---|
| Web Audio API | Native audio graph, scheduling, spatial panning, analyser | W3C standard; royalty-free | **Yes — core** | No dependency; works everywhere; AudioContext requires a user gesture. VERIFIED (MDN/W3C). |
| Tone.js | Synths, transport, effects, scheduling | **MIT** | **Yes — recommended** | 14.9k stars; `Tone.start()` on click; great for scales/chords/transport. VERIFIED: https://github.com/Tonejs/Tone.js |
| Strudel | Live-coding algorithmic patterns (Tidal port) | **AGPL-3.0** | Optional only | Moved to Codeberg; AGPL is a network-copyleft risk if you modify and host it. VERIFIED: https://github.com/tidalcycles/strudel |
| SuperCollider | Server-side synthesis language | GPL-3.0 | No | Too heavy for a browser MVP; great for offline sound design. THIRD-PARTY license. |
| Sonic Pi | Live-coding music | MIT | Optional | Desktop only; not a web runtime. THIRD-PARTY. |
| p5.js | Visual canvas / dither rendering | LGPL-2.1 | Optional | Good for sketches; Tone.js covers audio. THIRD-PARTY. |
| Three.js | 3D globe / spatial visual | MIT | Optional | Good for an Earth/Moon globe; overkill for a 2D jukebox. THIRD-PARTY. |
| D3 | Data scales, color, axes | ISC | Optional | Good for legends and mapping panels. THIRD-PARTY. |
| OpenCV.js | Client-side feature extraction (edges, contours, optical flow) | Apache-2.0 | Optional | Adds ~8 MB WASM; precompute features offline instead. THIRD-PARTY. |
| ffmpeg | Extract/downscale frames offline | LGPL/GPL depending on build | **Yes — offline** | Use a standard LGPL build; do not ship GPL codecs unless you accept GPL. THIRD-PARTY. |
| Meyda | Audio feature extraction | MIT | Optional | Not needed if you generate audio from data rather than analyze audio. THIRD-PARTY. |
| Essentia / Essentia.js | Audio analysis | AGPL-3.0 (Essentia) / check JS | No | Copyleft; unnecessary for the MVP. THIRD-PARTY. |

**Recommendation:** **Web Audio API + Tone.js** for the deterministic, data-literal sonification; **Lyria RealTime** for the optional AI "dream" layer; **no Strudel** in the client unless the team deliberately accepts AGPL.

## 1.6 AI music models available in Nov 2026 (and their licenses)

"Commercial?" is about using the model or output in a commercial product. A hackathon demo is normally non-commercial, but the team should still know.

| Model | Access / API | Input → output | License | Commercial? | Length / format | Notes / verification |
|---|---|---|---|---|---|---|
| **Google Lyria 3.5** (`lyria-3.5`) | Gemini API / AI Studio / Vertex | Text + up to 10 images → MP3 or WAV audio + lyrics | Closed, Gemini API Additional Terms; Google "won't claim ownership" of generated content | Paid tier; check terms | Full song, ~2 min (prompt-controllable); 44.1 kHz stereo | $0.08/song; SynthID watermark; no multi-turn editing; safety filters block artist voices/copyrighted lyrics. VERIFIED: https://aistudio.google.com/docs/models/lyria-3.5 and https://aistudio.google.com/docs/music-generation |
| **Google Lyria 3 Clip** (`lyria-3-clip-preview`) | Gemini API | Text → 30 s MP3 | Same | Paid | 30 s | $0.04/clip. VERIFIED: pricing page. |
| **Google Lyria RealTime** (`lyria-realtime-exp`) | Gemini API, WebSocket | Weighted text prompts + config → streaming raw PCM | Closed, experimental; watermark | Paid tier; pricing not listed | Continuous instrumental; 48 kHz stereo | BPM 60–200, density 0–1, brightness 0–1, scale enum, mute bass/drums, guidance 0–6. Instrumental only. VERIFIED: https://aistudio.google.com/docs/realtime-music-generation; UNVERIFIED: public price (not on pricing page at check). |
| **Magenta RealTime 2** | Local Python/C++ (JAX/MLX), Apple Silicon/NVIDIA | Text/audio/MIDI prompts → streaming audio | **Code Apache-2.0; weights CC-BY-4.0**; Google claims no rights in outputs | Yes (per model card) | Real-time; 230M or 2.4B; offline too | Best open real-time option; not browser-native. VERIFIED: https://github.com/magenta/magenta-realtime and `MODEL.md`. |
| **Meta MusicGen / AudioCraft** | Local (PyTorch), HF | Text (and melody) → 30 s instrumental | **Code MIT; weights CC-BY-NC 4.0** | **No** (weights non-commercial) | 30 s native, extendable | Classic baseline; no vocals. VERIFIED: https://github.com/facebookresearch/audiocraft and HF model card. |
| **ACE-Step 1.5** | Local (Python, REST API, Gradio) | Text (+ reference audio) → full song with vocals | **MIT** (code and weights per repo) | Yes (model card says commercial use) | 10 s–10 min; 50+ languages | Runs under 4 GB VRAM (2B), XL 4B needs 12–20 GB; under 2 s/song on A100 claimed. VERIFIED: https://github.com/ace-step/ACE-Step-1.5 |
| **Stability AI Stable Audio 3** | Local (GPU/CPU) / API for Large | Text/audio → instrumental | **Stability AI Community License** | Conditional: free below $1M annual revenue, registration; enterprise above | Small 120 s; Medium 380 s; 44.1 kHz stereo | Medium 1.4B; no vocals/lyrics; LoRA. THIRD-PARTY for exact terms; verify model card/license before shipping. |
| **YuE / YuE2** | Local (GPU) | Text → full song with vocals | YuE v1 Apache-2.0 code; **YuE2 weights CC BY-NC 4.0** | v1 yes; YuE2 no for companies | Several minutes | Heavy (24 GB GPU). THIRD-PARTY license summary; verify. |
| **Suno / Udio** | Cloud, proprietary | Text → full song with vocals | Proprietary plan terms; no weights | Per plan; no copyright warranty | Minutes | Good quality; not reproducible/open; avoid for a NASA open-data project. THIRD-PARTY. |
| **OpenAI Jukebox** | Local, old | Text → audio | Non-commercial | No | ~20 s, very slow | Historic; not practical. THIRD-PARTY. |
| **AudioLDM 2** | Local | Text/audio → audio | CC BY-NC-SA 4.0 | No (non-commercial, share-alike) | Short clips | Sound effects/music. THIRD-PARTY. |
| **Riffusion** | Local | Text → spectrogram audio | Code MIT; weights CreativeML OpenRAIL-M | Yes with use restrictions | Short loops | Not a full-song model. THIRD-PARTY. |

**What this means for the Jukebox:**
- For a **NASA-open, reproducible** demo, use **Lyria 3.5 / RealTime** (paid API, clear terms, SynthID), **Magenta RealTime 2** (open weights, local hardware) or **ACE-Step 1.5** (MIT, local GPU). Avoid MusicGen weights for anything you might later commercialize; avoid Suno/Udio if you want reproducibility.
- For **real-time data-driven** sound, do not rely on a text-to-music model alone. Use **Tone.js** for the auditable mapping and Lyria RealTime as an optional "dream" layer.
- For **narration**, use **Gemini 3.8 Flash TTS**, not a music model.

## 1.7 How the 2026 AI stack fits the Jukebox

### Gemini 4 Hydrogen: the perceiver and writer (but not the voice)

**What it is (verified):** `gemini-4-hydrogen`, released 12 Nov 2026. 1,048,576-token unified context; 65,536 default synchronous output; up to 1,048,576 with long decode; inputs text, image, video, audio, PDF; **output text only**; structured outputs, function calling, code execution, search grounding; thinking levels low/medium/high/xhigh; knowledge cutoff March 2026; $1.50/$7.50 per 1M input/output. VERIFIED: https://aistudio.google.com/docs/models/gemini-4-hydrogen, https://deepmind.google/models/model-cards/gemini-4-hydrogen/

**What it can do in the Jukebox:**
1. **Frame understanding.** Give it a contact sheet (for example 3×3 frames from a track) plus the SVS caption and legend. Ask for JSON: dominant process, color palette, motion cue, regions of interest, a one-sentence "what changed" caption and a list of claims with source references. This supplies the "computer vision" role the challenge suggests without building a CV pipeline from scratch.
2. **Mapping proposal.** Give it the dataset description and the sonification rulebook; ask for three candidate mappings (for example "sea-surface temperature → pitch within a pentatonic scale; current speed → note density; latitude → stereo pan") with a musicality/fidelity trade-off note. A human picks one.
3. **Liner notes / audio description.** Ask for a 60–90-second spoken liner note at a target reading level, plus a short screen-reader description per scene. It can also translate the liner notes; TTS supports 130 languages.
4. **Structured extraction for Jev.** The output JSON becomes Jev's `state`. This matters because Jev's image support is **experimental** ("Dreamer-ready", requires `TypeSafe-Danger-Zone-Images: true`), so use Hydrogen to turn pixels into a compact typed feature object, then let Jev make the fast decision.
5. **What it cannot do:** generate audio, generate music, generate images, or run as a Live API model. It cannot output bounding boxes natively. Do not promise "Hydrogen composes the soundtrack." VERIFIED: model page capability badges.

**Cost/ops:** a 1M-context call is overkill for a 3×3 contact sheet. Use ~10–30 frames per track, downscaled; one call per track is enough. Paid tier avoids training on your prompts; free tier is used to improve Google products. VERIFIED: https://aistudio.google.com/docs/pricing and https://aistudio.google.com/docs/terms

### Gemini 3.8 Flash TTS: the voice

- `gemini-3.8-flash-tts`: text → WAV (default), 8,192 input tokens, 16,384 output tokens, 130 languages, expressive acting, `speech_metadata.style` and `speaker`, inline `<laugh>`, `<sigh>`, `<short pause>`. VERIFIED: https://aistudio.google.com/docs/models/gemini-3.8-flash-tts
- Price: $0.50/1M text input, $9/1M audio output through 31 Dec 2026 (~$0.00225 per 10 s). VERIFIED: pricing page.
- Use it for the liner-notes voice and the accessibility descriptions. Pre-generate per track and ship the WAV/MP3; do not call TTS live in the demo.
- Voice cloning/replication exists, but do **not** clone a real astronaut or NASA employee; use a stock voice. Space Apps prohibits using likenesses of under-18s and requires care with identifiable persons.

### Lyria 3.5 / Lyria RealTime: the music

- **Lyria 3.5** is best for a polished 60–120-second "studio" theme per track: text + up to 10 images, 44.1 kHz stereo, MP3/WAV, lyrics optional, $0.08/song, SynthID. It supports timestamped structure (`[0:00-0:10] Intro: ...`), which can align to the visualization's sections. VERIFIED: music-generation docs.
- **Lyria RealTime** is the "wow" for a live demo: a WebSocket stream of instrumental music you can steer with weighted prompts and config (BPM, density, brightness, scale, mute drums/bass). Jev can choose the config per frame or scene; the code can crossfade weights. It is experimental, instrumental only, watermarked, and pricing is not public. VERIFIED: realtime docs; UNVERIFIED: price.
- **Do not call Lyria for the data-literal layer.** Use Tone.js so every note is explainable. Use Lyria only for the optional "dream" layer, clearly labeled.

### Jev: the director/DJ (musical arrangement decisions)

**What it is (verified):** TypeSafe AI's first "System One" model. It does not generate strings; it answers typed questions against a `state` and returns values with calibrated probabilities. Jev 1.14: text + images (images/Box experimental), Choice/Score/Noul/Box, 64k per-request / 32k per-question (262k with `TypeSafe-Danger-Zone-Long-Context: true`), 70–500 ms, $0.042 per 1M input, output free. VERIFIED: https://docs.typesafe.ai/models.md, https://docs.typesafe.ai/primitives/box.md, https://typesafe.ai/blog/introducing-system-one-models-and-jev

**Concrete arrangement flow (recommended):**

1. Hydrogen (or a deterministic CV script) turns the frame into:
   ```json
   {
     "track": "night_lights_2012_2023",
     "section": "india_zoom",
     "features": {"mean_luma": 0.18, "warm_pixel_ratio": 0.42,
                  "edge_density": 0.11, "motion": 0.07,
                  "bright_clusters": 312, "lat_band": "20N-30N"},
     "user": {"energy": "calm", "literalness": 0.7, "scale": "pentatonic"}
   }
   ```
2. Jev gets that as `state` and answers, in one request:
   ```json
   {
     "model": "jev-latest",
     "state": {"...": "above"},
     "questions": {
       "arrangement": {
         "type": "choice",
         "instructions": "Which arrangement should carry the next 8 bars?",
         "criteria": {
           "pulse": "Sparse electronic pulse, one note per bright cluster",
           "pad": "Sustained harmonic bed, slow attacks, no percussion",
           "bells": "Bell/mallet motif, one strike per new light cluster",
           "percussive": "Rhythmic noise hits driven by motion/edge density"
         }
       },
       "intensity": {
         "type": "score",
         "instructions": "How intense should the next section be?",
         "criteria": ["sparse", "present", "building", "peak"]
       },
       "change_now": {
         "type": "noul",
         "instructions": "Should the texture change at the next bar?"
       }
     }
   }
   ```
3. The code uses:
   - `arrangement.choice` → pick the Tone.js voice/pattern.
   - `arrangement.probabilities` → crossfade weights between the top two arrangements (for example 0.7 pulse + 0.3 bells).
   - `intensity.score` and `intensity.probabilities` → map to filter cutoff, note density, reverb and gain.
   - `change_now.noul` → only switch if the probability is above a tuned threshold (start at 0.7; below 0.3, keep the current arrangement).
   - `arrangement.confidence` → if low, keep the current arrangement or ask the user; do not thrash.
4. The same request can include `track_next` (Choice over the playlist) and `mode` (Choice: literal / dream / mixed) so the jukebox can act as a DJ without a second call. Jev evaluates all questions in parallel against the same state; adding questions barely changes latency. VERIFIED: https://docs.typesafe.ai/primitives/choice.md and https://docs.typesafe.ai/confidence.md

**Why Jev fits:** 70–500 ms is fast enough to make a change at a bar boundary; $0.042/1M input makes per-section calls cheap; the probability distribution gives smooth crossfades instead of hard switches; confidence gives a principled "do nothing" path. **Why not rely on Jev alone:** it cannot see raw video (images are experimental and no audio/video), cannot write a Lyria prompt, and cannot generate audio. Pair it with Hydrogen/Decision 1 for perception and Tone.js/Lyria for rendering.

### Gemini Decision 1: the multimodal fallback / augment

`gemini-decision-1` is Google's own decision model: text, image, video, audio and PDF input; calibrated yes/no, single-select and rubric scores; up to 1,000 questions per request; 262,144 input tokens; zero output tokens; $0.10 per 1M input tokens. It is a strong fallback if Jev access is delayed, and a better choice when the decision *requires looking at the actual frame or video* rather than a text feature vector. VERIFIED: https://aistudio.google.com/docs/models/gemini-decision-1 and pricing page.

### Prithvi-EO-2.0: optional geospatial feature extractor

IBM/NASA's Prithvi-EO-2.0 is an Apache-2.0 Earth-observation foundation model trained on HLS 6-band imagery; tiny/small variants run on consumer hardware. It could classify land cover or extract embeddings from satellite tiles, but it expects HLS bands, not RGB video frames, and integration is not a 48-hour MVP task. Mention it as a stretch goal only. VERIFIED license: https://huggingface.co/ibm-nasa-geospatial/Prithvi-EO-2.0-300M (model card `license: apache-2.0`).

## 1.8 Dither UI for EIC frames

### Why dither suits this challenge

- **It is deterministic and animation-friendly.** Ordered/Bayer dithering uses a fixed threshold map, so the same tone always lights the same cells. Error diffusion (Floyd–Steinberg) is serial and shimmers when animated. For a frame-synced visualizer, Bayer is the right default. VERIFIED: https://surma.dev/things/ditherpunk/ and https://www.prototemplate.com/docs/craft/dither
- **It reads as print, not retro kitsch.** A 4×4 or 8×8 Bayer screen reads like a halftone/wirephoto; at 1–3 px cells it looks like a modern data print, not a CRT filter. Avoid scanlines, glow and chromatic aberration unless the team can do them with restraint.
- **It preserves edges.** EIC frames are full of hard boundaries (coastlines, city-light clusters, aerosol plumes, ice edges). Ordered dither keeps those edges legible at small sizes; error diffusion gives a more organic still image.
- **It is low-bandwidth and high-contrast.** A 1-bit frame is tiny and accessible; it forces the UI to rely on luminance and shape rather than color alone, which aligns with the accessibility goal.
- **It can encode data.** Use different dither patterns/levels for different variables (for example 4×4 Bayer for temperature, 8×8 for motion, blue noise for uncertainty). The pattern becomes part of the legend, not decoration.
- **It links sight and sound.** Make the dither cell the unit of sonification: each cell's luminance drives note density/pitch, and the same cell grid is what the user sees. The mapping is then visually auditable: a bright patch visibly becomes a dense cluster of notes.

### Implementation notes

- Bayer matrices: 2×2 (5 tones), 4×4 (17 tones), 8×8 (65 tones); blue noise for smoother gradients. Larger matrices give finer tonal steps but a less visible crosshatch. VERIFIED: https://en.wikipedia.org/wiki/Ordered_dithering and https://dithercn.dev/docs/engine/dither-engine
- For still archival images use **Atkinson** or **Floyd–Steinberg**; for animated frames use **Bayer**. Atkinson discards 25% of the error and keeps highlights/shadows crisp, which suits lunar and space photography. VERIFIED: https://github.com/NielsLeenheer/CanvasDither
- Render at **one buffer pixel per dither cell**, then upscale with `image-rendering: pixelated`; do not run the dither at devicePixelRatio < 1 or the screen collapses to gray. Cell sizes 1–3 px for fidelity/halftone, 4–6 px for a coarser print look. VERIFIED: https://www.prototemplate.com/docs/craft/dither
- Use a **single accent color** (NASA red or signal amber) over black/white; avoid rainbow palettes. Keep typography modern (a grotesk or mono), generous spacing and mission-control precision.
- Accessibility: high contrast, no color-only encoding, reduced-motion mode, captions, and an audio description track. Dither is not a substitute for alt text.

### Dither libraries

| Library | License | Use |
|---|---|---|
| `@thi.ng/pixel-dither` | Apache-2.0 | Bayer, Atkinson, Floyd–Steinberg, Burkes, Sierra, Stucki; TypeScript; good for a canvas pipeline. VERIFIED: https://www.npmjs.com/package/@thi.ng/pixel-dither |
| `canvas-dither` | MIT | Small canvas Bayer/Atkinson/Floyd–Steinberg; easy drop-in. VERIFIED: https://github.com/NielsLeenheer/CanvasDither |
| `ditherdance` | Apache-2.0 | Gradients + image dithering, no dependencies. VERIFIED: https://dither.dance/ |
| `ditherjs` | CC-BY-SA-4.0 | Avoid for code you want to keep private; share-alike. VERIFIED: https://www.npmjs.com/package/ditherjs |
| ImageMagick | ImageMagick License (Apache-2.0-like) | Offline batch dithering/quantization; good for pre-rendered assets. THIRD-PARTY. |
| ffmpeg | LGPL/GPL | Extract and downscale frames; do the dither in JS/GLSL for live control. THIRD-PARTY. |

## 1.9 Project concepts

Scores are 1–10 and are my judgement, not NASA's. "AI fit" means how central the named 2026 models are to the experience, not whether AI is bolted on.

### Concept A — "EARTH/1: Audio Liner Notes" (recommended)

**Pitch line:** A record player for the planet: six EIC tracks, each with a data-literal sonification, a spoken liner note, and an AI "dream" layer you can steer.

**Target user:** Curious adults and classroom learners (ages 13+), plus blind and low-vision users who want an audio-first way into EIC data. Secondary: teachers looking for a 10-minute climate-science demo.

**Core experience and wow moment:** The user picks a "record" (for example Night Lights 2012–2023, Perpetual Ocean, GEDI Forest Height). The dither frame plays in sync with a Tone.js sonification. A "liner notes" panel explains the mapping: "brightness = note density; warm color = pitch; motion = filter opening." The user can toggle **Literal** (auditable data mapping), **Dream** (Lyria RealTime bed steered by the same features), and **Audio only** (screen-reader-first). The wow moment: during the Night Lights track, the India zoom triggers a visible dither bloom and a simultaneous bell cluster; the judge hears and sees the same data event, and the liner note says exactly why.

**AI roles:**
- **Gemini 4 Hydrogen:** per-track contact-sheet analysis → structured features + caption + mapping candidates + liner-note draft.
- **Jev:** per-section Choice of arrangement, Score of intensity/valence, Noul "change now?"; probabilities drive crossfades; confidence prevents thrash.
- **Gemini 3.8 Flash TTS:** pre-generated liner notes and per-scene audio descriptions.
- **Lyria 3.5 / RealTime:** a 60–90 s studio theme per track (3.5) and an optional live "dream" stream (RealTime) steered by Jev-chosen prompts/config.

**Data pipeline:**
1. Download SVS frame sets/PNGs for six tracks; `ffmpeg` to 1280×720 or 960×540; store in `public/frames/<track>/`.
2. Offline feature extraction (Python/OpenCV or browser Canvas): mean luminance, HSV histogram, edge density, optical-flow magnitude, bright-cluster count, region-of-interest values; write `features.json`.
3. Hydrogen call per track: contact sheet + SVS caption + legend → `track.json` (caption, mapping candidates, claims, feature interpretation).
4. Author a 60–90 s liner note per track (Hydrogen draft, human edit); TTS to MP3/WAV; store transcript.
5. Runtime: frame clock → feature lookup → Jev call at section boundaries (or precomputed decisions for offline safety) → Tone.js/Lyria parameters.
6. Render: dither canvas + audio graph + liner-notes panel + captions; export a "mapping card" per track.

**48-hour MVP:** 6 tracks; 2 modes (Literal + Audio only); 1 Dream mode on 2 tracks; 1 map/legend; keyboard + screen-reader controls; pre-generated TTS; precomputed Jev decisions with a live-call toggle; a 30-second demo path.

**Stretch:** live Lyria RealTime on all tracks; GIBS "today" tile; user-authored mapping sliders; multi-language liner notes; classroom worksheet; haptic pulse via Gamepad vibration.

**Dither fit:** the dither canvas is the main visual; cell luminance drives note density; one accent color; a "mapping card" shows the Bayer matrix and what each channel means. Audio-only mode removes the canvas but keeps the same mapping and transcript.

**Risks:** EIC video music licensing (use frame sets); SVS file sizes (pre-downscale); Jev waitlist (fallback to Gemini Decision 1 or a rule-based DJ); Lyria RealTime experimental access/pricing; accessibility testing without BVI users (invite one early); AI narration must be labeled.

**Scores:** Impact 9 · Feasibility 9 · Novelty 8 · Judge appeal 9 · AI fit 10 · **Overall 9.0**

### Concept B — "Listen to the Planet" (audio-first accessibility)

**Pitch line:** An audio-only EIC experience designed with blind users first: spatial sonification, rich descriptions, and a keyboard/screen-reader interface that never depends on the visual.

**Target user:** Blind and low-vision adults and students; accessibility advocates; educators.

**Core experience and wow moment:** The user hears a 90-second "sound walk" through one visualization: a low drone for the global baseline, a moving stereo image for the scan, and instrument layers for variables. A synthesized voice describes what changed and where, and the user can press keys to "solo" a region or repeat a section. The wow moment: a blind judge navigates the whole track without a mouse and correctly answers a question about the data from sound alone.

**AI roles:** Hydrogen writes scene descriptions and a "what to listen for" script; TTS voices them; Jev chooses description depth and next region from user intent (`Choice`: "explain", "explore", "compare", "quiz"; `Score`: detail level); Lyria 3.5 provides an optional musical bed, never the data layer.

**Data pipeline:** same frame/feature pipeline as A, but the primary output is an audio description timeline and a spatial sonification map; the visual is optional. Add a transcript, an audio glossary and a quiz mode.

**48-hour MVP:** 3 tracks; keyboard-only navigation; screen-reader labels; 3 description levels; 1 quiz; no visual dependency.

**Stretch:** haptics; community testing; translated descriptions; personalized "sound tour" builder.

**Dither fit:** optional visual companion only; high-contrast dither stills and a text mapping legend for sighted allies. The dither is not allowed to become a requirement.

**Risks:** TTS voice quality; description accuracy; testing time; the risk of "accessibility theater" if no BVI user is involved.

**Scores:** Impact 10 · Feasibility 8 · Novelty 8 · Judge appeal 10 · AI fit 9 · **Overall 9.0**

### Concept C — "The Conductor"

**Pitch line:** You conduct the planet: Jev reads the frame features and conducts a live Lyria RealTime ensemble, while you steer mood, energy and literalness.

**Target user:** Music/tech audiences, live-event demos, streamers; secondary classrooms.

**Core experience and wow moment:** A live "conductor" view with four weighted prompts (ocean, ice, fire, city), a BPM/density/brightness panel, and a dither visualizer. Jev chooses prompt weights and config every 8 bars from a text feature vector (Hydrogen/Decision 1 can supply an image-aware variant); the user can override. The wow moment: the judge drags "literalness" down and the music morphs from data-driven bells to an ambient bed without stopping.

**AI roles:** Jev = arranger/conductor (Choice over prompt blends, Score intensity, Noul change); Hydrogen = reads frame/legend and writes the initial prompt vocabulary; Lyria RealTime = audio; TTS = optional MC voice.

**Data pipeline:** frame features → Jev → weighted prompts/config → WebSocket audio; log every decision and show it in a "conductor score" panel for reproducibility. The literal layer can be a quiet Tone.js click/trigger under the Lyria bed.

**48-hour MVP:** 1 track, 4 prompts, 3 Jev decisions per minute, a visible decision log, a 60-second demo.

**Stretch:** multi-track playlist, MIDI controller, audience voting, recorded "performance" export.

**Dither fit:** a live dither "score" that visualizes prompt weights and feature values; cell size animates with density; no CRT kitsch.

**Risks:** Lyria RealTime is experimental and pricing is not public; WebSocket/audio buffering; the piece may sound like generic AI music rather than data sonification; harder to make accessible.

**Scores:** Impact 7 · Feasibility 7 · Novelty 10 · Judge appeal 9 · AI fit 10 · **Overall 8.6**

### Concept D — "Mapping Lab"

**Pitch line:** A sonification workbench where you build the mapping, hear it, and see why it is faithful (or not).

**Target user:** Students, educators, data journalists, sonification beginners.

**Core experience and wow moment:** Pick an EIC frame, drag sliders (color→pitch, brightness→volume, motion→tempo, region→pan), and hear the result instantly. Hydrogen explains the dataset and the trade-offs; Jev checks whether the mapping preserves the data ordering (`Noul`: "Does a brighter region always produce a higher pitch?") and suggests a scale. The wow moment: two mappings of the same frame sound completely different, and the app shows which one preserves the data better.

**AI roles:** Hydrogen = dataset explainer and mapping critic; Jev = mapping validation and next-experiment choice; Tone.js = audio; no music model needed.

**Data pipeline:** frame → feature extraction → mapping JSON → Tone.js; save/share mapping recipes; a small gallery of "known-good" mappings.

**48-hour MVP:** 2 tracks, 4 sliders, 3 validation questions, 1 shareable recipe, a 60-second demo.

**Stretch:** classroom mode, assignment export, community gallery, blind-user-tested presets.

**Dither fit:** the mapping legend is itself a dither grid: each cell shows the feature value and the resulting note; users see the quantization.

**Risks:** feels like a tool, not a story; needs a strong narrator; less emotional than A/B.

**Scores:** Impact 8 · Feasibility 9 · Novelty 7 · Judge appeal 8 · AI fit 8 · **Overall 8.0**

### Concept E — "Climate Mixtape"

**Pitch line:** A curated six-track album of original EIC sonifications, with sleeve art, liner notes and a static listening site.

**Target user:** General public, radio/podcast listeners, classrooms.

**Core experience and wow moment:** A beautifully designed "album" where each track is a 2–3-minute sonification of one EIC visualization, with a dither sleeve, a 150-word process note and a data credit. The wow moment: the judge listens to the whole "A-side" and can explain the mapping after each track.

**AI roles:** Hydrogen writes draft liner notes/captions; TTS optional narration; Lyria 3.5 optional bed; Jev not needed (or used to order the track list for an "energy arc"). This is the lowest-AI concept.

**Data pipeline:** offline production: frames → features → Tone.js or DAW → mixdown → mastered audio; static site with audio player and transcripts.

**48-hour MVP:** 6 tracks, 6 sleeves, 6 process notes, a static site.

**Stretch:** vinyl-style download, remix stems, a live "album release" event.

**Dither fit:** album art and web player use the same dither language; each track's pattern is derived from its data.

**Risks:** production quality is everything; less interactive; judges may see it as "just a playlist" unless the process documentation is excellent. The challenge explicitly allows a playlist, so this is legitimate.

**Scores:** Impact 8 · Feasibility 9 · Novelty 6 · Judge appeal 8 · AI fit 6 · **Overall 7.4**

## 1.10 Recommendation

**Build Concept A, with Concept B as a first-class mode.** Reasons:

1. It satisfies the literal brief: EIC frames + real-time sonification + a jukebox interface.
2. It has the strongest accessibility story without making accessibility a separate app.
3. It uses the 2026 AI stack in a way that is defensible: Hydrogen perceives and writes, Jev decides, TTS speaks, Lyria colors, Tone.js explains.
4. It is feasible: six pre-rendered tracks, one dither canvas, one audio graph, one Jev integration, pre-generated TTS.
5. It has a clear 30-second demo: pick Night Lights, press play, hear the data, see the dither bloom, read the mapping card.

**Do not build C as the main product.** It is the best "wow" but the weakest science and the riskiest dependency (experimental Lyria RealTime). Keep it as a stretch/encore.

**If the team is music-first rather than front-end-first:** build E, but pair it with a rigorous process site and one live "mapping card" demo so judges see the method, not just the songs.

**If the team is beginner/youth:** build E or a simplified A with three tracks, one accessibility mode, pre-generated TTS and no live Jev call (use a hand-authored decision table). The challenge is marked Beginner/Youth; a polished, accessible three-track experience is better than a broken six-track one.

---

# 2. Abandoned but Not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars

## 2.1 Challenge in one paragraph

Since the 1960s NASA has left hardware across the solar system: Apollo descent stages and rovers on the Moon, Viking/Pathfinder/MER/MSL/InSight landers and rovers on Mars, and probes still traveling outward or parked on asteroids and dwarf planets. The challenge asks teams to tell the story of some or all of this equipment in a way that introduces **school-age space enthusiasts** to the hardware and the science it made possible. It explicitly values narrative over a list of facts, accuracy, a defined age group, accessibility, and a clear link between engineering and scientific discovery. The summary says "Moon, Mars, and deep space," even though the title says Moon and Mars: include at least one deep-space object to show you read the whole brief. VERIFIED: challenge text in `research/challenges/nasas-discarded-equipment-storytelling.md`.

## 2.2 What the judges are really looking for (hidden hooks)

- **Accuracy is explicitly called out.** The challenge says "Accuracy is important throughout!" Judges may check dates, coordinates, mission outcomes and quotes. One fake "last words" quote can sink the project. Use a source drawer and a "what we know / what we infer" distinction.
- **Narrative, not a catalogue.** The text says "showing your audience how these missions operated rather than listing facts about them." A clickable map with 71 pins and a paragraph each is a catalogue; a first-person memory with a concrete engineering problem is a story.
- **Define the age group.** "School-age" is broad. Pick 9–12 or 11–14 and design reading level, length and interaction for it. Say so in the submission.
- **Accessibility of the format.** Captions/transcripts for audio, alt text for images, keyboard navigation, screen-reader labels, color-independent dither. The challenge explicitly asks "How accessible is the format you chose to use?"
- **Perspective(s).** First-person artifact voices are compelling, but they are **imagined**. Label them as "imagined from mission records" and keep the factual narration separate. Do not present an AI-generated monologue as a historical quote.
- **Breadth vs depth.** The resource list includes Apollo, Surveyor, Sojourner, Spirit/Opportunity, Viking, Phoenix/InSight, Dawn, NEAR, Pioneer, Ingenuity and Kepler. A narrow, deep story about six objects can beat a shallow story about all of them. But including one deep-space object shows completeness.
- **Engineering → science.** For each object, answer: what was it built to do, what did it measure, what did we learn, and what is its state now? That is the spine.
- **Presentation constraints.** The project demonstration must be a video of no more than 30 seconds or a presentation of no more than seven slides (including title and closing). A longer documentary can be supplementary but cannot replace it. VERIFIED: https://github.com/nasa/spaceapps/discussions/1947
- **AI disclosure and NASA branding.** Same rules as the Jukebox: disclose AI use, watermark AI-generated images/videos, acknowledge AI audio in text/metadata, and do not use NASA branding in AI-generated content. Unaltered NASA photographs that naturally contain flags or hardware are generally acceptable. VERIFIED: https://github.com/nasa/spaceapps/discussions/1849 and #1947.
- **At least one NASA data source from the challenge Resources.** Use NSSDCA (the anchor resource) and at least one more (LROC, NASA catalogue, HiRISE, NASA mission page).

## 2.3 Data and resources table

| Name | URL | Format | Access/auth | Size | License | Verified? | Notes |
|---|---|---|---|---|---|---|---|
| NSSDCA (Master Catalog) | https://nssdc.gsfc.nasa.gov/ | HTML records; query forms | Public, no auth | KB per record | NASA; generally not copyrighted; credit | VERIFIED | The anchor resource. Records include mission profile, coordinates, experiments, references and alternate names. No public JSON API found; scrape HTML or use the query forms. |
| Apollo 11 Lunar Module / EASEP | https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C | HTML | Public | ~20 KB | NASA public domain | VERIFIED | Descent stage left at 0.67416 N, 23.47314 E; ascent stage fate unknown, assumed crashed. Rich engineering detail. |
| Apollo 15 Lunar Roving Vehicle | https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063C | HTML | Public | ~20 KB | NASA public domain | VERIFIED | The LRV page; three LRVs were left (Apollo 15, 16, 17). |
| Apollo 12 ALSEP | https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-099C | HTML | Public | ~20 KB | NASA public domain | VERIFIED | ALSEP central station and experiments; Apollo 12's site also includes Surveyor 3. |
| Surveyor 3 | https://science.nasa.gov/mission/surveyor-3/ | Web page | Public | N/A | NASA public domain | VERIFIED | Landed 20 Apr 1967; Apollo 12 landed nearby in Nov 1969 and returned parts. |
| Sojourner / Mars Pathfinder | https://science.nasa.gov/mission/mars-pathfinder/ | Web page | Public | N/A | NASA public domain | VERIFIED | Lander (Carl Sagan Memorial Station) and 11.5 kg rover; Ares Vallis; last contact 27 Sep 1997 (secondary). |
| Spirit & Opportunity | https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/ | Web page | Public | N/A | NASA public domain | VERIFIED | Spirit: Gusev, 2004–2010; Opportunity: Meridiani, 2004–2018. Both inactive. |
| Viking 1 & 2 | https://science.nasa.gov/mission/viking-1/ | Web page | Public | N/A | NASA public domain | VERIFIED | First successful US Mars landers (1976); Viking 1 at Chryse Planitia, Viking 2 at Utopia Planitia. |
| Phoenix & InSight | https://science.nasa.gov/mission/insight/ | Web pages | Public | N/A | NASA public domain | VERIFIED | Phoenix (2008) dug for ice; InSight (2018–2022) listened for marsquakes. Both lost power. |
| Dawn | https://science.nasa.gov/mission/dawn/ | Web page | Public | N/A | NASA public domain | VERIFIED | Orbited Vesta and Ceres; mission ended 2018. The challenge says it ran out of fuel and remains in an uncontrolled orbit at Ceres; NASA's page confirms the mission ended, not the exact disposal orbit. |
| NEAR Shoemaker | https://science.nasa.gov/mission/near-shoemaker/ | Web page | Public | N/A | NASA public domain | VERIFIED | First spacecraft to orbit and land on an asteroid; landed on Eros 12 Feb 2001; last contact 28 Feb 2001. |
| Pioneer 10 & 11 | https://science.nasa.gov/mission/pioneer-10/ | Web pages | Public | N/A | NASA public domain | VERIFIED | Launched 1972/1973; now deep-space relics. Distances from JPL Horizons below. |
| Ingenuity | https://science.nasa.gov/mission/mars-2020-perseverance/ingenuity-mars-helicopter/ | Web page | Public | N/A | NASA public domain | VERIFIED | 72 flights; final flight 18 Jan 2024; rotor damage; at Valinor Hills, Jezero Crater. |
| Kepler | https://science.nasa.gov/mission/kepler/ | Web page | Public | N/A | NASA public domain | VERIFIED | Retired Oct 2018 after running out of fuel; safe Earth-trailing heliocentric orbit (challenge text; NASA page says "safe orbit, away from Earth"). |
| NASA Catalogue of Manmade Material on the Moon (2012) | https://www.nasa.gov/wp-content/uploads/2024/02/final-catalogue-of-manmade-material-on-the-moon.pdf | PDF | Public | 5.4 MB | NASA History Program Office; public domain | VERIFIED (HTTP 200) | Catalogues hardware down to earplugs, towels, golf balls, the Fallen Astronaut and the Apollo 11 goodwill disc, with coordinates where known. Page count not independently checked; a secondary source describes it as 22 pages. |
| NASA Recommendations to Space-Faring Entities (2011, Rev A) | https://www.nasa.gov/wp-content/uploads/2023/12/nasa-usg-lunar-historic-sites-reva.pdf | PDF | Public | 5.18 MB | NASA; public domain | VERIFIED (HTTP 200) | The heritage guidelines referenced by the One Small Step Act; keep-out zones, descent/landing/mobility/contamination recommendations. |
| LROC Anthropogenic Features on the Moon (PDS shapefile) | https://wms.lroc.asu.edu/lroc/view_rdr/SHAPEFILE_ANTHROPOGENIC_OBJECTS | Point shapefile (DBF/SHP/SHX/PRJ/XML) + README | Public, no auth | 1.5 MB ZIP; 71 records | NASA PDS / LROC; public domain; cite Wagner et al. 2017 | VERIFIED (downloaded and parsed) | The best single Moon inventory: soft landers, rovers, payloads, impact craters; updated 2026-08-14. Fields include OBJECT_ID, SHORT_NAME, VEHCL_NAME, MISSION, OBJECT, LATITUDE, LONGITUDE, RADIUS, COORD_SRC, UNCERTAIN, DATE, REFERENCES. |
| LROC Featured Sites | https://www.lroc.asu.edu/featured_sites/ | Interactive pages; Flip Book, Temporal Traverse, Zoomable Traverse | Public | N/A | **Website images copyrighted by LROC/ASU**; educational use with credit; commercial permission required | VERIFIED | Apollo 11/12/14/15/16/17, S-IVB impacts, Surveyor, Ranger, Luna, Lunokhod, 21st-century landers. Great for narrative; for reuse, prefer PDS products. |
| LROC Terms & Citation | https://www.lroc.asu.edu/about/terms | Web page | Public | N/A | See page | VERIFIED | PDS products are public domain; website images are copyrighted; news/educational use permitted with "NASA/GSFC/ASU" credit; commercial use requires permission. |
| LROC PDS archive | https://pds.lroc.im-ldi.com/ | PDS products | Public | Varies | NASA PDS; public domain | VERIFIED | Use this for public-domain versions of LROC images. |
| HiRISE | https://www.uahirise.org/ | JPEG/TIFF; orbit images | Public | Varies | **Public domain**; credit "Image: NASA/JPL/University of Arizona" | VERIFIED | Best views of Mars landers/rovers from orbit; e.g. Opportunity landing site ESP_050177_1780, InSight, Curiosity, Phoenix. |
| NASA Image and Video Library | https://images.nasa.gov/ | Images/audio/video; JSON API | Public | Varies | NASA media guidelines | VERIFIED | Good for stills and historical audio; check third-party markings. |
| NASA Historical Sounds | https://www.nasa.gov/historical-sounds/ | MP3/M4R | Public | Varies | NASA media guidelines | VERIFIED | Apollo 11 "Eagle has landed", "one small step", Apollo 13 "Houston, we've had a problem". Good for a cold open. |
| Apollo audio archive | https://archive.org/details/Apollo11Audio | FLAC/MP3/OGG; transcripts | Public | Very large | NASA audio; public domain (check collection notes) | VERIFIED | 19,000+ hours of Apollo 11 audio digitised by JSC/UT Dallas. Heavy; use short clips. |
| Apollo Lunar Surface Journal | https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/images11.html | HTML; images; transcripts | Public | Varies | NASA; public domain | VERIFIED | Apollo 11 image library, transcripts, LROC image table by sun angle. Excellent for "show how it operated". |
| JPL Horizons API | https://ssd.jpl.nasa.gov/api/horizons.api | Text/JSON ephemerides | Public, no auth | Small | NASA/JPL; public domain | VERIFIED | Spacecraft IDs: Pioneer 10 = -23, Pioneer 11 = -24, Voyager 1 = -31, Voyager 2 = -32. Distances below. |
| For All Moonkind Moon Registry | https://moonregistry.forallmoonkind.org/ | Web registry | Public | N/A | Reference/citation; site content not clearly licensed for bulk reuse | VERIFIED (HTTP 200) | 100+ lunar sites; mission overviews and object lists; good for cross-checking, not for scraping. |
| Artemis Accords, Section 9 | https://www.nasa.gov/wp-content/uploads/2022/11/Artemis-Accords-signed-13Oct2020.pdf | PDF | Public | 0.98 MB | US Government; public domain | VERIFIED (HTTP 200) | "Preserving Outer Space Heritage": historically significant human or robotic landing sites, artifacts, spacecraft and other evidence. |
| One Small Step to Protect Human Heritage in Space Act | https://www.govinfo.gov/app/details/PLAW-116publ275 | Public Law 116-275 | Public | N/A | US law | VERIFIED (HTTP 200) | Enacted 31 Dec 2020; requires NASA lunar agreements to abide by the 2011 recommendations; limited to US lunar sites. |
| Wikipedia: List of artificial objects on Mars | https://en.wikipedia.org/wiki/List_of_artificial_objects_on_Mars | Table + coordinates | Public | N/A | CC BY-SA 4.0 | VERIFIED | Useful secondary index; coordinates sometimes differ from NASA pages; cite and verify. |
| azmth Mars sites dataset | https://azmth.space/mars/data | CSV/JSON | Public | Small | CC BY 4.0 (per site) | THIRD-PARTY | 30 coordinate entries and rover traverse JSON; convenient accelerator; verify each row against NASA before shipping. |
| NASA Mars mission pages | https://science.nasa.gov/mars/ | Web pages | Public | N/A | NASA public domain | VERIFIED | Use for status, landing site, science results and images. |

## 2.4 Moon inventory in detail

### The LROC shapefile is the backbone

I downloaded `ANTHROPOGENIC_OBJECTS_180.ZIP`, unzipped it and parsed the DBF. It contains **71 point records**, one per located feature. This is not every small item (the NASA catalogue lists hundreds of gloves, cameras, bags and bags of waste), but it is the authoritative **located** inventory for the big hardware. VERIFIED.

Representative records (latitude, longitude in degrees; from the shapefile):

| OBJECT_ID | Mission | Object | Lat | Lon |
|---|---|---|---|---|
| A11_LM | Apollo 11 | Descent stage of Lunar Module "Eagle" | 0.67416 | 23.47314 |
| A11_LRRR | Apollo 11 | Retroreflector | 0.67345 | 23.47307 |
| A12_LM | Apollo 12 | Descent stage of Lunar Module "Intrepid" | -3.01280 | -23.42190 |
| A12_ALSEP | Apollo 12 | ALSEP central station | -3.00980 | -23.42480 |
| A14_LM | Apollo 14 | Descent stage of Lunar Module "Antares" | -3.64589 | -17.47194 |
| A15_LM | Apollo 15 | Descent stage of Lunar Module "Falcon" | 26.13239 | 3.63330 |
| A15_LRV | Apollo 15 | Lunar Roving Vehicle | 26.13174 | 3.63803 |
| A16_LM | Apollo 16 | Descent stage of Lunar Module "Orion" | -8.97340 | 15.50110 |
| A16_LRV | Apollo 16 | Lunar Roving Vehicle | -8.97290 | 15.50370 |
| A17_LM | Apollo 17 | Descent stage of Lunar Module "Challenger" | 20.19110 | 30.77230 |
| A17_LRV | Apollo 17 | Lunar Roving Vehicle | 20.18960 | 30.77690 |
| Surveyor3 | Surveyor 3 | Lander | -3.01620 | -23.41800 |
| A12_LMAS | Apollo 12 | Lunar Module ascent stage impact site | -3.91950 | -21.17210 |
| A13_SIVB | Apollo 13 | Saturn V S-IVB impact site | -2.55500 | -27.88750 |
| ChangE6 | Chang'e 6 | Lander | -41.63830 | -153.98570 |
| BlueGhost1 | Blue Ghost Mission 1 | Retroreflector | 18.56220 | 61.81020 |
| IM2 | IM-2 | Lander | -84.79060 | 29.19567 |
| SLIM | SLIM | Lander | -13.31600 | 25.25100 |

The file also includes Ranger 6/7/8/9 impact sites, Apollo 14/15/16/17 S-IVB impacts, GRAIL A/B, LADEE, LCROSS, Lunokhod 1/2, Luna 16/17/20/21/23/24/25, Chang'e 3/4/5/6, Yutu, Beresheet, Longjiang-2, Vikram 1/2, HAKUTO-R 1/2 and a Falcon 9 booster impact site. The **DATE** field and **REFERENCES** URLs make it reusable for a timeline. VERIFIED.

### The NASA catalogue is the human-scale layer

The 2012 NASA History catalogue is the best source for the small, human, weird stuff: the gold olive branch, the Apollo 1 patch, the medals for Gagarin and Komarov, the goodwill disc, the flags, the golf balls and "javelin" from Apollo 14, the Fallen Astronaut statuette and plaque from Apollo 15, Charlie Duke's family photo from Apollo 16. It also lists the waste (defecation collection devices, urine assemblies, emesis bags), which is exactly the kind of detail that makes a kids' story memorable and honest. VERIFIED: PDF (5.4 MB).

A caution: the catalogue is from 2012 and does not include post-2012 landings. Pair it with the 2026 LROC shapefile and modern mission pages. VERIFIED.

### NSSDCA is the narrative source, not an API

NSSDCA records are server-rendered HTML. The Apollo 11 LM record (1969-059C) includes the landing narrative, LM engineering, EASEP details, coordinates, alternate names, funding agency, disciplines, personnel and selected references. That is ready-made story material. There is **no public JSON API** that I found; the query forms are HTML. Budget a small scraper or hand-curate 12–20 records. VERIFIED: https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C and https://nssdc.gsfc.nasa.gov/about/about_nmc.html.

### LROC imagery of the Apollo sites

- LROC NAC resolution is ~0.5 m/px from the standard 50 km orbit; the 2011 low-altitude passes got to ~0.25 m/px over Apollo sites. The descent stages, LRVs, ALSEPs, trails and some experiment hardware are visible. VERIFIED: https://www.lroc.asu.edu/featured_sites/ and LROC image pages.
- Useful image IDs:
  - Apollo 11: `M131494509L` (simulated "what Armstrong saw" uses this NAC; the LM and tracks are visible).
  - Apollo 15: `M175252641R` (27 cm/px; LM, LRV, tracks; LRV final parking spot just east of the frame).
  - Apollo 16: `M109134835L` (descent stage, equipment, disturbed soil).
  - Apollo 17: `M168000580LR` (low-periapse view; descent stage, MESA, PLSS, ALSEP, SEP antenna, LRV tracks).
- Credit: "NASA/GSFC/Arizona State University" (short: NASA/GSFC/ASU). For public-domain reuse, pull the PDS version rather than the website image. VERIFIED: https://www.lroc.asu.edu/about/terms.

### What the Moon inventory is good for

- A **"ghost rover" map**: LROC shapefile pins + a Moon basemap (OpenPlanetaryMap or NASA SVS) + dither stills.
- A **timeline**: DATE field + mission dates.
- A **"find it" interaction**: show an LROC image and ask the user to find the descent stage; Jev `Box` (experimental) or a pre-annotated box can score the click.
- A **"what's still active"** contrast: retroreflectors (Apollo 11/14/15, Lunokhod 1/2) are still used for laser ranging; the rest is silent. VERIFIED: shapefile + Wikipedia summary; retroreflector activity is well established.

## 2.5 Mars inventory and the data gap

There is **no single NASA shapefile** of all Mars surface hardware comparable to the LROC Moon file. The practical inventory is assembled from:

1. **NSSDCA** spacecraft records (mission profile, coordinates, status).
2. **NASA mission pages** (science results, landing site, final status).
3. **HiRISE images** (the actual hardware on the surface, including jettisoned descent hardware).
4. **The 2012 NASA catalogue** (Moon only) and the **Wikipedia Mars list** (secondary; CC BY-SA 4.0).
5. **Third-party Mars site datasets** (azmth CC BY 4.0; useful but verify).

Representative Mars objects (coordinates are approximate; source varies — this is exactly the kind of discrepancy the app should expose):

| Object | Mission / year | Location | Status | Source |
|---|---|---|---|---|
| Viking 1 lander | Viking 1, 1976 | Chryse Planitia, 22.483 N, 47.94 W (NASA page; Wikipedia gives 22.697 N, 48.222 W) | Last contact 1982 (secondary) | NASA mission page; Wikipedia |
| Viking 2 lander | Viking 2, 1976 | Utopia Planitia, 48.269 N, 225.990 W | Last contact 1980 (secondary) | Wikipedia; NASA page |
| Pathfinder lander | Mars Pathfinder, 1997 | Ares Vallis, 19.33 N, 33.55 W | Last contact 27 Sep 1997 | NASA page; Wikipedia |
| Sojourner rover | Mars Pathfinder, 1997 | Ares Vallis, same site | Inactive; 11.5 kg | NASA page; Wikipedia |
| Spirit rover | MER-A, 2004 | Gusev crater, 14.5718 S, 175.4785 E | Last contact 2010 | NASA page; Wikipedia |
| Opportunity rover | MER-B, 2004 | Meridiani Planum, 1.9462 S, 354.4734 E | Last contact 2018 | NASA page; Wikipedia |
| Phoenix lander | Phoenix, 2008 | Vastitas Borealis, 68.22 N, 125.7 W | Last contact 2008; solar panels collapsed under ice | NASA/JPL; Wikipedia |
| Curiosity rover | MSL, 2012 | Gale crater, 4.5895 S, 137.4417 E | Active | NASA page; Wikipedia |
| InSight lander | InSight, 2018 | Elysium Planitia, 4.5024 N, 135.6234 E | Mission ended Dec 2022 (dust on solar panels) | NASA page; Wikipedia |
| Perseverance rover | Mars 2020, 2021 | Jezero crater, 18.4457 N, 77.4508 E | Active | NASA page; Wikipedia |
| Ingenuity helicopter | Mars 2020, 2021 | Jezero crater, Wright Brothers Field / Valinor Hills | Grounded 18 Jan 2024, rotor damage | NASA page |
| Schiaparelli EDM | ExoMars 2016 | Meridiani Planum, 2.05 S, 6.21 W | Crashed | Wikipedia; ESA |
| Beagle 2 | Mars Express, 2003 | Isidis Planitia, 11.5265 N, 90.4295 E | Landed; solar panels failed to deploy | Wikipedia; ESA |
| Zhurong | Tianwen-1, 2021 | Utopia Planitia, 25.1 N, 109.9 E | Inactive after sandstorm | Wikipedia; CNSA |

**The hidden story is the discarded descent hardware.** Every Mars landing leaves a trail: heat shield, backshell, parachute, sky crane or descent stage, balance masses, and sometimes the lander's own cruise stage. HiRISE has photographed many of them:
- Opportunity: `ESP_050177_1780`, "What Opportunity Left Behind" — lander, parachute, backshell, heat shield in Eagle Crater. VERIFIED: https://hirise.lpl.arizona.edu/ESP_050177_1780
- Curiosity: `PIA15997` (heat shield), `PIA15999` (sky crane impact), `PIA16000` (rover), `PIA16001` (landing scene). VERIFIED: JPL Photojournal.
- Phoenix: before/after images show the lander and backshell; the 2010 image shows solar-panel collapse. VERIFIED: NASA/JPL.
- InSight: HiRISE imaged the lander, heat shield and parachute in Dec 2018. VERIFIED: https://science.nasa.gov/resource/insight-on-mars-as-seen-by-hirise-2/
- Viking 2: the ejected metal shroud covering the surface sampler is visible in 1977 lander images. VERIFIED: Wikipedia summary; NASA images.

**Accuracy traps to avoid:**
- **Opportunity's "My battery is low and it's getting dark"** is a poetic paraphrase by Jacob Margolis, not a direct quote from the rover. Do not present it as a quote. VERIFIED as a paraphrase (widely reported); if used, label it.
- **Bradbury Landing has no hardware at the touchdown point** because Curiosity was lowered by sky crane; the hardware is elsewhere. VERIFIED: Wikipedia.
- **Viking coordinates differ** between NASA and Wikipedia by ~0.2°; show the source or use one consistent source.
- **"Discarded" is not the same as "dead."** Perseverance, Curiosity and the Voyagers are still active; the story should distinguish "abandoned," "inactive," "still working" and "still traveling."

## 2.6 Deep space inventory (the part most teams will miss)

The challenge summary says "on the Moon, on Mars, and in deep space," and the resource list includes Dawn, NEAR Shoemaker, Pioneer 10/11 and Kepler. Include a "deep space wing" to show completeness.

| Object | Where it is now | Status | Distance from Earth (14 Nov 2026) | Source |
|---|---|---|---|---|
| Pioneer 10 | Interstellar space, heading toward Aldebaran | Last contact 2003 (THIRD-PARTY; not re-checked) | **141.36 AU** | JPL Horizons, spacecraft ID -23; VERIFIED distance |
| Pioneer 11 | Interstellar space | Last contact 1995 (THIRD-PARTY; not re-checked) | **118.80 AU** | JPL Horizons, ID -24; VERIFIED distance |
| Voyager 1 | Interstellar space | Still operating (NASA Voyager mission; status not re-checked in this pass) | **173.07 AU** | JPL Horizons, ID -31; VERIFIED distance |
| Voyager 2 | Interstellar space | Still operating (NASA Voyager mission; status not re-checked in this pass) | **144.86 AU** | JPL Horizons, ID -32; VERIFIED distance |
| Kepler | Earth-trailing heliocentric orbit | Retired Oct 2018, out of fuel | Not in the same solar-system race; use mission page | NASA mission page; VERIFIED |
| Dawn | Orbit around Ceres (per challenge; NASA page confirms mission ended) | Out of fuel, uncontrolled | At Ceres | NASA mission page + challenge; exact disposal orbit UNVERIFIED |
| NEAR Shoemaker | Surface of 433 Eros | Last contact 28 Feb 2001 | At Eros | NASA mission page; VERIFIED |

The distances are a **live data hook**: a "where was it on your birthday?" slider using Horizons, or a "one-way light time" counter. That is a strong, cheap wow moment for the deep-space wing. VERIFIED: example query `https://ssd.jpl.nasa.gov/api/horizons.api?format=text&COMMAND='-23'...` returned 141.359956 AU for Pioneer 10 on 2026-11-14.

## 2.7 Heritage-preservation context (why this story matters)

This is the difference between "a cool map of old stuff" and "a project with a point of view." The legal context is genuinely interesting and gives the story stakes.

- **Outer Space Treaty (1967).** Article II: outer space is not subject to national appropriation by claim of sovereignty. Article VIII: a State retains jurisdiction and control over objects it launched, and ownership does not change because the object is on a celestial body. Article IX: activities must be conducted with "due regard" to the corresponding interests of others and avoid harmful interference. Article XII: installations and equipment are open to inspection on a reciprocal basis. The treaty protects **objects**, not the **sites** or bootprints. VERIFIED: https://www.forallmoonkind.org/about/legal/ and the treaty text.
- **NASA's 2011 Recommendations to Space-Faring Entities.** Voluntary technical recommendations for approaching US lunar artifacts: Apollo landing and roving hardware; Surveyor sites; Ranger/S-IVB/LCROSS/LM ascent impact sites; experiments, tools and EVA hardware; footprints and rover tracks. They define descent/landing, mobility and contamination practices, including keep-out zones (the commonly cited figure is up to 2 km for some sites). They are **not law**. VERIFIED: https://www.nasa.gov/wp-content/uploads/2023/12/nasa-usg-lunar-historic-sites-reva.pdf
- **One Small Step to Protect Human Heritage in Space Act (PL 116-275).** Enacted 31 Dec 2020. It requires Federal agencies that license lunar activities to require applicants to agree to abide by NASA's recommendations (or updates). It is the first law by any nation to recognize human heritage in space, but it is limited: it applies to US-licensed activities and US lunar sites, and it does not create an international property regime. VERIFIED: https://www.govinfo.gov/app/details/PLAW-116publ275 and https://theconversation.com/apollo-landers-neil-armstrongs-bootprint-and-other-human-artifacts-on-moon-officially-protected-by-new-us-law-152661
- **Artemis Accords, Section 9 (2020).** Signatories "intend to preserve outer space heritage, which they consider to comprise historically significant human or robotic landing sites, artifacts, spacecraft, and other evidence of activity on celestial bodies in accordance with mutually developed standards and practices." This is broader than the Moon and is the best hook for including Mars. VERIFIED: https://www.nasa.gov/wp-content/uploads/2022/11/Artemis-Accords-signed-13Oct2020.pdf
- **For All Moonkind.** A volunteer nonprofit of space lawyers and policymakers working through UN COPUOS for an international framework; its **Moon Registry** catalogues 100+ lunar sites and objects and is explicitly a work in progress. It is the best public-interest partner/context for the project. VERIFIED: https://moonregistry.forallmoonkind.org/ and https://www.forallmoonkind.org/about/legal/
- **UNESCO World Heritage Convention does not apply.** It relies on States nominating heritage within their sovereign territory; Article II of the Outer Space Treaty prohibits territorial claims. Any space-heritage regime must be built differently (managed access, due regard, multilateral protocols). VERIFIED: For All Moonkind legal page and UN COPUOS presentations.
- **Mars has no equivalent.** There is no NASA "Mars artifacts" protection law, no keep-out zone, and no binding heritage regime. Artemis Accords Section 9 is the only broadly agreed statement, and it is a political commitment, not a property law. This is a strong narrative point: the Moon has a legal argument; Mars has only our memory.

**Story angle:** these objects are not just "trash." They are the first archaeological sites off Earth, they are still producing science (retroreflectors, witness plates, long-duration materials exposure), and they are vulnerable to plume damage, rover traffic and future mining. A kids' story can treat them as "the first museum on another world" without being preachy.

## 2.8 Open-source and prior art

### Maps and 3D

| Project / library | License | Use |
|---|---|---|
| **Globe.gl** | MIT | 3D globe with labels; has a Moon landing-sites example. Good for a "deep space wing" or a Moon globe. VERIFIED: https://github.com/vasturiano/globe.gl |
| **three.js** | MIT | Custom 3D; more work than Globe.gl. THIRD-PARTY. |
| **MapLibre GL JS** | BSD-3-Clause | 2D vector/raster maps; good for a Moon/Mars tile map. THIRD-PARTY. |
| **Leaflet** | BSD-2-Clause | Simpler 2D map; good for a 48h MVP. THIRD-PARTY. |
| **OpenPlanetaryMap basemaps** | Check each basemap's license | Moon/Mars basemaps; verify attribution before shipping. THIRD-PARTY. |
| **skylumi-labs/3d-moon** | AGPL-3.0-only | High-quality 3D Moon with Apollo 11/17 terrain; AGPL is a copyleft risk, and the data assets have separate terms. Reference only unless the team accepts AGPL. VERIFIED: https://github.com/skylumi-labs/3d-moon |
| **Tristan-Hotham/moon-mars** | Data CC BY-SA 4.0 | A map/analysis of 133 Moon objects and 27 Mars objects from Wikipedia; useful cross-check, share-alike data. VERIFIED: https://github.com/Tristan-Hotham/moon-mars |
| **NASA MMGIS** | NASA JPL open source (check license) | Multi-mission GIS; overkill for 48h. THIRD-PARTY. |
| **DanielaNik/lunar-landings-app** | No license shown | Uses LROC anthropogenic shapefile + OpenPlanetaryMap; reference only. VERIFIED: https://github.com/DanielaNik/lunar-landings-app |

### Past Space Apps winners and adjacent projects

- **LunarTech Ensemble** (2023 Best Use of Science) — Apollo seismic data visualizer and game; proves Moon-data storytelling can win globally. VERIFIED: https://science.nasa.gov/directorates/smd/2023-nasa-international-space-apps-challenge-announces-10-global-winners/
- **Spacebee** (2023 Best Use of Technology) — moonquake map integrating Apollo ALSEP data. VERIFIED: same page.
- **Selene** (2022 Galactic Impact) — 3D Moon globe with moonquake data and Apollo landing sites. VERIFIED: https://github.com/KongkaMozumderSUST/selena
- **Olik** (2018 Best Use of Data) — Apollo 11 VR landing simulator. THIRD-PARTY (Basis/collectSPACE summary).
- **TeamVoyagers** (2023 Best Storytelling) — interactive water-cycle game; **MIMBI** (2022 Best Storytelling) — QR-led cultural STEAM experience; **HerCode Space** (2025 Best Storytelling) — illustrated solar story. These show that "story first" wins; the science can be simple if the narrative is strong. VERIFIED: Space Apps winners pages.

### Dither libraries

Use the table in §1.8. For a static atlas, `canvas-dither` (MIT) or `@thi.ng/pixel-dither` (Apache-2.0) is enough. For a narrative dissolve, render two dithered states and crossfade the threshold; do not animate Floyd–Steinberg per frame (it shimmers).

## 2.9 How the 2026 AI stack fits the storytelling challenge

### Gemini 4 Hydrogen: narration, captioning, translation (text only)

**What it can do here (verified):**
- **Read the sources.** Put NSSDCA excerpts, the NASA catalogue entry, the LROC shapefile record and the HiRISE caption into a 1M-token context; ask for a structured "story bible" per artifact: what it is, why it was sent, what it measured, what we learned, what happened at the end, what remains, what is uncertain.
- **Write narration.** Generate a 60–120-second first-person "memory" and a separate third-person factual narration. Ask for a target reading level (grade 4–6) and a word count. Hydrogen is good at this; it is not a source of truth.
- **Caption images.** Give it an LROC/HiRISE image and ask for alt text, a visual description and a list of visible features. It can read labels and legends. It cannot output precise bounding boxes; use manual annotations or Jev `Box` (experimental) for "find it" interactions.
- **Translate.** Generate the narration in Spanish, French, etc.; TTS supports 130 languages. Nice stretch goal, not MVP.
- **Generate a quiz.** Ask for 3 multiple-choice questions per artifact with the source sentence for each correct answer. This is a strong classroom feature.
- **What it cannot do:** generate audio, music or images; run as a Live API model; guarantee facts. **VERIFIED**: https://aistudio.google.com/docs/models/gemini-4-hydrogen

**Grounding pattern:** every generated paragraph must carry `claims: [{text, source_url, source_quote}]`. If the model cannot point to a source sentence, the line is cut or labeled "imagined." This is the single most important accuracy control.

### Gemini 3.8 Flash TTS: the voices

- Use one narrator voice for the factual track and a different, clearly fictional voice for the artifact's "memory." Label the latter in the UI and in the audio metadata.
- `speech_metadata.speaker` and `style` let you keep voices consistent across turns; inline `<short pause>` and `<sigh>` add acting without changing the words. VERIFIED: https://aistudio.google.com/docs/models/gemini-3.8-flash-tts
- Pre-generate all audio. A school-age web app should not call the Gemini API live because of the 18+ terms and because offline audio is more reliable in a demo.
- Do not clone a real astronaut, NASA employee or child. Use stock voices.

### Jev: the narrative path chooser

**Why Jev:** a branching story is a sequence of small decisions: which beat next, how much detail, which tone, whether the user has understood the prerequisite, whether a claim is supported. That is exactly Jev's shape. It is fast (70–500 ms), cheap ($0.042/1M input) and returns probabilities, so the app can fall back gracefully instead of forcing a branch.

**Concrete flow:**

1. The story is a hand-authored graph of beats per artifact (e.g. `landing`, `the_engine`, `the_experiment`, `the_discovery`, `the_end`, `what_remains`). Each beat has a 60–90-second script, an image, a source list and a `prerequisite` field.
2. State:
   ```json
   {
     "artifact": "Surveyor 3",
     "mission": "Surveyor 3 / Apollo 12",
     "age": 11,
     "reading_level": "grade 5",
     "path": ["apollo12_lm", "surveyor3"],
     "seen_beats": ["landing", "the_engine"],
     "user_choice": "what did it find?",
     "facts": "NSSDCA excerpt ... NASA catalogue excerpt ..."
   }
   ```
3. Questions (one request):
   ```json
   {
     "model": "jev-latest",
     "state": {"...": "above"},
     "questions": {
       "next_beat": {
         "type": "choice",
         "instructions": "Which beat should come next for this child?",
         "criteria": {
           "the_experiment": "What Surveyor 3 measured and why it mattered",
           "apollo_12_visit": "How Apollo 12 landed nearby and returned parts",
           "what_it_taught_us": "The engineering and science lessons",
           "the_end": "What happened to the lander and what remains"
         }
       },
       "detail": {
         "type": "score",
         "instructions": "How much detail should this beat carry?",
         "criteria": ["one idea", "two ideas", "three ideas", "full story"]
       },
       "tone": {
         "type": "score",
         "instructions": "How awed vs. matter-of-fact should the narration be?",
         "criteria": ["matter-of-fact", "curious", "awed"]
       },
       "supported": {
         "type": "noul",
         "instructions": "Does the provided NSSDCA excerpt support the claim that Surveyor 3 landed in 1967?"
       }
     }
   }
   ```
4. The code branches on `next_beat.choice`; uses `detail.score` to choose a short/long script; uses `tone.score` to choose a TTS style; uses `supported.noul` with a threshold (e.g. > 0.7) to gate a factual claim. Low confidence → fall back to the hand-authored default path.
5. This keeps the story coherent while letting Jev personalize pace and emphasis. It also produces a **decision log** the team can show judges: "here is why the story went this way."

**Limits:** Jev cannot write the script, cannot see the image reliably (experimental), cannot hear the audio, and can be wrong. Use it for routing, not for facts. Pair it with the source drawer.

### Gemini Decision 1: the multimodal alternative

If Jev access is delayed, `gemini-decision-1` can do the same typed decisions over the actual image/video/text, with up to 1,000 questions and 262k tokens. It is more expensive per token ($0.10/1M) but can "see" the artifact and the child's selected region. Use it as a fallback or for image-dependent decisions. VERIFIED: https://aistudio.google.com/docs/models/gemini-decision-1

### Lyria 3.5: optional motif, not narration

A 15–20-second instrumental motif per artifact (e.g. a low pulse for a lander, a bright bell for a rover) can make the atlas feel like a museum. Lyria 3.5 supports image input, so you can feed it the artifact photo plus a text prompt. It is optional; the story must work without it. Acknowledge AI audio in the metadata. VERIFIED: https://aistudio.google.com/docs/music-generation

### Human-in-the-loop is non-negotiable

A 48-hour team cannot fact-check every generated line. The practical pattern:
- Human writes the **factual spine** (dates, mission, outcome) from NSSDCA/NASA pages.
- Hydrogen drafts the **prose** around the spine.
- A second human checks every number and quote against the source drawer.
- The UI separates **"From the records"** (sourced) from **"Imagined"** (first-person voice) with different colors/icons and a one-line explanation.

## 2.10 Dither UI for archival NASA photography

### Why dither is a natural fit

- **The source material is already high-contrast and grainy.** Apollo Hasselblad frames, LROC NAC images and HiRISE cutouts are often black sky + bright regolith/metal, with film grain or sensor noise. A 1-bit halftone does not fight the image; it reveals the structure.
- **It reads as documentation.** A Bayer/Atkinson print looks like a wirephoto, a mission report figure or a newspaper halftone. That is the right emotional register for "archival hardware," not a neon retro filter.
- **It unifies eras.** A 1969 Hasselblad photo, a 2011 LROC image and a 2026 HiRISE image can share one visual language. That makes the "then vs now" transition legible.
- **It makes small hardware visible.** The LM descent stage is a few pixels in a global Moon map; a dithered crop with a strong edge pattern reads better at thumbnail size than a muddy grayscale.
- **It can encode certainty.** Use different dither treatments for "imaged" vs "inferred" vs "not located." A solid Bayer pattern for confirmed hardware, a sparser/blue-noise pattern for approximate coordinates, a dashed outline for unknown. This is a visual "source drawer."
- **It is accessible.** High contrast, no color-only encoding, works with reduced motion and screen readers when paired with alt text.

### A concrete visual system

- **Stills:** Atkinson or Floyd–Steinberg, 1-bit, at 1–2 px cells, with a duotone accent (NASA red or signal amber) on black/white. Atkinson keeps highlights (the LM) from blowing out.
- **Motion/transitions:** Bayer 4×4 or 8×8, animated threshold. A "memory dissolve" from a modern orbital image to a 1969 photo can be a dither threshold sweep: the new image appears cell-by-cell, like a print resolving.
- **Maps:** dither the basemap at low contrast; keep pins/labels crisp vector. Do not dither text.
- **UI:** one accent color, generous spacing, mono labels for coordinates/dates, a thin grid. Avoid CRT scanlines, glow, chromatic aberration, "glitch" effects.
- **Alt text:** every image gets a factual alt text and a longer audio description; the dither is never the only carrier of meaning.

### What to avoid

- Dithering at sub-pixel cell sizes (it turns to gray).
- Dithering every UI element (it becomes noise).
- Using dither to make a low-resolution image look "retro" instead of using the best available resolution.
- Treating "1-bit" as an excuse for poor contrast or unreadable text.

## 2.11 Project concepts

### Concept A — "Still Here: A Field Guide to the Forgotten" (recommended)

**Pitch line:** A dither field guide to the machines we left behind: click a ghost rover, hear its story, and see exactly what we know and what we are imagining.

**Target user:** Space-curious kids ages 9–14 and their families/teachers; secondary: adult space-history fans.

**Core experience and wow moment:** A 2D Moon map (and a Mars tab, and a deep-space tab) with dither pins. Clicking a pin opens an artifact "plate": a dithered LROC/HiRISE/Apollo image, a one-sentence identity, a 60–90-second first-person "memory" (clearly labeled imagined), a 30-second factual "what the records say," and a source drawer with NSSDCA/LROC/HiRISE links. The wow moment: start at a global Moon, zoom into Tranquility Base, watch the dither resolve from a modern orbital image into the 1969 descent stage, and hear the lander say "I was the first..." while the factual track explains what the descent stage actually did.

**AI roles:**
- **Hydrogen:** drafts the "memory" and factual scripts from NSSDCA/catalogue excerpts; generates alt text and image descriptions; generates a 3-question quiz per artifact with source sentences. Human edits.
- **Jev:** chooses the next beat from the graph based on age, path and user question; scores detail/tone; checks whether a claim is supported by the provided excerpt; can choose the next artifact ("what should I visit next?").
- **TTS:** two voices per artifact (fictional artifact voice + factual narrator); pre-generated.
- **Lyria 3.5 (optional):** 15-second motif per artifact; no vocals; acknowledge AI audio.
- **Gemini Decision 1 (fallback):** if Jev is unavailable.

**Data pipeline:**
1. Build `artifacts.json` from the LROC shapefile (Moon) + NASA catalogue + NSSDCA + NASA mission pages + Wikipedia/azmth (Mars, verified). Normalize: id, name, body, type, lat, lon, date, status, mass, source URLs, image IDs, "known" facts, "inferred" flags.
2. Author 12 artifacts × 2–3 beats. Write the factual spine by hand; Hydrogen drafts; human fact-checks. Store scripts + source quotes.
3. Generate TTS per script; store MP3/WAV + transcript.
4. Build the map: MapLibre/Leaflet + OpenPlanetaryMap basemap (verify license) or a pre-rendered Moon image with lat/lon projection. Pins from `artifacts.json`.
5. Build the dither plate: pre-dither the stills with Atkinson/Floyd–Steinberg; animate the Bayer dissolve in canvas.
6. Runtime: click pin → Jev call (or precomputed path) → play beat → highlight source quotes → next.
7. Export: a teacher guide + a "sources" page + a 30-second demo video.

**48-hour MVP:** 12 artifacts (6 Moon, 4 Mars, 2 deep space); 1 map with tabs; 6 narrated beats (the rest text-only); 2 voices; 1 "find the descent stage" interaction; source drawer; transcript; keyboard/screen-reader support.

**Stretch:** all 71 Moon records; "where was it on your birthday?" deep-space slider; Spanish narration; classroom quiz mode; 3D globe; printed "field guide" PDF.

**Dither fit:** the entire visual language. Use Atkinson for stills, Bayer for the memory dissolve, a duotone accent, mono labels for coordinates. Different patterns for known/inferred/unlocated.

**Risks:** accuracy (the biggest); AI-generated first-person voices can mislead if not labeled; LROC website images are copyrighted (use PDS); HiRISE is public domain but credit; 12 artifacts is a lot for 48h (reduce to 8 if needed); map projection is fiddly; TTS generation time.

**Scores:** Impact 9 · Feasibility 8 · Novelty 8 · Judge appeal 10 · AI fit 9 · **Overall 8.8**

### Concept B — "The Last Transmission"

**Pitch line:** Six short audio dramas about the last days of machines on Mars and the Moon, built from real mission records and real archival audio.

**Target user:** Podcast/listening audiences ages 12+; classrooms; commuters.

**Core experience and wow moment:** A 6-episode, 4–6-minute audio series. Each episode: a cold open with real NASA audio (Apollo 11 landing, "Houston, we've had a problem"), a first-person lander/rover narrative, a factual "what really happened" segment, and a closing "what remains" beat. The wow moment: Opportunity's final telemetry is sonified as a fading pulse while the narrator explains that the "my battery is low" line is a human paraphrase, not a quote — the honesty is the twist.

**AI roles:** Hydrogen writes scripts from NSSDCA/mission pages; TTS voices the artifact and narrator (two voices); Jev orders episodes and chooses tone based on a listener quiz; Lyria 3.5 optional theme; no visuals required (but a dither cover per episode).

**Data pipeline:** source excerpts → factual spine → Hydrogen draft → human edit → TTS → edit/mix with NASA audio → publish as a static audio site with transcripts. The "last transmission" must be sourced or labeled as imagined.

**48-hour MVP:** 3 episodes (Viking 1, Opportunity, InSight), 3–5 minutes each, transcripts, dither covers, one quiz.

**Stretch:** 6 episodes, Apollo 11/Surveyor 3, deep-space episode, Spotify/RSS feed.

**Dither fit:** episode covers and a simple waveform/dither player; the visual is secondary.

**Risks:** audio production time; the "last words" trap; fewer interactive "wow" moments for judges; hard to demo in 30 seconds.

**Scores:** Impact 9 · Feasibility 7 · Novelty 8 · Judge appeal 9 · AI fit 8 · **Overall 8.2**

### Concept C — "One Small Step: Twelve Objects"

**Pitch line:** A dither graphic novel for kids: twelve objects, twelve short stories, one giant leap.

**Target user:** Ages 8–12; parents/teachers reading aloud.

**Core experience and wow moment:** A web flipbook (or printable PDF) with 12 two-page spreads. Each spread: a large dithered illustration/photo, a 150-word first-person story, a "did you know?" fact, and a small source line. The wow moment: the Fallen Astronaut spread — a tiny aluminum figure on the Moon, the only art installation on another world — followed by a factual page about the Apollo 15 crew and the memorial.

**AI roles:** Hydrogen drafts the stories and facts from source excerpts; TTS optional read-aloud; Jev not needed (or used to personalize the reading order); images are real NASA photos (not AI-generated) to avoid watermark/branding issues.

**Data pipeline:** select 12 objects from the NASA catalogue/LROC shapefile → source facts → Hydrogen draft → human edit → layout with dither images → static site/PDF. Add a "sources" page.

**48-hour MVP:** 6 spreads, web flipbook, read-aloud optional, source page.

**Stretch:** 12 spreads, print PDF, classroom discussion questions, translations.

**Dither fit:** the illustrations are the product; Atkinson/Floyd stills with a limited accent color; a consistent grid and type system.

**Risks:** illustration/layout time; AI-generated images would need watermarks and cannot use NASA branding, so use real photos; "children's book" can feel lightweight to judges unless the science is strong.

**Scores:** Impact 8 · Feasibility 8 · Novelty 7 · Judge appeal 8 · AI fit 7 · **Overall 7.6**

### Concept D — "Mission Control: Relight"

**Pitch line:** A narrative puzzle game where you are the flight controller trying to wake a dead lander, one subsystem at a time.

**Target user:** Ages 11–16; game-based learning.

**Core experience and wow moment:** Text/2D puzzle levels: "The lander is silent. You have three sols of power. Which subsystem do you restore first?" Each choice teaches the hardware (solar array, battery, transmitter, seismometer) and the science it enabled. Jev chooses the next challenge and difficulty from the player's mistakes; Hydrogen writes mission logs/hints. The wow moment: you successfully replay the real commands that recovered a mission, and the game shows the actual NASA record.

**AI roles:** Jev = difficulty/next-level/tone; Hydrogen = mission log and hint generation; TTS = capcom voice; no music model needed.

**Data pipeline:** hand-author 3 puzzle trees; source every subsystem fact from NSSDCA; Jev chooses branches; log the player path.

**48-hour MVP:** 3 levels, 1 lander (InSight or Phoenix), text UI, 10-minute playthrough.

**Stretch:** more landers, real command sequences, leaderboard, classroom mode.

**Dither fit:** a mission-control terminal aesthetic with dither schematics and mono type; keep it readable, not retro-kitsch.

**Risks:** game scope creep; less factual depth; hard to show in 30 seconds; "game" may overshadow the story.

**Scores:** Impact 8 · Feasibility 6 · Novelty 8 · Judge appeal 8 · AI fit 8 · **Overall 7.6**

### Concept E — "The Long Orbit"

**Pitch line:** A memorial orrery for the machines still falling outward: Pioneer, Voyager, Kepler, Dawn and NEAR, with live distances and postcards from the dark.

**Target user:** Ages 12+; space fans; museum/planetarium.

**Core experience and wow moment:** A 2D or 3D solar-system map with the spacecraft's current positions from JPL Horizons. Click a spacecraft to hear a 60-second "postcard" from its current distance, with a dither starfield and a one-way light-time counter. The wow moment: enter your birthday and see where Pioneer 10 was then vs now.

**AI roles:** Hydrogen writes postcards from mission data; TTS voices them; Jev chooses which postcard based on the user's interest and the current distance; Lyria optional ambient bed.

**Data pipeline:** Horizons API for distances/positions; NSSDCA/NASA pages for facts; 5 postcards; a simple 2D map (no 3D needed for MVP); cache the ephemerides at build time.

**48-hour MVP:** 5 spacecraft, 2D map, 5 postcards, birthday slider, source page.

**Stretch:** 3D orbits, Voyager plasma-wave "sound," live light-time, museum mode.

**Dither fit:** a dithered starfield and orbit diagram; the coldness of 1-bit suits the distance.

**Risks:** not Moon/Mars (but the challenge summary includes deep space); sparse imagery; less emotional for kids than a rover; Horizons positions for some spacecraft may not be available.

**Scores:** Impact 8 · Feasibility 9 · Novelty 9 · Judge appeal 8 · AI fit 8 · **Overall 8.4**

## 2.12 Recommendation

**Build Concept A, and fold Concept E in as the "deep space wing."** Reasons:

1. It matches the challenge's own examples ("interactive map of the Moon with clickable ghost rovers") while adding a distinctive visual language and an accuracy layer.
2. It uses the best data: the 71-record LROC shapefile is a genuine differentiator, and the 2012 NASA catalogue supplies human-scale details that make the story memorable.
3. It has a strong 30-second demo: global Moon → Tranquility Base → dither resolve → lander voice → source drawer.
4. It is feasible: 8–12 artifacts, one map, pre-generated audio, one Jev path.
5. It can win on **Validity** as well as **Presentation** if the "what we know / what we infer" distinction is visible.

**Scope guardrails:**
- If time is short, cut to **8 artifacts** (Apollo 11 LM, Apollo 15 LRV, Surveyor 3, Viking 1, Opportunity, InSight, Ingenuity, Pioneer 10) and 6 narrated beats.
- Use **real NASA photos**, not AI-generated images. This avoids the watermark/branding complexity and keeps accuracy high.
- Label every first-person segment **"Imagined from mission records."** Keep the factual narration separate.
- Put the **source drawer** on every plate. It is the cheapest way to look credible to judges.

**If the team is audio-first:** build Concept B, but add a dither "artifact card" for each episode so the submission has a visual identity. The accuracy discipline is the same.

**If the team is beginner/youth:** build Concept C (six spreads, real NASA photos, a static site) or a six-plate version of Concept A with no live Jev call. A small, accurate, beautiful field guide beats a broken 12-artifact atlas.

---

# 3. NASA media usage, copyright and Space Apps AI rules

## 3.1 NASA media guidelines

The controlling page is https://www.nasa.gov/nasa-brand-center/images-and-media/ (verified 14 Nov 2026). Key points:

- **Generally not copyrighted in the US.** "NASA content – images, audio, video, and media files used in the rendition of 3-dimensional models ... generally are not subject to copyright in the United States. You may use this material for educational or informational purposes, including photo collections, textbooks, public exhibits, computer graphical simulations and Internet Web pages."
- **Credit NASA.** "NASA should be acknowledged as the source of the material." NASA does not "license" its materials or sign license agreements.
- **No endorsement.** NASA material may not state or imply endorsement by NASA or any NASA employee of a commercial product, service or activity.
- **Logos are protected.** The NASA insignia (blue "meatball"), the retired logotype (red "worm") and the NASA seal may not be used without explicit permission. This is statutory (14 CFR Part 1221).
- **Third-party content.** NASA occasionally uses copyrighted material with permission; those images are marked. NASA's use does not convey rights to others.
- **Identifiable persons.** Commercial use of images with identifiable people may infringe privacy/publicity rights; astronauts/current employees have additional restrictions.
- **Audio may contain licensed music.** Some NASA audiovisual material incorporates music or footage licensed for a particular NASA work; editing may require the copyright owner's permission.
- **No warranty/indemnity.** NASA does not indemnify users or grant exclusive rights.

**Image/audio-library note:** the `images.nasa.gov` usage guidelines URL (https://images.nasa.gov/docs/images.nasa.gov/usage_guidelines.html) returns HTTP 200 but rendered empty in my environment; the controlling text is the NASA brand-center page above. NASA's Historical Sounds page explicitly says "For sound file use policy, please see Media Usage Guidelines." So the same rules apply to audio: generally not copyrighted, credit NASA, no endorsement, check third-party music. VERIFIED: https://www.nasa.gov/historical-sounds/ and the brand-center page.

## 3.2 Source-specific licensing

| Source | License / status | Practical rule |
|---|---|---|
| NASA SVS / EIC visualizations | NASA/GSFC; NASA media guidelines; some videos embed licensed music | Use frame sets/PNGs/silent visuals; credit SVS; do not remix a produced soundtrack with licensed music. VERIFIED. |
| NASA Earthdata / GIBS | ESDIS content generally not copyrighted; CC0 unless marked; attribution requested | Credit GIBS/ESDIS; check individual dataset metadata for restrictions. VERIFIED. |
| LROC PDS products | Public domain | Use the PDS archive for reusable images; cite Wagner et al. 2017 for the shapefile; credit NASA/GSFC/ASU. VERIFIED. |
| LROC website images (Featured Images/Sites, curated downloads) | **Copyrighted** by LROC/ASU; educational use permitted with credit; commercial use requires permission | For a hackathon demo, credit "NASA/GSFC/ASU"; for anything commercial, get permission or use PDS. VERIFIED. |
| HiRISE | **Public domain**; credit "Image: NASA/JPL/University of Arizona" | Use freely; credit. VERIFIED. |
| NSSDCA | NASA public domain; credit | Use text and images; cite the record URL. VERIFIED. |
| NASA History catalogue / 2011 recommendations | NASA public domain | Use freely; cite. VERIFIED. |
| NASA Image and Video Library | NASA media guidelines; check third-party markings | Use for stills/audio; check captions for copyright notes. VERIFIED. |
| Apollo audio (NASA Historical Sounds, Internet Archive) | NASA audio; public domain (check collection notes) | Use short clips; credit NASA/JSC; do not use a third-party "Apollo in Real Time" synchronization without permission (that site reserves rights in its synchronized footage). VERIFIED. |
| Artemis Accords / One Small Step Act | US Government works; public domain | Quote and cite. VERIFIED. |
| For All Moonkind Moon Registry | Site content not clearly licensed for bulk reuse | Use as a reference/citation; do not scrape or republish wholesale. VERIFIED (terms not stated on the page). |
| Wikipedia Mars list | CC BY-SA 4.0 | If you reuse the table, share-alike and attribute; better to use it only as a cross-check. VERIFIED. |
| azmth Mars dataset | CC BY 4.0 (per site) | Attribute; verify each row against NASA. THIRD-PARTY. |

## 3.3 Space Apps 2026 AI rules

The official participant FAQ and the NASA Space Apps GitHub discussions are the source. Key rules (verified 14 Nov 2026):

- **AI/SI is permitted.** The FAQ uses the term "Super Intelligence (SI)" per the 29 Sep 2026 Executive Order, but the meaning is AI tools.
- **Disclose how AI was used** in the project submission. The project page should have a "Use of Artificial Intelligence" section listing each tool and what it did.
- **AI-generated images and videos must have a visible watermark** saying they are AI-generated. A suggested watermark from an official answer: "Animation: AI-generated with Claude · Photos: NASA" (appropriate if visible in the AI-generated portions).
- **AI-generated audio must be acknowledged in descriptive text and metadata.**
- **AI-generated code and data must be acknowledged in descriptive text and metadata.**
- **AI-generated content may not use, contain or modify NASA branding or design elements** (NASA logos, flags, mission identifiers). Unaltered NASA photographs that naturally contain historical mission imagery or flags are generally acceptable.
- **At least one NASA data source from the challenge Resources** is required for Global Awards eligibility. For the Jukebox, use SVS/EIC; for storytelling, use NSSDCA.
- **Demo length:** 30-second video or 7 slides max (including title and closing); a longer film can be supplementary but cannot replace it.
- **Team size:** 2–6 for Universal Event global eligibility; 1–6 for Local Events; all members registered for the same event.
- **Under-18 participants** need a parent/guardian to register and accompany them; do not include photos/voices/likenesses of under-18s in the submission.
- **Judging criteria:** Impact, Creativity, Validity, Relevance, Presentation (1–5 each). THIRD-PARTY: the criteria are reported consistently by local-event organisers and prior-year materials; the official 2026 Judging & Awards Guide was not available to me at the time of this research, so verify the weights before optimising for them.

Sources: https://www.spaceappschallenge.org/resources/participant-faqs/, https://github.com/nasa/spaceapps/discussions/1849, https://github.com/nasa/spaceapps/discussions/1947, https://www.spaceappschallenge.org/legal/

## 3.4 Compliance checklist for both projects

- [ ] At least one challenge-listed NASA resource is used and linked (SVS/EIC for Jukebox; NSSDCA for storytelling).
- [ ] Every dataset, image, audio clip and library is credited with its license.
- [ ] No NASA logo, seal or logotype in the UI or in AI-generated assets.
- [ ] AI-generated images/videos carry a visible watermark; AI audio/code/data are disclosed in text and metadata.
- [ ] The project page has a "Use of Artificial Intelligence" section.
- [ ] The demo is ≤30 seconds or ≤7 slides.
- [ ] All audio has a transcript; all images have alt text; the UI is keyboard-navigable.
- [ ] No identifiable under-18s; no cloned astronaut/NASA voices.
- [ ] The "imagined" first-person narration is labeled and separated from sourced facts.
- [ ] The source drawer is reachable from every factual claim.

---

# 4. Key findings

1. **Gemini 4 Hydrogen is a text-output model.** It can see and hear, but it cannot speak or compose. Any pitch that says "Hydrogen narrates" must be corrected to "Hydrogen writes; Gemini TTS speaks; Lyria plays."
2. **Jev is a decision model, not a creative model.** Its value is speed (70–500 ms), calibrated probabilities and a typed schema. Use it to route story beats and arrangement choices; do not ask it for prose or music.
3. **The Jukebox's real differentiator is accessibility plus reproducibility, not the synth.** Build an audio-first path and publish the mapping. The Chandra/SYSTEM Sounds playbook is the benchmark.
4. **Lyria RealTime is the strongest 2026 "wow" for the Jukebox, but it is experimental.** Use it as an optional layer; keep Tone.js as the auditable core. Pricing is not public.
5. **The LROC anthropogenic shapefile is the single best Moon dataset for the storytelling challenge.** 71 located records, public domain, modern landers included, updated 2026-08-14. Download and parse it early.
6. **There is no authoritative NASA Mars artifact inventory.** That gap is an opportunity: build a sourced, normalized Mars inventory and show the provenance. Use HiRISE for the "discarded descent hardware" story.
7. **Licensing is source-specific.** NASA is generally public domain, but LROC website images are copyrighted, some EIC videos embed licensed music, and HiRISE is public domain with a credit line. Put a license column in the project's data table.
8. **Space Apps' AI rules are stricter than "disclose."** Visible watermarks on AI images/videos, metadata acknowledgments for AI audio/code/data, and no NASA branding in AI-generated content. Design the assets around this from the start.
9. **The Gemini API's 18+ terms are a real constraint for the school-age challenge.** Generate AI content at authoring time and ship a static kid-facing app, or use open-weight models. Do not put a live Gemini API key in a children's app.
10. **48 hours is enough for a strong entry if you pre-render.** Six Jukebox tracks or eight artifact stories, pre-generated TTS, pre-dithered stills, one map, one Jev path, one 30-second demo. The scope killers are live 3D terrain, live tile streaming and a general-purpose music model.

---

# 5. Open questions

1. **Jev access.** Is the team off the waitlist? If not, does OpenRouter `typesafe/jev-1.14` work for the team's region, and what is the rate limit? Fallback: Gemini Decision 1 or a deterministic DJ.
2. **Lyria RealTime access and price.** The docs call it experimental and the pricing page does not list it. Can the team get quota? If not, use Lyria 3.5 pre-generated clips.
3. **EIC frame-set licensing.** The SVS pages credit NASA/GSFC, but do any of the specific frame sets embed third-party imagery? Check each page's credits before shipping.
4. **LROC image reuse.** For the specific LROC featured images the team wants, is the PDS version available at the same resolution, or does the team need permission for the website image? Prefer PDS.
5. **Mars coordinate authority.** Which source will the team treat as canonical for Viking/Pathfinder/MER coordinates — NASA mission pages, NSSDCA, or HiRISE? Document the choice.
6. **Age group and reading level.** Will the storytelling project target 9–12 or 11–14? This changes script length, vocabulary and quiz design.
7. **BVI testing.** Can the team recruit at least one blind or low-vision tester before submission? If not, say so and cite the Chandra design principles instead of claiming user testing.
8. **AI watermark design.** What visible watermark satisfies Space Apps while not ruining the dither aesthetic? Test a small "AI-generated" corner label on the generated images/video.
9. **NASA branding in credits.** The rule prohibits NASA branding in AI-generated content, but the app needs to credit NASA data. Keep credits as plain text/links in the UI, not in the AI-generated asset itself.
10. **Demo narrative.** Can the team tell the whole story in 30 seconds? Write the 30-second script before building the app; if it does not fit, cut scope.

---

# 6. Verification log (selected)

| Claim | Status | Source |
|---|---|---|
| Jev is a TypeSafe System One decision model; Choice/Score/Noul/Box; $0.042/1M input; 70–500 ms; 64k context | VERIFIED | https://docs.typesafe.ai/models.md, https://typesafe.ai/blog/introducing-system-one-models-and-jev |
| Jev images/Box are experimental and require a header | VERIFIED | https://docs.typesafe.ai/primitives/box.md |
| Jev has no audio/video input | VERIFIED | https://docs.typesafe.ai/models.md |
| Jev 1.14 / 1.13 on OpenRouter | VERIFIED (OpenRouter blog) | https://openrouter.ai/blog/insights/what-is-jev/ |
| Gemini 4 Hydrogen released 12 Nov 2026; 1M context; text output; $1.50/$7.50 | VERIFIED | https://aistudio.google.com/docs/models/gemini-4-hydrogen, https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-hydrogen/ |
| Hydrogen has no audio generation / image generation / Live API | VERIFIED | model page capability badges |
| Gemini TTS: 8,192 input / 16,384 output; 130 languages; WAV default | VERIFIED | https://aistudio.google.com/docs/models/gemini-3.8-flash-tts |
| TTS price $0.50/$9 per 1M through 31 Dec 2026 | VERIFIED | https://aistudio.google.com/docs/pricing |
| Lyria 3.5: text+10 images; 44.1 kHz; MP3/WAV; $0.08/song; SynthID | VERIFIED | https://aistudio.google.com/docs/models/lyria-3.5, https://aistudio.google.com/docs/music-generation |
| Lyria RealTime: WebSocket; instrumental; 48 kHz; BPM/density/brightness/scale; experimental | VERIFIED | https://aistudio.google.com/docs/realtime-music-generation |
| Lyria RealTime public price | UNVERIFIED | not on pricing page |
| Magenta RealTime 2: code Apache-2.0; weights CC-BY-4.0; Google claims no rights in outputs | VERIFIED | https://github.com/magenta/magenta-realtime (MODEL.md) |
| MusicGen: code MIT; weights CC-BY-NC 4.0 | VERIFIED | https://github.com/facebookresearch/audiocraft |
| ACE-Step 1.5: MIT | VERIFIED | https://github.com/ace-step/ACE-Step-1.5 |
| Tone.js: MIT | VERIFIED | https://github.com/Tonejs/Tone.js |
| Strudel: AGPL-3.0 | VERIFIED | https://github.com/tidalcycles/strudel |
| Astronify: BSD-3-Clause | VERIFIED | https://github.com/spacetelescope/astronify |
| NASA content generally not copyrighted; credit; logos protected | VERIFIED | https://www.nasa.gov/nasa-brand-center/images-and-media/ |
| LROC PDS public domain; website images copyrighted | VERIFIED | https://www.lroc.asu.edu/about/terms |
| HiRISE public domain; credit line | VERIFIED | https://www.uahirise.org/media/usage.php |
| LROC shapefile: 71 records; 1.5 MB; updated 2026-08-14 | VERIFIED | downloaded ZIP + DBF parse; https://wms.lroc.asu.edu/lroc/view_rdr/SHAPEFILE_ANTHROPOGENIC_OBJECTS |
| NASA catalogue: 5.4 MB PDF | VERIFIED | HTTP headers; https://www.nasa.gov/wp-content/uploads/2024/02/final-catalogue-of-manmade-material-on-the-moon.pdf |
| 2011 recommendations: 5.18 MB PDF | VERIFIED | HTTP headers; https://www.nasa.gov/wp-content/uploads/2023/12/nasa-usg-lunar-historic-sites-reva.pdf |
| Artemis Accords: 0.98 MB PDF; Section 9 | VERIFIED | https://www.nasa.gov/wp-content/uploads/2022/11/Artemis-Accords-signed-13Oct2020.pdf |
| One Small Step Act: PL 116-275 | VERIFIED | https://www.govinfo.gov/app/details/PLAW-116publ275 |
| Pioneer 10 = 141.36 AU; Pioneer 11 = 118.80 AU; Voyager 1 = 173.07 AU; Voyager 2 = 144.86 AU on 2026-11-14 | VERIFIED | JPL Horizons API IDs -23, -24, -31, -32 |
| NSSDCA has no public JSON API | VERIFIED/INFERRED | HTML forms; no API found in docs |
| Space Apps: at least one NASA resource; AI disclosure; watermark; no NASA branding | VERIFIED | https://github.com/nasa/spaceapps/discussions/1849 |
| Space Apps demo: 30 s video or 7 slides | VERIFIED | https://github.com/nasa/spaceapps/discussions/1947 |
| Gemini API 18+ | VERIFIED | https://aistudio.google.com/docs/terms |
| Prithvi-EO-2.0: Apache-2.0 weights | VERIFIED | https://huggingface.co/ibm-nasa-geospatial/Prithvi-EO-2.0-300M |

*End of file.*
