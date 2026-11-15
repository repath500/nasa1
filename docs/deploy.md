# Deploy (Cloudflare Pages)

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
