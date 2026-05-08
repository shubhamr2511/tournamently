import { Link } from 'react-router-dom';
import { CharacterAvatar } from '../player/CharacterAvatar';
import { BADGE_META, FALLBACK_BADGE_META } from './badgeMeta';
import type { IBadgeAward } from '../../types';

interface Props {
  badges: IBadgeAward[];
  slug: string;
}

export function BadgesPanel({ badges, slug }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {badges.map((b) => {
        const meta = BADGE_META[b.key] ?? FALLBACK_BADGE_META;
        return (
          <div
            key={b.key}
            className={`border ${meta.border} ${meta.bg} clip-angled px-3 py-2`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-base leading-none" aria-hidden="true">
                {meta.icon}
              </span>
              <div className={`font-display tracking-wider uppercase text-[11px] truncate ${meta.text}`}>
                {b.name}
              </div>
            </div>
            <div className="text-text-muted text-[10px] mb-1.5">{b.description}</div>
            {b.winner ? (
              <Link
                to={`/t/${slug}/player/${b.winner.player._id}`}
                className="flex items-center gap-2 hover:text-accent-yellow"
              >
                <CharacterAvatar
                  name={b.winner.player.gamerTag}
                  character={b.winner.player.character}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-display tracking-wider truncate text-sm">
                    {b.winner.player.gamerTag}
                  </div>
                  {b.winner.detail && (
                    <div className={`font-mono text-[10px] ${meta.text} truncate`}>
                      {b.winner.detail}
                    </div>
                  )}
                </div>
              </Link>
            ) : (
              <div className="text-text-muted text-[10px] italic">Unclaimed</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
