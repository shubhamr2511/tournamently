import { HTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

type Tone =
  | 'gold'
  | 'red'
  | 'green'
  | 'blue'
  | 'purple'
  | 'gray'
  | 'fire';

interface Props extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  children: ReactNode;
}

const toneClass: Record<Tone, string> = {
  gold: 'border-accent-yellow text-accent-yellow bg-accent-yellow/10',
  red: 'border-accent-red text-accent-red bg-accent-red/10',
  green: 'border-accent-green text-accent-green bg-accent-green/10',
  blue: 'border-accent-blue text-accent-blue bg-accent-blue/10',
  purple: 'border-accent-purple text-accent-purple bg-accent-purple/10',
  gray: 'border-border text-text-secondary bg-bg-tertiary',
  fire: 'border-accent-red text-white bg-gradient-fire',
};

export function Badge({ tone = 'gray', className, children, ...rest }: Props) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-display uppercase tracking-wider border',
        toneClass[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
