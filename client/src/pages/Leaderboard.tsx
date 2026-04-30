import { useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { PageLoader } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { LeaderboardTable } from '../components/leaderboard/LeaderboardTable';
import { useTournament } from '../hooks/useTournament';
import { useLeaderboard } from '../hooks/useLeaderboard';

export function Leaderboard() {
  const { slug = '' } = useParams();
  const { tournament } = useTournament(slug);
  const { rows, loading } = useLeaderboard(tournament?._id);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="font-display text-3xl tracking-wider mb-1">Leaderboard</h1>
      <p className="text-text-secondary text-sm mb-5">
        Tiebreakers:{' '}
        <span className="font-mono text-xs">
          wins → {tournament?.ranking?.tiebreakers?.join(' → ') || '...'}
        </span>
      </p>
      {loading ? (
        <PageLoader />
      ) : rows.length === 0 ? (
        <EmptyState title="Leaderboard is empty" description="No completed matches yet." />
      ) : (
        <Card className="overflow-hidden">
          <LeaderboardTable rows={rows} slug={slug} />
        </Card>
      )}
    </div>
  );
}
