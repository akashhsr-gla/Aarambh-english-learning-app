const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number,
    required: true,
    min: 1 // in days
  },
  durationType: {
    type: String,
    enum: ['days', 'weeks', 'months', 'years'],
    default: 'months'
  },
  features: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    isIncluded: {
      type: Boolean,
      default: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  maxSessions: {
    type: Number,
    default: -1 // -1 means unlimited
  },
  maxGames: {
    type: Number,
    default: -1 // -1 means unlimited
  },
  maxLectures: {
    type: Number,
    default: -1 // -1 means unlimited
  },
  includesVideoCalls: {
    type: Boolean,
    default: false
  },
  includesVoiceCalls: {
    type: Boolean,
    default: false
  },
  includesGroupCalls: {
    type: Boolean,
    default: false
  },
  includesChat: {
    type: Boolean,
    default: true
  },
  includesGames: {
    type: Boolean,
    default: true
  },
  includesLectures: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 0 // Higher number = higher priority
  },
  razorpayPlanId: {
    type: String,
    unique: true,
    sparse: true
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
planSchema.index({ name: 1 });
planSchema.index({ isActive: 1 });
planSchema.index({ priority: -1 });
planSchema.index({ price: 1 });

// Virtual for formatted duration
planSchema.virtual('formattedDuration').get(function() {
  const duration = this.duration;
  const type = this.durationType;
  
  if (duration === 1) {
    return `1 ${type.slice(0, -1)}`; // Remove 's' for singular
  }
  return `${duration} ${type}`;
});

// Virtual for price per day
planSchema.virtual('pricePerDay').get(function() {
  const daysInDuration = this.getDaysInDuration();
  return Math.round((this.price / daysInDuration) * 100) / 100;
});

// Method to get days in duration
planSchema.methods.getDaysInDuration = function() {
  const duration = this.duration;
  const type = this.durationType;
  
  switch (type) {
    case 'days':
      return duration;
    case 'weeks':
      return duration * 7;
    case 'months':
      return duration * 30;
    case 'years':
      return duration * 365;
    default:
      return duration;
  }
};

// Method to check if feature is included
planSchema.methods.hasFeature = function(featureName) {
  const feature = this.features.find(f => f.name === featureName);
  return feature ? feature.isIncluded : false;
};

// Method to get plan summary
planSchema.methods.getSummary = function() {
  return {
    id: this._id,
    name: this.name,
    description: this.description,
    price: this.price,
    duration: this.formattedDuration,
    pricePerDay: this.pricePerDay,
    isPopular: this.isPopular,
    features: this.features.filter(f => f.isIncluded).map(f => f.name)
  };
};

// Static method to get active plans
planSchema.statics.getActivePlans = function() {
  return this.find({ isActive: true }).sort({ priority: -1, price: 1 });
};

// Static method to get free plan
planSchema.statics.getFreePlan = function() {
  return this.findOne({ price: 0, isActive: true });
};

module.exports = mongoose.model('Plan', planSchema);
