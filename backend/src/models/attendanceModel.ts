import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAttendance extends Document {
  userId: string;
  eventId: string;
  user?: mongoose.Types.ObjectId;
  event?: mongoose.Types.ObjectId;
  dayNumber: number;
  dateAttended: Date;
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
    dayNumber: {
      type: Number,
      required: [true, 'Event day number is required for multi-day attendance'],
      default: 1,
      min: [1, 'Day number must be at least 1'],
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
    status: {
      type: String,
      default: 'Present',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate attendance per student, per event, per specific event day
attendanceSchema.index({ userId: 1, eventId: 1, dayNumber: 1 }, { unique: true });
attendanceSchema.index({ eventId: 1, dayNumber: 1, timestamp: -1 });
attendanceSchema.index({ eventId: 1, timestamp: -1 });

export const AttendanceModel: Model<IAttendance> =
  mongoose.models.Attendance ||
  mongoose.model<IAttendance>('Attendance', attendanceSchema);

export default AttendanceModel;
