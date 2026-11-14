# Fire Atlas documentation

An experimental app for NASA Space Apps x HackAthlone hackathon 2026, by Jay Popat & Repath Khan.
Challenge: **Flame in Freefall**. Pick where people will live in space, see NASA microgravity fire tests plotted against
that air, and find what has been tested near it, what has not, and what to read first. Every dot opens its source.

## Start here

| If you want to… | Read |
|---|---|
| Run the app on your laptop in 5 minutes | [getting-started.md](getting-started.md) |
| Do the human sign-offs, label for G3, and submit | [team-guide.md](team-guide.md) |
| Understand how the pieces fit together | [architecture.md](architecture.md) |
| Know where every number comes from, and the science rules | [data-and-science.md](data-and-science.md) |
| Turn on Jev, Gemini or the ElevenLabs voice | [ai-and-voice.md](ai-and-voice.md) |
| Work on screens, the Gap Map, the dither engine or accessibility | [frontend.md](frontend.md) |
| Understand the pay buttons and licences | [payments.md](payments.md) |
| Put it on the internet | [deploy.md](deploy.md) |
| Change code safely (rules for people and agents) | [contributing.md](contributing.md) |
| See what was built, by whom, in what order | [BUILD_LOG.md](BUILD_LOG.md) |

## Reference

- [`SPEC.md`](../SPEC.md): the full product and build spec (routes, modes, components, science, AI, audio, payments).
- [`reviews/`](reviews/): the overseer's spec review (OV-1), the lead's science audit, and audit scripts.
- [`DECISIONS.md`](../DECISIONS.md): decisions only the team can make. [`SI_DISCLOSURE.md`](../SI_DISCLOSURE.md): AI use.
- [`research/`](../research/): the research pack, challenge texts, data samples and the science rules
  (`research/flame/BUILD_PLAN.md`, `RED_TEAM.md`, `OVERSIGHT.md`).
- Package guides: [`packages/pipeline/README.md`](../packages/pipeline/README.md) (data and review tools),
  [`packages/server/README.md`](../packages/server/README.md) (API, AI, Stripe, ElevenLabs).

## The five rules everyone follows

1. **Code measures.** Every number on screen, in narration or in a brief is computed from parsed NASA table rows.
   No model is in the number path, and nothing is hard-coded.
2. **Unknown is not none.** A value a table does not report is shown as "not reported", never as 0 or "no".
3. **No partial-gravity inference.** "Partial-gravity combustion data: none in PSI." Never "safe", "certified",
   "predicts" or "first". `pnpm lint:claims` enforces the wording.
4. **AI is labelled.** Every AI output carries its model and whether it is live, cached or synthetic. Jev values are
   ordinal model judgements, not probabilities that the science is true.
5. **People sign.** Gold records, the Moon-base headline (K5), ranking priorities (D5) and the Jev column (G3) need
   named humans. Agents never fill in a human name.
