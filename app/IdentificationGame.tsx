import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Keyboard, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import GameHeader from '../components/GameHeader';
import { ThemedText } from '../components/ThemedText';

const { width } = Dimensions.get('window');

// Define filter types
type FilterType = 'all' | 'exams' | 'profession';
type ExamType = 'all' | 'nda' | 'ssc' | 'banking' | 'upsc' | 'cat';
type ProfessionType = 'all' | 'engineering' | 'medical' | 'teaching' | 'business' | 'student';

// Define the type for identification items
type IdentificationItem = {
  id: number;
  name: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  category: string;
  hint: string;
  difficulty: string;
};

// Sample identification data with categories
const identificationData: IdentificationItem[] = [
  // Animals
  {
    id: 1,
    name: "dog",
    icon: "paw",
    category: "Animals",
    hint: "Man's best friend",
    difficulty: "Easy"
  },
  {
    id: 2,
    name: "cat",
    icon: "paw",
    category: "Animals",
    hint: "Purrs when happy",
    difficulty: "Easy"
  },
  {
    id: 3,
    name: "horse",
    icon: "paw",
    category: "Animals",
    hint: "Used for riding",
    difficulty: "Easy"
  },
  // Food
  {
    id: 4,
    name: "pizza",
    icon: "cutlery",
    category: "Food",
    hint: "Italian dish with cheese and toppings",
    difficulty: "Easy"
  },
  {
    id: 5,
    name: "apple",
    icon: "apple",
    category: "Food",
    hint: "Keeps the doctor away",
    difficulty: "Easy"
  },
  {
    id: 6,
    name: "coffee",
    icon: "coffee",
    category: "Food",
    hint: "Morning beverage with caffeine",
    difficulty: "Easy"
  },
  // Transportation
  {
    id: 7,
    name: "car",
    icon: "car",
    category: "Transportation",
    hint: "Four wheels and an engine",
    difficulty: "Easy"
  },
  {
    id: 8,
    name: "bicycle",
    icon: "bicycle",
    category: "Transportation",
    hint: "Two wheels, no engine",
    difficulty: "Easy"
  },
  {
    id: 9,
    name: "plane",
    icon: "plane",
    category: "Transportation",
    hint: "Flies in the sky",
    difficulty: "Easy"
  },
  // Activities
  {
    id: 10,
    name: "running",
    icon: "rocket",
    category: "Activities",
    hint: "Fast movement on foot",
    difficulty: "Medium"
  },
  {
    id: 11,
    name: "swimming",
    icon: "life-ring",
    category: "Activities",
    hint: "Moving through water",
    difficulty: "Medium"
  },
  {
    id: 12,
    name: "reading",
    icon: "book",
    category: "Activities",
    hint: "Looking at pages with text",
    difficulty: "Medium"
  },
  // Places
  {
    id: 13,
    name: "home",
    icon: "home",
    category: "Places",
    hint: "Where you live",
    difficulty: "Easy"
  },
  {
    id: 14,
    name: "school",
    icon: "graduation-cap",
    category: "Places",
    hint: "Where you learn",
    difficulty: "Easy"
  },
  {
    id: 15,
    name: "hospital",
    icon: "hospital-o",
    category: "Places",
    hint: "Where doctors work",
    difficulty: "Easy"
  },
  // Weather
  {
    id: 16,
    name: "rain",
    icon: "tint",
    category: "Weather",
    hint: "Water falling from clouds",
    difficulty: "Medium"
  },
  {
    id: 17,
    name: "snow",
    icon: "snowflake-o",
    category: "Weather",
    hint: "Cold white precipitation",
    difficulty: "Medium"
  },
  {
    id: 18,
    name: "sun",
    icon: "sun-o",
    category: "Weather",
    hint: "Bright star in our solar system",
    difficulty: "Easy"
  },
  // Technology
  {
    id: 19,
    name: "computer",
    icon: "laptop",
    category: "Technology",
    hint: "Electronic device for work",
    difficulty: "Medium"
  },
  {
    id: 20,
    name: "phone",
    icon: "mobile",
    category: "Technology",
    hint: "Portable communication device",
    difficulty: "Easy"
  }
];

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
  const [totalItems, setTotalItems] = useState(10); // Number of items per game
  const [gameItems, setGameItems] = useState<typeof identificationData>([]);
  
  // Filter states
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedExam, setSelectedExam] = useState<ExamType>('all');
  const [selectedProfession, setSelectedProfession] = useState<ProfessionType>('all');
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const inputRef = useRef<TextInput>(null);
  
  // Initialize game with random items
  useEffect(() => {
    const shuffled = [...identificationData].sort(() => 0.5 - Math.random());
    setGameItems(shuffled.slice(0, totalItems));
  }, []);

  const currentItem = gameItems[currentItemIndex] || identificationData[0];

  // Timer countdown
  useEffect(() => {
    if (showResult || gameOver || gameItems.length === 0) return;
    
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
  }, [currentItemIndex, showResult, gameOver, gameItems]);

  // Reset animations when item changes
  useEffect(() => {
    if (gameItems.length > 0 && currentItem) {
      setAnswer("");
      setShowResult(false);
      setShowHint(false);
      setHintUsed(false);
      setTimeLeft(20);
      
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
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start();
      
      // Focus on input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [currentItemIndex, gameItems]);

  const handleTimeout = () => {
    setShowResult(true);
    setIsCorrect(false);
    setStreak(0);
    
    // Shake animation for timeout
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 100, useNativeDriver: true })
    ]).start();
  };

  const checkAnswer = () => {
    if (showResult) return;
    
    Keyboard.dismiss();
    const userAnswer = answer.trim().toLowerCase();
    const correctAnswer = currentItem.name.toLowerCase();
    
    const isAnswerCorrect = userAnswer === correctAnswer;
    setIsCorrect(isAnswerCorrect);
    setShowResult(true);
    
    if (isAnswerCorrect) {
      // Calculate points (less points if hint was used)
      const points = hintUsed ? 5 : 10;
      setScore(score + points);
      setStreak(streak + 1);
      
      // Success animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      setStreak(0);
      
      // Error animation
      Animated.sequence([
        Animated.timing(slideAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 100, useNativeDriver: true })
      ]).start();
    }
  };

  const moveToNextItem = () => {
    if (currentItemIndex < gameItems.length - 1) {
      // Slide out animation
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setCurrentItemIndex(currentItemIndex + 1);
      });
    } else {
      setGameOver(true);
      
      // Show final score
      Alert.alert(
        "Game Completed!",
        `Your final score: ${score} out of ${gameItems.length * 10}`,
        [
          { text: "Play Again", onPress: resetGame },
          { text: "Back to Explore", onPress: () => navigation.goBack() }
        ]
      );
    }
  };

  const resetGame = () => {
    const shuffled = [...identificationData].sort(() => 0.5 - Math.random());
    setGameItems(shuffled.slice(0, totalItems));
    setCurrentItemIndex(0);
    setScore(0);
    setStreak(0);
    setTimeLeft(20);
    setGameOver(false);
    setShowResult(false);
    setAnswer("");
    setShowHint(false);
    setHintUsed(false);
  };

  const toggleHint = () => {
    if (!showHint && !showResult) {
      setShowHint(true);
      setHintUsed(true);
    } else {
      setShowHint(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FFC107';
      case 'hard': return '#F44336';
      default: return '#4CAF50';
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(220, 41, 41, 0.03)', 'rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0.98)', 'rgba(34, 108, 174, 0.03)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />
      
      <GameHeader title="Identification Game" showBackButton onBackPress={() => navigation.goBack()} />
      
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
          <View style={styles.filterDropdown}>
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
          </View>
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
          <FontAwesome name="bolt" size={18} color="#dc2929" />
          <ThemedText style={styles.scoreText}>Streak: {streak}</ThemedText>
        </View>
      </View>
      
      {gameItems.length > 0 && (
        <Animated.View 
          style={[
            styles.gameContent,
            {
              opacity: fadeAnim,
              transform: [
                { translateX: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((currentItemIndex + 1) / gameItems.length) * 100}%` }]} />
          </View>
          
          <View style={styles.categoryBadge}>
            <ThemedText style={styles.categoryText}>{currentItem.category}</ThemedText>
          </View>
          
          <View style={styles.difficultyBadge}>
            <View style={[styles.difficultyIndicator, { backgroundColor: getDifficultyColor(currentItem.difficulty) }]} />
            <ThemedText style={styles.difficultyText}>{currentItem.difficulty}</ThemedText>
          </View>
          
          <View style={styles.iconContainer}>
            <FontAwesome name={currentItem.icon} size={120} color="#226cae" />
          </View>
          
          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Type the name of this object..."
              value={answer}
              onChangeText={setAnswer}
              onSubmitEditing={checkAnswer}
              editable={!showResult}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity 
              style={[styles.submitButton, showResult && styles.disabledButton]} 
              onPress={checkAnswer}
              disabled={showResult}
            >
              <FontAwesome name="check" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[styles.hintButton, (showHint || showResult) && styles.disabledButton]} 
            onPress={toggleHint}
            disabled={showHint || showResult}
          >
            <FontAwesome name="lightbulb-o" size={16} color="#FFFFFF" />
            <ThemedText style={styles.hintButtonText}>Show Hint (-5 points)</ThemedText>
          </TouchableOpacity>
          
          {showHint && (
            <View style={styles.hintContainer}>
              <ThemedText style={styles.hintText}>{currentItem.hint}</ThemedText>
            </View>
          )}
          
          {showResult && (
            <View style={[styles.resultContainer, isCorrect ? styles.correctResult : styles.incorrectResult]}>
              <FontAwesome 
                name={isCorrect ? "check-circle" : "times-circle"} 
                size={30} 
                color={isCorrect ? "#4CAF50" : "#F44336"} 
              />
              <ThemedText style={styles.resultText}>
                {isCorrect 
                  ? `Correct! ${hintUsed ? '+5 points' : '+10 points'}` 
                  : `Incorrect! The answer was "${currentItem.name}"`
                }
              </ThemedText>
              <TouchableOpacity style={styles.nextButton} onPress={moveToNextItem}>
                <ThemedText style={styles.nextButtonText}>
                  {currentItemIndex < gameItems.length - 1 ? "Next Item" : "See Results"}
                </ThemedText>
                <FontAwesome name="arrow-right" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      )}
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
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#226cae',
    borderRadius: 3,
  },
  categoryBadge: {
    position: 'absolute',
    top: 30,
    left: 20,
    backgroundColor: 'rgba(34, 108, 174, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: '#226cae',
    fontWeight: '600',
    fontSize: 14,
  },
  difficultyBadge: {
    position: 'absolute',
    top: 30,
    right: 20,
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
  iconContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(34, 108, 174, 0.2)',
  },
  inputContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333333',
  },
  submitButton: {
    width: 50,
    height: 50,
    backgroundColor: '#226cae',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  disabledButton: {
    opacity: 0.5,
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2929',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  hintButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  hintContainer: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  hintText: {
    color: '#333333',
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  resultContainer: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    width: '100%',
  },
  correctResult: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  incorrectResult: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  resultText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 12,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#226cae',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
    width: '100%',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    marginRight: 8,
  },
  // New styles for filter
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
});