const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema({
  // Feature identification
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['games', 'communication', 'learning', 'social', 'premium'],
    required: true
  },
  
  // Access control
  isPaid: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Feature metadata
  icon: {
    type: String,
    default: 'star'
  },
  color: {
    type: String,
    default: '#226cae'
  },
  order: {
    type: Number,
    default: 0
  },
  
  // Subscription requirements
  requiredPlan: {
    type: String,
    enum: ['free', 'basic', 'premium', 'pro'],
    default: 'free'
  },
  
  // Feature limits (for free users)
  freeLimit: {
    type: Number,
    default: -1 // -1 means unlimited
  },
  freeLimitType: {
    type: String,
    enum: ['per_day', 'per_week', 'per_month', 'total'],
    default: 'per_day'
  },
  
  // Admin control
  canToggle: {
    type: Boolean,
    default: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedAt: {
    type: Date,
    default: Date.now
  },
  
  // Feature dependencies
  dependencies: [{
    type: String,
    ref: 'Feature'
  }],
  
  // UI configuration
  showInMenu: {
    type: Boolean,
    default: true
  },
  requiresAuth: {
    type: Boolean,
    default: true
  },
  
  // Analytics
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsed: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
featureSchema.index({ key: 1 });
featureSchema.index({ category: 1 });
featureSchema.index({ isPaid: 1 });
featureSchema.index({ isActive: 1 });
featureSchema.index({ order: 1 });

// Virtual for feature status
featureSchema.virtual('status').get(function() {
  if (!this.isActive) return 'disabled';
  if (this.isPaid) return 'paid';
  return 'free';
});

// Method to check if user can access feature
featureSchema.methods.canAccess = function(user, userPlan = null) {
  // Feature is disabled
  if (!this.isActive) return false;
  
  // Feature is free
  if (!this.isPaid) return true;
  
  // Feature is paid - check user subscription
  if (!userPlan || userPlan.subscriptionStatus !== 'active') return false;
  
  // Check if user's plan meets requirements
  const planHierarchy = { free: 0, basic: 1, premium: 2, pro: 3 };
  const userPlanLevel = planHierarchy[userPlan.planName] || 0;
  const requiredPlanLevel = planHierarchy[this.requiredPlan] || 0;
  
  return userPlanLevel >= requiredPlanLevel;
};

// Method to get feature access info
featureSchema.methods.getAccessInfo = function(user, userPlan = null) {
  const canAccess = this.canAccess(user, userPlan);
  
  return {
    key: this.key,
    name: this.name,
    canAccess,
    isPaid: this.isPaid,
    isActive: this.isActive,
    requiredPlan: this.requiredPlan,
    freeLimit: this.freeLimit,
    freeLimitType: this.freeLimitType,
    status: this.status,
    reason: canAccess ? null : (this.isPaid ? 'subscription_required' : 'feature_disabled')
  };
};

// Static method to get all features for user
featureSchema.statics.getUserFeatures = async function(user, userPlan = null) {
  const features = await this.find({ isActive: true }).sort({ order: 1 });
  
  return features.map(feature => feature.getAccessInfo(user, userPlan));
};

// Static method to get features by category
featureSchema.statics.getByCategory = function(category) {
  return this.find({ category, isActive: true }).sort({ order: 1 });
};

// Static method to toggle feature access
featureSchema.statics.toggleFeatureAccess = async function(featureKey, isPaid, adminId) {
  const feature = await this.findOne({ key: featureKey });
  if (!feature) throw new Error('Feature not found');
  
  feature.isPaid = isPaid;
  feature.lastModifiedBy = adminId;
  feature.lastModifiedAt = new Date();
  
  return await feature.save();
};

// Pre-save middleware
featureSchema.pre('save', function(next) {
  this.lastModifiedAt = new Date();
  next();
});

module.exports = mongoose.model('Feature', featureSchema);
