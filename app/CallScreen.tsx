import { FontAwesome } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import FeatureAccessWrapper from './components/FeatureAccessWrapper';
import { useFeatureAccess } from './hooks/useFeatureAccess';
// Conditional imports for React Native WebRTC (only on native platforms)
let RTCPeerConnection: any;
let RTCView: any;
let mediaDevices: any;
let MediaStream: any;
let MediaStreamTrack: any;

if (Platform.OS !== 'web') {
  const webrtc = require('react-native-webrtc');
  RTCPeerConnection = webrtc.RTCPeerConnection;
  RTCView = webrtc.RTCView;
  mediaDevices = webrtc.mediaDevices;
  MediaStream = webrtc.MediaStream;
  MediaStreamTrack = webrtc.MediaStreamTrack;
}

import { ThemedText } from '../components/ThemedText';
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
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(callType === 'video');
  const [callStatus, setCallStatus] = useState('finding'); // finding, connecting, active, ending
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
  const [connectionEstablished, setConnectionEstablished] = useState(false);

  // Feature access control
  const { canAccess: canMakeCalls, featureInfo: callFeatureInfo } = useFeatureAccess('video_calls');
  
  const cancelingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // WebRTC refs
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<any>(null);
  const remoteStreamRef = useRef<any>(null);
  const remoteAudioElRef = useRef<HTMLAudioElement | null>(null);
  const remoteVideoElRef = useRef<HTMLVideoElement | null>(null);
  const localVideoElRef = useRef<HTMLVideoElement | null>(null);
  const appliedIceSetRef = useRef<Set<string>>(new Set());
  const signalingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isOfferCreatedRef = useRef(false);
  
  // Load current user's region and start call on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        const userResp = await authAPI.getCurrentUser();
        const rName = userResp?.data?.user?.region?.name || userResp?.data?.region?.name;
        if (rName) {
          console.log('', rName);
          setRegionName(rName);
        }
      } catch {}
      
      await findPartnerAndInitiateCall();
    };
    
    initialize();
    
    return () => {
      cleanup();
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
  
  const cleanup = useCallback(() => {
    // Clear timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (signalingIntervalRef.current) {
      clearInterval(signalingIntervalRef.current);
      signalingIntervalRef.current = null;
    }
    
    // Close WebRTC connection
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track: any) => {
          track.stop();
        });
        localStreamRef.current = null;
      }
      
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      
      if (Platform.OS === 'web') {
        if (remoteAudioElRef.current) {
          remoteAudioElRef.current.srcObject = null;
        }
        
        if (remoteVideoElRef.current) {
          remoteVideoElRef.current.srcObject = null;
        }
        
        if (localVideoElRef.current) {
          localVideoElRef.current.srcObject = null;
        }
      }
    } catch (e) {
      console.error('Cleanup error:', e);
    }
  }, []);
  
  const findPartnerAndInitiateCall = async () => {
    try {
      setCallStatus('finding');
      setError(null);
      setWaitingMessage(null);
      
      // Check if user already has an active session
      const sessionsResponse = await communicationAPI.getActiveSessions();
      
      if (sessionsResponse.success && sessionsResponse.data?.sessions?.length > 0) {
        // Found active session - resume it
        const activeSession = sessionsResponse.data.sessions[0];
        
        if (activeSession.status === 'waiting_for_partner') {
          setSession({
            sessionId: activeSession._id,
            sessionType: activeSession.sessionType || (callType === 'video' ? 'video_call' : 'voice_call'),
            title: activeSession.title || 'Call Session',
            status: activeSession.status,
            participants: activeSession.participants || []
          });
          setWaitingMessage(`Waiting for someone from ${regionName || 'your region'} to join the ${callType} call...`);
          setCallStatus('finding');
          return;
        }
        
        // Set basic session info for active call
        setSession({
          sessionId: activeSession._id,
          sessionType: activeSession.sessionType || (callType === 'video' ? 'video_call' : 'voice_call'),
          title: activeSession.title || 'Call Session',
          status: activeSession.status || 'active',
          participants: activeSession.participants || []
        });
        
        // Extract partner info
        const participants = activeSession.participants || [];
        const partnerParticipant = participants.find((p: any) => p?.role === 'participant');
        
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
        
        setCallStatus('active');
        setIsVideoCall(activeSession.sessionType === 'video_call');
        return;
      }
      
      // No active session - find a partner from same region
      const sessionType = callType === 'video' ? 'video_call' : 'voice_call';
      const partnerResponse = await communicationAPI.findPartner(sessionType);
      
      if (partnerResponse.success) {
        if (partnerResponse.data?.partner) {
          // Found a partner immediately - they were waiting!
          setPartner(partnerResponse.data.partner);
          const s = partnerResponse.data.session;
          const sessionData = {
            sessionId: s.id || s.sessionId,
            sessionType: s.sessionType || sessionType,
            title: s.title || 'Call Session',
            status: s.status || 'active',
            participants: []
          };
          console.log('', sessionData);
          setSession(sessionData);
          setCallStatus('active');
        } else if (partnerResponse.data?.waitingInQueue) {
          // We're now waiting for someone else to join
          console.log('⏳ Waiting in queue for partner');
          const s = partnerResponse.data.session;
          const sessionData = {
            sessionId: s.id || s.sessionId,
            sessionType: s.sessionType || sessionType,
            title: s.title || 'Call Session',
            status: s.status || 'waiting_for_partner',
            participants: []
          };
          setSession(sessionData);
          setWaitingMessage(`Waiting for someone from ${partnerResponse.data.regionInfo?.name || regionName || 'your region'} to join the ${callType} call...`);
          console.log('📝 Setting call status to finding');
          setCallStatus('finding');
        } else {
          setError('Unable to start call session. Please try again.');
        }
      } else {
        setError('Connection failed. Retrying...');
        setTimeout(() => {
          findPartnerAndInitiateCall();
        }, 3000);
      }
      
    } catch (error: any) {
      if (error.message?.includes('Access token required')) {
        setError('Please login to start calling');
        return;
      }
      
      if (error.message?.includes('already in an active session')) {
        setTimeout(() => {
          findPartnerAndInitiateCall();
        }, 1000);
        return;
      }
      
      setError('Connection failed. Retrying...');
      setTimeout(() => {
        findPartnerAndInitiateCall();
      }, 3000);
    }
  };
  
  // Initialize WebRTC when call becomes active
  useEffect(() => {
    if ((callStatus === 'active' || callStatus === 'finding') && session?.sessionId && !pcRef.current) {
      initializeWebRTC();
    }
  }, [callStatus, session?.sessionId]);
  
  // Poll for partner joining
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
              const partnerParticipant = activeSession.participants?.find((p: any) => p.role === 'participant');
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
              setIsVideoCall(activeSession.sessionType === 'video_call');
            }
          }
        } catch (error) {
          // Continue polling on error
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [callStatus, session?.sessionId]);
  
  // Poll for session end
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
          // Continue polling
        }
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [callStatus, session?.sessionId, partner?.name]);
  
  // Poll for video upgrade requests and session updates
  useEffect(() => {
    if (callStatus === 'active' && session?.sessionId) {
      const interval = setInterval(async () => {
        try {
          // Check for video upgrade requests
          if (!isVideoCall) {
            const response = await communicationAPI.checkVideoRequest(session.sessionId);
            if (response.success && response.data?.hasPendingRequest) {
              setVideoRequestFrom(response.data.request?.from || 'Partner');
              setShowVideoRequest(true);
            }
          }
          
          // Check if session has been upgraded to video
          const sessionsResponse = await communicationAPI.getActiveSessions();
          if (sessionsResponse?.success && sessionsResponse.data?.sessions?.length > 0) {
            const activeSession = sessionsResponse.data.sessions.find((s: any) => 
              s._id === session.sessionId || s.sessionId === session.sessionId
            );
            
            if (activeSession) {
              // Check if session type changed to video_call
              if (activeSession.sessionType === 'video_call' && !isVideoCall) {
                console.log('📹 Session upgraded to video call, switching to video mode');
                setIsVideoCall(true);
                setSession(prev => prev ? { ...prev, sessionType: 'video_call' } : null);
                
                // Show notification that call was upgraded to video
                Alert.alert('Video Call', 'The call has been upgraded to video!');
                
                // Add video track and renegotiate if we're on web
                if (Platform.OS === 'web' && pcRef.current) {
                  try {
                    // Get video stream
                    const videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                    const videoTrack = videoStream.getVideoTracks()[0];
                    
                    if (videoTrack && localStreamRef.current) {
                      // Add video track to existing stream and peer connection
                      (localStreamRef.current as any).addTrack(videoTrack as any);
                      (pcRef.current as any).addTrack(videoTrack as any, localStreamRef.current);
                      
                      // Show local video preview
                      if (localVideoElRef.current) {
                        localVideoElRef.current.srcObject = localStreamRef.current;
                        localVideoElRef.current.muted = true;
                        localVideoElRef.current.play().catch(console.error);
                      }

                      // Force renegotiation to send video to remote
                      console.log('🔄 Renegotiating with video track');
                      const offer = await pcRef.current.createOffer();
                      await pcRef.current.setLocalDescription(offer);
                      await communicationAPI.postOffer(session.sessionId, { type: offer.type, sdp: offer.sdp });
                    }
                  } catch (error) {
                    console.error('❌ Failed to add video track after upgrade:', error);
                  }
                }
              }
            }
          }
        } catch (error) {
          // Continue polling
        }
      }, 1500);
      
      return () => clearInterval(interval);
    }
  }, [callStatus, session?.sessionId, isVideoCall]);
  
  const initializeWebRTC = async () => {
    if (!session?.sessionId) {
      return;
    }

    try {
      // Create peer connection with platform-specific configuration
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
          { urls: 'stun:stun.services.mozilla.com' },
          // Add TURN servers for when STUN fails
          { 
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          { 
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          }
        ],
        iceCandidatePoolSize: 10,
        iceTransportPolicy: 'all' as RTCIceTransportPolicy
      };
      
      // Use platform-specific RTCPeerConnection
      const pc = Platform.OS === 'web' 
        ? new (window as any).RTCPeerConnection(configuration)
        : new RTCPeerConnection(configuration);
      pcRef.current = pc;
      
      // Add transceivers to ensure we can receive media
      if (Platform.OS === 'web') {
        pc.addTransceiver('audio', { direction: 'sendrecv' });
        if (isVideoCall) {
          pc.addTransceiver('video', { direction: 'sendrecv' });
        }
      }
      
      // Handle remote stream - create a single stream for all tracks
      (pc as any).ontrack = (event: any) => {
        console.log('🎵 Received remote track:', event.track.kind, 'enabled:', event.track.enabled);
        console.log('🎵 Stream details:', event.streams[0]);
        
        if (!remoteStreamRef.current) {
          if (Platform.OS === 'web') {
            remoteStreamRef.current = new MediaStream();
          } else {
            remoteStreamRef.current = new MediaStream();
          }
        }
        
        // Add track to remote stream
        remoteStreamRef.current.addTrack(event.track as any);
        
        // Assign to appropriate element
        if (event.track.kind === 'audio') {
          console.log('🔊 Setting up remote audio');
          if (remoteAudioElRef.current) {
            remoteAudioElRef.current.srcObject = remoteStreamRef.current;
            remoteAudioElRef.current.volume = 1.0;
            remoteAudioElRef.current.muted = false;
            console.log('🔊 Audio element properties:', {
              volume: remoteAudioElRef.current.volume,
              muted: remoteAudioElRef.current.muted,
              paused: remoteAudioElRef.current.paused,
              stream: remoteStreamRef.current
            });
            
            // Small delay to ensure stream is ready
            setTimeout(() => {
              if (remoteAudioElRef.current) {
                remoteAudioElRef.current.play().then(() => {
                  console.log('🔊 Remote audio playing successfully');
                }).catch(e => {
                  console.error('❌ Audio play error:', e);
                });
              }
            }, 100);
            
            console.log('🔊 Remote audio element set up');
          } else {
            console.log('❌ No remote audio element found');
          }
        }
        
        if (event.track.kind === 'video') {
          console.log('📹 Setting up remote video');
          if (remoteVideoElRef.current) {
            remoteVideoElRef.current.srcObject = remoteStreamRef.current;
            remoteVideoElRef.current.play().catch(e => console.error('Video play error:', e));
            console.log('📹 Remote video element set up');
          } else {
            console.log('❌ No remote video element found');
          }
        }
        
        setIsConnected(true);
      };
      
      // Handle ICE candidates
      (pc as any).onicecandidate = async (event: any) => {
        if (event.candidate && session?.sessionId) {
          try {
            await communicationAPI.postIce(session.sessionId, {
              candidate: JSON.stringify(event.candidate),
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
            });
          } catch (error) {
            console.error('Failed to send ICE candidate:', error);
          }
        }
      };
      
      // Handle connection state changes
      (pc as any).onconnectionstatechange = () => {
        
        // Handle connection state changes
        if (pc.connectionState === 'connected') {
          console.log('🎉 WebRTC connection established!');
          setIsConnected(true);
          setConnectionEstablished(true);
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          // Only set disconnected if ICE is also not connected
          if (pc.iceConnectionState !== 'connected' && pc.iceConnectionState !== 'completed') {
            console.log('❌ WebRTC connection failed');
            setIsConnected(false);
          }
        }
      };
      
      // Add ICE connection state change handler
      (pc as any).oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          console.log('🎉 ICE connection established!');
          setIsConnected(true);
          setConnectionEstablished(true);
          clearTimeout(iceTimeout);
          
          // Test audio connectivity
          if (remoteAudioElRef.current && remoteStreamRef.current) {
            console.log('🔊 Testing audio connection - remote audio tracks:', 
                       remoteStreamRef.current.getAudioTracks().length);
          }
        } else if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
          console.log('❌ ICE connection failed/disconnected');
          setIsConnected(false);
        } else if (pc.iceConnectionState === 'checking') {
          console.log('🔄 ICE checking - trying to connect...');
        }
      };
      
      // Add timeout for ICE connection
      const iceTimeout = setTimeout(() => {
        if (pc.iceConnectionState === 'checking') {
          // still checking after 10s
        }
      }, 10000);
      
      // Get local media first
      await getLocalMedia();
      
      // Debug: Check if we got valid media
      if (localStreamRef.current) {
        const audioTracks = localStreamRef.current.getAudioTracks();
      }
      
      // Create initial offer after getting media
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await communicationAPI.postOffer(session.sessionId, {
        type: offer.type,
        sdp: offer.sdp
      });
      
      
      // Start signaling polling
      startSignalingPolling();
      
    } catch (error) {
      console.error('WebRTC initialization error:', error);
      setError('Failed to initialize call. Please try again.');
    }
  };
  
  const getLocalMedia = async () => {
    try {
      let stream;
      
      if (Platform.OS === 'web') {
        // Web implementation
        const constraints = {
          audio: true,
          video: isVideoCall
        };
        
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Show local video preview for web
        if (isVideoCall && localVideoElRef.current) {
          localVideoElRef.current.srcObject = stream;
          localVideoElRef.current.muted = true;
          localVideoElRef.current.play().catch(console.error);
        }
      } else {
        // React Native implementation
        const constraints = {
          audio: true,
          video: isVideoCall ? {
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
            frameRate: { min: 15, ideal: 30, max: 30 }
          } : false
        };
        
        stream = await mediaDevices.getUserMedia(constraints);
      }
      
      localStreamRef.current = stream;
      
      // Add tracks to peer connection
      if (pcRef.current) {
        stream.getTracks().forEach((track: any) => {
          (pcRef.current as any)!.addTrack(track as any, stream);
        });
      }
      
    } catch (error) {
      console.error('Failed to get local media:', error);
      setPermissionError('Please allow microphone' + (isVideoCall ? ' and camera' : '') + ' access to join the call.');
    }
  };
  
  const startSignalingPolling = () => {
    if (signalingIntervalRef.current) {
      clearInterval(signalingIntervalRef.current);
    }
    
    signalingIntervalRef.current = setInterval(async () => {
      if (!session?.sessionId || !pcRef.current) return;
      
      try {
        const response = await communicationAPI.getSignaling(session.sessionId);
        const signaling = response?.data?.signaling || {};
        
        // Handle offer - if we receive an offer and don't have a remote description yet
        if (signaling.offer?.sdp && !pcRef.current.remoteDescription) {
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
        
        // Handle answer - if we receive an answer and have a local description but no remote
        if (signaling.answer?.sdp && pcRef.current.localDescription && !pcRef.current.remoteDescription) {
          await pcRef.current.setRemoteDescription({
            type: 'answer',
            sdp: signaling.answer.sdp
          });
        }
        
        // Create offer if we haven't yet and there's no existing offer
        if (!signaling.offer?.sdp && !isOfferCreatedRef.current && !pcRef.current.localDescription) {
          isOfferCreatedRef.current = true;
          
          const offer = await pcRef.current.createOffer();
          await pcRef.current.setLocalDescription(offer);
          
          await communicationAPI.postOffer(session.sessionId, {
            type: offer.type,
            sdp: offer.sdp
          });
        }
        
        // Handle ICE candidates
        if (Array.isArray(signaling.iceCandidates)) {
          for (const candidate of signaling.iceCandidates) {
            if (!candidate?.candidate) {
              console.log('❌ Invalid ICE candidate:', candidate);
              continue;
            }
            
            const key = candidate.candidate;
            if (appliedIceSetRef.current.has(key)) {
              continue;
            }
            
            appliedIceSetRef.current.add(key);
            
            try {
              await pcRef.current.addIceCandidate(JSON.parse(candidate.candidate));
            } catch (error) {
              console.error('❌ Failed to add ICE candidate:', error);
              
            }
          }
        } else {
        }
        
      } catch (error) {
        console.error('Signaling polling error:', error);
      }
    }, 1000);
  };
  
  const toggleMute = async () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    // Update backend state
    if (session?.sessionId) {
      try {
        await communicationAPI.updateParticipantState(session.sessionId, {
          micEnabled: !newMutedState
        });
      } catch (error) {
        console.error('Update mic state error:', error);
        setIsMuted(!newMutedState); // Revert on error
      }
    }
    
    // Toggle local audio track
    if (Platform.OS === 'web' && localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track: any) => {
        track.enabled = !newMutedState;
      });
    }
  };
  
  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };
  
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
      console.error('Video upgrade request error:', error);
      Alert.alert('Error', 'Failed to send video request. Please try again.');
    }
  };
  
  const handleVideoResponse = async (accept: boolean) => {
    if (!session?.sessionId) return;
    
    try {
      const response = await communicationAPI.respondToVideoUpgrade(session.sessionId, accept);
      if (response.success) {
        if (accept) {
    setIsVideoCall(true);
          setSession(prev => prev ? { ...prev, sessionType: 'video_call' } : null);
          
          // Add video track to existing stream
          if (Platform.OS === 'web' && localStreamRef.current && pcRef.current) {
            try {
              const videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
              const videoTrack = videoStream.getVideoTracks()[0];
              
              if (videoTrack) {
                (localStreamRef.current as any).addTrack(videoTrack as any);
                (pcRef.current as any).addTrack(videoTrack as any, localStreamRef.current);
                
                // Show local video preview
                if (localVideoElRef.current) {
                  localVideoElRef.current.srcObject = localStreamRef.current;
                  localVideoElRef.current.muted = true;
                  localVideoElRef.current.play().catch(console.error);
                }
                
                // Force renegotiation so remote receives the new video track
                const offer = await pcRef.current.createOffer();
                await pcRef.current.setLocalDescription(offer);
                await communicationAPI.postOffer(session.sessionId, { type: offer.type, sdp: offer.sdp });
              }
            } catch (error) {
              console.error('❌ Failed to add video track:', error);
            }
          }
        } else {
          console.log('Video upgrade rejected');
        }
      }
      
      setShowVideoRequest(false);
      setVideoRequestFrom(null);
    } catch (error) {
      console.error('Video response error:', error);
      setShowVideoRequest(false);
      setVideoRequestFrom(null);
    }
  };
  
  const handleEndCall = async () => {
    try {
      setCallStatus('ending');
      
      if (session?.sessionId) {
        await communicationAPI.leaveSession(session.sessionId);
        
        if (Platform.OS === 'web' && session?.sessionId) {
          await communicationAPI.clearSignaling(session.sessionId);
        }
      }
      
      cleanup();
      navigation.goBack();
    } catch (error) {
      console.error('End call error:', error);
      cleanup();
      navigation.goBack();
    }
  };
  
  const handleCancelRequest = async () => {
    if (cancelingRef.current) return;
    cancelingRef.current = true;
    
    try {
      await communicationAPI.cancelAllSessions();
      await communicationAPI.purgeAllSessionsHard();
    } catch (error) {
      console.error('Cancel request error:', error);
    } finally {
      cleanup();
      cancelingRef.current = false;
      navigation.goBack();
    }
  };
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getStatusText = () => {
    switch (callStatus) {
      case 'finding':
        return waitingMessage || `Finding someone from ${regionName || 'your region'} for a ${callType} call...`;
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
          
          <TouchableOpacity style={styles.retryButton} onPress={findPartnerAndInitiateCall}>
            <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.cancelPrimaryButton} onPress={handleCancelRequest}>
            <ThemedText style={styles.cancelPrimaryButtonText}>Cancel</ThemedText>
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
        // Video call view
        <View style={styles.videoContainer}>
          {/* Main video (remote person) */}
          <View style={styles.mainVideo}>
            {Platform.OS === 'web' ? (
              <video 
                ref={remoteVideoElRef as any} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                playsInline 
                autoPlay
                muted={false}
              />
            ) : (
              RTCView ? (
                <RTCView
                  streamURL={remoteStreamRef.current?.toURL?.() || ''}
                  style={styles.remoteVideo}
                  mirror={false}
                  objectFit="cover"
                />
              ) : (
            <FontAwesome name="user" size={100} color="#FFFFFF" style={styles.videoPlaceholder} />
              )
            )}
            {!isConnected && (
              <View style={styles.connectingOverlay}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <ThemedText style={styles.connectingText}>Connecting...</ThemedText>
              </View>
            )}
          </View>
          
          {/* Self video (small overlay) */}
          <View style={styles.selfVideoContainer}>
            <View style={styles.selfVideo}>
              {Platform.OS === 'web' ? (
                <video 
                  ref={localVideoElRef as any} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  muted 
                  playsInline 
                  autoPlay
                />
              ) : (
                RTCView ? (
                  <RTCView
                    streamURL={localStreamRef.current?.toURL?.() || ''}
                    style={styles.localVideo}
                    mirror={true}
                    objectFit="cover"
                  />
                ) : (
              <FontAwesome name="user" size={40} color="#FFFFFF" />
                )
              )}
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
          
          {!isConnected && callStatus === 'active' && (
            <View style={styles.connectingIndicator}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <ThemedText style={styles.connectingText}>Connecting audio...</ThemedText>
            </View>
          )}
        </View>
      )}
      
      {/* Hidden audio element for all calls */}
      {Platform.OS === 'web' && (
        <audio ref={remoteAudioElRef as any} autoPlay style={{ display: 'none' }} />
      )}
      
      {/* Hidden video element for video calls */}
      {Platform.OS === 'web' && isVideoCall && (
        <video ref={remoteVideoElRef as any} autoPlay playsInline style={{ display: 'none' }} />
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
            onPress={requestVideoUpgrade}
          >
            <FontAwesome name="video-camera" size={20} color="#FFFFFF" />
            <ThemedText style={styles.additionalControlLabel}>Video</ThemedText>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Call Quality Indicator */}
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
      
      {/* Session Ended Modal */}
      <Modal visible={showEndModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: '#ffffff' }] }>
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
    position: 'relative',
  },
  videoPlaceholder: {
    opacity: 0.5,
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
  remoteVideo: {
    width: '100%',
    height: '100%',
  },
  localVideo: {
    width: '100%',
    height: '100%',
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
    backgroundColor: 'rgba(34, 108, 174, 0.08)',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ffffff',
    marginTop: 16,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelPrimaryButton: {
    marginTop: 18,
    backgroundColor: '#ffffff',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 26,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  cancelPrimaryButtonText: {
    color: '#226cae',
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