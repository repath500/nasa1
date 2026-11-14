import { useEffect, useId, useState } from 'react';
import type { PressureUnit } from '@fire/contracts';
import { useAtlas } from '../state/store';
import { conversionHint, formatPressure, parsePercentInput, parsePressureInput } from '../shell/units';

interface Props {
  label: string;
  kind: 'pressure' | 'percent';
  /** kPa for pressure, percent for percent. */
  value: number | null;
  onCommit: (v: number) => void;
  /** Unit assumed when the text has none. Defaults to the global unit. */
  defaultUnit?: PressureUnit;
  className?: string;
}

/** Accepts "10.2 psi", "0.7 atm", "530 mmHg", "70". Shows a live conversion hint (SPEC §7). */
export function UnitInput({ label, kind, value, onCommit, defaultUnit, className = '' }: Props) {
  const id = useId();
  const unit = useAtlas((s) => s.unit);
  const du = defaultUnit ?? unit;
  const render = (v: number | null) => (v === null ? '' : kind === 'pressure' ? formatPressure(v, du) : `${Math.round(v * 10) / 10}%`);
  const [text, setText] = useState(render(value));
  const [focused, setFocused] = useState(false);
  useEffect(() => { if (!focused) setText(render(value)); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [value, du, focused]);

  const parsed = kind === 'pressure' ? parsePressureInput(text, du) : (() => { const p = parsePercentInput(text); return { ok: p.ok, kpa: p.pct, unitUsed: null, reason: p.reason }; })();
  const touched = focused || text !== render(value);
  const commit = () => { if (parsed.ok && parsed.kpa !== null) onCommit(parsed.kpa); };
  const hint = parsed.ok && parsed.kpa !== null
    ? kind === 'pressure' ? `= ${conversionHint(parsed.kpa, parsed.unitUsed)}` : 'by volume, ambient'
    : null;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-[13px] text-muted">{label}</label>
      <input id={id} value={text} inputMode="text" autoComplete="off" spellCheck={false}
        aria-invalid={touched && !parsed.ok ? true : undefined} aria-describedby={`${id}-hint`}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); commit(); }}
        onKeyDown={(e) => { if (e.key === 'Enter') { commit(); (e.target as HTMLInputElement).select(); } }}
        className="num min-h-10 w-full rounded-[2px] border border-strong bg-bg px-3 text-sm text-ink placeholder:text-muted aria-[invalid=true]:border-[var(--color-danger-text)]"
        placeholder={kind === 'pressure' ? 'e.g. 10.2 psi' : 'e.g. 30'} />
      <p id={`${id}-hint`} className={`num mt-1 min-h-5 text-xs ${touched && !parsed.ok ? 'text-[color:var(--color-danger-text)]' : 'text-muted'}`} aria-live="polite">
        {touched && !parsed.ok ? parsed.reason : hint}
      </p>
    </div>
  );
}
