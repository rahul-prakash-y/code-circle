import mongoose, { Document, Schema, Model } from 'mongoose';

export type EventType = 'Technical' | 'Non-Technical' | 'Lecture' | 'Workshop' | 'Individual' | 'Team' | 'Club Hour';
export type EventFormat = 'Individual' | 'Duo' | 'Team';
export type EventStatus = 'Upcoming' | 'Live' | 'Completed' | 'Cancelled';
export type EventRegistrationType = 'open' | 'admin_upload';
export type EventArenaType = 'CODING' | 'MCQ' | 'HYBRID' | 'UI_UX';
export type EventArenaStatus = 'DRAFT' | 'UPCOMING' | 'LIVE' | 'ENDED';

export interface IEventArenaDesignChallenge {
  _id?: any;
  title: string;
  description: string;
  problemStatement?: string;
  designImageUrl?: string;
  additionalImages?: string[];
  referenceFigmaUrl?: string;
  deliverables?: string[];
  guidelines?: string[];
  points?: number;
}

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

export type EventArenaCodingMode = 'ONLY_CODE' | 'TEST_CASES' | 'BOTH';

export interface IEventArenaCodingProblem {
  _id?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  codingMode?: EventArenaCodingMode;
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

export interface IEventArenaAssessment {
  _id?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  type: EventArenaType;
  status: EventArenaStatus;
  durationMinutes: number;
  totalPoints: number;
  passingPercentage: number;
  rules?: string[];
  startTime?: Date;
  endTime?: Date;
  assignedAdmins: mongoose.Types.ObjectId[];
  qualificationCutoffRank?: number; // e.g. 80: only top 80 from prior round qualify
  isTeamMode?: boolean; // round operates in team mode
  teamSize?: number; // expected team size (e.g. 2-4)
  questions: {
    mcqs: IEventArenaMcqQuestion[];
    coding: IEventArenaCodingProblem[];
  };
  designChallenge?: IEventArenaDesignChallenge;
  designChallenges?: IEventArenaDesignChallenge[];
  graceMinutes?: number;
  hasGraceTime?: boolean;
  graceTimeAllGranted?: boolean;
  shuffleQuestions?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IEvent extends Document {
  title: string;
  description: string;
  type: EventType;
  format: EventFormat;
  registrationType?: EventRegistrationType;
  hasArena?: boolean;
  arenaAssessments?: IEventArenaAssessment[];
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
  arenaDesignChallenge?: IEventArenaDesignChallenge;
  startDate: Date;
  endDate: Date;
  eventDays: Date[];
  date?: Date;
  hourlyPoints: number;
  status: EventStatus;
  venueOrLink: string;
  maxParticipants: number;
  maxTeamSize?: number;
  enrolledCount?: number;
  participantsCount?: number;
  registrationDeadline: Date;
  certificateTemplateUrl?: string;
  certificateTemplateId?: mongoose.Types.ObjectId;
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

export const eventArenaAssessmentSchema = new Schema<IEventArenaAssessment>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    type: { type: String, enum: ['CODING', 'MCQ', 'HYBRID', 'UI_UX'], default: 'HYBRID' },
    status: { type: String, enum: ['DRAFT', 'UPCOMING', 'LIVE', 'ENDED'], default: 'LIVE' },
    durationMinutes: { type: Number, default: 60, min: 5 },
    totalPoints: { type: Number, default: 100 },
    passingPercentage: { type: Number, default: 50, min: 0, max: 100 },
    rules: {
      type: [String],
      default: () => [
        'Read all instructions carefully before starting the assessment.',
        'For coding challenges, your code will be executed against test cases.',
        'Submitting or running out of time will automatically record your final answers.',
      ],
    },
    startTime: { type: Date },
    endTime: { type: Date },
    graceMinutes: { type: Number, default: 0, min: 0 },
    hasGraceTime: { type: Boolean, default: false },
    graceTimeAllGranted: { type: Boolean, default: false },
    shuffleQuestions: { type: Boolean, default: true },
    assignedAdmins: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    qualificationCutoffRank: { type: Number, default: 0 },
    isTeamMode: { type: Boolean, default: false },
    teamSize: { type: Number, default: 2 },
    designChallenge: {
      title: { type: String, default: '', trim: true },
      description: { type: String, default: '', trim: true },
      problemStatement: { type: String, default: '', trim: true },
      designImageUrl: { type: String, default: '', trim: true },
      additionalImages: { type: [String], default: [] },
      referenceFigmaUrl: { type: String, default: '', trim: true },
      deliverables: {
        type: [String],
        default: () => ['Figma Interactive Prototype', 'Mobile/Web Screens'],
      },
      guidelines: {
        type: [String],
        default: () => [
          'Design clean, modern UI following the reference image specifications.',
          'Use Figma Auto-layout and component hierarchy.',
          'Ensure link sharing permissions are set to Anyone with the link can view.',
        ],
      },
      points: { type: Number, default: 100 },
    },
    designChallenges: {
      type: [
        {
          title: { type: String, default: '', trim: true },
          description: { type: String, default: '', trim: true },
          problemStatement: { type: String, default: '', trim: true },
          designImageUrl: { type: String, default: '', trim: true },
          additionalImages: { type: [String], default: [] },
          referenceFigmaUrl: { type: String, default: '', trim: true },
          deliverables: {
            type: [String],
            default: () => ['Figma Interactive Prototype', 'Mobile/Web Screens'],
          },
          guidelines: {
            type: [String],
            default: () => [
              'Design clean, modern UI following the reference image specifications.',
              'Use Figma Auto-layout and component hierarchy.',
              'Ensure link sharing permissions are set to Anyone with the link can view.',
            ],
          },
          points: { type: Number, default: 100 },
        },
      ],
      default: [],
    },
    questions: {
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
            codingMode: {
              type: String,
              enum: ['ONLY_CODE', 'TEST_CASES', 'BOTH'],
              default: 'BOTH',
            },
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
  },
  { timestamps: true }
);

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
    arenaAssessments: {
      type: [eventArenaAssessmentSchema],
      default: [],
    },
    arenaType: {
      type: String,
      enum: ['CODING', 'MCQ', 'HYBRID', 'UI_UX'],
      default: 'HYBRID',
    },
    arenaDesignChallenge: {
      title: { type: String, default: '', trim: true },
      description: { type: String, default: '', trim: true },
      problemStatement: { type: String, default: '', trim: true },
      designImageUrl: { type: String, default: '', trim: true },
      additionalImages: { type: [String], default: [] },
      referenceFigmaUrl: { type: String, default: '', trim: true },
      deliverables: {
        type: [String],
        default: () => ['Figma Interactive Prototype', 'Mobile/Web Screens'],
      },
      guidelines: {
        type: [String],
        default: () => [
          'Design clean, modern UI following the reference image specifications.',
          'Use Figma Auto-layout and component hierarchy.',
          'Ensure link sharing permissions are set to Anyone with the link can view.',
        ],
      },
      points: { type: Number, default: 100 },
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
            codingMode: {
              type: String,
              enum: ['ONLY_CODE', 'TEST_CASES', 'BOTH'],
              default: 'BOTH',
            },
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
    startDate: {
      type: Date,
      required: [true, 'Event start date is required'],
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, 'Event end date is required'],
      index: true,
    },
    eventDays: {
      type: [Date],
      default: [],
      index: true,
    },
    date: {
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
    certificateTemplateId: {
      type: Schema.Types.ObjectId,
      ref: 'CertificateTemplate',
      default: null,
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

// Multi-day date synchronization and backward compatibility pre-save hook:
eventSchema.pre('save', function () {
  if (this.type === 'Individual' || this.type === 'Team') {
    this.format = this.type as EventFormat;
    this.type = 'Technical';
  }

  // Fallbacks between legacy date and multi-day startDate / endDate
  if (!this.startDate && this.date) {
    this.startDate = this.date;
  }
  if (!this.endDate) {
    this.endDate = this.startDate || this.date;
  }
  if (!this.date && this.startDate) {
    this.date = this.startDate;
  }

  // Auto-populate eventDays array if empty (e.g., 5-day continuous event)
  if ((!this.eventDays || this.eventDays.length === 0) && this.startDate && this.endDate) {
    const days: Date[] = [];
    const current = new Date(this.startDate);
    current.setHours(0, 0, 0, 0);
    const end = new Date(this.endDate);
    end.setHours(0, 0, 0, 0);

    // Generate up to 30 continuous event days safely
    let safetyCounter = 0;
    while (current <= end && safetyCounter < 30) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
      safetyCounter++;
    }

    if (days.length > 0) {
      this.eventDays = days;
    }
  }

  if (this.hourlyPoints === undefined || this.hourlyPoints === null) {
    this.hourlyPoints = 50;
  }
});

// Optimized query indexes for multi-day events and status lookups
eventSchema.index({ startDate: 1, endDate: 1, status: 1 });
eventSchema.index({ eventDays: 1 });
eventSchema.index({ date: 1, status: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ type: 1 });
eventSchema.index({ format: 1 });
eventSchema.index({ registrationDeadline: 1 });
eventSchema.index({ createdBy: 1 });

const Event: Model<IEvent> = mongoose.models.Event || mongoose.model<IEvent>('Event', eventSchema);

export default Event;
