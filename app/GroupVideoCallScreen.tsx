import { FontAwesome } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Platform,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import { ThemedText } from '../components/ThemedText';

const { width, height } = Dimensions.get('window');

interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  isMuted: boolean;
  hasVideo: boolean;
}

interface GroupInfo {
  title: string;
  topic: string;
  participants: Participant[];
}

interface RouteParams {
  groupInfo: GroupInfo;
  participants: Participant[];
  groupId?: string;
  isVoiceOnly?: boolean;
}

export default function GroupVideoCallScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { groupInfo, participants: routeParticipants, groupId, isVoiceOnly = false } = (route.params as RouteParams) || {};
  
  const [participants] = useState<Participant[]>(routeParticipants || [
    { id: '1', name: 'You', isHost: true, isMuted: false, hasVideo: !isVoiceOnly },
    { id: '2', name: 'Sarah Johnson', isHost: false, isMuted: false, hasVideo: !isVoiceOnly },
    { id: '3', name: 'Michael Brown', isHost: false, isMuted: true, hasVideo: !isVoiceOnly },
    { id: '4', name: 'Emma Wilson', isHost: false, isMuted: false, hasVideo: !isVoiceOnly },
  ]);
  
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [hasVideo, setHasVideo] = useState(!isVoiceOnly);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  
  // Timer for call duration
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Format seconds to mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleEndCall = () => {
    Alert.alert(
      'End Call',
      `Are you sure you want to end this group ${isVoiceOnly ? 'voice' : 'video'} call?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Call', 
          style: 'destructive',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  const toggleVideo = () => {
    if (!isVoiceOnly) {
      setHasVideo(!hasVideo);
    }
  };
  
  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };
  
  const renderParticipantVideo = (participant: Participant, isMain: boolean = false) => {
    const videoStyle = isMain ? styles.mainParticipantVideo : styles.participantVideo;
    const nameStyle = isMain ? styles.mainParticipantName : styles.participantName;
    
    return (
      <View key={participant.id} style={videoStyle}>
        <LinearGradient
          colors={participant.hasVideo && !isVoiceOnly ? 
            ['rgba(34, 108, 174, 0.8)', 'rgba(220, 41, 41, 0.8)'] : 
            ['rgba(0, 0, 0, 0.8)', 'rgba(0, 0, 0, 0.6)']}
          style={styles.videoBackground}
        >
          {participant.hasVideo && !isVoiceOnly ? (
            <FontAwesome 
              name="user" 
              size={isMain ? 60 : 30} 
              color="#FFFFFF" 
              style={styles.videoPlaceholder} 
            />
          ) : (
            <View style={styles.noVideoContainer}>
              <FontAwesome name={isVoiceOnly ? "microphone" : "video-camera"} size={isMain ? 40 : 20} color="#666666" />
              {!isVoiceOnly && (
                <FontAwesome 
                  name="times" 
                  size={isMain ? 20 : 12} 
                  color="#dc2929" 
                  style={styles.noVideoIcon} 
                />
              )}
            </View>
          )}
        </LinearGradient>
        
        <View style={[styles.participantInfo, isMain ? styles.mainParticipantInfo : {}]}>
          <ThemedText style={nameStyle}>
            {participant.name}
            {participant.isHost && <ThemedText style={styles.hostBadge}> (Host)</ThemedText>}
          </ThemedText>
          <View style={styles.participantStatus}>
            {participant.isMuted && (
              <FontAwesome name="microphone-slash" size={12} color="#dc2929" style={styles.mutedIcon} />
            )}
            {!participant.hasVideo && (
              <FontAwesome name="video-camera" size={12} color="#666666" style={styles.videoOffIcon} />
            )}
          </View>
        </View>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['rgba(34, 108, 174, 1)', 'rgba(220, 41, 41, 0.8)', 'rgba(0, 0, 0, 0.9)']}
        locations={[0, 0.6, 1]}
        style={styles.background}
      />
      
      {/* Header Info */}
      <View style={styles.headerInfo}>
        <View style={styles.callInfo}>
          <ThemedText style={styles.groupTitle}>{groupInfo?.title || `Group ${isVoiceOnly ? 'Voice' : 'Video'} Call`}</ThemedText>
          <ThemedText style={styles.callDuration}>{formatDuration(callDuration)}</ThemedText>
        </View>
        
        <TouchableOpacity 
          style={styles.participantsToggle}
          onPress={() => setShowParticipants(!showParticipants)}
        >
          <FontAwesome name="users" size={18} color="#FFFFFF" />
          <ThemedText style={styles.participantsCount}>{participants.length}</ThemedText>
        </TouchableOpacity>
      </View>
      
      {/* Main Video Grid */}
      <View style={styles.videoGrid}>
        {participants.length <= 2 ? (
          // Single/Duo view
          <View style={styles.singleVideoContainer}>
            {participants.slice(0, 2).map((participant, index) => 
              renderParticipantVideo(participant, true)
            )}
          </View>
        ) : participants.length <= 4 ? (
          // Quad view
          <View style={styles.quadVideoContainer}>
            {participants.slice(0, 4).map((participant) => 
              renderParticipantVideo(participant, false)
            )}
          </View>
        ) : (
          // Gallery view with main speaker
          <View style={styles.galleryContainer}>
            <View style={styles.mainSpeaker}>
              {renderParticipantVideo(participants[0], true)}
            </View>
            <View style={styles.thumbnailGrid}>
              {participants.slice(1, 7).map((participant) => 
                renderParticipantVideo(participant, false)
              )}
            </View>
          </View>
        )}
      </View>
      
      {/* Participants List Overlay */}
      {showParticipants && (
        <View style={styles.participantsOverlay}>
          <View style={styles.participantsHeader}>
            <ThemedText style={styles.participantsTitle}>Participants ({participants.length})</ThemedText>
            <TouchableOpacity onPress={() => setShowParticipants(false)}>
              <FontAwesome name="times" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.participantsList}>
            {participants.map((participant) => (
              <View key={participant.id} style={styles.participantListItem}>
                <View style={styles.participantAvatar}>
                  <FontAwesome name="user" size={16} color="#FFFFFF" />
                </View>
                <ThemedText style={styles.participantListName}>
                  {participant.name}
                  {participant.isHost && <ThemedText style={styles.hostBadge}> (Host)</ThemedText>}
                </ThemedText>
                <View style={styles.participantListStatus}>
                  <FontAwesome 
                    name="microphone" 
                    size={14} 
                    color={participant.isMuted ? "#dc2929" : "#4CAF50"} 
                  />
                  <FontAwesome 
                    name="video-camera" 
                    size={14} 
                    color={participant.hasVideo ? "#4CAF50" : "#dc2929"} 
                    style={{ marginLeft: 8 }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
      
      {/* Call Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.mainControls}>
          <TouchableOpacity 
            style={[styles.controlButton, isMuted && styles.activeControlButton]}
            onPress={toggleMute}
          >
            <FontAwesome 
              name={isMuted ? "microphone-slash" : "microphone"} 
              size={24} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, styles.endCallButton]}
            onPress={handleEndCall}
          >
            <FontAwesome 
              name="phone" 
              size={24} 
              color="#FFFFFF" 
              style={{ transform: [{ rotate: '135deg' }] }} 
            />
          </TouchableOpacity>
          
          {!isVoiceOnly && (
            <TouchableOpacity 
              style={[styles.controlButton, !hasVideo && styles.activeControlButton]}
              onPress={toggleVideo}
            >
              <FontAwesome 
                name={hasVideo ? "video-camera" : "video-camera"} 
                size={24} 
                color="#FFFFFF" 
              />
              {!hasVideo && <FontAwesome 
                name="times" 
                size={12} 
                color="#dc2929" 
                style={styles.disabledOverlay} 
              />}
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.secondaryControls}>
          <TouchableOpacity 
            style={[styles.secondaryControlButton, isSpeakerOn && styles.activeSecondaryControl]}
            onPress={toggleSpeaker}
          >
            <FontAwesome 
              name={isSpeakerOn ? "volume-up" : "volume-down"} 
              size={18} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryControlButton}>
            <FontAwesome name="share-alt" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryControlButton}>
            <FontAwesome name="cog" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerInfo: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  callInfo: {
    flex: 1,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  callDuration: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  participantsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 41, 41, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  participantsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  videoGrid: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 120 : 100,
    paddingBottom: 150,
    paddingHorizontal: 10,
  },
  singleVideoContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  quadVideoContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  galleryContainer: {
    flex: 1,
  },
  mainSpeaker: {
    flex: 2,
    marginBottom: 10,
  },
  thumbnailGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  mainParticipantVideo: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 200,
  },
  participantVideo: {
    width: (width - 40) / 2 - 4,
    aspectRatio: 3/4,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 6,
  },
  videoBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: {
    opacity: 0.7,
  },
  noVideoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  noVideoIcon: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 2,
  },
  participantInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  mainParticipantInfo: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  participantName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  mainParticipantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  hostBadge: {
    color: '#dc2929',
    fontWeight: '700',
  },
  participantStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mutedIcon: {
    marginLeft: 4,
  },
  videoOffIcon: {
    marginLeft: 4,
  },
  participantsOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    right: 20,
    width: width * 0.7,
    maxHeight: height * 0.5,
    borderRadius: 12,
    padding: 16,
    zIndex: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  participantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  participantsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  participantsList: {
    maxHeight: 300,
  },
  participantListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  participantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dc2929',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantListName: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
  participantListStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  mainControls: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginBottom: 20,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  activeControlButton: {
    backgroundColor: 'rgba(220, 41, 41, 0.8)',
  },
  endCallButton: {
    backgroundColor: '#dc2929',
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  disabledOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 2,
  },
  secondaryControls: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  secondaryControlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeSecondaryControl: {
    backgroundColor: 'rgba(34, 108, 174, 0.8)',
  },
}); 