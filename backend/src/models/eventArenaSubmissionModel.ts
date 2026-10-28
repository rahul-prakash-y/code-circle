import mongoose, { Document, Schema, Model } from 'mongoose';

export type EventArenaSubmissionStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED';

export interface IMCQAnswer {
  questionId: string;
  selectedOptionIndex: number;
  isCorrect?: boolean;
  pointsEarned?: number;
}

export interface ICodingSubmissionItem {
  problemId: string;
  language: string;
  code: string;
  testCasesPassed: number;
  totalTestCases: number;
  pointsEarned: number;
  status:
    | 'PENDING'
    | 'ACCEPTED'
    | 'WRONG_ANSWER'
    | 'TIME_LIMIT_EXCEEDED'
    | 'RUNTIME_ERROR'
    | 'COMPILATION_ERROR';
  executionTimeMs?: number;
}

export interface IEventArenaSubmission extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: EventArenaSubmissionStatus;
  startedAt: Date;
  submittedAt?: Date;
  mcqAnswers: IMCQAnswer[];
  codingSubmissions: ICodingSubmissionItem[];
  mcqScore: number;
  codingScore: number;
  totalScore: number;
  maxPossibleScore: number;
  scorePercentage: number;
  isPassed: boolean;
  integrityEvents: Array<{
    type: string;
    timestamp: Date;
    details?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const mcqAnswerSchema = new Schema<IMCQAnswer>(
  {
    questionId: { type: String, required: true },
    selectedOptionIndex: { type: Number, required: true },
    isCorrect: { type: Boolean, default: false },
    pointsEarned: { type: Number, default: 0 },
  },
  { _id: false }
);

const codingSubmissionItemSchema = new Schema<ICodingSubmissionItem>(
  {
    problemId: { type: String, required: true },
    language: { type: String, required: true },
    code: { type: String, required: true },
    testCasesPassed: { type: Number, default: 0 },
    totalTestCases: { type: Number, default: 0 },
    pointsEarned: { type: Number, default: 0 },
    status: {
      type: String,
      enum: [
        'PENDING',
        'ACCEPTED',
        'WRONG_ANSWER',
        'TIME_LIMIT_EXCEEDED',
        'RUNTIME_ERROR',
        'COMPILATION_ERROR',
      ],
      default: 'PENDING',
    },
    executionTimeMs: { type: Number, default: 0 },
  },
  { _id: false }
);

const eventArenaSubmissionSchema = new Schema<IEventArenaSubmission>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED'],
      default: 'IN_PROGRESS',
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    submittedAt: {
      type: Date,
    },
    mcqAnswers: {
      type: [mcqAnswerSchema],
      default: [],
    },
    codingSubmissions: {
      type: [codingSubmissionItemSchema],
      default: [],
    },
    mcqScore: {
      type: Number,
      default: 0,
    },
    codingScore: {
      type: Number,
      default: 0,
    },
    totalScore: {
      type: Number,
      default: 0,
    },
    maxPossibleScore: {
      type: Number,
      default: 100,
    },
    scorePercentage: {
      type: Number,
      default: 0,
    },
    isPassed: {
      type: Boolean,
      default: false,
    },
    integrityEvents: [
      {
        type: { type: String },
        timestamp: { type: Date, default: Date.now },
        details: { type: String, default: '' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

eventArenaSubmissionSchema.index({ eventId: 1, userId: 1 }, { unique: true });
eventArenaSubmissionSchema.index({ eventId: 1, totalScore: -1, submittedAt: 1 });

const EventArenaSubmission: Model<IEventArenaSubmission> =
  mongoose.models.EventArenaSubmission ||
  mongoose.model<IEventArenaSubmission>('EventArenaSubmission', eventArenaSubmissionSchema);

export default EventArenaSubmission;
