import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../services/api';
import type { IPlayer } from '../types';

export function usePlayers(tournamentId?: string) {
  const [players, setPlayers] = useState<IPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (!tournamentId) return;
    let cancel = false;
    setLoading(true);
    api
      .get(`/tournaments/${tournamentId}/players`)
      .then(({ data }) => {
        if (!cancel) setPlayers(data);
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
  }, [tournamentId, key]);

  return { players, loading, error, reload: () => setKey((k) => k + 1) };
}
