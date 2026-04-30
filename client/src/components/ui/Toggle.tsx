import clsx from 'clsx';

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled }: Props) {
  return (
    <label
      className={clsx(
        'flex items-center gap-3 cursor-pointer select-none text-sm',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative h-5 w-10 rounded-full border transition-colors',
          checked
            ? 'bg-accent-yellow/30 border-accent-yellow'
            : 'bg-bg-tertiary border-border',
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 h-3.5 w-3.5 rounded-full bg-text-primary transition-all',
            checked ? 'left-[22px] bg-accent-yellow' : 'left-0.5',
          )}
        />
      </button>
      {label && <span>{label}</span>}
    </label>
  );
}
