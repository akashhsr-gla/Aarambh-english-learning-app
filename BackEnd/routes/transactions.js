const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Plan = require('../models/Plan');
const Referral = require('../models/Referral');
const { authenticateToken, requireSubscription } = require('../middleware/auth');

// Initialize Razorpay (placeholder - replace with actual keys)
const Razorpay = require('razorpay');
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret'
});

// Get user's subscription details
router.get('/subscription', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('studentInfo.currentPlan', 'name description price duration features')
      .populate('studentInfo.currentPlan.planId', 'name description price duration features');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get subscription status
    const subscriptionStatus = user.studentInfo?.subscriptionStatus || 'inactive';
    const currentPlan = user.studentInfo?.currentPlan;
    const subscriptionExpiry = user.studentInfo?.subscriptionExpiry;

    // Get transaction history
    const transactions = await Transaction.find({ user: req.user.id })
      .populate('plan', 'name description price duration')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        subscriptionStatus,
        currentPlan,
        subscriptionExpiry,
        transactions
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get available subscription plans
router.get('/plans', async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true })
      .select('name description price duration features isPopular')
      .sort({ price: 1 });

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Create payment order
router.post('/create-order', authenticateToken, [
  body('planId').isMongoId().withMessage('Valid plan ID is required'),
  body('referralCode').optional().isString().withMessage('Referral code must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { planId, referralCode } = req.body;

    // Check if plan exists and is active
    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(400).json({ success: false, message: 'Invalid or inactive plan' });
    }

    // Check if user already has an active subscription
    const user = await User.findById(req.user.id);
    if (user.studentInfo?.subscriptionStatus === 'active' && 
        user.studentInfo?.subscriptionExpiry > new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already has an active subscription' 
      });
    }

    // Calculate final amount (with referral discount if applicable)
    let finalAmount = plan.price;
    let discountAmount = 0;
    let referralDiscount = null;

    if (referralCode) {
      const referral = await Referral.findOne({ 
        referralCode, 
        isActive: true 
      }).populate('teacher', 'name email');

      if (referral) {
        discountAmount = (plan.price * referral.discountPercentage) / 100;
        finalAmount = plan.price - discountAmount;
        referralDiscount = {
          code: referralCode,
          discountPercentage: referral.discountPercentage,
          discountAmount,
          teacherName: referral.teacher.name
        };
      }
    }

    // Create Razorpay order
    const orderOptions = {
      amount: Math.round(finalAmount * 100), // Razorpay expects amount in paise
      currency: 'INR',
      receipt: `order_${Date.now()}_${req.user.id}`,
      notes: {
        userId: req.user.id,
        planId: planId,
        referralCode: referralCode || 'none'
      }
    };

    const order = await razorpay.orders.create(orderOptions);

    // Create transaction record
    const transaction = new Transaction({
      user: req.user.id,
      plan: planId,
      amount: plan.price,
      finalAmount,
      discountAmount,
      referralCode: referralCode || null,
      razorpayOrderId: order.id,
      status: 'pending',
      paymentMethod: 'razorpay'
    });

    await transaction.save();

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: finalAmount,
        currency: 'INR',
        referralDiscount,
        transactionId: transaction._id
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Verify payment and activate subscription
router.post('/verify-payment', authenticateToken, [
  body('razorpayOrderId').isString().withMessage('Order ID is required'),
  body('razorpayPaymentId').isString().withMessage('Payment ID is required'),
  body('razorpaySignature').isString().withMessage('Signature is required'),
  body('transactionId').isMongoId().withMessage('Transaction ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { 
      razorpayOrderId, 
      razorpayPaymentId, 
      razorpaySignature, 
      transactionId 
    } = req.body;

    // Verify payment signature
    const crypto = require('crypto');
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpayOrderId + '|' + razorpayPaymentId)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Find and update transaction
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (transaction.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Payment already processed' });
    }

    // Update transaction
    transaction.status = 'completed';
    transaction.razorpayPaymentId = razorpayPaymentId;
    transaction.completedAt = new Date();
    transaction.paymentDetails = {
      method: 'razorpay',
      transactionId: razorpayPaymentId,
      verifiedAt: new Date()
    };

    await transaction.save();

    // Update user subscription
    const user = await User.findById(req.user.id);
    const plan = await Plan.findById(transaction.plan);

    if (!plan) {
      return res.status(400).json({ success: false, message: 'Plan not found' });
    }

    // Calculate subscription expiry
    const subscriptionExpiry = new Date();
    subscriptionExpiry.setDate(subscriptionExpiry.getDate() + plan.duration);

    user.studentInfo = {
      ...user.studentInfo,
      currentPlan: plan._id,
      subscriptionStatus: 'active',
      subscriptionExpiry,
      subscriptionStartDate: new Date(),
      lastPaymentDate: new Date()
    };

    await user.save();

    // Update referral usage if applicable
    if (transaction.referralCode) {
      await Referral.findOneAndUpdate(
        { referralCode: transaction.referralCode },
        { 
          $inc: { totalUses: 1 },
          $push: { usedBy: { user: req.user.id, transaction: transaction._id, usedAt: new Date() } }
        }
      );
    }

    res.json({
      success: true,
      message: 'Payment verified and subscription activated',
      data: {
        transactionId: transaction._id,
        subscriptionExpiry,
        plan: plan.name
      }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Cancel subscription
router.post('/cancel-subscription', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user.studentInfo?.subscriptionStatus === 'active') {
      return res.status(400).json({ 
        success: false, 
        message: 'No active subscription to cancel' 
      });
    }

    // Update subscription status
    user.studentInfo.subscriptionStatus = 'cancelled';
    user.studentInfo.subscriptionCancelledAt = new Date();
    
    await user.save();

    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get transaction history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    const query = { user: req.user.id };
    if (status) query.status = status;

    const transactions = await Transaction.find(query)
      .populate('plan', 'name description price duration')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get specific transaction details
router.get('/:transactionId', authenticateToken, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId)
      .populate('plan', 'name description price duration features')
      .populate('user', 'name email phone');

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // Check if user owns this transaction or is admin
    if (transaction.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
