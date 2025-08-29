import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import GameHeader from '../components/GameHeader';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { gamesAPI } from './services/api';

const { width } = Dimensions.get('window');

// Types for pronunciation data from backend
interface PronunciationWord {
  _id: string;
  word: string;
  phonetic?: string;
  difficulty: string;
  example?: string;
  tips?: string;
}

export default function PronunciationGame() {
  const navigation = useNavigation();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState("ready");
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<{
    message: string;
    details: string;
    color: string;
    accuracy: number;
  } | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Backend data states
  const [pronunciationData, setPronunciationData] = useState<PronunciationWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  const currentWord = pronunciationData[currentWordIndex];
  
  // Fetch pronunciation data from backend
  useEffect(() => {
    fetchPronunciationData();
  }, []);

  const fetchPronunciationData = async () => {
    try {
      setLoading(true);
      const response = await gamesAPI.getGamesByType('pronunciation');
      console.log('🔍 Pronunciation API Response:', response);
      
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
          
          // Convert questions to pronunciation words format
          const words: PronunciationWord[] = questions.map((q: any, index: number) => ({
            _id: q._id || `q${index}`,
            word: q.questionText || `Word ${index + 1}`,
            phonetic: q.phonetic || "/ˈwɜːd/",
            difficulty: q.difficulty || "Medium",
            example: q.example || "Example sentence",
            tips: q.tips || "Pronunciation tips"
          }));
          
          setPronunciationData(words);
          setError(null);
        } else {
          setError('No pronunciation games available');
        }
      } else {
        setError('Failed to fetch pronunciation data');
      }
    } catch (err) {
      console.error('🚨 Pronunciation API Error:', err);
      setError('Failed to fetch pronunciation data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Request audio recording permissions
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow microphone access to use this feature.');
      }
    })();
    
    // Reset animations when word changes
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
    
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [currentWordIndex]);

  // Pulse animation for recording button
  useEffect(() => {
    let pulseAnimation: Animated.CompositeAnimation | undefined;
    
    if (isRecording) {
      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          })
        ])
      );
      pulseAnimation.start();
    } else {
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
    
    return () => {
      if (pulseAnimation) {
        pulseAnimation.stop();
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setRecordingStatus("recording");
      
      // For demo purposes, simulate recording for 3 seconds
      setTimeout(() => {
        stopRecording();
      }, 3000);
      
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording.');
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setRecordingStatus("processing");
    
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        
        if (uri) {
          setTimeout(() => {
            processRecording(uri);
          }, 1500);
        }
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
      setRecordingStatus("ready");
    }
  };

  const processRecording = (uri: string) => {
    // Simulate AI processing with random accuracy
    const accuracy = Math.floor(Math.random() * 101);
    let feedbackMessage: string;
    let feedbackDetails: string;
    let feedbackColor: string;
    let points = 0;
    
    if (accuracy >= 85) {
      feedbackMessage = "Excellent pronunciation!";
      feedbackDetails = "Your pronunciation was very clear and accurate.";
      feedbackColor = "#4CAF50";
      points = 10;
    } else if (accuracy >= 70) {
      feedbackMessage = "Good job!";
      feedbackDetails = "Your pronunciation was good with minor improvements needed.";
      feedbackColor = "#8BC34A";
      points = 7;
    } else if (accuracy >= 50) {
      feedbackMessage = "Not bad";
      feedbackDetails = "You're on the right track, but need more practice.";
      feedbackColor = "#FFC107";
      points = 5;
    } else {
      feedbackMessage = "Keep practicing";
      feedbackDetails = "Try again focusing on the pronunciation tips.";
      feedbackColor = "#FF5722";
      points = 2;
    }
    
    setFeedback({
      message: feedbackMessage,
      details: feedbackDetails,
      color: feedbackColor,
      accuracy: accuracy
    });
    
    setScore(score + points);
    setRecordingStatus("feedback");
    
    // Create a sound object from the recording for playback
    createSound(uri);
  };

  const createSound = async (uri: string) => {
    const { sound } = await Audio.Sound.createAsync({ uri });
    setSound(sound);
  };

  const playRecording = async () => {
    if (!sound) return;
    
    try {
      setIsPlaying(true);
      await sound.replayAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && !status.isPlaying && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (err) {
      console.error('Failed to play recording', err);
      setIsPlaying(false);
    }
  };

  const moveToNextWord = () => {
    if (currentWordIndex < pronunciationData.length - 1) {
      // Slide out animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -width,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start(() => {
        setCurrentWordIndex(currentWordIndex + 1);
        setRecordingStatus("ready");
        setFeedback(null);
        if (sound) {
          sound.unloadAsync();
          setSound(null);
        }
      });
    } else {
      setGameOver(true);
      Alert.alert(
        "Practice Complete!",
        `Your final score: ${score} points`,
        [
          { text: "Practice Again", onPress: resetGame },
          { text: "Back to Explore", onPress: () => navigation.goBack() }
        ]
      );
    }
  };

  const resetGame = () => {
    setCurrentWordIndex(0);
    setScore(0);
    setGameOver(false);
    setRecordingStatus("ready");
    setFeedback(null);
    if (sound) {
      sound.unloadAsync();
      setSound(null);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '#4CAF50';
      case 'Medium': return '#FFC107';
      case 'Hard': return '#dc2929';
      default: return '#226cae';
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
        <GameHeader title="Pronunciation Practice" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#226cae" />
          <ThemedText style={styles.loadingText}>Loading pronunciation words...</ThemedText>
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
        <GameHeader title="Pronunciation Practice" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-triangle" size={48} color="#dc2929" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={fetchPronunciationData}>
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!currentWord) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(220, 41, 41, 0.03)', 'rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0.98)', 'rgba(34, 108, 174, 0.03)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        />
        <GameHeader title="Pronunciation Practice" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <FontAwesome name="question-circle" size={48} color="#666" />
          <ThemedText style={styles.errorText}>No pronunciation words available</ThemedText>
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
      
      <GameHeader title="Pronunciation Practice" showBackButton onBackPress={() => navigation.goBack()} />
      
      <View style={styles.scoreContainer}>
        <View style={styles.scoreItem}>
          <FontAwesome name="star" size={18} color="#FFD700" />
          <ThemedText style={styles.scoreText}>Score: {score}</ThemedText>
        </View>
        <View style={styles.scoreItem}>
          <FontAwesome name="microphone" size={18} color="#226cae" />
          <ThemedText style={styles.scoreText}>
            {currentWordIndex + 1}/{pronunciationData.length}
          </ThemedText>
        </View>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <Animated.View 
          style={[
            styles.wordContainer,
            { 
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }]
            }
          ]}
        >
          <ThemedView style={styles.wordCard}>
            <View style={styles.wordHeader}>
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(currentWord.difficulty) }]}>
                <ThemedText style={styles.difficultyText}>{currentWord.difficulty}</ThemedText>
              </View>
            </View>
            
            <View style={styles.wordContent}>
              <ThemedText style={styles.wordText}>{currentWord.word}</ThemedText>
              <ThemedText style={styles.phoneticText}>{currentWord.phonetic}</ThemedText>
            </View>
            
            <View style={styles.exampleContainer}>
              <ThemedText style={styles.exampleLabel}>Example:</ThemedText>
              <ThemedText style={styles.exampleText}>"{currentWord.example}"</ThemedText>
            </View>
            
            <View style={styles.tipsContainer}>
              <View style={styles.tipsHeader}>
                <FontAwesome name="lightbulb-o" size={18} color="#FFC107" />
                <ThemedText style={styles.tipsLabel}>Pronunciation Tip:</ThemedText>
              </View>
              <ThemedText style={styles.tipsText}>{currentWord.tips}</ThemedText>
            </View>
            
            <View style={styles.recordingContainer}>
              {recordingStatus === "ready" && (
                <TouchableOpacity onPress={startRecording}>
                  <Animated.View 
                    style={[
                      styles.recordButton,
                      { transform: [{ scale: pulseAnim }] }
                    ]}
                  >
                    <FontAwesome name="microphone" size={32} color="#FFFFFF" />
                    <ThemedText style={styles.recordButtonText}>Tap to Speak</ThemedText>
                  </Animated.View>
                </TouchableOpacity>
              )}
              
              {recordingStatus === "recording" && (
                <View>
                  <Animated.View 
                    style={[
                      styles.recordingIndicator,
                      { transform: [{ scale: pulseAnim }] }
                    ]}
                  >
                    <FontAwesome name="microphone" size={32} color="#FFFFFF" />
                  </Animated.View>
                  <ThemedText style={styles.recordingText}>Recording... Say "{currentWord.word}"</ThemedText>
                </View>
              )}
              
              {recordingStatus === "processing" && (
                <View style={styles.processingContainer}>
                  <ThemedText style={styles.processingText}>Processing your pronunciation...</ThemedText>
                  <View style={styles.loadingDots}>
                    <View style={styles.loadingDot} />
                    <View style={[styles.loadingDot, { animationDelay: '0.2s' }]} />
                    <View style={[styles.loadingDot, { animationDelay: '0.4s' }]} />
                  </View>
                </View>
              )}
              
              {recordingStatus === "feedback" && feedback && (
                <View style={styles.feedbackContainer}>
                  <View style={styles.feedbackHeader}>
                    <ThemedText style={[styles.feedbackMessage, { color: feedback.color }]}>
                      {feedback.message}
                    </ThemedText>
                    <View style={styles.accuracyContainer}>
                      <ThemedText style={styles.accuracyLabel}>Accuracy</ThemedText>
                      <View style={styles.accuracyBar}>
                        <View 
                          style={[
                            styles.accuracyFill, 
                            { 
                              width: `${feedback.accuracy}%`,
                              backgroundColor: feedback.color
                            }
                          ]} 
                        />
                      </View>
                      <ThemedText style={styles.accuracyText}>{feedback.accuracy}%</ThemedText>
                    </View>
                  </View>
                  
                  <ThemedText style={styles.feedbackDetails}>{feedback.details}</ThemedText>
                  
                  <View style={styles.playbackContainer}>
                    <TouchableOpacity 
                      style={styles.playButton}
                      onPress={playRecording}
                      disabled={isPlaying}
                    >
                      <FontAwesome name={isPlaying ? "pause" : "play"} size={18} color="#FFFFFF" />
                      <ThemedText style={styles.playButtonText}>
                        {isPlaying ? "Playing..." : "Play Your Recording"}
                      </ThemedText>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.tryAgainButton}
                      onPress={() => setRecordingStatus("ready")}
                    >
                      <FontAwesome name="refresh" size={18} color="#226cae" />
                      <ThemedText style={styles.tryAgainText}>Try Again</ThemedText>
                    </TouchableOpacity>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.nextButton}
                    onPress={moveToNextWord}
                  >
                    <ThemedText style={styles.nextButtonText}>
                      {currentWordIndex < pronunciationData.length - 1 ? "Next Word" : "Finish Practice"}
                    </ThemedText>
                    <FontAwesome name="arrow-right" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ThemedView>
        </Animated.View>
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
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 40,
  },
  wordContainer: {
    width: '100%',
  },
  wordCard: {
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
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  wordContent: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  wordText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
  },
  phoneticText: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'SpaceMono',
  },
  exampleContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  exampleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 16,
    color: '#666666',
    fontStyle: 'italic',
  },
  tipsContainer: {
    padding: 20,
    backgroundColor: 'rgba(255, 235, 59, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 8,
  },
  tipsText: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 22,
  },
  recordingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  recordButton: {
    backgroundColor: '#dc2929',
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#dc2929',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 8,
  },
  recordingIndicator: {
    backgroundColor: '#dc2929',
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2929',
    textAlign: 'center',
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  processingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#226cae',
    marginBottom: 16,
  },
  loadingDots: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#226cae',
    margin: 5,
    opacity: 0.6,
  },
  feedbackContainer: {
    width: '100%',
  },
  feedbackHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  feedbackMessage: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  accuracyContainer: {
    width: '100%',
    alignItems: 'center',
  },
  accuracyLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 6,
  },
  accuracyBar: {
    width: '100%',
    height: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 6,
  },
  accuracyFill: {
    height: '100%',
    borderRadius: 5,
  },
  accuracyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  feedbackDetails: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  playbackContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#226cae',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 12,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  tryAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 108, 174, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  tryAgainText: {
    color: '#226cae',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2929',
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
