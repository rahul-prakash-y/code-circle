import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IEventOtp extends Document {
  eventId: string;
  dayNumber: number;
  otp: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const eventOtpSchema = new Schema<IEventOtp>(
  {
    eventId: {
      type: String,
      required: true,
      index: true,
    },
    dayNumber: {
      type: Number,
      required: true,
      default: 1,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // TTL auto-expiration
    },
  },
  {
    timestamps: true,
  }
);

eventOtpSchema.index({ eventId: 1, dayNumber: 1 }, { unique: true });

export const EventOtp: Model<IEventOtp> =
  mongoose.models.EventOtp || mongoose.model<IEventOtp>('EventOtp', eventOtpSchema);

export default EventOtp;
