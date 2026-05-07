import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../services/api';
import type { ILeaderboardRow } from '../types';

export function useLeaderboard(tournamentId?: string) {
  const [rows, setRows] = useState<ILeaderboardRow[]>([]);
  const [snapshotCapturedAt, setSnapshotCapturedAt] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (!tournamentId) return;
    let cancel = false;
    setLoading(true);
    api
      .get(`/tournaments/${tournamentId}/leaderboard`)
      .then(({ data }) => {
        if (cancel) return;
        if (Array.isArray(data)) {
          setRows(data);
          setSnapshotCapturedAt(null);
        } else {
          setRows(data.rows ?? []);
          setSnapshotCapturedAt(data.snapshotCapturedAt ?? null);
        }
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

  return {
    rows,
    snapshotCapturedAt,
    loading,
    error,
    reload: () => setKey((k) => k + 1),
  };
}
