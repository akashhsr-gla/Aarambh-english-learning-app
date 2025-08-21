const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Region = require('../models/Region');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Validation middleware
const validateRegion = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Region name must be between 2 and 100 characters'),
  body('code').trim().isLength({ min: 2, max: 10 }).withMessage('Region code must be between 2 and 10 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean value')
];

const validateRegionUpdate = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Region name must be between 2 and 100 characters'),
  body('code').optional().trim().isLength({ min: 2, max: 10 }).withMessage('Region code must be between 2 and 10 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean value')
];

// 1. CREATE REGION (Admin only)
router.post('/', authenticateToken, requireAdmin, validateRegion, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name, code, description, isActive = true } = req.body;

    // Check if region with same name or code already exists
    const existingRegion = await Region.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${name}$`, 'i') } },
        { code: { $regex: new RegExp(`^${code}$`, 'i') } }
      ]
    });

    if (existingRegion) {
      return res.status(400).json({
        success: false,
        message: 'Region with this name or code already exists'
      });
    }

    const region = new Region({
      name,
      code,
      description,
      isActive
    });

    await region.save();

    res.status(201).json({
      success: true,
      message: 'Region created successfully',
      data: {
        id: region._id,
        name: region.name,
        code: region.code,
        description: region.description,
        isActive: region.isActive,
        createdAt: region.createdAt
      }
    });

  } catch (error) {
    console.error('Create region error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 2. GET ALL REGIONS (All users can access)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { active, search, sortBy = 'name', sortOrder = 'asc' } = req.query;

    // Build filter
    let filter = {};
    if (active !== undefined) {
      filter.isActive = active === 'true';
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const regions = await Region.find(filter)
      .sort(sort)
      .select('name code description isActive totalUsers totalStudents totalTeachers averageScore createdAt');

    res.json({
      success: true,
      message: 'Regions retrieved successfully',
      data: {
        regions,
        total: regions.length,
        filters: {
          active: active !== undefined ? active === 'true' : 'all',
          search: search || 'none',
          sortBy,
          sortOrder
        }
      }
    });

  } catch (error) {
    console.error('Get regions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 3. GET REGION BY ID (All users can access)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid region ID format'
      });
    }

    const region = await Region.findById(id)
      .select('name code description isActive totalUsers totalStudents totalTeachers averageScore createdAt updatedAt');

    if (!region) {
      return res.status(404).json({
        success: false,
        message: 'Region not found'
      });
    }

    res.json({
      success: true,
      message: 'Region retrieved successfully',
      data: region
    });

  } catch (error) {
    console.error('Get region by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 4. UPDATE REGION (Admin only)
router.put('/:id', authenticateToken, requireAdmin, validateRegionUpdate, async (req, res) => {
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
        message: 'Invalid region ID format'
      });
    }

    const region = await Region.findById(id);
    if (!region) {
      return res.status(404).json({
        success: false,
        message: 'Region not found'
      });
    }

    const { name, code, description, isActive } = req.body;

    // Check for duplicate names/codes if updating
    if (name || code) {
      const duplicateFilter = {
        _id: { $ne: id },
        $or: []
      };

      if (name) {
        duplicateFilter.$or.push({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      }
      if (code) {
        duplicateFilter.$or.push({ code: { $regex: new RegExp(`^${code}$`, 'i') } });
      }

      const existingRegion = await Region.findOne(duplicateFilter);
      if (existingRegion) {
        return res.status(400).json({
          success: false,
          message: 'Region with this name or code already exists'
        });
      }
    }

    // Update fields
    if (name !== undefined) region.name = name;
    if (code !== undefined) region.code = code;
    if (description !== undefined) region.description = description;
    if (isActive !== undefined) region.isActive = isActive;

    region.updatedAt = new Date();
    await region.save();

    res.json({
      success: true,
      message: 'Region updated successfully',
      data: {
        id: region._id,
        name: region.name,
        code: region.code,
        description: region.description,
        isActive: region.isActive,
        updatedAt: region.updatedAt
      }
    });

  } catch (error) {
    console.error('Update region error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 5. DELETE REGION (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid region ID format'
      });
    }

    const region = await Region.findById(id);
    if (!region) {
      return res.status(404).json({
        success: false,
        message: 'Region not found'
      });
    }

    // Check if region has users
    const userCount = await User.countDocuments({ region: id });
    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete region. ${userCount} user(s) are currently assigned to this region.`
      });
    }

    await Region.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Region deleted successfully',
      data: {
        id: region._id,
        name: region.name,
        code: region.code
      }
    });

  } catch (error) {
    console.error('Delete region error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 6. GET REGION STATISTICS (Admin only)
router.get('/:id/statistics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid region ID format'
      });
    }

    const region = await Region.findById(id);
    if (!region) {
      return res.status(404).json({
        success: false,
        message: 'Region not found'
      });
    }

    // Get user statistics for this region
    const userStats = await User.aggregate([
      { $match: { region: region._id } },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          avgScore: { $avg: '$studentInfo.averageScore' }
        }
      }
    ]);

    // Get recent users
    const recentUsers = await User.find({ region: region._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt');

    res.json({
      success: true,
      message: 'Region statistics retrieved successfully',
      data: {
        region: {
          id: region._id,
          name: region.name,
          code: region.code
        },
        statistics: {
          totalUsers: region.totalUsers || 0,
          totalStudents: region.totalStudents || 0,
          totalTeachers: region.totalTeachers || 0,
          averageScore: region.averageScore || 0
        },
        userBreakdown: userStats,
        recentUsers
      }
    });

  } catch (error) {
    console.error('Get region statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 7. ACTIVATE/DEACTIVATE REGION (Admin only)
router.patch('/:id/toggle-status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid region ID format'
      });
    }

    const region = await Region.findById(id);
    if (!region) {
      return res.status(404).json({
        success: false,
        message: 'Region not found'
      });
    }

    region.isActive = !region.isActive;
    region.updatedAt = new Date();
    await region.save();

    res.json({
      success: true,
      message: `Region ${region.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: region._id,
        name: region.name,
        code: region.code,
        isActive: region.isActive,
        updatedAt: region.updatedAt
      }
    });

  } catch (error) {
    console.error('Toggle region status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
