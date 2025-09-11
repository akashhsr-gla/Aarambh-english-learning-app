const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['host', 'participant'],
    default: 'participant'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  leftAt: {
    type: Date
  }
});

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'audio'],
    default: 'text'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }
});

const groupSessionSchema = new mongoose.Schema({
  maxParticipants: {
    type: Number,
    required: true,
    min: 2,
    max: 50
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  sessionType: {
    type: String,
    enum: ['chat', 'voice', 'video'],
    default: null
  },
  isActive: {
    type: Boolean,
    default: false
  },
  startedAt: {
    type: Date
  },
  endedAt: {
    type: Date
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  signaling: {
    offer: {
      from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      type: String,
      sdp: String,
      createdAt: Date
    },
    answer: {
      from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      type: String,
      sdp: String,
      createdAt: Date
    },
    iceCandidates: [{
      from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      candidate: String,
      sdpMid: String,
      sdpMLineIndex: Number,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  }
});

const groupSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  topic: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 500
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  maxParticipants: {
    type: Number,
    required: true,
    min: 2,
    max: 50
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    minlength: 4,
    maxlength: 20
  },
  joinCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [participantSchema],
  status: {
    type: String,
    enum: ['waiting', 'ready', 'active', 'completed', 'disbanded'],
    default: 'waiting'
  },
  settings: {
    allowVideo: {
      type: Boolean,
      default: true
    },
    allowVoice: {
      type: Boolean,
      default: true
    },
    allowChat: {
      type: Boolean,
      default: true
    }
  },
  groupSession: groupSessionSchema,
  messages: [messageSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better performance
groupSchema.index({ joinCode: 1 });
groupSchema.index({ status: 1 });
groupSchema.index({ level: 1 });
groupSchema.index({ 'participants.user': 1 });
groupSchema.index({ createdAt: -1 });

// Pre-save middleware to update timestamps
groupSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Update current participants count
  if (this.participants) {
    this.groupSession.currentParticipants = this.participants.length;
  }
  
  next();
});

// Virtual for checking if group is full
groupSchema.virtual('isFull').get(function() {
  return this.participants.length >= this.maxParticipants;
});

// Virtual for checking if group is ready to start
groupSchema.virtual('isReady').get(function() {
  return this.participants.length >= 2 && this.status === 'waiting';
});

// Method to add participant
groupSchema.methods.addParticipant = function(userId, role = 'participant') {
  const existingParticipant = this.participants.find(p => 
    p.user.toString() === userId.toString()
  );
  
  if (existingParticipant) {
    throw new Error('User is already a participant');
  }
  
  if (this.isFull) {
    throw new Error('Group is full');
  }
  
  this.participants.push({
    user: userId,
    role,
    joinedAt: new Date(),
    isActive: true
  });
  
  return this.save();
};

// Method to remove participant
groupSchema.methods.removeParticipant = function(userId) {
  const participantIndex = this.participants.findIndex(p => 
    p.user.toString() === userId.toString()
  );
  
  if (participantIndex === -1) {
    throw new Error('User is not a participant');
  }
  
  const participant = this.participants[participantIndex];
  participant.isActive = false;
  participant.leftAt = new Date();
  
  // If host leaves, disband group
  if (participant.role === 'host') {
    this.status = 'disbanded';
    this.groupSession.isActive = false;
    this.groupSession.endedAt = new Date();
  }
  
  return this.save();
};

// Method to start session
groupSchema.methods.startSession = function(sessionType) {
  if (this.participants.length < 2) {
    throw new Error('Need at least 2 participants to start session');
  }
  
  this.status = 'active';
  this.groupSession.sessionType = sessionType;
  this.groupSession.isActive = true;
  this.groupSession.startedAt = new Date();
  
  return this.save();
};

// Method to end session
groupSchema.methods.endSession = function() {
  this.status = 'completed';
  this.groupSession.isActive = false;
  this.groupSession.endedAt = new Date();
  
  if (this.groupSession.startedAt) {
    this.groupSession.duration = Math.round(
      (this.groupSession.endedAt - this.groupSession.startedAt) / 1000
    );
  }
  
  return this.save();
};

// Method to add message
groupSchema.methods.addMessage = function(senderId, message, messageType = 'text') {
  this.messages.push({
    sender: senderId,
    message,
    messageType,
    timestamp: new Date()
  });
  
  return this.save();
};

// Static method to find groups by filters
groupSchema.statics.findByFilters = function(filters) {
  const query = {};
  
  if (filters.level) {
    query.level = filters.level;
  }
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: 'i' } },
      { topic: { $regex: filters.search, $options: 'i' } }
    ];
  }
  
  return this.find(query)
    .populate('host', 'name email profilePicture')
    .populate('participants.user', 'name email profilePicture')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Group', groupSchema);
