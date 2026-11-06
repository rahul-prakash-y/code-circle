import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAttendanceRecord extends Document {
  session: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  event?: mongoose.Types.ObjectId;
  dayNumber: number;
  dateAttended: Date;
  timestamp: Date;
  pointsAwarded: number;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    session: {
      type: Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: false,
    },
    dayNumber: {
      type: Number,
      default: 1,
      min: 1,
      index: true,
    },
    dateAttended: {
      type: Date,
      default: Date.now,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    pointsAwarded: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure unique attendance per session per user
attendanceRecordSchema.index({ session: 1, user: 1 }, { unique: true });
attendanceRecordSchema.index({ event: 1, user: 1, dayNumber: 1 });
attendanceRecordSchema.index({ user: 1, timestamp: -1 });
attendanceRecordSchema.index({ session: 1, timestamp: -1 });

const AttendanceRecord: Model<IAttendanceRecord> =
  mongoose.models.AttendanceRecord ||
  mongoose.model<IAttendanceRecord>('AttendanceRecord', attendanceRecordSchema);

export default AttendanceRecord;
