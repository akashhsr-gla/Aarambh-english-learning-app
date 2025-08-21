const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  // Game Information
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  gameType: {
    type: String,
    enum: ['grammar', 'pronunciation', 'identification', 'storytelling'],
    required: true
  },
  
  // Difficulty and Level
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  level: {
    type: Number,
    min: 1,
    default: 1
  },
  
  // Game Configuration
  timeLimit: {
    type: Number, // in seconds, 0 means no limit
    default: 0
  },
  maxScore: {
    type: Number,
    default: 100
  },
  passingScore: {
    type: Number,
    default: 60
  },
  totalQuestions: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Questions Array - Flexible structure for different game types
  questions: [{
    questionNumber: {
      type: Number,
      required: true
    },
    questionText: {
      type: String,
      required: true
    },
    questionType: {
      type: String,
      enum: ['multiple_choice', 'true_false', 'fill_blank', 'audio', 'image', 'video'],
      required: true
    },
    
    // Multiple Choice Options
    options: [{
      text: String,
      isCorrect: {
        type: Boolean,
        default: false
      },
      explanation: String
    }],
    
    // Audio/Video/Image Content
    mediaUrl: {
      type: String
    },
    mediaType: {
      type: String,
      enum: ['audio', 'video', 'image']
    },
    
    // Correct Answer (for non-multiple choice)
    correctAnswer: {
      type: String
    },
    
    // Hints and Explanations
    hint: {
      type: String
    },
    explanation: {
      type: String
    },
    
    // Scoring
    points: {
      type: Number,
      default: 10
    },
    negativePoints: {
      type: Number,
      default: 0
    },
    
    // Game-specific fields
    grammarRule: {
      type: String // For grammar games
    },
    pronunciationGuide: {
      type: String // For pronunciation games
    },
    wordCategory: {
      type: String // For identification games
    },
    storyContext: {
      type: String // For storytelling games
    }
  }],
  
  // Game Settings
  isActive: {
    type: Boolean,
    default: true
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  requiresSubscription: {
    type: Boolean,
    default: false
  },
  
  // Categories and Tags
  categories: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true
  }],
  
  // Statistics
  totalPlays: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  completionRate: {
    type: Number,
    default: 0
  },
  
  // Created by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Admin who created this game
    required: true
  },
  
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
gameSchema.index({ gameType: 1 });
gameSchema.index({ difficulty: 1 });
gameSchema.index({ isActive: 1 });
gameSchema.index({ isPremium: 1 });
gameSchema.index({ categories: 1 });
gameSchema.index({ createdBy: 1 });

// Virtual for game summary
gameSchema.virtual('summary').get(function() {
  return {
    id: this._id,
    title: this.title,
    gameType: this.gameType,
    difficulty: this.difficulty,
    level: this.level,
    totalQuestions: this.totalQuestions,
    timeLimit: this.timeLimit,
    maxScore: this.maxScore,
    isPremium: this.isPremium,
    totalPlays: this.totalPlays,
    averageScore: this.averageScore
  };
});

// Method to validate game structure
gameSchema.methods.validateGame = function() {
  const errors = [];
  
  // Check if questions array matches totalQuestions
  if (this.questions.length !== this.totalQuestions) {
    errors.push(`Question count mismatch: expected ${this.totalQuestions}, got ${this.questions.length}`);
  }
  
  // Validate each question
  this.questions.forEach((question, index) => {
    if (question.questionNumber !== index + 1) {
      errors.push(`Question ${index + 1}: questionNumber should be ${index + 1}`);
    }
    
    if (question.questionType === 'multiple_choice') {
      if (!question.options || question.options.length < 2) {
        errors.push(`Question ${index + 1}: multiple choice must have at least 2 options`);
      }
      
      const correctOptions = question.options.filter(opt => opt.isCorrect);
      if (correctOptions.length === 0) {
        errors.push(`Question ${index + 1}: must have at least one correct option`);
      }
    } else {
      if (!question.correctAnswer) {
        errors.push(`Question ${index + 1}: must have correctAnswer for non-multiple choice`);
      }
    }
  });
  
  return errors;
};

// Method to calculate total possible score
gameSchema.methods.getTotalPossibleScore = function() {
  return this.questions.reduce((total, question) => total + question.points, 0);
};

// Method to update game statistics
gameSchema.methods.updateStats = function(newScore, completed) {
  this.totalPlays += 1;
  
  // Update average score
  const totalScore = this.averageScore * (this.totalPlays - 1) + newScore;
  this.averageScore = Math.round(totalScore / this.totalPlays);
  
  // Update completion rate
  if (completed) {
    const totalCompleted = Math.round((this.completionRate * (this.totalPlays - 1)) / 100) + 1;
    this.completionRate = Math.round((totalCompleted / this.totalPlays) * 100);
  }
};

// Static method to get games by type
gameSchema.statics.getGamesByType = function(gameType, options = {}) {
  const query = { gameType, isActive: true };
  
  if (options.difficulty) {
    query.difficulty = options.difficulty;
  }
  
  if (options.isPremium !== undefined) {
    query.isPremium = options.isPremium;
  }
  
  return this.find(query)
    .populate('createdBy', 'name')
    .sort({ level: 1, createdAt: -1 });
};

// Static method to get random game
gameSchema.statics.getRandomGame = function(gameType, difficulty, isPremium = false) {
  const query = { 
    gameType, 
    isActive: true, 
    isPremium 
  };
  
  if (difficulty) {
    query.difficulty = difficulty;
  }
  
  return this.aggregate([
    { $match: query },
    { $sample: { size: 1 } },
    {
      $lookup: {
        from: 'users',
        localField: 'createdBy',
        foreignField: '_id',
        as: 'createdBy'
      }
    },
    { $unwind: '$createdBy' }
  ]);
};

// Static method to get game statistics
gameSchema.statics.getGameStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$gameType',
        totalGames: { $sum: 1 },
        activeGames: { $sum: { $cond: ['$isActive', 1, 0] } },
        premiumGames: { $sum: { $cond: ['$isPremium', 1, 0] } },
        totalPlays: { $sum: '$totalPlays' },
        averageScore: { $avg: '$averageScore' }
      }
    }
  ]);
  
  return stats;
};

module.exports = mongoose.model('Game', gameSchema);
