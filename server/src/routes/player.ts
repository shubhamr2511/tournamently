import { Router } from 'express';
import { Player } from '../models/Player';
import { Tournament } from '../models/Tournament';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { requireAuth, requireTournamentAdmin } from '../middleware/auth';
import { parseBody, playerInputSchema } from '../utils/validation';

export const playerRouter = Router({ mergeParams: true });

playerRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const tid = req.params.tid;
    const players = await Player.find({
      tournament: tid,
      isActive: true,
    }).sort({ gamerTag: 1 });
    res.json(players);
  }),
);

playerRouter.post(
  '/',
  requireAuth,
  requireTournamentAdmin,
  asyncHandler(async (req, res) => {
    const tid = req.params.tid;
    const body = parseBody(playerInputSchema, req.body);
    const t = await Tournament.findById(tid);
    if (!t) throw new AppError('Tournament not found', 404);
    if (t.fixturesGenerated) {
      throw new AppError(
        'Cannot add player: fixtures are already generated. Reset fixtures first.',
        409,
      );
    }
    const player = await Player.create({
      ...body,
      tournament: tid,
    });
    res.status(201).json(player);
  }),
);

playerRouter.put(
  '/:pid',
  requireAuth,
  requireTournamentAdmin,
  asyncHandler(async (req, res) => {
    const tid = req.params.tid;
    const t = await Tournament.findById(tid);
    if (!t) throw new AppError('Tournament not found', 404);
    const player = await Player.findOne({
      _id: req.params.pid,
      tournament: tid,
    });
    if (!player) throw new AppError('Player not found', 404);

    const updates: Record<string, unknown> = { ...req.body };
    delete updates._id;
    delete updates.tournament;
    delete updates.characterLocked;

    if (
      'character' in updates &&
      t.characterLock &&
      player.characterLocked
    ) {
      throw new AppError('Character is locked for this player', 409);
    }

    Object.assign(player, updates);
    if (
      'character' in updates &&
      t.characterLock &&
      updates.character &&
      !player.characterLocked
    ) {
      player.characterLocked = true;
    }
    await player.save();
    res.json(player);
  }),
);

playerRouter.delete(
  '/:pid',
  requireAuth,
  requireTournamentAdmin,
  asyncHandler(async (req, res) => {
    const tid = req.params.tid;
    const t = await Tournament.findById(tid);
    if (!t) throw new AppError('Tournament not found', 404);
    if (t.fixturesGenerated) {
      throw new AppError(
        'Cannot delete player: fixtures are already generated. Reset fixtures first.',
        409,
      );
    }
    const player = await Player.findOneAndDelete({
      _id: req.params.pid,
      tournament: tid,
    });
    if (!player) throw new AppError('Player not found', 404);
    res.json({ ok: true });
  }),
);
