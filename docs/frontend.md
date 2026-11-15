# Frontend

## Look and feel
- Tactical-telemetry instrument: dark **Night Ops** default, **Paper** (light, print) and **High Contrast** themes,
  set on `<html data-theme>`. Tokens in `apps/web/src/design/tokens.css`, exposed to Tailwind v4.
- One cool-blue accent (never hazard red: on a fire topic red reads as a safety verdict). Data colours by fuel phase:
  droplet, solid, gas, aerosol, burner (hollow), unknown; each also has a shape, so colour is never the only cue.
- Geist (UI) and JetBrains Mono (every number, tabular figures), self-hosted with OFL licence files.
- 0 px radius on panels and tables, 2 px on inputs and buttons, pills only for status chips.
- **Dither only on imagery** (flames, orbit, waveform). Text, numbers, axes and buttons stay crisp on solid fills.
- No em or en dashes in UI text; plain words on screen, precise words on hover.

## Features (`apps/web/src/features/`)
| Feature | What it is |
|---|---|
| `landing` | Dithered landing: breathing flame (1 g teardrop to microgravity sphere), the challenge with a "View the challenge" link, a big "Enter the Atlas" band, live numbers, where code does the science and why, how it works, Caught by code, how we built it (process and decisions), limits, orbit band, team credit |
| `landing/SdkDither.tsx` | Wrapper for the dither SDK, Paper Design shaders (`@paper-design/shaders-react` 0.0.82, Apache-2.0): animated warp, dots and other 2-colour dither fields; theme colours, paused off-screen, still under reduced motion |
| `landing/dither` | Own WebGL2 ordered-dither engine (Bayer 4x4/8x8, blue noise): one GL context, one rAF loop, fixed matrix origin, pauses off-screen and on hidden tabs, static under reduced motion, Canvas 2D fallback |
| `briefing` | Four-screen wizard: habitat, concern, fuel, code-written summary |
| `atlas` | Workspace: scenario bar, "What you are seeing", Gap Map, side panel, timeline, audio bar |
| `gapmap` | The hero chart: log/linear pressure x O₂, fuel-phase marks, missing-value strips, habitat boxes, equal-pO₂ curves, zoom, pan, minimap, box select, drag/resize custom box, mark navigation, table view, PNG export |
| `studies`, `selection`, `ledger`, `notes` | Side-panel tabs: two-ranker table, box-selection counts, rejected cells, pinned notes |
| `evidence` | Source drawer: raw CSV row + hash, verbatim quote + page, or team paraphrase; APA/BibTeX |
| `study`, `compare`, `brief` | Study page, refusal-first comparison, printable Gap Brief with QR code |
| `orbit`, `timeline`, `duel` | Dithered orbit scene, test-date scrubber, two habitats side by side |
| `audio`, `palette` | Audio bar with Listen mode; ⌘K palette with Ask |
| `learn`, `present` | Learn mode (no live AI), seven-beat Present mode |
| `eggs`, `notfound`, `about` | Easter eggs, 404, About / Method / Credits |

## Modes
Explore (default), Briefing, Listen (narration drives the UI), Present, Learn (no live AI calls), Expert (raw columns,
hashes, model distributions), Duel, No-AI. Shortcuts are listed under `?` in the app.

## Accessibility
WCAG 2.2 AA target: keyboard path everywhere, visible focus, 44 px preferred targets, AA text contrast and 3:1 for data
marks (tested in `src/design/palette.test.ts`), reduced motion honoured by every animation (CSS, Canvas, WebGL,
Motion), captions and transcripts for audio, a table alternative for the Gap Map. `e2e/a11y.spec.ts` runs axe on key
pages in all three themes and at 375 px; serious or critical issues fail the build.

## Adding something
- New screen: add a feature folder with a default export, then a lazy route in `src/routes.tsx`.
- Science: call `@fire/core`; never re-implement overlap, ranking or unit maths in a component.
- Shared state: add it to `src/state/store.ts`; if it should be shareable, add a short key in `src/state/url.ts`.
- Every component ships loading, empty, error, partial and fixture states.
