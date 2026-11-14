import { DEFAULT_PRIORITY, DEFAULT_TOLERANCES } from '@fire/contracts';
import type { Concern, Corpus, FuelPhase, Scenario } from '@fire/contracts';
import { baselineRankAll, overlap } from '@fire/core';

/** Facts computed by @fire/core from the corpus. Every numeral a narration states comes from here or the preset. */
export interface NarrationFacts {
  totalRows: number;
  covers: number;
  coversByPhase: Partial<Record<FuelPhase, number>>;
  nearO2Only: number;
  unknown: number;
  burnerExcluded: number;
  rejects: number;
  coverRowIds: string[];
  /** Unreviewed preview order (cards are metadata-only until humans review them). */
  previewTop3: string[];
}

export function computeNarrationFacts(corpus: Corpus, scenario: Scenario, concern: Concern): NarrationFacts {
  const facts: NarrationFacts = {
    totalRows: corpus.rows.length, covers: 0, coversByPhase: {}, nearO2Only: 0, unknown: 0, burnerExcluded: 0,
    rejects: corpus.rejects.length, coverRowIds: [], previewTop3: [],
  };
  for (const row of corpus.rows) {
    const cls = overlap(row, scenario, DEFAULT_TOLERANCES);
    if (cls === 'covers') {
      facts.covers++;
      facts.coverRowIds.push(row.id);
      facts.coversByPhase[row.fuel.phase] = (facts.coversByPhase[row.fuel.phase] ?? 0) + 1;
    } else if (cls === 'near-o2-only') facts.nearO2Only++;
    else if (cls === 'unknown') facts.unknown++;
    else if (cls === 'excluded-burner') facts.burnerExcluded++;
  }
  const acronym = new Map(corpus.cards.map((card) => [card.accession, card.acronym]));
  facts.previewTop3 = baselineRankAll(corpus.cards, corpus.rows, scenario, concern, DEFAULT_TOLERANCES, DEFAULT_PRIORITY)
    .slice(0, 3)
    .map((row) => acronym.get(row.accession) ?? row.accession);
  return facts;
}

let corpusCache: Promise<Corpus | null> | null = null;

/** Live narration (custom scenarios) reads the same static corpus the browser uses. Best effort, 3 s timeout. */
export function loadCorpusFromOrigin(origin: string | undefined): Promise<Corpus | null> {
  if (!origin) return Promise.resolve(null);
  corpusCache ??= fetch(new URL('/data/corpus.v1.json', origin), { signal: AbortSignal.timeout(3000) })
    .then(async (res) => (res.ok && (res.headers.get('content-type') ?? '').includes('json') ? ((await res.json()) as Corpus) : null))
    .catch(() => null)
    .then((corpus) => { if (!corpus) corpusCache = null; return corpus; });
  return corpusCache;
}
