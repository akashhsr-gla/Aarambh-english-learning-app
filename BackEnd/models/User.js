const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profilePicture: {
    type: String,
    default: null
  },
  
  // Role and Status
  role: {
    type: String,
    enum: ['admin', 'teacher', 'student'],
    default: 'student'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  
  // Student Specific Fields
  studentInfo: {
    age: {
      type: Number,
      min: 5,
      max: 100
    },
    educationLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced']
    },
    preferredLearningTime: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night']
    },
    learningGoals: [{
      type: String
    }],
    currentPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan'
    },
    planExpiryDate: {
      type: Date
    },
    totalSessions: {
      type: Number,
      default: 0
    },
    averageGameScore: {
      type: Number,
      default: 0
    },
    totalGamesPlayed: {
      type: Number,
      default: 0
    },
    totalLecturesWatched: {
      type: Number,
      default: 0
    },
    totalWatchTime: {
      type: Number,
      default: 0 // in minutes
    }
  },
  
  // Teacher Specific Fields
  teacherInfo: {
    qualification: {
      type: String
    },
    experience: {
      type: Number, // years
      default: 0
    },
    specialization: [{
      type: String
    }],
    bio: {
      type: String
    },
    hourlyRate: {
      type: Number,
      default: 0
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true
    },
    totalStudents: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    },
    totalReferrals: {
      type: Number,
      default: 0
    },
    isApproved: {
      type: Boolean,
      default: false
    }
  },
  
  // Region and Location
  region: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region',
    required: true
  },
  
  // Referral System
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Teacher who referred this student
  },
  referralDiscountApplied: {
    type: Boolean,
    default: false
  },
  
  // Session Tracking
  sessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  }],
  
  // Game Performance
  gameScores: [{
    gameType: {
      type: String,
      enum: ['grammar', 'pronunciation', 'identification', 'storytelling']
    },
    score: Number,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Payment and Subscription
  transactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }],
  
  // Admin Specific Fields
  adminInfo: {
    permissions: [{
      type: String,
      enum: ['manage_users', 'manage_content', 'manage_plans', 'view_analytics', 'manage_teachers']
    }],
    lastLogin: {
      type: Date
    }
  },
  
  // Timestamps
  lastActive: {
    type: Date,
    default: Date.now
  },
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

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ region: 1 });
userSchema.index({ 'teacherInfo.referralCode': 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Virtual for average score calculation
userSchema.virtual('averageScore').get(function() {
  if (this.gameScores.length === 0) return 0;
  const total = this.gameScores.reduce((sum, score) => sum + score.score, 0);
  return Math.round(total / this.gameScores.length);
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to generate referral code for teachers
userSchema.pre('save', async function(next) {
  if (this.role === 'teacher' && !this.teacherInfo.referralCode) {
    const { v4: uuidv4 } = require('uuid');
    this.teacherInfo.referralCode = uuidv4().substring(0, 8).toUpperCase();
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update average score
userSchema.methods.updateAverageScore = function() {
  if (this.gameScores.length > 0) {
    const total = this.gameScores.reduce((sum, score) => sum + score.score, 0);
    this.studentInfo.averageGameScore = Math.round(total / this.gameScores.length);
  }
};

// Method to add game score
userSchema.methods.addGameScore = function(gameType, score) {
  this.gameScores.push({ gameType, score });
  this.studentInfo.totalGamesPlayed += 1;
  this.updateAverageScore();
};

// Method to check if user has active subscription
userSchema.methods.hasActiveSubscription = function() {
  if (this.role === 'admin' || this.role === 'teacher') return true;
  return this.studentInfo.planExpiryDate && this.studentInfo.planExpiryDate > new Date();
};

// Method to get user statistics
userSchema.methods.getStats = function() {
  const stats = {
    totalSessions: this.studentInfo.totalSessions,
    averageScore: this.studentInfo.averageGameScore,
    totalGames: this.studentInfo.totalGamesPlayed,
    totalLectures: this.studentInfo.totalLecturesWatched,
    totalWatchTime: this.studentInfo.totalWatchTime
  };
  
  if (this.role === 'teacher') {
    stats.totalStudents = this.teacherInfo.totalStudents;
    stats.totalEarnings = this.teacherInfo.totalEarnings;
    stats.totalReferrals = this.teacherInfo.totalReferrals;
  }
  
  return stats;
};

module.exports = mongoose.model('User', userSchema);
