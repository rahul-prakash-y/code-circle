import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IEventReport extends Document {
  eventId: mongoose.Types.ObjectId;
  eventTitle?: string;
  clubName: string;
  eventCategory: string;
  academicYear: string;
  date: Date;
  endDate?: Date;
  dateDisplay?: string;
  venue: string;
  // Core Text
  objective: string;
  outcome: string;
  // Detailed Summary
  eventOverview: string;
  strategiesUsed: string[];
  activitiesDone: string[];
  accomplishments: string[];
  achievements: string[];
  takeaways: string[];
  concludingNote: string;
  // Evidence (URLs or Base64 strings)
  circularUrl: string[];
  brochureUrl: string[];
  attendanceUrl: string[];
  geoPhotoUrl: string[];
  newspaperClippingUrl: string[];
  feedbackUrl: string[];
  billSettlementUrl: string[];
  // Resource Person & Coordinator
  resourcePerson: string;
  coordinatorName: string;
  coordinatorSignatureUrl: string;
  // Metadata & Audit
  createdBy?: mongoose.Types.ObjectId;
  status: 'Draft' | 'Submitted' | 'Approved';
  createdAt: Date;
  updatedAt: Date;
}

const eventReportSchema = new Schema<IEventReport>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID reference is required'],
      index: true,
    },
    eventTitle: {
      type: String,
      trim: true,
      default: '',
    },
    clubName: {
      type: String,
      required: [true, 'Club / Cell / Department name is required'],
      trim: true,
      default: 'Code Circle',
    },
    eventCategory: {
      type: String,
      required: [true, 'Event category is required'],
      trim: true,
      default: 'Technical Workshop',
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      trim: true,
      default: '2025-2026',
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    dateDisplay: {
      type: String,
      trim: true,
    },
    venue: {
      type: String,
      required: [true, 'Event venue is required'],
      trim: true,
      default: 'Main Campus, BIT',
    },
    // Core Text
    objective: {
      type: String,
      required: [true, 'Event objective is required'],
      trim: true,
      default: '',
    },
    outcome: {
      type: String,
      required: [true, 'Event outcome is required'],
      trim: true,
      default: '',
    },
    // Detailed Summary
    eventOverview: {
      type: String,
      trim: true,
      default: '',
    },
    strategiesUsed: {
      type: [String],
      default: [],
    },
    activitiesDone: {
      type: [String],
      default: [],
    },
    accomplishments: {
      type: [String],
      default: [],
    },
    achievements: {
      type: [String],
      default: [],
    },
    takeaways: {
      type: [String],
      default: [],
    },
    concludingNote: {
      type: String,
      trim: true,
      default: '',
    },
    // Evidence (Array of URLs or Base64 encoded strings)
    circularUrl: {
      type: [String],
      default: [],
    },
    brochureUrl: {
      type: [String],
      default: [],
    },
    attendanceUrl: {
      type: [String],
      default: [],
    },
    geoPhotoUrl: {
      type: [String],
      default: [],
    },
    newspaperClippingUrl: {
      type: [String],
      default: [],
    },
    feedbackUrl: {
      type: [String],
      default: [],
    },
    billSettlementUrl: {
      type: [String],
      default: [],
    },
    // Resource Person & Coordinator Details
    resourcePerson: {
      type: String,
      trim: true,
      default: 'NIL',
    },
    coordinatorName: {
      type: String,
      trim: true,
      default: '',
    },
    coordinatorSignatureUrl: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    status: {
      type: String,
      enum: ['Draft', 'Submitted', 'Approved'],
      default: 'Submitted',
    },
  },
  {
    timestamps: true,
  }
);

// Helpful Compound Index
eventReportSchema.index({ eventId: 1, createdAt: -1 });

export const EventReport: Model<IEventReport> =
  mongoose.models.EventReport || mongoose.model<IEventReport>('EventReport', eventReportSchema);

export default EventReport;
