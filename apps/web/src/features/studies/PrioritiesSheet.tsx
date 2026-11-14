import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp } from '@phosphor-icons/react';
import { DEFAULT_PRIORITY, DEFAULT_TOLERANCES, type BaselineKey } from '@fire/contracts';
import { useAtlas } from '../../state/store';
import { Badge, Btn, IconBtn, Root, Sheet } from '../atlas/_ui';

const KEY_LABEL: Record<BaselineKey, { name: string; hint: string; by: 'human' | 'code' }> = {
  pillar_match: { name: 'Pillar match', hint: 'The study tag set by humans against your concern.', by: 'human' },
  covers_count: { name: 'Rows that cover this air', hint: 'Test rows with O₂ and pressure both inside the tolerance box.', by: 'code' },
  evidence_tier: { name: 'Evidence tier', hint: 'Set by humans with a written rule per tier. Unreviewed counts as lowest.', by: 'human' },
  near_count: { name: 'Rows near this air', hint: 'Test rows inside the box on one axis only.', by: 'code' },
};

function NumField({ id, label, value, min, max, step, onCommit, suffix }: { id: string; label: string; value: number; min: number; max: number; step: number; onCommit: (n: number) => void; suffix: string }) {
  const [text, setText] = useState(String(value));
  useEffect(() => { setText(String(value)); }, [value]);
  const n = Number(text);
  const bad = text.trim() === '' || !Number.isFinite(n) || n < min || n > max;
  return (
    <div className="fa-field" style={{ justifyContent: 'space-between', gap: 12 }}>
      <label htmlFor={id}>{label}</label>
      <span className="fa-field">
        <input
          id={id} className="fa-input fa-input--num" inputMode="decimal" value={text} aria-invalid={bad} aria-describedby={`${id}-h`}
          onChange={(e) => { setText(e.target.value); const v = Number(e.target.value); if (e.target.value.trim() !== '' && Number.isFinite(v) && v >= min && v <= max) onCommit(v); }}
          step={step}
        />
        <span className="fa-muted fa-mono">{suffix}</span>
      </span>
      <span id={`${id}-h`} className="fa-sr">{bad ? `Enter a number from ${min} to ${max}` : `Allowed range ${min} to ${max}`}</span>
    </div>
  );
}

/** "Ranking priorities" sheet (SPEC 3.6): reorder the four baseline keys, edit tolerances. PROPOSED until D5 is signed. */
export default function PrioritiesSheet({ open, onClose, d5Signed }: { open: boolean; onClose: () => void; d5Signed: boolean }) {
  const priority = useAtlas((s) => s.priority);
  const tol = useAtlas((s) => s.tolerances);
  const set = useAtlas((s) => s.set);
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= priority.length) return;
    const next = priority.slice();
    [next[i], next[j]] = [next[j] as BaselineKey, next[i] as BaselineKey];
    set({ priority: next });
  };
  const isDefault = priority.join() === DEFAULT_PRIORITY.join() && tol.o2PctPoints === DEFAULT_TOLERANCES.o2PctPoints && tol.pressureFrac === DEFAULT_TOLERANCES.pressureFrac && tol.flowFactor === DEFAULT_TOLERANCES.flowFactor;
  return (
    <Sheet
      open={open} onClose={onClose} title="Ranking priorities"
      footer={<><Btn disabled={isDefault} onClick={() => set({ priority: DEFAULT_PRIORITY, tolerances: DEFAULT_TOLERANCES })}>Reset to proposal</Btn><Btn variant="primary" onClick={onClose}>Done</Btn></>}
    >
      <Root>
        <div className="fa-chips">
          {d5Signed ? <Badge kind="reviewed" label="D5 SIGNED" hover="Priority order and tolerances were signed by a named human (data/reviews/d5.json)." /> : <Badge kind="proposed" hover="Proposed default (decision D5). The label stays until a human signs data/reviews/d5.json." />}
          <span className="fa-muted">The table re-sorts as you change these. Stored Jev answers are reused, so no model call is made.</span>
        </div>
        <section className="fa-sec" aria-labelledby="pr-order" style={{ marginTop: 12 }}>
          <h3 id="pr-order">Priority order, top is highest</h3>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 1, background: 'var(--fa-hair)', border: '1px solid var(--fa-hair)' }}>
            {priority.map((k, i) => (
              <li key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--fa-surface)' }}>
                <span className="fa-mono fa-muted" style={{ width: 18 }}>{i + 1}</span>
                <span style={{ flex: 1 }}>
                  <strong>{KEY_LABEL[k].name}</strong> <Badge kind={KEY_LABEL[k].by === 'code' ? 'code' : 'reviewed'} label={KEY_LABEL[k].by === 'code' ? 'CODE' : 'HUMAN TAG'} hover={KEY_LABEL[k].hint} />
                  <br /><span className="fa-muted" style={{ fontSize: 12 }}>{KEY_LABEL[k].hint}</span>
                </span>
                <IconBtn label={`Move ${KEY_LABEL[k].name} up`} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={14} /></IconBtn>
                <IconBtn label={`Move ${KEY_LABEL[k].name} down`} disabled={i === priority.length - 1} onClick={() => move(i, 1)}><ArrowDown size={14} /></IconBtn>
              </li>
            ))}
          </ol>
        </section>
        <section className="fa-sec" aria-labelledby="pr-tol" style={{ marginTop: 12 }}>
          <h3 id="pr-tol">Tolerances around the selected air</h3>
          <NumField id="tol-o2" label="O₂ window, percentage points" value={tol.o2PctPoints} min={0.5} max={20} step={0.5} suffix="points" onCommit={(n) => set({ tolerances: { ...tol, o2PctPoints: n } })} />
          <NumField id="tol-p" label="Pressure window" value={Math.round(tol.pressureFrac * 100)} min={1} max={60} step={1} suffix="%" onCommit={(n) => set({ tolerances: { ...tol, pressureFrac: n / 100 } })} />
          <NumField id="tol-f" label="Flow factor (shown only, not a ranking key)" value={tol.flowFactor} min={1} max={10} step={0.5} suffix="x" onCommit={(n) => set({ tolerances: { ...tol, flowFactor: n } })} />
          <p className="fa-muted" style={{ fontSize: 12 }}>A row counts as covering this air when its O₂ and its pressure both fall inside these windows. A row with no reported O₂ or pressure is counted as unknown, never as a mismatch.</p>
        </section>
      </Root>
    </Sheet>
  );
}
