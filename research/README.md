# NASA Space Apps 2026: research pack

Deadline: **Sun 15 Nov 2026, 11:59 p.m. local time.** The demo is a video of 30 seconds or less, or 7 slides or fewer. Judges score Impact, Creativity, Validity, Relevance and Presentation, each 1–5.

> **AI disclosure.** Everything in this folder was researched and drafted by AI agents:
> - Wave 1 research: GPT-6.1-Sol, Grok 4.7, DeepSeek V4.1 Flash
> - Debate: Claude Sonnet 5.5, GPT-6.1-Sol/Terra, Grok 4.7, Kimi K3.1 Pro, Claude Haiku 5.5
> - Plans: GPT-6.1-Sol, Claude Haiku 5.5, GLM-5.3-Flash
>
> Space Apps rules say AI must not originate the solution idea. Treat this pack as background research and options. **The team chooses and shapes the final idea.**

## Start here
1. `debate/VERDICT.md`: ranked shortlist and conditions. **Flame in Freefall** is #1 (24 points, in all 7 top-4s), then **Trend Detective** (16), with **Jukebox** and **MODIS/VIIRS Hot Spots** tied (9).
2. `plans/`: decision-ready plans, each with 2–3 directions per challenge. Each plan covers pipeline, Jev/Gemini schemas, dither screens, an hour-by-hour build, a 30-second storyboard, 7 slides, attribution, and a pre-mortem.
3. `findings/gpt-a-ai-tech-design-rules.md`: the AI stack (Jev, gemini-4-hydrogen, gemini-decision-1), the official rules, and three dither style directions.
4. `findings/ds5-data-resource-audit.md`: 134 links checked, licence traps, an account checklist, and attribution templates.

## Do in hour 1
- [ ] Decide as a team: challenge plus direction.
- [ ] Get keys:
  - [ ] TypeSafe (Jev): console.typesafe.ai
  - [ ] Google AI Studio (Gemini)
  - [ ] Earthdata Login
  - [ ] FIRMS `MAP_KEY`, if doing fire
- [ ] Measure real Jev and Gemini latency. Wire the `gemini-decision-1` fallback.
- [ ] Ask the Local Lead whether paid APIs are OK under the open-source rule.

## Layout
- `challenges/`: all 14 official challenge texts and resource lists (from the Space Apps API)
- `findings/`: wave-1 research (7 reports)
- `debate/`: brief, Round 1 and Round 2 positions, verdict
- `plans/`: project plans plus `samples/`, the small test fetches
