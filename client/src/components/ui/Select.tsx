import { SelectHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { label, error, options, className, ...rest },
  ref,
) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      {label && (
        <span className="font-display uppercase tracking-wider text-xs text-text-secondary">
          {label}
        </span>
      )}
      <select
        ref={ref}
        className={clsx(
          'bg-bg-tertiary border border-border px-3 py-2 text-text-primary focus:border-accent-yellow focus:outline-none focus:ring-1 focus:ring-accent-yellow/40 transition-colors',
          error && 'border-accent-red',
          className,
        )}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-accent-red">{error}</span>}
    </label>
  );
});
