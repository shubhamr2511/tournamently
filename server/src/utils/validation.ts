import { z } from 'zod';
import { AppError } from './AppError';

export const slugSchema = z
  .string()
  .min(3)
  .max(30)
  .regex(/^[a-zA-Z0-9_-]+$/, 'Slug must be alphanumeric, dash, or underscore');

export const matchFormatSchema = z.enum(['BO3', 'BO5', 'BO7']);

export const tiebreakerSchema = z.enum([
  'bonus_points',
  'head_to_head',
  'game_diff',
  'perfects',
  'fast_wins',
]);

export const createTournamentSchema = z.object({
  name: z.string().min(1).max(80),
  slug: slugSchema,
  game: z.string().min(1).max(80),
  description: z.string().max(1000).optional(),
  format: z.literal('round_robin').default('round_robin'),
  playerCount: z.number().int().min(2).max(128).default(8),
  matchFormat: matchFormatSchema.default('BO3'),
  startDate: z.string(),
  endDate: z.string(),
  matchesPerDay: z.number().int().min(1).max(50).default(4),
  weekdaysOnly: z.boolean().default(true),
  adminPassword: z.string().min(4).max(100),
  scoring: z
    .object({
      perfectRoundBonus: z.number().min(0).default(1),
      fastWinBonus: z.number().min(0).default(1),
      fastWinThresholdSeconds: z.number().min(1).default(10),
    })
    .partial()
    .optional(),
  ranking: z
    .object({
      primary: z.literal('wins'),
      tiebreakers: z.array(tiebreakerSchema),
    })
    .optional(),
  characterLock: z.boolean().default(false),
  availableCharacters: z.array(z.string()).optional(),
});

export const updateTournamentSchema = z
  .object({
    name: z.string().min(1).max(80),
    game: z.string().min(1).max(80),
    description: z.string().max(1000),
    playerCount: z.number().int().min(2).max(128),
    matchFormat: matchFormatSchema,
    startDate: z.string(),
    endDate: z.string(),
    matchesPerDay: z.number().int().min(1).max(50),
    weekdaysOnly: z.boolean(),
    characterLock: z.boolean(),
    scoring: z
      .object({
        perfectRoundBonus: z.number().min(0),
        fastWinBonus: z.number().min(0),
        fastWinThresholdSeconds: z.number().min(1),
      })
      .partial(),
    ranking: z.object({
      primary: z.literal('wins'),
      tiebreakers: z.array(tiebreakerSchema),
    }),
    availableCharacters: z.array(z.string()),
  })
  .partial();

export const playerInputSchema = z.object({
  name: z.string().min(1).max(80),
  gamerTag: z.string().min(1).max(40),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().max(500).optional(),
  department: z.string().max(80).optional(),
  character: z.string().max(80).optional(),
});

export const matchResultSchema = z.object({
  winner: z.string().min(1),
  score: z.string().regex(/^[0-9]+-[0-9]+$/),
  games: z
    .array(
      z.object({
        gameNumber: z.number().int().min(1),
        winner: z.string().min(1),
        perfectRound: z.boolean().optional(),
        fastWin: z.boolean().optional(),
      }),
    )
    .min(1),
  playerAStats: z
    .object({
      perfectRounds: z.number().int().min(0).default(0),
      fastWins: z.number().int().min(0).default(0),
    })
    .optional(),
  playerBStats: z
    .object({
      perfectRounds: z.number().int().min(0).default(0),
      fastWins: z.number().int().min(0).default(0),
    })
    .optional(),
  notes: z.string().max(500).optional(),
  isFeatured: z.boolean().optional(),
  isUpset: z.boolean().optional(),
});

export function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new AppError('Validation failed', 400, result.error.flatten());
  }
  return result.data;
}
