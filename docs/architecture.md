# Architecture

## The shape of it

```
research/flame/samples/psi_tables/*.csv  ─┐   (16 NASA PSI tables, cached with hashes; never fetched at runtime)
research/flame/samples/psi_json/*.json   ─┤
                                          ▼
packages/pipeline  ── parse (code only) ──►  data/corpus.v1.json  ──►  apps/web/public/data/corpus.v1.json
   column maps, unit rules, rejects,              + manifest, reject ledger,            (loaded once by the browser,
   human review CLI (pnpm review)                   review candidates                    hash-checked)
                                          │
packages/core  ◄──────────────────────────┴──── used by pipeline, server and web (one implementation of the science)
   units, overlap classes, baseline + Jev ranking, sensitivity, agreement, gap statement,
   quote/row verification, number guard, claim lint, narration script, sha256 / canonical JSON

packages/server  (Request -> Response handlers; Node dev server and Cloudflare Pages function share them)
   /api/health  /api/rank  /api/ask  /api/explain  /api/narrate
   /api/checkout  /api/license/claim  /api/license  /api/portal  /api/stripe/webhook
   AI ladder: Jev live -> Gemini decision-1 -> recorded cache -> code baseline (labelled at every step)

apps/web  (Vite + React + TypeScript + Tailwind v4 tokens; Canvas/SVG for data; WebGL2 dither for imagery)
```

`packages/contracts` holds the shared TypeScript types (rows, cards, records, API shapes, narration, URL state).
Every package imports from it; it is the one place a shape is defined.

## Repository layout

| Path | Role |
|---|---|
| `packages/contracts` | Shared types and presets (`PRESETS`, `DEFAULT_TOLERANCES`, `DEFAULT_PRIORITY`) |
| `packages/core` | Pure science functions; runs in the browser and Node; no I/O |
| `packages/pipeline` | Corpus builder, column maps (`src/maps/PSI-*.ts`), review and signing CLIs |
| `packages/server` | API handlers, AI adapters, narration, billing, dev server, recording and G3 scripts |
| `apps/web` | The web app (features in `src/features/*`) |
| `functions/api/[[path]].ts` | Cloudflare Pages entry: forwards `/api/*` to the server router |
| `data/` | Generated corpus, manifest, reject ledger, review files, NTRS page text |
| `scripts/` | `lint-claims.mjs`, `secret-scan.sh` |
| `app/` | The original single-file prototype (kept for reference) |

## Web app

**Routes** (`apps/web/src/routes.tsx`): `/` landing, `/briefing` wizard, `/atlas` workspace, `/study/:accession`,
`/compare`, `/duel`, `/learn`, `/present`, `/brief/:scenario`, `/pricing`, `/account`, `/checkout/success|cancel`,
`/about`, `/method`, `/credits`, `/flight-rules` (easter egg), `*` 404. Every feature is lazy-loaded.

**State**: one Zustand store (`src/state/store.ts`): habitat and custom air, concern, fuel filter, material,
tolerances, priority order, mode, theme, units, expert, panel tab, selection, highlights, timeline, AI ladder,
audio, licence. Continuous values (map zoom, audio time) live outside React state.

**URL sync** (`src/state/url.ts`): atlas state is mirrored to short query keys (`h, o2, kpa, q, f, m, mode, tab, sel,
u, t, ex`) on atlas routes only. Other parameters (compare `a`/`b`, duel `h1`/`h2`, Stripe `session_id`) are
preserved. Committed choices push history (Back works); drags and selection replace it.

**Data loading** (`src/data/useCorpus.ts`): loads `/data/corpus.v1.json`, falls back to the labelled fixture, and
ignores HTML fallbacks from SPA hosts. Gate files load from `/data/reviews/{k5,d5}.json`.

**Cross-feature events** (window `CustomEvent`s): `fa:shortcut` (fit, mark-nav, prev-row, next-row),
`fa:moon-click`, `fa:timeline-end`, `fa:orbit-hint`. Narration cues (`focusHabitat`, `highlightRows`, `filterPhase`,
`openStudy`, `openLedger`, `clear`) drive the store when Listen mode is following.

## Server

Each handler is `(req: Request, env: Env) => Promise<Response>` and uses only Web APIs, so the same code runs in
the Node dev server (`src/dev-server.ts`) and on Cloudflare Pages Functions. Shared protections: same-origin only
for browser calls, 12 KB body cap, per-IP rate limit, zod validation of inputs and upstream responses,
`Cache-Control: no-store`, secrets never logged or echoed. See [ai-and-voice.md](ai-and-voice.md) and
[payments.md](payments.md).

## Testing

| Layer | Where | Count (at merge) |
|---|---|---|
| Science core | `packages/core/test` | 30 |
| Pipeline and review tools | `packages/pipeline/test` | 54 |
| Server, AI, billing, G3 | `packages/server/test` | 63 |
| Web units (ticks, palette contrast, URL rules) | `apps/web/src/**/*.test.ts` | 25 |
| Browser (golden path, keyboard, axe in three themes, phone width, wiring, landing) | `apps/web/e2e` | 83 |
