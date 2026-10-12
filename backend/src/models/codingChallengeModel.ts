import mongoose, { Document, Schema, Model } from 'mongoose';

export type SupportedLanguage = 'c' | 'cpp' | 'python' | 'java' | 'javascript';

export const SUPPORTED_LANGUAGES: readonly SupportedLanguage[] = [
  'c',
  'cpp',
  'python',
  'java',
  'javascript',
] as const;

export interface ITestCase {
  _id?: mongoose.Types.ObjectId;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface ICodingChallenge extends Document {
  title: string;
  description: string;
  inputFormat?: string;
  outputFormat?: string;
  constraints?: string;
  sampleInput?: string;
  sampleOutput?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  allowedLanguages: SupportedLanguage[];
  starterCode: Map<string, string>;
  testCases: ITestCase[];
  timeLimitMinutes?: number;
  singleSubmissionOnly?: boolean;
  isPublished?: boolean;
  isCourseChallenge?: boolean;
  domainId?: mongoose.Types.ObjectId | null;
  levelId?: mongoose.Types.ObjectId | null;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const testCaseSchema = new Schema<ITestCase>(
  {
    input: {
      type: String,
      default: '',
    },
    expectedOutput: {
      type: String,
      required: [true, 'Expected output is required'],
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const codingChallengeSchema = new Schema<ICodingChallenge>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    inputFormat: {
      type: String,
      default: '',
      trim: true,
    },
    outputFormat: {
      type: String,
      default: '',
      trim: true,
    },
    constraints: {
      type: String,
      default: '',
      trim: true,
    },
    sampleInput: {
      type: String,
      default: '',
    },
    sampleOutput: {
      type: String,
      default: '',
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
    },
    allowedLanguages: {
      type: [String],
      required: [true, 'Allowed languages are required'],
      validate: {
        validator: function (langs: string[]) {
          if (!Array.isArray(langs) || langs.length === 0) return false;
          return langs.every((l) =>
            SUPPORTED_LANGUAGES.includes(l.toLowerCase().trim() as SupportedLanguage)
          );
        },
        message:
          'allowedLanguages must only contain supported languages: c, cpp, python, java, javascript',
      },
      set: (langs: string[]) =>
        Array.isArray(langs)
          ? langs.map((l) => l.toLowerCase().trim() as SupportedLanguage)
          : [],
    },
    starterCode: {
      type: Map,
      of: String,
      default: () => new Map<string, string>(),
    },
    testCases: {
      type: [testCaseSchema],
      required: [true, 'At least one test case is required'],
      validate: {
        validator: (tc: ITestCase[]) => Array.isArray(tc) && tc.length > 0,
        message: 'At least one test case must be provided',
      },
    },
    timeLimitMinutes: {
      type: Number,
      default: 45,
      min: [1, 'Time limit must be at least 1 minute'],
    },
    singleSubmissionOnly: {
      type: Boolean,
      default: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    isCourseChallenge: {
      type: Boolean,
      default: false,
      index: true,
    },
    domainId: {
      type: Schema.Types.ObjectId,
      ref: 'Domain',
      default: null,
      index: true,
    },
    levelId: {
      type: Schema.Types.ObjectId,
      ref: 'Level',
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for query optimization
codingChallengeSchema.index({ isPublished: 1, createdAt: -1 });
codingChallengeSchema.index({ isCourseChallenge: 1, createdAt: -1 });

export const CodingChallenge: Model<ICodingChallenge> =
  mongoose.models.CodingChallenge ||
  mongoose.model<ICodingChallenge>('CodingChallenge', codingChallengeSchema);

export default CodingChallenge;
