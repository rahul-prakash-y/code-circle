import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ISubmissionAnswer {
  questionId?: mongoose.Types.ObjectId | string;
  selectedOptionId?: string;
  selectedOptionText?: string;
  questionIndex?: number;
  selectedOption?: number;
}

export interface IDetailedQuestionResult {
  questionId?: mongoose.Types.ObjectId | string;
  questionIndex: number;
  questionText: string;
  selectedOptionId?: string;
  selectedOptionText?: string;
  selectedOption: number;
  correctOptionIndex: number;
  correctOptionId?: string;
  correctOptionText?: string;
  isCorrect: boolean;
  points?: number;
  explanation?: string;
}

export interface IAssessmentSubmission extends Document {
  assessment: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  submissionId: string;
  isLate?: boolean;
  submissionStatus?: 'on_time' | 'late' | 'review';
  durableStatus?: 'saved' | 'pending';
  type?: 'mcq' | 'coding' | 'figma';
  figmaUrl?: string;
  answers: ISubmissionAnswer[];
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  pointsAwarded?: number;
  timeSpentSeconds: number;
  detailedResults: IDetailedQuestionResult[];
  createdAt: Date;
  updatedAt: Date;
}

const submissionAnswerSchema = new Schema<ISubmissionAnswer>(
  {
    questionId: { type: Schema.Types.ObjectId, required: false },
    selectedOptionId: { type: String, required: false },
    selectedOptionText: { type: String, required: false },
    questionIndex: { type: Number, default: 0 },
    selectedOption: { type: Number, default: -1 },
  },
  { _id: false }
);

const detailedQuestionResultSchema = new Schema<IDetailedQuestionResult>(
  {
    questionId: { type: Schema.Types.ObjectId, required: false },
    questionIndex: { type: Number, default: 0 },
    questionText: { type: String, required: true },
    selectedOptionId: { type: String, required: false },
    selectedOptionText: { type: String, required: false },
    selectedOption: { type: Number, default: -1 },
    correctOptionIndex: { type: Number, required: true },
    correctOptionId: { type: String, required: false },
    correctOptionText: { type: String, required: false },
    isCorrect: { type: Boolean, required: true },
    points: { type: Number, default: 1 },
    explanation: { type: String, default: '' },
  },
  { _id: false }
);

const assessmentSubmissionSchema = new Schema<IAssessmentSubmission>(
  {
    assessment: {
      type: Schema.Types.ObjectId,
      ref: 'Assessment',
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    submissionId: {
      type: String,
      required: true,
      index: true,
    },
    isLate: {
      type: Boolean,
      default: false,
      index: true,
    },
    submissionStatus: {
      type: String,
      enum: ['on_time', 'late', 'review'],
      default: 'on_time',
      index: true,
    },
    durableStatus: {
      type: String,
      enum: ['saved', 'pending'],
      default: 'saved',
      index: true,
    },
    type: {
      type: String,
      enum: ['mcq', 'coding', 'figma'],
      default: 'mcq',
      index: true,
    },
    figmaUrl: {
      type: String,
      default: null,
      maxlength: 2048,
    },
    answers: {
      type: [submissionAnswerSchema],
      default: [],
    },
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    totalPoints: {
      type: Number,
      required: true,
      default: 0,
    },
    percentage: {
      type: Number,
      required: true,
      default: 0,
    },
    passed: {
      type: Boolean,
      required: true,
      default: false,
    },
    pointsAwarded: {
      type: Number,
      default: 0,
    },
    timeSpentSeconds: {
      type: Number,
      default: 0,
    },
    detailedResults: {
      type: [detailedQuestionResultSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

assessmentSubmissionSchema.index({ assessment: 1, user: 1 });
assessmentSubmissionSchema.index({ user: 1, assessment: 1, submissionId: 1 }, { unique: true });
assessmentSubmissionSchema.index({ user: 1, createdAt: -1 });
assessmentSubmissionSchema.index({ assessment: 1, score: -1, createdAt: -1 });

const AssessmentSubmission: Model<IAssessmentSubmission> =
  mongoose.models.AssessmentSubmission ||
  mongoose.model<IAssessmentSubmission>('AssessmentSubmission', assessmentSubmissionSchema);

export default AssessmentSubmission;
