import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAttendance extends Document {
  userId: string;
  eventId: string;
  user?: mongoose.Types.ObjectId;
  event?: mongoose.Types.ObjectId;
  timestamp: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
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
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      default: 'Present',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate attendance records at database level
attendanceSchema.index({ userId: 1, eventId: 1 }, { unique: true });
attendanceSchema.index({ eventId: 1, timestamp: -1 });

export const AttendanceModel: Model<IAttendance> =
  mongoose.models.Attendance ||
  mongoose.model<IAttendance>('Attendance', attendanceSchema);

export default AttendanceModel;
