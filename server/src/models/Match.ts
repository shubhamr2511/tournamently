import { Schema, model, Document, Types } from 'mongoose';

export interface IGameResult {
  gameNumber: number;
  winner: Types.ObjectId;
  perfectRound?: boolean;
  fastWin?: boolean;
}

export interface IMatchPlayerStats {
  perfectRounds: number;
  fastWins: number;
  bonusPoints: number;
}

export interface IMatchResult {
  winner: Types.ObjectId;
  loser: Types.ObjectId;
  score: string;
  games: IGameResult[];
  playerAStats: IMatchPlayerStats;
  playerBStats: IMatchPlayerStats;
  notes?: string;
  isFeatured: boolean;
  isUpset: boolean;
  completedAt: Date;
}

export interface IMatchDoc extends Document {
  _id: Types.ObjectId;
  tournament: Types.ObjectId;
  matchNumber: number;
  playerA: Types.ObjectId;
  playerB: Types.ObjectId;
  scheduledDate?: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  result?: IMatchResult;
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

const PlayerStatsSchema = new Schema<IMatchPlayerStats>(
  {
    perfectRounds: { type: Number, default: 0 },
    fastWins: { type: Number, default: 0 },
    bonusPoints: { type: Number, default: 0 },
  },
  { _id: false },
);

const ResultSchema = new Schema<IMatchResult>(
  {
    winner: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
    loser: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
    score: { type: String, required: true },
    games: { type: [GameResultSchema], default: [] },
    playerAStats: { type: PlayerStatsSchema, default: () => ({}) },
    playerBStats: { type: PlayerStatsSchema, default: () => ({}) },
    notes: { type: String, default: '' },
    isFeatured: { type: Boolean, default: false },
    isUpset: { type: Boolean, default: false },
    completedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const MatchSchema = new Schema<IMatchDoc>(
  {
    tournament: {
      type: Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
      index: true,
    },
    matchNumber: { type: Number, required: true },
    playerA: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
      index: true,
    },
    playerB: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
      index: true,
    },
    scheduledDate: { type: Date, index: true },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    result: { type: ResultSchema, default: undefined },
  },
  { timestamps: true },
);

MatchSchema.index({ tournament: 1, matchNumber: 1 }, { unique: true });

export const Match = model<IMatchDoc>('Match', MatchSchema);
