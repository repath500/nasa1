# DS3 findings: Junior Astronaut Mission Trainer, Space Mission Design Game, Health Monitoring Software

Research sub-agent file for the 2026 NASA Space Apps Challenge. Scope: the three challenges named above, with a deep dive on NASA HRP/OSDR/LSDA biomedical data, the Twins Study, wearables, privacy, browser game engines, Jev, Gemini 4 Hydrogen, and the NASA simulators a game could build on.

Verification convention: **VERIFIED** means I opened the page/API/file and read the fact there, with the URL. **VENDOR CLAIM** means the maker says it on an official page but I did not re-measure it. **UNVERIFIED** means a secondary source, search snippet, or inference; do not build a demo on it. Legal/regulatory statements are design guidance, not legal advice.

The shared cross-cutting file `research/findings/gpt-a-ai-tech-design-rules.md` has the full AI, rules and dither design system. This file is self-contained but does not repeat every design-token detail.

---

## 0. Executive summary

**Best three bets, one per challenge**

| Challenge | Recommended concept | Why | Main risk |
|---|---|---|---|
| Junior Astronaut Mission Trainer | **Outpost Nine** — a 1-bit lunar/Mars outpost resource game with a delayed-cost mechanic and live DONKI storms | Best fit for ages 7–12: three resources, one screen, short sessions, real space weather, replayable, and Jev can adapt events without generating child-facing prose | Child-safety and AI terms: Gemini is not usable as the child-facing runtime model |
| Space Mission Design Game | **Trade Space** — four-role cooperative mission design with a dither contour map and a Jev review board | Directly answers the brief's "complete mission" and "team of up to four" asks, with real GMAT-derived trajectories and a distinctive visual identity | Physics model can become either too shallow or too big for 48 hours |
| Health Monitoring Software | **Vitals Ledger** — an offline-first, privacy-preserving daily self-check with personal baselines, Jev triage and grounded explanations | Best balance of impact, feasibility and judge appeal; uses real HRP/OSDR/RadLab content without pretending to diagnose | Medical-claims and privacy risk; a clinician must review the content |

**The single most important AI finding**

Jev is real, cheap, fast, and unusually well suited to all three challenges because it returns typed decisions rather than prose. Gemini 4 Hydrogen is also real (launched 12 November 2026), but it is the **wrong runtime model for a 7–12 app**: it has no Live API, and Google's Gemini API Additional Terms require users to be 18+ and prohibit API clients "directed towards or likely to be accessed by" under-18s. Use Jev for child-facing decisions and pre-authored content for language. Use Gemini only in an adult/educator authoring, analysis or accessibility back office. If real-time voice is essential, `gemini-3.8-live` exists and is the Live API model, but the same under-18 terms problem applies; a parent/educator-operated mode or on-device open-weight speech is the safer architecture.

**The single most important data finding**

DONKI moved on 30 September 2026. The old `api.nasa.gov/DONKI/...` path is dead (the FLR call returned 404; some old links redirect to the CCMC announcement); the live endpoint is `https://ccmc.gsfc.nasa.gov/DONKI-API/get/...` and needs no key. The challenge file links to `api.nasa.gov` and to the CCMC page, so a team that copies the old URL will fail on demo day. Every other NASA resource in these three challenges is reachable, but several are JS-rendered or request-gated, and the human biomedical data is not a simple download.

---

## 1. Cross-cutting AI, rules, engines and dither

### 1.1 Jev, the TypeSafe decision model — VERIFIED

| Fact | Detail | Status |
|---|---|---|
| What it is | TypeSafe AI's flagship **System One** model. You send a `state` (text and/or PNG/JPEG) plus typed `questions`; it returns typed answers and probabilities, not prose. It does not write explanations, code, or chain-of-thought. It is trained for calibrated decisions (RLCD). | VERIFIED: https://docs.typesafe.ai/concepts/system-one |
| Maker | TypeSafe AI, San Francisco. Founder Diogo Almeida (ex-OpenAI). Jev announced 15 September 2026; Jev 1.14 released 14 October 2026. | VERIFIED: https://typesafe.ai/blog/introducing-system-one-models-and-jev and https://docs.typesafe.ai/models |
| Model IDs | `jev-1.14.0` (current), `jev-1.13.0`; aliases `jev-latest` → 1.14.0, `jev-preview` → 1.14.0. | VERIFIED: https://docs.typesafe.ai/models |
| Endpoint | `POST https://api.typesafe.ai/v1/systemone` with `Authorization: Bearer`. SDKs: Python `typesafe-sdk`, JS/TS `@typesafe-ai/sdk`. Also available through OpenRouter's Decisions API with an OpenRouter key. | VERIFIED: https://docs.typesafe.ai/models and https://openrouter.ai/docs/guides/community/jev |
| Primitives | `choice` (pick one of 2–255 options, with a probability per option and confidence), `noul` (probability of yes), `score` (probability-weighted position on a 2–10 level scale, with legend and confidence), `box` (bounding box in an image; 1.14 only, and it needs the `TypeSafe-Danger-Zone-Images: true` header). | VERIFIED: https://docs.typesafe.ai/models and https://docs.typesafe.ai/concepts/system-one |
| Inputs | Text as string, JSON object, or array; PNG/JPEG images anywhere in the request. **No native audio or video.** | VERIFIED: https://docs.typesafe.ai/models |
| Context | Default 64k tokens per request / 32k per question. Header `TypeSafe-Danger-Zone-Long-Context: true` raises both to 262k, but the docs say that mode is slower and less accurate. OpenRouter's page quotes 262,144 tokens; TypeSafe's default is 64k/32k, so treat 262k as the long-context mode rather than the default. | VERIFIED: https://docs.typesafe.ai/models ; OpenRouter https://openrouter.ai/docs/guides/community/jev |
| Price | $0.042 per million input tokens ($42 per billion). Output tokens are free. | VERIFIED: https://docs.typesafe.ai/models |
| Speed | TypeSafe claims ~0.1–0.25 s typical latency and 193.6× faster / 444.6× cheaper than LLMs on its benchmark workflows. Treat the multiplier as a VENDOR CLAIM; the low latency is plausible for a System One model. | VENDOR CLAIM: https://typesafe.ai/ |
| Rate limits | Per organization, in tokens/sec and requests/sec, shown in the developer console; 429 + `retry-after` when exceeded. Specific numbers are not published on the models page. | VERIFIED policy: https://docs.typesafe.ai/models |
| Data handling | "Jev is not trained on customer requests or responses." Zero data retention is described as an enterprise option. | VERIFIED: https://docs.typesafe.ai/models |
| Limits to plan around | No prose, no reasoning trace, no audio/video. `box` returns four edges even when the target is absent; pair it with a `noul` "is the target present?" in the same request. Image input and Box are marked early features whose request format, answers and limits may change between releases. Calibration is aggregate, not per-answer truth. Jev's typed answer can still be wrong. | VERIFIED: https://openrouter.ai/docs/guides/community/jev and https://docs.typesafe.ai/models |
| Access caveat | There are many look-alike "Jev API" sites (`jev-api.com`, `jevapi.net`, `getjevai.com`, `jev-ai.pro`, `jevaimodel.dev`, `jev-ai.org`) with conflicting endpoints and prices. Use only `typesafe.ai` / `docs.typesafe.ai` / `api.typesafe.ai`, or OpenRouter. OpenRouter's terms require account holders to be 18+; the team's adult operator holds the key, and there are no child accounts. The terms excerpt read does not prohibit child-directed apps, but confirm TypeSafe's acceptable-use terms before shipping. | VERIFIED by inspection of the search results; the look-alike sites are not official. OpenRouter 18+ rule: https://openrouter.ai/terms |

**Why Jev fits these three challenges.** All three ask for judgments among a small set of authored options: which event to serve next, whether a design closes, whether a symptom is urgent. That is exactly Jev's primitive set. It is also a safety advantage for a kids' game: Jev cannot invent an event or a sentence; it can only choose among options the team wrote. The team keeps authorship and control.

**What Jev should not do.** It should not compute physics, diagnose, generate child-facing prose, or decide medical disposition without a clinician-authored rule layer. Use ordinary code for arithmetic, the deterministic simulator for mass/power/orbit, and a rules engine for red flags. Jev is a judgment layer, not an oracle.

**Key handling.** Jev is a server-side API. Do not put the key in browser code; proxy through a tiny serverless function (Cloudflare Worker, Vercel/Netlify function, etc.) and rate-limit per session. The same applies to Gemini. A leaked key on a public Space Apps project page is a real risk, not a theoretical one.

**Demo reliability.** Build a live/fixture toggle. Precompute 3–5 Jev responses for the exact demo state, show the live call only if the network cooperates, and label which mode is on screen. Judges remember a working demo, not a 429.

**Concrete adaptive-difficulty pattern (kids' game).** Send a compact state and four questions in one call:

```json
{
  "model": "jev-1.14.0",
  "state": {
    "player": {"age_band": "7-9", "session_min": 6, "hints_used": 2,
               "last3": ["shield", "science", "shield"]},
    "outpost": {"sol": 3, "power_pct": 41, "o2_pct": 63,
                "shield_pct": 28, "crew_mood": "ok"},
    "history": ["dust_storm", "solar_flare_watch"],
    "available_events": [
      {"id": "e1", "teaches": "power_vs_science", "difficulty": 1},
      {"id": "e2", "teaches": "shielding_vs_power", "difficulty": 2},
      {"id": "e3", "teaches": "comms_vs_science", "difficulty": 2}
    ]
  },
  "questions": {
    "next_event": {
      "type": "choice",
      "instructions": "Pick the event that best teaches the trade-off this player is ready for. Prefer variety; avoid repeating the last event type.",
      "criteria": {"e1": "power vs science", "e2": "shielding vs power", "e3": "comms vs science"}
    },
    "too_hard": {"type": "noul", "instructions": "Is this player likely to fail the next sol without a hint?"},
    "difficulty": {"type": "score", "instructions": "How challenging is the current state for this player?",
                   "criteria": ["too easy", "easy", "just right", "hard", "too hard"]},
    "show_hint": {"type": "noul", "instructions": "Should the game show a hint now?"}
  }
}
```

Policy: show a hint if `show_hint > 0.65` and its confidence is >0.55; if `difficulty.score > 3.2`, reduce the next event severity; if `< 1.2`, add a modifier or a bonus objective; if `next_event` confidence is low, fall back to a scripted event. Log the response `model` and probabilities; cache a fixture for the demo.

### 1.2 Gemini 4 Hydrogen — VERIFIED, but not a kids' runtime model

| Fact | Detail | Status |
|---|---|---|
| Model ID | `gemini-4-hydrogen`, stable, launched 12 November 2026. Fast member of the Gemini 4 family (Hydrogen, Carbon, Argon). Available via the Gemini API/AI Studio, Google Cloud's Gemini Enterprise Agent Platform (the Vertex AI successor), and consumer surfaces. | VERIFIED: https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-hydrogen/ ; https://aistudio.google.com/docs/models/gemini-4-hydrogen ; https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/guides/gemini-4-hydrogen |
| Inputs | Text, image, video, audio, PDF. Cloud docs also list Office/OpenDocument files. | VERIFIED: https://aistudio.google.com/docs/models/gemini-4-hydrogen and https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/guides/gemini-4-hydrogen |
| Output | Text only. No image generation, no audio generation. | VERIFIED: same model page |
| Context | 1,048,576-token unified input+output window. Default synchronous output 65,536 tokens; up to 1,048,576 with long decode/background continuation. | VERIFIED: same model page |
| API surfaces | GenerateContent API, Interactions API, OpenAI-compatible Chat Completions; Count Tokens; Batch, Flex, Priority. | VERIFIED: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/guides/gemini-4-hydrogen |
| Thinking | `low`, `medium`, `high` (default), `xhigh`. | VERIFIED: same model page |
| Tools/capabilities | Function calling, structured outputs, code execution, computer use, file search, URL context, Google Search grounding, Google Maps grounding, agentic video understanding (defaults to static). | VERIFIED: same model page |
| Live API | **Not supported.** Hydrogen cannot do a bidirectional real-time voice/video session. Normal text streaming and long decode are not the Live API. | VERIFIED: same model page |
| Context caching | Implicit only; explicit caching not supported. | VERIFIED: same model page |
| Price | Free tier: free of charge, content used to improve Google products. Paid: $1.50 per 1M input, $7.50 per 1M output; batch $0.75/$3.75; cache $0.075. | VERIFIED: https://ai.google.dev/gemini-api/docs/pricing |
| Knowledge cutoff | March 2026. | VERIFIED: model card https://deepmind.google/models/model-cards/gemini-4-hydrogen/ |
| Lifecycle | Short-term GA with a minimum 45-day retirement notice. Do not hard-code it as a permanent dependency. | VERIFIED: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/guides/gemini-4-hydrogen |
| Age terms | "You must be 18 years of age or older to use the APIs. You also will not use the Services as part of a website, application, or other service ... that is directed towards or is likely to be accessed by individuals under the age of 18." | VERIFIED: https://aistudio.google.com/docs/terms (effective 23 March 2026) |
| Child-directed clarification | Google's forum response to a COPPA-compliant children's app says there is no self-serve allow-list or toggle for child-directed generative-AI apps; contact Google Cloud Sales. | VERIFIED as Google's public forum response: https://support.google.com/gemini/thread/448243703/ (July 2026) |
| Real-time alternative | `gemini-3.8-live` is the Live API model: text/image/audio in, text/audio out, 131k input / 65k output, stable September 2026, free tier available. Audio input $3.00/1M tokens or ~$0.005/min; output audio $12.00/1M or ~$0.018/min. | VERIFIED: https://aistudio.google.com/docs/models/gemini-3.8-live and https://ai.google.dev/gemini-api/docs/pricing |
| Decision-model alternative | `gemini-decision-1` is Google's own decision model: yes/no, single-select, rubric; text/image/video/audio/PDF in; 262k tokens; up to 1,000 questions; free tier 200 RPM / 50k TPM / 10k RPD. No documented box output. | VERIFIED: https://aistudio.google.com/docs/models/gemini-decision-1 (as reported in the shared GPT-A file; re-check on the day) |

**What this means for a kids' game.** Hydrogen can support **turn-based vision** (a photo of a drawing, a plant, a mission poster) and **recorded audio/video understanding** (a short clip the child or teacher uploads), but not a live camera conversation. For live voice, `gemini-3.8-live` is the model, not Hydrogen. However, the Gemini API/AI Studio terms prohibit API clients directed to under-18s, and the free tier's content may be used to improve Google's products. COPPA compliance does not override Google's terms. **Caveat:** this is the Gemini API/AI Studio Additional Terms. Vertex/Agent Platform enterprise terms may differ; if the team has a Google Cloud enterprise agreement, check whether it permits a child-directed app. Do not assume it does.

| Interaction | Gemini 4 Hydrogen? | Live alternative | Child-safe pattern |
|---|---|---|---|
| Live voice conversation | **No** — no Live API | `gemini-3.8-live` | Parent/educator-operated mode only, or on-device ASR/TTS; no child voice off-device |
| Recorded voice clip | Yes — audio input | n/a | Avoid in the child runtime; if used, parent-gated, ephemeral, never in the submission |
| Live camera | **No** | `gemini-3.8-live` (images at ≤1 FPS) | Avoid for ages 7–12 |
| Single photo / drawing | Yes — image input | Jev `box` for localization | Photograph a drawing or object, not a face; blur faces on-device; do not store |
| Short video clip | Yes — video input | n/a | Adult/educator back office only |
| Text / PDF | Yes | n/a | Adult/educator back office only |

The safe architecture is:

1. **Child runtime:** Jev decisions + deterministic game logic + pre-authored, human-reviewed text. No Gemini. No microphone by default. Camera only with a parent/teacher gate and on-device face blurring; send only a cropped object image if Jev `box` is used. No child accounts, no names, no persistent audio.
2. **Adult/educator back office:** Gemini 4 Hydrogen for lesson-plan generation, mission-brief drafting, accessibility alt-text, translation, and post-playtest analysis. The adult is the user; the child is not. This is where Hydrogen's 1M context and multimodal reading shine.
3. **If live voice is a must for a demo:** use `gemini-3.8-live` in an explicitly 18+ educator/parent mode, or use on-device open-weight speech: Whisper (MIT), Vosk (Apache-2.0), Piper (MIT). Keep audio on the device; do not send a child's voice to a third party. Verify each license before shipping.

**COPPA facts to design against (U.S.).** The FTC's amended COPPA Rule is effective 23 June 2025, with compliance required by 22 April 2026. "Personal information" now includes biometric identifiers such as voiceprints, facial templates, faceprints and gait patterns; audio files containing a child's voice are personal information. The rule adds a narrow exception to verifiable parental consent for an audio file containing a child's voice when it is collected to respond to a child's specific request, no other personal information is collected, it is not used for any other purpose or disclosed, and it is deleted immediately after responding; an online notice is still required. It also requires a written retention policy and a written information-security policy, and separate verifiable parental consent to disclose children's data to third parties for targeted advertising or other purposes. — VERIFIED: https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule and 16 CFR 312.5(c)(9), https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-312/section-312.5

**Practical child-safety rule set for the team:**
- Collect nothing by default. No account, no name, no email, no birthday, no school, no precise location.
- No microphone in the child-facing app. If voice input is ever added, make it on-device, parent-gated, ephemeral, and covered by a COPPA notice and consent flow.
- Camera only in a "mission scanner" mode that photographs a drawing or object, not a face; blur faces on-device; send only the cropped object; never store the image.
- Jev receives a game state, not a child profile. Use an anonymous session ID.
- No third-party analytics or ad SDKs. No social features. No chat.
- A visible "AI is helping" label and a "why did the game do that?" explainer built from templates, not generated prose.
- In the Space Apps submission, do not include any under-18 voice, photo or likeness. The participant FAQ and legal terms prohibit it. — VERIFIED: https://www.spaceappschallenge.org/resources/participant-faqs/ and https://www.spaceappschallenge.org/legal/
- If the team or users are in the EU/UK, also check GDPR Article 8 (the default digital age of consent is 16; member states may lower it to 13) and the UK Age Appropriate Design Code. The same data-minimization choices satisfy most of both.

### 1.3 Space Apps 2026 rules on AI and attribution — VERIFIED

These are the rules that affect the three challenges:

- AI/SI use is permitted. "Super Intelligence" (SI) is the 2026 term; the submission must describe how SI tools were used. — VERIFIED: https://www.spaceappschallenge.org/resources/participant-faqs/
- AI-generated images and videos need a **visible watermark**; audio needs an acknowledgement in descriptive text and metadata; code and data need an acknowledgement in text and metadata. — VERIFIED: https://github.com/nasa/spaceapps/discussions/1849
- AI-generated content may not use, contain, or modify NASA branding or design elements (logos, flags, mission identifiers). — VERIFIED: same discussion.
- Global Awards eligibility requires **at least one NASA data source included with the Resources of that challenge**. Other NASA/partner data is encouraged but optional. — VERIFIED: same discussion.
- All third-party materials must be freely and publicly available or OSI-licensed; every source must be cited, even open-source ones; original content defaults to Apache 2.0 if no license is specified. — VERIFIED: https://www.spaceappschallenge.org/legal/
- No personally identifiable information; no recognizable names, voices or likenesses of anyone under 18. — VERIFIED: same legal page.
- Do not begin challenge-specific work before the hackathon. Reusing your own prior code is permitted if credited and not built for this challenge. — VERIFIED: https://github.com/nasa/spaceapps/discussions/1924

**Consequence for the AI architecture:** an API call to Jev or Gemini is a service dependency, not a redistributed model, but the safest reading is to (a) license the repo Apache-2.0, (b) list Jev and Gemini in References with their terms, and (c) ship a fallback path (rules/heuristics, `gemini-decision-1`, or Gemma 4 Apache-2.0) so the project still runs without a proprietary key. This is an interpretation, not a sentence in the terms; ask the Local Lead if it matters for judging.

**Attribution checklist for the submission.**
1. Dataset name, publisher, URL, version or access date, and the exact subset/columns used.
2. License or terms (e.g. NASA SMD open data/CC0 unless marked; OSDR study citation; CSA terms; Hexoskin commercial terms).
3. What you transformed (e.g. "DONKI FLR 2010–2026 normalized to 10 event cards"; "RadLab daily medians"; "MEDA monthly statistics").
4. The credit line shown in the app ("Space weather: NASA CCMC/DONKI"; "Dose data: NASA OSDR RadLab").
5. For every library/model: name, version, license, and what it does (Jev, Gemini 4 Hydrogen, Phaser, three.js, GMAT, etc.).
6. For every AI-generated asset: a visible "AI-generated" watermark on images/video; a note in the audio/code/data metadata; a one-line description of how AI was used.

**AI disclosure checklist.** State which model (Jev/Gemini/Decision 1/other), what went in (state/questions or prompt), what came out (typed decision/text/image), whether a human reviewed it, and what the fallback is. Do not claim the model "understands" or "diagnoses"; describe the narrow task.

### 1.4 Browser game engines and licenses — VERIFIED

| Engine | Version/status | License | Rendering | Best use here | Watch-outs |
|---|---|---|---|---|---|
| **Phaser** | Phaser 4.2.1, actively developed | **MIT** | 2D Canvas + WebGL; Phaser 4 has a new WebGL renderer and a built-in **Quantize** filter for dithered palettes | Kids' outpost game, dashboards, touch UI, 2D mini-games | 345 KB gzip full build; no 3D; Phaser 4 API differs from Phaser 3 |
| **three.js** | r1xx, active | **MIT** | 3D WebGL (WebGPU renderer also exists) | Orbit visualization, 3D orrery, habitat view, dithered starfield | Heavier; you build your own scene graph/UI; dither via `EffectComposer` + `ShaderPass` |
| **PixiJS** | v8, active | **MIT** | 2D WebGL + WebGPU | Dither-heavy dashboards, telemetry strips, fast 2D data viz | No built-in physics or scene management; more low-level |
| **Godot** | 4.x, active | **MIT** | Web export uses **WebGL 2.0 only** (Compatibility renderer); no WebGPU; C# cannot be exported to web; single-thread export since 4.3 avoids cross-origin isolation | Only if the team already knows Godot and wants a scene editor | Larger download; web export constraints; Safari WebGL2 issues; overkill for a 48h UI-heavy game |

Sources: https://github.com/phaserjs/phaser (MIT); https://github.com/mrdoob/three.js (MIT); https://github.com/pixijs/pixijs (MIT); https://github.com/godotengine/godot (MIT); Godot web export docs: https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html (WebGL 2.0 only, no WebGPU, C# not exportable).

**Recommendation.** Phaser for the kids' game (2D, touch, fast, small, built-in Quantize filter). three.js for the mission-design 3D orbit view or a 3D habitat. PixiJS if the team wants a custom dither pipeline and data viz. Godot only if a team member is already fluent; do not learn it during the hackathon.

### 1.5 Dither UI that still looks like mission control

The shared GPT-A file has the full system; the short version for these three challenges:

- **Dither is encoding, not decoration.** Use ordered/Bayer dither density to represent probability, uncertainty or radiation dose. Jev's probabilities become dot density. This is colour-blind safe and gives judges a reason for the aesthetic.
- **Text is never dithered.** Keep labels, numbers, axes and legends in solid ink on solid paper. Dither only imagery, maps, charts and the "image well."
- **One ink, one paper, one accent.** The accent must mean one thing (e.g. safety orange = warning/radiation; teal = verified data). Do not use the NASA logo or worm; use the Space Apps brand if a mark is needed.
- **Ordered dither for live content** (no frame-to-frame shimmer); Floyd–Steinberg/Atkinson only for still export plates.
- **Always offer a "solid/science view"** toggle that removes the dither and shows the continuous image or chart. This protects accessibility and scientific honesty.
- **Performance:** pre-dither static assets to textures; run a single screen-space WebGL pass for live imagery; do not dither per-pixel on the CPU.
- **Accessibility:** body text ≥4.5:1; large text ≥3:1; 2 CSS-pixel minimum dither cell; reduced-motion mode; no reliance on colour alone; keyboard and screen-reader labels; large touch targets for kids.
- **Kids' game specifically:** dither the world and the mission-control panels, not the words; use big shapes and a friendly halftone mascot; offer a "clean mode" for classroom projectors and low-vision users; avoid CRT scanlines and fake phosphor bloom (retro kitsch, not mission-control precision).

Useful open-source dither tools (licenses verified in the shared file): `image-to-pixel` (MIT), `ditherdance` (Apache-2.0), the ittybitty dither shader (MIT), `three.js` postprocessing (MIT), CesiumJS `PostProcessStage` (Apache-2.0), deck.gl (MIT). Avoid GPL dither CLIs in the shipped app; use them only as build tools.

---

## 2. Challenge A: Build a Junior Astronaut Mission Trainer

Challenge page: https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/

### 2.1 Challenge in one paragraph

NASA wants an interactive game or app that lets **students ages 7–12** run a **lunar or Martian outpost**, balancing **life support, radiation shielding, power, food production and communication delay**, and experiencing how choices compound over a simulated mission. The real ask is not a quiz or a poster: it is a **playable trade-off mechanic** where no choice is free, grounded in real NASA data (DONKI space weather, OSDR biomedical findings, RadLab dosimetry, Artemis/Mars surface data, Mars Trek terrain), with clear attribution inside the tool. The hidden judging hooks are: (1) **two or three core resources**, not five or six; (2) **every choice has a cost**, including a delayed cost; (3) **plain language** with in-context explanations of terms like radiation dose, microgravity and sol; (4) **browser-playable, no download or account**; (5) **replayability** with varying events; (6) **a short explanation of which NASA datasets were used and why**; (7) it must flex to older siblings, parents and classrooms; (8) visual polish must not substitute for mechanical accuracy. The "must include" items are a working prototype, a clear trade-off mechanic, at least one real NASA dataset (for Global Awards, one from the challenge Resources), and visible data attribution.

**Audience reality check.** Seven-to-twelve is two developmental bands. A 7-year-old needs one screen, three buttons, a 5–10 minute session, and no reading-heavy failure state. A 12-year-old wants systems, optimization and replay. The strongest design is a **single core loop with two depth settings**: "Cadet" (3 resources, 5 sols, guided hints) and "Commander" (same loop, hidden interactions, 10 sols, randomized events). Do not build two games.

**Competition note.** Youth games are a crowded Space Apps category; the 2025 winner list includes a farming mini-game (Zumorroda-X) and a habitat design platform (PureFlow), and 2022 had Mars 3D Home. Differentiation must come from the **trade-off mechanic and the real-time space-weather link**, not from the fact that it is a game.

### 2.2 Data and resources table

| Name | URL | Format | Access/auth | Size | License | Verified? | Notes |
|---|---|---|---|---|---|---|---|
| NASA Open APIs | https://api.nasa.gov/ | REST/JSON | Free API key; `DEMO_KEY` 30 req/hr, 50/day per IP; key 1,000 req/hr | Varies | NASA open data; CC0 unless marked | VERIFIED | APOD returned HTTP 500 during this pass; do not make APOD a demo dependency. Key signup is instant. |
| DONKI (old) | https://api.nasa.gov/DONKI/ | REST/JSON | Old docs still list it | Event records | NASA/CCMC open data | VERIFIED DEAD | `https://api.nasa.gov/DONKI/FLR?...` returned **404** on 14 Nov 2026. Do not use. |
| DONKI (live) | https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR?startDate=...&endDate=... | REST/JSON | **No key** | Event records (FLR, CME, CMEAnalysis, GST, IPS, SEP, MPC, RBE, HSS, WSAEnlil, notifications) | NASA/CCMC open data; credit CCMC/DONKI | VERIFIED | The CCMC announcement says the migration happened 30 Sep 2026; the new base is `/DONKI-API/get/`, and input parameters/response formats are unchanged. Tested FLR and CME successfully. |
| DONKI web app | https://ccmc.gsfc.nasa.gov/DONKI/ | HTML/JS | Free | N/A | NASA/CCMC | VERIFIED | Human-readable event chains, catalogs, statistics. Good for a build-time scrape or a "real event" link. |
| NASA OSDR | https://osdr.nasa.gov/bio/repo/ | Web repo; JSON API; CSV/TSV; S3 | Public metadata and processed data; **controlled access** for human sequence data | 500+ studies; 4,356 human sample metadata rows returned by the API in this pass | NASA SMD open data; cite each study | VERIFIED | See 4.2 for the biomedical deep dive. |
| OSDR search API | https://osdr.nasa.gov/osdr/data/search?term=KEYWORD | JSON | No auth | Search hits | NASA open data | VERIFIED | Returns Elasticsearch-style JSON. `term=astronaut` → 76 hits; `term=twins` → 130 hits (noisy). |
| OSDR Biological Data API | https://visualization.osdr.nasa.gov/biodata/api/ | REST + query; JSON/CSV/TSV | No auth for public data | Full repository | NASA open data; cite | VERIFIED | `/v2/query/metadata/?study.characteristics.organism=Homo%20sapiens&format=json.records` returned 4,356 records. Use this, not the fuzzy search, for curated content. |
| RadLab | https://visualization.osdr.nasa.gov/radlab/gui/data-api/ | GET API; CSV/TSV/JSON/HTML | **No auth** | ISS + BLEO + lunar + Mars dose data | NASA open data; credit OSDR/RadLab | VERIFIED | Fields: `absorbed_dose_rate` (μGy/h), `dose_equivalent_rate` (μSv/h), `flux`, latitude/longitude/altitude/B/L. Instruments include DosTel, Liulin-5, ALTEA, CRaTER (LRO), LND (Chang'e 4), Liulin-MO (ExoMars TGO), MSL/RAD (Curiosity). |
| Mars Trek | https://trek.nasa.gov/mars/ | Web GIS (ArcGIS JS); imagery/elevation layers | Free web GUI; **no documented public API** | Global Mars basemaps | NASA/JPL-Caltech/UA/USGS; credit | VERIFIED site live | The page is a Dojo/ArcGIS app; no public REST endpoint found. For a 48h build, use a pre-baked heightmap/terrain tile and credit Mars Trek; for raw data use PDS. |
| NASA PDS MEDA (Mars 2020) | https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/PERSEVERANCE/meda.html | PDS4; calibrated/derived CSV | Free | Sols 0–1859+ (release 16, Aug 2026); DOI 10.17189/1522849 | NASA PDS open | VERIFIED | Real Mars pressure, air/surface temperature, humidity, wind, UV/irradiance, dust. Best "real environment" source for a Mars outpost. |
| NASA PDS LRO Diviner | https://pds-geosciences.wustl.edu/missions/lro/diviner.htm | PDS4 EDR/RDR/GDR | Free | 2009–Jun 2026 (release 67, Sep 2026) | NASA PDS open | VERIFIED | Lunar surface temperature at 500 m scale; polar temperature maps. Good for "shielding vs thermal" trade-off. |
| NASA PDS LRO LOLA | https://pds-geosciences.wustl.edu/missions/lro/lola.htm | PDS4; IMG/GeoJPEG2000; 5 m polar DEMs | Free | Global + polar | NASA PDS open | VERIFIED | Lunar south-pole DEMs and illumination; ideal for a static outpost map. |
| NASA Image and Video Library API | https://images-api.nasa.gov/ | REST/JSON | No key | Large | NASA media usage; credit | VERIFIED | Real mission photos for dithered cards and backgrounds. |
| NASA 3D Resources | https://github.com/nasa/NASA-3D-Resources | 3D models/textures | Free | Large | NASA media usage; README says "free and without copyright" | VERIFIED | Spacecraft/habitat models for a 3D view; check each asset's credit. |
| NASA Space Place | https://spaceplace.nasa.gov/ | Web games/activities | Free | N/A | NASA | VERIFIED | Kid-facing reference and tone guide; not a data API. |
| NASA STEM learning resources | https://www.nasa.gov/learning-resources/ | Web | Free | N/A | NASA | VERIFIED | Educator context, classroom framing. |
| CSA STEM/youth resources | https://www.asc-csa.gc.ca/eng/youth-educators/resources-stem-and-youth-organizations.asp | Web | Free | N/A | CSA terms | VERIFIED | Bilingual activities for museums, libraries, camps. |
| CSA food production toolkit | https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production/ | Web | Free | N/A | CSA terms | VERIFIED | Food in space, nutrition, remote food production. Direct input for a greenhouse mechanic. |
| JPL Horizons API | https://ssd.jpl.nasa.gov/api/horizons.api | Text/JSON | No key | Ephemerides over a wide time range (query-dependent) | NASA/JPL open | VERIFIED | Real planet/spacecraft positions; useful for a "where is Mars today?" panel or light-time calculation. |

**Data pipeline recommendation.** At build time, pull and cache:
1. DONKI FLR + CME + GST + SEP for 2010–2026, normalized to event cards with a "kid explanation" and a "what it does to the outpost" rule.
2. RadLab dose series for DosTel (ISS), CRaTER (lunar orbit), LND (lunar surface) and MSL/RAD (Mars surface), aggregated to daily medians and 95th percentiles.
3. MEDA monthly statistics (temperature, pressure, wind, dust) for Jezero; Diviner/LOLA statistics for a lunar south-pole site.
4. A LOLA/MOLA heightmap and a few real images, dithered at build time.

At runtime, optionally fetch the last 30 days of DONKI; if it fails, use the cached deck and label it "archived." Never present static data as live. Put a "Data" panel in the game with the dataset name, date range, and a link.

**NASA resources to build on (kids' game).** Use **NASA Space Place** for tone and reading level, not for data. Use the **CSA food-production toolkit** for the greenhouse facts. Use the **NASA "Build It Yourself" telescope game** as a flow reference for "choice → consequence → real mission analog," not as a mechanic to clone. Use **Eyes on the Solar System** as a "see the real mission" link-out, not an embedded engine. Use **PDS MEDA/Diviner/LOLA** for real environmental conditions, and **RadLab/DONKI** for the space-weather layer. This mix gives the game real data without asking a 7-year-old to read a PDS label.

### 2.3 Open-source and prior art

| Project | What it is | License | Use |
|---|---|---|---|
| NASA "Build It Yourself" telescope game | Three-level game: pick science objective → wavelength → instruments → launch → results; suggests real NASA missions with similar designs. | NASA (free, not open-source code) | Design reference for "choice → consequence → real mission analog." Do not clone; your game is an outpost, not a telescope. https://science.nasa.gov/mission/webb/game-build-it-yourself/ |
| NASA Eyes on the Solar System | Browser 3D simulation of the solar system, 1950–2050, 150+ missions. | NASA/JPL; no public API; data.nasa.gov record says "License not specified" | Inspiration for time-scrubbing and "real mission" context. Link out; do not scrape. https://eyes.nasa.gov/apps/solar-system/ |
| NASA Mission Viz | Three.js/X3DOM orrery examples and tutorials. | NASA GitHub repo, **no explicit LICENSE file found** | Use as a three.js reference only; write your own orrery or use Horizons. https://nasa.github.io/mission-viz/ |
| PureFlow (2025 Best Mission Concept) | Interactive habitat design + solar-storm validation. | Space Apps entry; license per submission | Closest prior art. Differentiate: PureFlow is habitat CAD; Outpost Nine is a kid-scale resource game with delayed costs. https://www.nasa.gov/learning-resources/stem-engagement-at-nasa/nasa-announces-2025-international-space-apps-challenge-global-winners/ |
| Zumorroda-X (2025 Art & Technology) | Farming mini-games about climate adaptation. | Space Apps entry | Tone/scale reference for a food mechanic; not spaceflight. Same 2025 winners page. |
| Mars 3D Home (2022 Best Mission Concept) | Resource-optimized Mars habitat for 668 sols. | Space Apps entry | Prior art for Mars habitat resource modeling. https://www.earthdata.nasa.gov/news/nasa-announces-winners-2022-global-space-apps-challenge |
| LunarTech Ensemble (2023 Best Use of Science) | Moonquake data website + immersive game. | Space Apps entry | Prior art for "real data + game." https://science.nasa.gov/directorates/smd/2023-nasa-international-space-apps-challenge-announces-10-global-winners/ |
| Shelter in Space (2020) | Gamified isolation/wellness analog mission. | Space Apps entry | Prior art for mission framing and health gamification, not outpost resources. https://covid19.spaceappschallenge.org/challenges/covid-challenges/isolation-solution/teams/shelter-in-space/ |
| "Kid on the Moon" (2016 Most Inspirational) | Interactive kid lunar simulator. | Space Apps entry | Confirms the audience works, but it is a simulator, not a trade-off game. Ten-year winners CSV: https://github.com/Mahdi-hasan-shuvo/spaceappschallenge/blob/main/nasa_space_apps_10year_winners.csv |

**Originality guardrails.** Do not clone Kerbal Space Program, Surviving Mars, Oxygen Not Included, Frostpunk, Among Us, Papers Please, Mini Metro or FarmVille. The original mechanics proposed here are: **delayed cost tokens** (a choice places a visible cost on a future sol), **light-time message queue** (you commit before you know), **probability dither** (uncertainty shown as dot density), and **photo mission scan** (a drawing/object becomes a game input). None of these is a reskin.

### 2.4 Project concepts

**Scoring note.** Scores are 1–10 **within this challenge**, for a 48-hour, 3–5-person team using a dither UI and Jev/Gemini. They are not the cross-challenge portfolio ranks in the shared GPT-A file.

#### Concept A1: **Outpost Nine** (recommended)

**Pitch line.** You are the night-shift flight director of a nine-person lunar south-pole outpost. Spend power, make oxygen, hold the shielding line — and live with the cost tomorrow.

**Target user.** Ages 7–12, playing alone at home or in a classroom pair; a parent or teacher can co-play. Reading level: grade 2–4; all text has an optional read-aloud.

**Core experience.** A single 1-bit mission-control screen. Three core resources: **power**, **oxygen**, **shielding**. Food and communication delay are secondary systems, not extra bars: a **greenhouse module** produces food but consumes power and water, and a **light-time badge** shows how long a message to Earth will take (with a storm blackout modifier). Each sol is a 60–90 second loop: read a 2-sentence situation, choose one of three actions, watch the resource bars and a "cost token" move. The cost token is the original mechanic: every action places a cost on a future sol (e.g. "science tonight = +8 power cost on sol 4"). The kid sees the future cost as a stamped token on a timeline, so compounding is visible, not hidden. After 5 sols, a mission report shows what they traded and why. **This is not a colony sim:** there is no building grid, no tech tree, no free exploration. It is a five-sol decision drill with a visible future-cost timeline.

**Demo "wow" moment.** A real DONKI solar flare/CME is loaded. The dither map floods from the top of the screen; a 45-second "storm drill" starts. The kid's earlier shielding choice determines which modules stay online. The report then shows the real event date, the real GOES class, and the kid's decision next to it. This is the "real data changes the game" moment judges remember.

**How it uses Jev and other AI.**
- **Jev `choice`**: pick the next event card from 6–8 human-authored cards based on the player state (resources, last choices, hint count, session time). It cannot invent an event.
- **Jev `score`**: rate current difficulty on a 5-level scale; use the probability-weighted score to adjust event severity.
- **Jev `noul`**: "should we show a hint?", "is the player likely to fail the next sol?", "is the player repeating the same strategy?"
- **Jev `box`** (optional camera mode): the child photographs a drawing of the outpost; Jev boxes the "airlock" or "solar panel"; the game responds with a pre-authored line. No face, no child identity, no Gemini.
- **Jev I/O:** in = compact player/outpost state + 3–8 human-authored event cards + hint history; out = event choice, difficulty score, hint probability. No child profile, no free-text generation.
- **Gemini 4 Hydrogen**: **not in the child runtime.** Use it in the teacher/parent back office to draft mission briefs, classroom worksheets, alt text and translations from the team's own content, with an adult as the user. This satisfies the "new 2026 AI" goal without violating the under-18 terms.

**Data pipeline.**
1. Build-time: DONKI FLR/CME/GST/SEP 2010–2026 → event cards with a "kid translation" and a rule delta; RadLab daily dose ranges for a lunar site; Diviner temperature range; LOLA heightmap.
2. Runtime: optional live DONKI last-30-days fetch; if offline, cached deck; label "live" vs "archived."
3. In-game "Data" panel: dataset, date range, link, license/credit.

**48-hour MVP.**
- One site: lunar south pole (Shackleton-ish rim), one screen, three core resources, five sols, ten event cards.
- A greenhouse module (food as a secondary system) and a light-time badge (comms delay), so all five mission demands are present without five bars.
- Deterministic resource model with a visible future-cost timeline.
- Jev difficulty + hint + event selection, with a cached fixture fallback.
- Dither UI: Bayer 8×8 on imagery, solid text, one amber accent, large touch targets.
- End-of-mission report: choices, costs, a real DONKI event, three data citations.
- No account, no download, no personal data.
- Architecture: static front end + one serverless Jev proxy; no database.
- Team split: 6h data, 10h core loop, 8h UI, 4h Jev, 4h content, 6h test/demo, 10h buffer.

**Stretch goals.** Mars Jezero site using MEDA; a greenhouse module; a 14-minute light-time mode; classroom leaderboard with no personal data; read-aloud; a "clean mode"; a second scenario ("storm season").

**How the dither UI fits.** 1-bit "mission control": paper white, ink black, one amber accent. Dither density = radiation/uncertainty; the radiation map gets denser as dose rises. Text and numbers stay solid. The outpost is a halftone cutaway, not a cartoon. A "clean mode" strips the dither for projectors. No CRT scanlines.

**Risks.** Real-time DONKI failure (cache and label); too many systems (stick to three); Jev latency or outage (cache, timeout, deterministic fallback event order); child-safety (no data collection, no Gemini runtime); dither readability (solid text, clean mode); "safe choice" design (audit every card: every option must have a cost).

**Scores.**

| Impact | Feasibility | Novelty | Judge appeal | AI fit |
|---:|---:|---:|---:|---:|
| 9 | 8 | 8 | 9 | 8 |

**Why the scores.** Impact: directly serves the 7–12 audience and the trade-off ask. Feasibility: 2D, one scenario, cached data. Novelty: delayed-cost tokens + live space weather + probability dither. Judge appeal: clear educational mechanic, real data, strong demo. AI fit: Jev is a natural event/difficulty selector; Gemini is deliberately kept out of the child runtime, which is a defensible, mature choice.

#### Concept A2: **Greenhouse 3/8 G**

**Pitch line.** Feed four astronauts on Mars with a greenhouse the size of a school bus — and decide what to do when the dust storm blocks the sun.

**Target user.** Ages 8–12; classroom science; parent-child.

**Core experience.** A Mars greenhouse management game. Resources: water, light/power, nutrients, shielding. Crops: lettuce, potatoes, beans (real space-crop candidates). Real Mars sol length (24h 39m) and MEDA temperature/dust statistics. A "crop card" shows growth stage, yield, and stress. The original mechanic: **the harvest trade** — you can harvest early for calories now or wait for seeds to replant, but a dust storm may ruin the wait.

**Demo "wow" moment.** The child photographs a real leaf or a drawing; the game's "botanist scan" overlays a dither grid, Jev `box` finds the leaf, and the game returns a pre-authored "crop health" card with a real NASA space-crop fact. No face, no upload of the full scene, no Gemini.

**How it uses AI.** Jev `choice` for pest/weather event; `score` for crop stress; `noul` for "is the crop likely to fail?"; `box` for photo localization. Gemini only in the teacher back office for lesson plans.

**Data pipeline.** CSA food-production toolkit + NASA space-crop research for crop facts; MEDA for temperature/dust; a simple crop model (degree-days, water, light) written by the team; synthetic yield curves; in-game citations.

**48-hour MVP.** Three crops, four resources, six events, one 20-sol season, photo scan, dither seed-catalog UI, end report. Stretch: a classroom experiment mode with real classroom plant photos.

**Dither UI.** Seed-packet/technical-manual aesthetic: halftone leaves, solid labels, one green accent; growth charts with dithered confidence bands.

**Risks.** Crop model accuracy (label as simplified); photo feature can feel gimmicky (make it optional); child data (no storage); scope (three crops max).

**Scores.**

| Impact | Feasibility | Novelty | Judge appeal | AI fit |
|---:|---:|---:|---:|---:|
| 8 | 8 | 8 | 8 | 7 |

#### Concept A3: **Delay 14**

**Pitch line.** You command a Mars outpost where every message to Earth takes 14 minutes. You have to decide before you know.

**Target user.** Ages 9–12 (reading-capable), classroom, museum.

**Core experience.** A narrative decision game built around the **distance-from-Earth** hazard. Each crisis arrives as a short scene. The child chooses or writes a short instruction; the game puts it in a "light-time queue" and shows the consequence unfolding **before** Earth's reply arrives. A visible light-time clock (compressed to 14 seconds for play) makes the delay tangible. Resources: power, oxygen, trust (crew morale). The original mechanic is the **message queue**: you commit instructions for a future you cannot see. **This is not a choice-based visual novel:** the core is the queue, the delay, and the irreversible instruction, not a branching dialogue tree.

**Demo "wow" moment.** The child sends "vent the lab" at T+0; at T+14 the reply arrives saying "do not vent — the crew is inside." The game does not rewind. The emotional beat is the lesson.

**How it uses AI.** Jev `choice` picks the next crisis; `score` rates the risk of the child's instruction; `noul` checks whether the instruction covers the emergency. Gemini only for the adult-authored "Earth reply" templates (or no Gemini at all).

**Data pipeline.** DONKI communication blackouts; JPL Horizons light-time between Earth and Mars; HRP distance-from-Earth content; real DSN station names; synthetic crisis scripts reviewed by a space-science advisor.

**48-hour MVP.** Five crises, three resources, a message queue, a 14-second compressed delay, one ending, a report. Stretch: branching endings, a second site (Moon, 1.3s delay), a classroom debate mode.

**Dither UI.** Teletype printout aesthetic: solid monospace text, dithered "signal" bars, one red accent for irreversible choices.

**Risks.** Slow pace; reading load; frustration; limited replay. Mitigate with short scenes, read-aloud, and a "try the other choice" mode after the first ending.

**Scores.**

| Impact | Feasibility | Novelty | Judge appeal | AI fit |
|---:|---:|---:|---:|---:|
| 8 | 9 | 9 | 8 | 6 |

#### Concept A4: **Dose Detective**

**Pitch line.** Place shielding tiles on a lunar habitat and see the real radiation map change — but every kilogram of shield costs power or science.

**Target user.** Ages 8–12; museum/classroom; parent-child.

**Core experience.** A grid-based habitat. The child places three shield types (regolith bags, water wall, polyethylene) on modules. A real RadLab-derived dose map animates through the habitat. A solar particle event spikes the map. The original mechanic: **the shield budget** — mass, power and science are three currencies; every tile moves all three.

**Demo "wow" moment.** Real ISS/LRO dose-rate data flows through the habitat; a DONKI SEP event turns the map red; the child sees exactly which module exceeded the dose limit. The dither density is the dose.

**How it uses AI.** Jev `choice` picks event severity; `score` rates the design; `noul` checks "is the crew dose under the mission limit?" No Gemini in runtime.

**Data pipeline.** RadLab DosTel/CRaTER/LND; DONKI SEP/CME; LRO terrain; a simple shielding model (areal density vs dose reduction) with a "simplified" label.

**48-hour MVP.** One habitat grid, three shield types, five events, a dose budget, a dithered dosimeter UI, end report. Stretch: a "crew placement" layer, a Mars site, a classroom challenge.

**Dither UI.** Dosimeter/Geiger-counter aesthetic: monochrome map, amber warning, solid numbers, a "science view" toggle.

**Risks.** Abstract; less narrative; might feel like a physics demo. Mitigate with a mascot "dose detective" and short story beats.

**Scores.**

| Impact | Feasibility | Novelty | Judge appeal | AI fit |
|---:|---:|---:|---:|---:|
| 7 | 9 | 8 | 7 | 5 |

### 2.5 Recommendation for Challenge A

**Build Outpost Nine.** It is the best fit for the 7–12 brief: three resources, a single screen, a 5–10 minute session, a clear delayed-cost mechanic, real DONKI/RadLab data, and a demo moment that is impossible to fake. It also has the cleanest AI story: Jev chooses among human-authored events and hints, so the game stays safe and authored; Gemini is used in the adult back office, which is the only defensible way to use it for this age group under Google's terms.

**If the team is narrative-heavy and wants lower technical risk, build Delay 14.** It needs almost no art or physics, and the message-queue mechanic is genuinely original. But it is harder to make visually spectacular for the 30-second demo.

**Do not build Dose Detective as the main entry** unless the team has a strong physics/visualization lead; it is a better second mode inside Outpost Nine.

---

## 3. Challenge B: Space Mission Design Game

Challenge page: https://www.spaceappschallenge.org/2026/challenges/space-mission-design-game/

### 3.1 Challenge in one paragraph

NASA wants an interactive game where participants **design, manage and simulate a complete space mission**, from objective and requirements through spacecraft, instruments, launch vehicle, orbit, power, mass, communications, data, budget and mission lifetime, and then see how each choice shapes success. Players can work **alone or in a team of up to four**, with roles and negotiation; the game should teach that there is rarely one perfect solution, that every major decision has a consequence, and **why** a design succeeds or fails, not just whether it does. The hidden judging hooks are: (1) a **complete mission lifecycle**, not a single-topic toy; (2) **interlocking constraints** (adding an instrument increases mass, power, data and cost); (3) **multiple valid solutions**; (4) **team roles and negotiation**; (5) **feedback and a post-mission report** that explains causes; (6) **accessible to different knowledge levels**; (7) **replayable scenarios/difficulty**; (8) real engineering logic, ideally grounded in NASA process resources (CML, MDL, CubeSat 101) and trajectories (GMAT). The "must include" items are a working interactive simulation, a mission configuration system, resource management, some collaboration/multiplayer for up to four, and a simulation/evaluation system.

**Audience reality check.** "Students" is broad. A high-school team can handle mass/power budgets and a 20-minute session; a middle-school team needs a guided first mission. The best design is a **cooperative game with private role information**, because that creates genuine negotiation rather than a single player pretending to be four people. The 48-hour trap is building a full orbital mechanics simulator; the winning move is a **curated trade space** with real numbers and a deterministic model, not a physics engine.

**Competition note.** The brief is explicitly game-first, and "mission design" is a crowded Space Apps theme (2025 PureFlow, 2022 Mars 3D Home, 2021 Mohakash). The differentiation must be the **team negotiation** and the **trade-space visualization**, not a rocket launch animation.

### 3.2 Data and resources table

| Name | URL | Format | Access/auth | Size | License | Verified? | Notes |
|---|---|---|---|---|---|---|---|
| Design and Develop Science Missions (NASA) | https://www.nasa.gov/wp-content/uploads/2025/04/250323-design-and-develop-science-mission.pdf | PDF | Free | ~2.6 MB | NASA | VERIFIED | Systems-engineering overview: launch, space, ground, user segments; requirements → design → verification. |
| GMAT | https://software.nasa.gov/software/GSC-19468-1 ; https://github.com/nasa/GMAT | C++ desktop app; GUI + script; source | Free | Large install | **Apache 2.0** for the current R2026a release; older releases used NOSA 1.3 | VERIFIED | Not browser. Run offline to precompute trajectories, then export JSON/CSV. Supports LEO, GEO, lunar, libration, interplanetary. |
| Concept Maturity Levels (CML) | https://dataverse.jpl.nasa.gov/dataset.xhtml?persistentId=hdl:2014/44299 | PDF paper | Free | Paper | NASA/JPL; check Dataverse terms | VERIFIED | CML 1–4 framework: idea → feasibility → trade studies → point design → implementation planning. Use as review gates. |
| Mission Design Lab (MDL) | https://etd.gsfc.nasa.gov/capabilities/integrated-design-center/mission-design-lab/ | Web | Free | N/A | NASA | VERIFIED | Process reference: office hours, concept development, trade studies, point design; full mission disciplines. |
| NASA Mission Viz | https://nasa.github.io/mission-viz/ | HTML/three.js/X3DOM examples | Free | N/A | NASA GitHub repo; **no explicit LICENSE file found** | VERIFIED site/repo | Three.js orrery examples and tutorials. Use as inspiration; write your own scene or use Horizons. |
| NASA "Build It Yourself" telescope game | https://science.nasa.gov/mission/webb/game-build-it-yourself/ | Web game | Free | N/A | NASA | VERIFIED | Three levels: objective → wavelength → instruments → launch → results → real mission analogs. Best design reference for "choice → consequence." |
| CubeSat 101 | https://www3.nasa.gov/sites/default/files/atoms/files/nasa_csli_cubesat_101_508.pdf | PDF | Free | ~4.2 MB | NASA | VERIFIED | ConOps, phases, mass/power/data basics for first-time CubeSat developers. Good for a smaller scenario. |
| 2023 Space Apps VR mission challenge | https://www.spaceappschallenge.org/2023/challenges/visualize-a-space-mission-using-virtual-reality/ | Web | Free | N/A | NASA | VERIFIED | Prior art: visualize mission concept, trajectory, timeline, 3D. |
| CSA Digital Games and Activities | https://www.asc-csa.gc.ca/eng/youth-educators/digital-games-and-activities.asp | Web | Free | N/A | CSA | VERIFIED | Reference for game tone and classroom framing. |
| NASA Launch Services Program | https://www.nasa.gov/launch-services-program/ | Web | Free | N/A | NASA | VERIFIED | Launch vehicle performance and mission assurance context; use public payload/user guides, not invented numbers. |
| NASA Small Spacecraft Technology State of the Art | https://www.nasa.gov/smallsat-institute/sst-soa/ | Web/PDF | Free | Large | NASA | VERIFIED | Real component masses, power, data rates and TRLs for a component catalog. |
| NASA PDS SPICE | https://naif.jpl.nasa.gov/naif/ | Data/kernels | Free | Large | NASA/JPL | VERIFIED | Geometry, ephemerides, time conversion; use SPICE kernels for real orbit positions. |
| JPL Horizons | https://ssd.jpl.nasa.gov/api/horizons.api | Text/JSON | No key | Ephemerides | NASA/JPL | VERIFIED | Real planet/spacecraft states for a 3D orrery or light-time. |
| NASA Eyes on the Solar System | https://eyes.nasa.gov/apps/solar-system/ | Web 3D | Free | N/A | NASA/JPL; data.nasa.gov says "License not specified" | VERIFIED | Inspiration for time-scrub and mission context; no public API. Link out, don't scrape. |
| NASA Open Data Portal | https://data.nasa.gov/ | Catalog | Free | Large | NASA open data | VERIFIED | Discovery layer for mission data and images. |
| NASA 3D Resources | https://github.com/nasa/NASA-3D-Resources | 3D models | Free | Large | NASA media usage | VERIFIED | Spacecraft models for a 3D view. |

**Data pipeline recommendation.** Do **not** try to run GMAT in the browser or build a full orbital propagator in 48 hours. Instead:
1. Use GMAT offline (or a simple two-body propagator written by the team) to precompute 6–10 trajectories: LEO sun-synchronous, polar lunar, lunar Gateway NRHO, Mars transfer, Mars orbit, heliocentric.
2. Export time-stamped position/velocity JSON and a "trajectory card" (delta-v, duration, coverage, launch window).
3. Build a component catalog from NASA SmallSat SOA/CubeSat 101 with mass, power, data rate, cost, TRL, and a one-line explanation.
4. Build a deterministic mass/power/data/budget model in JavaScript. It must close or fail visibly; no hidden fudge.
5. Use Horizons/SPICE only for a "real positions" panel or a 3D orrery, not for the core sim.

**How to use GMAT and Eyes on the Solar System specifically.**
- **GMAT:** use it as an offline "trajectory foundry." Build 6–10 `.script` files for the demo orbits, run them headless, and export time-stamped state vectors plus a summary card (delta-v, duration, coverage, launch window). The browser never runs GMAT. This gives the game real orbital numbers and a credible citation (GMAT R2026a, Apache 2.0) without a 48-hour physics project. For a lunar polar orbiter, precompute a polar repeat ground track; for the advanced mode, a lunar NRHO. **If nobody on the team has run GMAT before, do not learn it during the hackathon.** Use a two-body propagator or precomputed Horizons vectors, and label the trajectory "simplified." The game's value is the trade-off, not ephemeris precision.
- **Eyes on the Solar System:** use it as a **reference and a link-out**, not a dependency. It has no public API and its data license is unspecified on data.nasa.gov. Put a "See the real mission" button next to the game's orbit view that opens Eyes at the relevant body/time, and use JPL Horizons for the actual positions in your own scene.
- **NASA Mission Viz:** use the three.js orrery examples as a reading reference for scene structure and orbit scaling, but write your own scene. The repo has no explicit LICENSE file, so do not copy code until the team confirms the license.
- **NASA "Build It Yourself" telescope game:** use it as a **flow reference** (objective → instrument → launch → result → real mission analog). Do not copy its telescope-specific mechanic; your game is a full mission with a team and a budget.
- **CML/MDL:** use CML 1–4 as the three review gates and MDL's discipline list as the role sheet. This is what makes the game feel like NASA process rather than a generic builder.

### 3.3 Open-source and prior art

| Project | What it is | License | Use |
|---|---|---|---|
| NASA "Build It Yourself" telescope game | Objective → wavelength → instruments → launch → results; real mission analogs. | NASA | Design reference for the design flow and feedback. Do not clone. |
| NASA Eyes on the Solar System | 3D real-mission visualization, 1950–2050. | NASA/JPL; no public API | Reference for time-scrub and "real mission" context. |
| NASA Mission Viz | Three.js orrery examples. | NASA repo; no explicit license | Code inspiration only; confirm license before copying. |
| GMAT | Open-source mission design and optimization. | Apache 2.0 | Trajectory precomputation and credibility. |
| CML / MDL | NASA/JPL mission concept maturity and design lab process. | NASA | Review-gate structure and role design. |
| PureFlow (2025) | Habitat design + solar storm validation. | Space Apps entry | Prior art; differentiate at mission level, not habitat layout. |
| Mars 3D Home (2022) | Mars habitat resource optimization for 668 sols. | Space Apps entry | Prior art for resource budgeting. |
| Mohakash (2021 Best Mission Concept) | Interactive 3D lunar regolith scoop. | Space Apps entry | Prior art for a single-vehicle design toy; your game is a full mission. |
| Kerbal Space Program / Space Agency / Buzz Aldrin's Space Program Manager | Commercial mission/rocket games. | Commercial | Do not clone. Use only as "what players already know" context. |

**Originality guardrails.** Do not make "Kerbal with a budget" or "Surviving Mars with an orbit." The original mechanics proposed here are: **private role information** (each role sees a different part of the trade space), **review gates with a typed AI board**, and a **trade-space contour map** where the team's design point moves as they negotiate. The map is the game, not the rocket animation.

### 3.4 Project concepts

**Scoring note.** Scores are 1–10 **within this challenge**, not cross-challenge portfolio ranks.

#### Concept B1: **Trade Space** (recommended)

**Pitch line.** Four roles, one spacecraft, one budget. Move the design point across a real trade space until the review board says yes — or the mass margin says no.

**Target user.** Middle-school to undergraduate teams, 1–4 players; classroom or museum; a facilitator can run it. The guided first mission is for beginners; the sandbox is for advanced teams.

**Core experience.** Four roles: **Science PI**, **Systems Engineer**, **Power/Thermal**, **Comms/Ops**. Each has a private sheet: the PI knows the science priorities and the minimum instrument set; the systems engineer knows the mass margin and the integration penalties; power/thermal knows the generation and dissipation limits; comms/ops knows the data volume and ground-contact windows. Players choose from 12 components, 3 orbits and 3 launch vehicles, then run a 60-second deterministic simulation. The **trade-space contour map** shows science return vs cost vs risk; every choice moves the team's design point. At three review gates (CML 1, 2, 3), Jev asks a review question and scores the proposal; the board can pass, revise or fail. A **guided first mission** suggests a starting design and three hints; a sandbox mode drops the hints for advanced teams. This is the accessibility dial the brief asks for. **This is not a rocket-building sandbox:** there is no manual piloting and no procedural solar system. It is a three-gate design review over a curated trade space.

**Demo "wow" moment.** After the sim, the game replays the team's decision path and shows the exact choice that closed the mass margin — then reveals another region of the trade space that would have scored higher. The lesson is "there was no perfect answer, only a different set of compromises." The dither contour map makes the trade space visible.

**How it uses Jev and other AI.**
- **Jev `noul`**: mass closure, power closure, data closure, cost closure, launch compatibility — but only as a **cross-check**; the deterministic model is the source of truth.
- **Jev `choice`**: which review question to ask next (mass, power, comms, science, risk), based on the team's weak point and prior answers.
- **Jev `score`**: rubric score for science return, engineering realism, budget efficiency, and teamwork (from a short team reflection, not from chat surveillance).
- **Jev `choice`**: pass / revise / fail recommendation; the human facilitator or the game rule makes the final call.
- **Jev I/O:** in = design summary (mass/power/data/cost margins, orbit, launch, instruments, team reflection) + the review rubric; out = closure cross-checks, next review question, rubric score, pass/revise/fail recommendation. The deterministic model owns the numbers.
- **Gemini 4 Hydrogen**: **adult/educator back office** only — generate the scenario brief, the review-board narrative, the post-mission report, and the classroom debrief from the structured game log. For a high-school audience this is still under-18, so keep Gemini out of the player runtime. If the team wants a player-facing "board chair" voice, pre-record or template it.

**Data pipeline.**
1. Component catalog JSON from NASA SmallSat SOA/CubeSat 101 (mass, power, data, cost, TRL, notes).
2. Trajectory cards from GMAT or a simple propagator; orbit coverage and launch windows precomputed.
3. Launch vehicle table with payload-to-orbit, cost class, and a "representative, not procurement" label.
4. Deterministic model: mass = dry + payload + propellant + margin; power = generation − eclipse − payload − thermal; data = generation − downlink × contacts; cost = components + launch + ops + margin.
5. Jev review questions tied to the model outputs; no Jev arithmetic.

**48-hour MVP.**
- One scenario: a lunar polar orbiter with three science objectives.
- 12 components, 3 orbits, 3 launch vehicles.
- Four roles, **hot-seat** (one device, pass-and-play) rather than networked multiplayer.
- Three review gates, a deterministic sim, a dither contour map, a post-mission report.
- Jev review board with cached fixtures.
- Stretch: room-code multiplayer (Colyseus/PartyKit/Firebase), a Mars scenario, a sandbox mode, save/share.

**How the dither UI fits.** A blueprint/drafting-table aesthetic: monochrome technical drawing, a Bayer-dithered contour map, solid tables and numbers, one safety-orange accent for risk. The 3D orbit view (three.js) uses a dithered starfield and a crisp orbit line. A "science view" toggle shows the continuous contour map with a legend.

**Risks.** The model can be too shallow (players find the dominant strategy) or too complex (nobody finishes). Mitigate with one scenario and three meaningful trade-offs, not twenty. Multiplayer scope: hot-seat first. Jev review can feel arbitrary; show the rule and the model output, and let the human facilitator override. Launch data licensing: use public NASA/industry user guides and label "representative."

**Scores.**

| Impact | Feasibility | Novelty | Judge appeal | AI fit |
|---:|---:|---:|---:|---:|
| 9 | 7 | 8 | 9 | 8 |

#### Concept B2: **Orbit Roulette**

**Pitch line.** Pick an orbit, bet on how many ground contacts you will get, and watch the real ground track prove you wrong.

**Target user.** Ages 12+, museum, classroom; 1–2 players.

**Core experience.** A fast orbital-mechanics puzzle. Choose one of three orbits and a ground-station network; place a bet on the number of contacts/targets you will get in 24 hours; the simulation reveals the real ground track and contact windows. Resources: coverage, power, data rate. The original mechanic: **coverage poker** — you commit before the simulation.

**Demo "wow" moment.** The real ISS ground track and real DSN station locations appear; the player sees why a polar orbit is needed for global coverage, and why a geostationary orbit cannot see the poles.

**How it uses AI.** Jev `choice` picks the target set/difficulty; `score` rates the orbit choice; `noul` checks "does this orbit meet the coverage requirement?" No Gemini in runtime.

**Data pipeline.** Horizons for real ephemerides; a simple orbit propagator; ground-station coordinates; GMAT precomputed coverage for the demo orbits.

**48-hour MVP.** 2D ground-track map, three orbits, three target sets, contact simulation, a score, a short explainer. Stretch: a 3D globe, real-time ISS tracking, a two-player bet.

**Dither UI.** Radar/ground-track display: monochrome world map, dithered coverage bands, solid station labels, one accent for "contact."

**Risks.** Niche; feels like a mini-game rather than a complete mission; less narrative. Use it as a mini-game inside Trade Space rather than a standalone entry.

**Scores.**

| Impact | Feasibility | Novelty | Judge appeal | AI fit |
|---:|---:|---:|---:|---:|
| 7 | 9 | 7 | 7 | 6 |

#### Concept B3: **Mission Architect: Crewed**

**Pitch line.** Design a crewed lunar mission where the science lead, the engineer, the doctor and the logistician each know something the others don't — and the review board can see every hand-wave.

**Target user.** Advanced high-school/undergraduate teams; 4 players; a facilitator.

**Core experience.** A crewed lunar surface mission with habitat, life support, radiation, power, thermal, logistics and abort. Four roles with private information. Three CML gates; each gate requires a design decision and a written rationale. The original mechanic: **the hand-wave ledger** — whenever the team accepts an unresolved risk, the game records it as a "hand-wave" and shows it in the final CML report. The goal is not zero risk; it is honest risk.

**Demo "wow" moment.** The final report shows the team's CML maturity: what they resolved, what they deferred, and which deferred item would have killed the mission. The dither blueprint fills in as the design matures.

**How it uses AI.** Jev `choice` selects the next review question; `score` rates the rationale and the risk honesty; `noul` checks "is this risk actually mitigated or only named?" Gemini in the educator back office writes the CML report from the structured log.

**Data pipeline.** CML/MDL process; HRP risks for crew health; NASA life support and habitat data; Artemis public architecture; a deterministic mass/power/thermal/life-support model.

**48-hour MVP.** One lunar surface mission, four roles, 20 components, three gates, hot-seat, a CML report. Stretch: a Mars transit scenario, a multiplayer room, a facilitator dashboard.

**Dither UI.** Blueprint/technical drawing with a dithered habitat cutaway; solid tables; red accent for unresolved risks.

**Risks.** Too complex for beginners; data gaps in life support; 48h scope. Use it as an "advanced mode" or a stretch goal for Trade Space.

**Scores.**

| Impact | Feasibility | Novelty | Judge appeal | AI fit |
|---:|---:|---:|---:|---:|
| 9 | 6 | 8 | 8 | 8 |

#### Concept B4: **CubeSat Courier**

**Pitch line.** Build a CubeSat, pick a launch, and try to close the link before the budget runs out.

**Target user.** Ages 12–18; classroom; 1–2 players.

**Core experience.** A 1U/3U CubeSat builder with six components (camera, radio, battery, solar panel, ADCS, payload). Choose a launch opportunity from NASA's CubeSat Launch Initiative-like list, an orbit, and a ground station. Run a 30-day mission with five anomalies. The original mechanic: **the link budget seesaw** — every data-rate upgrade costs power or mass.

**Demo "wow" moment.** The CubeSat deploys, the ground track appears, and the first contact fails because the antenna gain was too low; the player sees the link budget numbers, not a random fail.

**How it uses AI.** Jev `choice` selects anomalies; `score` rates the design; `noul` checks link closure. Gemini in the educator back office for the mission report.

**Data pipeline.** CubeSat 101; NASA CSLI launch list; a component catalog; a simple link budget and power model; Horizons for the orbit.

**48-hour MVP.** 1U/3U builder, six components, three launch options, five anomalies, a link budget, a score, a report. Stretch: a real ground-station pass, a 3D deploy animation.

**Dither UI.** Mission-patch/telemetry aesthetic: dithered patch, solid budget table, one accent for "contact."

**Risks.** Niche; less collaboration; shallow physics. Use as a tutorial mission inside Trade Space.

**Scores.**

| Impact | Feasibility | Novelty | Judge appeal | AI fit |
|---:|---:|---:|---:|---:|
| 7 | 9 | 7 | 7 | 6 |

### 3.5 Recommendation for Challenge B

**Build Trade Space.** It is the only concept that hits all four hard requirements at once: a complete mission lifecycle, interlocking constraints, genuine four-player negotiation, and a post-mission explanation. It also gives the team a distinctive visual identity (the dither trade-space map) and a defensible AI role (Jev as a typed review board, not a physics oracle). Keep the simulation deterministic and the scenario curated; do not build a physics engine.

**Use GMAT offline, not in the browser.** Precompute 6–10 trajectories and export JSON. Cite GMAT R2026a and Apache 2.0 in the References. This is more credible than a fake orbit and cheaper than an in-browser propagator.

**Stretch, not MVP:** networked multiplayer, Mission Architect: Crewed, Orbit Roulette. A hot-seat four-role game is enough to win the collaboration criterion and is far more likely to be finished.

---

## 4. Challenge C: Create Health Monitoring Software for Astronauts

Challenge page: https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/

### 4.1 Challenge in one paragraph

NASA wants a **visual tool that helps astronauts assess their own health** during long-duration missions and gives guidance on treatment and improvement. It can take any input — keyboard, mouse, camera — as long as it represents a health indicator (blood pressure, heart rate, blood sugar, body temperature, sleep hours, mood, ultrasound, etc.). The tool should use NASA HRP resources to decide which indicators matter, which measurements are feasible in space, why an exam is needed, how spaceflight hazards affect the indicator, when a result warrants crew or flight-surgeon attention, and what actions prevent a critical condition. The hidden judging hooks are: (1) **astronaut self-assessment**, not a doctor dashboard; (2) **clear visual hierarchy** and color coding; (3) **simple instructions** for non-medical crew; (4) **dynamic charts** and trends; (5) **a body figure** or other intuitive navigation; (6) **gamification** that supports adherence without trivializing health; (7) **different environments** (spacecraft, station, rover, planetary base); (8) **prompts for measurements** as part of the mission routine. The "must include" items are a working visual tool, at least one real health indicator, a link to HRP evidence, and a clear action/guidance path. The biggest hidden hook is **clinical safety**: a tool that looks like a diagnostic device but has no clinician review will lose on Validity and could be unsafe.

**Audience reality check.** Astronauts are highly trained but not clinicians; they are also a tiny, highly identifiable population. The app must be usable in a dim cabin, with gloves or one hand, on a tablet, offline, and with no assumption of medical knowledge. It must never imply a diagnosis it cannot support. The strongest demo is a **trend + evidence + action** loop, not a chatbot.

### 4.2 What the biomedical data actually is

This is the part most teams will get wrong. "NASA HRP data" is not one downloadable CSV. There are four different layers, with different access rules.

#### Layer 1: HRP risk knowledge (open, HTML/PDF)

NASA's Human Research Program maps **five hazards** — space radiation, isolation and confinement, distance from Earth, gravity fields, hostile/closed environments — to a set of **human-system risks**. The public risks page lists, among others: altered immune responses; altered sensorimotor/vestibular function; cardiovascular adaptations; decompression sickness; host-microorganism interactions; hypoxia; inadequate food and nutrition; EVA injury/performance; reduced cardiorespiratory and musculoskeletal fitness; SANS (spaceflight-associated neuro-ocular syndrome); spaceflight-induced bone changes; behavioral changes and psychiatric disorders; inadequate teamwork; inadequate sleep and irregular schedules; inadequate systems operations support; injury from dynamic loads; radiation-induced cancers. — VERIFIED: https://www.nasa.gov/hrp/hazards/ and https://www.nasa.gov/hrp/risks/

The **Human Research Roadmap (HRR)** is the deeper, structured evidence base: risks, gaps, tasks, evidence reports, and causal DAGs. It is public and browsable, but it is a web application, not a clean API. — VERIFIED: https://humanresearchroadmap.nasa.gov/ and https://humanresearchroadmap.nasa.gov/evidence/

This layer is ideal for **content**: each indicator gets a "why it matters in space" card with a risk link and an evidence citation. It is not a time-series dataset.

#### Layer 2: OSDR — open space life sciences (mostly open)

The **NASA Open Science Data Repository (OSDR)** integrates GeneLab (omics) and the Ames Life Sciences Data Archive (ALSDA) phenotypic/physiological/behavioral/bioimaging data. It holds 500+ studies across microbes, plants, animals and humans, plus payload/mission/hardware records. — VERIFIED: https://science.nasa.gov/biological-physical/data/osdr/ and https://osdr.nasa.gov/bio/repo/

Access:
- **Public metadata and processed data** are available without login for most studies.
- **Human astronaut-derived processed data** are publicly accessible in many cases, but **human sequence data are controlled-access** and require an OSDR data access request. — VERIFIED: https://science.nasa.gov/reference/osdr-faq/
- The **Biological Data API v2** supports REST traversal and compound metadata/data queries; output JSON, CSV, TSV, HTML. A public AWS S3 bucket is also available (specify the OSD version). — VERIFIED: https://visualization.osdr.nasa.gov/biodata/api/ and the OSDR tutorials.
- A query for `study.characteristics.organism=Homo sapiens` returned **4,356 sample-level metadata records** in this pass. That is enough to build a real "human spaceflight indicators" catalog, but not a clean longitudinal clinical dataset. — VERIFIED: `https://visualization.osdr.nasa.gov/biodata/api/v2/query/metadata/?study.characteristics.organism=Homo%20sapiens&format=json.records`

OSDR is where a team can find **Inspiration4** datasets (4 crew, 3 days, PBMC/urine/serum/microbiome), **OSD-343** (multi-omics including Twin Study confirmatory data and 59 astronaut biomedical profiles), and many model-organism studies that inform bone, muscle, immune and microbiome risks. — VERIFIED: OSDR API; OSD-343 page https://osdr.nasa.gov/bio/repo/data/studies/OSD-343

#### Layer 3: LSDA/NLSP and LSAH — controlled human data

The **Life Sciences Data Archive (LSDA)** was the historical human/animal research archive. Its website transitioned in September 2022 to the **NASA Life Sciences Portal (NLSP)**. `lsda.jsc.nasa.gov` now redirects to `nlsp.nasa.gov`. — VERIFIED: NTRS 20220014789 and live redirect.

NLSP holds:
- **LSDA**: de-identified human research data from spaceflight and analog missions dating back to 1961.
- **LSAH**: the Lifetime Surveillance of Astronaut Health, which uses medical monitoring data for astronaut health surveillance.

Data request tiers and timelines (from NLSP's guidelines):
- **Pooled**: grouped means/ranges; much is public.
- **De-identified**: individual points with identifiers removed; quickest with scientific merit; allow **~13 months** lead time.
- **Attributable (identifiable)**: requires full NASA IRB approval and LSAH Advisory Board review; allow **~25 months**.

The process includes a data-set/format refinement, attributability assessment, IRB approval, informed consent, a Data Use Agreement, and ongoing LSAH Advisory Board review. — VERIFIED: https://nlsp.nasa.gov/data-request-guidelines

This is not a 48-hour data source. It is a **content and credibility** source: cite the process, explain why the demo uses synthetic or aggregate data, and show that you understand the privacy constraints. That is a differentiator.

#### Layer 4: Twins Study — a landmark, but not a download

The NASA Twins Study compared Scott Kelly (340 days on the ISS) with his identical twin Mark Kelly on Earth over 25 months, across 10 investigations and 84 researchers at 12 universities. It collected 317 samples and generated physiological, telomeric, transcriptomic, epigenetic, proteomic, metabolomic, immune, microbiomic, cardiovascular, vision and cognitive data. — VERIFIED: https://www.nasa.gov/twins-study-the-research/ and https://www.science.org/doi/full/10.1126/science.aau8650

Key findings to use carefully:
- 91.3% of Scott's gene-expression levels returned to baseline within six months of landing.
- Telomere elongation during flight; some short telomeres persisted.
- Genome instability (chromosomal inversions), carotid artery changes, ocular changes, microbiome shifts, and some cognitive decline post-flight.
- The flu vaccine worked in flight; immune response was not uniformly suppressed.
- The study is **N=1 in flight**, hypothesis-generating, not causal. — VERIFIED: NASA Twins Study about page and the Science paper.

Data access: the Science paper says the LSDA is the repository and data requests start there. The Twins data are highly identifiable (two public figures), so **no fully open individual dataset was found**; access is through the LSDA/NLSP request process. Derived/confirmatory data appear in OSDR OSD-343. — VERIFIED: Science paper data-availability statement; OSD-343 description; AMA Journal of Ethics on Twins privacy.

**Use in a 48-hour app:** use the Twins Study as **narrative evidence** for baseline variability and recovery, not as a training dataset. If you need longitudinal human data, use **synthetic data** calibrated to published effect sizes, or aggregate OSDR/Inspiration4 trends. Do not imply you have individual astronaut data.

#### Wearables: Bio-Monitor and Astroskin

| Device | What it measures | Form factor / operation | Status | License/access |
|---|---|---|---|---|
| **CSA Bio-Monitor** | ECG/heart rate, blood pressure, breathing rate and volume, skin temperature, SpO2, physical activity | Smart shirt + headband + tablet app; worn during sleep and exercise; data downloaded via a base station to the ground | Launched Dec 2018; commissioned on ISS Jan 2019; used in CSA Space Health and CARDIOBREATH. Hexoskin (the commercial partner) reports 20 space payloads and a Nov 2024 CSA Gateway adaptation contract. | CSA hardware; commercial version is Hexoskin. Data not open. — VERIFIED for CSA specs: https://www.asc-csa.gc.ca/eng/sciences/bio-monitor.asp ; company claims: https://hexoskin.com/blogs/news/hexoskin-wins-contract-to-bring-astroskin-sensors-to-the-moon |
| **Astroskin** | 3-lead ECG (RR/QRS/HR), RIP respiration (rate, minute ventilation, tidal volume), PPG/SpO2 via headband, continuous systolic BP via pulse transit time, skin temperature, 3-axis accelerometer | Smart shirt + data recorder; 48 h continuous on one charge; 69,000+ data points/min; 400 h loop raw recording; Bluetooth 2.1; iOS/iPadOS app | Commercial/research version of Bio-Monitor; used in HERA, HI-SEAS, Antarctic testing, a Virgin Galactic suborbital flight; CSA Gateway contract | Hexoskin/Astroskin commercial terms; SDK/API licenses available. — VERIFIED: https://hexoskin.com/blogs/news/astroskin and https://support.hexoskin.com/what-are-the-differences-between-hexoskin-and-astroskin |
| **Hexoskin** | 1-lead ECG/HR/HRV, dual RIP respiration, activity/sleep | Commercial smart shirt; 36 h raw recording; BLE | Used by hundreds of research groups, including pediatric research (Hexoskin Junior, ages 3–17) | Commercial; open API/SDK options. — VERIFIED: CSA Bio-Monitor page and Hexoskin support page |

**What this means for the app.** The wearable layer is real and well-specified, but the data are not open. Build a **device-agnostic ingestion layer** (manual entry, CSV import, Web Bluetooth HR strap, synthetic generator) and label the demo data. Do not claim to integrate with Bio-Monitor/Astroskin unless you have a device or a data agreement. The CSA Space Health study's AI platform "Artemis" is a good prior-art reference: it stores, analyzes and visualizes Bio-Monitor data for cardiovascular deconditioning, with 10 astronauts, 48-hour continuous measurements, 2023–2028. — VERIFIED: https://www.asc-csa.gc.ca/eng/sciences/space-flight-improve-monitor-health-earth.asp

#### Privacy: the hidden judging hook

Astronaut health data is a small-N, high-identifiability problem. NASA's own work says stratified astronaut data can be so small that reporting is potentially attributable to individuals, and that the astronaut population is small in numbers and exposure density. — VERIFIED: NTRS 20210023989, "Watching Without Seeing."

The legal/ethical stack:
- **Privacy Act of 1974** for U.S. federal agency records; astronaut medical data is protected.
- **HIPAA** protections are cited by NLSP for LSAH data; the data-request process includes IRB, informed consent and a Data Use Agreement.
- **45 CFR Part 46** (Common Rule) for human-subjects research.
- **GINA** for genetic information; NASA restricts genetic research and sharing.
- **COPPA** if any child-facing demo collects voice/photo data (see 1.2).
- **GDPR** if the team or users are in the EU/UK; health data is a special category, and the EU digital age of consent defaults to 16 (member states may lower to 13). — VERIFIED for GDPR Art. 8: https://gdpr-info.eu/art-8-gdpr/
- **Medical device regulation**: a tool that diagnoses or treats may be regulated as software as a medical device. For the hackathon, label it "research prototype, not a medical device," avoid diagnostic claims, and have a clinician review the content.

Design rules that follow:
1. **Data minimization**: collect only the indicators needed for the demo; no name, no date of birth, no mission ID in the demo dataset.
2. **On-device by default**: store in IndexedDB/local storage; encrypt at rest if possible; no server.
3. **De-identification**: use a random session ID; aggregate crew dashboards; suppress small cells (n<5) in any crew view.
4. **Retention**: a written retention rule; delete demo data on reset.
5. **Consent**: a clear "this is a simulation" screen; if a real user enters data, an explicit consent screen.
6. **Human-in-the-loop**: any urgent flag goes to a flight surgeon; the app never auto-treats.
7. **Explainability**: every flag shows the evidence (values, baseline, trend, rule, citation) and the confidence.
8. **Security**: no API keys in the client; no third-party analytics; no logging of health values.
9. **Model data handling**: never send real astronaut health data to a free-tier model (Gemini's free tier is used to improve products). Use paid/enterprise terms with no-training or zero-retention, or keep the data on-device and send only a de-identified structured state to Jev.
10. **Equity**: sex/gender differences, medication effects, and baseline variability; the Twins Study shows large individual variation. Do not use one-size-fits-all thresholds without a citation.
11. **Clinician review**: a space-medicine advisor reviews the rules and the wording; this is the single biggest credibility multiplier.

### 4.3 Data and resources table

| Name | URL | Format | Access/auth | Size | License | Verified? | Notes |
|---|---|---|---|---|---|---|---|
| 5 Hazards of Human Spaceflight | https://www.nasa.gov/hrp/hazards/ | HTML | Free | N/A | NASA | VERIFIED | The five hazards; links to detailed hazard pages. |
| Risks of Human Spaceflight | https://www.nasa.gov/hrp/risks/ | HTML | Free | N/A | NASA | VERIFIED | 17+ risks across physiology, behavior and radiation. |
| Ongoing HRP Research | https://www.nasa.gov/hrp/ongoing-hrp-research/ | HTML | Free | N/A | NASA | VERIFIED | Current research articles; good for "what's being studied now." |
| Human Research Roadmap (HRR) | https://humanresearchroadmap.nasa.gov/ | Web DB/HTML | Free | Risks, gaps, tasks, evidence reports | NASA | VERIFIED | The structured evidence base; no clean API found. |
| HRR Evidence Reports | https://humanresearchroadmap.nasa.gov/evidence/ | HTML/PDF | Free | Many reports | NASA | VERIFIED | Evidence reports per risk; best source for "why this indicator matters." |
| NASA OSDR | https://osdr.nasa.gov/bio/repo/ | Web/JSON/CSV/S3 | Public; controlled for human sequence | 500+ studies | NASA SMD open; cite | VERIFIED | See 4.2. |
| OSDR Biological Data API | https://visualization.osdr.nasa.gov/biodata/api/ | REST/query; JSON/CSV/TSV | No auth for public | Full repo | NASA open; cite | VERIFIED | Use exact metadata field names (e.g. `study.characteristics.organism`). |
| RadLab | https://visualization.osdr.nasa.gov/radlab/gui/data-api/ | GET; CSV/TSV/JSON/HTML | No auth | ISS/BLEO/Moon/Mars | NASA open; credit | VERIFIED | Radiation dose is a real, continuous, mission-relevant indicator. |
| NASA Life Sciences Portal (NLSP) | https://nlsp.nasa.gov/explore/lsdahome | Web portal | Free; data requests reviewed | 1961–present | Privacy Act/HIPAA/45 CFR 46; data use agreement | VERIFIED | LSDA + LSAH. `lsda.jsc.nasa.gov` redirects here. |
| NLSP data request guidelines | https://nlsp.nasa.gov/data-request-guidelines | HTML | Free | N/A | NASA | VERIFIED | Pooled public; de-identified ~13 months; attributable ~25 months. |
| LSAH overview | https://nlsp.nasa.gov/resources/lsah | HTML | Free | N/A | NASA | VERIFIED | Occupational surveillance; grouped data only; Privacy Act/HIPAA. |
| Twins Study overview | https://www.nasa.gov/twins-study-the-research/ | HTML | Free | N/A | NASA | VERIFIED | 10 investigations, 84 researchers, 12 universities. |
| Twins Study results | https://www.nasa.gov/humans-in-space/twins-study/about/ | HTML | Free | N/A | NASA | VERIFIED | 91.3% gene expression returned; resilience/robustness. |
| Twins Study Science paper | https://www.science.org/doi/full/10.1126/science.aau8650 | HTML/PDF | Free abstract; full text may require access | 25 months, 317 samples | AAAS/Science terms | VERIFIED | Data-availability statement points to LSDA. |
| OSD-343 (Twin Study confirmatory multi-omics) | https://osdr.nasa.gov/bio/repo/data/studies/OSD-343 | Web/JSON/files | Public | 28.49 GB (page) | NASA open; cite DOI 10.26030/h968-2m75 | VERIFIED | 59 astronaut biomedical profiles + Twin Study confirmatory data. |
| CSA Bio-Monitor | https://www.asc-csa.gc.ca/eng/sciences/bio-monitor.asp | HTML | Free | N/A | CSA | VERIFIED | Shirt + headband + tablet; 6 vital signs; launched 2018. |
| CSA Space Health study | https://www.asc-csa.gc.ca/eng/sciences/space-flight-improve-monitor-health-earth.asp | HTML | Free | N/A | CSA | VERIFIED | Bio-Monitor + AI platform Artemis; 10 astronauts; 48h; 2023–2028. |
| CSA CARDIOBREATH | https://www.asc-csa.gc.ca/eng/sciences/cardiobreath.asp | HTML | Free | N/A | CSA | VERIFIED | Bio-Monitor + cycling; cardiovascular/respiratory deconditioning. |
| CSA radiation monitoring article | https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp | HTML | Free | N/A | CSA | VERIFIED | Canadian technologies and research for measuring astronaut radiation exposure. |
| CSA "Why do we conduct science experiments in space?" | https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp | HTML | Free | N/A | CSA | VERIFIED | Plain-language context for why space biology/health research matters. |
| Astroskin (CSA) | https://www.canada.ca/en/space-agency/news/2016/10/astroskin.html | HTML | Free | N/A | CSA | VERIFIED | 3-lead ECG, RIP, BP, SpO2, skin temp, activity; Q7 processor. |
| Astroskin (Hexoskin) | https://hexoskin.com/blogs/news/astroskin | HTML | Free | N/A | Hexoskin commercial | VERIFIED | 48h, 69k data points/min, 400h loop, iOS apps, API. |
| Hexoskin vs Astroskin | https://support.hexoskin.com/what-are-the-differences-between-hexoskin-and-astroskin | HTML | Free | N/A | Hexoskin commercial | VERIFIED | Differences and specs. |
| Hexoskin Gateway contract | https://hexoskin.com/blogs/news/hexoskin-wins-contract-to-bring-astroskin-sensors-to-the-moon | HTML | Free | N/A | Hexoskin commercial | VERIFIED | CSA contract to adapt Astroskin for Gateway, Nov 2024. |
| EveryWear | https://www.medes.fr/en/project/everywear-app/ | HTML | Free | N/A | MEDES/CNES/ESA | VERIFIED | Operational ISS medical/nutrition app; sensors, questionnaires, private messaging. |
| EveryWear on Artemis II | https://blogs.esa.int/orion/2026/04/06/everywear-from-earth-orbit-to-the-moon/ | HTML | Free | N/A | ESA | VERIFIED | Adapted for Orion; encrypted at source; private key access. |
| CHP-IDA | https://ntrs.nasa.gov/citations/20240004807 | PDF | Free | N/A | NASA; "Public Use Permitted" | VERIFIED | NASA Crew Health and Performance Integrated Data Architecture; back-end data model/API. |
| Hermes (TRISH/BCM) | https://www.bcm.edu/academic-centers/space-medicine/translational-research-institute/research/hermes | HTML | Free | N/A | TRISH/BCM | VERIFIED | Real-time medical/health/performance/environmental data platform. |
| CMO-DA (NASA/Google/Ejenta) | https://www.ejenta.com/news/ejenta-nasa-ai-collaboration | HTML | Free | N/A | NASA/Google/Ejenta | VERIFIED | LLM + agents + point-of-care ultrasound; prototype; NASA Trustworthy AI principles. |
| SGPT paper | https://doi.org/10.1038/s41526-025-00503-x | Journal article | Free/abstract | N/A | Nature/npj terms | VERIFIED | Local LLM for space medicine; <50B parameter target; Bayesian questioning. |
| Reaction Self-Test (PVT-B) | https://ntrs.nasa.gov/citations/20140000075 | NTRS record | Free | N/A | NASA | VERIFIED | 3-minute PVT-B on ISS since 2009; fatigue/alertness self-test. |
| COPPA final rule | https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule | HTML | Free | N/A | U.S. Government | VERIFIED | Voiceprints/facial templates are personal information; compliance 22 Apr 2026. |
| Gemini API Additional Terms | https://aistudio.google.com/docs/terms | HTML | Free | N/A | Google | VERIFIED | 18+; no under-18-directed API clients. |
| Space Apps legal | https://www.spaceappschallenge.org/legal/ | HTML | Free | N/A | NASA | VERIFIED | Open-source, citations, no PII/under-18 likeness. |
| Space Apps participant FAQ | https://www.spaceappschallenge.org/resources/participant-faqs/ | HTML | Free | N/A | NASA | VERIFIED | SI disclosure; under-18 rules; event dates. |

### 4.4 Open-source and prior art

| Project | What it is | License | What to learn / use |
|---|---|---|---|
| **HELIOS** (Oct 2026) | Offline-first PWA for astronaut health: 24 indicators, personal baselines, sudden/sustained/slow drift detection, evidence, on-board protocols, EVA go/no-go, flight-surgeon message. Uses OSDR Inspiration4 for lab models, PMData/MMASH for HRV. | **No license chosen; all rights reserved** | The closest direct prior art. Do not copy code. Learn the baseline/trend framing and the "not a medical device" disclaimer. https://github.com/WillBettleheim/Helios |
| **EveryWear** | Operational ISS/Orion medical and human-research app: nutrition, medication, questionnaires, sensors, private messaging; encrypted at source. | Operational/institutional (MEDES/CNES/ESA); no open-source license found | The best real-world reference for workflow, privacy and crew usability. |
| **CHP-IDA** | NASA back-end data architecture for crew health/performance data: common data models, APIs, analytics, EVA metabolic rate, medical device ingestion. | NASA public use (NTRS) | Reference architecture for a data layer; do not rebuild it in 48h. |
| **Hermes** | TRISH/BCM platform for real-time medical/health/performance/environmental data; device-agnostic; supports remote care. | Institutional platform; no open-source license found | Reference for interoperability and "sensor → platform → clinician" flow. |
| **CMO-DA** | NASA/Google/Ejenta LLM + agentic system for a non-medical crew medical officer; guides ultrasound; prototype. | NASA/Google/Ejenta; no open-source release found | Prior art for AI-guided procedures and the safety framing. |
| **SGPT** | Local LLM for space medicine, <50B parameters, Bayesian questioning. | Research paper | Prior art for offline clinical reasoning; do not claim clinical validation. |
| **Reaction Self-Test (PVT-B)** | 3-minute ISS cognitive/alertness test. | NASA | A real, feasible, low-burden indicator for the app. |
| **Halo** (2025 local winner) | Exoskeleton + sensor + mental-health questionnaire; local server; PolyForm Noncommercial license. | **PolyForm Noncommercial 1.0.0** | Prior art for combining physical and mental health; not open source, do not reuse. https://github.com/Kirchenfeldrobotics/Halo-Nasa-Space-Apps-Challenge-Lucerne-25 |
| **SpaceGenes+** (2025 Best Use of Science) | Interactive dashboard for radiation + microgravity effects on astronaut health. | Space Apps entry | Prior art for OSDR-based health visualization; your app is self-assessment, not research. https://www.nasa.gov/learning-resources/stem-engagement-at-nasa/nasa-announces-2025-international-space-apps-challenge-global-winners/ |
| **NeuroSpace** | 7-model astronaut physical/mental health monitor (text, face, speech, bone, sleep, vitals). | MIT | Prior art for multimodal health; face/speech features raise privacy issues. https://github.com/yasser-alhasaniyyah/neurospace-health-ai |
| **STAR PLUS** | Synthetic astronaut telemetry dashboard with baselines and decision support. | MIT | Prior art for UI and baseline framing; synthetic data. https://github.com/ariandesu/star-plus |

**Originality guardrails.** Do not build "a dashboard with a chatbot." The original mechanics proposed here are: **personal baseline bands** (not population thresholds), **evidence-first flags** (every flag expands to values + trend + rule + citation), and **a body map as a navigation layer** (not a gimmick). The AI is a triage/routing layer, not the product.

### 4.5 Project concepts

**Scoring note.** Scores are 1–10 **within this challenge**, not cross-challenge portfolio ranks.

#### Concept C1: **Vitals Ledger** (recommended)

**Pitch line.** A 90-second daily self-check that learns your normal, shows the drift before you feel it, and gives you the evidence to send to the flight surgeon.

**Target user.** Astronauts on ISS/lunar/Mars missions; analog crews; flight surgeons on the ground.

**Core experience.** A tablet app, offline-first. **This is not a 24-indicator clinical dashboard:** it is six indicators, one crew profile, evidence-first flags, and a typed AI triage layer. The narrow scope is the point. Each day:
1. Wearable sync or manual entry: resting HR, HRV, SpO2, skin temperature, sleep hours, body mass.
2. A 6-question symptom check (tap body area + severity + duration).
3. A 3-minute PVT-B reaction test (tap when the counter appears).
4. Radiation dose from the mission log or RadLab.
5. Optional camera input: a photo of a medication label, a skin area or a wound, with on-device face/identifier blurring; the app routes it to a clinician-reviewed checklist, never a diagnosis.
6. A "readiness" view: green/amber/red bands against the astronaut's **own** preflight and in-flight baseline, with a trend sparkline and a one-sentence explanation.
7. If a flag is amber/red, an evidence panel: values, baseline, trend, rule, HRP citation, and a recommended action (self-care, repeat measurement, notify flight surgeon).
8. A "send to ground" button that packages a concise, structured report (no free-text diagnosis).
9. Gentle gamification: a daily check-in streak, a "mission readiness" badge, and a completed-check-in count — no punitive scoring, no competition, no public leaderboard.

**Demo "wow" moment.** The app detects a **slow multi-week drift** — sleep down, resting HR up, HRV down, reaction time up — that no single reading would flag. The evidence panel shows the four trends converging, the rule that fired, and the exact message the astronaut can send. This is a strong, credible "AI helps you see what you'd miss" moment.

**How it uses Jev and other AI.**
- **Jev `choice`**: disposition — self-care / repeat measurement / notify flight surgeon / urgent. Criteria are clinician-authored.
- **Jev `noul`**: red-flag check (chest pain, dyspnea, confusion, focal deficit, severe dehydration, etc.). If the probability is above the clinician-set threshold (e.g. 0.5 in the demo), escalate regardless of other scores.
- **Jev `score`**: severity 0–4; `trend` noul for sustained drift.
- **Gemini 4 Hydrogen** (adult/clinician-facing): summarize the structured findings into a plain-language note, retrieve the relevant HRP/HRR passage, and draft the "what this might mean" explanation. It may only use values present in the case file; a second Jev `noul` checks that every claim is supported. Gemini is not the triage decision-maker.
- **Jev I/O:** in = de-identified indicator summary + symptom text + clinician-authored criteria; out = red-flag probability, urgency choice, severity score, sustained-trend probability. The rules engine owns the thresholds; a low-confidence answer defaults to "notify."
- **Rules engine**: clinician-authored thresholds and red flags override Jev. Default to escalation when confidence is low.

**Data pipeline.**
1. Synthetic mission generator: 30–90 days, 4 crew profiles, circadian HR/HRV, sleep debt, temperature, SpO2, mood, PVT-B, radiation dose, bone density trend. Calibrate effect sizes to published HRP/Twins/OSDR findings and label "simulated."
2. Real content: HRP risks/HRR evidence; RadLab dose series; OSDR aggregate trends (Inspiration4/OSD-343) for plausibility; no individual astronaut data.
3. Device layer: manual entry + CSV import + optional Web Bluetooth HR strap; a device-agnostic schema.
4. Storage: IndexedDB; no server; export JSON/PDF; optional encrypted backup.

**48-hour MVP.**
- Six indicators: HR, HRV, SpO2, temperature, sleep, PVT-B.
- 30-day synthetic mission for one crew profile.
- Personal baseline (mean + MAD or a robust z-score) and three detectors: sudden jump, sustained shift, slow drift.
- Jev triage with a rules-engine override.
- Ten HRP-linked guidance cards with citations.
- Trend charts with dithered confidence bands; a body-map navigation layer (2D SVG).
- A "ground report" PDF/JSON.
- A clear "not a medical device / simulated data" banner.
- Stretch: multi-crew dashboard, ultrasound guidance, FHIR export, offline LLM, clinician review workflow.

**How the dither UI fits.** A medical telemetry strip: solid text, dithered confidence bands, halftone body map, color + icon + pattern for status (never color alone). One accent for "needs attention." A "science view" toggle shows raw values and thresholds. High contrast for dim cabins; large touch targets; no flashing.

**Risks.** Medical safety (clinician review, no diagnosis, disclaimers); regulatory (avoid SaMD claims); privacy (no PII, on-device); Jev misclassification (rules override, default escalate); alert fatigue (tune thresholds, show evidence); data gaps (synthetic + citations); scope (six indicators, one crew).

**Scores.**

| Impact | Feasibility | Novelty | Judge appeal | AI fit |
|---:|---:|---:|---:|---:|
| 9 | 8 | 7 | 9 | 8 |

#### Concept C2: **Body Map**

**Pitch line.** Tap the part of you that feels wrong, and see what spaceflight does to it, what to measure, and when to call the ground.

**Target user.** Astronauts; crew medical officers; analog crews; training.

**Core experience.** A clickable human figure (2D SVG or a simple 3D model). Each body system — eyes, brain, heart, lungs, gut, bones, muscles, immune, skin, sleep — opens a panel with: the HRP hazard/risk, the relevant indicators, which measurements are feasible in space, a "what to do" action, and the evidence citation. A symptom-to-system flow helps a non-medical crew member localize the problem. The original mechanic: **the evidence body** — every hotspot is a real risk pathway, not a decorative anatomy label.

**Demo "wow" moment.** Tap the eye: the panel explains SANS, shows the relevant measurements (fundoscopy, OCT, visual acuity), the HRP risk, and the question to ask the flight surgeon. The dither halftone body map lights up along the risk pathway.

**How it uses AI.** Jev `choice` routes a symptom description to a body system and urgency; `score` rates severity; `noul` checks red flags. Gemini (adult/clinician) writes the plain-language explanation from the structured panel. The content is human-authored and cited.

**Data pipeline.** HRP hazards/risks, HRR evidence, NASA medical checklists, OSDR/Inspiration4 for indicator plausibility; a hand-curated JSON of 8 systems, 12 risks, 20 indicators, 20 actions; no personal data.

**48-hour MVP.** 2D SVG body map, 8 systems, 12 risks, 20 indicators, a symptom questionnaire, Jev routing, evidence panels, citations. Stretch: 3D model, voice input (on-device), a crew version.

**Dither UI.** Anatomical halftone: dithered body, solid labels, one accent per system; a "science view" with the raw anatomy image.

**Risks.** Oversimplification; medical accuracy; UI complexity; content review time. Mitigate with a narrow set of systems and a clinician reviewer.

**Scores.**

| Impact | Feasibility | Novelty | Judge appeal | AI fit |
|---:|---:|---:|---:|---:|
| 8 | 9 | 7 | 8 | 7 |

#### Concept C3: **Crew Pulse**

**Pitch line.** A daily 60-second check-in that shows the crew's weather before the storm — without exposing anyone's private answers.

**Target user.** Long-duration crews; behavioral health teams; analog missions.

**Core experience.** A private daily check-in: mood, sleep, workload, conflict, isolation, motivation (1–5 + optional note). The app computes a **crew-level** weather map (aggregated, n<5 suppressed) and suggests non-clinical countermeasures: sleep hygiene, exercise, a call home, lighting, a team reset. The original mechanic: **the privacy floor** — individuals see their own trend; the crew sees only aggregate weather; no one sees anyone else's answers.

**Demo "wow" moment.** The crew weather map turns amber before a conflict becomes visible; the app suggests a 10-minute reset and a schedule change. The individual data never leaves the device; only the aggregate is shared.

**How it uses AI.** Jev `score` for mood/conflict risk from the aggregate; `noul` for "should we suggest a countermeasure?"; Gemini (adult/clinician) drafts the countermeasure explanation from a fixed library. No individual-level AI judgment.

**Data pipeline.** HRP behavioral health risks, sleep/circadian research, NASA countermeasures, synthetic crew data; an opt-in aggregate schema; local storage.

**48-hour MVP.** Five-question check-in, four-person crew, aggregate dashboard, ten countermeasures, Jev risk score, privacy controls, a "what this is / is not" screen. Stretch: a crew timeline, a facilitator view, a sleep/circadian module.

**Dither UI.** A sonar/crew-radio display: dithered weather bands, solid labels, one accent for "needs a reset"; no individual identifiers.

**Risks.** Privacy/stigma; small-N; misuse; not a diagnostic. Mitigate with aggregation, opt-in, no individual scores, and a clear "not therapy" disclaimer.

**Scores.**

| Impact | Feasibility | Novelty | Judge appeal | AI fit |
|---:|---:|---:|---:|---:|
| 9 | 8 | 8 | 8 | 7 |

#### Concept C4: **Medic Copilot**

**Pitch line.** A non-medical crew member, an ultrasound probe, and an offline coach that tells you where to put it and whether the image is good enough.

**Target user.** Crew medical officers; non-medical astronauts; analog crews; flight surgeons.

**Core experience.** An offline, retrieval-augmented procedure coach. It guides a focused ultrasound exam (e.g. kidney/bladder for flank pain), step by step: probe position, image quality, what to look for, when to stop and call the ground. The original mechanic: **the image-quality gate** — the app will not let you "interpret" a bad image; it makes you retake it.

**Demo "wow" moment.** The app tells the crew member to rotate the probe, then confirms the image is diagnostic; a dither overlay highlights the kidney/bladder; the app generates a structured report for the flight surgeon.

**How it uses AI.** Jev `choice` selects the next step; `score` rates image quality; `noul` checks "is this structure visible?"; Gemini vision (professional/adult use) assesses image quality and drafts the report; a clinician reviews the rule set.

**Data pipeline.** NASA CMO-DA/ExMC concepts, HRP medical checklists, a phantom/ultrasound image set, synthetic data; no real patient data.

**48-hour MVP.** One procedure, 8 steps, 3 image-quality checks, Jev next-step, a PDF report, a simulated probe (phone camera or a prerecorded clip). Stretch: a second procedure, real probe integration, a ground-consult workflow.

**Dither UI.** A probe-display aesthetic: dithered ultrasound well, solid depth/scale markers, one accent for "diagnostic."

**Risks.** Medical safety and regulation; AI image errors; data; scope. This is a high-impact, high-risk concept; it needs a clinician and a clear "not a diagnostic device" boundary.

**Scores.**

| Impact | Feasibility | Novelty | Judge appeal | AI fit |
|---:|---:|---:|---:|---:|
| 10 | 5 | 9 | 9 | 9 |

### 4.6 Recommendation for Challenge C

**Build Vitals Ledger.** It is the best balance of impact, feasibility, novelty, judge appeal and AI fit. It directly answers the brief's self-assessment ask, can be demoed with synthetic data, and has a privacy-first architecture that is itself a differentiator. The AI story is mature: Jev triages with clinician-authored rules; Gemini explains, grounded and adult-facing; the rules engine and the human override are explicit. Jev earns its place only for the genuinely unstructured judgment — routing a messy symptom description to a disposition — while the rules and the clinician own the thresholds. That is a much stronger answer to "why AI?" than a chatbot that gives medical advice.

**Use Body Map as the navigation layer, not a separate project.** It gives the app the visual "body figure" the challenge suggests without doubling the scope.

**Keep Crew Pulse and Medic Copilot as stretch/vision.** They are strong ideas, but each is a separate product. If the team has a clinician advisor and a strong CV/ultrasound person, Medic Copilot could be the highest-ceiling entry; without them, it is the highest-risk.

**The winning demo for Vitals Ledger:** a 30-day synthetic mission, a slow drift, an evidence panel, and a ground report. In 30 seconds, show the trend, the flag, the citation, and the message. Do not show a chatbot.

**Follow NASA's Trustworthy AI framing.** NASA's CMO-DA work explicitly follows NASA Trustworthy AI principles; for a health tool, that means human oversight, explainability, privacy, robustness, and a clear statement of intended use. Put those five words on a slide and map each one to a design decision. It signals maturity to judges and to any clinician in the room.

---

## Appendix: one-page build plans

**Outpost Nine (48h)**
- Sat 09:00–12:00: repo, Phaser 4 scaffold, dither shader/Quantize, data model.
- Sat 12:00–18:00: three-resource loop, cost-token timeline, 5 event cards, DONKI cache.
- Sat 18:00–22:00: Jev integration + fixtures, hint/difficulty policy.
- Sun 09:00–12:00: 5 more cards, storm drill, end report, data panel.
- Sun 12:00–16:00: dither polish, accessibility, clean mode, mobile test.
- Sun 16:00–20:00: demo script, 30-second video, references, submission.
- Buffer: 4 hours.

**Trade Space (48h)**
- Sat 09:00–12:00: repo, Phaser/three.js scaffold, component catalog, deterministic model.
- Sat 12:00–18:00: four-role hot-seat flow, three orbits/launch vehicles, sim, contour map.
- Sat 18:00–22:00: review gates, Jev board, post-mission report.
- Sun 09:00–13:00: content, balance, trade-space map polish, dither.
- Sun 13:00–18:00: playtest, fix dominant strategy, demo script.
- Sun 18:00–20:00: video, references, submission.
- Buffer: 4 hours.

**Vitals Ledger (48h)**
- Sat 09:00–12:00: repo, data schema, synthetic mission generator, baseline algorithm.
- Sat 12:00–18:00: check-in flow, six indicators, trend charts, body map.
- Sat 18:00–22:00: rules engine, Jev triage, evidence panels, HRP citations.
- Sun 09:00–13:00: ground report, privacy screens, dither UI, accessibility.
- Sun 13:00–18:00: clinician review pass (if available), demo script, test.
- Sun 18:00–20:00: video, references, submission.
- Buffer: 4 hours.

---

## 5. Key findings

1. **Jev is real and is the best AI fit for all three challenges.** TypeSafe AI, `jev-1.14.0`, `POST https://api.typesafe.ai/v1/systemone`, $0.042 per million input tokens, output free, text + PNG/JPEG, 64k/32k default context (262k with a header), Choice/Noul/Score/Box, calibrated probabilities, no prose. It is a judgment layer, not an oracle. Use the official API, not the many look-alike sites. (VERIFIED: https://docs.typesafe.ai/models)
2. **Gemini 4 Hydrogen is real but is not a kids' runtime model.** It has a 1M context and strong multimodal reading, but no Live API, and Google's Gemini API terms require 18+ users and prohibit API clients directed to under-18s. Use Jev + pre-authored content for the child runtime; use Gemini in an adult/educator back office. For real-time voice, `gemini-3.8-live` is the Live API model, but the under-18 terms still apply; on-device Whisper/Vosk/Piper or a parent/educator mode is safer. (VERIFIED: https://aistudio.google.com/docs/terms and https://ai.google.dev/gemini-api/docs/live)
3. **DONKI moved on 30 September 2026.** Old `api.nasa.gov/DONKI/...` URLs are dead (the FLR call returned 404; some old links redirect to the CCMC announcement); the live endpoint is `https://ccmc.gsfc.nasa.gov/DONKI-API/get/...` with no key. Any team copying the challenge's old link will fail. Patch the data layer and label live vs archived. (VERIFIED: https://ccmc.gsfc.nasa.gov/news/major-updates/ and a live FLR call)
4. **OSDR is the open biomedical data path; LSDA/NLSP is the controlled human path.** OSDR has 500+ studies and 4,356 human sample metadata rows; human sequence data are controlled. NLSP/LSDA/LSAH require IRB, consent and a DUA, with ~13 months for de-identified and ~25 months for attributable data. For a 48-hour demo, use OSDR aggregate/derived data + synthetic data and cite the access process. (VERIFIED: https://science.nasa.gov/reference/osdr-faq/ and https://nlsp.nasa.gov/data-request-guidelines)
5. **The Twins Study is a narrative and calibration source, not a download.** 340 days, 25 months, 317 samples, 10 investigations, 84 researchers; 91.3% of gene expression returned to baseline within six months, with some persistent changes. N=1 in flight; hypothesis-generating. Use it for baseline variability and recovery, not for individual prediction. (VERIFIED: https://www.nasa.gov/twins-study-the-research/ and https://www.science.org/doi/full/10.1126/science.aau8650)
6. **Wearables are real and well-specified, but the data are not open.** Bio-Monitor/Astroskin/Hexoskin measure ECG, HR, BP, respiration, SpO2, skin temperature, activity and sleep; Bio-Monitor is on the ISS, and Astroskin is being adapted for Gateway. Build a device-agnostic ingestion layer and a synthetic generator; don't claim an integration you don't have. (VERIFIED: https://www.asc-csa.gc.ca/eng/sciences/bio-monitor.asp and https://hexoskin.com/blogs/news/astroskin)
7. **Privacy is the hidden judging hook in health.** Small-N re-identification, Privacy Act/HIPAA/45 CFR 46/GINA, IRB/consent/DUA, and COPPA for any child-facing voice/photo feature. A privacy-first design (on-device, no PII, aggregate crew views, evidence-first flags) is a differentiator, not a compliance afterthought. (VERIFIED: https://nlsp.nasa.gov/data-request-guidelines and https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule)
8. **GMAT is Apache 2.0 and desktop-only; use it offline.** Precompute 6–10 trajectories and export JSON; do not try to run GMAT in the browser. Eyes on the Solar System is a beautiful reference but has no public API; use JPL Horizons for real ephemerides. Mission Viz is a three.js reference but has no explicit license file. (VERIFIED: https://github.com/nasa/GMAT and https://ssd.jpl.nasa.gov/api/horizons.api)
9. **All four browser engines are MIT and viable.** Phaser for the kids' 2D game, three.js for 3D orbits, PixiJS for dither/data-viz dashboards, Godot only if the team already knows it (WebGL2 only, no WebGPU, no C# web export). Phaser 4's built-in Quantize filter is a useful dither starting point. (VERIFIED: GitHub license files and Godot web export docs)
10. **The winning pattern is not "more features."** It is: one real dataset, one clear trade-off, one typed AI decision layer, one distinctive dither visual, and a 30-second demo that shows the consequence. The teams that try to build a physics engine, a chatbot, and a multiplayer backend in 48 hours will finish none of them.

## 6. Open questions

1. Which single challenge will the team enter? These three are all viable; the team should pick one, not split across them.
2. Does the team have a Jev/TypeSafe API key or an OpenRouter key that works on Saturday? If not, is `gemini-decision-1` (published free tier) the fallback? Test both before the event. Also check the Space Apps "Global Offers" page for any Google/Jev credits; it was login-gated during this pass, so no credit amount is confirmed.
3. Does the team have an 18+ operator and a Gemini paid-tier project for the adult back office? If not, plan for templates and no Gemini.
4. Is there a space-medicine clinician or HRP researcher on the team or in the local network? For Vitals Ledger/Medic Copilot, this is the difference between a credible demo and a liability.
5. What is the exact judging format: a 30-second video or a 7-slide presentation? Which single "wow" moment will the demo show?
6. Will the demo rely on live DONKI, or a cached event deck? Live is more impressive but riskier; cache is safer but must be labeled "archived."
7. Does the team have a designer who can build a real dither system (Bayer shader, solid type, accessibility toggles), or will dither be a post-process filter? The former is a differentiator; the latter can look like a cheap effect.
8. For the mission design game, is a hot-seat four-role mode enough, or does the team want networked multiplayer? Hot-seat is far more feasible in 48 hours.
9. For the kids' game, will the team collect any data at all? If yes, a COPPA review and a parental-consent flow are required; if no, the design is simpler and safer.
10. Can the team confirm the license of NASA Mission Viz and any NASA 3D assets before copying? The Mission Viz repo has no explicit LICENSE file; NASA 3D Resources says free/without copyright but each asset should be credited.
11. Does the team need a data-use agreement for any OSDR controlled-access data? For a 48-hour demo, the answer should be "no, we use public/aggregate data."
12. Is the team's country/region eligible for the Gemini API and OpenRouter? The Gemini terms restrict regions and require paid services in the EEA/Switzerland/UK for API clients. Check before building.


