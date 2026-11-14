// column map: proposed by agent, needs human check
import type { ColumnMap } from './types.ts';

const map: ColumnMap = {
  accession: 'PSI-26',
  fileName: 'PSI-26_Experimental_table_BASS.csv',
  sha256: 'ccfc3c54d948b64a1c5d2596a63c7c8019e51df0c91a1d62f039f48fa28c300f',
  sha12: 'ccfc3c54d948',
  fuelPhase: 'solid',
  gravity: 'microgravity',
  o2Location: 'ambient',
  rowFilter: 'bass',
  testLabel: { column: 'As Run Test #' },
  date: { format: 'mdy', columns: ['Date'] },
  fuelName: 'Fuel Sample Material',
  size: { kind: 'none' },
  caveats: [
    'Table reports no O2.',
    'Table reports no pressure.',
    'Table reports no flow.',
    'One maintenance row without a test id is excluded from the parsed rows.',
    'Material text carries sample geometry and size; those are not split into fields.',
  ],
};

export default map;
