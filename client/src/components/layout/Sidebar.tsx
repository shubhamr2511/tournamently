import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

const items = [
  { label: 'Dashboard', path: 'dashboard' },
  { label: 'Players', path: 'players' },
  { label: 'Fixtures', path: 'fixtures' },
  { label: 'Matches', path: 'matches' },
  { label: 'Leaderboard', path: 'leaderboard' },
  { label: 'Playoffs', path: 'playoffs' },
];

export function Sidebar({ slug }: { slug: string }) {
  return (
    <aside className="w-56 shrink-0 border-r border-border bg-bg-secondary/50 p-4 hidden md:block">
      <nav className="flex flex-col gap-1">
        {items.map((it) => (
          <NavLink
            key={it.path}
            to={`/t/${slug}/${it.path}`}
            className={({ isActive }) =>
              clsx(
                'px-3 py-2 text-sm font-display uppercase tracking-wider transition-all border-l-2',
                isActive
                  ? 'border-accent-yellow text-accent-yellow bg-accent-yellow/5'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border hover:bg-bg-hover',
              )
            }
          >
            {it.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
