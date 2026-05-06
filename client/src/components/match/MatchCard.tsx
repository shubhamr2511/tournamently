import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { StatusBadge } from '../ui/StatusBadge';
import { CharacterAvatar } from '../player/CharacterAvatar';
import { formatDate, firstNameWithInitials } from '../../utils/formatting';
import type { IMatch, IPlayer } from '../../types';

interface Props {
  match: IMatch;
  slug: string;
  isAdmin?: boolean;
  showPlayerName?: boolean;
}

function asPlayer(p: string | IPlayer): IPlayer | null {
  return typeof p === 'object' ? (p as IPlayer) : null;
}

export function MatchCard({ match, slug, isAdmin, showPlayerName }: Props) {
  const a = asPlayer(match.playerA);
  const b = asPlayer(match.playerB);
  const winnerId = match.result?.winner;
  const aWon = a && winnerId === a._id;
  const bWon = b && winnerId === b._id;
  const featured = match.result?.isFeatured;
  const upset = match.result?.isUpset;
  const displayScore = match.result
    ? bWon
      ? match.result.score.split('-').reverse().join('-')
      : match.result.score
    : null;

  const target = isAdmin
    ? `/t/${slug}/match/${match._id}`
    : `/t/${slug}/matches`;

  return (
    <Link to={target}>
      <Card
        glow={featured ? 'gold' : 'cyan'}
        className={featured ? 'border-accent-yellow' : ''}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-xs text-text-muted">
            #{match.matchNumber}
          </span>
          <div className="flex items-center gap-1.5">
            {featured && <Badge tone="gold">Featured</Badge>}
            {upset && <Badge tone="red">Upset</Badge>}
            <StatusBadge status={match.status} />
          </div>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className={`flex items-center gap-2 ${aWon ? '' : 'opacity-70'}`}>
            <CharacterAvatar
              name={a?.gamerTag || '?'}
              character={a?.character}
              size="md"
            />
            <div className="min-w-0">
              <div className="font-display tracking-wider truncate">
                {a?.gamerTag || '?'}
              </div>
              {showPlayerName
                ? a?.name && (
                    <div className="text-[10px] text-text-muted truncate">
                      {firstNameWithInitials(a.name)}
                    </div>
                  )
                : a?.character && (
                    <div className="text-[10px] text-text-muted truncate">
                      {a.character}
                    </div>
                  )}
            </div>
          </div>
          <div className="text-center">
            {match.result ? (
              <div className="font-display text-2xl text-accent-yellow">
                {displayScore}
              </div>
            ) : (
              <div className="font-display text-xl text-text-muted tracking-widest">
                VS
              </div>
            )}
            {match.scheduledDate && !match.result && (
              <div className="text-[10px] text-text-muted mt-1">
                {formatDate(match.scheduledDate)}
              </div>
            )}
          </div>
          <div
            className={`flex items-center gap-2 justify-end ${
              bWon ? '' : 'opacity-70'
            }`}
          >
            <div className="min-w-0 text-right">
              <div className="font-display tracking-wider truncate">
                {b?.gamerTag || '?'}
              </div>
              {showPlayerName
                ? b?.name && (
                    <div className="text-[10px] text-text-muted truncate">
                      {firstNameWithInitials(b.name)}
                    </div>
                  )
                : b?.character && (
                    <div className="text-[10px] text-text-muted truncate">
                      {b.character}
                    </div>
                  )}
            </div>
            <CharacterAvatar
              name={b?.gamerTag || '?'}
              character={b?.character}
              size="md"
            />
          </div>
        </div>
      </Card>
    </Link>
  );
}
