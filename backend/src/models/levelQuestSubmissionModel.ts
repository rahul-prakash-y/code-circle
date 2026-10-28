import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ILevelQuestAnswer {
  questionIndex: number;
  selectedOption: number;
}

export interface ILevelQuestDetailedResult {
  questionIndex: number;
  question: string;
  selectedOption: number;
  correctOption: number;
  isCorrect: boolean;
}

export interface ILevelQuestSubmission extends Document {
  level: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  domain: mongoose.Types.ObjectId;
  answers: ILevelQuestAnswer[];
  detailedResults: ILevelQuestDetailedResult[];
  score: number;
  total: number;
  passRate: number;
  passed: boolean;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const levelQuestAnswerSchema = new Schema<ILevelQuestAnswer>(
  {
    questionIndex: { type: Number, required: true },
    selectedOption: { type: Number, required: true },
  },
  { _id: false }
);

const levelQuestDetailedResultSchema = new Schema<ILevelQuestDetailedResult>(
  {
    questionIndex: { type: Number, required: true },
    question: { type: String, required: true },
    selectedOption: { type: Number, required: true },
    correctOption: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false }
);

const levelQuestSubmissionSchema = new Schema<ILevelQuestSubmission>(
  {
    level: {
      type: Schema.Types.ObjectId,
      ref: 'Level',
      required: true,
      index: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    domain: {
      type: Schema.Types.ObjectId,
      ref: 'Domain',
      required: true,
      index: true,
    },
    answers: {
      type: [levelQuestAnswerSchema],
      default: [],
    },
    detailedResults: {
      type: [levelQuestDetailedResultSchema],
      default: [],
    },
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      default: 0,
    },
    passRate: {
      type: Number,
      required: true,
      default: 0,
    },
    passed: {
      type: Boolean,
      required: true,
      default: false,
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

levelQuestSubmissionSchema.index({ level: 1, student: 1 });

const LevelQuestSubmission: Model<ILevelQuestSubmission> =
  mongoose.models.LevelQuestSubmission ||
  mongoose.model<ILevelQuestSubmission>('LevelQuestSubmission', levelQuestSubmissionSchema);

export default LevelQuestSubmission;
