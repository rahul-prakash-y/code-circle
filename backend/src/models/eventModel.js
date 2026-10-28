const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  startDate: { 
    type: Date 
  },
  endDate: { 
    type: Date 
  },
  hourlyPoints: { 
    type: Number, 
    default: 50,
    min: 0 
  },
  venueOrLink: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['Technical', 'Non-Technical', 'Lecture', 'Workshop', 'Individual', 'Team', 'Club Hour'], 
    required: true 
  },
  registrationType: {
    type: String,
    enum: ['open', 'admin_upload'],
    default: 'open'
  },
  hasArena: {
    type: Boolean,
    default: false,
    index: true
  },
  arenaType: {
    type: String,
    enum: ['CODING', 'MCQ', 'HYBRID'],
    default: 'HYBRID'
  },
  arenaStatus: {
    type: String,
    enum: ['DRAFT', 'UPCOMING', 'LIVE', 'ENDED'],
    default: 'LIVE'
  },
  arenaDurationMinutes: {
    type: Number,
    default: 60
  },
  arenaTotalPoints: {
    type: Number,
    default: 100
  },
  arenaPassingPercentage: {
    type: Number,
    default: 50
  },
  arenaRules: {
    type: [String],
    default: () => [
      'Read all instructions carefully before starting the assessment.',
      'For coding challenges, your code will be executed against test cases.',
      'Submitting or running out of time will automatically record your final answers.'
    ]
  },
  arenaStartTime: {
    type: Date
  },
  arenaEndTime: {
    type: Date
  },
  arenaAdmins: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  arenaQuestions: {
    mcqs: {
      type: [
        {
          question: { type: String, required: true, trim: true },
          options: [{ type: String, required: true, trim: true }],
          correctOptionIndex: { type: Number, required: true, min: 0 },
          points: { type: Number, default: 10, min: 1 },
          explanation: { type: String, default: '', trim: true }
        }
      ],
      default: []
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
            default: ['python', 'javascript', 'cpp', 'java', 'c']
          },
          starterCode: {
            type: Map,
            of: String,
            default: () => ({
              python: '# Write solution here\n',
              javascript: '// Write solution here\n',
              cpp: '#include <iostream>\nusing namespace std;\nint main() {\n  return 0;\n}\n',
              java: 'import java.util.*;\npublic class Main {\n  public static void main(String[] args) {\n  }\n}\n',
              c: '#include <stdio.h>\nint main() {\n  return 0;\n}\n'
            })
          },
          sampleInput: { type: String, default: '' },
          sampleOutput: { type: String, default: '' },
          testCases: [
            {
              input: { type: String, default: '' },
              expectedOutput: { type: String, required: true },
              isHidden: { type: Boolean, default: false }
            }
          ]
        }
      ],
      default: []
    }
  },
  maxParticipants: { 
    type: Number,
    default: 0
  },
  maxTeamSize: {
    type: Number,
    default: 4
  },
  registrationDeadline: { 
    type: Date, 
    required: true 
  },
  certificateTemplateUrl: {
    type: String,
    default: '',
    trim: true
  },
  customFields: [
    {
      id: { type: String },
      label: { type: String, required: true },
      type: {
        type: String,
        enum: ['text', 'select', 'number', 'textarea', 'checkbox'],
        default: 'text'
      },
      options: [{ type: String }],
      required: { type: Boolean, default: false },
      placeholder: { type: String, default: '' }
    }
  ],
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Optimized query indexes for event filtering and deadlines
eventSchema.index({ date: 1, type: 1 });
eventSchema.index({ registrationDeadline: 1 });
eventSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Event', eventSchema);
