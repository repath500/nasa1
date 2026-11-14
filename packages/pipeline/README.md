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
