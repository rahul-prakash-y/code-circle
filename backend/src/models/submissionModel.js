const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  languageId: {
    type: Number,
    required: true, // Matching Judge0 spec (e.g., 62 for Java, 63 for JavaScript)
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Wrong Answer', 'Error', 'Time Limit Exceeded', 'Memory Limit Exceeded'],
    default: 'Pending',
  },
  results: [{
    testCaseId: mongoose.Schema.Types.ObjectId,
    status: String,
    stdout: String,
    stderr: String,
    time: Number,
    memory: Number,
  }],
}, { timestamps: true });

// Optimized indexes for submission tracking and leaderboard queries
submissionSchema.index({ user: 1, status: 1 });
submissionSchema.index({ problem: 1, status: 1 });
submissionSchema.index({ user: 1, problem: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
