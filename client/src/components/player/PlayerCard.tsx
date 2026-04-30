import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CharacterAvatar } from './CharacterAvatar';
import type { IPlayer } from '../../types';

interface Props {
  player: IPlayer;
  slug: string;
  wins?: number;
  losses?: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function PlayerCard({
  player,
  slug,
  wins,
  losses,
  onEdit,
  onDelete,
}: Props) {
  return (
    <Card glow="gold" className="relative">
      <div className="flex items-start gap-3">
        <CharacterAvatar
          name={player.gamerTag}
          character={player.character}
          size="lg"
        />
        <div className="flex-1 min-w-0">
          <Link
            to={`/t/${slug}/player/${player._id}`}
            className="font-display text-lg tracking-wider hover:text-accent-yellow transition-colors block truncate"
          >
            {player.gamerTag}
          </Link>
          <div className="text-xs text-text-secondary truncate">
            {player.name}
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {player.department && (
              <Badge tone="blue">{player.department}</Badge>
            )}
            {player.character && (
              <Badge tone={player.characterLocked ? 'red' : 'purple'}>
                {player.character}
                {player.characterLocked && ' 🔒'}
              </Badge>
            )}
          </div>
        </div>
      </div>
      {(wins !== undefined || losses !== undefined) && (
        <div className="mt-3 pt-3 border-t border-border flex justify-between font-mono text-xs">
          <span className="text-accent-green">{wins ?? 0}W</span>
          <span className="text-accent-red">{losses ?? 0}L</span>
        </div>
      )}
      {(onEdit || onDelete) && (
        <div className="mt-3 flex gap-2 text-xs">
          {onEdit && (
            <button
              onClick={onEdit}
              className="font-display uppercase tracking-wider text-text-secondary hover:text-accent-yellow"
            >
              edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="font-display uppercase tracking-wider text-text-secondary hover:text-accent-red"
            >
              delete
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
