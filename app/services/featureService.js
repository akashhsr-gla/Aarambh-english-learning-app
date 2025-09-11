import { apiRequest } from './api';

// Feature access control service
class FeatureService {
  constructor() {
    this.features = [];
    this.userPlan = null;
    this.isLoaded = false;
  }

  // Load all features for current user
  async loadFeatures() {
    try {
      const response = await apiRequest('/features/user');
      if (response.success) {
        this.features = response.data.features;
        this.userPlan = response.data.userPlan;
        this.isLoaded = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading features:', error);
      return false;
    }
  }

  // Check if user can access a specific feature
  canAccess(featureKey) {
    if (!this.isLoaded) {
      console.warn('Features not loaded yet');
      return false;
    }

    const feature = this.features.find(f => f.key === featureKey);
    if (!feature) {
      console.warn(`Feature ${featureKey} not found`);
      return false;
    }

    return feature.canAccess;
  }

  // Get feature access info
  getFeatureInfo(featureKey) {
    if (!this.isLoaded) {
      return null;
    }

    return this.features.find(f => f.key === featureKey) || null;
  }

  // Get all features by category
  getFeaturesByCategory(category) {
    if (!this.isLoaded) {
      return [];
    }

    return this.features.filter(f => f.category === category);
  }

  // Get accessible features only
  getAccessibleFeatures() {
    if (!this.isLoaded) {
      return [];
    }

    return this.features.filter(f => f.canAccess);
  }

  // Get paid features that user can't access
  getLockedFeatures() {
    if (!this.isLoaded) {
      return [];
    }

    return this.features.filter(f => f.isPaid && !f.canAccess);
  }

  // Record feature usage
  async recordUsage(featureKey) {
    try {
      await apiRequest(`/features/user/${featureKey}/usage`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error recording feature usage:', error);
    }
  }

  // Check specific feature access from server
  async checkFeatureAccess(featureKey) {
    try {
      const response = await apiRequest(`/features/user/${featureKey}/access`);
      if (response.success) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error checking feature access:', error);
      return null;
    }
  }

  // Get user plan info
  getUserPlan() {
    return this.userPlan;
  }

  // Check if user has active subscription
  hasActiveSubscription() {
    return this.userPlan && this.userPlan.status === 'active';
  }

  // Get subscription plan name
  getSubscriptionPlan() {
    return this.userPlan ? this.userPlan.planName : 'free';
  }

  // Refresh features (reload from server)
  async refresh() {
    this.isLoaded = false;
    return await this.loadFeatures();
  }

  // Get feature access reason
  getAccessReason(featureKey) {
    const feature = this.getFeatureInfo(featureKey);
    if (!feature) return 'feature_not_found';
    
    if (feature.canAccess) return 'accessible';
    if (feature.isPaid) return 'subscription_required';
    return 'feature_disabled';
  }

  // Check if feature requires subscription
  requiresSubscription(featureKey) {
    const feature = this.getFeatureInfo(featureKey);
    return feature ? feature.isPaid : false;
  }

  // Get all features (for admin or debugging)
  getAllFeatures() {
    return this.features;
  }

  // Get feature statistics
  getFeatureStats() {
    if (!this.isLoaded) {
      return {
        total: 0,
        accessible: 0,
        locked: 0,
        paid: 0,
        free: 0
      };
    }

    const stats = {
      total: this.features.length,
      accessible: this.features.filter(f => f.canAccess).length,
      locked: this.features.filter(f => f.isPaid && !f.canAccess).length,
      paid: this.features.filter(f => f.isPaid).length,
      free: this.features.filter(f => !f.isPaid).length
    };

    return stats;
  }
}

// Create singleton instance
const featureService = new FeatureService();

// Export both the class and instance
export { FeatureService };
export default featureService;
