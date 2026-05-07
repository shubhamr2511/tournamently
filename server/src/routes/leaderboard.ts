import { Router } from 'express';
import { Tournament } from '../models/Tournament';
import { Player } from '../models/Player';
import { Match } from '../models/Match';
import { LeaderboardSnapshot } from '../models/LeaderboardSnapshot';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { computeLeaderboard } from '../services/leaderboardCalculator';
import { requireAuth, requireTournamentAdmin } from '../middleware/auth';

export const leaderboardRouter = Router({ mergeParams: true });

leaderboardRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const tid = req.params.tid;
    const t = await Tournament.findById(tid);
    if (!t) throw new AppError('Tournament not found', 404);
    const [players, matches, lastSnapshot] = await Promise.all([
      Player.find({ tournament: tid, isActive: true }),
      Match.find({ tournament: tid, status: 'completed' }),
      LeaderboardSnapshot.findOne({ tournament: tid }).sort({
        capturedAt: -1,
      }),
    ]);
    const rows = computeLeaderboard(t, players, matches);
    const prevByPlayer = new Map<string, number>();
    if (lastSnapshot) {
      for (const r of lastSnapshot.rows) {
        prevByPlayer.set(String(r.player), r.rank);
      }
    }
    const decorated = rows.map((r) => {
      const prev = prevByPlayer.get(String(r.player._id));
      return {
        ...r,
        previousRank: prev ?? null,
        rankDelta: prev != null ? prev - r.rank : null,
      };
    });
    res.json({
      rows: decorated,
      snapshotCapturedAt: lastSnapshot?.capturedAt ?? null,
    });
  }),
);

leaderboardRouter.get(
  '/snapshots',
  asyncHandler(async (req, res) => {
    const tid = req.params.tid;
    const list = await LeaderboardSnapshot.find({ tournament: tid })
      .sort({ capturedAt: -1 })
      .select('capturedAt createdAt');
    res.json(list);
  }),
);

leaderboardRouter.post(
  '/snapshot',
  requireAuth,
  requireTournamentAdmin,
  asyncHandler(async (req, res) => {
    const tid = req.params.tid;
    const t = await Tournament.findById(tid);
    if (!t) throw new AppError('Tournament not found', 404);
    const [players, matches] = await Promise.all([
      Player.find({ tournament: tid, isActive: true }),
      Match.find({ tournament: tid, status: 'completed' }),
    ]);
    const rows = computeLeaderboard(t, players, matches);
    if (rows.length === 0) {
      throw new AppError('No standings to record yet', 400);
    }
    const snap = await LeaderboardSnapshot.create({
      tournament: tid,
      capturedAt: new Date(),
      rows: rows.map((r) => ({
        player: r.player._id,
        rank: r.rank,
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
      })),
    });
    res.status(201).json({
      _id: snap._id,
      capturedAt: snap.capturedAt,
      playerCount: snap.rows.length,
    });
  }),
);
