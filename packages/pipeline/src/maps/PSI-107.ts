// column map: proposed by agent, needs human check
import type { ColumnMap } from './types.ts';

const map: ColumnMap = {
  accession: 'PSI-107',
  fileName: 'PSI-107_Experimental_table_Spice.csv',
  sha256: 'fb0d7e60cf5367afb429089e9901d27288f78038efd26c8de1db4fbe04117136',
  sha12: 'fb0d7e60cf53',
  fuelPhase: 'gas',
  gravity: 'microgravity',
  o2Location: 'ambient',
  rowFilter: 'any',
  fuelName: 'Fuel',
  size: { kind: 'nozzle', columns: ['Nozzle (mm)'] },
  flow: { column: 'Air Rate (cm/s)', unit: 'cm/s' },
  caveats: [
    'Table reports no O2.',
    'Table reports no pressure.',
    'The GMT date column is a mission day number, not a calendar date, so test dates are left null.',
    'Negative air-rate cells are rejected.',
  ],
};

export default map;
