import mongoose, { Document, Schema, Model } from 'mongoose';

export type ContestSubmissionStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_EXPIRED';

export interface IMCQAnswerRecord {
  questionId: mongoose.Types.ObjectId;
  selectedOption: number;
  isCorrect: boolean;
  pointsEarned: number;
}

export interface ICodingSubmissionRecord {
  problemId: mongoose.Types.ObjectId;
  code: string;
  language: string;
  passedTestCases: number;
  totalTestCases: number;
  status: 'ACCEPTED' | 'WRONG_ANSWER' | 'COMPILATION_ERROR' | 'TIME_LIMIT_EXCEEDED' | 'PENDING';
  pointsEarned: number;
  submittedAt: Date;
}

export interface IContestSubmission extends Document {
  contestId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  startedAt: Date;
  submittedAt?: Date;
  expiresAt: Date;
  status: ContestSubmissionStatus;
  mcqAnswers: IMCQAnswerRecord[];
  codingSubmissions: ICodingSubmissionRecord[];
  totalScore: number;
  timeTakenSeconds: number;
  rank?: number;
  pointsAwarded: boolean;
  awardedClubPoints: number;
  manualPointsAdjustment?: number;
  manualPointsReason?: string;
  manualAllocatedBy?: mongoose.Types.ObjectId;
  manualAllocatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const mcqAnswerSchema = new Schema<IMCQAnswerRecord>(
  {
    questionId: { type: Schema.Types.ObjectId, required: true },
    selectedOption: { type: Number, required: true },
    isCorrect: { type: Boolean, default: false },
    pointsEarned: { type: Number, default: 0 },
  },
  { _id: false }
);

const codingSubmissionSchema = new Schema<ICodingSubmissionRecord>(
  {
    problemId: { type: Schema.Types.ObjectId, required: true },
    code: { type: String, default: '' },
    language: { type: String, default: 'python' },
    passedTestCases: { type: Number, default: 0 },
    totalTestCases: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['ACCEPTED', 'WRONG_ANSWER', 'COMPILATION_ERROR', 'TIME_LIMIT_EXCEEDED', 'PENDING'],
      default: 'PENDING',
    },
    pointsEarned: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const contestSubmissionSchema = new Schema<IContestSubmission>(
  {
    contestId: { type: Schema.Types.ObjectId, ref: 'Contest', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'SUBMITTED', 'AUTO_EXPIRED'],
      default: 'IN_PROGRESS',
      index: true,
    },
    mcqAnswers: [mcqAnswerSchema],
    codingSubmissions: [codingSubmissionSchema],
    totalScore: { type: Number, default: 0, index: true },
    timeTakenSeconds: { type: Number, default: 0 },
    rank: { type: Number, default: 0 },
    pointsAwarded: { type: Boolean, default: false },
    awardedClubPoints: { type: Number, default: 0 },
    manualPointsAdjustment: { type: Number, default: 0 },
    manualPointsReason: { type: String, default: '' },
    manualAllocatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    manualAllocatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// One submission session per user per contest
contestSubmissionSchema.index({ contestId: 1, userId: 1 }, { unique: true });
contestSubmissionSchema.index({ contestId: 1, totalScore: -1, timeTakenSeconds: 1 });

export const ContestSubmission: Model<IContestSubmission> =
  mongoose.models.ContestSubmission ||
  mongoose.model<IContestSubmission>('ContestSubmission', contestSubmissionSchema);

export default ContestSubmission;
