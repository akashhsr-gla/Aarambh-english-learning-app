import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { authAPI, leaderboardAPI } from '../services/api';

import Header from '@/components/Header';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const navigation = useNavigation();
  
  // Animation values for rotation
  const rotationAnim = useRef(new Animated.Value(0)).current;
  
  // User data state
  const [userData, setUserData] = useState({
    name: 'Loading...',
    playerCode: 'Loading...',
    points: 0,
    region: 'Loading...',
    rank: 'Loading...'
  });
  const [loading, setLoading] = useState(true);
  
  // Fetch user data
  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Get current user info
      const userResponse = await authAPI.getCurrentUser();
      
      if (userResponse.success && userResponse.data.user) {
        const user = userResponse.data.user;
        
        // Get user's rank if they are a student
        let rankInfo = null;
        if (user.role === 'student') {
          try {
            const rankResponse = await leaderboardAPI.getMyRank();
            if (rankResponse.success) {
              rankInfo = rankResponse.data;
            }
          } catch (error) {
            console.log('Rank fetch error (continuing):', error);
          }
        }
        
        const userData = {
          name: user.name || 'User',
          playerCode: user._id ? `#${user._id.slice(-6).toUpperCase()}` : '#000000',
          points: rankInfo ? rankInfo.statistics?.totalScore || 0 : (user.studentInfo?.totalPoints || 0),
          region: user.region?.name || 'No Region',
          rank: rankInfo ? `#${rankInfo.rank}` : (user.role === 'student' ? 'Unranked' : 'N/A')
        };
        
        setUserData(userData);
      } else {
        setUserData({
          name: 'Not logged in',
          playerCode: '#GUEST',
          points: 0,
          region: 'Unknown',
          rank: 'N/A'
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserData({
        name: 'Error loading',
        playerCode: '#ERROR',
        points: 0,
        region: 'Unknown',
        rank: 'N/A'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Start the rotation animation when component mounts
  useEffect(() => {
    const startRotationAnimation = () => {
      Animated.loop(
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 30000, // 30 seconds for a full rotation
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    };
    
    startRotationAnimation();
    fetchUserData();
    
    return () => {
      // Clean up animation when component unmounts
      rotationAnim.stopAnimation();
    };
  }, []);
  
  // Convert rotation value to degrees
  const rotation = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleChatPress = () => {
    navigation.navigate('ChatScreen' as never);
  };
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(220, 41, 41, 0.15)', 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 1)', 'rgba(34, 108, 174, 0.15)']}
        locations={[0, 0.25, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />
      
      <ScrollView style={styles.scrollContent}>
        {/* Header */}
        <Header title="Home" />

        {/* Title Section */}
      <ThemedView style={styles.titleContainer}>
          <ThemedText style={styles.titleText}>Welcome back!</ThemedText>
          <View style={styles.titleUnderline} />
        </ThemedView>

        {/* Player Info Card */}
        <ThemedView style={styles.playerCard}>
          <View style={styles.playerInfo}>
            <View style={styles.playerAvatar}>
              <FontAwesome name="user" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.playerDetails}>
              <ThemedText style={styles.playerName}>{userData.name}</ThemedText>
              <ThemedText style={styles.playerCode}>{userData.playerCode}</ThemedText>
            </View>
          </View>
          <View style={styles.playerStats}>
            <View style={styles.points}>
              <FontAwesome name="trophy" size={16} color="#FFD700" />
              <ThemedText style={styles.statsText}>Rank: {userData.rank}</ThemedText>
            </View>
            <View style={styles.region}>
              <FontAwesome name="map-marker" size={16} color="#226cae" />
              <ThemedText style={styles.statsText}>{userData.region}</ThemedText>
            </View>
          </View>
      </ThemedView>

        {/* Main Content */}
        <ThemedView style={styles.mainContent}>
          {/* Center Logo */}
          <View style={styles.centerLogoContainer}>
            <Image
              source={require('@/assets/images/R.png')}
              style={styles.centerLogo}
            />
          </View>

          {/* Features in Circle */}
          <Animated.View 
            style={[
              styles.featuresContainer,
              { transform: [{ rotate: rotation }] }
            ]}
          >
            {/* Dotted Circle */}
            <View style={styles.dottedCircle} />
            
            {/* Chat Feature - Top Left (315° or -45°) */}
            <View style={[styles.feature, styles.chatFeature]}>
              <TouchableOpacity style={styles.featureIconWrapper} onPress={handleChatPress}>
                <Animated.View 
                  style={[
                    styles.featureIcon, 
                    { backgroundColor: '#dc2929' },
                    { transform: [{ rotate: Animated.multiply(rotationAnim, -1).interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg']
                    }) }] }
                  ]}
                >
                  <FontAwesome name="comments" size={28} color="#FFFFFF" />
                </Animated.View>
              </TouchableOpacity>
              <Animated.View 
                style={[
                  styles.featureTextContainer,
                  { transform: [{ rotate: Animated.multiply(rotationAnim, -1).interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg']
                  }) }] }
                ]}
              >
                <ThemedText style={styles.featureText}>Chat in</ThemedText>
                <ThemedText style={styles.featureText}>English</ThemedText>
              </Animated.View>
            </View>

            {/* Call Feature - Top Right (45°) */}
            <View style={[styles.feature, styles.callFeature]}>
              <TouchableOpacity 
                style={styles.featureIconWrapper}
                onPress={() => navigation.navigate('CallScreen' as never)}
              >
                <Animated.View 
                  style={[
                    styles.featureIcon, 
                    { backgroundColor: '#226cae' },
                    { transform: [{ rotate: Animated.multiply(rotationAnim, -1).interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg']
                    }) }] }
                  ]}
                >
                  <FontAwesome name="mobile" size={28} color="#FFFFFF" style={{ transform: [{ scaleX: -1 }] }} />
                </Animated.View>
              </TouchableOpacity>
              <Animated.View 
                style={[
                  styles.featureTextContainer,
                  { transform: [{ rotate: Animated.multiply(rotationAnim, -1).interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg']
                  }) }] }
                ]}
              >
                <ThemedText style={styles.featureText}>Call in</ThemedText>
                <ThemedText style={styles.featureText}>English</ThemedText>
              </Animated.View>
            </View>

            {/* Group Discussion Feature - Bottom Left (225°) */}
            <View style={[styles.feature, styles.regionFeature]}>
              <TouchableOpacity 
                style={styles.featureIconWrapper}
                onPress={() => navigation.navigate('GroupDiscussionScreen' as never)}
              >
                <Animated.View 
                  style={[
                    styles.featureIcon, 
                    { backgroundColor: '#226cae' },
                    { transform: [{ rotate: Animated.multiply(rotationAnim, -1).interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg']
                    }) }] }
                  ]}
                >
                  <FontAwesome name="users" size={28} color="#FFFFFF" />
                </Animated.View>
              </TouchableOpacity>
              <Animated.View 
                style={[
                  styles.featureTextContainer,
                  { transform: [{ rotate: Animated.multiply(rotationAnim, -1).interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg']
                  }) }] }
                ]}
              >
                <ThemedText style={styles.featureText}>Group</ThemedText>
                <ThemedText style={styles.featureText}>Discussion</ThemedText>
              </Animated.View>
            </View>

            {/* Learn Feature - Bottom Right (135°) */}
            <View style={[styles.feature, styles.learnFeature]}>
              <TouchableOpacity 
                style={styles.featureIconWrapper}
                onPress={() => navigation.navigate('LearnScreen' as never)}
              >
                <Animated.View 
                  style={[
                    styles.featureIcon, 
                    { backgroundColor: '#dc2929' },
                    { transform: [{ rotate: Animated.multiply(rotationAnim, -1).interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg']
                    }) }] }
                  ]}
                >
                  <FontAwesome name="play" size={28} color="#FFFFFF" />
                </Animated.View>
              </TouchableOpacity>
              <Animated.View 
                style={[
                  styles.featureTextContainer,
                  { transform: [{ rotate: Animated.multiply(rotationAnim, -1).interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg']
                  }) }] }
                ]}
              >
                <ThemedText style={styles.featureText}>Learn</ThemedText>
                <ThemedText style={styles.featureText}>English</ThemedText>
              </Animated.View>
            </View>
          </Animated.View>
      </ThemedView>

        {/* Notification Card */}
        <ThemedView style={styles.notificationCard}>
          <View style={styles.notificationIcon}>
            <FontAwesome name="bell" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.notificationContent}>
            <ThemedText style={styles.notificationTitle}>Daily Goal</ThemedText>
            <ThemedText style={styles.notificationText}>Complete today's daily challenge to maintain your streak! 🔥</ThemedText>
          </View>
          <TouchableOpacity style={styles.notificationAction}>
            <FontAwesome name="arrow-right" size={16} color="#FFFFFF" />
          </TouchableOpacity>
      </ThemedView>
        <ThemedView style={styles.notificationCard}>
          <View style={styles.notificationIcon}>
            <FontAwesome name="bell" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.notificationContent}>
            <ThemedText style={styles.notificationTitle}>Daily Goal</ThemedText>
            <ThemedText style={styles.notificationText}>Your position in the leaderboard is {userData.rank}!</ThemedText>
          </View>
          <TouchableOpacity style={styles.notificationAction}>
            <FontAwesome name="arrow-right" size={16} color="#FFFFFF" />
          </TouchableOpacity>
      </ThemedView>
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
    padding: 20,
    paddingTop: 0,
  },
  playerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    backgroundColor: '#dc2929',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontWeight: '600',
    color: '#333333',
  },
  playerCode: {
    fontSize: 14,
    color: '#666666',
  },
  playerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  points: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  region: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    marginLeft: 8,
    color: '#666666',
  },
  mainContent: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    height: 400,
    position: 'relative',
  },
  centerLogoContainer: {
    position: 'absolute',
    top: 220,
    left: '50%',
    width: 120,
    height: 120,
    marginLeft: -60,
    marginTop: -60,
    zIndex: 2,
  },
  centerLogo: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  featuresContainer: {
    position: 'relative',
    width: 320,
    height: 320,
    alignSelf: 'center',
    marginTop: 40,
  },
  dottedCircle: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E0E0E0',
  },
  feature: {
    position: 'absolute',
    alignItems: 'center',
    width: 100,
  },
  featureIconWrapper: {
    marginBottom: 8,
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  titleContainer: {
    marginBottom: 24,
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
  },
  featureTextContainer: {
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'center',
  },
  featureText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  // Perfect circle positioning using trigonometry
  // Radius: 140px from center, positioned at 45° intervals
  chatFeature: {
    // Top-left: 315° (-45°)
    top: 20 + 140 - 140 * Math.cos(Math.PI / 4) - 30, // center - cos(45°) * radius - icon_height/2
    left: 20 + 140 - 140 * Math.sin(Math.PI / 4) - 50, // center - sin(45°) * radius - icon_width/2
  },
  callFeature: {
    // Top-right: 45°
    top: 20 + 140 - 140 * Math.cos(Math.PI / 4) - 30,
    left: 20 + 140 + 140 * Math.sin(Math.PI / 4) - 50,
  },
  regionFeature: {
    // Bottom-left: 225°
    top: 20 + 140 + 140 * Math.cos(Math.PI / 4) - 30,
    left: 20 + 140 - 140 * Math.sin(Math.PI / 4) - 50,
  },
  learnFeature: {
    // Bottom-right: 135°
    top: 20 + 140 + 140 * Math.cos(Math.PI / 4) - 30,
    left: 20 + 140 + 140 * Math.sin(Math.PI / 4) - 50,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 12,
    marginVertical: 10,
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 2,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#dc2929',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  notificationText: {
    fontSize: 14,
    color: '#666666',
  },
  notificationAction: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#226cae',
    alignItems: 'center',
    justifyContent: 'center',
  },
});