# Contributing (people and AI agents)

## Workflow
- Branch from `main`; keep commits small; describe **what and why** in the message. Agent commits end with a
  `Co-Authored-By:` line naming the model, so the history shows who wrote what (required for the AI disclosure).
- Before pushing: `pnpm test && pnpm typecheck && pnpm lint:claims && pnpm secret-scan`; run `pnpm e2e` if you
  touched the web app.
- Update [BUILD_LOG.md](BUILD_LOG.md) when you land something a teammate needs to know about.

## Rules that are never negotiable
1. No invented numbers. Counts come from `@fire/core` over corpus rows; never hard-code a finding.
2. Unknown is `null`, shown as "not reported", never 0.
3. Agents never write a human name, approval, label or review. Those come only from the review, sign and G3 tools.
4. Secrets only in `.env.local` / platform secrets. Never in `VITE_*`, the repo, logs or cached files.
5. No model output committed until the provider terms are read (`MODEL_OUTPUT_REDISTRIBUTION_OK=1`).
6. Copy: no em or en dashes; nothing from the never-claim list (see [data-and-science.md](data-and-science.md)).
7. No NASA or Space Apps insignia anywhere; text attribution only; "NASA does not endorse this project".

## Shared code
- Types live in `packages/contracts`. Add fields as optional; do not rename or remove without updating every package.
- Science lives in `packages/core` (pure, browser-safe, `.ts` import extensions so Node can load it).
- Column maps (`packages/pipeline/src/maps`) change numbers: after editing one, run `pnpm corpus`, review the reject
  ledger diff, and expect signed gates to need re-signing.

## Multi-agent builds
The project was built by parallel agents in separate git worktrees, each owning a set of folders (see
[BUILD_LOG.md](BUILD_LOG.md) §2), against frozen contracts, with a lead merging in dependency order and an overseer
reviewing. If you run agents again: give each a folder it owns, the contracts as law, the rules above, and a
"commit early and often" instruction (rate limits stop agents mid-task).
