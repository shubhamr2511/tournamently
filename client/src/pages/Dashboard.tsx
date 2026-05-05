import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../services/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageLoader } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { MatchCard } from '../components/match/MatchCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTournament } from '../hooks/useTournament';
import type { IMatch } from '../types';

export function Dashboard() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { session, isAdminOf } = useAuth();
  const { push } = useToast();
  const { tournament, loading } = useTournament(slug);
  const [today, setToday] = useState<IMatch[]>([]);
  const [overdue, setOverdue] = useState<IMatch[]>([]);
  const [stats, setStats] = useState({ players: 0, total: 0, completed: 0 });
  const isAdmin = isAdminOf(slug);

  useEffect(() => {
    if (!isAdmin && !session) navigate(`/t/${slug}/login`);
  }, [isAdmin, session, slug, navigate]);

  useEffect(() => {
    if (!tournament) return;
    const tid = tournament._id;
    Promise.all([
      api.get(`/tournaments/${tid}/fixtures/today`),
      api.get(`/tournaments/${tid}/fixtures/overdue`),
      api.get(`/tournaments/${tid}/players`),
      api.get(`/tournaments/${tid}/fixtures`),
    ])
      .then(([t, o, p, f]) => {
        setToday(t.data);
        setOverdue(o.data);
        const total = (f.data as IMatch[]).length;
        const completed = (f.data as IMatch[]).filter(
          (m) => m.status === 'completed',
        ).length;
        setStats({
          players: (p.data as unknown[]).length,
          total,
          completed,
        });
      })
      .catch((err) => push(getErrorMessage(err), 'error'));
  }, [tournament, push]);

  async function generateFixtures() {
    if (!tournament) return;
    if (!confirm('Generate round-robin fixtures? Player roster will lock.'))
      return;
    try {
      await api.post(`/tournaments/${tournament._id}/fixtures/generate`);
      push('Fixtures generated', 'success');
      navigate(`/t/${slug}/fixtures`);
    } catch (err) {
      push(getErrorMessage(err), 'error');
    }
  }

  if (loading) return <PageLoader />;
  if (!tournament) return <div>Tournament not found</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-display tracking-widest uppercase text-text-muted text-xs">
            {tournament.game}
          </div>
          <h1 className="font-display text-4xl tracking-wider">
            {tournament.name}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Badge tone="purple">{tournament.status}</Badge>
          <Badge tone="blue">{tournament.matchFormat}</Badge>
          {tournament.fixturesGenerated && (
            <Badge tone="green">Fixtures Live</Badge>
          )}
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Players" value={stats.players} />
        <StatCard label="Matches" value={stats.total} />
        <StatCard label="Completed" value={stats.completed} accent="green" />
        <StatCard
          label="Progress"
          value={
            stats.total
              ? `${Math.round((stats.completed / stats.total) * 100)}%`
              : '—'
          }
          accent="gold"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link to={`/t/${slug}/players`}>
          <Button variant="secondary">Players</Button>
        </Link>
        <Link to={`/t/${slug}/fixtures`}>
          <Button variant="secondary">Fixtures</Button>
        </Link>
        <Link to={`/t/${slug}/leaderboard`}>
          <Button variant="secondary">Leaderboard</Button>
        </Link>
        <Link to={`/t/${slug}/playoffs`}>
          <Button variant="secondary">Playoffs</Button>
        </Link>
        {!tournament.fixturesGenerated && isAdmin && (
          <Button onClick={generateFixtures}>Generate Fixtures</Button>
        )}
        {isAdmin && (
          <Link to={`/t/${slug}/settings`}>
            <Button variant="outline">Edit Tournament</Button>
          </Link>
        )}
      </div>

      <section>
        <h2 className="font-display tracking-widest uppercase text-text-secondary text-sm mb-3">
          Today's Matches
        </h2>
        {today.length === 0 ? (
          <EmptyState
            title="Nothing scheduled today"
            description="Either you're between rounds or fixtures haven't been generated yet."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {today.map((m) => (
              <MatchCard key={m._id} match={m} slug={slug} isAdmin={isAdmin} />
            ))}
          </div>
        )}
      </section>

      {overdue.length > 0 && (
        <section>
          <h2 className="font-display tracking-widest uppercase text-text-secondary text-sm mb-3 flex items-center gap-2">
            Overdue
            <Badge tone="red">{overdue.length}</Badge>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {overdue.map((m) => (
              <MatchCard key={m._id} match={m} slug={slug} isAdmin={isAdmin} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = 'cyan',
}: {
  label: string;
  value: number | string;
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
      <div className={`font-display text-3xl ${map[accent]}`}>{value}</div>
    </Card>
  );
}
