import { ButtonHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-gold text-black font-bold hover:shadow-glow active:translate-y-[1px]',
  secondary:
    'bg-bg-tertiary text-text-primary border border-border hover:border-accent-yellow hover:text-accent-yellow',
  ghost:
    'bg-transparent text-text-secondary hover:bg-bg-hover hover:text-text-primary',
  danger:
    'bg-gradient-fire text-white font-bold hover:shadow-glow-red active:translate-y-[1px]',
  outline:
    'bg-transparent text-accent-blue border border-accent-blue hover:bg-accent-blue/10',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', loading, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'clip-angled font-display uppercase tracking-wider transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading && (
        <span className="h-3 w-3 rounded-full bg-current animate-pulse-soft" />
      )}
      {children}
    </button>
  );
});
