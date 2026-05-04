import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, getErrorMessage } from '../services/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { LeaderboardTable } from '../components/leaderboard/LeaderboardTable';
import { MatchCard } from '../components/match/MatchCard';
import type { IPublicTournamentPayload } from '../types';

const POLL_MS = 30000;

export function PublicView() {
  const { slug = '' } = useParams();
  const [data, setData] = useState<IPublicTournamentPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    let timer: ReturnType<typeof setInterval>;
    function load() {
      api
        .get(`/public/${slug}`)
        .then(({ data }) => {
          if (!cancel) setData(data);
        })
        .catch((err) => {
          if (!cancel) setError(getErrorMessage(err));
        })
        .finally(() => !cancel && setLoading(false));
    }
    load();
    timer = setInterval(load, POLL_MS);
    return () => {
      cancel = true;
      clearInterval(timer);
    };
  }, [slug]);

  if (loading) return <PageLoader label="Connecting…" />;
  if (error || !data)
    return (
      <div className="max-w-3xl mx-auto p-6">
        <EmptyState title="Tournament not found" description={error || ''} />
      </div>
    );

  const { tournament, leaderboard, todayMatches, recentResults, upcomingMatches, featuredMatches, playoffs, stats } = data;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-display tracking-widest uppercase text-text-muted text-xs">
            {tournament.game} · /{tournament.slug}
          </div>
          <h1 className="font-display text-5xl tracking-wider">
            <span className="bg-gradient-fire bg-clip-text text-transparent">
              {tournament.name}
            </span>
          </h1>
          {tournament.description && (
            <p className="text-text-secondary mt-1">{tournament.description}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="purple">{tournament.status}</Badge>
          <Badge tone="blue">
            {stats.completedMatches}/{stats.totalMatches} matches
          </Badge>
          <Badge tone="gold">{stats.playersCount} players</Badge>
          {!tournament.fixturesGenerated && (
            <Link to={`/${slug}/register`}>
              <Badge tone="gold">Register →</Badge>
            </Link>
          )}
          <Link to={`/t/${slug}/login`}>
            <Badge tone="gray">Admin →</Badge>
          </Link>
        </div>
      </header>

      <section>
        <SectionTitle>Leaderboard</SectionTitle>
        {leaderboard.length === 0 ? (
          <EmptyState title="No matches yet" />
        ) : (
          <Card className="overflow-hidden">
            <LeaderboardTable rows={leaderboard.slice(0, 16)} slug={slug} />
          </Card>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <SectionTitle>Today's Matches</SectionTitle>
          {todayMatches.length === 0 ? (
            <EmptyState title="Nothing today" />
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {todayMatches.map((m) => (
                <MatchCard key={m._id} match={m} slug={slug} />
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionTitle>Upcoming</SectionTitle>
          {upcomingMatches.length === 0 ? (
            <EmptyState title="No upcoming matches" />
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {upcomingMatches.map((m) => (
                <MatchCard key={m._id} match={m} slug={slug} />
              ))}
            </div>
          )}
        </section>
      </div>

      <section>
        <SectionTitle>Recent Results</SectionTitle>
        {recentResults.length === 0 ? (
          <EmptyState title="No completed matches yet" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentResults.map((m) => (
              <MatchCard key={m._id} match={m} slug={slug} />
            ))}
          </div>
        )}
      </section>

      {featuredMatches.length > 0 && (
        <section>
          <SectionTitle>Featured</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {featuredMatches.map((m) => (
              <MatchCard key={m._id} match={m} slug={slug} />
            ))}
          </div>
        </section>
      )}

      {playoffs && playoffs.length > 0 && (
        <section>
          <SectionTitle>Playoffs</SectionTitle>
          <p className="text-text-secondary text-sm mb-3">
            Track the bracket on the{' '}
            <Link
              to={`/t/${slug}/playoffs`}
              className="text-accent-yellow hover:underline"
            >
              admin playoffs page
            </Link>
            .
          </p>
        </section>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display tracking-widest uppercase text-text-secondary text-sm mb-3 flex items-center gap-2">
      <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent max-w-[40px]" />
      {children}
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
    </h2>
  );
}
