const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AttendanceSession',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Ensure a user can only have one record per session
attendanceRecordSchema.index({ session: 1, user: 1 }, { unique: true });
// Fast lookup for user attendance history
attendanceRecordSchema.index({ user: 1, timestamp: -1 });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
