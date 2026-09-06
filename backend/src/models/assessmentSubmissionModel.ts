import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ISubmissionAnswer {
  questionIndex: number;
  selectedOption: number;
}

export interface IDetailedQuestionResult {
  questionIndex: number;
  questionText: string;
  selectedOption: number;
  correctOptionIndex: number;
  isCorrect: boolean;
  explanation?: string;
}

export interface IAssessmentSubmission extends Document {
  assessment: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  answers: ISubmissionAnswer[];
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  timeSpentSeconds: number;
  detailedResults: IDetailedQuestionResult[];
  createdAt: Date;
  updatedAt: Date;
}

const submissionAnswerSchema = new Schema<ISubmissionAnswer>(
  {
    questionIndex: { type: Number, required: true },
    selectedOption: { type: Number, required: true },
  },
  { _id: false }
);

const detailedQuestionResultSchema = new Schema<IDetailedQuestionResult>(
  {
    questionIndex: { type: Number, required: true },
    questionText: { type: String, required: true },
    selectedOption: { type: Number, required: true },
    correctOptionIndex: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
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
assessmentSubmissionSchema.index({ user: 1, createdAt: -1 });

const AssessmentSubmission: Model<IAssessmentSubmission> =
  mongoose.models.AssessmentSubmission ||
  mongoose.model<IAssessmentSubmission>('AssessmentSubmission', assessmentSubmissionSchema);

export default AssessmentSubmission;
