import { Badge } from '../ui/Badge';
import { CharacterAvatar } from '../player/CharacterAvatar';
import type { IPlayer, IPlayoffMatch } from '../../types';

function asPlayer(p?: string | IPlayer): IPlayer | null {
  return p && typeof p === 'object' ? (p as IPlayer) : null;
}

export function BracketView({
  bracket,
  isAdmin,
  onMatchClick,
}: {
  bracket: IPlayoffMatch[];
  isAdmin: boolean;
  onMatchClick?: (match: IPlayoffMatch) => void;
}) {
  const rounds = bracket.reduce<Record<number, IPlayoffMatch[]>>(
    (acc, m) => {
      (acc[m.round] = acc[m.round] || []).push(m);
      return acc;
    },
    {},
  );
  const sortedRounds = Object.keys(rounds)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {sortedRounds.map((r) => (
        <div key={r} className="flex flex-col gap-4 min-w-[280px]">
          <div className="font-display tracking-widest uppercase text-text-muted text-xs">
            Round {r}
          </div>
          {rounds[r].map((m) => (
            <BracketNode
              key={m._id}
              match={m}
              isAdmin={isAdmin}
              onOpen={() => onMatchClick?.(m)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function BracketNode({
  match,
  isAdmin,
  onOpen,
}: {
  match: IPlayoffMatch;
  isAdmin: boolean;
  onOpen: () => void;
}) {
  const a = asPlayer(match.playerA);
  const b = asPlayer(match.playerB);
  const winnerId =
    match.normalResult?.winner ||
    match.streakResult?.winner ||
    null;
  const isClickable = isAdmin || match.status === 'completed';

  return (
    <button
      onClick={onOpen}
      disabled={!isClickable}
      className={`text-left clip-angled bg-bg-secondary border border-border p-3 ${
        isClickable
          ? 'hover:border-accent-yellow/60 hover:shadow-glow transition-all cursor-pointer'
          : 'opacity-50 cursor-default'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-text-muted">
          M{match.matchNumber}
        </span>
        <Badge
          tone={
            match.status === 'completed'
              ? 'green'
              : match.status === 'in_progress'
                ? 'gold'
                : 'gray'
          }
        >
          {match.status.replace('_', ' ')}
        </Badge>
      </div>
      <PlayerLine
        player={a}
        seed={match.seedA}
        winner={!!winnerId && String(winnerId) === a?._id}
      />
      <div className="border-t border-border my-1.5" />
      <PlayerLine
        player={b}
        seed={match.seedB}
        winner={!!winnerId && String(winnerId) === b?._id}
      />
      {match.mode === 'streak' && match.streakResult && (
        <div className="text-[10px] mt-2 text-accent-red flex items-center gap-1">
          🔥 {match.streakResult.finalStreakA} ·{' '}
          {match.streakResult.finalStreakB} ({match.streakResult.totalGames}G)
        </div>
      )}
    </button>
  );
}

function PlayerLine({
  player,
  seed,
  winner,
}: {
  player: IPlayer | null;
  seed?: number;
  winner: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 py-1 ${
        winner ? 'text-accent-yellow' : ''
      }`}
    >
      <span className="font-mono text-[10px] text-text-muted w-5">
        {seed ? `#${seed}` : '–'}
      </span>
      {player ? (
        <CharacterAvatar
          name={player.gamerTag}
          character={player.character}
          size="sm"
        />
      ) : (
        <div className="h-8 w-8 border border-dashed border-border" />
      )}
      <span className="font-display tracking-wider truncate">
        {player?.gamerTag || 'TBD'}
      </span>
    </div>
  );
}
