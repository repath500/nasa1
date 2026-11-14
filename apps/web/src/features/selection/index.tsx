import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowsLeftRight, X } from '@phosphor-icons/react';
import type { FuelPhase, OverlapClass, TestRow } from '@fire/contracts';
import { useAtlas } from '../../state/store';
import { useAtlasModel } from '../atlas/data';
import { Badge, Btn, CopyBtn, EmptyState, ErrorState, Skeleton } from '../atlas/_ui';
import { OVERLAP_LABEL, PHASE_LABEL, csvCell } from '../atlas/format';
import { overlap } from '../atlas/science';

function toCsv(rows: TestRow[], cls: (r: TestRow) => OverlapClass): string {
  const head = ['row_id', 'accession', 'test', 'investigation_date', 'fuel', 'fuel_phase', 'o2_pct_min', 'o2_pct_max', 'o2_location', 'pressure_kpa_min', 'pressure_kpa_max', 'flow_cm_s_min', 'flow_cm_s_max', 'gravity', 'overlap_class', 'source_table_sha12'];
  const lines = rows.map((r) => [r.id, r.accession, r.testLabel, r.date, r.fuel.name, r.fuel.phase, r.o2Pct.min, r.o2Pct.max, r.o2Location, r.pressureKpa.min, r.pressureKpa.max, r.flowCmS.min, r.flowCmS.max, r.gravity, cls(r), r.csvSha12].map(csvCell).join(','));
  return [head.join(','), ...lines].join('\n') + '\n';
}

function Counts({ title, items }: { title: string; items: [string, number][] }) {
  return (
    <section className="fa-sec">
      <h3>{title}</h3>
      <div className="fa-kv" style={{ gridTemplateColumns: '1fr 64px' }}>
        {items.map(([k, n]) => (
          <div key={k} style={{ display: 'contents' }}>
            <dt>{k}</dt>
            <dd style={{ textAlign: 'right' }}>{n}</dd>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function SelectionTab() {
  const model = useAtlasModel();
  const ids = useAtlas((s) => s.boxSelection);
  const set = useAtlas((s) => s.set);
  const navigate = useNavigate();
  const tol = useAtlas((s) => s.tolerances);

  const rows = useMemo(() => {
    if (!model.corpus) return [];
    const want = new Set(ids);
    return model.corpus.rows.filter((r) => want.has(r.id));
  }, [model.corpus, ids]);

  const stats = useMemo(() => {
    const byAcc = new Map<string, number>();
    const byPhase = new Map<FuelPhase, number>();
    const byClass = new Map<OverlapClass, number>();
    for (const r of rows) {
      byAcc.set(r.accession, (byAcc.get(r.accession) ?? 0) + 1);
      byPhase.set(r.fuel.phase, (byPhase.get(r.fuel.phase) ?? 0) + 1);
      const c = overlap(r, model.scenario, tol);
      byClass.set(c, (byClass.get(c) ?? 0) + 1);
    }
    return { byAcc: [...byAcc].sort((a, b) => b[1] - a[1]), byPhase: [...byPhase], byClass: [...byClass] };
  }, [rows, model.scenario, tol]);

  if (model.status === 'loading') return <Skeleton rows={5} height={30} label="Loading selection" />;
  if (model.status === 'error') return <ErrorState message={model.message} stillWorks="the About and Method pages." onRetry={() => window.location.reload()} />;
  if (ids.length === 0) {
    return (
      <EmptyState title="No area selected">
        Hold Shift and drag on the map, or use the Select area tool, to count the tests inside a rectangle. The counts by investigation, fuel phase and overlap appear here.
      </EmptyState>
    );
  }
  if (rows.length === 0) {
    return (
      <EmptyState title="The selected rows are not in this corpus" actions={<Btn onClick={() => set({ boxSelection: [] })}>Clear selection</Btn>}>
        The selection holds {ids.length} row ids that this data file does not contain. It may come from a shared link built on a different corpus.
      </EmptyState>
    );
  }
  const accs = stats.byAcc.map(([a]) => a);
  return (
    <>
      <div className="fa-strip__line" style={{ justifyContent: 'space-between' }}>
        <span><strong className="fa-num">{rows.length}</strong> {rows.length === 1 ? 'test row' : 'test rows'} in the selected area <Badge kind="code" /></span>
        <Btn variant="quiet" icon={<X size={14} />} onClick={() => set({ boxSelection: [], panelTab: 'studies' })}>Clear selection</Btn>
      </div>
      <Counts title="By investigation" items={stats.byAcc.map(([a, n]) => [`${model.labelOf(a)} (${a})`, n])} />
      <Counts title="By fuel phase" items={stats.byPhase.map(([p, n]) => [PHASE_LABEL[p], n])} />
      <Counts title="By overlap with the selected air" items={stats.byClass.map(([c, n]) => [OVERLAP_LABEL[c], n])} />
      <div className="fa-chips">
        <CopyBtn label="Copy as CSV" copiedLabel="CSV copied" text={() => toCsv(rows, (r) => overlap(r, model.scenario, tol))} />
        <Btn
          icon={<ArrowsLeftRight size={14} />}
          disabled={accs.length < 2}
          title={accs.length < 2 ? 'Select rows from two investigations to compare them' : undefined}
          onClick={() => navigate(`/compare?a=${accs[0]}&b=${accs[1]}`)}
        >
          Open in compare
        </Btn>
      </div>
      {accs.length < 2 && <p className="fa-muted" style={{ fontSize: 12 }}>Open in compare needs rows from two investigations.</p>}
    </>
  );
}
