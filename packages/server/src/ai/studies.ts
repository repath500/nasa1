import type { FuelPhase, Pillar } from '@fire/contracts';

/**
 * The server does not receive the corpus. RankRequest carries only a hash, so
 * the ladder judges the allowlisted core investigations from BUILD_PLAN §2.3.
 * TODO(contract): add an optional corpus/study list to RankRequest if the
 * client ever wants arbitrary corpora.
 */
export interface StudyMeta {
  accession: string;
  acronym: string;
  title: string;
  pillar: Pillar;
  phases: FuelPhase[];
  gravity: string;
  hardware: string;
  objective: string;
}

export const CORE_STUDIES: StudyMeta[] = [
  {
    accession: 'PSI-98',
    acronym: 'Saffire-I',
    title: 'Spacecraft Fire Experiment I',
    pillar: 'suppression',
    phases: ['solid'],
    gravity: 'microgravity',
    hardware: 'Cygnus-Saffire',
    objective: 'Large-scale solid fuel flammability and spread in a spacecraft cargo vehicle.',
  },
  {
    accession: 'PSI-99',
    acronym: 'Saffire-II',
    title: 'Spacecraft Fire Experiment II',
    pillar: 'suppression',
    phases: ['solid'],
    gravity: 'microgravity',
    hardware: 'Cygnus-Saffire',
    objective: 'Solid fuel ignition and spread over varied sample materials in microgravity.',
  },
  {
    accession: 'PSI-100',
    acronym: 'Saffire-III',
    title: 'Spacecraft Fire Experiment III',
    pillar: 'suppression',
    phases: ['solid'],
    gravity: 'microgravity',
    hardware: 'Cygnus-Saffire',
    objective: 'Solid fuel flame growth and extinction in low-velocity spacecraft air flow.',
  },
  {
    accession: 'PSI-26',
    acronym: 'BASS',
    title: 'Burning and Suppression of Solids',
    pillar: 'prevention',
    phases: ['solid'],
    gravity: 'microgravity',
    hardware: 'other',
    objective: 'Solid material ignition and suppression in microgravity using a glovebox flow duct.',
  },
  {
    accession: 'PSI-25',
    acronym: 'BASS-II',
    title: 'Burning and Suppression of Solids II',
    pillar: 'prevention',
    phases: ['solid'],
    gravity: 'microgravity',
    hardware: 'MSG-duct',
    objective: 'Solid fuel flammability limits and suppression behaviour across cabin-like oxygen levels.',
  },
  {
    accession: 'PSI-69',
    acronym: 'FLEX',
    title: 'Flame Extinguishment Experiment',
    pillar: 'suppression',
    phases: ['liquid-droplet'],
    gravity: 'microgravity',
    hardware: 'CIR-MDCA',
    objective: 'Droplet combustion and visible flame extinction in microgravity.',
  },
  {
    accession: 'PSI-102',
    acronym: 'SAME',
    title: 'Smoke Aerosol Measurement Experiment',
    pillar: 'detection',
    phases: ['aerosol'],
    gravity: 'microgravity',
    hardware: 'SAME-glovebox',
    objective: 'Smoke particle size and light scattering for spacecraft smoke detectors.',
  },
  {
    accession: 'PSI-101',
    acronym: 'SAME-R',
    title: 'Smoke Aerosol Measurement Experiment Reflight',
    pillar: 'detection',
    phases: ['aerosol'],
    gravity: 'microgravity',
    hardware: 'SAME-glovebox',
    objective: 'Repeat smoke aerosol measurements for detector calibration.',
  },
  {
    accession: 'PSI-107',
    acronym: 'SPICE',
    title: 'Structure and Liftoff in Combustion Experiment',
    pillar: 'fundamental',
    phases: ['gas', 'liquid-droplet'],
    gravity: 'microgravity',
    hardware: 'CIR-ACME',
    objective: 'Laminar gas jet flame structure and liftoff in microgravity.',
  },
  {
    accession: 'PSI-20',
    acronym: 'ACME BRE',
    title: 'Advanced Combustion via Microgravity Experiments, Burning Rate Emulator',
    pillar: 'prevention',
    phases: ['gas'],
    gravity: 'microgravity',
    hardware: 'CIR-ACME',
    objective: 'Burning rate of gaseous fuels over condensed fuel surfaces in microgravity.',
  },
];

export const studyByAccession = (accession: string): StudyMeta | null =>
  CORE_STUDIES.find((study) => study.accession === accession) ?? null;

export const allowedAccessions = (): string[] => CORE_STUDIES.map((study) => study.accession);
