# Fire Atlas build log

For teammates: what was built, by whom, in what order, and why. Branch `feat/fire-atlas-webapp`.
Last updated Sat 14 Nov 2026, about 21:45 GMT. Deadline Sun 15 Nov, 23:59 local.

> **Space Apps rule.** AI agents wrote most of this code to a spec, but the idea, the science decisions and every
> sign-off belong to the team. Record yours in `DECISIONS.md`. Never let an agent fill in a human name or approval.

---

## 1. Start here (5 minutes)

```sh
pnpm install                # Node 22.23 (see .node-version), pnpm 10
pnpm dev                    # web app on http://127.0.0.1:5173 (works with no keys)
pnpm dev:server             # optional API on http://127.0.0.1:8787 (Vite proxies /api to it)
pnpm test                   # 142 unit tests across core, pipeline, server, web
pnpm build                  # rebuilds the corpus, then the web app into apps/web/dist
pnpm lint:claims            # banned claims and dashes in user-facing text
pnpm secret-scan            # key-like strings in build output, public assets, git history
cd apps/web && PW_CHROMIUM_PATH="<path to Chromium>" npx playwright test --project=chromium   # 24 browser tests
```

Live features need keys in an untracked `.env.local` at the repo root (template: `.env.example`): TypeSafe (Jev),
Gemini, ElevenLabs, Stripe **test** keys. Without them everything still works in labelled baseline/device-voice mode.

Key documents:
- `SPEC.md`: the master product and build spec (routes, modes, components, science rules, AI, audio, payments).
- `docs/reviews/OV-1-spec-review.md`: the overseer's review (blocking issues, science red flags, cut order, demo plan).
- `research/flame/BUILD_PLAN.md`, `RED_TEAM.md`, `OVERSIGHT.md`: the science and data rules everything follows.
- `SI_DISCLOSURE.md` (draft), `NOTICE`, `LICENSE` (Apache-2.0), `DECISIONS.md` (team fills in).

## 2. How the repo is laid out

| Path | What it is | Built by |
|---|---|---|
| `packages/contracts` | Shared TypeScript types every lane codes against (rows, cards, API, narration, URL state) | Lead (Claude Opus 5.5) |
| `packages/pipeline` | Parses the 16 NASA PSI CSV tables into `data/corpus.v1.json`; no AI in the number path | W2 (DeepSeek V4.1 Flash) |
| `packages/core` | Science rules: units, overlap classes, baseline and Jev ranking, sensitivity, agreement, gap sentence, quote verifier, number guard, claim lint, narration script, hashing | W3 (GPT-6.1 Terra) |
| `packages/server` | API: AI fallback ladder (Jev, decision-1, cache, baseline), Ask, explain, ElevenLabs narration, Stripe checkout and licences, dev server, audio build | W6 (DeepSeek V4.1 Flash) |
| `apps/web/src/{design,shell,components}` + landing, briefing, learn, present, palette, audio, pricing, account, eggs, 404 | Look and feel, app frame, wizard, modes | W1 (Claude Sonnet 5.5) |
| `apps/web/src/features/{gapmap,orbit,timeline,duel}` | The Gap Map (canvas scatter), dithered orbit scene, timeline, duel | W4 and W4b (GPT-6.1 Terra) |
| `apps/web/src/features/{atlas,studies,selection,ledger,notes,evidence,study,compare,brief,about}` | Map workspace, side panels, evidence drawer, pages | W5 (Claude Sonnet 5.5) |
| `apps/web/src/{state,data,routes.tsx}` | Store, URL sync, corpus loader, routes | Lead |
| `functions/api/[[path]].ts`, `wrangler.toml` | Cloudflare Pages deploy | Lead |
| `docs/reviews/` | Overseer reviews | OV (GPT-6.1 Sol) |

## 3. Timeline, commit by commit

Each worker ran in its own git worktree and branch; the lead merged in dependency order and fixed what broke.

### Phase 0: research and prototype (before the multi-agent build)
| Commit | What | Why |
|---|---|---|
| `037ce14` | Research pack: all 14 challenges, findings, model debate, plans | Pick a challenge; Flame in Freefall won the debate |
| `230bea2` | Single-file Fire Atlas prototype (`app/fire-atlas.html`) with dithered orbit scene and a Jev call | Proved the look and the data route |
| `bd7c855` | Whitespace trim | |

### Phase 1: spec and skeleton (lead)
| Commit | What | Why |
|---|---|---|
| `5b21a14` | `SPEC.md`, pnpm workspace, shared contracts, store, URL sync, routes, placeholder pages for every feature, fixture corpus from real CSV rows, claim lint, secret scan | Six agents could start in parallel against the same types and entry points without colliding |

### Phase 2: parallel lanes (each on its own branch)
| Commit | Lane | What |
|---|---|---|
| `53a747f` | W3 core (Terra) | 28 tested exports: units, overlap truth table (unknown is never "none", burner O₂ excluded), lexicographic baseline (no composite score), 24-order sensitivity, Jev order, agreement sentence, gap statement gated on K5, quote verifier, number guard, claim lint, narration builder, pure-JS SHA-256 |
| `399fc4c` | W2 pipeline (DeepSeek) | 1,476 rows from 12 investigations; cp1252/BOM decoding; `~`, ranges, `;` lists, units in cells; 11 rejected cells (3400% and 2100% O₂, 0 mmHg, 8 negative flows); cards from PSI JSON; 45 tests |
| `c21724b`, `b723b0d`, `0b6ee97` | W1 shell (Sonnet) | Tokens (Night, Paper, High Contrast), self-hosted Geist + JetBrains Mono (OFL), component kit, top bar, shortcuts, undo, session restore, landing, 4-screen briefing, ⌘K palette with Ask, audio bar with cue following, Present and Learn modes, pricing with Stripe buttons, account and checkout pages, easter eggs, 404, service worker |
| `81bec90`, `60634a4`, `76a34a7`, `557c8c7` | W5 panels (Sonnet) | Atlas workspace, two-ranker Studies table with agreement strip and priorities sheet, Selection, Caught-by-code ledger, Notes, evidence drawer (row, quote, paraphrase; hash; APA/BibTeX), Study, refusal-first Compare, printable Gap Brief with QR, About/Method/Credits, glossary |
| `0e9baf5`, `a37b0d2` | W4, W4b map (Terra) | Gap Map with log/linear axes, fuel-phase marks, hollow burner marks, "not reported" rails, habitat boxes, equal-pO₂ curves, solid-fuel absence note, zoom/pan/fit, minimap, box select, table view, mark navigation, PNG export; orbit scene; timeline; duel. Measured about 16.7 ms per frame panning 2,000 marks |
| `d8194eb` | W6 server (DeepSeek) | 10 API routes with body caps, cross-site rejection, rate limit, zod validation; Jev, decision-1 and Hydrogen adapters; ElevenLabs with timestamps; Stripe Checkout, portal, HMAC licences, webhook signatures; 55 tests; 17 device-voice manifests |

### Phase 3: integration and fixes (lead)
| Commit | What | Why |
|---|---|---|
| `0682565` | Merge core | First in dependency order |
| `650a4db`, `a7e697b` | Merge pipeline; CFI-G tagged as ACME hardware | Challenge text names CFI-G as part of ACME |
| `edeee37` | Spec uses computed hero counts | Only **8** FLEX rows sit inside the lunar box (±3 pts O₂, ±15% pressure); 24 is the count at ≥30% O₂ across all pressures. Nothing may hard-code either |
| `edbd116`, `65c852e` | Merge shell; corpus loader skips HTML fallbacks; `material` moved into the shared store and URL | SPA hosts return index.html with 200 for missing files; material picks must be shareable |
| `99f6759`, `d07cc97`, `2d4a7b5` | Merge panels; their science calls now go through `@fire/core`; hash check verified equal to the pipeline's | One source of truth; the local Jev order rounded while core floors |
| `348a274` | Agent-written Jev values no longer say "human-authored" | That label was false |
| `a05a864`, `ddaa99f` | Merge map; 1-2-5 pressure ticks in the display unit; orbit fills the hero | Axis labels collided; psi ticks were odd numbers |
| `35b5872`, `bcfbf7e` | Merge server; narration states code-computed findings; core importable from Node (`.ts` extensions); audio keys `habitat__concern` on both sides; secret scan fixed | Scripts explained the map but said nothing found; Node could not load core |

### Phase 4: overseer review and fixes
| Commit | What | Why |
|---|---|---|
| `1fdf8a9`, `0eb2b55` | OV-1 review (GPT-6.1 Sol) merged into `docs/reviews/` | 12 blocking items, science red flags, cut order |
| `842944a` | Discrete O₂ lists tested value by value; ACME BRE O₂ basis set to unknown; URL sync preserves compare/duel/Stripe params and supports Back/Forward | A "21; 26.5; 40" list must not imply 27 to 33% was tested; the BRE column never says chamber or burner; checkout return would have lost `session_id` |
| `2974697`, `f01d894` | No more "every NASA microgravity fire test"; narrower novelty lint plus more never-claim terms; fixtures labelled "synthetic demonstration, not model judgement or experimental evidence"; `LICENSE`, `NOTICE`, `SI_DISCLOSURE.md`, `DECISIONS.md` | Honest coverage; Space Apps requires an open licence, attribution and AI disclosure |
| `7e7e32f` | Cloudflare Pages function and `wrangler.toml`; `pnpm build` rebuilds the corpus; Node pinned | The site must deploy; the function bundles for Workers and was called in-process |

### Phase 5: human sign-off and real-AI tooling
| Commit | What | Why |
|---|---|---|
| `7e7e32f`, `d2bc2c3` | Deploy wrapper, build log, README | Teammates can deploy and get oriented |
| W8 merge | NTRS page text with rights metadata (all four files are unpaginated: no page-level quotes yet), gate hook, stale-gate removal | Groundwork for quotes and gates (partial; Terra stopped early) |
| `5f5f8f2` | `pnpm review` and `pnpm review:sign k5|d5` (lead) | G1 needs two different people per record; K5/D5 must be signed by a person against the exact corpus hash. Two K5 candidates (FLEX #25, #26: methanol, 30% O₂, about 71.7 kPa) sit inside the Moon-base box; FLEX #19 (34%, 10.4 psi) does not |
| W9 merge | Typed API client, guarded `ai:publish`, G3 statistics (partial; Terra stopped early) | |
| this commit | `pnpm ai:record`, `pnpm g3:label`, `g3:adjudicate`, `g3:metrics` (lead) | One command records real Jev judgements honestly; two blind labellers decide whether Jev beats the code baseline |

### Phase 6: wiring, map polish, accessibility (W7, Sonnet 5.5; saved by the lead after a rate limit)
| Commit | What | Why |
|---|---|---|
| `98afe19` | Shortcuts (0 fit, M mark navigation, [ ] rows), coach marks, orbit and timeline events and narration cues wired across features; Gap Map layout rebuilt: labelled reference lines, habitat labels with leader lines, legend with the hollow-burner note, missing-value strips | The parts were built separately and did not talk to each other; labels collided |
| `e1e8aa2` | axe accessibility specs on key pages in Night and Paper, data-colour contrast test, copy fixes | Accessibility is judged; data marks need 3:1 contrast |
| merge | 80 browser tests and 172 unit tests pass | |

## 4. Numbers you can quote (all computed by code from `data/corpus.v1.json`, hash `4d3a7aa6…`)

- 1,476 parsed test rows from 12 PSI investigations; 11 source cells rejected by code.
- FLEX: 274 rows; 24 at ≥30% O₂ (any pressure); **8 inside the Moon-base example box** at default tolerances.
- BASS-II initial O₂ spans 13.6 to 22.2%. Highest ambient O₂ in any solid-fuel row that reports O₂: 22.2%.
- Five solid-fuel tables report no O₂: their overlap is **unknown, not absent**.
- Partial-gravity combustion data: none in PSI.

## 5. What is still open

**Needs the team (agents cannot do these):**
1. `DECISIONS.md`: name, D5 ranking priorities, D12 contribution statement, D20 keep pay buttons visible (test mode), D21 prices, D22 voice.
2. Sign K5 (lunar headline) and review the gold-record candidates in `data/reviews/candidates.json` (two people for G1).
3. Replace the synthetic Jev values with real recorded model output, or keep them labelled synthetic.
4. About page: team names and the contribution statement. Finish `SI_DISCLOSURE.md`.
5. Keys in `.env.local`, then `pnpm audio:build` for real ElevenLabs audio; create the Cloudflare project and KV namespace.

**Ready for the team now:** `pnpm review` (two people), `pnpm corpus`, `pnpm review:sign d5`, `pnpm review:sign k5`; with keys, `pnpm ai:record`, then `pnpm g3:label` (two people), `pnpm g3:adjudicate`, `pnpm g3:metrics`. Step-by-step guides: `packages/pipeline/README.md` and `packages/server/README.md`.

**In progress (agents):**
- WL (Claude Sonnet 5.5, medium): the new dithered landing page with the access button, challenge explainer and team credit.
- OV-2 (GPT-6.1 Sol): end-to-end review of the merged app, 10-row re-verification against the CSVs, submission readiness, 7-slide deck outline.
