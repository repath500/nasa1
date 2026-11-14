import type { ReactNode } from 'react';
/** SPEC §3.18: an empty result is a valid result with a next step. */
export function EmptyState({ title, children, action, className = '' }: { title: string; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={`border border-dashed border-strong p-6 ${className}`}>
      <p className="font-medium">{title}</p>
      {children && <div className="mt-1 max-w-[60ch] text-sm text-muted">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
