import mongoose, { Document, Schema, Model } from 'mongoose';

export type EventDocumentStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected';

export interface IEventDocument extends Document {
  eventId: mongoose.Types.ObjectId;
  title: string;
  content: string; // Markdown or HTML representation
  status: EventDocumentStatus;
  approvedBy?: mongoose.Types.ObjectId | null;
  approvedAt?: Date | null;
  createdBy: mongoose.Types.ObjectId;
  rejectionReason?: string;
  tags?: string[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const eventDocumentSchema = new Schema<IEventDocument>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Associated Event ID is required'],
      index: true,
    },
    title: {
      type: String,
      default: 'Event Documentation Report',
      trim: true,
    },
    content: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Draft', 'Pending', 'Approved', 'Rejected'],
      default: 'Draft',
      index: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookups
eventDocumentSchema.index({ eventId: 1, status: 1 });
eventDocumentSchema.index({ createdBy: 1, createdAt: -1 });

export const EventDocument: Model<IEventDocument> =
  mongoose.models.EventDocument ||
  mongoose.model<IEventDocument>('EventDocument', eventDocumentSchema);

export default EventDocument;
