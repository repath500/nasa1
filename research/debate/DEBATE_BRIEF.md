# Wave 2: Debate brief (NASA Space Apps 2026)

Repo: /Users/repathkhan/.t3/projects/nasa1

## Context
- The hackathon is LIVE. Submissions close **Sun 15 Nov 2026 at 11:59 p.m. local time**. The team is small (3–5 people).
- The demo is either a video of 30 seconds or less, or a deck of 7 slides or fewer. Judges score Impact, Creativity, Validity, Relevance and Presentation, each 1–5.
- Stack goals:
  - **Jev** (TypeSafe decision model: typed probabilities, text and images only)
  - **gemini-4-hydrogen** (multimodal perception and extraction, text output)
  - **gemini-decision-1** (fallback decision model)
  - a clean, modern **dither UI** that suits NASA
  - NASA data plus open source, with every source credited with its license
- **Space Apps rule: AI must NOT originate the team's solution idea.** Your job is to stress-test options, evidence and feasibility so that the HUMAN team can choose. Present options and trade-offs. Do not hand down a single dictated idea. Also honour: watermarking AI imagery, no NASA logos, at least one NASA data source.

## Inputs (read them, do not skim)
- `research/challenges/*.md`: the 14 official challenges with their resources
- `research/findings/*.md`: wave 1 research
  - gpt-a and grok-a: AI tech, rules and design
  - grok-b: Flame, Trend Detective, SPHEREx
  - ds1: SAR, fires, farms
  - ds2: Moon, Mars
  - ds3: trainer, game, health
  - ds4: jukebox, storytelling
  - ds5: data audit

## Debate format
There are seven debaters, each with an assigned LENS:
- **sonnet: Judge & Impact.** What wins Space Apps? Storytelling, relevance to the challenge text, presentation in 30 seconds.
- **gpt: Engineering feasibility.** Can 3–5 people really ship this in about 40 hours, with these APIs, data sizes, auth and latency?
- **deepseek: Scientific validity and data.** Is the science right? Is the data accessible, the right resolution and the right license? Would a NASA SME judge nod or wince?
- **grok: Red team / contrarian.** Attack the consensus. Find the hidden fatal flaws, the over-hyped AI uses and the crowded ideas (prior art / 2026 repos), and argue for any underrated challenge.
- **beam: Design and UX.** Does the dither UI make the data clearer or just prettier? Look at screen flows, the 30-second hero shot, accessibility (contrast, reduced motion) and what judges see in the first 5 seconds.
- **kimi: AI architecture depth.** Is the use of Jev and Gemini genuine and necessary? Check the question schemas, calibration, cost and latency, failure modes and fallbacks (gemini-decision-1). Would removing the AI break the product, or would nobody notice?
- **gemini: Users and global impact.** Who actually uses this (scientists, farmers, kids, mission planners, international partners)? What is the real-world adoption path? Also fact-check every Gemini-family model claim (hydrogen, carbon, decision-1, 3.8-live, TTS, Lyria) against Google's official docs.

Fact-check: where a claim in the findings drives a decision (a dataset size, API access, a model capability, a rule), verify it on the web. WebFetch may fail with an SSL error, so use `curl -sL`. Mark each claim VERIFIED (with a URL) or DISPUTED.

### Round 1
Write `research/debate/r1-<you>.md` (`<you>` is one of sonnet, gpt, deepseek, grok, beam, kimi, gemini). Through your lens, cover:
1. **Score all 14 challenges** (1–10) for this team and stack, with a one-line reason each.
2. **Shortlist 4–6 challenges.** For each, give 2–3 distinct project DIRECTIONS (options, not one dictated idea), the strongest evidence for and against, and where Jev and Gemini add real value versus where they're a gimmick.
3. **Findings you dispute or that need correcting**, with evidence.
4. **Open questions** the next research wave must answer before the team commits.

### Round 2
Write `research/debate/r2-<you>.md`, after reading ALL seven round-1 files:
1. Where you agree, where you disagree and why, and what you concede.
2. Your revised shortlist, with a final RANKED VOTE of your top 4 challenges.
3. The single biggest risk for each shortlisted challenge, and how to de-risk it in the first 2 hours.

Keep it dense and evidence-based. Do not write application code.
