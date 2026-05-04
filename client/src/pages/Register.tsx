import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { CharacterPicker } from '../components/player/CharacterPicker';
import { useToast } from '../context/ToastContext';
import type { ITournament } from '../types';

export function Register() {
  const { slug = '' } = useParams();
  const { push } = useToast();
  const [tournament, setTournament] = useState<ITournament | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [gamerTag, setGamerTag] = useState('');
  const [department, setDepartment] = useState('');
  const [character, setCharacter] = useState('');
  const [bio, setBio] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancel = false;
    api
      .get(`/public/${slug}`)
      .then(({ data }) => {
        if (!cancel) setTournament(data.tournament);
      })
      .catch((err) => {
        if (!cancel) setLoadError(getErrorMessage(err));
      })
      .finally(() => !cancel && setLoading(false));
    return () => {
      cancel = true;
    };
  }, [slug]);

  if (loading) return <PageLoader label="Loading…" />;
  if (loadError || !tournament)
    return (
      <div className="max-w-3xl mx-auto p-6">
        <EmptyState title="Tournament not found" description={loadError || ''} />
      </div>
    );

  const closed = tournament.fixturesGenerated;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/public/${slug}/register`, {
        name,
        gamerTag,
        department,
        character,
        bio,
      });
      push('Registered! See you in the bracket.', 'success');
      setDone(true);
    } catch (err) {
      push(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <div className="font-display tracking-widest uppercase text-text-muted text-xs">
          {tournament.game} · /{tournament.slug}
        </div>
        <h1 className="font-display text-4xl tracking-wider">
          <span className="bg-gradient-fire bg-clip-text text-transparent">
            Join {tournament.name}
          </span>
        </h1>
        <p className="text-text-secondary mt-1 text-sm">
          Sign yourself up — no account needed.
        </p>
      </div>

      {closed ? (
        <Card>
          <EmptyState
            title="Registration closed"
            description="Fixtures have already been generated for this tournament."
            action={
              <Link to={`/${slug}`}>
                <Button variant="ghost">View tournament →</Button>
              </Link>
            }
          />
        </Card>
      ) : done ? (
        <Card>
          <div className="text-center py-6 space-y-4">
            <h2 className="font-display text-2xl tracking-wider text-accent-yellow">
              You're in!
            </h2>
            <p className="text-text-secondary">
              {gamerTag}, watch the bracket for your matches.
            </p>
            <div className="flex justify-center gap-2">
              <Link to={`/${slug}`}>
                <Button>View tournament</Button>
              </Link>
              <Button
                variant="ghost"
                onClick={() => {
                  setName('');
                  setGamerTag('');
                  setDepartment('');
                  setCharacter('');
                  setBio('');
                  setDone(false);
                }}
              >
                Register another
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Gamer Tag"
              value={gamerTag}
              onChange={(e) => setGamerTag(e.target.value)}
              required
            />
            <Input
              label="Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
            <Input
              label="Bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
            <div>
              <div className="font-display uppercase tracking-wider text-xs text-text-secondary mb-2">
                Character
                {tournament.characterLock && (
                  <Badge tone="gold" className="ml-2">
                    Locks on first match
                  </Badge>
                )}
              </div>
              <CharacterPicker
                characters={tournament.availableCharacters}
                selected={character}
                onSelect={setCharacter}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Link to={`/${slug}`}>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" loading={submitting}>
                Register
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
