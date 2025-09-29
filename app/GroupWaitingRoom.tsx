import { FontAwesome } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

// Work around TS JSX typing mismatch for expo-linear-gradient in some setups
const Gradient = (LinearGradient as unknown) as React.ComponentType<any>;

import GameHeader from '../components/GameHeader';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import FeatureAccessWrapper from './components/FeatureAccessWrapper';
import { useFeatureAccess } from './hooks/useFeatureAccess';
import { authAPI, groupsAPI } from './services/api';

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
  
  const [participants, setParticipants] = useState<Array<{
    id: string;
    name: string;
    avatar: string | null;
    isHost: boolean;
    isReady: boolean;
  }>>([]);
  const [isGroupCodeCopied, setIsGroupCodeCopied] = useState(false);
  const [timeWaiting, setTimeWaiting] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupDetails, setGroupDetails] = useState<any | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);

  // Feature access control
  const { canAccess: canAccessGroupCalls, featureInfo: groupFeatureInfo } = useFeatureAccess('group_calls');
  const [isMuted, setIsMuted] = useState(false);
  const [hasVideo, setHasVideo] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  
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
      
      
      // Check if current user is the host
      try {
        const currentUser = await authAPI.getCurrentUser();
        
        // Try different possible response structures
        let currentUserId = null;
        if (currentUser.data?.user?._id) {
          currentUserId = currentUser.data.user._id;
        } else if (currentUser.data?._id) {
          currentUserId = currentUser.data._id;
        } else if (currentUser._id) {
          currentUserId = currentUser._id;
        }
        
        console.log('🔍 Current user ID:', currentUserId);
        
        if (currentUserId) {
          // First try to match with participants (backend flattens user data)
          const userIsHost = group.participants.some((p: any) => {
            const participantUserId = p.id || p._id;
            console.log('🔍 Comparing participant ID:', participantUserId, 'with current user ID:', currentUserId);
            return participantUserId && participantUserId.toString() === currentUserId.toString() && p.role === 'host';
          });
          
          // If not found in participants, check if user is the group host
          const isGroupHost = group.host && group.host.id && group.host.id.toString() === currentUserId.toString();
          console.log('🔍 Group host object:', group.host);
          console.log('🔍 Group host ID:', group.host?.id);
          console.log('🔍 Current user ID:', currentUserId);
          console.log('🔍 Is group host match:', isGroupHost);
          
          const finalIsHost = userIsHost || isGroupHost;
          setIsHost(finalIsHost);
          console.log('🔍 User is host (participant):', userIsHost);
          console.log('🔍 User is group host:', isGroupHost);
          console.log('🔍 Final isHost:', finalIsHost);
        } else {
          console.log('🔍 No user ID found, assuming not host');
          setIsHost(false);
        }
      } catch (err) {
        console.error('Error getting current user:', err);
        setIsHost(false);
      }
      
      // Transform backend participants to frontend format
      // The backend already flattens the user data, so we can access it directly
      const backendParticipants = (group.participants || []).map((p: any) => {
        console.log('🔍 Processing participant:', p);
        console.log('🔍 Participant data structure:', {
          id: p.id,
          name: p.name,
          email: p.email,
          profilePicture: p.profilePicture,
          role: p.role,
          isActive: p.isActive
        });
        
        const mappedParticipant = {
          id: p.id || p._id,
          name: p.name || 'Unknown',
          avatar: p.profilePicture || null,
          isHost: p.role === 'host',
          isReady: true // Mark all participants as ready by default
        };
        console.log('🔍 Mapped participant:', mappedParticipant);
        return mappedParticipant;
      });
      
      console.log('🔍 Mapped participants:', backendParticipants);
      setParticipants(backendParticipants);
      
      // Check if session has started and navigate participants automatically
      console.log('🔍 Checking session status:', {
        status: group.status,
        sessionActive: group.groupSession?.isActive,
        sessionType: group.groupSession?.sessionType,
        sessionStarted
      });
      
      if (group.status === 'active' && group.groupSession?.isActive) {
        console.log('🔍 Session is active! Navigating to appropriate screen...');
        console.log('🔍 Session type:', group.groupSession.sessionType);
        console.log('🔍 Session started flag:', sessionStarted);
        
        // Navigate to the appropriate screen based on session type
        const sessionType = group.groupSession.sessionType;
        const readyParticipants = backendParticipants.filter((p: any) => p.isReady);
        
        console.log('🔍 Ready participants for navigation:', readyParticipants);
        
        if (sessionType === 'chat') {
          console.log('🔍 Navigating to GroupChatScreen...');
          // @ts-ignore
          navigation.navigate('GroupChatScreen', { 
            groupInfo, 
            participants: readyParticipants,
            groupId
          });
        } else if (sessionType === 'voice') {
          console.log('🔍 Navigating to GroupVideoCallScreen (voice)...');
          // @ts-ignore
          navigation.navigate('GroupVideoCallScreen', { 
            groupInfo, 
            participants: readyParticipants,
            groupId,
            isVoiceOnly: true,
            initialAudioState: { isMuted, isSpeakerOn }
          });
        } else if (sessionType === 'video') {
          console.log('🔍 Navigating to GroupVideoCallScreen (video)...');
          // @ts-ignore
          navigation.navigate('GroupVideoCallScreen', { 
            groupInfo, 
            participants: readyParticipants,
            groupId,
            initialAudioState: { isMuted, isSpeakerOn },
            initialVideoState: { hasVideo }
          });
        }
        
        setSessionStarted(true);
      } else {
        console.log('🔍 Session not active yet. Status:', group.status, 'Session active:', group.groupSession?.isActive);
      }
      
      // If session is active but we haven't navigated yet, show a join button
   
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
  
  const handleCopyCode = async () => {
    try {
      const code = groupDetails?.joinCode || '';
      if (!code) {
        Alert.alert('Copy Failed', 'No group code available to copy.');
        return;
      }
      await Clipboard.setStringAsync(code);
      setIsGroupCodeCopied(true);
      setTimeout(() => setIsGroupCodeCopied(false), 2000);
    } catch (e) {
      Alert.alert('Copy Failed', 'Unable to copy the code. Please try again.');
    }
  };
  
  const handleStartDiscussion = async (mode: 'chat' | 'voice' | 'video' = 'chat') => {
    const readyParticipants = participants.filter(p => p.isReady);
    
    if (readyParticipants.length < minParticipants) {
      Alert.alert(
        'Not Enough Participants',
        `You need at least ${minParticipants} ready participants to start the discussion (current: ${readyParticipants.length}/${maxParticipants}).`,
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      // Always start session via backend (including chat)
      const startResponse = await groupsAPI.startSession(groupId, mode);
    
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
          isVoiceOnly: true,
          initialAudioState: { isMuted, isSpeakerOn }
      });
    } else if (mode === 'video') {
      // @ts-ignore
      navigation.navigate('GroupVideoCallScreen', { 
        groupInfo, 
          participants: readyParticipants,
          groupId,
          initialAudioState: { isMuted, isSpeakerOn },
          initialVideoState: { hasVideo }
        });
      }
    } catch (error: any) {
      console.error('Error starting session:', error);
      Alert.alert('Error', error.message || 'Failed to start session');
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    setHasVideo(!hasVideo);
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
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
        <Gradient
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
        <Gradient
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
  
  // Calculate minimum participants based on group size (same logic as backend)
  // For groups with maxParticipants 3-5: require at least 3 participants
  // For groups with maxParticipants 6-10: require at least 4 participants  
  // For groups with maxParticipants 11+: require at least 5 participants
  const maxParticipants = groupDetails?.maxParticipants || groupInfo?.maxParticipants || 5;
  let minParticipants: number;
  if (maxParticipants <= 5) {
    minParticipants = 3;
  } else if (maxParticipants <= 10) {
    minParticipants = 4;
  } else {
    minParticipants = 5;
  }
  
  // Ensure minimum is not more than maxParticipants
  minParticipants = Math.min(minParticipants, maxParticipants);
  
  const canStart = readyCount >= minParticipants;
  
  // Debug info
  console.log('🔍 FOOTER RENDER DEBUG:', {
    isHost,
    readyCount,
    minParticipants,
    maxParticipants,
    canStart,
    participantsCount: participants.length,
    participants: participants.map(p => ({ name: p.name, isHost: p.isHost, isReady: p.isReady }))
  });
  
  return (
    <View style={styles.container}>
      <Gradient
        colors={['rgba(220, 41, 41, 0.2)', 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 1)', 'rgba(34, 108, 174, 0.1)']}
        locations={[0, 0.25, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />
      
      <GameHeader title="Waiting Room" showBackButton onBackPress={handleLeaveGroup} />
      
      <FeatureAccessWrapper
        featureKey="group_calls"
        fallback={null}
        style={styles.container}
        navigation={navigation}
      >
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
        
        {isHost && (
        <ThemedView style={styles.shareCard}>
          <View style={styles.shareHeader}>
            <ThemedText style={styles.shareTitle}>Share Group Code</ThemedText>
            <ThemedText style={styles.shareSubtitle}>Invite others to join your discussion</ThemedText>
          </View>
          
          <View style={styles.codeContainer}>
              <ThemedText style={styles.groupCode}>
                {groupDetails?.joinCode || 'Loading...'}
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
        )}
        
        <ThemedView style={styles.participantsCard}>
          <View style={styles.participantsHeader}>
            <ThemedText style={styles.participantsTitle}>
              Participants ({participants.length}/{groupDetails?.maxParticipants || groupInfo?.maxParticipants || 5})
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
            {Array.from({ length: (groupDetails?.maxParticipants || groupInfo?.maxParticipants || 5) - participants.length }).map((_, index) => (
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
        
        {isHost ? (
          <ThemedView style={styles.mediaControlsCard}>
            <ThemedText style={styles.mediaControlsTitle}>Media Settings (Host)</ThemedText>
            <View style={styles.mediaControls}>
              <TouchableOpacity 
                style={[styles.mediaControlButton, isMuted && styles.activeMediaControl]}
                onPress={toggleMute}
              >
                <FontAwesome 
                  name={isMuted ? "microphone-slash" : "microphone"} 
                  size={20} 
                  color={isMuted ? "#FFFFFF" : "#dc2929"} 
                />
                <ThemedText style={[styles.mediaControlText, isMuted && styles.activeMediaControlText]}>
                  {isMuted ? "Unmute" : "Mute"}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.mediaControlButton, !hasVideo && styles.activeMediaControl]}
                onPress={toggleVideo}
              >
                <FontAwesome 
                  name={hasVideo ? "video-camera" : "video-camera"} 
                  size={20} 
                  color={hasVideo ? "#226cae" : "#FFFFFF"} 
                />
                {!hasVideo && <FontAwesome name="times" size={12} color="#dc2929" style={styles.disabledOverlay} />}
                <ThemedText style={[styles.mediaControlText, !hasVideo && styles.activeMediaControlText]}>
                  {hasVideo ? "Video On" : "Video Off"}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.mediaControlButton, isSpeakerOn && styles.activeMediaControl]}
                onPress={toggleSpeaker}
              >
                <FontAwesome 
                  name={isSpeakerOn ? "volume-up" : "volume-down"} 
                  size={20} 
                  color={isSpeakerOn ? "#4CAF50" : "#666666"} 
                />
                <ThemedText style={[styles.mediaControlText, isSpeakerOn && styles.activeMediaControlText]}>
                  {isSpeakerOn ? "Speaker" : "Earpiece"}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        ) : (
          <ThemedView style={styles.mediaControlsCard}>
            <ThemedText style={styles.mediaControlsTitle}>Audio Settings</ThemedText>
            <View style={styles.mediaControls}>
              <TouchableOpacity 
                style={[styles.mediaControlButton, isSpeakerOn && styles.activeMediaControl]}
                onPress={toggleSpeaker}
              >
                <FontAwesome 
                  name={isSpeakerOn ? "volume-up" : "volume-down"} 
                  size={20} 
                  color={isSpeakerOn ? "#4CAF50" : "#666666"} 
                />
                <ThemedText style={[styles.mediaControlText, isSpeakerOn && styles.activeMediaControlText]}>
                  {isSpeakerOn ? "Speaker" : "Earpiece"}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        )}

        {isHost ? (
        <View style={styles.infoCard}>
          <FontAwesome name="info-circle" size={20} color="#dc2929" style={styles.infoIcon} />
            <ThemedText style={styles.infoText}>
              As the host, you can start the discussion when at least {minParticipants} participants (including you) are ready. Ready: {readyCount}/{participants.length}
            </ThemedText>
        </View>
        ) : (
          <View style={styles.infoCard}>
            <FontAwesome name="info-circle" size={20} color="#226cae" style={styles.infoIcon} />
            <ThemedText style={styles.infoText}>
              Waiting for the host to start the discussion. You can adjust your audio settings below.
            </ThemedText>
          </View>
        )}
      </ScrollView>
      
      <View style={styles.footer}>
        {isHost ? (
          canStart ? (
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
                style={[styles.communicationButton, styles.voiceButton, styles.disabledOption]}
                disabled
              >
                <FontAwesome name="phone" size={20} color="#FFFFFF" />
                <ThemedText style={styles.communicationButtonText}>Voice</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.communicationButton, styles.videoButton, styles.disabledOption]}
                disabled
              >
                <FontAwesome name="video-camera" size={20} color="#FFFFFF" />
                <ThemedText style={styles.communicationButtonText}>Video</ThemedText>
              </TouchableOpacity>
            </View>
            <ThemedText style={styles.comingSoonText}>Voice and Video calls coming soon</ThemedText>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.startButton, styles.disabledButton]}
            disabled={true}
          >
            <ThemedText style={styles.startButtonText}>
                Need {minParticipants - readyCount} more ready
            </ThemedText>
          </TouchableOpacity>
          )
        ) : (
          groupDetails?.status === 'active' && groupDetails?.groupSession?.isActive ? (
            <TouchableOpacity 
              style={[styles.startButton, styles.joinSessionButton]}
              onPress={() => {
                const sessionType = groupDetails.groupSession.sessionType;
                const readyParticipants = participants.filter(p => p.isReady);
                
                if (sessionType === 'chat') {
                  // @ts-ignore
                  navigation.navigate('GroupChatScreen', { 
                    groupInfo, 
                    participants: readyParticipants,
                    groupId
                  });
                } else if (sessionType === 'voice') {
                  // @ts-ignore
                  navigation.navigate('GroupVideoCallScreen', { 
                    groupInfo, 
                    participants: readyParticipants,
                    groupId,
                    isVoiceOnly: true,
                    initialAudioState: { isMuted, isSpeakerOn }
                  });
                } else if (sessionType === 'video') {
                  // @ts-ignore
                  navigation.navigate('GroupVideoCallScreen', { 
                    groupInfo, 
                    participants: readyParticipants,
                    groupId,
                    initialAudioState: { isMuted, isSpeakerOn },
                    initialVideoState: { hasVideo }
                  });
                }
              }}
            >
              <FontAwesome name="play" size={20} color="#FFFFFF" />
              <ThemedText style={styles.startButtonText}>
                Join Session ({groupDetails.groupSession.sessionType})
              </ThemedText>
            </TouchableOpacity>
          ) : (
            <View style={styles.waitingFooter}>
              <FontAwesome name="clock-o" size={24} color="#226cae" />
              <ThemedText style={styles.waitingText}>
                Waiting for host to start the discussion...
              </ThemedText>
            </View>
          )
        )}
      </View>
      </FeatureAccessWrapper>
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
    backgroundColor: '#4CAF50',
  },
  intermediateBadge: {
    backgroundColor: '#FFC107',
  },
  advancedBadge: {
    backgroundColor: '#DC2929',
  },
  levelText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
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
  joinSessionButton: {
    backgroundColor: '#4CAF50',
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
  disabledOption: {
    opacity: 0.5,
  },
  comingSoonText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#666666',
    fontSize: 12,
  },
  mediaControlsCard: {
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
  mediaControlsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc2929',
    marginBottom: 12,
  },
  mediaControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  mediaControlButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 80,
  },
  activeMediaControl: {
    backgroundColor: '#dc2929',
    borderColor: '#dc2929',
  },
  mediaControlText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginTop: 4,
  },
  activeMediaControlText: {
    color: '#FFFFFF',
  },
  disabledOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 2,
  },
  waitingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: 'rgba(34, 108, 174, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 108, 174, 0.2)',
  },
  waitingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#226cae',
    marginLeft: 12,
  },
}); 