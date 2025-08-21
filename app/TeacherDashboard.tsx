import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';

const { width, height } = Dimensions.get('window');

// Sample data for teacher dashboard
const TEACHER_DATA = {
  name: "John Smith",
  email: "john.smith@example.com",
  referralCode: "TEACH123",
  totalEarnings: 12500,
  pendingClaims: 2500,
  claimableAmount: 3500,
};

// Sample student data
const STUDENTS_DATA = [
  {
    id: 1,
    name: "Aisha Patel",
    joinDate: "15 Jun 2023",
    completedLessons: 42,
    status: "active",
    earnings: 1200,
  },
  {
    id: 2,
    name: "Michael Chen",
    joinDate: "23 Jul 2023",
    completedLessons: 36,
    status: "active",
    earnings: 950,
  },
  {
    id: 3,
    name: "Priya Sharma",
    joinDate: "05 Aug 2023",
    completedLessons: 28,
    status: "active",
    earnings: 800,
  },
  {
    id: 4,
    name: "David Wilson",
    joinDate: "12 Sep 2023",
    completedLessons: 18,
    status: "inactive",
    earnings: 550,
  },
  {
    id: 5,
    name: "Sophia Rodriguez",
    joinDate: "30 Sep 2023",
    completedLessons: 12,
    status: "active",
    earnings: 350,
  },
];

export default function TeacherDashboard() {
  const navigation = useNavigation();
  const [showReferralCode, setShowReferralCode] = useState(false);
  const [isClaimSubmitted, setIsClaimSubmitted] = useState(false);

  const formatCurrency = (amount: number) => {
    return "₹" + amount.toLocaleString('en-IN');
  };

  const handleClaim = () => {
    Alert.alert(
      "Claim Submitted",
      "Your claim for " + formatCurrency(TEACHER_DATA.claimableAmount) + " has been submitted. Our team will contact you shortly at your registered phone number.",
      [{ text: "OK", onPress: () => setIsClaimSubmitted(true) }]
    );
  };

  const handleLogout = () => {
    // Navigate back to login screen
    navigation.navigate('LoginScreen' as never);
  };

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
              <ThemedText style={styles.headerName}>{TEACHER_DATA.name}</ThemedText>
              <ThemedText style={styles.headerEmail}>{TEACHER_DATA.email}</ThemedText>
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
              {showReferralCode ? TEACHER_DATA.referralCode : "••••••••"}
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
              <ThemedText style={styles.earningsValue}>{formatCurrency(TEACHER_DATA.totalEarnings)}</ThemedText>
              <ThemedText style={styles.earningsLabel}>Total Earnings</ThemedText>
            </View>
            
            <View style={styles.earningsItem}>
              <ThemedText style={styles.earningsValue}>{formatCurrency(TEACHER_DATA.pendingClaims)}</ThemedText>
              <ThemedText style={styles.earningsLabel}>Pending Claims</ThemedText>
            </View>
            
            <View style={[styles.earningsItem, styles.highlightedEarningsItem]}>
              <ThemedText style={[styles.earningsValue, styles.highlightedEarningsValue]}>
                {formatCurrency(TEACHER_DATA.claimableAmount)}
              </ThemedText>
              <ThemedText style={styles.earningsLabel}>Available to Claim</ThemedText>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.claimButton,
              isClaimSubmitted && styles.disabledClaimButton
            ]}
            onPress={handleClaim}
            disabled={isClaimSubmitted || TEACHER_DATA.claimableAmount === 0}
          >
            <FontAwesome name="money" size={18} color="#FFFFFF" style={styles.claimButtonIcon} />
            <ThemedText style={styles.claimButtonText}>
              {isClaimSubmitted ? "Claim Submitted" : "Claim Earnings"}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Students List */}
        <ThemedView style={styles.studentsContainer}>
          <ThemedText style={styles.sectionTitle}>Your Students</ThemedText>
          <ThemedText style={styles.sectionSubtitle}>
            {STUDENTS_DATA.length} students referred by you
          </ThemedText>
          
          {STUDENTS_DATA.map(student => (
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
          ))}
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