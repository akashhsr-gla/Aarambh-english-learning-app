const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
  // Region Information
  region: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region',
    required: true
  },
  
  // Leaderboard Type
  leaderboardType: {
    type: String,
    enum: ['overall', 'weekly', 'monthly', 'game_specific'],
    default: 'overall'
  },
  
  // Game Type (for game-specific leaderboards)
  gameType: {
    type: String,
    enum: ['grammar', 'pronunciation', 'identification', 'storytelling'],
    required: function() {
      return this.leaderboardType === 'game_specific';
    }
  },
  
  // Time Period
  period: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  
  // Top Students
  topStudents: [{
    rank: {
      type: Number,
      required: true,
      min: 1,
      max: 3
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    score: {
      type: Number,
      required: true,
      min: 0
    },
    maxScore: {
      type: Number,
      required: true,
      min: 0
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    totalSessions: {
      type: Number,
      default: 0
    },
    totalGames: {
      type: Number,
      default: 0
    },
    totalLectures: {
      type: Number,
      default: 0
    },
    averageSessionDuration: {
      type: Number, // in minutes
      default: 0
    },
    lastActive: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Statistics
  totalParticipants: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  totalSessions: {
    type: Number,
    default: 0
  },
  totalGames: {
    type: Number,
    default: 0
  },
  
  // Leaderboard Status
  isActive: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  lastUpdated: {
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

// Indexes
leaderboardSchema.index({ region: 1 });
leaderboardSchema.index({ leaderboardType: 1 });
leaderboardSchema.index({ gameType: 1 });
leaderboardSchema.index({ 'period.startDate': 1 });
leaderboardSchema.index({ 'period.endDate': 1 });
leaderboardSchema.index({ isActive: 1 });
leaderboardSchema.index({ isPublished: 1 });

// Compound index for unique leaderboards
leaderboardSchema.index(
  { region: 1, leaderboardType: 1, gameType: 1, 'period.startDate': 1 },
  { unique: true }
);

// Virtual for leaderboard summary
leaderboardSchema.virtual('summary').get(function() {
  return {
    id: this._id,
    region: this.region,
    leaderboardType: this.leaderboardType,
    gameType: this.gameType,
    period: this.period,
    totalParticipants: this.totalParticipants,
    averageScore: this.averageScore,
    topStudents: this.topStudents.length,
    isActive: this.isActive,
    isPublished: this.isPublished
  };
});

// Method to update leaderboard
leaderboardSchema.methods.updateLeaderboard = async function() {
  const User = mongoose.model('User');
  const Session = mongoose.model('Session');
  
  // Get all students in the region
  const students = await User.find({
    region: this.region,
    role: 'student',
    isActive: true
  });
  
  this.totalParticipants = students.length;
  
  // Calculate scores for each student
  const studentScores = [];
  
  for (const student of students) {
    let score = 0;
    let maxScore = 0;
    let totalSessions = 0;
    let totalGames = 0;
    let totalLectures = 0;
    let totalSessionDuration = 0;
    
    // Get student's game scores
    if (this.leaderboardType === 'game_specific' && this.gameType) {
      const gameScores = student.gameScores.filter(gs => gs.gameType === this.gameType);
      score = gameScores.reduce((sum, gs) => sum + gs.score, 0);
      maxScore = gameScores.length * 100; // Assuming max score per game is 100
    } else {
      // Overall score
      score = student.gameScores.reduce((sum, gs) => sum + gs.score, 0);
      maxScore = student.gameScores.length * 100;
    }
    
    // Get session statistics
    const sessions = await Session.find({
      'participants.user': student._id,
      status: 'completed',
      startedAt: { $gte: this.period.startDate, $lte: this.period.endDate }
    });
    
    totalSessions = sessions.length;
    totalGames = sessions.filter(s => s.sessionType === 'game').length;
    totalLectures = student.studentInfo.totalLecturesWatched;
    
    // Calculate average session duration
    const sessionDurations = sessions.map(s => s.duration).filter(d => d > 0);
    if (sessionDurations.length > 0) {
      totalSessionDuration = sessionDurations.reduce((sum, d) => sum + d, 0);
    }
    
    const averageSessionDuration = sessionDurations.length > 0 
      ? Math.round(totalSessionDuration / sessionDurations.length / 60) // Convert to minutes
      : 0;
    
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    
    studentScores.push({
      student: student._id,
      score,
      maxScore,
      percentage,
      totalSessions,
      totalGames,
      totalLectures,
      averageSessionDuration,
      lastActive: student.lastActive
    });
  }
  
  // Sort by percentage (descending) and then by total sessions (descending)
  studentScores.sort((a, b) => {
    if (b.percentage !== a.percentage) {
      return b.percentage - a.percentage;
    }
    return b.totalSessions - a.totalSessions;
  });
  
  // Update top 3 students
  this.topStudents = studentScores.slice(0, 3).map((studentScore, index) => ({
    rank: index + 1,
    student: studentScore.student,
    score: studentScore.score,
    maxScore: studentScore.maxScore,
    percentage: studentScore.percentage,
    totalSessions: studentScore.totalSessions,
    totalGames: studentScore.totalGames,
    totalLectures: studentScore.totalLectures,
    averageSessionDuration: studentScore.averageSessionDuration,
    lastActive: studentScore.lastActive
  }));
  
  // Update overall statistics
  if (studentScores.length > 0) {
    this.averageScore = Math.round(
      studentScores.reduce((sum, s) => sum + s.percentage, 0) / studentScores.length
    );
    this.totalSessions = studentScores.reduce((sum, s) => sum + s.totalSessions, 0);
    this.totalGames = studentScores.reduce((sum, s) => sum + s.totalGames, 0);
  }
  
  this.lastUpdated = new Date();
};

// Method to publish leaderboard
leaderboardSchema.methods.publish = function() {
  this.isPublished = true;
};

// Method to unpublish leaderboard
leaderboardSchema.methods.unpublish = function() {
  this.isPublished = false;
};

// Static method to get current leaderboard
leaderboardSchema.statics.getCurrentLeaderboard = function(regionId, leaderboardType = 'overall', gameType = null) {
  const now = new Date();
  const query = {
    region: regionId,
    leaderboardType,
    isActive: true,
    isPublished: true,
    'period.startDate': { $lte: now },
    'period.endDate': { $gte: now }
  };
  
  if (gameType) {
    query.gameType = gameType;
  }
  
  return this.findOne(query)
    .populate('region', 'name')
    .populate('topStudents.student', 'name email profilePicture')
    .sort({ lastUpdated: -1 });
};

// Static method to get leaderboard history
leaderboardSchema.statics.getLeaderboardHistory = function(regionId, leaderboardType = 'overall', limit = 10) {
  const query = {
    region: regionId,
    leaderboardType,
    isPublished: true
  };
  
  return this.find(query)
    .populate('topStudents.student', 'name email profilePicture')
    .sort({ 'period.endDate': -1 })
    .limit(limit);
};

// Static method to create weekly leaderboard
leaderboardSchema.statics.createWeeklyLeaderboard = async function(regionId, gameType = null) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  endOfWeek.setHours(23, 59, 59, 999);
  
  const leaderboard = new this({
    region: regionId,
    leaderboardType: 'weekly',
    gameType,
    period: {
      startDate: startOfWeek,
      endDate: endOfWeek
    }
  });
  
  await leaderboard.updateLeaderboard();
  await leaderboard.save();
  
  return leaderboard;
};

// Static method to create monthly leaderboard
leaderboardSchema.statics.createMonthlyLeaderboard = async function(regionId, gameType = null) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  
  const leaderboard = new this({
    region: regionId,
    leaderboardType: 'monthly',
    gameType,
    period: {
      startDate: startOfMonth,
      endDate: endOfMonth
    }
  });
  
  await leaderboard.updateLeaderboard();
  await leaderboard.save();
  
  return leaderboard;
};

module.exports = mongoose.model('Leaderboard', leaderboardSchema);
