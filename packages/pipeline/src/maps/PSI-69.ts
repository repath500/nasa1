// column map: proposed by agent, needs human check
import type { ColumnMap } from './types.ts';

const map: ColumnMap = {
  accession: 'PSI-69',
  fileName: 'PSI-69_Experimental_table_FLEX.csv',
  sha256: '37c88ce8ae9391b7544ff630a45ce87543d04d317cdbfbed104fe7d5c27e1b96',
  sha12: '37c88ce8ae93',
  fuelPhase: 'liquid-droplet',
  gravity: 'microgravity',
  o2Location: 'ambient',
  rowFilter: 'any',
  testLabel: { column: 'FLEX Test #', prefix: '#' },
  date: { format: 'mdy', columns: ['Test Date'] },
  fuelName: 'Fuel',
  size: { kind: 'flex-droplet', columns: ['Droplet initial diameter; mm'] },
  o2: { column: 'O initial ambient composition; mole fraction', unit: 'fraction' },
  pressure: { column: 'Ambient pressure; mmHg', unit: 'mmHg' },
  caveats: [
    'O2 is a mole fraction in the source and is converted to percent.',
    'Pressure is mmHg in the source and is converted to kPa.',
    'Table reports no flow.',
    'One row reports 0 mmHg and that pressure cell is rejected.',
  ],
};

export default map;
