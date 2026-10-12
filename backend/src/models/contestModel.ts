import mongoose, { Document, Schema, Model } from 'mongoose';

export type ContestType = 'CODING' | 'MCQ' | 'HYBRID';
export type ContestDifficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
export type ContestStatus = 'UPCOMING' | 'LIVE' | 'ENDED' | 'DRAFT';
export type PointAllocationMode = 'AUTOMATIC' | 'MANUAL' | 'HYBRID';

export interface IMCQQuestion {
  _id?: mongoose.Types.ObjectId;
  question: string;
  options: string[];
  correctOptionIndex: number; // 0-indexed
  points: number;
  explanation?: string;
}

export interface ICodingProblemTestCase {
  _id?: mongoose.Types.ObjectId;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface ICodingProblem {
  _id?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  inputFormat?: string;
  outputFormat?: string;
  constraints?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  points: number;
  allowedLanguages: string[];
  starterCode: Map<string, string> | Record<string, string>;
  sampleInput?: string;
  sampleOutput?: string;
  testCases: ICodingProblemTestCase[];
}

export interface IContest extends Document {
  title: string;
  slug: string;
  description: string;
  type: ContestType;
  difficulty: ContestDifficulty;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  totalPoints: number;
  status: ContestStatus;
  pointAllocationMode: PointAllocationMode;
  rules: string[];
  bannerUrl?: string;
  tags: string[];
  mcqQuestions: IMCQQuestion[];
  codingProblems: ICodingProblem[];
  isPublished: boolean;
  participantsCount: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const mcqQuestionSchema = new Schema<IMCQQuestion>(
  {
    question: { type: String, required: true, trim: true },
    options: [{ type: String, required: true, trim: true }],
    correctOptionIndex: { type: Number, required: true, min: 0 },
    points: { type: Number, default: 10, min: 1 },
    explanation: { type: String, default: '', trim: true },
  },
  { _id: true }
);

const codingTestCaseSchema = new Schema<ICodingProblemTestCase>(
  {
    input: { type: String, default: '' },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: false },
  },
  { _id: true }
);

const codingProblemSchema = new Schema<ICodingProblem>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    inputFormat: { type: String, default: '' },
    outputFormat: { type: String, default: '' },
    constraints: { type: String, default: '' },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    points: { type: Number, default: 30, min: 1 },
    allowedLanguages: {
      type: [String],
      default: ['python', 'javascript', 'cpp', 'java', 'c'],
    },
    starterCode: {
      type: Map,
      of: String,
      default: () => ({
        python: '# Write your code here\n',
        javascript: '// Write your code here\n',
        cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}\n',
        java: 'import java.util.Scanner;\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}\n',
        c: '#include <stdio.h>\n\nint main() {\n    // Write your code here\n    return 0;\n}\n',
      }),
    },
    sampleInput: { type: String, default: '' },
    sampleOutput: { type: String, default: '' },
    testCases: [codingTestCaseSchema],
  },
  { _id: true }
);

const contestSchema = new Schema<IContest>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, required: true, trim: true },
    type: { type: String, enum: ['CODING', 'MCQ', 'HYBRID'], default: 'CODING', required: true },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
      default: 'All Levels',
    },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, required: true, default: 60, min: 5 },
    totalPoints: { type: Number, default: 100, min: 1 },
    pointAllocationMode: {
      type: String,
      enum: ['AUTOMATIC', 'MANUAL', 'HYBRID'],
      default: 'AUTOMATIC',
    },
    status: {
      type: String,
      enum: ['UPCOMING', 'LIVE', 'ENDED', 'DRAFT'],
      default: 'UPCOMING',
      index: true,
    },
    rules: {
      type: [String],
      default: [
        'Once started, the timer cannot be paused.',
        'Submissions are scored on accuracy and test case completion.',
        'Final points will be credited to your student profile leaderboard.',
      ],
    },
    bannerUrl: { type: String, default: '' },
    tags: { type: [String], default: ['Weekly Contest', 'Code Circle'] },
    mcqQuestions: [mcqQuestionSchema],
    codingProblems: [codingProblemSchema],
    isPublished: { type: Boolean, default: true, index: true },
    participantsCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Contest: Model<IContest> =
  mongoose.models.Contest || mongoose.model<IContest>('Contest', contestSchema);

export default Contest;
