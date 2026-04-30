import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../services/api';
import type { IMatch } from '../types';

interface Filters {
  status?: string;
  date?: string;
  player?: string;
}

export function useMatches(tournamentId?: string, filters?: Filters) {
  const [matches, setMatches] = useState<IMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (!tournamentId) return;
    let cancel = false;
    setLoading(true);
    api
      .get(`/tournaments/${tournamentId}/fixtures`, { params: filters })
      .then(({ data }) => {
        if (!cancel) setMatches(data);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId, filters?.status, filters?.date, filters?.player, key]);

  return { matches, loading, error, reload: () => setKey((k) => k + 1) };
}
