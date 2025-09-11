import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';

import GameHeader from '../components/GameHeader';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import FeatureAccessWrapper from './components/FeatureAccessWrapper';
import { useFeatureAccess } from './hooks/useFeatureAccess';
import { groupsAPI } from './services/api';

export default function CreateGroupScreen() {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('5');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Feature access control
  const { canAccess: canCreateGroups, featureInfo: groupFeatureInfo } = useFeatureAccess('group_calls');
  
  const handleCreateGroup = async () => {
    // Validate inputs
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a group title');
      return;
    }
    
    if (!topic.trim()) {
      Alert.alert('Error', 'Please enter a discussion topic');
      return;
    }
    
    const participants = parseInt(maxParticipants);
    if (isNaN(participants) || participants < 3 || participants > 10) {
      Alert.alert('Error', 'Number of participants must be between 3 and 10');
      return;
    }
    
    if (isPrivate && !password.trim()) {
      Alert.alert('Error', 'Please enter a password for your private group');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create the group via API
      const groupData = {
        title: title.trim(),
        topic: topic.trim(),
        maxParticipants: participants,
        level,
        isPrivate,
        password: isPrivate ? password.trim() : undefined
      };
      
      const response = await groupsAPI.createGroup(groupData);
      
      if (response.success) {
        // Navigate to the waiting room with the created group
        // @ts-ignore
        navigation.navigate('GroupWaitingRoom', {
          groupInfo: {
            title,
            topic,
            maxParticipants: participants,
            level,
            isPrivate,
            password: isPrivate ? password : null
          },
          groupId: response.data.groupId,
          participants: response.data.participants
        });
      } else {
        Alert.alert('Error', response.message || 'Failed to create group');
      }
    } catch (error: any) {
      console.error('Create group error:', error);
      Alert.alert('Error', error.message || 'Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(220, 41, 41, 0.15)', 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 1)', 'rgba(34, 108, 174, 0.15)']}
        locations={[0, 0.25, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />
      
      <GameHeader title="Create Group Discussion" showBackButton onBackPress={() => navigation.goBack()} />
      
      <FeatureAccessWrapper
        featureKey="group_calls"
        fallback={null}
        style={styles.container}
        navigation={navigation}
      >
      <ScrollView style={styles.contentContainer} contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.formCard}>
          <View style={styles.formSection}>
            <ThemedText style={styles.sectionTitle}>Group Information</ThemedText>
            
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Group Title</ThemedText>
              <TextInput
                style={styles.textInput}
                placeholder="Enter a title for your group"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor="#999999"
                maxLength={50}
              />
              <ThemedText style={styles.characterCount}>{title.length}/50</ThemedText>
            </View>
            
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Discussion Topic</ThemedText>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="What will your group discuss?"
                value={topic}
                onChangeText={setTopic}
                placeholderTextColor="#999999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={200}
              />
              <ThemedText style={styles.characterCount}>{topic.length}/200</ThemedText>
            </View>
            
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Number of Participants (3-10)</ThemedText>
              <View style={styles.participantsSelector}>
                <TouchableOpacity 
                  style={styles.participantButton}
                  onPress={() => {
                    const current = parseInt(maxParticipants);
                    if (!isNaN(current) && current > 3) {
                      setMaxParticipants((current - 1).toString());
                    }
                  }}
                >
                  <FontAwesome name="minus" size={16} color="#666666" />
                </TouchableOpacity>
                <TextInput
                  style={styles.participantInput}
                  value={maxParticipants}
                  onChangeText={(text) => {
                    const num = parseInt(text);
                    if (!isNaN(num) && num >= 3 && num <= 10) {
                      setMaxParticipants(text);
                    } else if (text === '') {
                      setMaxParticipants('');
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <TouchableOpacity 
                  style={styles.participantButton}
                  onPress={() => {
                    const current = parseInt(maxParticipants);
                    if (!isNaN(current) && current < 10) {
                      setMaxParticipants((current + 1).toString());
                    }
                  }}
                >
                  <FontAwesome name="plus" size={16} color="#666666" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          <View style={styles.formSection}>
            <ThemedText style={styles.sectionTitle}>Group Settings</ThemedText>
            
            <ThemedText style={styles.inputLabel}>Proficiency Level</ThemedText>
            <View style={styles.levelSelector}>
              <TouchableOpacity 
                style={[styles.levelButton, level === 'beginner' && styles.selectedLevelButton]}
                onPress={() => setLevel('beginner')}
              >
                <ThemedText style={[styles.levelButtonText, level === 'beginner' && styles.selectedLevelButtonText]}>
                  Beginner
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.levelButton, level === 'intermediate' && styles.selectedLevelButton]}
                onPress={() => setLevel('intermediate')}
              >
                <ThemedText style={[styles.levelButtonText, level === 'intermediate' && styles.selectedLevelButtonText]}>
                  Intermediate
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.levelButton, level === 'advanced' && styles.selectedLevelButton]}
                onPress={() => setLevel('advanced')}
              >
                <ThemedText style={[styles.levelButtonText, level === 'advanced' && styles.selectedLevelButtonText]}>
                  Advanced
                </ThemedText>
              </TouchableOpacity>
            </View>
            
            <View style={styles.switchContainer}>
              <View style={styles.switchLabel}>
                <ThemedText style={styles.switchText}>Private Group</ThemedText>
                <ThemedText style={styles.switchSubtext}>Require a password to join</ThemedText>
              </View>
              <Switch
                value={isPrivate}
                onValueChange={setIsPrivate}
                trackColor={{ false: '#D1D1D1', true: 'rgba(34, 108, 174, 0.4)' }}
                thumbColor={isPrivate ? '#226cae' : '#F4F3F4'}
              />
            </View>
            
            {isPrivate && (
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Group Password</ThemedText>
                <TextInput
                  style={styles.textInput}
                  placeholder="Create a password"
                  value={password}
                  onChangeText={setPassword}
                  placeholderTextColor="#999999"
                  secureTextEntry
                />
              </View>
            )}
          </View>
        </ThemedView>
        
        <View style={styles.infoCard}>
          <FontAwesome name="info-circle" size={20} color="#226cae" style={styles.infoIcon} />
          <ThemedText style={styles.infoText}>
            Group discussions are a great way to practice your language skills with others.
            You'll be the host of this group and can start the discussion once at least 2 other participants join.
          </ThemedText>
        </View>
      </ScrollView>
      </FeatureAccessWrapper>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.createButton, loading && styles.disabledButton]} 
          onPress={handleCreateGroup}
          disabled={loading}
        >
          {loading ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <ThemedText style={styles.createButtonText}>Creating...</ThemedText>
            </>
          ) : (
            <>
              <ThemedText style={styles.createButtonText}>Create Group</ThemedText>
              <FontAwesome name="arrow-right" size={16} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#226cae',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  textArea: {
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
    marginTop: 4,
  },
  participantsSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantButton: {
    width: 40,
    height: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  participantInput: {
    width: 60,
    height: 40,
    backgroundColor: '#F5F5F5',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    color: '#333333',
  },
  levelSelector: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  levelButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  selectedLevelButton: {
    backgroundColor: 'rgba(34, 108, 174, 0.1)',
    borderColor: '#226cae',
  },
  levelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  selectedLevelButtonText: {
    color: '#226cae',
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    flex: 1,
  },
  switchText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  switchSubtext: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: 'rgba(34, 108, 174, 0.05)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#226cae',
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#333333',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  createButton: {
    backgroundColor: '#226cae',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
}); 