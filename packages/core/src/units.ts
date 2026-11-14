import type { PressureUnit } from '@fire/contracts';
const factors: Record<PressureUnit, number> = { kPa: 1, psi: 6.894757293168, atm: 101.325, mmHg: 101.325 / 760 };
export const toKpa = (value: number, unit: PressureUnit): number => value * factors[unit];
export const fromKpa = (value: number, unit: PressureUnit): number => value / factors[unit];
export const convertPressure = (value: number, from: PressureUnit, to: PressureUnit): number => fromKpa(toKpa(value, from), to);
export const moleFractionToPercent = (fraction: number): number => fraction * 100;
export const partialPressureKpa = (totalKpa: number, o2Pct: number): number => totalKpa * o2Pct / 100;
export function parseUnitInput(input: string): number | null {
  const match = input.trim().match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*(kpa|psi|atm|mmhg)$/i);
  if (!match) return null;
  const unit = ({ kpa: 'kPa', psi: 'psi', atm: 'atm', mmhg: 'mmHg' } as const)[match[2]!.toLowerCase() as 'kpa' | 'psi' | 'atm' | 'mmhg'];
  return toKpa(Number(match[1]), unit);
}
