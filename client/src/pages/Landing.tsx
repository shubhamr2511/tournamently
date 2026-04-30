import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getErrorMessage } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import type { ITournament } from '../types';

export function Landing() {
  const [list, setList] = useState<ITournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/tournaments')
      .then(({ data }) => setList(data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <section className="mb-10">
        <h1 className="font-display text-5xl md:text-6xl font-bold tracking-wider">
          <span className="bg-gradient-fire bg-clip-text text-transparent">
            ENTER THE
          </span>
          <br />
          <span className="text-accent-yellow">TOURNAMENT</span>
        </h1>
        <p className="text-text-secondary mt-3 max-w-xl">
          A tournament OS for office and friend group competitions. League
          stages, bonus points, and dramatic playoff formats.
        </p>
        <div className="mt-6 flex gap-3">
          <Link to="/create">
            <Button size="lg">+ Create Tournament</Button>
          </Link>
        </div>
      </section>

      <h2 className="font-display tracking-widest uppercase text-text-secondary text-sm mb-3">
        Active Tournaments
      </h2>

      {loading && <PageLoader />}
      {error && <div className="text-accent-red">{error}</div>}
      {!loading && !error && list.length === 0 && (
        <EmptyState
          title="No tournaments yet"
          description="Be the first to create one — it takes about a minute."
          action={
            <Link to="/create">
              <Button>Create Tournament</Button>
            </Link>
          }
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((t) => (
          <Card key={t._id} glow="gold">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link
                  to={`/${t.slug}`}
                  className="font-display text-xl tracking-wider hover:text-accent-yellow transition-colors block truncate"
                >
                  {t.name}
                </Link>
                <div className="text-xs text-text-muted">{t.game}</div>
              </div>
              <Badge tone="purple">{t.status}</Badge>
            </div>
            <div className="mt-3 text-xs text-text-secondary truncate">
              {t.description || 'No description'}
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-text-muted">
                {t.matchFormat} · {t.format.replace('_', ' ')}
              </span>
              <Link
                to={`/${t.slug}`}
                className="font-display tracking-wider uppercase text-accent-yellow hover:underline"
              >
                view →
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
