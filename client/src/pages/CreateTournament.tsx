import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '../services/api';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Toggle } from '../components/ui/Toggle';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function CreateTournament() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { push } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    game: 'Tekken 8',
    description: '',
    matchFormat: 'BO3',
    playerCount: 8,
    matchesPerDay: 4,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    weekdaysOnly: true,
    characterLock: false,
    adminPassword: '',
  });

  function update<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/tournaments', form);
      push('Tournament created — logging you in…', 'success');
      await login(form.slug, form.adminPassword);
      navigate(`/t/${form.slug}/dashboard`);
    } catch (err) {
      push(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-3xl tracking-wider mb-1">
        Create Tournament
      </h1>
      <p className="text-text-secondary text-sm mb-6">
        You'll be the admin. The slug becomes part of the public URL:
        <span className="text-accent-yellow"> tournamently.in/{form.slug || 'YourSlug'}</span>
      </p>
      <Card>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Tournament Name"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            required
          />
          <Input
            label="URL Slug"
            value={form.slug}
            onChange={(e) => update('slug', e.target.value)}
            placeholder="TMtekken"
            hint="3–30 chars · letters, numbers, dash, underscore"
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
          />
          <Input
            label="Matches Per Day"
            type="number"
            value={String(form.matchesPerDay)}
            onChange={(e) => update('matchesPerDay', Number(e.target.value))}
            min={1}
            max={50}
          />
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
            <Input
              label="Admin Password"
              type="password"
              value={form.adminPassword}
              onChange={(e) => update('adminPassword', e.target.value)}
              required
              hint="Used to manage this tournament. Min 4 chars."
            />
          </div>
          <div className="md:col-span-2 mt-2">
            <Button type="submit" loading={submitting} size="lg">
              Create Tournament
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
