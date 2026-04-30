import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../services/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import { CharacterAvatar } from '../components/player/CharacterAvatar';
import { MatchCard } from '../components/match/MatchCard';
import { useTournament } from '../hooks/useTournament';
import { useToast } from '../context/ToastContext';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useMatches } from '../hooks/useMatches';
import type { IPlayer } from '../types';

export function PlayerProfile() {
  const { slug = '', playerId = '' } = useParams();
  const { tournament } = useTournament(slug);
  const { rows } = useLeaderboard(tournament?._id);
  const { matches } = useMatches(tournament?._id);
  const { push } = useToast();
  const [player, setPlayer] = useState<IPlayer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tournament) return;
    api
      .get(`/tournaments/${tournament._id}/players`)
      .then(({ data }) => {
        const p = (data as IPlayer[]).find((x) => x._id === playerId);
        setPlayer(p || null);
      })
      .catch((err) => push(getErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, [tournament, playerId, push]);

  const row = useMemo(
    () => rows.find((r) => r.player._id === playerId),
    [rows, playerId],
  );

  const playerMatches = useMemo(
    () =>
      matches.filter((m) => {
        const a = typeof m.playerA === 'object' ? m.playerA._id : m.playerA;
        const b = typeof m.playerB === 'object' ? m.playerB._id : m.playerB;
        return a === playerId || b === playerId;
      }),
    [matches, playerId],
  );

  if (loading) return <PageLoader />;
  if (!player) return <div>Player not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <Card glow="gold">
        <div className="flex flex-wrap items-center gap-5">
          <CharacterAvatar
            name={player.gamerTag}
            character={player.character}
            size="xl"
          />
          <div className="flex-1">
            <div className="font-display text-4xl tracking-wider">
              {player.gamerTag}
            </div>
            <div className="text-text-secondary">{player.name}</div>
            <div className="flex flex-wrap gap-2 mt-2">
              {player.department && <Badge tone="blue">{player.department}</Badge>}
              {player.character && (
                <Badge tone={player.characterLocked ? 'red' : 'purple'}>
                  {player.character}
                  {player.characterLocked && ' 🔒'}
                </Badge>
              )}
              {row && <Badge tone="gold">Rank #{row.rank}</Badge>}
            </div>
            {player.bio && (
              <p className="mt-3 text-sm text-text-secondary">{player.bio}</p>
            )}
          </div>
        </div>
      </Card>

      {row && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Matches" v={row.matchesPlayed} />
          <Stat label="Wins" v={row.wins} accent="green" />
          <Stat label="Losses" v={row.losses} accent="red" />
          <Stat label="Win %" v={`${row.winPercentage}%`} accent="gold" />
          <Stat label="Bonus Pts" v={row.bonusPoints} accent="gold" />
          <Stat label="Perfects" v={row.perfectRounds} />
          <Stat label="Fast Wins" v={row.fastWins} />
          <Stat
            label="G+/-"
            v={row.gameDiff > 0 ? `+${row.gameDiff}` : row.gameDiff}
          />
        </div>
      )}

      <section>
        <h2 className="font-display tracking-widest uppercase text-text-secondary text-sm mb-3">
          Match History
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {playerMatches.map((m) => (
            <MatchCard key={m._id} match={m} slug={slug} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  v,
  accent = 'cyan',
}: {
  label: string;
  v: number | string;
  accent?: 'cyan' | 'green' | 'red' | 'gold';
}) {
  const map = {
    cyan: 'text-accent-blue',
    green: 'text-accent-green',
    red: 'text-accent-red',
    gold: 'text-accent-yellow',
  };
  return (
    <Card>
      <div className="font-display tracking-widest uppercase text-[10px] text-text-muted">
        {label}
      </div>
      <div className={`font-display text-2xl ${map[accent]}`}>{v}</div>
    </Card>
  );
}
