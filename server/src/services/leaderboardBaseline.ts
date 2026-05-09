import { ILeaderboardSnapshotDoc } from '../models/LeaderboardSnapshot';
import { nextGameDayUTC } from './scheduler';

// 4pm IST = 10:30 UTC. The codebase has no timezone field; this matches the
// deployment region (asia-south1). Adjust if the tournament moves regions.
const GAP_CUTOFF_HOUR_UTC = 10;
const GAP_CUTOFF_MINUTE_UTC = 30;

export interface LeaderboardBaseline {
  capturedAt: Date | null;
  prevByPlayer: Map<string, number>;
}

export function pickLeaderboardBaseline(
  snapshots: ILeaderboardSnapshotDoc[],
  weekdaysOnly: boolean,
  now: Date = new Date(),
): LeaderboardBaseline {
  const latest = snapshots[0] ?? null;
  const prior = snapshots[1] ?? null;
  if (!latest) return { capturedAt: null, prevByPlayer: new Map() };

  const cutoff = nextGameDayUTC(latest.capturedAt, weekdaysOnly);
  cutoff.setUTCHours(GAP_CUTOFF_HOUR_UTC, GAP_CUTOFF_MINUTE_UTC, 0, 0);
  const inCarryWindow = prior != null && now.getTime() < cutoff.getTime();

  const source = inCarryWindow ? prior : latest;
  const prevByPlayer = new Map<string, number>();
  for (const r of source.rows) {
    prevByPlayer.set(String(r.player), r.rank);
  }
  return { capturedAt: latest.capturedAt, prevByPlayer };
}
