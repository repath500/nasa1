import { Command } from 'cmdk';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChatCircleDots, Clock, Flask, MagnifyingGlass, X } from '@phosphor-icons/react';
import { PRESETS, type AskFilters, type AskResponse, type FuelPhase, type ScenarioId } from '@fire/contracts';
import { useAtlas } from '../../state/store';
import { useCorpus } from '../../data/useCorpus';
import { apiFetch } from '../../shell/api';
import { useUi } from '../../shell/uiStore';
import { KEYS, lsGetJson, lsSetJson } from '../../shell/storage';
import { cycleTheme, useListen } from '../../shell/shortcuts';
import { copyLink } from '../../shell/TopBar';
import { redo, undo } from '../../shell/history';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { InlineError } from '../../components/InlineError';
import { Kbd } from '../../components/Kbd';
import { looksLikeQuestion, offlineAnswer } from './askParser';

interface Recent { id: string; label: string; kind: 'study' | 'habitat' | 'material' | 'action' }
const HABITAT_IDS = Object.keys(PRESETS) as Exclude<ScenarioId, 'custom'>[];
const ITEM = 'flex min-h-11 cursor-pointer items-center gap-3 px-3 text-sm text-ink aria-selected:bg-raised aria-selected:text-ink data-[selected=true]:bg-raised';
const GROUP = '[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted';

/** SPEC §3.11. cmdk palette: studies, habitats, materials, actions, recents, and Ask with filter chips and pipeline trace. */
export default function CommandPalette() {
  const open = useUi((s) => s.paletteOpen);
  const navigate = useNavigate(); const toggleListen = useListen();
  const corpusState = useCorpus(); const corpus = corpusState.status === 'ready' ? corpusState.corpus : null;
  const [q, setQ] = useState('');
  const [ask, setAsk] = useState<{ status: 'idle' | 'loading' | 'done' | 'error'; res?: AskResponse; error?: string; question?: string }>({ status: 'idle' });
  const [recent, setRecent] = useState<Recent[]>([]);
  const close = () => useUi.getState().set({ paletteOpen: false });

  useEffect(() => { if (open) { setQ(''); setAsk({ status: 'idle' }); setRecent(lsGetJson<Recent[]>(KEYS.recent, [])); } }, [open]);

  const materials = useMemo(() => {
    const m = new Map<string, FuelPhase>();
    corpus?.rows.forEach((r) => { if (r.fuel.name && !m.has(r.fuel.name)) m.set(r.fuel.name, r.fuel.phase); });
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [corpus]);

  const remember = (r: Recent) => lsSetJson(KEYS.recent, [r, ...lsGetJson<Recent[]>(KEYS.recent, []).filter((x) => x.id !== r.id)].slice(0, 5));
  const run = (r: Recent | null, fn: () => void) => { if (r) remember(r); close(); fn(); };

  const runAsk = async (question: string) => {
    setAsk({ status: 'loading', question });
    const store = useAtlas.getState();
    const offline = store.mode === 'no-ai' || store.mode === 'learn';
    let res: AskResponse | null = null;
    if (!offline) {
      const r = await apiFetch<AskResponse>('/api/ask', { method: 'POST', body: JSON.stringify({ question: question.slice(0, 200) }), timeoutMs: 9000 });
      if (r.ok && r.data?.filters) res = r.data;
    }
    if (!res && corpus) res = offlineAnswer(question, corpus);
    if (res) setAsk({ status: 'done', res, question });
    else setAsk({ status: 'error', error: 'The atlas could not parse that and no data is loaded yet.', question });
  };

  const applyFilters = (f: AskFilters) => {
    const s = useAtlas.getState();
    const patch: Record<string, unknown> = {};
    if (f.scenarioId) patch.habitat = f.scenarioId;
    else if (f.o2Pct !== null || f.totalKpa !== null) { patch.habitat = 'custom'; patch.custom = { o2Pct: f.o2Pct ?? s.custom.o2Pct, totalKpa: f.totalKpa ?? s.custom.totalKpa }; }
    if (f.concern) patch.concern = f.concern;
    patch.fuelFilter = f.fuelPhase ? [f.fuelPhase] : s.fuelFilter;
    s.set(patch);
    useAtlas.getState().set({ material: f.material });
    close(); navigate({ pathname: '/atlas', search: window.location.search });
  };

  const coolFlames = q.trim().toLowerCase() === 'cool flames';
  const cfi = corpus?.cards.find((c) => /^CFI/i.test(c.acronym));
  const showAsk = ask.status === 'idle' && looksLikeQuestion(q);

  const actions: { id: string; label: string; hint?: string; run: () => void }[] = [
    { id: 'expert', label: 'Toggle expert mode', hint: 'E', run: () => { const s = useAtlas.getState(); s.set({ expert: !s.expert }); } },
    { id: 'listen', label: 'Toggle Listen mode', hint: 'L', run: toggleListen },
    { id: 'present', label: 'Open Present mode', hint: 'P', run: () => navigate('/present') },
    { id: 'theme', label: 'Change theme', hint: 'T', run: cycleTheme },
    { id: 'copy', label: 'Copy link to this view', run: () => void copyLink() },
    { id: 'export', label: 'Export brief', run: () => navigate(`/brief/${useAtlas.getState().habitat}`) },
    { id: 'briefing', label: 'New briefing', run: () => navigate('/briefing') },
    { id: 'undo', label: 'Undo last change', hint: '⌘Z', run: undo },
    { id: 'redo', label: 'Redo', hint: '⇧⌘Z', run: redo },
    { id: 'shortcuts', label: 'Keyboard shortcuts', hint: '?', run: () => useUi.getState().set({ cheatOpen: true }) },
    { id: 'learn', label: 'Open Learn mode', run: () => navigate('/learn') },
    { id: 'nodata', label: 'Toggle No-AI baseline', run: () => { const s = useAtlas.getState(); s.set({ mode: s.mode === 'no-ai' ? 'explore' : 'no-ai' }); } },
  ];

  return (
    <Command.Dialog open={open} onOpenChange={(o) => useUi.getState().set({ paletteOpen: o })} label="Command palette" shouldFilter={ask.status === 'idle'}
      overlayClassName="fa-overlay fixed inset-0 z-[var(--z-palette)] bg-[var(--scrim)]"
      contentClassName="fa-pop fixed left-1/2 top-[8vh] z-[var(--z-palette)] w-[min(640px,calc(100vw-16px))] -translate-x-1/2 border border-strong bg-surface">
      <div className="flex items-center gap-3 border-b border-hairline px-3">
        <MagnifyingGlass size={18} className="text-muted" aria-hidden />
        <Command.Input value={q} onValueChange={(v) => { setQ(v); if (ask.status !== 'idle') setAsk({ status: 'idle' }); }} placeholder="Search studies, habitats, materials, or ask a question"
          className="min-h-12 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted" data-testid="palette-input" />
        <Kbd>Esc</Kbd>
      </div>

      {ask.status !== 'idle' ? (
        <AskResult state={ask} onBack={() => setAsk({ status: 'idle' })} onApply={applyFilters} onRetry={() => ask.question && void runAsk(ask.question)} />
      ) : (
        <Command.List className="max-h-[min(60vh,440px)] overflow-y-auto pb-2">
          <Command.Empty className="px-4 py-6 text-sm text-muted">Nothing matches. Try a study name like FLEX, a habitat, or a material such as PMMA.</Command.Empty>
          {showAsk && (
            <Command.Group heading="Ask" className={GROUP}>
              <Command.Item forceMount value={`ask ${q}`} onSelect={() => void runAsk(q)} className={ITEM} data-testid="palette-ask">
                <ChatCircleDots size={18} className="text-accent" aria-hidden /><span className="min-w-0 flex-1 truncate">Ask the atlas: {q}</span><ArrowRight size={16} aria-hidden />
              </Command.Item>
            </Command.Group>
          )}
          {coolFlames && cfi && (
            <Command.Group heading="Found" className={GROUP}>
              <Command.Item forceMount value="cool flames cfi" onSelect={() => run({ id: cfi.accession, label: cfi.acronym, kind: 'study' }, () => navigate(`/study/${cfi.accession}`))} className={ITEM}>
                <Flask size={18} className="text-accent" aria-hidden />
                <span className="min-w-0 flex-1"><span className="block">{cfi.acronym}: {cfi.title}</span>
                  <span className="block truncate text-xs text-muted">{cfi.objective.split(/(?<=\.)\s/).find((x) => /cool flame/i.test(x)) ?? 'Cool flames, as described in the PSI objective text.'}</span></span>
              </Command.Item>
            </Command.Group>
          )}
          {recent.length > 0 && !q && (
            <Command.Group heading="Recent" className={GROUP}>
              {recent.map((r) => (
                <Command.Item key={`r-${r.id}`} value={`recent ${r.label}`} className={ITEM}
                  onSelect={() => run(r, () => {
                    if (r.kind === 'study') navigate(`/study/${r.id}`);
                    else if (r.kind === 'habitat') { useAtlas.getState().set({ habitat: r.id as ScenarioId }); navigate('/atlas'); }
                    else if (r.kind === 'material') { useAtlas.getState().set({ material: r.id }); navigate('/atlas'); }
                    else actions.find((a) => a.id === r.id)?.run();
                  })}>
                  <Clock size={18} className="text-muted" aria-hidden /><span>{r.label}</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}
          <Command.Group heading="Habitats" className={GROUP}>
            {HABITAT_IDS.map((id) => (
              <Command.Item key={id} value={`habitat ${PRESETS[id].label}`} keywords={[id, 'air', 'atmosphere']} className={ITEM}
                onSelect={() => run({ id, label: PRESETS[id].label, kind: 'habitat' }, () => { useAtlas.getState().set({ habitat: id }); navigate({ pathname: '/atlas', search: window.location.search }); })}>
                <span className="mono w-14 text-xs text-muted num">{PRESETS[id].o2Pct}%</span><span className="flex-1">{PRESETS[id].label}</span><span className="num text-xs text-muted">{PRESETS[id].totalKpa} kPa</span>
              </Command.Item>
            ))}
          </Command.Group>
          <Command.Group heading="Actions" className={GROUP}>
            {actions.map((a) => (
              <Command.Item key={a.id} value={`action ${a.label}`} className={ITEM} onSelect={() => run({ id: a.id, label: a.label, kind: 'action' }, a.run)}>
                <span className="flex-1">{a.label}</span>{a.hint && <Kbd>{a.hint}</Kbd>}
              </Command.Item>
            ))}
          </Command.Group>
          {corpus && (
            <Command.Group heading="Studies" className={GROUP}>
              {corpus.cards.map((c) => (
                <Command.Item key={c.accession} value={`study ${c.acronym} ${c.title} ${c.accession}`} className={ITEM}
                  onSelect={() => run({ id: c.accession, label: `${c.acronym} (${c.accession})`, kind: 'study' }, () => navigate(`/study/${c.accession}`))}>
                  <span className="mono w-20 shrink-0 text-xs text-accent">{c.acronym}</span><span className="min-w-0 flex-1 truncate">{c.title}</span><Chip>{c.accession}</Chip>
                </Command.Item>
              ))}
            </Command.Group>
          )}
          {materials.length > 0 && (
            <Command.Group heading="Materials" className={GROUP}>
              {materials.map(([name, phase]) => (
                <Command.Item key={name} value={`material ${name} ${phase}`} className={ITEM}
                  onSelect={() => run({ id: name, label: name, kind: 'material' }, () => { useAtlas.getState().set({ fuelFilter: [phase] }); useAtlas.getState().set({ material: name }); navigate({ pathname: '/atlas', search: window.location.search }); })}>
                  <span className="flex-1">{name}</span><span className="text-xs text-muted">{phase}</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>
      )}
    </Command.Dialog>
  );
}

function AskResult({ state, onBack, onApply, onRetry }: { state: { status: string; res?: AskResponse; error?: string; question?: string }; onBack: () => void; onApply: (f: AskFilters) => void; onRetry: () => void }) {
  const [filters, setFilters] = useState<AskFilters | null>(state.res?.filters ?? null);
  useEffect(() => { setFilters(state.res?.filters ?? null); }, [state.res]);
  const chips = filters ? ([['material', filters.material], ['phase', filters.fuelPhase], ['habitat', filters.scenarioId], ['concern', filters.concern], ['O₂', filters.o2Pct === null ? null : `${filters.o2Pct}%`], ['pressure', filters.totalKpa === null ? null : `${filters.totalKpa} kPa`]] as [string, string | null][]).filter(([, v]) => v) : [];
  const clear = (k: string) => setFilters((f) => f && ({ ...f, ...({ material: { material: null }, phase: { fuelPhase: null }, habitat: { scenarioId: null }, concern: { concern: null }, 'O₂': { o2Pct: null }, pressure: { totalKpa: null } } as Record<string, Partial<AskFilters>>)[k] }));
  return (
    <div className="max-h-[min(60vh,440px)] overflow-y-auto p-4" aria-live="polite" data-testid="ask-result">
      <p className="text-sm text-muted">Question</p>
      <p className="mb-4 text-base">{state.question}</p>
      {state.status === 'loading' && <div role="status" className="num text-sm text-muted"><span className="fa-caret">{'>>> parsing'}</span></div>}
      {state.status === 'error' && <InlineError message={state.error ?? 'Could not answer.'} stillWorks="Search by study, habitat and material still works." onRetry={onRetry} />}
      {state.status === 'done' && state.res && filters && (
        <>
          <div className="mb-1 flex items-center gap-2 text-sm text-muted">
            Parsed filters
            <Chip tone={state.res.source === 'hydrogen' ? 'accent' : 'neutral'} pill>{state.res.source === 'hydrogen' ? 'SI · Hydrogen' : 'keyword parser (offline)'}</Chip>
          </div>
          <ul className="mb-4 flex flex-wrap gap-2" aria-label="Filter chips">
            {chips.length === 0 && <li className="text-sm text-muted">No filters found. Try naming a material, habitat or concern.</li>}
            {chips.map(([k, v]) => (
              <li key={k} className="mono inline-flex items-center gap-1 border border-accent px-2 py-1 text-xs text-accent">{k}={v}
                <button type="button" aria-label={`Remove ${k} filter`} onClick={() => clear(k)} className="grid size-5 place-items-center hover:bg-raised"><X size={12} /></button></li>
            ))}
          </ul>
          <p className="mb-1 text-sm text-muted">Pipeline trace</p>
          <ol className="mono mb-4 space-y-1 border border-hairline bg-bg p-3 text-xs" data-testid="pipeline-trace">
            {state.res.trace.map((t, i) => (
              <li key={i} className="flex flex-wrap gap-x-2"><span className="text-accent">{t.actor}</span><span>{t.message}</span><span className="text-muted">{t.ms} ms{t.modelId ? ` · ${t.modelId}` : ''}</span></li>
            ))}
          </ol>
          <p className="mb-3 text-xs text-muted">The model only reads your words. Counts and rows are computed by code.</p>
          <div className="flex gap-2">
            <Button variant="primary" onClick={() => onApply(filters)} disabled={chips.length === 0}>Apply in atlas</Button>
            <Button variant="ghost" onClick={onBack}>Back to search</Button>
          </div>
        </>
      )}
    </div>
  );
}
