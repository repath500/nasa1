# Wave 3: Project planning brief (NASA Space Apps 2026)

Repo: /Users/repathkhan/.t3/projects/nasa1

Read these first:
- `research/debate/VERDICT.md` (the debate outcome and your assignment's context)
- the challenge file(s) for your assignment in `research/challenges/`
- the relevant `research/findings/*.md`
- `research/findings/ds5-data-resource-audit.md` (data and licensing)
- `research/findings/gpt-a-ai-tech-design-rules.md` (AI stack, rules, dither design)

## Context
- Deadline: **Sun 15 Nov 2026, 11:59 p.m. local**. The team has 3–5 people.
- Demo: a video of 30 seconds or less, or 7 slides or fewer.
- Stack: Jev (TypeSafe), gemini-4-hydrogen, gemini-decision-1 (fallback), and a dither UI.
- **AI must NOT originate the team's idea.** Produce a decision-ready PLAN for each direction listed in your assignment, so the human team can pick. Do not collapse to one idea.

## Your deliverable
Write `research/plans/<your-file>.md`. For EACH project direction assigned to you:

1. **One-paragraph concept**, plus the exact challenge requirements it satisfies (quote them).
2. **Verified data pipeline:**
   - exact endpoints, product IDs, spatial and temporal subsets, auth and licenses
   - ACTUALLY test-fetch a tiny sample with curl or Python where possible (no huge downloads), and record what worked
   - the fallback if the fetch fails
3. **Architecture:** frontend, backend (or static), and where code, Jev and Gemini each sit. Give concrete **Jev question schemas** (noul/choice/score/box, with option lists) and **Gemini prompts with structured-output JSON schemas**, plus cost and latency estimates.
4. **Dither UI:** 3–5 key screens described precisely (layout, components, dither treatment, type, tokens), and the 30-second "hero moment".
5. **Build plan:** an hour-by-hour schedule from now to submission, split by role (data, ML/AI, frontend, story/design), with cut-lines (what to drop at T-12h and T-4h).
6. **Demo script:** a 30-second storyboard (shot by shot) AND a 7-slide outline.
7. **Attribution and compliance:** every dataset, library and model with its license; the AI-use disclosure text; the watermark plan; a no-NASA-logo check.
8. **Risks and mitigations**, and a "pre-mortem" (why this lost).
9. **Scores** (Impact, Creativity, Validity, Relevance, Presentation, each 1–5), with justification.

Research and plan only. Small sample data fetches into `research/plans/samples/` are fine. Do not write the application.
