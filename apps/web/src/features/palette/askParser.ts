import { DEFAULT_TOLERANCES, PRESETS, type AskFilters, type AskResponse, type Concern, type Corpus, type FuelPhase, type PipelineStep, type ScenarioId } from '@fire/contracts';
import { countNear } from '../../shell/near';
import { parsePressureInput } from '../../shell/units';

/** Labelled keyword parser, used when /api/ask fails or the app is offline or No-AI (SPEC §3.11). Parsing only: counts come from rows. */
const PHASES: [RegExp, FuelPhase][] = [
  [/\b(solid|fabric|plastic|paper|cloth|textile)s?\b/, 'solid'], [/\b(droplets?|liquid)s?\b/, 'liquid-droplet'], [/\bgas(es|eous)?\b/, 'gas'], [/\baerosol|dust\b/, 'aerosol'],
];
const HABITATS: [RegExp, ScenarioId][] = [
  [/\b(moon|lunar)\b/, 'lunar-cabin-example'], [/\b(iss|earth|sea level)\b/, 'earth-iss'], [/\b(suit|spacesuit)\b/, 'suit'], [/\b(exploration|mars)\b/, 'exploration-upper'],
];
const CONCERNS: [RegExp, Concern][] = [
  [/\b(smoke|detect\w*|alarm|sensor)\b/, 'detection'], [/\b(extinguish\w*|suppress\w*|put out|snuff\w*)\b/, 'suppression'], [/\b(spread|ignit\w*|catch|burn\w*|prevent\w*|flammab\w*)\b/, 'prevention'],
];

export function parseKeywords(q: string, materials: string[]): AskFilters {
  const t = q.toLowerCase();
  const f: AskFilters = { material: null, fuelPhase: null, scenarioId: null, concern: null, o2Pct: null, totalKpa: null };
  f.material = materials.find((m) => t.includes(m.toLowerCase())) ?? null;
  f.fuelPhase = PHASES.find(([re]) => re.test(t))?.[1] ?? null;
  f.scenarioId = HABITATS.find(([re]) => re.test(t))?.[1] ?? null;
  f.concern = CONCERNS.find(([re]) => re.test(t))?.[1] ?? null;
  const o2 = /(\d+(?:\.\d+)?)\s*%/.exec(t); if (o2) f.o2Pct = Number(o2[1]);
  const p = /(\d+(?:\.\d+)?\s*(?:psi|psia|kpa|atm|mmhg|torr|bar))\b/.exec(t);
  if (p) { const r = parsePressureInput(p[1]!); if (r.ok) f.totalKpa = Math.round((r.kpa ?? 0) * 10) / 10; }
  return f;
}

/** Re-count against the filters so the offline trace reads the same as the live one. */
export function offlineAnswer(q: string, corpus: Corpus): AskResponse {
  const t0 = performance.now();
  const materials = [...new Set(corpus.rows.map((r) => r.fuel.name).filter((n): n is string => !!n))];
  const filters = parseKeywords(q, materials);
  const t1 = performance.now();
  const base = filters.scenarioId && filters.scenarioId !== 'custom' ? PRESETS[filters.scenarioId] : null;
  const s = { o2Pct: filters.o2Pct ?? base?.o2Pct ?? 21, totalKpa: filters.totalKpa ?? base?.totalKpa ?? 101.3 };
  const counts = countNear(corpus.rows, s, DEFAULT_TOLERANCES, filters.fuelPhase ? [filters.fuelPhase] : [], filters.material);
  const t2 = performance.now();
  const trace: PipelineStep[] = [
    { actor: 'PARSER', message: 'keyword parser (offline), no model used', ms: Math.round(t1 - t0), modelId: null },
    { actor: 'CODE', message: `matched ${counts.covers} nearby ${counts.covers === 1 ? 'row' : 'rows'} out of ${counts.total}`, ms: Math.round(t2 - t1), modelId: null },
  ];
  return { filters, trace, source: 'keyword-parser' };
}

export const looksLikeQuestion = (q: string) => {
  const t = q.trim().toLowerCase();
  if (t.length < 8) return false;
  return t.endsWith('?') || /^(has|have|did|does|do|is|are|can|will|what|which|where|how|why|show|find)\b/.test(t) || t.split(/\s+/).length >= 4;
};
