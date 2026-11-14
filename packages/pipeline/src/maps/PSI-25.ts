// column map: proposed by agent, needs human check
import type { ColumnMap } from './types.ts';

const map: ColumnMap = {
  accession: 'PSI-25',
  fileName: 'PSI-25_Experimental_table_BASS-II.csv',
  sha256: '71e792bf6b5fb5ea620c5dd70fbbac05515992e12aefcf5dff47312caa48c042',
  sha12: '71e792bf6b5f',
  fuelPhase: 'solid',
  gravity: 'microgravity',
  o2Location: 'ambient',
  rowFilter: 'any',
  testLabel: { column: 'Test #' },
  date: { format: 'mdy', columns: ['Date'] },
  fuelName: 'Fuel Sample Material',
  size: { kind: 'none' },
  o2: { column: 'Calibrated  initial O2 % by vol', unit: 'percent' },
  o2Final: { column: 'Calibrated final O2 % by vol', unit: 'percent' },
  caveats: [
    'Post-test O2 is a measurement, not a condition.',
    'Table reports no pressure.',
    'Flow restrictor setting is not a cabin flow.',
    'Material text carries sample geometry and size; those are not split into fields.',
  ],
};

export default map;
