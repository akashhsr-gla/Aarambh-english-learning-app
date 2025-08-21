const mongoose = require('mongoose');

const videoLectureSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: 200
  },
  
  // Content Details
  videoUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String
  },
  duration: {
    type: Number, // in seconds
    required: true,
    min: 1
  },
  
  // Notes and Resources
  notes: {
    pdfUrl: {
      type: String
    },
    textContent: {
      type: String
    }
  },
  resources: [{
    title: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['pdf', 'doc', 'ppt', 'link', 'audio']
    },
    url: {
      type: String,
      required: true
    },
    description: String
  }],
  
  // Categories and Difficulty
  category: {
    type: String,
    required: true,
    trim: true
  },
  subcategory: {
    type: String,
    trim: true
  },
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
  
  // Tags and Keywords
  tags: [{
    type: String,
    trim: true
  }],
  keywords: [{
    type: String,
    trim: true
  }],
  
  // Instructor Information
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Teacher who created this lecture
    required: true
  },
  
  // Lecture Settings
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
  isPublished: {
    type: Boolean,
    default: false
  },
  
  // Language and Region
  language: {
    type: String,
    default: 'English'
  },
  region: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region'
  },
  
  // Statistics
  totalViews: {
    type: Number,
    default: 0
  },
  totalWatchTime: {
    type: Number,
    default: 0 // in seconds
  },
  averageWatchTime: {
    type: Number,
    default: 0 // in seconds
  },
  completionRate: {
    type: Number,
    default: 0 // percentage
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    }
  },
  
  // Prerequisites and Related Content
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VideoLecture'
  }],
  relatedLectures: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VideoLecture'
  }],
  
  // Timestamps
  publishedAt: {
    type: Date
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
videoLectureSchema.index({ title: 1 });
videoLectureSchema.index({ category: 1 });
videoLectureSchema.index({ difficulty: 1 });
videoLectureSchema.index({ instructor: 1 });
videoLectureSchema.index({ isActive: 1 });
videoLectureSchema.index({ isPremium: 1 });
videoLectureSchema.index({ tags: 1 });
videoLectureSchema.index({ region: 1 });

// Virtual for formatted duration
videoLectureSchema.virtual('formattedDuration').get(function() {
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  const seconds = this.duration % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Virtual for lecture summary
videoLectureSchema.virtual('summary').get(function() {
  return {
    id: this._id,
    title: this.title,
    shortDescription: this.shortDescription,
    duration: this.formattedDuration,
    category: this.category,
    difficulty: this.difficulty,
    isPremium: this.isPremium,
    totalViews: this.totalViews,
    rating: this.rating.average,
    thumbnailUrl: this.thumbnailUrl
  };
});

// Method to update view statistics
videoLectureSchema.methods.updateViewStats = function(watchTime) {
  this.totalViews += 1;
  this.totalWatchTime += watchTime;
  this.averageWatchTime = Math.round(this.totalWatchTime / this.totalViews);
  
  // Calculate completion rate (if watch time is more than 80% of duration)
  if (watchTime >= this.duration * 0.8) {
    const completedViews = Math.round((this.completionRate * (this.totalViews - 1)) / 100) + 1;
    this.completionRate = Math.round((completedViews / this.totalViews) * 100);
  }
};

// Method to update rating
videoLectureSchema.methods.updateRating = function(newRating) {
  const totalRating = this.rating.average * this.rating.totalRatings + newRating;
  this.rating.totalRatings += 1;
  this.rating.average = Math.round((totalRating / this.rating.totalRatings) * 10) / 10;
};

// Method to publish lecture
videoLectureSchema.methods.publish = function() {
  this.isPublished = true;
  this.publishedAt = new Date();
};

// Method to unpublish lecture
videoLectureSchema.methods.unpublish = function() {
  this.isPublished = false;
  this.publishedAt = null;
};

// Static method to get lectures by category
videoLectureSchema.statics.getLecturesByCategory = function(category, options = {}) {
  const query = { category, isActive: true, isPublished: true };
  
  if (options.difficulty) {
    query.difficulty = options.difficulty;
  }
  
  if (options.isPremium !== undefined) {
    query.isPremium = options.isPremium;
  }
  
  if (options.region) {
    query.region = options.region;
  }
  
  return this.find(query)
    .populate('instructor', 'name')
    .populate('region', 'name')
    .sort({ level: 1, createdAt: -1 });
};

// Static method to search lectures
videoLectureSchema.statics.searchLectures = function(searchTerm, options = {}) {
  const query = {
    isActive: true,
    isPublished: true,
    $or: [
      { title: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } },
      { keywords: { $in: [new RegExp(searchTerm, 'i')] } }
    ]
  };
  
  if (options.category) {
    query.category = options.category;
  }
  
  if (options.difficulty) {
    query.difficulty = options.difficulty;
  }
  
  if (options.isPremium !== undefined) {
    query.isPremium = options.isPremium;
  }
  
  return this.find(query)
    .populate('instructor', 'name')
    .populate('region', 'name')
    .sort({ rating: { average: -1 }, totalViews: -1 });
};

// Static method to get popular lectures
videoLectureSchema.statics.getPopularLectures = function(limit = 10) {
  return this.find({ isActive: true, isPublished: true })
    .populate('instructor', 'name')
    .populate('region', 'name')
    .sort({ totalViews: -1, rating: { average: -1 } })
    .limit(limit);
};

// Static method to get instructor lectures
videoLectureSchema.statics.getInstructorLectures = function(instructorId, options = {}) {
  const query = { instructor: instructorId };
  
  if (options.isPublished !== undefined) {
    query.isPublished = options.isPublished;
  }
  
  if (options.isActive !== undefined) {
    query.isActive = options.isActive;
  }
  
  return this.find(query)
    .populate('region', 'name')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('VideoLecture', videoLectureSchema);
