# OV-1: Fire Atlas specification and integration review

**Reviewer:** OV / GPT-6.1 Sol. **Date:** 14 November 2026. **Base:** `5b21a14`, reviewed in an independent worktree on `ov/review-1`. **Scope:** specification/skeleton review, not a review of the six unfinished worker branches. No application code changed. Snippets below are proposals for the lead, not patches already applied.

**Verdict: CONDITIONAL GO for the evidence-reading golden path; NO-GO for the full v2 surface without the P0 fixes below.** Freeze shared contracts now, not after six implementations have diverged. Preserve the human gates; an attractive map is not a substitute for accepted records. The deadline in this brief is **Sunday, 15 November 2026, 23:59, Local Event time**. Europe/Dublin is GMT on that date, but the team must confirm that its registered Local Event uses that zone. The roughly 26-hour budget is the task's planning assumption, not a fresh clock measurement.

## 0. Evidence and severity

Read: all of `SPEC.md`; `packages/contracts/src/index.ts`; `apps/web/src/routes.tsx`, `state/store.ts`, `state/url.ts`, `data/useCorpus.ts`; both root scripts; every workspace package/TypeScript config; Vite/tokens/shell/entry-point stubs; and all five requested science/compliance documents. `OVERSIGHT.md` R1-R8 resolve older planning conflicts; SPEC supersedes the old route map but does not silently revoke those rulings.

**P0** = blocks trustworthy integration, release, or judging. **P1** = correctness/security/UX defect to fix before feature freeze. **P2** = defer or cut. A missing implementation in the base is explicitly distinguished from a demonstrated defect.

### Reproduced on the base

| Check | Observed result | Interpretation |
|---|---|---|
| `node --version`, `pnpm --version` | `v22.23.2`, `10.10.0` | Record/pin this working toolchain. |
| `pnpm install --frozen-lockfile` | PASS, 236 packages | Declared skeleton dependencies resolve without lockfile edits. |
| `pnpm typecheck` | PASS across five workspace packages | Stubs compile; this is not feature acceptance. |
| `pnpm build` | PASS; Vite 6.0.15; main entry about 69.95 KB gzip | Current Tailwind/Vite plugin arrangement works. No blanket migration is warranted. |
| `pnpm lint:claims` | PASS on stubs | Important false positives/coverage holes remain; see B8. |
| `pnpm secret-scan` | FAIL, `FOUND matches`, no matches printed | Demonstrated shell pipeline bug, B1. |
| `pnpm test` | FAIL: core has no test files | Expected skeleton incompleteness; do not hide it with `passWithNoTests`. |
| `pnpm corpus` | FAIL: `packages/pipeline/src/cli.ts` missing | W2 must supply the exact scripted entry point. |
| `pnpm e2e` | FAIL: no tests found | No Playwright config/specs exist in the base. |
| Native Node import of `@fire/contracts` from `packages/core` | PASS with `--experimental-strip-types` | Workspace symlinks work here; do not falsely claim every source `.ts` package export fails. |

**Independent raw-data diagnostic, not a human-approved scientific finding:** Python's standard CSV reader with `encoding='cp1252'` finds **274 FLEX rows; 24 with O2 >= 30%; 17 of those within pressure tolerance around 70.3 kPa; only 8 within BOTH 27-33% O2 and 59.755-80.845 kPa**. Conversion: `mmHg * 101.325 / 760`. The eight FLEX test labels are `25, 26, 27, 28, 40, 41, 42, 43`, not CSV row indices. This is why the spec's repeated “24 nearby” cannot be copied into UI or audio. Human K5 still decides whether the ambient/initial interpretation and final hero may ship.

There are **17 CSV files**, not 16, in `research/flame/samples/psi_tables/`: 16 accession groups, with **two PSI-159 tables**. FLEX-2 is a design-range table. Inventory and source identity must be explicit, B2.

## 1. Blocking integration issues and exact lead fixes

### B1 / P0: Secret scanning always fails on an empty history match

**Where:** `scripts/secret-scan.sh:6`. `git log -p --all | grep ... | head -5 && FOUND=1` uses `head`'s success status, not `grep`'s no-match status. A clean scan therefore sets `FOUND=1`. Reproduced with a clean single-line pipeline, exit status 0. There is no evidence of a leaked key in this result.

**Exact fix:** remove the status-masking pipeline, preserve a failed history read as a failure, and never print complete credentials. Replace the history line with:

```sh
HISTORY=$(mktemp) || exit 1
trap 'rm -f "$HISTORY"' EXIT HUP INT TERM
git log -p --all > "$HISTORY" || exit 1
if grep -Eq "$PAT" "$HISTORY"; then
  echo 'secret-scan: credential-like content in git history'
  FOUND=1
fi
```

Likewise make filesystem scans report filenames, not secret contents. Expand scan roots to `cache`, `data`, generated audio manifests, deploy output, and tracked configuration; cover signed AWS URLs, private keys, `LICENSE_SECRET`, ElevenLabs/provider tokens beyond the current narrow patterns. Add clean/planted-token regression tests in temporary repos outside this checkout. Avoid an overbroad `sk-` rule that flags ordinary source text. Do not treat this broken scanner as proof of secret absence.

### B2 / P0: Row IDs collide across tables and cannot represent discrete conditions honestly

**Where:** `packages/contracts/src/index.ts:52`, URL selection regex in `apps/web/src/state/url.ts:26`, SPEC 10.1-10.2. Both PSI-159 CSVs have row zero: `${accession}:${rowIndex}` collides. Expanding `21; 26.5; 34; 40` creates the same collision again. Turning that list into `[21,40]` invents untested intermediate oxygen values. Expanding multiple columns as a Cartesian product invents combinations. Counting expansions as new experiments inflates the result.

**Exact shared amendment, before W2/W3/W4/W5/W6 merge:** retain one `TestRow` per physical source row; add a source table identity and a discrete-set representation. Preserve the original `Range` fields as envelopes for display, but sets must override envelopes for overlap. Exclude ambiguous paired-condition lists until a human-approved column map explains their correspondence.

```ts
export type ValueKind = 'condition' | 'measured-outcome' | 'observed-limit' | 'prediction' | 'design-range' | 'unknown';
export interface SourceTable {
  id: string;
  accession: string;
  fileName: string;
  sha256: string;
  sha12: string;
  bytes: number;
}
export interface TestRow {
  sourceTableId: string;
  sourceRowKey: string;
  valueKind: ValueKind;
  o2ValuesPct: number[] | null;
  pressureValuesKpa: number[] | null;
  conditionPairing: 'single' | 'paired' | 'unresolved';
}
```

These are **fields to add to the existing interface**, not a replacement that deletes its current fields. Add `Corpus.tables: SourceTable[]`. Set `id`/`sourceRowKey` to `${accession}:${sourceTableId}:${rowIndex}`, with a stable URL-safe table ID such as its CSV SHA prefix; fail on any duplicate ID. Resolve `sel` against the loaded row index instead of the old two-part regex. Accept legacy `${accession}:${rowIndex}` links only when that accession has one unambiguous table. Never confuse a displayed test label such as `#19` with the contract's zero-based data-row index. Extend `OverlapClass` with `excluded-noncondition` and `StudyOverlap` with `excludedNoncondition: number` so design/outcome/unresolved-pairing rows cannot disappear into `none` or inflate measured matches; keep the existing `excluded-burner` category distinct.

W2 must enumerate all 17 files in an inclusion manifest: core measured tables; reserves; held design ranges/context. No silent “first 16” slice, no duplicate table ingestion from other sample folders. Either keep PSI-68 outside `Corpus.rows`, or give it `valueKind='design-range'` and exclude it from *all* tested-row counts, ranking and narration. Do not make “all tables parsed” mean “all rows are measured conditions”.

### B3 / P0: The evidence contract cannot support the promised verifier, human gates or study detail

**Where:** contracts `EvidenceRecord:126`, `InvestigationCard:92`, `Corpus:139`; BUILD_PLAN 2.4, 3.3-3.5; R2/R3/R4/R8. Evidence records lack their own typed conditions, gravity, outcome/value kind, full source hash/cell binding, `scenarioScope`, verification result and model provenance. The only link is accession, which is insufficient to distinguish an accepted FLEX row from another row in the same study. A string `fuel.size` cannot support a defensible `>10x` comparison. Cards also lack the spec's sensors/measurements and experimental variables. `cardState='gold'` alone is not evidence of a human review.

**Exact fix:** extend, do not locally redefine, the shared schema:

```ts
export interface EvidenceRecord {
  rowId: string | null;
  scenarioScope: Exclude<ScenarioId, 'custom'>[];
  valueKind: ValueKind;
  gravity: Gravity;
  conditions: Pick<TestRow, 'fuel' | 'o2Pct' | 'o2Location' | 'pressureKpa' | 'flowCmS'> | null;
  sourceSha256: string;
  sourceCells: Record<string, string> | null;
  verification: { passed: boolean; policyVersion: string; checkedAt: string };
  provenance: { originModelId: string | null; generatedAt: string | null };
}
export interface InvestigationCard {
  variables: string[];
  measurements: string[];
  sensors: string[];
  pillarReview: Review;
  tierReview: Review;
}
```

Also add source rights metadata (`determinationType`, per-document notice approval) to `Corpus.sources`; add normalized geometry dimensions with units **only where a source actually reports them**, otherwise refuse quantitative scale comparison. A table-row record must identify exactly one source row; a text-span record must identify its document/page and supported numeric fields. Do not infer a text-span's conditions from another row merely because its accession matches.

**Gate transport:** lead owns parsing `data/reviews/{k5,d5,g3}.json` plus human-record manifests into a shared `ReviewGates` object. Missing files = blocked/proposed, not accepted. Bind K5 to corpus hash and the reviewed initial/ambient records; D5 to rubric hash; G3 to corpus/rubric/model and the labelled-set result. Pass gates explicitly to `gapStatement` and narration; a browser cannot read repository files at runtime. W2 may prepare candidates/proposals, never approver names/dates. Derive `gold` only from accepted, verifier-passing evidence; metadata-only cards remain unranked. A plain boolean from AI or a self-attested “reviewed” chip is not a gate.

```ts
export interface GateAttestation {
  decision: 'go' | 'no-go';
  review: Review;
  corpusHash: string | null;
  rubricHash: string | null;
  modelId: string | null;
  recordIds: string[];
  evidencePath: string;
}
export interface ReviewGates {
  k5: GateAttestation | null;
  d5: GateAttestation | null;
  g3: GateAttestation | null;
}
```

Core policy enforces each gate's required bindings rather than accepting null hashes for K5/G3. G3's `evidencePath` resolves to the actual labelled-set metrics, not just an unchecked filename. Hash normalized gate attestations separately as `reviewGatesHash`; include it in derived-content/cache keys so a changed human go/no-go invalidates old hero text and narration even when source bytes are unchanged.

### B4 / P0: Corpus validation/hash verification is absent and the fixture cannot pass it

**Where:** `apps/web/src/data/useCorpus.ts:7`, contracts `corpusHash:143`, SPEC 10.1/13. Loader trusts `res.json() as Corpus`; invalid JSON stops the fallback loop, an SPA's 200 HTML can masquerade as a missing asset, and a rejected singleton Promise is cached forever so Retry cannot work. No hash, schema, duplicate-ID or referential checks are performed. Fixture hash is literally `"fixture"`. SPEC says “canonical JSON”; contract hashes only `{cards,rows,rejects,records}`: two implementations can disagree or leave source rights unprotected.

**Exact fix:** W3 exports one `parseCorpus`/`verifyCorpusHash` implementation for both W2 and the loader. Freeze canonical serialization of `{version,cards,rows,rejects,records,sources,tables}`: recursively sort object keys, preserve explicitly frozen array order, serialize finite JSON values as UTF-8, exclude `corpusHash`, `builtAt`, and separately bound gate attestations. Hash full source SHA-256 values, not just display prefixes. Rebuild the real and fixture bundles under the same algorithm; do not bypass verification for fixtures.

The loader must check JSON content type, schema, digest, unique row IDs, valid record/source references and finite/domain-valid ranges **before** `ready`. On real-data digest/schema failure, show an integrity error and block ranking; offer an explicit **“Open labelled fixture demo”** action rather than silently presenting a fabricated fallback as real evidence. Missing real data may choose that labelled fixture path automatically only with a persistent explanation. Export a retry action that clears `cache`; ignore async completion after unmount. A hash proves byte consistency, not human scientific validation. W2 owns generating both output copies; lead explicitly grants it `apps/web/public/data/` (missing from lane ownership).

### B5 / P0: URL sync is not two-way and destroys non-atlas query parameters

**Where:** `apps/web/src/state/url.ts:14-57`. URL is read once only; Back/Forward never rehydrates it. Every store update writes with `replace:true` and a newly constructed query: compare `a/b`, duel `h1/h2`, Stripe `session_id` and `billing=1` can disappear. Selected row, phase filters, expert and timeline are not reset when a key vanishes; `x/y` exist in the contract but are neither read nor written. Hover/audio/license updates unnecessarily trigger URL processing. Zero oxygen is a valid custom input but rejected by `o2 > 0`.

**Exact replacement algorithm:**

1. `readUrl(search): UrlPatch` returns a typed **complete URL-owned slice**, including defaults/null/empty arrays for absent keys; accept `0 <= o2 <= 100`, finite positive kPa, valid ascending domains and integer date cutoffs. Do not use `Record<string, unknown>` plus a permissive cast.
2. On every `location.key/search/pathname` change, hydrate under a `hydrating` guard; suppress writing until hydration finishes. Decide route mode from pathname (`/learn`, `/present`, `/duel`) before running side effects.
3. `writeUrl(existingSearch, state)` starts from `new URLSearchParams(existingSearch)`, deletes/replaces **only an allowlist of atlas keys**, preserving other features' parameters. Read/write `x,y`; add tolerances/priority/material and `ai` keys or explicitly cut their shareability promise.
4. Subscribe to a selected serializable slice (not all store changes). Use history **push** for committed user scenario/filter/selection changes; debounced **replace** for dragging/zooming. No history entry per frame. Back/Forward must restore state without echo-navigation loops.
5. Retain compare `a,b`, duel `h1,h2` and checkout `session_id` until their owners consume them. `/brief/:scenario` must validate the path ID and restore the exact query context, not select the last store habitat accidentally.

Tests: full reload of a custom/filtered/zoomed/selected deep link; clearing all optional keys; compare/duel/checkout parameter preservation during store updates; two committed filter changes then Back twice and Forward twice; malformed/unknown IDs; `o2=0`; unknown source row ID.

### B6 / P0: Store/mode/API contracts cannot carry the same scenario end to end

**Where:** `store.ts:10-36`, contracts API section, SPEC 2.2/3.11/12. Material autocomplete/Ask has no `material` store field. One `mode` union cannot represent Listen + Present or Learn + No-AI. `ladder` alone cannot distinguish fixture/offline/error/terms-blocked. Rank requests accept `'custom'` but contain no custom atmosphere, tolerances, phase/material context or rubric version. Explain lacks concern and corpus hash. Two custom atmospheres or different priorities can therefore reuse the wrong ranking/explanation/cache/audio. Shared health exists, but most request/response/error shapes do not.

**Exact contract additions:**

```ts
export type ScenarioInput =
  | { kind: 'preset'; id: Exclude<ScenarioId, 'custom'> }
  | { kind: 'custom'; o2Pct: number; totalKpa: number };
export interface QueryContext {
  scenario: ScenarioInput;
  concern: Concern;
  phases: FuelPhase[];
  material: string | null;
  tolerances: Tolerances;
  priority: BaselineKey[];
  corpusHash: string;
  rubricVersion: string;
  reviewGatesHash: string;
}
export interface RankRequest { context: QueryContext; requestId: string }
export interface ApiError { error: { code: string; message: string; requestId: string; retryable: boolean } }
export interface ExplainRequest { accession: string; context: QueryContext; requestId: string }
export interface ExplainResponse { text: string; claimIds: string[]; source: 'hydrogen' | 'template' | 'cache' | 'fixture'; corpusHash: string; requestId: string }
export type NarrateRequest = { context: QueryContext; requestId: string };
export interface CheckoutResponse { url: string }
export interface ClaimLicenseRequest { sessionId: string }
export interface ClaimLicenseResponse { token: string; plan: Plan; expiresAt: string }
export interface PortalResponse { url: string }
```

Replace the existing `RankRequest`, don't declare an incompatible duplicate interface. Echo `requestId` and `corpusHash` on `RankResponse`; include rubric/model/source provenance. Add `AskRequest` and return the same normalized context/filter types; `Ask` proposes editable filters, never an ungrounded answer. Freeze a single cache key over canonical context + rubric + corpus + gates + model + request kind, not just `scenarioId` or concatenated ambiguous strings. Validate on server and client; the server resolves preset values and gate attestations itself and rejects an unknown corpus with 409. Never trust a client-supplied gate hash as approval. Bound finite custom values, limit free text, and cap requests; accepting numeric custom atmospheres is a deliberate change to the old preset-only allowlist. **Lower-cost alternative:** support custom scenarios in client code only and return an explicit unsupported-custom result from live endpoints until after judging.

Store amendment: add `material: string | null`, `aiEnabled: boolean`, `aiStatus: 'idle'|'loading'|'live'|'cached'|'fixture'|'baseline'|'offline'|'error'`, and request provenance. Use navigation/presentation mode independently from `expert`, `aiEnabled` and `audio.playing/following`. Normalize legacy `mode=no-ai` to Explore + `aiEnabled=false`; Listen can turn on audio without replacing Present. Learn always disables runtime AI/voice generation regardless of stale store state, URL flags, health probes or missing-key fallback. No keys means **no live calls**, not automatically “hide permissible labelled prerecorded material”.

For audio, add paused/seek snapshots and rate (not per-frame React updates), plus one typed command channel for seek/play/pause/cue actions. Avoid independently implemented W1 and W5 players. Freeze eligibility separately from key configuration: `health.services.jev=true` says configured, not working, terms-approved, affordable, or G3-passed.

### B7 / P0: No frozen core ABI; UI composition/ownership has holes

**Where:** all three non-contract package indexes are `export {}`; SPEC 17-18. Worker W5's `science.ts`, W6's `core-bridge.ts`, and W1's unit parser are provisional by the task description, **not files observed in this base**. Leaving them after merge creates three numeric paths. Core function names alone do not settle arguments, null semantics or return types.

**Exact lead action:** publish a single approved ABI from W3's `packages/core/src/index.ts` before merging consumers; at minimum `parseCorpus`, `canonicalCorpusPayload`, `verifyCorpusHash`, `convertPressure`, `parsePressureInput`, `classifyOverlap`, `summarizeOverlap`, `baselineRank`, `sensitivity`, `rankJudgements`, `agreement`, `gapStatement`, `verifyEvidence`, `numberGuard`, `claimLint`, `buildNarration`. Specify pure functions, input/output types and errors. For example:

```ts
export function classifyOverlap(row: TestRow, scenario: Scenario, tolerances: Tolerances): OverlapClass;
export function baselineRank(corpus: Corpus, context: QueryContext): BaselineRankRow[];
export function buildNarration(corpus: Corpus, context: QueryContext, gates: ReviewGates): NarrationManifest;
```

`ReviewGates` is the shared gate type required by B3. These are proposed ABI signatures, not declarations to paste over working implementations. Adapt the three temporary adapters to this agreed ABI once, then delete duplicated algorithms. No `as any`, duplicate interfaces, copied core functions, or fallback that silently reverts to fixture science after an exception.

**Composition contract:** `routes.tsx` already matches SPEC 2.1 and its named exports; preserve it. Keep default feature exports and named `CheckoutSuccess/CheckoutCancel`, `MethodPage/CreditsPage`, `FlightRulesPage`. Do not revive old BUILD_PLAN `/rank` routes; optional redirects go to `/atlas` and preserve query state. W1 owns one persistent `AudioBar`, palette, eggs/toasts in AppShell; W5 owns one EvidenceDrawer in AtlasWorkspace and embeds default Timeline/GapMap. State this exception to SPEC 18's apparent duplicate AudioBar composition. Player persistence across `/study` navigation must be intentional.

Extend `GapMapProps` with controlled `domain` and debounced `onDomainChange` so W1 can restore URLs and W4 can link Duel maps; guard echo updates. The existing `linkKey` is only a string, not a synchronization implementation. If resizing custom tolerance edges stays, add `onTolerancesChange`; current `onScenarioDrag` cannot report changed width/height. Freeze Orbit/Timeline default mounts and any optional props now. W5 consumes shared tokens, never edits W1's CSS to make its panels work. Lead grants public-data/service-worker/deployment paths explicitly; lead alone reconciles root and web manifests/lockfile.

### B8 / P0: Claim lint rejects required copy while missing dangerous claims

**Where:** `scripts/lint-claims.mjs:5-20`, SPEC 0.7/3.14/4.2. Its bare `first` pattern rejects **“Listen first”**, **“What to read first”**, and Playwright `.first()`. It scans whole code lines, not only rendered strings, and lets any line containing `lint-claims-ignore` bypass all rules. It misses narration outside one exact directory, server templates, exported briefs, corpus-generated prose and runtime model output. It does not cover several RED_TEAM prohibitions: calibrated, predictive model, bound-the-Moon inference, guaranteed prevention, NASA-approved, equal-pO2 equivalence, or contextual misuse of unknowns.

**Exact fix:** use W3's shared runtime `claimLint` for generated explanations/scripts/brief prose and a build-time string/JSX extraction pass for authored UI. Restrict the novelty rule to actual novelty assertions, not the ordinal/adverb “first”. Interim replacement:

```js
[/\b(novel|unprecedented|first[- ]of[- ]its[- ]kind)\b/i, 'unsupported novelty claim']
```

Add tests that allow “Read first” and reject “the first atlas ever”; match explicit unsupported “first ... ever” claims too. Ban scientific claims in generated prose, not programming identifiers. Treat approved verbatim evidence/raw cells and the never-claim educational page as explicit source/policy contexts, not arbitrary line-ignore escape hatches. Quoted forbidden text remains labelled as a quote, not a product assertion. Runtime guard must fail closed to the deterministic template. Replace SPEC's Learn heading with **“Three areas of spacecraft fire research”**. Replace malformed “Limits: gravity (none in PSI)” with **“Partial-gravity combustion data: none in PSI.”**

### B9 / P1, release-blocking if ignored: Native TypeScript, package scripts, build/deploy and tests

**Node:** `engines.node='>=22'` permits Node 22.0-22.5, before native type stripping. Pin the tested Node 22.23.2 (e.g. `.node-version` plus `engines >=22.23.2 <23`) for this weekend. Native stripping does not apply `tsconfig` aliases, resolve extensionless relative TS imports, transform enums/parameter properties, or compile TSX [N1]. For the existing no-build workspace, add `compilerOptions.allowImportingTsExtensions=true` (legal with current `noEmit=true`); W2/W3/W6 use explicit relative `.ts` imports and `import type`, no transform-only syntax. Avoid a `.js` relative import pointing to a non-emitted file. Do not copy raw source packages under physical `node_modules` in a production Node artifact; bundle/transpile that deployment. `@fire/core/units` etc. are not exported subpaths: import named root exports or explicitly add export mappings.

**Exact scripts:** W2 supplies `src/cli.ts`; W6 supplies `src/dev-server.ts` and `scripts/build-audio.ts`. Resolve repository paths with `import.meta.url`, not pnpm's package CWD. Node does not automatically load root `.env.local`; dev scripts should use, for example, `node --env-file-if-exists=../../.env.local --experimental-strip-types src/dev-server.ts`, with the analogous audio command. Never add keys to `VITE_*`. Root `pnpm build` currently builds only the web app, not the corpus: change it to `pnpm corpus && pnpm --filter @fire/web build`, with server/function checks separate. Building audio stays optional and cannot block a no-key build.

**Dependencies:** existing React/Router/Zustand/Motion/Radix/cmdk/d3 packages and d3 typings are declared. Stripe and ElevenLabs use `fetch`, so their SDKs are **not** mandatory missing dependencies. No QR encoder, programmatic PDF library, CSV parser or service-worker plugin is declared: either explicitly cut those implementations, implement their small supported requirements correctly, or have the lead add the selected package and lockfile once. Do not let W1/W4/W5 independently modify `apps/web/package.json`; W2/W3/W6 own their respective package dependency proposals. A PDF export button cannot depend on a library nobody installed; browser print is sufficient for the judged brief.

**Hosting:** Vite's `/api` proxy is development-only; there is no Cloudflare Pages entry point, KV binding configuration, server environment contract or production dispatcher in the base. Lead owns deployment wrappers/config; W6 exports `handleRequest(request: Request, env: Env): Promise<Response>` from `@fire/server`, isolates `node:http/fs` in dev-only modules, and the Pages wrapper delegates to it. Example wrapper logic: `export const onRequest = ({request, env}) => handleRequest(request, env)` with actual platform types. Configure persistent KV and secrets, not a dev JSON path in Workers. Verify SPA deep links without rewriting `/api` or missing `/data` assets to HTML. A static-only release is valid **if explicitly marked baseline/offline**, not presented as working live services.

**Playwright/Vitest:** lead creates one `apps/web/playwright.config.ts` (`testDir:'./e2e'`, base URL `http://127.0.0.1:5173`, webServer `pnpm dev --host 127.0.0.1 --port 5173 --strictPort`), a no-key baseline suite, and distinct lane specs. Limit web Vitest to `src/**/*.{test,spec}.{ts,tsx}` in `vitest.config.ts` so it does not execute Playwright `e2e/*.spec.ts`. Do not leave “no tests” as green acceptance. Core/server/pipeline test names must match Vitest's include pattern. Use API mocks for deterministic UI service-state tests.

### B10 / P1: Tailwind v4 integration is mostly right; freeze tokens instead of rewriting it

**Where:** `apps/web/vite.config.ts`, `src/design/tokens.css:22`. The Vite plugin and `@import 'tailwindcss'` already build successfully. Do not add a v3 PostCSS setup or `@tailwind base/components/utilities`. Risks are token coverage and theme location: current `@theme inline` maps each token to itself, only a subset is exposed, Paper does not replace chart colors, contrast theme is absent, and AppShell fixes `data-theme='night'` on a descendant while token selectors target `:root[data-theme]`.

**Exact W1 fix:** set the theme on `document.documentElement.dataset.theme`; use distinct runtime and utility namespaces [N2]:

```css
:root { --atlas-bg: #0b0d10; --atlas-ink: #e8eaed; }
:root[data-theme='paper'] { --atlas-bg: #f4f5f6; --atlas-ink: #111418; }
@theme inline { --color-bg: var(--atlas-bg); --color-ink: var(--atlas-ink); }
```

Apply the same pattern to all shared surface/ink/border/flag and fuel-color tokens and font families; support current `var(--color-...)` consumers during the coordinated migration. The emitted skeleton CSS contains self-references, but unlayered root values currently override them: **this is not evidence that the base page is broken**. Test light/contrast charts, not just text contrast; 3:1 data-mark contrast is not established by dark-theme hex values. CSS reduction of durations does not stop Canvas rAF, Motion animations, scroll effects or device speech; W1/W4 explicitly gate those. W4's references to palette “§7.3” should be corrected to §6.3.

### B11 / P1: Narration timing/provenance/host semantics need a real boundary

**Where:** contracts `NarrationManifest:255`, SPEC 4. Existing six `NarrationCue.kind` values **do match** SPEC 4.4; no missing kind is demonstrated just because implementations are absent. But prose additionally promises row drawer/zoom behavior and numbers-as-source-links without corresponding resolved targets. Define dispatch: `focusHabitat` sets the target AND requests zoom; `openStudy` navigates; `openLedger` selects the tab; `highlightRows` highlights only. If narration must open a source drawer, add `{at:number,kind:'openEvidence',rowId:string}` explicitly, or cut that narration behavior. Do not overload highlight to navigate.

Add `corpusHash`, `rubricVersion`, `reviewGatesHash`, normalized `context`, content `source` (`generated/cached/fixture/device/template`) and a script-version field to the manifest. Key audio by full context/script hash, not preset alone: four concerns and material/phase filters change what is said. Freeze `at/startSec/endSec/words` as **track-absolute seconds** and deduplicate cue firing across pause/resume; seek reconstructs current state deterministically, it must not replay all historical navigation actions. User interaction suspends following only, with a resumption affordance; unmount/stop clears highlights and cancels device speech.

Official ElevenLabs endpoint is `POST /v1/text-to-speech/{voice_id}/with-timestamps`; it returns base64 audio and **character** alignment, not the manifest's words [N3]. W6 must group aligned characters into words, account for normalized spoken text, and attach cue anchors after timing is known. No invented equal-duration timestamps labelled synchronized. Keep a real provider/model selection check in W6's README; a docs example is not proof a chosen account can use a voice/model. Build the landing plus **one** reviewed preset first; captions/device/captions-only are acceptable fallbacks. Export audio rights/disclosure metadata with the asset. Segment `claimIds` alone cannot link derived counts or unit conversions: add named derived-fact references and source IDs, or disable numeral links and any “every numeral linked” promise until implemented.

### B12 / P0 for real billing, otherwise CUT: Payment and paid-service security is underspecified

**Where:** SPEC 5.2-5.4/12. “Restore by entering email” has no endpoint or proof of mailbox ownership. Signed tokens are bearer credentials, not an account system; a public email lookup cannot issue them. Monthly audio allowance is in “overviews” while usage reports minutes; Ask allowance, renewal periods, alerting, lab seats/API keys and workspace storage have no contracts. A successful support donation must not grant a Researcher licence. Lab yearly/custom support requests have no declared configured price. A per-process bucket/spend counter is not a production-wide cost cap.

**Exact judged-build decision:** default billing **off/hidden**, no real charges, remove restore/seats/alerts/API-key/shared-workspace promises. If D20 explicitly keeps the test demo, validate a discriminated checkout union: Researcher month/year; Lab month; Support once with an allowlisted amount or bounded custom amount handled server-side. Resolve price IDs on server. Reject live Stripe keys/events when `STRIPE_MODE=test`; check `session.livemode=false`, paid/settled session, expected server price, plan, currency, and active subscription/period as appropriate. No entitlement from a query parameter or unsigned client plan.

Licence tokens require signature/expiry/revocation and server-side usage checks on every paid endpoint; no token/private customer info in logs/URLs. Webhooks require **raw body** HMAC plus timestamp tolerance, constant-time comparison and persisted event-ID idempotency. Stripe server callbacks are not browser same-origin requests: exempt the webhook from browser Origin/Fetch-Metadata rejection, then enforce its signature [N7]. Checkout/portal endpoints require an explicit same-origin policy. Persistent/atomic usage budgeting is required for live spend; otherwise disable costly live endpoints. Redact IP/customer data and amend the privacy statement if logs/rate limiting retain it. The review is not legal approval of commercial use.

## 2. Science and claims: resolve before copy, audio or slides freeze

### Ruling-by-ruling assessment

| Rule | SPEC assessment | Required release behavior |
|---|---|---|
| **R1: separate lexicographic ranks** | Mostly preserved. Table defaults, API context, adapter duplicates and a paid “live Jev” tier can undermine it. | No weighted composite or risk score. Baseline uses accepted pillars/tier, counts and approved priority order; display tolerances. All 24 priority permutations; deterministic accession ties. Jev independently sorts binned relevance, normalized directness and selected-pillar distribution; 3-call medians and baseline ties. Flow factor 2 is context, not an overlap key absent D5. |
| **R2: conditional lunar evidence-gap hero** | **Broken by hard-coded examples** in wizard, Duel and wow moment. “24 FLEX droplets light up” conflates >=30% with near the actual target. | Recompute full-context distinct source-row counts; K5 and scope line mandatory. Missing K5: neutral “Explore reported test conditions”, not a gated hero hidden only on one route. The same rule covers briefs, cached audio, landing previews and Present. |
| **R3: quote rights** | Three layouts are right; source contract and enclosed-document checks are missing. | CC0 PSI and NTRS `PUBLIC_USE_PERMITTED`/`GOV_PUBLIC_USE_PERMITTED` quotes only after per-document review. `GOV_PERMITTED` 20210011385 is paraphrase-only under the ruling. Publisher DOI = link + human-authored paraphrase/locator, not internal quote leakage. No copied figures; restricted Gollner remains excluded pending rights review. |
| **R4: scope and gold records** | Full atlas is much larger than Direction A plus a coverage strip. | Ten metadata cards can remain cheap, but only 3-4 double-coded deep records are the target. Table rows may be visible as code-parsed; unreviewed card tiers/pillars cannot silently become human truth. Metadata-only cards not ranked. Preserve all explicitly included parseable measured rows without pretending they constitute gold reviews. |
| **R5: demo format** | Seven beats and seven slides agree; optional video has a tighter internal cap. | Exactly seven slides including title/closing; optional **under 25 seconds**, not a new 30-second version. No eighth disclosure appendix. |
| **R6: score semantics** | Correctly says ordinal; modal glyph contract is incomplete. | Weighted expected directness index can be 1.43; derive modal glyph from probabilities, not rounding 1.43. Noul is model P(yes), not scientific correctness. Distinct provider labels, null abstentions, no end-user triage threshold or calibration assertions. |
| **R7: no partial-gravity inference** | Non-goal correct; vague “gravity (none in PSI)” copy is not. | “Partial-gravity combustion data: none in PSI.” Never interpolate/bound the Moon from microgravity + 1g, even though challenge prose suggests a possibility. Electric-field analog is an analog, not lunar data. Apparatus chip must not label Cygnus Saffire “ISS” simply because it is microgravity. |
| **R8: provenance, fixture truth, provider terms** | New disclosure covers audio, but fixture authorship and release mechanics remain unsafe. | Agent-written material is **AI-authored**, never “human-authored” unless a human actually wrote it. Mark agent fixtures “FIXTURE: synthetic demonstration, not model judgement or experimental evidence” during development. For literal R8 release compliance, humans actually author the fixture; otherwise obtain an explicit human ruling amendment rather than silently relabel agent text as human-written. No fabricated real Jev run/model/date. Ship no real model-output cache until provider redistribution terms are reviewed; extend the same rights check to generated ElevenLabs assets. |

### Specific scientific red flags and replacement wording

1. **Corpus completeness:** SPEC 1.1/3.1 “every NASA microgravity fire test” is false for this curated subset and tables with omitted conditions. Replace with **“Explore reported test conditions from our curated NASA PSI combustion tables. Open every plotted row at its source.”** Dynamic coverage footer names included accessions, table counts, exclusions, corpus hash and unknowns. Avoid global “all NASA tests” in metadata, landing, transcripts and demo.
2. **Meaning of near:** resolve interval semantics once: `covers` means the reported initial-ambient interval is entirely within the declared tolerance box; a discrete set is tested value-by-value, never as a continuous envelope. If choosing interval intersection instead, rename it to “intersects target band” and test partial intersections explicitly. Missing/unknown O2 basis is `unknown`, never ambient by default. Burner is excluded. Design-range/outcome rows never enter measured overlap. Distinct counts must be consistent in map, panel, brief and audio.
3. **Unknown is not absence:** “0 tests in PSI report oxygen this high” and “not tested” can erase five solid tables with no O2. Prefer **“Among included solid-fuel rows reporting initial oxygen, none reaches this oxygen band. Other solid-fuel tables do not report oxygen, so their overlap is unknown.”** Only emit that statement when the selected band makes it true. A zero nearest count says nothing about flammability or the existence of unpublished/unincluded work. GapStatement must report unknown O2 **and pressure** plus exclusions, not just `unknownO2Tables`.
4. **FLEX count scope:** the local 8/17/24 diagnostic is three different queries. Do not patch “24” to “8” as a new magic constant. Compute and name each condition, including any phase/material/date filter. K5's >=30% high-O2 gate is not the same mathematical predicate as ±3-point nearness. If phase=solid, the main count cannot still announce all-phase droplets without a separately labelled context count.
5. **Burner oxygen:** CFI-G inverse and normal flame configurations must be mapped per table/column, not inferred merely from the presence of O2. BRE's basis remains unknown unless source review establishes it. Hollow burner marks require a separate **burner-stream scale/panel**; plotting them on an axis labelled “ambient oxygen” still misstates the quantity even when counts exclude them. Unknown-basis marks need an explicit rail/exclusion. Burner is not a fuel phase.
6. **Raw provenance, not invented precision:** preserve ranges/approximation signs; no fabricated midpoint coordinates described as measured. Interval glyphs or explicit approximate-position captions are needed. Preserve literal source cells in the drawer, while scientific interpretation uses parsed values. Do not “correct” 3400% to 34% without a human-reviewed correction record; reject/null with reason. One bad cell need not delete all other valid evidence from its row.
7. **Geometry and missing conditions:** `>10x` is a display heuristic, not a scientific comparability theorem. Refuse differing fuel phase, incompatible apparatus/geometry/gravity or missing dimensions even below the threshold; allow only an explicitly scoped reading comparison. Saffire-I/III swapped dimensions are a source-review issue, not automatic proof the geometry changed. Keep concurrent/opposed flow and the sourced 15-20 cm/s ECLSS context visible; do not infer actual flow from BASS-II restrictor setting.
8. **Timeline:** 2009-2021 is not a universal data domain. Use actual parsed **test dates**; show unknown test dates in a separate group. Do not substitute investigation start/modified dates. Keep all dates by default and label any time filter as a view filter; do not let a timeline silently redefine the corpus-wide maximum/hero. Counts and exports must state which scope they use.
9. **pO2 and presets:** keep O2 fraction and pressure separate, sources adjacent, presets illustrative not designs. Equal pO2 does not establish equal flammability. 30%/10.2 psi is an example anticipated by the challenge, not measured Moon air; 34%/8.2 psia is the cited exploration example. Candle morph is a qualitative illustration, not a combustion simulation. Never imply SAME's particle matrix proves detector performance without a supporting record. Say “visible flame extinction diameter”, not an inferred flammability limit.
10. **AI cannot repair semantics:** a numeral whitelist can accept the right numeral attached to the wrong unit/material/source. NumberGuard must bind value + unit + quantity + cited accepted source or declared code derivation. Ship template narration first; drop optional Hydrogen polish until adversarial tests cover reassigned values, negation, fabricated scope and altered units. Strip unsupported sentences, not only unsupported digits. Future LUCI/FM2 mentions say “named in the challenge as anticipated sources”, not a promise that data will arrive.

### Space Apps, open source, voice and payments

**Fresh source check:** official Node, Tailwind and ElevenLabs documentation loaded; official NASA Space Apps legal text was available through indexed search [N4]. Direct Project Submission Guide and Legal fetches returned 502 during this review. AI-origin/text-and-metadata requirements here therefore follow the supplied RED_TEAM/OVERSIGHT record; the lead should re-open the current 2026 guide before submission rather than represent this review as a fresh legal clearance. NASA's official repository also contains a 2026 Navigator answer confirming the demo size/AI disclosure/rights requirements [N5].

The official legal text requires original/third-party solution materials to be freely available or OSI-open-licensed and appropriately cited [N4]. No `LICENSE`, `NOTICE`, `SI_DISCLOSURE.md` or code/data provenance manifest exists in this base. **Lead fix:** add the chosen Apache-2.0 licence, software/asset NOTICE + attribution, SI disclosure, a per-record manifest and dated human decision log; distinguish code licence, PSI CC0 and other asset/service terms. Proprietary hosted APIs do not make their generated assets freely redistributable by implication. No claim of Space Apps endorsement or an invented ban on all commercial projects: payment is a **judging distraction and access/licensing risk**, not a verified blanket disqualification rule.

Recommended visible/footer/submission language, edited by humans to match actual use:

> **About this evidence.** Fire Atlas is a literature-screening tool using a curated set of NASA PSI sources. Condition overlap is computed by code; it is not a finding about habitat flammability. Partial-gravity combustion data: none in PSI. NASA does not endorse this project.
>
> **AI/SI use.** AI tools assisted planning, coding and proposed extracts. [Human names] chose the concept and reviewed [specific records, fields and rubric decisions]. Hydrogen [actual role]; Jev/decision-1 [actual role or “not used in this build”]. Displayed model judgements are labelled and separate from the code baseline. Fixture data are labelled and are not recorded model judgements.
>
> **Voice.** This overview uses an AI-generated voice from ElevenLabs. Its script uses code-computed facts and cited records. Captions and the transcript show the same reviewed script. [Use “Device-generated voice” instead when applicable.]
>
> **Billing demonstration.** Optional hosted-service concept, test mode only. No real payment or card is required to explore evidence, rankings, sources, the ledger or the printable brief.

Voice disclosure must be spoken **and** visible on landing teaser, Listen and exported clips, plus manifest/MP3 metadata; device fallback must not claim ElevenLabs. Verify stock-voice/plan and redistribution rights, no clones/impersonation/NASA imitation, and keep third-party restrictions distinct from the code licence. A paid plan/voice ID alone is not rights evidence. Any AI-generated images/video require the applicable visible disclosure; ordinary code-rendered charts/dither transforms are not automatically generative imagery. No NASA/Space Apps marks in generated art; choose plain text attribution.

**D20 recommendation: hide billing by default**, not hide evidence or provenance exports. `?billing=1` must survive URL sync, and cannot activate live billing on its own. Keep all judged functionality available without payment, sign-in, licence token, live keys, live PSI access or email collection. Do not claim notes are “included” in the free brief but paywall the only way to export them. Remove public promises of lab seats/alerts/API quotas unless actually implemented and open-source-compatible. Commercial future plans belong in a clearly labelled future-work paragraph, not above the science CTA. Preserve honest concept origination: agents cannot write a retroactive human endorsement or assert humans wrote AI-generated fixture text.

## 3. Product coherence and strict cut order

**The basic journey is coherent:** choose atmosphere -> see reported overlap/gaps -> inspect source -> read study/compare -> print a citable brief. The full v2 is not coherent as a 26-hour acceptance target. A four-screen wizard plus landing + atlas cannot also be a three-click end-to-end flow. Audio, Ask, account, no-auth licences, shared workspaces, two ranking services and five interaction modes produce more states than six isolated lanes can reliably integrate in the remaining time.

**Protected judged path:** landing primary action **“Explore evidence”** -> `/atlas?h=lunar-cabin-example&q=prevention`, with scenario/pillar editable there -> one selected dot/source drawer -> study/compare -> free brief. A one-click preset demo carries the first-20-seconds promise. Wizard is optional, with a one-step default summary/Skip; a reduced four-step wizard must be called a guided path, not “3 clicks”. No autoplay, no checkout interruption, no hidden prerequisite gate that leaves an empty unlabelled page.

**Use one language:** human-facing “Study” vs PSI “investigation” gets a glossary definition; “test row” is not “test condition”, “near” is not “covered safely”, and “metadata-only” is not “no experiments”. When multiple conditions share a mark, its badge counts distinct source rows. A “what changed” delta uses the same query/unknown rules as the count. Keep controls usable without keyboard chords or motion.

### Cut in this exact order; do not cut provenance to save an animation

| Order | Cut/defer | Preserve |
|---|---|---|
| **1, now** | Real/test checkout on judged path; account/restore; subscriptions, seats, API keys, alerts, workspace sharing; pricing teaser. | Free evidence/rank/ledger/brief, public code and disclosure. A disabled test page may remain off-path. |
| **2** | Easter eggs, Konami/devtools tricks, confetti, waveform, number tweens, undo/redo, recents, elaborate coach marks, commercial PDF branding. | Stable focus, errors/loading states, copy link/citation, print CSS. |
| **3** | Live Ask/free text, live narration, narration polish, extra provider calls, all 16 preset/concern audio tracks. | Local search, deterministic explanations, one rights-cleared reviewed voice track or captions-only. |
| **4** | Duel, timeline animation, minimap, spider fan, editable-box edges, PNG export/QR; elaborate orbit transition. | Single honest map + keyboard/table alternative, fixed preset controls and one source click. |
| **5** | Separate Learn/Present feature builds, incident panel, full four-page wizard, multiple theme polish. | One accessible Explore view; seven-slide deck assembled from the real build. Paper print view and reduced motion remain. |
| **6** | Additional deep papers/Gold reviews beyond the 3-4, reserve study detail, custom scenario live ranking, secondary visuals. | Core metadata cards, explicitly included parsed rows, accepted evidence and scope/unknown labels. |
| **7, last resort** | Gap Map if it cannot meet correctness/accessibility; Jev rank if G3 or terms fail. | The original desk: three presets, baseline table, permitted labelled model/context material only, source drawer, comparison/limits and printable brief. Never fake G3 or K5 to retain a wow moment. |

Freeze by **15 November 2026, 19:59 Local Event time** (T-4h); thereafter only claims/rights/secrets/broken links/deploy/submission blockers. Target a saved submission by 21:30 and verify it publicly. G0/G1/K2 failures are human go/no-go decisions under OVERSIGHT, not permission for agents to manufacture approvals or silently switch product direction.

## 4. Integration plan

### Merge order and narrow ownership

1. **Lead contracts/store/URL/config amendment first.** Announce the ABI and public path exceptions to all lanes; return revisions on each lane if old schemas persist. Do not merge six mutually incompatible “temporary” contract copies. Update required fixtures in the same coordinated change.
2. **W3 core**, then **W2 pipeline/corpus**. This follows W2's declared core dependency; if W3 needs data to test, use narrow labelled fixtures before W2. Run parser/verifier/overlap tests on the real corpus immediately after W2. Require provenance/gates before declaring the lunar result.
3. **W6 server** against the actual core and frozen corpus; no hidden local bridge math. Prove mocked/failing/no-key paths before using any service. Deploy adapter may wait for lead, not route-to-nowhere UI.
4. **W4 map**, then **W5 panels** against its exact props. Verify shared selection/hover/phase/date semantics before shell polish. One map count selector, one source-row index, one layer of drawer routing.
5. **W1 shell last**, preserving feature exports and composition. Replace unit parser with core, connect health/audio/Ask/licence API shapes, run a complete no-key flow. Merge leaf visual changes earlier only if they obey tokens/contracts and need no consumer rewiring.
6. **Lead integration-only pass:** adapter removal, deployment wrapper, corpus integrity/URL round trips, single host placement, claims/secret tests, deck/disclosure. Reconcile dependency additions once and regenerate the lockfile with pnpm 10.10.0; retain frozen-lock CI afterwards.

Do not cherry-pick a neighbour's build green status as proof the combined application works. Inspect each branch's file list and commit boundary before merging; workers own neither approver records nor root config by default.

### Conflict hotspots

| Path/surface | Collision | Final owner/resolution |
|---|---|---|
| `packages/contracts/src/index.ts`, `apps/web/src/state/{store,url}.ts`, `routes.tsx`, `main.tsx`, `data/useCorpus.ts` | Every lane may want new shapes/route hooks. | Lead only; proposals returned, no local duplicate shared types. |
| `apps/web/package.json`, root `package.json`, `pnpm-lock.yaml`, TypeScript/Vite config | W1 fonts/QR, W4 d3, W5 PDF, W6 runner edits. | Lead applies union of justified deps once; no lockfile conflict resolved by dropping another lane's packages. |
| `tokens.css`, shared primitives, z-index/focus tokens | W4 canvas colors vs W5 panel CSS vs W1 theme. | W1 owns tokens; W4/W5 consume semantic variables, avoid global styles. |
| `features/atlas/index.tsx`, `shell/AppShell.tsx`, audio/evidence hosts | Duplicate AudioBar, conflicting layouts, swallowed keyboard events. | W5 workspace + EvidenceDrawer; W1 persistent global audio/palette/eggs. Local focused handler wins over global shortcuts. |
| `apps/web/public/data/`, contract fixture, corpus hash and source ID format | W2 output versus fixture/loader rewrite. | Explicit W2 publication grant; lead reviews verified bytes and keeps fixture source in sync. |
| `apps/web/public/audio/`, core narration schema, W1 audio player | Timestamps, cue targets, hashes and stale context. | W3 scripts; W6 synthesis/assets; W1 dispatch/player. Joint contract test required. |
| `data/reviews/`, `data/manifest.records.json`, `data/table_maps/` | Generated candidates mistaken for human sign-offs. | Humans own sign-offs; W2 prepares candidates; lead carries gates to runtime. |
| `e2e/`, Playwright/Vitest config, service worker and hosting rewrites | Spec names tests but grants no owner. | Lead config; W1 shell spec, W4 map spec, W5 evidence/brief spec, W6 API fixtures. W1 SW only if explicitly granted. |

### Mandatory adapter swaps after merge

| Provisional code | Replace with | Verification |
|---|---|---|
| W5 `science.ts` or feature-local rank/count utilities | Named `@fire/core` exports and one shared context selector. | Same filtered counts/rank IDs/gap text as core; metadata-only cards excluded; no fallback recomputation. |
| W6 `core-bridge.ts` | Direct `@fire/core` verifier/rank/narration/guard imports, or a zero-logic environment adapter. | Identical fixture input yields identical code facts client/server; no filesystem dependency in Worker request path. |
| W1 unit parser/conversions | `parsePressureInput`/`convertPressure` from `@fire/core`. | psi/psia, atm, mmHg, bar, kPa boundary/round-trip tests; display rounding only. |
| W4 local nearness predicate / W1 preview counts | Core `classifyOverlap` and shared distinct-row selectors. | Main map, mini map, drawer, summary and brief agree including unknown/burner/design exclusions. |

Search by symbols/imports and behavior, not filenames only. `rg -n 'core-bridge|science|parsePressure|mmHg|covers_count|nearO2|numberGuard' apps/web/src packages/server` is a triage list, not a ban on legitimate unit labels. Final functions must come from the agreed package; no code copied into components to evade the search.

### Integration checklist and commands

Run from repository root after contracts and after every lane merge where applicable. Commands requiring scripts/config below are acceptance requirements, **not claimed present in the base**.

```sh
pnpm install --frozen-lockfile
pnpm --filter @fire/core test
pnpm --filter @fire/pipeline test
pnpm corpus
cmp data/corpus.v1.json apps/web/public/data/corpus.v1.json
pnpm --filter @fire/server test
pnpm typecheck
pnpm test
pnpm --filter @fire/web exec vite build
pnpm build
pnpm lint:claims
pnpm secret-scan
pnpm --filter @fire/web exec playwright install chromium
pnpm e2e
git diff --check
git status --short
```

- [ ] Corpus builder validates full hashes/schema/source identities, creates identical public copy, and yields the same **payload hash** on two unchanged rebuilds despite `builtAt`; corrupting a byte fails the verifier/loader test. Fixture passes the same structural/hash rules but stays conspicuously labelled.
- [ ] Tests include all parser traps, verifier negatives, interval/set/unknown/burner exclusions, G1/K5/D5/G3 absent/invalid cases, and cross-UI counts. Do not call testless Vitest success a passed science gate.
- [ ] Test `pnpm dev:server` with no keys: `/api/health` configured flags false; full golden path still works. Set keys only through the approved secret channel/env; do not dump env or real responses with headers into logs. Mock 403/429/529/timeout, bad JSON, wrong corpus hash and stale response completion.
- [ ] In the deployed environment, smoke-test static asset MIME types, `/api` dispatch, KV persistence, deep-link refresh on `/study/PSI-69`, `/brief/lunar-cabin-example`, `/compare?a=PSI-69&b=PSI-25`, and no-cache/offline behavior. Local Vite proxy success is not deployment proof.
- [ ] Playwright: keyboard-only golden path; 375 px and desktop; clear focus return from source drawer; empty suit result; Back/Forward; compare/duel params; no-key/no-AI/Learn network assertions; deterministic narration cue seek/replay; pricing disabled/hidden; zero serious/critical axe findings. No real payment or unmocked spend in CI.
- [ ] Production claims/secrets scan includes built JSON/audio/transcripts and generated briefs, not just source TSX. Bundle/coverage budgets measured on completed features, not skeleton numbers. No PDFs/raw archives pulled into the app bundle.
- [ ] Rights-cleared public repo + licence + exact deployed revision; human gates and disclosure agree with what actually shipped; seven-slide public deck and submission links checked logged out by the team. Browser checks are lead tasks; OV did not claim to have run them here.

## 5. Per-lane acceptance checklists

Each branch must report actual passing commands, remaining stubs and contract proposals. No lane passes merely because its screen renders against its own handwritten types.

### W1: shell, briefing, modes, palette, audio and billing UI

1. [ ] Default/named exports match routes; one persistent player/palette host; no duplicate landmarks or global Escape/space handler stealing focused controls. Shell still mounts all W4/W5 features after lazy loading/error.
2. [ ] No-key landing -> preset atlas -> evidence works without checkout/login/audio; optional wizard skip works, defaults restored from URL. Custom oxygen 0 and unit-aware pressure inputs use core parsing; material Ask chips update an actual store filter.
3. [ ] URL path/parameter hydration, Back/Forward, compare/duel/session_id/billing preservation and invalid-input tests pass against the lead's shared sync, not a local second store.
4. [ ] Learn makes zero runtime model/TTS calls; Present + listening + Expert compose; changing context stops or explicitly rebinds stale narration. Headings/screen-reader status describe fixture/baseline/cached states honestly.
5. [ ] Audio shows correct provider disclosure, captions/transcript, handles null audio/timings without invented synchronization; keyboard seeks, following pause/resume and cleanup pass with W6 manifest fixtures.
6. [ ] Root-applied Night/Paper/Contrast theme, reduced-motion Canvas/Motion coordination, visible focus/AA text, non-color chart cues; font files/licences actually present. 375 px path and serious/critical axe check pass.
7. [ ] Billing hidden/off by default; no key => disabled reason, no payment POST; any D20 test surface says no real charge and never gates sources/print. No advertised unimplemented account restore/seats/alerts.
8. [ ] “All NASA tests”, hard-coded “24 nearby”, forbidden Learn heading and unsupported safety/novelty language absent from UI/audio previews. Authored text and rule-quotation contexts pass meaningful claim lint.

### W2: parser, source inventory and corpus

1. [ ] `pnpm --filter @fire/pipeline test` and `pnpm corpus` run from a clean install using the exact `src/cli.ts`; root paths do not depend on shell CWD; real/public bundles match byte-for-byte.
2. [ ] Inventory records all **17 files/16 accession groups**, full source hashes/encoding/byte counts; both PSI-159 tables have unique row IDs; duplicate ingestion and multi-value row-ID collisions fail loudly.
3. [ ] cp1252/BOM/quoted CSV/newlines/header typos/approximate values/ranges/discrete semicolon sets/cell units have tests. No interval fill-in or Cartesian invented tests. Missing values stay null.
4. [ ] FLEX 274 rows and 24 >=30% diagnostic; actual near count recomputed by declared context (raw diagnostic 8 at defaults), BASS-II initial 13.6-22.2%; post-test O2 never a condition; impossible O2, nonpositive pressure and negative flow create cell-level rejects.
5. [ ] Oxygen basis is mapped explicitly; CFI-G burner and uncertain BRE excluded from ambient match; Saffire absent pressure/O2 retained unknown. FLEX-2 design rows and context tables cannot count as measured tests.
6. [ ] Full source row/page bindings, originals and checksums survive normalization; unknown dates do not become investigation dates; metadata fields/DOIs/licences/caveats are source-derived, not made up to populate panels.
7. [ ] Candidate reviews remain proposed; no fabricated human names/dates; accepted gold and card pillar/tier reviews come only from supplied real human attestations. Manifest identifies AI versus code/human origin truthfully.
8. [ ] Canonical payload hash reproducible; schema/reference validation and corrupted-hash negative tests pass. Real and fixture payloads each have valid hashes and distinct explicit fixture semantics; corpus size within 1.5 MB or an explicitly revised budget.

### W3: science core and narration builder

1. [ ] Approved root exports/signatures compile for W1/W2/W4/W5/W6; pure browser/Worker-compatible core, no filesystem/browser-global side effects at import; native Node `.ts` imports work as well as Vite tests.
2. [ ] Pressure parsing/conversions and boundary tolerances tested (percent **points**, pressure **fraction**); ranges/set semantics defined, source precision preserved, no numeric midpoint invented as observation.
3. [ ] Overlap excludes non-ambient/burner/design/outcome/ambiguous rows appropriately; unknown != none; aggregation counts unique source rows; data/gate context is consistent for filtered versus corpus-wide claims.
4. [ ] Baseline only ranks eligible gold cards with human pillar/tier; lexicographic priorities/ties deterministic; sensitivity covers 24 permutations; no weighted sum. Jev bin/median/tie/null behavior separately tested.
5. [ ] Agreement names matching rank sets (small n, missing judgements, ties); Spearman null when undefined; glyph is modal distribution, not rounded expectation; score fixture yields expected weighted index.
6. [ ] Gap statement and narration fail closed without valid K5/corpus binding, preserve unknown-table scope and compute counts dynamically. D5/G3 status available to consumers; no backdoor hero via a template.
7. [ ] Verifier rejects fabricated quote, wrong page, wrong document, wrong number/units and wrong full source hash/cell; rights gate distinguishes quote/paraphrase/table row and never exposes internal restricted quote.
8. [ ] NumberGuard/claimLint adversarial tests catch unsupported attribution, units, scope, partial-gravity/equivalence claims; readable “Read first” survives. Narration cites inputs/derived facts, carries disclosure/context/hash and does not claim synthesized audio/timing before W6 creates it.

### W4: map, orbit, timeline and duel

1. [ ] Default feature exports and `GapMapProps` match contract; main/mini maps use the same core eligibility/count selectors; external domain restore and linked zoom do not recurse or diverge.
2. [ ] CSV row IDs, selected/hovered marks, table alternative and source drawer all resolve the same row, including both PSI-159 tables. Stacks count source rows; selection fan-out deterministic, never a new test count.
3. [ ] Unknown pressure/O2/basis gets honest rails/exclusions, not zero/log-invalid coordinates. Burner-stream values never masquerade as ambient on the y-axis. Ranges/approximate values visibly distinguished.
4. [ ] Canvas/SVG labels remain crisp; fuel shape+color, exclusion legend, target tolerance, pO2 context caveat and corpus/unknown scope visible. No fitted boundary/safe zone or hard-coded FLEX/solid maxima.
5. [ ] Wheel/touch/keyboard/on-screen controls work; focusable table alternative, row selection/focus return, no trapped scroll; reduced motion stops rAF/flight animations and off-screen orbit pauses.
6. [ ] DPR resize, log/linear pressure, nearest hit-test under 2 ms and 2,000-mark pan budget measured; quadtree coordinates agree with zoom transform, no reparse per hover/frame.
7. [ ] Timeline uses test dates/unknown group and exposes scope; changing date/phase selection keeps map/panels/brief counts consistent. Hard-coded 2009-2021 replay does not fabricate dates.
8. [ ] Duel resolves `h1/h2` independently, shared zoom works, each side's counts are computed with its own scenario; custom edge resizing either updates tolerances through the approved callback or is cut. Orbit “Exploration atmosphere” never implies a Mars result.

### W5: workspace, evidence, studies, compare and brief

1. [ ] Atlas composes exact map/timeline entries and one EvidenceDrawer; persistent audio stays with W1. All route/named exports survive direct reload and unknown accession yields a deliberate state.
2. [ ] Temporary science adapter is removed or delegates without algorithms to `@fire/core`; main table, selection, agreement, hero, “what changed” and print share one effective query context.
3. [ ] Gold eligibility, human pillar/tier, metadata-only unranked group, PROPOSED rubric and blocked K5/G3 states rendered honestly; no fixture judgement appears labelled live Jev.
4. [ ] Table-row/quote/paraphrase layouts obey source rights; raw cells/full hash copy/zero-based row locator/DOI correct; page-exact code verification is not described as independent scientific validation. Gravity/burner/geometry limits visible.
5. [ ] Evidence selection deep links/focus/prev-next/close work for real multi-table IDs; rejected cells cite the right table/row/reason; no hard-coded fake rejects beyond explicit fixture mode.
6. [ ] Study objective/variables/fuels/geometry/sensors/measurements/hardware backed by metadata/accepted records or explicitly unknown. Compare refuses incompatible/missing conditions, no causal gravity claim or fabricated dimension ratio.
7. [ ] Free brief prints on A4/Letter with sources, scope/unknowns, limits, effective scenario/filter/rubric/hash/version; exact-link reload reproduces it. No library-dependent fake PDF/QR button; plain link/print fallback works without licence.
8. [ ] About/Method/Credits disclose actual model/voice/planning/code/data use, G3 result with n if measured, per-source rights and non-endorsement; notes/export promises match implementation. 375 px + keyboard + axe smoke passes.

### W6: providers, API, narration, billing and dev server

1. [ ] Exact dev/audio entry scripts run with root env loading; shared `Request/Env/Response` handler exported; Node fs/http remain dev-only; production wrapper/KV requirements documented for lead. No server key in client/public/log/cache output.
2. [ ] Request/response Zod validation implements the shared API contract including errors, context/hash/request IDs; reject malformed enums/custom values/unknown corpus, oversized bodies, cross-site browser requests and stale client results. Per-provider spending cannot bypass configured caps.
3. [ ] Jev/decision-1 adapters retain distinct labels and semantics; mocked good/403/429/529/timeout/bad-JSON responses traverse permitted live -> fallback -> rights-cleared cache -> baseline. Fixture is never reported as a real provider run; aggregate wait budget bounded.
4. [ ] Direct `@fire/core` bridge swap complete; facts/quote/number/claim guards shared, templates on rejection. Cache key includes all effective context/rubric/corpus/model fields; missing terms/G3 gates never upgrade a fixture to live judgement.
5. [ ] Ask only proposes schema-limited filters with editable confirmation; no tool execution or unrestricted proxy; Learn/No-AI paths stay local. Request cancellation and client request-ID fencing are integrated with W1/W5, not just described as backend features.
6. [ ] Narration uses the verified timestamp endpoint/model/account support, character-to-word alignment tested, audio/captions/cues share context/script/corpus hashes; one rights-cleared preset or honest captions fallback ships before 16-track ambition. No fake word timing, stale script or cloned voice.
7. [ ] No Stripe config => health mode off/disabled endpoints; test mode rejects live sessions/keys; checkout server price allowlist and support-vs-plan distinctions; claim token checks settled session/subscription/expiry and revocation. No email-only restore.
8. [ ] Webhook valid/tampered/expired/duplicate signature cases tested against raw bytes; browser-origin rule does not reject Stripe callbacks. HMAC licence tampering/expiry/revocation and production persistent usage checks tested; no real charges or paid calls in tests.
9. [ ] No-key server suite and static fallback pass; documented real provider probes, if any, report actual model/status/latency/date without secrets, not assumed availability from docs. Provider/audio redistribution and privacy limitations handed to the humans, not marked resolved by code.

## 6. Demo plan check: exactly seven slides, title included

**Yes, after cuts:** SPEC's seven Present beats can support a good deck. Do not block the deck on building Present mode. Use captures from the actual deployed build with its fixture/cached labels intact; no mock screenshot counts, no unpassed K5 hero, no made-up G3 success. Ranker comparison can honestly say not evaluated/hidden rather than inventing an uplift.

| # | Exact slide title | On-screen proof and spoken point |
|---|---|---|
| **1** | **Fire Atlas: follow the evidence, see the gaps** | One real atlas frame, target adult user, human team/concept credit. “A literature screen, not a habitat flammability verdict.” |
| **2** | **The question: which tests belong on the reading list?** | Selected lunar/exploration example with source, O2/pressure separately; curated scope, missing conditions and no raw-archive download. Define “near” and show visible tolerances. |
| **3** | **The map shows evidence, not a boundary** | Real tolerance box and one source-row selection. Show the code-derived lunar gap only if K5 passed, with its full scope line; otherwise show reported/unknown conditions without the hero. No “24 nearby” magic number. |
| **4** | **Open the row. Watch code reject bad evidence.** | Real raw cells + locator/hash/DOI beside the rejected 3400% or nonpositive-pressure cell; each clearly shown as rejected, not plotted measurement. Small incompatible-comparison warning if already working. |
| **5** | **Transparent ranking, and an honest AI comparison** | Baseline priorities/sensitivity beside permitted labelled model judgements. State measured G3 n/result or “Model ranking not evaluated; baseline shown.” Diagram: code parses/verifies; humans accept; model judges/explains within constraints. |
| **6** | **A brief you can cite, with limits you cannot miss** | Free printed brief + sources; partial-gravity none in PSI; unknown != none; ambient != burner; geometry/flow confounds; equal pO2 not equal flammability. Voice disclosure visible if used. |
| **7** | **Built by people, reproducible in public** | Actual human decisions/reviews, concise SI/code/data/audio disclosure, code/data/asset licences, NASA non-endorsement, public site/repo/method links. No sales pitch and no eighth credits slide. |

**Optional video: 24 seconds total**, only after deck/public submission works: 0-3 s title + cited preset; 3-9 s real Gap Map/tolerance reveal (reduced-motion capture acceptable); 9-15 s select row -> raw source/hash; 15-19 s rejected-cell ledger; 19-24 s citable brief + limits + links. Two-minute Listen mode cannot be squeezed into an honest 24-second tour: use a short excerpt with visible/spoken voice disclosure, or silent captions. Use the actual frame labels; no “live” badge for cached output. English captions/subtitles and public no-login access. Keep billing/easter eggs/incident imagery out of this demonstration.

## 7. External primary-source notes and remaining uncertainties

URLs below are source locators, not instructions to call services or create accounts. No authenticated Jev, Hydrogen, decision-1, ElevenLabs or Stripe call was made in this review; no payment, human approval, Worker deployment or browser golden path is claimed.

- **[N1] Node 22 TypeScript documentation:** `https://nodejs.org/docs/latest-v22.x/api/typescript.html`. Confirms stripping limitations, extension/type import requirements and `.ts` dependencies caveat. Native workspace import and installed version additionally tested locally.
- **[N2] Tailwind theme documentation:** `https://tailwindcss.com/docs/theme`. `@theme inline` is appropriate when mapping utility tokens to separate CSS custom properties. Existing Vite integration independently built successfully.
- **[N3] ElevenLabs speech with timing:** `https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps`. Endpoint/response inspected on 14 November 2026. Character alignment requires conversion to the app's word/cue manifest; account/voice/model rights still need verification.
- **[N4] NASA Space Apps legal:** `https://www.spaceappschallenge.org/legal/`. Indexed official result inspected for original/third-party solution-material availability, OSI licensing and citations. Direct fetch failed (502); no newly verified rule categorically banning a test checkout was found. Recheck the current guide/legal with the team before claiming compliance.
- **[N5] Official NASA Space Apps repository, 2026 Navigator answer:** `https://github.com/nasa/spaceapps/discussions/1947`. Answer dated 12 November 2026 covers seven slides including title/closing, <=30-second official video cap, AI disclosure/watermark and third-party audio rights. Our internal R5 cap remains stricter: under 25 seconds.
- **[N6] Submission guide locator:** `https://www.spaceappschallenge.org/resources/project-submission-guide/`. Repeated direct fetch 502 in this review. Origin-of-idea and generated code/data/audio metadata requirements above are grounded in the supplied RED_TEAM/OVERSIGHT rulings pending the humans' current-guide confirmation. This is not a rights clearance or an eligibility guarantee.
- **[N7] Stripe webhook endpoint guidance:** `https://docs.stripe.com/events/manage-webhook-endpoints`. Official guidance confirms raw-body signature verification, duplicate-event handling and webhook-specific CSRF exemptions; the additional test-only/entitlement restrictions are release recommendations for this app, not claims that Stripe implements them automatically.

**Lead's immediate decisions:** accept B2-B7 shared-contract amendments; appoint deployment/e2e owners; hide billing; preserve truthful fixture authorship; obtain real G1/K5/D5/G3 decisions; freeze the reduced golden path. Do not spend the next integration hour adding another mode.
