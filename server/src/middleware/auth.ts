import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from '../utils/AppError';

export interface AuthPayload {
  tournamentId: string;
  role: 'admin';
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function signToken(payload: AuthPayload): string {
  const opts: jwt.SignOptions = {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign(payload, config.jwtSecret, opts);
}

export function verifyToken(token: string): AuthPayload {
  try {
    return jwt.verify(token, config.jwtSecret) as AuthPayload;
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }
}

export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('Missing authorization header', 401));
  }
  const token = header.slice('Bearer '.length).trim();
  req.auth = verifyToken(token);
  next();
}

export function requireTournamentAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const tid = req.params.tid || req.params.id;
  if (!req.auth) return next(new AppError('Not authenticated', 401));
  if (!tid) return next(new AppError('Missing tournament id', 400));
  if (req.auth.tournamentId !== tid) {
    return next(new AppError('Not authorized for this tournament', 403));
  }
  next();
}
