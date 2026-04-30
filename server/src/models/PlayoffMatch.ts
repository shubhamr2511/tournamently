import { Schema, model, Document, Types } from 'mongoose';
import { IGameResult } from './Match';

export interface IPlayoffMatchDoc extends Document {
  _id: Types.ObjectId;
  tournament: Types.ObjectId;
  round: number;
  matchNumber: number;
  playerA?: Types.ObjectId;
  playerB?: Types.ObjectId;
  seedA?: number;
  seedB?: number;
  feederMatchA?: Types.ObjectId;
  feederMatchB?: Types.ObjectId;
  mode: 'normal' | 'streak';
  normalResult?: {
    winner: Types.ObjectId;
    score: string;
    games: IGameResult[];
  };
  streakResult?: {
    winner?: Types.ObjectId;
    sequence: Types.ObjectId[];
    finalStreakA: number;
    finalStreakB: number;
    totalGames: number;
  };
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GameResultSchema = new Schema<IGameResult>(
  {
    gameNumber: { type: Number, required: true },
    winner: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
    perfectRound: { type: Boolean, default: false },
    fastWin: { type: Boolean, default: false },
  },
  { _id: false },
);

const PlayoffMatchSchema = new Schema<IPlayoffMatchDoc>(
  {
    tournament: {
      type: Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
      index: true,
    },
    round: { type: Number, required: true },
    matchNumber: { type: Number, required: true },
    playerA: { type: Schema.Types.ObjectId, ref: 'Player' },
    playerB: { type: Schema.Types.ObjectId, ref: 'Player' },
    seedA: Number,
    seedB: Number,
    feederMatchA: { type: Schema.Types.ObjectId, ref: 'PlayoffMatch' },
    feederMatchB: { type: Schema.Types.ObjectId, ref: 'PlayoffMatch' },
    mode: { type: String, enum: ['normal', 'streak'], default: 'normal' },
    normalResult: {
      type: new Schema(
        {
          winner: {
            type: Schema.Types.ObjectId,
            ref: 'Player',
            required: true,
          },
          score: { type: String, required: true },
          games: { type: [GameResultSchema], default: [] },
        },
        { _id: false },
      ),
      default: undefined,
    },
    streakResult: {
      type: new Schema(
        {
          winner: { type: Schema.Types.ObjectId, ref: 'Player' },
          sequence: [{ type: Schema.Types.ObjectId, ref: 'Player' }],
          finalStreakA: { type: Number, default: 0 },
          finalStreakB: { type: Number, default: 0 },
          totalGames: { type: Number, default: 0 },
        },
        { _id: false },
      ),
      default: undefined,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
    },
    completedAt: Date,
  },
  { timestamps: true },
);

export const PlayoffMatch = model<IPlayoffMatchDoc>(
  'PlayoffMatch',
  PlayoffMatchSchema,
);
