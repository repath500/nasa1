import { useEffect, useRef, useState } from 'react';
import { Dithering, type DitheringProps } from '@paper-design/shaders-react';
import { useReducedMotion } from 'motion/react';

/**
 * Paper Design shaders (Apache-2.0), the dither SDK. Animated 2-colour ordered dithering on the GPU.
 * Wrapped so every use follows the project rules: colours from the theme tokens, decorative only (aria-hidden),
 * paused while off-screen, and a still frame under prefers-reduced-motion. Text never sits on it without a solid panel.
 */
type Shape = NonNullable<DitheringProps['shape']>;
type Matrix = NonNullable<DitheringProps['type']>;

const token = (name: string, fallback: string) => {
  if (typeof document === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
};

export function SdkDither({
  shape, matrix = '4x4', speed = 0.35, scale = 1, size = 3, front = '--color-accent', className = '',
}: { shape: Shape; matrix?: Matrix; speed?: number; scale?: number; size?: number; front?: string; className?: string }) {
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  // Mount once the field first nears the viewport, then keep it mounted: off-screen it is paused (speed 0), not removed,
  // so scrolling back never makes it pop in again.
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [colors, setColors] = useState({ back: '#0B0D10', front: '#7CC4F2' });

  useEffect(() => {
    const read = () => setColors({ back: token('--color-bg', '#0B0D10'), front: token(front, '#7CC4F2') });
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, [front]);

  useEffect(() => {
    const el = box.current; if (!el) return;
    const io = new IntersectionObserver((entries) => {
      const on = entries.some((e) => e.isIntersecting);
      setVisible(on);
      if (on) setMounted(true);
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={box} aria-hidden className={`lp-sdk pointer-events-none absolute inset-0 ${mounted ? 'is-on' : ''} ${className}`}>
      {mounted && (
        <Dithering
          style={{ width: '100%', height: '100%' }}
          colorBack={colors.back}
          colorFront={colors.front}
          shape={shape}
          type={matrix}
          size={size}
          scale={scale}
          speed={reduce || !visible ? 0 : speed}
          frame={reduce ? 4000 : undefined}
        />
      )}
    </div>
  );
}
