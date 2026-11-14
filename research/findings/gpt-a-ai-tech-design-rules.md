# GPT-A: AI technology, Space Apps 2026 rules, dither design system and portfolio strategy

> Cross-cutting research for the NASA Space Apps Challenge 2026 team.
> Researched on **2026-11-14, which is day 1 of the hackathon**. Submission closes **Sun 15 Nov, 11:59 p.m. local time** of your Local Event.
> This file was started by the GPT-A sub-agent (Codex), which stopped when it hit a usage limit. Claude finished it, re-checking everything from primary sources in this session.
> **Labels:** **VERIFIED** means I read it this session at the cited URL. **UNVERIFIED** means it comes from memory, a secondary source, or my own inference.

---

## ⚠️ Read first: four rules that change how we build

1. **The SI may not originate the idea.** The 2026 Project Submission Guide says: *"SI should not be used to (come up with your idea of how to solve the challenge)."* ("SI", for "Super Intelligence", is Space Apps' 2026 term for AI.) Every concept in these research files was written by an AI. Treat them as background research only. **The team has to choose and shape the final idea itself, and should be able to say so.** — VERIFIED, https://www.spaceappschallenge.org/resources/project-submission-guide/
2. **Mark everything the SI generated.** Generated images and video need a *visible watermark*. Generated audio, code and data must be acknowledged in descriptive text *and* metadata. Judges see these indicators and judge "originality, intent, and execution" on them. — VERIFIED, same URL
3. **Generated content may not use, contain or modify any NASA branding** (logos, flags, mission identifiers). NASA's brand center adds that the insignia (meatball), the worm logotype and the seal may not appear with SI-generated imagery. **Do not put the meatball or the worm anywhere in our UI.** — VERIFIED, submission guide plus https://www.nasa.gov/nasa-brand-center/images-and-media/
4. **Demo limits are hard cut-offs:** a video of **30 seconds or less**, or **7 slides or fewer** (including the title and intro slides). Teams that go over are *not eligible for Global Judging*. — VERIFIED, submission guide

---

## A) AI technology deep dive (November 2026)

### A1. "Jev" by TypeSafe AI: **VERIFIED, it exists**

| Item | Detail | Status / source |
|---|---|---|
| What it is | A "System One" **decision model**. You send `state` plus typed `questions` and get **typed answers with calibrated probabilities**. It does **not generate text**. It was trained with "Reinforcement Learning for Calibrated Decisions (RLCD)". | VERIFIED: https://typesafe.ai, https://docs.typesafe.ai/introduction |
| Maker | TypeSafe AI, co-founded by Diogo Almeida (ex-OpenAI), Erik Gafni and Sasha Sheng. $40M seed led by DCVC (from press). | Founders VERIFIED: https://openrouter.ai/blog/insights/what-is-jev/ ; funding UNVERIFIED (press only: https://www.techtarget.com/it-infrastructure/news/366650696/Jev-decision-model-touted-as-quicker-cheaper-LLM-alternative) |
| Release | Early access on 2026-09-15. **Jev 1.14 on 2026-10-14** (current). Jev 1.13 is still served. | VERIFIED: https://docs.typesafe.ai/models.md |
| Model IDs | Direct: `jev-1.14.0`, `jev-1.13.0`, alias `jev-latest`; `jev-preview` appears in the Box examples. OpenRouter: `typesafe/jev-1.14`, `~typesafe/jev-latest`. AI/ML API: `typesafe/jev`. | VERIFIED: docs.typesafe.ai/models.md, OpenRouter blog, https://docs.aimlapi.com/api-references/decision-models/typesafe/jev |
| Endpoint | `POST https://api.typesafe.ai/v1/systemone`, `Authorization: Bearer $TYPESAFE_API_KEY`. Keys come from https://console.typesafe.ai/keys. Also served by OpenRouter (`POST https://openrouter.ai/api/alpha/decisions`), AI/ML API (`/v1/decisions`), Requesty, Eden AI and Vercel AI Gateway. | VERIFIED: https://docs.typesafe.ai/api/system-one.md, OpenRouter blog |
| SDKs | Python `typesafe-sdk` (sync and async clients with built-in retry and backoff) and JS/TS `@typesafe-ai/sdk`. There is also an official **agent skill**: `npx skills add typesafe-ai/skills --skill typesafe-ai`, or a Claude Code plugin. | VERIFIED: https://docs.typesafe.ai/llms.txt, quickstart |
| Question types | **Noul** (yes/no, P(true) from 0 to 1), **Choice** (1–255 options, returns choice, probabilities and confidence), **Score** (2–10 ordered levels, returns a probability-weighted score), **Box** (image localisation, returning top/bottom/left/right as fractions; 1.14 only, experimental). Any number of questions per request, as long as they fit the context. | VERIFIED: docs.typesafe.ai quickstart and models.md |
| Inputs | Text, JSON or an array. **PNG/JPEG images** (256–1568 px per side, ≤16 MiB each per AI/ML API), which need the `TypeSafe-Danger-Zone-Images: true` header. **No audio or video.** | VERIFIED: models.md, OpenAPI spec, AI/ML API page |
| Context | 64k tokens per request, 32k per question. With `TypeSafe-Danger-Zone-Long-Context: true` both rise to 262k, but TypeSafe says that mode is slower and less accurate. | VERIFIED: models.md, OpenRouter blog |
| Pricing | **$0.042 per 1M input tokens. Output is free.** One three-question call costs about $0.00002. | VERIFIED: models.md (and OpenRouter, as of 2026-10-16) |
| Rate limits | Not published. You get `429` or `529` errors, and the SDK retries with backoff. Capacity problems were reported after launch. | Limits VERIFIED as unpublished (https://docs.typesafe.ai/api/errors.md); outage UNVERIFIED (press) |
| Body limits | ≤32 MiB, gzip or zstd allowed, ≤64 levels of nesting, finite numbers only. | VERIFIED: errors.md |
| Calibration | Calibrated *in aggregate* (0.8 means right about 80% of the time). `confidence` measures how concentrated the probabilities are, not whether the answer is correct. Results can vary by a few hundredths between identical calls. Recommended bands: **act / review / escalate**, with thresholds set from your own labelled data. | VERIFIED: OpenRouter blog, typesafe.ai FAQ |
| Latency | "Typically answering in well under a second" (vendor claim). The vendor also claims it is 20–200× faster and 40–400× cheaper than LLMs. | UNVERIFIED (vendor claims only) |
| Hackathon credits | None. TypeSafe is **not** a 2026 Space Apps Global Collaborator. | VERIFIED: Space Apps Global Offers (GraphQL `pageByPath("/2026/global-offers/")`), 11 offers, none from TypeSafe |

**Good uses (from the vendor docs, mapped to our challenges)**
- Ranking and filtering candidates on a rubric with **Score**, for example "rank these microgravity combustion investigations by relevance to a lunar-habitat fire".
- Gating and triage with **Noul**, for example "is there a moving source between these two SPHEREx frames?" or "does this hotspot cluster look like agricultural burning?"
- Routing with **Choice**, for example the rotation family or the hazard class of a route segment.
- Checking an LLM's output against supplied policy or evidence text, for example "is Gemini's explanation supported by this abstract?" This works as a hallucination guard.
- Speculative fan-out: hundreds of questions over one shared state in a single cheap call.

**Bad uses (vendor guidance)**
- Arithmetic, date maths and threshold comparisons. **Do these in code first and put the results into `state`.**
- Prose, explanations and chain-of-thought (it has no text output).
- Audio or video input.
- Deterministic logic that a lookup or regex can do.
- Box is experimental, and it always returns a box even when the target is absent, so always pair it with a Noul ("is it present?").

**Minimal request, VERIFIED shape (OpenAPI example adapted):**
```json
POST https://api.typesafe.ai/v1/systemone
{ "model": "jev-1.14.0",
  "state": {"investigation": "…PSI abstract…", "habitat": "lunar surface, 14.7 psi / 21% O2"},
  "questions": {
    "relevant": {"type":"noul","instructions":"Is this investigation relevant to fire safety in this habitat?"},
    "phase":    {"type":"choice","instructions":"Which fire-safety phase does it inform most?",
                 "criteria":{"prevention":"materials, flammability limits","detection":"smoke/particulate","suppression":"extinguishment, water mist"}},
    "evidence": {"type":"score","instructions":"How directly does the data support predictive flammability modelling?",
                 "criteria":["None","Qualitative only","Quantitative, limited","Quantitative, directly usable"]} } }
```

### A2. Gemini 4 Hydrogen (`gemini-4-hydrogen`): **VERIFIED, it exists**

Earlier secondary sources called "Hydrogen" an unconfirmed leak codename for Gemini 4 Flash. **That is now out of date.** Google launched `gemini-4-hydrogen` on **2026-11-12**, as the fast member of the Gemini 4 family (Hydrogen, Carbon and Argon). — VERIFIED: https://blog.google/innovation-and-ai/technology/developers-tools/build-with-gemini-4-hydrogen/

| Item | Detail | Status / source |
|---|---|---|
| Model code | `gemini-4-hydrogen` (stable). Latest update November 2026. | VERIFIED: https://aistudio.google.com/docs/models/gemini-4-hydrogen (ai.google.dev/gemini-api/docs/models now 301-redirects to aistudio.google.com/docs/models) |
| Inputs → output | **Text, Image, Video, Audio, PDF → Text.** No image generation, no audio generation. | VERIFIED: same |
| Context | **1,048,576 tokens** shared by input and output. Max output 65,536 tokens by default, or up to about 1M with "long decode". | VERIFIED: same |
| Supported | Function calling, **structured outputs**, **Google Search grounding**, **Google Maps grounding**, URL context, code execution, computer use, file search, thinking (low/medium/high/xhigh), Batch, Flex and Priority inference, implicit caching, and "agentic video understanding" (off by default). | VERIFIED: same |
| **Not supported** | **Live API** (real-time bidirectional voice/video), explicit context caching, image and audio generation. Normal SSE *streaming* of text responses is a general API feature, separate from the Live API (UNVERIFIED for this specific model). | VERIFIED (Live API not supported) |
| Free tier | **Yes**, it is on the free tier. Carbon and Argon are paid only. | VERIFIED: https://aistudio.google.com/docs/pricing |
| Paid price | $1.50 per 1M input tokens, $7.50 per 1M output tokens (thinking included). Batch: $0.75 / $3.75. Caching: $0.075. | VERIFIED: pricing page |
| Search grounding | **Not available on the free tier.** On paid: 5,000 requests a month free (shared across Gemini 3+), then $14 per 1,000. | VERIFIED: pricing page |
| Rate limits | Free-tier RPM, TPM and RPD for Hydrogen are **not listed** on the rate-limit page (only batch token caps are). | VERIFIED as missing: https://aistudio.google.com/docs/rate-limits |
| Hackathon credits | No Gemini-specific offer. The Google Global Offer is the standard **Google Cloud $300 / 90-day free trial** (needs a card; no auto-charge). | VERIFIED: Space Apps Global Offers (GraphQL), CTA https://cloud.google.com/free/docs/free-cloud-features#free-trial |
| Known issues | A forum report of "raw internal self-correction" text leaking into the output. | UNVERIFIED: https://discuss.ai.google.dev/t/gemini-4-hydrogen-raw-internal-self-correction/200223 |

**Close relatives worth using**
- **`gemini-3.8-live`**: use this if you need a *real-time voice* agent, for example the hands-free astronaut assistant in Health Monitoring or the Martian Map. Text, image and audio in; text and audio out; 131k input; function calling (async by default); Search grounding. Stable, September 2026. — VERIFIED: https://aistudio.google.com/docs/models/gemini-3.8-live. Free tier: yes; audio input is $3.00 per 1M tokens or $0.005/min (VERIFIED, pricing page).
- **`gemini-decision-1`: Google's own decision model, the closest verified alternative to Jev.** It uses the Decisions API (`decisions.create`) and offers yes/no, single-select (2–255) and rubric (2–255 levels) questions, with calibrated probabilities and zero output tokens. It accepts **text, image, video, audio and PDF**, which Jev cannot. Input limit 262k tokens; up to 1,000 questions per request. **Free tier: 200 RPM, 50k TPM, 10k RPD.** — VERIFIED: https://aistudio.google.com/docs/models/gemini-decision-1, rate-limits page. Its pricing is not shown on the model page.
- **`gemini-embedding-2`**: multimodal embeddings (text $0.20, image $0.45, audio $6.50, video $12.00 per 1M; free tier available). — VERIFIED: pricing page. Good for analog-site similarity search and cross-modal retrieval.
- `gemini-3.8-flash`: the cheaper fallback (free tier; $0.75/$3.75 per 1M until 2026-12-31). — VERIFIED.

**Note on rules:** Hydrogen and Jev are proprietary hosted services. The Space Apps Terms say any non-NASA "Solution Materials" must be freely available or **OSI-licensed**, and every source must be cited. Calling an API is not redistributing it, but to be safe: (a) license our own repo under OSI terms (Apache-2.0 is the default if unspecified); (b) list Jev and Gemini as external services in References; (c) **ship a fallback path** using open weights or heuristics so the repo still runs without proprietary keys. — Terms VERIFIED: https://www.spaceappschallenge.org/legal/ ; how they apply to APIs is my **UNVERIFIED interpretation**, so ask the Local Lead.

### A3. Other 2026 models and tools: comparison table

| Category | Tool | What it gives us | Access | License | Status |
|---|---|---|---|---|---|
| Geospatial FM | **Prithvi-EO-2.0** (300M / 600M, plus `-TL` temporal/location variants and a `tiny-TL`) | HLS (Landsat + Sentinel-2) foundation model. Fine-tuned heads exist for burn scars, floods and crop types. | HF `ibm-nasa-geospatial/Prithvi-EO-2.0-*` | Apache-2.0 | VERIFIED (HF API) |
| Geospatial FM | Prithvi-EO-2.0-300M-**BurnScars** | Ready-made burn-scar segmentation, useful for the hot-spots challenge | HF | Apache-2.0 | VERIFIED |
| Weather FM | **Prithvi WxC** 1.0 2.3B | MERRA-2 weather/climate foundation model (downscaling, gravity-wave and forecast tasks) | HF `ibm-nasa-geospatial/Prithvi-WxC-1.0-2300M` | **CDLA-Permissive-2.0** (a data license, not OSI; flag it) | VERIFIED |
| Heliophysics FM | **Surya** 1.0 (NASA/IBM) | SDO-based solar foundation model (flare forecasting) | HF `nasa-ibm-ai4science/Surya-1.0` | Apache-2.0 | VERIFIED |
| Multimodal EO FM | **TerraMind 1.0** (IBM/ESA) | Any-to-any EO model (S1 SAR ↔ S2 optical ↔ DEM ↔ LULC), relevant to SAR | HF `ibm-esa-geospatial/TerraMind-1.0-large` | Apache-2.0 | VERIFIED |
| EO embeddings | **Clay** | Open EO embedding model for similarity search | HF `made-with-clay/Clay` | Apache-2.0 | VERIFIED |
| Fine-tuning toolkit | **TerraTorch** | Fine-tunes Prithvi, TerraMind and others | GitHub `torchgeo/terratorch` (moved from IBM/) | Apache-2.0 | VERIFIED |
| NASA science LLMs | **INDUS** (NASA-IMPACT + IBM), e.g. `nasa-smd-ibm-v0.1` encoder and `nasa-smd-ibm-st-v2` retriever; **`indus-sde-st-v0.2`** (updated 2026-06) | Science-domain encoders and sentence-transformers for retrieval and RAG over NASA papers (e.g. combustion PSI abstracts) | HF `nasa-impact/*` | Apache-2.0 | VERIFIED (HF API); public INDUS *hosted API*: none found (UNVERIFIED) |
| NASA search | **Science Discovery Engine (SDE)** | Search across NASA SMD data, docs and software; INDUS integration prototyped | https://sciencediscoveryengine.nasa.gov | US Gov | Exists: VERIFIED via science.nasa.gov coverage; public API: **UNVERIFIED** |
| NASA data access | **earthaccess** | One-line Earthdata Login search and download, cloud-optimised streaming (also NISAR) | GitHub `earthaccess-dev/earthaccess` | MIT | VERIFIED |
| NASA dashboards | VEDA UI / veda-config | NASA's Earth dashboard front end (prior art) | GitHub `NASA-IMPACT/veda-ui` | NOASSERTION (check the LICENSE file) | VERIFIED (repo) |
| Mission-control UI | **Open MCT** | NASA's open-source telemetry and mission-control framework, good for Health Monitoring | GitHub `nasa/openmct` | NOASSERTION per API (Apache-2.0 from memory, UNVERIFIED) | VERIFIED (repo) |
| Open-weight multimodal | **Gemma 4** (E2B/E4B on-device, 31B) | Open fallback for perception and explanation; an ONNX build exists for in-browser use | HF `google/gemma-4-*`, `onnx-community/gemma-4-E2B-it-ONNX` | **Apache-2.0** | VERIFIED (HF API) |
| Open-weight VLM | Qwen3-VL-8B-Instruct | Alternative VLM | HF | Apache-2.0 | VERIFIED |
| On-device / WebGPU | **transformers.js** | Runs ONNX models in the browser on WebGPU or WASM | GitHub `huggingface/transformers.js` | Apache-2.0 | VERIFIED |
| On-device / WebGPU | **WebLLM** (MLC) | In-browser LLM inference on WebGPU | GitHub `mlc-ai/web-llm` | Apache-2.0 | VERIFIED |
| Agents | **MCP** (Model Context Protocol) | Standard tool and server protocol; wrap NASA APIs (FIRMS, POWER, DONKI) as MCP tools for a Gemini agent | `modelcontextprotocol/modelcontextprotocol` | NOASSERTION per API (spec is open) | VERIFIED (repo); per-SDK licenses UNVERIFIED |
| Agents | Gemini function calling, computer use, URL context | Native agent loop without a framework | Gemini API | Proprietary | VERIFIED (Hydrogen spec) |
| Agents | Third-party "jevmodel-io" MCP server | Jev exposed as MCP tools | https://mcpservers.org/servers/jevmodel-io | Unknown | UNVERIFIED (not official) |
| Browser GPU | WebGPU in Chrome/Edge (since 2023), Safari 26, Firefox (Windows) | Real-time dither shaders and in-browser models | n/a | n/a | UNVERIFIED this session (from memory); always provide a WebGL2 fallback |

### A4. Reference architecture: Jev decides, Gemini perceives and explains

```
             ┌─────────────────────────── NASA / partner data ───────────────────────────┐
             │ earthaccess · CMR/STAC · GIBS WMTS · FIRMS API · POWER API · IRSA · PDS     │
             └──────────────────────────────────┬─────────────────────────────────────────┘
                                                ▼
 (1) DETERMINISTIC CORE  (Python/TS, no AI):  harmonise · stats (Mann-Kendall, Sen slope) ·
     ephemeris/horizon (SPICE) · thresholds · feature tables  ──►  numbers are COMPUTED, never guessed
                                                │
                     ┌──────────────────────────┴───────────────────────────┐
                     ▼                                                      ▼
 (2) PERCEPTION: gemini-4-hydrogen                         (2b) GEO-FM (optional, offline)
     image / video / PDF / audio ──► structured JSON           Prithvi-EO-2 / TerraMind / Clay
     (responseSchema; Maps/Search grounding for context)       ──► masks, embeddings
                     │                                                      │
                     └──────────────► STATE object (facts + features + provenance) ◄──┘
                                                │
                                                ▼
 (3) DECISION: Jev 1.14  (or gemini-decision-1 when video/audio/PDF must be judged directly)
     Noul gates · Choice routing · Score rubrics ──► calibrated probabilities, confidence
                                                │
                                                ▼
 (4) POLICY IN CODE: bands  p≥0.85 ACT · 0.4–0.85 REVIEW · <0.4 / near 0.5 ESCALATE-to-human
     (thresholds tuned on ~30 hand-labelled examples; show the band in the UI)
                                                │
                                                ▼
 (5) EXPLANATION: gemini-4-hydrogen  "Explain this ranking using ONLY these sources" ──►
     short rationale + citations   ──►  (5b) Jev Noul VERIFY: "Is every claim supported by the sources?"
                                                │
                                                ▼
 (6) DITHER UI: ranked list + probability bars + dithered imagery/maps + "SI" provenance badges
```

**Design rules for the pipeline**
- **Numbers come from code; judgements come from Jev; words come from Gemini.** This split matches each tool's documented strengths and failure modes. It is also easy to explain to judges, and it scores on Validity.
- **Show uncertainty as a feature.** Jev's probabilities feed the act/review/escalate bands. In a dither UI, probability maps naturally to **dither density** (see C5).
- **Cache everything.** It keeps the demo free of rate limits, and the free tier with no Search grounding is a real constraint. Pre-compute the demo scenarios and store Gemini and Jev responses as JSON fixtures, with a "live" toggle.
- **Fallbacks for open-source compliance and robustness:** `gemini-decision-1` stands in for Jev, Gemma 4 for Hydrogen (local or ONNX), and rules or heuristics for both when there is no key.
- **Provenance:** every SI-generated string or image carries a visible `SI` tag and a metadata record (model, version, prompt hash, timestamp). This follows Rule 2 and doubles as a design element (C4).

---

## B) Space Apps 2026 rules (official, VERIFIED 2026-11-14)

Sources:
- Project Submission Guide: https://www.spaceappschallenge.org/resources/project-submission-guide/
- Judging & Awards Guide (dated Nov 13, 2026): https://www.spaceappschallenge.org/resources/judging-awards-guide
- Participant FAQs: https://www.spaceappschallenge.org/resources/participant-faqs/
- Terms & Conditions: https://www.spaceappschallenge.org/legal/
- Global Offers: https://www.spaceappschallenge.org/2026/global-offers/

(Note: WebFetch fails with an SSL error here. I used `curl` with a browser user agent, and the GraphQL API at `https://api.spaceappschallenge.org/graphql` for the JavaScript-rendered pages.)

### B1. Timeline and team
- Submission opens **Sat 14 Nov, 9:00 a.m.** and closes **Sun 15 Nov, 11:59 p.m.** in the Local Event's time zone. For the Universal Event, the Team Owner's local time applies. You can resubmit any number of times; only the last saved version is judged.
- **1–6 members.** Universal Event teams need at least 2. All members must be at the same Local Event and not waitlisted.
- Global Nominees are announced Dec 3, 2026, Finalists and Honorable Mentions Dec 17, 2026, and **Global Winners Jan 26, 2027**.
- There is a China-funding eligibility review (NASA policy) for Global Judging.

### B2. Submission requirements (project page fields)
1. **Project Name**
2. **High-Level Project Summary**
3. **Link to Project Demo**: either a **30-second-or-less video** or a **slide deck of 7 slides or fewer** (including title and intro). Public link, no login. Video can be in another language **only with English subtitles**; slides must be in English. Going over the limits means *not eligible for Global Judging*.
   - The recommended video script: 0:00 names → 0:02 challenge and inspiration → 0:05 title and tagline → 0:10 how it works and the NASA data → 0:20–0:30 the future.
4. **Link to Final Project**: public website, repo or drive. The guide recommends asking FortiGuard to classify a new website so judges' web filters don't block it.
5. **Detailed Project Description**: what it does, how it works, benefits, tools and languages.
6. **Use of Super Intelligence (SI)**: a data-collection field that judges *don't* see. Judges **do** see the in-project SI indicators: watermarks, descriptive text and metadata.
7. **NASA Data**: **at least one NASA data source or resource is required to be eligible for a Global Award.**
8. **Space Agency Partner Data and Other References**: list *all* data, code, text and images, even open-source ones. Partners encouraged this year include ESA, ISRO, JAXA, CSA, KASA, UKSA, the Brazilian, Italian and Spanish agencies, and others.
- **Other rules:** page images are JPG/PNG/GIF ≤10 MB, with no video or document uploads (link to them instead). **No images, video, audio or likeness of anyone under 18** in the demo or final project. You must tick both "Terms and Conditions" and "Confirm All Work is Original".

### B3. SI (AI) usage policy, verbatim essentials
- *"The use of SI tools, such as machine learning, chatbots, image generation, and large language models, is permitted … SI should not be used to (come up with your idea of how to solve the challenge)."*
- *"Generated content may not use, contain, or modify any NASA branding or design elements (such as the NASA logos, flags, or mission identifiers)."*
- Images and video: **visible watermark**. Audio, code and data: **acknowledgment in descriptive text and metadata**.

### B4. Attribution, licensing and IP (Terms & Conditions)
- Our original content must be freely available or OSI open source. **If we specify no license, NASA distributes it under Apache-2.0.**
- Non-NASA materials must be freely and publicly available or OSI-licensed, and *"Any licenses applicable to your Solution Materials must be identified in the documentation."* NASA *"will not accept or post any Solutions that do not include appropriate license documentation."*
- *"You must cite every source … even if it is open source or freely available."* NASA may remove nominations or awards from teams that don't cite.
- No export-controlled (ITAR/EAR) information and no PII.

### B5. Judging criteria and awards
- Five criteria, each scored 1–5 at every level:
  - **Impact**
  - **Creativity**
  - **Validity** (scientific soundness, feasibility, usability)
  - **Relevance** (NASA data must be a *core* part, not a superficial addition)
  - **Presentation** (judged on both the demo and the full project)
- Ten Global Awards: **Best Use of Science · Best Use of Data · Best Use of Technology · Galactic Impact · Best Mission Concept · Most Inspirational · Best Storytelling · Global Connection · Art & Technology · Local Impact.**
- Local events may give their own local awards.

### B6. NASA brand and logo restrictions
- The NASA Insignia (meatball), Logotype (worm), identifiers and imagery are **not in the public domain**. Commercial use must not imply NASA endorsement, and NASA does **not** permit the insignia, worm or seal with SI-generated imagery or for training SI. — VERIFIED: https://www.nasa.gov/nasa-brand-center/images-and-media/
- NASA imagery is *generally* not copyrighted in the US and may be used for educational and informational purposes, **with NASA acknowledged as the source**. Third-party images on NASA sites (marked ©) need the copyright holder's permission. — VERIFIED: same page
- **Practical rule for us:** no meatball, no worm, no seal, no mission patches, and no NASA-red "meatball" pastiche. Use our own wordmark. Write *"Data: NASA [mission/instrument], via [archive]"* under every image. The Space Apps brand-guidelines page renders with JavaScript and I did not read it, so **UNVERIFIED** whether it allows the Space Apps logo.

---

## C) Dither UI design system for NASA

### C1. Techniques: what to use where

| Technique | How it works | Best for | GPU / real-time? | Look |
|---|---|---|---|---|
| **Ordered / Bayer** (2×2, 4×4, 8×8 threshold matrix) | Compares each pixel with a tiled threshold matrix | Live maps, globes, 3D, animation; **stable under motion** | Yes, a trivial fragment shader | A precise, regular cross-hatch that feels "instrument-like" |
| **Blue-noise / void-and-cluster** | Thresholds against a blue-noise texture | Photos and hero imagery in real time; less patterned than Bayer | Yes (texture lookup) | Organic, film-grain feel; the most "modern" of these |
| **Floyd–Steinberg** error diffusion (7/16, 3/16, 5/16, 1/16) | Pushes quantisation error to neighbouring pixels | Static, high-fidelity stills; pre-processed imagery | No: sequential, so do it offline or in a worker | Smooth tones, worm-like artefacts in flat areas |
| **Atkinson** (spreads 6/8 of the error to 6 neighbours) | Diffuses only part of the error, so highlights and shadows clip | Editorial, high-contrast hero images (classic Mac look) | No (offline) | Crisp, punchy, print-like |
| **Halftone** (AM dots, angled screens) | Dot size encodes tone | Data glyphs, print-style posters, archival photos | Yes | The newspaper / NASA-press-photo look |
| **Threshold + pattern fills** | Discrete pattern per class | **Categorical map layers**, colour-blind-safe encodings | Yes | Cartographic and technical |

**Implementation rules**
- Convert sRGB to **linear** before thresholding, or mid-tones come out too dark.
- Quantise at a whole multiple of CSS pixels (`floor(gl_FragCoord.xy / (dpr * k))`, with k=1–2) to avoid moiré on HiDPI screens.
- On pan or zoom, anchor the pattern in **texture or world space** (tile UVs) rather than screen space. This avoids the "shower-door" effect where the dither slides over the map.
- Use **Floyd–Steinberg or Atkinson offline only** (Python Pillow `Image.convert("1")` uses FS — Pillow's license is MIT-CMU/HPND, UNVERIFIED). Use **Bayer or blue noise live**.

### C2. Libraries and repos (licenses checked via the GitHub API this session)

| Repo | What | License | ★ / last push | Use? |
|---|---|---|---|---|
| `niccolofanton/dithering-shader` | Real-time Bayer post-processing for three.js scenes | **MIT** | 294 / 2026-09 | ✅ globes and 3D |
| `darkroomengineering/spargo` | Real-time GPU image dithering via WebGL | **MIT** | 17 / 2026-11 | ✅ image panels (very new; test it first) |
| `paper-design/shaders` | Zero-dependency canvas shaders, including dithering | **Apache-2.0** per the GitHub API | 3,968 | ✅ backgrounds; re-check the LICENSE file before shipping |
| `andrewstephens75/as-dithered-image` | `<as-dithered-image>` web component (Atkinson, pixel-perfect) | **MIT** | 251 | ✅ static hero imagery |
| `pmndrs/postprocessing` / `react-postprocessing` | Effect composer for custom dither passes | **Zlib** / **MIT** | 2,975 / 1,591 | ✅ |
| `mrdoob/three.js` | 3D | MIT | 118k | ✅ |
| `visgl/deck.gl` | WebGL2 data visualisation, `PostProcessEffect` | MIT | 14.7k | ✅ maps |
| `CesiumGS/cesium` | 3D globe, `PostProcessStage` | Apache-2.0 | 15.9k | ✅ globes and terrain |
| `NASA-AMMOS/3DTilesRendererJS` | NASA JPL 3D Tiles renderer (Mars/Moon terrain) | Apache-2.0 | 2.5k | ✅ planetary 3D |
| `developmentseed/titiler` | Dynamic COG tile server (add a dither algorithm server-side) | MIT | 1.2k | ✅ pre-dithered tiles |
| `makew0rld/didder` | Accurate CLI ditherer (many matrices) | **GPL-3.0** | 531 | ⚠️ fine as a *build tool*; do not link it into our code |
| `gazs/canvas-atkinson-dither` | Canvas Atkinson | GPL-3.0 | 90 | ⚠️ copyleft |
| `danielepiccone/ditherjs`, `zavalit/bayer-dithering-webgl-demo` | JS / WebGL dithering | **No license** (all rights reserved) | — | ❌ reference only |

### C3. Type pairings (all open licenses)
- **The heritage:** the 1975 *NASA Graphics Standards Manual* (Danne & Blackburn) used Helvetica on a strict modular grid with the worm logotype. NASA rescinded it in 1992 and brought the meatball back. The worm returned in **April 2020** for SpaceX Demo-2 under NASA control, and the meatball remains the official logo. — VERIFIED (collectSPACE, Space.com: https://space.com/nasa-worm-logo-is-back-spacex-demo-2-rocket.html)
- **The reissue:** Jesse Reed and Hamish Smyth (Pentagram, Standards Manual) reissued the manual via Kickstarter in 2015. It is a **copyrighted commercial book** — VERIFIED (https://www.designboom.com/design/hamish-smyth-jesse-reed-nasa-identity-guidelines-09-27-2015/). NASA also hosts a free PDF of the original (UNVERIFIED URL).
- **What this means for us:** borrow the *principles* (grid, restraint, Helvetica-class grotesk, one colour) and **never the worm**.
- **Pairings:**
  - **Inter / Inter Display + JetBrains Mono.** Inter (OFL-1.1, VERIFIED `rsms/inter`) is the closest free Helvetica-family workhorse; JetBrains Mono (OFL-1.1, VERIFIED) for telemetry numbers.
  - **IBM Plex Sans + IBM Plex Mono** (OFL-1.1, VERIFIED `IBM/plex`). Engineering-flavoured, with tabular figures.
  - **Inter Tight + Space Mono** (OFL, UNVERIFIED this session) for the editorial print direction.
  - Always use `font-variant-numeric: tabular-nums` for data, and avoid pixel fonts for body text (that tips into kitsch).

### C4. Palettes: 1-bit plus one accent (contrast ratios computed against WCAG 2.x)

| Direction | Background | Ink | Muted | Accent | Ratios |
|---|---|---|---|---|---|
| Flight Director (dark) | `#0B0D10` | `#E8EAED` | `#8A9099` | `#FF5B1F` signal orange | ink 16.1:1 · muted 6.1:1 · accent 6.3:1 ✅ |
| Manual '75 (paper) | `#F2F0EB` | `#111111` | `#5E5E5A` | `#C0201A` | ink 16.6:1 · muted 5.7:1 · accent 5.3:1 ✅ (the brighter `#E03C31` is only 3.8:1, so use it for large or graphic elements only) |
| Deep Field (negative plate) | `#FFFFFF` (dark: `#000000`) | `#0A0A0A` (dark: `#F5F5F5`) | `#666666` | `#3A2BFF` UV blue (dark: `#8F86FF`) | 19.8 · 5.7 · 7.1 ✅ (dark: 19.3 · — · 7.0) |

**The "SI" provenance badge as a token:** a 1-px accent outline pill, mono caps, `SI · gemini-4-hydrogen`. It goes on every generated text block and on watermarked images. It satisfies Rule 2 and reads as part of the system, not an afterthought.

### C5. Keeping it clean, modern and accessible
- **Dither only imagery and data, never behind text.** Text sits on solid fills. Keep body text ≥4.5:1 and large text and UI glyphs ≥3:1 (all tokens above pass).
- **Use dither as encoding, not decoration.** Dither density shows probability or uncertainty (Jev's probabilities become pixel density), and pattern fills show categories. This is **colour-blind safe by design** and gives a clear story for Best Use of Data.
- **Motion:**
  - Reveals use a threshold sweep (dither level 0→1) over 240–400 ms, ease-out.
  - Data updates use 120 ms step changes.
  - With `prefers-reduced-motion: reduce`, there are no sweeps and no blinking; states swap instantly, and blink comparators turn into a swipe or side-by-side view.
  - Blinking stays ≤2 Hz with a visible pause control (WCAG 2.2.2 Pause/Stop/Hide; 2.3.1 three flashes or fewer per second).
- **Fine dither textures can shimmer on screens:** stay at ≥2 CSS-pixel cells and offer a "smooth" (undithered) toggle for low-vision users.
- **Alt text:** Gemini can draft it, but label it as SI and have a human review it.
- **Performance:** one fullscreen pass is cheap. Cap the device pixel ratio at 2 and fall back to WebGL2 when WebGPU is missing.

### C6. Dithering satellite imagery, maps and globes
- **CesiumJS:** use `viewer.scene.postProcessStages.add(new Cesium.PostProcessStage({ fragmentShader }))` with a Bayer GLSL threshold on luminance, and keep the vector overlay (labels, routes) *after* the stage or in HTML. Base imagery comes from **NASA GIBS WMTS** (open, no key; VERIFIED in the prior agent's notes, re-check). Avoid Cesium ion assets unless you register a token.
- **deck.gl:** use `new PostProcessEffect(ditherModule)`, a luma.gl shader module, for screen-space effects. For world-anchored dither, apply the shader in a custom `BitmapLayer`/`TileLayer` sub-layer so the pattern follows tile UVs.
- **three.js:** use `EffectComposer` → `RenderPass` → a dither `ShaderPass` (or `niccolofanton/dithering-shader`). For globes, dither the albedo *texture* (world-space) and keep the atmosphere glow undithered for depth.
- **Server-side / offline:** pre-dither COGs or PNG tiles (TiTiler custom algorithm, or Pillow) for heavy scenes such as SPHEREx cutouts, HiRISE crops or NISAR backscatter. **SAR speckle and star fields already look dithered**, so a threshold gives a striking but honest look.
- **Science honesty:** always keep a **"science view"** (a continuous colormap with a legend and units) one click away. The dither is the *presentation* layer, which protects the Validity score.

### C7. Three named style directions

**1 · FLIGHT DIRECTOR**: mission-control precision (dark)
- **Colours:** bg `#0B0D10`, surface `#12161B`, hairline `#232A33`, ink `#E8EAED`, muted `#8A9099`, accent `#FF5B1F` (alerts and "ACT" band only).
- **Fonts:** Inter 400/600 for UI, Inter Display 700 for headings (tight −2% tracking), JetBrains Mono 400 tabular for all numbers and timestamps.
- **Grid:** 12 columns, 8 px base, 24 px gutters, 1 px hairline rules, panels with **no** radius or shadows, mono-caps labels at 11 px with +6% tracking.
- **Dither:** 8×8 Bayer, 2-level, at 2 CSS px cells on imagery and globes. Probability bars use 4×4 Bayer fill density.
- **Motion:** 120 ms linear step updates, 300 ms threshold-sweep reveals, a "scanline" loader. Reduced motion means no animation at all.
- **Fits:** Flame in Freefall, Lunar Landing Navigator, Health Monitoring, Hot Spots.

**2 · MANUAL '75**: Swiss print and editorial (light). An homage to the *grid*, not the logo.
- **Colours:** paper `#F2F0EB`, ink `#111111`, muted `#5E5E5A`, rule `#111111` at 1 px, accent `#C0201A` (large graphics may use `#E03C31`).
- **Fonts:** Inter Tight 500/700 for display (large, flush-left, ragged-right), Inter 400 for body, IBM Plex Mono for captions and data credits.
- **Grid:** 6-column modular grid with a strong top margin and baseline grid of 8 px. Captions hang in the left column, and big numerals act as section markers.
- **Dither:** **Atkinson** (offline) for hero photos and archival imagery; halftone dots at 45° for portraits of hardware.
- **Motion:** almost none: hard cuts, 200 ms opacity, and a page-turn feel. Reduced motion is the same with no opacity changes.
- **Fits:** Discarded Equipment Storytelling, Analog Sites, Earth Jukebox, Farms (report-style output).

**3 · DEEP FIELD**: an astronomical negative plate (light by default, with a dark twin)
- **Colours:** plate `#FFFFFF`, ink `#0A0A0A`, muted `#666666`, accent `#3A2BFF` (UV blue). Dark twin: `#000000` / `#F5F5F5` / `#8F86FF`.
- **Fonts:** IBM Plex Sans 400/600 with IBM Plex Mono for coordinates (RA/Dec in sexagesimal, tabular).
- **Grid:** a centred "plate" canvas at 4:3 with a fixed 1 px reticle and tick marks every 10″. Side rail of 320 px for the candidate list.
- **Dither:** **blue-noise** threshold on inverted (negative) sky images, and an *accent-only* overlay for candidate movers (Jev Box rectangles in UV blue).
- **Motion:** a blink comparator at 1–2 Hz with a pause button, and a 400 ms crossfade option. Reduced motion uses a swipe slider and a side-by-side "difference" view.
- **Fits:** Planet X & SPHEREx, Dancing with the SARs (speckle), Martian Map (HiRISE).

---

## D) Portfolio strategy: ranking all 14 challenges

Scores are 1–10 and are **my judgement (UNVERIFIED)**, based on the challenge texts and the verified tool capabilities above.
- **Competition:** 10 means the challenge is likely to be *less* crowded. I inferred this from the level (Advanced only means fewer teams), from how niche the theme is, and from past Space Apps patterns. Assume about 48 hours and 3–5 people.

| # | Challenge | AI fit (Jev + Gemini) | Dither fit | Data availability | Competition (10 = low) | Award potential | **Total /50** | One-line rationale |
|---|---|---|---|---|---|---|---|---|
| 1 | **Planet X & SPHEREx** | 9 | 10 | 7 | 9 | 8 | **43** | The blink comparator *is* the product. Jev Noul ("mover present?") and Box (locate it) on frame pairs; Hydrogen explains via video understanding; a Deep Field dither plate. Advanced only, so fewer teams. Risks: SPHEREx cutout access via IRSA, and only about 3 sky epochs so far. Fits Best Use of Data and Global Connection (citizen science). |
| 2 | **Flame in Freefall** | 10 | 8 | 7 | 8 | 9 | **42** | The brief literally asks for an "SI-powered dashboard that summarizes, **ranks**, and interprets". Jev Score/Choice ranks investigations; Hydrogen reads PSI PDFs and flame video. Fits Best Use of Technology. Risk: PSI access may need registration, so check today. |
| 3 | **Analog sites (Moon/Mars on Earth)** | 9 | 9 | 8 | 6 | 8 | **40** | Gemini Embedding 2 and Clay/Prithvi embeddings give a similarity search. Jev Score per characteristic (terrain, thermal, mineralogy) shows "where the analogy breaks down", which the brief explicitly asks for. Side-by-side dither comparisons. Open to all levels, so more teams. |
| 4 | Lunar Landing Site Navigator | 6 | 10 | 8 | 7 | 8 | 39 | The core is geometry (SPICE, LOLA horizon masks), which must be computed and not done with AI. Jev ranks site and date trade-offs. Gorgeous 1-bit south-pole terrain. Fits Best Mission Concept. |
| 5 | Harmonization of MODIS/VIIRS Hot Spots | 6 | 9 | 9 | 7 | 7 | 38 | FIRMS gives easy data. The harmonisation is statistical, not AI. Jev Choice can classify burn type; a 1-bit dither calendar heatmap is a natural fit. Best Use of Data. |
| 6 | Earth Information Jukebox | 7 | 9 | 7 | 7 | 8 | 38 | Hydrogen reads EIC frames and turns them into structured musical parameters. Generated audio needs SI acknowledgment. Strong Art & Technology and accessibility story. |
| 7 | Martian Map (Marswalk) | 8 | 9 | 8 | 5 | 8 | 38 | Jev scores route-segment hazards (Box on HiRISE is experimental). Hydrogen summarises the layers. Popular theme. |
| 8 | Field Shift: Farms | 9 | 6 | 9 | 4 | 8 | 36 | The best "decision-support" match for Jev (rotations scored against farmer priorities) and rich data (POWER needs no key; SMAP and ECOSTRESS need Earthdata Login). Very crowded theme. Local Impact award. |
| 9 | Earth System Trend Detective | 6 | 7 | 8 | 8 | 7 | 36 | Mann-Kendall is code. Gemini with Search grounding (paid only) or Jev ranks candidate variables per region. Best Use of Science. |
| 10 | Dancing with the SARs | 6 | 10 | 5 | 7 | 7 | 35 | SAR speckle looks dithered already, and TerraMind handles SAR. NISAR HDF5 is heavy and provisional products are still being reprocessed through end-2026, so 48-hour feasibility is low. |
| 11 | Discarded Equipment Storytelling | 7 | 9 | 7 | 4 | 7 | 34 | Strong Storytelling and Most Inspirational angle (Manual '75 halftones), but many beginner teams. Jev's role is weak. Generated images need watermarks. |
| 12 | Health Monitoring for Astronauts | 9 | 7 | 4 | 4 | 6 | 30 | Jev's act/review/escalate bands are a perfect fit and `gemini-3.8-live` enables hands-free voice. But NASA data is thin (a Relevance risk), there's a medical-claims risk, and the theme is popular. |
| 13 | Space Mission Design Game | 6 | 7 | 6 | 4 | 6 | 29 | Lots of game teams. Up-to-4 multiplayer is costly to build. Jev could grade designs. |
| 14 | Junior Astronaut Mission Trainer | 5 | 6 | 7 | 3 | 6 | 27 | For ages 7–12, so dither risks looking retro-kitsch. The no-minors-likeness rule complicates user-testing footage. Very crowded. |

### Top 3 and why
The three highest totals. I put Flame in Freefall first even though it scores one point below SPHEREx, because it is the only challenge that *requires* SI and asks for exactly what Jev does well (ranking). It is also the safest bet for the 'new AI' goal.
1. **Flame in Freefall.** This is the only challenge whose official text *requires* SI and asks for **ranking**, which is exactly Jev's documented strength. Hydrogen's 1M-token PDF and video input covers the "summarize and interpret" half, and Flight Director dither gives a distinctive mission-safety console. It is niche, Advanced/Intermediate, and maps strongly to **Best Use of Technology**. *Do today:* confirm PSI database access and download format.
2. **Planet X & SPHEREx.** The visual product (blink comparator) and the AI product (Jev Noul+Box on frame pairs, with calibrated "candidate mover" probabilities that send uncertain cases to human volunteers) line up perfectly. The Deep Field dither style is a natural fit. It is Advanced only, so there are fewer competitors. *Do today:* confirm SPHEREx image or cutout access at IRSA, and test on WISE 0855 and Barnard's Star.
3. **Analog sites.** Multimodal embeddings (Gemini Embedding 2, Clay, Prithvi) let us *discover* new analogs instead of re-listing Atacama. Jev's calibrated per-criterion scores give the "where the analogy breaks down" answer the brief asks for. Strong for Creativity and Best Use of Data.
- **Wildcard:** the Earth Information Jukebox, for the Art & Technology award.

The decision belongs to the team. Per Rule 1, the idea must originate with the humans.

---

## Key findings
- **Both named models are real and verified:**
  - **Jev 1.14** (TypeSafe; `POST api.typesafe.ai/v1/systemone`; $0.042 per 1M input tokens, output free; text and images only; Noul/Choice/Score/Box).
  - **`gemini-4-hydrogen`** (Google, launched 2026-11-12; text, image, video, audio and PDF in; 1M context; function calling, structured outputs, Search/Maps grounding; **free tier yes**; **no Live API**).
- **Google also ships `gemini-decision-1`,** a multimodal decision model (video, audio and PDF too) with a published free tier of 200 RPM and 10k RPD. It is the best verified alternative or backup to Jev.
- **Space Apps 2026 allows SI but forbids using it to originate the idea.** It requires visible watermarks on generated images and video and acknowledgments for generated audio, code and data, and it bans NASA branding in generated content.
- **Demo:** a video of 30 seconds or less, or 7 slides or fewer, with English subtitles. Going over means losing Global eligibility. **At least one NASA data source is required** for Global Awards, and every resource must be cited with its license (OSI rules; Apache-2.0 by default).
- **Judging uses five criteria scored 1–5** (Impact, Creativity, Validity, Relevance, Presentation) and there are **10 Global Awards**. Relevance needs NASA data to be *core*.
- **There are no Gemini- or Jev-specific hackathon credits.** The Google offer is the generic GCP $300 / 90-day trial. Search grounding is paid only.
- **The architecture splits the work:** numbers from code, judgements from Jev, words from Gemini, a Jev "verify" pass over Gemini explanations, and probability shown as dither density.
- **Dither:** Bayer or blue noise for anything live (maps, globes, 3D); Floyd–Steinberg or Atkinson offline for stills. Anchor the pattern in texture space, linearise sRGB, never dither behind text, and keep a science view one click away.
- **MIT/Apache dither options are available** (`niccolofanton/dithering-shader`, `spargo`, `as-dithered-image`, `paper-design/shaders`). Avoid unlicensed repos, and keep GPL tools out of linked code.
- **Recommended top 3:** Flame in Freefall, Planet X & SPHEREx, Analog Sites.

## Open questions
1. Does the Local Lead read the "non-NASA Solution Materials must be OSI" rule as covering proprietary *APIs* (Jev, Gemini)? Should we ship the open fallback (Gemma 4 / heuristics) as the default path?
2. Are free-tier rate limits for `gemini-4-hydrogen` enough for a live judging demo? They are not published, so cache the demo.
3. What are TypeSafe's actual rate limits on a new account, and is there a free trial credit? Neither is documented.
4. Does the PSI (Physical Science Informatics) database need registration, and in what formats are combustion datasets and videos available?
5. What SPHEREx image or cutout service is live at IRSA, and how many epochs cover the test targets as of November 2026?
6. Is a dithered NASA image produced *by code* an "SI-generated image" that needs a watermark? It shouldn't be (no ML), but a Prithvi-generated mask probably is. Label conservatively.
7. Does the Space Apps brand-guidelines page (JS-rendered, unread) allow using the Space Apps logo in demos?
8. Can `gemini-decision-1` replace Jev entirely when video or audio must be judged? Its pricing beyond the free tier was not shown.
