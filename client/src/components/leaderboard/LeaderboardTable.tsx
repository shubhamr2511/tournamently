import clsx from 'clsx';
import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CharacterAvatar } from '../player/CharacterAvatar';
import { firstNameWithInitials } from '../../utils/formatting';
import type { ILeaderboardRow } from '../../types';

interface Props {
  rows: ILeaderboardRow[];
  slug: string;
  highlightZones?: boolean;
}

const FLIP_DURATION_MS = 1500;

function rankZone(rank: number): string {
  if (rank === 1) return 'border-l-accent-yellow';
  if (rank <= 4) return 'border-l-accent-yellow/60';
  if (rank <= 8) return 'border-l-accent-blue/60';
  return 'border-l-transparent';
}

function rankBadge(rank: number) {
  const color =
    rank === 1
      ? 'bg-gradient-gold text-black'
      : rank === 2
        ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black'
        : rank === 3
          ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white'
          : 'bg-bg-tertiary text-text-secondary';
  return (
    <div
      className={`h-9 w-9 flex items-center justify-center clip-angled font-display text-sm font-bold ${color}`}
    >
      {rank}
    </div>
  );
}

export function LeaderboardTable({ rows, slug, highlightZones = true }: Props) {
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());
  const prevPositions = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    const newPositions = new Map<string, number>();
    rowRefs.current.forEach((el, id) => {
      newPositions.set(id, el.getBoundingClientRect().top);
    });

    rowRefs.current.forEach((el, id) => {
      const prev = prevPositions.current.get(id);
      const next = newPositions.get(id);
      if (prev === undefined || next === undefined || prev === next) return;
      const delta = prev - next;
      el.animate(
        [
          { transform: `translateY(${delta}px)` },
          { transform: 'translateY(0)' },
        ],
        {
          duration: FLIP_DURATION_MS,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'both',
        },
      );
      const accent =
        delta > 0
          ? 'rgba(34, 197, 94, 0.18)'
          : 'rgba(239, 68, 68, 0.18)';
      el.animate(
        [
          { backgroundColor: accent },
          { backgroundColor: 'transparent' },
        ],
        {
          duration: FLIP_DURATION_MS + 400,
          easing: 'ease-out',
          fill: 'both',
        },
      );
    });

    prevPositions.current = newPositions;
  }, [rows]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left font-display uppercase tracking-wider text-xs text-text-muted">
            <th className="py-2 pr-3">Rank</th>
            <th className="py-2 pr-3">Player</th>
            <th className="py-2 pr-3 text-center">MP</th>
            <th className="py-2 pr-3 text-center text-accent-green">W</th>
            <th className="py-2 pr-3 text-center text-accent-red">L</th>
            <th className="py-2 pr-3 text-center">Bonus</th>
            <th className="py-2 pr-3 text-center hidden sm:table-cell">PR</th>
            <th className="py-2 pr-3 text-center hidden sm:table-cell">FW</th>
            <th className="py-2 pr-3 text-center hidden md:table-cell">G+/-</th>
            <th className="py-2 pr-3 text-right">Win %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.player._id}
              ref={(el) => {
                if (el) rowRefs.current.set(r.player._id, el);
                else rowRefs.current.delete(r.player._id);
              }}
              className={clsx(
                'border-l-2 transition-colors hover:bg-bg-hover',
                highlightZones && rankZone(r.rank),
              )}
            >
              <td className="py-2 pr-3">{rankBadge(r.rank)}</td>
              <td className="py-2 pr-3">
                <Link
                  to={`/t/${slug}/player/${r.player._id}`}
                  className="flex items-center gap-2 hover:text-accent-yellow"
                >
                  <CharacterAvatar
                    name={r.player.gamerTag}
                    character={r.player.character}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <div className="font-display tracking-wider truncate">
                      {r.player.gamerTag}
                    </div>
                    <div className="text-[10px] text-text-muted truncate">
                      {firstNameWithInitials(r.player.name)}
                    </div>
                  </div>
                </Link>
              </td>
              <td className="py-2 pr-3 text-center font-mono">
                {r.matchesPlayed}
              </td>
              <td className="py-2 pr-3 text-center font-mono text-accent-green">
                {r.wins}
              </td>
              <td className="py-2 pr-3 text-center font-mono text-accent-red">
                {r.losses}
              </td>
              <td className="py-2 pr-3 text-center font-mono text-accent-yellow">
                {r.bonusPoints}
              </td>
              <td className="py-2 pr-3 text-center font-mono hidden sm:table-cell">
                {r.perfectRounds}
              </td>
              <td className="py-2 pr-3 text-center font-mono hidden sm:table-cell">
                {r.fastWins}
              </td>
              <td className="py-2 pr-3 text-center font-mono hidden md:table-cell">
                {r.gameDiff > 0 ? `+${r.gameDiff}` : r.gameDiff}
              </td>
              <td className="py-2 pr-3 text-right font-mono text-text-secondary">
                {r.winPercentage}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
