import { FontAwesome } from '@expo/vector-icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import GameHeader from '../components/GameHeader';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { gamesAPI } from './services/api';

const { width } = Dimensions.get('window');

// Define challenge type
type Challenge = {
  id: number;
  title: string;
  description: string;
  points: number;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  game: string;
  completed: boolean;
  timeRequired: string;
  participants: number;
};

// Define filter types
type FilterType = 'all' | 'exams' | 'profession';
type ExamType = 'all' | 'nda' | 'ssc' | 'banking' | 'upsc' | 'cat';
type ProfessionType = 'all' | 'engineering' | 'medical' | 'teaching' | 'business' | 'student';

// Game types
type GameType = 'grammar' | 'pronunciation' | 'identification' | 'storytelling';

// Game types mapping
const GAME_TYPE_MAPPING: Record<GameType, string> = {
  'grammar': 'Grammar Quiz',
  'pronunciation': 'Pronunciation Practice',
  'identification': 'Object Identification',
  'storytelling': 'Story Creation'
};

// Game type icons
const GAME_TYPE_ICONS: Record<GameType, React.ComponentProps<typeof FontAwesome>['name']> = {
  'grammar': 'book',
  'pronunciation': 'microphone',
  'identification': 'eye',
  'storytelling': 'pencil'
};

// Game type colors
const GAME_TYPE_COLORS: Record<GameType, string> = {
  'grammar': '#FFC107',
  'pronunciation': '#4CAF50',
  'identification': '#226cae',
  'storytelling': '#9C27B0'
};

type RootStackParamList = {
  GameScreen: { gameType: GameType };
  '(tabs)': undefined;
};

export default function DailyChallenges() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' or 'weekly'
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedExam, setSelectedExam] = useState<ExamType>('all');
  const [selectedProfession, setSelectedProfession] = useState<ProfessionType>('all');
  const [dailyChallenge, setDailyChallenge] = useState<{
    game: any;
    question: any;
    gameType: GameType;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch daily challenge on component mount
  useEffect(() => {
    fetchDailyChallenge();
  }, []);

  const fetchDailyChallenge = async () => {
    try {
      setLoading(true);
      // Get all games and select a random one for daily challenge
      const response = await gamesAPI.getAllGames();
      console.log('🔍 Daily Challenge API Response:', response); // Debug log
      
      if (response.success && response.data) {
        // Handle different response structures
        let gamesData = response.data;
        
        // If response.data.games exists (nested structure)
        if (response.data.games && Array.isArray(response.data.games)) {
          gamesData = response.data.games;
        }
        // If response.data is directly an array
        else if (Array.isArray(response.data)) {
          gamesData = response.data;
        }
        // Fallback to empty array
        else {
          gamesData = [];
        }
        
        console.log('🎮 Daily Challenge Games Data:', gamesData); // Debug log
        
        if (gamesData.length > 0) {
          // Select a random game for daily challenge
          const randomGame = gamesData[Math.floor(Math.random() * gamesData.length)];
          
          // Ensure the game has questions
          if (randomGame.questions && randomGame.questions.length > 0) {
            const randomQuestion = randomGame.questions[Math.floor(Math.random() * randomGame.questions.length)];
            
            setDailyChallenge({
              game: randomGame,
              question: randomQuestion,
              gameType: randomGame.gameType
            });
            setError(null);
          } else {
            setError('Selected game has no questions available');
          }
        } else {
          setError('No games available for daily challenge');
        }
      } else {
        setError('No games available for daily challenge');
      }
    } catch (err) {
      console.error('🚨 Daily Challenge API Error:', err); // Debug log
      setError('Failed to fetch daily challenge');
    } finally {
      setLoading(false);
    }
  };

  const navigateToGame = (gameName: string) => {
    switch(gameName) {
      case 'grammar':
        navigation.navigate('GameScreen', { gameType: 'grammar' });
        break;
      case 'pronunciation':
        navigation.navigate('GameScreen', { gameType: 'pronunciation' });
        break;
      case 'identification':
        navigation.navigate('GameScreen', { gameType: 'identification' });
        break;
      case 'storytelling':
        navigation.navigate('GameScreen', { gameType: 'storytelling' });
        break;
      default:
        navigation.navigate('(tabs)');
    }
  };

  const startDailyChallenge = () => {
    if (dailyChallenge) {
      navigation.navigate('GameScreen', { 
        gameType: dailyChallenge.gameType 
      });
    }
  };

  const renderDailyChallengeCard = () => {
    if (!dailyChallenge) return null;

    const { game, question, gameType } = dailyChallenge;
    
    return (
      <ThemedView style={styles.dailyChallengeCard}>
        <View style={styles.dailyChallengeHeader}>
          <View style={[styles.dailyChallengeIconContainer, { backgroundColor: GAME_TYPE_COLORS[gameType] }]}>
            <FontAwesome name={GAME_TYPE_ICONS[gameType]} size={32} color="#FFFFFF" />
          </View>
          <View style={styles.dailyChallengeTitleContainer}>
            <ThemedText style={styles.dailyChallengeTitle}>Daily Challenge</ThemedText>
            <ThemedText style={styles.dailyChallengeSubtitle}>{GAME_TYPE_MAPPING[gameType]}</ThemedText>
          </View>
          <View style={styles.dailyChallengePoints}>
            <ThemedText style={styles.dailyChallengePointsText}>50</ThemedText>
            <ThemedText style={styles.dailyChallengePointsLabel}>PTS</ThemedText>
          </View>
        </View>
        
        <View style={styles.dailyChallengeContent}>
          <ThemedText style={styles.dailyChallengeQuestion}>
            {question.questionText || question.question || "Daily challenge question"}
          </ThemedText>
          
          <View style={styles.dailyChallengeOptions}>
            {Array.isArray(question.options) && question.options.slice(0, 2).map((option: any, index: number) => (
              <View key={index} style={styles.dailyChallengeOption}>
                <FontAwesome 
                  name="circle-o" 
                  size={16} 
                  color="#666" 
                  style={styles.optionIcon}
                />
                <ThemedText style={styles.optionText} numberOfLines={2}>
                  {option.text}
                </ThemedText>
              </View>
            ))}
            {Array.isArray(question.options) && (
              <View style={styles.dailyChallengeMore}>
                <ThemedText style={styles.dailyChallengeMoreText}>+{question.options.length - 2} more options</ThemedText>
              </View>
            )}
          </View>
          
          <View style={styles.dailyChallengeStats}>
            <View style={styles.dailyChallengeStat}>
              <FontAwesome name="clock-o" size={14} color="#dc2929" />
              <ThemedText style={styles.dailyChallengeStatText}>{Math.floor((game.timeLimit || 300) / 60)}m</ThemedText>
            </View>
            <View style={styles.dailyChallengeStat}>
              <FontAwesome name="star" size={14} color="#FFD700" />
              <ThemedText style={styles.dailyChallengeStatText}>{question.points || 10} pts</ThemedText>
            </View>
            <View style={styles.dailyChallengeStat}>
              <FontAwesome name="users" size={14} color="#226cae" />
              <ThemedText style={styles.dailyChallengeStatText}>Daily</ThemedText>
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.startDailyChallengeButton}
          onPress={startDailyChallenge}
        >
          <ThemedText style={styles.startDailyChallengeText}>Start Daily Challenge</ThemedText>
          <FontAwesome name="play" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </ThemedView>
    );
  };

  const renderChallengeCard = (challenge: Challenge) => (
    <ThemedView key={challenge.id} style={styles.challengeCard}>
      <View style={styles.challengeHeader}>
        <View style={[styles.challengeIconContainer, { backgroundColor: challenge.color }]}>
          <FontAwesome name={challenge.icon} size={24} color="#FFFFFF" />
        </View>
        <View style={styles.challengeTitleContainer}>
          <ThemedText style={styles.challengeTitle}>{challenge.title}</ThemedText>
          {challenge.completed && (
            <View style={styles.completedBadge}>
              <FontAwesome name="check" size={12} color="#FFFFFF" />
              <ThemedText style={styles.completedText}>Completed</ThemedText>
            </View>
          )}
        </View>
        <View style={styles.pointsContainer}>
          <ThemedText style={styles.pointsText}>{challenge.points}</ThemedText>
          <ThemedText style={styles.pointsLabel}>PTS</ThemedText>
        </View>
      </View>
      
      <View style={styles.challengeContent}>
        <ThemedText style={styles.challengeDescription}>
          {challenge.description}
        </ThemedText>
        
        <View style={styles.challengeStats}>
          <View style={styles.challengeStat}>
            <FontAwesome name="users" size={14} color="#226cae" />
            <ThemedText style={styles.challengeStatText}>{challenge.participants} completed</ThemedText>
          </View>
          <View style={styles.challengeStat}>
            <FontAwesome name="clock-o" size={14} color="#dc2929" />
            <ThemedText style={styles.challengeStatText}>{challenge.timeRequired}</ThemedText>
          </View>
        </View>
      </View>
      
      <TouchableOpacity 
        style={[
          styles.startChallengeButton,
          challenge.completed && styles.completedChallengeButton
        ]} 
        onPress={() => navigateToGame(challenge.game)}
        disabled={challenge.completed}
      >
        <ThemedText style={styles.startChallengeText}>
          {challenge.completed ? 'Completed' : 'Start Challenge'}
        </ThemedText>
        {!challenge.completed && <FontAwesome name="play" size={14} color="#FFFFFF" />}
      </TouchableOpacity>
    </ThemedView>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(220, 41, 41, 0.03)', 'rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0.98)', 'rgba(34, 108, 174, 0.03)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        />
        <GameHeader title="Daily Challenges" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#226cae" />
          <ThemedText style={styles.loadingText}>Loading daily challenge...</ThemedText>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(220, 41, 41, 0.03)', 'rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0.98)', 'rgba(34, 108, 174, 0.03)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        />
        <GameHeader title="Daily Challenges" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-triangle" size={48} color="#dc2929" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDailyChallenge}>
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(220, 41, 41, 0.03)', 'rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0.98)', 'rgba(34, 108, 174, 0.03)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />
      
      <GameHeader title="Daily Challenges" showBackButton onBackPress={() => navigation.goBack()} />
      
      {/* Filter Section */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setFilterOpen(!filterOpen)}
        >
          <FontAwesome name="filter" size={16} color="#226cae" />
          <ThemedText style={styles.filterButtonText}>
            {filterType === 'all' ? 'Filter' : 
             filterType === 'exams' ? `Exam: ${selectedExam}` : 
             `Profession: ${selectedProfession}`}
          </ThemedText>
          <FontAwesome name={filterOpen ? "chevron-up" : "chevron-down"} size={14} color="#666666" />
        </TouchableOpacity>
        
        {filterOpen && (
          <ThemedView style={styles.filterDropdown}>
            <View style={styles.filterTabs}>
              <TouchableOpacity 
                style={[styles.filterTab, filterType === 'all' && styles.activeFilterTab]}
                onPress={() => setFilterType('all')}
              >
                <ThemedText style={[styles.filterTabText, filterType === 'all' && styles.activeFilterTabText]}>
                  All
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterTab, filterType === 'exams' && styles.activeFilterTab]}
                onPress={() => setFilterType('exams')}
              >
                <ThemedText style={[styles.filterTabText, filterType === 'exams' && styles.activeFilterTabText]}>
                  Exams
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterTab, filterType === 'profession' && styles.activeFilterTab]}
                onPress={() => setFilterType('profession')}
              >
                <ThemedText style={[styles.filterTabText, filterType === 'profession' && styles.activeFilterTabText]}>
                  Profession
                </ThemedText>
              </TouchableOpacity>
            </View>
            
            {filterType === 'exams' && (
              <View style={styles.filterOptions}>
                {['all', 'nda', 'ssc', 'banking', 'upsc', 'cat'].map((exam) => (
                  <TouchableOpacity 
                    key={exam}
                    style={[styles.filterOption, selectedExam === exam && styles.selectedFilterOption]}
                    onPress={() => {
                      setSelectedExam(exam as ExamType);
                      setFilterOpen(false);
                    }}
                  >
                    <ThemedText style={[styles.filterOptionText, selectedExam === exam && styles.selectedFilterOptionText]}>
                      {exam.toUpperCase()}
                    </ThemedText>
                    {selectedExam === exam && (
                      <FontAwesome name="check" size={14} color="#226cae" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            {filterType === 'profession' && (
              <View style={styles.filterOptions}>
                {['all', 'engineering', 'medical', 'teaching', 'business', 'student'].map((profession) => (
                  <TouchableOpacity 
                    key={profession}
                    style={[styles.filterOption, selectedProfession === profession && styles.selectedFilterOption]}
                    onPress={() => {
                      setSelectedProfession(profession as ProfessionType);
                      setFilterOpen(false);
                    }}
                  >
                    <ThemedText style={[styles.filterOptionText, selectedProfession === profession && styles.selectedFilterOptionText]}>
                      {profession.charAt(0).toUpperCase() + profession.slice(1)}
                    </ThemedText>
                    {selectedProfession === profession && (
                      <FontAwesome name="check" size={14} color="#226cae" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ThemedView>
        )}
      </View>
      
                {/* Dynamic stats will be loaded from backend */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>
                {loading ? '...' : '0'}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Total Points</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>
                {loading ? '...' : '0/0'}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Completed Today</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>
                {loading ? '...' : '0'}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Day Streak</ThemedText>
            </View>
          </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'daily' && styles.activeTab]} 
          onPress={() => setActiveTab('daily')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'daily' && styles.activeTabText]}>
            Daily
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'weekly' && styles.activeTab]} 
          onPress={() => setActiveTab('weekly')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'weekly' && styles.activeTabText]}>
            Weekly
          </ThemedText>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'daily' ? (
          <>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Today's Challenge</ThemedText>
              <View style={styles.timerContainer}>
                <FontAwesome name="refresh" size={14} color="#666666" />
                <ThemedText style={styles.timerText}>Resets in 8:45:12</ThemedText>
              </View>
            </View>
            
            {renderDailyChallengeCard()}
            
            {/* Dynamic challenges will be loaded from backend */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#226cae" />
                <ThemedText style={styles.loadingText}>Loading challenges...</ThemedText>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <FontAwesome name="exclamation-triangle" size={48} color="#dc2929" />
                <ThemedText style={styles.errorText}>{error}</ThemedText>
              </View>
            ) : (
              <View style={styles.noChallengesContainer}>
                <FontAwesome name="trophy" size={48} color="#ccc" />
                <ThemedText style={styles.noChallengesText}>No additional challenges available</ThemedText>
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Weekly Challenges</ThemedText>
              <View style={styles.timerContainer}>
                <FontAwesome name="refresh" size={14} color="#666666" />
                <ThemedText style={styles.timerText}>Resets in 3 days</ThemedText>
              </View>
            </View>
            
            {/* Dynamic weekly progress will be loaded from backend */}
            <ThemedView style={styles.weeklyProgressCard}>
              <View style={styles.weeklyProgressHeader}>
                <ThemedText style={styles.weeklyProgressTitle}>Weekly Progress</ThemedText>
                <ThemedText style={styles.weeklyProgressSubtitle}>Complete daily challenges to earn rewards</ThemedText>
              </View>
              
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#226cae" />
                  <ThemedText style={styles.loadingText}>Loading progress...</ThemedText>
                </View>
              ) : (
                <>
                  <View style={styles.progressTrack}>
                    <View style={styles.progressFill} />
                    
                    <View style={[styles.progressMarker, styles.progressMarkerCompleted, { left: '14%' }]}>
                      <View style={styles.markerIcon}>
                        <FontAwesome name="star" size={12} color="#FFFFFF" />
                      </View>
                      <ThemedText style={styles.markerLabel}>100 pts</ThemedText>
                    </View>
                    
                    <View style={[styles.progressMarker, { left: '42%' }]}>
                      <View style={[styles.markerIcon, styles.markerIconIncomplete]}>
                        <FontAwesome name="gift" size={12} color="#666666" />
                      </View>
                      <ThemedText style={styles.markerLabel}>300 pts</ThemedText>
                    </View>
                    
                    <View style={[styles.progressMarker, { left: '71%' }]}>
                      <View style={[styles.markerIcon, styles.markerIconIncomplete]}>
                        <FontAwesome name="trophy" size={12} color="#666666" />
                      </View>
                      <ThemedText style={styles.markerLabel}>500 pts</ThemedText>
                    </View>
                    
                    <View style={[styles.progressMarker, { right: '0%' }]}>
                      <View style={[styles.markerIcon, styles.markerIconIncomplete]}>
                        <FontAwesome name="diamond" size={12} color="#666666" />
                      </View>
                      <ThemedText style={styles.markerLabel}>700 pts</ThemedText>
                    </View>
                  </View>
                  
                  <View style={styles.progressStats}>
                    <ThemedText style={styles.progressStatsText}>
                      <ThemedText style={styles.progressStatsHighlight}>0</ThemedText> / 700 points earned this week
                    </ThemedText>
                  </View>
                </>
              )}
            </ThemedView>
          </>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#226cae',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  dailyChallengeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(34, 108, 174, 0.1)',
  },
  dailyChallengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  dailyChallengeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  dailyChallengeTitleContainer: {
    flex: 1,
  },
  dailyChallengeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  dailyChallengeSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  dailyChallengePoints: {
    alignItems: 'center',
  },
  dailyChallengePointsText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#226cae',
  },
  dailyChallengePointsLabel: {
    fontSize: 12,
    color: '#666666',
  },
  dailyChallengeContent: {
    padding: 20,
  },
  dailyChallengeQuestion: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 20,
    lineHeight: 22,
    fontWeight: '500',
  },
  dailyChallengeOptions: {
    marginBottom: 20,
  },
  dailyChallengeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  dailyChallengeMore: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dailyChallengeMoreText: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
  },
  dailyChallengeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dailyChallengeStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dailyChallengeStatText: {
    fontSize: 13,
    color: '#666666',
    marginLeft: 6,
  },
  startDailyChallengeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#226cae',
    padding: 16,
    gap: 8,
  },
  startDailyChallengeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#226cae',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  activeTabText: {
    color: '#226cae',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
  },
  challengeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 16,
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  challengeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  challengeTitleContainer: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  completedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  pointsContainer: {
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#226cae',
  },
  pointsLabel: {
    fontSize: 12,
    color: '#666666',
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
  completedChallengeButton: {
    backgroundColor: '#4CAF50',
  },
  startChallengeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  weeklyProgressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  weeklyProgressHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  weeklyProgressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  weeklyProgressSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    marginBottom: 40,
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '55%', // Percentage of completion
    backgroundColor: '#226cae',
    borderRadius: 4,
  },
  progressMarker: {
    position: 'absolute',
    alignItems: 'center',
    top: -6,
    transform: [{ translateX: -12 }],
  },
  progressMarkerCompleted: {
    zIndex: 2,
  },
  markerIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#226cae',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  markerIconIncomplete: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  markerLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  progressStats: {
    alignItems: 'center',
  },
  progressStatsText: {
    fontSize: 15,
    color: '#666666',
  },
  progressStatsHighlight: {
    color: '#226cae',
    fontWeight: '700',
  },
  filterContainer: {
    marginHorizontal: 20,
    marginTop: 10,
    zIndex: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterButtonText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  filterDropdown: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    zIndex: 10,
  },
  filterTabs: {
    flexDirection: 'row',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeFilterTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#226cae',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  activeFilterTabText: {
    color: '#226cae',
  },
  filterOptions: {
    maxHeight: 200,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  selectedFilterOption: {
    backgroundColor: 'rgba(34, 108, 174, 0.05)',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#333333',
  },
  selectedFilterOptionText: {
    color: '#226cae',
    fontWeight: '600',
  },
  noChallengesContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  noChallengesText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ccc',
  },
});