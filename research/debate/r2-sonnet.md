# Round 2: sonnet (lens: Judge & Impact)

Read: my r1, r1-gpt, r1-grok, r1-beam, r1-kimi, r1-gemini, VERDICT.md. **r1-deepseek does not exist yet, so the science-validity lens is missing.** Treat my Analogs and Hot Spots calls as provisional until it lands. Everything here is options and trade-offs. The human team picks the challenge and writes the idea (Space Apps rule).

One new check this round (2026-11-14, `curl`): https://science.nasa.gov/solar-system/analog-explorer/ is live. Its title is "Planetary Analog Explorer - NASA Science". It says it lets you "compare field research sites on Earth with similar environments on other worlds". **VERIFIED**, and it corrects my r1 (see 1c).

---

## 1. Agree / disagree / concede

### 1a. Where I agree (and the judge-lens reason)
1. **Flame is the most defensible lead.** Five of five shortlisted it. kimi's test fits: it is the only brief where removing both models removes the product. The brief literally asks for an SI ranker, so the SI badges judges see are justified, not decorative. Judges are shown the SI indicators, and the hidden form question is not shown (my r1 section 0). This is an Impact-neutral, Validity-positive, Relevance-positive choice.
2. **Code owns numbers, models own judgments** (VERDICT ruling 2, kimi D3-D4, gpt 3-4). A Jev call that restates a z-score or an ephemeris fails the "delete the AI" test, and a judge can run that test.
3. **Jev probability is not scientific truth** (gpt 4, kimi 5, beam). Label it "model confidence". In Flame specifically, do not multiply Scores into a "joint probability" (kimi 3). Use a visible weighted sum.
4. **Dither stays out of the analytic layer** (beam, gpt 11, kimi 9). Judges score Validity from what they can read. The hero can be dithered, but the numerals, axes and p-values stay crisp, and the model gets the raw crop.
5. **Hero must be a human-authored, plain-language moment.** beam's "whose problem, what data, what changed in 5 seconds" matches my r1 point that first-round judges are local volunteers.

### 1b. Where I disagree
| Point | Debater | My position and why |
|---|---|---|
| "AI fit" as the main sort key (kimi puts Hot Spots, Trend, Jukebox at 5, Flame/Analogs/Farms at 8-9) | kimi | **The rubric does not score AI use.** The five criteria are Impact, Creativity, Validity, Relevance, Presentation (verified in r1). SI is only inspected for "originality, intent, execution". An honest, modest AI role costs nothing. A forced AI role costs Validity. So AI fit is a tie-breaker and an honesty test, not a ranking axis. I keep Hot Spots high because the seam is a Validity/Relevance story, even though the model is a narrator. |
| Analogs at 4/10 | grok | grok is right about the epistemology (embedding != process, "rediscover Atacama"). The brief itself warns against it ("look beyond well-known analog sites", "explain where the analogy breaks"). But the remedy is a narrow scope (one purpose, one target, 5-8 candidates, 3 sourced dimensions, human-reviewed rubric, per gpt), not dropping it. It stays contested. |
| Lunar at 9 | beam | The hero is the best of the set (Sun +1.5 deg, Earth -1.5 deg, per ds2). But it is the most crowded geometry genre (about 60 repos by my noisy proxy), a judge will compare it to Quickmap, and AI is optional (kimi, grok, gpt all agree). A 9 for design and a 6 to 7 for winning. It is the safest **deterministic** fallback, not the lead. |
| Trend Detective at 9 (gemini) | gemini | Validity is strong, Creativity is capped. The guide's Creativity 5 is "a novel concept that has not been attempted before"; a Giovanni-plus-Mann-Kendall wrapper is at best a 3. The two-regions-opposite-signs plus honest non-result hook lifts it to a 4. The 30 s hero is two line charts, so Presentation depends on the storytelling lead. Keep as a reserve and as a **component** of Hot Spots (the "trend that flips"). |
| Discarded Equipment at 8 (gpt, beam) | gpt, beam | Agree on the shape, but it is the single easiest entry to lose on originality if any prose is AI-authored (my D6, grok 3/10, kimi 4). It only makes my list if the team has a writer, and then the AI role is near zero. Not in my top 4. |

### 1c. What I concede
1. **SPHEREx: I over-scored it (8).** gpt (6), grok (6), beam (6), kimi (6) all hit the same wall: epoch matching, WCS/PSF alignment and the five-target pipeline. gpt's point that "access is not epoch matching" is correct, and I had folded access and presentation together. Revised **6**. It stays a reserve only if a two-epoch cutout of one named target is shown in the first two hours.
2. **Analogs: "no widely known queryable similarity tool" was wrong.** The NASA Planetary Analog Explorer exists (VERIFIED above; gpt V10). What it does, per NASA's own description, is compare field sites on Earth with environments on other worlds, which is curated known-site pairing. The Creativity claim therefore has to rest on the brief's own wording: a **new**, non-famous analog or a **process**-level comparison with an explicit mismatch panel. A "match known sites" product is a re-skin of NASA's page. This also moves gemini's point (comparison of known sites falls short of the requested new analogs) from a footnote to the main risk.
3. **Lunar and Artemis III: grok verified, I could not.** Per grok (nasa.gov/mission/artemis-iii), Artemis III is a 2027 LEO demonstration and landings begin with Artemis IV. I accept this and move D8 from UNVERIFIED to **VERIFIED by grok**. Any slide must say "future south-pole landing", never "Artemis III site". The 2028 date is only a news headline, so do not state it.
4. **Flame prior art (my D5):** grok's point stands that two 2026 repos already ranked or chatted over PSI. My claim that this is "not evidence judges have seen it" is still true, but "the idea is not unique" is the fair reading, so the differentiator must be the scenario lens and the visible rubric, not the existence of a ranker.
5. **Jev latency and 262k context (my D9):** gpt and grok verified official docs (64k per request, 32k per question, 262k is a slower/less accurate header mode). No latency number goes on a slide.
6. **Hot Spots harmonization is the Validity trap** (gpt 7, kimi, grok). Pixel size differs (375 m vs 1 km), hotspot rows are not observation exposure, and z-scores do not prove a common record. I concede my R1 treated "statistics" as the safe part; it is the risky part. The honest framing that still wins is the one grok and beam both name: show **raw vs corrected side by side and say what is not corrected**.

---

## 2. Revised shortlist, scores, and final ranked vote

### Revised scores (judge lens, after R1 debate)
| Challenge | R1 | R2 | Change reason |
|---|---|---|---|
| Flame in Freefall | 7 | **8** | 5/5 consensus; AI genuinely necessary; the scenario reorder (ISS / lunar cabin / suit) is a clean hero; risk is prior art and extraction accuracy |
| MODIS/VIIRS hot spots | 7 | **7** | Timely verified seam (SNPP ceased 2 Nov 2026, grok VERIFIED), only FIRMS is listed, "trend that flips" is a Validity entry; harmonization rigor is the cost |
| Earth analogs | 8 | **7** | Still least crowded, but NASA's Analog Explorer exists, grok/gpt validity attack is fair; only wins as a narrow, SME-reviewed, mismatch-forward build |
| Earth Information Jukebox | 7 | **7** | Best 30 s video of the set (sound is memorable); wins only if the sound is the data (VERDICT); copyright checkbox and the "visualiser with a soundtrack" risk remain |
| Lunar Landing Site Navigator | 7 | **7** | Best one-line hero, deterministic and safe, but crowded and AI-optional; first reserve |
| Trend Detective | 5 | **6** | Validity rises; Creativity capped; best as a component |
| SPHEREx | 8 | **6** | Conceded (1c.1) |
| Farms | 7 | 6 | gpt 5, grok 5; local agronomy and OpenET terms; needs an agronomist |
| Discarded Equipment | 7 | 6 | Only with a human writer; AI voice is the originality trap |
| Jukebox/Storytelling aside, rest | | 3-5 | Unchanged from R1 (SAR 5, Martian Map 5, Health 3, Game 4, Junior 3) |

### FINAL RANKED VOTE (top 4)
1. **Flame in Freefall.** Highest Validity plus Relevance plus genuine AI necessity; consensus pick. Condition: curated 8-12 investigations, visible rubric weights, every score opens onto a quote and DOI, no partial-gravity extrapolation claim.
2. **MODIS/VIIRS hot spots.** Best "adult project in a crowded field" story, a real 2026 sensor seam, and a Validity entry if the demo leads with "the trend that flips" and shows the uncorrected series beside the corrected one. Condition: a team member who refuses a raw count; SI is narration only.
3. **Earth analogs (Moon/Mars).** Highest Creativity ceiling and least crowded, but only if scoped as one purpose, one target, 5-8 candidates, 3 sourced dimensions, the mismatch panel as the hero, and a human reviewer on the rubric. If no SME is reachable in the first 2 hours, drop to rank 5 (Lunar).
4. **Earth Information Jukebox.** Best Presentation per second of video and a distinct award lane (Art & Technology, Most Inspirational). Condition: deterministic sonification, a published mapping card, frame sets not the produced soundtrack, no AI music as the product.

**Reserves, in order:** Lunar (deterministic, safe, best hero line), Trend Detective (also a component of #2), SPHEREx (only after a two-epoch cutout check).

Note for the team: ranks 1 and 2 have little overlap in skills (document extraction versus time-series statistics), so which one fits depends on who is on the team, not on my order.

---

## 3. Biggest risk per shortlisted challenge, and the first-2-hours de-risk

| Challenge | Biggest risk | De-risk in the first 2 hours (stop rule) |
|---|---|---|
| **Flame** | Extraction error plus unsupported claim: an O2 or pressure value (or a "lunar-cabin" score on a gaseous flame) that a combustion SME rejects; second risk is prior art making it look like another PSI chatbot | (a) Pull 3 small public records (for example PSI-102 SAME, about 0.66 GB per grok; use table rows, not videos) and 3 NTRS PDFs, hand-write the gold fields. (b) One Hydrogen call per PDF into a fixed schema with the exact quote; compare to the gold fields. (c) Write the rubric weights on a page before any UI. (d) Decide the differentiator in one sentence (the scenario reorder with the visible weights). **Stop** if fewer than 3 records give usable numbers: fall back to rank 2. |
| **Hot spots** | Harmonization that a fire scientist rejects (hotspot counts are not fires; pixel size and exposure differ) | (a) Get a FIRMS MAP_KEY, call `data_availability` for MODIS_SP, VIIRS_SNPP_SP, NOAA-20, NOAA-21; confirm the SNPP end date and which products still run. (b) Pull one AOI for the sensor-overlap period (SNPP and NOAA-20 both live) and compute the raw ratio, with the area API's 1-5 day limit in mind (gpt V9); decide a cached history path now. (c) Check the ratio on a held-out overlap window. **Stop** if the overlap does not stabilize: ship raw vs FRP vs counts with the seam drawn and an explicit "not corrected" label. |
| **Analogs** | A similarity score that a planetary scientist calls meaningless (incommensurable sensors); also reads as a re-skin of NASA's Analog Explorer | (a) Write the purpose and the 3 dimensions in the first hour with a reviewer if possible (gpt boundary). (b) Check that every cell has a primary source, and mark unknowns as "unknown". (c) Check the seed list loads (PAAD and Known Analog Sites returned 403 to curl in my R1). (d) State on one slide what the tool says that NASA's explorer does not (a process, a non-famous site, or an explicit "where it breaks"). **Stop** if no reviewer and no sourced 3x5 table by hour 2: move to Lunar. |
| **Jukebox** | "A visualiser with a soundtrack": the mapping is not legible, or brightness is a colorized-pixel artifact (gpt, beam); copyright checkbox if any produced EIC audio is used | (a) Download one frame set from SVS (for example 5313; gpt V5 lists a 32.7 MB H.265) and play a 20 s Web Audio render in Chrome and Safari. (b) Confirm the frames' colour bar decodes to values; if not, label the mapping an "image mapping" (gpt). (c) Write the mapping card (one parameter, one visual feature) and test with a person who closes their eyes. (d) Strip any embedded music; use frames only. **Stop** if the mapping cannot be explained in one sentence. |

---

## 4. Cross-cutting actions for any pick (judge lens)
1. **Spend the first hour on keys and data, not on the idea debate**: one real call each to Jev, Hydrogen and Decision 1 (gpt, kimi), plus the smallest real asset for the chosen challenge. Cache the fixtures.
2. **The project link is the product.** The submission guide says most of the evaluation is of the project submission, and the 30 s or 7-slide demo mainly lifts Presentation (r1 section 0, VERIFIED). So the live page must load fast with fixtures, with no login.
3. **Name the award** (Best Use of Data, Storytelling, Art & Technology, Best Mission Concept, Galactic Impact) and build the 30 s to it.
4. **Put a "where this breaks" drawer in the product.** It is a Validity signal in every shortlisted option.
5. **Reserve the last 6-8 hours** for integration, credits and licenses, SI disclosures (watermark any AI image, text-and-metadata disclosure for audio, code, data), and the final cut (gpt). No NASA logos.
6. **Human originates the idea.** This file is options for discussion; nothing here is a dictated concept.

## 5. Open items for deepseek's lens (when it lands)
- Is a hotspot-count overlap ratio a defensible harmonization, or is FRP or a different estimand needed?
- What three dimensions would a planetary geologist accept as commensurable between a Moon target and an Earth site?
- Are the PSI small tables enough to support a rank that a combustion SME will not reject?
- Does a colorized EIC frame carry value information, or only a palette?
