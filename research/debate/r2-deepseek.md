# Round 2: deepseek (lens: Scientific validity and data)

Fast combined pass. Read: VERDICT.md (current version, 5 of 7 votes counted), r2-gemini, r2-gpt, r2-beam, r2-grok, r2-sonnet, and the plans for Flame, Hot Spots + Trend, and Lunar + Analogs. I did not re-read the wave-1 findings. There is **no plan file for the Jukebox or storytelling challenges** (`plan-jukebox-storytelling.md` is absent), so the Jukebox verdict below rests on the debate files only.

## 0. Spot-checks (curl, 14 Nov 2026)

1. **Horizons Earth elevation, the lunar hero fact: VERIFIED.** Query for site 0°E, 89.9°S, 2026-12-01 00:00–03:00 UT returns el = −1.510879° at 00:00, matching the plan's −1.5109°. The judge-recompute claim holds.
2. **NASA Artemis III page (modified 19 Oct 2026): VERIFIED, with a correction.** The page says Artemis III is a 2027 low-Earth-orbit docking test "needed to land Artemis IV astronauts on the Moon in 2028." The VERDICT and grok's "do not claim 2028" is stricter than the source. The accurate wording is "NASA's stated target is a 2028 Artemis IV landing," with attribution. A "2028" date should not be presented as a settled schedule.
3. **FIRMS 2 Nov 2026 SNPP cut-off: NOT CONFIRMED.** The FIRMS homepage has no cut-off notice. The date still rests on ds1 and grok. It is the hook for the Hot Spots hero, so it must be checked with `data_availability` plus a real MAP_KEY before any slide uses it.

## 1. Per-challenge science verdict, biggest flaw, and fix

**Earth System Trend Detective: VALID METHOD, data path still open.**
- *Biggest flaw:* the statistics table mixes time units. The plan's own synthetic check gives a seasonal-MK slope about 12× the original-MK slope for the same series (0.22 vs 0.017 per step), because the seasonal test reports per year. The plan then uses `theilslopes(x, t)` and `linregress(t, x)` with t as a month index, which are per month. The stat row would show slopes that differ by a factor of 12 for the same data. Region and variable selection is also hand-picked, with no multiple-testing control, and the T3 start-year slider is a p-hacking tool.
- *Fix:* set `t = index/12` and report every slope in units/decade, with the Sen CI. Pre-register the regions from a grid, report all grid cells, and apply Benjamini–Hochberg FDR. Use a correlated-seasonal test as the primary test (the pyMannKendall README, checked in r2-gpt, distinguishes this from the seasonal test). Add an AR(1) synthetic case, because the current synthetic check uses i.i.d. noise and cannot show that the autocorrelation fix works.

**Flame in Freefall: CONDITIONAL. Valid as a curated evidence desk, not as a fire-risk ranking. No measured data yet.**
- *Biggest flaw:* the proposed index `100 × (0.45 R + 0.35 E + 0.20 P)` adds an ordinal rubric (E), a Noul relevance value (R), and a Jev probability mass for the chosen pillar (P). These are not on a common scale, and the weights are not scientific coefficients. Compounding this, both PSI experimental-table URLs returned 404 in planning, so no numeric row exists yet. Every oxygen or pressure value in the product would come from one LLM extraction per PDF.
- *Fix:* remove the composite index. Show separate ordinal columns (evidence directness tier, condition overlap as code-computed yes/no/unknown), sort lexicographically, and show a sensitivity table. Hand-transcribe three records, double-code them with a second person, and report agreement. Show no extracted number without a page or table locator. Sanity-check the lunar preset: 30% O₂ × 10.2 psi ≈ 3.06 psi O₂ partial pressure, and Earth-like 21% × 14.7 psi ≈ 3.09 psi. Matching pO₂ is not matching flammability, and the cabin label must say so.

**MODIS/VIIRS Hot Spots: NOT YET VALID AS "HARMONIZED". Data is open, method is the risk.**
- *Biggest flaw:* the overlap correction multiplies MODIS counts by the inverse of a monthly VIIRS/MODIS count ratio per AOI. That ratio is estimated from a few overlap months (a bootstrap over correlated months, which is effectively a small sample) and ignores pixel size (1 km vs 375 m), overpass time, and fire-size-dependent detection. Count ratios are not an estimand that makes two sensors comparable. The default anomaly also divides by a robust z (median/MAD). Many AOI-months have zero counts, so MAD = 0 and the metric breaks.
- *Fix:* compare on a common grid (e.g., 0.25° or 1 km cells) using presence/absence per cell-day and FRP sums, which are more physically comparable. Fit the ratio on 2012–2022 overlap years and test on 2023–2026, reporting the bias and its interval per AOI. For small counts, use a percentile rank against the same month in the same sensor epoch, or a negative binomial model. If the held-out test fails, ship raw counts beside within-sensor anomalies with the seam marked, and say "not harmonized."

**Lunar Landing Site Navigator: VALID GEOMETRY, INVALID "POWER / COMMS" CLAIM AT THE POLE AS STATED.**
- *Biggest flaw:* the hero says "Sun up (+1.49°), power yes, DTE none" at 89.9°S on a spherical horizon. At 1.5° solar elevation, almost any terrain above that elevation blocks the Sun. Crater rims near the south pole are far higher than that. A spherical result is therefore an upper bound on illumination, not a power statement. The formula `1361 × sin(elevation)` also ignores slope and aspect.
- *Fix:* relabel the hero "geometric Sun elevation, no terrain (upper bound)" and drop "power yes." Make the three LOLA masks the default for any site-level claim, not an optional extra. Keep the Horizons numbers, since they reproduce.

**Earth analogs (Moon/Mars): WEAK. Validity fails as currently specified.**
- *Biggest flaw:* the "temperature range" row compares Earth monthly 2 m air temperature (NASA POWER T2M) with lunar or Martian surface temperature (Diviner, or a Mars surface product). These are different physical quantities. A normalised distance across incommensurable dimensions, with weights, has no ground truth, which is the grok objection and it is correct.
- *Fix:* compare like with like (Earth surface skin temperature against Moon/Mars surface temperature). Replace the distance score with ordinal match / partial / breaks / not measured per cell, each with a cited basis. No weights, no profile number. Keep it off the top-4 unless a planetary scientist accepts one candidate.

**Earth Information Jukebox: CONDITIONAL. Sound must be data, and the data path is not yet shown.**
- *Biggest flaw:* SVS and EIC frames are colour-mapped renders. A pitch or loudness mapped from frame brightness encodes a colour-ramp index, not a measurement. Unless the source offers values, the audio is an image feature presented as a physical trend.
- *Fix:* find one permitted source with numeric values or a documented colour-bar decode. If none exists, label the mapping "image luminance, not measured" in the audio and the UI. Test with a listener who has the legend.

## 2. Ranked top-4 vote (science validity and data)

1. **Earth System Trend Detective.** Deterministic, reproducible from NASA series, and a non-significant result is a legitimate Validity entry. The fixes are small (units, multiplicity, correlated test), and the method can be checked end to end.
2. **Flame in Freefall.** The sources are real and well documented: PSI-98 and PSI-102 are CC0 with DOIs, and the scope is narrow. The science is only as good as a hand-verified record, so the first two hours must be spent on three records, not on the AI pipeline.
3. **Lunar Landing Site Navigator.** The ephemeris reproduces exactly, and the data path is verified. Its problem is wording and a terrain mask, both fixable in the build. Its hero must be relabelled before it is shown.
4. **MODIS/VIIRS Hot Spots.** The best data source of the set, but "harmonized" is the unsolved science. It earns this slot only if the team commits to the held-out test and accepts "not harmonized" as the honest outcome.

**Not in top 4:** Jukebox (no plan, sound-as-data unproven), analogs (similarity score across incommensurable quantities).

**Concessions:** r2-gemini's and r2-grok's point that Hot Spots and Trend are the Validity entries is right. r2-sonnet's point that Lunar's hero is the best one-liner in the set is right, but a hero that a combustion or lunar scientist would wince at does not count as validity. I also accept that Artemis IV 2028 is NASA's stated target, not an unsourced claim.
