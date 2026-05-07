import { Router } from 'express';
import { Tournament } from '../models/Tournament';
import { Player } from '../models/Player';
import { Match } from '../models/Match';
import { PlayoffMatch } from '../models/PlayoffMatch';
import { LeaderboardSnapshot } from '../models/LeaderboardSnapshot';
import { computeLeaderboard } from '../services/leaderboardCalculator';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { parseBody, playerInputSchema } from '../utils/validation';

export const publicRouter = Router();

publicRouter.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const t = await Tournament.findOne({ slug: req.params.slug });
    if (!t) throw new AppError('Tournament not found', 404);

    const tid = t._id;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const [
      players,
      allMatches,
      todayMatches,
      recentResults,
      upcomingMatches,
      featuredMatches,
      playoffs,
      lastSnapshot,
    ] = await Promise.all([
      Player.find({ tournament: tid, isActive: true }),
      Match.find({ tournament: tid }),
      Match.find({
        tournament: tid,
        scheduledDate: { $gte: today, $lt: tomorrow },
      })
        .populate('playerA playerB')
        .sort({ matchNumber: 1 }),
      Match.find({ tournament: tid, status: 'completed' })
        .populate('playerA playerB')
        .sort({ 'result.completedAt': -1 })
        .limit(10),
      Match.find({
        tournament: tid,
        status: 'scheduled',
        scheduledDate: { $gte: today },
      })
        .populate('playerA playerB')
        .sort({ scheduledDate: 1, matchNumber: 1 })
        .limit(30),
      Match.find({
        tournament: tid,
        status: 'completed',
        'result.isFeatured': true,
      })
        .populate('playerA playerB')
        .sort({ 'result.completedAt': -1 })
        .limit(6),
      PlayoffMatch.find({ tournament: tid })
        .populate('playerA playerB')
        .sort({ round: 1, matchNumber: 1 }),
      LeaderboardSnapshot.findOne({ tournament: tid }).sort({
        capturedAt: -1,
      }),
    ]);

    const completedAll = allMatches.filter((m) => m.status === 'completed');
    const baseLeaderboard = computeLeaderboard(t, players, completedAll);
    const prevByPlayer = new Map<string, number>();
    if (lastSnapshot) {
      for (const r of lastSnapshot.rows) {
        prevByPlayer.set(String(r.player), r.rank);
      }
    }
    const leaderboard = baseLeaderboard.map((r) => {
      const prev = prevByPlayer.get(String(r.player._id));
      return {
        ...r,
        previousRank: prev ?? null,
        rankDelta: prev != null ? prev - r.rank : null,
      };
    });

    const tournamentObj = t.toObject() as unknown as Record<string, unknown>;
    delete tournamentObj.adminPassword;

    res.json({
      tournament: tournamentObj,
      leaderboard,
      snapshotCapturedAt: lastSnapshot?.capturedAt ?? null,
      todayMatches,
      recentResults,
      upcomingMatches,
      featuredMatches,
      playoffs: playoffs.length > 0 ? playoffs : null,
      stats: {
        totalMatches: allMatches.length,
        completedMatches: completedAll.length,
        playersCount: players.length,
      },
    });
  }),
);

publicRouter.get(
  '/:slug/standings-history',
  asyncHandler(async (req, res) => {
    const t = await Tournament.findOne({ slug: req.params.slug });
    if (!t) throw new AppError('Tournament not found', 404);
    const snapshots = await LeaderboardSnapshot.find({ tournament: t._id })
      .sort({ capturedAt: 1 })
      .populate({
        path: 'rows.player',
        select: 'gamerTag name character isActive',
      });
    const payload = snapshots.map((s) => ({
      _id: String(s._id),
      capturedAt: s.capturedAt,
      rows: s.rows
        .filter((r) => r.player && typeof r.player === 'object')
        .map((r) => {
          const p = r.player as unknown as {
            _id: unknown;
            gamerTag: string;
            name: string;
            character?: string;
          };
          return {
            player: {
              _id: String(p._id),
              gamerTag: p.gamerTag,
              name: p.name,
              character: p.character,
            },
            rank: r.rank,
            matchesPlayed: r.matchesPlayed,
            wins: r.wins,
            losses: r.losses,
            bonusPoints: r.bonusPoints,
            winPercentage: r.winPercentage,
          };
        }),
    }));
    res.json({ snapshots: payload });
  }),
);

publicRouter.post(
  '/:slug/register',
  asyncHandler(async (req, res) => {
    const t = await Tournament.findOne({ slug: req.params.slug });
    if (!t) throw new AppError('Tournament not found', 404);
    if (t.fixturesGenerated) {
      throw new AppError(
        'Registration is closed: fixtures have already been generated.',
        409,
      );
    }
    const body = parseBody(playerInputSchema, req.body);
    try {
      const player = await Player.create({ ...body, tournament: t._id });
      res.status(201).json({
        _id: player._id,
        name: player.name,
        gamerTag: player.gamerTag,
      });
    } catch (err) {
      if ((err as { code?: number })?.code === 11000) {
        throw new AppError(
          'That gamer tag is already taken in this tournament.',
          409,
        );
      }
      throw err;
    }
  }),
);
