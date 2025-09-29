import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import { Alert, Animated, Dimensions, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '../components/ThemedText';
import { authAPI, regionsAPI } from './services/api';
// Work around TS JSX typing mismatch for expo-linear-gradient in some setups
const Gradient = (LinearGradient as unknown) as React.ComponentType<any>;

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const navigation = useNavigation();
  const [isLogin, setIsLogin] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('');
  const [regions, setRegions] = useState<{_id: string; name: string}[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const regionDropdownHeight = useRef(new Animated.Value(0)).current;

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
    
    // Fetch regions for signup
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      console.log('🌐 Fetching regions from backend...');
      const response = await regionsAPI.getAllRegions();
      console.log('🌐 Regions response:', response);
      
      if (response.success && response.data?.regions) {
        setRegions(response.data.regions);
        console.log('✅ Regions loaded successfully:', response.data.regions.length);
      } else {
        
        setRegions([
          { _id: '507f1f77bcf86cd799439011', name: 'North India' },
          { _id: '507f1f77bcf86cd799439012', name: 'South India' },
          { _id: '507f1f77bcf86cd799439013', name: 'East India' },
          { _id: '507f1f77bcf86cd799439014', name: 'West India' },
          { _id: '507f1f77bcf86cd799439015', name: 'Central India' }
        ]);
      }
    } catch (err: unknown) {
      console.error('❌ Error fetching regions:', err);
      // Fallback to hardcoded regions for testing
      setRegions([
        { _id: '507f1f77bcf86cd799439011', name: 'North India' },
        { _id: '507f1f77bcf86cd799439012', name: 'South India' },
        { _id: '507f1f77bcf86cd799439013', name: 'East India' },
        { _id: '507f1f77bcf86cd799439014', name: 'West India' },
        { _id: '507f1f77bcf86cd799439015', name: 'Central India' }
      ]);
    }
  };

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

  // Animation for region dropdown
  React.useEffect(() => {
    Animated.timing(regionDropdownHeight, {
      toValue: isRegionDropdownOpen ? 200 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isRegionDropdownOpen]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
    
      const response = await authAPI.login(email, password);
  
      
      if (response.success) {
       
        if (isTeacher) {
          navigation.navigate('TeacherDashboard' as never);
        } else {
          navigation.navigate('(tabs)' as never);
        }
      } else {
    
        Alert.alert('Login Failed', response.message || 'Invalid credentials');
      }
    } catch (err: unknown) {
      let errorMessage = 'Network error. Please try again.';
      const message = err instanceof Error ? err.message : String(err);
      // Try to extract more specific error information
      if (message) {
        if (message.includes('Invalid credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (message.includes('Account is deactivated')) {
          errorMessage = 'Your account has been deactivated. Please contact support.';
        } else if (message.includes('Validation')) {
          errorMessage = 'Please enter a valid email address and password.';
        } else if (message.includes('Invalid JSON')) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = message;
        }
      }
      
      Alert.alert('Login Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !name || !phone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // For region, use the selected region ID or fallback to the region name if no dropdown selection
    let selectedRegion = region;
    if (!selectedRegion && !isLogin) {
      Alert.alert('Error', 'Please select a region');
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
        region: selectedRegion
      };

      console.log('🚀 Attempting signup with data:', userData);
      const response = await authAPI.register(userData);
      console.log('🚀 Signup response:', response);
      
      if (response.success) {
        console.log('✅ Signup successful, token stored');
        Alert.alert('Success', 'Account created successfully!', [
          {
            text: 'OK',
            onPress: () => {
              // Navigate based on user role
              if (isTeacher) {
                navigation.navigate('TeacherDashboard' as never);
              } else {
                navigation.navigate('(tabs)' as never);
              }
            }
          }
        ]);
      } else {
        console.log('❌ Signup failed:', response.message);
        Alert.alert('Signup Failed', response.message || 'Failed to create account');
      }
    } catch (err: unknown) {
      console.error('❌ Signup error:', err);
      let errorMessage = 'Network error. Please try again.';
      const message = err instanceof Error ? err.message : String(err);
      
      // Try to extract more specific error information
      if (message) {
        if (message.includes('email already exists')) {
          errorMessage = 'An account with this email already exists. Please try logging in instead.';
        } else if (message.includes('phone already exists')) {
          errorMessage = 'An account with this phone number already exists.';
        } else if (message.includes('Validation')) {
          errorMessage = message;
        } else if (message.includes('Invalid JSON')) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = message;
        }
      }
      
      Alert.alert('Signup Error', errorMessage);
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
    setRegion('');
    setIsRegionDropdownOpen(false);
  };

  const handleForgotPasswordPress = () => {
    Alert.alert(
      'Password Reset',
      'Please contact support from your registered email or phone number.\n\nEmail: aarambhoffficial@gmail.com\nPhone: +91 6204 111 878',
      [
        { text: 'Email', onPress: () => Linking.openURL('mailto:aarambhoffficial@gmail.com') },
        { text: 'Call', onPress: () => Linking.openURL('tel:+916204111878') },
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

  const toggleRegionDropdown = () => {
    setIsRegionDropdownOpen(!isRegionDropdownOpen);
  };

  const selectRegion = (selectedRegion: {_id: string; name: string}) => {
    setRegion(selectedRegion._id);
    setIsRegionDropdownOpen(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="light" />
      
      {/* Background gradient */}
      <Gradient
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
            
            {/* Phone number field for all registration */}
            {!isLogin && (
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
            
            {/* Region selection field for all registration */}
            {!isLogin && (
              <View style={styles.regionInputContainer}>
                <View style={styles.inputGroup}>
                  <View style={styles.inputIcon}>
                    <FontAwesome name="map-marker" size={18} color="#666666" />
                  </View>
                  <View style={styles.pickerContainer}>
                    <TouchableOpacity 
                      style={styles.pickerButton}
                      onPress={toggleRegionDropdown}
                      activeOpacity={0.8}
                    >
                      <ThemedText style={[styles.pickerText, !region && styles.placeholderText]}>
                        {region ? regions.find(r => r._id === region)?.name || 'Select Region' : 'Select Region'}
                      </ThemedText>
                      <FontAwesome 
                        name={isRegionDropdownOpen ? "chevron-up" : "chevron-down"} 
                        size={16} 
                        color="#666666" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Animated Dropdown */}
                <Animated.View style={[styles.dropdownContainer, { height: regionDropdownHeight }]}>
                  <ScrollView 
                    showsVerticalScrollIndicator={true} 
                    style={styles.dropdownList}
                    nestedScrollEnabled={true}
                  >
                    {regions.map((regionItem) => (
                      <TouchableOpacity 
                        key={regionItem._id}
                        style={[
                          styles.dropdownItem,
                          region === regionItem._id && styles.selectedDropdownItem
                        ]}
                        onPress={() => selectRegion(regionItem)}
                      >
                        <ThemedText 
                          style={[
                            styles.dropdownItemText,
                            region === regionItem._id && styles.selectedDropdownItemText
                          ]}
                        >
                          {regionItem.name}
                        </ThemedText>
                        {region === regionItem._id && (
                          <FontAwesome name="check" size={16} color="#dc2929" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </Animated.View>
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
              <TouchableOpacity style={styles.forgotPasswordButton} onPress={handleForgotPasswordPress}>
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
    zIndex: 1000,
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
  regionInputContainer: {
    position: 'relative',
    marginBottom: 15,
    zIndex: 99999,
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
  pickerContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 99999,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  pickerText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  placeholderText: {
    color: '#999999',
  },
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 20,
    zIndex: 100000,
    overflow: 'hidden',
  },
  dropdownList: {
    maxHeight: 200,
    zIndex: 100001,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    zIndex: 100001,
  },
  selectedDropdownItem: {
    backgroundColor: '#FFF5F5',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  selectedDropdownItemText: {
    color: '#dc2929',
    fontWeight: '600',
  },
}); 