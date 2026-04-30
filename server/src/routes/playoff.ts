import { Router } from 'express';
import { Tournament } from '../models/Tournament';
import { Player } from '../models/Player';
import { Match } from '../models/Match';
import { PlayoffMatch } from '../models/PlayoffMatch';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { requireAuth, requireTournamentAdmin } from '../middleware/auth';
import { computeLeaderboard } from '../services/leaderboardCalculator';
import { buildBracket } from '../services/playoffBracket';
import { evaluateStreak } from '../services/streakMode';
import { Types } from 'mongoose';

export const playoffRouter = Router({ mergeParams: true });

playoffRouter.post(
  '/create',
  requireAuth,
  requireTournamentAdmin,
  asyncHandler(async (req, res) => {
    const tid = req.params.tid;
    const t = await Tournament.findById(tid);
    if (!t) throw new AppError('Tournament not found', 404);

    const {
      format = 'normal',
      size = 8,
      matchFormat = 'BO5',
      streakTarget = 3,
      maxGameCap,
      seeds,
    } = req.body || {};

    if ((size & (size - 1)) !== 0) {
      throw new AppError('Bracket size must be a power of 2', 400);
    }
    if (format !== 'normal' && format !== 'streak') {
      throw new AppError('Invalid format', 400);
    }
    if (format === 'streak' && streakTarget < 2) {
      throw new AppError('streakTarget must be >= 2', 400);
    }

    let seeded: { playerId: string; seed: number }[];
    if (Array.isArray(seeds) && seeds.length === size) {
      seeded = seeds.map((s: any, i: number) => ({
        playerId: String(s.playerId),
        seed: s.seed ?? i + 1,
      }));
    } else {
      const [players, matches] = await Promise.all([
        Player.find({ tournament: tid, isActive: true }),
        Match.find({ tournament: tid, status: 'completed' }),
      ]);
      const board = computeLeaderboard(t, players, matches);
      if (board.length < size) {
        throw new AppError(
          `Not enough players for size-${size} bracket`,
          400,
        );
      }
      seeded = board
        .slice(0, size)
        .map((row) => ({ playerId: String(row.player._id), seed: row.rank }));
    }

    await PlayoffMatch.deleteMany({ tournament: tid });
    const bracket = buildBracket(seeded);

    const created = await PlayoffMatch.insertMany(
      bracket.map((m) => ({
        tournament: t._id,
        round: m.round,
        matchNumber: m.matchNumber,
        playerA: m.playerA ? new Types.ObjectId(m.playerA) : undefined,
        playerB: m.playerB ? new Types.ObjectId(m.playerB) : undefined,
        seedA: m.seedA,
        seedB: m.seedB,
        mode: format,
        status: 'pending',
      })),
    );

    for (let i = 0; i < bracket.length; i++) {
      const node = bracket[i];
      if (node.feederMatchAIndex == null) continue;
      created[i].feederMatchA = created[node.feederMatchAIndex]._id;
      created[i].feederMatchB = created[node.feederMatchBIndex!]._id;
      await created[i].save();
    }

    t.playoff = {
      format,
      size,
      matchFormat,
      streakTarget: format === 'streak' ? streakTarget : undefined,
      maxGameCap,
      createdAt: new Date(),
    };
    t.status = 'playoffs';
    await t.save();

    res.status(201).json({ created: created.length });
  }),
);

playoffRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const tid = req.params.tid;
    const matches = await PlayoffMatch.find({ tournament: tid })
      .populate('playerA playerB')
      .sort({ round: 1, matchNumber: 1 });
    res.json(matches);
  }),
);

async function advanceWinner(matchId: Types.ObjectId, winnerId: Types.ObjectId) {
  const next = await PlayoffMatch.findOne({
    $or: [{ feederMatchA: matchId }, { feederMatchB: matchId }],
  });
  if (!next) return;
  if (next.feederMatchA?.equals(matchId)) next.playerA = winnerId;
  if (next.feederMatchB?.equals(matchId)) next.playerB = winnerId;
  await next.save();
}

playoffRouter.put(
  '/:mid/result',
  requireAuth,
  requireTournamentAdmin,
  asyncHandler(async (req, res) => {
    const m = await PlayoffMatch.findOne({
      _id: req.params.mid,
      tournament: req.params.tid,
    });
    if (!m) throw new AppError('Playoff match not found', 404);
    if (m.mode !== 'normal') {
      throw new AppError('This match is in streak mode', 400);
    }
    const { winner, score, games } = req.body || {};
    if (!winner || !score)
      throw new AppError('winner and score required', 400);
    if (
      String(winner) !== String(m.playerA) &&
      String(winner) !== String(m.playerB)
    ) {
      throw new AppError('Winner must be one of the players', 400);
    }
    m.normalResult = {
      winner: new Types.ObjectId(String(winner)),
      score,
      games: Array.isArray(games)
        ? games.map((g: any) => ({
            gameNumber: g.gameNumber,
            winner: new Types.ObjectId(String(g.winner)),
            perfectRound: !!g.perfectRound,
            fastWin: !!g.fastWin,
          }))
        : [],
    };
    m.status = 'completed';
    m.completedAt = new Date();
    await m.save();
    await advanceWinner(m._id, m.normalResult.winner);
    res.json(m);
  }),
);

playoffRouter.put(
  '/:mid/streak-game',
  requireAuth,
  requireTournamentAdmin,
  asyncHandler(async (req, res) => {
    const tid = req.params.tid;
    const t = await Tournament.findById(tid);
    if (!t) throw new AppError('Tournament not found', 404);
    const m = await PlayoffMatch.findOne({
      _id: req.params.mid,
      tournament: tid,
    });
    if (!m) throw new AppError('Playoff match not found', 404);
    if (m.mode !== 'streak') {
      throw new AppError('This match is not in streak mode', 400);
    }
    if (m.status === 'completed') {
      throw new AppError('Match already completed', 409);
    }
    if (!m.playerA || !m.playerB) {
      throw new AppError('Players not yet set for this match', 400);
    }
    const { winner } = req.body || {};
    if (!winner) throw new AppError('winner required', 400);
    if (
      String(winner) !== String(m.playerA) &&
      String(winner) !== String(m.playerB)
    ) {
      throw new AppError('Winner must be one of the players', 400);
    }

    const seq = [
      ...(m.streakResult?.sequence || []),
      new Types.ObjectId(String(winner)),
    ];
    const target = t.playoff?.streakTarget ?? 3;
    const evalRes = evaluateStreak({
      sequence: seq.map((s) => String(s)),
      playerAId: String(m.playerA),
      playerBId: String(m.playerB),
      target,
      maxGameCap: t.playoff?.maxGameCap,
    });

    m.streakResult = {
      winner: evalRes.winner ? new Types.ObjectId(evalRes.winner) : undefined,
      sequence: seq,
      finalStreakA: evalRes.finalStreakA,
      finalStreakB: evalRes.finalStreakB,
      totalGames: evalRes.totalGames,
    };
    if (evalRes.winner) {
      m.status = 'completed';
      m.completedAt = new Date();
    } else {
      m.status = 'in_progress';
    }
    await m.save();
    if (evalRes.winner) {
      await advanceWinner(m._id, new Types.ObjectId(evalRes.winner));
    }
    res.json(m);
  }),
);
