const mongoose = require('mongoose');

const regionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalUsers: {
    type: Number,
    default: 0
  },
  totalStudents: {
    type: Number,
    default: 0
  },
  totalTeachers: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
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
regionSchema.index({ name: 1 });
regionSchema.index({ code: 1 });
regionSchema.index({ isActive: 1 });

// Virtual for region statistics
regionSchema.virtual('stats').get(function() {
  return {
    totalUsers: this.totalUsers,
    totalStudents: this.totalStudents,
    totalTeachers: this.totalTeachers,
    averageScore: this.averageScore
  };
});

// Method to update region statistics
regionSchema.methods.updateStats = async function() {
  const User = mongoose.model('User');
  
  const stats = await User.aggregate([
    { $match: { region: this._id, isActive: true } },
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        totalStudents: { $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] } },
        totalTeachers: { $sum: { $cond: [{ $eq: ['$role', 'teacher'] }, 1, 0] } },
        averageScore: { $avg: '$studentInfo.averageGameScore' }
      }
    }
  ]);
  
  if (stats.length > 0) {
    this.totalUsers = stats[0].totalUsers;
    this.totalStudents = stats[0].totalStudents;
    this.totalTeachers = stats[0].totalTeachers;
    this.averageScore = Math.round(stats[0].averageScore || 0);
  } else {
    this.totalUsers = 0;
    this.totalStudents = 0;
    this.totalTeachers = 0;
    this.averageScore = 0;
  }
  
  await this.save();
};

module.exports = mongoose.model('Region', regionSchema);
