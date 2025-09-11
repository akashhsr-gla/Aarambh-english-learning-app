const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  // Session Information
  sessionId: {
    type: String,
    required: false,
    unique: true,
    sparse: true
  },
  sessionType: {
    type: String,
    enum: ['video_call', 'voice_call', 'chat', 'group_video_call', 'group_voice_call', 'group_chat', 'game'],
    required: true
  },
  title: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Participants
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['host', 'participant', 'observer', 'player'],
      default: 'participant'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: {
      type: Date
    },
    duration: {
      type: Number, // in seconds
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    // Call-specific participant state
    micEnabled: {
      type: Boolean,
      default: true
    },
    cameraEnabled: {
      type: Boolean,
      default: function() {
        return this.parent().sessionType.includes('video');
      }
    },
    isSpeaking: {
      type: Boolean,
      default: false
    },
    audioLevel: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    videoQuality: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'high',
      required: false
    },
    isScreenSharing: {
      type: Boolean,
      default: false
    },
    connectionQuality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    }
  }],
  
  // Host/Initiator
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hostRegion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region',
    required: false
  },
  
  // Session Status
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed', 'cancelled', 'failed', 'waiting_for_partner'],
    default: 'scheduled'
  },
  
  // Scheduling
  scheduledAt: {
    type: Date
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
  
  // Game Session Specific Fields
  gameSession: {
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game'
    },
    gameType: {
      type: String,
      enum: ['grammar', 'pronunciation', 'identification', 'storytelling']
    },
    scores: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      score: Number,
      maxScore: Number,
      percentage: Number,
      timeTaken: Number, // in seconds
      completedAt: {
        type: Date,
        default: Date.now
      }
    }],
    gameStatus: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started'
    }
  },
  
  // Chat Session Specific Fields
  chatSession: {
    messages: [{
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      message: {
        type: String,
        required: true
      },
      messageType: {
        type: String,
        enum: ['text', 'image', 'audio', 'file'],
        default: 'text'
      },
      mediaUrl: String,
      replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      isRead: {
        type: Boolean,
        default: false
      },
      isEdited: {
        type: Boolean,
        default: false
      },
      isDeleted: {
        type: Boolean,
        default: false
      }
    }],
    totalMessages: {
      type: Number,
      default: 0
    },
    lastMessageAt: Date
  },
  
  // Call Session Specific Fields
  callSession: {
    callType: {
      type: String,
      enum: ['video', 'voice'],
      required: function() {
        return ['video_call', 'voice_call', 'group_video_call', 'group_voice_call'].includes(this.sessionType);
      }
    },
    isGroupCall: {
      type: Boolean,
      default: false
    },
    maxParticipants: {
      type: Number,
      default: 2
    },
    callQuality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    },
    connectionType: {
      type: String,
      enum: ['wifi', 'mobile_data', 'ethernet'],
      default: 'wifi'
    },
    recordingUrl: {
      type: String
    },
    isRecorded: {
      type: Boolean,
      default: false
    },
    quality: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'high'
    },
    settings: {
      allowScreenShare: {
        type: Boolean,
        default: true
      },
      allowRecording: {
        type: Boolean,
        default: false
      },
      allowChat: {
        type: Boolean,
        default: true
      },
      muteOnEntry: {
        type: Boolean,
        default: false
      },
      videoOnEntry: {
        type: Boolean,
        default: true
      },
      allowParticipantMute: {
        type: Boolean,
        default: true
      },
      allowParticipantVideo: {
        type: Boolean,
        default: true
      }
    },
    signaling: {
      offer: {
        from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        type: { type: String },
        sdp: { type: String },
        createdAt: { type: Date }
      },
      answer: {
        from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        type: { type: String },
        sdp: { type: String },
        createdAt: { type: Date }
      },
      iceCandidates: [{
        from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        candidate: { type: String },
        sdpMid: { type: String },
        sdpMLineIndex: { type: Number },
        createdAt: { type: Date, default: Date.now }
      }]
    },
    // Video upgrade requests
    videoUpgradeRequest: {
      from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
      requestedAt: { type: Date, default: Date.now }
    }
  },
  
  // Group Session Specific Fields
  groupSession: {
    groupName: {
      type: String,
      trim: true
    },
    maxParticipants: {
      type: Number,
      default: 10
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    joinCode: {
      type: String
    }
  },
  
  // Region and Context
  region: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region'
  },
  
  // Privacy and Security
  isPrivate: {
    type: Boolean,
    default: false
  },
  requiresSubscription: {
    type: Boolean,
    default: false
  },
  
  // Analytics and Statistics
  analytics: {
    totalParticipants: {
      type: Number,
      default: 0
    },
    averageDuration: {
      type: Number,
      default: 0
    },
    peakConcurrentUsers: {
      type: Number,
      default: 0
    },
    engagementScore: {
      type: Number,
      default: 0
    }
  },
  
  // Error and Technical Information
  errorLog: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    error: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    }
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
sessionSchema.index({ sessionId: 1 });
sessionSchema.index({ sessionType: 1 });
sessionSchema.index({ host: 1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ scheduledAt: 1 });
sessionSchema.index({ 'participants.user': 1 });
sessionSchema.index({ region: 1 });
sessionSchema.index({ createdAt: -1 });

// Virtual for session summary
sessionSchema.virtual('summary').get(function() {
  return {
    id: this._id,
    sessionId: this.sessionId,
    sessionType: this.sessionType,
    title: this.title,
    status: this.status,
    host: this.host,
    participants: this.participants.length,
    duration: this.duration,
    startedAt: this.startedAt,
    endedAt: this.endedAt
  };
});

// Method to start session
sessionSchema.methods.startSession = function() {
  this.status = 'active';
  this.startedAt = new Date();
  this.analytics.totalParticipants = this.participants.length;
  this.analytics.peakConcurrentUsers = this.participants.length;
};

// Method to end session
sessionSchema.methods.endSession = function() {
  this.status = 'completed';
  this.endedAt = new Date();
  
  if (this.startedAt) {
    this.duration = Math.floor((this.endedAt - this.startedAt) / 1000);
  }
  
  // Update participant durations
  this.participants.forEach(participant => {
    if (participant.joinedAt && !participant.leftAt) {
      participant.leftAt = this.endedAt;
      participant.duration = Math.floor((participant.leftAt - participant.joinedAt) / 1000);
    }
  });
};

// Method to add participant
sessionSchema.methods.addParticipant = function(userId, role = 'participant') {
  const existingParticipant = this.participants.find(p => p.user.toString() === userId.toString());
  
  if (!existingParticipant) {
    this.participants.push({
      user: userId,
      role,
      joinedAt: new Date(),
      isActive: true
    });
    
    this.analytics.totalParticipants = this.participants.length;
    this.analytics.peakConcurrentUsers = Math.max(this.analytics.peakConcurrentUsers, this.participants.length);
  }
};

// Method to remove participant
sessionSchema.methods.removeParticipant = function(userId) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  
  if (participant) {
    participant.leftAt = new Date();
    participant.isActive = false;
    participant.duration = Math.floor((participant.leftAt - participant.joinedAt) / 1000);
  }
};

// Method to add game score
sessionSchema.methods.addGameScore = function(userId, score, maxScore, timeTaken) {
  if (this.sessionType === 'game' && this.gameSession) {
    const percentage = Math.round((score / maxScore) * 100);
    
    this.gameSession.scores.push({
      user: userId,
      score,
      maxScore,
      percentage,
      timeTaken,
      completedAt: new Date()
    });
    
    this.gameSession.gameStatus = 'completed';
  }
};

// Method to add chat message
sessionSchema.methods.addChatMessage = function(senderId, message, messageType = 'text') {
  if (this.sessionType.includes('chat')) {
    this.chatSession.messages.push({
      sender: senderId,
      message,
      messageType,
      timestamp: new Date()
    });
    
    this.chatSession.totalMessages += 1;
  }
};

// Method to log error
sessionSchema.methods.logError = function(error, severity = 'low') {
  this.errorLog.push({
    timestamp: new Date(),
    error,
    severity
  });
};

// Static method to get user sessions
sessionSchema.statics.getUserSessions = function(userId, options = {}) {
  const query = {
    $or: [
      { host: userId },
      { 'participants.user': userId }
    ]
  };
  
  if (options.sessionType) {
    query.sessionType = options.sessionType;
  }
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .populate('host', 'name email')
    .populate('participants.user', 'name email')
    .populate('gameSession.game', 'title gameType')
    .populate('region', 'name')
    .sort({ createdAt: -1 });
};

// Static method to get active sessions
sessionSchema.statics.getActiveSessions = function() {
  return this.find({ status: 'active' })
    .populate('host', 'name email')
    .populate('participants.user', 'name email')
    .populate('region', 'name');
};

// Static method to get session statistics
sessionSchema.statics.getSessionStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$sessionType',
        totalSessions: { $sum: 1 },
        activeSessions: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        completedSessions: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        totalDuration: { $sum: '$duration' },
        averageDuration: { $avg: '$duration' }
      }
    }
  ]);
  
  return stats;
};

module.exports = mongoose.model('Session', sessionSchema);
