import { Schema, model, Document, Types } from 'mongoose';

// Canonical Tekken 7 roster (51 characters). Names match the keys in
// client/src/data/characterImages.ts so each character has a portrait.
export const TEKKEN_CHARACTERS = [
  'Akuma',
  'Alisa',
  'Anna',
  'Armor King',
  'Asuka',
  'Bob',
  'Bryan',
  'Claudio',
  'Devil Jin',
  'Dragunov',
  'Eddy',
  'Eliza',
  'Fahkumram',
  'Feng',
  'Ganryu',
  'Geese',
  'Gigas',
  'Heihachi',
  'Hwoarang',
  'Jack-7',
  'Jin',
  'Josie',
  'Julia',
  'Katarina',
  'Kazumi',
  'Kazuya',
  'King',
  'Kuma',
  'Kunimitsu',
  'Lars',
  'Law',
  'Lee',
  'Lei',
  'Leo',
  'Leroy',
  'Lidia',
  'Lili',
  'Lucky Chloe',
  'Marduk',
  'Master Raven',
  'Miguel',
  'Negan',
  'Nina',
  'Noctis',
  'Panda',
  'Paul',
  'Shaheen',
  'Steve',
  'Xiaoyu',
  'Yoshimitsu',
  'Zafina',
];

export interface ITournamentDoc extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  game: string;
  description?: string;
  format: 'round_robin';
  playerCount: number;
  matchFormat: 'BO3' | 'BO5' | 'BO7';
  startDate: Date;
  endDate: Date;
  matchesPerDay: number;
  weekdaysOnly: boolean;
  status:
    | 'draft'
    | 'registration'
    | 'league'
    | 'playoffs'
    | 'completed';
  adminPassword: string;
  scoring: {
    perfectRoundBonus: number;
    fastWinBonus: number;
    fastWinThresholdSeconds: number;
  };
  ranking: {
    primary: 'wins';
    tiebreakers: (
      | 'bonus_points'
      | 'head_to_head'
      | 'game_diff'
      | 'perfects'
      | 'fast_wins'
    )[];
  };
  characterLock: boolean;
  availableCharacters: string[];
  playoff?: {
    format: 'normal' | 'streak';
    size: number;
    matchFormat: 'BO3' | 'BO5' | 'BO7';
    streakTarget?: number;
    maxGameCap?: number;
    createdAt?: Date;
  };
  fixturesGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TournamentSchema = new Schema<ITournamentDoc>(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^[a-zA-Z0-9_-]+$/,
      minlength: 3,
      maxlength: 30,
    },
    game: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    format: {
      type: String,
      enum: ['round_robin'],
      default: 'round_robin',
    },
    playerCount: { type: Number, required: true, min: 2 },
    matchFormat: {
      type: String,
      enum: ['BO3', 'BO5', 'BO7'],
      default: 'BO3',
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    matchesPerDay: { type: Number, default: 4, min: 1 },
    weekdaysOnly: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['draft', 'registration', 'league', 'playoffs', 'completed'],
      default: 'draft',
    },
    adminPassword: { type: String, required: true, select: false },
    scoring: {
      perfectRoundBonus: { type: Number, default: 1 },
      fastWinBonus: { type: Number, default: 1 },
      fastWinThresholdSeconds: { type: Number, default: 10 },
    },
    ranking: {
      primary: { type: String, default: 'wins' },
      tiebreakers: {
        type: [String],
        default: [
          'bonus_points',
          'head_to_head',
          'game_diff',
          'perfects',
          'fast_wins',
        ],
      },
    },
    characterLock: { type: Boolean, default: false },
    availableCharacters: { type: [String], default: TEKKEN_CHARACTERS },
    playoff: {
      type: new Schema(
        {
          format: { type: String, enum: ['normal', 'streak'] },
          size: { type: Number },
          matchFormat: { type: String, enum: ['BO3', 'BO5', 'BO7'] },
          streakTarget: { type: Number, default: 3 },
          maxGameCap: { type: Number },
          createdAt: { type: Date, default: Date.now },
        },
        { _id: false },
      ),
      default: undefined,
    },
    fixturesGenerated: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Tournament = model<ITournamentDoc>(
  'Tournament',
  TournamentSchema,
);
