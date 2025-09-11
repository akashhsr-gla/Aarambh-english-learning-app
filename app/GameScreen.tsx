import { FontAwesome } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import GameHeader from '../components/GameHeader';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { gamesAPI } from './services/api';

const { width } = Dimensions.get('window');

// Game types
const GAME_TYPES = {
  GRAMMAR: 'grammar',
  PRONUNCIATION: 'pronunciation',
  IDENTIFICATION: 'identification',
  STORYTELLING: 'storytelling'
};

// Game type display names
const GAME_TYPE_NAMES = {
  [GAME_TYPES.GRAMMAR]: 'Grammar Quiz',
  [GAME_TYPES.PRONUNCIATION]: 'Pronunciation Practice',
  [GAME_TYPES.IDENTIFICATION]: 'Object Identification',
  [GAME_TYPES.STORYTELLING]: 'Story Creation'
};

// Game type icons
const GAME_TYPE_ICONS = {
  [GAME_TYPES.GRAMMAR]: 'book' as const,
  [GAME_TYPES.PRONUNCIATION]: 'microphone' as const,
  [GAME_TYPES.IDENTIFICATION]: 'eye' as const,
  [GAME_TYPES.STORYTELLING]: 'pencil' as const
};

// Types
interface GameOption {
  text: string;
  isCorrect: boolean;
  explanation: string;
}

interface GameQuestion {
  questionNumber: number;
  questionText: string;
  questionType: string;
  points: number;
  options: GameOption[];
  correctAnswer: string;
  explanation: string;
}

interface Game {
  _id: string;
  title: string;
  description: string;
  gameType: string;
  difficulty: string;
  level: number;
  timeLimit: number;
  maxScore: number;
  totalQuestions: number;
  questions: GameQuestion[];
}

type RootStackParamList = {
  GameScreen: { gameType: string };
};

export default function GameScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'GameScreen'>>();
  const gameType = route.params?.gameType || GAME_TYPES.GRAMMAR;
  
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));

  // Fetch games for the selected type
  useEffect(() => {
    fetchGames();
  }, [gameType]);

  // Debug log for games state changes
  useEffect(() => {
    console.log('🎮 Games state changed:', {
      games,
      gamesType: typeof games,
      isArray: Array.isArray(games),
      length: Array.isArray(games) ? games.length : 'N/A'
    });
  }, [games]);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const response = await gamesAPI.getGamesByType(gameType);
      console.log('🔍 Games API Response:', response); // Debug log
      
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
        // If response.data is a single game object
        else if (response.data._id) {
          gamesData = [response.data];
        }
        // Fallback to empty array
        else {
          gamesData = [];
        }
        
        console.log('🎮 Processed Games Data:', gamesData); // Debug log
        setGames(gamesData);
        setError(null);
      } else {
        console.log('❌ API Response Error:', response); // Debug log
        setError(response.message || 'Failed to fetch games');
        setGames([]); // Set empty array to prevent undefined
      }
    } catch (err) {
      console.error('🚨 Games API Error:', err); // Debug log
      setError('Network error. Please try again.');
      setGames([]); // Set empty array to prevent undefined
    } finally {
      setLoading(false);
    }
  };

  // Start a specific game
  const startGame = async (game: Game) => {
    try {
      const response = await gamesAPI.startGame(game._id);
      if (response.success) {
        setSelectedGame(game);
        setCurrentQuestionIndex(0);
        setScore(0);
        setTimeLeft(game.timeLimit || 300);
        setGameStarted(true);
        setGameOver(false);
      setShowResult(false);
        setSelectedAnswer(null);
      
      // Reset animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start();
      } else {
        Alert.alert('Error', response.message || 'Failed to start game');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to start game. Please try again.');
      console.error('Error starting game:', err);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (!gameStarted || gameOver || showResult) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameOver, showResult]);

  const handleTimeout = () => {
    setShowResult(true);
    // Shake animation for timeout
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 100, useNativeDriver: true })
    ]).start();
  };

  const handleAnswerSelect = (answer: string) => {
    if (showResult || !selectedGame) return;
    
    setSelectedAnswer(answer);
    setShowResult(true);
    
    const currentQuestion = selectedGame.questions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      setScore(score + currentQuestion.points);
      // Success animation
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // Error animation
      Animated.sequence([
        Animated.timing(slideAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 100, useNativeDriver: true })
      ]).start();
    }
  };

  const moveToNextQuestion = () => {
    if (!selectedGame) return;
    
    if (currentQuestionIndex < selectedGame.questions.length - 1) {
      // Slide out animation
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setShowResult(false);
        setSelectedAnswer(null);
      });
    } else {
      finishGame();
    }
  };

  const finishGame = async () => {
    if (!selectedGame) return;
    
      setGameOver(true);
    
    try {
      // Submit game results to backend
      const answers = selectedGame.questions.map((q: GameQuestion, index: number) => ({
        questionNumber: q.questionNumber,
        selectedAnswer: index === currentQuestionIndex ? selectedAnswer : null,
        isCorrect: index === currentQuestionIndex ? selectedAnswer === q.correctAnswer : false
      }));
      
      await gamesAPI.submitGame(selectedGame._id, { answers });
    } catch (err) {
      console.error('Error submitting game:', err);
    }
    
      Alert.alert(
        "Game Completed!",
      `Your final score: ${score} out of ${selectedGame.maxScore}`,
        [
        { text: "Play Again", onPress: () => startGame(selectedGame) },
        { text: "Back to Games", onPress: () => setGameStarted(false) }
        ]
      );
  };

  const resetGame = () => {
    setGameStarted(false);
    setSelectedGame(null);
    setCurrentQuestionIndex(0);
    setScore(0);
    setTimeLeft(0);
    setGameOver(false);
    setShowResult(false);
    setSelectedAnswer(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(220, 41, 41, 0.03)', 'rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0.98)', 'rgba(34, 108, 174, 0.03)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        />
        <GameHeader 
          title={GAME_TYPE_NAMES[gameType as keyof typeof GAME_TYPE_NAMES]} 
          showBackButton 
          onBackPress={() => navigation.goBack()} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#226cae" />
          <ThemedText style={styles.loadingText}>Loading games...</ThemedText>
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
        <GameHeader 
          title={GAME_TYPE_NAMES[gameType as keyof typeof GAME_TYPE_NAMES]} 
          showBackButton 
          onBackPress={() => navigation.goBack()} 
        />
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-triangle" size={48} color="#dc2929" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={fetchGames}>
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (gameStarted && selectedGame) {
    const currentQuestion = selectedGame.questions[currentQuestionIndex];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(220, 41, 41, 0.03)', 'rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0.98)', 'rgba(34, 108, 174, 0.03)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />
      
        <GameHeader 
          title={selectedGame.title} 
          showBackButton 
          onBackPress={resetGame} 
        />
      
      <View style={styles.scoreContainer}>
        <View style={styles.scoreItem}>
          <FontAwesome name="star" size={18} color="#FFD700" />
          <ThemedText style={styles.scoreText}>Score: {score}</ThemedText>
        </View>
        <View style={styles.scoreItem}>
            <FontAwesome name="clock-o" size={18} color={timeLeft < 60 ? "#dc2929" : "#226cae"} />
            <ThemedText style={styles.scoreText}>
              {formatTime(timeLeft)}
          </ThemedText>
        </View>
        <View style={styles.scoreItem}>
          <FontAwesome name="tasks" size={18} color="#226cae" />
          <ThemedText style={styles.scoreText}>
              {currentQuestionIndex + 1}/{selectedGame.questions.length}
          </ThemedText>
        </View>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
          <Animated.View 
            style={[
              styles.questionContainer,
              { 
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }]
              }
            ]}
          >
            <ThemedView style={styles.questionCard}>
              <ThemedText style={styles.questionText}>{currentQuestion.questionText}</ThemedText>
              
              <View style={styles.optionsContainer}>
                {currentQuestion.options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionButton,
                      selectedAnswer === option.text && styles.selectedOption,
                      showResult && option.isCorrect && styles.correctOption,
                      showResult && selectedAnswer === option.text && !option.isCorrect && styles.wrongOption
                    ]}
                    onPress={() => handleAnswerSelect(option.text)}
                    disabled={showResult}
                  >
                    <ThemedText 
                      style={[
                        styles.optionText,
                        showResult && option.isCorrect && styles.correctOptionText,
                        showResult && selectedAnswer === option.text && !option.isCorrect && styles.wrongOptionText
                      ]}
                    >
                      {option.text}
                    </ThemedText>
                    
                    {showResult && option.isCorrect && (
                      <FontAwesome name="check-circle" size={20} color="#4CAF50" style={styles.resultIcon} />
                    )}
                    
                    {showResult && selectedAnswer === option.text && !option.isCorrect && (
                      <FontAwesome name="times-circle" size={20} color="#dc2929" style={styles.resultIcon} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              
              {showResult && (
                <View style={styles.feedbackContainer}>
                  <ThemedText style={[
                    styles.feedbackText,
                    selectedAnswer === currentQuestion.correctAnswer ? styles.correctFeedback : styles.wrongFeedback
                  ]}>
                    {selectedAnswer === currentQuestion.correctAnswer 
                      ? "Correct! Great job!" 
                      : `Incorrect. The correct answer is: "${currentQuestion.correctAnswer}"`}
                  </ThemedText>
                  
                  {currentQuestion.explanation && (
                    <ThemedText style={styles.explanationText}>
                      {currentQuestion.explanation}
                    </ThemedText>
                  )}
                  
                  <TouchableOpacity 
                    style={styles.nextButton}
                    onPress={moveToNextQuestion}
                  >
                    <ThemedText style={styles.nextButtonText}>
                      {currentQuestionIndex < selectedGame.questions.length - 1 ? "Next Question" : "Finish Game"}
                    </ThemedText>
                    <FontAwesome name="arrow-right" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}
            </ThemedView>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // Game selection screen
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(220, 41, 41, 0.03)', 'rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0.98)', 'rgba(34, 108, 174, 0.03)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />
      
      <GameHeader 
        title={GAME_TYPE_NAMES[gameType as keyof typeof GAME_TYPE_NAMES]} 
        showBackButton 
        onBackPress={() => navigation.goBack()} 
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.headerContainer}>
          <FontAwesome 
            name={GAME_TYPE_ICONS[gameType as keyof typeof GAME_TYPE_ICONS]} 
            size={48} 
            color="#226cae" 
            style={styles.gameTypeIcon}
          />
          <ThemedText style={styles.gameTypeTitle}>{GAME_TYPE_NAMES[gameType as keyof typeof GAME_TYPE_NAMES]}</ThemedText>
          <ThemedText style={styles.gameTypeDescription}>
            Choose a game to start practicing your {gameType} skills
          </ThemedText>
        </View>
        
        <View style={styles.gamesContainer}>
          {Array.isArray(games) && games.map((game) => (
            <TouchableOpacity
              key={game._id}
              style={styles.gameCard}
              onPress={() => startGame(game)}
            >
              <View style={styles.gameCardHeader}>
                <View style={styles.gameInfo}>
                  <ThemedText style={styles.gameTitle}>{game.title}</ThemedText>
                  <ThemedText style={styles.gameDescription}>{game.description}</ThemedText>
                </View>
                <View style={styles.gameMeta}>
                  <View style={styles.metaItem}>
                    <FontAwesome name="clock-o" size={14} color="#666" />
                    <ThemedText style={styles.metaText}>{Math.floor((game.timeLimit || 300) / 60)}m</ThemedText>
                  </View>
                  <View style={styles.metaItem}>
                    <FontAwesome name="question-circle" size={14} color="#666" />
                    <ThemedText style={styles.metaText}>{game.totalQuestions}</ThemedText>
                  </View>
                  <View style={styles.metaItem}>
                    <FontAwesome name="star" size={14} color="#666" />
                    <ThemedText style={styles.metaText}>{game.maxScore}</ThemedText>
                  </View>
                </View>
              </View>
              
              <View style={styles.gameCardFooter}>
                <View style={styles.difficultyContainer}>
                  <ThemedText style={[
                    styles.difficultyText,
                    { color: game.difficulty === 'beginner' ? '#4CAF50' : game.difficulty === 'intermediate' ? '#FF9800' : '#dc2929' }
                  ]}>
                    {game.difficulty.charAt(0).toUpperCase() + game.difficulty.slice(1)}
                  </ThemedText>
                </View>
                
                <TouchableOpacity style={styles.playButton}>
                  <FontAwesome name="play" size={16} color="#FFFFFF" />
                  <ThemedText style={styles.playButtonText}>Play</ThemedText>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        {(!Array.isArray(games) || games.length === 0) && (
          <View style={styles.noGamesContainer}>
            <FontAwesome name="gamepad" size={48} color="#ccc" />
            <ThemedText style={styles.noGamesText}>
              {!Array.isArray(games) ? 'Loading games...' : 'No games available for this type'}
            </ThemedText>
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 40,
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
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  gameTypeIcon: {
    marginBottom: 16,
  },
  gameTypeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  gameTypeDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  gamesContainer: {
    gap: 16,
  },
  gameCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(34, 108, 174, 0.2)',
  },
  gameCardHeader: {
    marginBottom: 16,
  },
  gameInfo: {
    marginBottom: 12,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  gameDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  gameMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  gameCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#226cae',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    gap: 8,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  noGamesContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  noGamesText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ccc',
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  urgentTime: {
    color: '#dc2929',
  },
  questionContainer: {
    width: '100%',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(34, 108, 174, 0.2)',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333333',
    textAlign: 'center',
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  selectedOption: {
    backgroundColor: 'rgba(34, 108, 174, 0.1)',
    borderColor: '#226cae',
  },
  correctOption: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: '#4CAF50',
  },
  wrongOption: {
    backgroundColor: 'rgba(220, 41, 41, 0.1)',
    borderColor: '#dc2929',
  },
  optionText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  correctOptionText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  wrongOptionText: {
    color: '#dc2929',
    fontWeight: '600',
  },
  resultIcon: {
    marginLeft: 10,
  },
  feedbackContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  correctFeedback: {
    color: '#4CAF50',
  },
  wrongFeedback: {
    color: '#dc2929',
  },
  explanationText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#226cae',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    marginRight: 8,
  },
}); 