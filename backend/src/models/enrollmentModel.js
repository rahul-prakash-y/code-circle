const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  enrolledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['Individual', 'Team'],
    required: true
  },
  teamName: {
    type: String,
    required: function() { return this.type === 'Team'; }
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return this.type === 'Team'; }
  }],
  attendanceStatus: {
    type: Boolean,
    default: false
  },
  certificateUrl: {
    type: String,
    default: null
  }
}, { timestamps: true });

// Optimized compound indexes for registration checks and query performance
enrollmentSchema.index({ event: 1, enrolledBy: 1 });
enrollmentSchema.index({ event: 1, members: 1 });
enrollmentSchema.index({ enrolledBy: 1, attendanceStatus: 1 });
enrollmentSchema.index({ members: 1, attendanceStatus: 1 });
enrollmentSchema.index({ event: 1, attendanceStatus: 1 });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
