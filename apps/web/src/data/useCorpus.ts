import { useEffect, useState } from 'react';
import type { Corpus } from '@fire/contracts';

type CorpusState = { status: 'loading' } | { status: 'ready'; corpus: Corpus } | { status: 'error'; message: string };
let cache: Promise<Corpus> | null = null;

async function load(): Promise<Corpus> {
  for (const url of ['/data/corpus.v1.json', '/data/corpus.fixture.json']) {
    const res = await fetch(url).catch(() => null);
    if (res?.ok) return (await res.json()) as Corpus;
  }
  throw new Error('Reviewed records could not be loaded.');
}

/** SPEC §13: loads the corpus once (real first, fixture fallback). Hash verification lands with @fire/core. */
export function useCorpus(): CorpusState {
  const [state, setState] = useState<CorpusState>({ status: 'loading' });
  useEffect(() => {
    cache ??= load();
    cache.then((corpus) => setState({ status: 'ready', corpus }), (e: Error) => setState({ status: 'error', message: e.message }));
  }, []);
  return state;
}
