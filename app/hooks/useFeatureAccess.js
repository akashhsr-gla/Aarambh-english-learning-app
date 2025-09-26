import { useCallback, useEffect, useState } from 'react';
import featureService from '../services/featureService';

// Hook for feature access control
export const useFeatureAccess = (featureKey) => {
  const [canAccess, setCanAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [featureInfo, setFeatureInfo] = useState(null);
  const [error, setError] = useState(null);

  const checkAccess = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Always refresh features to get latest data
      const loaded = await featureService.refreshFeatures();
      if (!loaded) {
        setError('Failed to load features');
        return;
      }

      // Check access
      const access = featureService.canAccess(featureKey);
      const info = featureService.getFeatureInfo(featureKey);

      setCanAccess(access);
      setFeatureInfo(info);
    } catch (err) {
      console.error('Error checking feature access:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [featureKey]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  const recordUsage = useCallback(async () => {
    if (canAccess) {
      await featureService.recordUsage(featureKey);
    }
  }, [canAccess, featureKey]);

  return {
    canAccess,
    isLoading,
    featureInfo,
    error,
    recordUsage,
    refresh: checkAccess
  };
};

// Hook for multiple features
export const useMultipleFeatureAccess = (featureKeys) => {
  const [features, setFeatures] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAccess = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load features if not already loaded
      if (!featureService.isLoaded) {
        const loaded = await featureService.loadFeatures();
        if (!loaded) {
          setError('Failed to load features');
          return;
        }
      }

      // Check access for all features
      const featureAccess = {};
      featureKeys.forEach(key => {
        featureAccess[key] = {
          canAccess: featureService.canAccess(key),
          featureInfo: featureService.getFeatureInfo(key)
        };
      });

      setFeatures(featureAccess);
    } catch (err) {
      console.error('Error checking feature access:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [featureKeys]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  const recordUsage = useCallback(async (featureKey) => {
    const feature = features[featureKey];
    if (feature && feature.canAccess) {
      await featureService.recordUsage(featureKey);
    }
  }, [features]);

  return {
    features,
    isLoading,
    error,
    recordUsage,
    refresh: checkAccess
  };
};

// Hook for category-based features
export const useCategoryFeatures = (category) => {
  const [features, setFeatures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFeatures = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load features if not already loaded
      if (!featureService.isLoaded) {
        const loaded = await featureService.loadFeatures();
        if (!loaded) {
          setError('Failed to load features');
          return;
        }
      }

      // Get features by category
      const categoryFeatures = featureService.getFeaturesByCategory(category);
      setFeatures(categoryFeatures);
    } catch (err) {
      console.error('Error loading category features:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  useEffect(() => {
    loadFeatures();
  }, [loadFeatures]);

  return {
    features,
    isLoading,
    error,
    refresh: loadFeatures
  };
};

// Hook for subscription info
export const useSubscriptionInfo = () => {
  const [userPlan, setUserPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSubscriptionInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load features if not already loaded
      if (!featureService.isLoaded) {
        const loaded = await featureService.loadFeatures();
        if (!loaded) {
          setError('Failed to load features');
          return;
        }
      }

      const plan = featureService.getUserPlan();
      setUserPlan(plan);
    } catch (err) {
      console.error('Error loading subscription info:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscriptionInfo();
  }, [loadSubscriptionInfo]);

  return {
    userPlan,
    hasActiveSubscription: featureService.hasActiveSubscription(),
    subscriptionPlan: featureService.getSubscriptionPlan(),
    isLoading,
    error,
    refresh: loadSubscriptionInfo
  };
};

// Hook for feature statistics
export const useFeatureStats = () => {
  const [stats, setStats] = useState({
    total: 0,
    accessible: 0,
    locked: 0,
    paid: 0,
    free: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load features if not already loaded
      if (!featureService.isLoaded) {
        const loaded = await featureService.loadFeatures();
        if (!loaded) {
          setError('Failed to load features');
          return;
        }
      }

      const featureStats = featureService.getFeatureStats();
      setStats(featureStats);
    } catch (err) {
      console.error('Error loading feature stats:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    isLoading,
    error,
    refresh: loadStats
  };
};
