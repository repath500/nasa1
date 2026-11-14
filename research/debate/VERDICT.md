# Debate verdict: NASA Space Apps 2026

Status: **FINAL: all 7 Round-2 votes counted**: sonnet, gpt, grok, beam-lens, gemini-lens, the science/data seat (run on Haiku 5.5) and the kimi seat (run on Haiku 5.5).
Deadline: **Sun 15 Nov 2026, 11:59 p.m. local time.**

> Space Apps rule: AI may not originate the solution idea. This is a ranking of *options* produced by AI debaters. The human team picks and shapes the final idea.

## Ranked-vote tally (4 points for 1st down to 1 point for 4th)

| Challenge | gemini-lens | sonnet | beam-lens | gpt | grok | science | kimi | **Points** | In top-4 |
|---|---|---|---|---|---|---|---|---|---|
| **Flame in Freefall** | 2 | 1 | 1 | 1 | 3 | 2 | 1 | **24** | **7/7** |
| **Earth System Trend Detective** | 1 | — | 3 | 2 | 2 | 1 | — | **16** | 5/7 |
| **Earth Information Jukebox** | 3 | 4 | 2 | 3 | — | — | 4 | **9** | 5/7 |
| **MODIS/VIIRS Hot Spots** | 4 | 2 | — | — | 1 | 4 | — | **9** | 4/7 |
| Lunar Landing Site Navigator | — | — | 4 | — | 4 | 3 | 3 | 6 | 4/7 |
| Earth analogs (Moon/Mars) | — | 3 | — | — | — | — | 2 | 5 | 2/7 |
| Discarded Equipment storytelling | — | — | — | 4 | — | — | — | 1 | 1/7 |

Note: the kimi seat (AI-necessity lens) left Trend Detective and Hot Spots out because removing the models changes nothing a judge sees. It said itself that the composite should weigh validity over its lens.

Off the board: SPHEREx (sonnet conceded it was over-scored), SAR, Farms, Martian Map, Health, Junior Trainer and the Mission Design Game.

## Per-challenge consensus conditions

1. **Flame in Freefall (clear #1, in every top 4).** This is the only brief where removing the AI removes the product, because it explicitly asks for an "SI" ranker.
   - Scope: 8–12 curated PSI investigations, papers and human-checked fields only.
   - Make the rubric weights visible, and link every score to a quote, page and DOI.
   - Do not download FLEX, BASS or ACME (hundreds of GB to TB).
   - Make no partial-gravity inference.
   - Science fix: drop the composite index, and hand-verify 3 records before any AI pipeline work.
   - Main risk: the PSI table download route returned 404 in planning, and no measured data has been obtained yet. Direction A (the habitat relevance desk) is therefore safer than B (the limit chart).
2. **Trend Detective (#2).**
   - Use Giovanni CSV and a seasonal Mann–Kendall test with Sen's slope.
   - Hook: two regions with opposite trend signs, plus one "looks real but isn't significant" trend.
   - The model never says "significant". Code owns every statistic.
   - Its Creativity score is capped, so presentation has to carry it.
   - Science fixes:
     - `pymannkendall` seasonal slope units are per cycle (12× per-step), so normalise to per-year.
     - Control for multiplicity when picking regions.
     - Use the correlated-seasonal test variant.
3. **Jukebox (#3, tie on 9).** Only if the **sound is the data**: a deterministic mapping card on SVS/GIBS frames. AI music or voice can only be optional garnish, watermarked. The Gemini API is 18+.
4. **MODIS/VIIRS Hot Spots (#3, tie on 9).**
   - Show the SNPP data cut-off, with raw counts beside one declared overlap ratio.
   - The 2 Nov 2026 date is **not confirmed**: verify it with FIRMS `data_availability` before it goes on a slide.
   - Run a held-out overlap test, and accept "not harmonized" as the honest result if it fails.
   - A fitted "harmonized fire census" is the way to lose.
   - Keep the AI to narration and triage only.
   - A FIRMS `MAP_KEY` is required (it is emailed to you).
5. **Lunar Navigator (reserve).**
   - Build it as a Sun/Earth visibility clock: Horizons plus Lunaserv.
   - Label the horizon as spherical unless a LOLA terrain mask has been checked.
   - Artemis III is a 2027 low-Earth-orbit flight.
   - Artemis IV 2028: the debaters conflict. grok says the NASA page doesn't say it; the science seat curl'd NASA's Artemis III page and found "targeted 2028". Attribute it only as "NASA's stated target", after checking the page yourself.
   - "Power yes" on a spherical horizon is only an upper bound. Relabel it, and prefer LOLA masks.
6. **Earth analogs (contested).**
   - NASA's Planetary Analog Explorer already exists, so pairing known sites is not novel.
   - Only build it narrowly, with a domain reviewer by hour 2.
   - grok's view: a similarity score across unlike sensors won't survive a planetary-science judge.
   - The science seat confirms this: the plan compares Earth 2 m air temperature with lunar *surface* temperature.

## AI-architecture fixes (kimi seat)
- **Flame:** Hydrogen extracts, then Jev judges the same extraction, so their errors are correlated. Have code check every quote verbatim against the source, and take numbers only from human-accepted records.
- **Hot Spots:** add no causal field. Use template-constrained narration, and have code check that every number matches an input.
- **Trend:** use a fixed dropdown instead of Jev routing.
- **Jukebox:** the mapping is deterministic. Hydrogen only reads the colour-bar legend, and code checks it.
- **Lunar / Analogs:** drop Jev if a visible weighted sort matches it. Analogs needs labelled non-analogs.
- **Labels:** a Jev Score is an ordinal index, not a probability.

## Cross-cutting rulings (unanimous)
- **Division of labour:** code measures, Hydrogen extracts and perceives, Jev judges, and code enforces policy. Every direction needs a no-model path.
- **Jev confidence is not scientific validation.** Label it "model confidence". Calibrate thresholds on your own labelled examples; no universal 0.85 threshold.
- **Prove the AI earns its place:** show the transparent baseline beside the AI ranking. If they match, drop the model.
- **No child-facing Gemini** (18+ terms).
- **Dither never obscures data:** numbers, axes and p-values stay crisp.
- **Hour 1:** get the keys (TypeSafe, AI Studio, FIRMS, Earthdata) and measure real latency.
- **Compliance:** watermark AI imagery, use no NASA insignia, worm or seal, cite every source with its license, and disclose the SI use.

## Plans
- `research/plans/plan-flame.md`
- `research/plans/plan-earth-hotspots-trend.md`
- `research/plans/plan-lunar-analogs.md`
- `research/plans/plan-jukebox-storytelling.md`
