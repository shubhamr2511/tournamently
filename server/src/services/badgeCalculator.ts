import { IPlayerDoc } from '../models/Player';
import { IMatchDoc } from '../models/Match';
import { ILeaderboardSnapshotDoc } from '../models/LeaderboardSnapshot';
import { LeaderboardRow } from './leaderboardCalculator';

export interface BadgePlayerSummary {
  _id: string;
  gamerTag: string;
  name: string;
  character?: string;
}

export interface BadgeWinner {
  player: BadgePlayerSummary;
  value: number;
  detail?: string;
}

export interface BadgeAward {
  key: string;
  name: string;
  description: string;
  winner: BadgeWinner | null;
}

function summary(p: IPlayerDoc): BadgePlayerSummary {
  return {
    _id: String(p._id),
    gamerTag: p.gamerTag,
    name: p.name,
    character: p.character,
  };
}

function topByMap(map: Map<string, number>): { id: string; value: number } | null {
  let best: { id: string; value: number } | null = null;
  map.forEach((v, id) => {
    if (v <= 0) return;
    if (!best || v > best.value) best = { id, value: v };
  });
  return best;
}

export function computeBadges(
  leaderboard: LeaderboardRow[],
  players: IPlayerDoc[],
  matches: IMatchDoc[],
  snapshots?: ILeaderboardSnapshotDoc[],
): BadgeAward[] {
  const playerById = new Map<string, IPlayerDoc>();
  for (const p of players) playerById.set(String(p._id), p);

  const rankByPlayer = new Map<string, number>();
  for (const r of leaderboard) rankByPlayer.set(String(r.player._id), r.rank);

  const completed = matches
    .filter((m) => m.status === 'completed' && m.result)
    .sort((a, b) => {
      const ad = a.result!.completedAt ? new Date(a.result!.completedAt).getTime() : 0;
      const bd = b.result!.completedAt ? new Date(b.result!.completedAt).getTime() : 0;
      return ad - bd;
    });

  const bully = new Map<string, number>();
  const philosopher = new Map<string, number>();
  const drama = new Map<string, number>();
  const donator = new Map<string, number>();
  const giantSlayer = new Map<string, number>();
  const streakBest = new Map<string, number>();
  const streakNow = new Map<string, number>();

  let whoopsie: { winnerId: string; gap: number } | null = null;
  let latestKingSlayer: { winnerId: string; timestamp: number } | null = null;

  // Build a timeline of who was #1 at each snapshot time
  const rank1Timeline: Array<{ time: number; playerId: string | null }> = [];
  if (snapshots && snapshots.length > 0) {
    const sortedSnapshots = [...snapshots].reverse();
    for (const snap of sortedSnapshots) {
      const rank1 = snap.rows.find((r) => r.rank === 1);
      rank1Timeline.push({
        time: snap.capturedAt.getTime(),
        playerId: rank1 ? String(rank1.player) : null,
      });
    }
  }
  const currentRank1 = leaderboard[0] ? String(leaderboard[0].player._id) : null;
  rank1Timeline.push({ time: Date.now(), playerId: currentRank1 });

  const getKingAtTime = (matchTime: number): string | null => {
    for (let i = rank1Timeline.length - 1; i >= 0; i--) {
      if (rank1Timeline[i].time <= matchTime) {
        return rank1Timeline[i].playerId;
      }
    }
    return null;
  };

  for (const m of completed) {
    const aId = String(m.playerA);
    const bId = String(m.playerB);
    const winnerId = String(m.result!.winner);
    const loserId = winnerId === aId ? bId : aId;
    const score = m.result!.score;

    if (score === '2-1') {
      drama.set(aId, (drama.get(aId) || 0) + 1);
      drama.set(bId, (drama.get(bId) || 0) + 1);
      philosopher.set(winnerId, (philosopher.get(winnerId) || 0) + 1);
    } else if (score === '2-0') {
      bully.set(winnerId, (bully.get(winnerId) || 0) + 1);
    }

    const aGross = m.result!.playerAStats?.bonusPoints || 0;
    const bGross = m.result!.playerBStats?.bonusPoints || 0;
    donator.set(aId, (donator.get(aId) || 0) + bGross);
    donator.set(bId, (donator.get(bId) || 0) + aGross);

    const matchTime = m.result!.completedAt ? new Date(m.result!.completedAt).getTime() : 0;
    const kingAtTime = getKingAtTime(matchTime);
    if (kingAtTime && winnerId !== kingAtTime && loserId === kingAtTime) {
      if (!latestKingSlayer || matchTime > latestKingSlayer.timestamp) {
        latestKingSlayer = { winnerId, timestamp: matchTime };
      }
    }

    const winnerStreak = (streakNow.get(winnerId) || 0) + 1;
    streakNow.set(winnerId, winnerStreak);
    streakNow.set(loserId, 0);
    streakBest.set(winnerId, Math.max(streakBest.get(winnerId) || 0, winnerStreak));

    const winnerRank = rankByPlayer.get(winnerId);
    const loserRank = rankByPlayer.get(loserId);
    if (winnerRank != null && loserRank != null) {
      const gap = winnerRank - loserRank;
      if (gap >= 4) {
        giantSlayer.set(winnerId, (giantSlayer.get(winnerId) || 0) + 1);
      }
      if (gap > 0 && (!whoopsie || gap > whoopsie.gap)) {
        whoopsie = { winnerId, gap };
      }
    }
  }

  const makeWinner = (id: string | null, value: number, detail?: string): BadgeWinner | null => {
    if (!id) return null;
    const p = playerById.get(id);
    if (!p) return null;
    return { player: summary(p), value, detail };
  };

  const awards: BadgeAward[] = [];

  const leader = leaderboard[0];
  awards.push({
    key: 'iron_fist',
    name: 'Iron Fist Crown',
    description: 'League leader',
    winner: leader && leader.matchesPlayed > 0
      ? { player: summary(leader.player), value: 1, detail: `${leader.winPercentage}% wins` }
      : null,
  });

  const rage = [...leaderboard].sort((x, y) => y.bonusPoints - x.bonusPoints)[0];
  awards.push({
    key: 'rage_driver',
    name: 'Rage Driver',
    description: 'Most bonus points',
    winner: rage && rage.bonusPoints > 0
      ? { player: summary(rage.player), value: rage.bonusPoints, detail: `+${rage.bonusPoints} bonus` }
      : null,
  });

  const perf = [...leaderboard].sort((x, y) => y.perfectRounds - x.perfectRounds)[0];
  awards.push({
    key: 'prefectionist',
    name: 'Prefectionist',
    description: 'Most perfects',
    winner: perf && perf.perfectRounds > 0
      ? { player: summary(perf.player), value: perf.perfectRounds, detail: `${perf.perfectRounds} perfects` }
      : null,
  });

  const fast = [...leaderboard].sort((x, y) => y.fastWins - x.fastWins)[0];
  awards.push({
    key: 'speed_runner',
    name: 'Speed Runner',
    description: 'Most fast wins',
    winner: fast && fast.fastWins > 0
      ? { player: summary(fast.player), value: fast.fastWins, detail: `${fast.fastWins} fast wins` }
      : null,
  });

  awards.push({
    key: 'king_slayer',
    name: 'King Slayer',
    description: 'Beat the league leader',
    winner: latestKingSlayer ? makeWinner(latestKingSlayer.winnerId, 1, 'Latest to beat #1') : null,
  });

  const ironCandidates = leaderboard
    .filter((r) => r.matchesPlayed > 0 && r.gamesLost === 0)
    .sort((x, y) => y.matchesPlayed - x.matchesPlayed);
  const iron = ironCandidates[0];
  awards.push({
    key: 'iron_wall',
    name: 'Iron Wall',
    description: 'Never lost a round',
    winner: iron
      ? { player: summary(iron.player), value: iron.matchesPlayed, detail: `${iron.gamesWon}–0 across ${iron.matchesPlayed} matches` }
      : null,
  });

  let streakId: string | null = null;
  let streakVal = 0;
  streakBest.forEach((v, id) => {
    if (v > streakVal) { streakVal = v; streakId = id; }
  });
  awards.push({
    key: 'streakmaster',
    name: 'Streakmaster',
    description: '5+ wins in a row',
    winner: streakId && streakVal >= 5
      ? makeWinner(streakId, streakVal, `${streakVal}-match streak`)
      : null,
  });

  const gs = topByMap(giantSlayer);
  awards.push({
    key: 'giant_slayer',
    name: 'Giant Slayer',
    description: 'Beat someone 4+ spots above',
    winner: gs ? makeWinner(gs.id, gs.value, `${gs.value} upset${gs.value === 1 ? '' : 's'}`) : null,
  });

  const dq = topByMap(drama);
  awards.push({
    key: 'drama_queen',
    name: 'Drama Queen',
    description: 'Most matches that went to game 3',
    winner: dq ? makeWinner(dq.id, dq.value, `${dq.value} 2–1 matches`) : null,
  });

  const ph = topByMap(philosopher);
  awards.push({
    key: 'philosopher',
    name: 'Philosopher',
    description: 'Most 2–1 wins',
    winner: ph ? makeWinner(ph.id, ph.value, `${ph.value} clutch wins`) : null,
  });

  const bl = topByMap(bully);
  awards.push({
    key: 'the_bully',
    name: 'The Bully',
    description: 'Most 2–0 sweeps',
    winner: bl ? makeWinner(bl.id, bl.value, `${bl.value} sweeps`) : null,
  });

  awards.push({
    key: 'whoopsie',
    name: 'Whoopsie',
    description: 'Biggest spot-gap upset',
    winner: whoopsie
      ? makeWinner(whoopsie.winnerId, whoopsie.gap, `+${whoopsie.gap} spots`)
      : null,
  });

  const enduranceRow = [...leaderboard].sort(
    (x, y) => y.gamesWon + y.gamesLost - (x.gamesWon + x.gamesLost),
  )[0];
  const endVal = enduranceRow ? enduranceRow.gamesWon + enduranceRow.gamesLost : 0;
  awards.push({
    key: 'endurance_pro',
    name: 'Endurance Pro',
    description: 'Most rounds played',
    winner: enduranceRow && endVal > 0
      ? { player: summary(enduranceRow.player), value: endVal, detail: `${endVal} rounds` }
      : null,
  });

  const dn = topByMap(donator);
  awards.push({
    key: 'the_donator',
    name: 'The Donator',
    description: 'Fed the most bonus to opponents',
    winner: dn ? makeWinner(dn.id, dn.value, `${dn.value} pts donated`) : null,
  });

  return awards;
}
