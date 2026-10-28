import mongoose, { Document, Schema, Model } from 'mongoose';

export type EventType = 'Technical' | 'Non-Technical' | 'Lecture' | 'Workshop' | 'Individual' | 'Team' | 'Club Hour';
export type EventFormat = 'Individual' | 'Duo' | 'Team';
export type EventStatus = 'Upcoming' | 'Live' | 'Completed' | 'Cancelled';
export type EventRegistrationType = 'open' | 'admin_upload';
export type EventArenaType = 'CODING' | 'MCQ' | 'HYBRID';
export type EventArenaStatus = 'DRAFT' | 'UPCOMING' | 'LIVE' | 'ENDED';

export interface IEventArenaMcqQuestion {
  _id?: mongoose.Types.ObjectId;
  question: string;
  options: string[];
  correctOptionIndex: number;
  points: number;
  explanation?: string;
}

export interface IEventArenaCodingTestCase {
  _id?: mongoose.Types.ObjectId;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface IEventArenaCodingProblem {
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
  testCases: IEventArenaCodingTestCase[];
}

export interface IEvent extends Document {
  title: string;
  description: string;
  type: EventType;
  format: EventFormat;
  registrationType?: EventRegistrationType;
  hasArena?: boolean;
  arenaType?: EventArenaType;
  arenaStatus?: EventArenaStatus;
  arenaDurationMinutes?: number;
  arenaTotalPoints?: number;
  arenaPassingPercentage?: number;
  arenaRules?: string[];
  arenaStartTime?: Date;
  arenaEndTime?: Date;
  arenaAdmins?: mongoose.Types.ObjectId[];
  arenaQuestions?: {
    mcqs: IEventArenaMcqQuestion[];
    coding: IEventArenaCodingProblem[];
  };
  date: Date;
  startDate: Date;
  endDate: Date;
  hourlyPoints: number;
  status: EventStatus;
  venueOrLink: string;
  maxParticipants: number;
  maxTeamSize?: number;
  enrolledCount?: number;
  participantsCount?: number;
  registrationDeadline: Date;
  certificateTemplateUrl?: string;
  customFields?: ICustomField[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomField {
  id?: string;
  label: string;
  type: 'text' | 'select' | 'number' | 'textarea' | 'checkbox';
  options?: string[];
  required?: boolean;
  placeholder?: string;
}

const eventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['Technical', 'Non-Technical', 'Lecture', 'Workshop', 'Individual', 'Team', 'Club Hour'],
      default: 'Technical',
      required: true,
    },
    format: {
      type: String,
      enum: ['Individual', 'Duo', 'Team'],
      default: 'Individual',
      required: true,
    },
    registrationType: {
      type: String,
      enum: ['open', 'admin_upload'],
      default: 'open',
    },
    hasArena: {
      type: Boolean,
      default: false,
      index: true,
    },
    arenaType: {
      type: String,
      enum: ['CODING', 'MCQ', 'HYBRID'],
      default: 'HYBRID',
    },
    arenaStatus: {
      type: String,
      enum: ['DRAFT', 'UPCOMING', 'LIVE', 'ENDED'],
      default: 'LIVE',
    },
    arenaDurationMinutes: {
      type: Number,
      default: 60,
      min: [5, 'Duration must be at least 5 minutes'],
    },
    arenaTotalPoints: {
      type: Number,
      default: 100,
    },
    arenaPassingPercentage: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    arenaRules: {
      type: [String],
      default: () => [
        'Read all instructions carefully before starting the assessment.',
        'For coding challenges, your code will be executed against test cases.',
        'Submitting or running out of time will automatically record your final answers.',
      ],
    },
    arenaStartTime: {
      type: Date,
    },
    arenaEndTime: {
      type: Date,
    },
    arenaAdmins: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    arenaQuestions: {
      mcqs: {
        type: [
          {
            question: { type: String, required: true, trim: true },
            options: [{ type: String, required: true, trim: true }],
            correctOptionIndex: { type: Number, required: true, min: 0 },
            points: { type: Number, default: 10, min: 1 },
            explanation: { type: String, default: '', trim: true },
          },
        ],
        default: [],
      },
      coding: {
        type: [
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
                python: '# Write solution here\n',
                javascript: '// Write solution here\n',
                cpp: '#include <iostream>\nusing namespace std;\nint main() {\n  return 0;\n}\n',
                java: 'import java.util.*;\npublic class Main {\n  public static void main(String[] args) {\n  }\n}\n',
                c: '#include <stdio.h>\nint main() {\n  return 0;\n}\n',
              }),
            },
            sampleInput: { type: String, default: '' },
            sampleOutput: { type: String, default: '' },
            testCases: [
              {
                input: { type: String, default: '' },
                expectedOutput: { type: String, required: true },
                isHidden: { type: Boolean, default: false },
              },
            ],
          },
        ],
        default: [],
      },
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    hourlyPoints: {
      type: Number,
      default: 50,
      min: [0, 'Hourly points cannot be negative'],
    },
    status: {
      type: String,
      enum: ['Upcoming', 'Live', 'Completed', 'Cancelled'],
      default: 'Upcoming',
    },
    venueOrLink: {
      type: String,
      default: 'Campus / Online',
      trim: true,
    },
    maxParticipants: {
      type: Number,
      default: 0,
    },
    maxTeamSize: {
      type: Number,
      default: 4,
    },
    registrationDeadline: {
      type: Date,
      default: function (this: IEvent) {
        return this.date || new Date();
      },
    },
    certificateTemplateUrl: {
      type: String,
      default: '',
      trim: true,
    },
    customFields: [
      {
        id: { type: String },
        label: { type: String, required: true },
        type: {
          type: String,
          enum: ['text', 'select', 'number', 'textarea', 'checkbox'],
          default: 'text',
        },
        options: [{ type: String }],
        required: { type: Boolean, default: false },
        placeholder: { type: String, default: '' },
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Backward compatibility and date sync pre-save hook:
eventSchema.pre('save', function () {
  if (this.type === 'Individual' || this.type === 'Team') {
    this.format = this.type as EventFormat;
    this.type = 'Technical';
  }
  if (!this.startDate && this.date) {
    this.startDate = this.date;
  }
  if (!this.date && this.startDate) {
    this.date = this.startDate;
  }
  if (!this.endDate) {
    this.endDate = this.startDate || this.date;
  }
  if (this.hourlyPoints === undefined || this.hourlyPoints === null) {
    this.hourlyPoints = 50;
  }
});

// Optimized query indexes
eventSchema.index({ date: 1, status: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ type: 1 });
eventSchema.index({ format: 1 });
eventSchema.index({ registrationDeadline: 1 });
eventSchema.index({ createdBy: 1 });

const Event: Model<IEvent> = mongoose.models.Event || mongoose.model<IEvent>('Event', eventSchema);

export default Event;
