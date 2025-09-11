import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

const FeatureAccessWrapper = ({ 
  featureKey, 
  children, 
  fallback, 
  onAccessDenied = null,
  showUpgradePrompt = true,
  style,
  navigation
}) => {
  const { canAccess, isLoading, featureInfo, recordUsage } = useFeatureAccess(featureKey);

  const handlePress = async () => {
    if (canAccess) {
      await recordUsage();
      if (onAccessDenied) {
        onAccessDenied();
      }
    } else if (showUpgradePrompt) {
      showUpgradeAlert();
    }
  };

  const showUpgradeAlert = () => {
    const featureName = featureInfo?.name || 'This feature';
    Alert.alert(
      'Premium Feature',
      `${featureName} requires an active subscription. Would you like to upgrade your plan?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Upgrade', 
          onPress: () => {
            if (navigation) {
              navigation.navigate('SubscriptionScreen');
            } else {
              console.log('Navigation not available');
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (canAccess) {
    return (
      <TouchableOpacity 
        style={[styles.container, style]} 
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    );
  }

  if (fallback) {
    return fallback;
  }

  return (
    <ThemedView style={[styles.lockedContainer, style]}>
      <TouchableOpacity 
        style={styles.lockedContent}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.lockedIcon}>
          <FontAwesome name="lock" size={24} color="#666" />
        </View>
        <ThemedText style={styles.lockedText}>
          {featureInfo?.name || 'Premium Feature'}
        </ThemedText>
        <ThemedText style={styles.lockedSubtext}>
          Requires subscription
        </ThemedText>
        <TouchableOpacity 
          style={styles.upgradeButton}
          onPress={showUpgradeAlert}
        >
          <ThemedText style={styles.upgradeButtonText}>
            Upgrade Now
          </ThemedText>
        </TouchableOpacity>
      </TouchableOpacity>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    margin: 8,
  },
  lockedContent: {
    alignItems: 'center',
    padding: 20,
  },
  lockedIcon: {
    marginBottom: 12,
  },
  lockedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  lockedSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  upgradeButton: {
    backgroundColor: '#226cae',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default FeatureAccessWrapper;
