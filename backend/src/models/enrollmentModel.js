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

// Ensure a user can only enroll once in an event (as individual or in any team)
// This unique index might be complex because of the members array.
// Better to handle this via controller logic as requested.

module.exports = mongoose.model('Enrollment', enrollmentSchema);
