import type { ReactNode } from 'react';

/** Placeholder. W1 replaces with the real shell (top bar, status chip, palette, audio bar host, eggs host, toasts). */
export default function AppShell({ children }: { children: ReactNode }) {
  return <div data-theme="night" className="min-h-[100dvh]">{children}</div>;
}
