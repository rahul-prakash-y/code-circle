import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IQuestQuestion {
  _id?: mongoose.Types.ObjectId;
  question: string;
  options: string[];
  correctOption: number;
}

export interface IStudyMaterial {
  _id?: mongoose.Types.ObjectId;
  title: string;
  type: 'article' | 'link' | 'code' | 'notes' | 'pdf';
  url?: string;
  content?: string;
}

export interface ILevel extends Document {
  domainId: mongoose.Types.ObjectId;
  levelNumber: number;
  title: string;
  youtubeVideoId: string;
  studyMaterials: IStudyMaterial[];
  questQuestions: IQuestQuestion[];
  assessmentId?: mongoose.Types.ObjectId | null;
  codingChallengeId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const studyMaterialSchema = new Schema<IStudyMaterial>(
  {
    title: {
      type: String,
      required: [true, 'Material title is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['article', 'link', 'code', 'notes', 'pdf'],
      default: 'notes',
    },
    url: {
      type: String,
      trim: true,
      default: '',
    },
    content: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const questQuestionSchema = new Schema<IQuestQuestion>(
  {
    question: {
      type: String,
      required: [true, 'Question prompt is required'],
      trim: true,
    },
    options: {
      type: [String],
      required: [true, 'Options are required'],
      validate: {
        validator: (opts: string[]) => Array.isArray(opts) && opts.length >= 2,
        message: 'Each quest question must have at least 2 options',
      },
    },
    correctOption: {
      type: Number,
      required: [true, 'Correct option index is required'],
      min: [0, 'Correct option index cannot be negative'],
    },
  },
  { _id: true }
);

const levelSchema = new Schema<ILevel>(
  {
    domainId: {
      type: Schema.Types.ObjectId,
      ref: 'Domain',
      required: [true, 'Domain reference is required'],
      index: true,
    },
    levelNumber: {
      type: Number,
      required: [true, 'Level number is required'],
      min: [1, 'Level number must be at least 1'],
    },
    title: {
      type: String,
      required: [true, 'Level title is required'],
      trim: true,
    },
    youtubeVideoId: {
      type: String,
      required: [true, 'YouTube video ID is required'],
      trim: true,
    },
    studyMaterials: {
      type: [studyMaterialSchema],
      default: [],
    },
    questQuestions: {
      type: [questQuestionSchema],
      required: [true, 'Quest questions are required'],
      validate: {
        validator: (questions: IQuestQuestion[]) => Array.isArray(questions) && questions.length > 0,
        message: 'A level must have quest questions configured',
      },
    },
    assessmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assessment',
      default: null,
      index: true,
    },
    codingChallengeId: {
      type: Schema.Types.ObjectId,
      ref: 'CodingChallenge',
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

levelSchema.index({ domainId: 1, levelNumber: 1 }, { unique: true });

const Level: Model<ILevel> =
  mongoose.models.Level || mongoose.model<ILevel>('Level', levelSchema);

export default Level;
