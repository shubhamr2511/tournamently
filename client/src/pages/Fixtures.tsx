import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { MatchCard } from '../components/match/MatchCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTournament } from '../hooks/useTournament';
import { useMatches } from '../hooks/useMatches';
import { usePlayers } from '../hooks/usePlayers';
import { formatDate } from '../utils/formatting';
import type { IMatch, IPlayer } from '../types';

function asPlayer(p: string | IPlayer): IPlayer | null {
  return typeof p === 'object' ? (p as IPlayer) : null;
}

export function Fixtures() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { session, isAdminOf } = useAuth();
  const { push } = useToast();
  const { tournament } = useTournament(slug);
  const isAdmin = isAdminOf(slug);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const filters = statusFilter ? { status: statusFilter } : undefined;
  const { matches, loading, reload } = useMatches(tournament?._id, filters);
  const { players, reload: reloadPlayers } = usePlayers(tournament?._id);

  const trimmedSearch = search.trim().toLowerCase();
  const visibleMatches = trimmedSearch
    ? matches.filter((m) => {
        const a = typeof m.playerA === 'object' ? m.playerA?.name ?? '' : '';
        const b = typeof m.playerB === 'object' ? m.playerB?.name ?? '' : '';
        return (
          a.toLowerCase().includes(trimmedSearch) ||
          b.toLowerCase().includes(trimmedSearch)
        );
      })
    : matches;

  if (!session && !isAdmin) {
    navigate(`/t/${slug}/login`);
    return null;
  }

  const grouped = useMemo(() => {
    const map = new Map<string, IMatch[]>();
    for (const m of visibleMatches) {
      const key = m.scheduledDate
        ? new Date(m.scheduledDate).toISOString().slice(0, 10)
        : 'unscheduled';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [visibleMatches]);

  async function generate() {
    if (!tournament) return;
    if (!confirm('Generate round-robin fixtures? Player roster will lock.'))
      return;
    try {
      await api.post(`/tournaments/${tournament._id}/fixtures/generate`);
      push('Fixtures generated', 'success');
      reload();
    } catch (err) {
      push(getErrorMessage(err), 'error');
    }
  }

  async function toggleAbsent(p: IPlayer) {
    if (!tournament) return;
    try {
      await api.put(
        `/tournaments/${tournament._id}/players/${p._id}/absent`,
        { isAbsent: !p.isAbsent },
      );
      push(
        p.isAbsent ? `${p.gamerTag} marked present` : `${p.gamerTag} marked absent`,
        'success',
      );
      reloadPlayers();
      reload();
    } catch (err) {
      push(getErrorMessage(err), 'error');
    }
  }

  async function reset() {
    if (!tournament) return;
    if (
      !confirm(
        'Reset fixtures? This deletes all matches and results, then unlocks the roster.',
      )
    )
      return;
    try {
      await api.delete(`/tournaments/${tournament._id}/fixtures/reset`);
      push('Fixtures reset', 'success');
      reload();
    } catch (err) {
      push(getErrorMessage(err), 'error');
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
        <div>
          <h1 className="font-display text-3xl tracking-wider">Fixtures</h1>
          <p className="text-text-secondary text-sm">
            {visibleMatches.length} match{visibleMatches.length === 1 ? '' : 'es'}
            {trimmedSearch && matches.length !== visibleMatches.length && (
              <span className="text-text-muted"> · of {matches.length}</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          <Input
            label="Search"
            placeholder="player name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            label="Filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All' },
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
          {isAdmin && (
            <>
              {tournament?.fixturesGenerated ? (
                <Button variant="danger" onClick={reset}>
                  Reset Fixtures
                </Button>
              ) : (
                <Button onClick={generate}>Generate</Button>
              )}
            </>
          )}
        </div>
      </div>

      {isAdmin && players.length > 0 && (
        <div className="mb-5">
          <div className="font-display tracking-widest uppercase text-text-muted text-[10px] mb-2">
            Attendance · click to toggle absent
          </div>
          <div className="flex flex-wrap gap-1.5">
            {players.map((p) => (
              <button
                key={p._id}
                type="button"
                onClick={() => toggleAbsent(p)}
                className={`font-mono text-[11px] px-2 py-1 border transition-colors ${
                  p.isAbsent
                    ? 'border-accent-red text-accent-red line-through opacity-80 hover:opacity-100'
                    : 'border-border text-text-secondary hover:border-accent-yellow hover:text-accent-yellow'
                }`}
              >
                {p.gamerTag}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <PageLoader />
      ) : matches.length === 0 ? (
        <EmptyState
          title="No fixtures yet"
          description={
            tournament?.fixturesGenerated
              ? 'No matches match this filter.'
              : 'Generate fixtures from the players you have added.'
          }
          action={
            isAdmin && !tournament?.fixturesGenerated ? (
              <Button onClick={generate}>Generate Fixtures</Button>
            ) : undefined
          }
        />
      ) : visibleMatches.length === 0 ? (
        <EmptyState
          title="No matches"
          description={`No player name matches "${search}".`}
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(([key, list]) => (
            <section key={key}>
              <h2 className="font-display tracking-widest uppercase text-text-secondary text-sm mb-3 flex items-center gap-2">
                {key === 'unscheduled' ? 'Unscheduled' : formatDate(key)}
                <Badge tone="blue">{list.length}</Badge>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {list.map((m) => (
                  <FixtureRow
                    key={m._id}
                    match={m}
                    slug={slug}
                    isAdmin={isAdmin}
                    onReschedule={async (date) => {
                      try {
                        await api.put(
                          `/tournaments/${tournament?._id}/fixtures/${m._id}/reschedule`,
                          { scheduledDate: date },
                        );
                        push('Match rescheduled', 'success');
                        reload();
                      } catch (err) {
                        push(getErrorMessage(err), 'error');
                      }
                    }}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function FixtureRow({
  match,
  slug,
  isAdmin,
  onReschedule,
}: {
  match: IMatch;
  slug: string;
  isAdmin: boolean;
  onReschedule: (date: string) => void;
}) {
  const a = asPlayer(match.playerA);
  const b = asPlayer(match.playerB);
  const hasAbsent = !!(a?.isAbsent || b?.isAbsent);
  return (
    <div className={`space-y-2 ${hasAbsent ? 'opacity-50' : ''}`}>
      <MatchCard match={match} slug={slug} isAdmin={isAdmin} showPlayerName />
      {isAdmin && (
        <div className="flex items-center gap-2 text-xs text-text-muted px-2">
          {hasAbsent && (
            <Badge tone="red">
              Absent: {[a?.isAbsent && a.gamerTag, b?.isAbsent && b.gamerTag]
                .filter(Boolean)
                .join(' · ')}
            </Badge>
          )}
          <span>reschedule:</span>
          <input
            type="date"
            className="bg-bg-tertiary border border-border px-2 py-1 text-xs"
            defaultValue={
              match.scheduledDate
                ? new Date(match.scheduledDate).toISOString().slice(0, 10)
                : ''
            }
            onChange={(e) => onReschedule(e.target.value)}
          />
          {a && b && !hasAbsent && (
            <span className="text-text-muted/60 truncate">
              {a.gamerTag} · {b.gamerTag}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
