import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';

import GameHeader from '../components/GameHeader';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import FeatureAccessWrapper from './components/FeatureAccessWrapper';
import { useFeatureAccess } from './hooks/useFeatureAccess';
import { groupsAPI } from './services/api';

interface GroupCreationData {
  title: string;
  topic: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  maxParticipants: number;
  isPrivate: boolean;
  password: string;
  allowVideo: boolean;
  allowVoice: boolean;
  allowChat: boolean;
}

export default function GroupCreationScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<GroupCreationData>({
    title: '',
    topic: '',
    description: '',
    level: 'beginner',
    maxParticipants: 5,
    isPrivate: false,
    password: '',
    allowVideo: true,
    allowVoice: true,
    allowChat: true,
  });

  const [errors, setErrors] = useState<{[K in keyof GroupCreationData]?: string}>({});
  
  // Feature access control
  const { canAccess: canCreateGroups, featureInfo: groupFeatureInfo } = useFeatureAccess('group_calls');

  const validateForm = (): boolean => {
    const newErrors: {[K in keyof GroupCreationData]?: string} = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Group title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!formData.topic.trim()) {
      newErrors.topic = 'Discussion topic is required';
    } else if (formData.topic.length < 5) {
      newErrors.topic = 'Topic must be at least 5 characters';
    }

    if (formData.isPrivate && !formData.password.trim()) {
      newErrors.password = 'Password is required for private groups';
    } else if (formData.isPrivate && formData.password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters';
    }

    if (formData.maxParticipants < 2 || formData.maxParticipants > 50) {
      newErrors.maxParticipants = 'Max participants must be between 2 and 50';
    }

    if (!formData.allowVideo && !formData.allowVoice && !formData.allowChat) {
      newErrors.allowVideo = 'At least one communication method must be enabled';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateGroup = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const groupData = {
        title: formData.title.trim(),
        topic: formData.topic.trim(),
        description: formData.description.trim(),
        level: formData.level,
        maxParticipants: formData.maxParticipants,
        isPrivate: formData.isPrivate,
        password: formData.isPrivate ? formData.password.trim() : null,
        settings: {
          allowVideo: formData.allowVideo,
          allowVoice: formData.allowVoice,
          allowChat: formData.allowChat,
        }
      };

      const response = await groupsAPI.createGroup(groupData);
      
      if (response.success) {
        Alert.alert(
          'Group Created!',
          'Your group has been created successfully. You can now invite others to join.',
          [
            {
              text: 'Go to Waiting Room',
              onPress: () => {
                // @ts-ignore
                navigation.navigate('GroupWaitingRoom', {
                  groupInfo: {
                    title: formData.title,
                    topic: formData.topic,
                    maxParticipants: formData.maxParticipants,
                    level: formData.level,
                    isPrivate: formData.isPrivate,
                    password: formData.isPrivate ? formData.password : null,
                  },
                  groupId: response.data.groupId,
                  isHost: true
                });
              }
            },
            {
              text: 'Create Another',
              style: 'cancel',
              onPress: () => {
                setFormData({
                  title: '',
                  topic: '',
                  description: '',
                  level: 'beginner',
                  maxParticipants: 5,
                  isPrivate: false,
                  password: '',
                  allowVideo: true,
                  allowVoice: true,
                  allowChat: true,
                });
                setErrors({});
              }
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Error creating group:', error);
      Alert.alert('Error', error.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof GroupCreationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(220, 41, 41, 0.2)', 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 1)', 'rgba(34, 108, 174, 0.15)']}
        locations={[0, 0.25, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />
      
      <GameHeader 
        title="Create Group" 
        showBackButton 
        onBackPress={() => navigation.goBack()} 
      />
      
      <FeatureAccessWrapper
        featureKey="group_calls"
        fallback={null}
        style={styles.container}
        navigation={navigation}
      >
        <ScrollView 
          style={styles.contentContainer} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
          decelerationRate="fast"
        >
          <ThemedView style={styles.formCard}>
          <ThemedText style={styles.sectionTitle}>Group Information</ThemedText>
          
          {/* Group Title */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Group Title *</ThemedText>
            <TextInput
              style={[styles.textInput, errors.title && styles.inputError]}
              placeholder="Enter group title..."
              value={formData.title}
              onChangeText={(text) => updateFormData('title', text)}
              placeholderTextColor="#999999"
            />
            {errors.title && <ThemedText style={styles.errorText}>{errors.title}</ThemedText>}
          </View>

          {/* Discussion Topic */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Discussion Topic *</ThemedText>
            <TextInput
              style={[styles.textInput, errors.topic && styles.inputError]}
              placeholder="What will you discuss in this group?"
              value={formData.topic}
              onChangeText={(text) => updateFormData('topic', text)}
              placeholderTextColor="#999999"
              multiline
              numberOfLines={3}
            />
            {errors.topic && <ThemedText style={styles.errorText}>{errors.topic}</ThemedText>}
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Description (Optional)</ThemedText>
            <TextInput
              style={styles.textInput}
              placeholder="Add a description for your group..."
              value={formData.description}
              onChangeText={(text) => updateFormData('description', text)}
              placeholderTextColor="#999999"
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Level Selection */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Language Level *</ThemedText>
            <View style={styles.levelContainer}>
              {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.levelButton,
                    formData.level === level && styles.activeLevelButton
                  ]}
                  onPress={() => updateFormData('level', level)}
                >
                  <ThemedText style={[
                    styles.levelButtonText,
                    formData.level === level && styles.activeLevelButtonText
                  ]}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Max Participants */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Maximum Participants *</ThemedText>
            <View style={styles.participantsContainer}>
              <TouchableOpacity
                style={styles.participantButton}
                onPress={() => updateFormData('maxParticipants', Math.max(2, formData.maxParticipants - 1))}
              >
                <FontAwesome name="minus" size={16} color="#dc2929" />
              </TouchableOpacity>
              <ThemedText style={styles.participantCount}>{formData.maxParticipants}</ThemedText>
              <TouchableOpacity
                style={styles.participantButton}
                onPress={() => updateFormData('maxParticipants', Math.min(50, formData.maxParticipants + 1))}
              >
                <FontAwesome name="plus" size={16} color="#dc2929" />
              </TouchableOpacity>
            </View>
            {errors.maxParticipants && <ThemedText style={styles.errorText}>{errors.maxParticipants}</ThemedText>}
          </View>
        </ThemedView>

        <ThemedView style={styles.formCard}>
          <ThemedText style={styles.sectionTitle}>Privacy Settings</ThemedText>
          
          {/* Private Group Toggle */}
          <View style={styles.toggleContainer}>
            <View style={styles.toggleInfo}>
              <ThemedText style={styles.toggleLabel}>Private Group</ThemedText>
              <ThemedText style={styles.toggleDescription}>
                Only people with the password can join
              </ThemedText>
            </View>
            <Switch
              value={formData.isPrivate}
              onValueChange={(value) => updateFormData('isPrivate', value)}
              trackColor={{ false: '#E0E0E0', true: '#dc2929' }}
              thumbColor={formData.isPrivate ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          {/* Password Input */}
          {formData.isPrivate && (
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Group Password *</ThemedText>
              <TextInput
                style={[styles.textInput, errors.password && styles.inputError]}
                placeholder="Enter group password..."
                value={formData.password}
                onChangeText={(text) => updateFormData('password', text)}
                placeholderTextColor="#999999"
                secureTextEntry
              />
              {errors.password && <ThemedText style={styles.errorText}>{errors.password}</ThemedText>}
            </View>
          )}
        </ThemedView>

        <ThemedView style={styles.formCard}>
          <ThemedText style={styles.sectionTitle}>Communication Options</ThemedText>
          
          {/* Video Toggle */}
          <View style={styles.toggleContainer}>
            <View style={styles.toggleInfo}>
              <FontAwesome name="video-camera" size={20} color="#dc2929" style={styles.toggleIcon} />
              <View>
                <ThemedText style={styles.toggleLabel}>Video Calls</ThemedText>
                <ThemedText style={styles.toggleDescription}>
                  Allow video communication in this group
                </ThemedText>
              </View>
            </View>
            <Switch
              value={formData.allowVideo}
              onValueChange={(value) => updateFormData('allowVideo', value)}
              trackColor={{ false: '#E0E0E0', true: '#dc2929' }}
              thumbColor={formData.allowVideo ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          {/* Voice Toggle */}
          <View style={styles.toggleContainer}>
            <View style={styles.toggleInfo}>
              <FontAwesome name="phone" size={20} color="#226cae" style={styles.toggleIcon} />
              <View>
                <ThemedText style={styles.toggleLabel}>Voice Calls</ThemedText>
                <ThemedText style={styles.toggleDescription}>
                  Allow voice communication in this group
                </ThemedText>
              </View>
            </View>
            <Switch
              value={formData.allowVoice}
              onValueChange={(value) => updateFormData('allowVoice', value)}
              trackColor={{ false: '#E0E0E0', true: '#226cae' }}
              thumbColor={formData.allowVoice ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          {/* Chat Toggle */}
          <View style={styles.toggleContainer}>
            <View style={styles.toggleInfo}>
              <FontAwesome name="comments" size={20} color="#4CAF50" style={styles.toggleIcon} />
              <View>
                <ThemedText style={styles.toggleLabel}>Text Chat</ThemedText>
                <ThemedText style={styles.toggleDescription}>
                  Allow text messaging in this group
                </ThemedText>
              </View>
            </View>
            <Switch
              value={formData.allowChat}
              onValueChange={(value) => updateFormData('allowChat', value)}
              trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
              thumbColor={formData.allowChat ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          {errors.allowVideo && <ThemedText style={styles.errorText}>{errors.allowVideo}</ThemedText>}
        </ThemedView>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, loading && styles.disabledButton]}
          onPress={handleCreateGroup}
          disabled={loading}
        >
          <FontAwesome name="plus" size={20} color="#FFFFFF" />
          <ThemedText style={styles.createButtonText}>
            {loading ? 'Creating Group...' : 'Create Group'}
          </ThemedText>
        </TouchableOpacity>
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
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#dc2929',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2929',
    borderWidth: 1,
    borderColor: 'rgba(220, 41, 41, 0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#dc2929',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#dc2929',
    backgroundColor: 'rgba(220, 41, 41, 0.05)',
  },
  errorText: {
    fontSize: 12,
    color: '#dc2929',
    marginTop: 4,
  },
  levelContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  levelButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  activeLevelButton: {
    backgroundColor: '#dc2929',
    borderColor: '#dc2929',
  },
  levelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  activeLevelButtonText: {
    color: '#FFFFFF',
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  participantButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(220, 41, 41, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantCount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#dc2929',
    minWidth: 40,
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleIcon: {
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 12,
    color: '#666666',
  },
  createButton: {
    backgroundColor: '#dc2929',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#dc2929',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
