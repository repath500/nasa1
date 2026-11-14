/** Default glossary text (SPEC §7). W5 may supply richer content later; this keeps terms consistent until then. */
export const GLOSSARY: Record<string, { term: string; text: string }> = {
  microgravity: { term: 'Microgravity', text: 'The near-weightless condition on orbit. Hot gas does not rise, so flames behave differently from flames on Earth.' },
  psi: { term: 'PSI', text: 'NASA Physical Sciences Informatics, the public archive that holds the microgravity combustion tables used here.' },
  'o2-fraction': { term: 'O₂ fraction', text: 'The share of the gas that is oxygen, in percent by volume. Earth air is about 21%.' },
  'partial-pressure': { term: 'Partial pressure', text: 'The pressure oxygen alone would exert. Equal O₂ partial pressure is context, not equal flammability.' },
  concurrent: { term: 'Concurrent flow', text: 'Air moves in the same direction the flame spreads.' },
  opposed: { term: 'Opposed flow', text: 'Air moves against the direction the flame spreads.' },
  'burner-stream': { term: 'Burner stream', text: 'Oxygen supplied through the burner rather than the surrounding air. These rows are shown hollow and left out of counts.' },
  'extinction-diameter': { term: 'Visible flame extinction diameter', text: 'The droplet diameter at which the flame is no longer seen. It is a measurement in one test, not a limit.' },
};
export type GlossaryKey = keyof typeof GLOSSARY;
