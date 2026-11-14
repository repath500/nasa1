# @fire/server

Web-standard handlers for the Fire Atlas API. The same `router(req, env)` runs on
Node 22 (`--experimental-strip-types`) and on Cloudflare Pages Functions. Handlers
use `fetch`, `Request`, `Response` and Web Crypto only.

## Run locally

```sh
cp .env.example .env.local      # fill only what you have
pnpm install
pnpm dev:server                 # http://127.0.0.1:8787
pnpm dev                        # Vite on 5173, proxies /api to 8787
```

`.env.local` is read from the repo root. Values are never logged. With no keys the
app still works: rank returns labelled fixtures, Ask uses the keyword parser, and
narration returns device-voice manifests.

## Endpoints (SPEC §12)

| Method and path | Body | Returns |
|---|---|---|
| `GET /api/health` | | `{ ok, services: { jev, gemini, elevenlabs, stripe }, stripeMode }` |
| `POST /api/rank` | `{ scenarioId, concern, corpusHash }` | `RankResponse`, ladder L0 to L3 |
| `POST /api/ask` | `{ question }` (200 characters max) | `AskResponse`, Hydrogen or keyword parser |
| `POST /api/explain` | `{ accession, scenarioId }` | `{ text, claimIds, source }` |
| `POST /api/narrate` | `{ scenarioKey }` or `{ customScenario }` | `NarrationManifest` |
| `POST /api/checkout` | `{ plan, interval, amountCents? }` | `{ url }` |
| `POST /api/license/claim` | `{ sessionId }` | `{ token, plan, expiresAt }` |
| `GET /api/license` | header `Authorization: License <token>` | `LicenseInfo` |
| `POST /api/portal` | licence header | `{ url }` |
| `POST /api/stripe/webhook` | Stripe event | `{ received, result }` |

Every response has `Cache-Control: no-store`. Requests with
`sec-fetch-site: cross-site` are rejected. Bodies are capped at 12 KB. A per-IP
in-memory token bucket (60/min per isolate) is a speed bump, not a shared quota.
All inputs and upstream responses are validated with zod.

Rank and explain accept allowlisted ids only. The server has no corpus payload in
`RankRequest`, so it judges the core investigation roster in `src/ai/studies.ts`.
Ask never returns free text: Hydrogen returns structured filters, and row matching
runs in the client against the loaded corpus.

## AI fallback ladder

1. **L0 live Jev** `POST https://api.typesafe.ai/v1/systemone`, model `jev-1.14.0`,
   `Authorization: Bearer $TYPESAFE_API_KEY`, 5 s timeout. Questions:
   `regime_relevance` (noul), `evidence_directness` (score, four levels, no
   numerals in criteria) and `pillar` (choice).
2. **L1 gemini-decision-1** `POST .../v1beta/decisions`, `x-goog-api-key`, body uses
   `input` not `state`, 5 s timeout. Every result is labelled `source: decision-1`,
   never Jev.
3. **L2 recorded cache** `packages/server/cache/rank-<sha256>.json`, keyed by
   `sha256(corpusHash + rubricVersion + modelId + request)`. Not committed for model
   output until provider terms are read (R8). Authoring may write it with
   `CACHE_RECORD=1`.
4. **L3 baseline** no model. Rank returns synthetic demonstration fixtures, each
   `source: fixture`, `modelId: fixture-placeholder-v1`. These are not model
   output, experimental evidence, or human-reviewed labels.

## Turning on real AI (for teammates)

Live requests can be enabled by setting `TYPESAFE_API_KEY` and/or `GEMINI_API_KEY`
in the repo-root `.env.local`, then starting `pnpm dev:server`. Do not commit
the keys or the ignored `cache/` directory. Runtime calls can incur provider
charges; check current provider pricing and account limits before enabling them.

The offline recording, corpus-aware custom scenario, and human G3 labelling and
reporting workflows are **not implemented yet**. Do not claim a G3 result or
publish synthetic fixtures as real judgements. The G3 decision must remain
hide-by-default until two independent people label and adjudicate at least 16
pairs and the rule in BUILD_PLAN §4.2 is satisfied. The statistical helpers in
`src/ai/g3.ts` are not a complete evaluation harness.

After a compatible recorder exists and the provider's redistribution terms have
been reviewed, setting `MODEL_OUTPUT_REDISTRIBUTION_OK=1` in the root `.env.local`
allows `pnpm ai:publish` to read recordings from `cache/model_responses/` and
write `apps/web/public/data/judgements.v1.json`. Without that exact local-file
flag it refuses before writing. Publication is not proof of rights or model
provenance; a human must verify both. Never commit the private recordings.

Jev noul has no confidence. Score is a probability-weighted level index 0 to 3; the
four-level probabilities are kept. Values are ordinal model judgements, never
probabilities that the science is true. `JEV_REPEATS=3` medians three calls at
authoring time; runtime defaults to one for latency.

Hydrogen uses `POST https://generativelanguage.googleapis.com/v1beta/interactions`,
header `Api-Revision: 2026-05-20`, and `response_format` with a JSON schema. Tools
are not supplied. If the model is unavailable, Ask is labelled `keyword-parser`.

## Narration

`POST /api/narrate` builds the script with the core bridge, calls ElevenLabs, maps
character alignment to segment and word timings, places cues at each segment start
plus offsets, and caches the manifest by script hash. Custom scenarios require a
Researcher or Lab licence (`Authorization: License <token>`).

`pnpm audio:build` writes `apps/web/public/audio/{scenarioKey}.mp3` and `.json` for
the landing overview and 4 presets x 4 concerns. With no key it writes
device-voice manifests only (`audioUrl: null`, `words: null`, estimated timings).
The mp3 gets an ID3v2.4 comment naming the AI voice.

**ElevenLabs status: VERIFIED** against the official docs
(`/docs/api-reference/text-to-speech/convert-with-timestamps`), checked 14 Nov 2026:

- `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps`
  with `xi-api-key`, JSON `{ text, model_id }`, optional `output_format` query.
- Response `{ audio_base64, alignment: { characters,
  character_start_times_seconds, character_end_times_seconds },
  normalized_alignment }`.
- Model IDs remain configuration (`ELEVENLABS_MODEL_ID`, default
  `eleven_multilingual_v2`). Use a stock library voice cleared for commercial use
  (D22). No cloned or impersonated voices.

## Stripe (test mode for the hackathon)

Billing uses REST with form-encoded bodies (`fetch`), no SDK.

- Checkout: `mode=subscription` for researcher and lab, `mode=payment` for support
  (price id or custom `amountCents` via `price_data`). Success URL is
  `${PUBLIC_ORIGIN}/checkout/success?session_id={CHECKOUT_SESSION_ID}`.
- Licence claim retrieves the session and requires `status=complete` and
  `payment_status` of `paid` or `no_payment_required`, then issues
  `base64url(payload).base64url(HMAC-SHA256(payload))` with
  `{ plan, customer, exp, nonce }`.
- `GET /api/license` verifies the token and the KV record. Webhooks update the KV
  record so deleted or unpaid subscriptions fail verification.
- Webhook signature: `Stripe-Signature: t=...,v1=...`, HMAC-SHA256 of
  `${t}.${rawBody}` with `STRIPE_WEBHOOK_SECRET`, 300 s tolerance, constant-time
  verify through Web Crypto.

**Stripe shapes: VERIFIED** against the documented REST API. With no Stripe keys
every billing endpoint returns `503 { "error": "Billing not configured" }` and
health reports `stripe: false`, `stripeMode: "off"`.

Test mode checklist:

1. Set `STRIPE_SECRET_KEY` (test key), `STRIPE_WEBHOOK_SECRET`, `LICENSE_SECRET`,
   the four price ids, `PUBLIC_ORIGIN`, and `STRIPE_MODE=test`.
2. `stripe listen --forward-to 127.0.0.1:8787/api/stripe/webhook` and copy the
   `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET`.
3. Pay with card `4242 4242 4242 4242`, any future expiry and CVC. The UI shows
   "Test mode, no real charge".
4. The success page calls `/api/license/claim`, stores the token, and `/api/license`
   should return the plan.

KV is a Cloudflare KV binding (`LICENSES`) in production and
`data/kv-dev.json` in dev (gitignored). Only the Stripe customer id, plan,
status, expiry and usage counters are stored.

## Cloudflare Pages

Copy `cloudflare/functions/` into the Pages project root (or point the build at
`packages/server/cloudflare`), then bind:

- `LICENSES` KV namespace.
- Encrypted env vars: `TYPESAFE_API_KEY`, `GEMINI_API_KEY`, `ELEVENLABS_API_KEY`,
  `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL_ID`, `STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*`, `STRIPE_MODE`, `LICENSE_SECRET`,
  `PUBLIC_ORIGIN`.
- Compatibility date 2026-05-20 or later. Enable `nodejs_compat`: the cache module
  references `node:fs` behind a guarded dynamic import. On Pages, file reads fail
  closed to the next ladder layer; KV is the production store.

Deploy:

```sh
pnpm --filter @fire/web build
npx wrangler pages deploy apps/web/dist --project-name fire-atlas
```

## Verified versus unverified

| Item | Status |
|---|---|
| ElevenLabs timestamps endpoint and response | VERIFIED (docs, 14 Nov 2026) |
| Jev endpoint, request and answer types | VERIFIED (docs and samples) |
| decision-1 endpoint, `input` field, answer types | VERIFIED (docs) |
| Hydrogen Interactions endpoint, `Api-Revision`, response_format | VERIFIED |
| Hydrogen REST response envelope | UNVERIFIED. Docs show the structured object; the SDK exposes `output_text`. The adapter accepts both. |
| Stripe REST shapes, Checkout, portal, signature scheme | VERIFIED (documented REST) |
| Stripe price ids, current API version | Configuration, not verified against an account |

## Tests

```sh
pnpm --filter @fire/server test
pnpm --filter @fire/server typecheck
sh scripts/secret-scan.sh
```

Tests mock `fetch`; no real network. Covered: ladder order and timeout, zod rejection
of bad upstream data, Jev criteria with no numerals, decision-1 using `input`, licence
sign/verify/expiry/tamper, webhook signature valid/invalid/stale, cross-site rejection,
body cap, rate limit, billing 503, and narration timing from a sample alignment.

## Turning on real AI and deciding G3 (for teammates)

1. Put `TYPESAFE_API_KEY=...` (and optionally `GEMINI_API_KEY=...`) in the repo-root `.env.local`. Never commit it.
2. `pnpm ai:record` calls Jev three times for each of 10 studies x 4 habitats x 3 concerns and writes the raw answers
   plus their median to `cache/model_responses/` (gitignored). Cost is well under $0.05; `AI_RECORD_MAX_CALLS`
   caps it (default 400). Re-running skips anything already recorded. Busy responses (429/529) back off and retry.
3. Two people label blind, separately: `pnpm g3:label` (default concern prevention). Each sees only the habitat and
   the study's own description, never a ranking. Label 2 = read first, 1 = relevant, 0 = not relevant. 16+ pairs each.
4. `pnpm g3:adjudicate`: a person settles every disagreement. `pnpm g3:metrics` writes `data/labels/g3-report.md`:
   top-3 hit rate, Wilson 95% interval and Spearman for the baseline and for Jev, and the keep/hide decision
   (keep only if Jev is not worse on top-3 AND reviewers found a disagreement useful or prefer Jev).
   "Jev did not improve on the baseline" is an honest, valid result.
5. Only after reading the TypeSafe and Google terms: set `MODEL_OUTPUT_REDISTRIBUTION_OK=1` in `.env.local` and run
   `pnpm ai:publish` to write `apps/web/public/data/judgements.v1.json`. Commit `data/labels/` and that file.
