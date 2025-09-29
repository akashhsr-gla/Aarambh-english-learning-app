import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { authAPI, teacherAPI } from './services/api';

const { width, height } = Dimensions.get('window');

// Default/loading data structure
const DEFAULT_TEACHER_DATA = {
  name: "",
  email: "",
  referralCode: "",
  totalEarnings: 0,
  pendingClaims: 0,
  claimableAmount: 0,
};

export default function TeacherDashboard() {
  const navigation = useNavigation();
  const [showReferralCode, setShowReferralCode] = useState(false);
  const [isClaimSubmitted, setIsClaimSubmitted] = useState(false);
  const [teacherData, setTeacherData] = useState(DEFAULT_TEACHER_DATA);
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [profileExpanded, setProfileExpanded] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFields, setEditFields] = useState<any>({
    name: '',
    email: '',
    phone: '',
    qualification: '',
    experience: 0,
    specialization: '', // comma-separated in UI
    bio: '',
    hourlyRate: 0,
  });

  // Load teacher dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user info first
      const userResponse = await authAPI.getCurrentUser();
      const currentUser = userResponse.data;

      // Get teacher referral data and statistics
      const teacherResponse = await teacherAPI.getDashboardData();
      const referralData = teacherResponse.data || {};

      // Calculate earnings based on referral data
      const referrals = (referralData.referrals || []) as any[];
      const statistics = referralData.statistics || {};
      const teacher = referralData.teacher || currentUser;
      const teacherCode = referralData.code || currentUser.teacherInfo?.referralCode || 'N/A';
      const transactions = referralData.transactions || [];
      
      // Calculate total earnings (simplified calculation - actual formula may vary)
      const totalUses = statistics.totalUses || 0;
      const avgEarningsPerReferral = 500; // This should come from backend configuration
      const totalEarnings = totalUses * avgEarningsPerReferral;
      const claimableAmount = Math.floor(totalEarnings * 0.3); // 30% can be claimed
      const pendingClaims = Math.floor(totalEarnings * 0.1); // 10% pending

      setTeacherData({
        name: teacher.name,
        email: teacher.email,
        referralCode: teacherCode,
        totalEarnings,
        pendingClaims,
        claimableAmount,
      });

      // Build students list from transactions (has user + plan info)
      const students = (transactions as any[]).map((tx: any, index: number) => ({
        id: index + 1,
        name: tx.user?.name || 'Unknown Student',
        joinDate: new Date(tx.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        status: tx.status || 'Unknown',
        plan: tx.plan?.name || 'Plan',
        amount: tx.amount || 0,
        finalAmount: tx.finalAmount || tx.amount || 0,
        discount: tx.discountAmount || 0,
        earnings: avgEarningsPerReferral,
      }));

      setStudentsData(students);

      // Prime editable fields from current teacher profile
      setEditFields({
        name: teacher.name || '',
        email: teacher.email || '',
        phone: teacher.phone || '',
        qualification: teacher.teacherInfo?.qualification || '',
        experience: teacher.teacherInfo?.experience || 0,
        specialization: (teacher.teacherInfo?.specialization || []).join(', '),
        bio: teacher.teacherInfo?.bio || '',
        hourlyRate: teacher.teacherInfo?.hourlyRate || 0,
      });

    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const formatCurrency = (amount: number) => {
    return "₹" + amount.toLocaleString('en-IN');
  };

  const handleClaim = async () => {
    if (claimLoading || teacherData.claimableAmount === 0) return;

    try {
      setClaimLoading(true);
      
      const claimData = {
        amount: teacherData.claimableAmount,
        type: 'referral_earnings',
        teacherId: (await authAPI.getCurrentUser()).data._id
      };

      await teacherAPI.submitClaim(claimData);

      Alert.alert(
        "Claim Submitted",
        `Your claim for ${formatCurrency(teacherData.claimableAmount)} has been submitted. Our team will contact you shortly at your registered phone number.`,
        [{ 
          text: "OK", 
          onPress: () => {
            setIsClaimSubmitted(true);
            // Update local state to reflect claim submission
            setTeacherData(prev => ({
              ...prev,
              pendingClaims: prev.pendingClaims + prev.claimableAmount,
              claimableAmount: 0
            }));
          }
        }]
      );
    } catch (error: any) {
      console.error('Error submitting claim:', error);
      Alert.alert('Error', error.message || 'Failed to submit claim');
    } finally {
      setClaimLoading(false);
    }
  };

  const handleLogout = () => {
    // Navigate back to login screen
    navigation.navigate('LoginScreen' as never);
  };

  const saveProfile = async () => {
    if (savingProfile) return;
    try {
      setSavingProfile(true);
      const me = await authAPI.getCurrentUser();
      const userId = me.data._id;
      const payload = {
        name: editFields.name,
        email: editFields.email,
        phone: editFields.phone,
        teacherInfo: {
          qualification: editFields.qualification,
          experience: Number(editFields.experience) || 0,
          specialization: String(editFields.specialization || '')
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0),
          bio: editFields.bio,
          hourlyRate: Number(editFields.hourlyRate) || 0,
        },
      };
      const resp = await authAPI.updateProfile(userId, payload);
      if (!resp.success) throw new Error(resp.message || 'Failed to update profile');
      Alert.alert('Profile Updated', 'Your teacher profile has been saved.');
      setIsEditingProfile(false);
      // Reload data to get updated information
      await loadDashboardData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const cancelEdit = () => {
    setIsEditingProfile(false);
    // Reset form to original values
    setEditFields({
      name: teacherData.name,
      email: teacherData.email,
      phone: '', // Will be loaded from current user data
      qualification: '',
      experience: 0,
      specialization: '',
      bio: '',
      hourlyRate: 0,
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#226cae" />
        <ThemedText style={styles.loadingText}>Loading dashboard...</ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <FontAwesome name="exclamation-triangle" size={50} color="#dc2929" />
        <ThemedText style={styles.errorText}>Error Loading Dashboard</ThemedText>
        <ThemedText style={styles.errorSubtext}>{error}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={loadDashboardData}>
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header with gradient background */}
      <LinearGradient
        colors={['#226cae', '#1a5089']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.profileIcon}>
              <FontAwesome name="user" size={24} color="#FFFFFF" />
            </View>
            <View>
              <ThemedText style={styles.headerName}>{teacherData.name}</ThemedText>
              <ThemedText style={styles.headerEmail}>{teacherData.email}</ThemedText>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      {/* Teacher Profile (Expandable, editable) */}
      <ThemedView style={styles.profileCard}>
        <View style={styles.profileHeaderRow}>
          <View style={styles.profileHeaderLeft}>
            <FontAwesome name="user-circle" size={20} color="#dc2929" />
            <ThemedText style={styles.sectionTitle}>Teacher Profile</ThemedText>
          </View>
          <View style={styles.profileHeaderRight}>
            {!isEditingProfile && (
              <TouchableOpacity onPress={() => setIsEditingProfile(true)} style={styles.editButton}>
                <FontAwesome name="edit" size={16} color="#dc2929" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setProfileExpanded(!profileExpanded)} style={styles.toggleButton}>
              <FontAwesome name={profileExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#dc2929" />
            </TouchableOpacity>
          </View>
        </View>
        {profileExpanded && (
          <View>
            {isEditingProfile ? (
              <View style={styles.editForm}>
                {/* Basic Information */}
                <View style={styles.formSection}>
                  <ThemedText style={styles.formSectionTitle}>Basic Information</ThemedText>
                  <View style={styles.inputGroup}>
                    <ThemedText style={styles.inputLabel}>Full Name</ThemedText>
                    <TextInput
                      style={styles.textInput}
                      value={editFields.name}
                      onChangeText={(text) => setEditFields({ ...editFields, name: text })}
                      placeholder="Enter your full name"
                      placeholderTextColor="#999999"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <ThemedText style={styles.inputLabel}>Email Address</ThemedText>
                    <TextInput
                      style={styles.textInput}
                      value={editFields.email}
                      onChangeText={(text) => setEditFields({ ...editFields, email: text })}
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
                      value={editFields.phone}
                      onChangeText={(text) => setEditFields({ ...editFields, phone: text })}
                      placeholder="Enter your phone number"
                      placeholderTextColor="#999999"
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                {/* Professional Information */}
                <View style={styles.formSection}>
                  <ThemedText style={styles.formSectionTitle}>Professional Information</ThemedText>
                  <View style={styles.formGrid}>
                    <View style={styles.formField}>
                      <ThemedText style={styles.inputLabel}>Qualification</ThemedText>
                      <TextInput
                        style={styles.textInput}
                        value={editFields.qualification}
                        onChangeText={(text) => setEditFields({ ...editFields, qualification: text })}
                        placeholder="e.g., B.Ed, M.A English"
                        placeholderTextColor="#999999"
                      />
                    </View>
                    <View style={styles.formField}>
                      <ThemedText style={styles.inputLabel}>Experience (years)</ThemedText>
                      <TextInput
                        style={styles.textInput}
                        value={String(editFields.experience)}
                        onChangeText={(text) => setEditFields({ ...editFields, experience: Number(text) || 0 })}
                        placeholder="0"
                        placeholderTextColor="#999999"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.formField}>
                      <ThemedText style={styles.inputLabel}>Hourly Rate (₹)</ThemedText>
                      <TextInput
                        style={styles.textInput}
                        value={String(editFields.hourlyRate)}
                        onChangeText={(text) => setEditFields({ ...editFields, hourlyRate: Number(text) || 0 })}
                        placeholder="0"
                        placeholderTextColor="#999999"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={[styles.formField, { width: '100%' }]}>
                      <ThemedText style={styles.inputLabel}>Specialization</ThemedText>
                      <TextInput
                        style={styles.textInput}
                        value={editFields.specialization}
                        onChangeText={(text) => setEditFields({ ...editFields, specialization: text })}
                        placeholder="e.g., English Grammar, Speaking, Writing (comma-separated)"
                        placeholderTextColor="#999999"
                      />
                    </View>
                    <View style={[styles.formField, { width: '100%' }]}>
                      <ThemedText style={styles.inputLabel}>Bio</ThemedText>
                      <TextInput
                        style={[styles.textInput, styles.textAreaInput]}
                        value={editFields.bio}
                        onChangeText={(text) => setEditFields({ ...editFields, bio: text })}
                        placeholder="Tell us about your teaching experience and approach..."
                        placeholderTextColor="#999999"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                      />
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.editActions}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={cancelEdit}
                  >
                    <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.saveButton, savingProfile && styles.disabledButton]}
                    onPress={saveProfile}
                    disabled={savingProfile}
                  >
                    {savingProfile ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View>
                {/* Display Mode */}
                <View style={styles.profileGrid}>
                  <View style={styles.profileField}> 
                    <ThemedText style={styles.profileLabel}>Name</ThemedText>
                    <ThemedText style={styles.profileValue}>{teacherData.name}</ThemedText>
                  </View>
                  <View style={styles.profileField}> 
                    <ThemedText style={styles.profileLabel}>Email</ThemedText>
                    <ThemedText style={styles.profileValue}>{teacherData.email}</ThemedText>
                  </View>
                </View>
                <View style={styles.profileInfoGrid}>
                  <View style={styles.profileInfoField}>
                    <ThemedText style={styles.profileLabel}>Qualification</ThemedText>
                    <ThemedText style={styles.profileValue}>{editFields.qualification || 'Not specified'}</ThemedText>
                  </View>
                  <View style={styles.profileInfoField}>
                    <ThemedText style={styles.profileLabel}>Experience</ThemedText>
                    <ThemedText style={styles.profileValue}>{editFields.experience} years</ThemedText>
                  </View>
                  <View style={styles.profileInfoField}>
                    <ThemedText style={styles.profileLabel}>Hourly Rate</ThemedText>
                    <ThemedText style={styles.profileValue}>₹{editFields.hourlyRate}/hour</ThemedText>
                  </View>
                  <View style={[styles.profileInfoField, { width: '100%' }]}>
                    <ThemedText style={styles.profileLabel}>Specialization</ThemedText>
                    <ThemedText style={styles.profileValue}>{editFields.specialization || 'Not specified'}</ThemedText>
                  </View>
                  {editFields.bio && (
                    <View style={[styles.profileInfoField, { width: '100%' }]}>
                      <ThemedText style={styles.profileLabel}>Bio</ThemedText>
                      <ThemedText style={styles.profileValue}>{editFields.bio}</ThemedText>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        )}
      </ThemedView>

      {/* Referral Code Section */}
        <ThemedView style={styles.referralContainer}>
          <View style={styles.referralHeader}>
            <ThemedText style={styles.sectionTitle}>Your Referral Code</ThemedText>
            <TouchableOpacity 
              style={styles.toggleButton}
              onPress={() => setShowReferralCode(!showReferralCode)}
            >
              <FontAwesome 
                name={showReferralCode ? "eye-slash" : "eye"} 
                size={18} 
                color="#226cae" 
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.referralCodeContainer}>
            <ThemedText style={styles.referralCode}>
              {showReferralCode ? teacherData.referralCode : "••••••••"}
            </ThemedText>
            <TouchableOpacity 
              style={styles.copyButton}
              onPress={async () => {
                try {
                  const code = teacherData.referralCode || '';
                  if (!code) {
                    Alert.alert('Copy Failed', 'No referral code available to copy.');
                    return;
                  }
                  await Clipboard.setStringAsync(code);
                  Alert.alert('Copied', 'Referral code copied to clipboard.');
                } catch (e) {
                  Alert.alert('Copy Failed', 'Unable to copy the code. Please try again.');
                }
              }}
            >
              <FontAwesome name="copy" size={20} color="#226cae" />
            </TouchableOpacity>
          </View>
          
          <ThemedText style={styles.referralHint}>
            Share this code with students to earn rewards when they join
          </ThemedText>
        </ThemedView>


        {/* Students List */}
        <ThemedView style={styles.studentsContainer}>
          <ThemedText style={styles.sectionTitle}>Your Students</ThemedText>
          <ThemedText style={styles.sectionSubtitle}>
            {studentsData.length} students referred by you
          </ThemedText>
          
          {studentsData.length === 0 ? (
            <View style={styles.emptyStudentsContainer}>
              <FontAwesome name="users" size={50} color="#CCCCCC" />
              <ThemedText style={styles.emptyStudentsText}>No students yet</ThemedText>
              <ThemedText style={styles.emptyStudentsSubtext}>
                Share your referral code to start earning
              </ThemedText>
            </View>
          ) : (
            studentsData.map(student => (
            <View key={student.id} style={styles.studentCard}>
              <View style={styles.studentInfo}>
                <View style={styles.studentAvatar}>
                  <FontAwesome 
                    name="user-circle" 
                    size={36} 
                    color={student.status === 'active' ? '#226cae' : '#999999'} 
                  />
                </View>
                <View style={styles.studentDetails}>
                  <ThemedText style={styles.studentName}>{student.name}</ThemedText>
                  <View style={styles.studentMeta}>
                    <ThemedText style={styles.studentDate}>Joined: {student.joinDate}</ThemedText>
                    <View style={[
                      styles.statusIndicator, 
                      student.status === 'active' ? styles.activeStatus : styles.inactiveStatus
                    ]} />
                  </View>
                </View>
              </View>
              
            </View>
            ))
          )}
        </ThemedView>
        
        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <FontAwesome name="sign-out" size={18} color="#FFFFFF" style={styles.logoutButtonIcon} />
          <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
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
    backgroundColor: '#226cae',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyStudentsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 20,
  },
  emptyStudentsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 12,
  },
  emptyStudentsSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginTop: 8,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  headerEmail: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  referralContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2929',
  },
  profileHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(220, 41, 41, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  profileField: {
    flex: 1,
  },
  profileLabel: {
    fontSize: 12,
    color: '#dc2929',
    marginBottom: 4,
    fontWeight: '600',
  },
  profileValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  profileInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  profileInfoField: {
    width: '48%',
  },
  editForm: {
    gap: 20,
  },
  formSection: {
    gap: 16,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2929',
    marginBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#dc2929',
    paddingBottom: 8,
  },
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  formField: {
    width: '48%',
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2929',
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
    borderWidth: 1.5,
    borderColor: '#dc2929',
  },
  textAreaInput: {
    minHeight: 80,
    textAlignVertical: 'top',
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
  referralHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#dc2929',
    marginLeft: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: -5,
    marginBottom: 15,
  },
  toggleButton: {
    padding: 5,
  },
  referralCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 108, 174, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  referralCode: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: '#226cae',
    letterSpacing: 1,
  },
  copyButton: {
    padding: 5,
  },
  referralHint: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  earningsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  earningsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 15,
    marginBottom: 20,
  },
  earningsItem: {
    width: '50%',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  highlightedEarningsItem: {
    width: '100%',
    backgroundColor: 'rgba(34, 108, 174, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginTop: 5,
  },
  earningsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 5,
  },
  highlightedEarningsValue: {
    fontSize: 24,
    color: '#226cae',
  },
  earningsLabel: {
    fontSize: 14,
    color: '#666666',
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2929',
    borderRadius: 10,
    paddingVertical: 15,
    shadowColor: '#dc2929',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledClaimButton: {
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
  },
  claimButtonIcon: {
    marginRight: 10,
  },
  claimButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  studentsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  studentCard: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  studentInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  studentAvatar: {
    marginRight: 12,
  },
  studentDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  studentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentDate: {
    fontSize: 13,
    color: '#666666',
    marginRight: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeStatus: {
    backgroundColor: '#4CAF50',
  },
  inactiveStatus: {
    backgroundColor: '#F44336',
  },
  studentStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    paddingTop: 12,
  },
  studentStat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#226cae',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2929',
    borderRadius: 10,
    paddingVertical: 15,
    marginTop: 10,
    shadowColor: '#dc2929',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonIcon: {
    marginRight: 10,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 