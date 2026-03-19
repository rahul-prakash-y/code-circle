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

module.exports = mongoose.model('Submission', submissionSchema);
