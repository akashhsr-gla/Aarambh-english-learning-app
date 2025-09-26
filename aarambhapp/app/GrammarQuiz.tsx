import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import GameHeader from '../components/GameHeader';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import FeatureAccessWrapper from './components/FeatureAccessWrapper';
import { useFeatureAccess } from './hooks/useFeatureAccess';
import { gamesAPI } from './services/api';

const { width } = Dimensions.get('window');

// Define filter types
type FilterType = 'all' | 'exams' | 'profession';
type ExamType = 'all' | 'nda' | 'ssc' | 'banking' | 'upsc' | 'cat';
type ProfessionType = 'all' | 'engineering' | 'medical' | 'teaching' | 'business' | 'student';

// Types for grammar quiz data from backend
interface QuizQuestion {
  _id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export default function GrammarQuiz() {
  const navigation = useNavigation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));
  
  // Backend data states
  const [quizData, setQuizData] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedExam, setSelectedExam] = useState<ExamType>('all');
  const [selectedProfession, setSelectedProfession] = useState<ProfessionType>('all');

  // Feature access control
  const { canAccess: canPlayGames, featureInfo: gameFeatureInfo } = useFeatureAccess('games');

  const currentQuestion = quizData[currentQuestionIndex];

  // Fetch quiz data from backend
  useEffect(() => {
    fetchQuizData();
  }, []);

  const fetchQuizData = async () => {
    try {
      setLoading(true);
      const response = await gamesAPI.getGamesByType('grammar');
      console.log('🔍 Grammar API Response:', response);
      
      if (response.success && response.data) {
        let gamesData = response.data;
        
        // Handle different response structures
        if (response.data.games && Array.isArray(response.data.games)) {
          gamesData = response.data.games;
        } else if (Array.isArray(response.data)) {
          gamesData = response.data;
        } else {
          gamesData = [];
        }
        
        if (gamesData.length > 0) {
          // Extract questions from the first game
          const firstGame = gamesData[0];
          const questions = firstGame.questions || [];
          
          // Convert questions to quiz format
          const quizQuestions: QuizQuestion[] = questions.map((q: any, index: number) => {
            // Find the correct answer from options
            const correctOption = q.options?.find((opt: any) => opt.isCorrect);
            const correctAnswerText = correctOption?.text || q.correctAnswer || q.options?.[0]?.text || `Option ${index + 1}`;
            
            return {
              _id: q._id || `q${index}`,
              question: q.questionText || q.question || `Question ${index + 1}`,
              options: q.options ? q.options.map((opt: any) => opt.text) : [`Option ${index + 1}`, `Option ${index + 2}`, `Option ${index + 3}`, `Option ${index + 4}`],
              correctAnswer: correctAnswerText,
              explanation: q.explanation || correctOption?.explanation || "Explanation for this question"
            };
          });
          
          setQuizData(quizQuestions);
          setError(null);
        } else {
          setError('No grammar games available');
        }
      } else {
        setError('Failed to fetch grammar data');
      }
    } catch (err) {
      console.error('🚨 Grammar API Error:', err);
      setError('Failed to fetch grammar data');
    } finally {
      setLoading(false);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (showExplanation || quizCompleted || !currentQuestion) return;

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
  }, [currentQuestionIndex, showExplanation, quizCompleted, currentQuestion]);

  // Reset animations when question changes
  useEffect(() => {
    if (currentQuestion) {
      setSelectedOption(null);
      setShowExplanation(false);
      setTimeLeft(30);
      
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
    }
  }, [currentQuestionIndex, currentQuestion]);

  const handleTimeout = () => {
    setShowExplanation(true);
    // Shake animation for timeout
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 100, useNativeDriver: true })
    ]).start();
  };

  const handleOptionSelect = (option: string) => {
    if (showExplanation || !currentQuestion) return;
    
    setSelectedOption(option);
    setShowExplanation(true);
    
    if (option === currentQuestion.correctAnswer) {
      setScore(score + 10);
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
    if (currentQuestionIndex < quizData.length - 1) {
      // Slide out animation
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      });
    } else {
      setQuizCompleted(true);
      // Show final score
      Alert.alert(
        "Quiz Completed!",
        `Your final score: ${score} out of ${quizData.length * 10}`,
        [
          { text: "Try Again", onPress: resetQuiz },
          { text: "Back to Explore", onPress: () => navigation.goBack() }
        ]
      );
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizCompleted(false);
    setSelectedOption(null);
    setShowExplanation(false);
    setTimeLeft(30);
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
        <GameHeader title="Grammar Quiz" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#226cae" />
          <ThemedText style={styles.loadingText}>Loading grammar questions...</ThemedText>
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
        <GameHeader title="Grammar Quiz" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-triangle" size={48} color="#dc2929" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={fetchQuizData}>
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!currentQuestion) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(220, 41, 41, 0.03)', 'rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0.98)', 'rgba(34, 108, 174, 0.03)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        />
        <GameHeader title="Grammar Quiz" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <FontAwesome name="question-circle" size={48} color="#666" />
          <ThemedText style={styles.errorText}>No questions available</ThemedText>
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
      
      <GameHeader title="Grammar Quiz" showBackButton onBackPress={() => navigation.goBack()} />
      
      <FeatureAccessWrapper
        featureKey="games"
        fallback={null}
        style={styles.container}
        navigation={navigation}
      >
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
      
      <View style={styles.scoreContainer}>
        <View style={styles.scoreItem}>
          <FontAwesome name="star" size={18} color="#FFD700" />
          <ThemedText style={styles.scoreText}>Score: {score}</ThemedText>
        </View>
        <View style={styles.scoreItem}>
          <FontAwesome name="clock-o" size={18} color={timeLeft < 10 ? "#dc2929" : "#226cae"} />
          <ThemedText style={[styles.scoreText, timeLeft < 10 && styles.urgentTime]}>
            {timeLeft}s
          </ThemedText>
        </View>
        <View style={styles.scoreItem}>
          <FontAwesome name="tasks" size={18} color="#226cae" />
          <ThemedText style={styles.scoreText}>
            {currentQuestionIndex + 1}/{quizData.length}
          </ThemedText>
        </View>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        {currentQuestion && (
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
              <View style={styles.questionHeader}>
                <ThemedText style={styles.questionNumber}>Question {currentQuestionIndex + 1}</ThemedText>
              </View>
              
              <ThemedText style={styles.questionText}>{currentQuestion.question}</ThemedText>
              
              <View style={styles.optionsContainer}>
                {currentQuestion.options.map((option: string, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionButton,
                      selectedOption === option && styles.selectedOption,
                      showExplanation && option === currentQuestion.correctAnswer && styles.correctOption,
                      showExplanation && selectedOption === option && option !== currentQuestion.correctAnswer && styles.wrongOption
                    ]}
                    onPress={() => handleOptionSelect(option)}
                    disabled={showExplanation}
                  >
                    <View style={styles.optionLabelContainer}>
                      <ThemedText style={styles.optionLabel}>{String.fromCharCode(65 + index)}</ThemedText>
                    </View>
                    <ThemedText 
                      style={[
                        styles.optionText,
                        showExplanation && option === currentQuestion.correctAnswer && styles.correctOptionText,
                        showExplanation && selectedOption === option && option !== currentQuestion.correctAnswer && styles.wrongOptionText
                      ]}
                    >
                      {option}
                    </ThemedText>
                    
                    {showExplanation && option === currentQuestion.correctAnswer && (
                      <FontAwesome name="check-circle" size={20} color="#4CAF50" style={styles.resultIcon} />
                    )}
                    
                    {showExplanation && selectedOption === option && option !== currentQuestion.correctAnswer && (
                      <FontAwesome name="times-circle" size={20} color="#dc2929" style={styles.resultIcon} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              
              {showExplanation && (
                <View style={styles.explanationContainer}>
                  <View style={styles.explanationHeader}>
                    <FontAwesome name="lightbulb-o" size={20} color="#FFC107" />
                    <ThemedText style={styles.explanationTitle}>Explanation</ThemedText>
                  </View>
                  <ThemedText style={styles.explanationText}>
                    {currentQuestion.explanation}
                  </ThemedText>
                  
                  <TouchableOpacity 
                    style={styles.nextButton}
                    onPress={moveToNextQuestion}
                  >
                    <ThemedText style={styles.nextButtonText}>
                      {currentQuestionIndex < quizData.length - 1 ? "Next Question" : "Finish Quiz"}
                    </ThemedText>
                    <FontAwesome name="arrow-right" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}
            </ThemedView>
          </Animated.View>
        )}
      </ScrollView>
      </FeatureAccessWrapper>
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
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 40,
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
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(34, 108, 174, 0.2)',
  },
  questionHeader: {
    backgroundColor: 'rgba(34, 108, 174, 0.05)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#226cae',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    padding: 20,
    lineHeight: 26,
  },
  optionsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  optionLabelContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
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
    lineHeight: 22,
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
  explanationContainer: {
    padding: 20,
    backgroundColor: 'rgba(255, 245, 157, 0.1)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  explanationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 10,
  },
  explanationText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
    marginBottom: 20,
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
    marginTop: 10,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    marginRight: 8,
  },
  // Filter styles
  filterContainer: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
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
    fontWeight: '600',
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
}); 