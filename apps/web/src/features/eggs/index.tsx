import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X } from '@phosphor-icons/react';
import { useCorpus } from '../../data/useCorpus';
import { useUi } from '../../shell/uiStore';
import { KEYS, lsGet, lsSet } from '../../shell/storage';
import { Button, LinkButton } from '../../components/Button';
import { DitherCanvas } from '../../components/DitherCanvas';
import { flameLum } from '../../components/flame';
import { Tip } from '../../components/Tooltip';
import { toast } from '../../components/ToastHost';
import { feedEggKey } from './keys';
import { CANDLE_CAPTION, FLIGHT_RULES, LEDGER_3400_TIP, MOON_CARD } from './registry';

type Card = null | 'candle' | 'moon';

/** Mounted once by the shell. Key listeners ignore inputs (feedEggKey). Honours the global off switch. */
export default function EggHost() {
  const off = useUi((s) => s.eggsOff);
  const navigate = useNavigate();
  const corpusState = useCorpus();
  const [card, setCard] = useState<Card>(null);
  const moonClicks = useRef({ n: 0, t: 0 });
  const logged = useRef(false);

  // Capture phase, so shell shortcuts can see whether a secret word is mid-typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const r = feedEggKey(e);
      if (useUi.getState().eggsOff) return;
      if (r.word === 'candle' && !/^\/learn/.test(window.location.pathname)) setCard('candle');
      if (r.konami) { lsSet(KEYS.konami, '1'); toast('Flight rules unlocked', { action: { label: 'Open', onClick: () => navigate('/flight-rules') } }); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [navigate]);

  useEffect(() => {
    const moon = () => {
      if (useUi.getState().eggsOff) return;
      const now = Date.now(); const m = moonClicks.current;
      m.n = now - m.t < 1800 ? m.n + 1 : 1; m.t = now;
      if (m.n >= 3) { m.n = 0; setCard('moon'); }
    };
    const timelineEnd = () => {
      if (useUi.getState().eggsOff || corpusState.status !== 'ready') return;
      const { rows, cards } = corpusState.corpus;
      const years = rows.map((r) => (r.date ? Number(r.date.slice(0, 4)) : NaN)).filter((y) => Number.isFinite(y));
      const span = years.length ? `${Math.min(...years)} to ${Math.max(...years)}` : 'The record';
      toast(`${span}: ${rows.length} tests in ${cards.length} investigations. More to come from LUCI and FM2.`);
    };
    window.addEventListener('fa:moon-click', moon); window.addEventListener('fa:timeline-end', timelineEnd);
    return () => { window.removeEventListener('fa:moon-click', moon); window.removeEventListener('fa:timeline-end', timelineEnd); };
  }, [corpusState]);

  // Console flame: counts come from the loaded corpus, never hard-coded.
  useEffect(() => {
    if (logged.current || corpusState.status !== 'ready') return; logged.current = true;
    const c = corpusState.corpus;
    const flame = ['      (  )', '     (    )', '    (  /\\  )', '     )(  )(', '      \\\\//', '       ||'].join('\n');
    console.log(`%c${flame}\n\nFire Atlas\ncorpus hash: ${c.corpusHash}${c.fixture ? ' (fixture)' : ''}\nrows parsed: ${c.rows.length}, rejected by code: ${c.rejects.length}\nmethod: ${window.location.origin}/method\nNASA does not endorse this project.`, 'color:#7CC4F2;font-family:monospace');
  }, [corpusState]);

  if (off) return null;
  return (
    <Dialog.Root open={card !== null} onOpenChange={(o) => !o && setCard(null)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fa-overlay fixed inset-0" style={{ background: 'var(--scrim)', zIndex: 'var(--z-palette)' as unknown as number }} />
        <Dialog.Content className="fa-pop fixed left-1/2 top-1/2 w-[min(420px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 border border-strong bg-surface p-5" style={{ zIndex: 'var(--z-palette)' as unknown as number }}>
          <Dialog.Close className="absolute right-2 top-2 grid size-10 place-items-center hover:bg-raised" aria-label="Close"><X size={18} /></Dialog.Close>
          {card === 'candle' && <CandleEgg />}
          {card === 'moon' && (
            <>
              <Dialog.Title className="text-lg font-semibold">Same partial pressure, different story</Dialog.Title>
              <Dialog.Description className="mt-3 text-sm leading-relaxed">{MOON_CARD}</Dialog.Description>
              <div className="mt-4"><Button variant="primary" onClick={() => setCard(null)}>Back to the map</Button></div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function CandleEgg() {
  const [m, setM] = useState(0);
  useEffect(() => { const t0 = performance.now(); let raf = 0; const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tick = (n: number) => { const p = Math.min(1, (n - t0 - 600) / 2600); setM(Math.max(0, p)); if (p < 1) raf = requestAnimationFrame(tick); };
    if (reduce) setM(1); else raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf); }, []);
  return (
    <>
      <Dialog.Title className="sr-only">Candle flame in microgravity</Dialog.Title>
      <DitherCanvas lum={(u, v, t) => flameLum(u, v, t, m)} cell={5} fgVar={m > 0.95 ? '--color-accent' : '--color-flag-text'} className="mx-auto aspect-square w-full max-w-[280px]" label="Dithered candle flame morphing from a teardrop to a sphere" />
      <Dialog.Description className="mt-3 text-sm leading-relaxed">{CANDLE_CAPTION}</Dialog.Description>
    </>
  );
}

/** Wrap a ledger cell. Hover or focus on the 3400% value for 3 seconds shows the tooltip (SPEC §9). W5 uses this in the ledger. */
export function LedgerEggTip({ rawValue, children }: { rawValue: string; children: ReactNode }) {
  const off = useUi((s) => s.eggsOff);
  const [open, setOpen] = useState(false); const t = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(t.current), []);
  if (rawValue.replace(/\s/g, '') !== '3400%' || off) return <>{children}</>;
  const start = () => { clearTimeout(t.current); t.current = setTimeout(() => setOpen(true), 3000); };
  const stop = () => { clearTimeout(t.current); setOpen(false); };
  return (
    <Tip open={open} onOpenChange={() => { /* controlled by the 3 second timer */ }} content={LEDGER_3400_TIP}>
      <span tabIndex={0} onMouseEnter={start} onMouseLeave={stop} onFocus={start} onBlur={stop}>{children}</span>
    </Tip>
  );
}

export function FlightRulesPage() {
  const unlocked = lsGet(KEYS.konami) === '1';
  if (!unlocked) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24">
        <h1 className="text-3xl">Flight rules are not unlocked</h1>
        <p className="mt-3 text-muted">This page opens for people who know a classic sequence.</p>
        <LinkButton to="/" className="mt-6">Back home</LinkButton>
      </div>
    );
  }
  return (
    <article className="mx-auto max-w-[760px] px-4 py-16">
      <h1 className="text-4xl">Flight rules</h1>
      <p className="mt-3 max-w-[60ch] text-muted">The rules this atlas lives by. Each one is enforced by code, tests or review.</p>
      <ol className="compartments mt-8">
        {FLIGHT_RULES.map((r) => (
          <li key={r.id} className="grid grid-cols-[4.5rem_1fr] gap-3 p-4"><span className="mono text-sm text-accent">{r.id}</span><span>{r.rule}</span></li>
        ))}
      </ol>
      <p className="mt-8 text-sm text-muted">See the <Link to="/method">method and limits</Link> for the full reasoning.</p>
    </article>
  );
}
