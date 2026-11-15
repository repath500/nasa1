/**
 * @fire/contracts: the shared types for every Fire Atlas workstream.
 * SPEC.md §0.2: these are law. Change only through the lead.
 */

// ---------- Scenarios ----------
export type ScenarioId = 'earth-iss' | 'lunar-cabin-example' | 'exploration-upper' | 'suit' | 'custom';
export type Concern = 'prevention' | 'detection' | 'suppression' | 'explore';
export type Pillar = 'prevention' | 'detection' | 'suppression' | 'fundamental' | 'unknown';
export type FuelPhase = 'solid' | 'liquid-droplet' | 'gas' | 'aerosol' | 'unknown';
export type Gravity = 'microgravity' | '1g' | 'partial-gravity' | 'electric-field-analog' | 'unknown';
export type OxygenLocation = 'ambient' | 'burner' | 'unknown';
export type HardwareFamily = 'CIR-MDCA' | 'CIR-ACME' | 'MSG-duct' | 'Cygnus-Saffire' | 'SAME-glovebox' | 'other' | 'unknown';

export interface Scenario {
  id: ScenarioId;
  label: string;
  /** Ambient O2, percent by volume. */
  o2Pct: number;
  /** Total pressure, kPa. */
  totalKpa: number;
  sourceNote: string;
  /** Always true: presets are illustrative examples, not design values. */
  isExample: true;
}

export interface Tolerances {
  /** Percentage points around scenario O2. Default 3. */
  o2PctPoints: number;
  /** Fraction around scenario pressure. Default 0.15. */
  pressureFrac: number;
  /** Displayed only; not an overlap key in v1. Default 2. */
  flowFactor: number;
}

export const DEFAULT_TOLERANCES: Tolerances = { o2PctPoints: 3, pressureFrac: 0.15, flowFactor: 2 };

export const PRESETS: Record<Exclude<ScenarioId, 'custom'>, Scenario> = {
  'earth-iss': { id: 'earth-iss', label: 'ISS / Earth air', o2Pct: 21, totalKpa: 101.3, sourceNote: 'Sea-level air, 14.7 psi', isExample: true },
  'lunar-cabin-example': { id: 'lunar-cabin-example', label: 'Moon base (example)', o2Pct: 30, totalKpa: 70.3, sourceNote: 'Challenge text: 30% O2 or greater at 10.2 psi or less', isExample: true },
  'exploration-upper': { id: 'exploration-upper', label: 'Exploration atmosphere', o2Pct: 34, totalKpa: 56.5, sourceNote: 'NTRS 20180004258: 34% O2, 8.2 psia', isExample: true },
  suit: { id: 'suit', label: 'Spacesuit', o2Pct: 100, totalKpa: 29.6, sourceNote: 'Challenge text: 100% O2 at 4.3 psi', isExample: true },
};

// ---------- Corpus ----------
export interface Range {
  min: number | null;
  max: number | null;
}

/** One experimental-table row parsed by code (no LLM in this path). */
export interface TestRow {
  /** Stable id: `${accession}:${rowIndex}` e.g. "PSI-69:19". */
  id: string;
  accession: string;
  /** 0-based data-row index in the source CSV (header excluded). */
  rowIndex: number;
  /** Human-readable test id from the table if present (e.g. FLEX "#19"). */
  testLabel: string | null;
  /** ISO date (YYYY-MM-DD) if the row has a test date; else null. */
  date: string | null;
  fuel: { name: string | null; phase: FuelPhase; geometry: string | null; size: string | null };
  /** Initial ambient (or burner) O2, percent by volume. Null = not reported. */
  o2Pct: Range;
  /** Discrete tested O2 values when the source cell lists several (e.g. "21; 26.5; 40").
   *  Overlap tests each value; the o2Pct envelope is for display only and never implies untested values in between. */
  o2ValuesPct?: number[];
  o2Location: OxygenLocation;
  o2Approx: boolean;
  /** Post-test O2 if the table reports it (never a condition). */
  o2FinalPct: number | null;
  pressureKpa: Range;
  flowCmS: Range;
  gravity: Gravity;
  /** Raw cells as written, keyed by original header. */
  raw: Record<string, string>;
  /** First 12 hex of the source CSV sha256. */
  csvSha12: string;
  fixture?: boolean;
}

export interface RejectedCell {
  accession: string;
  rowIndex: number;
  column: string;
  rawValue: string;
  reason: 'o2-out-of-range' | 'pressure-nonpositive' | 'flow-negative' | 'unparseable' | 'post-test-not-condition' | 'other';
  note: string;
  csvSha12: string;
}

export type CardState = 'gold' | 'metadata_only';
export type EvidenceKind = 'quote' | 'table_row' | 'paraphrase';

export interface InvestigationCard {
  accession: string;
  acronym: string;
  title: string;
  doi: string | null;
  license: string;
  objective: string;
  hardwareFamily: HardwareFamily;
  pillarPrimary: Pillar;
  pillarSecondary: Pillar | null;
  /** 0-3, human-assigned with a written rule; null until reviewed. */
  evidenceTier: number | null;
  evidenceTierRule: string | null;
  fuelPhases: FuelPhase[];
  gravityRegimes: Gravity[];
  psiVersion: string | null;
  psiModified: string | null;
  tableFiles: { fileName: string; sha12: string; bytes: number }[];
  paperIds: string[];
  equipmentLink: string | null;
  caveats: string[];
  cardState: CardState;
  rowCount: number;
  fixture?: boolean;
}

export interface Review {
  state: 'proposed' | 'accepted' | 'rejected';
  /** Human names only. Agents never set this. */
  by: string[] | null;
  at: string | null;
  notes: string | null;
}

export interface EvidenceRecord {
  id: string;
  accession: string;
  sourceId: string;
  origin: 'table_row' | 'text_span' | 'human_entry';
  evidenceKind: EvidenceKind;
  locator: { kind: 'page' | 'csv-row'; page: number | null; rowIndex: number | null; csvSha12: string | null };
  quote: string | null;
  paraphrase: string | null;
  limitations: string[];
  review: Review;
}

export interface Corpus {
  version: 'v1';
  builtAt: string;
  /** sha256 of the canonical JSON of {cards, rows, rejects, records}. */
  corpusHash: string;
  fixture: boolean;
  cards: InvestigationCard[];
  rows: TestRow[];
  rejects: RejectedCell[];
  records: EvidenceRecord[];
  sources: { id: string; kind: 'psi-table' | 'psi-json' | 'ntrs' | 'psi-report'; title: string; license: string; url: string | null; sha12: string | null }[];
}

// ---------- Science core outputs ----------
export type OverlapClass = 'covers' | 'near-o2-only' | 'near-pressure-only' | 'none' | 'unknown' | 'excluded-burner';

export type BaselineKey = 'pillar_match' | 'covers_count' | 'evidence_tier' | 'near_count';
export const DEFAULT_PRIORITY: BaselineKey[] = ['pillar_match', 'covers_count', 'evidence_tier', 'near_count'];

export interface StudyOverlap {
  accession: string;
  covers: number;
  nearO2Only: number;
  nearPressureOnly: number;
  none: number;
  unknown: number;
  excludedBurner: number;
  /** The best class among its rows, for display. */
  bestClass: OverlapClass;
}

export interface BaselineRankRow {
  accession: string;
  rank: number;
  pillarMatch: 'primary' | 'secondary' | 'none';
  overlap: StudyOverlap;
  evidenceTier: number | null;
}

export interface Sensitivity {
  ordersTested: number;
  top3Stable: boolean;
  changingOrders: BaselineKey[][];
}

export interface JevJudgement {
  accession: string;
  scenarioId: ScenarioId;
  /** noul P(yes); ordinal model judgement, not a probability the science is true. */
  regimeRelevance: number | null;
  /** Probability-weighted level index 0..3. */
  evidenceDirectness: number | null;
  directnessProbs: number[] | null;
  pillar: { choice: Pillar; probabilities: Partial<Record<Pillar, number>>; confidence: number } | null;
  /** hydrogen-fallback: Gemini 4 Hydrogen (via OpenRouter) answering Jev's questions when Jev is unavailable. */
  source: 'jev-live' | 'decision-1' | 'hydrogen-fallback' | 'cache' | 'fixture';
  modelId: string;
  recordedAt: string;
}

export interface Agreement {
  top3Overlap: number;
  spearman: number | null;
  sentence: string;
  disagreements: { accession: string; baselineRank: number; jevRank: number }[];
}

export interface GapStatement {
  allowed: boolean;
  /** Code-written hero sentence; null if not allowed. */
  sentence: string | null;
  scopeLine: string | null;
  counts: { rowsNear: number; byPhase: Partial<Record<FuelPhase, number>>; unknownO2Tables: string[] };
  reasonIfBlocked: string | null;
}

// ---------- API ----------
export type LadderLevel = 'L0-live' | 'L1-decision-1' | 'L2-cache' | 'L3-baseline';

export interface RankRequest { scenarioId: ScenarioId; concern: Concern; corpusHash: string }
export interface RankResponse {
  ladder: LadderLevel;
  judgements: JevJudgement[];
  note: string | null;
}

export interface AskFilters {
  material: string | null;
  fuelPhase: FuelPhase | null;
  scenarioId: ScenarioId | null;
  concern: Concern | null;
  o2Pct: number | null;
  totalKpa: number | null;
}
export interface PipelineStep { actor: 'HYDROGEN' | 'PARSER' | 'CODE' | 'JEV' | 'DECISION-1'; message: string; ms: number; modelId: string | null }
export interface AskResponse { filters: AskFilters; trace: PipelineStep[]; source: 'hydrogen' | 'keyword-parser' }

export type NarrationCue =
  | { at: number; kind: 'focusHabitat'; habitat: ScenarioId }
  | { at: number; kind: 'highlightRows'; rowIds: string[] }
  | { at: number; kind: 'filterPhase'; phases: FuelPhase[] }
  | { at: number; kind: 'openStudy'; accession: string }
  | { at: number; kind: 'openLedger' }
  | { at: number; kind: 'clear' };

export interface NarrationSegment {
  id: string;
  title: string;
  text: string;
  /** Record/row ids backing the numerals in `text`. */
  claimIds: string[];
  /** Cues relative to the start of the whole track, seconds (filled after TTS). */
  cues: NarrationCue[];
  startSec: number | null;
  endSec: number | null;
}

export interface NarrationManifest {
  scenarioKey: string;
  scriptHash: string;
  segments: NarrationSegment[];
  words: { w: string; start: number; end: number }[] | null;
  audioUrl: string | null;
  voice: { provider: 'elevenlabs' | 'device' | 'none'; voiceId: string | null; modelId: string | null };
  generatedAt: string;
  disclosure: string;
}


export interface HealthResponse { ok: boolean; services: { jev: boolean; gemini: boolean; elevenlabs: boolean } }

// ---------- UI shared ----------
export type Mode = 'explore' | 'briefing' | 'listen' | 'present' | 'learn' | 'duel' | 'no-ai';
export type Theme = 'night' | 'paper' | 'contrast';
export type PressureUnit = 'kPa' | 'psi' | 'atm' | 'mmHg';
export type PanelTab = 'studies' | 'selection' | 'ledger' | 'notes';

/** Everything that goes in the URL query string. Short keys. */
export interface UrlState {
  h: ScenarioId;          // habitat
  o2?: number;            // custom O2 %
  kpa?: number;           // custom pressure kPa
  q: Concern;             // concern
  f?: FuelPhase[];        // fuel phase filter
  m?: string;             // material
  mode?: Mode;
  tab?: PanelTab;
  v?: 'mission';          // atlas picture: Gap Map (default) or Mission view
  sel?: string;           // selected row id
  x?: [number, number];   // map x domain (kPa)
  y?: [number, number];   // map y domain (O2 %)
  u?: PressureUnit;
  t?: number;             // timeline year cutoff
  ex?: 1;                 // expert mode
}

export interface GapMapProps {
  rows: TestRow[];
  scenario: Scenario;
  tolerances: Tolerances;
  /** Other habitat boxes drawn faintly. */
  otherScenarios?: Scenario[];
  selectedRowId: string | null;
  highlightedRowIds?: string[];
  phaseFilter?: FuelPhase[];
  timelineCutoff?: string | null;
  unit: PressureUnit;
  /** Custom habitat: allow dragging/resizing the box. */
  editableBox?: boolean;
  onSelectRow?: (rowId: string | null) => void;
  onBoxSelect?: (rowIds: string[]) => void;
  onScenarioDrag?: (next: { o2Pct: number; totalKpa: number }) => void;
  onHoverRow?: (rowId: string | null) => void;
  /** Compact = mini map (briefing, study page). No minimap, no tools. */
  compact?: boolean;
  /** Linked view key for duel mode zoom sync. */
  linkKey?: string;
  className?: string;
}
