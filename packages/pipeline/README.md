# Pipeline

## How to review and sign (for teammates)

The review and signing commands are not implemented yet. Do not treat the
existing candidate file as human approval, and do not create gate files by
hand as a substitute for the missing workflow. K5 covers the evidence-gap
headline; D5 covers the ranking priority and tolerances; G1 requires two
distinct human reviewers for each gold evidence record. All remain blocked.

To regenerate local normalized NTRS text without network access:

```sh
pnpm install
pnpm --filter @fire/pipeline build:pages
```

Output goes to `data/pages/`. A document without page markers is stored as
one segment and explicitly marked `pageMarkersFound: false`; its segment
number is not a verified PDF page. Check the original PDF before citing a
page. `quoteAllowed` reflects the metadata determination only, not the
separate human check of the document's copyright notice. In particular,
`GOV_PERMITTED` material is paraphrase-only and 20210022402 is excluded.

`pnpm corpus` rebuilds the corpus and removes a published K5 or D5 file if
its corpus hash no longer matches. This does not sign or publish gates.

## How to review and sign (for teammates, about 10 minutes)

Agents never sign. You type your own name at each prompt.

1. **Gold records (G1), two people.** Person A runs `pnpm review`, then person B runs `pnpm review` on their own.
   Each candidate shows the raw CSV cells, the file hash, what code parsed, and a fresh code check against the file.
   Answer `a` (accept), `r` (reject) or `s` (skip). A record is accepted only when two different people accept it and
   nobody rejects it. Results go to `data/reviews/records.json`.
   Check each time: is the O₂ the **initial ambient chamber** value, are the units right, does the parsed line match the cells?
2. **Rebuild:** `pnpm corpus`. Accepted records enter the corpus and their investigation cards become `gold`
   (only gold cards are ranked as reviewed). The corpus hash changes, which is expected.
3. **D5, ranking priorities:** `pnpm review:sign d5`. It shows the priority order and tolerances; type `go` or `no-go`.
4. **K5, the Moon-base headline:** `pnpm review:sign k5`. It needs at least one accepted record inside the Moon-base box
   (the two `K5 candidate` FLEX rows qualify). It shows the exact headline and scope line the app will display.
   `go` unlocks the headline; `no-go` keeps it hidden.
5. Commit `data/reviews/*.json`, `apps/web/public/data/reviews/*.json` and the rebuilt corpus.

If the corpus is rebuilt after signing, the published gates no longer match its hash and are removed automatically:
sign again. Record who did what in `DECISIONS.md`.
