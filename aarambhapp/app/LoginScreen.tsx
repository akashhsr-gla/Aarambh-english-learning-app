import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, Animated, Dimensions, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '../components/ThemedText';
import { authAPI } from './services/api';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const navigation = useNavigation();
  const [isLogin, setIsLogin] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Animated values for subtle UI animations
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  React.useEffect(() => {
    // Fade in animation when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Animation when switching between login and signup
  React.useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isLogin, isTeacher]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.login(email, password);
      if (response.success) {
        // Navigate based on user role
        if (isTeacher) {
          navigation.navigate('TeacherDashboard' as never);
        } else {
          navigation.navigate('(tabs)' as never);
        }
      } else {
        Alert.alert('Login Failed', response.message || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !name || !phone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const userData = {
        name,
        email,
        password,
        phone,
        role: isTeacher ? 'teacher' : 'student',
        referralCode: referralCode || undefined
      };

      const response = await authAPI.register(userData);
      if (response.success) {
        // Navigate based on user role
        if (isTeacher) {
          navigation.navigate('TeacherDashboard' as never);
        } else {
          navigation.navigate('(tabs)' as never);
        }
      } else {
        Alert.alert('Signup Failed', response.message || 'Failed to create account');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setReferralCode('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="light" />
      
      {/* Background gradient */}
      <LinearGradient
        colors={['rgba(220, 41, 41, 0.8)', 'rgba(34, 108, 174, 0.8)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />
      
      {/* Semi-transparent overlay for better text readability */}
      <View style={styles.overlay} />
      
      <Animated.View 
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/R.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <ThemedText style={styles.appName}>Aarambh</ThemedText>
          <ThemedText style={styles.tagline}>Begin Your English Journey</ThemedText>
        </View>
        
        {/* Auth Form */}
        <View style={styles.formContainer}>
          {/* User Type Toggle */}
          <View style={styles.userTypeContainer}>
            <TouchableOpacity 
              style={[styles.userTypeButton, !isTeacher && styles.activeUserType]}
              onPress={() => setIsTeacher(false)}
            >
              <FontAwesome name="user" size={16} color={!isTeacher ? "#FFFFFF" : "#666666"} />
              <ThemedText style={[styles.userTypeText, !isTeacher && styles.activeUserTypeText]}>Student</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.userTypeButton, isTeacher && styles.activeUserType]}
              onPress={() => setIsTeacher(true)}
            >
              <FontAwesome name="graduation-cap" size={16} color={isTeacher ? "#FFFFFF" : "#666666"} />
              <ThemedText style={[styles.userTypeText, isTeacher && styles.activeUserTypeText]}>Teacher</ThemedText>
            </TouchableOpacity>
          </View>
          
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tabButton, isLogin && styles.activeTab]}
              onPress={() => setIsLogin(true)}
            >
              <ThemedText style={[styles.tabText, isLogin && styles.activeTabText]}>Sign In</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, !isLogin && styles.activeTab]}
              onPress={() => setIsLogin(false)}
            >
              <ThemedText style={[styles.tabText, !isLogin && styles.activeTabText]}>Sign Up</ThemedText>
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputsContainer}>
            {!isLogin && (
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <FontAwesome name="user" size={18} color="#666666" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#999999"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}
            
            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <FontAwesome name="envelope" size={18} color="#666666" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#999999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            {/* Phone number field for teacher registration */}
            {isTeacher && !isLogin && (
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <FontAwesome name="phone" size={18} color="#666666" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  placeholderTextColor="#999999"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            )}
            
            {/* Referral code field for teacher registration */}
            {isTeacher && !isLogin && (
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <FontAwesome name="ticket" size={18} color="#666666" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Referral Code (Optional)"
                  placeholderTextColor="#999999"
                  value={referralCode}
                  onChangeText={setReferralCode}
                  autoCapitalize="characters"
                />
              </View>
            )}
            
            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <FontAwesome name="lock" size={18} color="#666666" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                style={styles.showPasswordButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <FontAwesome name={showPassword ? "eye-slash" : "eye"} size={18} color="#666666" />
              </TouchableOpacity>
            </View>
            
            {isLogin && (
              <TouchableOpacity style={styles.forgotPasswordButton}>
                <ThemedText style={styles.forgotPasswordText}>Forgot Password?</ThemedText>
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            style={[styles.primaryButton, isLoading && styles.loadingButton, isTeacher ? styles.teacherButton : styles.studentButton]}
            onPress={isLogin ? handleLogin : handleSignUp}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingIndicator}>
                <ThemedText style={styles.primaryButtonText}>
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </ThemedText>
              </View>
            ) : (
              <ThemedText style={styles.primaryButtonText}>
                {isLogin ? 'Sign In' : 'Create Account'}
              </ThemedText>
            )}
          </TouchableOpacity>
          
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <ThemedText style={styles.dividerText}>OR</ThemedText>
            <View style={styles.divider} />
          </View>
          
          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity style={[styles.socialButton, styles.googleButton]}>
              <FontAwesome name="google" size={18} color="#FFFFFF" />
              <ThemedText style={styles.socialButtonText}>Google</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialButton, styles.facebookButton]}>
              <FontAwesome name="facebook" size={18} color="#FFFFFF" />
              <ThemedText style={styles.socialButtonText}>Facebook</ThemedText>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.switchModeButton} onPress={toggleAuthMode}>
            <ThemedText style={styles.switchModeText}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <ThemedText style={styles.switchModeTextHighlight}>
                {isLogin ? "Sign Up" : "Sign In"}
              </ThemedText>
            </ThemedText>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
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
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 10,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  userTypeContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  userTypeButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeUserType: {
    backgroundColor: '#226cae',
  },
  userTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginLeft: 6,
  },
  activeUserTypeText: {
    color: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#dc2929',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  inputsContainer: {
    marginBottom: 20,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputIcon: {
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    paddingRight: 15,
    fontSize: 16,
    color: '#333333',
  },
  showPasswordButton: {
    padding: 15,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  forgotPasswordText: {
    color: '#226cae',
    fontSize: 14,
  },
  primaryButton: {
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  studentButton: {
    backgroundColor: '#dc2929',
    shadowColor: '#dc2929',
  },
  teacherButton: {
    backgroundColor: '#226cae',
    shadowColor: '#226cae',
  },
  loadingButton: {
    opacity: 0.7,
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    color: '#666666',
    paddingHorizontal: 10,
    fontSize: 14,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    width: '48%',
  },
  googleButton: {
    backgroundColor: '#DB4437',
  },
  facebookButton: {
    backgroundColor: '#4267B2',
  },
  socialButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
  switchModeButton: {
    alignItems: 'center',
  },
  switchModeText: {
    fontSize: 14,
    color: '#666666',
  },
  switchModeTextHighlight: {
    color: '#226cae',
    fontWeight: '600',
  },
}); 