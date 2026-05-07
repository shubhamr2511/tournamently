import { Schema, model, Document, Types } from 'mongoose';

export interface ILeaderboardSnapshotRow {
  player: Types.ObjectId;
  rank: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  bonusPoints: number;
  perfectRounds: number;
  fastWins: number;
  gamesWon: number;
  gamesLost: number;
  gameDiff: number;
  winPercentage: number;
}

export interface ILeaderboardSnapshotDoc extends Document {
  _id: Types.ObjectId;
  tournament: Types.ObjectId;
  capturedAt: Date;
  rows: ILeaderboardSnapshotRow[];
  createdAt: Date;
  updatedAt: Date;
}

const RowSchema = new Schema<ILeaderboardSnapshotRow>(
  {
    player: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
    rank: { type: Number, required: true },
    matchesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    bonusPoints: { type: Number, default: 0 },
    perfectRounds: { type: Number, default: 0 },
    fastWins: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    gamesLost: { type: Number, default: 0 },
    gameDiff: { type: Number, default: 0 },
    winPercentage: { type: Number, default: 0 },
  },
  { _id: false },
);

const LeaderboardSnapshotSchema = new Schema<ILeaderboardSnapshotDoc>(
  {
    tournament: {
      type: Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
      index: true,
    },
    capturedAt: { type: Date, required: true, index: true },
    rows: { type: [RowSchema], default: [] },
  },
  { timestamps: true },
);

LeaderboardSnapshotSchema.index({ tournament: 1, capturedAt: -1 });

export const LeaderboardSnapshot = model<ILeaderboardSnapshotDoc>(
  'LeaderboardSnapshot',
  LeaderboardSnapshotSchema,
);
