import { Link } from 'react-router-dom';
import { Sheet } from '../../components/Sheet';
import { useAtlas } from '../../state/store';
import type { Narration } from './useNarration';
import { fmtTime } from './useNarration';

const NUM = /(\d[\d.,]*%?)/g;

/** Transcript drawer: every sentence seeks, numerals are set in mono, and each segment lists the sources behind its numbers. */
export function Transcript({ open, onOpenChange, n }: { open: boolean; onOpenChange: (o: boolean) => void; n: Narration }) {
  const m = n.manifest;
  const select = (id: string) => useAtlas.getState().set({ selectedRowId: id, panelTab: 'selection' });
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Transcript" description={m?.disclosure}>
      {!m ? <p className="text-muted">No overview is loaded.</p> : m.segments.map((seg, si) => (
        <section key={seg.id} className="mb-6" aria-labelledby={`seg-${seg.id}`}>
          <h3 id={`seg-${seg.id}`} className="mb-2 text-sm font-semibold">{seg.title}</h3>
          <p className="leading-relaxed">
            {n.sentences.filter((s) => s.seg === si).map((s, i) => {
              const active = n.position >= s.start && n.position < s.end;
              return (
                <button key={i} type="button" onClick={() => n.seek(s.start)} aria-current={active ? 'true' : undefined}
                  className={`mr-1 inline cursor-pointer border-0 bg-transparent p-0 text-left align-baseline hover:underline ${active ? 'text-accent' : 'text-ink'}`} title={`Play from ${fmtTime(s.start)}`}>
                  {s.text.split(NUM).map((part, k) => (k % 2 ? <span key={k} className="num underline decoration-dotted underline-offset-4">{part}</span> : part))}
                </button>
              );
            })}
          </p>
          {seg.claimIds.length > 0 && (
            <p className="mono mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">Sources:
              {seg.claimIds.map((id) => /^PSI-\d+:\d+$/.test(id)
                ? <button key={id} type="button" onClick={() => select(id)} className="border-0 bg-transparent p-0 text-accent underline">{id}</button>
                : /^PSI-\d+$/.test(id) ? <Link key={id} to={`/study/${id}`}>{id}</Link> : <span key={id}>{id}</span>)}
            </p>
          )}
        </section>
      ))}
    </Sheet>
  );
}
