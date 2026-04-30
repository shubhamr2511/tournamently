import clsx from 'clsx';

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'h-6 w-6 rounded-full border-2 border-border border-t-accent-yellow animate-spin',
        className,
      )}
    />
  );
}

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-text-secondary">
      <Spinner className="h-8 w-8" />
      <span className="font-display uppercase tracking-widest text-xs">
        {label}
      </span>
    </div>
  );
}
