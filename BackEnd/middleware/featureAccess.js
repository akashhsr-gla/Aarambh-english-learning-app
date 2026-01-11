const Feature = require('../models/Feature');
const User = require('../models/User');

/**
 * Middleware to check if user has access to a specific feature
 * This is a STRICT server-side check that cannot be bypassed
 */
const requireFeatureAccess = (featureKey) => {
  return async (req, res, next) => {
    try {
      // Get feature from database
      const feature = await Feature.findOne({ key: featureKey });
      
      if (!feature) {
        return res.status(404).json({
          success: false,
          message: 'Feature not found'
        });
      }

      // Feature is disabled
      if (!feature.isActive) {
        return res.status(403).json({
          success: false,
          message: 'This feature is currently disabled'
        });
      }

      // Feature is free - allow access
      if (!feature.isPaid) {
        return next();
      }

      // Feature is paid - STRICT subscription check
      // Get fresh user data with subscription info
      const user = await User.findById(req.user._id)
        .populate('studentInfo.currentPlan', 'name planType');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // Admin and teachers bypass paid features (optional - remove if you want them to pay too)
      if (user.role === 'admin' || user.role === 'teacher') {
        return next();
      }

      // Check subscription status - MUST be active
      const subscriptionStatus = user.studentInfo?.subscriptionStatus;
      if (subscriptionStatus !== 'active') {
        return res.status(403).json({
          success: false,
          message: `${feature.name} requires an active subscription. Please upgrade to access this feature.`,
          code: 'SUBSCRIPTION_REQUIRED',
          feature: {
            key: feature.key,
            name: feature.name,
            isPaid: true
          }
        });
      }

      // Check if user's plan meets feature requirements
      const planHierarchy = { free: 0, basic: 1, premium: 2, pro: 3 };
      const userPlanType = user.studentInfo?.currentPlan?.planType || 'free';
      const userPlanLevel = planHierarchy[userPlanType] || 0;
      const requiredPlanLevel = planHierarchy[feature.requiredPlan] || 0;

      if (userPlanLevel < requiredPlanLevel) {
        return res.status(403).json({
          success: false,
          message: `${feature.name} requires a ${feature.requiredPlan} plan or higher. Your current plan (${userPlanType}) does not have access.`,
          code: 'PLAN_UPGRADE_REQUIRED',
          feature: {
            key: feature.key,
            name: feature.name,
            requiredPlan: feature.requiredPlan
          },
          userPlan: userPlanType
        });
      }

      // All checks passed - allow access
      next();
    } catch (error) {
      console.error('Feature access check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking feature access'
      });
    }
  };
};

/**
 * Middleware to check feature access based on session type
 * Maps session types to feature keys
 */
const requireCallFeatureAccess = async (req, res, next) => {
  try {
    const sessionType = req.body.sessionType || req.body.callType || req.params.sessionType;
    let featureKey = null;

    // Map session types to feature keys
    if (sessionType === 'video_call' || sessionType === 'video') {
      featureKey = 'video_calls';
    } else if (sessionType === 'voice_call' || sessionType === 'voice') {
      featureKey = 'voice_calls';
    } else if (sessionType === 'group_video_call' || sessionType === 'group_voice_call') {
      // Group calls are free, but we still check
      featureKey = 'group_calls';
    }

    // If no feature key determined, allow (for chat, etc.)
    if (!featureKey) {
      return next();
    }

    // Use the feature access middleware
    const featureMiddleware = requireFeatureAccess(featureKey);
    return featureMiddleware(req, res, next);
  } catch (error) {
    console.error('Call feature access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking call feature access'
    });
  }
};

/**
 * Helper function to check feature access (for use in routes)
 */
const checkFeatureAccess = async (userId, featureKey) => {
  try {
    const feature = await Feature.findOne({ key: featureKey });
    if (!feature || !feature.isActive) {
      return { hasAccess: false, reason: 'feature_not_found_or_disabled' };
    }

    if (!feature.isPaid) {
      return { hasAccess: true };
    }

    const user = await User.findById(userId)
      .populate('studentInfo.currentPlan', 'name planType');

    if (!user) {
      return { hasAccess: false, reason: 'user_not_found' };
    }

    if (user.role === 'admin' || user.role === 'teacher') {
      return { hasAccess: true };
    }

    const subscriptionStatus = user.studentInfo?.subscriptionStatus;
    if (subscriptionStatus !== 'active') {
      return { hasAccess: false, reason: 'subscription_required' };
    }

    const planHierarchy = { free: 0, basic: 1, premium: 2, pro: 3 };
    const userPlanType = user.studentInfo?.currentPlan?.planType || 'free';
    const userPlanLevel = planHierarchy[userPlanType] || 0;
    const requiredPlanLevel = planHierarchy[feature.requiredPlan] || 0;

    if (userPlanLevel < requiredPlanLevel) {
      return { hasAccess: false, reason: 'plan_upgrade_required' };
    }

    return { hasAccess: true };
  } catch (error) {
    console.error('Check feature access error:', error);
    return { hasAccess: false, reason: 'server_error' };
  }
};

module.exports = {
  requireFeatureAccess,
  requireCallFeatureAccess,
  checkFeatureAccess
};

