import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PushPin, Trash } from '@phosphor-icons/react';
import { useAtlas } from '../../state/store';
import { useAtlasModel } from '../atlas/data';
import { Banner, Btn, EmptyState, IconBtn, Skeleton, ErrorState } from '../atlas/_ui';
import { FREE_NOTE_LIMIT, addNote, removeNote, updateNote, useNotes } from './notesStore';

export default function NotesTab() {
  const model = useAtlasModel();
  const notes = useNotes();
  const plan = useAtlas((s) => s.license.plan);
  const selected = useAtlas((s) => s.selectedRowId);
  const set = useAtlas((s) => s.set);
  const [text, setText] = useState('');
  const limited = plan === 'explorer';
  const full = limited && notes.length >= FREE_NOTE_LIMIT;

  if (model.status === 'loading') return <Skeleton rows={3} height={48} label="Loading notes" />;
  if (model.status === 'error') return <ErrorState message={model.message} stillWorks="notes saved in this browser are still listed once data loads." onRetry={() => window.location.reload()} />;

  const rowFor = (id: string | null) => (id ? model.corpus?.rows.find((r) => r.id === id) : undefined);
  const add = (pin: boolean) => {
    if (full) return;
    if (!pin && text.trim() === '') return;
    addNote({ rowId: selected, accession: selected ? selected.split(':')[0] ?? null : null, text: text.trim() });
    setText('');
  };

  return (
    <>
      <div className="fa-strip__line" style={{ justifyContent: 'space-between' }}>
        <span className="fa-mono" style={{ fontSize: 12 }}>
          {limited ? `${notes.length} of ${FREE_NOTE_LIMIT} notes used` : `${notes.length} notes`}
        </span>
        <span className="fa-muted" style={{ fontSize: 12 }}>Kept in this browser. Included in the Gap Brief.</span>
      </div>
      {full && (
        <Banner tone="accent">
          The Explorer plan holds {FREE_NOTE_LIMIT} notes. <Link to="/pricing">See plans</Link> for unlimited notes. Evidence, rankings and printing stay free.
        </Banner>
      )}
      <form className="fa-sec" onSubmit={(e) => { e.preventDefault(); add(false); }}>
        <label htmlFor="fa-note-text" className="fa-muted" style={{ fontSize: 12 }}>
          {selected ? <>Note on source row <span className="fa-mono">{selected}</span></> : 'Note on the whole view (select a dot to attach it to a row)'}
        </label>
        <textarea
          id="fa-note-text" className="fa-input" rows={3} value={text} onChange={(e) => setText(e.target.value)} maxLength={600} disabled={full}
          style={{ padding: 8, minHeight: 64, resize: 'vertical', fontFamily: 'Geist, system-ui, sans-serif', fontSize: 13 }}
        />
        <div className="fa-chips">
          <Btn type="submit" variant="primary" disabled={full || text.trim() === ''}>Add note</Btn>
          <Btn icon={<PushPin size={14} />} disabled={full || !selected} title={selected ? undefined : 'Select a dot on the map before pinning'} onClick={() => add(true)}>Pin selected row</Btn>
        </div>
      </form>
      {notes.length === 0 ? (
        <EmptyState title="No notes yet">Pin a source row or write a note. Notes travel with the Gap Brief so a reader sees why a row matters.</EmptyState>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 1, background: 'var(--fa-hair)', border: '1px solid var(--fa-hair)' }}>
          {notes.map((n) => {
            const r = rowFor(n.rowId);
            return (
              <li key={n.id} style={{ background: 'var(--fa-bg)', padding: 8, display: 'grid', gap: 6 }}>
                <div className="fa-strip__line" style={{ justifyContent: 'space-between' }}>
                  {n.rowId ? (
                    <button type="button" className="fa-chip fa-chip--edit" onClick={() => set({ selectedRowId: n.rowId })} aria-label={`Open source row ${n.rowId}`}>
                      <PushPin size={12} /> {n.rowId}{r?.testLabel ? ` · test ${r.testLabel}` : ''}
                    </button>
                  ) : <span className="fa-muted fa-mono" style={{ fontSize: 11 }}>whole view</span>}
                  <IconBtn label="Delete note" onClick={() => removeNote(n.id)}><Trash size={14} /></IconBtn>
                </div>
                <textarea aria-label={`Note text for ${n.rowId ?? 'whole view'}`} className="fa-input" rows={2} defaultValue={n.text} onBlur={(e) => { if (e.target.value !== n.text) updateNote(n.id, e.target.value); }} style={{ padding: 6, fontFamily: 'Geist, system-ui, sans-serif', fontSize: 13, resize: 'vertical' }} placeholder="Pinned row, no text" />
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
