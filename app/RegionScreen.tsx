import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import Header from '../components/Header';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { authAPI, regionsAPI } from './services/api';

// Define region types
interface Region {
  _id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  totalUsers?: number;
  totalStudents?: number;
  totalTeachers?: number;
  averageScore?: number;
}

// This will be replaced with backend data

export default function RegionScreen() {
  const navigation = useNavigation();
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownHeight = useRef(new Animated.Value(0)).current;
  
  // Fetch regions from backend
  useEffect(() => {
    fetchRegions();
  }, []);
  
  // Animation for dropdown
  useEffect(() => {
    Animated.timing(dropdownHeight, {
      toValue: isDropdownOpen ? 300 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isDropdownOpen]);

  const fetchRegions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await regionsAPI.getAllRegions();

      if (response.success && response.data?.regions) {
        const fetchedRegions: Region[] = response.data.regions;
        setRegions(fetchedRegions);

        // Also fetch current user to preselect their region for preview
        try {
          const userRes = await authAPI.getCurrentUser();
          const userRegionId = userRes?.data?.user?.region?._id || userRes?.data?.user?.region;
          if (userRegionId) {
            const current = fetchedRegions.find(r => r._id === userRegionId);
            if (current) setSelectedRegion(current);
          }
        } catch {}
      } else {
        setError('Failed to load regions');
      }
    } catch (err) {
      console.error('Error fetching regions:', err);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };
  
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };
  
  const selectRegion = (region: Region) => {
    setSelectedRegion(region);
    setIsDropdownOpen(false);
  };
  
  const handleSaveRegion = async () => {
    if (selectedRegion) {
      try {
        // Get current user first
        const userResponse = await authAPI.getCurrentUser();
        if (!userResponse.success || !userResponse.data.user) {
          Alert.alert('Error', 'Failed to get user information');
          return;
        }

        const userId = userResponse.data.user._id;
        
        // Update user's region
        const updateResponse = await authAPI.updateProfile(userId, {
          region: selectedRegion._id
        });

        if (updateResponse.success) {
          Alert.alert(
            'Region Updated', 
            `Your region is now set to ${selectedRegion.name} (${selectedRegion.code}).`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Error', updateResponse.message || 'Failed to update region');
        }
      } catch (error: any) {
        console.error('Error updating region:', error);
        Alert.alert('Error', error.message || 'Failed to update region');
      }
    }
  };
  
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <LinearGradient
        colors={['rgba(220, 41, 41, 0.15)', 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 1)', 'rgba(34, 108, 174, 0.15)']}
        locations={[0, 0.25, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />
      
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
        {/* Header */}
        <Header title="Set Your Region" />
        
        {/* Title Section */}
        <ThemedView style={styles.titleContainer}>
          <ThemedText style={styles.titleText}>Choose your location</ThemedText>
          <View style={styles.titleUnderline} />
          <ThemedText style={styles.subtitleEmphasis}>
            Setting your region helps us to connect you with other people in your area to learn english together.
          </ThemedText>
        </ThemedView>
        
        {/* Loading State */}
        {loading && (
          <ThemedView style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#226cae" />
            <ThemedText style={styles.loadingText}>Loading regions...</ThemedText>
          </ThemedView>
        )}

        {/* Error State */}
        {error && (
          <ThemedView style={styles.errorContainer}>
            <FontAwesome name="exclamation-triangle" size={48} color="#dc2929" />
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <TouchableOpacity style={styles.retryButton} onPress={fetchRegions}>
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}
        
        {/* Region Selection */}
        {!loading && !error && (
        <ThemedView style={styles.selectionContainer}>
            <ThemedText style={styles.sectionLabel}>Region</ThemedText>
          
          <TouchableOpacity 
            style={styles.dropdownToggle}
              onPress={toggleDropdown}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.selectedText}>
                {selectedRegion ? selectedRegion.name : 'Select your region'}
            </ThemedText>
              <FontAwesome 
                name={isDropdownOpen ? 'chevron-up' : 'chevron-down'} 
                size={16} 
                color="#666666" 
              />
          </TouchableOpacity>
          
            <Animated.View style={[styles.dropdownContainer, { height: dropdownHeight }]}>
              <ScrollView showsVerticalScrollIndicator={true} style={styles.dropdownList}>
                {regions.map((item) => (
                  <TouchableOpacity 
                    key={item._id}
                    style={[
                      styles.dropdownItem,
                      selectedRegion?._id === item._id && styles.selectedDropdownItem
                    ]}
                    onPress={() => selectRegion(item)}
                  >
                    <View style={styles.dropdownItemContent}>
                    <ThemedText 
                      style={[
                        styles.dropdownItemText,
                          selectedRegion?._id === item._id && styles.selectedDropdownItemText
                        ]}
                      >
                        {item.name}
                      </ThemedText>
                      {item.description && (
                        <ThemedText style={styles.dropdownItemDescription}>
                          {item.description}
                    </ThemedText>
                      )}
                    </View>
                    {selectedRegion?._id === item._id && (
                      <FontAwesome name="check" size={16} color="#dc2929" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
          </Animated.View>
        </ThemedView>
        )}
        
        {/* Map Preview */}
        {!loading && !error && (
        <ThemedView style={styles.mapPreview}>
          <FontAwesome name="map" size={60} color="#226cae" />
          {selectedRegion ? (
            <>
              <ThemedText style={styles.mapTitle}>{selectedRegion.name} ({selectedRegion.code})</ThemedText>
              {selectedRegion.description && (
                <ThemedText style={styles.mapDescription}>{selectedRegion.description}</ThemedText>
              )}
              {typeof selectedRegion.totalUsers === 'number' && selectedRegion.totalUsers > 0 ? (
                <View style={styles.regionStats}>
                  {typeof selectedRegion.totalUsers === 'number' && selectedRegion.totalUsers > 0 && (
                    <View style={styles.statItem}>
                      <FontAwesome name="users" size={14} color="#226cae" />
                      <ThemedText style={styles.statText}>{selectedRegion.totalUsers} users</ThemedText>
                    </View>
                  )}
                </View>
              ) : null}
            </>
          ) : (
            <ThemedText style={styles.mapPlaceholderText}>Region preview will appear here</ThemedText>
          )}
        </ThemedView>
        )}
        
        {/* Save Button */}
        {!loading && !error && (
        <TouchableOpacity 
          style={[
            styles.saveButton,
              !selectedRegion && styles.disabledButton
          ]}
          onPress={handleSaveRegion}
            disabled={!selectedRegion}
        >
          <ThemedText style={styles.saveButtonText}>Save Region</ThemedText>
        </TouchableOpacity>
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
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 40,
  },
  titleContainer: {
    marginBottom: 30,
    alignItems: 'flex-start',
  },
  titleText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
  },
  titleUnderline: {
    width: 60,
    height: 3,
    backgroundColor: '#dc2929',
    borderRadius: 1.5,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 22,
  },
  selectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2929',
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 10,
  },
  dropdownToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedText: {
    fontSize: 16,
    color: '#333333',
  },
  disabledDropdown: {
    backgroundColor: '#F0F0F0',
    borderColor: '#E0E0E0',
  },
  disabledText: {
    color: '#999999',
  },
  dropdownContainer: {
    overflow: 'hidden',
    borderRadius: 10,
    marginTop: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dropdownList: {
    flex: 1,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedDropdownItem: {
    backgroundColor: '#FFF5F5',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333333',
  },
  selectedDropdownItemText: {
    color: '#dc2929',
    fontWeight: '600',
  },
  mapPreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#226cae',
  },
  mapTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#226cae',
    textAlign: 'center',
  },
  mapDescription: {
    marginTop: 6,
    fontSize: 13,
    color: '#555555',
    textAlign: 'center',
  },
  mapPlaceholderText: {
    marginTop: 15,
    color: '#333333',
    textAlign: 'center',
    fontWeight: '500',
  },
  subtitleEmphasis: {
    fontSize: 16,
    color: '#226cae',
    lineHeight: 22,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#dc2929',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 40,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 40,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2929',
  },
  errorText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#dc2929',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownItemContent: {
    flex: 1,
  },
  dropdownItemDescription: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  regionStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 12,
    color: '#666666',
  },
}); 