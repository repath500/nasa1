// column map: proposed by agent, needs human check
import type { ColumnMap } from './types.ts';

const map: ColumnMap = {
  accession: 'PSI-102',
  fileName: 'PSI-102_Experimental_table_SAME.csv',
  sha256: '268d1e121d2f211b124407dd32b9475617bd269ede2c2d1749441da3e949a2af',
  sha12: '268d1e121d2f',
  fuelPhase: 'solid',
  gravity: 'microgravity',
  o2Location: 'ambient',
  rowFilter: 'any',
  testLabel: { column: 'Sample #' },
  fuelName: 'Sample Material',
  fuelNameTransform: 'before-colon',
  size: { kind: 'none' },
  flow: { column: 'Air Flow (cm/s)', unit: 'cm/s' },
  caveats: [
    'Table reports no O2.',
    'Table reports no pressure.',
    'Rows 5 to 8 carry no numeric values; their conditions are not inferred.',
  ],
};

export default map;
