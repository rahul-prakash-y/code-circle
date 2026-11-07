import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAuthLockout extends Document {
  key: string; // 'user:<normalizedUsername>' or 'ip:<ip>'
  targetType: 'username' | 'ip';
  targetValue: string;
  failedCount: number;
  lockedUntil: Date | null;
  lastFailedAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const authLockoutSchema = new Schema<IAuthLockout>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ['username', 'ip'],
      required: true,
      index: true,
    },
    targetValue: {
      type: String,
      required: true,
      index: true,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
      default: null,
      index: true,
    },
    lastFailedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // TTL auto-eviction by MongoDB Atlas
    },
  },
  {
    timestamps: true,
  }
);

authLockoutSchema.index({ targetType: 1, targetValue: 1 });

export const AuthLockout: Model<IAuthLockout> =
  mongoose.models.AuthLockout || mongoose.model<IAuthLockout>('AuthLockout', authLockoutSchema);

export default AuthLockout;
