// column map: proposed by agent, needs human check
import type { ColumnMap } from './types.ts';

export const normal: ColumnMap = {
  accession: 'PSI-159',
  fileName: 'PSI-159_Experimental_table_CFI-G_Normal_Flames.csv',
  sha256: 'd95a621c3fbd27d204dd32ed29fa17d68f2b779d6a523cde8479ed7ebaa5251a',
  sha12: 'd95a621c3fbd',
  fuelPhase: 'gas',
  gravity: 'microgravity',
  o2Location: 'burner',
  rowFilter: 'any',
  testLabel: { column: 'Test' },
  fuelName: 'Fuel',
  size: { kind: 'burner' },
  o2: { column: 'XO2 before test', unit: 'fraction' },
  o2Final: { column: 'XO2 after test', unit: 'fraction' },
  pressure: { column: 'approx p (bar)', unit: 'bar' },
  caveats: [
    'Burner-stream O2: excluded from cabin overlap.',
    'O2 is a mole fraction in the source and is converted to percent.',
    'Post-test O2 is a measurement, not a condition.',
    'Pressure is bar in the source and is converted to kPa.',
    'Table reports no flow.',
    'Two tables share this accession; row indices for the second table are offset.',
  ],
};

export const inverse: ColumnMap = {
  accession: 'PSI-159',
  fileName: 'PSI-159_Experimental_table_CFI-G_Inverse_Flames.csv',
  sha256: 'd4d44f8b9896936728748e34d1b6ad0812032a92fa5289599b708c138e3a9b39',
  sha12: 'd4d44f8b9896',
  fuelPhase: 'gas',
  gravity: 'microgravity',
  o2Location: 'burner',
  rowFilter: 'any',
  testLabel: { column: 'Test' },
  fuelName: 'Fuel',
  size: { kind: 'burner' },
  o2: { column: 'XO2', unit: 'fraction' },
  pressure: { column: 'approx p (bar)', unit: 'bar' },
  caveats: [
    'Burner-stream O2: excluded from cabin overlap.',
    'O2 is a mole fraction in the source and is converted to percent.',
    'Post-test O2 is a measurement, not a condition.',
    'Pressure is bar in the source and is converted to kPa.',
    'Table reports no flow.',
    'Two tables share this accession; row indices for the second table are offset.',
  ],
};

const maps = [normal, inverse];
export default maps;
