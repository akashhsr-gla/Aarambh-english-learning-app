import { FontAwesome } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '../components/ThemedText';
import { communicationAPI } from './services/api';

interface Partner {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  languageLevel: string;
  lastActive: string;
}

interface CallSession {
  sessionId: string;
  sessionType: string;
  title: string;
  status: string;
  participants: any[];
}

export default function CallScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { callType = 'voice' } = (route.params as { callType?: 'voice' | 'video' }) || {};
  
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(callType === 'video');
  const [callStatus, setCallStatus] = useState('finding'); // finding, connecting, active, ending
  const [partner, setPartner] = useState<Partner | null>(null);
  const [session, setSession] = useState<CallSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Find partner and initiate call on mount
  useEffect(() => {
    findPartnerAndInitiateCall();
    
    return () => {
      // Cleanup timer and leave call if active
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (session && callStatus === 'active') {
        handleLeaveCall(false); // Don't navigate back during cleanup
      }
    };
  }, []);
  
  // Timer for call duration
  useEffect(() => {
    if (callStatus === 'active') {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callStatus]);
  
  const findPartnerAndInitiateCall = async () => {
    try {
      setCallStatus('finding');
      setError(null);
      
      // Find a partner
      const partnerResponse = await communicationAPI.findPartner(callType === 'video' ? 'video_call' : 'voice_call');
      
      if (!partnerResponse.success) {
        throw new Error(partnerResponse.message || 'Failed to find partner');
      }
      
      if (!partnerResponse.data.partner) {
        setError('No available partners found in your region. Please try again later.');
        setCallStatus('finding');
        return;
      }
      
      setPartner(partnerResponse.data.partner);
      setCallStatus('connecting');
      
      // Initiate call with found partner
      const callResponse = await communicationAPI.initiateCall({
        participants: [partnerResponse.data.partner.id],
        callType: callType,
        title: `${callType === 'video' ? 'Video' : 'Voice'} Call`,
        description: `1:1 ${callType} call with ${partnerResponse.data.partner.name}`
      });
      
      if (!callResponse.success) {
        throw new Error(callResponse.message || 'Failed to initiate call');
      }
      
      setSession(callResponse.data);
      
      // Join the call immediately
      const joinResponse = await communicationAPI.joinCall(callResponse.data.sessionId);
      
      if (!joinResponse.success) {
        throw new Error(joinResponse.message || 'Failed to join call');
      }
      
      setCallStatus('active');
      setCallDuration(0);
      
    } catch (error: any) {
      console.error('Call initiation error:', error);
      setError(error.message || 'Failed to start call');
      setCallStatus('finding');
    }
  };
  
  // Format seconds to mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleEndCall = async () => {
    await handleLeaveCall(true);
  };
  
  const handleLeaveCall = async (shouldNavigate = true) => {
    try {
      setCallStatus('ending');
      
      if (session?.sessionId) {
        await communicationAPI.leaveCall(session.sessionId);
      }
      
      if (shouldNavigate) {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Leave call error:', error);
      if (shouldNavigate) {
        navigation.goBack();
      }
    }
  };
  
  const toggleMute = async () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (session?.sessionId) {
      try {
        await communicationAPI.updateParticipantState(session.sessionId, {
          micEnabled: !newMutedState
        });
      } catch (error) {
        console.error('Update mic state error:', error);
        // Revert state on error
        setIsMuted(!newMutedState);
      }
    }
  };
  
  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };
  
  const switchToVideo = async () => {
    if (callStatus !== 'active') return;
    
    setIsVideoCall(true);
    
    if (session?.sessionId) {
      try {
        await communicationAPI.updateParticipantState(session.sessionId, {
          cameraEnabled: true
        });
      } catch (error) {
        console.error('Update camera state error:', error);
        setIsVideoCall(false);
      }
    }
  };
  
  const retryFindPartner = () => {
    findPartnerAndInitiateCall();
  };
  
  const getStatusText = () => {
    switch (callStatus) {
      case 'finding':
        return 'Finding partner in your region...';
      case 'connecting':
        return 'Connecting...';
      case 'active':
        return isVideoCall ? 'Video Call' : 'Voice Call';
      case 'ending':
        return 'Ending call...';
      default:
        return 'Preparing call...';
    }
  };
  
  // Show error state
  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <LinearGradient
          colors={['rgba(34, 108, 174, 1)', 'rgba(26, 80, 133, 1)']}
          style={styles.background}
        />
        
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-triangle" size={60} color="#FFFFFF" style={{ opacity: 0.8 }} />
          <ThemedText style={styles.errorTitle}>Connection Failed</ThemedText>
          <ThemedText style={styles.errorMessage}>{error}</ThemedText>
          
          <TouchableOpacity style={styles.retryButton} onPress={retryFindPartner}>
            <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  // Show loading state
  if (callStatus === 'finding' || callStatus === 'connecting') {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <LinearGradient
          colors={['rgba(34, 108, 174, 1)', 'rgba(26, 80, 133, 1)']}
          style={styles.background}
        />
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <ThemedText style={styles.loadingText}>{getStatusText()}</ThemedText>
          {partner && (
            <View style={styles.partnerInfo}>
              <ThemedText style={styles.partnerText}>Found: {partner.name}</ThemedText>
              <ThemedText style={styles.partnerLevel}>Level: {partner.languageLevel}</ThemedText>
            </View>
          )}
          
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <LinearGradient
        colors={['rgba(34, 108, 174, 1)', 'rgba(26, 80, 133, 1)']}
        style={styles.background}
      />
      
      {isVideoCall ? (
        // Video call view
        <View style={styles.videoContainer}>
          {/* Main video (other person) */}
          <View style={styles.mainVideo}>
            <FontAwesome name="user" size={100} color="#FFFFFF" style={styles.videoPlaceholder} />
          </View>
          
          {/* Self video (small overlay) */}
          <View style={styles.selfVideoContainer}>
            <View style={styles.selfVideo}>
              <FontAwesome name="user" size={40} color="#FFFFFF" />
            </View>
          </View>
          
          {/* Call info overlay */}
          <BlurView intensity={30} style={styles.videoCallInfoBar}>
            <ThemedText style={styles.videoCallName}>{partner?.name || 'Partner'}</ThemedText>
            <ThemedText style={styles.videoCallDuration}>{formatDuration(callDuration)}</ThemedText>
          </BlurView>
        </View>
      ) : (
        // Audio call view
        <View style={styles.profileContainer}>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImage}>
              <FontAwesome name="user" size={80} color="#FFFFFF" />
            </View>
          </View>
          
          <ThemedText style={styles.callerName}>{partner?.name || 'Partner'}</ThemedText>
          <ThemedText style={styles.callStatus}>{getStatusText()}</ThemedText>
          <ThemedText style={styles.callDuration}>{formatDuration(callDuration)}</ThemedText>
        </View>
      )}
      
      {/* Call Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={[styles.controlButton, isMuted && styles.activeControlButton]}
          onPress={toggleMute}
        >
          <FontAwesome name={isMuted ? "microphone-slash" : "microphone"} size={24} color="#FFFFFF" />
          <ThemedText style={styles.controlLabel}>{isMuted ? "Unmute" : "Mute"}</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, styles.endCallButton]}
          onPress={handleEndCall}
        >
          <FontAwesome name="phone" size={24} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
          <ThemedText style={styles.controlLabel}>End</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, isSpeakerOn && styles.activeControlButton]}
          onPress={toggleSpeaker}
        >
          <FontAwesome name={isSpeakerOn ? "volume-up" : "volume-down"} size={24} color="#FFFFFF" />
          <ThemedText style={styles.controlLabel}>Speaker</ThemedText>
        </TouchableOpacity>
      </View>
      
      {/* Additional Controls */}
      <View style={styles.additionalControlsContainer}>
        {!isVideoCall && (
          <TouchableOpacity 
            style={styles.additionalControlButton}
            onPress={switchToVideo}
          >
            <FontAwesome name="video-camera" size={20} color="#FFFFFF" />
            <ThemedText style={styles.additionalControlLabel}>Video</ThemedText>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.additionalControlButton}>
          <FontAwesome name="keyboard-o" size={20} color="#FFFFFF" />
          <ThemedText style={styles.additionalControlLabel}>Keypad</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.additionalControlButton}>
          <FontAwesome name="plus" size={20} color="#FFFFFF" />
          <ThemedText style={styles.additionalControlLabel}>Add call</ThemedText>
        </TouchableOpacity>
      </View>
      
      {/* Call Quality Indicator */}
      <View style={styles.qualityIndicator}>
        <FontAwesome name="signal" size={14} color="#4CAF50" />
        <ThemedText style={styles.qualityText}>Excellent</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#226cae',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  profileContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  profileImageContainer: {
    marginBottom: 30,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  callerName: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  callStatus: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  callDuration: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
  },
  controlButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeControlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  endCallButton: {
    backgroundColor: '#dc2929',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  controlLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 8,
  },
  additionalControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 50,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  additionalControlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  additionalControlLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 5,
  },
  qualityIndicator: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  qualityText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 5,
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  mainVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a5085',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlaceholder: {
    opacity: 0.5,
  },
  selfVideoContainer: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 100,
    height: 150,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  selfVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#226cae',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoCallInfoBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  videoCallName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  videoCallDuration: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 15,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 20,
    textAlign: 'center',
  },
  partnerInfo: {
    marginTop: 30,
    alignItems: 'center',
  },
  partnerText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  partnerLevel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
}); 