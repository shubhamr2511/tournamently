import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../services/api';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Toggle } from '../components/ui/Toggle';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTournament } from '../hooks/useTournament';

function toDateInput(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function EditTournament() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { isAdminOf, session } = useAuth();
  const { push } = useToast();
  const { tournament, loading, reload } = useTournament(slug);
  const isAdmin = isAdminOf(slug);

  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    game: '',
    description: '',
    matchFormat: 'BO3',
    playerCount: 8,
    matchesPerDay: 4,
    startDate: '',
    endDate: '',
    weekdaysOnly: true,
    characterLock: false,
    perfectRoundBonus: 1,
    fastWinBonus: 1,
    fastWinThresholdSeconds: 10,
  });

  useEffect(() => {
    if (!isAdmin && !session) navigate(`/t/${slug}/login`);
  }, [isAdmin, session, slug, navigate]);

  useEffect(() => {
    if (!tournament) return;
    setForm({
      name: tournament.name,
      game: tournament.game,
      description: tournament.description || '',
      matchFormat: tournament.matchFormat,
      playerCount: tournament.playerCount,
      matchesPerDay: tournament.matchesPerDay,
      startDate: toDateInput(tournament.startDate),
      endDate: toDateInput(tournament.endDate),
      weekdaysOnly: tournament.weekdaysOnly,
      characterLock: tournament.characterLock,
      perfectRoundBonus: tournament.scoring?.perfectRoundBonus ?? 1,
      fastWinBonus: tournament.scoring?.fastWinBonus ?? 1,
      fastWinThresholdSeconds:
        tournament.scoring?.fastWinThresholdSeconds ?? 10,
    });
  }, [tournament]);

  function update<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!tournament) return;
    if (!form.startDate || !form.endDate) {
      push('Start and end dates are required', 'error');
      return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      push('End date must be on or after start date', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.put(`/tournaments/${tournament._id}`, {
        name: form.name,
        game: form.game,
        description: form.description,
        matchFormat: form.matchFormat,
        playerCount: form.playerCount,
        matchesPerDay: form.matchesPerDay,
        startDate: form.startDate,
        endDate: form.endDate,
        weekdaysOnly: form.weekdaysOnly,
        characterLock: form.characterLock,
        scoring: {
          perfectRoundBonus: form.perfectRoundBonus,
          fastWinBonus: form.fastWinBonus,
          fastWinThresholdSeconds: form.fastWinThresholdSeconds,
        },
      });
      push('Tournament updated', 'success');
      reload();
      navigate(`/t/${slug}/dashboard`);
    } catch (err) {
      push(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <PageLoader />;
  if (!tournament) return <div>Tournament not found</div>;
  if (!isAdmin) return null;

  const lockedFixturesNote = tournament.fixturesGenerated;
  const totalDays = (() => {
    if (!form.startDate || !form.endDate) return 0;
    const a = new Date(form.startDate);
    const b = new Date(form.endDate);
    let count = 0;
    const d = new Date(a);
    while (d <= b) {
      const day = d.getUTCDay();
      if (!form.weekdaysOnly || (day !== 0 && day !== 6)) count++;
      d.setUTCDate(d.getUTCDate() + 1);
    }
    return count;
  })();
  const totalSlots = totalDays * form.matchesPerDay;
  const projectedMatches = (form.playerCount * (form.playerCount - 1)) / 2;

  return (
    <div className="max-w-2xl mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <div className="font-display tracking-widest uppercase text-text-muted text-xs">
            Edit Tournament
          </div>
          <h1 className="font-display text-3xl tracking-wider">
            {tournament.name}
          </h1>
          <div className="text-sm text-text-secondary">
            URL slug
            <span className="text-accent-yellow"> /{tournament.slug}</span>
            <span className="text-text-muted"> (cannot be changed)</span>
          </div>
        </div>
        <Link to={`/t/${slug}/dashboard`}>
          <Button variant="ghost" size="sm">
            Back to dashboard
          </Button>
        </Link>
      </header>

      {lockedFixturesNote && (
        <Card glow="red" className="mb-4">
          <div className="flex items-start gap-3">
            <Badge tone="red">Fixtures Live</Badge>
            <div className="text-sm text-text-secondary">
              Fixtures are already generated. Editing schedule fields here
              won't reschedule existing matches — reset fixtures from the
              Fixtures page first if you want changes to apply to the schedule.
            </div>
          </div>
        </Card>
      )}

      <Card>
        <form
          onSubmit={onSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Input
            label="Tournament Name"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            required
          />
          <Input
            label="Game"
            value={form.game}
            onChange={(e) => update('game', e.target.value)}
            required
          />
          <Select
            label="Match Format"
            value={form.matchFormat}
            onChange={(e) => update('matchFormat', e.target.value)}
            options={[
              { value: 'BO3', label: 'Best of 3' },
              { value: 'BO5', label: 'Best of 5' },
              { value: 'BO7', label: 'Best of 7' },
            ]}
          />
          <Input
            label="Expected Player Count"
            type="number"
            value={String(form.playerCount)}
            onChange={(e) => update('playerCount', Number(e.target.value))}
            min={2}
            max={128}
            hint={`≈ ${projectedMatches} round-robin matches at ${form.playerCount} players`}
          />
          <Input
            label="Matches Per Day"
            type="number"
            value={String(form.matchesPerDay)}
            onChange={(e) => update('matchesPerDay', Number(e.target.value))}
            min={1}
            max={50}
          />
          <div />
          <Input
            label="Start Date"
            type="date"
            value={form.startDate}
            onChange={(e) => update('startDate', e.target.value)}
            required
          />
          <Input
            label="End Date"
            type="date"
            value={form.endDate}
            onChange={(e) => update('endDate', e.target.value)}
            required
          />
          <div className="md:col-span-2">
            <Input
              label="Description"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </div>
          <div className="md:col-span-2 flex flex-wrap gap-6 pt-2">
            <Toggle
              label="Weekdays only"
              checked={form.weekdaysOnly}
              onChange={(v) => update('weekdaysOnly', v)}
            />
            <Toggle
              label="Lock characters once chosen"
              checked={form.characterLock}
              onChange={(v) => update('characterLock', v)}
            />
          </div>

          <div className="md:col-span-2 border-t border-border pt-4 mt-2">
            <div className="font-display tracking-widest uppercase text-xs text-text-secondary mb-3">
              Capacity Check
            </div>
            <div className="text-sm">
              <span className="text-text-secondary">Available slots: </span>
              <span
                className={
                  totalSlots >= projectedMatches
                    ? 'text-accent-green'
                    : 'text-accent-red'
                }
              >
                {totalSlots}
              </span>
              <span className="text-text-muted">
                {' '}
                ({totalDays} day{totalDays === 1 ? '' : 's'} ×{' '}
                {form.matchesPerDay}/day)
              </span>
              <span className="text-text-secondary"> · need </span>
              <span className="text-text-primary">{projectedMatches}</span>
              {totalSlots < projectedMatches && (
                <div className="text-xs text-accent-red mt-1">
                  Not enough room. Extend the date range, raise matches/day, or
                  include weekends.
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2 border-t border-border pt-4 mt-2">
            <div className="font-display tracking-widest uppercase text-xs text-text-secondary mb-3">
              Scoring
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Perfect Round Bonus"
                type="number"
                value={String(form.perfectRoundBonus)}
                onChange={(e) =>
                  update('perfectRoundBonus', Number(e.target.value))
                }
                min={0}
              />
              <Input
                label="Fast Win Bonus"
                type="number"
                value={String(form.fastWinBonus)}
                onChange={(e) => update('fastWinBonus', Number(e.target.value))}
                min={0}
              />
              <Input
                label="Fast Win Threshold (s)"
                type="number"
                value={String(form.fastWinThresholdSeconds)}
                onChange={(e) =>
                  update('fastWinThresholdSeconds', Number(e.target.value))
                }
                min={1}
              />
            </div>
          </div>

          <div className="md:col-span-2 mt-2 flex gap-3">
            <Button type="submit" loading={submitting} size="lg">
              Save Changes
            </Button>
            <Link to={`/t/${slug}/dashboard`}>
              <Button type="button" variant="ghost" size="lg">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
