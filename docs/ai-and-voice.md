# AI and voice

## Who does what
| Role | Model | Where in the app | Why a model is used here | Never used for |
|---|---|---|---|---|
| Measure | Code (`@fire/core`) | Every count, overlap class, ranking, hash and sentence with a number | Numbers must be exact and repeatable | |
| Judge | Jev `jev-1.14.0` (TypeSafe) | Studies tab, the Jev columns beside the code baseline | Judging how relevant and how direct a study's evidence is needs reading its objective, which a fixed rule cannot do | Numbers, safety verdicts |
| Parse | **Gemini 4 Hydrogen** via OpenRouter (`google/gemini-4-hydrogen`) | ⌘K palette, "Ask the atlas" | Turns a free-text question ("has PMMA burned near Moon-base air?") into editable filter chips; code then finds the rows | Answering from its own knowledge |
| Explain | **Gemini 4 Hydrogen** via OpenRouter | Study page and evidence aside, "Why this study" | Writes two plain sentences from the study's objective, fuel phases and hardware; every numeral is checked against the data and banned words are blocked, else a code template is shown | New facts or numbers |
| Fallback judge | **Gemini 4 Hydrogen** via OpenRouter, labelled `hydrogen-fallback` | Studies tab, only when Jev is unavailable | Keeps the AI column working when Jev is down. It answers Jev's same three questions as validated JSON; its probabilities are its own stated distribution, not calibrated | Pretending to be Jev |
| Voice | ElevenLabs | Audio bar, Listen mode | Reads code-written scripts aloud with word timings | Writing the script |

Gemini decision-1 (the earlier fallback) is not available on OpenRouter, so with an OpenRouter key Hydrogen takes over that
role. The direct Google API route still exists and is used only if `GEMINI_API_KEY` is set and no OpenRouter key is.

## The fallback ladder (`/api/rank`)
`L0` live Jev (5 s timeout) → `L1` Hydrogen fallback judge (OpenRouter) → `L2` recorded cache → `L3` code baseline only.
The status chip and the Studies header always say which level is showing. With no keys the build shows **synthetic
demonstration** values, labelled "FIXTURE · synthetic demonstration, not model judgement or experimental evidence"
(written by an agent; only relabel as human-authored if a team member writes or signs them).

## Turning on real AI
1. Add `OPENROUTER_API_KEY` (Hydrogen) and `TYPESAFE_API_KEY` (Jev) to `.env.local`. Never commit it.
2. `pnpm ai:record`: Jev three times per study x habitat x concern (10 x 4 x 3), median kept, into gitignored
   `cache/model_responses/`. Cost well under $0.05; capped by `AI_RECORD_MAX_CALLS` (default 400); retries 429/529.
3. Decide G3 with two people (see [team-guide.md](team-guide.md)).
4. Read the TypeSafe and Google terms, set `MODEL_OUTPUT_REDISTRIBUTION_OK=1`, then `pnpm ai:publish` writes
   `apps/web/public/data/judgements.v1.json`. Until then no model output is committed (rule R8).

## Ask (⌘K palette)
A typed question is sent to `/api/ask` (200 characters max, tools disabled, schema-constrained). Hydrogen returns
filters (material, fuel phase, habitat, concern); the app shows them as editable chips and a pipeline trace
(`HYDROGEN parsed` → `CODE matched N rows`). Without a key a labelled keyword parser does the parsing. The answer is
always computed by code from rows.

## Audio overviews (Listen mode)
- Scripts are built from code-computed facts (`packages/server/src/core-bridge.ts` + `src/narration/facts.ts`): rows
  inside the box by fuel phase, oxygen-only matches, unknowns, rejected cells, preview leaders. Every numeral is in an
  allow-list derived from those facts.
- `pnpm audio:build` writes `apps/web/public/audio/{habitat}__{concern}.json` (+ `.mp3` with ElevenLabs) and
  `landing.json`. ElevenLabs `POST /v1/text-to-speech/{voice_id}/with-timestamps` returns character alignment, which
  becomes word timings and cue times.
- Without a key, manifests use the **device voice** (browser speech synthesis) and say so.
- Disclosure is spoken and visible: "This overview uses an AI-generated voice (ElevenLabs)." Use a stock voice cleared
  for commercial use; no cloned or impersonated voices, no NASA voice imitation.
- In Listen mode the narration drives the app (zoom to habitat, highlight rows, open the ledger or a study). Any user
  interaction pauses following; a "Resume following" pill restores it.

## Labels the UI must keep
- Jev numbers: "model judgement (ordinal)", never "probability the science is true". No thresholds in the end-user UI.
- Every AI element shows `SI · model-id` and live / cached / synthetic status.
