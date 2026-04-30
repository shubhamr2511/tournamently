import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Toggle } from '../components/ui/Toggle';
import { Badge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import { CharacterAvatar } from '../components/player/CharacterAvatar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTournament } from '../hooks/useTournament';
import { gamesToWinFor, maxGamesFor } from '../utils/scoring';
import type { IMatch, IPlayer } from '../types';

function asPlayer(p: string | IPlayer | undefined): IPlayer | null {
  return p && typeof p === 'object' ? (p as IPlayer) : null;
}

export function MatchResult() {
  const { slug = '', matchId } = useParams();
  const navigate = useNavigate();
  const { session, isAdminOf } = useAuth();
  const { push } = useToast();
  const { tournament } = useTournament(slug);
  const isAdmin = isAdminOf(slug);

  const [match, setMatch] = useState<IMatch | null>(null);
  const [loading, setLoading] = useState(true);

  const target = useMemo(
    () => (tournament ? gamesToWinFor(tournament.matchFormat) : 2),
    [tournament],
  );
  const max = useMemo(
    () => (tournament ? maxGamesFor(tournament.matchFormat) : 3),
    [tournament],
  );

  const [games, setGames] = useState<{ winner: 'A' | 'B' | '' }[]>([]);
  const [aPerfect, setAPerfect] = useState(0);
  const [aFast, setAFast] = useState(0);
  const [bPerfect, setBPerfect] = useState(0);
  const [bFast, setBFast] = useState(0);
  const [featured, setFeatured] = useState(false);
  const [upset, setUpset] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session && !isAdmin) navigate(`/t/${slug}/login`);
  }, [session, isAdmin, slug, navigate]);

  useEffect(() => {
    if (!tournament || !matchId) return;
    api
      .get(`/tournaments/${tournament._id}/matches/${matchId}`)
      .then(({ data }) => {
        setMatch(data);
        if (data.result) {
          const ar = data.result;
          const aId = String(
            (asPlayer(data.playerA)?._id || data.playerA) as string,
          );
          setGames(
            ar.games.map((g: any) => ({
              winner: String(g.winner) === aId ? 'A' : 'B',
            })),
          );
          setAPerfect(ar.playerAStats?.perfectRounds || 0);
          setAFast(ar.playerAStats?.fastWins || 0);
          setBPerfect(ar.playerBStats?.perfectRounds || 0);
          setBFast(ar.playerBStats?.fastWins || 0);
          setFeatured(!!ar.isFeatured);
          setUpset(!!ar.isUpset);
          setNotes(ar.notes || '');
        } else {
          setGames(Array.from({ length: target }, () => ({ winner: '' })));
        }
      })
      .catch((err) => push(getErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, [tournament, matchId, target, push]);

  if (loading) return <PageLoader />;
  if (!match || !tournament) return <div>Not found</div>;

  const a = asPlayer(match.playerA);
  const b = asPlayer(match.playerB);
  const aId = String(a?._id || match.playerA);
  const bId = String(b?._id || match.playerB);

  const aWins = games.filter((g) => g.winner === 'A').length;
  const bWins = games.filter((g) => g.winner === 'B').length;
  const decided = aWins >= target || bWins >= target;
  const winner = aWins > bWins ? a : bWins > aWins ? b : null;

  function setGameWinner(idx: number, winner: 'A' | 'B') {
    setGames((g) => {
      const next = [...g];
      next[idx] = { winner };
      return next;
    });
  }

  function addGameSlot() {
    if (games.length >= max) return;
    setGames((g) => [...g, { winner: '' }]);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!tournament || !match) return;
    if (!winner) {
      push('No winner determined yet', 'error');
      return;
    }
    const validGames = games.filter((g) => g.winner !== '');
    const payload = {
      winner: winner._id,
      score: `${aWins}-${bWins}`.replace(/^([0-9]+)-([0-9]+)$/, (_, a, b) =>
        Number(a) >= Number(b) ? `${a}-${b}` : `${b}-${a}`,
      ),
      games: validGames.map((g, i) => ({
        gameNumber: i + 1,
        winner: g.winner === 'A' ? aId : bId,
      })),
      playerAStats: { perfectRounds: aPerfect, fastWins: aFast },
      playerBStats: { perfectRounds: bPerfect, fastWins: bFast },
      isFeatured: featured,
      isUpset: upset,
      notes,
    };
    setSaving(true);
    try {
      const url = match?.result
        ? `/tournaments/${tournament._id}/matches/${match._id}/result/edit`
        : `/tournaments/${tournament._id}/matches/${match._id}/result`;
      await api.put(url, payload);
      push('Result saved', 'success');
      navigate(`/t/${slug}/matches`);
    } catch (err) {
      push(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function clearResult() {
    if (!tournament || !match) return;
    if (!confirm('Clear this match result?')) return;
    try {
      await api.delete(
        `/tournaments/${tournament._id}/matches/${match._id}/result`,
      );
      push('Result cleared', 'success');
      navigate(`/t/${slug}/matches`);
    } catch (err) {
      push(getErrorMessage(err), 'error');
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-3xl tracking-wider">
          Match #{match.matchNumber}
        </h1>
        <Badge tone="purple">{tournament.matchFormat}</Badge>
      </div>

      <Card className="mb-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex items-center gap-3">
            <CharacterAvatar
              name={a?.gamerTag || 'A'}
              character={a?.character}
              size="lg"
            />
            <div>
              <div className="font-display text-xl tracking-wider">
                {a?.gamerTag}
              </div>
              <div className="text-xs text-text-muted">{a?.character}</div>
            </div>
          </div>
          <div className="text-center">
            <div className="font-display text-3xl text-accent-yellow">
              {aWins} - {bWins}
            </div>
            <div className="text-[10px] text-text-muted">first to {target}</div>
          </div>
          <div className="flex items-center gap-3 justify-end text-right">
            <div>
              <div className="font-display text-xl tracking-wider">
                {b?.gamerTag}
              </div>
              <div className="text-xs text-text-muted">{b?.character}</div>
            </div>
            <CharacterAvatar
              name={b?.gamerTag || 'B'}
              character={b?.character}
              size="lg"
            />
          </div>
        </div>
      </Card>

      <form onSubmit={submit} className="space-y-4">
        <Card>
          <div className="font-display tracking-widest uppercase text-text-secondary text-xs mb-3">
            Games
          </div>
          <div className="flex flex-col gap-2">
            {games.map((g, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-sm border border-border px-3 py-2 clip-angled bg-bg-tertiary"
              >
                <span className="font-mono text-text-muted w-12">G{i + 1}</span>
                <button
                  type="button"
                  onClick={() => setGameWinner(i, 'A')}
                  className={`flex-1 px-3 py-1.5 clip-angled font-display tracking-wider text-sm transition-all ${
                    g.winner === 'A'
                      ? 'bg-accent-green/20 border border-accent-green text-accent-green'
                      : 'border border-border hover:border-accent-blue'
                  }`}
                >
                  {a?.gamerTag} wins
                </button>
                <button
                  type="button"
                  onClick={() => setGameWinner(i, 'B')}
                  className={`flex-1 px-3 py-1.5 clip-angled font-display tracking-wider text-sm transition-all ${
                    g.winner === 'B'
                      ? 'bg-accent-green/20 border border-accent-green text-accent-green'
                      : 'border border-border hover:border-accent-blue'
                  }`}
                >
                  {b?.gamerTag} wins
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addGameSlot}
              disabled={games.length >= max || decided}
            >
              + Add Game
            </Button>
            {decided && winner && (
              <Badge tone="gold">{winner.gamerTag} wins</Badge>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card>
            <div className="font-display tracking-widest uppercase text-accent-green text-xs mb-3">
              {a?.gamerTag} stats
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Perfect Rounds"
                type="number"
                min={0}
                value={String(aPerfect)}
                onChange={(e) => setAPerfect(Number(e.target.value || 0))}
              />
              <Input
                label="Fast Wins"
                type="number"
                min={0}
                value={String(aFast)}
                onChange={(e) => setAFast(Number(e.target.value || 0))}
              />
            </div>
          </Card>
          <Card>
            <div className="font-display tracking-widest uppercase text-accent-blue text-xs mb-3">
              {b?.gamerTag} stats
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Perfect Rounds"
                type="number"
                min={0}
                value={String(bPerfect)}
                onChange={(e) => setBPerfect(Number(e.target.value || 0))}
              />
              <Input
                label="Fast Wins"
                type="number"
                min={0}
                value={String(bFast)}
                onChange={(e) => setBFast(Number(e.target.value || 0))}
              />
            </div>
          </Card>
        </div>

        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Toggle
              label="Featured match (gold border in feed)"
              checked={featured}
              onChange={setFeatured}
            />
            <Toggle
              label="Tag as upset"
              checked={upset}
              onChange={setUpset}
            />
          </div>
          <div className="mt-3">
            <Input
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </Card>

        <div className="flex flex-wrap gap-2 justify-end">
          {match.result && (
            <Button type="button" variant="danger" onClick={clearResult}>
              Clear Result
            </Button>
          )}
          <Button
            type="submit"
            loading={saving}
            disabled={!decided}
            size="lg"
          >
            {match.result ? 'Update Result' : 'Submit Result'}
          </Button>
        </div>
      </form>
    </div>
  );
}
