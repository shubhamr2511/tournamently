import { Link } from 'react-router-dom';
import { CharacterAvatar } from '../player/CharacterAvatar';
import { BADGE_META, FALLBACK_BADGE_META } from './badgeMeta';
import type { IBadgeAward, IBadgeWinner } from '../../types';

interface Props {
  badges: IBadgeAward[];
  slug: string;
}

function WinnerRow({
  w,
  slug,
  toneText,
}: {
  w: IBadgeWinner;
  slug: string;
  toneText: string;
}) {
  return (
    <Link
      to={`/t/${slug}/player/${w.player._id}`}
      className="flex items-center gap-2 hover:text-accent-yellow"
    >
      <CharacterAvatar
        name={w.player.gamerTag}
        character={w.player.character}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className="font-display tracking-wider truncate text-sm">
          {w.player.gamerTag}
        </div>
        {w.detail && (
          <div className={`font-mono text-[10px] ${toneText} truncate`}>
            {w.detail}
          </div>
        )}
      </div>
    </Link>
  );
}

export function BadgesPanel({ badges, slug }: Props) {
  return (
    <div className="grid grid-cols-1 gap-2">
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
              {b.winners.length > 1 && (
                <span className="font-mono text-[10px] text-text-muted ml-auto">
                  ×{b.winners.length}
                </span>
              )}
            </div>
            <div className="text-text-muted text-[10px] mb-1.5">{b.description}</div>
            {b.winners.length === 0 ? (
              <div className="text-text-muted text-[10px] italic">Unclaimed</div>
            ) : (
              <div className="space-y-1.5">
                {b.winners.map((w) => (
                  <WinnerRow key={w.player._id} w={w} slug={slug} toneText={meta.text} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
