import { InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, hint, error, className, ...rest },
  ref,
) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      {label && (
        <span className="font-display uppercase tracking-wider text-xs text-text-secondary">
          {label}
        </span>
      )}
      <input
        ref={ref}
        className={clsx(
          'bg-bg-tertiary border border-border px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-accent-yellow focus:outline-none focus:ring-1 focus:ring-accent-yellow/40 transition-colors',
          error && 'border-accent-red',
          className,
        )}
        {...rest}
      />
      {hint && !error && (
        <span className="text-xs text-text-muted">{hint}</span>
      )}
      {error && <span className="text-xs text-accent-red">{error}</span>}
    </label>
  );
});
