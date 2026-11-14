export function Skeleton({ className = '', label }: { className?: string; label?: string }) {
  return <div role={label ? 'status' : undefined} aria-label={label} aria-hidden={label ? undefined : true} className={`fa-pulse bg-raised ${className}`} />;
}
