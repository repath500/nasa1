import * as RT from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';

export const TooltipProvider = ({ children }: { children: ReactNode }) => <RT.Provider delayDuration={250} skipDelayDuration={300}>{children}</RT.Provider>;

/** Tooltip around one focusable child. Content is hoverable and appears on keyboard focus. */
export function Tip({ content, children, side = 'top', open, onOpenChange }: { content: ReactNode; children: ReactNode; side?: 'top' | 'bottom' | 'left' | 'right'; open?: boolean; onOpenChange?: (o: boolean) => void }) {
  return (
    <RT.Root open={open} onOpenChange={onOpenChange}>
      <RT.Trigger asChild>{children}</RT.Trigger>
      <RT.Portal>
        <RT.Content side={side} sideOffset={6} collisionPadding={8}
          className="fa-pop max-w-[280px] border border-strong bg-raised px-3 py-2 text-[13px] leading-snug text-ink" style={{ zIndex: 'var(--z-toast)' as unknown as number }}>
          {content}
          <RT.Arrow className="fill-[var(--color-border-strong)]" />
        </RT.Content>
      </RT.Portal>
    </RT.Root>
  );
}
