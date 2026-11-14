import { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import type { RejectedCell } from '@fire/contracts';
import { useCorpus } from '../../data/useCorpus';
import { NumberTween } from '../../components/NumberTween';
import { Chip } from '../../components/Chip';
import { Reveal } from './Reveal';

const WHY: Record<RejectedCell['reason'], string> = {
  'o2-out-of-range': 'O₂ outside 0 to 100 percent', 'pressure-nonpositive': 'pressure at or below zero', 'flow-negative': 'negative flow speed',
  unparseable: 'not a readable number', 'post-test-not-condition': 'post-test value, not a test condition', other: 'failed a range check',
};

/** Pick up to six real rejects, one per reason first so the list shows different kinds of failure. */
function pick(rejects: RejectedCell[]): RejectedCell[] {
  const seen = new Set<string>(); const first: RejectedCell[] = []; const rest: RejectedCell[] = [];
  for (const r of rejects) (seen.has(r.reason) ? rest : first).push(r), seen.add(r.reason);
  return [...first, ...rest].slice(0, 6);
}

/** Layout family: full-width teleprinter terminal. Real rejected cells from corpus.rejects, typed out on first view. */
export function Caught() {
  const state = useCorpus(); const reduce = useReducedMotion(); const c = state.status === 'ready' ? state.corpus : null;
  const ref = useRef<HTMLPreElement>(null); const [shown, setShown] = useState(0); const [started, setStarted] = useState(false);
  const lines = useMemo(() => pick(c?.rejects ?? []).map((r) => `${r.accession.padEnd(8)} ${r.column.slice(0, 22).padEnd(22)} "${r.rawValue}"  REJECTED  ${WHY[r.reason]}  sha ${r.csvSha12}`), [c]);
  const text = lines.join('\n');
  useEffect(() => { const el = ref.current; if (!el) return; const io = new IntersectionObserver((e) => { if (e[0]?.isIntersecting) { setStarted(true); io.disconnect(); } }, { threshold: 0.5 }); io.observe(el); return () => io.disconnect(); }, []);
  useEffect(() => {
    if (!started) return; if (reduce) { setShown(text.length); return; }
    const t = setInterval(() => setShown((n) => { if (n >= text.length) { clearInterval(t); return n; } return n + 2; }), 16);
    return () => clearInterval(t);
  }, [started, reduce, text]);
  return (
    <Reveal aria-labelledby="caught-h" className="border-t border-hairline">
      <div className="mx-auto max-w-[1280px] px-4 py-20 md:px-8 lg:py-28">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <h2 id="caught-h" className="max-w-[16ch] text-4xl leading-[1.05] md:text-5xl">Caught by code.</h2>
          <p className="max-w-[48ch] text-muted">Some cells in the archive cannot be true. Code rejects them, says why, and keeps the source file hash, instead of quietly plotting them. These are real.</p>
        </div>
        <div className="lp-term mt-10">
          <div className="flex items-center justify-between gap-3 border-b border-[#2B323C] px-4 py-2 mono text-[12px] text-[#9AA1AB]">
            <span>corpus.rejects</span>
            <span className="flex items-center gap-3">{c?.fixture && <Chip tone="flag">FIXTURE</Chip>}<span className="text-[#E8EAED]"><NumberTween value={c?.rejects.length ?? 0} duration={0.9} /> rejected in total</span></span>
          </div>
          <pre ref={ref} aria-hidden className="mono m-0 min-h-[210px] overflow-x-auto whitespace-pre p-4 text-[12.5px] leading-7 md:text-[13.5px]">{lines.length ? <>{'>>> '}{text.slice(0, shown).split('\n').join('\n>>> ')}{shown < text.length && <span className="fa-caret" />}</> : '>>> no rejected cells in the loaded set'}</pre>
          <p className="sr-only">{lines.length ? lines.join('. ') : 'No rejected cells in the loaded set.'}</p>
        </div>
      </div>
    </Reveal>
  );
}
