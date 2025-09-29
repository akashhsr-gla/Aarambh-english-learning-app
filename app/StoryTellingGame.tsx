import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, Keyboard, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import GameHeader from '../components/GameHeader';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import FeatureAccessWrapper from './components/FeatureAccessWrapper';
import { useFeatureAccess } from './hooks/useFeatureAccess';
import { evaluation, gamesAPI } from './services/api';

const { width, height } = Dimensions.get('window');

// Define filter types
type FilterType = 'all' | 'exams' | 'profession';
type ExamType = 'all' | 'nda' | 'ssc' | 'banking' | 'upsc' | 'cat';
type ProfessionType = 'all' | 'engineering' | 'medical' | 'teaching' | 'business' | 'student';

// Types for story prompts from backend
interface StoryPrompt {
  _id: string;
  title: string;
  beginning: string;
  keywords: string[];
  difficulty: string;
  minWords: number;
  timeLimit: number;
}

export default function StoryTellingGame() {
  const navigation = useNavigation();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [storyText, setStoryText] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [aiEvaluation, setAiEvaluation] = useState<any>(null);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [keywordsUsed, setKeywordsUsed] = useState<string[]>([]);
  const [wordCount, setWordCount] = useState(0);
  
  // Backend data states
  const [storyPrompts, setStoryPrompts] = useState<StoryPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Feature access control
  const { canAccess: canPlayGames, featureInfo: gameFeatureInfo } = useFeatureAccess('games');
  
  // Filter states
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedExam, setSelectedExam] = useState<ExamType>('all');
  const [selectedProfession, setSelectedProfession] = useState<ProfessionType>('all');
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);
  
  const currentStory = storyPrompts[currentStoryIndex];
  
  // Fetch story prompts from backend
  useEffect(() => {
    fetchStoryPrompts();
  }, []);

  const fetchStoryPrompts = async () => {
    try {
      setLoading(true);
      const response = await gamesAPI.getGamesByType('storytelling');
      console.log('🔍 Storytelling API Response:', response);
      
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
          
          // Convert questions to story prompts format
          const prompts: StoryPrompt[] = questions.map((q: any, index: number) => ({
            _id: q._id || `q${index}`,
            title: q.title || q.questionText || `Story Prompt ${index + 1}`,
            beginning: q.storyBeginning || q.questionText || "Once upon a time...",
            keywords: q.keywords || q.suggestedWords || ["adventure", "challenge", "discovery"],
            difficulty: q.difficulty || "Medium",
            minWords: q.minWords || q.wordLimit || 50,
            timeLimit: q.timeLimit || firstGame.timeLimit || 180
          }));
          
          setStoryPrompts(prompts);
          setError(null);
        } else {
          setError('No storytelling games available');
        }
      } else {
        setError('Failed to fetch storytelling data');
      }
    } catch (err) {
      console.error('🚨 Storytelling API Error:', err);
      setError('Failed to fetch storytelling data');
    } finally {
      setLoading(false);
    }
  };
  
  // Initialize timer when story changes
  useEffect(() => {
    if (currentStory) {
      setTimeLeft(currentStory.timeLimit);
      setStoryText("");
      setIsSubmitted(false);
      setKeywordsUsed([]);
      setWordCount(0);
      
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
      
      // Focus on input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [currentStoryIndex, currentStory]);
  
  // Timer countdown
  useEffect(() => {
    if (isSubmitted || gameOver || timeLeft <= 0) return;
    
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
  }, [isSubmitted, gameOver, timeLeft]);
  
  // Check for keywords and update word count when story text changes
  useEffect(() => {
    if (!currentStory) return;
    
    const words = storyText.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    
    const usedKeywords = currentStory.keywords.filter(keyword => 
      storyText.toLowerCase().includes(keyword.toLowerCase())
    );
    
    setKeywordsUsed(usedKeywords);
  }, [storyText, currentStory]);
  
  const handleTimeout = () => {
    Keyboard.dismiss();
    setIsSubmitted(true);
    evaluateStory();
  };
  
  const submitStory = () => {
    if (isSubmitted || !currentStory) return;
    
    Keyboard.dismiss();
    setIsSubmitted(true);
    evaluateStory();
  };
  
  const evaluateStory = async () => {
    if (!currentStory) return;
    
    setEvaluationLoading(true);
    
    try {
      console.log('🤖 Evaluating story with AI...');
      
      const evaluationData = {
        story: storyText,
        prompt: currentStory.beginning,
        keywords: currentStory.keywords,
        minWords: currentStory.minWords,
        difficulty: currentStory.difficulty.toLowerCase(),
        timeSpent: currentStory.timeLimit - timeLeft,
        maxTime: currentStory.timeLimit
      };
      
      const response = await evaluation.evaluateStory(evaluationData);
      
      if (response.success) {
        const aiEval = response.data.evaluation;
        setAiEvaluation(aiEval);
        
        // Use AI evaluation for score and feedback
        setScore(score + aiEval.final_score);
        setFeedback(aiEval.feedback);
        
        console.log('✅ AI story evaluation completed:', aiEval);
      } else {
        throw new Error('AI evaluation failed');
      }
    } catch (error) {
      console.error('❌ AI evaluation error:', error);
      
      // Fallback to simple evaluation
      const fallbackEvaluation = getFallbackEvaluation();
      setScore(score + fallbackEvaluation.score);
      setFeedback(fallbackEvaluation.feedback);
    } finally {
      setEvaluationLoading(false);
    }
  };
  
  const getFallbackEvaluation = () => {
    if (!currentStory) return { score: 0, feedback: "No story to evaluate." };
    
    let storyScore = 0;
    let feedbackText = "";
    
    // Word count score (up to 50 points)
    const wordCountRatio = Math.min(wordCount / currentStory.minWords, 2);
    const wordCountScore = Math.min(Math.floor(wordCountRatio * 25), 50);
    
    // Keywords score (10 points each, up to 50 points)
    const keywordScore = Math.min(keywordsUsed.length * 10, 50);
    
    // Time bonus (up to 10 points)
    const timeBonus = timeLeft > 0 ? Math.min(Math.floor(timeLeft / currentStory.timeLimit * 10), 10) : 0;
    
    storyScore = wordCountScore + keywordScore + timeBonus;
    
    // Generate feedback
    if (wordCount < currentStory.minWords) {
      feedbackText += `Your story is too short. Try to write at least ${currentStory.minWords} words. `;
    } else if (wordCount >= currentStory.minWords * 1.5) {
      feedbackText += "Great job writing a detailed story! ";
    }
    
    if (keywordsUsed.length === 0) {
      feedbackText += "You didn't use any of the suggested keywords. ";
    } else if (keywordsUsed.length < 3) {
      feedbackText += `You used ${keywordsUsed.length} keywords. Try to include more next time. `;
    } else {
      feedbackText += `Excellent use of ${keywordsUsed.length} keywords! `;
    }
    
    if (timeLeft > 0) {
      feedbackText += `You finished with ${timeLeft} seconds remaining. `;
    } else {
      feedbackText += "You ran out of time. Try to manage your time better. ";
    }
    
    return { score: storyScore, feedback: feedbackText };
  };
  
  const moveToNextStory = () => {
    if (currentStoryIndex < storyPrompts.length - 1) {
      // Slide out animation
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStoryIndex(currentStoryIndex + 1);
      });
    } else {
      setGameOver(true);
      
      // Show final score
      Alert.alert(
        "Game Completed!",
        `Your final score: ${score} out of ${storyPrompts.length * 110}`,
        [
          { text: "Play Again", onPress: resetGame },
          { text: "Back to Explore", onPress: () => navigation.goBack() }
        ]
      );
    }
  };
  
  const resetGame = () => {
    setCurrentStoryIndex(0);
    setScore(0);
    setGameOver(false);
    setIsSubmitted(false);
    setStoryText("");
    setKeywordsUsed([]);
    setWordCount(0);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FFC107';
      case 'hard': return '#F44336';
      default: return '#4CAF50';
    }
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
        <GameHeader title="Story Telling" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#226cae" />
          <ThemedText style={styles.loadingText}>Loading story prompts...</ThemedText>
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
        <GameHeader title="Story Telling" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-triangle" size={48} color="#dc2929" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={fetchStoryPrompts}>
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!currentStory) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(220, 41, 41, 0.03)', 'rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0.98)', 'rgba(34, 108, 174, 0.03)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        />
        <GameHeader title="Story Telling" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <FontAwesome name="question-circle" size={48} color="#666" />
          <ThemedText style={styles.errorText}>No story prompts available</ThemedText>
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
      
      <GameHeader title="Story Telling" showBackButton onBackPress={() => navigation.goBack()} />
      
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
            <FontAwesome name="clock-o" size={18} color={timeLeft < 30 ? "#dc2929" : "#226cae"} />
            <ThemedText style={[styles.scoreText, timeLeft < 30 && styles.urgentTime]}>
              {formatTime(timeLeft)}
            </ThemedText>
          </View>
          <View style={styles.scoreItem}>
            <FontAwesome name="file-text-o" size={18} color="#226cae" />
            <ThemedText style={styles.scoreText}>Words: {wordCount}</ThemedText>
          </View>
        </View>
        
        <Animated.View 
          style={[
            styles.gameContent,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }]
            }
          ]}
        >
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((currentStoryIndex + 1) / storyPrompts.length) * 100}%` }]} />
          </View>
          
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            overScrollMode="never"
            decelerationRate="fast"
          >
            <View style={styles.storyHeader}>
              <ThemedText style={styles.storyTitle}>{currentStory.title}</ThemedText>
              <View style={styles.difficultyBadge}>
                <View style={[styles.difficultyIndicator, { backgroundColor: getDifficultyColor(currentStory.difficulty) }]} />
                <ThemedText style={styles.difficultyText}>{currentStory.difficulty}</ThemedText>
              </View>
            </View>
            
            <ThemedView style={styles.storyPromptContainer}>
              <ThemedText style={styles.storyPrompt}>{currentStory.beginning}</ThemedText>
            </ThemedView>
            
            <View style={styles.keywordsContainer}>
              <ThemedText style={styles.keywordsTitle}>Suggested Keywords:</ThemedText>
              <View style={styles.keywordsList}>
                {currentStory.keywords.map((keyword: string, index: number) => (
                  <View 
                    key={index} 
                    style={[
                      styles.keywordBadge, 
                      keywordsUsed.includes(keyword) && styles.usedKeywordBadge
                    ]}
                  >
                    <ThemedText 
                      style={[
                        styles.keywordText, 
                        keywordsUsed.includes(keyword) && styles.usedKeywordText
                      ]}
                    >
                      {keyword}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
            
            <View style={styles.textAreaContainer}>
              <TextInput
                ref={inputRef}
                style={styles.textArea}
                placeholder="Continue the story here..."
                value={storyText}
                onChangeText={setStoryText}
                multiline
                numberOfLines={10}
                textAlignVertical="top"
                editable={!isSubmitted}
              />
            </View>
            
            {!isSubmitted ? (
              <TouchableOpacity 
                style={styles.submitButton} 
                onPress={submitStory}
              >
                <ThemedText style={styles.submitButtonText}>Submit Story</ThemedText>
                <FontAwesome name="check" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            ) : evaluationLoading ? (
              <View style={styles.feedbackContainer}>
                <View style={styles.evaluationLoadingContainer}>
                  <ActivityIndicator size="large" color="#226cae" />
                  <ThemedText style={styles.evaluationLoadingText}>🤖 AI is evaluating your story...</ThemedText>
                  <ThemedText style={styles.evaluationLoadingSubtext}>This may take a few seconds</ThemedText>
                </View>
              </View>
            ) : (
              <View style={styles.feedbackContainer}>
                <View style={styles.scoreBreakdown}>
                  <ThemedText style={styles.feedbackTitle}>
                    Your Score {aiEvaluation?.grade ? `(Grade: ${aiEvaluation.grade})` : ''}
                  </ThemedText>
                  
                  {aiEvaluation?.score_breakdown ? (
                    <>
                      <View style={styles.scoreRow}>
                        <ThemedText style={styles.scoreLabel}>Creativity:</ThemedText>
                        <ThemedText style={styles.scoreValue}>{aiEvaluation.score_breakdown.creativity}/25</ThemedText>
                      </View>
                      
                      <View style={styles.scoreRow}>
                        <ThemedText style={styles.scoreLabel}>Grammar:</ThemedText>
                        <ThemedText style={styles.scoreValue}>{aiEvaluation.score_breakdown.grammar}/25</ThemedText>
                      </View>
                      
                      <View style={styles.scoreRow}>
                        <ThemedText style={styles.scoreLabel}>Vocabulary:</ThemedText>
                        <ThemedText style={styles.scoreValue}>{aiEvaluation.score_breakdown.vocabulary}/20</ThemedText>
                      </View>
                      
                      <View style={styles.scoreRow}>
                        <ThemedText style={styles.scoreLabel}>Coherence:</ThemedText>
                        <ThemedText style={styles.scoreValue}>{aiEvaluation.score_breakdown.coherence}/15</ThemedText>
                      </View>
                      
                      <View style={styles.scoreRow}>
                        <ThemedText style={styles.scoreLabel}>Keyword Usage:</ThemedText>
                        <ThemedText style={styles.scoreValue}>{aiEvaluation.score_breakdown.keyword_usage}/15</ThemedText>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.scoreRow}>
                        <ThemedText style={styles.scoreLabel}>Word Count:</ThemedText>
                        <ThemedText style={styles.scoreValue}>
                          {wordCount >= currentStory.minWords ? 
                            `${Math.min(Math.floor((wordCount / currentStory.minWords) * 25), 50)}/50` : 
                            `${Math.floor((wordCount / currentStory.minWords) * 25)}/50`}
                        </ThemedText>
                      </View>
                      
                      <View style={styles.scoreRow}>
                        <ThemedText style={styles.scoreLabel}>Keywords Used:</ThemedText>
                        <ThemedText style={styles.scoreValue}>{Math.min(keywordsUsed.length * 10, 50)}/50</ThemedText>
                      </View>
                      
                      <View style={styles.scoreRow}>
                        <ThemedText style={styles.scoreLabel}>Time Bonus:</ThemedText>
                        <ThemedText style={styles.scoreValue}>
                          {timeLeft > 0 ? Math.min(Math.floor(timeLeft / currentStory.timeLimit * 10), 10) : 0}/10
                        </ThemedText>
                      </View>
                    </>
                  )}
                  
                  {aiEvaluation?.word_count_bonus ? (
                    <View style={styles.scoreRow}>
                      <ThemedText style={styles.scoreLabel}>Word Count Bonus:</ThemedText>
                      <ThemedText style={styles.scoreValue}>{aiEvaluation.word_count_bonus}/10</ThemedText>
                    </View>
                  ) : null}
                  
                  {aiEvaluation?.time_management_bonus ? (
                    <View style={styles.scoreRow}>
                      <ThemedText style={styles.scoreLabel}>Time Management:</ThemedText>
                      <ThemedText style={styles.scoreValue}>{aiEvaluation.time_management_bonus}/5</ThemedText>
                    </View>
                  ) : null}
                  
                  <View style={styles.totalScoreRow}>
                    <ThemedText style={styles.totalScoreLabel}>Total:</ThemedText>
                    <ThemedText style={styles.totalScoreValue}>
                      {aiEvaluation?.final_score || (
                        Math.min(Math.floor((wordCount / currentStory.minWords) * 25), 50) + 
                        Math.min(keywordsUsed.length * 10, 50) + 
                        (timeLeft > 0 ? Math.min(Math.floor(timeLeft / currentStory.timeLimit * 10), 10) : 0)
                      )}/100
                    </ThemedText>
                  </View>
                </View>
                
                <View style={styles.feedbackTextContainer}>
                  <ThemedText style={styles.feedbackText}>{feedback}</ThemedText>
                </View>
                
                {aiEvaluation?.strengths && aiEvaluation.strengths.length > 0 ? (
                  <View style={styles.strengthsSection}>
                    <View style={styles.sectionHeader}>
                      <FontAwesome name="check-circle" size={16} color="#4CAF50" />
                      <ThemedText style={styles.sectionTitle}>Strengths</ThemedText>
                    </View>
                    <View style={styles.strengthsList}>
                      {aiEvaluation.strengths.map((strength: string, index: number) => (
                        <View key={index} style={styles.strengthItem}>
                          <View style={styles.strengthBullet} />
                          <ThemedText style={styles.strengthText}>{strength}</ThemedText>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}
                
                {aiEvaluation?.improvements && aiEvaluation.improvements.length > 0 ? (
                  <View style={styles.improvementsSection}>
                    <View style={styles.sectionHeader}>
                      <FontAwesome name="exclamation-triangle" size={16} color="#dc2929" />
                      <ThemedText style={styles.sectionTitle}>Areas to Improve</ThemedText>
                    </View>
                    <View style={styles.improvementsList}>
                      {aiEvaluation.improvements.map((improvement: string, index: number) => (
                        <View key={index} style={styles.improvementItem}>
                          <View style={styles.improvementBullet} />
                          <ThemedText style={styles.improvementText}>{improvement}</ThemedText>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}
                
                {aiEvaluation?.detailed_analysis ? (
                  <View style={styles.analysisSection}>
                    <View style={styles.sectionHeader}>
                      <FontAwesome name="search" size={16} color="#226cae" />
                      <ThemedText style={styles.sectionTitle}>Detailed Analysis</ThemedText>
                    </View>
                    <View style={styles.analysisList}>
                      {Object.entries(aiEvaluation.detailed_analysis).map(([key, value]: [string, any]) => (
                        <View key={key} style={styles.analysisItem}>
                          <ThemedText style={styles.analysisLabel}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</ThemedText>
                          <ThemedText style={styles.analysisValue}>{value}</ThemedText>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}
                
                <TouchableOpacity style={styles.nextButton} onPress={moveToNextStory}>
                  <ThemedText style={styles.nextButtonText}>
                    {currentStoryIndex < storyPrompts.length - 1 ? "Next Story" : "See Results"}
                  </ThemedText>
                  <FontAwesome name="arrow-right" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </Animated.View>
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
  },
  scoreText: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  urgentTime: {
    color: '#dc2929',
    fontWeight: '700',
  },
  gameContent: {
    flex: 1,
    marginTop: 10,
  },
  progressBar: {
    width: '90%',
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    marginHorizontal: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#226cae',
    borderRadius: 3,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  storyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  storyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    flex: 1,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  difficultyIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  difficultyText: {
    color: '#666666',
    fontWeight: '500',
    fontSize: 14,
  },
  storyPromptContainer: {
    backgroundColor: 'rgba(34, 108, 174, 0.05)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#226cae',
  },
  storyPrompt: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333333',
    fontStyle: 'italic',
  },
  keywordsContainer: {
    marginBottom: 16,
  },
  keywordsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  keywordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  keywordBadge: {
    backgroundColor: 'rgba(220, 41, 41, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  usedKeywordBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  keywordText: {
    color: '#dc2929',
    fontWeight: '500',
    fontSize: 13,
  },
  usedKeywordText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  textAreaContainer: {
    marginBottom: 16,
  },
  textArea: {
    minHeight: 200,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 16,
    fontSize: 15,
    color: '#333333',
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#226cae',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    marginRight: 8,
  },
  feedbackContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(34, 108, 174, 0.2)',
  },
  scoreBreakdown: {
    marginBottom: 16,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 16,
    color: '#666666',
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  totalScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  totalScoreLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
  },
  totalScoreValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#226cae',
  },
  feedbackTextContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  feedbackText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333333',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#226cae',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    marginRight: 8,
  },
  // Filter styles
  filterContainer: {
    marginHorizontal: 20,
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
  evaluationLoadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  evaluationLoadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#226cae',
    marginTop: 16,
    textAlign: 'center',
  },
  evaluationLoadingSubtext: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
  },
  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    marginLeft: 8,
  },
  
  // Strengths Section
  strengthsSection: {
    marginBottom: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
    borderRadius: 10,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  strengthsList: {
    gap: 8,
  },
  strengthItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  strengthBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginTop: 6,
    marginRight: 12,
  },
  strengthText: {
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 20,
    flex: 1,
  },
  
  // Improvements Section
  improvementsSection: {
    marginBottom: 16,
    backgroundColor: 'rgba(220, 41, 41, 0.05)',
    borderRadius: 10,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2929',
  },
  improvementsList: {
    gap: 8,
  },
  improvementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  improvementBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#dc2929',
    marginTop: 6,
    marginRight: 12,
  },
  improvementText: {
    fontSize: 14,
    color: '#C62828',
    lineHeight: 20,
    flex: 1,
  },
  
  // Analysis Section
  analysisSection: {
    marginBottom: 16,
    backgroundColor: 'rgba(34, 108, 174, 0.05)',
    borderRadius: 10,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#226cae',
  },
  analysisList: {
    gap: 12,
  },
  analysisItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 108, 174, 0.1)',
  },
  analysisLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#226cae',
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  analysisValue: {
    fontSize: 13,
    color: '#555555',
    lineHeight: 18,
    fontStyle: 'italic',
  },
});