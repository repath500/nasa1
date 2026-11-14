/**
 * Attribution data for the Credits page. PSI facts are copied from the investigation JSON in
 * research/flame/samples/psi_json (title, DOI, version, modified date, licence CC0-1.0).
 * NTRS determinations are copied from the NTRS metadata in research/flame/samples/ntrs.
 */
export interface PsiCredit { accession: string; acronym: string; title: string; doi: string; version: number; modified: string; role: string }
export const PSI_CREDITS: PsiCredit[] = [
  { accession: 'PSI-98', acronym: 'SAFFIRE-I', title: 'Spacecraft Fire Safety Experiment-I', doi: '10.60555/0t15-1z43', version: 4, modified: '03-Jun-2025', role: 'core' },
  { accession: 'PSI-99', acronym: 'SAFFIRE-II', title: 'Spacecraft Fire Experiment-II', doi: '10.60555/2chp-m469', version: 5, modified: '04-Jun-2025', role: 'core' },
  { accession: 'PSI-100', acronym: 'SAFFIRE-III', title: 'Spacecraft Fire Experiment-III', doi: '10.60555/040q-4h36', version: 4, modified: '05-Jun-2025', role: 'core' },
  { accession: 'PSI-26', acronym: 'BASS', title: 'Burning and Suppression of Solids', doi: '10.60555/58h4-dy80', version: 4, modified: '19-Mar-2025', role: 'core' },
  { accession: 'PSI-25', acronym: 'BASS-II', title: 'Burning and Suppression of Solids - II', doi: '10.60555/4qc4-de67', version: 4, modified: '24-Nov-2025', role: 'core' },
  { accession: 'PSI-69', acronym: 'FLEX', title: 'Flame Extinguishment Experiment', doi: '10.60555/mbq8-0451', version: 5, modified: '06-Jun-2025', role: 'core' },
  { accession: 'PSI-102', acronym: 'SAME', title: 'Smoke and Aerosol Measurement Experiment', doi: '10.60555/gd4k-8h62', version: 4, modified: '02-Jun-2025', role: 'core' },
  { accession: 'PSI-101', acronym: 'SAME-R', title: 'Smoke Aerosol Measurement Experiment-Reflight', doi: '10.60555/2np7-jv14', version: 4, modified: '02-Jun-2025', role: 'core' },
  { accession: 'PSI-107', acronym: 'SPICE', title: 'Smoke Point In Co-flow Experiment', doi: '10.60555/9kbh-e962', version: 4, modified: '02-Jun-2025', role: 'core' },
  { accession: 'PSI-20', acronym: 'ACME BRE', title: 'Advanced Combustion via Microgravity Experiments - Burning Rate Emulator', doi: '10.60555/vb93-3y72', version: 4, modified: '05-Jun-2025', role: 'core' },
  { accession: 'PSI-159', acronym: 'ACME CFI-G', title: 'Advanced Combustion via Microgravity Experiments / Cool Flames Investigation with Gases', doi: '10.60555/cyt1-kh64', version: 1, modified: '20-Nov-2025', role: 'reserve' },
  { accession: 'PSI-47', acronym: 'DAFT / DAFT-2', title: 'Dust and Aerosol Measurement Feasibility Test / Dust and Aerosol Measurement Feasibility Test-2', doi: '10.60555/ztgj-d202', version: 5, modified: '02-Jun-2025', role: 'reserve' },
];

export interface NtrsCredit { id: string; title: string; authors: string; year: string; kind: string; determination: string; use: string }
export const NTRS_CREDITS: NtrsCredit[] = [
  { id: '20180004258', title: 'Spacecraft Fire Safety: Protecting Vehicles and Crews on Long-Duration Exploration Missions', authors: 'Ruff, G. A.', year: '2017', kind: 'Presentation, NASA Glenn Research Center', determination: 'GOV_PUBLIC_USE_PERMITTED', use: 'Source of the exploration atmosphere preset and the cabin flow band. Short verbatim quotes allowed.' },
  { id: '20140011099', title: 'Thickness and Fuel Preheating Effects on Material Flammability in Microgravity from the BASS Experiment', authors: 'Ferkul, P. V., Olson, S. L., Takahashi, F., Endo, M.', year: '2013', kind: 'Presentation', determination: 'PUBLIC_USE_PERMITTED', use: 'BASS interpretation. Short verbatim quotes allowed.' },
  { id: '20200000361', title: 'Solid Fuel Ignition and Extinction (SoFIE) Project on ISS', authors: 'Ferkul, P., Brown, L., Mroczka, C., Bhattacharjee, S.', year: '2019', kind: 'Presentation', determination: 'PUBLIC_USE_PERMITTED', use: 'Literature lead about work not in PSI. Short verbatim quotes allowed.' },
  { id: '20150023456', title: 'Detailed Results from the Flame Extinguishment Experiment (FLEX) March 2009 to December 2011', authors: 'Dietrich, D. L., Ferkul, P. V., Bryg, V. M., Nayagam, M. V.', year: '2015', kind: 'Technical publication', determination: 'PUBLIC_USE_PERMITTED', use: 'FLEX interpretation. Short verbatim quotes allowed.' },
  { id: '20210011385', title: 'Burning and Suppression of Solids-II (BASS-II) Summary Report', authors: 'Olson, S. L., Ferkul, P. V., Bhattacharjee, S., Miller, F. J.', year: '2021', kind: 'NASA technical memorandum', determination: 'GOV_PERMITTED', use: 'Paraphrase only, labelled "Paraphrase (team), not quoted".' },
  { id: '20210022402', title: 'Topical: Solid Fuel Combustion in Partial and Micro-Gravity', authors: 'Gollner, M., Wichman, I., Liao, Y.-T., Carmignani, L.', year: '2021', kind: 'White paper', determination: 'MAY_INCLUDE_COPYRIGHT_MATERIAL', use: 'Not used. Held back until a human reads its copyright notice.' },
];

export interface SoftwareCredit { name: string; licence: string; note?: string }
export const SOFTWARE_CREDITS: SoftwareCredit[] = [
  { name: 'React and React DOM 18', licence: 'MIT' },
  { name: 'React Router 6', licence: 'MIT' },
  { name: 'Vite 6', licence: 'MIT' },
  { name: 'TypeScript 5', licence: 'Apache-2.0' },
  { name: 'Tailwind CSS 4', licence: 'MIT' },
  { name: 'Zustand 5', licence: 'MIT' },
  { name: 'Motion 11', licence: 'MIT' },
  { name: 'Radix UI primitives', licence: 'MIT' },
  { name: 'Phosphor Icons', licence: 'MIT' },
  { name: 'd3-zoom, d3-scale, d3-quadtree, d3-selection', licence: 'ISC' },
  { name: 'cmdk', licence: 'MIT' },
  { name: 'sonner', licence: 'MIT' },
  { name: 'zod 3', licence: 'MIT' },
  { name: 'qrcode-generator 1.4.4', licence: 'MIT', note: 'draws the QR code on the Gap Brief' },
  { name: 'Vitest', licence: 'MIT', note: 'tests only' },
  { name: 'Playwright', licence: 'Apache-2.0', note: 'tests only' },
  { name: 'axe-core', licence: 'MPL-2.0', note: 'tests only' },
  { name: 'Geist and JetBrains Mono fonts', licence: 'SIL OFL 1.1', note: 'self hosted with licence files' },
  { name: 'Fire Atlas source code', licence: 'Apache-2.0 (proposed, repository decision D10)' },
];
