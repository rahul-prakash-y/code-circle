const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  questions: [{
    questionText: {
      type: String,
      required: true,
    },
    options: [{
      type: String,
      required: true,
    }],
    correctOptionIndex: {
      type: Number,
      required: true,
    },
  }],
  timeLimitMinutes: {
    type: Number,
    required: true,
    default: 30,
  },
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);
