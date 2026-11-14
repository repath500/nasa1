import * as Dialog from '@radix-ui/react-dialog';
import { X } from '@phosphor-icons/react';
import type { ReactNode } from 'react';

/** Radix Dialog as a drawer. Focus trap, Esc to close, focus returns to the trigger. */
export function Sheet({ open, onOpenChange, title, description, side = 'right', children, widthClass = 'w-[min(100vw,440px)]', hideTitle = false }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; side?: 'right' | 'bottom'; children: ReactNode; widthClass?: string; hideTitle?: boolean;
}) {
  const pos = side === 'right' ? `fa-sheet-right right-0 top-0 h-[100dvh] ${widthClass} border-l` : 'fa-sheet-bottom bottom-0 left-0 right-0 max-h-[85dvh] border-t';
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fa-overlay fixed inset-0" style={{ background: 'var(--scrim)', zIndex: 'var(--z-drawer)' as unknown as number }} />
        <Dialog.Content aria-describedby={description ? undefined : undefined}
          className={`fixed flex flex-col border-strong bg-surface ${pos}`} style={{ zIndex: 'var(--z-drawer)' as unknown as number }}>
          <div className="flex items-start justify-between gap-4 border-b border-hairline p-4">
            <div className="min-w-0">
              <Dialog.Title className={hideTitle ? 'sr-only' : 'text-lg font-semibold'}>{title}</Dialog.Title>
              {description ? <Dialog.Description className="mt-1 text-sm text-muted">{description}</Dialog.Description> : <Dialog.Description className="sr-only">{title}</Dialog.Description>}
            </div>
            <Dialog.Close className="grid size-10 shrink-0 place-items-center rounded-[2px] hover:bg-raised" aria-label="Close"><X size={18} /></Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
