import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Slider from '@radix-ui/react-slider';
import { ArrowLeft, ArrowRight, Crosshair, Flag, Flask, Globe, Moon, Person, Planet, Sliders as SlidersIcon } from '@phosphor-icons/react';
import { PRESETS, type Concern, type FuelPhase, type ScenarioId } from '@fire/contracts';
import { useAtlas } from '../../state/store';
import { useUi } from '../../shell/uiStore';
import { briefingSentence, PHASE_LABEL } from '../../shell/near';
import { formatPressure } from '../../shell/units';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { NumberTween } from '../../components/NumberTween';
import { UnitInput } from '../../components/UnitInput';
import { isTypingTarget } from '../eggs/keys';
import { MiniMap } from './MiniMap';
import { useBriefingData } from './useBriefingData';

const STEPS = [
  { id: 'habitat', label: 'Habitat', Icon: Planet }, { id: 'concern', label: 'Concern', Icon: Crosshair },
  { id: 'fuel', label: 'Fuel', Icon: Flask }, { id: 'summary', label: 'Summary', Icon: Flag },
] as const;
const HABITAT_ICON: Record<ScenarioId, typeof Globe> = { 'earth-iss': Globe, 'lunar-cabin-example': Moon, 'exploration-upper': Planet, suit: Person, custom: SlidersIcon };
const HABITATS: ScenarioId[] = ['earth-iss', 'lunar-cabin-example', 'exploration-upper', 'suit', 'custom'];
const CONCERNS: { id: Concern; title: string; q: string }[] = [
  { id: 'prevention', title: 'Prevention', q: 'Will materials catch and spread fire?' },
  { id: 'detection', title: 'Detection', q: 'Will we notice smoke early?' },
  { id: 'suppression', title: 'Suppression', q: 'Can we put it out?' },
  { id: 'explore', title: 'Just exploring', q: 'Show me everything near this air.' },
];
const PHASES: { id: FuelPhase; label: string; hint: string; color: string }[] = [
  { id: 'solid', label: 'Solid', hint: 'fabric, plastic', color: 'var(--color-solid)' },
  { id: 'liquid-droplet', label: 'Liquid droplet', hint: 'heptane, methanol', color: 'var(--color-droplet)' },
  { id: 'gas', label: 'Gas', hint: 'burner flames', color: 'var(--color-gas)' },
];

/** SPEC §3.2. Four screens, a progress track of glyphs, Back/Next, Esc to skip. Every choice is written to the store (the URL follows). */
export default function BriefingWizard() {
  const navigate = useNavigate(); const reduce = useReducedMotion();
  const [step, setStep] = useState(0); const [dir, setDir] = useState(1);
  const headRef = useRef<HTMLHeadingElement>(null);
  const data = useBriefingData();
  const s = useAtlas();

  useEffect(() => { const prev = useAtlas.getState().mode; useAtlas.getState().set({ mode: 'briefing' }); return () => { if (useAtlas.getState().mode === 'briefing') useAtlas.getState().set({ mode: prev === 'briefing' ? 'explore' : prev }); }; }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isTypingTarget(e.target) && !document.querySelector('[role="dialog"]')) { useAtlas.getState().set({ mode: 'explore' }); navigate({ pathname: '/atlas', search: window.location.search }); } };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  const go = (n: number) => { setDir(n > step ? 1 : -1); setStep(n); };
  const finish = (listen: boolean) => {
    const st = useAtlas.getState();
    st.set(listen ? { mode: 'listen', audio: { ...st.audio, playing: true, following: true } } : { mode: 'explore' });
    navigate({ pathname: '/atlas', search: window.location.search });
  };

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-6 md:pt-10" data-testid="briefing">
      <nav aria-label="Briefing progress" className="mb-8">
        <ol className="flex items-center">
          {STEPS.map((st, i) => {
            const Icon = i === 0 ? HABITAT_ICON[s.habitat] : st.Icon; const done = i < step; const cur = i === step;
            return (
              <li key={st.id} className="flex flex-1 items-center last:flex-none">
                <button type="button" onClick={() => go(i)} aria-current={cur ? 'step' : undefined} aria-label={`${st.label}${cur ? ', current' : done ? ', done' : ''}`}
                  className={`grid size-11 place-items-center rounded-[2px] border transition-colors duration-[var(--dur-fade)] ${cur ? 'border-accent bg-accent text-accent-ink' : done ? 'border-accent text-accent' : 'border-strong text-muted hover:border-accent'}`}>
                  <Icon size={20} aria-hidden />
                </button>
                {i < STEPS.length - 1 && <span aria-hidden className="mx-2 h-px flex-1 bg-hairline"><span className="block h-px bg-accent transition-[width] duration-[var(--dur-fly)]" style={{ width: done ? '100%' : '0%' }} /></span>}
              </li>
            );
          })}
        </ol>
      </nav>

      <AnimatePresence mode="wait" initial={false} custom={dir}>
        <motion.div key={step} initial={reduce ? false : { opacity: 0, x: 16 * dir }} animate={{ opacity: 1, x: 0 }} exit={reduce ? undefined : { opacity: 0, x: -16 * dir }} transition={{ duration: 0.16, ease: [0.2, 0, 0, 1] }}>
          {step === 0 && <HabitatStep headRef={headRef} data={data} />}
          {step === 1 && <ConcernStep headRef={headRef} data={data} />}
          {step === 2 && <FuelStep headRef={headRef} data={data} />}
          {step === 3 && <SummaryStep headRef={headRef} data={data} onFinish={finish} />}
        </motion.div>
      </AnimatePresence>

      <div className="mt-10 flex items-center justify-between border-t border-hairline pt-4">
        <Button variant="ghost" onClick={() => go(step - 1)} disabled={step === 0} icon={<ArrowLeft size={16} aria-hidden />}>Back</Button>
        <span className="hidden text-xs text-muted sm:block">Esc skips to the atlas</span>
        {step < 3 ? <Button variant="primary" onClick={() => go(step + 1)} data-testid="briefing-next" icon={<ArrowRight size={16} aria-hidden />}>{step === 2 ? 'See my briefing' : 'Next'}</Button> : <span className="w-20" />}
      </div>
    </div>
  );
}

type StepProps = { headRef: React.RefObject<HTMLHeadingElement>; data: ReturnType<typeof useBriefingData> };
/** Step heading. Takes focus on mount so keyboard and screen reader users land on the new question. */
function H({ children }: { children: string; headRef?: unknown }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => { ref.current?.focus({ preventScroll: true }); }, []);
  return <h1 ref={ref} tabIndex={-1} className="text-3xl outline-none md:text-4xl">{children}</h1>;
}

function HabitatStep({ headRef, data }: StepProps) {
  const s = useAtlas(); const unit = s.unit;
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div>
        <H headRef={headRef}>Where will crews breathe?</H>
        <p className="mt-2 max-w-[56ch] text-muted">Pick an air mix. These are illustrative examples, not design values.</p>
        <div role="radiogroup" aria-label="Habitat" className="mt-6 grid gap-2 sm:grid-cols-2">
          {HABITATS.map((id) => {
            const Icon = HABITAT_ICON[id]; const p = id === 'custom' ? null : PRESETS[id]; const sel = s.habitat === id;
            return (
              <label key={id} className={`relative flex min-h-[88px] cursor-pointer items-start gap-3 border p-3 transition-colors duration-[var(--dur-step)] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--color-focus)] ${sel ? 'border-accent bg-raised' : 'border-hairline bg-surface hover:border-strong'} ${id === 'custom' ? 'sm:col-span-2' : ''}`}>
                <input type="radio" name="habitat" value={id} checked={sel} onChange={() => s.set({ habitat: id })} className="sr-only" data-testid={`habitat-${id}`} />
                <Icon size={22} className={sel ? 'text-accent' : 'text-muted'} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{p ? p.label : 'Custom air'}</span>
                  <span className="num block text-sm text-muted">{p ? `${p.o2Pct}% O₂ · ${formatPressure(p.totalKpa, unit)}` : `${s.custom.o2Pct}% O₂ · ${formatPressure(s.custom.totalKpa, unit)}`}</span>
                  {p && <span className="block text-xs text-muted">{p.sourceNote}</span>}
                </span>
              </label>
            );
          })}
        </div>
        {s.habitat === 'custom' && (
          <div className="mt-4 grid gap-6 border border-hairline p-4 sm:grid-cols-2" data-testid="custom-air">
            <div>
              <UnitInput label="Oxygen, percent by volume" kind="percent" value={s.custom.o2Pct} onCommit={(v) => s.set({ custom: { ...s.custom, o2Pct: v } })} />
              <Range label="Oxygen" min={10} max={100} step={0.5} value={s.custom.o2Pct} onChange={(v) => s.set({ custom: { ...s.custom, o2Pct: v } })} />
            </div>
            <div>
              <UnitInput label="Total pressure" kind="pressure" value={s.custom.totalKpa} onCommit={(v) => s.set({ custom: { ...s.custom, totalKpa: v } })} />
              <Range label="Pressure" min={20} max={110} step={0.5} value={s.custom.totalKpa} onChange={(v) => s.set({ custom: { ...s.custom, totalKpa: v } })} />
            </div>
          </div>
        )}
      </div>
      <div className="lg:sticky lg:top-20 lg:self-start"><MiniMap counts={data.counts} /></div>
    </div>
  );
}

function Range({ label, min, max, step, value, onChange }: { label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <Slider.Root className="relative mt-2 flex h-6 touch-none select-none items-center" min={min} max={max} step={step} value={[Math.min(max, Math.max(min, value))]} onValueChange={(v) => onChange(v[0] ?? value)} aria-label={`${label} slider`} id={id}>
      <Slider.Track className="relative h-[3px] grow bg-hairline"><Slider.Range className="absolute h-full bg-accent" /></Slider.Track>
      <Slider.Thumb className="block size-5 border-2 border-accent bg-bg" aria-label={label} />
    </Slider.Root>
  );
}

function ConcernStep({ headRef, data }: StepProps) {
  const s = useAtlas();
  const cards = data.corpus?.cards ?? [];
  const tagged = s.concern === 'explore' ? cards : cards.filter((c) => c.pillarPrimary === s.concern);
  const note = !data.corpus ? 'Loading what the archive covers.'
    : s.concern === 'explore' ? `${cards.length} investigations are in this atlas. All of them are in view.`
    : tagged.length ? `${tagged.length} ${tagged.length === 1 ? 'investigation is' : 'investigations are'} tagged ${s.concern}: ${tagged.slice(0, 4).map((c) => c.acronym).join(', ')}${tagged.length > 4 ? ' and more' : ''}.`
    : `No investigation here is tagged ${s.concern} yet. The atlas will say so instead of guessing.`;
  return (
    <div className="max-w-[760px]">
      <H headRef={headRef}>What worries you most?</H>
      <div role="radiogroup" aria-label="Concern" className="mt-6 grid gap-2 sm:grid-cols-2">
        {CONCERNS.map((c) => {
          const sel = s.concern === c.id;
          return (
            <label key={c.id} className={`flex min-h-[88px] cursor-pointer flex-col justify-center border p-4 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--color-focus)] ${sel ? 'border-accent bg-raised' : 'border-hairline bg-surface hover:border-strong'}`}>
              <input type="radio" name="concern" value={c.id} checked={sel} onChange={() => s.set({ concern: c.id })} className="sr-only" data-testid={`concern-${c.id}`} />
              <span className="font-medium">{c.title}</span><span className="text-sm text-muted">{c.q}</span>
            </label>
          );
        })}
      </div>
      <p className="mt-4 border-l-2 border-accent pl-3 text-sm" aria-live="polite" data-testid="concern-note">{note}</p>
    </div>
  );
}

function FuelStep({ headRef, data }: StepProps) {
  const s = useAtlas(); const ui = useUi(); const [q, setQ] = useState(s.material ?? ''); const [open, setOpen] = useState(false); const lid = useId();
  const toggle = (p: FuelPhase) => { s.set({ fuelFilter: s.fuelFilter.includes(p) ? s.fuelFilter.filter((x) => x !== p) : [...s.fuelFilter, p] }); s.set({ material: null }); setQ(''); };
  const matches = data.materials.filter((m) => !q || m.name.toLowerCase().includes(q.toLowerCase())).slice(0, 8);
  const pick = (name: string, phase: FuelPhase) => { s.set({ material: name }); s.set({ fuelFilter: [phase] }); setQ(name); setOpen(false); };
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div>
        <H headRef={headRef}>Anything specific?</H>
        <p className="mt-2 text-muted">Optional. Skip it to see every fuel type.</p>
        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Fuel type">
          {PHASES.map((p) => { const on = s.fuelFilter.includes(p.id);
            return (
              <button key={p.id} type="button" aria-pressed={on} onClick={() => toggle(p.id)} data-testid={`fuel-${p.id}`}
                className={`inline-flex min-h-11 items-center gap-2 border px-4 text-sm transition-colors duration-[var(--dur-step)] active:scale-[0.98] ${on ? 'border-accent bg-raised' : 'border-hairline hover:border-strong'}`}>
                <span aria-hidden className="size-3" style={{ background: p.color }} />{p.label}<span className="text-muted">{p.hint}</span>
              </button>); })}
          {s.fuelFilter.length > 0 && <Button variant="ghost" onClick={() => { s.set({ fuelFilter: [] }); s.set({ material: null }); setQ(''); }}>Clear</Button>}
        </div>
        <div className="relative mt-6 max-w-[420px]">
          <label htmlFor={lid} className="mb-1 block text-[13px] text-muted">Material</label>
          <input id={lid} role="combobox" aria-expanded={open} aria-controls={`${lid}-list`} aria-autocomplete="list" value={q} autoComplete="off" placeholder="PMMA, Nomex, heptane, methanol"
            onChange={(e) => { setQ(e.target.value); setOpen(true); if (!e.target.value) s.set({ material: null }); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={(e) => { if (e.key === 'Enter' && matches[0] && open) { e.preventDefault(); pick(matches[0].name, matches[0].phase); } }}
            className="min-h-10 w-full rounded-[2px] border border-strong bg-bg px-3 text-sm" data-testid="material-input" />
          {open && matches.length > 0 && (
            <ul id={`${lid}-list`} role="listbox" aria-label="Materials in the corpus" className="absolute left-0 right-0 z-10 mt-1 max-h-60 overflow-auto border border-strong bg-surface">
              {matches.map((m) => <li key={m.name} role="option" aria-selected={s.material === m.name} onMouseDown={(e) => { e.preventDefault(); pick(m.name, m.phase); }} className="flex min-h-10 cursor-pointer items-center justify-between px-3 text-sm hover:bg-raised"><span>{m.name}</span><span className="text-xs text-muted">{m.phase}</span></li>)}
            </ul>
          )}
          {data.corpus && data.materials.length === 0 && <p className="mt-1 text-xs text-muted">No named materials in this data set yet.</p>}
        </div>
        <ul className="mt-6 flex flex-wrap gap-4 text-sm" aria-label="Tests nearby by fuel type" aria-live="polite">
          {PHASES.map((p) => <li key={p.id} className="flex items-baseline gap-2"><span aria-hidden className="size-2.5" style={{ background: p.color }} /><NumberTween value={data.counts.byPhase[p.id] ?? 0} className="text-lg font-semibold" /><span className="text-muted">{PHASE_LABEL[p.id]}</span></li>)}
        </ul>
      </div>
      <div className="lg:sticky lg:top-20 lg:self-start"><MiniMap counts={data.counts} filterPhase /></div>
    </div>
  );
}

function SummaryStep({ headRef, data, onFinish }: StepProps & { onFinish: (listen: boolean) => void }) {
  const s = useAtlas(); const scenario = s.scenario(); const material = useAtlas((x) => x.material);
  const sentence = briefingSentence({ concern: s.concern, scenario, counts: data.counts, phases: s.fuelFilter, solidMax: data.solidMax, kpaLabel: formatPressure(scenario.totalKpa, s.unit) });
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div>
        <H headRef={headRef}>Your briefing</H>
        <p className="mt-6 max-w-[30ch] text-2xl leading-snug md:text-3xl" data-testid="briefing-sentence" aria-live="polite">{sentence}</p>
        {material && <p className="mt-2 text-sm text-muted">Material focus: {material}</p>}
        <div className="mt-4 flex flex-wrap gap-2"><Chip tone="neutral">CODE</Chip><Chip>{scenario.label}</Chip><Chip>{s.concern}</Chip>{s.fuelFilter.map((f) => <Chip key={f}>{f}</Chip>)}</div>
        {data.counts.unplaceable > 0 && <p className="mt-3 text-sm text-muted"><NumberTween value={data.counts.unplaceable} /> tests did not report oxygen or pressure, so they cannot be placed. That is unknown, not none.</p>}
        <div className="mt-8 flex flex-wrap gap-3">
          <Button variant="primary" size="lg" onClick={() => onFinish(false)} data-testid="open-atlas" icon={<ArrowRight size={18} aria-hidden />}>Open the atlas</Button>
          <Button size="lg" onClick={() => onFinish(true)} data-testid="listen-briefing">Listen to the briefing</Button>
        </div>
      </div>
      <div><MiniMap counts={data.counts} filterPhase /></div>
    </div>
  );
}
