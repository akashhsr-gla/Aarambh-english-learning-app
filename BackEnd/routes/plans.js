const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Plan = require('../models/Plan');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Validation middleware
const validatePlan = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Plan name must be between 2 and 100 characters'),
  body('description').trim().isLength({ min: 10, max: 500 }).withMessage('Description must be between 10 and 500 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('durationType').optional().isIn(['days', 'weeks', 'months', 'years']).withMessage('Duration type must be days, weeks, months, or years'),
  body('features').isArray().withMessage('Features must be an array'),
  body('features.*.name').isString().withMessage('Each feature name must be a string'),
  body('features.*.description').optional().isString().withMessage('Each feature description must be a string'),
  body('features.*.isIncluded').optional().isBoolean().withMessage('Each feature isIncluded must be a boolean'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('isPopular').optional().isBoolean().withMessage('isPopular must be a boolean'),
  body('maxSessions').optional().isInt({ min: -1 }).withMessage('Max sessions must be -1 (unlimited) or a positive number'),
  body('maxGames').optional().isInt({ min: -1 }).withMessage('Max games must be -1 (unlimited) or a positive number'),
  body('maxLectures').optional().isInt({ min: -1 }).withMessage('Max lectures must be -1 (unlimited) or a positive number'),
  body('includesVideoCalls').optional().isBoolean().withMessage('includesVideoCalls must be a boolean'),
  body('includesVoiceCalls').optional().isBoolean().withMessage('includesVoiceCalls must be a boolean'),
  body('includesGroupCalls').optional().isBoolean().withMessage('includesGroupCalls must be a boolean'),
  body('includesChat').optional().isBoolean().withMessage('includesChat must be a boolean'),
  body('includesGames').optional().isBoolean().withMessage('includesGames must be a boolean'),
  body('includesLectures').optional().isBoolean().withMessage('includesLectures must be a boolean'),
  body('priority').optional().isInt({ min: 0 }).withMessage('Priority must be a non-negative number'),
  body('razorpayPlanId').optional().isString().withMessage('Razorpay plan ID must be a string')
];

const validatePlanUpdate = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Plan name must be between 2 and 100 characters'),
  body('description').optional().trim().isLength({ min: 10, max: 500 }).withMessage('Description must be between 10 and 500 characters'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('durationType').optional().isIn(['days', 'weeks', 'months', 'years']).withMessage('Duration type must be days, weeks, months, or years'),
  body('features').optional().isArray().withMessage('Features must be an array'),
  body('features.*.name').optional().isString().withMessage('Each feature name must be a string'),
  body('features.*.description').optional().isString().withMessage('Each feature description must be a string'),
  body('features.*.isIncluded').optional().isBoolean().withMessage('Each feature isIncluded must be a boolean'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('isPopular').optional().isBoolean().withMessage('isPopular must be a boolean'),
  body('maxSessions').optional().isInt({ min: -1 }).withMessage('Max sessions must be -1 (unlimited) or a positive number'),
  body('maxGames').optional().isInt({ min: -1 }).withMessage('Max games must be -1 (unlimited) or a positive number'),
  body('maxLectures').optional().isInt({ min: -1 }).withMessage('Max lectures must be -1 (unlimited) or a positive number'),
  body('includesVideoCalls').optional().isBoolean().withMessage('includesVideoCalls must be a boolean'),
  body('includesVoiceCalls').optional().isBoolean().withMessage('includesVoiceCalls must be a boolean'),
  body('includesGroupCalls').optional().isBoolean().withMessage('includesGroupCalls must be a boolean'),
  body('includesChat').optional().isBoolean().withMessage('includesChat must be a boolean'),
  body('includesGames').optional().isBoolean().withMessage('includesGames must be a boolean'),
  body('includesLectures').optional().isBoolean().withMessage('includesLectures must be a boolean'),
  body('priority').optional().isInt({ min: 0 }).withMessage('Priority must be a non-negative number'),
  body('razorpayPlanId').optional().isString().withMessage('Razorpay plan ID must be a string')
];

// 1. GET ALL PLANS (Public - for displaying available plans)
router.get('/', async (req, res) => {
  try {
    const { active, premium, sortBy = 'priority', sortOrder = 'desc' } = req.query;

    // Build filter
    let filter = {};
    if (active !== undefined) filter.isActive = active === 'true';
    if (premium !== undefined) filter.isPremium = premium === 'true';

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const plans = await Plan.find(filter)
      .sort(sort)
      .select('name description price duration durationType features isActive isPopular priority maxSessions maxGames maxLectures includesVideoCalls includesVoiceCalls includesGroupCalls includesChat includesGames includesLectures');

    res.json({
      success: true,
      message: 'Plans retrieved successfully',
      data: {
        plans,
        total: plans.length,
        filters: {
          active: active !== undefined ? active === 'true' : 'all',
          premium: premium !== undefined ? premium === 'true' : 'all',
          sortBy,
          sortOrder
        }
      }
    });

  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 2. GET PLAN BY ID (Public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan ID format'
      });
    }

    const plan = await Plan.findById(id)
      .select('name description price duration durationType features isActive isPopular priority maxSessions maxGames maxLectures includesVideoCalls includesVoiceCalls includesGroupCalls includesChat includesGames includesLectures razorpayPlanId createdAt updatedAt');

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    res.json({
      success: true,
      message: 'Plan retrieved successfully',
      data: plan
    });

  } catch (error) {
    console.error('Get plan by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 3. CREATE PLAN (Admin only)
router.post('/', authenticateToken, requireAdmin, validatePlan, async (req, res) => {
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
      name, description, price, duration, durationType = 'days', features,
      isActive = true, isPopular = false, maxSessions = -1, maxGames = -1,
      maxLectures = -1, includesVideoCalls = false, includesVoiceCalls = false,
      includesGroupCalls = false, includesChat = true, includesGames = true,
      includesLectures = true, priority = 0, razorpayPlanId
    } = req.body;

    // Check if plan with same name already exists
    const existingPlan = await Plan.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

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
      durationType,
      features,
      isActive,
      isPopular,
      maxSessions,
      maxGames,
      maxLectures,
      includesVideoCalls,
      includesVoiceCalls,
      includesGroupCalls,
      includesChat,
      includesGames,
      includesLectures,
      priority,
      razorpayPlanId,
      createdBy: req.user._id
    });

    await plan.save();

    res.status(201).json({
      success: true,
      message: 'Plan created successfully',
      data: {
        id: plan._id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        duration: plan.duration,
        durationType: plan.durationType,
        features: plan.features,
        isActive: plan.isActive,
        isPopular: plan.isPopular,
        priority: plan.priority,
        createdAt: plan.createdAt
      }
    });

  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 4. UPDATE PLAN (Admin only)
router.put('/:id', authenticateToken, requireAdmin, validatePlanUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan ID format'
      });
    }

    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    const {
      name, description, price, duration, durationType, features,
      isActive, isPopular, maxSessions, maxGames, maxLectures,
      includesVideoCalls, includesVoiceCalls, includesGroupCalls,
      includesChat, includesGames, includesLectures, priority, razorpayPlanId
    } = req.body;

    // Check for duplicate names if updating
    if (name && name !== plan.name) {
      const existingPlan = await Plan.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id }
      });

      if (existingPlan) {
        return res.status(400).json({
          success: false,
          message: 'Plan with this name already exists'
        });
      }
    }

    // Update fields
    if (name !== undefined) plan.name = name;
    if (description !== undefined) plan.description = description;
    if (price !== undefined) plan.price = price;
    if (duration !== undefined) plan.duration = duration;
    if (durationType !== undefined) plan.durationType = durationType;
    if (features !== undefined) plan.features = features;
    if (isActive !== undefined) plan.isActive = isActive;
    if (isPopular !== undefined) plan.isPopular = isPopular;
    if (maxSessions !== undefined) plan.maxSessions = maxSessions;
    if (maxGames !== undefined) plan.maxGames = maxGames;
    if (maxLectures !== undefined) plan.maxLectures = maxLectures;
    if (includesVideoCalls !== undefined) plan.includesVideoCalls = includesVideoCalls;
    if (includesVoiceCalls !== undefined) plan.includesVoiceCalls = includesVoiceCalls;
    if (includesGroupCalls !== undefined) plan.includesGroupCalls = includesGroupCalls;
    if (includesChat !== undefined) plan.includesChat = includesChat;
    if (includesGames !== undefined) plan.includesGames = includesGames;
    if (includesLectures !== undefined) plan.includesLectures = includesLectures;
    if (priority !== undefined) plan.priority = priority;
    if (razorpayPlanId !== undefined) plan.razorpayPlanId = razorpayPlanId;

    plan.updatedAt = new Date();
    await plan.save();

    res.json({
      success: true,
      message: 'Plan updated successfully',
      data: {
        id: plan._id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        duration: plan.duration,
        durationType: plan.durationType,
        features: plan.features,
        isActive: plan.isActive,
        isPopular: plan.isPopular,
        priority: plan.priority,
        updatedAt: plan.updatedAt
      }
    });

  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 5. DELETE PLAN (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan ID format'
      });
    }

    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Check if plan is currently being used by any users
    const activeUsers = await User.countDocuments({
      'studentInfo.currentPlan': id,
      'studentInfo.subscriptionStatus': 'active'
    });

    if (activeUsers > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete plan. ${activeUsers} users are currently subscribed to this plan.`
      });
    }

    // Check if plan has any transactions
    const transactionCount = await Transaction.countDocuments({ plan: id });
    if (transactionCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete plan. ${transactionCount} transactions are associated with this plan.`
      });
    }

    await Plan.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Plan deleted successfully',
      data: {
        id: plan._id,
        name: plan.name,
        price: plan.price
      }
    });

  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 6. TOGGLE PLAN STATUS (Admin only)
router.patch('/:id/toggle-status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan ID format'
      });
    }

    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    plan.isActive = !plan.isActive;
    plan.updatedAt = new Date();
    await plan.save();

    res.json({
      success: true,
      message: `Plan ${plan.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: plan._id,
        name: plan.name,
        isActive: plan.isActive,
        updatedAt: plan.updatedAt
      }
    });

  } catch (error) {
    console.error('Toggle plan status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 7. GET PLAN STATISTICS (Admin only)
router.get('/admin/statistics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get plan statistics
    const planStats = await Plan.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$isActive',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    // Get popular plans
    const popularPlans = await Plan.find({ isPopular: true, isActive: true })
      .select('name price duration priority')
      .sort({ priority: -1, price: 1 });

    // Get plans by price range
    const priceRanges = await Plan.aggregate([
      { $match: dateFilter },
      {
        $bucket: {
          groupBy: '$price',
          boundaries: [0, 100, 500, 1000, 5000, 10000],
          default: 'Above 10000',
          output: {
            count: { $sum: 1 },
            plans: { $push: { name: '$name', price: '$price' } }
          }
        }
      }
    ]);

    // Get recent plans
    const recentPlans = await Plan.find(dateFilter)
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name price duration isActive createdAt');

    res.json({
      success: true,
      message: 'Plan statistics retrieved successfully',
      data: {
        planStats,
        popularPlans,
        priceRanges,
        recentPlans,
        filters: {
          startDate: startDate || 'none',
          endDate: endDate || 'none'
        }
      }
    });

  } catch (error) {
    console.error('Get plan statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
