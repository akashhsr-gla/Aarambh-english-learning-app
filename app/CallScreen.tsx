import { StyleSheet, View, TouchableOpacity, Image as RNImage, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';

import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';

export default function CallScreen() {
  const navigation = useNavigation();
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  
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
    navigation.goBack();
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };
  
  const switchToVideo = () => {
    setIsVideoCall(true);
  };
  
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
            <ThemedText style={styles.videoCallName}>Sarah</ThemedText>
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
          
          <ThemedText style={styles.callerName}>Sarah</ThemedText>
          <ThemedText style={styles.callStatus}>English Conversation</ThemedText>
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
}); 