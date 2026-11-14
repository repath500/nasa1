# Round 2 — kimi (lens: AI architecture depth)

Read: DEBATE_BRIEF (lens), r1-kimi, VERDICT, and all six available r2 files (beam, deepseek, gemini, gpt, grok, sonnet). Fast pass, no new web research. My test stays the same: the model must be closed-schema, must judge something code cannot, and removing it must measurably worsen the result.

## 1. Agreement and disagreement

**Agree**
- Code measures, Hydrogen extracts/perceives, Jev judges, code enforces policy. Every direction needs a no-model path (all six, and the VERDICT).
- Jev Score is an ordinal index, not a probability (deepseek, gemini, sonnet, grok). Drop the composite `100 × (0.45R + 0.35E + 0.20P)` index and the `P × evidence` product. Show ordinal columns and a visible sensitivity table instead.
- Decision 1 is a contract-different fallback (`input` not `state`, confidence semantics differ, no Box). It needs an adapter and fixture replay, not a model-string swap (gpt, gemini).
- No child-facing live Gemini: the under-18 API-client restriction is a provider-terms issue, not an opinion (grok, gpt, gemini).
- Raw scientific crops go to models; dither is presentation-only (beam, gpt, sonnet).

**Disagree / refine**
- **beam vs VERDICT "model confidence" label:** beam is right. Name the exact output and question. Jev Choice/Score confidence is distribution concentration, and Noul has none. Omit numeric claims the team cannot explain.
- **sonnet: AI fit is only a tie-breaker.** The rubric does not score AI use, so I accept that. But "does the model earn its place" is still the honest question for a stack-goal project, and it should decide which models a team spends weekend hours on.
- **grok and gpt: Trend under-ranked / promoted to #2.** I concede that "model optional" is not a validity virtue. I still do not rank Trend in my top four: a Mann–Kendall result is unchanged if Jev and Hydrogen are removed, so my necessity test gives it no credit. Its strength is validity, which other lenses score.
- **grok: Analogs off the shortlist.** Partly disagree. Residual judgment (geology match, purpose fit, where the analogy breaks) is the one place Jev's Score/Noul does work a code formula cannot. grok's objection (no ground truth, no reviewer) is decisive **without labels**, so I keep Analogs only as conditional.
- **Hot Spots and Trend as "AI-as-narrator":** a model that only narrates a computed number adds no architectural depth. I score both low on necessity.

## 2. Biggest AI-architecture risk per challenge, and the fix

- **Flame:** Hydrogen writes O₂/pressure/gravity into the field and the "quote," then Jev `claim_supported` judges the same extraction. Errors are correlated, so agreement looks like validation. **Fix:** code string-matches each quote verbatim to the source text plus page locator (reject on miss); numeric fields come from human-accepted gold records only; Jev ranks `regime_relevance` only after a human check of 3–8 records, and must beat a transparent filter before any UI.
- **Analogs:** Jev `geology_match` has no ground truth, and the model's prior on famous analog sites will dominate. **Fix:** labelled non-analogs in the test set, rubric wording tested under two phrasings, and a reviewer-approved deterministic baseline. Drop Jev if it does not beat that baseline on expert labels.
- **Hot Spots:** a narration or `worth_review` label invents burn-driver causality from detection counts. **Fix:** no causal field in any schema; narration is template-constrained with numbers passed in, plus a code check that each number in the output equals an input. Drop Jev from this challenge.
- **Trend Detective:** Jev routing from text to a variable adds a second, non-reproducible path to the story. **Fix:** a fixed dropdown or URL parameter. Keep Jev only if it is logged and allowlisted and beats the dropdown, which I do not expect. Hydrogen must never write the word "significant"; code owns it.
- **Jukebox:** a model choosing mood or arrangement makes the data-to-sound mapping vary run to run. Lyria is outside the stated stack and paid-tier only. **Fix:** deterministic mapping. Hydrogen's only genuine role is reading a colour-bar legend to numbers, which code must verify against the known colour table. If that check fails, drop the model and label the mapping "image luminance."
- **Lunar:** Jev `science_value` makes a soft ranking look like science, and Hydrogen narration may restate Horizons numbers loosely. **Fix:** code owns every predicate (Sun/Earth elevation, occlusion). Hydrogen gets only computed fields and is number-checked. If the top sites match a visible weighted sort, drop Jev.

## 3. RANKED TOP-4 VOTE (AI architecture lens)

1. **Flame in Freefall.** The only entry where removing both models removes much of the requested product, and where Hydrogen extraction plus a closed Jev rubric have real work. Gate: three verbatim-traceable records before any ranking.
2. **Earth analogs (Moon/Mars).** Genuine residual judgment that code cannot express. Conditional: no reviewer and no labelled non-analogs by hour 2 means it falls out, and Lunar moves up.
3. **Lunar Landing Site Navigator.** Low failure risk: code owns the predicates and Jev is removable. The AI case is weak, so it ranks third only as the cleanest deterministic fallback.
4. **Earth Information Jukebox.** Conditional on Hydrogen legend decoding passing a code check against the known colour table. If it fails, I rank it out.

**Not in my four:** Trend Detective and MODIS/VIIRS Hot Spots. Both are strong on validity but fail my necessity test, since removing the models changes nothing a judge can see. That is a lens-specific view; the verdict's composite should weigh validity over my ranking.
