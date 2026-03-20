const mongoose = require('mongoose');

const bearerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  specialization: { type: String, required: true },
  iconType: { 
    type: String, 
    enum: ['Shield', 'Terminal', 'Cpu', 'Layout'], 
    default: 'Shield' 
  },
  profilePicUrl: { type: String, default: '' },
  socialLinks: {
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    instagram: { type: String, default: '' },
    email: { type: String, default: '' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Bearer', bearerSchema);
