import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';

import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { teacherAPI, authAPI } from './services/api';

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
      const referralData = teacherResponse.data;

      // Calculate earnings based on referral data
      const referrals = referralData.referrals || [];
      const statistics = referralData.statistics || {};
      
      // Calculate total earnings (simplified calculation - actual formula may vary)
      const totalUses = statistics.totalUses || 0;
      const avgEarningsPerReferral = 500; // This should come from backend configuration
      const totalEarnings = totalUses * avgEarningsPerReferral;
      const claimableAmount = Math.floor(totalEarnings * 0.3); // 30% can be claimed
      const pendingClaims = Math.floor(totalEarnings * 0.1); // 10% pending

      setTeacherData({
        name: currentUser.name,
        email: currentUser.email,
        referralCode: currentUser.teacherInfo?.referralCode || 'N/A',
        totalEarnings,
        pendingClaims,
        claimableAmount,
      });

      // Transform referrals into students data
      const students = referrals.map((referral: any, index: number) => ({
        id: index + 1,
        name: referral.usedBy?.name || 'Unknown Student',
        joinDate: new Date(referral.createdAt).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }),
        completedLessons: Math.floor(Math.random() * 50) + 10, // Mock data - should come from backend
        status: referral.isActive ? 'active' : 'inactive',
        earnings: avgEarningsPerReferral,
      }));

      setStudentsData(students);

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
            <TouchableOpacity style={styles.copyButton}>
              <FontAwesome name="copy" size={20} color="#226cae" />
            </TouchableOpacity>
          </View>
          
          <ThemedText style={styles.referralHint}>
            Share this code with students to earn rewards when they join
          </ThemedText>
        </ThemedView>

        {/* Earnings Summary */}
        <ThemedView style={styles.earningsContainer}>
          <ThemedText style={styles.sectionTitle}>Earnings Summary</ThemedText>
          
          <View style={styles.earningsGrid}>
            <View style={styles.earningsItem}>
              <ThemedText style={styles.earningsValue}>{formatCurrency(teacherData.totalEarnings)}</ThemedText>
              <ThemedText style={styles.earningsLabel}>Total Earnings</ThemedText>
            </View>
            
            <View style={styles.earningsItem}>
              <ThemedText style={styles.earningsValue}>{formatCurrency(teacherData.pendingClaims)}</ThemedText>
              <ThemedText style={styles.earningsLabel}>Pending Claims</ThemedText>
            </View>
            
            <View style={[styles.earningsItem, styles.highlightedEarningsItem]}>
              <ThemedText style={[styles.earningsValue, styles.highlightedEarningsValue]}>
                {formatCurrency(teacherData.claimableAmount)}
              </ThemedText>
              <ThemedText style={styles.earningsLabel}>Available to Claim</ThemedText>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.claimButton,
              (isClaimSubmitted || claimLoading || teacherData.claimableAmount === 0) && styles.disabledClaimButton
            ]}
            onPress={handleClaim}
            disabled={isClaimSubmitted || claimLoading || teacherData.claimableAmount === 0}
          >
            {claimLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={styles.claimButtonIcon} />
            ) : (
              <FontAwesome name="money" size={18} color="#FFFFFF" style={styles.claimButtonIcon} />
            )}
            <ThemedText style={styles.claimButtonText}>
              {claimLoading ? "Submitting..." : isClaimSubmitted ? "Claim Submitted" : "Claim Earnings"}
            </ThemedText>
          </TouchableOpacity>
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
              <View style={styles.studentStats}>
                <View style={styles.studentStat}>
                  <ThemedText style={styles.statValue}>{student.completedLessons}</ThemedText>
                  <ThemedText style={styles.statLabel}>Lessons</ThemedText>
                </View>
                <View style={styles.studentStat}>
                  <ThemedText style={styles.statValue}>{formatCurrency(student.earnings)}</ThemedText>
                  <ThemedText style={styles.statLabel}>Earnings</ThemedText>
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
  referralHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
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