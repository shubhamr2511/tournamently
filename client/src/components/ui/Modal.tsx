import { ReactNode, useEffect } from 'react';
import clsx from 'clsx';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-slide-up"
      onClick={onClose}
    >
      <div
        className={clsx(
          'clip-angled bg-bg-secondary border border-border shadow-glow w-full max-w-lg p-6',
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 className="font-display text-xl uppercase tracking-wider text-accent-yellow mb-4">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}
