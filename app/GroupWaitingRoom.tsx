import { FontAwesome } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import GameHeader from '../components/GameHeader';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { groupsAPI } from './services/api';

// Define the types for route params
interface GroupInfo {
  title: string;
  topic: string;
  maxParticipants: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  isPrivate: boolean;
  password: string | null;
}

interface RouteParams {
  groupInfo: GroupInfo;
  groupId?: string;
  sessionType?: 'chat' | 'voice' | 'video';
}

// Mock participant data
const mockParticipants = [
  { id: '1', name: 'You (Host)', avatar: null, isHost: true, isReady: true },
  { id: '2', name: 'Sarah Johnson', avatar: null, isHost: false, isReady: false },
  { id: '3', name: 'Michael Brown', avatar: null, isHost: false, isReady: true },
];

export default function GroupWaitingRoom() {
  const navigation = useNavigation();
  const route = useRoute();
  const { groupInfo, groupId, sessionType = 'chat' } = (route.params as RouteParams) || { groupInfo: null };
  
  const [participants, setParticipants] = useState(mockParticipants);
  const [isGroupCodeCopied, setIsGroupCodeCopied] = useState(false);
  const [timeWaiting, setTimeWaiting] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupDetails, setGroupDetails] = useState<any | null>(null);
  
  // Load group details and participants from backend
  const loadGroupDetails = async () => {
    if (!groupId) {
      setError('Group ID is required');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await groupsAPI.getGroupDetails(groupId);
      const group = response.data;
      
      setGroupDetails(group);
      
      // Transform backend participants to frontend format
      const backendParticipants = group.participants.map((p: any) => ({
        id: p.user._id || p.user,
        name: p.user.name || 'Unknown',
        avatar: p.user.profilePicture || null,
        isHost: p.role === 'host',
        isReady: p.isActive // Use isActive as ready status
      }));
      
      setParticipants(backendParticipants);
    } catch (err: any) {
      console.error('Error loading group details:', err);
      setError(err.message || 'Failed to load group details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroupDetails();
    
    // Set up polling to refresh group details every 5 seconds
    const interval = setInterval(loadGroupDetails, 5000);
    
    return () => clearInterval(interval);
  }, [groupId]);
  
  const handleCopyCode = () => {
    setIsGroupCodeCopied(true);
    setTimeout(() => setIsGroupCodeCopied(false), 2000);
  };
  
  const handleStartDiscussion = async (mode: 'chat' | 'voice' | 'video' = 'chat') => {
    const readyParticipants = participants.filter(p => p.isReady);
    
    if (readyParticipants.length < 2) {
      Alert.alert(
        'Not Enough Participants',
        'You need at least 2 ready participants to start the discussion.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      if (mode !== 'chat') {
        // Start voice/video session via backend
        await groupsAPI.startSession(groupId, mode);
      }
      
      // Navigate to the appropriate screen based on mode
      if (mode === 'chat') {
        // @ts-ignore
        navigation.navigate('GroupChatScreen', { 
          groupInfo, 
          participants: readyParticipants,
          groupId
        });
      } else if (mode === 'voice') {
        // @ts-ignore
        navigation.navigate('GroupVideoCallScreen', { 
          groupInfo, 
          participants: readyParticipants,
          groupId,
          isVoiceOnly: true
        });
      } else if (mode === 'video') {
        // @ts-ignore
        navigation.navigate('GroupVideoCallScreen', { 
          groupInfo, 
          participants: readyParticipants,
          groupId
        });
      }
    } catch (error: any) {
      console.error('Error starting session:', error);
      Alert.alert('Error', error.message || 'Failed to start session');
    }
  };
  
  const handleLeaveGroup = () => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group? As the host, the group will be disbanded.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };
  
  if (!groupInfo && !groupId) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ThemedText>Invalid group information</ThemedText>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(220, 41, 41, 0.2)', 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 1)', 'rgba(34, 108, 174, 0.1)']}
          locations={[0, 0.25, 0.75, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        />
        <GameHeader title="Waiting Room" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color="#dc2929" />
          <ThemedText style={styles.loadingText}>Loading group details...</ThemedText>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(220, 41, 41, 0.2)', 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 1)', 'rgba(34, 108, 174, 0.1)']}
          locations={[0, 0.25, 0.75, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        />
        <GameHeader title="Waiting Room" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={[styles.container, styles.centerContent]}>
          <FontAwesome name="exclamation-triangle" size={50} color="#dc2929" />
          <ThemedText style={styles.errorText}>Error Loading Group</ThemedText>
          <ThemedText style={styles.errorSubtext}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={loadGroupDetails}>
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  const readyCount = participants.filter(p => p.isReady).length;
  const canStart = readyCount >= 3;
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(220, 41, 41, 0.2)', 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 1)', 'rgba(34, 108, 174, 0.1)']}
        locations={[0, 0.25, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />
      
      <GameHeader title="Waiting Room" showBackButton onBackPress={handleLeaveGroup} />
      
      <ScrollView style={styles.contentContainer} contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.groupInfoCard}>
          <ThemedText style={styles.groupTitle}>{groupInfo.title}</ThemedText>
          <View style={styles.groupMeta}>
            <View style={[styles.levelBadge, 
              groupInfo.level === 'beginner' ? styles.beginnerBadge : 
              groupInfo.level === 'intermediate' ? styles.intermediateBadge : 
              styles.advancedBadge
            ]}>
              <ThemedText style={styles.levelText}>
                {groupInfo.level.charAt(0).toUpperCase() + groupInfo.level.slice(1)}
              </ThemedText>
            </View>
            {groupInfo.isPrivate && (
              <View style={styles.privateBadge}>
                <FontAwesome name="lock" size={12} color="#dc2929" />
                <ThemedText style={styles.privateText}>Private</ThemedText>
              </View>
            )}
          </View>
          
          <View style={styles.topicContainer}>
            <ThemedText style={styles.topicLabel}>Discussion Topic:</ThemedText>
            <ThemedText style={styles.topicText}>{groupInfo.topic}</ThemedText>
          </View>
        </ThemedView>
        
        <ThemedView style={styles.shareCard}>
          <View style={styles.shareHeader}>
            <ThemedText style={styles.shareTitle}>Share Group Code</ThemedText>
            <ThemedText style={styles.shareSubtitle}>Invite others to join your discussion</ThemedText>
          </View>
          
          <View style={styles.codeContainer}>
            <ThemedText style={styles.groupCode}>
              {groupDetails?.groupSession?.joinCode || 'Loading...'}
            </ThemedText>
            <TouchableOpacity 
              style={styles.copyButton}
              onPress={handleCopyCode}
            >
              <FontAwesome name={isGroupCodeCopied ? "check" : "copy"} size={16} color="#FFFFFF" />
              <ThemedText style={styles.copyButtonText}>
                {isGroupCodeCopied ? "Copied!" : "Copy"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
        
        <ThemedView style={styles.participantsCard}>
          <View style={styles.participantsHeader}>
            <ThemedText style={styles.participantsTitle}>
              Participants ({participants.length}/{groupDetails?.groupSession?.maxParticipants || groupInfo?.maxParticipants || 5})
            </ThemedText>
            <ThemedText style={styles.readyText}>
              {readyCount} ready
            </ThemedText>
          </View>
          
          <View style={styles.participantsList}>
            {participants.map((participant) => (
              <View key={participant.id} style={styles.participantItem}>
                <View style={styles.participantInfo}>
                  <View style={styles.avatarCircle}>
                    <FontAwesome name="user" size={16} color="#FFFFFF" />
                  </View>
                  <View>
                    <ThemedText style={styles.participantName}>
                      {participant.name}
                      {participant.isHost && <ThemedText style={styles.hostBadge}> (Host)</ThemedText>}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.participantStatus}>
                  {participant.isReady ? (
                    <View style={styles.readyBadge}>
                      <FontAwesome name="check" size={12} color="#FFFFFF" />
                      <ThemedText style={styles.readyBadgeText}>Ready</ThemedText>
                    </View>
                  ) : (
                    <View style={styles.waitingBadge}>
                      <ActivityIndicator size="small" color="#dc2929" />
                      <ThemedText style={styles.waitingBadgeText}>Waiting</ThemedText>
                    </View>
                  )}
                </View>
              </View>
            ))}
            
            {/* Empty slots */}
            {Array.from({ length: (groupDetails?.groupSession?.maxParticipants || groupInfo?.maxParticipants || 5) - participants.length }).map((_, index) => (
              <View key={`empty-${index}`} style={styles.emptyParticipantItem}>
                <View style={styles.participantInfo}>
                  <View style={styles.emptyAvatarCircle}>
                    <FontAwesome name="user" size={16} color="#CCCCCC" />
                  </View>
                  <ThemedText style={styles.emptyParticipantText}>Waiting for participant...</ThemedText>
                </View>
              </View>
            ))}
          </View>
        </ThemedView>
        
        <View style={styles.infoCard}>
          <FontAwesome name="info-circle" size={20} color="#dc2929" style={styles.infoIcon} />
          <ThemedText style={styles.infoText}>
            As the host, you can start the discussion when at least 3 participants (including you) are ready.
          </ThemedText>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        {canStart ? (
          <View style={styles.communicationOptions}>
            <ThemedText style={styles.communicationTitle}>Choose Communication Method:</ThemedText>
            <View style={styles.communicationButtons}>
              <TouchableOpacity 
                style={[styles.communicationButton, styles.chatButton]}
                onPress={() => handleStartDiscussion('chat')}
              >
                <FontAwesome name="comments" size={20} color="#FFFFFF" />
                <ThemedText style={styles.communicationButtonText}>Chat</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.communicationButton, styles.voiceButton]}
                onPress={() => handleStartDiscussion('voice')}
              >
                <FontAwesome name="phone" size={20} color="#FFFFFF" />
                <ThemedText style={styles.communicationButtonText}>Voice</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.communicationButton, styles.videoButton]}
                onPress={() => handleStartDiscussion('video')}
              >
                <FontAwesome name="video-camera" size={20} color="#FFFFFF" />
                <ThemedText style={styles.communicationButtonText}>Video</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.startButton, styles.disabledButton]}
            disabled={true}
          >
            <ThemedText style={styles.startButtonText}>
              Need {3 - readyCount} more ready
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dc2929',
    marginTop: 12,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#226cae',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
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
  backButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#dc2929',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  groupInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#dc2929',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2929',
    borderWidth: 1,
    borderColor: 'rgba(220, 41, 41, 0.1)',
  },
  groupTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  beginnerBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  intermediateBadge: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
  },
  advancedBadge: {
    backgroundColor: 'rgba(220, 41, 41, 0.1)',
  },
  levelText: {
    fontSize: 12,
    fontWeight: '500',
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 41, 41, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  privateText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#dc2929',
    marginLeft: 4,
  },
  topicContainer: {
    backgroundColor: 'rgba(220, 41, 41, 0.08)',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#dc2929',
  },
  topicLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2929',
    marginBottom: 4,
  },
  topicText: {
    fontSize: 16,
    color: '#333333',
  },
  shareCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#dc2929',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#dc2929',
    borderWidth: 1,
    borderColor: 'rgba(220, 41, 41, 0.1)',
  },
  shareHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  shareTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#dc2929',
    marginBottom: 4,
  },
  shareSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 41, 41, 0.08)',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(220, 41, 41, 0.2)',
  },
  groupCode: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#dc2929',
    textAlign: 'center',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2929',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  participantsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#dc2929',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2929',
    borderWidth: 1,
    borderColor: 'rgba(220, 41, 41, 0.1)',
  },
  participantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  participantsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#dc2929',
  },
  readyText: {
    fontSize: 14,
    color: '#666666',
  },
  participantsList: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  emptyParticipantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    opacity: 0.5,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dc2929',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emptyAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantName: {
    fontSize: 16,
    color: '#333333',
  },
  hostBadge: {
    color: '#dc2929',
    fontWeight: '700',
  },
  emptyParticipantText: {
    fontSize: 16,
    color: '#999999',
    fontStyle: 'italic',
  },
  participantStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  readyBadgeText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 4,
  },
  waitingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 41, 41, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  waitingBadgeText: {
    color: '#dc2929',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: 'rgba(220, 41, 41, 0.08)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#dc2929',
    borderWidth: 1,
    borderColor: 'rgba(220, 41, 41, 0.2)',
    shadowColor: '#dc2929',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  startButton: {
    backgroundColor: '#dc2929',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  communicationOptions: {
    alignItems: 'center',
  },
  communicationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc2929',
    marginBottom: 16,
    textAlign: 'center',
  },
  communicationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
  },
  communicationButton: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  chatButton: {
    backgroundColor: '#dc2929',
  },
  voiceButton: {
    backgroundColor: '#226cae',
  },
  videoButton: {
    backgroundColor: '#dc2929',
  },
  communicationButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
}); 