import mongoose, { Document, Schema, Model } from 'mongoose';

export type EventType = 'Technical' | 'Non-Technical' | 'Lecture' | 'Workshop' | 'Individual' | 'Team';
export type EventFormat = 'Individual' | 'Duo' | 'Team';
export type EventStatus = 'Upcoming' | 'Live' | 'Completed' | 'Cancelled';

export interface IEvent extends Document {
  title: string;
  description: string;
  type: EventType;
  format: EventFormat;
  date: Date;
  status: EventStatus;
  venueOrLink: string;
  maxParticipants: number;
  registrationDeadline: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['Technical', 'Non-Technical', 'Lecture', 'Workshop', 'Individual', 'Team'],
      default: 'Technical',
      required: true,
    },
    format: {
      type: String,
      enum: ['Individual', 'Duo', 'Team'],
      default: 'Individual',
      required: true,
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    status: {
      type: String,
      enum: ['Upcoming', 'Live', 'Completed', 'Cancelled'],
      default: 'Upcoming',
    },
    venueOrLink: {
      type: String,
      default: 'Campus / Online',
      trim: true,
    },
    maxParticipants: {
      type: Number,
      default: 0,
    },
    registrationDeadline: {
      type: Date,
      default: function (this: IEvent) {
        return this.date || new Date();
      },
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

// Backward compatibility pre-save hook:
// If an older payload provided type='Individual' or 'Team', map it to format
eventSchema.pre('save', function () {
  if (this.type === 'Individual' || this.type === 'Team') {
    this.format = this.type as EventFormat;
    this.type = 'Technical';
  }
});

// Optimized query indexes
eventSchema.index({ date: 1, status: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ type: 1 });
eventSchema.index({ format: 1 });
eventSchema.index({ registrationDeadline: 1 });
eventSchema.index({ createdBy: 1 });

const Event: Model<IEvent> = mongoose.models.Event || mongoose.model<IEvent>('Event', eventSchema);

export default Event;
