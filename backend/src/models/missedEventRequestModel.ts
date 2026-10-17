import mongoose, { Document, Schema, Model } from 'mongoose';

export type MissedEventRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface IMissedEventRequest extends Document {
  student: mongoose.Types.ObjectId;
  event: mongoose.Types.ObjectId;
  session?: mongoose.Types.ObjectId;
  missedDate: Date;
  classHours: number[];
  clubHoursRequested: number;
  reason: string;
  proofUrl?: string;
  status: MissedEventRequestStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const missedEventRequestSchema = new Schema<IMissedEventRequest>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    session: {
      type: Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      required: false,
    },
    missedDate: {
      type: Date,
      required: true,
    },
    classHours: {
      type: [Number],
      default: [1],
    },
    clubHoursRequested: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    reason: {
      type: String,
      required: [true, 'Reason for missing the event is required'],
      trim: true,
    },
    proofUrl: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewNote: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

missedEventRequestSchema.index({ student: 1, event: 1, status: 1 });
missedEventRequestSchema.index({ status: 1, createdAt: -1 });
missedEventRequestSchema.index({ student: 1, createdAt: -1 });

export const MissedEventRequest: Model<IMissedEventRequest> =
  mongoose.models.MissedEventRequest ||
  mongoose.model<IMissedEventRequest>('MissedEventRequest', missedEventRequestSchema);

export default MissedEventRequest;
