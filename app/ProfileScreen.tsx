import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
// Work around TS JSX typing mismatch for expo-linear-gradient in some setups
const Gradient = (LinearGradient as unknown) as React.ComponentType<any>;

import GameHeader from '../components/GameHeader';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { authAPI } from './services/api';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'student' | 'teacher' | 'admin';
  profilePicture?: string;
  region?: {
    _id: string;
    name: string;
    code: string;
  };
  studentInfo?: {
    languageLevel: 'beginner' | 'intermediate' | 'advanced';
    subscriptionStatus?: string;
    currentPlan?: any;
    planExpiryDate?: string;
  };
  teacherInfo?: {
    subject: string;
    experience: number;
  };
  createdAt: string;
  lastActive: string;
}

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.getCurrentUser();
      const user = response.data.user;
      setProfile(user);
      
      // Initialize edit form
      setEditForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      setError(null);

      const updateData = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone
      };

      await authAPI.updateProfile(profile._id, updateData);
      
      // Reload profile to get updated data
      await loadProfile();
      setIsEditing(false);
      
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
      Alert.alert('Error', err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSubscriptionStatus = () => {
    if (!profile?.studentInfo) return 'Not applicable';
    const expiry = profile.studentInfo.planExpiryDate
      ? new Date(profile.studentInfo.planExpiryDate)
      : null;
    const isActive = expiry ? expiry.getTime() > Date.now() : false;
    if (isActive) return '✅ Active';
    // fallback to server-provided status if present
    const status = profile.studentInfo.subscriptionStatus;
    if (status === 'cancelled') return '❌ Cancelled';
    if (status === 'expired') return '⏰ Expired';
    return '⭕ Inactive';
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
        <GameHeader title="Profile" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#dc2929" />
          <ThemedText style={styles.loadingText}>Loading profile...</ThemedText>
        </View>
      </View>
    );
  }

  if (error && !profile) {
    return (
      <View style={styles.container}>
        <Gradient
          colors={['rgba(220, 41, 41, 0.2)', 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 1)', 'rgba(34, 108, 174, 0.1)']}
          locations={[0, 0.25, 0.75, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        />
        <GameHeader title="Profile" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-triangle" size={50} color="#dc2929" />
          <ThemedText style={styles.errorText}>Error Loading Profile</ThemedText>
          <ThemedText style={styles.errorSubtext}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
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
        title="Profile" 
        showBackButton 
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <ThemedView style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <FontAwesome name="user" size={50} color="#FFFFFF" />
            </View>
            <View style={styles.roleIndicator}>
              <FontAwesome 
                name={profile?.role === 'student' ? 'graduation-cap' : profile?.role === 'teacher' ? 'user' : 'user'} 
                size={16} 
                color="#FFFFFF" 
              />
            </View>
          </View>
          
          <View style={styles.headerInfo}>
            <ThemedText style={styles.profileName}>{profile?.name}</ThemedText>
            <ThemedText style={styles.profileEmail}>{profile?.email}</ThemedText>
            <View style={styles.roleBadge}>
              <ThemedText style={styles.roleText}>
                {profile?.role === 'student' ? '🎓 Student' : profile?.role === 'teacher' ? '👨‍🏫 Teacher' : '👤 User'}
              </ThemedText>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setIsEditing(!isEditing)}
          >
            <FontAwesome name={isEditing ? "times" : "edit"} size={20} color="#dc2929" />
          </TouchableOpacity>
        </ThemedView>

        {/* Basic Information */}
        <ThemedView style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="info-circle" size={20} color="#dc2929" />
            <ThemedText style={styles.sectionTitle}>Basic Information</ThemedText>
          </View>

          {isEditing ? (
            <View style={styles.editForm}>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Full Name</ThemedText>
                <TextInput
                  style={styles.textInput}
                  value={editForm.name}
                  onChangeText={(text) => setEditForm({ ...editForm, name: text })}
                  placeholder="Enter your full name"
                  placeholderTextColor="#999999"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Email Address</ThemedText>
                <TextInput
                  style={styles.textInput}
                  value={editForm.email}
                  onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                  placeholder="Enter your email address"
                  placeholderTextColor="#999999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Phone Number</ThemedText>
                <TextInput
                  style={styles.textInput}
                  value={editForm.phone}
                  onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#999999"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.editActions}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => {
                    setIsEditing(false);
                    // Reset form
                    setEditForm({
                      name: profile?.name || '',
                      email: profile?.email || '',
                      phone: profile?.phone || ''
                    });
                  }}
                >
                  <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.saveButton, saving && styles.disabledButton]}
                  onPress={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <ThemedText style={styles.infoLabel}>Email</ThemedText>
                <ThemedText style={styles.infoValue}>{profile?.email}</ThemedText>
              </View>

              <View style={styles.infoItem}>
                <ThemedText style={styles.infoLabel}>Phone</ThemedText>
                <ThemedText style={styles.infoValue}>{profile?.phone || 'Not provided'}</ThemedText>
              </View>

              <View style={styles.infoItem}>
                <ThemedText style={styles.infoLabel}>Region</ThemedText>
                <ThemedText style={styles.infoValue}>{profile?.region?.name || 'Not selected'}</ThemedText>
              </View>

              {profile?.role === 'student' && (
                <View style={styles.infoItem}>
                  <ThemedText style={styles.infoLabel}>Subscription</ThemedText>
                  <ThemedText style={styles.infoValue}>{getSubscriptionStatus()}</ThemedText>
                </View>
              )}

              {profile?.role === 'teacher' && (
                <>
                  <View style={styles.infoItem}>
                    <ThemedText style={styles.infoLabel}>Subject</ThemedText>
                    <ThemedText style={styles.infoValue}>{profile.teacherInfo?.subject || 'Not specified'}</ThemedText>
                  </View>

                  <View style={styles.infoItem}>
                    <ThemedText style={styles.infoLabel}>Experience</ThemedText>
                    <ThemedText style={styles.infoValue}>
                      {profile.teacherInfo?.experience ? `${profile.teacherInfo.experience} years` : 'Not specified'}
                    </ThemedText>
                  </View>
                </>
              )}
            </View>
          )}
        </ThemedView>

        {/* Account Information */}
        <ThemedView style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="calendar" size={20} color="#226cae" />
            <ThemedText style={styles.sectionTitle}>Account Information</ThemedText>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <ThemedText style={styles.infoLabel}>Member Since</ThemedText>
              <ThemedText style={styles.infoValue}>{formatDate(profile?.createdAt || '')}</ThemedText>
            </View>

            <View style={styles.infoItem}>
              <ThemedText style={styles.infoLabel}>Last Active</ThemedText>
              <ThemedText style={styles.infoValue}>{formatDate(profile?.lastActive || '')}</ThemedText>
            </View>

            <View style={styles.infoItem}>
              <ThemedText style={styles.infoLabel}>Account ID</ThemedText>
              <ThemedText style={styles.infoValue}>{profile?._id.slice(-8).toUpperCase()}</ThemedText>
            </View>
          </View>
        </ThemedView>

        {error && (
          <ThemedView style={styles.errorBanner}>
            <FontAwesome name="exclamation-circle" size={16} color="#dc2929" />
            <ThemedText style={styles.errorBannerText}>{error}</ThemedText>
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
  profileHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#dc2929',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2929',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dc2929',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleIndicator: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#226cae',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: 'rgba(220, 41, 41, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2929',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(220, 41, 41, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#dc2929',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#226cae',
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
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  editForm: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#dc2929',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorBanner: {
    backgroundColor: 'rgba(220, 41, 41, 0.1)',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#dc2929',
  },
  errorBannerText: {
    fontSize: 14,
    color: '#dc2929',
    marginLeft: 8,
    flex: 1,
  },
});
