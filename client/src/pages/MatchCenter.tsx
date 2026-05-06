import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { MatchCard } from '../components/match/MatchCard';
import { useAuth } from '../context/AuthContext';
import { useTournament } from '../hooks/useTournament';
import { useMatches } from '../hooks/useMatches';
import { usePlayers } from '../hooks/usePlayers';

export function MatchCenter() {
  const { slug = '' } = useParams();
  const { isAdminOf } = useAuth();
  const isAdmin = isAdminOf(slug);
  const { tournament } = useTournament(slug);
  const { players } = usePlayers(tournament?._id);
  const [status, setStatus] = useState('');
  const [player, setPlayer] = useState('');
  const [search, setSearch] = useState('');

  const filters: Record<string, string> = {};
  if (status) filters.status = status;
  if (player) filters.player = player;

  const { matches, loading } = useMatches(tournament?._id, filters);
  const filtered = search
    ? matches.filter((m) => {
        const a = typeof m.playerA === 'object' ? m.playerA.name : '';
        const b = typeof m.playerB === 'object' ? m.playerB.name : '';
        const q = search.toLowerCase();
        return a.toLowerCase().includes(q) || b.toLowerCase().includes(q);
      })
    : matches;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="font-display text-3xl tracking-wider mb-4">
        Match Center
      </h1>
      <div className="flex flex-wrap gap-3 mb-5">
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={[
            { value: '', label: 'All' },
            { value: 'scheduled', label: 'Scheduled' },
            { value: 'completed', label: 'Completed' },
          ]}
        />
        <Select
          label="Player"
          value={player}
          onChange={(e) => setPlayer(e.target.value)}
          options={[
            { value: '', label: 'All players' },
            ...players.map((p) => ({ value: p._id, label: p.gamerTag })),
          ]}
        />
        <Input
          label="Search"
          placeholder="player name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <Badge tone="blue">{filtered.length} match(es)</Badge>
      </div>

      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState title="No matches" description="Adjust filters or add fixtures." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((m) => (
            <MatchCard key={m._id} match={m} slug={slug} isAdmin={isAdmin} showPlayerName />
          ))}
        </div>
      )}
    </div>
  );
}
