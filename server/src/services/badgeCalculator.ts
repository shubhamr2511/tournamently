import { IPlayerDoc } from '../models/Player';
import { IMatchDoc } from '../models/Match';
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
  winners: BadgeWinner[];
}

function summary(p: IPlayerDoc): BadgePlayerSummary {
  return {
    _id: String(p._id),
    gamerTag: p.gamerTag,
    name: p.name,
    character: p.character,
  };
}

function topWinner(
  map: Map<string, number>,
  playerById: Map<string, IPlayerDoc>,
  detailFn: (v: number) => string,
): BadgeWinner[] {
  let bestVal = 0;
  map.forEach((v) => {
    if (v > bestVal) bestVal = v;
  });
  if (bestVal <= 0) return [];
  const winners: BadgeWinner[] = [];
  map.forEach((v, id) => {
    if (v !== bestVal) return;
    const p = playerById.get(id);
    if (p) winners.push({ player: summary(p), value: v, detail: detailFn(v) });
  });
  winners.sort((a, b) => a.player.gamerTag.localeCompare(b.player.gamerTag));
  return winners;
}

function allQualifyingWinners(
  map: Map<string, number>,
  playerById: Map<string, IPlayerDoc>,
  threshold: number,
  detailFn: (v: number) => string,
): BadgeWinner[] {
  const winners: BadgeWinner[] = [];
  map.forEach((v, id) => {
    if (v < threshold) return;
    const p = playerById.get(id);
    if (p) winners.push({ player: summary(p), value: v, detail: detailFn(v) });
  });
  winners.sort(
    (a, b) => b.value - a.value || a.player.gamerTag.localeCompare(b.player.gamerTag),
  );
  return winners;
}

export function computeBadges(
  leaderboard: LeaderboardRow[],
  players: IPlayerDoc[],
  matches: IMatchDoc[],
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
  const kingSlayer = new Map<string, number>();
  const giantSlayer = new Map<string, number>();
  const streakBest = new Map<string, number>();
  const streakNow = new Map<string, number>();

  let whoopsieGap = 0;
  const whoopsieWinnerIds = new Map<string, number>();

  const rank1Id = leaderboard[0] ? String(leaderboard[0].player._id) : null;

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

    if (rank1Id && winnerId !== rank1Id && loserId === rank1Id) {
      kingSlayer.set(winnerId, (kingSlayer.get(winnerId) || 0) + 1);
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
      if (gap > 0) {
        if (gap > whoopsieGap) {
          whoopsieGap = gap;
          whoopsieWinnerIds.clear();
          whoopsieWinnerIds.set(winnerId, gap);
        } else if (gap === whoopsieGap) {
          whoopsieWinnerIds.set(winnerId, gap);
        }
      }
    }
  }

  const awards: BadgeAward[] = [];

  const leader = leaderboard[0];
  awards.push({
    key: 'iron_fist',
    name: 'Iron Fist Crown',
    description: 'League leader',
    winners: leader && leader.matchesPlayed > 0
      ? [{ player: summary(leader.player), value: 1, detail: `${leader.winPercentage}% wins` }]
      : [],
  });

  awards.push({
    key: 'rage_driver',
    name: 'Rage Driver',
    description: 'Most bonus points',
    winners: topWinner(
      new Map(leaderboard.filter((r) => r.bonusPoints > 0).map((r) => [String(r.player._id), r.bonusPoints])),
      playerById,
      (v) => `+${v} bonus`,
    ),
  });

  awards.push({
    key: 'prefectionist',
    name: 'Prefectionist',
    description: 'Most perfects',
    winners: topWinner(
      new Map(leaderboard.filter((r) => r.perfectRounds > 0).map((r) => [String(r.player._id), r.perfectRounds])),
      playerById,
      (v) => `${v} perfect${v === 1 ? '' : 's'}`,
    ),
  });

  awards.push({
    key: 'speed_runner',
    name: 'Speed Runner',
    description: 'Most fast wins',
    winners: topWinner(
      new Map(leaderboard.filter((r) => r.fastWins > 0).map((r) => [String(r.player._id), r.fastWins])),
      playerById,
      (v) => `${v} fast win${v === 1 ? '' : 's'}`,
    ),
  });

  awards.push({
    key: 'king_slayer',
    name: 'King Slayer',
    description: 'Beat the league leader',
    winners: allQualifyingWinners(
      kingSlayer,
      playerById,
      1,
      (v) => `${v} win${v === 1 ? '' : 's'} vs #1`,
    ),
  });

  awards.push({
    key: 'iron_wall',
    name: 'Iron Wall',
    description: 'Never lost a round',
    winners: leaderboard
      .filter((r) => r.matchesPlayed > 0 && r.gamesLost === 0)
      .sort((x, y) => y.matchesPlayed - x.matchesPlayed || x.player.gamerTag.localeCompare(y.player.gamerTag))
      .map((r) => ({
        player: summary(r.player),
        value: r.matchesPlayed,
        detail: `${r.gamesWon}–0 across ${r.matchesPlayed} match${r.matchesPlayed === 1 ? '' : 'es'}`,
      })),
  });

  awards.push({
    key: 'streakmaster',
    name: 'Streakmaster',
    description: '5+ wins in a row',
    winners: allQualifyingWinners(
      streakBest,
      playerById,
      5,
      (v) => `${v}-match streak`,
    ),
  });

  awards.push({
    key: 'giant_slayer',
    name: 'Giant Slayer',
    description: 'Beat someone 4+ spots above',
    winners: allQualifyingWinners(
      giantSlayer,
      playerById,
      1,
      (v) => `${v} upset${v === 1 ? '' : 's'}`,
    ),
  });

  awards.push({
    key: 'drama_queen',
    name: 'Drama Queen',
    description: 'Most matches that went to game 3',
    winners: topWinner(drama, playerById, (v) => `${v} 2–1 matches`),
  });

  awards.push({
    key: 'philosopher',
    name: 'Philosopher',
    description: 'Most 2–1 wins',
    winners: topWinner(philosopher, playerById, (v) => `${v} clutch wins`),
  });

  awards.push({
    key: 'the_bully',
    name: 'The Bully',
    description: 'Most 2–0 sweeps',
    winners: topWinner(bully, playerById, (v) => `${v} sweeps`),
  });

  const whoopsieWinners: BadgeWinner[] = [];
  whoopsieWinnerIds.forEach((gap, id) => {
    const p = playerById.get(id);
    if (p) whoopsieWinners.push({ player: summary(p), value: gap, detail: `+${gap} spots` });
  });
  whoopsieWinners.sort((a, b) => a.player.gamerTag.localeCompare(b.player.gamerTag));
  awards.push({
    key: 'whoopsie',
    name: 'Whoopsie',
    description: 'Biggest spot-gap upset',
    winners: whoopsieWinners,
  });

  awards.push({
    key: 'endurance_pro',
    name: 'Endurance Pro',
    description: 'Most rounds played',
    winners: topWinner(
      new Map(
        leaderboard
          .filter((r) => r.gamesWon + r.gamesLost > 0)
          .map((r) => [String(r.player._id), r.gamesWon + r.gamesLost]),
      ),
      playerById,
      (v) => `${v} rounds`,
    ),
  });

  awards.push({
    key: 'the_donator',
    name: 'The Donator',
    description: 'Fed the most bonus to opponents',
    winners: topWinner(donator, playerById, (v) => `${v} pts donated`),
  });

  return awards;
}
