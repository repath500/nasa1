import type { ReactNode } from 'react';
export function Kbd({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <kbd className={`mono inline-flex min-w-[1.5rem] items-center justify-center border border-strong bg-raised px-1.5 py-[1px] text-[11px] leading-5 text-ink ${className}`}>{children}</kbd>;
}
