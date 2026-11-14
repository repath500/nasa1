import type { Corpus, InvestigationCard, TestRow } from '@fire/contracts';

/** Citation text for PSI records (CC0-1.0). APA and BibTeX. */
function yearOfCard(card: InvestigationCard): string {
  const m = /(\d{4})/.exec(card.psiModified ?? '');
  return m ? (m[1] as string) : 'n.d.';
}
const doiUrl = (doi: string | null) => (doi ? `https://doi.org/${doi}` : null);
const accessed = (corpus: Corpus | null) => (corpus?.builtAt ? corpus.builtAt.slice(0, 10) : 'date not recorded');

export function apaCard(card: InvestigationCard, corpus: Corpus | null): string {
  const ver = card.psiVersion ? `, version ${card.psiVersion}` : '';
  const link = doiUrl(card.doi) ?? 'DOI not available';
  return `NASA Physical Sciences Informatics. (${yearOfCard(card)}). ${card.title} (${card.acronym}) [Data set, ${card.accession}${ver}]. NASA. ${link}. License ${card.license}. Accessed ${accessed(corpus)}.`;
}

export function apaRow(row: TestRow, card: InvestigationCard | undefined, corpus: Corpus | null): string {
  const base = card ? apaCard(card, corpus) : `NASA Physical Sciences Informatics. ${row.accession}.`;
  const label = row.testLabel ? ` (test ${row.testLabel})` : '';
  return `${base} Row ${row.rowIndex}${label}, source table SHA-256 ${row.csvSha12}.`;
}

const bibEscape = (s: string) => s.replace(/([&%$#_{}])/g, '\\$1');

export function bibtexCard(card: InvestigationCard, corpus: Corpus | null): string {
  const key = `${card.accession.replace('-', '')}_${card.acronym.replace(/[^A-Za-z0-9]/g, '')}`;
  const lines = [
    `@misc{${key},`,
    `  author = {{NASA Physical Sciences Informatics}},`,
    `  title = {${bibEscape(card.title)} (${bibEscape(card.acronym)})},`,
    `  year = {${yearOfCard(card)}},`,
    card.doi ? `  doi = {${card.doi}},` : null,
    card.doi ? `  url = {https://doi.org/${card.doi}},` : null,
    `  note = {${card.accession}${card.psiVersion ? `, version ${card.psiVersion}` : ''}. License ${card.license}. Accessed ${accessed(corpus)}},`,
    `}`,
  ];
  return lines.filter((l): l is string => l !== null).join('\n');
}

export function bibtexRow(row: TestRow, card: InvestigationCard | undefined, corpus: Corpus | null): string {
  const key = `${row.accession.replace('-', '')}_row${row.rowIndex}`;
  const lines = [
    `@misc{${key},`,
    `  author = {{NASA Physical Sciences Informatics}},`,
    `  title = {${bibEscape(card?.title ?? row.accession)}, table row ${row.rowIndex}${row.testLabel ? `, test ${bibEscape(row.testLabel)}` : ''}},`,
    `  year = {${card ? yearOfCard(card) : 'n.d.'}},`,
    card?.doi ? `  doi = {${card.doi}},` : null,
    `  note = {${row.accession}, source table SHA-256 ${row.csvSha12}. Accessed ${accessed(corpus)}},`,
    `}`,
  ];
  return lines.filter((l): l is string => l !== null).join('\n');
}

export function bibtexAll(cards: InvestigationCard[], corpus: Corpus | null): string {
  return cards.map((c) => bibtexCard(c, corpus)).join('\n\n') + '\n';
}
