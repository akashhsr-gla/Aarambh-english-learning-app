import { StyleSheet, View, TouchableOpacity, ScrollView, FlatList, Dimensions } from 'react-native';
import { useState, useRef } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';

import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import Header from '../components/Header';

// Define lesson type
interface Lesson {
  id: number;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  completed: boolean;
}

// Sample lesson data
const LESSONS: Lesson[] = [
  {
    id: 1,
    title: 'Introduction to English',
    description: 'Learn the basics of English language and pronunciation',
    duration: '10 min',
    thumbnail: 'https://i.imgur.com/JR0s5QW.jpg',
    completed: true,
  },
  {
    id: 2,
    title: 'Basic Greetings',
    description: 'Common greetings and introductions in English',
    duration: '8 min',
    thumbnail: 'https://i.imgur.com/KzVPU3L.jpg',
    completed: true,
  },
  {
    id: 3,
    title: 'Everyday Conversations',
    description: 'How to handle daily conversations in English',
    duration: '15 min',
    thumbnail: 'https://i.imgur.com/qJ9xSAS.jpg',
    completed: false,
  },
  {
    id: 4,
    title: 'Shopping Vocabulary',
    description: 'Essential words and phrases for shopping',
    duration: '12 min',
    thumbnail: 'https://i.imgur.com/LY0qiQZ.jpg',
    completed: false,
  },
  {
    id: 5,
    title: 'Asking for Directions',
    description: 'How to ask for and understand directions',
    duration: '9 min',
    thumbnail: 'https://i.imgur.com/fR8yZMJ.jpg',
    completed: false,
  },
  {
    id: 6,
    title: 'At the Restaurant',
    description: 'Ordering food and having conversations at restaurants',
    duration: '14 min',
    thumbnail: 'https://i.imgur.com/D5mWANZ.jpg',
    completed: false,
  },
  {
    id: 7,
    title: 'Travel Conversations',
    description: 'Essential phrases for traveling in English-speaking countries',
    duration: '18 min',
    thumbnail: 'https://i.imgur.com/H8R3riY.jpg',
    completed: false,
  },
];

// Categories
const CATEGORIES = [
  'All Lessons',
  'Beginner',
  'Intermediate',
  'Advanced',
  'Speaking',
  'Listening',
];

export default function LearnScreen() {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState('All Lessons');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  
  // Calculate progress
  const completedLessons = LESSONS.filter(lesson => lesson.completed).length;
  const totalLessons = LESSONS.length;
  const progressPercentage = (completedLessons / totalLessons) * 100;
  
  const handleLessonPress = (lesson: Lesson) => {
    setActiveLesson(lesson);
    // In a real app, you would navigate to a video player screen
    // navigation.navigate('VideoPlayerScreen', { lesson });
  };
  
  const renderLessonCard = ({ item }: { item: Lesson }) => (
    <TouchableOpacity 
      style={styles.lessonCard}
      onPress={() => handleLessonPress(item)}
      activeOpacity={0.9}
    >
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: item.thumbnail }}
          style={styles.thumbnail}
          contentFit="cover"
        />
        <View style={styles.durationBadge}>
          <FontAwesome name="clock-o" size={12} color="#FFFFFF" />
          <ThemedText style={styles.durationText}>{item.duration}</ThemedText>
        </View>
        {item.completed && (
          <View style={styles.completedBadge}>
            <FontAwesome name="check" size={12} color="#FFFFFF" />
          </View>
        )}
      </View>
      <View style={styles.lessonInfo}>
        <ThemedText style={styles.lessonTitle}>{item.title}</ThemedText>
        <ThemedText style={styles.lessonDescription} numberOfLines={2}>
          {item.description}
        </ThemedText>
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
              {completedLessons}/{totalLessons} lessons completed
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
                {completedLessons} Completed
              </ThemedText>
            </View>
            <View style={styles.progressDetail}>
              <FontAwesome name="circle-o" size={16} color="#dc2929" />
              <ThemedText style={styles.progressDetailText}>
                {totalLessons - completedLessons} Remaining
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
        
        {/* Active Lesson (if any) */}
        {activeLesson && (
          <ThemedView style={styles.activeLesson}>
            <View style={styles.activeLessonHeader}>
              <ThemedText style={styles.activeLessonTitle}>
                Now Playing
              </ThemedText>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setActiveLesson(null)}
              >
                <FontAwesome name="times" size={16} color="#666666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.videoPreview}>
              <Image
                source={{ uri: activeLesson.thumbnail }}
                style={styles.videoThumbnail}
                contentFit="cover"
              />
              <View style={styles.playButtonOverlay}>
                <FontAwesome name="play" size={30} color="#FFFFFF" />
              </View>
            </View>
            
            <ThemedText style={styles.activeLessonTitle}>
              {activeLesson.title}
            </ThemedText>
            <ThemedText style={styles.activeLessonDescription}>
              {activeLesson.description}
            </ThemedText>
            
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
        
        {/* Lessons List */}
        <ThemedText style={styles.sectionTitle}>All Lessons</ThemedText>
        <FlatList
          data={LESSONS}
          renderItem={renderLessonCard}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          contentContainerStyle={styles.lessonsList}
        />
        
        {/* Recommendations */}
        <ThemedText style={styles.sectionTitle}>Recommended for You</ThemedText>
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recommendationsContainer}
        >
          {LESSONS.slice(0, 3).map((lesson) => (
            <TouchableOpacity 
              key={lesson.id}
              style={styles.recommendationCard}
              onPress={() => handleLessonPress(lesson)}
            >
              <Image
                source={{ uri: lesson.thumbnail }}
                style={styles.recommendationThumbnail}
                contentFit="cover"
              />
              <ThemedText style={styles.recommendationTitle} numberOfLines={2}>
                {lesson.title}
              </ThemedText>
              <View style={styles.recommendationMeta}>
                <ThemedText style={styles.recommendationDuration}>
                  {lesson.duration}
                </ThemedText>
                {lesson.completed && (
                  <FontAwesome name="check-circle" size={14} color="#4CAF50" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
  videoPreview: {
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15,
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
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
}); 