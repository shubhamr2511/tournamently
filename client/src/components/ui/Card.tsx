import { HTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface Props extends HTMLAttributes<HTMLDivElement> {
  glow?: 'none' | 'gold' | 'red' | 'cyan' | 'purple';
  angled?: boolean;
  children: ReactNode;
}

const glowClass: Record<NonNullable<Props['glow']>, string> = {
  none: '',
  gold: 'hover:shadow-glow hover:border-accent-yellow/60',
  red: 'hover:shadow-glow-red hover:border-accent-red/60',
  cyan: 'hover:shadow-glow-cyan hover:border-accent-blue/60',
  purple: 'hover:shadow-glow-purple hover:border-accent-purple/60',
};

export function Card({
  glow = 'none',
  angled = true,
  className,
  children,
  ...rest
}: Props) {
  return (
    <div
      className={clsx(
        'bg-bg-secondary border border-border p-5 transition-all duration-200',
        angled && 'clip-angled',
        glowClass[glow],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
