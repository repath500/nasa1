# Cross-cutting findings: AI technology, Space Apps 2026 rules, dither UI, challenge ranking

Research date: 14 November 2026. Scope is the whole challenge set, not a per-challenge build plan. Every factual claim is marked **VERIFIED** (with a URL that was opened) or **UNVERIFIED**. Interpretation is labeled as such.

**Read this first.** The 2026 Project Submission Guide says SI tools may accelerate the build, and then: "SI should not be used to (come up with your idea of how to solve the challenge)." This file is background. The team has to choose and be able to explain the idea itself. — VERIFIED, https://www.spaceappschallenge.org/resources/project-submission-guide/

---

## A. AI technology, November 2026

### A1. Jev, the decision model

**VERIFIED. Jev exists.** It is not a rumor and it is not an LLM.

| Question | Finding | Status |
| --- | --- | --- |
| What it is | TypeSafe's flagship **System One** model. You send a `state` plus typed `questions`. It returns typed answers and probabilities. It does not write replies, code, or a rationale. The name refers to Kahneman's fast "System 1" judgments. Trained for calibrated decisions (RLCD is named on the models page). The same weights serve every account; there is no per-customer fine-tune. | VERIFIED: https://docs.typesafe.ai/concepts/system-one and https://docs.typesafe.ai/models |
| Who makes it | TypeSafe. Founder names and funding rounds were **not** on the official docs opened here. | Maker VERIFIED. People and funding **UNVERIFIED** in this pass. |
| Current models | `jev-1.14.0` (from 14 October 2026) and `jev-1.13.0`. Alias `jev-latest` points at 1.14.0 and is the SDK default. `jev-preview` currently points at the same 1.14.0 build. Pin a versioned id if a threshold was tuned against one release. | VERIFIED: https://docs.typesafe.ai/models |
| How to call it | `POST https://api.typesafe.ai/v1/systemone` with `Authorization: Bearer $TYPESAFE_API_KEY`. List models with `GET /v1/models`. | VERIFIED: https://docs.typesafe.ai/models and https://docs.typesafe.ai/introduction/quickstart |
| SDKs | Python package `typesafe-sdk` (`TypeSafeClient`, Python 3.10+). JavaScript/TypeScript package `@typesafe-ai/sdk` (Node 20+, or Node 22.18+ to run TypeScript directly). Both read `TYPESAFE_API_KEY`. Official agent skill: `npx skills add typesafe-ai/skills --skill typesafe-ai`. A browser Playground is documented; its exact URL was not copied out of the quickstart. | VERIFIED: https://docs.typesafe.ai/introduction/quickstart |
| Keys | The quickstart says to create a key in the TypeSafe console. A specific console hostname was **not** in the official pages opened here. Third-party guides name `console.typesafe.ai`. | Console-exists VERIFIED. Hostname **UNVERIFIED**. |
| Price | **$42 per billion input tokens ($0.042 per million).** Output tokens are free. Long context is the same per-token price. | VERIFIED: https://docs.typesafe.ai/models |
| Context | Default: **64k tokens per request** and **32k per question** (state plus that one question). No separate cap on the number of questions. Long context: send header `TypeSafe-Danger-Zone-Long-Context: true` and both limits become **262k**. Docs say long context is slower and less accurate. | VERIFIED: https://docs.typesafe.ai/models |
| Rate limits | **Per organization**, in tokens/second and requests/second, shown in the developer console. Over limit: `429` plus a `retry-after` header. SDKs retry by default. Higher limits are a sales request. A third-party page (`jevai.guide`) claims 250k tokens/sec and 1200 requests/min. **That number is not on the official models page. Do not plan against it.** | Policy VERIFIED. Any specific numeric cap **UNVERIFIED**. |
| Data handling | "Jev is not trained on customer requests or responses." Zero data retention is described as an enterprise option. | VERIFIED: https://docs.typesafe.ai/models |

**Inputs.** Natural-language text as a string, a JSON object, or an array. PNG and JPEG images anywhere in the request (state, instructions, or criteria), on both 1.14 and 1.13. **No native audio or video.** — VERIFIED, models page.

**Outputs.** One answer per question, in parallel, under the keys you chose. The response also names the versioned model and `usage.input_tokens` / `usage.output_tokens`.

| Primitive | You ask | You get | Since |
| --- | --- | --- | --- |
| `noul` | Is this statement true? | `noul`: probability of yes, 0–1. The quickstart example has **no confidence field** on noul. | 1.13 and 1.14 |
| `choice` | Which option? | `choice`, a probability for every option, and `confidence`. | 1.13 and 1.14 |
| `score` | Where on this ordered rubric? | A position that can fall between levels, a `legend`, per-level probabilities, and `confidence`. | 1.13 and 1.14 |
| `box` | Where is this in the image? | `top`, `bottom`, `left`, `right` as fractions of the image, plus `confidence`. | **1.14 only.** The API examples require header `TypeSafe-Danger-Zone-Images: true`. |

VERIFIED: https://docs.typesafe.ai/concepts/system-one, https://docs.typesafe.ai/introduction/quickstart, and the System One API page at https://docs.typesafe.ai/api/system-one.

**Good uses in a Space Apps project**

- Rank a closed set the team defined: landing sites, crop rotations, combustion papers, analog sites.
- Gate an action: "is this hotspot a fire rather than a flare?" as a probability the UI can threshold.
- Score a rubric the team wrote (scientific value vs. mass, soil benefit vs. water use) and let ordinary code apply the hard constraints.
- Localize a feature in a still image with `box` (a crater rim, a flame, a rover).

**Bad uses**

- Captions, stories, code, or "explain why." There is no rationale field. Asking for one is using the wrong model.
- Audio, video, or PDFs. Send a transcript or a still frame, or use Gemini for that perception step.
- Open-ended planning where the model invents the options. The options have to be in `criteria`.
- Anything that must be correct one case at a time. The docs say calibration is measured across groups of predictions and does not guarantee one answer.

Third-party gateways (OpenRouter, Mixen, VectorAxis) advertise a Jev proxy. **UNVERIFIED here.** Use `api.typesafe.ai` unless the team has tested another gateway.

### A2. Gemini 4 Hydrogen (`gemini-4-hydrogen`)

**VERIFIED. It launched 12 November 2026.** Google's blog, by Koray Kavukcuoglu, describes it as the fast Gemini 4 model for everyday coding and agentic work. Frontier siblings named in that post are **Gemini 4 Carbon** and **Gemini 4 Argon**. The DeepMind model card says Hydrogen is adapted from Carbon. — VERIFIED: https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-hydrogen/ and the model card linked from https://aistudio.google.com/docs/models/gemini-4-hydrogen.

Stable model id: `gemini-4-hydrogen`. Latest-update line on the model page: November 2026.

**Modalities, from the official model page**

| | Support |
| --- | --- |
| Input | Text, image, video, audio, PDF. Cloud docs also list Office and OpenDocument files (`.docx`, `.pptx`, `.xlsx`, `.odt`, and related) inline or from Cloud Storage. |
| Output | **Text only.** |
| Image generation | **Not supported.** |
| Audio generation | **Not supported.** |
| Context | Unified input+output window of **1,048,576** tokens. |
| Max output | **65,536** synchronous by default, up to **1,048,576** with long decode (minus input). Output counts thinking, function calls, and the final text. |

VERIFIED: https://aistudio.google.com/docs/models/gemini-4-hydrogen and https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/guides/gemini-4-hydrogen.

**Live API vs streaming.** The model page marks **Live API: Not supported.** Do not plan a bidirectional voice or video session on Hydrogen. Long decode can be streamed or run in the background (`background=true`, `continuation_token`); that is ordinary generation streaming, not the Live API. — VERIFIED, model page and the Cloud developer guide. A separate live model id was not confirmed in this pass (the `gemini-3.8-live` docs URL returned an app shell, not the article). Treat any live-voice substitute as **UNVERIFIED** until someone opens it in AI Studio.

**Other capabilities on the model page**

- Function calling: supported.
- Structured outputs: supported.
- Grounding with Google Search: supported, **paid tier only**.
- Grounding with Google Maps: supported, **paid tier only**.
- Code execution, computer use, file search, URL context: supported.
- Agentic video understanding: supported, and it **defaults to static** (off until you turn it on).
- Thinking levels: `low`, `medium`, `high` (default), `xhigh`.
- Context caching: **implicit only**. Explicit caching is not supported. Implicit caching applies to shared prefixes of 4,096 tokens or more.
- Batch, Flex, and Priority inference: supported.
- Knowledge cutoff on the model card highlight: March 2026. — That date is from the model-card extract. The blog post itself was read in full and does not restate the cutoff. Treat March 2026 as VERIFIED via https://deepmind.google/models/model-cards/gemini-4-hydrogen/ if the card still says so when reopened; it was not re-read line by line after the search extract.

**Price.** Flat across the whole 1M window. — VERIFIED, https://aistudio.google.com/docs/pricing and the 12 November blog.

| | Free tier | Paid, per 1M tokens |
| --- | --- | --- |
| Input | $0 | $1.50 |
| Output, including thinking | $0 | $7.50 |
| Cached input | $0 | $0.075 (implicit only) |
| Google Search grounding | Not available | 5,000 free search requests per month, shared across Gemini 3 and newer, then $14 / 1,000. Daily cap 1,500. |
| Google Maps grounding | Not available | 5,000 free requests per month, shared, then $14 / 1,000. |
| Used to improve Google's products | **Yes** | **No** |

Free-tier content can be used to improve Google's products. Do not send anything that is not already public. NASA open data is public; still say so in the submission.

**Rate limits.** Official page: limits are RPM, input TPM, and RPD, **per project**, not per key. RPD resets at midnight Pacific. The static page tells you to read the live numbers in AI Studio and says specified limits are not guaranteed. The only Hydrogen numbers printed in that page's batch section are **batch enqueued tokens**: 3,000,000 (Tier 1), 400,000,000 (Tier 2), 1,000,000,000 (Tier 3). Interactive RPM/TPM/RPD for Hydrogen are **not published** on that page. A blog claiming 5 RPM / 250k TPM / 20 RPD is **UNVERIFIED** and should not be treated as quota. — VERIFIED absence: https://aistudio.google.com/docs/rate-limits.

**Hackathon credits.** The Space Apps "Global Offers" page exists and the FAQ says offers were posted 13 November, but the page is login-gated, so no credit amount was confirmed. — Page: https://www.spaceappschallenge.org/2026/global-offers/ and https://www.spaceappschallenge.org/resources/participant-faqs/. A specific Google Cloud trial dollar amount is **UNVERIFIED** in this pass. Practical plan: use the Hydrogen free tier for text, and link billing (Tier 1) if the demo needs Search grounding or more than the unpublished free quota. A weekend of Hydrogen at $1.50 / $7.50 per million tokens is cheap next to a failed demo. Check the project's own limits in AI Studio on Saturday morning.

**Blog figures worth quoting only as Google's own claims, not as independent benchmarks.** At default high thinking, Hydrogen scored 51 on the Artificial Analysis Intelligence Index against Argon's 50, and 54 at `xhigh`. Google says it is 2.5× faster than Gemini 3.8 Flash at the high setting and more than triples that model's Terminal-Bench 4.1 score (57% vs 18.2%). — VERIFIED as Google's claims: the 12 November blog. Not re-run here.

### A3. Closest verified alternative if Jev is down: Gemini Decision 1

**VERIFIED. This is a real Google model, and it is the closest match to Jev.** Model id `gemini-decision-1`. It is a decision model, not a chat model. It uses the same three question names (`noul`, `choice`, and a rubric/score) and returns probabilities with **zero output tokens**.

- Endpoint: `POST https://generativelanguage.googleapis.com/v1beta/decisions` with header `x-goog-api-key`. Python: `google.genai` `client.decisions.create`. JS: `@google/genai`.
- Inputs: **text, image, video, audio, and PDF**, up to **262,144** tokens. Up to **1,000** questions in one request. Shared input is billed once.
- It does **not** document a `box` localizer. Jev 1.14 does. If the team needs a bounding box, Jev is the verified tool; Decision 1 is the verified multimodal ranker.
- Price: free tier $0. Paid **$0.10 per million input tokens**. Output is $0 because there is none.
- Free-tier limits, printed on the rate-limit page: **200 RPM, 50,000 TPM, 10,000 RPD.** Tier 1: 1,500 RPM, 1,000,000 TPM, 50,000 RPD. Batch API is not supported.

VERIFIED: https://aistudio.google.com/docs/models/gemini-decision-1, the pricing section at https://aistudio.google.com/docs/pricing, and https://aistudio.google.com/docs/rate-limits.

For a 48-hour Space Apps build, **Gemini Decision 1 plus Gemini 4 Hydrogen is the lower-risk pair**: one key, a published free quota on the decision model, and multimodal state. Jev is cheaper per text token ($0.042 vs $0.10 per million) and adds image boxes, but its quota is unpublished and it cannot see video, audio, or PDFs. Use Jev when the state is text or a still image and the team has a key that works on Saturday. Keep Decision 1 as the drop-in if that key fails. Do not run both and pick the prettier answer.

### A4. Other 2026 models and tools

| Tool | What it actually is | Access and license | Fit this weekend | Status |
| --- | --- | --- | --- | --- |
| **Prithvi-EO-2.0** | Geospatial foundation model from IBM, NASA, and Jülich. ViT masked autoencoder on HLS v2, 30 m, six bands (Blue, Green, Red, Narrow NIR, SWIR 1, SWIR 2), 4.2M samples. Sizes include tiny-TL, 100M-TL, 300M, 300M-TL, 600M, 600M-TL. Fine-tune with TerraTorch. | Weights Apache-2.0 on Hugging Face. Code MIT: https://github.com/NASA-IMPACT/Prithvi-EO-2.0. Paper: https://arxiv.org/abs/2412.02732 | Too heavy to train here. A precomputed embedding or an existing fine-tune (flood, crop, burn scar) can be a feature for Jev/Decision 1. Not a captioner. | VERIFIED: https://huggingface.co/ibm-nasa-geospatial/Prithvi-EO-2.0-300M |
| **Prithvi WxC 1.0** | 2.3B weather and climate model on 160 MERRA-2 variables. Two checkpoints: generic masked reconstruction, and a 6-hour autoregressive rollout. Fine-tunes exist for downscaling and gravity-wave parameterization. | Open weights on Hugging Face. Code: https://github.com/NASA-IMPACT/Prithvi-WxC. Announced 23 September 2024 by IBM and NASA. | Not a 48-hour train. Useful as a cited model if a challenge is about weather fields (farms, trends). Do not claim a live forecast unless the checkpoint was actually run. | VERIFIED: https://huggingface.co/ibm-nasa-geospatial/Prithvi-WxC-1.0-2300M and https://newsroom.ibm.com/2024-09-23-ibm-and-nasa-release-open-source-ai-model-on-hugging-face-for-weather-and-climate-applications |
| **TerraMind 1.0** | IBM and ESA Φ-lab "any-to-any" generative Earth-observation model (tiny through large). Integrated with TerraTorch. ImpactMesh fine-tune targets floods and wildfires. | Apache-2.0. https://github.com/IBM/terramind and https://huggingface.co/ibm-esa-geospatial | Same constraint as Prithvi: use a published checkpoint, do not train. Stronger story on SAR/optical fusion (Dancing with the SARs, hot spots) if someone has already run it. | VERIFIED: IBM/ESA pages above. "8% better" is IBM/ESA's claim, not re-measured here. |
| **Clay v1.5** | Open EO foundation model. Imagery plus location and time in, embeddings out. | Code and weights Apache-2.0. Docs CC-BY. Embeddings of the training set ODC-BY. https://clay-foundation.github.io/model/ | Embeddings for "find places like this" on the analog challenge. | VERIFIED: Clay docs and https://github.com/Clay-foundation/model |
| **INDUS / INDUS-SDE** | NASA-IMPACT and IBM **encoder**, about 125M parameters, not a chatbot. INDUS-SDE v0.2 was further pretrained on Science Discovery Engine web text with weighted dynamic masking. A sentence-transformer sibling, INDUS-SDE-ST, is for semantic search. NASA's AI/ML news (September 2026) says INDUS is the language-model piece of SMD's "5+1" foundation-model plan, and that INDUS-SDE is being integrated into SDE. | Weights on Hugging Face under `nasa-impact`, including `nasa-impact/indus-sde-v0.2`. Code: https://github.com/NASA-IMPACT/mlm-fine-tuning | Use it to **retrieve** NASA pages, then let Hydrogen explain the hits. Do not ask INDUS to write the UI copy. | VERIFIED: https://huggingface.co/nasa-impact/indus-sde-v0.2, https://science.data.nasa.gov/blog/indus-sde-language-model, https://www.nasa.gov/ai-astrobiology/ai-ml-news/ |
| **Science Discovery Engine** | SMD search across astrophysics, biological and physical sciences, Earth science, heliophysics, and planetary science: datasets, docs, code, models, images. Built with NASA-IMPACT. | https://science.data.nasa.gov/science-discovery-engine and the search UI at https://science.data.nasa.gov/science-discovery-engine/search/sde/home | The right "find the dataset" index for the trend, analog, and flame challenges. A public write API was **not** confirmed. | Product VERIFIED. A hackathon-friendly API is **UNVERIFIED**. |
| **Gemma 4** | Google open-weight multimodal family, Apache 2.0, released on Hugging Face 2 April 2026. Image and text in, text out. E2B, E4B, and the 12B Unified variant also take audio. Sizes: E2B (2.3B effective), E4B (4.5B effective), 12B Unified, 31B, 26B-A4B MoE (4B active). Context 128k on the small models, 256k on the larger ones. Runs in transformers, llama.cpp, MLX, and WebGPU. | https://huggingface.co/blog/gemma4 | The honest **offline fallback** if API keys fail during judging. E2B/E4B can caption a map tile in the browser. It will not match Hydrogen. Say that in the submission. | VERIFIED: the Hugging Face Gemma 4 post. |
| **MCP** | Model Context Protocol. Anthropic donated it in December 2025 to the Linux Foundation's Agentic AI Foundation (with Block and OpenAI; Google, Microsoft, AWS, Cloudflare, Bloomberg supporting). Current spec revision **2026-07-28** is a stateless JSON-RPC protocol: tools, resources, prompts. Streamable HTTP is POST-only; the old session GET stream was removed. Tier-1 SDKs: TypeScript, Python, Go, C#. | https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation and https://blog.modelcontextprotocol.io/posts/2026-07-28/ | A thin MCP server in front of one NASA API (FIRMS, DONKI, Horizons, Earthdata) is a credible "Best Use of Technology" detail. Do not spend the weekend on an agent framework. Hydrogen already has function calling; point those functions at the APIs directly. | VERIFIED: the two URLs above. |
| **On-device / WebGPU** | WebLLM (MLC, Apache-2.0, https://github.com/mlc-ai/web-llm) compiles models to WebGPU. Transformers.js runs ONNX, including Gemma 4, with a WASM fallback. Chrome's built-in Prompt API (`LanguageModel`) exposes Gemini Nano where the browser has it; that availability is machine-dependent. | Confirm each model's license in its repo before shipping. Gemma 4 is Apache 2.0. | Use for a "still works with the network off" path on one screen. A 2–4B model can describe a tile. It should not be the ranker. | Gemma-on-WebGPU VERIFIED via the HF post and WebLLM release notes that add Gemma 4 E2B. Nano availability **UNVERIFIED** per machine. |

Other geospatial names (AlphaEarth embeddings, SatMAE, DOFA) were not re-checked line by line. Do not cite them until someone opens the card. Qwen and Llama vision checkpoints exist in the ecosystem; this pass did **not** re-verify a specific November 2026 checkpoint, so they are not in the table.

### A5. Reference architecture

Jev (or Gemini Decision 1) **decides**. Hydrogen **sees and explains**. Ordinary code **enforces physics and policy**. The dither UI **shows the evidence**, not a fake chain of thought.

```text
NASA / partner data
  Horizons, FIRMS, PSI, SVS frames, Earthdata, PDS, DONKI
        |
        v
Deterministic prep
  tiles, time series, a small JSON "case file"
  (site, date, numbers, image urls, the user's priorities)
        |
        +---------------------------+
        |                           |
        v                           v
Gemini 4 Hydrogen              Jev 1.14  or  gemini-decision-1
  image / PDF / short video      state = the case file
  structured output:             questions the TEAM wrote:
    objects, units, citations      choice  -> which option
    a plain-language caption       score   -> rubric the team defined
                                   noul    -> a yes/no the UI can threshold
                                   box     -> Jev only, still images
        |                           |
        +------------+--------------+
                     v
              Application code
                hard constraints (mass, sun angle, a Mann-Kendall test)
                threshold on confidence
                if confidence is low, say so and show the runner-up
                     |
                     v
              Dither UI
                imagery is dithered
                the decision, the probability, and the caption are not
                caption is labeled "written by Gemini from these inputs"
                rank is labeled "Jev" or "Gemini Decision 1"
```

Rules for the wiring:

1. Hydrogen does not get to invent the winner. If a ranking is on screen, it came from the decision model or from a statistical test.
2. The decision model does not get to invent the caption. If a sentence is on screen, it came from Hydrogen or from a template, and it is allowed to use only fields that are in the case file.
3. Low confidence is a feature. Show the probability and the next-best option. Judges score Validity.
4. Log `response.model` (Jev) or the Gemini model id next to every call, and put that log in References.
5. Ship a no-key path: a baked case file plus Gemma 4 or a hand-authored ranking, labeled as the fallback.

---

## B. Space Apps 2026 rules

Primary documents, all opened on 14 November 2026:

- Project Submission Guide: https://www.spaceappschallenge.org/resources/project-submission-guide/
- Judging and Awards Guide: https://www.spaceappschallenge.org/resources/judging-awards-guide/
- Participant FAQs: https://www.spaceappschallenge.org/resources/participant-faqs/
- Participant terms: https://www.spaceappschallenge.org/legal/
- Space Apps brand page: https://www.spaceappschallenge.org/brand/
- Navigator terms (logo language, written for navigators but it restates NASA's own rule): https://www.spaceappschallenge.org/navigator-terms-conditions/
- NASA Brand Guidelines: https://www.nasa.gov/nasa-brand-center/brand-guidelines/
- NASA Brand Center: https://www.nasa.gov/nasa-brand-center/
- GO Team clarifications: https://github.com/nasa/spaceapps/discussions/1849 and https://github.com/nasa/spaceapps/discussions/1947

The FAQ's "resources" index returned HTTP 500 during an earlier fetch. The two guide URLs above returned the full text via curl and are the ones to trust.

### B1. SI / AI policy

The FAQ adopts the 29 September 2026 executive-order wording: the executive branch says "Super Intelligence" and "SI" instead of "AI." SI includes large language models, assistants, image and video tools, foundation models, and code generation. Use is allowed. The submission must describe how SI was used. — VERIFIED, participant FAQ.

The Project Submission Guide is stricter and is the text to follow:

- SI should **not** be used to come up with the idea of how to solve the challenge.
- Generated content may not use, contain, or modify NASA branding or design elements (logos, flags, mission identifiers).
- Images and videos: a **visible watermark** that they are SI-generated.
- Audio: acknowledge SI generation in descriptive text and metadata.
- Code and data: acknowledge SI generation in descriptive text and metadata.
- The form question "Did you utilize any SI tools?" is **for data collection only and is not shown to judges.** Judges do see watermarks, captions, and metadata, and they score originality, intent, and execution on the SI-assisted work that is visible.

So: answer the form honestly, and also label the work in the project itself. Hiding the use because "judges don't see that field" would still fail the watermark rule.

The 6 November GitHub reply from the GO Team says the same watermark rules and adds that judges consider originality, intent, and execution in the context of AI-assisted work. The 12 November reply accepts a visible line such as "Animation: AI-generated with Claude · Photos: NASA" on the generated parts, and says unaltered NASA photographs are generally acceptable even when a historical flag is in the photograph. Do not *generate* a flag, a meatball, a worm, or a mission patch.

### B2. NASA data and open source

- Global Judging eligibility includes using NASA data meaningfully. The submission guide's Relevance score of 5 is "NASA data is integral," not a footnote. — VERIFIED, judging guide.
- The guide's data field: "To be eligible for a Global Award, you must use at least one NASA data or resource." — VERIFIED, submission guide.
- The GO Team, on 6 November, was tighter: at least one NASA data source **included with the Resources of that challenge**. Other listed NASA and partner data is encouraged. — VERIFIED, discussion 1849.
- **Do the stricter thing.** Use at least one resource from the challenge's own Resources list, and name it in the NASA Data field.
- Terms: if the solution needs non-NASA materials (a dataset or code that does not come from NASA or a partner), those "Solution Materials" must be freely and publicly available, or OSI-licensed (https://opensource.org/licenses). Every source, including open-source ones, must be cited in References. NASA can remove a project, a nomination, or an award for missing citations. — VERIFIED, https://www.spaceappschallenge.org/legal/
- Whether a proprietary API *call* counts as redistributing the model is **an interpretation, not a sentence in the terms**. Safest reading: cite Jev and Gemini in References, do not vendor their weights, and keep a fallback that runs under an OSI license (Gemma 4 is Apache 2.0).
- NASA media: US government works are generally not copyrighted unless noted, but the insignia, logotype, and seal are restricted by 14 CFR 1221. Do not imply NASA endorsement. Partner-agency and some processed imagery (the brand pages and the Wikimedia NASA template both flag Hubble and partner cases) can be under someone else's terms. Credit the source next to the picture. — VERIFIED: https://www.nasa.gov/nasa-brand-center/brand-guidelines/ and the legal text above.

### B3. Judging

Scored **1 to 5** at local, universal, global, and executive levels. — VERIFIED, judging guide.

| Criterion | What a 5 means, shortened from the guide |
| --- | --- |
| Impact | A significant problem, a real proposed solution, a wide reach. |
| Creativity | A new approach, or a meaningful improvement, not a reskin. |
| Validity | Scientifically sound, technically feasible, actually usable. |
| Relevance | Answers **this** challenge, and NASA data is core. |
| Presentation | The demo **and** the full project. The guide says teams under-invest here. |

Phases and dates from the judging guide:

- Phase 1, Global Nominees: announced **3 December 2026**. Universal Event nominees are proportional to local-event nominees.
- Phase 2, Global Finalists and Honorable Mentions: announced **17 December 2026**.
- Phase 3, ten Global Awards, announced **26 January 2027**, plus a virtual Winner's Celebration.

The ten awards:

1. Best Use of Science
2. Best Use of Data
3. Best Use of Technology
4. Galactic Impact
5. Best Mission Concept
6. Most Inspirational
7. Best Storytelling Award
8. Global Connection Award
9. Art & Technology Award
10. Local Impact Award

Team size: local events, 1 to 6 people, all registered for that event and not waitlisted. Universal Event, **2 to 6**. One challenge per team. — VERIFIED, FAQ and judging guide.

The judging guide also says teams are reviewed for prohibited bilateral activity with China or a Chinese-owned entity before Global Judging, under NASA's China funding restriction. Eligibility is NASA's call. Read the terms before assuming a team composition is fine. — VERIFIED, judging guide.

### B4. What to submit

Project tab on the team page. Opens **Saturday 14 November, 9:00 a.m.** local event time (Universal: Team Owner's residence). Closes **Sunday 15 November, 11:59 p.m.** the same way. Late saves are not judged. — VERIFIED, submission guide and https://www.spaceappschallenge.org/2026/.

Required shape:

- High-level summary.
- **Project demo: a video of 30 seconds or less, or a slide deck of at most 7 slides including the title and intro slides.** Over the limit and the project is not eligible for Global Judging. Host it on YouTube, Drive, GitHub, or similar. The link must work with no login. The site will not accept a video upload.
- Link to the final project, also public, no login.
- Detailed description, including tools.
- The SI question.
- NASA data field.
- References: every dataset, library, model, image, and partner resource.
- Two checkboxes: terms, and "this is our original work and everything external is listed."
- English on the project page and in linked materials. A demo video may be spoken in another language **with English subtitles**. Slides must be English.
- No image, video, audio, or likeness of anyone under 18.

The guide's 30-second scaffold: 0:00 names, 0:02 the challenge, 0:05 title and tagline, 0:10 how it works and which NASA data, 0:20 what it could become.

Images on the project page itself: JPG, PNG, GIF, up to 10 MB. No video or document upload there.

### B5. NASA brand and the meatball

Do not draw, generate, or place the NASA insignia ("meatball"), the NASA logotype ("worm"), or the NASA seal. They are not a hackathon texture. 14 CFR 1221 and the brand center: the insignia, logotype, and seal may not be used without explicit permission, and not in a way that implies NASA made or endorses the project. Text that mimics the worm letterforms is also not permitted on NASA's own materials; do not imitate them.

The worm was the official logotype from 1976 to 1992, designed in 1975 by Richard Danne and Bruce Blackburn, then retired when the meatball returned. That history is on the brand guidelines page. It is not a license to use the mark.

Use the **NASA Space Apps** logo if a mark is needed, and follow https://www.spaceappschallenge.org/brand/. That page's palette is blues plus a neon yellow accent, with a stated 4.5:1 contrast minimum. It names Phosphor or Feather-style icons. Exact hex values were not in the text extracted here, so they are not invented below.

The word "NASA" may appear in a factual credit ("data: NASA FIRMS") and in "NASA Space Apps." It may not be used to make the project look like a NASA product.

---

## C. A dither UI that still looks like mission control

The target is print discipline: one dark ink, one paper, one accent that means something, type that is not dithered. Retro kitsch (CRT scanlines, fake phosphor bloom, a worm wordmark) fights both the brand rules and the judging criterion of Validity.

### C1. Techniques

| Method | How it works | When to use it |
| --- | --- | --- |
| **Bayer / ordered** | Each pixel is compared with a fixed threshold matrix (4×4, 8×8). Pixels do not depend on each other. | Live maps, video, globes. Stable from frame to frame, so the image does not swim. Maps directly to a fragment shader. |
| **Floyd–Steinberg** | Error diffusion. The quantization error is pushed to neighbors at 7/16, 3/16, 5/16, 1/16. | Still exports and hero images. Fine grain. Flickers if you run it independently on every video frame. |
| **Atkinson** | Bill Atkinson's Macintosh kernel. Error goes to six neighbors at 1/8 each, and **two eighths are thrown away**. Highlights and shadows stay punchy. | Terrain rims, flames, type-like imagery where you want contrast more than smooth gray. |
| **Halftone** | Clustered-dot screen. Dot size carries the tone. Classical print, often one angle per ink. | A "plate" or print-export mode. Expensive and moiré-prone on a rotating globe. Offer it as a still, not as the live camera. |
| **Blue noise / void-and-cluster** | Ordered, but the thresholds are a blue-noise mask instead of a Bayer crosshatch. | When Bayer's grid is too obvious and error diffusion is too slow. `image-to-pixel` includes it. |

Real-time path: a fullscreen triangle and a fragment shader. Quantize to 1-bit or to a 3–4 level ramp, add the Bayer threshold in screen space, write the paper color or the ink color. Animate the *data* (a time slider), not the matrix. A moving matrix looks like noise and breaks `prefers-reduced-motion`.

### C2. Libraries

| Repo | What it covers | License | URL |
| --- | --- | --- | --- |
| `image-to-pixel` (Tezumie) | 16 methods: Bayer 2–16, clustered dot, blue noise, Floyd–Steinberg, Atkinson, Sierra, Burkes, Jarvis, Stucki. WebGL2, with a matching CPU path. npm `image-to-pixel`. | MIT | https://github.com/Tezumie/Image-to-Pixel |
| `ditherdance` | ImageData dithering (Floyd–Steinberg, Atkinson, Bayer, and others) plus a WebGL Bayer gradient element. About 2 kB and 8 kB gzipped. | Apache-2.0 | https://github.com/biering/ditherdance |
| DitherSpace | Real-time Bayer 8×8 in WebGL; Floyd–Steinberg and Atkinson on the CPU. | MIT | https://github.com/landonjsmith/DitherSpace |
| ittybitty dither shader | WebGL2 ordered dither, palette stops, and a reduced-motion still frame. | MIT, stated on the shader page | https://ittybitty.dev/shaders/dither |
| CesiumJS | Globe and PostProcessStage for a screen-space dither. | Apache-2.0 | https://github.com/CesiumGS/cesium |
| deck.gl | Map layers. Post-process in luma.gl, or dither the canvas after the map draws. | MIT | https://github.com/visgl/deck.gl |
| three.js | EffectComposer + a ShaderPass. | MIT | https://github.com/mrdoob/three.js |

Cite whichever one ships, in the Space Apps References field, with the license. Palette files from Lospec that `image-to-pixel` bundles are other people's palettes; credit those authors too if you use a built-in palette.

### C3. Type

NASA's current brand guidelines specify **Helvetica** for the identifier and the web address, and **Helvetica and Garamond** for print. Helvetica is a Monotype retail face. Using it does not make a project a NASA product, and the team should not ship a NASA identifier at all.

The 1975 Graphics Standards Manual (Danne & Blackburn; the Wikimedia file is dated 1976, NHB 1430.2) is the worm-era grid: Helvetica, a modular layout, very little color. The original NASA manual is a US government work. The **2015 Standards Manual reissue** (Jesse Reed and Hamish Smyth, published by Standards Manual, LLC) is a commercial book. Its own product page says the reissue is not sponsored or endorsed by NASA, and that the seal, insignia, and logotype remain NASA's. Do not scan that book into the UI. A public-domain scan of the government manual is not a license to reproduce the worm.

Honest pairing for this project:

- UI: **Inter** or **Geist** (both SIL Open Font License; confirm the LICENSE file in the font repo).
- Numbers and coordinates: **IBM Plex Mono** or **JetBrains Mono** (SIL OFL).
- A serif only for a long caption, if needed: **EB Garamond** (OFL), used small.

Do not set body text in a dither. Dither the imagery. Keep labels in solid ink on solid paper so they pass contrast and screen readers.

### C4. Color

1-bit plus one accent. The accent is a data channel, not decoration. Proposed tokens below are original; they are not NASA's palette and they are not permission to use NASA red or NASA blue as a logo.

Rules:

- WCAG 2.2: body text at least **4.5:1** against its background. Large text at least 3:1. The Space Apps brand page states the same 4.5:1 floor.
- Never encode the only meaning in a dither pattern or in the accent hue. Repeat it as a number, a label, or a sentence.
- Offer a "solid" toggle that drops the dither for low vision and for screenshots.

### C5. Motion and accessibility

- `prefers-reduced-motion: reduce` freezes the shader on one frame. ittybitty already does this; copy that behavior.
- Do not loop a Bayer offset, a glitch, or a scanline.
- The live map uses ordered dither so tiles do not shimmer when the user pans. Error diffusion is for the still "export plate."
- Keyboard: every site, date, and layer is a control with a name, not only a hot spot on the canvas.
- The sonification challenge (Earth Information Jukebox) is the place to pair the image with sound. Everywhere else, a short text alternative is enough.

### C6. Imagery, maps, and globes

Satellite tiles and rover frames:

1. Draw the source image into a texture unchanged.
2. In the shader, convert to luminance, add `bayer(gl_FragCoord.xy) - 0.5`, threshold, write ink or paper.
3. Composite labels and the accent **after** the dither, in a DOM or a second pass that is not quantized.
4. For a time series, keep the matrix fixed. Change the texture.

Maps (deck.gl or a Leaflet/MapLibre canvas): same screen-space pass on the WebGL canvas. Do not pre-dither XYZ tiles on the server. Pre-dithered tiles crawl at tile boundaries and look broken at the next zoom.

Globes (Cesium `PostProcessStage`, or three.js `ShaderPass` on a globe mesh):

- Screen-space Bayer stays crisp and cheap. It is the right default.
- It is not glued to the terrain, so rotating the globe moves the dots. That is acceptable if the matrix is fine (4×4 or 8×8) and the motion is slow.
- Object-space dither (a noise function of lat/lon) sticks to the ground but aliasing gets worse at the limb. Only worth it if the demo is a slow orbit.
- Halftone on a globe moirés. Keep it for a flattened print view.
- One accent, screen-space, for the quantity that matters: Earth-visibility, a fire anomaly, a route. The terrain stays ink on paper.

### C7. Three style directions

These are proposals, not a brand kit. Tokens are concrete so a UI pass can start without inventing a fourth palette.

#### 1. Plate

Mission-control print. For Flame in Freefall, the mission-design game, and the junior trainer.

| Token | Value |
| --- | --- |
| Paper | `#F3F0E8` |
| Ink | `#161616` |
| Accent | `#C2410C`, used only for the live alert or the selected option |
| Font | Inter for UI, IBM Plex Mono for numbers |
| Grid | 8 px. Type sizes 13 / 15 / 22 / 40. Line length under 68 characters. |
| Dither | Bayer 4×4, static, on imagery only |
| Motion | None. Selection is a 2 px solid rule. Reduced motion is the default. |

#### 2. Horizon

South-pole operations. For the lunar navigator and the Moon/Mars analog map.

| Token | Value |
| --- | --- |
| Paper | `#101210` |
| Ink | `#E7E4DC` |
| Accent | `#7EB6FF`, used only for an Earth-visibility or communication window. It is not NASA blue and it is not a meatball. |
| Font | Inter, with JetBrains Mono for coordinates and elevations |
| Grid | 12 columns, 24 px margins, lots of empty paper. One map, one readout. |
| Dither | Atkinson on still terrain renders (keeps rims bright). Bayer 8×8 in the live globe. |
| Motion | Sun elevation as a slow mask, 12 seconds, linear. Under reduced motion, a static frame plus the numeric elevation. |

Check the light-on-dark pair. `#E7E4DC` on `#101210` is a high contrast for text. The blue accent on that paper needs a contrast check before it is used for small type; prefer the accent for strokes and large numerals, and use ink for sentences.

#### 3. Field note

Earth science, one heat accent. For farms, hot spots, SAR change, and trend detective.

| Token | Value |
| --- | --- |
| Paper | `#F6F3EC` |
| Ink | `#1C1915` |
| Accent | `#B45309`, anomalies only (a month above the median, a bare field, a subsiding pixel) |
| Font | Inter, EB Garamond for a single caption under a plate, IBM Plex Mono for the calendar counts |
| Grid | 4 px baseline. Charts share the map's paper color. |
| Dither | Bayer 8×8 on the live map. Floyd–Steinberg on the exported still. Halftone only in that export. |
| Motion | Time scrubber moves the data. The matrix does not move. Reduced motion disables any residual fade. |

---

## D. Portfolio: all 14 challenges

Scores are 1–10, higher meaning better for **this** team (dither UI, a decision model plus a multimodal model, a 48-hour build, a real shot at an award). "Room" is 10 when the field is likely thinner. Competition is a judgment from the challenge level and how often similar projects win, not a headcount.

| # | Challenge | AI | Dither | Data | Room | Award | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Flame in Freefall | 10 | 9 | 7 | 8 | 9 | The brief asks for an SI dashboard that summarizes, **ranks**, and interprets. That is the architecture in A5. |
| 2 | Lunar Landing Site Navigator | 9 | 9 | 8 | 6 | 9 | A real decision: site × date, sun and Earth. Horizons and LOLA are enough for a 48-hour core. |
| 3 | Moon-base and Mars analogs | 9 | 8 | 7 | 6 | 8 | Jev or Decision 1 **is** the product: a similarity score across geology, temperature, ice, operations, with an explicit "where the analogy breaks." |
| 4 | Martian Map | 7 | 10 | 8 | 5 | 8 | Best imagery for dither. AI is mostly a narrator unless the route is a ranked choice. Mars maps are a crowded genre. |
| 5 | Adapting Farms | 9 | 7 | 6 | 5 | 8 | A decision tool the brief already frames as SI. Data fusion across SMAP, GPM, Landsat, POWER, and soils is the schedule risk. |
| 6 | Earth Information Jukebox | 7 | 8 | 9 | 4 | 8 | SVS frames are easy. Gemini reads a frame; a synth plays it. Dither can be the visual half. Arts challenges draw a crowd. Strong Art & Technology path. |
| 7 | Space Mission Design Game | 8 | 8 | 5 | 4 | 7 | Jev fits trade-offs. The brief wants a game more than a dataset. Easy to look like a reskin of Kerbal unless the numbers are real. |
| 8 | Junior Astronaut Mission Trainer | 7 | 6 | 8 | 3 | 7 | DONKI and OSDR are real. Ages 7–12 plus a harsh 1-bit UI is a tension. Youth games are crowded. No likenesses of minors. |
| 9 | Discarded equipment storytelling | 6 | 8 | 9 | 3 | 7 | NSSDCA is a gift. The risk is an SI-written story, which the rules tell judges to read for originality. Dither documentary can still win Storytelling if the team authors the story. |
| 10 | MODIS and VIIRS hot spots | 6 | 5 | 9 | 5 | 7 | FIRMS is the most demo-ready API in the set. The core is a statistical harmonization, not a model. The brief asks for accessible color ramps, which fights 1-bit unless the accent carries the anomaly and the ramp is a second view. |
| 11 | Dancing with the SARs | 6 | 9 | 5 | 6 | 7 | SAR speckle and dither are a genuine visual idea. NISAR processing in 48 hours is the risk. Pick one place and one change type. |
| 12 | Planet X and SPHEREx | 5 | 7 | 6 | 7 | 7 | Advanced, so fewer teams, but 102 bands and a public sky tool is a lot of plumbing. Decision models do not help until the team has candidate detections to rank. |
| 13 | Earth System Trend Detective | 5 | 4 | 8 | 6 | 6 | Giovanni and AppEEARS already make time series. The required piece is a trend test. SI is optional in the brief. Dither does little for a line chart. |
| 14 | Health monitoring | 4 | 6 | 4 | 5 | 4 | Validity risk. A model should not diagnose. HRP pages are essays more than streams. A clinical-looking dither UI can imply a medical device the team does not have. |

### Top 3

**1. Flame in Freefall.** The challenge text asks for ranking and interpretation of a large experimental record (PSI: BASS, Saffire, FLEX, SAME, ACME). Jev or Gemini Decision 1 ranks investigations against a rubric the team writes (oxygen fraction, material class, relevance to a 30% oxygen Moon-base atmosphere). Hydrogen reads the PSI pages and figures and writes a sourced brief. Microgravity flames are already high-contrast, so Plate or Horizon dither looks like a scientific plate rather than a filter. The field should be thinner than Mars-map and kids-game challenges. Award path: Best Use of Science and Best Use of Technology. Risk: PSI is big; the MVP is a curated set of investigations, not the whole archive.

**2. Lunar Landing Site Navigator.** This is a decision product with a clock. Inputs are a site and a date. Outputs are solar elevation, time to sunset, Earth visibility, and a ranked shortlist. Horizons (or a cached ephemeris) plus a simple horizon from LOLA is a believable 48-hour core; a full south-pole illumination model is the stretch. Horizon style (direction 2) is the UI. Award path: Best Mission Concept and Best Use of Technology. Risk: Moon tools are popular, so the demo has to be faster than Quickmap, not prettier than it.

**3. Earth analogs for Moon bases and Mars.** The brief invites a similarity metric or an ML ranking, and it asks the team to say where the analogy fails. That is a `score` per dimension (geology, temperature, ice, dust, operations) plus a `noul` for "useful analog for this purpose," with Hydrogen comparing a pair of images and writing the caveat. Dithered side-by-side plates (Field note or Horizon) keep the comparison scientific. Award path: Best Use of Science and Galactic Impact. Risk: global search is too big; pick one lunar target (a south-pole ridge or a PSR-adjacent site) and rank a short list of Earth candidates the team can actually show.

**If the team wants the dither to be the point of the project,** the Earth Information Jukebox is the alternate: a frame is dithered, the same luminance field drives a synth, and Hydrogen only writes the alt text. That is an Art & Technology entry. It is a weaker use of a decision model.

**Do not start with health monitoring** unless a clinician on the team will own every threshold. A probability next to a diagnosis is a Validity problem, not a feature.

---

## Key findings

- Jev is real: TypeSafe System One, `POST https://api.typesafe.ai/v1/systemone`, models `jev-1.14.0` and `jev-1.13.0`, $0.042 per million input tokens, output free, text and JPEG/PNG in, probabilities out, no prose. Box localization is 1.14 only. Numeric rate limits are not published.
- Gemini 4 Hydrogen is real, launched 12 November 2026, id `gemini-4-hydrogen`. Text, image, video, audio, and PDF in; text out. 1M unified context. Function calling, structured output, and grounding are supported. **Live API is not.** Image and audio generation are not. Free tier exists; Search grounding is paid-only; interactive RPM is not printed on the rate-limit page.
- The closest verified substitute for Jev is **`gemini-decision-1`**: same idea (noul, choice, rubric), plus video, audio, and PDF, $0.10 per million input, free tier 200 RPM / 10,000 RPD. It has no documented box output.
- Prithvi-EO-2.0, Prithvi WxC, TerraMind, and Clay are real open geospatial models. They are feature extractors, not the decision layer, and they are not a weekend train. INDUS-SDE is a 125M encoder for NASA search, not a chatbot. Gemma 4 (Apache 2.0) is the verified on-device fallback.
- SI may help build the project. SI may not be the author of the idea. Watermark generated images and video. The SI form field is not shown to judges; the watermarks are.
- Global Award path: at least one NASA resource, preferably one listed on that challenge, cited. Demo is a public 30-second video or a public 7-slide deck. Judging is Impact, Creativity, Validity, Relevance, Presentation, each 1–5. Ten global awards. Winners announced 26 January 2027.
- Do not use the meatball, the worm, or the seal. Do not imitate the worm's letterforms. The 2015 Graphics Standards Manual reissue is a commercial book and is not a NASA endorsement.
- Dither the imagery with a fixed Bayer matrix. Keep type solid. One accent, meaning one data channel. Error diffusion and halftone are for still exports.
- Best three challenges for this stack: Flame in Freefall, Lunar Landing Site Navigator, Earth analogs for Moon and Mars.

## Open questions

- What interactive RPM, TPM, and RPD does this team's Google AI Studio project actually show for `gemini-4-hydrogen` on Saturday morning?
- Does the TypeSafe console issue a key immediately, and what quota does a new organization get? The docs do not say.
- Does `gemini-decision-1` accept a bounding-box question under a name the model page did not list? The page that was read does not.
- Is there a live/voice Gemini model the team can call this weekend, and is it on the free tier? Hydrogen's page says Live API is not supported. A `gemini-3.8-live` URL did not return readable docs in this pass.
- What is behind the login on https://www.spaceappschallenge.org/2026/global-offers/? No credit amount was visible.
- The GO Team said Global Award eligibility needs a dataset from the challenge Resources list. The submission guide says "at least one NASA data or resource" without repeating "from that list" in the same sentence. Using a listed resource satisfies both.
- Will judges treat a proprietary API as "Solution Materials" that must be OSI, or is citing it enough? The terms clearly cover bundled non-NASA datasets and code. They do not say "API calls" in the paragraph that was read. An OSI fallback removes the argument.
- For Flame in Freefall, which PSI investigations have machine-readable tables versus PDF-only reports? That decides whether Hydrogen is reading figures or the pipeline is a real table.
- For the lunar navigator, is a terrain-occluded horizon required to impress a judge, or is a spherical horizon plus a LOLA elevation sample enough for the MVP? The challenge text says terrain matters at the south pole.
- Font LICENSE files should be re-read at the moment of vendoring (Inter, Geist, IBM Plex, JetBrains Mono, EB Garamond). The licenses named above are the ones those projects publish; the binary in the repo is what matters.
