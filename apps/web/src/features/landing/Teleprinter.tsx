import { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { useCorpus } from '../../data/useCorpus';
import { Chip } from '../../components/Chip';

/** Spec-documented rejected cells (SPEC §10.2). Used only to fill when the loaded corpus does not carry them. */
const DOCUMENTED = [
  { accession: 'PSI-20', column: 'O2', raw: '3400%', why: 'O₂ outside 0 to 100 percent' },
  { accession: 'PSI-69', column: 'Ambient pressure', raw: '0', why: 'pressure at or below zero' },
  { accession: 'PSI-107', column: 'Flow', raw: '-5.92 cm/s', why: 'negative flow' },
];
const WHY: Record<string, string> = { 'o2-out-of-range': 'O₂ outside 0 to 100 percent', 'pressure-nonpositive': 'pressure at or below zero', 'flow-negative': 'negative flow', unparseable: 'not parseable' };

/** "Caught by code" teaser, typed out like a teleprinter when it scrolls into view. */
export function Teleprinter() {
  const state = useCorpus(); const reduce = useReducedMotion();
  const ref = useRef<HTMLPreElement>(null); const [shown, setShown] = useState(0); const [started, setStarted] = useState(false);
  const { lines, fixture } = useMemo(() => {
    const c = state.status === 'ready' ? state.corpus : null;
    const real = (c?.rejects ?? []).slice(0, 3).map((r) => ({ accession: r.accession, column: r.column, raw: r.rawValue, why: WHY[r.reason] ?? r.note }));
    const merged = [...real]; for (const d of DOCUMENTED) if (merged.length < 3 && !merged.some((m) => m.raw === d.raw)) merged.push(d);
    return { lines: merged.map((m) => `${m.accession}  ${m.column}  "${m.raw}"  rejected: ${m.why}`), fixture: !c || c.fixture };
  }, [state]);
  const text = lines.join('\n');
  useEffect(() => { const el = ref.current; if (!el) return; const io = new IntersectionObserver((e) => { if (e[0]?.isIntersecting) { setStarted(true); io.disconnect(); } }, { threshold: 0.4 }); io.observe(el); return () => io.disconnect(); }, []);
  useEffect(() => {
    if (!started) return; if (reduce) { setShown(text.length); return; }
    const t = setInterval(() => setShown((n) => { if (n >= text.length) { clearInterval(t); return n; } return n + 1; }), 22);
    return () => clearInterval(t);
  }, [started, reduce, text]);
  return (
    <section aria-labelledby="caught-h" className="border-t border-hairline">
      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-16 lg:grid-cols-[1fr_1.4fr] lg:py-24">
        <div>
          <h2 id="caught-h" className="text-3xl md:text-4xl">Caught by code.</h2>
          <p className="mt-4 max-w-[44ch] text-muted">Some cells in the archive cannot be true. Code rejects them with a reason and keeps the source hash, instead of quietly plotting them.</p>
          {fixture && <p className="mt-3"><Chip tone="flag">FIXTURE</Chip></p>}
        </div>
        <div className="border border-hairline bg-bg p-4">
          <pre ref={ref} className="mono m-0 overflow-x-auto whitespace-pre-wrap text-[13px] leading-7 text-ink" aria-hidden>{text.slice(0, shown)}{shown < text.length && <span className="fa-caret" />}</pre>
          <p className="sr-only">{lines.join('. ')}</p>
        </div>
      </div>
    </section>
  );
}
