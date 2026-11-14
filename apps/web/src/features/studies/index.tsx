import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { ArrowDown, ArrowUp, CaretDown, CaretUp, Columns, Minus, Rows, Sliders } from '@phosphor-icons/react';
import type { BaselineRankRow, EvidenceRecord, InvestigationCard, JevJudgement } from '@fire/contracts';
import { useAtlas } from '../../state/store';
import { useAtlasModel, type AtlasModel } from '../atlas/data';
import { Badge, Banner, Btn, EmptyState, ErrorState, FixtureNote, Glyph, PillarChip, Skeleton } from '../atlas/_ui';
import { KIND_LABEL, NOT_AVAILABLE, OVERLAP_LABEL, OVERLAP_TITLE, fmtNum, plural } from '../atlas/format';
import { modalLevel } from './fixtures';
import PrioritiesSheet from './PrioritiesSheet';

type ColId = 'base' | 'jevrank' | 'delta' | 'study' | 'pillar' | 'tier' | 'overlap' | 'kind' | 'rel' | 'dir' | 'jpillar';
interface Col { id: ColId; label: string; title: string; w: string; jev?: boolean; sortable?: boolean; locked?: boolean; num?: boolean }
const COLS: Col[] = [
  { id: 'base', label: 'Base #', title: 'Rank from the transparent baseline (code)', w: '64px', sortable: true, num: true },
  { id: 'jevrank', label: 'Jev #', title: 'Rank from the Jev judgements, separate from the baseline', w: '56px', jev: true, sortable: true, num: true },
  { id: 'delta', label: 'Δ', title: 'Places Jev moved this study relative to the baseline', w: '64px', jev: true, num: true },
  { id: 'study', label: 'Study', title: 'Investigation', w: '230px', sortable: true, locked: true },
  { id: 'pillar', label: 'Pillar (human)', title: 'Fire-safety purpose tagged by a human', w: '112px' },
  { id: 'tier', label: 'Tier (human)', title: 'Evidence tier assigned by a human with a written rule', w: '86px', sortable: true, num: true },
  { id: 'overlap', label: 'Overlap (code)', title: 'Rows near the selected air, computed by code', w: '150px', sortable: true },
  { id: 'kind', label: 'Evidence kind', title: 'Kinds of source evidence available', w: '112px' },
  { id: 'rel', label: 'Jev relevance', title: 'Jev P(yes): do the described conditions cover this air closely enough to start a literature review? Ordinal model judgement.', w: '92px', jev: true, sortable: true, num: true },
  { id: 'dir', label: 'Jev directness', title: 'Jev evidence directness, modal level 0 to 3', w: '104px', jev: true },
  { id: 'jpillar', label: 'Jev pillar', title: 'Pillar chosen by Jev', w: '112px', jev: true },
];

type SortKey = 'base' | 'jevrank' | 'study' | 'tier' | 'overlap' | 'rel';
const LS_KEY = 'fa.studies.view';
function loadView(): { hidden: ColId[]; density: 'comfortable' | 'compact' } {
  try {
    const v = JSON.parse(localStorage.getItem(LS_KEY) ?? 'null') as { hidden?: ColId[]; density?: string } | null;
    return { hidden: Array.isArray(v?.hidden) ? v.hidden : [], density: v?.density === 'compact' ? 'compact' : 'comfortable' };
  } catch {
    return { hidden: [], density: 'comfortable' };
  }
}

function kindsFor(acc: string, records: EvidenceRecord[], hasRows: boolean): string {
  const kinds = new Set<string>();
  if (hasRows) kinds.add(KIND_LABEL.table_row);
  records.filter((r) => r.accession === acc).forEach((r) => kinds.add(KIND_LABEL[r.evidenceKind]));
  return kinds.size ? [...kinds].join(' · ') : NOT_AVAILABLE;
}

function JevBadge({ model }: { model: AtlasModel }) {
  const sample = [...model.jev.values()].find((j): j is JevJudgement => j !== null);
  if (!sample) return null;
  if (sample.source === 'fixture') return <Badge kind="fixture" />;
  return <Badge kind="si" modelId={sample.modelId} hover={`${sample.source}, recorded ${sample.recordedAt.slice(0, 10)}. Ordinal model judgement, not a probability that the science is true.`} />;
}

function AgreementStrip({ model }: { model: AtlasModel }) {
  const a = model.agreement;
  const s = model.sens;
  if (!a && !s) return null;
  const fixture = [...model.jev.values()].some((j) => j?.source === 'fixture');
  return (
    <div className="fa-strip" aria-label="Agreement between the two rankers">
      {a && (
        <div className="fa-strip__line">
          <Badge kind="code" />
          <strong style={{ fontSize: 13 }}>{a.sentence}</strong>
        </div>
      )}
      <div className="fa-strip__line fa-mono" style={{ fontSize: 12 }}>
        {a && <span>top-3 overlap {a.top3Overlap}/{Math.min(3, model.ranked.length)}</span>}
        {a && a.spearman != null && <span>Spearman ρ {fmtNum(a.spearman, 2)} (n={model.ranked.length})</span>}
        {s && (
          <span
            className="fa-chip fa-chip--edit"
            title={s.top3Stable ? 'The top 3 contain the same studies under every one of the 24 priority orders.' : `Orders that change the top 3: ${s.changingOrders.map((o) => o.join(' > ')).join('; ')}`}
            style={{ borderColor: s.top3Stable ? 'var(--fa-strong)' : 'var(--fa-flag)' }}
          >
            {s.top3Stable ? `top 3 stable under all ${s.ordersTested} orders` : `top 3 depends on priorities (${s.changingOrders.length} of ${s.ordersTested} orders change it)`}
          </span>
        )}
      </div>
      {fixture && <FixtureNote />}
    </div>
  );
}

interface RowVM { r: BaselineRankRow; card: InvestigationCard | undefined; j: JevJudgement | null | undefined; jr: number | undefined }

export default function StudiesTab() {
  const model = useAtlasModel();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const set = useAtlas((s) => s.set);
  const highlighted = useAtlas((s) => s.highlightedRowIds);
  const selectedRowId = useAtlas((s) => s.selectedRowId);
  const concern = useAtlas((s) => s.concern);
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'base', dir: 'asc' });
  const [view, setView] = useState(loadView);
  const [menu, setMenu] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [override, setOverride] = useState(false);
  const [active, setActive] = useState(0);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const persist = (v: typeof view) => { setView(v); try { localStorage.setItem(LS_KEY, JSON.stringify(v)); } catch { /* storage unavailable */ } };

  const showJev = !model.noAi;
  const cols = COLS.filter((c) => !view.hidden.includes(c.id) && (showJev || !c.jev));
  const gridCols = cols.map((c) => c.w).join(' ');
  const minW = cols.reduce((n, c) => n + parseInt(c.w, 10), 0);

  const vms: RowVM[] = useMemo(
    () => model.ranked.map((r) => ({ r, card: model.cardsByAcc.get(r.accession), j: model.jev.get(r.accession), jr: model.jevRanks.get(r.accession) })),
    [model.ranked, model.cardsByAcc, model.jev, model.jevRanks],
  );

  const sorted = useMemo(() => {
    const v = vms.slice();
    const dir = sort.dir === 'asc' ? 1 : -1;
    const num = (n: number | null | undefined, missing = Number.POSITIVE_INFINITY) => (n == null ? missing : n);
    const cmp: Record<SortKey, (a: RowVM, b: RowVM) => number> = {
      base: (a, b) => a.r.rank - b.r.rank,
      jevrank: (a, b) => num(a.jr) - num(b.jr),
      study: (a, b) => (a.card?.acronym ?? a.r.accession).localeCompare(b.card?.acronym ?? b.r.accession),
      tier: (a, b) => num(b.r.evidenceTier, -1) - num(a.r.evidenceTier, -1),
      overlap: (a, b) => b.r.overlap.covers - a.r.overlap.covers || (b.r.overlap.nearO2Only + b.r.overlap.nearPressureOnly) - (a.r.overlap.nearO2Only + a.r.overlap.nearPressureOnly),
      rel: (a, b) => num(b.j?.regimeRelevance, -1) - num(a.j?.regimeRelevance, -1),
    };
    v.sort((a, b) => dir * (cmp[sort.key](a, b) || a.r.rank - b.r.rank));
    return v;
  }, [vms, sort]);

  useEffect(() => { if (active >= sorted.length) setActive(Math.max(0, sorted.length - 1)); }, [sorted.length, active]);

  const rowsByAcc = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const r of model.rows) { const a = m.get(r.accession); if (a) a.push(r.id); else m.set(r.accession, [r.id]); }
    return m;
  }, [model.rows]);
  const hlAcc = useMemo(() => new Set(highlighted.map((id) => id.split(':')[0])), [highlighted]);
  const selAcc = selectedRowId?.split(':')[0];

  const hover = useCallback((acc: string | null) => set({ highlightedRowIds: acc ? (rowsByAcc.get(acc) ?? []) : [] }), [set, rowsByAcc]);
  const open = (acc: string) => navigate(`/study/${acc}`);

  const onKey = (e: KeyboardEvent<HTMLDivElement>, i: number, acc: string) => {
    const go = (n: number) => { const k = Math.max(0, Math.min(sorted.length - 1, n)); setActive(k); rowRefs.current[k]?.focus(); e.preventDefault(); };
    if (e.key === 'ArrowDown') go(i + 1);
    else if (e.key === 'ArrowUp') go(i - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(sorted.length - 1);
    else if (e.key === 'Enter') { e.preventDefault(); open(acc); }
  };

  const sortBy = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  const ariaSort = (c: Col): 'ascending' | 'descending' | 'none' | undefined =>
    !c.sortable ? undefined : sort.key === c.id ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none';

  /* ---------- system states ---------- */
  if (model.status === 'loading') return <Skeleton rows={6} height={44} label="Loading studies" />;
  if (model.status === 'error') return <ErrorState title="Studies did not load" message={model.message} stillWorks="the About, Method and Credits pages, and the glossary." onRetry={model.retry} />;
  if (model.cards.length === 0) return <EmptyState title="No investigation cards in this corpus">The corpus loaded but has no investigations to rank. Rows may still appear on the map.</EmptyState>;
  if (model.hash === 'mismatch' && !override) {
    return (
      <ErrorState
        title="Ranking blocked: corpus hash does not match"
        message="The data file does not match the hash recorded when it was built, so ranks could describe different rows than the map shows."
        stillWorks="the map, the evidence drawer and the Caught by code ledger still read the file as loaded."
        onRetry={() => setOverride(true)}
        actionLabel="Show ranking anyway, unverified"
      />
    );
  }

  const cell = (c: Col, vm: RowVM) => {
    const { r, card, j, jr } = vm;
    switch (c.id) {
      case 'base': return <span className="fa-num">{r.rank}</span>;
      case 'jevrank': return jr != null ? <span className="fa-num">{jr}</span> : <span className="fa-muted">{NOT_AVAILABLE}</span>;
      case 'delta': {
        if (jr == null) return <span className="fa-muted">{NOT_AVAILABLE}</span>;
        const d = r.rank - jr;
        const sr = d === 0 ? 'no change from baseline' : `moved ${d > 0 ? 'up' : 'down'} ${plural(Math.abs(d), 'place')} from baseline`;
        return (
          <span className={`fa-delta ${d > 0 ? 'fa-delta--up' : d < 0 ? 'fa-delta--down' : ''}`}>
            <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
              {d > 0 ? <ArrowUp size={12} /> : d < 0 ? <ArrowDown size={12} /> : <Minus size={12} />}{d === 0 ? '' : Math.abs(d)}
            </span>
            <span className="fa-sr">{sr}</span>
          </span>
        );
      }
      case 'study':
        return (
          <span style={{ display: 'grid', gap: 2 }}>
            <span><strong>{card?.acronym ?? r.accession}</strong> <span className="fa-mono fa-muted" style={{ fontSize: 11 }}>{r.accession}</span></span>
            <span className="fa-muted" style={{ fontSize: 11.5, lineHeight: 1.3 }}>{card?.title ?? 'title not available'}</span>
          </span>
        );
      case 'pillar': {
        const match = r.pillarMatch;
        return (
          <span style={{ display: 'grid', gap: 3, justifyItems: 'start' }}>
            <PillarChip pillar={card?.pillarPrimary} />
            <span className="fa-muted" style={{ fontSize: 11 }}>
              {concern === 'explore' ? 'no concern set' : match === 'primary' ? `matches ${concern}` : match === 'secondary' ? `secondary: ${concern}` : `no ${concern} match`}
              {card?.cardState !== 'gold' ? ' · unreviewed' : ''}
            </span>
          </span>
        );
      }
      case 'tier':
        return r.evidenceTier == null ? <span className="fa-muted">not reviewed</span> : <span title={card?.evidenceTierRule ?? undefined}>{r.evidenceTier}</span>;
      case 'overlap': {
        const o = r.overlap;
        return (
          <span style={{ display: 'grid', gap: 2 }} title={OVERLAP_TITLE[o.bestClass]}>
            <span>{OVERLAP_LABEL[o.bestClass]}</span>
            <span className="fa-mono fa-muted" style={{ fontSize: 11 }}>{o.covers} cover · {o.nearO2Only + o.nearPressureOnly} near · {o.unknown} unknown</span>
          </span>
        );
      }
      case 'kind': return <span style={{ fontSize: 12 }}>{kindsFor(r.accession, model.records, (rowsByAcc.get(r.accession)?.length ?? 0) > 0)}</span>;
      case 'rel': return j?.regimeRelevance != null ? <span className="fa-num" title="Jev P(yes). Ordinal model judgement, not a probability that the science is true.">{fmtNum(j.regimeRelevance, 2)}</span> : <span className="fa-muted">{NOT_AVAILABLE}</span>;
      case 'dir': return j ? <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><Glyph level={modalLevel(j)} /><span className="fa-num">{modalLevel(j) ?? ''}</span></span> : <span className="fa-muted">{NOT_AVAILABLE}</span>;
      case 'jpillar': return j?.pillar ? <PillarChip pillar={j.pillar.choice} /> : <span className="fa-muted">{NOT_AVAILABLE}</span>;
    }
  };

  const nearEmpty = model.rows.length === 0 && (model.corpus?.rows.length ?? 0) > 0;

  return (
    <>
      {model.preview && (
        <Banner tone="flag">
          <strong>Preview: cards not yet human-reviewed.</strong> This order uses unreviewed tags. Studies move out of preview once humans review their cards.
        </Banner>
      )}
      {model.noAi && (
        <Banner tone="accent" action={model.corpus && useAtlas.getState().mode === 'no-ai' ? <Btn onClick={() => set({ mode: 'explore' })}>Show Jev columns</Btn> : undefined}>
          <strong>No-AI mode.</strong> Showing the transparent baseline only. Jev columns are hidden.
        </Banner>
      )}
      {model.hash === 'mismatch' && <Banner tone="flag"><strong>Unverified ranking.</strong> The corpus hash does not match its record.</Banner>}
      {nearEmpty && (
        <EmptyState
          title="No PSI test in this set matches the fuel filter"
          actions={<Btn onClick={() => set({ fuelFilter: [] })}>Clear fuel filter</Btn>}
        >
          Nothing in the filtered rows is near this air. That is the gap. Clear the filter to see the nearest rows.
        </EmptyState>
      )}
      {showJev && <AgreementStrip model={model} />}

      <div className="fa-strip__line" style={{ justifyContent: 'space-between', position: 'relative' }}>
        <span className="fa-chips">
          <Btn icon={<Sliders size={14} />} onClick={() => setSheet(true)}>Ranking priorities</Btn>
          {!model.d5Signed && <Badge kind="proposed" />}
          <Badge kind="code" label="Base # is CODE" />
          {showJev && <JevBadge model={model} />}
        </span>
        <span className="fa-chips">
          <Btn variant="quiet" icon={<Rows size={14} />} aria-pressed={view.density === 'compact'} onClick={() => persist({ ...view, density: view.density === 'compact' ? 'comfortable' : 'compact' })}>{view.density === 'compact' ? 'Compact' : 'Comfortable'}</Btn>
          <Btn variant="quiet" icon={<Columns size={14} />} aria-expanded={menu} aria-haspopup="true" onClick={() => setMenu((m) => !m)}>Columns</Btn>
        </span>
        {menu && (
          <div className="fa-menu" role="group" aria-label="Visible columns">
            {COLS.filter((c) => !c.locked && (showJev || !c.jev)).map((c) => (
              <label key={c.id}>
                <input type="checkbox" checked={!view.hidden.includes(c.id)} onChange={(e) => persist({ ...view, hidden: e.target.checked ? view.hidden.filter((h) => h !== c.id) : [...view.hidden, c.id] })} />
                {c.label}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="fa-tablewrap" tabIndex={-1} style={{ flex: '1 1 300px', minHeight: 220 }}>
        <div className="fa-table" role="table" aria-label={`Studies ranked for ${concern}, baseline and Jev`} aria-rowcount={sorted.length + 1} data-density={view.density} style={{ ['--fa-cols' as string]: gridCols, minWidth: minW }}>
          <div role="rowgroup">
            <div className="fa-trow fa-trow--head" role="row">
              {cols.map((c) => (
                <div key={c.id} role="columnheader" aria-sort={ariaSort(c)} className={`fa-tcell${c.num ? ' fa-tcell--num' : ''}${c.id === 'study' ? ' fa-tcell--study' : ''}`} title={c.title}>
                  {c.sortable ? (
                    <button type="button" className="fa-sortbtn" onClick={() => sortBy(c.id as SortKey)}>
                      {c.label}
                      {sort.key === c.id && (sort.dir === 'asc' ? <CaretUp size={10} aria-hidden="true" /> : <CaretDown size={10} aria-hidden="true" />)}
                    </button>
                  ) : c.label}
                </div>
              ))}
            </div>
          </div>
          <div role="rowgroup">
            <LayoutGroup>
              {sorted.map((vm, i) => (
                <motion.div
                  key={vm.r.accession}
                  layout={reduce ? false : 'position'}
                  transition={{ duration: 0.12, ease: [0.2, 0, 0, 1] }}
                  ref={(el: HTMLDivElement | null) => { rowRefs.current[i] = el; }}
                  role="row"
                  aria-rowindex={i + 2}
                  tabIndex={i === active ? 0 : -1}
                  className="fa-trow"
                  data-hl={hlAcc.has(vm.r.accession)}
                  data-selected={selAcc === vm.r.accession}
                  aria-label={`${vm.card?.acronym ?? vm.r.accession}, baseline rank ${vm.r.rank}. Enter opens the study.`}
                  onMouseEnter={() => hover(vm.r.accession)}
                  onMouseLeave={() => hover(null)}
                  onFocus={() => { setActive(i); hover(vm.r.accession); }}
                  onBlur={() => hover(null)}
                  onClick={() => open(vm.r.accession)}
                  onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => onKey(e, i, vm.r.accession)}
                  style={{ cursor: 'pointer' }}
                >
                  {cols.map((c) => (
                    <div key={c.id} role="cell" className={`fa-tcell${c.num ? ' fa-tcell--num' : ''}${c.id === 'study' ? ' fa-tcell--study' : ''}`}>{cell(c, vm)}</div>
                  ))}
                </motion.div>
              ))}
            </LayoutGroup>
          </div>
          {model.notRanked.length > 0 && (
            <div role="rowgroup">
              <div className="fa-group" role="row"><span role="cell">Not ranked · metadata only ({model.notRanked.length})</span></div>
              {model.notRanked.map((c) => (
                <div key={c.accession} className="fa-trow" role="row" style={{ gridTemplateColumns: '1fr' }} data-hl={hlAcc.has(c.accession)} tabIndex={0}
                  onMouseEnter={() => hover(c.accession)} onMouseLeave={() => hover(null)} onClick={() => open(c.accession)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); open(c.accession); } }}
                  aria-label={`${c.acronym}, metadata only, not ranked. Enter opens the study.`}>
                  <div role="cell" className="fa-tcell">
                    <strong>{c.acronym}</strong> <span className="fa-mono fa-muted" style={{ fontSize: 11 }}>{c.accession}</span>{' '}
                    <span className="fa-muted">{c.title}. Metadata only, not ranked.</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <p className="fa-muted" style={{ fontSize: 11.5 }}>
        Gravity: microgravity (ISS) for every row. Partial gravity: none in PSI. Ranks order a reading list. They are not a finding about any atmosphere.
      </p>
      <PrioritiesSheet open={sheet} onClose={() => setSheet(false)} d5Signed={model.d5Signed} />
    </>
  );
}
