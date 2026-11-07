import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAttendanceLockout extends Document {
  userId: string;
  eventId: string;
  attempts: number;
  lockedUntil: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceLockoutSchema = new Schema<IAttendanceLockout>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    eventId: {
      type: String,
      required: true,
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
      default: null,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // TTL auto-eviction
    },
  },
  {
    timestamps: true,
  }
);

attendanceLockoutSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export const AttendanceLockout: Model<IAttendanceLockout> =
  mongoose.models.AttendanceLockout ||
  mongoose.model<IAttendanceLockout>('AttendanceLockout', attendanceLockoutSchema);

export default AttendanceLockout;
