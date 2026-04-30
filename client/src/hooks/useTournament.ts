import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../services/api';
import type { ITournament } from '../types';

export function useTournament(slug?: string) {
  const [tournament, setTournament] = useState<ITournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!slug) return;
    let cancel = false;
    setLoading(true);
    api
      .get(`/tournaments/slug/${slug}`)
      .then(({ data }) => {
        if (!cancel) setTournament(data);
      })
      .catch((err) => {
        if (!cancel) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [slug, reloadKey]);

  return {
    tournament,
    loading,
    error,
    reload: () => setReloadKey((k) => k + 1),
  };
}
