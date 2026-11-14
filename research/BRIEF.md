# Shared research brief: NASA Space Apps Challenge 2026

Repo root: /Users/repathkhan/.t3/projects/nasa1
All 14 official 2026 challenges, with their full text and official resource lists, are saved in `research/challenges/*.md`. They were pulled from the Space Apps API, because the website renders with JavaScript. Read the files assigned to you IN FULL before you do anything else.

## Team goals (from the user)
- Find strong, winnable project ideas for the 2026 challenges.
- The projects MUST use new 2026 AI technology. The user named two:
  - **"Jev", a decision model**: research what it is, who makes it, its API, access, pricing and capabilities.
  - **"gemini-4-hydrogen"**: a leading multimodal model from Google. Research its modalities, context, API (Gemini API / Vertex), and limits.
  - Also consider other current frontier multimodal, decision and agentic models and tools where they fit, such as video/audio/image understanding, geospatial foundation models (for example NASA/IBM Prithvi), embeddings, and on-device models.
  - If you cannot verify a model exists, or a fact about it, SAY SO EXPLICITLY. Never invent capabilities, benchmarks or endpoints. Mark every claim as VERIFIED (with a URL) or UNVERIFIED.
- UI style: a **dither** aesthetic (1-bit or ordered/Bayer dithering, halftone, error-diffusion imagery) that is still modern, clean and fitting for NASA (think mission-control precision, not retro kitsch).
- Use NASA data and open-source work. Every dataset, library, model and repo used must be clearly credited with its license. Note Space Apps rules on AI use and on attribution where you find them.

## Research method
- Search the web deeply. Open the actual dataset pages, APIs and docs linked in the challenge resources and confirm that they are live, what format they use, how they are accessed (auth, API keys, bulk download), their size and their license.
- WebFetch may fail with an SSL certificate error in this environment. Fall back to `curl -sL` in Bash if so.
- Look for prior art: past Space Apps winners on similar themes, GitHub repos, and NASA open-source code (code.nasa.gov, github.com/nasa, NASA-IMPACT).
- Be concrete and skeptical. Judge whether each idea can be built in about 48 hours by a small team (3–5 people).
- Do NOT write application code. This task is research only.

## Output
Write ONE markdown file to `research/findings/<your-file-name>.md` (your task names the file). Use this structure for each challenge you cover:

1. **Challenge in one paragraph**: the real ask, the hidden judging hooks, and the "must include" items.
2. **Data and resources table**: name | URL | format | access/auth | size | license | verified? | notes. Cover every resource in the challenge file plus extra ones you find.
3. **Open-source and prior art**: repos, models and past projects to build on, with licenses.
4. **3–5 project concepts.** For each one give:
   - a pitch line
   - the target user
   - the core experience and the demo "wow" moment
   - how it uses Jev, gemini-4-hydrogen and/or other new AI (concretely: what goes in and what comes out)
   - the data pipeline
   - a 48-hour MVP scope and stretch goals
   - how the dither UI fits
   - risks
   - scores from 1–10 for impact, feasibility, novelty, judge appeal and AI fit
5. **Your recommendation** for the challenge, with reasons.

End the file with a **"Key findings"** section of 5–10 bullets and a list of open questions.

When you are done, reply with a short summary of your top findings and the path of your file.
