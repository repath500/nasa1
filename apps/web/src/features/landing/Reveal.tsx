import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';

/**
 * Calm section reveal: the first time a section scrolls into view, its content fades in and rises 24 px with a long
 * ease-out. One IntersectionObserver per section, no scroll listener, transform and opacity only (GPU-composited).
 * Children marked data-reveal-item follow in a short stagger. Under reduced motion everything is shown at once.
 * The dither stays in the image plates; text never dissolves.
 */
export function Reveal({ children, className = '', as: Tag = 'section', ...rest }: { children: ReactNode; className?: string; as?: 'section' | 'div' | 'footer'; 'aria-labelledby'?: string }) {
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (reduce || !el || typeof IntersectionObserver === 'undefined') { setShown(true); return; }
    // Already on screen at load (deep link, refresh mid-page): show without animating.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9 && rect.bottom > 0) { setShown(true); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) { setShown(true); io.disconnect(); }
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  return (
    <Tag {...rest} className={`lp-reveal ${shown ? 'is-in' : ''} ${className}`}>
      <div ref={box} className="lp-reveal-inner">{children}</div>
    </Tag>
  );
}
