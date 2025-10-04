import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import Header from '../components/Header';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import PDFViewer from './components/PDFViewer';
import VideoPlayer from './components/VideoPlayer';
import { lecturesAPI } from './services/api';

// Define lecture type from backend
interface Lecture {
  _id: string;
  title: string;
  description: string;
  duration: number; // in seconds
  thumbnailUrl?: string;
  videoUrl: string;
  notes?: {
    pdfUrl?: string;
    textContent?: string;
  };
  instructor?: {
    name: string;
    email: string;
  };
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  isPremium: boolean;
  isActive: boolean;
  totalViews: number;
  createdAt: string;
  completed?: boolean; // This will be tracked on frontend
}

// This will be replaced with backend data

// Categories
const CATEGORIES = [
  'All Lessons',
  'beginner',
  'intermediate', 
  'advanced',
];

export default function LearnScreen() {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState('All Lessons');
  const [activeLecture, setActiveLecture] = useState<Lecture | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedLectures, setCompletedLectures] = useState<Set<string>>(new Set());
  
  // Fetch lectures from backend
  useEffect(() => {
    fetchLectures();
  }, []);

  // Calculate progress
  const completedLessonsCount = completedLectures.size;
  const totalLessons = lectures.length;
  const progressPercentage = totalLessons > 0 ? (completedLessonsCount / totalLessons) * 100 : 0;

  const fetchLectures = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await lecturesAPI.getAllLectures(1, 50); // Get first 50 lectures
      
      if (response.success && response.data?.lectures) {
        setLectures(response.data.lectures);
      } else {
        setError('Failed to load lectures');
      }
    } catch (err) {
      console.error('Error fetching lectures:', err);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleLecturePress = async (lecture: Lecture) => {
    setActiveLecture(lecture);
    // Mark as viewed
    try {
      await lecturesAPI.markAsViewed(lecture._id);
      setCompletedLectures(prev => new Set([...prev, lecture._id]));
    } catch (err) {
      console.error('Error marking lecture as viewed:', err);
    }
    // Fetch full lecture details (including notes)
    try {
      const details = await lecturesAPI.getLecture(lecture._id);
      if (details?.success && details.data) {
        setActiveLecture(details.data);
      }
    } catch (err) {
      // Non-fatal if notes fail to load
      console.error('Error fetching lecture details:', err);
    }
    // In a real app, you would navigate to a video player screen
    // navigation.navigate('VideoPlayerScreen', { lecture });
  };

  // Filter lectures based on selected category
  const filteredLectures = selectedCategory === 'All Lessons' 
    ? lectures 
    : lectures.filter(lecture => lecture.difficulty === selectedCategory);

  // Helper function to format duration
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };
  
  const renderLectureCard = ({ item }: { item: Lecture }) => (
    <TouchableOpacity 
      style={styles.lessonCard}
      onPress={() => handleLecturePress(item)}
      activeOpacity={0.9}
    >
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: item.thumbnailUrl || 'https://via.placeholder.com/300x180?text=No+Image' }}
          style={styles.thumbnail}
          contentFit="cover"
        />
        <View style={styles.durationBadge}>
          <FontAwesome name="clock-o" size={12} color="#FFFFFF" />
          <ThemedText style={styles.durationText}>{formatDuration(item.duration)}</ThemedText>
        </View>
        {completedLectures.has(item._id) && (
          <View style={styles.completedBadge}>
            <FontAwesome name="check" size={12} color="#FFFFFF" />
          </View>
        )}
        {item.isPremium && (
          <View style={styles.premiumBadge}>
            <FontAwesome name="star" size={12} color="#FFD700" />
          </View>
        )}
      </View>
      <View style={styles.lessonInfo}>
        <ThemedText style={styles.lessonTitle}>{item.title}</ThemedText>
        <ThemedText style={styles.lessonDescription} numberOfLines={2}>
          {item.description}
        </ThemedText>
        <View style={styles.lectureMetadata}>
          <View style={styles.difficultyBadge}>
            <ThemedText style={styles.difficultyText}>{item.difficulty}</ThemedText>
          </View>
          <View style={styles.viewsContainer}>
            <FontAwesome name="eye" size={12} color="#666666" />
            <ThemedText style={styles.viewsText}>{item.totalViews} views</ThemedText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <LinearGradient
        colors={['rgba(220, 41, 41, 0.15)', 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 1)', 'rgba(34, 108, 174, 0.15)']}
        locations={[0, 0.25, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />
      
      <ScrollView style={styles.scrollContent}>
        {/* Header */}
        <Header title="Learn English" />
        
        {/* Progress Section */}
        <ThemedView style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <ThemedText style={styles.progressTitle}>Your Progress</ThemedText>
            <ThemedText style={styles.progressStats}>
              {completedLessonsCount}/{totalLessons} lectures completed
            </ThemedText>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${progressPercentage}%` }
              ]} 
            />
          </View>
          
          <View style={styles.progressDetails}>
            <View style={styles.progressDetail}>
              <FontAwesome name="check-circle" size={16} color="#4CAF50" />
              <ThemedText style={styles.progressDetailText}>
                {completedLessonsCount} Completed
              </ThemedText>
            </View>
            <View style={styles.progressDetail}>
              <FontAwesome name="circle-o" size={16} color="#dc2929" />
              <ThemedText style={styles.progressDetailText}>
                {totalLessons - completedLessonsCount} Remaining
              </ThemedText>
            </View>
          </View>
        </ThemedView>
        
        {/* Categories */}
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.selectedCategoryButton
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <ThemedText 
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.selectedCategoryText
                ]}
              >
                {category}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Loading State */}
        {loading && (
          <ThemedView style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#226cae" />
            <ThemedText style={styles.loadingText}>Loading lectures...</ThemedText>
          </ThemedView>
        )}

        {/* Error State */}
        {error && (
          <ThemedView style={styles.errorContainer}>
            <FontAwesome name="exclamation-triangle" size={48} color="#dc2929" />
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <TouchableOpacity style={styles.retryButton} onPress={fetchLectures}>
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}

        {/* Active Lecture (if any) */}
        {activeLecture && (
          <ThemedView style={styles.activeLesson}>
            <View style={styles.activeLessonHeader}>
              <ThemedText style={styles.activeLessonTitle}>
                Now Playing
              </ThemedText>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setActiveLecture(null)}
              >
                <FontAwesome name="times" size={16} color="#666666" />
              </TouchableOpacity>
            </View>
            
            <VideoPlayer
              videoUrl={activeLecture.videoUrl}
              thumbnailUrl={activeLecture.thumbnailUrl}
              onComplete={() => {
                console.log('Video completed');
                // Mark as completed if not already
                if (!completedLectures.has(activeLecture._id)) {
                  setCompletedLectures(prev => new Set([...prev, activeLecture._id]));
                }
              }}
              onError={(error: string) => {
                console.error('Video playback error:', error);
                Alert.alert('Video Error', 'Failed to play video. Please check your internet connection.');
              }}
              style={styles.videoPlayer}
              showControls={true}
              autoPlay={false}
            />
            
            <ThemedText style={styles.activeLessonTitle}>
              {activeLecture.title}
            </ThemedText>
            <ThemedText style={styles.activeLessonDescription}>
              {activeLecture.description}
            </ThemedText>
            {activeLecture.notes && (
              <View style={styles.notesContainer}>
                <View style={styles.notesHeader}>
                  <FontAwesome name="sticky-note" size={16} color="#226cae" />
                  <ThemedText style={styles.notesTitle}>Lecture Notes</ThemedText>
                </View>
                
                {/* Text Content */}
                {activeLecture.notes.textContent && (
                  <ThemedView style={styles.textNotesContainer}>
                    <ThemedText style={styles.notesText}>{activeLecture.notes.textContent}</ThemedText>
                  </ThemedView>
                )}
                
                {/* PDF Notes */}
                {activeLecture.notes.pdfUrl && (
                  <PDFViewer
                    pdfUrl={activeLecture.notes.pdfUrl}
                    title={`Notes for ${activeLecture.title}`}
                    style={styles.pdfViewer}
                    onError={(error: string) => {
                      console.error('PDF error:', error);
                      Alert.alert('PDF Error', 'Failed to open PDF notes. Please try again.');
                    }}
                  />
                )}
              </View>
            )}
            
            <View style={styles.videoControls}>
              <TouchableOpacity style={styles.videoControlButton}>
                <FontAwesome name="step-backward" size={20} color="#666666" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.videoControlButton, styles.playButton]}>
                <FontAwesome name="play" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.videoControlButton}>
                <FontAwesome name="step-forward" size={20} color="#666666" />
              </TouchableOpacity>
            </View>
          </ThemedView>
        )}
        
        {/* Lectures List */}
        {!loading && !error && (
          <>
            <ThemedText style={styles.sectionTitle}>All Lectures</ThemedText>
            <FlatList
              data={filteredLectures}
              renderItem={renderLectureCard}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
              contentContainerStyle={styles.lessonsList}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const { width } = Dimensions.get('window');

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
  progressContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2929',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  progressStats: {
    fontSize: 14,
    color: '#666666',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 15,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#dc2929',
    borderRadius: 5,
  },
  progressDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDetailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
  },
  categoriesContainer: {
    paddingVertical: 15,
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    marginRight: 10,
  },
  selectedCategoryButton: {
    backgroundColor: '#dc2929',
  },
  categoryText: {
    fontSize: 14,
    color: '#666666',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginTop: 10,
    marginBottom: 15,
  },
  lessonsList: {
    paddingBottom: 10,
  },
  lessonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  thumbnailContainer: {
    position: 'relative',
    height: 180,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(34, 108, 174, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
  },
  completedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#dc2929',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonInfo: {
    padding: 15,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 5,
  },
  lessonDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  recommendationsContainer: {
    paddingBottom: 30,
  },
  recommendationCard: {
    width: 160,
    marginRight: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  recommendationThumbnail: {
    width: '100%',
    height: 100,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    padding: 10,
    paddingBottom: 5,
    height: 50,
  },
  recommendationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  recommendationDuration: {
    fontSize: 12,
    color: '#666666',
  },
  activeLesson: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#226cae',
  },
  activeLessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  activeLessonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 5,
  },
  activeLessonDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 15,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayer: {
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
  },
  videoControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  videoControlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 15,
  },
  playButton: {
    backgroundColor: '#dc2929',
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 40,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 40,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2929',
  },
  errorText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#dc2929',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  premiumBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lectureMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  difficultyBadge: {
    backgroundColor: 'rgba(34, 108, 174, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    color: '#226cae',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  viewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewsText: {
    fontSize: 12,
    color: '#666666',
  },
  notesContainer: {
    marginTop: 10,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#226cae',
  },
  textNotesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 108, 174, 0.2)',
  },
  notesText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  pdfViewer: {
    marginTop: 0,
  },
}); 