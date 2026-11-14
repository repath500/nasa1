import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { ScenarioId } from '@fire/contracts';

type OrbitProps = { focus?: ScenarioId | null; onArrive?: () => void; flamesToward?: ScenarioId | null; className?: string };
const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bodies = [{ x: 110, y: 130, radius: 55, color: [34, 110, 165] }, { x: 285, y: 100, radius: 30, color: [147, 151, 158] }, { x: 415, y: 145, radius: 25, color: [190, 92, 51] }];
type Drift = { body: (typeof bodies)[number] | null; progress: number; all: boolean };
const bodyFor = (id?: ScenarioId | null) => (id === 'exploration-upper' ? bodies[2] : id === 'lunar-cabin-example' ? bodies[1] : null) ?? null;
const lerp = (from: number, to: number, t: number) => from + (to - from) * t;
function render(context: CanvasRenderingContext2D, time: number, focus: ScenarioId | null | undefined, drift: Drift) {
  const width = 480, height = 270, image = context.createImageData(width, height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    let red = 5, green = 8, blue = 13;
    const threshold = (bayer[(y % 4) * 4 + x % 4] ?? 0) / 16;
    for (const body of bodies) {
      const dx = (x - body.x) / body.radius, dy = (y - body.y) / body.radius, distance = dx * dx + dy * dy;
      if (distance < 1) { const light = Math.max(0.12, (-dx - dy + Math.sqrt(1 - distance) * 1.5) / 2.5); const texture = .7 + .3 * Math.sin(x * .14 + Math.sin(y * .09) * 3 + time * .00002); const value = Math.floor((light * texture * 4 + threshold)) / 4; red = (body.color[0] ?? 0) * value; green = (body.color[1] ?? 0) * value; blue = (body.color[2] ?? 0) * value; }
    }
    const star = ((x * 127 + y * 311) % 10391 === 0); if (star) { red = 130; green = 151; blue = 170; }
    const index = (y * width + x) * 4; image.data[index] = red; image.data[index + 1] = green; image.data[index + 2] = blue; image.data[index + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  context.strokeStyle = '#53697a'; context.setLineDash([2, 4]); context.beginPath(); context.ellipse(110, 130, 92, 27, -.15, 0, Math.PI * 2); context.stroke(); context.setLineDash([]);
  const earth = bodies[0]!;
  for (let index = 0; index < 35; index++) {
    const angle = index * 2.4 + time * .00015, spread = index % 4 * 3;
    // Motivated motion (SPEC 3.1): a handful of flames (every third) leave Earth for the hinted body. A selected destination sends them all.
    const mix = drift.body && (drift.all || index % 3 === 0) ? 1 - (1 - drift.progress) ** 2 : 0;
    const target = drift.body ?? earth;
    const fromRadius = earth.radius + 18 + spread, toRadius = target.radius + 18 + spread;
    const x = lerp(earth.x + Math.cos(angle) * fromRadius, target.x + Math.cos(angle) * toRadius, mix);
    const y = lerp(earth.y + Math.sin(angle) * fromRadius * .3, target.y + Math.sin(angle) * toRadius * .3, mix);
    context.fillStyle = ['#6ec1f5', '#ff9447', '#56d3c1'][index % 3] ?? '#fff'; context.fillRect(x, y, 2, 3);
  }
  context.fillStyle = '#e8eaed'; context.font = '11px system-ui'; context.fillText('Earth', 95, 210); context.fillText('Moon', 269, 152); context.fillText('Exploration atmosphere', 348, 199);
  if (focus) { context.fillStyle = '#a8dcff'; context.fillText('Selected destination', 12, 20); }
}
/** Maps a pointer position on the contained canvas back to the 480 x 270 scene. */
function scenePoint(element: HTMLCanvasElement, clientX: number, clientY: number) {
  const box = element.getBoundingClientRect(), scale = Math.min(box.width / 480, box.height / 270);
  return { x: (clientX - box.left - (box.width - 480 * scale) / 2) / scale, y: (clientY - box.top - (box.height - 270 * scale) / 2) / scale };
}
const overMoon = (point: { x: number; y: number }) => Math.hypot(point.x - bodies[1]!.x, point.y - bodies[1]!.y) <= bodies[1]!.radius + 4;
export default function OrbitScene({ focus, onArrive, flamesToward, className }: OrbitProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const hinted = useRef<ScenarioId | null>(null);
  const progress = useRef(0);
  const lastBody = useRef<Drift['body']>(null);
  useEffect(() => {
    const element = canvas.current, context = element?.getContext('2d'); if (!element || !context) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)'); let visible = false, frame = 0, last = 0;
    const goal = () => bodyFor(flamesToward ?? hinted.current);
    const paint = (time: number) => {
      const body = goal(); if (body) lastBody.current = body; const dt = last ? Math.min(64, time - last) : 0; last = time;
      progress.current = motion.matches ? (body ? 1 : 0) : Math.max(0, Math.min(1, progress.current + (body ? dt : -dt) / 900));
      render(context, time, focus, { body: body ?? lastBody.current, progress: progress.current, all: flamesToward != null });
    };
    const draw = (time: number) => { if (!visible) return; paint(time); if (!motion.matches) frame = requestAnimationFrame(draw); };
    const observer = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? false; cancelAnimationFrame(frame); last = 0; if (visible) draw(performance.now()); }); observer.observe(element);
    // fa:orbit-hint (detail.target): the landing CTA asks flames to drift toward a body. A static frame is repainted for reduced motion.
    const onHint = (event: Event) => { hinted.current = (event as CustomEvent<{ target?: ScenarioId | null }>).detail?.target ?? null; if (visible && motion.matches) paint(performance.now()); };
    window.addEventListener('fa:orbit-hint', onHint);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener('fa:orbit-hint', onHint); };
  }, [focus, flamesToward]);
  useEffect(() => { if (!focus || !onArrive) return; const timer = window.setTimeout(onArrive, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 900); return () => clearTimeout(timer); }, [focus, onArrive]);
  return <canvas ref={canvas} width={480} height={270} className={className} role="img" aria-label="Illustration of Earth, Moon, and an exploration atmosphere, with flames orbiting" style={{ width: '100%', height: '100%', minHeight: 200, objectFit: 'contain', display: 'block', imageRendering: 'pixelated', background: '#05080d' }}
    onClick={event => { if (overMoon(scenePoint(event.currentTarget, event.clientX, event.clientY))) window.dispatchEvent(new CustomEvent('fa:moon-click')); }}
    onPointerMove={event => { event.currentTarget.style.cursor = overMoon(scenePoint(event.currentTarget, event.clientX, event.clientY)) ? 'pointer' : 'default'; }} />;
}
export function OrbitToMapTransition({ focus, onArrive, children, className }: OrbitProps & { children?: ReactNode }) {
  const [flying, setFlying] = useState(false);
  const [arrived, setArrived] = useState(false);
  const callback = useRef(onArrive);
  callback.current = onArrive;
  useEffect(() => {
    setFlying(false);
    setArrived(false);
    if (!focus) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setArrived(true);
      callback.current?.();
      return;
    }
    const frame = requestAnimationFrame(() => setFlying(true));
    const timer = window.setTimeout(() => { setArrived(true); callback.current?.(); }, 900);
    return () => { cancelAnimationFrame(frame); clearTimeout(timer); };
  }, [focus]);
  const origin = focus === 'exploration-upper' ? '86% 54%' : focus === 'lunar-cabin-example' ? '59% 37%' : '23% 48%';
  return <div className={className} style={{ position: 'relative', overflow: 'hidden' }}>
    <div style={{ opacity: flying ? 0 : 1, transform: flying ? 'scale(4)' : 'scale(1)', transformOrigin: origin, transition: 'transform 900ms cubic-bezier(.2,0,0,1), opacity 900ms ease', pointerEvents: arrived ? 'none' : 'auto' }}><OrbitScene flamesToward={focus}/></div>
    <div aria-hidden={!arrived} style={{ position: arrived ? 'relative' : 'absolute', inset: 0, opacity: flying || arrived ? 1 : 0, transition: 'opacity 900ms ease', pointerEvents: arrived ? 'auto' : 'none' }}>{children}</div>
  </div>;
}
