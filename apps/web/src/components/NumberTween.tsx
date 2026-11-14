import { animate, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

/** SPEC §7: 200 ms count tween, instant under reduced motion. Screen readers get the final value only. */
export function NumberTween({ value, format = (n) => String(Math.round(n)), duration = 0.2, className = '' }: { value: number; format?: (n: number) => string; duration?: number; className?: string }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (reduce || from.current === value) { from.current = value; setShown(value); return; }
    const c = animate(from.current, value, { duration, ease: [0.2, 0, 0, 1], onUpdate: (v) => { from.current = v; setShown(v); } });
    return () => { c.stop(); };
  }, [value, reduce, duration]);
  return (
    <span className={`num ${className}`}>
      <span className="sr-only">{format(value)}</span>
      <span aria-hidden>{format(shown)}</span>
    </span>
  );
}
