// column map: proposed by agent, needs human check
import type { ColumnMap } from './types.ts';

const map: ColumnMap = {
  accession: 'PSI-98',
  fileName: 'PSI-98_Experimental_table_SAFFIRE-1.csv',
  sha256: 'c01f29c62455f0a3b512290ab85e5687ecded326733189f002f580368402308d',
  sha12: 'c01f29c62455',
  fuelPhase: 'solid',
  gravity: 'microgravity',
  o2Location: 'ambient',
  rowFilter: 'saffire',
  testLabel: { column: 'Sample Number' },
  fuelName: 'Material',
  size: {
    kind: 'saffire-dims',
    columns: ['Sample Thickness (cm)', 'Sample Length (cm)', 'Sample Width (cm)'],
  },
  o2: { column: 'Percent O2', unit: 'percent' },
  flow: { column: 'Air Flow (cm/s)', unit: 'cm/s' },
  caveats: [
    'Table reports no pressure.',
    'Flow direction is a test configuration, not a cabin condition.',
    'Length and width are swapped relative to Saffire-III in the source table.',
  ],
};

export default map;
