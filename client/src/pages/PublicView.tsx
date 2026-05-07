import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, getErrorMessage } from '../services/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { LeaderboardTable } from '../components/leaderboard/LeaderboardTable';
import { StandingsHistoryChart } from '../components/leaderboard/StandingsHistoryChart';
import { MatchCard } from '../components/match/MatchCard';
import type {
  IMatch,
  IPublicTournamentPayload,
  IStandingsHistoryResponse,
  IStandingsHistorySnapshot,
} from '../types';

const POLL_MS = 5000;

export function PublicView() {
  const { slug = '' } = useParams();
  const [data, setData] = useState<IPublicTournamentPayload | null>(null);
  const [history, setHistory] = useState<IStandingsHistorySnapshot[] | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const displayedRef = useRef<IMatch[]>([]);
  const exitingRef = useRef<Set<string>>(new Set());
  const exitTimers = useRef<Map<string, number>>(new Map());
  const [, forceRender] = useState(0);
  const cancelRef = useRef(false);
  const leaderboardRef = useRef<HTMLDivElement>(null);
  const [leaderboardHeight, setLeaderboardHeight] = useState<number | null>(
    null,
  );

  const loadHistory = useCallback(() => {
    api
      .get<IStandingsHistoryResponse>(`/public/${slug}/standings-history`)
      .then(({ data }) => {
        if (!cancelRef.current) setHistory(data.snapshots);
      })
      .catch(() => {
        /* non-fatal: chart just won't render */
      });
  }, [slug]);

  const load = useCallback(
    (manual = false) => {
      if (manual) setRefreshing(true);
      api
        .get(`/public/${slug}`)
        .then(({ data }) => {
          if (!cancelRef.current) setData(data);
        })
        .catch((err) => {
          if (!cancelRef.current) setError(getErrorMessage(err));
        })
        .finally(() => {
          if (cancelRef.current) return;
          setLoading(false);
          if (manual) {
            setRefreshing(false);
            loadHistory();
          }
        });
    },
    [slug, loadHistory],
  );

  useEffect(() => {
    cancelRef.current = false;
    load();
    loadHistory();
    const timer = setInterval(load, POLL_MS);
    return () => {
      cancelRef.current = true;
      clearInterval(timer);
      for (const t of exitTimers.current.values()) window.clearTimeout(t);
      exitTimers.current.clear();
    };
  }, [load, loadHistory]);

  useEffect(() => {
    if (!data) return;
    const incoming = data.upcomingMatches;
    const incomingIds = new Set(incoming.map((m) => m._id));
    const incomingMap = new Map(incoming.map((m) => [m._id, m]));
    const prev = displayedRef.current;

    let mutated = false;

    for (const m of prev) {
      if (!incomingIds.has(m._id) && !exitingRef.current.has(m._id)) {
        const id = m._id;
        exitingRef.current.add(id);
        mutated = true;
        if (!exitTimers.current.has(id)) {
          const handle = window.setTimeout(() => {
            displayedRef.current = displayedRef.current.filter(
              (x) => x._id !== id,
            );
            exitingRef.current.delete(id);
            exitTimers.current.delete(id);
            forceRender((v) => v + 1);
          }, 1500);
          exitTimers.current.set(id, handle);
        }
      }
    }

    const seen = new Set<string>();
    const merged: IMatch[] = [];
    for (const m of prev) {
      const replaced = incomingMap.get(m._id);
      if (replaced) {
        merged.push(replaced);
        seen.add(m._id);
      } else {
        merged.push(m);
      }
    }
    for (const m of incoming) {
      if (!seen.has(m._id)) merged.push(m);
    }

    const sameLength = merged.length === prev.length;
    const sameOrder =
      sameLength && merged.every((m, i) => m === prev[i]);
    if (!sameOrder) {
      displayedRef.current = merged;
      mutated = true;
    }
    if (mutated) forceRender((v) => v + 1);
  }, [data]);

  useEffect(() => {
    const el = leaderboardRef.current;
    if (!el) return;
    const update = () => {
      setLeaderboardHeight(el.getBoundingClientRect().height);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [data]);

  if (loading) return <PageLoader label="Connecting…" />;
  if (error || !data)
    return (
      <div className="max-w-3xl mx-auto p-6">
        <EmptyState title="Tournament not found" description={error || ''} />
      </div>
    );

  const { tournament, leaderboard, recentResults, upcomingMatches, featuredMatches, playoffs, stats } = data;

  const trimmedSearch = search.trim().toLowerCase();
  const matchHasGamerTag = (m: typeof upcomingMatches[number]) => {
    const a = typeof m.playerA === 'object' ? m.playerA?.gamerTag ?? '' : '';
    const b = typeof m.playerB === 'object' ? m.playerB?.gamerTag ?? '' : '';
    return (
      a.toLowerCase().includes(trimmedSearch) ||
      b.toLowerCase().includes(trimmedSearch)
    );
  };
  const filterMatches = <T extends typeof upcomingMatches[number]>(list: T[]) =>
    trimmedSearch ? list.filter(matchHasGamerTag) : list;
  const filteredUpcoming = filterMatches(displayedRef.current);
  const filteredRecent = filterMatches(recentResults);
  const filteredFeatured = filterMatches(featuredMatches);
  const visibleUpcomingCount = filteredUpcoming.filter(
    (m) => !exitingRef.current.has(m._id),
  ).length;

  return (
    <div className="w-full p-6 space-y-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <section className="lg:col-span-2 min-w-0">
          <div className="flex flex-wrap items-center justify-between mb-3 gap-3">
            <SectionTitle noMargin>Leaderboard</SectionTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => load(true)}
                disabled={refreshing}
                className="font-display tracking-widest uppercase text-xs px-3 py-1.5 border border-border hover:border-accent-blue hover:text-accent-blue transition-colors clip-angled whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                aria-label="Refresh leaderboard"
              >
                <span
                  className={`inline-block ${refreshing ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                >
                  ↻
                </span>
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </button>
              <button
                type="button"
                onClick={() => {
                  document
                    .getElementById('matches')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="font-display tracking-widest uppercase text-xs px-3 py-1.5 border border-border hover:border-accent-yellow hover:text-accent-yellow transition-colors clip-angled whitespace-nowrap"
              >
                Jump to matches ↓
              </button>
            </div>
          </div>
          {leaderboard.length === 0 ? (
            <EmptyState title="No matches yet" />
          ) : (
            <div ref={leaderboardRef}>
              <Card className="overflow-hidden">
                <LeaderboardTable rows={leaderboard} slug={slug} />
              </Card>
            </div>
          )}
        </section>

        <section className="lg:col-span-1 min-w-0">
          <SectionTitle>
            Upcoming
            {visibleUpcomingCount > 0 && (
              <span className="font-mono text-[10px] text-text-muted ml-2 normal-case tracking-normal">
                · {visibleUpcomingCount}
              </span>
            )}
          </SectionTitle>
          {visibleUpcomingCount === 0 && filteredUpcoming.length === 0 ? (
            <EmptyState
              title={trimmedSearch ? 'No matches' : 'No upcoming matches'}
            />
          ) : (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3 lg:min-h-[calc(100vh-8rem)] lg:max-h-[var(--leaderboard-h,calc(100vh-8rem))] lg:overflow-y-auto lg:pr-1"
              style={
                leaderboardHeight
                  ? ({
                      ['--leaderboard-h' as string]: `${leaderboardHeight}px`,
                    } as React.CSSProperties)
                  : undefined
              }
            >
              {filteredUpcoming.map((m) => {
                const isExiting = exitingRef.current.has(m._id);
                return (
                  <div
                    key={m._id}
                    className={isExiting ? 'match-exit' : undefined}
                  >
                    <MatchCard match={m} slug={slug} showPlayerName />
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {history && history.length >= 2 && (
        <section>
          <SectionTitle>Standings History</SectionTitle>
          <Card className="p-4 sm:p-6">
            <StandingsHistoryChart snapshots={history} slug={slug} />
          </Card>
        </section>
      )}

      <div id="matches" className="space-y-6 scroll-mt-6">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search matches by gamertag…"
              className="font-mono text-xs px-3 py-1.5 pr-7 border border-border bg-bg-secondary focus:border-accent-yellow focus:outline-none clip-angled w-full placeholder:text-text-muted"
              aria-label="Search matches by gamertag"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-accent-yellow text-sm leading-none"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          {trimmedSearch && (
            <span className="font-mono text-[11px] text-text-muted">
              {filteredRecent.length + filteredFeatured.length}{' '}
              match
              {filteredRecent.length + filteredFeatured.length === 1
                ? ''
                : 'es'}
            </span>
          )}
        </div>

        <section>
          <SectionTitle>Recent Results</SectionTitle>
          {filteredRecent.length === 0 ? (
            <EmptyState
              title={trimmedSearch ? 'No matches' : 'No completed matches yet'}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredRecent.map((m) => (
                <MatchCard key={m._id} match={m} slug={slug} />
              ))}
            </div>
          )}
        </section>

        {(featuredMatches.length > 0 || trimmedSearch) && filteredFeatured.length > 0 && (
          <section>
            <SectionTitle>Featured</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredFeatured.map((m) => (
                <MatchCard key={m._id} match={m} slug={slug} />
              ))}
            </div>
          </section>
        )}
      </div>

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

function SectionTitle({
  children,
  noMargin,
}: {
  children: React.ReactNode;
  noMargin?: boolean;
}) {
  return (
    <h2
      className={`font-display tracking-widest uppercase text-text-secondary text-sm flex items-center gap-2 ${
        noMargin ? 'flex-1' : 'mb-3'
      }`}
    >
      <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent max-w-[40px]" />
      {children}
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
    </h2>
  );
}
