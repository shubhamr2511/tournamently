import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { Tournament } from '../models/Tournament';
import { signToken, verifyToken } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';

export const authRouter = Router();

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { slug, password } = req.body || {};
    if (!slug || !password) {
      throw new AppError('slug and password required', 400);
    }
    const t = await Tournament.findOne({ slug }).select('+adminPassword');
    if (!t) throw new AppError('Tournament not found', 404);
    const ok = await bcrypt.compare(password, t.adminPassword);
    if (!ok) throw new AppError('Invalid password', 401);
    const token = signToken({
      tournamentId: String(t._id),
      role: 'admin',
    });
    res.json({
      token,
      tournament: { _id: t._id, slug: t.slug, name: t.name },
    });
  }),
);

authRouter.get(
  '/verify',
  asyncHandler(async (req, res) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError('Missing token', 401);
    }
    const payload = verifyToken(header.slice(7).trim());
    res.json({ valid: true, ...payload });
  }),
);
