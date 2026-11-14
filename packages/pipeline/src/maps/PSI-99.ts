// column map: proposed by agent, needs human check
import type { ColumnMap } from './types.ts';

const map: ColumnMap = {
  accession: 'PSI-99',
  fileName: 'PSI-99_Experimental_table_SAFFIRE-2.csv',
  sha256: '3c24390b9ef86f3d1ebaab911a1a3cc95a8759aebf42062371370e6d4b31b8ac',
  sha12: '3c24390b9ef8',
  fuelPhase: 'solid',
  gravity: 'microgravity',
  o2Location: 'ambient',
  rowFilter: 'saffire',
  testLabel: { column: 'Sample Number' },
  fuelName: 'Material',
  size: {
    kind: 'saffire-dims',
    columns: ['Samle Thickness', 'Sample Length', 'Sample Width (cm)'],
  },
  o2: { column: 'Percent O2 (Note 1)', unit: 'percent' },
  flow: { column: 'Air Flow (cm/s)', unit: 'cm/s' },
  caveats: [
    'Table reports no pressure.',
    'Saffire-II 1-g comparison columns are not microgravity conditions.',
    'O2 values are derived in the source from CO2 production and referenced to the ISS initial O2.',
  ],
};

export default map;
