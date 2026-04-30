import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { Tournament, TEKKEN_CHARACTERS } from '../models/Tournament';
import { Player } from '../models/Player';
import { Match } from '../models/Match';
import { PlayoffMatch } from '../models/PlayoffMatch';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import {
  createTournamentSchema,
  parseBody,
} from '../utils/validation';
import { requireAuth, requireTournamentAdmin } from '../middleware/auth';

export const tournamentRouter = Router();

tournamentRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const list = await Tournament.find().sort({ createdAt: -1 });
    res.json(list);
  }),
);

tournamentRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = parseBody(createTournamentSchema, req.body);
    const exists = await Tournament.findOne({ slug: body.slug });
    if (exists) throw new AppError('Slug already in use', 409);
    const adminPassword = await bcrypt.hash(body.adminPassword, 10);
    const t = await Tournament.create({
      ...body,
      adminPassword,
      availableCharacters: body.availableCharacters || TEKKEN_CHARACTERS,
      ranking: body.ranking || {
        primary: 'wins',
        tiebreakers: [
          'bonus_points',
          'head_to_head',
          'game_diff',
          'perfects',
          'fast_wins',
        ],
      },
      scoring: {
        perfectRoundBonus: body.scoring?.perfectRoundBonus ?? 1,
        fastWinBonus: body.scoring?.fastWinBonus ?? 1,
        fastWinThresholdSeconds:
          body.scoring?.fastWinThresholdSeconds ?? 10,
      },
      status: 'registration',
    });
    res.status(201).json(sanitize(t));
  }),
);

tournamentRouter.get(
  '/slug/:slug',
  asyncHandler(async (req, res) => {
    const t = await Tournament.findOne({ slug: req.params.slug });
    if (!t) throw new AppError('Tournament not found', 404);
    res.json(sanitize(t));
  }),
);

tournamentRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const t = await Tournament.findById(req.params.id);
    if (!t) throw new AppError('Tournament not found', 404);
    res.json(sanitize(t));
  }),
);

tournamentRouter.put(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res, next) => {
    if (req.auth?.tournamentId !== req.params.id) {
      return next(new AppError('Not authorized', 403));
    }
    const updates: Record<string, unknown> = { ...req.body };
    delete updates.adminPassword;
    delete updates.slug;
    delete updates._id;
    const t = await Tournament.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!t) throw new AppError('Tournament not found', 404);
    res.json(sanitize(t));
  }),
);

tournamentRouter.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res, next) => {
    if (req.auth?.tournamentId !== req.params.id) {
      return next(new AppError('Not authorized', 403));
    }
    const t = await Tournament.findById(req.params.id);
    if (!t) throw new AppError('Tournament not found', 404);
    await Promise.all([
      Player.deleteMany({ tournament: t._id }),
      Match.deleteMany({ tournament: t._id }),
      PlayoffMatch.deleteMany({ tournament: t._id }),
      t.deleteOne(),
    ]);
    res.json({ ok: true });
  }),
);

function sanitize(t: any) {
  const o = t.toObject ? t.toObject() : t;
  delete o.adminPassword;
  return o;
}

export { requireTournamentAdmin };
