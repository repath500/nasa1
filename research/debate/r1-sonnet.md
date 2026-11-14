# Round 1: sonnet (lens: Judge & Impact)

Date: 2026-11-14 (hackathon live; submissions close Sun 15 Nov 11:59 p.m. local). I read all 14 challenge files, the wave-1 findings (gpt-a, grok-a, grok-b, ds1 to ds5; the long ds files in the sections that drive decisions), and re-checked rubric and rule claims at the source.

**Rule reminder.** Everything below is stress-testing of options. It is not an idea chosen for the team. The human team picks the challenge and the concept (Space Apps rule: SI must not originate the idea).

---

## 0. What actually wins: facts verified from the source

Checked with `curl` against the live pages on 2026-11-14.

| Claim | Status | Source and what it means for us |
|---|---|---|
| Five criteria, each scored 1 to 5 at every level | **VERIFIED** | https://www.spaceappschallenge.org/resources/judging-awards-guide (dated Nov 13, 2026) |
| **Creativity 5 = "a novel concept that has not been attempted before"** | **VERIFIED** | Same page. A concept that is another dashboard or another map is capped at 3. The word "improvement upon existing ideas in a meaningful way" is the safe route to a 4. |
| **Relevance 5 = NASA data is "integral", not a "superficial addition"** | **VERIFIED** | Same page. The AI layer cannot carry Relevance; NASA data has to carry the result. |
| **"The majority of judges' evaluation will be based on your project submission" (the final-project link), not the demo** | **VERIFIED** | https://www.spaceappschallenge.org/resources/project-submission-guide/. The 30 s video / 7 slides feeds **Presentation** only ("a strong project demo can increase the potential for a high score in the Presentation category"). So the live site or repo must itself work, load fast, and tell the story with no login. A beautiful video over a broken link loses the other four criteria. |
| Presentation is judged on the demo **and** the full project; the guide says teams under-invest in it | **VERIFIED** | Judging guide, "Presentation" paragraph |
| Over 30 s / 7 slides is **not eligible for Global Judging** | **VERIFIED** | Submission guide, "Limitations" |
| SI "should not be used to come up with your idea of how to solve the challenge"; AI images/video need a visible watermark; audio/code/data acknowledged in text and metadata; judges see the indicators and evaluate "originality, intent, and execution" | **VERIFIED** | Submission guide, "Use of Super Intelligence (SI)" |
| The "SI" form question is **not shown** to judges; watermarks, text and metadata are | **VERIFIED** | Same. So SI disclosure has to live inside the project, visibly. |
| Checkbox: "has not used any copyrighted materials (i.e., music, images, text, etc.) that we don't have permission to use" | **VERIFIED** | Judging guide, eligibility. This matters for AI music (Lyria) and for EIC videos that embed licensed music (ds4 says some do). |
| Ten Global Awards, each with a one-line definition (Best Use of Science / Data / Technology, Galactic Impact, Best Mission Concept, Most Inspirational, Best Storytelling, Global Connection, Art & Technology, Local Impact) | **VERIFIED** | Judging guide, Phase 3 |
| Phase 1 is Local judging by local judges chosen by the Local Lead; Global Nominees announced Dec 3 | **VERIFIED** | Same. **The first judges are local volunteers.** They are often not domain experts, so the first 5 seconds and the plain-language "why it matters" count for more than in global rounds. |
| 2025: 11,500+ submissions for 10 Global Winners | **VERIFIED** | https://www.spaceappschallenge.org/2025/awards/global-winners/ (about 0.09% base rate; being "good" is not enough, we need a distinctive award-shaped story) |

**Judge-lens implications that cut across all 14 challenges**

1. **Pick the award you are aiming at and build the 30 s demo to it.** Roughly: Best Use of Data (data made accessible or put to a unique use), Best Storytelling, Art & Technology, Galactic Impact, Best Mission Concept. A project that is "good at everything" gets none.
2. **The live link is the product.** Aim for a single static or near-static site that loads in under 3 s, with precomputed fixtures and a "live" toggle. This is also the engineering-safe path.
3. **One hero moment that can be understood by someone with no context** (the guide's own words: "someone who has no context, technical background, or previous knowledge"). The best candidates have a one-image, one-sentence payoff, for example "the Sun is up but Earth is below the horizon, so there is power and no comms".
4. **Visible honesty scores on Validity.** A "not significant" result, a "where the analogy breaks" panel or a "what we know / what we infer" drawer all read as scientific maturity to a judge in 10 seconds.
5. **AI must be necessary to the user outcome, or be quietly modest.** Judges will see the SI indicators. A decision model that sorts, ranks or gates with a visible probability is credible. A chat box wrapped around a map is not.

---

## 1. Scores for all 14 challenges (1 to 10, for this team, stack, ~36 hours left, 3 to 5 people)

Scoring blends: win-ability under the five criteria, hero-shot strength in 30 s, risk of not finishing, crowding, and genuine AI fit. "Crowd" uses a **noisy GitHub proxy** (see section 3, dispute D3). Treat it as a direction, not a headcount.

| # | Challenge | Score | One-line reason |
|---|---|---|---|
| 1 | **Identify Earth analogs for Moon base / Mars** | **8** | Least crowded (about 3 recent repos), "surprise us" and "where the analogy breaks" are written into the brief, the match/mismatch profile is a Validity signal, and Jev/embeddings do real work. Risk: a planetary scientist will wince at a naive similarity score. |
| 2 | **Planet X and SPHEREx** | **8** | Blink comparator is a 3-second hero and the five test targets let judges check Validity themselves. Data access is the best of the set (anonymous SIA and cutouts, DR1 live). Risk: FITS and epoch handling, only a few epochs, and the AI is optional. |
| 3 | **Flame in Freefall** | **7** | The only brief that literally asks for an "SI-powered" ranker and every PSI record is CC0, but 59 repos already carry the name, the closest prior art (Flaregrain, created yesterday) is unlicensed, and "a ranked list of papers" is a weak hero shot. |
| 4 | **Lunar Landing Site Navigator** | **7** | Best single hero fact (Sun up, Earth below horizon) and an obvious Best Mission Concept fit, but crowded (about 60 repos), AI is a gimmick on a geometry problem, and a judge will compare us with Quickmap. |
| 5 | **MODIS/VIIRS hot spots** | **7** | Clearest societal user, a true seam to expose (SNPP ended 2 Nov 2026 per ds1), the only listed resource is FIRMS. But harmonization is statistics, AI is a narrator, and "fire dashboard" is the most familiar genre. |
| 6 | **Earth Information Jukebox** | **7** | Audio makes a 30 s video memorable and the accessibility story is genuine. Art & Technology and Most Inspirational are open. Risks: copyright checkbox and AI-music disclosure, Jev has no natural role, and mapping must be auditable or it reads as a visualiser. |
| 7 | **Field Shift: Farms** | **7** | Highest Impact ceiling and Local Impact potential, and the brief wants SI-style decision support. But 26 resource links, agronomy validity, US-only soil/OpenET, and a very familiar theme (16 repos, many prior winners). |
| 8 | **Discarded Equipment storytelling** | **7** | Best Storytelling / Most Inspirational shape, best-quality data (71-record LROC shapefile). But the story must be human-authored for originality, Jev is nearly irrelevant, and Beginner/Youth is a crowded level. |
| 9 | Dancing with the SARs | 6 | NISAR is new and visually striking, but validated data is weeks old (from 21 Oct 2026), granules are 0.8 to 4 GB, and misreading a SAR image is a Validity trap. |
| 10 | Martian Map | 6 | Great imagery for dither, but a crowded genre (about 20 repos) and a heavy multi-layer build; the AI is a narrator. |
| 11 | Earth System Trend Detective | 5 | Scientifically clean, but Giovanni already makes the plot, the brief says SI is optional, and the hero is a line chart. 32 repos. |
| 12 | Health Monitoring | 4 | Validity and safety risk (a probability next to a diagnosis), NASA data is thin so Relevance is hard, and "dashboard of vitals" is a crowded shape. |
| 13 | Space Mission Design Game | 4 | Up-to-4 multiplayer and a real physics model do not fit the time left; about 47 repos; Creativity is capped by existing games. |
| 14 | Junior Astronaut Trainer | 4 | About 90 repos, ages 7 to 12 clashes with a hard dither look, no likeness of under-18s in the demo, and Gemini API terms are 18+ (ds3, ds4; not re-verified by me, gemini lens should). |

---

## 2. Shortlist (6) with directions, evidence and AI value

For each: 2 to 3 distinct DIRECTIONS (options, not one dictated idea), best evidence for and against, and where Jev and Gemini add real value versus where they are a gimmick.

### S1. Earth analogs for Moon base / Mars

**Directions**
- **A. Ranker with a mismatch profile.** The user picks a lunar or Martian target. The tool ranks a short, curated list of Earth sites on several dimensions and shows a radar or bar profile of match and mismatch, with a "what you can and cannot test here" line.
- **B. Process analog finder.** Instead of whole sites, search for a process (aeolian dunes, lava-tube skylights, permafrost ice) and show the Earth examples that share that process, using USGS PAAD (45 dune fields, CC0) and Known Analog Sites as the seed.
- **C. "Surprise me" embedding search.** Use image and text embeddings to find Earth tiles that resemble a lunar or Mars tile, then immediately subject each hit to a data-based sanity check that shows why it is or is not a valid analog.

**Evidence for.** The brief says "surprise us", "look beyond well-known analog sites", and "explain where the analogy breaks down" (challenge file). ds2 found no widely known queryable similarity tool: TADP is an archive, IMEWG's registry is in development, ESA's catalogue is a static 2012 PDF. GitHub proxy shows only about 3 recent repos with analog framing. Levels include Beginner/Youth, so Local judges will be reading plain-language framing.
**Evidence against.** Validity is the whole game: Earth sensors and Moon/Mars sensors measure different things at different scales (ds2 open question 10), and the brief itself says visual similarity is not enough. A weighted score without uncertainty will read as made-up. Several resources (PAAD, Known Sites DOI pages) returned 403 to curl, so the seed list needs a live check.
**AI value.** Real: Jev `score` per dimension on a short written record per site (terrain, thermal, ice, dust, operations) returns calibrated probabilities that feed the profile; `noul` gives "useful analog for this purpose". Gemini 4 Hydrogen reads paired images and produces a structured similarity and caveat record. Gimmick risk: asking Jev to judge raw planetary images (Box is experimental, no benchmark); keep numbers in code, and ask Jev only about short records the team wrote.

### S2. Planet X and SPHEREx

**Directions**
- **A. Blink bench.** Coordinates in, a stack of epoch cutouts out, play/blink, difference view, FOV control, URL state. Five required presets plus a sixth (comet 3I/ATLAS).
- **B. Spectrum-first.** Same patch, but the hero is a click that returns the 102-channel spectrum, so a user sees why this survey differs from WISE (grok-b "six-ink spectrum").
- **C. Volunteer triage.** A short queue of candidate crops, each with "mover / stripe / misalignment" probabilities and a "send to a human" button, in the Backyard Worlds spirit.

**Evidence for.** The brief names five test objects, so a judge can check Validity in seconds. WiseView is the model and Backyard Worlds is a NASA-recognised public-participation story (strong for Most Inspirational and Global Connection). Data access is the most open of the set: grok-b verified anonymous SIA2 examples and cutouts. Advanced level only.
**Evidence against.** gpt-a says about 3 sky epochs exist; grok-b says QR1 retired, QR2 downloadable to Feb 2027, QR3 and DR1 current. Epoch counts per target are not established. Barnard's Star moves about 10 arcsec per year, so a wrong epoch misses it. FITS in the browser eats weekends; render server-side. Competition proxy: about 14 "spherex blink" and 28 "spherex planet x" repos already.
**AI value.** Jev: only on a raw (not dithered) difference JPEG crop, with team-written criteria that mention the helium stripe and channels 51 to 52; it must not be sold as discovery. Hydrogen: caption a code-computed spectrum and help draft the Planet X caveat. Both are optional, so this direction wins on data and presentation, not on AI. That is a trade the team should make with eyes open.

### S3. Flame in Freefall

**Directions**
- **A. Habitat rank desk.** Pick a cabin atmosphere (ISS, lunar cabin at 30% O2 and 10.2 psi or less, suit at 100% O2 and 4.3 psi); the list of investigations re-ranks with an expandable probability, quote and DOI.
- **B. Flammability-limit map.** One O2-vs-flow chart with points traced to papers, the lunar band tinted, SoFIE-GEL as a clearly labelled literature overlay.
- **C. Clip-first film reader.** A few short public flame clips with timestamped ignition / steady / extinction and the test conditions beside them.

**Evidence for.** The only brief that literally asks for an SI-powered ranker ("summarizes, ranks, and interprets"). grok-b verified the PSI search and investigation JSON are keyless and CC0, and I re-confirmed: `GET https://psi.nasa.gov/geode-py/ws/repo/search?term=combustion&size=5` returned 200 and `.../investigations/PSI-102` returned file entries with `"restricted": false`. Clear lunar atmosphere hook from the brief's own numbers. High-contrast flames look like scientific plates.
**Evidence against.** Crowding is not "thin": the quoted phrase "flame in freefall" matches 59 repos created since 1 Oct 2026. Flaregrain (jpss2004-bot/flaregrain, created 2026-11-13, no licence, 0 stars) already ranks 24 PSI investigations, so code is not reusable and the idea is not unique. FlameGuard (RAG console) exists too (grok-b). Archives are huge (FLEX 924 GB, BRE 2 TB), so the demo must be a curated set of papers and metadata. The hero shot is a sorted list, the weakest of the shortlist for a 30 s video. Audience is narrow (researchers), so Impact scoring depends on the Earth-spinoff and lunar-base framing.
**AI value.** Genuine: ranking under a team-written rubric (habitat overlap, pillar, evidence strength) is what Jev's probabilities are for, and Hydrogen reading PDFs and clips into a schema is a real use. A quote-check `noul` is a good hallucination guard. Weak point: if the rubric weights are hidden, it is a black box; show them.

### S4. Lunar Landing Site Navigator

**Directions**
- **A. Horizon studio.** Two or more sites side by side, LOLA-derived horizon, Sun and Earth arcs, sunset/Earthset countdown.
- **B. Window matrix.** Site by date heatmap, with a "launch slip" slider that animates which windows close.
- **C. Public explainer.** The same engine in a guided "why one degree matters" scroll for educators and the public.

**Evidence for.** One-sentence payoff verified in ds2: at 0E, 89.9S on 2026-12-01 the Sun is about 1.49 degrees above the horizon while Earth is about 1.5 degrees below it. That is a hero shot a judge understands without any context. The brief explicitly values rapid comparison, countdowns, and date flexibility. Natural fit for Best Mission Concept.
**Evidence against.** About 60 repos match "lunar landing site", so a judge may have seen several. A terrain-occluded horizon is the quality bar; a spherical horizon will look naive to a mission-planning judge (grok-a open question). ds2 notes Artemis III is now a 2027 LEO test and the first crewed landing is Artemis IV (2028); the nine 2024 candidate regions may not carry over. I could not verify this myself, so mark it DISPUTED until someone checks NASA's own page.
**AI value.** Weak and honest answer: the core is geometry and ephemeris, which must be computed in code. Jev `score` on a feasibility rubric is cosmetic; Hydrogen's mission-brief text is nice but not essential. If the team wants "AI is necessary", this is not the challenge. If the team wants "deterministic correctness plus a clean decision UI", it is.

### S5. MODIS/VIIRS hot spots

**Directions**
- **A. Atlas.** Draw an area, see a harmonized 12-month by year calendar with an anomaly stripe and CSV export.
- **B. Sensor-seam lab.** Show MODIS-only, VIIRS-only and harmonized calendars side by side with sliders for confidence, dedupe radius and overlap correction.
- **C. Fire weather story.** The calendar plus POWER or ERA5 context for why a season was unusual.

**Evidence for.** FIRMS is the one resource listed, so Relevance is clean. ds1 reports a real, timely seam: Suomi NPP VIIRS ceased 2 Nov 2026 and MODIS is ending; a tool that shows the seam looks mature. Clear users (emergency managers, land managers). Easy data, accessible-colour-ramp requirement is concrete.
**Evidence against.** The core method is statistical (ratio or quantile correction), so the AI is a narrator. Dither fights the brief's own "accessible color ramps" unless a second view is offered. ds1's own Aqua status finding is conflicting (Aug 2026 vs Sep 2027), so any claim about "MODIS ended" needs a live check before it goes on a slide. Familiar genre; ds1 itself notes dashboards are crowded and the method must be the hero.
**AI value.** Moderate: a `noul` "is this month anomalous for this place?" is redundant with a z-score. A real use is classifying the likely driver (agricultural, wildfire, flare) from features, but that needs labelled data the team does not have. ds1's AI-fit 9 is inflated; I would give it 5 to 6.

### S6. Earth Information Jukebox

**Directions**
- **A. Audio-first accessible player.** Six EIC pieces, a literal and auditable mapping (published as a "mapping card"), screen-reader and keyboard-first.
- **B. Mapping lab.** The user builds the mapping with sliders and hears it; the tool reports whether the mapping preserves data order.
- **C. Curated album.** Six original tracks with sleeve art and process notes, allowed by the brief.

**Evidence for.** The brief explicitly allows a playlist and explicitly values accessibility and "musically pleasing" output. Sound makes a 30 s video stick. All eleven resources are NASA SVS pages. Strong Art & Technology, Most Inspirational and accessibility story. Beginner/Youth level, so Local judges will reward clarity.
**Evidence against.** The submission checkbox says no copyrighted music without permission; ds4 reports some EIC videos embed licensed Universal Production Music or Pond5 assets, so use frame sets and your own audio. If the mapping is not legible, it is "a visualiser with a soundtrack". Claims of testing with blind users are only valid if it actually happens (ds4 open question 7). Lyria RealTime is experimental with no public price (ds4).
**AI value.** Hydrogen: read a frame and extract structured features and alt text (real). Jev: a choice of arrangement and an intensity score per section is plausible but replaceable by a rule table; call it modest. Do not let AI-composed music be the thing judges are asked to admire; it must be labelled and the mapping must be data-driven.

**Also considered, not shortlisted**
- **Farms (7).** Highest Impact ceiling and the brief practically asks for decision support with evidence, but 26 links, US-only soil and OpenET, and crowding make it the "best if the team has an agronomist" option. OpenET terms are restrictive (ds1, ds5); do not commit raw data.
- **Discarded Equipment (7).** The best Storytelling shape and data, but the Space Apps rule means judges look for human authorship; an AI-written "lander voice" is the exact thing that gets scored down on originality. If the team has a writer, it is a real contender.

---

## 3. Findings I dispute or that need correcting

| ID | Finding | Dispute / correction | Evidence |
|---|---|---|---|
| D1 | **gpt-a: "Competition" scores of 8 to 9 for Flame and SPHEREx (inferred from level and niche)** | The inference is unverified and the proxy points the other way. | GitHub search (created >= 2026-10-01): `"flame in freefall"` 59 repos, `spherex "planet x"` 28, `spherex blink` 14, `"lunar landing site"` 60, `"junior astronaut"` 90, `"mission design game"` 47, `"analog" moon mars earth similarity` 3, `jukebox sonification nasa` 5, `firms viirs modis` (first pass) 5. Method is a **noisy name/keyword proxy** (it counts hobby repos and is affected by whether a repo mentions the challenge name). It is still the only measured signal in the debate. The one challenge that looks genuinely thin is Analog. My interrupted third pass (name/description scope) did not complete, so those numbers are unconfirmed. |
| D2 | **ds1: AI fit 9 for fire (Jev `driver` choice, `is_anomalous` noul)** | Both questions are either deterministic (z-score) or need labelled data the team does not have. Realistic AI fit is 5 to 6. | ds1 section 4.6 F1 itself says counts and z-scores are computed in code; the Jev questions restate them. |
| D3 | **gpt-a vs grok-a on SPHEREx: AI fit 9 vs 5** | grok-a is closer to the evidence. The only place Jev has a defensible job is triage on a raw difference crop (grok-b 4.3), and Jev's own docs say it ingests PNG/JPEG 256 to 1568 px and treats Box as experimental. gpt-a's "Box locates it" is untested. SPHEREx wins on data access and presentation, not on AI. | gpt-a A1 (inputs, Box experimental); grok-b section 3 4.3; grok-a table row 12. |
| D4 | **gpt-a / grok-a: "Flame needs PSI registration" and ds5: "PSI is login-gated"** | Metadata and file records are keyless. grok-b was right, but file **bytes** are unconfirmed. ds5 may be describing the bulk-download path (email-delivered links). | I re-fetched: `https://psi.nasa.gov/geode-py/ws/repo/search?term=combustion&size=5` returned HTTP 200, and `.../investigations/PSI-102` returned file records with `"restricted": false`. **VERIFIED** for metadata, **UNVERIFIED** for downloading a Saffire zip without a login. |
| D5 | **grok-b: Flaregrain and FlameGuard as "prior art"** | Flaregrain is real but one day old with no licence and no stars; it is a competitor, not reusable code, and not evidence that judges have seen it. FlameGuard is a RAG chatbot. The correct reading is "idea is not unique", not "field is taken". | `https://api.github.com/repos/jpss2004-bot/flaregrain` returned created 2026-11-13, 0 stars, `license: None`. |
| D6 | **ds4: "Storytelling: Hydrogen drafts the lander's first-person memory"** | This is the risk, not the feature. Judges are told to evaluate "originality, intent, and execution" of SI-assisted elements and the SI question is hidden, so the visible mark is the watermark/metadata. An AI-written narrative on a Storytelling entry is the easiest thing to score down. Human-authored story, AI only for alt text and fact-check. | Submission guide "Use of Super Intelligence". |
| D7 | **Several findings rank Mars and kid-game challenges as "crowded genres" but treat Lunar Navigator as safe** | Lunar is equally crowded by proxy (60 repos). The differentiator is not the topic but the horizon accuracy and the 30 s payoff. | GitHub proxy above. |
| D8 | **ds2 "Artemis III is a 2027 LEO test; Artemis IV lands in 2028"** | Plausible but not independently confirmed by me; it matters because judges and the Martian Map brief ("recent Artemis II lunar flyby") frame the story. | Marked **UNVERIFIED** by me; the challenge text itself says Artemis II flew a lunar flyby. A one-minute NASA page check should settle it before any slide states a date. |
| D9 | **ds1 "Jev about 0.08 s P50" and ds4 "70 to 500 ms" (latency)** | Vendor claims only. gpt-a labels them UNVERIFIED; ds1 and ds4 repeat them as fact. | gpt-a A1 Latency row. Do not put a latency number on a slide. |
| D10 | **Everything calls the demo the thing that wins** | The guide says the majority of evaluation is of the **project submission**, with the demo mainly lifting Presentation. | Submission guide, "Link to Project Demo". |
| D11 | **Decision model "gimmick" test is applied inconsistently** | A fair test: if you delete the AI and the user outcome is unchanged, it is a gimmick. That fails Lunar Navigator, Fire, Trend, SPHEREx (mostly) and passes Analog, Flame (ranking) and partly Farms. A judge who sees the SI badges will run this test too. | Cross-read of the concept tables in grok-b, ds1, ds2. |

---

## 4. Open questions the next research wave must answer before the team commits

1. **Can you actually get Jev and Hydrogen keys now, and what are the limits?** (TypeSafe rate limits unpublished; Hydrogen free-tier RPM not listed.) Test both in the first 30 minutes; decide fallback to `gemini-decision-1` and cached fixtures.
2. **Analog:** what is the minimum defensible feature set (3 to 5 dimensions) for a Moon target, and can a space-geology SME on the team or in the local event check it? Which seed list (PAAD, Known Analog Sites, TADP) loads without a 403?
3. **SPHEREx:** how many epochs exist per required target at DR1 + QR3 right now, and does a `?center=RA,DEC&size=` cutout download in under about 5 s? Which Gaia DR3 proper-motion epoch do we use for Barnard's Star?
4. **Flame:** can one small PSI file (for example SAME, 0.66 GB) be downloaded without a login? If not, is a metadata-plus-NTRS-papers MVP enough for Relevance 5?
5. **Lunar:** is a LOLA-occluded horizon feasible in under 8 hours for 2 sites? What does NASA currently say about Artemis IV candidate regions?
6. **FIRMS:** current max dates for Aqua MODIS and NOAA-20/21 standard-quality data through the `data_availability` endpoint; is the "SNPP ended 2 Nov 2026" claim confirmed on NASA's page?
7. **Competition:** repeat the GitHub proxy with `in:name,description` scoping and with Devpost/Space Apps team pages (my third pass was cut off). Also look at how many of the 2025 Global Winners were data tools versus stories versus games.
8. **Team shape:** who is the storyteller/designer? The guide explicitly recommends recruiting for storytelling and design. If nobody owns the 30 s demo, the four Impact/Creativity/Validity/Relevance scores will not be seen.
9. **Which award is the team aiming at**, and which direction supports it (see section 0 point 1)?
10. **Local judges:** who are they, and are they domain experts or general STEM volunteers? This changes how much plain-language framing the first 5 seconds need.

---

## 5. Summary of my position after round 1 (not a vote yet)

- **Strongest for Judge & Impact:** Analog (least crowded, rubric-shaped), SPHEREx (best hero and data access, weakest AI), Lunar (best one-line payoff, weakest AI, most crowded).
- **Strongest AI story:** Analog and Flame. Flame pays the price of a weak hero shot and measurable prior art.
- **Biggest hidden judge risks:** an AI-authored story on a Storytelling entry; a hidden-weight ranker; a Jev call that does what a z-score does; a broken project link under a polished video.
- **Fallback if the team lacks SME or agronomy depth:** SPHEREx (all five targets are checkable) or Lunar (deterministic geometry).
