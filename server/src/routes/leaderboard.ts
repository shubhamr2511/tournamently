import { Router } from 'express';
import { Tournament } from '../models/Tournament';
import { Player } from '../models/Player';
import { Match } from '../models/Match';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { computeLeaderboard } from '../services/leaderboardCalculator';

export const leaderboardRouter = Router({ mergeParams: true });

leaderboardRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const tid = req.params.tid;
    const t = await Tournament.findById(tid);
    if (!t) throw new AppError('Tournament not found', 404);
    const [players, matches] = await Promise.all([
      Player.find({ tournament: tid, isActive: true }),
      Match.find({ tournament: tid, status: 'completed' }),
    ]);
    const rows = computeLeaderboard(t, players, matches);
    res.json(rows);
  }),
);
