import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import ChatButton from '@/components/ChatButton';
import Header from '@/components/Header';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import FeatureAccessWrapper from '../components/FeatureAccessWrapper';
import { useFeatureAccess } from '../hooks/useFeatureAccess';

export default function GameScreen() {
  const navigation = useNavigation();
  const [chatExpanded, setChatExpanded] = useState(false);
  const scrollViewRef = useRef(null);

  // Feature access control
  const { canAccess: canPlayGames, featureInfo: gameFeatureInfo } = useFeatureAccess('games');

  const toggleChat = () => {
    setChatExpanded(!chatExpanded);
  };

  const navigateToGame = (gameName: string) => {
    switch(gameName) {
      case 'pronunciation':
        navigation.navigate('PronunciationGame' as never);
        break;
      case 'grammar':
        navigation.navigate('GrammarQuiz' as never);
        break;
      case 'identification':
        navigation.navigate('IdentificationGame' as never);
        break;
      case 'storyTelling':
        navigation.navigate('StoryTellingGame' as never);
        break;
      default:
        // For games not yet implemented
        alert('Coming soon! This game is under development.');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(220, 41, 41, 0.15)', 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 1)', 'rgba(34, 108, 174, 0.15)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />
      
      <ScrollView style={styles.scrollView} ref={scrollViewRef}>
        {/* Header */}
        <Header title="Explore" />

        {/* Title Section */}
      <ThemedView style={styles.titleContainer}>
          <ThemedText style={styles.titleText}>Language Games</ThemedText>
          <View style={styles.titleUnderline} />
        </ThemedView>

        {/* Featured Games Section */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Featured Games</ThemedText>
        </View>

        {/* Game Cards */}
        <FeatureAccessWrapper
          featureKey="games"
          fallback={null}
          style={styles.container}
          navigation={navigation}
        >
        <View style={styles.gameContainer}>
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigateToGame('identification')}>
            <ThemedView style={styles.gameCard}>
              <View style={styles.gameCardContent}>
                <View style={[styles.gameIconContainer, { backgroundColor: '#226cae' }]}>
                  <FontAwesome name="picture-o" size={32} color="#FFFFFF" />
                </View>
                <View style={styles.gameDetails}>
                  <View style={styles.titleRow}>
                    <ThemedText style={styles.gameTitle}>Identification Game</ThemedText>
                  </View>
                  <ThemedText style={styles.gameDescription}>Name objects and activities correctly</ThemedText>
                  <View style={styles.levelContainer}>
                    <View style={styles.levelIndicator}>
                      <ThemedText style={styles.levelText}>Beginner</ThemedText>
                    </View>
                    <View style={styles.starsContainer}>
                      <FontAwesome name="star" size={14} color="#FFD700" style={styles.starIcon} />
                      <FontAwesome name="star" size={14} color="#FFD700" style={styles.starIcon} />
                      <FontAwesome name="star-o" size={14} color="#FFD700" style={styles.starIcon} />
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.gameCardArrow}>
                <FontAwesome name="chevron-right" size={20} color="#666666" />
              </View>
            </ThemedView>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} onPress={() => navigateToGame('pronunciation')}>
            <ThemedView style={styles.gameCard}>
              <View style={styles.gameCardContent}>
                <View style={[styles.gameIconContainer, { backgroundColor: '#dc2929' }]}>
                  <FontAwesome name="microphone" size={32} color="#FFFFFF" />
                </View>
                <View style={styles.gameDetails}>
                  <ThemedText style={styles.gameTitle}>Pronunciation Challenge</ThemedText>
                  <ThemedText style={styles.gameDescription}>Practice speaking clearly</ThemedText>
                  <View style={styles.levelContainer}>
                    <View style={styles.levelIndicator}>
                      <ThemedText style={styles.levelText}>Advanced</ThemedText>
                    </View>
                    <View style={styles.starsContainer}>
                      <FontAwesome name="star" size={14} color="#FFD700" style={styles.starIcon} />
                      <FontAwesome name="star" size={14} color="#FFD700" style={styles.starIcon} />
                      <FontAwesome name="star" size={14} color="#FFD700" style={styles.starIcon} />
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.gameCardArrow}>
                <FontAwesome name="chevron-right" size={20} color="#666666" />
              </View>
            </ThemedView>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} onPress={() => navigateToGame('grammar')}>
            <ThemedView style={styles.gameCard}>
              <View style={styles.gameCardContent}>
                <View style={[styles.gameIconContainer, { backgroundColor: '#226cae' }]}>
                  <FontAwesome name="pencil" size={32} color="#FFFFFF" />
                </View>
                <View style={styles.gameDetails}>
                  <ThemedText style={styles.gameTitle}>Grammar Quiz</ThemedText>
                  <ThemedText style={styles.gameDescription}>Test your grammar knowledge</ThemedText>
                  <View style={styles.levelContainer}>
                    <View style={styles.levelIndicator}>
                      <ThemedText style={styles.levelText}>Intermediate</ThemedText>
                    </View>
                    <View style={styles.starsContainer}>
                      <FontAwesome name="star" size={14} color="#FFD700" style={styles.starIcon} />
                      <FontAwesome name="star" size={14} color="#FFD700" style={styles.starIcon} />
                      <FontAwesome name="star-o" size={14} color="#FFD700" style={styles.starIcon} />
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.gameCardArrow}>
                <FontAwesome name="chevron-right" size={20} color="#666666" />
              </View>
            </ThemedView>
          </TouchableOpacity>
          
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigateToGame('storyTelling')}>
            <ThemedView style={styles.gameCard}>
              <View style={styles.gameCardContent}>
                <View style={[styles.gameIconContainer, { backgroundColor: '#dc2929' }]}>
                  <FontAwesome name="book" size={32} color="#FFFFFF" />
                </View>
                <View style={styles.gameDetails}>
                  <View style={styles.titleRow}>
                    <ThemedText style={styles.gameTitle}>Story Telling</ThemedText>
                  </View>
                  <ThemedText style={styles.gameDescription}>Complete creative stories and earn points</ThemedText>
                  <View style={styles.levelContainer}>
                    <View style={styles.levelIndicator}>
                      <ThemedText style={styles.levelText}>Advanced</ThemedText>
                    </View>
                    <View style={styles.starsContainer}>
                      <FontAwesome name="star" size={14} color="#FFD700" style={styles.starIcon} />
                      <FontAwesome name="star" size={14} color="#FFD700" style={styles.starIcon} />
                      <FontAwesome name="star" size={14} color="#FFD700" style={styles.starIcon} />
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.gameCardArrow}>
                <FontAwesome name="chevron-right" size={20} color="#666666" />
              </View>
            </ThemedView>
          </TouchableOpacity>
        </View>
        </FeatureAccessWrapper>

        {/* Daily Challenges Section */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Daily Challenges</ThemedText>
        </View>

        <ThemedView style={styles.challengeCard}>
          <View style={styles.challengeHeader}>
            <View style={styles.challengeIconContainer}>
              <FontAwesome name="calendar-check-o" size={24} color="#FFFFFF" />
            </View>
            <ThemedText style={styles.challengeTitle}>Today's Challenge</ThemedText>
          </View>
          
          <TouchableOpacity style={styles.startChallengeButton} onPress={() => navigateToGame('identification')}>
            <ThemedText style={styles.startChallengeText}>Start Challenge</ThemedText>
            <FontAwesome name="play" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </ThemedView>
        
        
      </ScrollView>

      {/* Chat Button */}
      <ChatButton />
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#226cae',
    marginRight: 4,
  },
  gameContainer: {
    marginBottom: 30,
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  gameCardContent: {
    flexDirection: 'row',
    flex: 1,
  },
  gameIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gameDetails: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  newBadge: {
    backgroundColor: '#dc2929',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  gameDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  starIcon: {
    marginRight: 3,
  },
  gameCardArrow: {
    paddingLeft: 16,
  },
  challengeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 41, 41, 0.05)',
    padding: 16,
  },
  challengeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dc2929',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  challengeContent: {
    padding: 16,
  },
  challengeDescription: {
    fontSize: 15,
    color: '#333333',
    marginBottom: 16,
  },
  challengeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  challengeStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  challengeStatText: {
    fontSize: 13,
    color: '#666666',
    marginLeft: 6,
  },
  startChallengeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#226cae',
    padding: 14,
    gap: 8,
  },
  startChallengeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  leaderboardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(34, 108, 174, 0.1)',
  },
  leaderboardHeader: {
    padding: 16,
    backgroundColor: 'rgba(34, 108, 174, 0.05)',
    alignItems: 'center',
  },
  leaderboardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
  },
  leaderboardSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  topPlayersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingVertical: 20,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  topPlayerItem: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  firstPlace: {
    marginBottom: -10,
    zIndex: 3,
  },
  secondPlace: {
    marginBottom: 10,
    zIndex: 2,
  },
  thirdPlace: {
    marginBottom: 15,
    zIndex: 1,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#226cae',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  firstRank: {
    backgroundColor: '#dc2929',
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  rankText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  crownIcon: {
    position: 'absolute',
    top: -15,
    zIndex: 4,
  },
  avatarContainer: {
    marginBottom: 5,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  playerScore: {
    fontSize: 12,
    color: '#666666',
  },
  otherRankings: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  currentUserRanking: {
    backgroundColor: 'rgba(34, 108, 174, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginHorizontal: -10,
    borderBottomWidth: 0,
  },
  currentUserText: {
    color: '#226cae',
    fontWeight: '600',
  },
  rankingNumber: {
    width: 30,
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  rankingAvatar: {
    marginRight: 12,
  },
  rankingName: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
  },
  rankingScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
});
