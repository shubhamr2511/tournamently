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
  showMovement?: boolean;
}

function MovementIndicator({
  delta,
  hasBaseline,
}: {
  delta: number | null | undefined;
  hasBaseline: boolean;
}) {
  if (!hasBaseline) {
    return (
      <span className="font-mono text-[10px] text-text-muted" title="No baseline yet">
        —
      </span>
    );
  }
  if (delta == null) {
    return (
      <span
        className="font-mono text-[10px] text-accent-blue"
        title="New since last record"
      >
        NEW
      </span>
    );
  }
  if (delta > 0) {
    return (
      <span
        className="inline-flex items-center gap-0.5 font-mono text-[11px] text-accent-green"
        title={`Up ${delta} from last record`}
      >
        <span aria-hidden="true">▲</span>
        {delta}
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span
        className="inline-flex items-center gap-0.5 font-mono text-[11px] text-accent-red"
        title={`Down ${-delta} from last record`}
      >
        <span aria-hidden="true">▼</span>
        {-delta}
      </span>
    );
  }
  return (
    <span
      className="font-mono text-[10px] text-text-muted"
      title="No change since last record"
    >
      —
    </span>
  );
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

interface RowSnapshot {
  rank: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  bonusPoints: number;
  perfectRounds: number;
  fastWins: number;
  gameDiff: number;
  winPercentage: number;
}

function snapshotOf(r: ILeaderboardRow): RowSnapshot {
  return {
    rank: r.rank,
    matchesPlayed: r.matchesPlayed,
    wins: r.wins,
    losses: r.losses,
    bonusPoints: r.bonusPoints,
    perfectRounds: r.perfectRounds,
    fastWins: r.fastWins,
    gameDiff: r.gameDiff,
    winPercentage: r.winPercentage,
  };
}

function snapshotsEqual(a: RowSnapshot, b: RowSnapshot): boolean {
  return (
    a.rank === b.rank &&
    a.matchesPlayed === b.matchesPlayed &&
    a.wins === b.wins &&
    a.losses === b.losses &&
    a.bonusPoints === b.bonusPoints &&
    a.perfectRounds === b.perfectRounds &&
    a.fastWins === b.fastWins &&
    a.gameDiff === b.gameDiff &&
    a.winPercentage === b.winPercentage
  );
}

export function LeaderboardTable({
  rows,
  slug,
  highlightZones = true,
  showMovement = true,
}: Props) {
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());
  const prevPositions = useRef(new Map<string, number>());
  const prevSnapshots = useRef(new Map<string, RowSnapshot>());

  useLayoutEffect(() => {
    const newPositions = new Map<string, number>();
    rowRefs.current.forEach((el, id) => {
      newPositions.set(id, el.offsetTop);
    });

    const newSnapshots = new Map<string, RowSnapshot>();
    rows.forEach((r) => {
      newSnapshots.set(r.player._id, snapshotOf(r));
    });

    rows.forEach((r) => {
      const id = r.player._id;
      const el = rowRefs.current.get(id);
      if (!el) return;
      const prevSnap = prevSnapshots.current.get(id);
      const newSnap = newSnapshots.get(id);
      if (!prevSnap || !newSnap) return;
      if (snapshotsEqual(prevSnap, newSnap)) return;

      const prevPos = prevPositions.current.get(id);
      const newPos = newPositions.get(id);
      if (
        prevPos !== undefined &&
        newPos !== undefined &&
        prevPos !== newPos
      ) {
        const delta = prevPos - newPos;
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
      }

      const wonMore = newSnap.wins > prevSnap.wins;
      const lostMore = newSnap.losses > prevSnap.losses;
      const rankImproved = newSnap.rank < prevSnap.rank;
      const rankDropped = newSnap.rank > prevSnap.rank;
      const positive = wonMore || (!lostMore && rankImproved);
      const negative = lostMore || (!wonMore && rankDropped);
      const accent = positive
        ? 'rgba(34, 197, 94, 0.18)'
        : negative
          ? 'rgba(239, 68, 68, 0.18)'
          : 'rgba(234, 179, 8, 0.18)';
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
    prevSnapshots.current = newSnapshots;
  }, [rows]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left font-display uppercase tracking-wider text-xs text-text-muted">
            <th className="py-2 pr-3">Rank</th>
            {showMovement && <th className="py-2 pr-3 text-center">Mv</th>}
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
              {showMovement && (
                <td className="py-2 pr-3 text-center whitespace-nowrap">
                  <MovementIndicator delta={r.rankDelta} hasBaseline />
                </td>
              )}
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
