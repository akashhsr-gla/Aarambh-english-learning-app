const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // User and Plan Information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  
  // Payment Details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  finalAmount: {
    type: Number,
    required: true
  },
  
  // Razorpay Details
  razorpayOrderId: {
    type: String,
    unique: true,
    required: true
  },
  razorpayPaymentId: {
    type: String,
    unique: true,
    sparse: true
  },
  razorpaySignature: {
    type: String
  },
  
  // Referral System
  referralCode: {
    type: String
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Teacher who referred
  },
  discountPercentage: {
    type: Number,
    default: 0
  },
  
  // Transaction Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  
  // Subscription Details
  subscriptionStartDate: {
    type: Date
  },
  subscriptionEndDate: {
    type: Date
  },
  
  // Payment Method
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'wallet', 'coupon'],
    default: 'razorpay'
  },
  
  // Additional Information
  description: {
    type: String
  },
  metadata: {
    type: Map,
    of: String
  },
  
  // Error Information
  errorCode: {
    type: String
  },
  errorDescription: {
    type: String
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ user: 1 });
transactionSchema.index({ razorpayOrderId: 1 });
transactionSchema.index({ razorpayPaymentId: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ referredBy: 1 });

// Virtual for transaction summary
transactionSchema.virtual('summary').get(function() {
  return {
    id: this._id,
    amount: this.amount,
    finalAmount: this.finalAmount,
    discountAmount: this.discountAmount,
    status: this.status,
    createdAt: this.createdAt,
    planName: this.plan?.name || 'Unknown Plan'
  };
});

// Pre-save middleware to calculate final amount
transactionSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isModified('discountAmount')) {
    this.finalAmount = this.amount - this.discountAmount;
  }
  next();
});

// Method to mark transaction as completed
transactionSchema.methods.markCompleted = function(paymentId, signature) {
  this.status = 'completed';
  this.razorpayPaymentId = paymentId;
  this.razorpaySignature = signature;
  this.completedAt = new Date();
  
  // Set subscription dates
  const plan = this.plan;
  if (plan) {
    this.subscriptionStartDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.getDaysInDuration());
    this.subscriptionEndDate = endDate;
  }
};

// Method to mark transaction as failed
transactionSchema.methods.markFailed = function(errorCode, errorDescription) {
  this.status = 'failed';
  this.errorCode = errorCode;
  this.errorDescription = errorDescription;
};

// Method to apply referral discount
transactionSchema.methods.applyReferralDiscount = function(discountPercentage) {
  this.discountPercentage = discountPercentage;
  this.discountAmount = Math.round((this.amount * discountPercentage) / 100);
  this.finalAmount = this.amount - this.discountAmount;
};

// Static method to get user transactions
transactionSchema.statics.getUserTransactions = function(userId, limit = 10, skip = 0) {
  return this.find({ user: userId })
    .populate('plan', 'name description')
    .populate('referredBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get teacher referral transactions
transactionSchema.statics.getTeacherReferrals = function(teacherId, limit = 10, skip = 0) {
  return this.find({ referredBy: teacherId, status: 'completed' })
    .populate('user', 'name email')
    .populate('plan', 'name price')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get transaction statistics
transactionSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalAmount: { $sum: '$finalAmount' },
        completedTransactions: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        failedTransactions: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        totalDiscount: { $sum: '$discountAmount' }
      }
    }
  ]);
  
  return stats[0] || {
    totalTransactions: 0,
    totalAmount: 0,
    completedTransactions: 0,
    failedTransactions: 0,
    totalDiscount: 0
  };
};

module.exports = mongoose.model('Transaction', transactionSchema);
