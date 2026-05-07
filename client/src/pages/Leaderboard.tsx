import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageLoader } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { LeaderboardTable } from '../components/leaderboard/LeaderboardTable';
import { useTournament } from '../hooks/useTournament';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, getErrorMessage } from '../services/api';

function formatCapturedAt(iso: string | null): string {
  if (!iso) return 'never';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'never';
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function Leaderboard() {
  const { slug = '' } = useParams();
  const { tournament } = useTournament(slug);
  const { rows, snapshotCapturedAt, loading, reload } = useLeaderboard(
    tournament?._id,
  );
  const { isAdminOf } = useAuth();
  const { push } = useToast();
  const [recording, setRecording] = useState(false);
  const isAdmin = isAdminOf(slug);

  const recordSnapshot = async () => {
    if (!tournament?._id) return;
    setRecording(true);
    try {
      await api.post(`/tournaments/${tournament._id}/leaderboard/snapshot`);
      push('Standings recorded', 'success');
      reload();
    } catch (err) {
      push(getErrorMessage(err), 'error');
    } finally {
      setRecording(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display text-3xl tracking-wider mb-1">
            Leaderboard
          </h1>
          <p className="text-text-secondary text-sm">
            Tiebreakers:{' '}
            <span className="font-mono text-xs">
              wins → {tournament?.ranking?.tiebreakers?.join(' → ') || '...'}
            </span>
          </p>
          <p className="text-text-muted text-xs mt-1">
            Movement vs. last recorded standings ·{' '}
            <span className="font-mono">
              {formatCapturedAt(snapshotCapturedAt)}
            </span>
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="secondary"
            size="sm"
            loading={recording}
            onClick={recordSnapshot}
            disabled={!rows.length}
            title={
              rows.length
                ? 'Save current standings as the new comparison baseline'
                : 'Nothing to record yet'
            }
          >
            Record standings
          </Button>
        )}
      </div>
      {loading ? (
        <PageLoader />
      ) : rows.length === 0 ? (
        <EmptyState title="Leaderboard is empty" description="No completed matches yet." />
      ) : (
        <Card className="overflow-hidden">
          <LeaderboardTable
            rows={rows}
            slug={slug}
            showMovement={!!snapshotCapturedAt}
          />
        </Card>
      )}
    </div>
  );
}
