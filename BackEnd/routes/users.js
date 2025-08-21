const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Region = require('../models/Region');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Validation middleware
const validateUserUpdate = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
  body('role').optional().isIn(['student', 'teacher', 'admin']).withMessage('Role must be student, teacher, or admin'),
  body('region').optional().isMongoId().withMessage('Please provide a valid region ID'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('isEmailVerified').optional().isBoolean().withMessage('isEmailVerified must be a boolean'),
  body('isPhoneVerified').optional().isBoolean().withMessage('isPhoneVerified must be a boolean')
];

const validateStudentInfo = [
  body('studentInfo.age').optional().isInt({ min: 5, max: 100 }).withMessage('Age must be between 5 and 100'),
  body('studentInfo.subscriptionStatus').optional().isIn(['inactive', 'active', 'expired', 'cancelled']).withMessage('Invalid subscription status'),
  body('studentInfo.currentPlan').optional().isMongoId().withMessage('Invalid plan ID'),
  body('studentInfo.subscriptionExpiry').optional().isISO8601().withMessage('Invalid expiry date format'),
  body('studentInfo.totalLecturesWatched').optional().isInt({ min: 0 }).withMessage('Total lectures watched must be non-negative'),
  body('studentInfo.totalGameSessions').optional().isInt({ min: 0 }).withMessage('Total game sessions must be non-negative'),
  body('studentInfo.totalCommunicationSessions').optional().isInt({ min: 0 }).withMessage('Total communication sessions must be non-negative'),
  body('studentInfo.averageGameScore').optional().isFloat({ min: 0 }).withMessage('Average game score must be non-negative')
];

const validateTeacherInfo = [
  body('teacherInfo.qualification').optional().isString().withMessage('Qualification must be a string'),
  body('teacherInfo.experience').optional().isInt({ min: 0 }).withMessage('Experience must be non-negative'),
  body('teacherInfo.specialization').optional().isArray().withMessage('Specialization must be an array'),
  body('teacherInfo.specialization.*').optional().isString().withMessage('Each specialization must be a string'),
  body('teacherInfo.bio').optional().isString().withMessage('Bio must be a string'),
  body('teacherInfo.hourlyRate').optional().isFloat({ min: 0 }).withMessage('Hourly rate must be non-negative'),
  body('teacherInfo.isApproved').optional().isBoolean().withMessage('isApproved must be a boolean'),
  body('teacherInfo.referralCode').optional().isString().withMessage('Referral code must be a string')
];

const validateAdminInfo = [
  body('adminInfo.permissions').optional().isArray().withMessage('Permissions must be an array'),
  body('adminInfo.permissions.*').optional().isIn([
    'manage_users', 'manage_content', 'manage_plans', 'view_analytics', 
    'manage_teachers', 'manage_transactions', 'manage_regions'
  ]).withMessage('Invalid permission')
];

// 1. GET ALL USERS (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      role, 
      region, 
      status, 
      search, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      page = 1, 
      limit = 20 
    } = req.query;

    // Build filter
    let filter = {};
    if (role) filter.role = role;
    if (region) filter.region = region;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get users with pagination
    const users = await User.find(filter)
      .populate('region', 'name code')
      .populate('referredBy', 'name email')
      .populate('studentInfo.currentPlan', 'name description price')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password');

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    // Get user statistics
    const userStats = await User.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          activeCount: { $sum: { $cond: ['$isActive', 1, 0] } },
          inactiveCount: { $sum: { $cond: ['$isActive', 0, 1] } }
        }
      }
    ]);

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        statistics: userStats,
        filters: {
          role: role || 'all',
          region: region || 'all',
          status: status || 'all',
          search: search || 'none',
          sortBy,
          sortOrder
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 2. GET USER BY ID (Admin can access all, users can access their own)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // Check if user can access this profile
    if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own profile.'
      });
    }

    const user = await User.findById(id)
      .populate('region', 'name code')
      .populate('referredBy', 'name email')
      .populate('studentInfo.currentPlan', 'name description price duration features')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User retrieved successfully',
      data: user
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 3. UPDATE USER (Admin can update any user, users can update their own basic info)
router.put('/:id', authenticateToken, [
  ...validateUserUpdate,
  ...validateStudentInfo,
  ...validateTeacherInfo,
  ...validateAdminInfo
], async (req, res) => {
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
        message: 'Invalid user ID format'
      });
    }

    // Check if user can update this profile
    if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own profile.'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check for duplicate email/phone if updating
    const { email, phone } = req.body;
    if (email || phone) {
      const duplicateFilter = {
        _id: { $ne: id },
        $or: []
      };

      if (email) {
        duplicateFilter.$or.push({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
      }
      if (phone) {
        duplicateFilter.$or.push({ phone: { $regex: new RegExp(`^${phone}$`, 'i') } });
      }

      const existingUser = await User.findOne(duplicateFilter);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email or phone already exists'
        });
      }
    }

    // Update basic user fields
    const updateFields = ['name', 'email', 'phone', 'role', 'region', 'isActive', 'isEmailVerified', 'isPhoneVerified'];
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    // Update role-specific fields
    if (req.body.studentInfo) {
      user.studentInfo = { ...user.studentInfo, ...req.body.studentInfo };
    }

    if (req.body.teacherInfo) {
      user.teacherInfo = { ...user.teacherInfo, ...req.body.teacherInfo };
    }

    if (req.body.adminInfo && req.user.role === 'admin') {
      user.adminInfo = { ...user.adminInfo, ...req.body.adminInfo };
    }

    user.updatedAt = new Date();
    await user.save();

    // Return updated user without password
    const updatedUser = await User.findById(id)
      .populate('region', 'name code')
      .populate('referredBy', 'name email')
      .populate('studentInfo.currentPlan', 'name description price')
      .select('-password');

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 4. DELETE USER (Admin only - soft delete)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // Prevent admin from deleting themselves
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete - set isActive to false
    user.isActive = false;
    user.deletedAt = new Date();
    user.updatedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'User deactivated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        deactivatedAt: user.deletedAt
      }
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 5. REACTIVATE USER (Admin only)
router.patch('/:id/reactivate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'User is already active'
      });
    }

    user.isActive = true;
    user.deletedAt = undefined;
    user.updatedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'User reactivated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        reactivatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Reactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 6. GET USER STATISTICS (Admin only)
router.get('/admin/statistics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, region } = req.query;

    // Build date filter
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Build region filter
    let regionFilter = {};
    if (region) {
      regionFilter.region = region;
    }

    // Combine filters
    const filter = { ...dateFilter, ...regionFilter };

    // Get comprehensive user statistics
    const userStats = await User.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            role: '$role',
            isActive: '$isActive'
          },
          count: { $sum: 1 },
          avgScore: { $avg: '$studentInfo.averageGameScore' }
        }
      },
      {
        $group: {
          _id: '$_id.role',
          statuses: {
            $push: {
              isActive: '$_id.isActive',
              count: '$count',
              avgScore: '$avgScore'
            }
          },
          totalCount: { $sum: '$count' }
        }
      }
    ]);

    // Get recent users
    const recentUsers = await User.find(filter)
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('region', 'name code')
      .select('name email role region isActive createdAt');

    // Get top regions by user count
    const topRegions = await User.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$region',
          userCount: { $sum: 1 },
          studentCount: { $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] } },
          teacherCount: { $sum: { $cond: [{ $eq: ['$role', 'teacher'] }, 1, 0] } }
        }
      },
      { $sort: { userCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'regions',
          localField: '_id',
          foreignField: '_id',
          as: 'regionDetails'
        }
      },
      { $unwind: '$regionDetails' }
    ]);

    // Get subscription statistics
    const subscriptionStats = await User.aggregate([
      { $match: { ...filter, role: 'student' } },
      {
        $group: {
          _id: '$studentInfo.subscriptionStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      message: 'User statistics retrieved successfully',
      data: {
        userStats,
        recentUsers,
        topRegions,
        subscriptionStats,
        filters: {
          startDate: startDate || 'none',
          endDate: endDate || 'none',
          region: region || 'all'
        }
      }
    });

  } catch (error) {
    console.error('Get user statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 7. SEARCH USERS (Admin only)
router.post('/admin/search', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      query, 
      role, 
      region, 
      status, 
      subscriptionStatus,
      page = 1, 
      limit = 20 
    } = req.body;

    // Build search filter
    let filter = {};

    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } }
      ];
    }

    if (role) filter.role = role;
    if (region) filter.region = region;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;
    if (subscriptionStatus && role === 'student') {
      filter['studentInfo.subscriptionStatus'] = subscriptionStatus;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get users with filters
    const users = await User.find(filter)
      .populate('region', 'name code')
      .populate('referredBy', 'name email')
      .populate('studentInfo.currentPlan', 'name description price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password');

    // Get total count
    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      message: 'User search completed successfully',
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        searchCriteria: {
          query: query || 'none',
          role: role || 'all',
          region: region || 'all',
          status: status || 'all',
          subscriptionStatus: subscriptionStatus || 'all'
        }
      }
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
