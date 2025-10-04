import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Keyboard, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import GameHeader from '../components/GameHeader';
import { ThemedText } from '../components/ThemedText';
import FeatureAccessWrapper from './components/FeatureAccessWrapper';
import ImageViewer from './components/ImageViewer';
import { useFeatureAccess } from './hooks/useFeatureAccess';
import { gamesAPI, sessionsAPI } from './services/api';

const { width } = Dimensions.get('window');

// Define the type for identification items
type IdentificationItem = {
  id: number;
  name: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  category: string;
  hint: string;
  difficulty: string;
  imageUrl?: string;
  mediaType?: string;
};

// Define backend game question interface
interface GameQuestion {
  _id: string;
  question: string;
  options: Array<{
    text: string;
    isCorrect: boolean;
  }>;
  hint?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export default function IdentificationGame() {
  const navigation = useNavigation();
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [gameOver, setGameOver] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [streak, setStreak] = useState(0);
  const [totalItems, setTotalItems] = useState(10);
  const [gameItems, setGameItems] = useState<IdentificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Feature access control
  const { canAccess: canPlayGames, featureInfo: gameFeatureInfo } = useFeatureAccess('games');
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const inputRef = useRef<TextInput>(null);
  
  // Function to convert backend game questions to identification items
  const convertGameQuestionToItem = (question: any, index: number): IdentificationItem => {
    // Find the correct answer
    const correctOption = question.options.find((option: any) => option.isCorrect);
    const correctAnswer = correctOption ? correctOption.text.toLowerCase() : '';
    
    return {
      id: index + 1,
      name: correctAnswer,
      icon: 'question' as React.ComponentProps<typeof FontAwesome>['name'],
      category: 'General',
      hint: question.questionText || question.hint || 'Look carefully at the image',
      difficulty: question.difficulty ? question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1) : 'Easy',
      imageUrl: question.mediaUrl,
      mediaType: question.mediaType
    };
  };
  
  // Save identification session
  const saveIdentificationSession = async () => {
    if (gameItems.length === 0) return;
    
    try {
      const response = await sessionsAPI.createOrUpdateGameSession({
        gameId: 'identification-game-id',
        gameType: 'identification',
        difficulty: currentItem.difficulty.toLowerCase(),
        currentQuestionIndex: currentItemIndex,
        timeLeft,
        answers: [],
        score,
        totalQuestions: gameItems.length
      });
      
      // Store the session ID if we get one
      if (response.success && response.data && response.data.sessionId) {
        setActiveSessionId(response.data.sessionId);
      }
    } catch (error) {
      console.error('Error saving identification session:', error);
    }
  };

  // Save session when game state changes
  useEffect(() => {
    if (gameItems.length > 0 && !gameOver) {
      saveIdentificationSession();
    }
  }, [currentItemIndex, score]);

  // Initialize game with API data
  useEffect(() => {
    const fetchGameData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await gamesAPI.getGamesByType('identification');
        
        if (response.success && response.data) {
          let games: any[] = [];
          
          // Handle different response structures
          if (Array.isArray(response.data.games)) {
            games = response.data.games;
          } else if (Array.isArray(response.data)) {
            games = response.data;
          }
          
          if (games.length > 0) {
            // Get questions from the first game
            const game = games[0];
            if (game.questions && Array.isArray(game.questions)) {
              // Convert backend questions to identification items
              const identificationItems = game.questions.map((question: any, index: number) => 
                convertGameQuestionToItem(question, index)
              );
              
              // Shuffle and take random items
              const shuffled = [...identificationItems].sort(() => 0.5 - Math.random());
              setGameItems(shuffled.slice(0, Math.min(totalItems, shuffled.length)));
            } else {
              setError('No questions available in this game');
            }
          } else {
            setError('No identification games available');
          }
        } else {
          setError('Failed to load games');
        }
      } catch (err) {
        console.error('Error fetching identification games:', err);
        setError('Network error. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGameData();
  }, []);

  const currentItem = gameItems[currentItemIndex] || {
    id: 1,
    name: '',
    icon: 'question' as React.ComponentProps<typeof FontAwesome>['name'],
    category: 'General',
    hint: 'Loading...',
    difficulty: 'Easy'
  };

  // Timer countdown
  useEffect(() => {
    if (showResult || gameOver || gameItems.length === 0 || loading) return;
    
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
  }, [showResult, gameOver, currentItemIndex, gameItems.length, loading]);

  const handleTimeout = () => {
    setShowResult(true);
    setIsCorrect(false);
    setStreak(0);
    
    setTimeout(() => {
      nextQuestion();
    }, 2000);
  };

  const nextQuestion = () => {
    if (currentItemIndex < gameItems.length - 1) {
      setCurrentItemIndex(prev => prev + 1);
      setAnswer("");
      setShowResult(false);
      setTimeLeft(20);
      setShowHint(false);
      setHintUsed(false);
        inputRef.current?.focus();
    } else {
      setGameOver(true);
    }
  };

  const handleAnswer = () => {
    Keyboard.dismiss();
    
    if (!answer.trim()) {
      Alert.alert('Please enter an answer');
      return;
    }

    const userAnswer = answer.toLowerCase().trim();
    const correctAnswer = currentItem.name.toLowerCase();
    const correct = userAnswer === correctAnswer;
    
    setIsCorrect(correct);
    setShowResult(true);
    
    if (correct) {
      const points = hintUsed ? 5 : 10; // Less points if hint was used
      setScore(prev => prev + points);
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      nextQuestion();
    }, 2000);
  };

  const resetGame = async () => {
    // Reset states first
    setCurrentItemIndex(0);
    setScore(0);
    setStreak(0);
    setTimeLeft(20);
    setGameOver(false);
    setShowResult(false);
    setAnswer("");
    setShowHint(false);
    setHintUsed(false);
    
    // Fetch fresh data from API
    try {
      setLoading(true);
      setError(null);
      
      const response = await gamesAPI.getGamesByType('identification');
      
      if (response.success && response.data) {
        let games: any[] = [];
        
        // Handle different response structures
        if (Array.isArray(response.data.games)) {
          games = response.data.games;
        } else if (Array.isArray(response.data)) {
          games = response.data;
        }
        
        if (games.length > 0) {
          // Get questions from the first game
          const game = games[0];
          if (game.questions && Array.isArray(game.questions)) {
            // Convert backend questions to identification items
            const identificationItems = game.questions.map((question: any, index: number) => 
              convertGameQuestionToItem(question, index)
            );
            
            // Shuffle and take random items
            const shuffled = [...identificationItems].sort(() => 0.5 - Math.random());
            setGameItems(shuffled.slice(0, Math.min(totalItems, shuffled.length)));
          }
        }
      }
    } catch (err) {
      console.error('Error resetting game:', err);
      setError('Failed to reset game');
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = async () => {
    try {
      // End active session if exists
      if (activeSessionId) {
        await sessionsAPI.endGameSession(activeSessionId);
        console.log('🎯 Identification session ended:', activeSessionId);
      }
    } catch (error) {
      console.error('Error ending identification session:', error);
    }
    
    navigation.goBack();
  };

  const toggleHint = () => {
    if (!showHint && !showResult) {
      setShowHint(true);
      setHintUsed(true);
    }
  };


  // Loading state
  if (loading) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(220, 41, 41, 0.03)', 'rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0.98)', 'rgba(34, 108, 174, 0.03)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />
      <GameHeader title="Identification Game" showBackButton onBackPress={handleBackPress} />
        <View style={styles.loadingContainer}>
          <FontAwesome name="spinner" size={50} color="#dc2929" />
          <ThemedText style={styles.loadingText}>Loading identification games...</ThemedText>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(220, 41, 41, 0.03)', 'rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0.98)', 'rgba(34, 108, 174, 0.03)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        />
        <GameHeader title="Identification Game" showBackButton onBackPress={handleBackPress} />
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-triangle" size={50} color="#dc2929" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={resetGame}>
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
              </TouchableOpacity>
            </View>
      </View>
    );
  }

  // Game over screen
  if (gameOver) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(220, 41, 41, 0.03)', 'rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0.98)', 'rgba(34, 108, 174, 0.03)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        />
        
        <GameHeader title="Game Complete!" showBackButton onBackPress={handleBackPress} />
        
        <View style={styles.gameOverContainer}>
          <FontAwesome name="trophy" size={80} color="#FFA500" />
          <ThemedText style={styles.gameOverTitle}>Great Job!</ThemedText>
          <ThemedText style={styles.finalScore}>Final Score: {score}</ThemedText>
          <ThemedText style={styles.gameOverMessage}>
            You completed {gameItems.length} identification challenges!
                    </ThemedText>
          
          <View style={styles.gameOverButtons}>
            <TouchableOpacity style={styles.playAgainButton} onPress={resetGame}>
              <FontAwesome name="refresh" size={20} color="#FFFFFF" />
              <ThemedText style={styles.playAgainText}>Play Again</ThemedText>
                  </TouchableOpacity>
            
            <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
              <FontAwesome name="home" size={20} color="#666666" />
              <ThemedText style={styles.backText}>Back to Games</ThemedText>
            </TouchableOpacity>
              </View>
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
      
      <GameHeader title="Identification Game" showBackButton onBackPress={handleBackPress} />
      
      <FeatureAccessWrapper
        featureKey="games"
        fallback={null}
        style={styles.container}
        navigation={navigation}
      >
      {/* Score and Progress */}
      <View style={styles.scoreContainer}>
        <View style={styles.scoreItem}>
          <FontAwesome name="star" size={16} color="#FFA500" />
          <ThemedText style={styles.scoreText}>{score}</ThemedText>
        </View>
        
        <View style={styles.scoreItem}>
          <FontAwesome name="fire" size={16} color="#FF4500" />
          <ThemedText style={styles.scoreText}>{streak}</ThemedText>
        </View>
        
        <View style={styles.scoreItem}>
          <FontAwesome name="clock-o" size={16} color="#2196F3" />
          <ThemedText style={[styles.scoreText, { color: timeLeft <= 5 ? '#F44336' : '#333333' }]}>
            {timeLeft}s
          </ThemedText>
        </View>
        
        <View style={styles.scoreItem}>
          <FontAwesome name="list-ol" size={16} color="#666666" />
          <ThemedText style={styles.scoreText}>{currentItemIndex + 1}/{gameItems.length}</ThemedText>
        </View>
      </View>
      
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentItemIndex + 1) / gameItems.length) * 100}%` }
            ]} 
          />
        </View>
      </View>

      {/* Game Content */}
        <Animated.View 
          style={[
            styles.gameContent,
            {
              opacity: fadeAnim,
              transform: [
              { scale: scaleAnim },
              { translateY: slideAnim }
              ]
            }
          ]}
        >
        {/* Category and Difficulty */}
        <View style={styles.infoContainer}>
          <View style={styles.categoryBadge}>
            <ThemedText style={styles.categoryText}>{currentItem.category}</ThemedText>
          </View>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(currentItem.difficulty) }]}>
            <ThemedText style={styles.difficultyText}>{currentItem.difficulty}</ThemedText>
          </View>
          </View>
          
        {/* Media/Icon Display */}
          <View style={styles.mediaContainer}>
          {currentItem.imageUrl ? (
            <ImageViewer
              imageUrl={currentItem.imageUrl}
              title={`Question ${currentItemIndex + 1}`}
              style={styles.imageViewer}
              showControls={false}
              resizeMode="contain"
              onError={(error: string) => {
                console.error('Image load error:', error);
              }}
            />
          ) : (
            <View style={styles.fallbackContainer}>
              <FontAwesome name="question-circle" size={120} color="#dc2929" />
            </View>
          )}
          </View>
          
        {/* Question */}
        <ThemedText style={styles.questionText}>What is this?</ThemedText>

        {/* Hint */}
        {showHint && (
          <Animated.View style={styles.hintContainer}>
            <FontAwesome name="lightbulb-o" size={20} color="#FFA500" />
            <ThemedText style={styles.hintText}>{currentItem.hint}</ThemedText>
          </Animated.View>
        )}

        {/* Answer Input */}
          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
            style={styles.answerInput}
              value={answer}
              onChangeText={setAnswer}
            placeholder="Type your answer..."
            placeholderTextColor="#999999"
              autoCapitalize="none"
              autoCorrect={false}
            autoFocus={true}
            onSubmitEditing={handleAnswer}
            editable={!showResult}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!showHint && !showResult && (
            <TouchableOpacity style={styles.hintButton} onPress={toggleHint}>
              <FontAwesome name="lightbulb-o" size={20} color="#FFA500" />
              <ThemedText style={styles.hintButtonText}>Hint</ThemedText>
            </TouchableOpacity>
          )}
          
            <TouchableOpacity 
              style={[styles.submitButton, showResult && styles.disabledButton]} 
            onPress={handleAnswer}
              disabled={showResult}
            >
              <FontAwesome name="check" size={20} color="#FFFFFF" />
            <ThemedText style={styles.submitButtonText}>Submit</ThemedText>
            </TouchableOpacity>
          </View>
          
        {/* Result Display */}
          {showResult && (
          <Animated.View style={styles.resultContainer}>
              <FontAwesome 
                name={isCorrect ? "check-circle" : "times-circle"} 
              size={40} 
                color={isCorrect ? "#4CAF50" : "#F44336"} 
              />
            <ThemedText style={[styles.resultText, { color: isCorrect ? "#4CAF50" : "#F44336" }]}>
              {isCorrect ? "Correct!" : "Incorrect!"}
              </ThemedText>
            {!isCorrect && (
              <ThemedText style={styles.correctAnswerText}>
                The correct answer was: {currentItem.name}
                </ThemedText>
          )}
        </Animated.View>
      )}
      </Animated.View>

      </FeatureAccessWrapper>
    </View>
  );
}

// Helper function to get difficulty color
const getDifficultyColor = (difficulty: string) => {
  switch (difficulty.toLowerCase()) {
    case 'easy': return '#4CAF50';
    case 'medium': return '#FF9800';
    case 'hard': return '#F44336';
    default: return '#4CAF50';
  }
};

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
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 20,
    fontSize: 16,
    color: '#dc2929',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#dc2929',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(220, 41, 41, 0.2)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#dc2929',
    borderRadius: 2,
  },
  gameContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  categoryBadge: {
    backgroundColor: 'rgba(34, 108, 174, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#226cae',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  mediaContainer: {
    width: '100%',
    maxWidth: 300,
    height: 300,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageViewer: {
    width: '100%',
    height: '100%',
  },
  fallbackContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(220, 41, 41, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  questionText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
    gap: 8,
  },
  hintText: {
    fontSize: 14,
    color: '#FF8C00',
    fontStyle: 'italic',
    flex: 1,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  answerInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  hintButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFA500',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2929',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#dc2929',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultText: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 10,
  },
  correctAnswerText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
  },
  gameOverContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  gameOverTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333333',
    marginTop: 20,
    marginBottom: 10,
  },
  finalScore: {
    fontSize: 24,
    fontWeight: '600',
    color: '#dc2929',
    marginBottom: 20,
  },
  gameOverMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 40,
  },
  gameOverButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  playAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2929',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#dc2929',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  playAgainText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 102, 102, 0.1)',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
});
