export interface BadgeMeta {
  icon: string;
  border: string;
  text: string;
  bg: string;
}

export const BADGE_META: Record<string, BadgeMeta> = {
  iron_fist:    { icon: '👑', border: 'border-accent-yellow', text: 'text-accent-yellow', bg: 'bg-accent-yellow/10' },
  rage_driver:  { icon: '🔥', border: 'border-accent-red',    text: 'text-accent-red',    bg: 'bg-accent-red/10' },
  prefectionist:{ icon: '🎯', border: 'border-accent-blue',   text: 'text-accent-blue',   bg: 'bg-accent-blue/10' },
  speed_runner: { icon: '⚡', border: 'border-accent-green',  text: 'text-accent-green',  bg: 'bg-accent-green/10' },
  king_slayer:  { icon: '⚔️', border: 'border-accent-purple', text: 'text-accent-purple', bg: 'bg-accent-purple/10' },
  iron_wall:    { icon: '🛡️', border: 'border-accent-blue',   text: 'text-accent-blue',   bg: 'bg-accent-blue/10' },
  streakmaster: { icon: '📈', border: 'border-accent-red',    text: 'text-accent-red',    bg: 'bg-accent-red/10' },
  giant_slayer: { icon: '🗡️', border: 'border-accent-purple', text: 'text-accent-purple', bg: 'bg-accent-purple/10' },
  drama_queen:  { icon: '🎭', border: 'border-accent-yellow', text: 'text-accent-yellow', bg: 'bg-accent-yellow/10' },
  philosopher:  { icon: '🧠', border: 'border-accent-blue',   text: 'text-accent-blue',   bg: 'bg-accent-blue/10' },
  the_bully:    { icon: '👊', border: 'border-accent-red',    text: 'text-accent-red',    bg: 'bg-accent-red/10' },
  whoopsie:     { icon: '💥', border: 'border-accent-green',  text: 'text-accent-green',  bg: 'bg-accent-green/10' },
  endurance_pro:{ icon: '♾️', border: 'border-accent-yellow', text: 'text-accent-yellow', bg: 'bg-accent-yellow/10' },
  the_donator:  { icon: '🎁', border: 'border-border',        text: 'text-text-secondary', bg: 'bg-bg-tertiary' },
};

export const FALLBACK_BADGE_META: BadgeMeta = {
  icon: '★',
  border: 'border-border',
  text: 'text-text-secondary',
  bg: 'bg-bg-tertiary',
};
