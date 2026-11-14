# Use of AI (SI) in Fire Atlas

> Draft. The team must edit this to match what actually happened before submission (decision D12).

**Idea and decisions.** [Team names] chose the challenge, the concept, the user, the scenarios, the ranking
priorities and every accepted record. AI tools helped research options before the team decided; they did not
choose the idea. Dated decisions are in `DECISIONS.md`.

**Planning and code.** Research and planning documents in `research/` and `SPEC.md` were drafted with AI
assistance (Claude, GPT, Grok, Kimi, DeepSeek and others, as listed in `research/README.md`). Application code was
written largely by AI coding agents (Claude Opus 5.5 and Sonnet 5.5, GPT-6.1 Terra and Sol, DeepSeek V4.1 Flash)
working to the team's spec, and reviewed and integrated by [team names]. Commit trailers name the agent per commit.

**Data.** Test conditions are parsed from NASA PSI tables by deterministic code; no language model is in the number
path. Column maps were proposed by an AI agent and are marked "needs human check" in `packages/pipeline/src/maps/`.
Rejected source cells are listed in `data/rejects.report.md`.

**At runtime.**
- Code computes every count, overlap class, ranking and hash.
- Gemini 4 Hydrogen [actual role, or "not used in this build"]: parses free-text questions into editable filters.
- Jev (TypeSafe) and Gemini decision-1 [actual role, or "not used in this build"]: ordinal judgements of relevance,
  evidence directness and purpose. These are model judgements, not probabilities that the science is true, and
  they are shown beside a transparent code baseline.
- FIXTURE values in this build are synthetic demonstrations written by an AI agent, not model judgements and not
  experimental evidence. They are labelled wherever they appear.

**Voice.** Audio overviews use an AI-generated voice from ElevenLabs when configured (disclosed in speech, on screen
and in file metadata), or your device's voice otherwise. Scripts use code-computed facts only.

**Images.** No AI-generated images or video are used. Dithered imagery is a code transform.

This is a literature-screening tool, not safety guidance or certification. Partial-gravity combustion data: none in PSI.
