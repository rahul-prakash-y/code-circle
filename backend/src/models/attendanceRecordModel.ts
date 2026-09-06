import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAttendanceRecord extends Document {
  session: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  timestamp: Date;
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
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure unique attendance per session per user
attendanceRecordSchema.index({ session: 1, user: 1 }, { unique: true });
attendanceRecordSchema.index({ user: 1, timestamp: -1 });
attendanceRecordSchema.index({ session: 1, timestamp: -1 });

const AttendanceRecord: Model<IAttendanceRecord> =
  mongoose.models.AttendanceRecord ||
  mongoose.model<IAttendanceRecord>('AttendanceRecord', attendanceRecordSchema);

export default AttendanceRecord;
