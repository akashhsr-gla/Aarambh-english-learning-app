const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Referral = require('../models/Referral');
const User = require('../models/User');
const { authenticateToken, requireAdmin, requireTeacher } = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Plan = require('../models/Plan');

// Validation middleware
const validateReferral = [
  body('teacher').isMongoId().withMessage('Valid teacher ID is required'),
  // Admin cannot set custom referralCode anymore; it is auto-generated for teacher
  body('discountPercentage').isInt({ min: 1, max: 100 }).withMessage('Discount percentage must be between 1 and 100'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('maxUses').optional().isInt({ min: 1 }).withMessage('Max uses must be a positive number'),
  body('expiryDate').optional().isISO8601().withMessage('Invalid expiry date format'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters')
];

const validateReferralUpdate = [
  // Prevent changing referralCode via update; only discount and status-like fields allowed
  body('referralCode').custom((value) => {
    if (value !== undefined) {
      throw new Error('Referral code cannot be changed');
    }
    return true;
  }),
  body('discountPercentage').optional().isInt({ min: 1, max: 100 }).withMessage('Discount percentage must be between 1 and 100'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('maxUses').optional().isInt({ min: 1 }).withMessage('Max uses must be a positive number'),
  body('expiryDate').optional().isISO8601().withMessage('Invalid expiry date format'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters')
];

// 1. GET ALL REFERRALS (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      teacher, 
      status, 
      search, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      page = 1, 
      limit = 20 
    } = req.query;

    // Build filter
    let filter = {};
    if (teacher) filter.teacher = teacher;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;
    
    if (search) {
      filter.$or = [
        { referralCode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get referrals with pagination
    const referrals = await Referral.find(filter)
      .populate('teacher', 'name email phone')
      .populate('usedBy', 'name email phone')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Referral.countDocuments(filter);

    // Get referral statistics
    const referralStats = await Referral.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$isActive',
          count: { $sum: 1 },
          totalUses: { $sum: '$totalUses' },
          avgDiscount: { $avg: '$discountPercentage' }
        }
      }
    ]);

    res.json({
      success: true,
      message: 'Referrals retrieved successfully',
      data: {
        referrals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        statistics: referralStats,
        filters: {
          teacher: teacher || 'all',
          status: status || 'all',
          search: search || 'none',
          sortBy,
          sortOrder
        }
      }
    });

  } catch (error) {
    console.error('Get referrals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 2. GET REFERRAL BY ID (Admin can access all, teachers can access their own)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid referral ID format'
      });
    }

    const referral = await Referral.findById(id)
      .populate('teacher', 'name email phone')
      .populate('usedBy', 'name email phone');

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Referral not found'
      });
    }

    // Check if user can access this referral
    if (req.user.role !== 'admin' && req.user._id.toString() !== referral.teacher.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own referrals.'
      });
    }

    res.json({
      success: true,
      message: 'Referral retrieved successfully',
      data: referral
    });

  } catch (error) {
    console.error('Get referral by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 3. CREATE REFERRAL (Admin only)
router.post('/', authenticateToken, requireAdmin, validateReferral, async (req, res) => {
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
      teacher, 
      discountPercentage, 
      isActive = true, 
      maxUses, 
      expiryDate, 
      description 
    } = req.body;

    // Check if teacher exists and is actually a teacher
    const teacherUser = await User.findById(teacher);
    if (!teacherUser) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    if (teacherUser.role !== 'teacher') {
      return res.status(400).json({
        success: false,
        message: 'User must be a teacher to have referral codes'
      });
    }

    // Generate a unique 6-digit referral code for the teacher
    const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();
    let referralCode;
    let attempts = 0;
    while (attempts < 5) {
      const code = generateCode();
      const exists = await Referral.findOne({ referralCode: code }).lean();
      if (!exists) { referralCode = code; break; }
      attempts += 1;
    }
    if (!referralCode) referralCode = generateCode();

    // Create referral
    const referral = new Referral({
      teacher,
      referralCode,
      discountPercentage,
      isActive,
      maxUses,
      expiryDate,
      description
    });

    await referral.save();

    // Update teacher's referral code
    teacherUser.teacherInfo.referralCode = referralCode;
    await teacherUser.save();

    // Populate teacher info for response
    await referral.populate('teacher', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Referral created successfully',
      data: referral
    });

  } catch (error) {
    console.error('Create referral error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 4. UPDATE REFERRAL (Admin only)
router.put('/:id', authenticateToken, requireAdmin, validateReferralUpdate, async (req, res) => {
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
        message: 'Invalid referral ID format'
      });
    }

    const referral = await Referral.findById(id);
    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Referral not found'
      });
    }

    // Disallow changing referralCode via update
    if (req.body.referralCode !== undefined) {
        return res.status(400).json({
          success: false,
        message: 'Referral code cannot be changed'
      });
    }

    // Update only allowed fields
    const { discountPercentage: dp, isActive, maxUses, expiryDate, description } = req.body;
    if (dp !== undefined) referral.discountPercentage = dp;
    if (isActive !== undefined) referral.isActive = isActive;
    if (maxUses !== undefined) referral.maxUses = maxUses;
    if (expiryDate !== undefined) referral.expiryDate = expiryDate;
    if (description !== undefined) referral.description = description;
    referral.updatedAt = new Date();
    await referral.save();

    // Never update teacher's referral code from here

    // Populate teacher info for response
    await referral.populate('teacher', 'name email phone');

    res.json({
      success: true,
      message: 'Referral updated successfully',
      data: referral
    });

  } catch (error) {
    console.error('Update referral error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 5. DELETE REFERRAL (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid referral ID format'
      });
    }

    const referral = await Referral.findById(id);
    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Referral not found'
      });
    }

    // Check if referral has been used
    if (referral.totalUses > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete referral. It has been used ${referral.totalUses} times.`
      });
    }

    // Check if there are associated transactions
    const transactionCount = await Transaction.countDocuments({ referralCode: referral.referralCode });
    if (transactionCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete referral. ${transactionCount} transactions are associated with this referral code.`
      });
    }

    await Referral.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Referral deleted successfully'
    });

  } catch (error) {
    console.error('Delete referral error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 6. TOGGLE REFERRAL STATUS (Admin only)
router.patch('/:id/toggle-status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid referral ID format'
      });
    }

    const referral = await Referral.findById(id);
    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Referral not found'
      });
    }

    referral.isActive = !referral.isActive;
    referral.updatedAt = new Date();
    await referral.save();

    res.json({
      success: true,
      message: `Referral ${referral.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { isActive: referral.isActive }
    });

  } catch (error) {
    console.error('Toggle referral status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 7. GET TEACHER'S REFERRALS (Teacher can view their own, Admin can view any teacher's)
router.get('/teacher/:teacherId', authenticateToken, async (req, res) => {
  try {
    const { teacherId } = req.params;

    // Validate ID format
    if (!teacherId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid teacher ID format'
      });
    }

    // Check if user can access this teacher's referrals
    if (req.user.role !== 'admin' && req.user._id.toString() !== teacherId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own referrals.'
      });
    }

    const referrals = await Referral.find({ teacher: teacherId })
      .populate({ path: 'usedBy.student', select: 'name email phone' })
      .sort({ createdAt: -1 });

    // Get teacher info
    const teacher = await User.findById(teacherId).select('name email phone role teacherInfo.referralCode');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Get referral statistics for this teacher
    const referralStats = await Referral.aggregate([
      { $match: { teacher: teacher._id } },
      {
        $group: {
          _id: null,
          totalReferrals: { $sum: 1 },
          activeReferrals: { $sum: { $cond: ['$isActive', 1, 0] } },
          totalUses: { $sum: '$totalUses' },
          totalDiscount: { $sum: { $multiply: ['$discountPercentage', '$totalUses'] } }
        }
      }
    ]);

    // Fetch transactions associated with this teacher's code usage
    const transactions = await Transaction.find({ referredBy: teacherId, status: 'completed' })
      .populate('user', 'name email phone')
      .populate('plan', 'name price duration description')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Teacher referrals retrieved successfully',
      data: {
        teacher,
        code: teacher.teacherInfo?.referralCode || null,
        referrals,
        transactions,
        statistics: referralStats[0] || {
          totalReferrals: 0,
          activeReferrals: 0,
          totalUses: 0,
          totalDiscount: 0
        }
      }
    });

  } catch (error) {
    console.error('Get teacher referrals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 8. GET REFERRAL STATISTICS (Admin only)
router.get('/admin/statistics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, teacher } = req.query;

    // Build date filter
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Build teacher filter
    let teacherFilter = {};
    if (teacher) {
      teacherFilter.teacher = teacher;
    }

    // Combine filters
    const filter = { ...dateFilter, ...teacherFilter };

    // Get comprehensive referral statistics
    const referralStats = await Referral.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            isActive: '$isActive',
            teacher: '$teacher'
          },
          count: { $sum: 1 },
          totalUses: { $sum: '$totalUses' },
          avgDiscount: { $avg: '$discountPercentage' }
        }
      },
      {
        $group: {
          _id: '$_id.teacher',
          statuses: {
            $push: {
              isActive: '$_id.isActive',
              count: '$count',
              totalUses: '$totalUses',
              avgDiscount: '$avgDiscount'
            }
          },
          totalReferrals: { $sum: '$count' },
          totalUses: { $sum: '$totalUses' }
        }
      },
      { $sort: { totalUses: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'teacherDetails'
        }
      },
      { $unwind: '$teacherDetails' }
    ]);

    // Get top performing referrals
    const topReferrals = await Referral.find(filter)
      .populate('teacher', 'name email')
      .sort({ totalUses: -1 })
      .limit(10)
      .select('referralCode discountPercentage totalUses isActive createdAt');

    // Get referral usage over time
    const usageOverTime = await Referral.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          newReferrals: { $sum: 1 },
          totalUses: { $sum: '$totalUses' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      message: 'Referral statistics retrieved successfully',
      data: {
        referralStats,
        topReferrals,
        usageOverTime,
        filters: {
          startDate: startDate || 'none',
          endDate: endDate || 'none',
          teacher: teacher || 'all'
        }
      }
    });

  } catch (error) {
    console.error('Get referral statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 9. VALIDATE REFERRAL CODE (Public - for checking if referral code is valid)
router.post('/validate', async (req, res) => {
  try {
    const { referralCode, amount = 0 } = req.body;

    if (!referralCode) {
      return res.status(400).json({
        success: false,
        message: 'Referral code is required'
      });
    }

    // First check Referral collection (admin-created referrals)
    let referral = await Referral.findOne({ 
      referralCode: { $regex: new RegExp(`^${referralCode}$`, 'i') },
      isActive: true,
      isApproved: true
    });

    let teacher = null;
    let discountPercentage = 25; // Default discount
    let maximumDiscount = 1000; // Default max discount

    if (referral) {
    // Check if referral has expired
    if (referral.expiryDate && new Date() > referral.expiryDate) {
      return res.json({
        success: false,
        message: 'Referral code has expired',
        data: { isValid: false }
      });
    }

    // Check if max uses reached
    if (referral.maxUses && referral.totalUses >= referral.maxUses) {
      return res.json({
        success: false,
        message: 'Referral code usage limit reached',
        data: { isValid: false }
      });
    }

      teacher = await User.findById(referral.teacher).select('name email');
      discountPercentage = referral.discountPercentage;
      maximumDiscount = referral.maximumDiscount || 1000;
    } else {
      // Check User collection for teacher's auto-generated referral code
      // TEMPORARY: Comment out isApproved check for testing (uncomment later for manual approval)
      const teacherUser = await User.findOne({
        'teacherInfo.referralCode': { $regex: new RegExp(`^${referralCode}$`, 'i') },
        role: 'teacher'
        // 'teacherInfo.isApproved': true  // Commented out temporarily
      }).select('name email teacherInfo');

      if (teacherUser) {
        teacher = {
          _id: teacherUser._id,
          name: teacherUser.name,
          email: teacherUser.email
        };
        // Use default discount for teacher codes
        discountPercentage = 25;
        maximumDiscount = 1000;
      }
    }

    if (!teacher) {
      return res.json({
        success: false,
        message: 'Invalid or inactive referral code',
        data: { isValid: false }
      });
    }

    // Calculate discount
    const discountAmount = Math.min(
      (Number(amount) * discountPercentage) / 100,
      maximumDiscount
    );
    const finalAmount = Math.max(Number(amount) - discountAmount, 0);

    res.json({
      success: true,
      message: 'Valid referral code',
      data: {
        isValid: true,
        referral: {
          id: referral?._id || teacher._id,
          code: referralCode,
          discountPercentage,
          discountAmount,
          finalAmount,
          description: referral?.description || 'Teacher referral code',
          teacher: teacher
        }
      }
    });

  } catch (error) {
    console.error('Validate referral code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
