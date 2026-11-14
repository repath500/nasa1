// column map: proposed by agent, needs human check
import type { ColumnMap } from './types.ts';

const map: ColumnMap = {
  accession: 'PSI-100',
  fileName: 'PSI-100_Experimental_table_SAFFIRE-3.csv',
  sha256: '4d3c717ec20dd0247db670b2784a9fd7d746788bc54a936f80693e48eb8cd117',
  sha12: '4d3c717ec20d',
  fuelPhase: 'solid',
  gravity: 'microgravity',
  o2Location: 'ambient',
  rowFilter: 'saffire',
  testLabel: { column: 'Sample Number' },
  fuelName: 'Material',
  size: { kind: 'saffire-dims', columns: ['Sample Thickness', 'Sample Length', 'Sample Width'] },
  flow: { column: 'Air Flow', unit: 'cm/s' },
  caveats: [
    'Table reports no O2.',
    'Table reports no pressure.',
    'Length and width are swapped relative to Saffire-I in the source table.',
  ],
};

export default map;
