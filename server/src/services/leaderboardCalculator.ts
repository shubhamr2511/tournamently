import { Types } from 'mongoose';
import { IPlayerDoc } from '../models/Player';
import { IMatchDoc } from '../models/Match';
import { ITournamentDoc } from '../models/Tournament';

export interface LeaderboardRow {
  rank: number;
  player: IPlayerDoc;
  matchesPlayed: number;
  wins: number;
  losses: number;
  bonusPoints: number;
  perfectRounds: number;
  fastWins: number;
  gamesWon: number;
  gamesLost: number;
  gameDiff: number;
  winPercentage: number;
}

interface Acc {
  matchesPlayed: number;
  wins: number;
  losses: number;
  bonusPoints: number;
  perfectRounds: number;
  fastWins: number;
  gamesWon: number;
  gamesLost: number;
  /** Map of opponent id → 'win' | 'loss' (most recent counts) */
  h2h: Record<string, 'win' | 'loss'>;
}

const empty = (): Acc => ({
  matchesPlayed: 0,
  wins: 0,
  losses: 0,
  bonusPoints: 0,
  perfectRounds: 0,
  fastWins: 0,
  gamesWon: 0,
  gamesLost: 0,
  h2h: {},
});

export function computeLeaderboard(
  tournament: ITournamentDoc,
  players: IPlayerDoc[],
  matches: IMatchDoc[],
): LeaderboardRow[] {
  const acc = new Map<string, Acc>();
  for (const p of players) acc.set(String(p._id), empty());

  const perfectBonus = tournament.scoring?.perfectRoundBonus ?? 1;
  const fastWinBonus = tournament.scoring?.fastWinBonus ?? 1;

  for (const m of matches) {
    if (m.status !== 'completed' || !m.result) continue;
    const aId = String(m.playerA);
    const bId = String(m.playerB);
    const winnerId = String(m.result.winner);
    const aAcc = acc.get(aId);
    const bAcc = acc.get(bId);
    if (!aAcc || !bAcc) continue;

    aAcc.matchesPlayed++;
    bAcc.matchesPlayed++;

    if (winnerId === aId) {
      aAcc.wins++;
      bAcc.losses++;
      aAcc.h2h[bId] = 'win';
      bAcc.h2h[aId] = 'loss';
    } else {
      bAcc.wins++;
      aAcc.losses++;
      bAcc.h2h[aId] = 'win';
      aAcc.h2h[bId] = 'loss';
    }

    const aPerfect = m.result.playerAStats?.perfectRounds || 0;
    const bPerfect = m.result.playerBStats?.perfectRounds || 0;
    const aFastWins = m.result.playerAStats?.fastWins || 0;
    const bFastWins = m.result.playerBStats?.fastWins || 0;

    // Each perfect round suffered penalises the loser by the same amount the
    // winner is rewarded — keeps the +X / -X invariant the user defined.
    // Same logic applies to fast wins — conceding a fast win costs -X points.
    aAcc.bonusPoints +=
      (m.result.playerAStats?.bonusPoints || 0) -
      bPerfect * perfectBonus -
      bFastWins * fastWinBonus;
    bAcc.bonusPoints +=
      (m.result.playerBStats?.bonusPoints || 0) -
      aPerfect * perfectBonus -
      aFastWins * fastWinBonus;
    aAcc.perfectRounds += aPerfect;
    bAcc.perfectRounds += bPerfect;
    aAcc.fastWins += aFastWins;
    bAcc.fastWins += bFastWins;

    let gamesA = 0;
    let gamesB = 0;
    for (const g of m.result.games || []) {
      if (String(g.winner) === aId) gamesA++;
      else if (String(g.winner) === bId) gamesB++;
    }
    aAcc.gamesWon += gamesA;
    aAcc.gamesLost += gamesB;
    bAcc.gamesWon += gamesB;
    bAcc.gamesLost += gamesA;
  }

  const rows = players.map((p) => {
    const a = acc.get(String(p._id))!;
    const gameDiff = a.gamesWon - a.gamesLost;
    const winPercentage =
      a.matchesPlayed === 0 ? 0 : (a.wins / a.matchesPlayed) * 100;
    return {
      player: p,
      ...a,
      gameDiff,
      winPercentage: Math.round(winPercentage * 10) / 10,
    };
  });

  const tiebreakers = tournament.ranking?.tiebreakers || [
    'bonus_points',
    'head_to_head',
    'game_diff',
    'perfects',
    'fast_wins',
  ];

  rows.sort((x, y) => {
    if (y.winPercentage !== x.winPercentage)
      return y.winPercentage - x.winPercentage;
    for (const tb of tiebreakers) {
      switch (tb) {
        case 'bonus_points':
          if (y.bonusPoints !== x.bonusPoints)
            return y.bonusPoints - x.bonusPoints;
          break;
        case 'head_to_head': {
          const a = x.h2h[String(y.player._id)];
          if (a === 'win') return -1;
          if (a === 'loss') return 1;
          break;
        }
        case 'game_diff':
          if (y.gameDiff !== x.gameDiff) return y.gameDiff - x.gameDiff;
          break;
        case 'perfects':
          if (y.perfectRounds !== x.perfectRounds)
            return y.perfectRounds - x.perfectRounds;
          break;
        case 'fast_wins':
          if (y.fastWins !== x.fastWins) return y.fastWins - x.fastWins;
          break;
      }
    }
    return x.player.gamerTag.localeCompare(y.player.gamerTag);
  });

  let rank = 1;
  return rows.map((r, idx) => {
    if (idx > 0) {
      const prev = rows[idx - 1];
      const sameRank =
        prev.winPercentage === r.winPercentage &&
        prev.bonusPoints === r.bonusPoints &&
        prev.gameDiff === r.gameDiff &&
        prev.perfectRounds === r.perfectRounds &&
        prev.fastWins === r.fastWins;
      if (!sameRank) rank = idx + 1;
    }
    return {
      rank,
      player: r.player,
      matchesPlayed: r.matchesPlayed,
      wins: r.wins,
      losses: r.losses,
      bonusPoints: r.bonusPoints,
      perfectRounds: r.perfectRounds,
      fastWins: r.fastWins,
      gamesWon: r.gamesWon,
      gamesLost: r.gamesLost,
      gameDiff: r.gameDiff,
      winPercentage: r.winPercentage,
    };
  });
}

export function calculateBonusPoints(
  perfectRounds: number,
  fastWins: number,
  perfectRoundBonus: number,
  fastWinBonus: number,
): number {
  return perfectRounds * perfectRoundBonus + fastWins * fastWinBonus;
}

export function _typeguard(_id: Types.ObjectId): void {
  // keep import warm
}
