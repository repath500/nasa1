import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { ScenarioId } from '@fire/contracts';

type OrbitProps = { focus?: ScenarioId | null; onArrive?: () => void; flamesToward?: ScenarioId | null; className?: string };
const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bodies = [{ x: 110, y: 130, radius: 55, color: [34, 110, 165] }, { x: 285, y: 100, radius: 30, color: [147, 151, 158] }, { x: 415, y: 145, radius: 25, color: [190, 92, 51] }];
function render(context: CanvasRenderingContext2D, time: number, focus?: ScenarioId | null, flamesToward?: ScenarioId | null) {
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
  for (let index = 0; index < 35; index++) { const angle = index * 2.4 + time * .00015, target = flamesToward === 'exploration-upper' ? bodies[2] : flamesToward === 'lunar-cabin-example' ? bodies[1] : bodies[0]; if (!target) continue; const radius = target.radius + 18 + index % 4 * 3; const x = target.x + Math.cos(angle) * radius, y = target.y + Math.sin(angle) * radius * .3; context.fillStyle = ['#6ec1f5', '#ff9447', '#56d3c1'][index % 3] ?? '#fff'; context.fillRect(x, y, 2, 3); }
  context.fillStyle = '#e8eaed'; context.font = '11px system-ui'; context.fillText('Earth', 95, 210); context.fillText('Moon', 269, 152); context.fillText('Exploration atmosphere', 348, 199);
  if (focus) { context.fillStyle = '#a8dcff'; context.fillText('Selected destination', 12, 20); }
}
export default function OrbitScene({ focus, onArrive, flamesToward, className }: OrbitProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = canvas.current, context = element?.getContext('2d'); if (!element || !context) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)'); let visible = false, frame = 0;
    const draw = (time: number) => { if (!visible) return; render(context, time, focus, flamesToward); if (!motion.matches) frame = requestAnimationFrame(draw); };
    const observer = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? false; cancelAnimationFrame(frame); if (visible) draw(performance.now()); }); observer.observe(element);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [focus, flamesToward]);
  useEffect(() => { if (!focus || !onArrive) return; const timer = window.setTimeout(onArrive, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 900); return () => clearTimeout(timer); }, [focus, onArrive]);
  return <canvas ref={canvas} width={480} height={270} className={className} role="img" aria-label="Illustration of Earth, Moon, and an exploration atmosphere, with flames orbiting" style={{ width: '100%', height: 'auto', imageRendering: 'pixelated', background: '#05080d' }} />;
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
