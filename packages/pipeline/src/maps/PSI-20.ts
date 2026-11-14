// column map: proposed by agent, needs human check
import type { ColumnMap } from './types.ts';

const map: ColumnMap = {
  accession: 'PSI-20',
  fileName: 'PSI-20_Experimental_table_ACME_BRE.csv',
  sha256: '4aa5d3f98708ceacced5c620d46858b9965f8d4d941b203229f46467d53e5ab7',
  sha12: '4aa5d3f98708',
  fuelPhase: 'gas',
  gravity: 'microgravity',
  o2Location: 'ambient',
  rowFilter: 'any',
  date: { format: 'bre', columns: ['Year', 'Month', 'Date'] },
  fuelName: 'Fuel Bottle',
  size: { kind: 'burner', columns: ['Burner Size (mm)'] },
  o2: { column: 'Oxygen Conc (percent)', unit: 'percent', approxDefault: true },
  caveats: [
    'Table reports no pressure; chamber pressure is not identified.',
    'O2 cells list several approximate concentrations; the stored range is their min and max.',
    '3400% and 2100% cells are rejected.',
  ],
};

export default map;
