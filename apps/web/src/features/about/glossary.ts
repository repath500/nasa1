/**
 * Glossary content (SPEC section 7). W1 supplies the hover component; this file is the words.
 * Plain words first, precise words second. No claims about any atmosphere.
 */
export interface GlossaryEntry {
  id: string;
  term: string;
  /** One sentence for the hover card. */
  short: string;
  /** Fuller text for the Method page. */
  long: string;
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    id: 'microgravity',
    term: 'microgravity',
    short: 'The near weightless condition on the ISS, where hot gas does not rise.',
    long: 'On the International Space Station objects and gases feel almost no net weight because the station is in continuous free fall. Hot gas does not rise, so a flame loses the buoyancy driven flow that shapes it on Earth. A candle flame becomes a dim blue sphere. Every PSI combustion row used here comes from microgravity tests. Partial-gravity combustion data, such as for the Moon: none in PSI.',
  },
  {
    id: 'psi',
    term: 'PSI',
    short: 'NASA Physical Sciences Informatics, the open data repository behind every row.',
    long: 'Physical Sciences Informatics is NASA\'s repository for data and metadata from physical science investigations. Each investigation has an accession such as PSI-69, a DOI, a version and a licence. The combustion records used here are CC0-1.0.',
  },
  {
    id: 'o2-fraction',
    term: 'O₂ fraction',
    short: 'The share of oxygen in the air by volume, in percent. Earth air is about 21%.',
    long: 'Oxygen fraction is the share of the gas that is oxygen, written in percent by volume. Some tables give a mole fraction, which this atlas converts to percent. It is separate from total pressure. Two atmospheres with the same O₂ fraction can have very different pressures.',
  },
  {
    id: 'partial-pressure',
    term: 'partial pressure',
    short: 'O₂ fraction times total pressure. Equal partial pressure is not equal flammability.',
    long: 'The partial pressure of oxygen is the O₂ fraction multiplied by the total pressure. For example 30% O₂ at 70.3 kPa gives about 21.1 kPa, close to Earth air at 21% and 101.3 kPa, which gives about 21.3 kPa. The atlas shows this as context only. Matching partial pressure does not make two atmospheres equally flammable.',
  },
  {
    id: 'flow-direction',
    term: 'concurrent / opposed flow',
    short: 'Concurrent: air flows the same way the flame spreads. Opposed: it flows against it.',
    long: 'In concurrent flow the air moves in the same direction as the flame front, in opposed flow it moves against it. The two behave differently, and some tables record which one was used. Flow speed matters too: ISS ventilation is described as around 15 to 20 cm/s in the NASA slides cited on the Credits page.',
  },
  {
    id: 'burner-stream',
    term: 'burner stream',
    short: 'Gas flowing out of a burner. Its O₂ is not the air of a cabin.',
    long: 'In some experiments, such as the ACME Cool Flames Investigation with Gases, oxygen flows out of a burner at high concentration while the chamber holds other gas. That O₂ value describes the burner stream, not the cabin air. These rows are drawn as hollow marks and left out of every count.',
  },
  {
    id: 'extinction-diameter',
    term: 'visible flame extinction diameter',
    short: 'In FLEX, the droplet diameter at which the visible flame disappeared.',
    long: 'FLEX tables report the visible flame extinction diameter: the droplet size when the visible flame was no longer seen. It is a measured outcome of one test, not a boundary of where burning stops, and this atlas never presents it as one.',
  },
  {
    id: 'evidence-tier',
    term: 'evidence tier',
    short: 'A 0 to 3 label set by humans, with a written one line rule per tier.',
    long: 'The evidence tier says how directly a study\'s data speaks to a habitat question. It is assigned by people with a written rule for each tier, never by a model. A study that has not been reviewed shows "not reviewed" instead of a number.',
  },
  {
    id: 'overlap',
    term: 'overlap (covers, near, unknown)',
    short: 'Computed by code: does a test row sit inside the box around the selected air?',
    long: 'A row covers the selected air when its O₂ and its pressure both fall inside the tolerance window. It is near on one axis when only one does. If the table does not report O₂ or pressure the row is unknown. Unknown is never counted as a mismatch and never drawn at zero.',
  },
];

export const GLOSSARY_BY_ID = new Map(GLOSSARY.map((g) => [g.id, g]));
