const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  // Teacher Information
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Referral Code
  referralCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  
  // Discount Configuration
  discountPercentage: {
    type: Number,
    default: 25, // 25% discount as specified
    min: 0,
    max: 100
  },
  
  // Usage Tracking
  totalUses: {
    type: Number,
    default: 0
  },
  maxUses: {
    type: Number,
    default: -1 // -1 means unlimited
  },
  
  // Students who used this referral code
  usedBy: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    usedAt: {
      type: Date,
      default: Date.now
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    },
    discountApplied: {
      type: Number,
      required: true
    },
    originalAmount: {
      type: Number,
      required: true
    },
    finalAmount: {
      type: Number,
      required: true
    }
  }],
  
  // Referral Status
  isActive: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  
  // Validity Period
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date
  },
  
  // Restrictions
  minimumAmount: {
    type: Number,
    default: 0 // Minimum transaction amount to apply discount
  },
  maximumDiscount: {
    type: Number,
    default: 1000 // Maximum discount amount in INR
  },
  
  // Statistics
  totalDiscountGiven: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
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
referralSchema.index({ teacher: 1 });
referralSchema.index({ referralCode: 1 });
referralSchema.index({ isActive: 1 });
referralSchema.index({ isApproved: 1 });
referralSchema.index({ validFrom: 1 });
referralSchema.index({ validUntil: 1 });

// Virtual for referral summary
referralSchema.virtual('summary').get(function() {
  return {
    id: this._id,
    referralCode: this.referralCode,
    discountPercentage: this.discountPercentage,
    totalUses: this.totalUses,
    maxUses: this.maxUses,
    isActive: this.isActive,
    isApproved: this.isApproved,
    totalDiscountGiven: this.totalDiscountGiven,
    totalRevenue: this.totalRevenue
  };
});

// Virtual to check if referral code is valid
referralSchema.virtual('isValid').get(function() {
  if (!this.isActive || !this.isApproved) {
    return false;
  }
  
  if (this.maxUses !== -1 && this.totalUses >= this.maxUses) {
    return false;
  }
  
  const now = new Date();
  if (this.validFrom && now < this.validFrom) {
    return false;
  }
  
  if (this.validUntil && now > this.validUntil) {
    return false;
  }
  
  return true;
});

// Method to generate referral code
referralSchema.methods.generateReferralCode = function() {
  const { v4: uuidv4 } = require('uuid');
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  this.referralCode = `${timestamp}${random}`.toUpperCase();
};

// Method to use referral code
referralSchema.methods.useReferralCode = function(studentId, transactionId, originalAmount) {
  if (!this.isValid) {
    throw new Error('Referral code is not valid');
  }
  
  // Check if student already used this code
  const alreadyUsed = this.usedBy.find(usage => usage.student.toString() === studentId.toString());
  if (alreadyUsed) {
    throw new Error('Student has already used this referral code');
  }
  
  // Calculate discount
  const discountAmount = Math.min(
    (originalAmount * this.discountPercentage) / 100,
    this.maximumDiscount
  );
  
  const finalAmount = originalAmount - discountAmount;
  
  // Add usage record
  this.usedBy.push({
    student: studentId,
    usedAt: new Date(),
    transaction: transactionId,
    discountApplied: discountAmount,
    originalAmount,
    finalAmount
  });
  
  // Update statistics
  this.totalUses += 1;
  this.totalDiscountGiven += discountAmount;
  this.totalRevenue += finalAmount;
  
  return {
    discountAmount,
    finalAmount,
    discountPercentage: this.discountPercentage
  };
};

// Method to validate referral code
referralSchema.methods.validateReferralCode = function(studentId, amount) {
  const errors = [];
  
  if (!this.isValid) {
    errors.push('Referral code is not valid');
  }
  
  if (amount < this.minimumAmount) {
    errors.push(`Minimum amount required: ₹${this.minimumAmount}`);
  }
  
  const alreadyUsed = this.usedBy.find(usage => usage.student.toString() === studentId.toString());
  if (alreadyUsed) {
    errors.push('You have already used this referral code');
  }
  
  return errors;
};

// Method to calculate potential discount
referralSchema.methods.calculateDiscount = function(amount) {
  const discountAmount = Math.min(
    (amount * this.discountPercentage) / 100,
    this.maximumDiscount
  );
  
  return {
    discountAmount,
    finalAmount: amount - discountAmount,
    discountPercentage: this.discountPercentage
  };
};

// Static method to find valid referral code
referralSchema.statics.findValidReferralCode = function(referralCode, studentId, amount) {
  return this.findOne({
    referralCode: referralCode.toUpperCase(),
    isActive: true,
    isApproved: true
  }).then(referral => {
    if (!referral) {
      throw new Error('Referral code not found');
    }
    
    const errors = referral.validateReferralCode(studentId, amount);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
    
    return referral;
  });
};

// Static method to get teacher referrals
referralSchema.statics.getTeacherReferrals = function(teacherId) {
  return this.find({ teacher: teacherId })
    .populate('usedBy.student', 'name email')
    .populate('usedBy.transaction', 'amount finalAmount status')
    .sort({ createdAt: -1 });
};

// Static method to get referral statistics
referralSchema.statics.getReferralStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalReferrals: { $sum: 1 },
        activeReferrals: { $sum: { $cond: ['$isActive', 1, 0] } },
        totalUses: { $sum: '$totalUses' },
        totalDiscountGiven: { $sum: '$totalDiscountGiven' },
        totalRevenue: { $sum: '$totalRevenue' }
      }
    }
  ]);
  
  return stats[0] || {
    totalReferrals: 0,
    activeReferrals: 0,
    totalUses: 0,
    totalDiscountGiven: 0,
    totalRevenue: 0
  };
};

// Static method to get top performing referrals
referralSchema.statics.getTopReferrals = function(limit = 10) {
  return this.find({ isActive: true })
    .populate('teacher', 'name email')
    .sort({ totalUses: -1, totalRevenue: -1 })
    .limit(limit);
};

// Pre-save middleware to generate referral code if not provided
referralSchema.pre('save', function(next) {
  if (!this.referralCode) {
    this.generateReferralCode();
  }
  next();
});

module.exports = mongoose.model('Referral', referralSchema);
