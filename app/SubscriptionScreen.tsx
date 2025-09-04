import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import GameHeader from '../components/GameHeader';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { plansAPI, transactionsAPI } from './services/api';

const { width } = Dimensions.get('window');

interface Subscription {
  subscriptionStatus: string;
  currentPlan?: {
    _id: string;
    name: string;
    description: string;
    price: number;
    duration: number;
    durationType: string;
    features: string[];
  };
  subscriptionExpiry?: string;
  transactions: any[];
}

interface Plan {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  durationType: string;
  features: string[];
  isActive: boolean;
  isPopular: boolean;
  priority: number;
  includesVideoCalls: boolean;
  includesVoiceCalls: boolean;
  includesGroupCalls: boolean;
  includesChat: boolean;
  includesGames: boolean;
  includesLectures: boolean;
}

export default function SubscriptionScreen() {
  const navigation = useNavigation();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load current subscription
      const subscriptionResponse = await transactionsAPI.getSubscription();
      setSubscription(subscriptionResponse.data);
      
      // If no active subscription, load available plans
      if (!subscriptionResponse.data.currentPlan || subscriptionResponse.data.subscriptionStatus !== 'active') {
        loadAvailablePlans();
      }
    } catch (err: any) {
      console.error('Error loading subscription:', err);
      setError(err.message || 'Failed to load subscription data');
      // Still try to load plans in case of subscription API error
      loadAvailablePlans();
    } finally {
      setLoading(false);
    }
  };

  const loadAvailablePlans = async () => {
    try {
      setPlansLoading(true);
      const plansResponse = await plansAPI.getAllPlans();
      setAvailablePlans(plansResponse.data.plans || []);
    } catch (err: any) {
      console.error('Error loading plans:', err);
    } finally {
      setPlansLoading(false);
    }
  };

  const handleSubscribeToPlan = async (plan: Plan) => {
    Alert.alert(
      'Subscribe to Plan',
      `Are you sure you want to subscribe to ${plan.name} for ₹${plan.price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Subscribe', 
          onPress: () => {
            // Here you would integrate with payment gateway
            Alert.alert('Coming Soon', 'Payment integration will be available soon!');
          }
        }
      ]
    );
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will lose access to premium features.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        { 
          text: 'Cancel Subscription', 
          style: 'destructive',
          onPress: async () => {
            try {
              await transactionsAPI.cancelSubscription();
              Alert.alert('Success', 'Subscription cancelled successfully');
              loadSubscriptionData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to cancel subscription');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'expired':
        return '#FF9800';
      case 'cancelled':
        return '#f44336';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return 'check-circle';
      case 'expired':
        return 'clock-o';
      case 'cancelled':
        return 'times-circle';
      default:
        return 'minus-circle';
    }
  };

  const renderCurrentSubscription = () => {
    if (!subscription?.currentPlan) return null;

    const plan = subscription.currentPlan;
    const isActive = subscription.subscriptionStatus === 'active';
    const statusColor = getStatusColor(subscription.subscriptionStatus);

    return (
      <ThemedView style={styles.currentPlanCard}>
        <View style={styles.planHeader}>
          <View>
            <ThemedText style={styles.currentPlanTitle}>Current Plan</ThemedText>
            <ThemedText style={styles.planName}>{plan.name}</ThemedText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <FontAwesome 
              name={getStatusIcon(subscription.subscriptionStatus)} 
              size={16} 
              color="#FFFFFF" 
            />
            <ThemedText style={styles.statusText}>
              {subscription.subscriptionStatus.charAt(0).toUpperCase() + subscription.subscriptionStatus.slice(1)}
            </ThemedText>
          </View>
        </View>

        <ThemedText style={styles.planDescription}>{plan.description}</ThemedText>

        <View style={styles.planDetails}>
          <View style={styles.priceContainer}>
            <ThemedText style={styles.priceSymbol}>₹</ThemedText>
            <ThemedText style={styles.priceAmount}>{plan.price}</ThemedText>
            <ThemedText style={styles.pricePeriod}>/{plan.durationType}</ThemedText>
          </View>

          {subscription.subscriptionExpiry && (
            <View style={styles.expiryContainer}>
              <FontAwesome name="calendar" size={16} color="#666666" />
              <ThemedText style={styles.expiryText}>
                {isActive ? 'Expires' : 'Expired'} on {formatDate(subscription.subscriptionExpiry)}
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.featuresContainer}>
          <ThemedText style={styles.featuresTitle}>Features Included:</ThemedText>
          <View style={styles.featuresList}>
            {plan.features?.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <FontAwesome name="check" size={14} color="#4CAF50" />
                <ThemedText style={styles.featureText}>{feature}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        {isActive && (
          <View style={styles.planActions}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancelSubscription}
            >
              <FontAwesome name="times" size={16} color="#f44336" />
              <ThemedText style={styles.cancelButtonText}>Cancel Subscription</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ThemedView>
    );
  };

  const renderPlanCard = (plan: Plan) => (
    <ThemedView key={plan._id} style={[styles.planCard, plan.isPopular && styles.popularPlan]}>
      {plan.isPopular && (
        <View style={styles.popularBadge}>
          <FontAwesome name="star" size={12} color="#FFFFFF" />
          <ThemedText style={styles.popularText}>Most Popular</ThemedText>
        </View>
      )}

      <View style={styles.planCardHeader}>
        <ThemedText style={styles.planCardName}>{plan.name}</ThemedText>
        <View style={styles.planPrice}>
          <ThemedText style={styles.planPriceSymbol}>₹</ThemedText>
          <ThemedText style={styles.planPriceAmount}>{plan.price}</ThemedText>
          <ThemedText style={styles.planPricePeriod}>/{plan.durationType}</ThemedText>
        </View>
      </View>

      <ThemedText style={styles.planCardDescription}>{plan.description}</ThemedText>

      <View style={styles.planFeatures}>
        {plan.features?.map((feature, index) => (
          <View key={index} style={styles.planFeatureItem}>
            <FontAwesome name="check" size={12} color="#4CAF50" />
            <ThemedText style={styles.planFeatureText}>{feature}</ThemedText>
          </View>
        ))}
      </View>

      <View style={styles.planCapabilities}>
        <View style={styles.capabilityRow}>
          <FontAwesome 
            name={plan.includesChat ? "check" : "times"} 
            size={14} 
            color={plan.includesChat ? "#4CAF50" : "#f44336"} 
          />
          <ThemedText style={styles.capabilityText}>Chat</ThemedText>
        </View>
        <View style={styles.capabilityRow}>
          <FontAwesome 
            name={plan.includesVoiceCalls ? "check" : "times"} 
            size={14} 
            color={plan.includesVoiceCalls ? "#4CAF50" : "#f44336"} 
          />
          <ThemedText style={styles.capabilityText}>Voice Calls</ThemedText>
        </View>
        <View style={styles.capabilityRow}>
          <FontAwesome 
            name={plan.includesVideoCalls ? "check" : "times"} 
            size={14} 
            color={plan.includesVideoCalls ? "#4CAF50" : "#f44336"} 
          />
          <ThemedText style={styles.capabilityText}>Video Calls</ThemedText>
        </View>
        <View style={styles.capabilityRow}>
          <FontAwesome 
            name={plan.includesGroupCalls ? "check" : "times"} 
            size={14} 
            color={plan.includesGroupCalls ? "#4CAF50" : "#f44336"} 
          />
          <ThemedText style={styles.capabilityText}>Group Calls</ThemedText>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.subscribeButton, plan.isPopular && styles.popularButton]}
        onPress={() => handleSubscribeToPlan(plan)}
      >
        <ThemedText style={[styles.subscribeButtonText, plan.isPopular && styles.popularButtonText]}>
          Subscribe Now
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(220, 41, 41, 0.2)', 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 1)', 'rgba(34, 108, 174, 0.1)']}
          locations={[0, 0.25, 0.75, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        />
        <GameHeader title="Subscription" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#dc2929" />
          <ThemedText style={styles.loadingText}>Loading subscription...</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
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
        {subscription?.currentPlan && subscription.subscriptionStatus === 'active' ? (
          renderCurrentSubscription()
        ) : (
          <ThemedView style={styles.noSubscriptionCard}>
            <FontAwesome name="star-o" size={48} color="#dc2929" />
            <ThemedText style={styles.noSubscriptionTitle}>No Active Subscription</ThemedText>
            <ThemedText style={styles.noSubscriptionText}>
              Choose a plan below to unlock premium features and enhance your learning experience!
            </ThemedText>
          </ThemedView>
        )}

        {/* Available Plans */}
        {(availablePlans.length > 0 || plansLoading) && (
          <>
            <View style={styles.sectionHeader}>
              <FontAwesome name="credit-card" size={20} color="#dc2929" />
              <ThemedText style={styles.sectionTitle}>
                {subscription?.currentPlan && subscription.subscriptionStatus === 'active' 
                  ? 'Upgrade Plans' 
                  : 'Choose Your Plan'
                }
              </ThemedText>
            </View>

            {plansLoading ? (
              <View style={styles.plansLoadingContainer}>
                <ActivityIndicator size="large" color="#dc2929" />
                <ThemedText style={styles.loadingText}>Loading plans...</ThemedText>
              </View>
            ) : (
              <View style={styles.plansContainer}>
                {availablePlans
                  .filter(plan => plan.isActive)
                  .sort((a, b) => b.priority - a.priority)
                  .map(renderPlanCard)}
              </View>
            )}
          </>
        )}

        {/* Error State */}
        {error && (
          <ThemedView style={styles.errorContainer}>
            <FontAwesome name="exclamation-triangle" size={24} color="#dc2929" />
            <ThemedText style={styles.errorText}>Error Loading Data</ThemedText>
            <ThemedText style={styles.errorSubtext}>{error}</ThemedText>
            <TouchableOpacity style={styles.retryButton} onPress={loadSubscriptionData}>
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}

        {/* Empty Plans State */}
        {!plansLoading && availablePlans.length === 0 && !error && (
          <ThemedView style={styles.emptyPlansContainer}>
            <FontAwesome name="inbox" size={48} color="#CCCCCC" />
            <ThemedText style={styles.emptyPlansText}>No plans available</ThemedText>
            <ThemedText style={styles.emptyPlansSubtext}>Please check back later for subscription options</ThemedText>
          </ThemedView>
        )}
      </ScrollView>
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
  currentPlanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#dc2929',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  currentPlanTitle: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 4,
  },
  planName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  planDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  planDetails: {
    marginBottom: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  priceSymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: '#dc2929',
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#dc2929',
  },
  pricePeriod: {
    fontSize: 16,
    color: '#666666',
    marginLeft: 4,
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expiryText: {
    fontSize: 14,
    color: '#666666',
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  planActions: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f44336',
  },
  noSubscriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#dc2929',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2929',
  },
  noSubscriptionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  noSubscriptionText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginLeft: 12,
  },
  plansLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  popularPlan: {
    borderColor: '#dc2929',
    borderWidth: 2,
    shadowColor: '#dc2929',
    shadowOpacity: 0.15,
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    right: 20,
    backgroundColor: '#dc2929',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    gap: 4,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  planCardHeader: {
    marginBottom: 12,
    marginTop: 8,
  },
  planCardName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
  },
  planPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPriceSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2929',
  },
  planPriceAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#dc2929',
  },
  planPricePeriod: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
  },
  planCardDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  planFeatures: {
    marginBottom: 16,
    gap: 8,
  },
  planFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planFeatureText: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  planCapabilities: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  capabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  capabilityText: {
    fontSize: 14,
    color: '#333333',
  },
  subscribeButton: {
    backgroundColor: '#226cae',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  popularButton: {
    backgroundColor: '#dc2929',
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  popularButtonText: {
    color: '#FFFFFF',
  },
  errorContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#dc2929',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2929',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dc2929',
    marginTop: 12,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
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
  emptyPlansContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyPlansText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyPlansSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
});
