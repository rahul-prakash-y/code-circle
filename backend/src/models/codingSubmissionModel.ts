import mongoose, { Document, Schema, Model } from 'mongoose';
import { SupportedLanguage } from './codingChallengeModel';

export interface IIntegrityEvent {
  type: string;
  timestamp: Date;
  warningNumber: number;
  details?: Record<string, any>;
}

export interface ITestCaseResult {
  testCaseIndex: number;
  passed: boolean;
  stdout?: string;
  stderr?: string;
  isHidden: boolean;
  executionTimeMs?: number;
}

export interface ICodingSubmission extends Document {
  student: mongoose.Types.ObjectId;
  challenge: mongoose.Types.ObjectId;
  language: SupportedLanguage;
  code: string;
  score: number;
  passed: number;
  total: number;
  status: 'passed' | 'failed' | 'compilation_error' | 'runtime_error' | 'timeout';
  isLocked: boolean;
  results: ITestCaseResult[];
  integrityEvents: IIntegrityEvent[];
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const integrityEventSchema = new Schema<IIntegrityEvent>(
  {
    type: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    warningNumber: { type: Number, required: true },
    details: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const testCaseResultSchema = new Schema<ITestCaseResult>(
  {
    testCaseIndex: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    stdout: { type: String, default: '' },
    stderr: { type: String, default: '' },
    isHidden: { type: Boolean, required: true },
    executionTimeMs: { type: Number, default: 0 },
  },
  { _id: false }
);

const codingSubmissionSchema = new Schema<ICodingSubmission>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    challenge: {
      type: Schema.Types.ObjectId,
      ref: 'CodingChallenge',
      required: true,
      index: true,
    },
    language: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    code: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    passed: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['passed', 'failed', 'compilation_error', 'runtime_error', 'timeout'],
      required: true,
    },
    isLocked: {
      type: Boolean,
      default: true,
      index: true,
    },
    results: {
      type: [testCaseResultSchema],
      default: [],
    },
    integrityEvents: {
      type: [integrityEventSchema],
      default: [],
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

codingSubmissionSchema.index({ challenge: 1, student: 1 });
codingSubmissionSchema.index({ student: 1, createdAt: -1 });

export const CodingSubmission: Model<ICodingSubmission> =
  mongoose.models.CodingSubmission ||
  mongoose.model<ICodingSubmission>('CodingSubmission', codingSubmissionSchema);

export default CodingSubmission;
