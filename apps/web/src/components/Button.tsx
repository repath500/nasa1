import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'ghost' | 'quiet';
type Size = 'sm' | 'md' | 'lg';

const base = 'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[2px] font-medium select-none overflow-hidden ' +
  'transition-[transform,background-color,border-color,color] duration-[var(--dur-step)] ease-[var(--ease-out)] ' +
  'active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 aria-disabled:opacity-50 aria-disabled:cursor-not-allowed';
const variants: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink border border-accent hover:brightness-110',
  secondary: 'bg-transparent text-ink border border-strong hover:border-accent hover:text-accent',
  ghost: 'bg-transparent text-ink border border-transparent hover:bg-raised',
  quiet: 'bg-raised text-ink border border-hairline hover:border-strong',
};
const sizes: Record<Size, string> = { sm: 'min-h-8 px-3 text-[13px]', md: 'min-h-10 px-4 text-sm', lg: 'min-h-12 px-6 text-base' };
export const buttonClass = (variant: Variant = 'secondary', size: Size = 'md', extra = '') => `${base} ${variants[variant]} ${sizes[size]} ${extra}`;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Loading keeps the button width: the label stays in the layout, hidden, and a progress bar runs inside. */
  loading?: boolean;
  loadingLabel?: string;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', loading = false, loadingLabel, icon, className = '', children, disabled, type = 'button', ...rest }, ref,
) {
  return (
    <button ref={ref} type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={buttonClass(variant, size, className)} {...rest}>
      <span className={`inline-flex items-center gap-2 ${loading ? 'invisible' : ''}`}>{icon}{children}</span>
      {loading && (
        <>
          <span className="absolute inset-0 flex items-center justify-center" role="status">{loadingLabel ?? 'Working'}</span>
          <span aria-hidden className="absolute bottom-0 left-0 h-[2px] w-full overflow-hidden"><span className="block h-full w-1/2 bg-current opacity-70 [animation:fa-bar_1.1s_linear_infinite]" /></span>
        </>
      )}
    </button>
  );
});

export function LinkButton({ variant = 'secondary', size = 'md', className = '', icon, children, ...rest }: LinkProps & { variant?: Variant; size?: Size; icon?: ReactNode }) {
  return <Link {...rest} className={`${buttonClass(variant, size, className)} no-underline hover:no-underline`}>{icon}{children}</Link>;
}
