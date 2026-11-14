# Flame in Freefall: build-planning brief (wave 4)

Repo: /Users/repathkhan/.t3/projects/nasa1.
Deadline: **Sun 15 Nov 2026, 11:59 p.m. local**. Team: 3–5 people.
Demo: a video of 30 seconds or less, or 7 slides or fewer. Judges score Impact, Creativity, Validity, Relevance and Presentation (each 1–5), and mostly judge the PROJECT SUBMISSION, not the video.

Flame in Freefall won the 7-model debate: 24 points, in every top 4.

## Required reading
- `research/challenges/flame-in-freefall.md`: the official challenge. Quote its requirements.
- `research/debate/VERDICT.md`: final tally, conditions and AI-architecture fixes.
- `research/plans/plan-flame.md`: Direction A (habitat relevance desk) and Direction B (evidence workbench), with fetch results.
- `research/findings/grok-b-flame-trend-spherex.md`: PSI datasets, sizes, and access.
- `research/findings/gpt-a-ai-tech-design-rules.md`: Jev, gemini-4-hydrogen, gemini-decision-1, the rules, and the dither styles.
- `research/debate/r2-*.md`: especially r2-grok, r2-deepseek (science) and r2-kimi (AI architecture).

## Non-negotiables from the debate
- Use 8–12 curated PSI investigations, papers and human-checked fields only. Do NOT download FLEX, BASS or ACME (hundreds of GB to TB). Make no partial-gravity inference.
- Division of labour: code measures and enforces, Hydrogen extracts, Jev judges. Code checks every quote VERBATIM against the source, and numbers come only from human-accepted records.
- Drop the composite index. Show rubric dimensions separately, with visible weights the humans approve.
- Jev Score is an ordinal index, not a probability. Never label it "probability the science is true".
- Show a transparent baseline ranking beside the Jev ranking. If they match, say so honestly.
- Provide a no-model path (cached and labelled) plus the gemini-decision-1 fallback.
- Known blocker: both PSI experimental-table CSV URLs returned 404. The NTRS text worked. Resolve the real PSI download route first.
- Dither must never obscure the data: numbers, axes and quotes stay crisp.
- Compliance: watermark AI imagery, no NASA insignia, worm or seal, cite every source with its license, and include the SI-use disclosure.
- **The Space Apps rule says AI must not originate the idea.** Write the plan as a recommendation with clearly marked decision points that the human team confirms. Default to Direction A, with Direction B pieces as stretch, unless you argue otherwise with evidence.

## Outputs (all in research/flame/)
- `BUILD_PLAN.md`: lead architect (sonnet)
- `UI_SPEC.md`: UI/UX and demo (haiku-ui)
- `RED_TEAM.md`: red team (haiku-red)

The overseer (the parent agent) will review your file and may send you a revision request. Keep files dense and decision-ready. Planning only, no application code. Small curl or Python test fetches into research/flame/samples/ are fine.
