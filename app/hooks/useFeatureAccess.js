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

      // STRICT: Always verify with server for paid features
      // First check locally for quick UI feedback
      const loaded = await featureService.refreshFeatures();
      if (!loaded) {
        setError('Failed to load features');
        setCanAccess(false);
        setIsLoading(false);
        return;
      }

      const localAccess = featureService.canAccess(featureKey);
      const info = featureService.getFeatureInfo(featureKey);

      // If feature is paid, ALWAYS verify with server (cannot trust client-side)
      if (info && info.isPaid) {
        try {
          const serverCheck = await featureService.checkFeatureAccess(featureKey);
          if (serverCheck && serverCheck.canAccess !== undefined) {
            // Server response is authoritative
            setCanAccess(serverCheck.canAccess);
            setFeatureInfo({
              ...info,
              canAccess: serverCheck.canAccess,
              reason: serverCheck.reason
            });
          } else {
            // Fallback to local check if server check fails
            setCanAccess(localAccess);
            setFeatureInfo(info);
          }
        } catch (serverError) {
          console.error('Server feature check failed, using local:', serverError);
          // On server error, deny access for paid features (fail secure)
          setCanAccess(false);
          setFeatureInfo({ ...info, canAccess: false, reason: 'server_verification_failed' });
        }
      } else {
        // Free features - use local check
        setCanAccess(localAccess);
        setFeatureInfo(info);
      }
    } catch (err) {
      console.error('Error checking feature access:', err);
      setError(err.message);
      setCanAccess(false);
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
