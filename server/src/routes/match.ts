import { Router } from 'express';
import { Match } from '../models/Match';
import { Tournament } from '../models/Tournament';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { requireAuth, requireTournamentAdmin } from '../middleware/auth';
import { matchResultSchema, parseBody } from '../utils/validation';
import { calculateBonusPoints } from '../services/leaderboardCalculator';

export const matchRouter = Router({ mergeParams: true });

async function applyResult(matchId: string, tid: string, body: unknown) {
  const t = await Tournament.findById(tid);
  if (!t) throw new AppError('Tournament not found', 404);
  const m = await Match.findOne({ _id: matchId, tournament: tid });
  if (!m) throw new AppError('Match not found', 404);

  const data = parseBody(matchResultSchema, body);
  const aId = String(m.playerA);
  const bId = String(m.playerB);
  const winnerId = String(data.winner);
  if (winnerId !== aId && winnerId !== bId) {
    throw new AppError('Winner must be one of the match players', 400);
  }
  const loserId = winnerId === aId ? bId : aId;

  const winnerWins = data.games.filter(
    (g) => String(g.winner) === winnerId,
  ).length;
  const loserWins = data.games.filter(
    (g) => String(g.winner) === loserId,
  ).length;
  if (winnerWins <= loserWins) {
    throw new AppError(
      'Winner must have won more games than the loser in the games list',
      400,
    );
  }
  const expected = `${winnerWins}-${loserWins}`;
  if (data.score !== expected) {
    throw new AppError(
      `Score "${data.score}" inconsistent with games list ("${expected}")`,
      400,
    );
  }
  for (const g of data.games) {
    const w = String(g.winner);
    if (w !== aId && w !== bId) {
      throw new AppError(
        `Game ${g.gameNumber} winner is not in this match`,
        400,
      );
    }
  }

  const aPerfect = data.playerAStats?.perfectRounds ?? 0;
  const aFast = data.playerAStats?.fastWins ?? 0;
  const bPerfect = data.playerBStats?.perfectRounds ?? 0;
  const bFast = data.playerBStats?.fastWins ?? 0;
  const aBonus = calculateBonusPoints(
    aPerfect,
    aFast,
    t.scoring.perfectRoundBonus,
    t.scoring.fastWinBonus,
  );
  const bBonus = calculateBonusPoints(
    bPerfect,
    bFast,
    t.scoring.perfectRoundBonus,
    t.scoring.fastWinBonus,
  );

  m.result = {
    winner: m.playerA.equals(winnerId) ? m.playerA : m.playerB,
    loser: m.playerA.equals(loserId) ? m.playerA : m.playerB,
    score: data.score,
    games: data.games.map((g) => ({
      gameNumber: g.gameNumber,
      winner: m.playerA.equals(g.winner) ? m.playerA : m.playerB,
      perfectRound: g.perfectRound,
      fastWin: g.fastWin,
    })),
    playerAStats: {
      perfectRounds: aPerfect,
      fastWins: aFast,
      bonusPoints: aBonus,
    },
    playerBStats: {
      perfectRounds: bPerfect,
      fastWins: bFast,
      bonusPoints: bBonus,
    },
    notes: data.notes,
    isFeatured: !!data.isFeatured,
    isUpset: !!data.isUpset,
    completedAt: new Date(),
  };
  m.status = 'completed';
  await m.save();
  return m;
}

matchRouter.put(
  '/:mid/result',
  requireAuth,
  requireTournamentAdmin,
  asyncHandler(async (req, res) => {
    const m = await applyResult(req.params.mid, req.params.tid, req.body);
    res.json(m);
  }),
);

matchRouter.put(
  '/:mid/result/edit',
  requireAuth,
  requireTournamentAdmin,
  asyncHandler(async (req, res) => {
    const m = await applyResult(req.params.mid, req.params.tid, req.body);
    res.json(m);
  }),
);

matchRouter.delete(
  '/:mid/result',
  requireAuth,
  requireTournamentAdmin,
  asyncHandler(async (req, res) => {
    const m = await Match.findOne({
      _id: req.params.mid,
      tournament: req.params.tid,
    });
    if (!m) throw new AppError('Match not found', 404);
    m.result = undefined;
    m.status = 'scheduled';
    await m.save();
    res.json(m);
  }),
);

matchRouter.get(
  '/:mid',
  asyncHandler(async (req, res) => {
    const m = await Match.findOne({
      _id: req.params.mid,
      tournament: req.params.tid,
    }).populate('playerA playerB');
    if (!m) throw new AppError('Match not found', 404);
    res.json(m);
  }),
);
