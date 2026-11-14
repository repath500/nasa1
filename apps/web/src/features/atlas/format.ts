import type { FuelPhase, Gravity, OverlapClass, Pillar, PressureUnit, Range } from '@fire/contracts';

/** Unknown is never shown as 0. Every formatter returns "not reported" for null. */
export const NOT_REPORTED = 'not reported';
export const NOT_AVAILABLE = 'not available';

const KPA_PER: Record<PressureUnit, number> = { kPa: 1, psi: 6.894757, atm: 101.325, mmHg: 0.1333224 };

export function kpaTo(unit: PressureUnit, kpa: number): number {
  return kpa / KPA_PER[unit];
}
export function toKpa(unit: PressureUnit, v: number): number {
  return v * KPA_PER[unit];
}
const unitDecimals: Record<PressureUnit, number> = { kPa: 1, psi: 2, atm: 3, mmHg: 0 };

export function fmtNum(n: number, d = 1): string {
  return Number.isFinite(n) ? n.toFixed(d) : NOT_REPORTED;
}

function fmtRangeWith(r: Range, f: (n: number) => string, unit: string): string {
  const { min, max } = r;
  if (min == null && max == null) return NOT_REPORTED;
  if (min != null && max != null) return min === max ? `${f(min)} ${unit}`.trim() : `${f(min)} to ${f(max)} ${unit}`.trim();
  return `${f((min ?? max) as number)} ${unit}`.trim();
}

export function fmtO2(r: Range): string {
  return fmtRangeWith(r, (n) => n.toFixed(1), '%');
}
export function fmtPressure(r: Range, unit: PressureUnit): string {
  const d = unitDecimals[unit];
  return fmtRangeWith({ min: r.min == null ? null : kpaTo(unit, r.min), max: r.max == null ? null : kpaTo(unit, r.max) }, (n) => n.toFixed(d), unit);
}
export function fmtFlow(r: Range): string {
  return fmtRangeWith(r, (n) => n.toFixed(1), 'cm/s');
}
export function fmtScenarioPressure(kpa: number, unit: PressureUnit): string {
  return `${kpaTo(unit, kpa).toFixed(unitDecimals[unit])} ${unit}`;
}

export const PHASE_LABEL: Record<FuelPhase, string> = {
  solid: 'solid',
  'liquid-droplet': 'liquid droplet',
  gas: 'gas',
  aerosol: 'aerosol',
  unknown: 'fuel phase not reported',
};
export const PILLAR_LABEL: Record<Pillar, string> = {
  prevention: 'prevention',
  detection: 'detection',
  suppression: 'suppression',
  fundamental: 'fundamental',
  unknown: 'unknown',
};
export const GRAVITY_LABEL: Record<Gravity, string> = {
  microgravity: 'microgravity (ISS)',
  '1g': '1 g (ground comparison)',
  'partial-gravity': 'partial gravity',
  'electric-field-analog': 'electric field analog',
  unknown: 'gravity not reported',
};
export const OVERLAP_LABEL: Record<OverlapClass, string> = {
  covers: 'covers',
  'near-o2-only': 'near O₂ only',
  'near-pressure-only': 'near pressure only',
  none: 'none',
  unknown: 'unknown',
  'excluded-burner': 'burner stream, excluded',
};
export const OVERLAP_TITLE: Record<OverlapClass, string> = {
  covers: 'O₂ and pressure both within tolerance of this air',
  'near-o2-only': 'O₂ within tolerance, pressure outside it',
  'near-pressure-only': 'Pressure within tolerance, O₂ outside it',
  none: 'Both O₂ and pressure outside tolerance',
  unknown: 'O₂ or pressure not reported, so no match or mismatch is claimed',
  'excluded-burner': 'O₂ is the burner stream, not the cabin air, so it is not counted',
};

export const CONCERN_LABEL = {
  prevention: 'Prevention',
  detection: 'Detection',
  suppression: 'Suppression',
  explore: 'Just exploring',
} as const;

export const KIND_LABEL = { table_row: 'table row', quote: 'quote', paraphrase: 'paraphrase' } as const;

export const DIRECTNESS_NAMES = [
  'no direct measurement described',
  'context or secondary reanalysis',
  'direct flight observation, conditions partly identified',
  'direct flight measurement, conditions identified',
] as const;

/** Parse a display date that may be ISO or a short form. Returns the year or null. */
export function yearOf(date: string | null): number | null {
  if (!date) return null;
  const iso = /^(\d{4})-\d{2}-\d{2}/.exec(date);
  if (iso) return Number(iso[1]);
  const m = /(?:^|[^\d])(\d{2})$/.exec(date);
  if (m) return 2000 + Number(m[1]);
  const y4 = /(\d{4})/.exec(date);
  return y4 ? Number(y4[1]) : null;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function downloadText(name: string, text: string, mime = 'text/plain'): void {
  const url = URL.createObjectURL(new Blob([text], { type: `${mime};charset=utf-8` }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function csvCell(v: string | number | null | undefined): string {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Unit aware pressure input: "10.2 psi", "0.7 atm", "530 mmHg", "70 kPa". Bare numbers use `fallback`. Returns kPa or null. */
export function parsePressure(text: string, fallback: PressureUnit): number | null {
  const m = /^\s*(\d+(?:[.,]\d+)?)\s*(kpa|psia|psi|atm|mmhg|torr|bar)?\s*$/i.exec(text);
  if (!m) return null;
  const n = Number((m[1] as string).replace(',', '.'));
  const u = (m[2] ?? '').toLowerCase();
  const unit: PressureUnit = u === 'kpa' ? 'kPa' : u === 'psi' || u === 'psia' ? 'psi' : u === 'atm' ? 'atm' : u === 'mmhg' || u === 'torr' ? 'mmHg' : u === 'bar' ? 'kPa' : fallback;
  const kpa = u === 'bar' ? n * 100 : toKpa(unit, n);
  return kpa > 0 && kpa <= 1000 ? kpa : null;
}
