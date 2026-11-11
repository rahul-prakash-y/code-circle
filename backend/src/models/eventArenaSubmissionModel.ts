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
  codingMode?: 'ONLY_CODE' | 'TEST_CASES';
  testCasesPassed: number;
  totalTestCases: number;
  pointsEarned: number;
  status:
    | 'SUBMITTED'
    | 'PENDING'
    | 'ACCEPTED'
    | 'WRONG_ANSWER'
    | 'TIME_LIMIT_EXCEEDED'
    | 'RUNTIME_ERROR'
    | 'COMPILATION_ERROR';
  executionTimeMs?: number;
  isEvaluated?: boolean;
  evaluatedBy?: mongoose.Types.ObjectId;
  evaluatedAt?: Date;
  feedback?: string;
}

export interface IDesignSubmissionItem {
  selectedChallengeId?: string;
  selectedChallengeTitle?: string;
  figmaLink: string;
  figmaFileUrl?: string;
  notes?: string;
  previewImageUrl?: string;
  submittedAt: Date;
  pointsEarned?: number;
  feedback?: string;
  isEvaluated?: boolean;
  evaluatedBy?: mongoose.Types.ObjectId;
  evaluatedAt?: Date;
}

export interface IEventArenaSubmission extends Document {
  eventId: mongoose.Types.ObjectId;
  assessmentId: string;
  userId: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId;
  teamName?: string;
  status: EventArenaSubmissionStatus;
  startedAt: Date;
  submittedAt?: Date;
  timeTakenSeconds?: number;
  mcqAnswers: IMCQAnswer[];
  codingSubmissions: ICodingSubmissionItem[];
  designSubmission?: IDesignSubmissionItem;
  mcqScore: number;
  codingScore: number;
  designScore: number;
  rawTotalScore: number;
  tabSwitchCount: number;
  tabSwitchPenaltyPercentage: number;
  totalScore: number;
  maxPossibleScore: number;
  scorePercentage: number;
  isPassed: boolean;
  pointsAwarded?: boolean;
  pointsAwardedAmount?: number;
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
    codingMode: {
      type: String,
      enum: ['ONLY_CODE', 'TEST_CASES'],
      default: 'TEST_CASES',
    },
    testCasesPassed: { type: Number, default: 0 },
    totalTestCases: { type: Number, default: 0 },
    pointsEarned: { type: Number, default: 0 },
    status: {
      type: String,
      enum: [
        'SUBMITTED',
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
    isEvaluated: { type: Boolean, default: false },
    evaluatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    evaluatedAt: { type: Date },
    feedback: { type: String, default: '' },
  },
  { _id: false }
);

const designSubmissionItemSchema = new Schema<IDesignSubmissionItem>(
  {
    selectedChallengeId: { type: String, default: '' },
    selectedChallengeTitle: { type: String, default: '' },
    figmaLink: { type: String, required: true },
    figmaFileUrl: { type: String, default: '' },
    notes: { type: String, default: '' },
    previewImageUrl: { type: String, default: '' },
    submittedAt: { type: Date, default: Date.now },
    pointsEarned: { type: Number, default: 0 },
    feedback: { type: String, default: '' },
    isEvaluated: { type: Boolean, default: false },
    evaluatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    evaluatedAt: { type: Date },
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
    assessmentId: {
      type: String,
      default: 'default',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
      index: true,
    },
    teamName: {
      type: String,
      default: '',
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
    timeTakenSeconds: {
      type: Number,
      default: 0,
    },
    mcqAnswers: {
      type: [mcqAnswerSchema],
      default: [],
    },
    codingSubmissions: {
      type: [codingSubmissionItemSchema],
      default: [],
    },
    designSubmission: {
      type: designSubmissionItemSchema,
      default: null,
    },
    mcqScore: {
      type: Number,
      default: 0,
    },
    codingScore: {
      type: Number,
      default: 0,
    },
    designScore: {
      type: Number,
      default: 0,
    },
    rawTotalScore: {
      type: Number,
      default: 0,
    },
    tabSwitchCount: {
      type: Number,
      default: 0,
    },
    tabSwitchPenaltyPercentage: {
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
    pointsAwarded: {
      type: Boolean,
      default: false,
    },
    pointsAwardedAmount: {
      type: Number,
      default: 0,
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

eventArenaSubmissionSchema.index({ eventId: 1, assessmentId: 1, userId: 1 }, { unique: true });
eventArenaSubmissionSchema.index({ eventId: 1, assessmentId: 1, totalScore: -1, submittedAt: 1 });

const EventArenaSubmission: Model<IEventArenaSubmission> =
  mongoose.models.EventArenaSubmission ||
  mongoose.model<IEventArenaSubmission>('EventArenaSubmission', eventArenaSubmissionSchema);

export default EventArenaSubmission;
