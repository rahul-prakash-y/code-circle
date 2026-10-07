import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAttendanceSession extends Document {
  event: mongoose.Types.ObjectId;
  sessionName: string;
  otp: string;
  otpExpiry: Date;
  isActive: boolean;
  classHours: number[];
  hourlyPoints: number;
  totalPoints: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSessionSchema = new Schema<IAttendanceSession>(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    sessionName: {
      type: String,
      required: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    otpExpiry: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    classHours: {
      type: [Number],
      default: [1],
    },
    hourlyPoints: {
      type: Number,
      default: 50,
      min: 0,
    },
    totalPoints: {
      type: Number,
      default: 50,
      min: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

attendanceSessionSchema.index({ otp: 1, isActive: 1, otpExpiry: 1 });
attendanceSessionSchema.index({ event: 1, createdAt: -1 });

const AttendanceSession: Model<IAttendanceSession> =
  mongoose.models.AttendanceSession ||
  mongoose.model<IAttendanceSession>('AttendanceSession', attendanceSessionSchema);

export default AttendanceSession;
