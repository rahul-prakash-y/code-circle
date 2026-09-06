const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  sessionName: {
    type: String,
    required: true,
    trim: true
  },
  otp: {
    type: String,
    required: true,
    length: 6
  },
  otpExpiry: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Optimized indexes for OTP validation and session retrieval
attendanceSessionSchema.index({ otp: 1, isActive: 1, otpExpiry: 1 });
attendanceSessionSchema.index({ event: 1, createdAt: -1 });

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);
