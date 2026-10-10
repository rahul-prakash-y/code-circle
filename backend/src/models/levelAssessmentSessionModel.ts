import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ILevelSessionSubmission {
  challengeId: mongoose.Types.ObjectId;
  submissionId?: mongoose.Types.ObjectId | null;
  language: string;
  code: string;
  status: 'passed' | 'failed' | 'compilation_error' | 'runtime_error' | 'timeout' | 'unattempted';
  score: number;
  passed: number;
  total: number;
  submittedAt?: Date | null;
}

export interface ILevelAssessmentSession extends Document {
  student: mongoose.Types.ObjectId;
  level: mongoose.Types.ObjectId;
  domain: mongoose.Types.ObjectId;
  assignedQuestions: mongoose.Types.ObjectId[];
  attemptNumber: number;
  initialPoints: number;
  pointsAvailable: number;
  pointsAwarded: number;
  timeLimitMinutes: number; // 60 minutes = 1 hour
  startTime: Date;
  expiresAt: Date;
  isCompleted: boolean;
  completedAt?: Date | null;
  verdict: 'passed' | 'failed' | 'in_progress' | 'expired';
  submissions: ILevelSessionSubmission[];
  createdAt: Date;
  updatedAt: Date;
}

const levelSessionSubmissionSchema = new Schema<ILevelSessionSubmission>(
  {
    challengeId: {
      type: Schema.Types.ObjectId,
      ref: 'CodingChallenge',
      required: true,
    },
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: 'CodingSubmission',
      default: null,
    },
    language: {
      type: String,
      default: 'python',
    },
    code: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['passed', 'failed', 'compilation_error', 'runtime_error', 'timeout', 'unattempted'],
      default: 'unattempted',
    },
    score: {
      type: Number,
      default: 0,
    },
    passed: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const levelAssessmentSessionSchema = new Schema<ILevelAssessmentSession>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    level: {
      type: Schema.Types.ObjectId,
      ref: 'Level',
      required: true,
      index: true,
    },
    domain: {
      type: Schema.Types.ObjectId,
      ref: 'Domain',
      required: true,
      index: true,
    },
    assignedQuestions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'CodingChallenge',
      },
    ],
    attemptNumber: {
      type: Number,
      default: 1,
    },
    initialPoints: {
      type: Number,
      default: 100,
    },
    pointsAvailable: {
      type: Number,
      default: 100,
    },
    pointsAwarded: {
      type: Number,
      default: 0,
    },
    timeLimitMinutes: {
      type: Number,
      default: 60, // 1 hour timing
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    verdict: {
      type: String,
      enum: ['passed', 'failed', 'in_progress', 'expired'],
      default: 'in_progress',
    },
    submissions: {
      type: [levelSessionSubmissionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

levelAssessmentSessionSchema.index({ student: 1, level: 1 });
levelAssessmentSessionSchema.index({ student: 1, isCompleted: 1 });

export const LevelAssessmentSession: Model<ILevelAssessmentSession> =
  mongoose.models.LevelAssessmentSession ||
  mongoose.model<ILevelAssessmentSession>('LevelAssessmentSession', levelAssessmentSessionSchema);

export default LevelAssessmentSession;
