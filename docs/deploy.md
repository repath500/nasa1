# Deploy

## Vercel (current production)
Live: **https://fire-atlas-sand.vercel.app** (project `repath500s-projects/fire-atlas`, linked to GitHub `repath500/nasa1`).

```sh
pnpm deploy:vercel        # builds corpus + web, bundles the API, then: vercel deploy --prebuilt --prod
```
- `scripts/vercel-build.mjs` writes Vercel's prebuilt output: `apps/web/dist` as static files, and the shared API router
  bundled by esbuild into one Node.js function (`packages/server/vercel/handler.ts`) serving `/api/*`; every other
  path falls back to `index.html` (deep links work).
- Pushes to GitHub also build on Vercel via `vercel.json` (same build script).
- Secrets live in Vercel, never in the repo: `vercel env add OPENROUTER_API_KEY production` (set), and optionally
  `TYPESAFE_API_KEY`, `ELEVENLABS_API_KEY`. The function uses `/tmp` for caches (the rest of the filesystem is read-only).

## Cloudflare Pages (alternative)

The site is static (`apps/web/dist`) plus one Pages Function (`functions/api/[[path]].ts`) that forwards `/api/*` to
the shared server router. It works with no secrets (labelled baseline mode).

## First deploy
```sh
pnpm build                                   # corpus + web app
npx wrangler login
npx wrangler pages project create fire-atlas
npx wrangler pages deploy                     # uses wrangler.toml (output dir apps/web/dist)
```

## Secrets and storage
```sh
npx wrangler pages secret put TYPESAFE_API_KEY      # optional, each of these
npx wrangler pages secret put OPENROUTER_API_KEY
npx wrangler pages secret put ELEVENLABS_API_KEY
```
Set `PUBLIC_ORIGIN` in `wrangler.toml` to the real site URL.

## After deploying
- Open the site from a logged-out browser: `/`, `/atlas`, a deep link like `/study/PSI-69`, and `/api/health`.
- Ask Fortinet to classify the new domain (judges' networks may block uncategorised sites; Space Apps guide advice).
- Run `pnpm secret-scan` before every deploy.
