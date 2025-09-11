const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Feature = require('../models/Feature');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Validation middleware
const validateFeatureToggle = [
  body('isPaid').isBoolean().withMessage('isPaid must be boolean'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
];

// 1. GET ALL FEATURES (Admin only)
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const features = await Feature.find().sort({ category: 1, order: 1 });
    
    res.json({
      success: true,
      data: {
        features: features.map(feature => ({
          id: feature._id,
          key: feature.key,
          name: feature.name,
          description: feature.description,
          category: feature.category,
          isPaid: feature.isPaid,
          isActive: feature.isActive,
          icon: feature.icon,
          color: feature.color,
          order: feature.order,
          requiredPlan: feature.requiredPlan,
          freeLimit: feature.freeLimit,
          freeLimitType: feature.freeLimitType,
          canToggle: feature.canToggle,
          showInMenu: feature.showInMenu,
          requiresAuth: feature.requiresAuth,
          usageCount: feature.usageCount,
          lastUsed: feature.lastUsed,
          lastModifiedBy: feature.lastModifiedBy,
          lastModifiedAt: feature.lastModifiedAt,
          createdAt: feature.createdAt,
          updatedAt: feature.updatedAt
        })),
        total: features.length
      }
    });
  } catch (error) {
    console.error('Get all features error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 2. GET FEATURES BY CATEGORY (Admin only)
router.get('/admin/category/:category', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { category } = req.params;
    const features = await Feature.getByCategory(category);
    
    res.json({
      success: true,
      data: {
        category,
        features: features.map(feature => ({
          id: feature._id,
          key: feature.key,
          name: feature.name,
          isPaid: feature.isPaid,
          isActive: feature.isActive,
          order: feature.order
        }))
      }
    });
  } catch (error) {
    console.error('Get features by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 3. TOGGLE FEATURE ACCESS (Admin only)
router.patch('/admin/:featureKey/toggle', authenticateToken, requireAdmin, validateFeatureToggle, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { featureKey } = req.params;
    const { isPaid, isActive } = req.body;

    const feature = await Feature.findOne({ key: featureKey });
    if (!feature) {
      return res.status(404).json({
        success: false,
        message: 'Feature not found'
      });
    }

    if (!feature.canToggle) {
      return res.status(400).json({
        success: false,
        message: 'This feature cannot be toggled'
      });
    }

    // Update feature
    feature.isPaid = isPaid;
    if (isActive !== undefined) {
      feature.isActive = isActive;
    }
    feature.lastModifiedBy = req.user._id;
    feature.lastModifiedAt = new Date();

    await feature.save();

    res.json({
      success: true,
      message: `Feature ${feature.name} updated successfully`,
      data: {
        key: feature.key,
        name: feature.name,
        isPaid: feature.isPaid,
        isActive: feature.isActive,
        lastModifiedAt: feature.lastModifiedAt
      }
    });
  } catch (error) {
    console.error('Toggle feature access error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 4. BULK UPDATE FEATURES (Admin only)
router.patch('/admin/bulk-update', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: 'Updates must be an array'
      });
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const { featureKey, isPaid, isActive } = update;
        
        const feature = await Feature.findOne({ key: featureKey });
        if (!feature) {
          errors.push({ featureKey, error: 'Feature not found' });
          continue;
        }

        if (!feature.canToggle) {
          errors.push({ featureKey, error: 'Feature cannot be toggled' });
          continue;
        }

        feature.isPaid = isPaid;
        if (isActive !== undefined) {
          feature.isActive = isActive;
        }
        feature.lastModifiedBy = req.user._id;
        feature.lastModifiedAt = new Date();

        await feature.save();

        results.push({
          featureKey,
          name: feature.name,
          isPaid: feature.isPaid,
          isActive: feature.isActive
        });
      } catch (error) {
        errors.push({ featureKey: update.featureKey, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Updated ${results.length} features successfully`,
      data: {
        updated: results,
        errors: errors
      }
    });
  } catch (error) {
    console.error('Bulk update features error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 5. GET FEATURE STATISTICS (Admin only)
router.get('/admin/statistics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalFeatures = await Feature.countDocuments();
    const activeFeatures = await Feature.countDocuments({ isActive: true });
    const paidFeatures = await Feature.countDocuments({ isPaid: true, isActive: true });
    const freeFeatures = await Feature.countDocuments({ isPaid: false, isActive: true });

    const categoryStats = await Feature.aggregate([
      { $match: { isActive: true } },
      { $group: { 
        _id: '$category', 
        total: { $sum: 1 },
        paid: { $sum: { $cond: ['$isPaid', 1, 0] } },
        free: { $sum: { $cond: ['$isPaid', 0, 1] } }
      }},
      { $sort: { _id: 1 } }
    ]);

    const usageStats = await Feature.aggregate([
      { $match: { usageCount: { $gt: 0 } } },
      { $sort: { usageCount: -1 } },
      { $limit: 10 },
      { $project: { key: 1, name: 1, usageCount: 1, lastUsed: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalFeatures,
          activeFeatures,
          paidFeatures,
          freeFeatures
        },
        categoryBreakdown: categoryStats,
        topUsedFeatures: usageStats
      }
    });
  } catch (error) {
    console.error('Get feature statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 6. CREATE NEW FEATURE (Admin only)
router.post('/admin/create', authenticateToken, requireAdmin, [
  body('key').isLength({ min: 2, max: 50 }).withMessage('Key must be 2-50 characters'),
  body('name').isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('category').isIn(['games', 'communication', 'learning', 'social', 'premium']).withMessage('Invalid category'),
  body('isPaid').isBoolean().withMessage('isPaid must be boolean'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
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
      key,
      name,
      description,
      category,
      isPaid,
      isActive = true,
      icon,
      color,
      order,
      requiredPlan,
      freeLimit,
      freeLimitType,
      showInMenu,
      requiresAuth
    } = req.body;

    // Check if feature key already exists
    const existingFeature = await Feature.findOne({ key });
    if (existingFeature) {
      return res.status(400).json({
        success: false,
        message: 'Feature key already exists'
      });
    }

    const feature = new Feature({
      key,
      name,
      description,
      category,
      isPaid,
      isActive,
      icon,
      color,
      order,
      requiredPlan,
      freeLimit,
      freeLimitType,
      showInMenu,
      requiresAuth,
      lastModifiedBy: req.user._id
    });

    await feature.save();

    res.status(201).json({
      success: true,
      message: 'Feature created successfully',
      data: {
        id: feature._id,
        key: feature.key,
        name: feature.name,
        category: feature.category,
        isPaid: feature.isPaid,
        isActive: feature.isActive
      }
    });
  } catch (error) {
    console.error('Create feature error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 7. DELETE FEATURE (Admin only)
router.delete('/admin/:featureKey', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { featureKey } = req.params;

    const feature = await Feature.findOne({ key: featureKey });
    if (!feature) {
      return res.status(404).json({
        success: false,
        message: 'Feature not found'
      });
    }

    // Soft delete - just deactivate
    feature.isActive = false;
    feature.lastModifiedBy = req.user._id;
    feature.lastModifiedAt = new Date();

    await feature.save();

    res.json({
      success: true,
      message: 'Feature deactivated successfully'
    });
  } catch (error) {
    console.error('Delete feature error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 8. GET USER FEATURES (User endpoint)
router.get('/user', authenticateToken, async (req, res) => {
  try {
    // Get user's subscription info
    const User = require('../models/User');
    const user = await User.findById(req.user._id).populate('studentInfo.currentPlan', 'name planType');
    
    const userPlan = user.studentInfo?.subscriptionStatus === 'active' ? {
      subscriptionStatus: user.studentInfo.subscriptionStatus,
      planName: user.studentInfo.currentPlan?.planType || 'free',
      planId: user.studentInfo.currentPlan?._id
    } : null;

    // Get all features with access info
    const features = await Feature.getUserFeatures(user, userPlan);

    res.json({
      success: true,
      data: {
        features,
        userPlan: userPlan ? {
          status: userPlan.subscriptionStatus,
          planName: userPlan.planName
        } : null
      }
    });
  } catch (error) {
    console.error('Get user features error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 9. CHECK FEATURE ACCESS (User endpoint)
router.get('/user/:featureKey/access', authenticateToken, async (req, res) => {
  try {
    const { featureKey } = req.params;

    const feature = await Feature.findOne({ key: featureKey });
    if (!feature) {
      return res.status(404).json({
        success: false,
        message: 'Feature not found'
      });
    }

    // Get user's subscription info
    const User = require('../models/User');
    const user = await User.findById(req.user._id).populate('studentInfo.currentPlan', 'name planType');
    
    const userPlan = user.studentInfo?.subscriptionStatus === 'active' ? {
      subscriptionStatus: user.studentInfo.subscriptionStatus,
      planName: user.studentInfo.currentPlan?.planType || 'free',
      planId: user.studentInfo.currentPlan?._id
    } : null;

    const accessInfo = feature.getAccessInfo(user, userPlan);

    res.json({
      success: true,
      data: accessInfo
    });
  } catch (error) {
    console.error('Check feature access error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 10. RECORD FEATURE USAGE (User endpoint)
router.post('/user/:featureKey/usage', authenticateToken, async (req, res) => {
  try {
    const { featureKey } = req.params;

    const feature = await Feature.findOne({ key: featureKey });
    if (!feature) {
      return res.status(404).json({
        success: false,
        message: 'Feature not found'
      });
    }

    // Update usage statistics
    feature.usageCount += 1;
    feature.lastUsed = new Date();
    await feature.save();

    res.json({
      success: true,
      message: 'Usage recorded successfully'
    });
  } catch (error) {
    console.error('Record feature usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
