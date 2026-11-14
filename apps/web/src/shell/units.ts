import type { PressureUnit } from '@fire/contracts';

/**
 * Local pressure and oxygen input parser, isolated in this one place until @fire/core lands.
 * TODO(contract): replace parsePressureInput with the @fire/core units parser.
 */
const TO_KPA: Record<string, number> = {
  kpa: 1, pa: 0.001, psi: 6.894757, psia: 6.894757, atm: 101.325, mmhg: 0.133322, torr: 0.133322, bar: 100, mbar: 0.1,
};
const UNIT_LABEL: Record<string, PressureUnit> = { kpa: 'kPa', psi: 'psi', psia: 'psi', atm: 'atm', mmhg: 'mmHg', torr: 'mmHg' };

export interface ParsedPressure { ok: boolean; kpa: number | null; unitUsed: string | null; reason?: string }

export function parsePressureInput(text: string, defaultUnit: PressureUnit = 'kPa'): ParsedPressure {
  const t = text.trim().toLowerCase().replace(/,/g, '.');
  if (!t) return { ok: false, kpa: null, unitUsed: null, reason: 'Enter a pressure, for example 10.2 psi.' };
  const m = /^(-?\d+(?:\.\d+)?)\s*([a-z]*)$/.exec(t);
  if (!m) return { ok: false, kpa: null, unitUsed: null, reason: 'Could not read that. Try 70 kPa, 10.2 psi, 0.7 atm or 530 mmHg.' };
  const value = Number(m[1]);
  const unit = m[2] ? m[2] : defaultUnit.toLowerCase();
  const factor = TO_KPA[unit];
  if (factor === undefined) return { ok: false, kpa: null, unitUsed: null, reason: `Unknown unit "${m[2]}". Use kPa, psi, atm, mmHg or bar.` };
  const kpa = value * factor;
  if (!(kpa > 0)) return { ok: false, kpa: null, unitUsed: unit, reason: 'Pressure must be above zero.' };
  if (kpa > 500) return { ok: false, kpa: null, unitUsed: unit, reason: 'That is above 500 kPa, outside this atlas.' };
  return { ok: true, kpa, unitUsed: UNIT_LABEL[unit] ?? unit };
}

export function parsePercentInput(text: string): { ok: boolean; pct: number | null; reason?: string } {
  const t = text.trim().replace(/%/g, '').replace(/,/g, '.');
  if (!t) return { ok: false, pct: null, reason: 'Enter an oxygen percentage.' };
  const v = Number(t);
  if (!Number.isFinite(v)) return { ok: false, pct: null, reason: 'Could not read that number.' };
  if (v <= 0 || v > 100) return { ok: false, pct: null, reason: 'Oxygen must be above 0 and at most 100 percent by volume.' };
  return { ok: true, pct: v };
}

export function kpaTo(kpa: number, unit: PressureUnit): number {
  switch (unit) {
    case 'kPa': return kpa;
    case 'psi': return kpa / 6.894757;
    case 'atm': return kpa / 101.325;
    case 'mmHg': return kpa / 0.133322;
  }
}
const DIGITS: Record<PressureUnit, number> = { kPa: 1, psi: 1, atm: 2, mmHg: 0 };
export function formatPressure(kpa: number, unit: PressureUnit, withUnit = true): string {
  const v = kpaTo(kpa, unit).toFixed(DIGITS[unit]);
  return withUnit ? `${v} ${unit}` : v;
}
export function conversionHint(kpa: number, skip?: string | null): string {
  const units: PressureUnit[] = ['kPa', 'psi', 'atm', 'mmHg'];
  return units.filter((u) => u !== skip).map((u) => formatPressure(kpa, u)).join(' · ');
}
