// column map: proposed by agent, needs human check
import type { ColumnMap } from './types.ts';

const map: ColumnMap = {
  accession: 'PSI-101',
  fileName: 'PSI-101_Experimental_table_SAME-R.csv',
  sha256: '87164b7dc9168a4273c159f7a9f23699afbd06ad97b77974377e79b9bf8a3bef',
  sha12: '87164b7dc916',
  fuelPhase: 'solid',
  gravity: 'microgravity',
  o2Location: 'ambient',
  rowFilter: 'any',
  testLabel: { column: 'SAME Test #' },
  fuelName: 'Sample Type',
  size: { kind: 'none' },
  flow: { column: 'Inlet velocity (cm/s)', unit: 'cm/s' },
  caveats: [
    'Table reports no O2.',
    'Table reports no pressure.',
    'The Date column has no year, so test dates are left null.',
  ],
};

export default map;
