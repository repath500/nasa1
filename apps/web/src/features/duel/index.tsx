import { useState } from 'react';
import { DEFAULT_TOLERANCES, PRESETS, type Scenario, type TestRow } from '@fire/contracts';
import { useCorpus } from '../../data/useCorpus';
import GapMap from '../gapmap';
import { midpoint } from '../gapmap/helpers';
import './style.css';

export function countNear(rows: TestRow[], scenario: Scenario): number {
  return rows.filter(row => { const pressure = midpoint(row.pressureKpa), oxygen = midpoint(row.o2Pct); return row.o2Location === 'ambient' && pressure !== null && oxygen !== null && Math.abs(pressure - scenario.totalKpa) <= scenario.totalKpa * DEFAULT_TOLERANCES.pressureFrac && Math.abs(oxygen - scenario.o2Pct) <= DEFAULT_TOLERANCES.o2PctPoints; }).length;
}
export default function DuelPage() {
  const corpus = useCorpus(); const [left, setLeft] = useState<keyof typeof PRESETS>('earth-iss'), [right, setRight] = useState<keyof typeof PRESETS>('lunar-cabin-example');
  if (corpus.status !== 'ready') return <main>{corpus.status === 'error' ? corpus.message : 'Loading corpus...'}</main>;
  const rows = corpus.corpus.rows, options = Object.values(PRESETS);
  const picker = (value: keyof typeof PRESETS, set: (value: keyof typeof PRESETS) => void) => <label>Habitat <select value={value} onChange={event => set(event.target.value as keyof typeof PRESETS)}>{options.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>;
  const leftCount = countNear(rows, PRESETS[left]), rightCount = countNear(rows, PRESETS[right]);
  const solidRows = rows.filter(row => row.fuel.phase === 'solid');
  return <main className="duel"><h1>Compare atmospheres</h1><p>Conditions near each example. Counts describe rows, not outcomes.</p><div className="duel-layout"><section>{picker(left, setLeft)}<GapMap rows={rows} scenario={PRESETS[left]} tolerances={DEFAULT_TOLERANCES} selectedRowId={null} unit="kPa" linkKey="duel" /></section><aside aria-label="Count comparison"><strong>{leftCount}</strong><span>near left, {countNear(solidRows, PRESETS[left])} solid</span><strong>{Math.abs(leftCount - rightCount)}</strong><span>row difference</span><strong>{rightCount}</strong><span>near right, {countNear(solidRows, PRESETS[right])} solid</span></aside><section>{picker(right, setRight)}<GapMap rows={rows} scenario={PRESETS[right]} tolerances={DEFAULT_TOLERANCES} selectedRowId={null} unit="kPa" linkKey="duel" /></section></div></main>;
}
