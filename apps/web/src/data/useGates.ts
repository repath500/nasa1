import { useEffect, useState } from 'react';

export interface GateStatus {
  approver: string;
  decision: 'go';
  corpusHash: string;
}

export interface GatesState {
  loading: boolean;
  k5: GateStatus | null;
  d5: GateStatus | null;
}

async function loadGate(name: 'k5' | 'd5', corpusHash: string): Promise<GateStatus | null> {
  try {
    const response = await fetch(`/data/reviews/${name}.json`, { cache: 'no-store' });
    if (!response.ok || !(response.headers.get('content-type') ?? '').toLowerCase().includes('json')) return null;
    const value: unknown = await response.json();
    if (typeof value !== 'object' || value === null) return null;
    const gate = value as Record<string, unknown>;
    if (typeof gate.approver !== 'string' || !gate.approver.trim() || gate.decision !== 'go' || gate.corpusHash !== corpusHash) return null;
    return { approver: gate.approver, decision: 'go', corpusHash };
  } catch {
    return null;
  }
}

export function useGates(corpusHash: string): GatesState {
  const [state, setState] = useState<GatesState>({ loading: true, k5: null, d5: null });
  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, k5: null, d5: null });
    Promise.all([loadGate('k5', corpusHash), loadGate('d5', corpusHash)]).then(([k5, d5]) => {
      if (!cancelled) setState({ loading: false, k5, d5 });
    });
    return () => { cancelled = true; };
  }, [corpusHash]);
  return state;
}
