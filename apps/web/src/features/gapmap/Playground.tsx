import { useState } from 'react';
import { DEFAULT_TOLERANCES, PRESETS, type Corpus } from '@fire/contracts';
import fixture from '../../../public/data/corpus.fixture.json';
import GapMap from './index';

export default function Playground() {
  const [synthetic, setSynthetic] = useState(false); const corpus = fixture as unknown as Corpus;
  const rows = synthetic ? Array.from({ length: 2000 }, (_, index) => { const row = corpus.rows[index % corpus.rows.length]; if (!row) throw new Error('Fixture has no rows'); const pressure = 10 + (index * 37 % 130), oxygen = 10 + (index * 17 % 80); return { ...row, id: `fixture:${index}`, fixture: true, pressureKpa: { min: pressure, max: pressure }, o2Pct: { min: oxygen, max: oxygen } }; }) : corpus.rows;
  return <main><button onClick={() => setSynthetic(!synthetic)}>{synthetic ? 'Use fixture' : 'Use 2,000 synthetic rows'}</button><GapMap rows={rows} scenario={PRESETS['earth-iss']} tolerances={DEFAULT_TOLERANCES} selectedRowId={null} unit="kPa" /></main>;
}
