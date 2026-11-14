import type { ColumnMap } from './types.ts';
import psi98 from './PSI-98.ts';
import psi99 from './PSI-99.ts';
import psi100 from './PSI-100.ts';
import psi26 from './PSI-26.ts';
import psi25 from './PSI-25.ts';
import psi69 from './PSI-69.ts';
import psi102 from './PSI-102.ts';
import psi101 from './PSI-101.ts';
import psi107 from './PSI-107.ts';
import psi20 from './PSI-20.ts';
import psi159 from './PSI-159.ts';
import psi47 from './PSI-47.ts';

/** Core set then reserves, in corpus order (SPEC.md section 10.1). */
export const TABLE_MAPS: ColumnMap[] = [
  psi98,
  psi99,
  psi100,
  psi26,
  psi25,
  psi69,
  psi102,
  psi101,
  psi107,
  psi20,
  ...psi159,
  psi47,
];

export const CORE_ACCESSIONS = [
  'PSI-98',
  'PSI-99',
  'PSI-100',
  'PSI-26',
  'PSI-25',
  'PSI-69',
  'PSI-102',
  'PSI-101',
  'PSI-107',
  'PSI-20',
  'PSI-159',
  'PSI-47',
] as const;

export type { ColumnMap } from './types.ts';
