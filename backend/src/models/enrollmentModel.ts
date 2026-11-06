import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IEnrollment extends Document {
  event: mongoose.Types.ObjectId;
  enrolledBy: mongoose.Types.ObjectId;
  type: 'Individual' | 'Team';
  teamName?: string;
  members: mongoose.Types.ObjectId[];
  attendanceStatus: boolean;
  isBlocked?: boolean;
  isWalkIn?: boolean;
  certificateUrl?: string | null;
  customResponses?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    enrolledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['Individual', 'Team'],
      required: true,
    },
    teamName: {
      type: String,
      required: function (this: IEnrollment) {
        return this.type === 'Team';
      },
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: function (this: IEnrollment) {
          return this.type === 'Team';
        },
      },
    ],
    attendanceStatus: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
      index: true,
    },
    isWalkIn: {
      type: Boolean,
      default: false,
    },
    certificateUrl: {
      type: String,
      default: null,
    },
    customResponses: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Optimized compound indexes for registration checks and query performance
enrollmentSchema.index({ event: 1, enrolledBy: 1 });
enrollmentSchema.index({ event: 1, members: 1 });
enrollmentSchema.index({ event: 1, isBlocked: 1 });
enrollmentSchema.index({ enrolledBy: 1, attendanceStatus: 1 });
enrollmentSchema.index({ members: 1, attendanceStatus: 1 });
enrollmentSchema.index({ event: 1, attendanceStatus: 1 });
enrollmentSchema.index({ event: 1, isWalkIn: 1 });

export const Enrollment: Model<IEnrollment> =
  mongoose.models.Enrollment || mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);

// Aliases matching EventRegistration / EventParticipation requirements
export const EventRegistration = Enrollment;
export const EventParticipation = Enrollment;
export type IEventRegistration = IEnrollment;
export type IEventParticipation = IEnrollment;

export default Enrollment;

// CommonJS compatibility for legacy require()
module.exports = Enrollment;
module.exports.default = Enrollment;
module.exports.Enrollment = Enrollment;
module.exports.EventRegistration = Enrollment;
module.exports.EventParticipation = Enrollment;
