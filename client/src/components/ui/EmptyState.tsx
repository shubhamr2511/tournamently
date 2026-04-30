import { ReactNode } from 'react';

interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center border border-dashed border-border clip-angled bg-bg-secondary/50">
      <div className="font-display uppercase tracking-widest text-text-secondary text-sm">
        {title}
      </div>
      {description && (
        <div className="text-xs text-text-muted max-w-sm">{description}</div>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
