const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNo: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  role: { 
    type: String, 
    enum: ['Guest', 'Member', 'Committee', 'Admin', 'Student', 'Faculty'], 
    default: 'Member' 
  },
  password: { type: String, required: true },
  isBlocked: { type: Boolean, default: false },
  activeSessionId: { type: String, default: null },
  department: { type: String },
  skills: [String],
  socialLinks: {
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    leetcode: { type: String, default: '' },
    hackerrank: { type: String, default: '' }
  },
  profilePicUrl: { type: String, default: '' }
}, { timestamps: true });

// Optimized indexes for user lookup, status, and role-based filtering
userSchema.index({ role: 1, isBlocked: 1 });
userSchema.index({ department: 1 });

module.exports = mongoose.model('User', userSchema);
