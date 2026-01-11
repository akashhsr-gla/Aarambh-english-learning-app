import { FontAwesome } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Modal,
  PermissionsAndroid,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

// Import React Native WebRTC
const {
  RTCPeerConnection,
  RTCView,
  mediaDevices,
  MediaStream,
  MediaStreamTrack
} = require('react-native-webrtc');

import { ThemedText } from '../components/ThemedText';
import FeatureAccessWrapper from './components/FeatureAccessWrapper';
import { useFeatureAccess } from './hooks/useFeatureAccess';
import { authAPI, communicationAPI } from './services/api';

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
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isVideoCall, setIsVideoCall] = useState(callType === 'video');
  const [callStatus, setCallStatus] = useState('finding');
  const [partner, setPartner] = useState<Partner | null>(null);
  const [session, setSession] = useState<CallSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [waitingMessage, setWaitingMessage] = useState<string | null>(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [endedByName, setEndedByName] = useState<string | null>(null);
  const [regionName, setRegionName] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [showVideoRequest, setShowVideoRequest] = useState(false);
  const [videoRequestFrom, setVideoRequestFrom] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);

  // STRICT: Check access for both video and voice calls
  const { canAccess: canMakeVideoCalls, featureInfo: videoCallFeatureInfo } = useFeatureAccess('video_calls');
  const { canAccess: canMakeVoiceCalls, featureInfo: voiceCallFeatureInfo } = useFeatureAccess('voice_calls');
  
  // Determine if user can make the requested call type
  const canMakeCalls = isVideoCall ? canMakeVideoCalls : canMakeVoiceCalls;
  const callFeatureInfo = isVideoCall ? videoCallFeatureInfo : voiceCallFeatureInfo;
  
  const cancelingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const pcRef = useRef<any>(null);
  const localStreamRef = useRef<any>(null);
  const remoteStreamRef = useRef<any>(null);
  const appliedIceSetRef = useRef<Set<string>>(new Set());
  const signalingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  const isInitiatorRef = useRef(false);

  // Request audio permissions
  const requestAudioPermission = async (): Promise<boolean> => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'This app needs access to your microphone to make calls.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('Audio permission error:', err);
      return false;
    }
  };

  // Request camera permissions
  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'This app needs access to your camera to make video calls.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('Camera permission error:', err);
      return false;
    }
  };

  // Get user media with proper error handling
  const getLocalMedia = async (): Promise<boolean> => {
    try {
      // Request audio permission first (always needed)
      const hasAudioPermission = await requestAudioPermission();
      if (!hasAudioPermission) {
        setPermissionError('Microphone permission is required for calls. Please enable microphone access in your device settings.');
        return false;
      }

      // Request camera permission if this is a video call
      if (isVideoCall) {
        const hasCameraPermission = await requestCameraPermission();
        if (!hasCameraPermission) {
          setPermissionError('Camera permission is required for video calls. Please enable camera access in your device settings.');
          return false;
        }
      }

      // Stop existing stream if any
      if (localStreamRef.current) {
        try {
          localStreamRef.current.getTracks().forEach((track: any) => track.stop());
        } catch {}
      }

      // Use minimal, broadly supported constraints on Android (RN WebRTC)
      const constraints: any = {
        audio: true,
        video: isVideoCall ? { facingMode: 'user', width: 640, height: 480 } : false
      };

      const stream = await mediaDevices.getUserMedia(constraints);

      // Try to route audio to speaker; ignore if not supported on device
      try {
        await mediaDevices.setAudioOutput('speaker');
      } catch {}

      localStreamRef.current = stream;
      setLocalStream(stream);
      return true;
    } catch (error: any) {
      // Fallback: retry once with the most basic constraints
      try {
        const fallback = await mediaDevices.getUserMedia({ audio: true, video: isVideoCall ? true : false });
        try {
          await mediaDevices.setAudioOutput('speaker');
        } catch {}
        localStreamRef.current = fallback;
        setLocalStream(fallback);
        return true;
      } catch (e) {
        setPermissionError(`Failed to access ${isVideoCall ? 'camera and microphone' : 'microphone'}. Please check your permissions.`);
        return false;
      }
    }
  };

  // Initialize WebRTC connection
  const initializeWebRTC = async () => {
    if (!session?.sessionId) {
      console.error('No session ID available');
      return;
    }

    try {
      console.log('Initializing WebRTC connection...');

      // Get local media first
      const mediaSuccess = await getLocalMedia();
      if (!mediaSuccess) {
        throw new Error('Failed to get local media');
      }

      // Create peer connection configuration
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { 
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          { 
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          }
        ],
        iceCandidatePoolSize: 10,
        iceTransportPolicy: 'all' as const
      };

      // Create peer connection
      const pc = new RTCPeerConnection(configuration);
      pcRef.current = pc;

      console.log('Peer connection created');

      // Add local stream tracks to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track: any) => {
          console.log('Adding track:', track.kind, track.enabled);
          pc.addTrack(track, localStreamRef.current);
        });
      }

      // Set up event handlers
      pc.onicecandidate = (event: any) => {
        if (event.candidate && session.sessionId) {
          console.log('Sending ICE candidate');
          communicationAPI.postIce(session.sessionId, {
            candidate: JSON.stringify(event.candidate),
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
          }).catch(err => console.error('Error sending ICE candidate:', err));
        }
      };

      pc.ontrack = (event: any) => {
        console.log('Received remote track:', event.track.kind);
        const stream = event.streams[0];
        if (stream) {
          remoteStreamRef.current = stream;
          setRemoteStream(stream);
          setIsConnected(true);
          
          // Enable all tracks
          stream.getTracks().forEach((track: any) => {
            track.enabled = true;
          });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          setIsConnected(true);
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setIsConnected(false);
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState);
      };

      // Create and send offer if we're the initiator
      if (isInitiatorRef.current) {
        console.log('Creating offer as initiator...');
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: isVideoCall
        });
        
        await pc.setLocalDescription(offer);
        console.log('Local description set, sending offer...');
        
        await communicationAPI.postOffer(session.sessionId, {
          type: offer.type,
          sdp: offer.sdp
        });
      }

      // Start signaling polling
      startSignalingPolling();

    } catch (error: any) {
      console.error('Error initializing WebRTC:', error);
      setError('Failed to initialize call: ' + error.message);
    }
  };

  // Start polling for signaling messages
  const startSignalingPolling = () => {
    if (signalingIntervalRef.current) {
      clearInterval(signalingIntervalRef.current);
    }

    signalingIntervalRef.current = setInterval(async () => {
      if (!session?.sessionId || !pcRef.current) return;

      try {
        const response = await communicationAPI.getSignaling(session.sessionId);
        const signaling = response?.data?.signaling || {};
        const currentUserId = currentUserIdRef.current;

        console.log('Checking signaling messages...');

        // Handle offer
        if (signaling.offer?.sdp && !pcRef.current.remoteDescription) {
          if (currentUserId && signaling.offer.from && signaling.offer.from.toString() === currentUserId.toString()) {
            console.log('Skipping own offer');
          } else {
            console.log('Received offer, creating answer...');
            await pcRef.current.setRemoteDescription({
              type: 'offer',
              sdp: signaling.offer.sdp
            });

            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);

            await communicationAPI.postAnswer(session.sessionId, {
              type: answer.type,
              sdp: answer.sdp
            });
          }
        }

        // Handle answer
        if (signaling.answer?.sdp && pcRef.current.localDescription && !pcRef.current.remoteDescription) {
          if (currentUserId && signaling.answer.from && signaling.answer.from.toString() === currentUserId.toString()) {
            console.log('Skipping own answer');
          } else {
            console.log('Received answer, setting remote description...');
            await pcRef.current.setRemoteDescription({
              type: 'answer',
              sdp: signaling.answer.sdp
            });
          }
        }

        // Handle ICE candidates
        if (Array.isArray(signaling.iceCandidates)) {
          for (const candidate of signaling.iceCandidates) {
            if (!candidate?.candidate) continue;

            if (currentUserId && candidate.from && candidate.from.toString() === currentUserId.toString()) {
              continue;
            }

            const key = candidate.candidate;
            if (appliedIceSetRef.current.has(key)) {
              continue;
            }

            appliedIceSetRef.current.add(key);

            try {
              const iceCandidate = JSON.parse(candidate.candidate);
              await pcRef.current.addIceCandidate(iceCandidate);
              console.log('Added ICE candidate');
            } catch (error) {
              console.error('Error adding ICE candidate:', error);
              appliedIceSetRef.current.delete(key);
            }
          }
        }

      } catch (error) {
        console.error('Error in signaling polling:', error);
      }
    }, 2000);
  };

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log('Cleaning up call...');
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (signalingIntervalRef.current) {
      clearInterval(signalingIntervalRef.current);
      signalingIntervalRef.current = null;
    }
    
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track: any) => {
          track.stop();
        });
        localStreamRef.current = null;
        setLocalStream(null);
      }
      
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      
      setRemoteStream(null);
      remoteStreamRef.current = null;
    } catch (e) {
      console.error('Error during cleanup:', e);
    }
  }, []);

  // Find partner and initiate call
  const findPartnerAndInitiateCall = async () => {
    // STRICT: Check access before attempting to find partner
    if (!canMakeCalls) {
      setError('This feature requires an active subscription. Please upgrade to access video/voice calls.');
      setCallStatus('error');
      Alert.alert(
        'Subscription Required',
        `${isVideoCall ? 'Video' : 'Voice'} calls require an active subscription. Would you like to upgrade?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Upgrade', 
            onPress: () => navigation.navigate('SubscriptionScreen' as never)
          }
        ]
      );
      return;
    }

    try {
      setCallStatus('finding');
      setError(null);
      setWaitingMessage(null);

      // Get current user info
      try {
        const userResp = await authAPI.getCurrentUser();
        const rName = userResp?.data?.user?.region?.name || userResp?.data?.region?.name;
        const userId = userResp?.data?.user?._id || userResp?.data?._id;
        if (rName) setRegionName(rName);
        if (userId) currentUserIdRef.current = userId;
      } catch (error) {
        console.error('Error getting user info:', error);
      }

      // Clean up any existing sessions
      try {
        await communicationAPI.cancelAllSessions();
      } catch (error) {
        // Ignore cleanup errors
      }

      const sessionType = isVideoCall ? 'video_call' : 'voice_call';
      const partnerResponse = await communicationAPI.findPartner(sessionType);
      
      if (partnerResponse.success) {
        if (partnerResponse.data?.partner) {
          setPartner(partnerResponse.data.partner);
          const s = partnerResponse.data.session;
          const sessionData = {
            sessionId: s.id || s.sessionId || s._id,
            sessionType: s.sessionType || sessionType,
            title: s.title || 'Call Session',
            status: s.status || 'active',
            participants: []
          };
          setSession(sessionData);
          setCallStatus('active');
          isInitiatorRef.current = true;
        } else if (partnerResponse.data?.waitingInQueue) {
          const s = partnerResponse.data.session;
          const sessionData = {
            sessionId: s.id || s.sessionId || s._id,
            sessionType: s.sessionType || sessionType,
            title: s.title || 'Call Session',
            status: s.status || 'waiting_for_partner',
            participants: []
          };
          setSession(sessionData);
          setWaitingMessage(`Waiting for someone from ${regionName || 'your region'} to join...`);
          setCallStatus('finding');
          isInitiatorRef.current = true;
        } else {
          setError('Unable to start call session. Please try again.');
        }
      } else {
        setError('Connection failed. Retrying...');
        setTimeout(findPartnerAndInitiateCall, 3000);
      }
      
    } catch (error: any) {
      console.error('Error finding partner:', error);
      if (error.message?.includes('Access token required')) {
        setError('Please login to start calling');
        return;
      }
      
      setError('Connection failed. Retrying...');
      setTimeout(findPartnerAndInitiateCall, 3000);
    }
  };

  // Handle back button press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleEndCall();
      return true;
    });

    return () => backHandler.remove();
  }, []);

  // Initialize on mount
  useEffect(() => {
    // STRICT: Prevent access if user doesn't have subscription
    if (!canMakeCalls) {
      setError('This feature requires an active subscription. Please upgrade to access video/voice calls.');
      setCallStatus('error');
      return;
    }
    
    findPartnerAndInitiateCall();
    
    return () => {
      cleanup();
    };
  }, [canMakeCalls]);

  // Initialize WebRTC when session is active
  useEffect(() => {
    if (callStatus === 'active' && session?.sessionId && !pcRef.current) {
      initializeWebRTC();
    }
  }, [callStatus, session?.sessionId]);

  // Poll for session updates when finding partner
  useEffect(() => {
    if (callStatus === 'finding' && session?.sessionId) {
      const interval = setInterval(async () => {
        try {
          const sessionsResponse = await communicationAPI.getActiveSessions();
          if (sessionsResponse?.success && sessionsResponse.data?.sessions?.length > 0) {
            const activeSession = sessionsResponse.data.sessions.find((s: any) => 
              s._id === session.sessionId || s.sessionId === session.sessionId
            );
            
            if (activeSession && activeSession.status === 'active') {
              const partnerParticipant = activeSession.participants?.find((p: any) => 
                p.role === 'participant' && p.user._id !== currentUserIdRef.current
              );
              
              if (partnerParticipant?.user) {
                setPartner({
                  id: partnerParticipant.user._id,
                  name: partnerParticipant.user.name || 'Call Partner',
                  email: partnerParticipant.user.email || '',
                  profilePicture: partnerParticipant.user.profilePicture,
                  languageLevel: partnerParticipant.user.studentInfo?.languageLevel || 'beginner',
                  lastActive: partnerParticipant.user.lastActive || new Date().toISOString()
                });
              }
              
              setSession(prev => prev ? { ...prev, status: 'active' } : null);
              setCallStatus('active');
              setError(null);
              setWaitingMessage(null);
            }
          }
        } catch (error) {
          console.error('Error polling session:', error);
        }
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [callStatus, session?.sessionId]);

  // Poll for call end
  useEffect(() => {
    if (callStatus === 'active' && session?.sessionId) {
      const interval = setInterval(async () => {
        try {
          const sessionsResponse = await communicationAPI.getActiveSessions();
          const activeSession = sessionsResponse?.success ? 
            sessionsResponse.data?.sessions?.find((s: any) => 
              s._id === session.sessionId || s.sessionId === session.sessionId
            ) : null;
            
          if (!activeSession || ['completed', 'cancelled'].includes(activeSession.status)) {
            const lastParticipant = activeSession?.participants?.find((p: any) => p.leftAt);
            setEndedByName(lastParticipant?.user?.name || partner?.name || 'Partner');
            setShowEndModal(true);
            setCallStatus('ending');
          }
        } catch (error) {
          console.error('Error checking call status:', error);
        }
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [callStatus, session?.sessionId, partner?.name]);

  // Call duration timer
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

  // Toggle mute
  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track: any) => {
        track.enabled = !newMutedState;
      });
    }
  };

  // Toggle speaker
  const toggleSpeaker = async () => {
    const newSpeakerState = !isSpeakerOn;
    setIsSpeakerOn(newSpeakerState);
    
    try {
      await mediaDevices.setAudioOutput(newSpeakerState ? 'speaker' : 'earpiece');
    } catch (error) {
      console.error('Error setting audio output:', error);
    }
  };

  // Request video upgrade
  const requestVideoUpgrade = async () => {
    if (!session?.sessionId || isVideoCall) return;
    
    try {
      const response = await communicationAPI.requestVideoUpgrade(session.sessionId);
      if (response.success) {
        Alert.alert('Video Request Sent', 'Waiting for the other person to accept video...');
      } else {
        Alert.alert('Error', response.message || 'Failed to send video request');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send video request. Please try again.');
    }
  };

  // Handle video response
  const handleVideoResponse = async (accept: boolean) => {
    if (!session?.sessionId) return;
    
    try {
      const response = await communicationAPI.respondToVideoUpgrade(session.sessionId, accept);
      if (response.success && accept) {
        const hasCameraPermission = await requestCameraPermission();
        if (!hasCameraPermission) {
          Alert.alert('Camera Permission Required', 'Camera access is needed for video calls.');
          setShowVideoRequest(false);
          setVideoRequestFrom(null);
          return;
        }
        
        setIsVideoCall(true);
        // Reinitialize WebRTC with video
        setTimeout(() => {
          initializeWebRTC();
        }, 1000);
      }
      
      setShowVideoRequest(false);
      setVideoRequestFrom(null);
    } catch (error) {
      setShowVideoRequest(false);
      setVideoRequestFrom(null);
    }
  };

  // End call
  const handleEndCall = async () => {
    try {
      setCallStatus('ending');
      
      if (session?.sessionId) {
        await communicationAPI.leaveSession(session.sessionId);
      }
      
      cleanup();
      navigation.goBack();
    } catch (error) {
      cleanup();
      navigation.goBack();
    }
  };

  // Cancel request
  const handleCancelRequest = async () => {
    if (cancelingRef.current) return;
    cancelingRef.current = true;
    
    try {
      if (session?.sessionId) {
        await communicationAPI.leaveSession(session.sessionId);
      }
      await communicationAPI.cancelAllSessions();
    } catch (error) {
      // Ignore errors
    } finally {
      cleanup();
      cancelingRef.current = false;
      navigation.goBack();
    }
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status text
  const getStatusText = () => {
    switch (callStatus) {
      case 'finding':
        return waitingMessage || `Finding someone from ${regionName || 'your region'}...`;
      case 'active':
        return isVideoCall ? 'Video Call' : 'Voice Call';
      case 'ending':
        return 'Ending call...';
      default:
        return 'Preparing call...';
    }
  };

  // Error screen
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
          
          <TouchableOpacity style={styles.retryButton} onPress={findPartnerAndInitiateCall}>
            <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelRequest}>
            <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Loading screen
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
          
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelRequest}>
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
      
      <FeatureAccessWrapper
        featureKey="video_calls"
        fallback={null}
        style={styles.container}
        navigation={navigation}
      >
        {isVideoCall ? (
          <View style={styles.videoContainer}>
            {/* Remote Video */}
            <View style={styles.mainVideo}>
              {remoteStream ? (
                <RTCView
                  streamURL={remoteStream.toURL()}
                  style={styles.remoteVideo}
                  objectFit="cover"
                />
              ) : (
                <View style={styles.videoPlaceholderContainer}>
                  <FontAwesome name="user" size={100} color="#FFFFFF" style={styles.videoPlaceholder} />
                  <ThemedText style={styles.videoPlaceholderText}>
                    {isConnected ? 'Waiting for video...' : 'Connecting...'}
                  </ThemedText>
                </View>
              )}
              
              {!isConnected && (
                <View style={styles.connectingOverlay}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <ThemedText style={styles.connectingText}>Connecting...</ThemedText>
                </View>
              )}
            </View>

            {/* Local Video */}
            <View style={styles.selfVideoContainer}>
              <View style={styles.selfVideo}>
                {localStream ? (
                  <RTCView
                    streamURL={localStream.toURL()}
                    style={styles.localVideo}
                    objectFit="cover"
                    mirror={true}
                  />
                ) : (
                  <View style={styles.localVideoPlaceholder}>
                    <FontAwesome name="user" size={20} color="#FFFFFF" />
                  </View>
                )}
              </View>
            </View>

            {/* Call Info Bar */}
            <BlurView intensity={30} style={styles.videoCallInfoBar}>
              <ThemedText style={styles.videoCallName}>{partner?.name || 'Partner'}</ThemedText>
              <ThemedText style={styles.videoCallDuration}>{formatDuration(callDuration)}</ThemedText>
            </BlurView>
          </View>
        ) : (
          <View style={styles.profileContainer}>
            <View style={styles.profileImageContainer}>
              <View style={styles.profileImage}>
                <FontAwesome name="user" size={80} color="#FFFFFF" />
              </View>
            </View>
            
            <ThemedText style={styles.callerName}>{partner?.name || 'Partner'}</ThemedText>
            <ThemedText style={styles.callStatus}>{getStatusText()}</ThemedText>
            <ThemedText style={styles.callDuration}>{formatDuration(callDuration)}</ThemedText>
            
            {!isConnected && callStatus === 'active' && (
              <View style={styles.connectingIndicator}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <ThemedText style={styles.connectingText}>Connecting audio...</ThemedText>
              </View>
            )}
          </View>
        )}

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={[styles.controlButton, isMuted && styles.activeControlButton]}
            onPress={toggleMute}
          >
            <FontAwesome name={isMuted ? "microphone-slash" : "microphone"} size={24} color="#FFFFFF" />
            <ThemedText style={styles.controlLabel}>{isMuted ? "Unmute" : "Mute"}</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, isSpeakerOn && styles.activeControlButton]}
            onPress={toggleSpeaker}
          >
            <FontAwesome name={isSpeakerOn ? "volume-up" : "volume-down"} size={24} color="#FFFFFF" />
            <ThemedText style={styles.controlLabel}>Speaker</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlButton, styles.endCallButton]}
            onPress={handleEndCall}
          >
            <FontAwesome name="phone" size={24} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
            <ThemedText style={styles.controlLabel}>End</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Additional Controls */}
        {!isVideoCall && (
          <View style={styles.additionalControlsContainer}>
            <TouchableOpacity 
              style={styles.additionalControlButton}
              
            >
              <ThemedText style={styles.additionalControlLabel}>Video Call Coming Soon</ThemedText>
              <ThemedText style={styles.additionalControlLabel}>Video</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Quality Indicator */}
        <View style={styles.qualityIndicator}>
          <FontAwesome 
            name="signal" 
            size={14} 
            color={isConnected ? "#4CAF50" : "#FFC107"} 
          />
          <ThemedText style={styles.qualityText}>
            {isConnected ? "Connected" : "Connecting"}
          </ThemedText>
        </View>

        {/* Permission Error */}
        {permissionError && (
          <View style={styles.permissionError}>
            <ThemedText style={styles.permissionErrorText}>{permissionError}</ThemedText>
          </View>
        )}

        {/* Video Request Modal */}
        <Modal visible={showVideoRequest} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <FontAwesome name="video-camera" size={36} color="#226cae" />
              <ThemedText style={styles.modalTitle}>Video Call Request</ThemedText>
              <ThemedText style={styles.modalMessage}>
                {videoRequestFrom} wants to turn on video. Accept?
              </ThemedText>
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.declineButton]} 
                  onPress={() => handleVideoResponse(false)}
                >
                  <ThemedText style={styles.declineButtonText}>Decline</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.acceptButton]} 
                  onPress={() => handleVideoResponse(true)}
                >
                  <ThemedText style={styles.acceptButtonText}>Accept</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Call Ended Modal */}
        <Modal visible={showEndModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: '#ffffff' }]}>
              <FontAwesome name="phone" size={36} color="#dc2929" />
              <ThemedText style={[styles.modalTitle, { color: '#1a5085' }]}>Call Ended</ThemedText>
              <ThemedText style={[styles.modalMessage, { color: '#333' }]}>
                {endedByName} has ended the call.
              </ThemedText>
              <TouchableOpacity 
                onPress={() => { setShowEndModal(false); navigation.goBack(); }} 
                style={[styles.modalButton, { backgroundColor: '#226cae' }]}
              >
                <ThemedText style={{ color: '#fff', fontWeight: '600' }}>OK</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </FeatureAccessWrapper>
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
  connectingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  connectingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 10,
    fontSize: 14,
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 50,
    paddingBottom: 20,
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
    top: 50,
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
    position: 'relative',
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a5085',
  },
  videoPlaceholder: {
    opacity: 0.5,
  },
  videoPlaceholderText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  connectingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfVideoContainer: {
    position: 'absolute',
    top: 60,
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
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  localVideoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    marginBottom: 30,
  },
  permissionError: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    padding: 15,
    borderRadius: 10,
  },
  permissionErrorText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    width: '80%',
    maxWidth: 300,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  declineButton: {
    backgroundColor: '#f44336',
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  declineButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});