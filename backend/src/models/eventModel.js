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
  venueOrLink: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['Individual', 'Team'], 
    required: true 
  },
  maxParticipants: { 
    type: Number,
    default: 0
  },
  registrationDeadline: { 
    type: Date, 
    required: true 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
