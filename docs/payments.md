# Payments (Stripe, test mode)

**Principle: NASA-derived evidence is never paywalled.** The Gap Map, rankings, sources, ledger, Learn mode, preset
audio and the printable brief are free. Paid plans cover things that cost money to run or save time.

| Plan | Price (proposal, D21) | Adds |
|---|---|---|
| Explorer | Free | Everything evidence-related, 3 notes |
| Researcher | $9 / month or $79 / year | Live AI, custom-habitat audio, branded PDF brief, unlimited notes, exports |
| Lab | $49 / month | Researcher for a team |
| Support the mission | One-off | Keeps the free tier free; grants no plan |

For the hackathon, Stripe runs in **test mode**: buttons show "Test mode, no real charge"; use card
`4242 4242 4242 4242`. Whether pay buttons stay visible to judges is decision **D20** in `DECISIONS.md`.

## How it works (no account system)
1. `POST /api/checkout` creates a Stripe Checkout Session (prices come from server env, never the client).
2. Stripe returns to `/checkout/success?session_id=…`; the page calls `POST /api/license/claim`. The server retrieves
   the session, checks it is complete and paid, and issues a **signed licence token** (HMAC-SHA256 with
   `LICENSE_SECRET`: plan, customer, expiry, nonce).
3. The browser stores the token and sends `Authorization: License <token>` to paid endpoints; the server verifies the
   signature, expiry and revocation on every call.
4. `POST /api/stripe/webhook` verifies Stripe's signature (raw body, 5-minute tolerance, constant-time compare) and
   records subscription changes in KV (Cloudflare KV in production, `data/kv-dev.json` in development).
5. With no Stripe keys every billing endpoint answers 503 "Billing not configured" and the buttons say why.

Local webhook testing: `stripe listen --forward-to 127.0.0.1:8787/api/stripe/webhook`.
