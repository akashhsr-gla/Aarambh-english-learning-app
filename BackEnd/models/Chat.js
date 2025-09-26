const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    // Store additional info like response time, tokens used, etc.
    responseTime: Number,
    tokens: Number,
    model: String,
    category: String,
    level: String
  }
});

const chatConversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'New Conversation',
    trim: true
  },
  category: {
    type: String,
    enum: ['grammar', 'pronunciation', 'vocabulary', 'writing', 'speaking', 'listening', 'general'],
    default: 'general'
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  messages: [chatMessageSchema],
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  },
  settings: {
    includeExercises: {
      type: Boolean,
      default: true
    },
    includeGameRecommendations: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  analytics: {
    totalMessages: {
      type: Number,
      default: 0
    },
    totalTokensUsed: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0
    },
    topicsDiscussed: [{
      type: String
    }],
    lastActivity: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
chatConversationSchema.index({ userId: 1, createdAt: -1 });
chatConversationSchema.index({ sessionId: 1 });
chatConversationSchema.index({ status: 1, lastActivity: -1 });
chatConversationSchema.index({ category: 1, level: 1 });

// Virtual for conversation duration
chatConversationSchema.virtual('duration').get(function() {
  return this.updatedAt - this.createdAt;
});

// Virtual for latest message
chatConversationSchema.virtual('latestMessage').get(function() {
  return this.messages.length > 0 ? this.messages[this.messages.length - 1] : null;
});

// Method to add a message to the conversation
chatConversationSchema.methods.addMessage = function(role, content, metadata = {}) {
  const message = {
    role,
    content,
    timestamp: new Date(),
    metadata
  };
  
  this.messages.push(message);
  
  // Update analytics
  this.analytics.totalMessages = this.messages.length;
  this.analytics.lastActivity = new Date();
  
  if (metadata.tokens) {
    this.analytics.totalTokensUsed += metadata.tokens;
  }
  
  if (metadata.responseTime) {
    const assistantMessages = this.messages.filter(msg => msg.role === 'assistant' && msg.metadata.responseTime);
    const totalResponseTime = assistantMessages.reduce((sum, msg) => sum + msg.metadata.responseTime, 0);
    this.analytics.averageResponseTime = totalResponseTime / assistantMessages.length;
  }
  
  return message;
};

// Method to get conversation context for OpenAI
chatConversationSchema.methods.getContextMessages = function(limit = 10) {
  // Get recent messages for context, excluding system messages
  return this.messages
    .filter(msg => msg.role !== 'system')
    .slice(-limit)
    .map(msg => ({
      role: msg.role,
      content: msg.content
    }));
};

// Method to update conversation title based on first user message
chatConversationSchema.methods.updateTitle = function() {
  const firstUserMessage = this.messages.find(msg => msg.role === 'user');
  if (firstUserMessage && this.title === 'New Conversation') {
    // Extract first few words as title
    const words = firstUserMessage.content.split(' ').slice(0, 6);
    this.title = words.join(' ') + (words.length < firstUserMessage.content.split(' ').length ? '...' : '');
  }
};

// Method to archive old conversations
chatConversationSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

// Static method to get user's recent conversations
chatConversationSchema.statics.getRecentConversations = function(userId, limit = 10) {
  return this.find({ 
    userId, 
    status: { $ne: 'archived' } 
  })
  .sort({ 'analytics.lastActivity': -1 })
  .limit(limit)
  .select('title category level analytics.lastActivity analytics.totalMessages latestMessage')
  .lean();
};

// Static method to get conversation statistics
chatConversationSchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalConversations: { $sum: 1 },
        totalMessages: { $sum: '$analytics.totalMessages' },
        totalTokens: { $sum: '$analytics.totalTokensUsed' },
        avgResponseTime: { $avg: '$analytics.averageResponseTime' },
        categories: { $addToSet: '$category' },
        levels: { $addToSet: '$level' }
      }
    }
  ]);
};

// Pre-save middleware to update analytics
chatConversationSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.updateTitle();
  }
  next();
});

// Pre-remove middleware to cleanup
chatConversationSchema.pre('remove', function(next) {
  console.log(`Removing conversation ${this._id} for user ${this.userId}`);
  next();
});

module.exports = mongoose.model('Chat', chatConversationSchema);