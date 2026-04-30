import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { PageLoader } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { CharacterAvatar } from '../components/player/CharacterAvatar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTournament } from '../hooks/useTournament';
import type { IPlayer, IPlayoffMatch } from '../types';

function asPlayer(p?: string | IPlayer): IPlayer | null {
  return p && typeof p === 'object' ? (p as IPlayer) : null;
}

export function Playoffs() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { isAdminOf, session } = useAuth();
  const { push } = useToast();
  const { tournament, reload: reloadT } = useTournament(slug);
  const isAdmin = isAdminOf(slug);
  const [bracket, setBracket] = useState<IPlayoffMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [active, setActive] = useState<IPlayoffMatch | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!tournament) return;
    setLoading(true);
    api
      .get(`/tournaments/${tournament._id}/playoffs`)
      .then(({ data }) => setBracket(data))
      .catch((err) => push(getErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, [tournament, reloadKey, push]);

  if (loading) return <PageLoader />;
  if (!tournament) return null;

  const rounds = bracket.reduce<Record<number, IPlayoffMatch[]>>(
    (acc, m) => {
      (acc[m.round] = acc[m.round] || []).push(m);
      return acc;
    },
    {},
  );
  const sortedRounds = Object.keys(rounds)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-5">
        <div>
          <h1 className="font-display text-3xl tracking-wider">Playoffs</h1>
          {tournament.playoff && (
            <div className="text-sm text-text-secondary">
              <Badge tone="purple" className="mr-2">
                {tournament.playoff.format}
              </Badge>
              <Badge tone="blue" className="mr-2">
                Top {tournament.playoff.size}
              </Badge>
              <Badge tone="gold">{tournament.playoff.matchFormat}</Badge>
              {tournament.playoff.format === 'streak' &&
                tournament.playoff.streakTarget && (
                  <Badge tone="red" className="ml-2">
                    Streak {tournament.playoff.streakTarget}
                  </Badge>
                )}
            </div>
          )}
        </div>
        {isAdmin && (
          <Button onClick={() => setShowCreate(true)}>
            {bracket.length === 0 ? 'Create Bracket' : 'Recreate Bracket'}
          </Button>
        )}
      </div>

      {bracket.length === 0 ? (
        <EmptyState
          title="No playoff bracket"
          description="Create one once league play is complete (or seed manually)."
          action={
            !session && (
              <Button onClick={() => navigate(`/t/${slug}/login`)}>
                Admin Login
              </Button>
            )
          }
        />
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-4">
          {sortedRounds.map((r) => (
            <div key={r} className="flex flex-col gap-4 min-w-[280px]">
              <div className="font-display tracking-widest uppercase text-text-muted text-xs">
                Round {r}
              </div>
              {rounds[r].map((m) => (
                <BracketNode
                  key={m._id}
                  match={m}
                  isAdmin={isAdmin}
                  onOpen={() => setActive(m)}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateBracketModal
          tournamentId={tournament._id}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            setReloadKey((k) => k + 1);
            reloadT();
          }}
        />
      )}
      {active && (
        <PlayoffMatchModal
          tournamentId={tournament._id}
          match={active}
          isAdmin={isAdmin}
          onClose={() => setActive(null)}
          onUpdated={() => {
            setActive(null);
            setReloadKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}

function BracketNode({
  match,
  isAdmin,
  onOpen,
}: {
  match: IPlayoffMatch;
  isAdmin: boolean;
  onOpen: () => void;
}) {
  const a = asPlayer(match.playerA);
  const b = asPlayer(match.playerB);
  const winnerId =
    match.normalResult?.winner ||
    match.streakResult?.winner ||
    null;

  return (
    <button
      onClick={onOpen}
      disabled={!isAdmin && match.status !== 'completed'}
      className="text-left clip-angled bg-bg-secondary border border-border hover:border-accent-yellow/60 hover:shadow-glow transition-all p-3"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-text-muted">
          M{match.matchNumber}
        </span>
        <Badge
          tone={
            match.status === 'completed'
              ? 'green'
              : match.status === 'in_progress'
                ? 'gold'
                : 'gray'
          }
        >
          {match.status.replace('_', ' ')}
        </Badge>
      </div>
      <PlayerLine
        player={a}
        seed={match.seedA}
        winner={!!winnerId && String(winnerId) === a?._id}
      />
      <div className="border-t border-border my-1.5" />
      <PlayerLine
        player={b}
        seed={match.seedB}
        winner={!!winnerId && String(winnerId) === b?._id}
      />
      {match.mode === 'streak' && match.streakResult && (
        <div className="text-[10px] mt-2 text-accent-red flex items-center gap-1">
          🔥 {match.streakResult.finalStreakA} ·{' '}
          {match.streakResult.finalStreakB} ({match.streakResult.totalGames}G)
        </div>
      )}
    </button>
  );
}

function PlayerLine({
  player,
  seed,
  winner,
}: {
  player: IPlayer | null;
  seed?: number;
  winner: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 py-1 ${
        winner ? 'text-accent-yellow' : ''
      }`}
    >
      <span className="font-mono text-[10px] text-text-muted w-5">
        {seed ? `#${seed}` : '–'}
      </span>
      {player ? (
        <CharacterAvatar
          name={player.gamerTag}
          character={player.character}
          size="sm"
        />
      ) : (
        <div className="h-8 w-8 border border-dashed border-border" />
      )}
      <span className="font-display tracking-wider truncate">
        {player?.gamerTag || 'TBD'}
      </span>
    </div>
  );
}

function CreateBracketModal({
  tournamentId,
  onClose,
  onCreated,
}: {
  tournamentId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { push } = useToast();
  const [size, setSize] = useState(8);
  const [format, setFormat] = useState<'normal' | 'streak'>('normal');
  const [matchFormat, setMatchFormat] = useState('BO5');
  const [streakTarget, setStreakTarget] = useState(3);
  const [maxGameCap, setMaxGameCap] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      await api.post(`/tournaments/${tournamentId}/playoffs/create`, {
        size,
        format,
        matchFormat,
        streakTarget,
        maxGameCap: maxGameCap === '' ? undefined : maxGameCap,
      });
      push('Bracket created', 'success');
      onCreated();
    } catch (err) {
      push(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Create Playoff Bracket">
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Size"
          value={String(size)}
          onChange={(e) => setSize(Number(e.target.value))}
          options={[
            { value: '2', label: 'Top 2' },
            { value: '4', label: 'Top 4' },
            { value: '8', label: 'Top 8' },
            { value: '16', label: 'Top 16' },
          ]}
        />
        <Select
          label="Format"
          value={format}
          onChange={(e) => setFormat(e.target.value as 'normal' | 'streak')}
          options={[
            { value: 'normal', label: 'Normal (best-of)' },
            { value: 'streak', label: 'Streak Mode' },
          ]}
        />
        {format === 'normal' ? (
          <Select
            label="Match Format"
            value={matchFormat}
            onChange={(e) => setMatchFormat(e.target.value)}
            options={[
              { value: 'BO3', label: 'BO3' },
              { value: 'BO5', label: 'BO5' },
              { value: 'BO7', label: 'BO7' },
            ]}
          />
        ) : (
          <>
            <Input
              label="Streak Target"
              type="number"
              min={2}
              value={String(streakTarget)}
              onChange={(e) => setStreakTarget(Number(e.target.value))}
            />
            <Input
              label="Max Game Cap (optional)"
              type="number"
              min={1}
              value={maxGameCap === '' ? '' : String(maxGameCap)}
              onChange={(e) =>
                setMaxGameCap(
                  e.target.value === '' ? '' : Number(e.target.value),
                )
              }
            />
          </>
        )}
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} loading={submitting}>
          Create
        </Button>
      </div>
    </Modal>
  );
}

function PlayoffMatchModal({
  tournamentId,
  match,
  isAdmin,
  onClose,
  onUpdated,
}: {
  tournamentId: string;
  match: IPlayoffMatch;
  isAdmin: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const { push } = useToast();
  const a = asPlayer(match.playerA);
  const b = asPlayer(match.playerB);
  const [score, setScore] = useState(match.normalResult?.score || '');
  const [winner, setWinner] = useState<string>(
    match.normalResult?.winner ? String(match.normalResult.winner) : '',
  );
  const [submitting, setSubmitting] = useState(false);

  async function submitNormal() {
    if (!winner) return push('Pick a winner', 'error');
    if (!score) return push('Score required', 'error');
    setSubmitting(true);
    try {
      await api.put(
        `/tournaments/${tournamentId}/playoffs/${match._id}/result`,
        { winner, score },
      );
      push('Result saved', 'success');
      onUpdated();
    } catch (err) {
      push(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitStreakGame(winnerId: string) {
    setSubmitting(true);
    try {
      await api.put(
        `/tournaments/${tournamentId}/playoffs/${match._id}/streak-game`,
        { winner: winnerId },
      );
      onUpdated();
    } catch (err) {
      push(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (!a || !b) {
    return (
      <Modal open onClose={onClose} title="Match not ready">
        <p className="text-text-secondary text-sm">
          One or both players are still TBD — finish feeder matches first.
        </p>
        <div className="mt-4 flex justify-end">
          <Button onClick={onClose} variant="ghost">
            Close
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title={`R${match.round} · M${match.matchNumber}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CharacterAvatar
            name={a.gamerTag}
            character={a.character}
            size="md"
          />
          <span className="font-display tracking-wider">{a.gamerTag}</span>
        </div>
        <span className="font-display text-text-muted">VS</span>
        <div className="flex items-center gap-2">
          <span className="font-display tracking-wider">{b.gamerTag}</span>
          <CharacterAvatar
            name={b.gamerTag}
            character={b.character}
            size="md"
          />
        </div>
      </div>

      {match.mode === 'streak' ? (
        <div className="space-y-3">
          <div className="text-sm">
            Sequence:{' '}
            <span className="font-mono">
              {(match.streakResult?.sequence || []).map((s) => {
                const id = String(s);
                if (id === a._id) return 'A';
                if (id === b._id) return 'B';
                return '?';
              })
                .join(' ') || '—'}
            </span>
          </div>
          <div className="text-sm">
            Streak: <span className="font-mono">A {match.streakResult?.finalStreakA || 0}</span>
            {' · '}
            <span className="font-mono">B {match.streakResult?.finalStreakB || 0}</span>
          </div>
          {isAdmin && match.status !== 'completed' && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                onClick={() => submitStreakGame(a._id)}
                loading={submitting}
              >
                {a.gamerTag} wins next
              </Button>
              <Button
                onClick={() => submitStreakGame(b._id)}
                loading={submitting}
                variant="secondary"
              >
                {b.gamerTag} wins next
              </Button>
            </div>
          )}
          {match.status === 'completed' && (
            <Badge tone="gold">
              Winner:{' '}
              {String(match.streakResult?.winner) === a._id
                ? a.gamerTag
                : b.gamerTag}
            </Badge>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <Select
            label="Winner"
            value={winner}
            onChange={(e) => setWinner(e.target.value)}
            options={[
              { value: '', label: '—' },
              { value: a._id, label: a.gamerTag },
              { value: b._id, label: b.gamerTag },
            ]}
            disabled={!isAdmin}
          />
          <Input
            label="Score"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder="3-1"
            disabled={!isAdmin}
          />
          {isAdmin && (
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={submitNormal} loading={submitting}>
                Save Result
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
