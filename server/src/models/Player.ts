import { Schema, model, Document, Types } from 'mongoose';

export interface IPlayerDoc extends Document {
  _id: Types.ObjectId;
  tournament: Types.ObjectId;
  name: string;
  gamerTag: string;
  bio?: string;
  avatarUrl?: string;
  department?: string;
  character?: string;
  characterLocked: boolean;
  seed?: number;
  isActive: boolean;
  isAbsent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlayerSchema = new Schema<IPlayerDoc>(
  {
    tournament: {
      type: Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    gamerTag: { type: String, required: true, trim: true },
    bio: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    department: { type: String, default: '' },
    character: { type: String, default: '' },
    characterLocked: { type: Boolean, default: false },
    seed: { type: Number },
    isActive: { type: Boolean, default: true },
    isAbsent: { type: Boolean, default: false },
  },
  { timestamps: true },
);

PlayerSchema.index({ tournament: 1, gamerTag: 1 }, { unique: true });

export const Player = model<IPlayerDoc>('Player', PlayerSchema);
