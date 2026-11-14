import { useMemo, useState } from 'react';
import type { PressureUnit, TestRow } from '@fire/contracts';
import { formatPressure, midpoint } from './helpers';

type SortKey = 'accession' | 'testLabel' | 'fuel' | 'oxygen' | 'pressure' | 'date';

export default function TableView({ rows, unit, onSelect }: { rows: TestRow[]; unit: PressureUnit; onSelect?: (id: string) => void }) {
  const [sort, setSort] = useState<{ key: SortKey; descending: boolean }>({ key: 'accession', descending: false });
  const value = (row: TestRow, key: SortKey): string | number => {
    if (key === 'fuel') return row.fuel.name ?? '';
    if (key === 'oxygen') return midpoint(row.o2Pct) ?? -1;
    if (key === 'pressure') return midpoint(row.pressureKpa) ?? -1;
    return row[key] ?? '';
  };
  const sorted = useMemo(() => [...rows].sort((left, right) => {
    const a = value(left, sort.key);
    const b = value(right, sort.key);
    const result = typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b));
    return sort.descending ? -result : result;
  }), [rows, sort]);
  const columns: [SortKey, string][] = [['accession', 'Study'], ['testLabel', 'Test'], ['fuel', 'Fuel'], ['oxygen', 'O2 %'], ['pressure', `Pressure (${unit})`], ['date', 'Date']];
  return <div className="gapmap-table"><table><caption>Test rows matching the map filters</caption><thead><tr>{columns.map(([key, label]) => <th key={key} scope="col" aria-sort={sort.key === key ? sort.descending ? 'descending' : 'ascending' : 'none'}><button onClick={() => setSort(current => ({ key, descending: current.key === key && !current.descending }))}>{label}</button></th>)}</tr></thead><tbody>{sorted.map(row => <tr key={row.id}><td>{row.accession}</td><td><button onClick={() => onSelect?.(row.id)}>{row.testLabel ?? row.id}</button></td><td>{row.fuel.name ?? 'Not reported'}</td><td>{midpoint(row.o2Pct) ?? 'Not reported'}</td><td>{midpoint(row.pressureKpa) === null ? 'Not reported' : formatPressure(midpoint(row.pressureKpa)!, unit)}</td><td>{row.date ?? 'Not reported'}</td></tr>)}</tbody></table></div>;
}
