import mongoose, { Document, Schema, Model } from 'mongoose';

export type FeedbackType = 'Event' | 'ClubGeneral';

export interface IFeedback extends Document {
  user: mongoose.Types.ObjectId;
  type: FeedbackType;
  event?: mongoose.Types.ObjectId | null;
  rating: number;
  category: string;
  comment: string;
  isReviewed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<IFeedback>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['Event', 'ClubGeneral'],
      required: [true, 'Feedback type (Event or ClubGeneral) is required'],
      index: true,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      default: 5,
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
      index: true,
    },
    comment: {
      type: String,
      required: [true, 'Feedback comment text is required'],
      trim: true,
      minlength: [3, 'Feedback comment must be at least 3 characters'],
      maxlength: [2000, 'Feedback comment cannot exceed 2000 characters'],
    },
    isReviewed: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

feedbackSchema.index({ type: 1, createdAt: -1 });
feedbackSchema.index({ event: 1, createdAt: -1 });

const Feedback: Model<IFeedback> =
  mongoose.models.Feedback || mongoose.model<IFeedback>('Feedback', feedbackSchema);

export default Feedback;
