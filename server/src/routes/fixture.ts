import { Router } from 'express';
import { Tournament } from '../models/Tournament';
import { Player } from '../models/Player';
import { Match } from '../models/Match';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { requireAuth, requireTournamentAdmin } from '../middleware/auth';
import { generateRoundRobin } from '../services/fixtureGenerator';
import { distributeFixturesAcrossDates } from '../services/scheduler';

export const fixtureRouter = Router({ mergeParams: true });

fixtureRouter.post(
  '/generate',
  requireAuth,
  requireTournamentAdmin,
  asyncHandler(async (req, res) => {
    const tid = req.params.tid;
    const t = await Tournament.findById(tid);
    if (!t) throw new AppError('Tournament not found', 404);
    if (t.fixturesGenerated) {
      throw new AppError(
        'Fixtures already generated. Reset first to regenerate.',
        409,
      );
    }
    const players = await Player.find({
      tournament: tid,
      isActive: true,
    });
    if (players.length < 2) {
      throw new AppError('Need at least 2 active players to generate', 400);
    }

    const ids = players.map((p) => String(p._id));
    const pairs = generateRoundRobin(ids);

    const sched = distributeFixturesAcrossDates(pairs.length, {
      startDate: t.startDate,
      endDate: t.endDate,
      matchesPerDay: t.matchesPerDay,
      weekdaysOnly: t.weekdaysOnly,
      totalMatches: pairs.length,
    });
    if (!sched.ok) throw new AppError(sched.error, 400);

    const docs = pairs.map((p, i) => ({
      tournament: t._id,
      matchNumber: i + 1,
      playerA: p.playerA,
      playerB: p.playerB,
      scheduledDate: sched.assignments[i],
      status: 'scheduled' as const,
    }));
    const created = await Match.insertMany(docs);
    t.fixturesGenerated = true;
    t.status = 'league';
    await t.save();
    res.status(201).json({
      created: created.length,
      fixtures: created,
    });
  }),
);

fixtureRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const tid = req.params.tid;
    const { date, status, player } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { tournament: tid };
    if (status) filter.status = status;
    if (date) {
      const d = new Date(date);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      filter.scheduledDate = { $gte: d, $lt: next };
    }
    if (player)
      Object.assign(filter, {
        $or: [{ playerA: player }, { playerB: player }],
      });
    const matches = await Match.find(filter)
      .populate('playerA playerB')
      .sort({ matchNumber: 1 });
    res.json(matches);
  }),
);

fixtureRouter.put(
  '/:mid/reschedule',
  requireAuth,
  requireTournamentAdmin,
  asyncHandler(async (req, res) => {
    const { scheduledDate } = req.body || {};
    if (!scheduledDate) throw new AppError('scheduledDate required', 400);
    const m = await Match.findOneAndUpdate(
      { _id: req.params.mid, tournament: req.params.tid },
      { scheduledDate: new Date(scheduledDate) },
      { new: true },
    );
    if (!m) throw new AppError('Match not found', 404);
    res.json(m);
  }),
);

fixtureRouter.delete(
  '/reset',
  requireAuth,
  requireTournamentAdmin,
  asyncHandler(async (req, res) => {
    const tid = req.params.tid;
    const t = await Tournament.findById(tid);
    if (!t) throw new AppError('Tournament not found', 404);
    await Match.deleteMany({ tournament: tid });
    t.fixturesGenerated = false;
    t.status = 'registration';
    await t.save();
    res.json({ ok: true });
  }),
);

fixtureRouter.get(
  '/today',
  asyncHandler(async (req, res) => {
    const tid = req.params.tid;
    const start = startOfDay(new Date());
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    const matches = await Match.find({
      tournament: tid,
      scheduledDate: { $gte: start, $lt: end },
    })
      .populate('playerA playerB')
      .sort({ matchNumber: 1 });
    res.json(matches);
  }),
);

fixtureRouter.get(
  '/upcoming',
  asyncHandler(async (req, res) => {
    const tid = req.params.tid;
    const start = startOfDay(new Date());
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
    const matches = await Match.find({
      tournament: tid,
      status: 'scheduled',
      scheduledDate: { $gte: start, $lte: end },
    })
      .populate('playerA playerB')
      .sort({ scheduledDate: 1, matchNumber: 1 });
    res.json(matches);
  }),
);

fixtureRouter.get(
  '/overdue',
  asyncHandler(async (req, res) => {
    const tid = req.params.tid;
    const today = startOfDay(new Date());
    const matches = await Match.find({
      tournament: tid,
      status: 'scheduled',
      scheduledDate: { $lt: today },
    })
      .populate('playerA playerB')
      .sort({ scheduledDate: 1 });
    res.json(matches);
  }),
);

function startOfDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}
