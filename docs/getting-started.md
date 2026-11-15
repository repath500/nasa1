# Getting started

## Requirements
- Node **22.23** (see `.node-version`; 22.18 or newer is required for native TypeScript stripping).
- pnpm **10** (`corepack enable` then `corepack prepare pnpm@10.10.0 --activate`).
- Optional: Chromium for browser tests (`cd apps/web && npx playwright install chromium`).

## Run it

```sh
pnpm install
pnpm dev             # web app  -> http://127.0.0.1:5173
pnpm dev:server      # API      -> http://127.0.0.1:8787 (optional; Vite proxies /api to it)
```

The app works with **no keys and no API server**: the status chip shows `OFFLINE` or `FIXTURE`, rankings use the
transparent code baseline, and narration uses your device voice.

Try: `/` (landing) → **Enter the Atlas** → click a dot → evidence drawer → **Studies** tab → a study → **Export brief**.
Shortcuts: `⌘K` palette, `?` all shortcuts, `E` expert, `L` listen, `P` present, `T` theme, `0` fit map, `M` mark
navigation, `[` `]` previous/next row.

## Keys (optional)
Copy `.env.example` to `.env.local` at the repo root and fill in what you have. Never commit it, never prefix with
`VITE_`. The server reads it; the browser never sees it.

| Variable | Turns on |
|---|---|
| `TYPESAFE_API_KEY` | Live Jev judgements and `pnpm ai:record` |
| `OPENROUTER_API_KEY` | Gemini 4 Hydrogen (`google/gemini-4-hydrogen`) via OpenRouter: Ask parsing, study explanations and the fallback judge. Preferred route |
| `GEMINI_API_KEY` | Optional direct Google route for Hydrogen and decision-1, used only without an OpenRouter key |
| `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL_ID` | AI voice for audio overviews (`pnpm audio:build`) |
| `PUBLIC_ORIGIN` | Live narration's corpus fetch |

## All commands

| Command | What it does |
|---|---|
| `pnpm dev` / `pnpm dev:server` | Web app / API in development (the dev build runs React's checks, so the map is slower) |
| `pnpm preview` | Production build served on http://127.0.0.1:4173 with the API proxy: use this to judge smoothness |
| `pnpm build` | Rebuild the corpus, then build the web app into `apps/web/dist` |
| `pnpm corpus` | Parse the NASA tables into `data/corpus.v1.json` (+ web copy, manifest, reject ledger, candidates) |
| `pnpm test` | All unit tests (core, pipeline, server, web) |
| `pnpm typecheck` | TypeScript across the workspace |
| `pnpm e2e` | Browser tests (set `PW_CHROMIUM_PATH` if Playwright cannot find Chromium) |
| `pnpm lint:claims` | Banned claims and en/em dashes in user-facing text |
| `pnpm secret-scan` | Key-like strings in build output, public assets and git history |
| `pnpm audio:build` | Narration manifests (and MP3s with an ElevenLabs key) into `apps/web/public/audio/` |
| `pnpm review`, `pnpm review:sign k5\|d5` | Human sign-off tools (see [team-guide.md](team-guide.md)) |
| `pnpm ai:record`, `pnpm ai:publish` | Record real Jev judgements; publish after reading provider terms |
| `pnpm g3:label`, `g3:adjudicate`, `g3:metrics` | Decide whether the Jev column earns its place |

## Troubleshooting
- **"Reviewed records could not be loaded"**: run `pnpm corpus` (creates `apps/web/public/data/corpus.v1.json`).
- **Status chip says OFFLINE**: the API is not running; start `pnpm dev:server`. Everything else still works.
- **Playwright cannot find a browser**: `PW_CHROMIUM_PATH=$(ls -d ~/Library/Caches/ms-playwright/chromium-*/chrome-mac/Chromium.app/Contents/MacOS/Chromium | head -1) pnpm e2e`.
- **Corpus hash changed after `pnpm corpus`**: expected only if tables, maps or accepted reviews changed; timestamps alone do not change the hash. A changed hash invalidates signed gates (sign again).
