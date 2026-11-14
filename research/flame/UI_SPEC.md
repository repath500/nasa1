# UI_SPEC: Flame in Freefall (UI/UX and demo)

Status: draft v2, overseer rulings R1–R8 applied (see the revision log at the end) · 2026-11-14 · Author: UI/UX and demo lead (design sub-agent)
Scope: visual direction, dither technique, screens, components, the 7-slide deck (default, title included), a stretch video under 25 seconds, accessibility and compliance. Planning only. No application code.

**Inputs read:** `research/flame/BRIEF.md`; `research/findings/gpt-a-ai-tech-design-rules.md` (rules, §A4, §B, §C1–C7); `challenges/flame-in-freefall.md`; `debate/VERDICT.md`; `plans/plan-flame.md`; `plans/samples/flame-jev-quickstart.md`.
**Checks run this session:** contrast script `research/flame/samples/contrast_check.py` → `samples/contrast_results.txt`; font and library licence files fetched from source (§7).

> **Space Apps rule.** This is a recommendation. The human team chooses the final look and confirms the decisions in §0. Nothing here claims the idea was originated by a person.

---

## 0. Decision points for the human team

| # | Decision | Recommendation (this spec) | Why it is the team's call |
|---|---|---|---|
| D13 | Visual direction | **Flight Director, modified** (§1) | Taste and the look the team presents |
| D5 | Ranking priorities and tolerances (S4) | Lexicographic baseline: priority order over pillar match, covers count, evidence tier, near count. Tolerances O₂ ±3 points, pressure ±15%; flow factor 2 displayed (**proposed**). Jev columns sorted separately, never combined | The priority order is a scientific judgement; humans approve it in writing |
| D7 | Scenario presets | **Four presets**: `earth-iss`, `lunar-cabin-example`, `exploration-upper`, `suit`. Custom O₂/psi inputs are P2 | Wording is the team's. The lunar example is "an example the challenge anticipates", not a design |
| D8 | Jev column kept? | Shown only if BUILD_PLAN D8 (the G3 rule) is yes; otherwise hidden, and the banner says so | G3 is measured on the team's labelled pairs |
| D9 | Demo format | **7-slide deck including the title** is the default. Video is stretch only, under 25 s | Judges mostly score the project (R5) |
| D14 | Record approval | A named human reviewer and date are required before a record appears. The app never sets approval | Rule from BUILD_PLAN §2.4 step 5 |

Composite index: not offered as a decision. OVERSIGHT R1 and the brief rule it out, so no composite number is shown or used to sort. Decision IDs match BUILD_PLAN §1.5 and §1.6.

---

## 1. Chosen dither design direction: FLIGHT DIRECTOR (modified)

### 1.1 Recommendation and reasons

Choose **1 · Flight Director** (GPT-A §C7). Keep its structure. Make the four changes in §1.2.

1. **The register fits evidence work.** Researchers need an instrument, not a poster. Hairline rules, mono numerals, no radii and one accent give that. GPT-A names it the fit for this challenge ("Fits: Flame in Freefall…").
2. **Dither is cheapest and most stable.** A 4×4 Bayer, 2-level threshold in one shader pass is stable under pan and zoom. It does not shimmer frame to frame, which error diffusion does. Only this direction is built around live dither.
3. **Dark ground suits flame imagery.** Bright flame stills keep their luminance on near-black. The 1-bit grain reads as texture. Text and numerals sit on solid fills, so the dither never competes with data.
4. **Lowest NASA-identity risk.** Manual '75 pairs a red accent with a Helvetica-style grid, which is close to the identity the brief forbids echoing. Flight Director has no red and no NASA-derived layout.
5. **Accessible by construction.** Every pair in §1.4.2 passes WCAG 2.2 AA in both themes.

### 1.2 Changes from GPT-A §C7

| Item | GPT-A §C7 | This spec | Reason |
|---|---|---|---|
| Accent | `#FF5B1F` orange, "alerts and ACT band" | `#7CC4F2` cool blue (light `#0A5FA8`). Used only for selection, focus and the SI tag | Orange on a fire topic reads as an alarm, and the flame imagery is already orange |
| "ACT" band | Orange band for act/review/escalate | **Removed** | "ACT" is an operational decision. Jev output is not a fire-safety decision (brief, VERDICT) |
| Probability encoding | §C5: Jev probability becomes dither density; §C7 bars use 4×4 Bayer fill | **Removed.** Jev outputs use an ordinal glyph (§2.5) | Brief: ordinal, never "probability". Density would also turn a model value into a texture |
| Dither size | 8×8 Bayer | **4×4 Bayer**, 2 CSS px cell | Shorter tile period (8 CSS px) on mid-tone flame photos. Matches the plan |
| Smallest text | Mono caps at 11 px | **12 px floor** | Readability |
| Light theme | Not specified | Light twin (§1.4) | Dark-only fails some low-vision users and matters for print and projector use |

### 1.3 Directions not chosen

- **2 · Manual '75** (paper, Atkinson, halftone). Strong for archival hardware. Its red accent (`#C0201A`) on a Helvetica grid reads as NASA-identity pastiche, which GPT-A itself bans. Atkinson and halftone are offline techniques, while our live surfaces need live dither. Atkinson is kept only for an optional print export (P2).
- **3 · Deep Field** (negative plate, UV blue, blue noise, blink comparator). Built for SPHEREx sky plates and Jev Box movers. A blink comparator and star-field language do not describe combustion evidence.
- **Plan's light paper set** (`#F4F1E8`, `#172023`, `#245C91`, `#A75A0A`, plan-flame §Shared dither system). Workable and close to Manual '75 in mood. If the team prefers it, swap §1.4 tokens. The dither rules in §2 do not change. This is D1.

### 1.4 Tokens

#### 1.4.1 Colour (CSS custom properties, light and dark)

```css
/* tokens.css. Dark is the default. Light applies by OS preference or data-theme. */
:root {
  color-scheme: dark;
  --color-bg: #0B0D10;
  --color-surface: #12161B;
  --color-raised: #1A1F26;
  --color-hairline: #232A33;          /* decorative only; never a control boundary */
  --color-ink: #E8EAED;
  --color-muted: #9AA1AB;
  --color-accent: #7CC4F2;            /* selection, focus-adjacent, SI tag. Never a risk colour */
  --color-accent-ink: #06121A;        /* text on an accent fill */
  --color-focus: #A8DCFF;             /* 2 px focus ring */
  --color-glyph-on: #E8EAED;          /* ordinal glyph, filled cell */
  --color-glyph-off: #68727F;         /* ordinal glyph, unfilled outline */
  --color-border-strong: #6B7480;     /* inputs and control boundaries */
  --color-flag-text: #F2B66B;         /* "flagged for review" text only; never a fill */
  --color-dither-dark: #0B0D10;       /* duotone for the image plate */
  --color-dither-light: #E8EAED;
  --color-scrim: rgba(0, 0, 0, 0.6);
}
@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) {
    color-scheme: light;
    --color-bg: #F4F5F6;
    --color-surface: #FFFFFF;
    --color-raised: #EDEFF2;
    --color-hairline: #D5DAE0;
    --color-ink: #111418;
    --color-muted: #4F5661;
    --color-accent: #0A5FA8;
    --color-accent-ink: #FFFFFF;
    --color-focus: #0A5FA8;
    --color-glyph-on: #111418;
    --color-glyph-off: #737B87;
    --color-border-strong: #7A828D;
    --color-flag-text: #8A4B00;
    --color-dither-dark: #F4F5F6;
    --color-dither-light: #111418;
    --color-scrim: rgba(17, 20, 24, 0.4);
  }
}
:root[data-theme="light"] {
  color-scheme: light;
  --color-bg: #F4F5F6; --color-surface: #FFFFFF; --color-raised: #EDEFF2;
  --color-hairline: #D5DAE0; --color-ink: #111418; --color-muted: #4F5661;
  --color-accent: #0A5FA8; --color-accent-ink: #FFFFFF; --color-focus: #0A5FA8;
  --color-glyph-on: #111418; --color-glyph-off: #737B87; --color-border-strong: #7A828D;
  --color-flag-text: #8A4B00; --color-dither-dark: #F4F5F6; --color-dither-light: #111418;
  --color-scrim: rgba(17, 20, 24, 0.4);
}
:root[data-theme="dark"] { /* identical to the default block above */ }
body { background: var(--color-bg); color: var(--color-ink); }
```

#### 1.4.2 WCAG 2.x contrast (computed this session; script `samples/contrast_check.py`)

| Pair | Dark | Light | Needed | Result |
|---|---|---|---|---|
| Body ink on bg | 16.14 | 16.92 | 4.5 | Pass |
| Body ink on surface | 15.07 | 18.47 | 4.5 | Pass |
| Body ink on raised | 13.74 | 16.03 | 4.5 | Pass |
| Muted text on bg | 7.47 | 6.78 | 4.5 | Pass |
| Muted text on surface | 6.97 | 7.40 | 4.5 | Pass |
| Muted text on raised (chips) | 6.36 | 6.43 | 4.5 | Pass |
| Accent text, link, SI tag on surface | 9.54 | 6.53 | 4.5 | Pass |
| Accent text on bg | 10.22 | 5.98 | 4.5 | Pass |
| Accent text on raised | 8.70 | 5.67 | 4.5 | Pass |
| Accent-ink on accent (primary button, selected chip) | 9.95 | 6.53 | 4.5 | Pass |
| Flag text on surface | 10.10 | 6.80 | 4.5 | Pass |
| Flag text on raised | 9.21 | 5.91 | 4.5 | Pass |
| Focus ring on surface | 12.41 | 6.53 | 3.0 | Pass |
| Focus ring on bg | 13.29 | 5.98 | 3.0 | Pass |
| Focus ring on raised | 11.31 | 5.67 | 3.0 | Pass |
| Glyph filled cell on surface | 15.07 | 18.47 | 3.0 | Pass |
| Glyph unfilled outline on surface | 3.72 | 4.28 | 3.0 | Pass |
| Input boundary on surface | 3.84 | 3.89 | 3.0 | Pass |
| Input boundary on bg | 4.11 | 3.56 | 3.0 | Pass |
| Hairline on surface | 1.25 | 1.41 | none | Decorative only (never a control edge) |
| Plate duotone (ink on bg), dither image | 16.14 | 16.92 | none | Image, no text on it |

Notes. Tokens differ slightly from GPT-A's values because the muted and unfilled-glyph tokens failed on the raised surface and at 3:1 respectively. The first draft of the glyph outline (`#4A5361`) failed at 2.34:1, so it was changed. Results are in `samples/contrast_results.txt`.

#### 1.4.3 Type

| Family | Licence (checked at source) | Used for | Notes |
|---|---|---|---|
| **Inter** (variable, has an optical-size axis) | SIL OFL 1.1. `rsms/inter` LICENSE.txt, "Copyright (c) 2016 The Inter Project Authors" | UI, headings, body, quotes | Self-host woff2 so the demo works offline |
| **JetBrains Mono** | SIL OFL 1.1. `JetBrains/JetBrainsMono` OFL.txt, "Copyright 2020 The JetBrains Mono Project Authors" | All numbers, IDs, DOIs, timestamps, caps labels | Tabular figures |
| system-ui, ui-monospace | OS-supplied, not redistributed | Fallback only | Used if web fonts fail |

Ship the OFL text with the font files (`licenses/OFL-Inter.txt`, `licenses/OFL-JetBrainsMono.txt`). Use unmodified upstream files. If a subset is made, check each font's Reserved Font Name clause first. Not used: pixel fonts (GPT-A §C3 flags them as kitsch for body text).

| Token | Size / line | Weight, tracking | Use |
|---|---|---|---|
| `--fs-display` | 44 / 52 | Inter 700, −2% | Title on S1 only |
| `--fs-h1` | 36 / 44 | Inter 700, −1.5% | Page title |
| `--fs-h2` | 28 / 36 | Inter 600 | Section heads |
| `--fs-h3` | 22 / 28 | Inter 600 | Panel titles |
| `--fs-h4` | 18 / 24 | Inter 600 | Card titles |
| `--fs-body` | 16 / 24 | Inter 400 | Body (smallest reading text) |
| `--fs-small` | 14 / 20 | Inter 400 | Table text, helper text |
| `--fs-caption` | 12 / 16 | JetBrains Mono 400, caps, +6% | Labels, badges, status chip |
| `--fs-num` | 14 / 20 or 16 / 24 | JetBrains Mono 400, `tabular-nums` | Every number, ID, DOI, timestamp |

Quotes use Inter 400 at `--fs-h4`, indented, with a 2 px left rule and no italics (Inter italics not needed). Subscript O₂ is written as `O<sub>2</sub>` in HTML, not as a Unicode character, to avoid font gaps.

#### 1.4.4 Spacing, grid, radii, borders

- **Spacing:** 8 px base with a 4 px half-step. `--space-1` 4, `-2` 8, `-3` 16, `-4` 24, `-5` 32, `-6` 40, `-7` 48, `-8` 64, `-9` 80.
- **Grid:** 12 columns at ≥1024 px (24 px gutter); 8 columns at 640–1023 px; 4 columns below 640 px (16 px gutter). Max content width 1280 px.
- **Targets:** 44 px preferred. 24 px minimum (WCAG 2.5.8).
- **Radii:** 0 for panels, tables, cards, drawers. 2 px for inputs and buttons. 999 px (pill) only for the SI badge and the status chip.
- **Borders:** 1 px hairline (decorative). 1 px `--color-border-strong` for any control boundary.
- **Elevation:** none. Overlays use `--color-scrim`.

#### 1.4.5 Motion, with reduced-motion variant

| Token | Value | Used for | Reduced-motion variant |
|---|---|---|---|
| `--dur-step` | 120 ms | Data updates, row reorder | 0 ms (instant swap) |
| `--dur-sweep` | 300 ms | Dither threshold sweep 0→1 on plate reveal | Skipped. Plate shows its final state at once |
| `--dur-fade` | 200 ms | Drawer and sheet open/close (opacity only) | 0 ms |
| `--ease-out` | `cubic-bezier(0.2, 0, 0, 1)` | All of the above | n/a |

Rules. No flashing faster than 3 per second (WCAG 2.3.1). No looping animation anywhere. No blink comparator in v1 (cut by R4: Direction B is a coverage strip only). Any future one runs at 2 Hz or slower and has a pause control (WCAG 2.2.2). The GPT-A "scanline" loader is replaced by static "Loading…" text.

```css
@media (prefers-reduced-motion: reduce) {
  :root { --dur-step: 0ms; --dur-sweep: 0ms; --dur-fade: 0ms; }
}
```
JS reads `matchMedia('(prefers-reduced-motion: reduce)')` once. When it matches, the plate uniform `u_sweep` is set to 1 immediately, and any row animation is skipped.

---

## 2. Dither technique spec

### 2.1 Which algorithm, on which surface

| Surface | Algorithm | Computed in | Status |
|---|---|---|---|
| Scenario image plate (NASA still, hero) | **Ordered Bayer 4×4**, 1-bit duotone, 2 CSS px cells | WebGL2 fragment shader (live toggle, sweep) | P0 |
| Record image plate | Same algorithm. **Default: original.** Dithered view is one click away | Same | P0 |
| Fallback plate (no WebGL2, offline demo) | Same algorithm, **pre-rendered at build** so the look matches | Build script | P0 |
| Evidence card for print or PDF | **Atkinson** (offline, 1-bit) | Build script | P2 optional |
| Halftone (AM dots) | Not used. Built for portraits; no people in scope | n/a | Excluded |
| Blue noise | Not used. Reserved for Deep Field, which was not chosen | n/a | Excluded |
| Floyd–Steinberg | Not used. Worm-like artefacts in flat areas (GPT-A §C1) | n/a | Excluded |
| Categorical fills (pillars) | **Crisp SVG patterns**, not dither | SVG | P0 (§2.5) |
| Numbers, axes, plots, quotes, DOIs, tables, glyphs, chips | **Never dithered** | n/a | Binding (§2.4) |

### 2.2 Implementation

- **Renderer.** One WebGL2 canvas per plate. One full-screen triangle. One texture: the source still, ≤2048 px on its long edge, uploaded once, no mipmaps, linear sampling. The canvas is drawn only on load, resize (debounced 100 ms), toggle, sweep and pan or zoom end. No `requestAnimationFrame` loop.
- **Algorithm.** Sample sRGB → convert to linear → luminance Y (Rec. 709 weights on linear RGB) → threshold = Bayer4×4(cell) × sweep → output one of two theme colours. Thresholding in linear light avoids mid-tones that come out too dark (GPT-A §C1).
- **Anchoring.** The cell grid is in source-texel space (`v_uv × size / cellSrc`). The pattern moves with the image on pan and zoom. It is never anchored to the screen, which would cause the "shower-door" effect.
- **Pixel quantisation.** Device-pixel cell = max(2 CSS px, 1) × DPR, rounded to an integer. DPR is capped at 2. This avoids moiré on HiDPI screens.
- **Cell size.** 2 CSS px minimum, so the pattern does not shimmer. A "Smooth" toggle shows the original.

Shader sketch (specification, not final code; to be built and tested at H1):

```glsl
#version 300 es
precision highp float;
uniform sampler2D u_src;     // NASA still, sRGB, <= 2048 px long edge
uniform vec2  u_srcSize;     // source size in texels
uniform float u_cellSrc;     // one dither cell in source texels (about 2 CSS px on screen)
uniform float u_sweep;       // 0..1 threshold sweep. Always 1 under reduced motion
uniform vec3  u_dark;        // --color-dither-dark
uniform vec3  u_light;       // --color-dither-light
in  vec2 v_uv;
out vec4 o;

float bayer4(ivec2 p) {      // standard 4x4 ordered-dither matrix, normalised to (0,1)
  const float m[16] = float[16](0.,8.,2.,10., 12.,4.,14.,6., 3.,11.,1.,9., 15.,7.,13.,5.);
  return (m[(p.y & 3) * 4 + (p.x & 3)] + 0.5) / 16.0;
}
vec3 toLinear(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
}
void main() {
  float Y    = dot(toLinear(texture(u_src, v_uv).rgb), vec3(0.2126, 0.7152, 0.0722));
  ivec2 cell = ivec2(floor(v_uv * u_srcSize / u_cellSrc));
  float t    = bayer4(cell) * u_sweep;
  o = vec4(Y > t ? u_light : u_dark, 1.0);
}
```

**Library decision: write our own 2D shader.** The shader is about 60 lines and has no runtime dependency. The licence trail stays ours. Options checked at source:

| Option | Licence (verified) | Verdict |
|---|---|---|
| **Own 2D WebGL2 shader (above)** | Our code, Apache-2.0 proposed | **Recommended.** No dependency |
| `paper-design/shaders` | Apache-2.0 (LICENSE text fetched) | Cross-check or fallback. A general shader library |
| `niccolofanton/dithering-shader` | MIT (LICENSE fetched) | Reference only. Built on three.js, too heavy for a 2D plate |
| `darkroomengineering/spargo` | MIT (LICENSE fetched) | Test only. Very new (17 stars at planning) |
| `andrewstephens75/as-dithered-image` | MIT (LICENSE fetched) | Optional for the P2 Atkinson print path |
| `makew0rld/didder`, `gazs/canvas-atkinson-dither` | GPL-3.0 | Excluded from linked code. Not needed |
| `danielepiccone/ditherjs`, `zavalit/bayer-dithering-webgl-demo` | No licence | Excluded. Reference only |

### 2.3 Performance budget (targets to measure at H1; not measurements)

| Item | Budget |
|---|---|
| Source still | ≤2048 px long edge, ≤600 KB as JPEG or WebP. No video |
| Pre-rendered fallback PNG (1-bit) | ≤250 KB per plate at 1024 px |
| Draw cost | ≤1 ms GPU on integrated graphics at 1280×800 CSS px, DPR 2 (one pass, one texture sample) |
| Redraw triggers | Load, resize, toggle, sweep (300 ms), pan or zoom end. Idle cost ≈ 0 |
| Main-thread JS per toggle | ≤2 ms. No per-frame JS |
| First visible plate | Pre-rendered PNG at first paint (≤1.5 s on cached corpus). WebGL swap ≤100 ms |
| Frame rate during sweep | Target ≥55 fps on the reference laptop |
| Own dither module | ≤4 KB min+gzip, zero runtime dependencies |
| GPU memory | Two plates maximum on screen: ≤2 × 2048² × 4 B ≈ 32 MB |
| No WebGL2 | `<img>` of the pre-rendered PNG. Sweep skipped |

### 2.4 Never dithered (binding)

1. **Numbers, units, axes, ticks, legends, p-values, DOIs, IDs, quotes, locators and table cells** are never dithered and never sit on top of a dithered canvas.
2. **The canvas holds only still imagery with no numeric content.** A source figure with axes, ticks or text is shown as the original, and the dither toggle is not rendered for it.
3. **No dither behind text.** Captions and labels sit on `--color-surface` or `--color-raised` outside the canvas bounds.
4. **Model output, glyphs, chips, pattern fills and the rank table are never dithered.**
5. **Enforcement.** A QA test checks that no text node overlaps a `DitherPlate` box. Copy lint checks that "probability" and "safe" never appear next to a model value (§6).

### 2.5 How Jev output appears

**Principle.** Jev's `score` answer is an ordinal rubric level. Jev's `noul` answer is a P(yes) value, and it carries no confidence. Neither is drawn as a probability. The brief rules this out, and the verdict says "Jev confidence is not scientific validation."

**Facts from the vendor snapshot (`flame-jev-quickstart.md`).** A `score` answer returns a probability-weighted float (the example gives `0.67` alongside `probabilities` of `0.33 / 0.67 / 0.0`). A `noul` answer is a number from 0 to 1. A `choice` answer returns the chosen label with `probabilities` and `confidence`. The UI must therefore show the **modal** rubric level, never the float.

**Ordinal glyph (evidence).**
- Four 12 × 12 px squares with a 4 px gap, as crisp SVG. Filled cell: `--color-glyph-on`. Unfilled cell: 1.5 px outline in `--color-glyph-off`. No gradient, no dither, no fill density.
- **Filled cells = level + 1**, so level 0 still shows one cell. The label always shows the number and rubric name, so the glyph is never the only cue.
- Label text, read by screen readers: "Evidence directness (Jev) level 2 of 0–3: primary flight observation. Rubric level, not probability."
- **Modal level only:** the level with the highest value in `probabilities`.
- **No unclear state (R6):** the modal level is shown with its full distribution across levels. No 0.5 or other display threshold is used, so there is no "unsure" label.

```text
level 0  [#...]    level 1  [##..]    level 2  [###.]    level 3  [####]
```

| Jev answer | Type returned | Visual | Never shown as |
|---|---|---|---|
| Evidence directness (`score`, 4 levels; `jev.evidence_directness`) | `score`, `probabilities`, `confidence` | Ordinal glyph + rubric name (above) | Float score, % bars, probability fill |
| Pillar (`choice`) | label, `probabilities`, `confidence` | Chip with text and pattern: prevention solid; detection diagonal hatch; suppression dotted; fundamental outline; unknown dashed | Colour as the only cue; probability fill |
| Regime relevance (`noul`, `jev.regime_relevance`) | 0–1 | "P(yes) 0.93", with its question text. noul returns no confidence. Number in mono, crisp | "Probability it is true"; density or dither; "yes" as a verdict |
| Claim support check (`noul`, `jev.claim_supported`) | 0–1 | "Support check · value 0.93", with the question text ("does the quoted evidence support this sentence?"). Value and question only. No pass or flag label in the end-user UI (R6). The 0.8 triage threshold lives in the reviewer tool only | "Verified", "correct", "passed", "flagged" |
| Confidence (`choice` only) | `confidence` | Record detail only: "model confidence 0.50 (how concentrated the answer is, not whether it is correct)". Jev noul returns no confidence | In the ranking |

**Jev ranking (drives S2; BUILD_PLAN §3.6, R1).** Lexicographic over three bins, each sorted separately: `jev.regime_relevance` (descending), `jev.evidence_directness` ÷ 3 (descending), and P(selected pillar) (descending). Bins are 0.1. All three values appear in their own columns and are **never combined** into one number. Changing priorities reuses stored answers, so it never makes a model call.

**Baseline (transparent, no AI; BUILD_PLAN §3.5).** Sorted lexicographically by the approved priority order over four keys: `pillar_match` (human `pillar_primary` or `pillar_secondary` against the selected pillar), `covers_count` and `near_count` (code, from accepted rows), and `evidence_tier` (human). Ties break by accession. `overlap_class` and the gravity chip are computed by code and shown per row. Neither is a weight. The baseline is only as good as the human tagging, so the tag date is shown on every row.

---

## 3. Information architecture and screens

### 3.1 Site map and global chrome

```
/                 S1  Scenario picker
/rank             S2  Ranked list: baseline versus Jev
  ?sheet=priorities   S4  Ranking priorities (sheet over S2)
  ?drawer=prov        S5  Provenance and export (drawer, any screen)
/study/:accession S3  Record detail (e.g. PSI-98, PSI-102, NTRS-20180004258)
/about            S6  About and SI disclosure
```

- **Names and routes** are the BUILD_PLAN §1.6 names (S1–S6, `/rank?sheet=priorities`, `?drawer=prov`). Do not rename them here.
- **Header (all screens):** product name, nav (Scenario, Ranking, About), "Provenance & export" button, status chip.
- **Status chip (persistent):** one of `LIVE · jev-1.14.0`; `FIXTURE · human-authored, not model output · 2026-11-14` (the static build's default until the TypeSafe and Google terms are read, R8); `CACHED MODEL OUTPUT · jev-1.14.0 · <date>` (only after those terms are read); or `NO-AI · baseline only`. Never blank.
- **Footer (all screens):** licences and credit line, "NASA does not endorse this project", and the link to S6.
- **Focus order:** skip link → header → main. When S4 or S5 opens, focus moves inside. On close, focus returns to the opener.
- **Breakpoints:** ≥1024 desktop (S2 is 8 + 4 columns). 640–1023 tablet (S2 rows become two-line). <640 phone (S2 becomes stacked cards). No horizontal scroll at 320 px (WCAG 1.4.10).

### 3.2 S1. Scenario picker (route `/`)

Desktop wireframe (placeholder values; no results shown):

```text
+==============================================================================+
| Flame in Freefall       Scenario   Ranking   About        [FIXTURE · not model output] |
+==============================================================================+
| 1  Cabin atmosphere (illustrative, not a design value)                        |
|                                                                              |
|  (o) earth-iss             21 % O2 . 14.7 psi   Gravity: microgravity (ISS)      |
|  ( ) lunar-cabin-example   30 % O2 . 10.2 psi   Gravity: lunar, none in PSI    |
|  ( ) exploration-upper     34 % O2 .  8.2 psia  Source: NTRS 20180004258        |
|  ( ) suit                 100 % O2 .  4.3 psi   Gravity: lunar/Mars, none in PSI |
|                                                                              |
|  2  Question        [ Prevention                    v ]                      |
|  3  Your question   [ optional, 200 characters max                       ]   |
|                                                                              |
| HERO (only if K5 passed): Near the lunar-cabin atmosphere, PSI has liquid-droplet |
| (FLEX) tests. No solid-fuel test that reports O2 goes above 22.2%.                |
| Scope: rows that report O2. Solid tables with no O2 count as unknown, not absent.  |
|  +----------------------------+                                              |
|  |  [dithered NASA still]     |  Dithered (Bayer 4x4, 1-bit). Original toggle.|
|  |                            |  Credit: NASA [mission], via [archive].       |
|  +----------------------------+                                              |
|                                                                              |
|  [ Show ranked evidence ]     Evidence discovery only. Not a fire-risk or     |
|                               safety assessment.                             |
+==============================================================================+
```

**Components.** `ScenarioRadioGroup` with four `PresetCard`s (`earth-iss`, `lunar-cabin-example`, `exploration-upper`, `suit`; native radio group). `GravityNotice` (one line per preset). `PillarSelect` (native select: prevention, detection, suppression). `QuestionInput` (200-character count). `HeroStatement` (K5-gated, with its scope line). `DitherPlate` (with Original and Dithered toggle). `CaptionBar`. `PrimaryButton`.

**States.**

| State | Shown when | UI |
|---|---|---|
| Loading | Corpus index loading | Presets disabled. Plate shows the pre-rendered PNG with caption "Loading reviewed records…". Button disabled. `aria-busy` on main |
| Empty | Zero accepted records | "No reviewed records are published yet. Scenario choice is disabled." The demo build must never reach this |
| Error | Corpus index fails | Banner (role=alert): "Reviewed records could not be loaded." Retry, and a link to S6. The DOI list stays readable |
| Fixture | Default static build until the provider terms are read (R8) | Status chip reads "FIXTURE · human-authored, not model output · 2026-11-14". Copy unchanged |
| Hero off | K5 not passed (BUILD_PLAN G1, R2) | Hero statement hidden. The lunar preset shows the S2 empty result: "0 of N studies pass the current gate" |
| No-AI | Keys absent, or user chooses it | Chip "NO-AI · baseline only". Button label becomes "Show baseline ranking" |

**Interactions.** Arrow keys move between presets (radio group). Selecting a preset updates the plate caption and gravity notice. "Show ranked evidence" opens S2 with the scenario in the query string. The O₂ and pressure values are fixed text in v1. Custom input is P2 (D7).

### 3.3 S2. Ranked list: baseline versus Jev (route `/rank`)

The core screen. The baseline ranking sits beside the Jev ranking, and the agreement is stated in plain words.

Desktop wireframe (placeholder values):

```text
+==============================================================================+
| Flame in Freefall       Scenario   Ranking   About         [Provenance & export] |
+==============================================================================+
| Lunar cabin example · 30 % O2 · 10.2 psi · Prevention            [Change]     |
| [FIXTURE · human-authored, not model output · reviewed corpus v1 · 2026-11-14] |
| Agreement (code): Top 3 identical · Spearman ρ 0.xx over N reviewed studies    |
| Priorities: pillar > covers > tier > near · O2 ±3 pts · pressure ±15% (PROPOSED) |
| [Ranking priorities]                          [ ] Hide rows with overlap 'none' |
+------------------------------------------------------------------------------+
| Jev | Base | Δ    | Study       | Pillar (human) | Tier (human) | Overlap (code)  | Kind        | Pillar (Jev) | Directness (Jev) | P(yes) (Jev) | Gaps |
|-----|------|------|-------------|----------------|--------------|-----------------|-------------|--------------|------------------|--------------|------|
|  1  |  2   | up 1 | [record] PSI-69 | Suppression | 2         | near-O2 only    | paraphrase  | Suppression  | [###.] L2        | 0.xx         |  1   |
|  2  |  1   | down 1 | [record] PSI-98 | Prevention | 2        | covers          | quote       | Prevention   | [####] L3        | 0.xx         |  2   |
|  3  |  3   | =    | [record] PSI-102 | Detection   | 1         | unknown         | table_row   | Detection    | [##..] L1        | 0.xx         |  0   |
| metadata only · not ranked: [record] PSI-25 (listed below the ranked rows, no Jev values)  |
+------------------------------------------------------------------------------+
| SELECTED: [record name] (aside, 4 columns)                                    |
| Why this rank (SI · jev-1.14.0 · fixture or cache): [short explanation, claim IDs] |
| Transfer limits (team-written): [microgravity result, not lunar]              |
| [Open record]   [Ranking priorities]                                          |
+==============================================================================+
```

**Columns (desktop; names from BUILD_PLAN §1.6).** Jev rank · Baseline rank · Δ · Study (accession, name) · Pillar (human, `pillar_primary`) · Tier (human, `evidence_tier`) · Overlap (`overlap_class`: covers | near-O2 only | near-pressure only | none | unknown; `unknown` is never shown as `none`) · Kind (`evidence_kind`: quote | table_row | paraphrase) · Pillar (Jev, modal) · Directness (Jev, modal level, glyph with number) · P(yes) (Jev `regime_relevance`) · Gaps (reviewer count). The three Jev columns sort independently. The Jev rank is their lexicographic order.

**Agreement strings** (generated in code, one of these):
- "Top 3 identical. Jev adds no reordering here." (say so when the orders match).
- "Top 3 differ: Jev moves [study] to #1."
- "Top 3 depends on priorities: [n] of 24 priority orders change it (listed in Ranking priorities)." or "Top 3 stable under all 24 priority orders." (BUILD_PLAN §3.5)
- "Baseline and Jev give the same order (ρ = 1.00)."

**Components.** `ScenarioSummaryBar` (with Change). `StatusChip`. `AgreementStrip`. `RankTable` (native `<table>`, sortable header buttons with `aria-sort`). `RankRow` with `BaselineRankCell` and `DeltaMarker`. `OrdinalGlyph`. `PillarChip`. `OverlapChip`. `GapsCount`. `EvidenceAside` (selected record). `HideNoOverlapToggle` (default off; when on, hides rows with overlap `none`, and nothing is removed silently). `PrioritiesSheetButton`. `ProvenanceButton`.

**States.**

| State | Shown when | UI |
|---|---|---|
| Loading | Records or Jev answers loading | Eight skeleton rows. Strip reads "Ranking…". `aria-busy` |
| Empty | No record passes the chosen gate | "0 of N studies pass the current gate (k unknown overlap, m none)." Button: "Show all accepted records". For the suit preset: "No directly matching study in this curated set. This is a valid result." |
| Error (Jev) | Jev call fails or takes over 5 s | Banner (role=alert): "Jev unavailable. Showing the baseline ranking." Jev column shows the text "not available" (not a blank). Buttons: Retry live · Use fixture or cached Jev output (label, date) |
| Error (corpus) | Corpus hash check fails | Ranking blocked: "Corpus hash mismatch. See Provenance." Nothing is ranked |
| Partial | Some records have no Jev answer | Row reads "not reviewed by Jev yet", sorts last, and says so. Never silently zero |
| Metadata only (R4) | Study has a card but no gold record (`card_state = metadata_only`) | Row reads "metadata only · not ranked" and sits in a separate group below the ranked rows. Jev and overlap cells read "not ranked" |
| Fixture / cached | Static build | Chip shows the fixture label (until the terms are read, R8) or the cache date after that. The Jev header says which. No request sent |
| No-AI | Keys absent | Jev columns hidden. Banner: "No-AI mode: transparent baseline only. Baseline uses reviewed tags and code-computed overlap." Priorities apply to the four baseline keys |

**Interactions.** Default sort is the Jev rank. Baseline rank is a separate sort. Ties break by accession (stable). Up and Down arrows move between rows (roving tabindex). Enter opens S3. Clicking a row selects it and updates the aside (no navigation). "Ranking priorities" opens S4. The `Δ` text is read by screen readers as "moved up 1 place from baseline". The rank change animates in 120 ms, or instantly under reduced motion.

### 3.4 S3. Record detail (route `/study/:accession`)

The record detail shows the evidence in its kind (verbatim quote, CSV table row, or team paraphrase), its locator and the DOI. Values in the examples are placeholders. Example record IDs are PSI-98 (Saffire-I, DOI 10.60555/0t15-1z43, CC0-1.0) and PSI-102 (SAME, DOI 10.60555/gd4k-8h62, CC0-1.0). Both are from planning-stage metadata. The quote text is not yet verified.

```text
+==============================================================================+
| [<- Ranking]   Study record                                  [Provenance]     |
+==============================================================================+
| PSI-98 · Saffire-I (example)                  [HUMAN-REVIEWED 2026-11-14 · JD] |
| DOI 10.60555/0t15-1z43  (opens doi.org)       Licence CC0-1.0                 |
|------------------------------------------------------------------------------|
| EVIDENCE (by kind: quote | table_row | paraphrase)                           |
|  | kind: quote  "[exact source text, shown only after the code match]"     |
|  | Verified verbatim against source text · source hash 3f9a...            |
|  | kind: table_row  PSI-69 CSV row 14 · cells shown · csv sha256 37c8...   |
|  | kind: paraphrase  "Paraphrase (team) · not quoted" · no quote shown    |
|  | Locator: NTRS 20180004258, p. [n]  (or PSI table row [n])   [Copy]      |
|------------------------------------------------------------------------------|
| CONDITIONS, as reported ("not reported" is not zero)                         |
| Fuel [ ]   Geometry [ ]   Gravity: microgravity   O2 [ ] %   O2 location [ ]  |
| Pressure [ ] kPa   Flow [ ] cm/s   Value kind [condition | observation | ...]  |
|------------------------------------------------------------------------------|
| JEV JUDGEMENT (SI)                 | EXPLANATION (SI · gemini-4-hydrogen)     |
| Pillar: Prevention (modal) [solid] | C1 ... [links to quote]                 |
| Directness (Jev): [###.] level 2 of 0–3 | C2 ...                                   |
| P(yes) (Jev): 0.xx · no confidence| TRANSFER LIMITS (team-written)           |
| Claim support (Jev): value + question | Microgravity result. Not a lunar result. |
| Model confidence is not validation.|                                          |
|------------------------------------------------------------------------------|
| [Open source ↗]   [Compare with...] (P1)   [image: original only, unless photo] |
+==============================================================================+
```

**Components.** `RecordHeader` (accession, name, reviewer, date). `DoiLink`. `VerbatimQuote` (kind `quote` only: quote, verification badge, locator, copy button), `EvidenceBlock` (all three kinds), `EvidenceKindChip`, `MetadataOnlyBadge` (R4). `CitationBlock` (licence and access date). `ConditionsTable` (tabular numerals; null shows "not reported"). `JevAnswerPanel`. `ExplanationBlock` (SI-tagged, claim IDs as links). `TransferLimits` (team-written, fixed). `OriginalOrDithered` (only for true photographs; figures with axes are never dithered). `CompareSelector` (P1).

**States.**

| State | Shown when | UI |
|---|---|---|
| Loading | Record loading | Skeleton blocks. Headings stay in place |
| Metadata only (R4) | No gold record yet (`card_state = metadata_only`) | Badge "Metadata only". Shows the PSI card (objective, hardware, DOI, licence, access date). No condition values, no Jev judgement, no overlap. Text: "Metadata only: no human-verified record yet. Not ranked." Explanation and Jev panel hidden |
| Table row only | Accepted table row, no quote (`evidence_kind = table_row`) | Shows the CSV row cells and hash. The badge reads "Verified against CSV bytes" instead of "Verified verbatim". No quote is shown |
| Paraphrase only | Publisher DOI or GOV_PERMITTED source (`evidence_kind = paraphrase`) | "Paraphrase (team) · not quoted". Locator, DOI and paraphrase are shown. Copy gives locator and DOI only |
| Error | Source link down | "Source unavailable right now." Shows the cached quote, locator and corpus hash |
| Fixture / cached | Static build | Jev and explanation blocks carry the fixture label (until the terms are read, R8) or the cache date |
| No-AI | Keys absent | Explanation replaced by "Model explanation unavailable. Team summary below." Jev panel hidden. Quote, conditions, DOI and transfer limits still show |
| Blocked (build) | Quote fails verbatim check | Record not published. The build report lists the failure. Nothing shows in the UI |

**Interactions.** Copy: for `quote`, copies the quote, locator and DOI. For `table_row`, copies the row cells and hash. For `paraphrase`, copies the locator and DOI only, never publisher text. Open DOI or source (new tab, with an accessible "opens in new tab" label). Claim links jump to the matching quote. The gravity flag has a tooltip: "None in PSI: no partial-gravity combustion data (challenge)." The verification badge can be expanded to show the hash and the check date.

### 3.5 S4. Ranking priorities (sheet over S2; `/rank?sheet=priorities`)

```text
+-- Ranking priorities ---------------------------------------------- [X] -------+
| Status: PROPOSED · not approved by the team                                   |
| Order  Key (baseline)        Source                    Move                   |
| 1      pillar_match          human pillar_primary      [ up ] [ down ]        |
| 2      covers_count          code, accepted rows       [ up ] [ down ]        |
| 3      evidence_tier         human card tier           [ up ] [ down ]        |
| 4      near_count            code, accepted rows       [ up ] [ down ]        |
| Order is lexicographic: key 1 decides first, then 2, 3, 4. Ties: accession.   |
| Tolerances (visible, editable): O2 ±3 points · pressure ±15% · flow factor 2  |
|   (flow factor displayed; not an overlap key in v1)        [Reset to proposed]|
|                                                                               |
| Sensitivity (computed in code, all 24 orders): top 3 stable, or depends       |
|   -> "Top 3 depends on priorities" + the orders that change it                |
| Display gates (flags, not sort keys):                                         |
|   [ ] Only overlap = yes or unknown        (null is never "no")               |
|                                                                               |
| Approved by [initials] on [date]     <- typed by a human; the app never sets this |
|                                                              [Save approval]  |
+-------------------------------------------------------------------------------+
```

**Components.** `RankingPrioritiesSheet` (native `<dialog>`). `PriorityOrderControl` (four keys, each with up and down, labelled). `ToleranceField` (numeric: O₂ points, pressure percent; flow factor displayed). `SensitivityNote`. `GateToggle`. `ApprovalField` (human-typed initials and date). `ResetButton`.

**States.**

| State | Shown when | UI |
|---|---|---|
| Loading | n/a (priorities are local) | n/a |
| Error | Priority order incomplete (a key missing or repeated) | "The priority order must list all four keys once." Reset is offered. Ranking keeps the last valid order |
| Fixture / cached | Static build | Same controls. Chip "PROPOSED" until an approval is saved |
| No-AI | Keys absent | Only the four baseline keys apply. No Jev column. Note: "Priorities apply to reviewed tags and code-computed overlap." |
| Unapproved | No approval recorded | Export carries "PROPOSED · unapproved" |

**Interactions.** Changing the order or a tolerance recomputes the ranking locally (no model call). Keyboard: Up and Down arrows move the focused key, and the Up and Down buttons do the same. Tolerance fields accept typed numbers. Esc closes and returns focus to the "Ranking priorities" button. The sensitivity note updates live and is announced politely.

### 3.6 S5. Provenance and export drawer (`?drawer=prov`, any screen)

```text
                                              +-----------------------------------+
                                              | Provenance & export          [X]  |
                                              | Scenario   Lunar cabin 30 % / 10.2 psi|
                                              | Priorities pillar>covers>tier>near |
                                              | Approval   PROPOSED · unapproved   |
                                              | Models     jev-1.14.0 (fixture or cached, labelled) |
                                              |            gemini-4-hydrogen (fixture or cached) |
                                              | Corpus     reviewed v1 · hash 9c1e... |
                                              | Hash check [OK]                    |
                                              | Records    3 of 8 accepted         |
                                              |   ID      accepted  reviewer  hash  |
                                              |   PSI-98  yes       JD        7a..  |
                                              | [Download reviewed CSV]            |
                                              | [Download source manifest (JSON)]  |
                                              | [Download model log] (P1)          |
                                              +-----------------------------------+
```

**Rejected by code** (the BUILD_PLAN "reject" panel). Shows a count and a reason for every rejected cell, for example an O₂ cell of `3400%` (outside 0–100), a pressure of `0` mmHg, or a negative flow. Rejects are never hidden; the count is always shown.

**Components.** `ProvenanceDrawer` (native `<dialog>`, focus trapped, Esc to close). `ProvenanceList`. `IncludedRecordsTable`. `HashCheckBadge`. `ExportCsvButton`. `ExportManifestButton`. `ModelLogButton` (P1).

**CSV columns (BUILD_PLAN §1.6 names; dots become underscores, so `jev.regime_relevance` is `jev_regime_relevance`).** accession, name, doi, locator, evidence_kind, quote, paraphrase, quote_verified, reviewer, reviewed_on, pillar_primary, pillar_secondary, evidence_tier, jev_pillar_modal, jev_pillar_confidence, jev_evidence_directness_modal, jev_regime_relevance, jev_claim_supported, overlap_class, ai_proposed, human_reviewed, priority_order, tolerances, approver, model_ids, cache_label, corpus_hash, licence. The raw `score` float is not exported. `quote` is written only when `evidence_kind = quote`. Paraphrase rows never carry publisher text (R3). The export is labelled as AI-proposed where it is, and fixture rows say so (R8).

**States.**

| State | Shown when | UI |
|---|---|---|
| Loading | Manifest loading | Spinner-free "Preparing export…" text |
| Empty | No accepted records | Export buttons disabled, with the reason shown as text |
| Error | Hash mismatch for any record | "Export blocked: source hash does not match the corpus manifest for [accession]. Re-run the corpus check." |
| Fixture / cached | Static build | Labels show the fixture label (until the terms are read, R8) or the cache date, and the model IDs |
| No-AI | Keys absent | Model columns omitted. File header says "no-AI export: baseline only" |

**Interactions.** Esc closes and returns focus to the opener. Downloads are plain CSV (UTF-8) and JSON. The file names include the corpus hash and date.

### 3.7 S6. About and SI disclosure (route `/about`)

Static, full offline. Sections in this order:

1. **What this is.** A ranked, quoted reading list of NASA combustion investigations for fire-safety questions in habitats. It finds evidence. It does not assess fire risk, certify a design or predict flammability.
2. **Who it is for.** Adult researchers and engineers. Not for users under 18 (the Gemini API terms are 18+).
3. **How AI is used.** A table:

| Step | Who | What it does | Checked by |
|---|---|---|---|
| Numbers, units, overlap, gates, sort, sensitivity | Code (deterministic) | All arithmetic | Unit tests |
| Structured extraction from an accepted source | Gemini 4 Hydrogen (**SI**) | Proposes rows with exact quotes | Code verbatim check, then human review |
| Judgements: regime relevance, evidence directness, pillar, claim support | Jev 1.14 (**SI**) | Typed answers: P(yes), level distributions, choice confidence | Human-labelled pairs (n = team's count). Not domain-calibrated |
| Explanations | Gemini (**SI**) | Short text with claim IDs | Code rejects unknown IDs. Human check |
| Accepting records, priorities, transfer limits | Team (human) | Decides what is shown | Named reviewer and date |

4. **Limits.** None in PSI: no partial-gravity combustion data (per the challenge). Lunar and suit results are microgravity evidence. No 0 g or 1 g result bounds the Moon, and lunar gravity is not described as safer. There is no domain calibration. Model confidence is not validity. An empty result is valid.
5. **Data sources.** Accession, DOI or URL, rights, access date. PSI-98 and PSI-102 (CC0-1.0, planning-stage check). NTRS 20180004258 ("public use permitted", GOV_PUBLIC_USE_PERMITTED, Gary A. Ruff, NASA Glenn). Each further record gets its own rights check. Paraphrase-only sources (publisher DOIs; NTRS 20210011385, GOV_PERMITTED) appear with locator, DOI and team paraphrase, not quotes (R3).
6. **Software and fonts.** Inter (OFL 1.1), JetBrains Mono (OFL 1.1), React (MIT), Vite (MIT). App code Apache-2.0 proposed; the team confirms. Licence notices ship in the repo.
7. **Not NASA.** "NASA does not endorse this project." No NASA insignia, logotype or seal is used.
8. **SI legend.** The SI badge means "generated by a model, see the model ID". Model IDs and cache or fixture labels are shown beside every model output.
9. **Contact.** [team contact placeholder].
10. **Disclosure scope (R8).** The disclosure covers code, data and planning. Each AI-assisted record is listed with origin, model, date and reviewer (`data/manifest.records.json`). Until the TypeSafe and Google terms are read, the static build uses fixtures labelled "FIXTURE · human-authored, not model output". No cached model output is published.
11. **Team contribution.** The team's contribution statement (BUILD_PLAN D12) is linked here.

**Components.** `ProseSection`, `DataSourceTable`, `LicenceTable`, `SiLegend`, `AnchorNav`.

**States.** Static page, so no loading or error state. It must work with no network. Print stylesheet is P2.

---

## 4. Component inventory (React + TypeScript + Vite assumed)

Stack notes. Use native elements first (`<table>`, `<dialog>`, radio groups, `<select>`, `<input type=range>`). No UI kit, so the licence trail stays short. Routing with `react-router` (MIT), or hash routing. Validate all JSON with `zod` (MIT). Charts are hand-written SVG. CSS uses custom properties in plain CSS modules.

| # | Component | Purpose | Screens | Priority | Stack notes |
|---|---|---|---|---|---|
| 1 | `AppShell` | Header, nav, main, footer, skip link | All | P0 | Landmarks: `header`, `nav`, `main`, `footer` |
| 2 | `SkipLink` | Jump to main | All | P0 | First focusable element |
| 3 | `StatusChip` | LIVE / FIXTURE / CACHED / NO-AI, with model ID and date or fixture label | All | P0 | Pill token |
| 4 | `SiBadge` | Marks every model-generated text or value | S2, S3, S5 | P0 | Accent outline pill, mono caps |
| 5 | `Banner` | Info, error, and blocked messages | All | P0 | `role=status` or `role=alert` |
| 6 | `EmptyState`, `ErrorState` | Valid empty results and recoverable errors | S1–S5 | P0 | Text plus one action |
| 7 | `SkeletonRows` | Loading placeholders | S2, S3 | P1 | Static, no shimmer |
| 8 | `ScenarioRadioGroup` + `PresetCard` | ISS / lunar cabin / suit | S1 | P0 | Native radio group, arrow keys |
| 9 | `GravityNotice` | Gravity limits per preset | S1, S2 | P0 | Plain text |
| 10 | `PillarSelect` | Prevention / detection / suppression | S1 | P0 | Native `<select>` |
| 11 | `QuestionInput` | Optional question, 200 max | S1 | P1 | Count text, `aria-describedby` |
| 12 | `DitherPlate` | WebGL2 canvas, duotone, sweep, Original/Dithered | S1, S3 | P0 | Own shader (§2.2). `aria-hidden` on canvas, figure alt text beside it |
| 13 | `PrePlatePng` | Build-time dithered fallback | S1, S3 | P0 | Same algorithm, built by a script |
| 14 | `CaptionBar` | Credit line and dither notice | S1, S3 | P0 | Solid surface, never on canvas |
| 15 | `ScenarioSummaryBar` | Current scenario, Change | S2 | P0 | Link back to S1 |
| 16 | `RankTable` | Sortable native table | S2 | P0 | `caption`, `th scope`, `aria-sort` |
| 17 | `RankRow` + `DeltaMarker` | Jev and baseline rank, change text | S2 | P0 | Text plus arrow (arrow `aria-hidden`) |
| 18 | `OrdinalGlyph` | Four-cell evidence glyph | S2, S3 | P0 | SVG, label text (§2.5) |
| 19 | `PillarChip` | Text plus pattern (SVG `<pattern>`) | S2, S3 | P0 | Not dithered |
| 20 | `OverlapChip` | `overlap_class`: covers, near-O2 only, near-pressure only, none, unknown | S2 | P0 | `unknown` is never shown as `none` |
| 21 | `AgreementStrip` | Top-3 and Spearman ρ text, sensitivity | S2 | P0 | `aria-live=polite` |
| 22 | `EvidenceAside` | Selected record summary | S2 | P0 | Landmark `aside` |
| 23 | `HideNoOverlapToggle` | Hides rows with overlap `none`, default off | S2, S4 | P1 | Checkbox |
| 24 | `VerbatimQuote` | Quote (kind `quote` only), verify badge, locator, copy | S3 | P0 | Quote element, no italics |
| 25 | `CitationBlock` | DOI, licence, access date | S3, S6 | P0 | Link opens new tab with text |
| 26 | `ConditionsTable` | Fuel, geometry, O₂, pressure, flow | S3 | P0 | Tabular numerals. "not reported" for null |
| 27 | `JevAnswerPanel` | Pillar, directness glyph, P(yes), claim support value | S3 | P0 | Each answer labelled SI |
| 28 | `ExplanationBlock` | Hydrogen explanation with claim links | S3 | P1 | Depends on Hydrogen; cached fallback |
| 29 | `TransferLimits` | Team-written limits | S2 aside, S3 | P0 | Fixed text, reviewed |
| 30 | `CompareSelector` | Two-record compare (BUILD_PLAN "Compare drawer"); mismatches as text and pattern | S3 | P1 | Stretch |
| 31 | `RankingPrioritiesSheet` | Dialog: priority order and tolerances | S4 | P0 | Native `<dialog>` |
| 32 | `PriorityOrderControl` and `ToleranceField` | Four keys with up and down; tolerances as typed numbers | S4 | P0 | Labelled, keyboard steps |
| 33 | `SensitivityNote` | Top 3 stable under 24 orders, or depends on priorities | S4, S2 | P0 | `aria-live=polite` |
| 34 | `ApprovalField` | Human initials and date | S4, S5 | P0 | Never auto-filled |
| 35 | `ProvenanceDrawer` | Hashes, models, records, exports | S5 | P0 | Native `<dialog>`, focus trap |
| 36 | `IncludedRecordsTable` | Accepted flag, reviewer, hash | S5 | P0 | Table |
| 37 | `ExportCsv`, `ExportManifest` | Download with corpus hash in file name | S5 | P0 | Blocked on hash mismatch |
| 38 | `ModelLogExport` | Model IDs, timings, cache | S5 | P1 | JSON |
| 39 | `HashCheckBadge` | Corpus check status | S2, S5 | P1 | Text plus icon |
| 40 | `ThemeToggle` | Dark, light, system | All | P1 | Sets `data-theme` |
| 41 | `ProseSection`, `DataSourceTable`, `LicenceTable`, `SiLegend` | About content | S6 | P0 | Static |
| 42 | `ReducedMotionHook` | Reads the media query once | All | P0 | Drives `u_sweep` and CSS vars |
| 43 | `CorpusLoader` | Loads and validates reviewed JSON | Data layer | P0 | `zod`. Fails closed |
| 44 | `ScenarioCache` | Cached Jev and Hydrogen outputs by corpus hash, scenario, model version | Data layer | P0 | Static files, offline |
| 45 | `/api/rank` proxy | Live calls, keys server-side, 5 s timeout | Data layer | P1 | Keys never in the browser |
| 46 | `AtkinsonPrintExport` | Print PDF of evidence card | S3 | P2 | Build-time Atkinson |
| 47 | `BlinkComparator` | Cut in v1 (R4) | — | — | Direction B is a coverage strip only |
| 48 | `EvidenceCoverageStrip` (oxygen × pressure) | Scatter of tested rows; no curve, no limit, no safe zone | S2 (stretch) | P2 | BUILD_PLAN §1.2 |
| 49 | Print stylesheet | Printable S3 and S6 | S3, S6 | P2 | |
| 50 | Shortcut help | Keyboard reference | All | P2 | Only after core passes keyboard test |
| 51 | `EvidenceKindChip` | Quote, table row or paraphrase, as text | S2, S3 | P0 | Text label, never colour alone |
| 52 | `EvidenceBlock` | Kind-specific evidence: quote, CSV row with hash, or paraphrase with locator | S3 | P0 | Replaces `VerbatimQuote` for non-quote kinds |
| 53 | `MetadataOnlyBadge` | "Metadata only · not ranked" (R4) | S2, S3 | P0 | Text plus outline |
| 54 | `HeroStatement` | Evidence-gap sentence and scope line; shown only if K5 passed (R2) | S1 | P0 | Code-computed text, never on the canvas |
| 55 | `RejectedByCodePanel` | Counts and reasons for rejected cells (BUILD_PLAN "reject" panel) | S5 | P0 | Table |
| 56 | `FixtureBadge` | Fixture label wherever a fixture stands in for model output (R8) | All | P0 | Beside `SiBadge` |

Priority rule. P0 is required for the demo and the judges' path. P1 is in the submission if time allows. P2 is cut first (see T−12 h in plan-flame).

---

## 5. Demo

### 5.1 Stretch video storyboard (under 25 s; only after the deck is complete)

Limit: this video is stretch only (R5). Target under 25 seconds; the 7-slide deck is the default submission. Recorded from the built app running on fixtures or cached outputs (no live keys needed during the take; the fixture label stays visible). Captions are burned in. Voiceover is human, not generated. No people, faces or minors on screen. Music is none, or a cleared track with its licence recorded.

| Time | Shot | On-screen text | Voiceover (human) | Notes |
|---|---|---|---|---|
| 0:00–0:04 | Dithered NASA still with the hero statement and its scope line on screen (only if K5 passed). Sweep 300 ms (instant under reduced motion). Credit line visible | "Near the lunar-cabin atmosphere, PSI has liquid-droplet (FLEX) tests. No solid-fuel test that reports oxygen goes above 22.2%." Scope line: "rows that report O₂" | "Near the lunar cabin, PSI has droplet tests. No solid-fuel test that reports oxygen goes above 22 percent." | Still must be a cleared NASA image with credit. If K5 failed, open on the scenario picker instead |
| 0:04–0:06 | Scenario picker. Click "lunar-cabin-example" | "30 % O₂ · 10.2 psi · illustrative · Gravity: lunar, none in PSI" | "Pick a 30 % oxygen, 10.2 psi example." | Gravity line reads "none in PSI" |
| 0:06–0:12 | S2: Jev and baseline columns side by side. Agreement strip. Cursor on a Δ marker | "Baseline vs Jev · Spearman ρ 0.xx · fixture label" | "A baseline and a model rank the same records, in separate columns." | Use the real ordering from the labelled set. If the orders match, say so on screen |
| 0:12–0:16 | S4 sheet "Ranking priorities": four keys in order, tolerances, "PROPOSED" tag, sensitivity note | "The priority order is visible. The team approves it." | "The team approves the priorities." | Show the approval field empty |
| 0:16–0:20 | S3: evidence block (quote, table row or paraphrase, one of each if possible), locator, DOI, gravity line | "Quote verified verbatim · p. [n] · doi:10.60555/0t15-1z43" (quote kind); a table-row record shows its CSV hash instead | "Each claim links to its page, row or paraphrase, and DOI." | Quote must be real and checked before the take. A paraphrase record shows no quote |
| 0:20–0:24 | S5 drawer: hash check OK, "Rejected by code" count, CSV button; then end card | End card: "Find evidence faster. Transfer still needs research." · "Data: NASA PSI (CC0-1.0) · SI use: /about" | "Find evidence faster. Transfer still needs research." | Put the public URL on the end card. Microgravity evidence only |

Word count of voiceover, about 60 words, fits 24 seconds at a steady pace.

### 5.2 The judge's first five seconds

**What a judge must see by 0:05 of the video, or on slides 1–3 of the deck (the default):**
1. A real NASA still, visibly dithered, so the look reads as the project's signature in one glance.
2. The question, and an atmosphere: "30 % O₂ · 10.2 psi · illustrative". If K5 passed, also the evidence-gap statement with its scope line.
3. The first ranked rows, with the baseline and Jev numbers side by side and the agreement line.

**The one frame to design around (0:07):** the agreement strip. It must say what is true. If the fixture or cached outputs show the top result differs between baseline and Jev, the frame reads "Baseline and Jev disagree at #1". If they agree, it reads "Top 3 identical. The model adds no reordering here." Either is honest, and the spec forbids scripting an ordering that the cache does not show (plan-flame, hero note).

### 5.3 Seven-slide deck (the default submission, D9; title included)

1. **Title.** "Flame in Freefall: which microgravity flame study informs a habitat question?" Subtitle: "Ranked, quoted and checked NASA PSI evidence." Team names as placeholders. The NASA name appears only as text in the data credit.
2. **The problem and the scope.** PSI holds many combustion investigations. We curated [N] human-checked records across prevention, detection and suppression. No full-archive download. Show the three presets.
3. **Scenario to ranking.** The evidence-gap statement with its scope line (only if K5 passed), then a screenshot of S2 with the real ordering. Caption: the agreement strip, with the real Spearman ρ and the real count of disagreements.
4. **Evidence trace.** Screenshots of S3 for one record of each kind: quote (caption: "Code checked this quote against the source text"), table row (checked against the CSV hash), paraphrase (locator, DOI, "not quoted").
5. **How the AI is used, and how we tested it.** Three boxes: code (numbers, gates, sort), Hydrogen (proposes rows, quote-checked), Jev (typed judgements, model confidence). Below: test results from the labelled pairs (top-3 hit rate and Spearman ρ against the baseline; pillar agreement). No thresholds. Real numbers only, with the sample size.
6. **Limits and gaps.** None in PSI: no partial-gravity combustion data, so lunar and suit results are microgravity evidence. Lunar gravity is not described as safer. No domain calibration. Model confidence is not validity. Empty results are valid and shown.
7. **Team, links and disclosure.** Human contributions named (the BUILD_PLAN D12 statement). Live demo, repo and data DOIs as links. Licences: Apache-2.0 proposed for code, OFL for fonts, CC0 and public-use data. SI disclosure link. Next step: label more records and get a domain review.

---

## 6. Accessibility and compliance checklist

Target: WCAG 2.2 AA. Items marked "to verify" are not yet checked.

| ID | Check | Standard or source | How verified | Status |
|---|---|---|---|---|
| C1 | No NASA insignia (meatball), logotype (worm), seal, flags or mission patches in UI, favicon, slides, video or README | Brief; GPT-A §B6; NASA brand centre | Asset scan plus visual review at H37 | To verify |
| C2 | No NASA-red "meatball" pastiche. Palette has no red | GPT-A §B6 | Colour audit against tokens | Met by §1.4 (no red token) |
| C3 | No Space Apps logo unless the brand guidelines are read and allow it (the page is JS-rendered; not read) | GPT-A UNVERIFIED | Read the guidelines before use | To verify |
| C4 | No partner-agency logos (ESA, JAXA, etc.) without permission | Space Apps policy | Asset scan | To verify |
| C5 | NASA credit under each NASA image: "NASA [mission], via [archive]". Third-party © images need the holder's permission | GPT-A §B6 | Per-asset rights note | To verify (no image fetched yet) |
| C6 | Dithered images are captioned as an algorithmic transform, not AI. The original is one click away | Validity; plan-flame | Caption check | Designed in §2 |
| C7 | Any AI-generated image carries a visible "AI-generated" watermark and metadata. None planned in v1 | Space Apps SI rules | Asset list | Met (none planned) |
| C8 | Every model-generated text or value carries an SI badge with model ID and date | Space Apps SI rules; plan | UI check | Designed in §3 |
| C9 | Records show a named human reviewer and date. The app never sets approval | Plan; VERDICT | Data check | Designed in §3.5 |
| C10 | Copy lint: no "probability" next to a Jev value, no "safe", "unsafe", "certified", "ACT", "fire risk" as a result; no "none exists", "safer", "0 g and 1 g bound the Moon", "validated", "calibrated" (R6, R7) | Brief; VERDICT | Text search in build | To verify |
| C11 | Adult audience only. No under-18 people in footage or UI. Gemini 18+ terms noted in S6 | Space Apps policy; VERDICT | Footage check | To verify |
| C12 | Licences: OFL text for Inter and JetBrains Mono shipped; MIT and Apache notices for libraries; CC0 and public-use records credited | Space Apps Terms (open licence, cite every source) | Licence manifest at H28 | To verify |
| C13 | SI disclosure linked from the header, the deck's last slide, and the video end card if a video is made | Space Apps SI rules | Link check | Designed in §3.7 |
| C14 | Keyboard: every control reachable, logical order, skip link | WCAG 2.1.1, 2.4.1, 2.4.3 | Keyboard-only walkthrough of S1–S6 | To verify |
| C15 | Focus visible at 2 px `--color-focus`, with 2 px offset. Not hidden under the sticky header | WCAG 2.4.7, 2.4.11 | Focus screenshot | To verify |
| C16 | No keyboard trap. Drawer and sheet trap focus and close on Esc, returning focus | WCAG 2.1.2 | Walkthrough | To verify |
| C17 | Drag-free alternatives. Sliders also work by keyboard and by typed number | WCAG 2.5.7 | Test | Designed in §3.5 |
| C18 | Target size ≥24 px, preferred 44 px | WCAG 2.5.8 | Measurement | To verify |
| C19 | Screen reader: landmarks, one `h1` per screen, table caption, `th scope`, `aria-sort` | WCAG 1.3.1, 4.1.2 | Screen reader pass (VoiceOver) | To verify |
| C20 | Live regions: ranking updates and sensitivity text are announced politely; errors as alerts | WCAG 4.1.3 | Screen reader pass | To verify |
| C21 | Dithered plate has `aria-hidden` canvas plus a human-reviewed figure alt text. Figure alt says what the picture shows and that it is a transform | WCAG 1.1.1 | Alt text review | To verify |
| C22 | Colour is never the only cue. Glyphs have number and text; pillars have pattern and text; Δ has words | WCAG 1.4.1 | Greyscale screenshot | To verify |
| C23 | Contrast per §1.4.2 | WCAG 1.4.3, 1.4.11 | Script (done) and devtools check | Met for tokens |
| C24 | Reflow at 320 px and 400% zoom, no horizontal scroll | WCAG 1.4.10 | Browser test | To verify |
| C25 | Text spacing override does not break layout | WCAG 1.4.12 | Browser test | To verify |
| C26 | No flashing >3 per second. No looping animation. Reduced motion removes sweep and row animation | WCAG 2.3.1, 2.3.3 | Reduced-motion test with OS setting on | Designed in §1.4.5 |
| C27 | Dither never sits behind text or numbers | §2.4 | DOM overlap test | To verify |
| C28 | Plain language. "Model confidence" defined in S6 and the tooltip | WCAG 3.1.5 (reading level, AAA; applied as good practice) | Copy review | To verify |
| C29 | No time limits. Retry is always available | WCAG 2.2.1 | Review | Met (no timers) |
| C30 | Language set (`lang="en"`). Page titles per screen | WCAG 3.1.1, 2.4.2 | Source check | To verify |
| C31 | Quote rule: a quote is shown or exported only for `evidence_kind = quote` (R3) | BUILD_PLAN §2.2, §3.4 | Grep the export and DOM for paraphrase rows | To verify |
| C32 | No threshold or calibration language in the end-user UI; per-question values and question text only (R6) | RED_TEAM M2 | Copy lint | To verify |
| C33 | Fixture label on every model stand-in until the provider terms are read; no cached model output in the public repo (R8) | RED_TEAM M10 | Repo scan | To verify |
| C34 | Screen names, routes, field names and decision IDs match BUILD_PLAN §1.5–§1.6 | Overseer ruling (shared names) | Diff check | To verify |

---

## 7. Verification log and open items

**Verified this session**
- GPT-A §C1–C7 read in full, plus §A1 (Jev shape), §A2 (Hydrogen), §B3–B6 (SI and NASA rules) and §A4 (pipeline). The file's own rule citations were taken from its cited primary sources, not re-fetched.
- Contrast: every pair in §1.4.2 recomputed from WCAG 2.x relative luminance (`samples/contrast_check.py`, output `samples/contrast_results.txt`).
- Font licences, fetched from source: JetBrains Mono OFL.txt ("Copyright 2020 The JetBrains Mono Project Authors", OFL 1.1). Inter `LICENSE.txt` (rsms/inter master; "Copyright (c) 2016 The Inter Project Authors", OFL 1.1).
- Library licences, fetched from source: `niccolofanton/dithering-shader` (MIT), `paper-design/shaders` (Apache License 2.0 text), `andrewstephens75/as-dithered-image` (MIT), `darkroomengineering/spargo` (MIT).
- Jev answer shapes: `plans/samples/flame-jev-quickstart.md` (vendor snapshot). `score` is a float with `probabilities`, `confidence` and a `legend`. `noul` is a number from 0 to 1.

**Not verified (do not treat as done)**
- Source-still licences. No NASA image has been fetched or rights-checked yet. The hero plate uses a placeholder until it is.
- Performance numbers in §2.3 are targets. Measure at H1 on the reference laptop.
- WebGL2 availability on judges' machines. The pre-rendered PNG covers the gap.
- Space Apps brand guidelines (JS-rendered; GPT-A could not read them).
- Model outputs. No Jev or Hydrogen output is used or quoted here. All numbers in wireframes are placeholders.

**Conflicts found in the source files and how this spec resolves them**
1. GPT-A §C5 says Jev probability becomes dither density, and §C7 uses probability bars. **Overridden:** the brief forbids probability encoding. Jev uses an ordinal glyph (§2.5).
2. GPT-A's example labels 21 % O₂ at 14.7 psi as "lunar surface". **Corrected:** the plan says it is an Earth-like reference. The preset is labelled "ISS-like cabin".
3. The plan's displayed index `100 × (0.45R + 0.35E + 0.20P)` conflicts with the brief's "drop the composite index". **Superseded by OVERSIGHT R1:** BUILD_PLAN's lexicographic baseline replaces the weights. No weights and no index are used or shown.
4. The plan's pillar term P uses a probability mass, and the plan's evidence term E uses a normalised float from the score. **Replaced:** P is binary (modal match). E uses the modal level. Neither is a probability in the UI. Superseded by R1: the Jev values appear in separate columns and are never combined.
5. GPT-A's Flight Director uses an orange "ACT" band. **Removed:** Jev output is not a fire-safety action (brief, VERDICT).
6. The plan's light paper token set differs from Flight Director. **Left as D13** for the team.
7. GPT-A's Flight Director uses 8×8 Bayer. **Changed to 4×4** to match the plan and give a shorter tile period.

**Open items for the overseer**
- Confirm D5, D7, D8, D9, D13 and D14 with the team (§0; these are the BUILD_PLAN §1.5 IDs).
- H1: build the shader and measure it against §2.3.
- Choose a NASA still and check its rights (C5).
- Done (OVERSIGHT R1): BUILD_PLAN §3.5–§3.6 is the ranking model. The §2.5 sort text now uses the lexicographic Jev order and the baseline priority order.

---

## Revision log (overseer rulings applied)

Applied 14 Nov 2026 from `research/flame/OVERSIGHT.md`. Section numbers refer to this file after the edits.

| Ruling | Sections changed |
|---|---|
| R1 Ranking model | §0 D5 and D3 note (composite not offered); §1.4.5 (no blink comparator); §2.5 sort and baseline paragraphs, Jev table rows; §3.1 site map (`?sheet=priorities`, S4 renamed "Ranking priorities"); §3.3 S2 wireframe, columns, agreement strings (Spearman ρ), states, interactions; §3.5 S4 renamed, wireframe, components, states, interactions; §3.6 S5 wireframe, CSV columns; §4 inventory rows 20, 21, 23, 31–33, 47–48; §5.1 storyboard beat 0:12–0:16 (S4 "Ranking priorities"); §7 conflicts 3, 4, 6 and open items. |
| R2 Lunar hero | §3.2 S1 wireframe (hero and scope line), components (`HeroStatement`), states (Hero off); §4 rows 54; §5.1 beat 0:00–0:04; §5.2 first-five-seconds list; §5.3 slide 3. The hero sentence is used as the ruling gives it. Its scope line is always shown beneath it. |
| R3 Verbatim quotes vs copyright | §2.5 (no quote display for Jev); §3.4 S3 evidence block (quote, table row and paraphrase variants), components, states (Table row only, Paraphrase only), interactions (copy per kind); §3.6 S5 CSV (`quote` only for `evidence_kind = quote`); §3.7 S6 item 5; §4 rows 24, 51, 52; §5.1 beat 0:16–0:20; §5.3 slide 4; §6 C31. |
| R4 Scope | §3.3 S2 "Metadata only" state and wireframe row; §3.4 S3 "Metadata only" state (replaces "Empty"); §4 row 53 (`MetadataOnlyBadge`) and row 47 (blink cut); §4 row 48 coverage strip replaces matched-condition chart. |
| R5 Demo format | Header and scope line; §0 D9 row; §5.1 title, limit and total length (24 s); §5.2 heading; §5.3 heading (deck is the default). |
| R6 Thresholds | §2.5 support check row (value and question only), unclear state removed, confidence row (`choice` only); §3.4 S3 claim-support line; §3.6 S5 CSV `jev_claim_supported`; §6 C10 and C32. |
| R7 Partial-gravity wording | §3.2 S1 gravity lines ("none in PSI"); §3.4 S3 tooltip; §3.7 S6 item 4; §5.3 slide 6; §5.1 beat 0:04–0:06; §6 C10. Lunar gravity is never called safer. |
| R8 SI disclosure scope | §3.1 status chip (FIXTURE label); §3.2 S1 mock-up header; §3.2 S1 states (Fixture); §3.3 S2 states (Fixture / cached); §3.4 S3 states (Fixture / cached); §3.6 S5 states and CSV `cache_label`; §3.7 S6 item 10 (disclosure scope, manifest, no cached output); §4 row 56 (`FixtureBadge`); §6 C33. |
| Shared names (both files) | §0 decision IDs use BUILD_PLAN §1.5 numbering (D5, D7, D8, D9, D13, D14; composite note); §3.1 names and routes match BUILD_PLAN §1.6; S2 and S3 field names match BUILD_PLAN §1.6; §2.5 Jev names (`jev.*`); §3.2 S1 mock-up header; §6 C34. |
| Also (not a ruling) | §3.3 S2 "Hide rows with overlap 'none'" replaces "Only overlap = yes or unknown" (same semantics, now matches BUILD_PLAN overlap classes). §3.2 S1 shows the four BUILD_PLAN presets (D7) instead of three. §3.5 S4 "Dimension" table replaced by the priority order. §4 row 30 renamed `CompareSelector`. |
