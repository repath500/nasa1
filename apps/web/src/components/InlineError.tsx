import { WarningCircle } from '@phosphor-icons/react';
import { Button } from './Button';

/** Errors are inline with Retry and what still works (SPEC §3.18, never a toast). */
export function InlineError({ message, stillWorks, onRetry, className = '' }: { message: string; stillWorks?: string; onRetry?: () => void; className?: string }) {
  return (
    <div role="alert" className={`flex items-start gap-3 border border-[var(--color-danger-text)] p-3 text-sm ${className}`}>
      <WarningCircle size={18} className="mt-0.5 shrink-0 text-[color:var(--color-danger-text)]" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-[color:var(--color-danger-text)]">{message}</p>
        {stillWorks && <p className="mt-1 text-muted">{stillWorks}</p>}
      </div>
      {onRetry && <Button size="sm" variant="quiet" onClick={onRetry}>Retry</Button>}
    </div>
  );
}
