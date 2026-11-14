// column map: proposed by agent, needs human check
import type { ColumnMap } from './types.ts';

const map: ColumnMap = {
  accession: 'PSI-47',
  fileName: 'PSI-47_Experimental_table_DAFT.csv',
  sha256: 'd9d1a436c6e7bbc410b433e04575fe7dedaff763b5237d688089929b7393b5c0',
  sha12: 'd9d1a436c6e7',
  fuelPhase: 'aerosol',
  gravity: 'microgravity',
  o2Location: 'ambient',
  rowFilter: 'any',
  testLabel: { column: 'Session Name' },
  fuelName: 'Sample Material',
  size: { kind: 'none' },
  caveats: [
    'Table reports no O2.',
    'Table reports no pressure.',
    'Table reports no numeric test conditions.',
  ],
};

export default map;
