const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Plan = require('../models/Plan');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Referral = require('../models/Referral');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get all subscription plans (admin only)
router.get('/plans', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const plans = await Plan.find()
      .sort({ price: 1 });

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Get all plans error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Create new subscription plan (admin only)
router.post('/plans', authenticateToken, requireAdmin, [
  body('name').isString().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('description').isString().isLength({ min: 10, max: 500 }).withMessage('Description must be between 10 and 500 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('features').isArray().withMessage('Features must be an array'),
  body('features.*.name').isString().withMessage('Each feature name must be a string'),
  body('features.*.description').optional().isString().withMessage('Each feature description must be a string'),
  body('features.*.isIncluded').optional().isBoolean().withMessage('Each feature isIncluded must be a boolean'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('isPopular').optional().isBoolean().withMessage('isPopular must be a boolean')
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

    const { name, description, price, duration, features, isActive = true, isPopular = false } = req.body;

    // Check if plan with same name already exists
    const existingPlan = await Plan.findOne({ name });
    if (existingPlan) {
      return res.status(400).json({ 
        success: false, 
        message: 'Plan with this name already exists' 
      });
    }

    const plan = new Plan({
      name,
      description,
      price,
      duration,
      features,
      isActive,
      isPopular
    });

    await plan.save();

    res.status(201).json({
      success: true,
      message: 'Plan created successfully',
      data: plan
    });
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update subscription plan (admin only)
router.put('/plans/:planId', authenticateToken, requireAdmin, [
  body('name').optional().isString().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('description').optional().isString().isLength({ min: 10, max: 500 }).withMessage('Description must be between 10 and 500 characters'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('features').optional().isArray().withMessage('Features must be an array'),
  body('features.*.name').optional().isString().withMessage('Each feature name must be a string'),
  body('features.*.description').optional().isString().withMessage('Each feature description must be a string'),
  body('features.*.isIncluded').optional().isBoolean().withMessage('Each feature isIncluded must be a boolean'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('isPopular').optional().isBoolean().withMessage('isPopular must be a boolean')
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

    const { planId } = req.params;
    const updateData = req.body;

    // Check if plan exists
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    // Check if plan name is being changed and if new name already exists
    if (updateData.name && updateData.name !== plan.name) {
      const existingPlan = await Plan.findOne({ name: updateData.name });
      if (existingPlan) {
        return res.status(400).json({ 
          success: false, 
          message: 'Plan with this name already exists' 
        });
      }
    }

    // Update plan
    Object.assign(plan, updateData);
    await plan.save();

    res.json({
      success: true,
      message: 'Plan updated successfully',
      data: plan
    });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete subscription plan (admin only)
router.delete('/plans/:planId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { planId } = req.params;

    // Check if plan exists
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    // Check if plan is currently being used by any users
    const activeUsers = await User.countDocuments({
      'studentInfo.currentPlan': planId,
      'studentInfo.subscriptionStatus': 'active'
    });

    if (activeUsers > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete plan. ${activeUsers} users are currently subscribed to this plan.` 
      });
    }

    // Check if plan has any transactions
    const transactionCount = await Transaction.countDocuments({ plan: planId });
    if (transactionCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete plan. ${transactionCount} transactions are associated with this plan.` 
      });
    }

    await Plan.findByIdAndDelete(planId);

    res.json({
      success: true,
      message: 'Plan deleted successfully'
    });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Toggle plan status (admin only)
router.patch('/plans/:planId/toggle-status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { planId } = req.params;

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    plan.isActive = !plan.isActive;
    await plan.save();

    res.json({
      success: true,
      message: `Plan ${plan.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { isActive: plan.isActive }
    });
  } catch (error) {
    console.error('Toggle plan status error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get all transactions (admin only)
router.get('/transactions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const userId = req.query.userId;
    const planId = req.query.planId;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const query = {};

    // Apply filters
    if (status) query.status = status;
    if (userId) query.user = userId;
    if (planId) query.plan = planId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .populate('user', 'name email phone role')
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
    console.error('Get all transactions error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get transaction statistics (admin only)
router.get('/transactions/statistics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    // Total transactions
    const totalTransactions = await Transaction.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Completed transactions
    const completedTransactions = await Transaction.countDocuments({
      status: 'completed',
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Total revenue
    const revenueData = await Transaction.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$finalAmount' },
          totalDiscount: { $sum: '$discountAmount' }
        }
      }
    ]);

    // Transactions by status
    const transactionsByStatus = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Top plans by transactions
    const topPlans = await Transaction.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$plan',
          transactionCount: { $sum: 1 },
          totalRevenue: { $sum: '$finalAmount' }
        }
      },
      {
        $sort: { transactionCount: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: 'plans',
          localField: '_id',
          foreignField: '_id',
          as: 'planDetails'
        }
      },
      {
        $unwind: '$planDetails'
      }
    ]);

    // Referral usage statistics
    const referralStats = await Transaction.aggregate([
      {
        $match: {
          status: 'completed',
          referralCode: { $exists: true, $ne: null },
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$referralCode',
          usageCount: { $sum: 1 },
          totalDiscount: { $sum: '$discountAmount' }
        }
      },
      {
        $sort: { usageCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    const revenue = revenueData.length > 0 ? revenueData[0] : { totalRevenue: 0, totalDiscount: 0 };

    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        totalTransactions,
        completedTransactions,
        pendingTransactions: totalTransactions - completedTransactions,
        totalRevenue: revenue.totalRevenue,
        totalDiscount: revenue.totalDiscount,
        netRevenue: revenue.totalRevenue - revenue.totalDiscount,
        transactionsByStatus,
        topPlans,
        referralStats
      }
    });
  } catch (error) {
    console.error('Get transaction statistics error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get specific transaction details (admin only)
router.get('/transactions/:transactionId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId)
      .populate('user', 'name email phone role')
      .populate('plan', 'name description price duration features');

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Get transaction details error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update transaction status (admin only)
router.patch('/transactions/:transactionId/status', authenticateToken, requireAdmin, [
  body('status').isIn(['pending', 'completed', 'failed', 'cancelled']).withMessage('Invalid status'),
  body('notes').optional().isString().withMessage('Notes must be a string')
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

    const { transactionId } = req.params;
    const { status, notes } = req.body;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    transaction.status = status;
    if (notes) transaction.adminNotes = notes;
    
    if (status === 'completed') {
      transaction.completedAt = new Date();
    }

    await transaction.save();

    res.json({
      success: true,
      message: 'Transaction status updated successfully',
      data: { status: transaction.status }
    });
  } catch (error) {
    console.error('Update transaction status error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get subscription statistics (admin only)
router.get('/subscriptions/statistics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Active subscriptions count
    const activeSubscriptions = await User.countDocuments({
      'studentInfo.subscriptionStatus': 'active',
      'studentInfo.subscriptionExpiry': { $gt: new Date() }
    });

    // Expired subscriptions count
    const expiredSubscriptions = await User.countDocuments({
      'studentInfo.subscriptionStatus': 'active',
      'studentInfo.subscriptionExpiry': { $lte: new Date() }
    });

    // Subscriptions by plan
    const subscriptionsByPlan = await User.aggregate([
      {
        $match: {
          'studentInfo.subscriptionStatus': 'active',
          'studentInfo.subscriptionExpiry': { $gt: new Date() }
        }
      },
      {
        $group: {
          _id: '$studentInfo.currentPlan',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'plans',
          localField: '_id',
          foreignField: '_id',
          as: 'planDetails'
        }
      },
      {
        $unwind: '$planDetails'
      },
      {
        $project: {
          planName: '$planDetails.name',
          count: 1
        }
      }
    ]);

    // Subscriptions expiring soon (within 7 days)
    const expiringSoon = await User.countDocuments({
      'studentInfo.subscriptionStatus': 'active',
      'studentInfo.subscriptionExpiry': {
        $gt: new Date(),
        $lte: new Date(new Date().setDate(new Date().getDate() + 7))
      }
    });

    res.json({
      success: true,
      data: {
        activeSubscriptions,
        expiredSubscriptions,
        expiringSoon,
        subscriptionsByPlan
      }
    });
  } catch (error) {
    console.error('Get subscription statistics error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get all users with subscription details (admin only)
router.get('/users/subscriptions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const planId = req.query.planId;

    const query = { role: 'student' };
    
    if (status) {
      if (status === 'active') {
        query['studentInfo.subscriptionStatus'] = 'active';
        query['studentInfo.subscriptionExpiry'] = { $gt: new Date() };
      } else if (status === 'expired') {
        query['studentInfo.subscriptionStatus'] = 'active';
        query['studentInfo.subscriptionExpiry'] = { $lte: new Date() };
      } else {
        query['studentInfo.subscriptionStatus'] = status;
      }
    }

    if (planId) {
      query['studentInfo.currentPlan'] = planId;
    }

    const users = await User.find(query)
      .populate('studentInfo.currentPlan', 'name description price duration')
      .select('name email phone studentInfo.subscriptionStatus studentInfo.subscriptionExpiry studentInfo.subscriptionStartDate')
      .sort({ 'studentInfo.subscriptionStartDate': -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users subscriptions error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
