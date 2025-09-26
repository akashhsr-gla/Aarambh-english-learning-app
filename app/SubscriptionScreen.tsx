import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
// Work around TS JSX typing mismatch for expo-linear-gradient in some setups
const Gradient = (LinearGradient as unknown) as React.ComponentType<any>;

import GameHeader from '../components/GameHeader';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import PaymentModal from './components/PaymentModal';
import { authAPI, plansAPI, transactionsAPI } from './services/api';

interface SubscriptionPlan {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  durationType?: 'days' | 'weeks' | 'months' | 'years';
  features: (string | { name: string; description: string; isIncluded: boolean; _id: string })[];
  isPopular?: boolean;
  isActive?: boolean;
}

interface UserSubscription {
  plan: SubscriptionPlan;
  status: 'active' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
}

export default function SubscriptionScreen() {
  const navigation = useNavigation();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load available plans - try both APIs
      let plansResponse;
      try {
        plansResponse = await plansAPI.getAllPlans();
        console.log('Plans API response:', plansResponse);
        if (plansResponse.success) {
          const plansData = plansResponse.data.plans || plansResponse.data || [];
          console.log('Plans data:', plansData);
          setPlans(Array.isArray(plansData) ? plansData : []);
        }
      } catch (error) {
        console.log('Plans API failed, trying transactions API...', error);
        // Fallback to transactions API
        try {
          plansResponse = await transactionsAPI.getAvailablePlans();
          console.log('Transactions API response:', plansResponse);
          if (plansResponse.success) {
            const plansData = plansResponse.data || [];
            console.log('Transactions plans data:', plansData);
            setPlans(Array.isArray(plansData) ? plansData : []);
          }
        } catch (transactionsError) {
          console.log('Both APIs failed:', transactionsError);
          setPlans([]);
        }
      }

      // Load user's current subscription
      try {
        const subscriptionResponse = await transactionsAPI.getSubscription();
        console.log('Subscription API response:', subscriptionResponse);
        if (subscriptionResponse.success && subscriptionResponse.data) {
          const subscription = subscriptionResponse.data;
          console.log('Subscription data structure:', subscription);
          
          // Handle the actual API response structure
          if (subscription.subscriptionStatus && subscription.subscriptionStatus !== 'inactive') {
            // If user has an active subscription, try to find the plan
            const activeTransaction = subscription.transactions?.find((t: any) => t.status === 'completed');
            if (activeTransaction && activeTransaction.plan) {
              setUserSubscription({
                plan: activeTransaction.plan,
                status: subscription.subscriptionStatus,
                startDate: activeTransaction.createdAt || new Date().toISOString(),
                endDate: activeTransaction.expiresAt || new Date().toISOString(),
                autoRenew: activeTransaction.autoRenew || false
              });
            }
          }
        }
      } catch (error) {
        console.log('Subscription API failed, trying user data...', error);
        // Fallback to user data
        const userResponse = await authAPI.getCurrentUser();
        if (userResponse.success && userResponse.data.user) {
          const user = userResponse.data.user;
          console.log('User data structure:', user);
          if (user.studentInfo?.currentPlan) {
            // Find the plan details from the loaded plans
            const currentPlan = plans.find(
              (plan: SubscriptionPlan) => plan._id === user.studentInfo.currentPlan
            );
            
            console.log('Found current plan:', currentPlan);
            if (currentPlan) {
              setUserSubscription({
                plan: currentPlan,
                status: user.studentInfo.subscriptionStatus || 'active',
                startDate: user.studentInfo.subscriptionStartDate || new Date().toISOString(),
                endDate: user.studentInfo.subscriptionExpiry || new Date().toISOString(),
                autoRenew: user.studentInfo.autoRenew || false
              });
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Error loading subscription data:', err);
      setError(err.message || 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      setSelectedPlan(planId);
      const plan = plans.find(p => p._id === planId) || null;
      setPaymentPlan(plan);
      setPaymentVisible(true);
    } catch (err: any) {
      console.error('Error preparing subscription:', err);
      Alert.alert('Error', err.message || 'Failed to start payment');
    } finally {
      setSelectedPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            try {
              // In a real app, this would call the backend to cancel subscription
              Alert.alert('Success', 'Your subscription has been cancelled.');
              loadSubscriptionData();
            } catch (err: any) {
              Alert.alert('Error', 'Failed to cancel subscription');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'expired': return '#FFC107';
      case 'cancelled': return '#F44336';
      default: return '#666666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'expired': return 'Expired';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Gradient
          colors={['rgba(220, 41, 41, 0.2)', 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 1)', 'rgba(34, 108, 174, 0.1)']}
          locations={[0, 0.25, 0.75, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        />
        <GameHeader title="Subscription" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#dc2929" />
          <ThemedText style={styles.loadingText}>Loading subscription plans...</ThemedText>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Gradient
          colors={['rgba(220, 41, 41, 0.2)', 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 1)', 'rgba(34, 108, 174, 0.1)']}
          locations={[0, 0.25, 0.75, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        />
        <GameHeader title="Subscription" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-triangle" size={50} color="#dc2929" />
          <ThemedText style={styles.errorText}>Error Loading Plans</ThemedText>
          <ThemedText style={styles.errorSubtext}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={loadSubscriptionData}>
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Gradient
        colors={['rgba(220, 41, 41, 0.2)', 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 1)', 'rgba(34, 108, 174, 0.1)']}
        locations={[0, 0.25, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />
      
      <GameHeader 
        title="Subscription" 
        showBackButton 
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        

        {/* Current Subscription */}
        {userSubscription && userSubscription.plan && (
          <ThemedView style={styles.currentSubscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <FontAwesome name="star" size={24} color="#FFD700" />
              <ThemedText style={styles.subscriptionTitle}>Current Plan</ThemedText>
            </View>
            
            <View style={styles.planInfo}>
              <ThemedText style={styles.planName}>{userSubscription.plan.name || 'Unknown Plan'}</ThemedText>
              <ThemedText style={styles.planDescription}>{userSubscription.plan.description || 'No description available'}</ThemedText>
              
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(userSubscription.status) }]}>
                  <ThemedText style={styles.statusText}>{getStatusText(userSubscription.status)}</ThemedText>
                </View>
              </View>
              
              <ThemedText style={styles.subscriptionDetails}>
                Valid until: {userSubscription.endDate ? new Date(userSubscription.endDate).toLocaleDateString() : 'Unknown'}
              </ThemedText>
              
              {userSubscription.status === 'active' && (
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={handleCancelSubscription}
                >
                  <ThemedText style={styles.cancelButtonText}>Cancel Subscription</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </ThemedView>
        )}

        {/* Available Plans */}
        <ThemedView style={styles.plansSection}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="list" size={20} color="#dc2929" />
            <ThemedText style={styles.sectionTitle}>Available Plans</ThemedText>
          </View>

          {plans.length > 0 ? (
            <View style={styles.plansList}>
              {plans
                .filter(plan => plan && plan._id)
                .filter(plan => Number((plan as any).price) > 0)
                .map((plan) => (
                <ThemedView key={plan._id} style={styles.planCard}>
                  <View style={styles.planHeader}>
                    <View style={styles.planTitleRow}>
                      <ThemedText style={styles.planName}>{plan.name}</ThemedText>
                      {plan.isPopular && (
                        <View style={styles.popularBadge}>
                          <ThemedText style={styles.popularText}>Popular</ThemedText>
                        </View>
                      )}
                    </View>
                    <View style={styles.priceContainer}>
                      <ThemedText style={styles.price}>₹{plan.price}</ThemedText>
                      <ThemedText style={styles.pricePeriod}>
                        for {plan.duration} {plan.durationType ? plan.durationType : 'days'}
                      </ThemedText>
                    </View>
                  </View>
                  
                  <ThemedText style={styles.planDescription}>{plan.description}</ThemedText>
                  
                  <View style={styles.featuresList}>
                    {plan.features && Array.isArray(plan.features) ? plan.features.map((feature, index) => {
                      console.log(`Feature ${index}:`, feature);
                      return (
                        <View key={index} style={styles.featureItem}>
                          <FontAwesome name="check" size={16} color="#4CAF50" />
                          <ThemedText style={styles.featureText}>
                            {typeof feature === 'string' ? feature : feature.name || feature.description || 'Feature'}
                          </ThemedText>
                        </View>
                      );
                    }) : (
                      <ThemedText style={styles.featureText}>No features available</ThemedText>
                    )}
                  </View>
                  
                  <TouchableOpacity 
                    style={[
                      styles.subscribeButton,
                      plan.isPopular && styles.popularSubscribeButton,
                      selectedPlan === plan._id && styles.subscribingButton
                    ]}
                    onPress={() => handleSubscribe(plan._id)}
                    disabled={selectedPlan === plan._id}
                  >
                    {selectedPlan === plan._id ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <FontAwesome name="star" size={16} color="#FFFFFF" />
                        <ThemedText style={styles.subscribeButtonText}>
                          {userSubscription?.plan?._id === plan._id ? 'Current Plan' : 'Subscribe'}
                        </ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                </ThemedView>
              ))}
            </View>
          ) : (
            <View style={styles.noPlansContainer}>
              <FontAwesome name="exclamation-circle" size={48} color="#666" />
              <ThemedText style={styles.noPlansText}>No subscription plans available</ThemedText>
            </View>
          )}
        </ThemedView>

        {/* Benefits Section */}
        <ThemedView style={styles.benefitsSection}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="gift" size={20} color="#226cae" />
            <ThemedText style={styles.sectionTitle}>Premium Benefits</ThemedText>
          </View>
          
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <FontAwesome name="unlock" size={20} color="#4CAF50" />
              <ThemedText style={styles.benefitText}>Unlock all premium features</ThemedText>
            </View>
            <View style={styles.benefitItem}>
              <FontAwesome name="users" size={20} color="#4CAF50" />
              <ThemedText style={styles.benefitText}>Join group discussions</ThemedText>
            </View>
            <View style={styles.benefitItem}>
              <FontAwesome name="trophy" size={20} color="#4CAF50" />
              <ThemedText style={styles.benefitText}>Access to leaderboards</ThemedText>
            </View>
            <View style={styles.benefitItem}>
              <FontAwesome name="book" size={20} color="#4CAF50" />
              <ThemedText style={styles.benefitText}>Advanced learning materials</ThemedText>
            </View>
            <View style={styles.benefitItem}>
              <FontAwesome name="headphones" size={20} color="#4CAF50" />
              <ThemedText style={styles.benefitText}>Priority support</ThemedText>
            </View>
          </View>
        </ThemedView>
      </ScrollView>

      {/* Payment Modal */}
      <PaymentModal
        visible={paymentVisible}
        onClose={() => setPaymentVisible(false)}
        plan={paymentPlan as any}
        onPaymentSuccess={() => {
          setPaymentVisible(false);
          loadSubscriptionData();
        }}
        onPaymentError={(msg: string) => {
          setPaymentVisible(false);
          Alert.alert('Payment Failed', msg || 'Your payment could not be completed.');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dc2929',
    marginTop: 12,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#dc2929',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  currentSubscriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginLeft: 12,
  },
  planInfo: {
    gap: 12,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  planDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  statusContainer: {
    alignSelf: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  subscriptionDetails: {
    fontSize: 14,
    color: '#666666',
  },
  cancelButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  cancelButtonText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
  },
  plansSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2929',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginLeft: 12,
  },
  plansList: {
    gap: 16,
  },
  planCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  popularBadge: {
    backgroundColor: '#dc2929',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  planHeader: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#dc2929',
  },
  pricePeriod: {
    fontSize: 14,
    color: '#226cae',
    marginLeft: 4,
  },
  featuresList: {
    marginVertical: 16,
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#333333',
    marginLeft: 8,
    flex: 1,
  },
  subscribeButton: {
    backgroundColor: '#226cae',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  popularSubscribeButton: {
    backgroundColor: '#dc2929',
  },
  subscribingButton: {
    opacity: 0.7,
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noPlansContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noPlansText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
    textAlign: 'center',
  },
  benefitsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#226cae',
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 14,
    color: '#333333',
    marginLeft: 12,
    flex: 1,
  },
  debugCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#856404',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});
