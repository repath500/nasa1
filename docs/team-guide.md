# Team guide: sign-offs, G3 and submission

Agents built most of the code. These steps need **people**: each tool asks you to type your own name.

## 1. Gold records (G1), two people, about 10 minutes
```sh
pnpm review          # person A, on their own
pnpm review          # person B, separately
pnpm corpus          # folds accepted records into the corpus
```
Each candidate shows the raw CSV cells, file hash, what code parsed, and a fresh check against the file. Answer
`a` accept, `r` reject, `s` skip. A record is accepted when two different people accept it and nobody rejects it.
Check: is O₂ the **initial ambient chamber** value, are units right, does the parsed line match the cells?
Candidates include FLEX #25 and #26 (methanol, 30% O₂, about 71.7 kPa), which sit inside the Moon-base box.

## 2. Gates, one person each
```sh
pnpm review:sign d5  # ranking priority order and tolerances
pnpm review:sign k5  # the Moon-base headline (needs an accepted record inside the box)
```
Each prints exactly what you attest, then asks for `go` or `no-go`. `go` publishes the gate to the app; rebuilding the
corpus later removes stale gates (sign again). Commit `data/reviews/` and `apps/web/public/data/reviews/`.

## 3. Does Jev earn its place? (G3), needs keys
```sh
pnpm ai:record                 # record real Jev judgements (gitignored)
pnpm g3:label prevention       # person A, blind to any ranking
pnpm g3:label prevention       # person B
pnpm g3:adjudicate             # a person settles each disagreement
pnpm g3:metrics                # writes data/labels/g3-report.md and the keep/hide decision
```
Keep the Jev column only if it is not worse than the baseline on top-3 picks **and** reviewers found a disagreement
useful or prefer Jev. "Jev did not improve on the baseline" is a valid, honest result.

## 4. Decisions and disclosure
- Fill in `DECISIONS.md`: name (D1), priorities (D5), contribution statement (D12), voice (D22), and the
  K5/G1/G3 outcomes with who and when.
- Finish `SI_DISCLOSURE.md` in your own words; add team names and the contribution statement on the About page
  (`apps/web/src/features/about/index.tsx`, marked PLACEHOLDER).
- Replace the synthetic Jev values with recorded output (`pnpm ai:publish`) or keep them labelled synthetic.

## 5. Submission checklist
- [ ] Deployed and checked from a logged-out browser ([deploy.md](deploy.md)); Fortinet classification requested.
- [ ] 7 slides including the title (outline in `docs/reviews/OV-1-spec-review.md` §6; screenshots in
      `apps/web/public/landing/shots/`). Optional video under 25 seconds.
- [ ] `pnpm test`, `pnpm typecheck`, `pnpm e2e`, `pnpm lint:claims`, `pnpm secret-scan` all pass.
- [ ] Repo public, `LICENSE` (Apache-2.0) and `NOTICE` present; every source credited with its licence.
- [ ] Project page: summary, demo link, NASA data (PSI accessions, NTRS IDs), AI use statement, "NASA does not
      endorse this project". No NASA or Space Apps logos.
