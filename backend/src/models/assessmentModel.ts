import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAssessmentQuestion {
  _id?: mongoose.Types.ObjectId;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  points: number;
}

export interface IAssessment extends Document {
  title: string;
  description: string;
  category: string;
  eventId?: mongoose.Types.ObjectId | null;
  timeLimitMinutes: number;
  passingScorePercentage: number;
  questions: IAssessmentQuestion[];
  isPublished: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const assessmentQuestionSchema = new Schema<IAssessmentQuestion>(
  {
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    options: {
      type: [String],
      required: [true, 'At least two options are required'],
      validate: {
        validator: (opts: string[]) => Array.isArray(opts) && opts.length >= 2,
        message: 'Each question must have at least 2 options',
      },
    },
    correctOptionIndex: {
      type: Number,
      required: [true, 'Correct option index is required'],
      min: [0, 'Correct option index cannot be negative'],
    },
    explanation: {
      type: String,
      default: '',
      trim: true,
    },
    points: {
      type: Number,
      default: 1,
      min: [1, 'Points must be at least 1'],
    },
  },
  { _id: true }
);

const assessmentSchema = new Schema<IAssessment>(
  {
    title: {
      type: String,
      required: [true, 'Assessment title is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      default: 'Technical',
      trim: true,
      index: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
      index: true,
    },
    timeLimitMinutes: {
      type: Number,
      default: 30,
      min: [1, 'Time limit must be at least 1 minute'],
    },
    passingScorePercentage: {
      type: Number,
      default: 60,
      min: [0, 'Passing percentage cannot be negative'],
      max: [100, 'Passing percentage cannot exceed 100'],
    },
    questions: {
      type: [assessmentQuestionSchema],
      default: [],
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

assessmentSchema.index({ eventId: 1, isPublished: 1 });
assessmentSchema.index({ category: 1, isPublished: 1 });

const Assessment: Model<IAssessment> =
  mongoose.models.Assessment || mongoose.model<IAssessment>('Assessment', assessmentSchema);

export default Assessment;
