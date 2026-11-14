import type { ReactNode } from 'react';
import { GLOSSARY } from './glossary';
import { Tip } from './Tooltip';

/** Dotted-underline term with a hover and focus definition. */
export function GlossaryTerm({ k, children }: { k: string; children?: ReactNode }) {
  const g = GLOSSARY[k];
  if (!g) return <>{children}</>;
  return (
    <Tip content={<span><span className="block font-medium">{g.term}</span><span className="text-muted">{g.text}</span></span>}>
      <button type="button" className="cursor-help border-0 bg-transparent p-0 text-inherit underline decoration-dotted decoration-1 underline-offset-4">
        {children ?? g.term}
      </button>
    </Tip>
  );
}
