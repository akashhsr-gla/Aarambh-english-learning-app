import { FontAwesome } from '@expo/vector-icons';
import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { sessionsAPI } from '../services/api';

interface VideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
  style?: any;
  showControls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  resizeMode?: ResizeMode;
  // Lecture session tracking
  lectureId?: string;
  totalDuration?: number;
  onSessionUpdate?: (sessionData: any) => void;
}

const { width: screenWidth } = Dimensions.get('window');

export default function VideoPlayer({
  videoUrl,
  thumbnailUrl,
  onPlaybackStatusUpdate,
  onComplete,
  onError,
  style,
  showControls = true,
  autoPlay = false,
  loop = false,
  muted = false,
  resizeMode = ResizeMode.CONTAIN,
  // Lecture session tracking
  lectureId,
  totalDuration,
  onSessionUpdate
}: VideoPlayerProps) {
  const [status, setStatus] = useState<AVPlaybackStatus>({} as AVPlaybackStatus);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const videoRef = useRef<Video>(null);
  
  // Lecture session tracking
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [lastPosition, setLastPosition] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);

  // Handle playback status updates
  const handlePlaybackStatusUpdate = (playbackStatus: AVPlaybackStatus) => {
    setStatus(playbackStatus);
    
    // Call parent callback
    if (onPlaybackStatusUpdate) {
      onPlaybackStatusUpdate(playbackStatus);
    }

    // Handle completion
    if ('didJustFinish' in playbackStatus && playbackStatus.didJustFinish && onComplete) {
      onComplete();
    }

    // Handle loading state
    if ('isLoaded' in playbackStatus && playbackStatus.isLoaded) {
      setIsLoading(false);
      setHasError(false);
    } else if ('error' in playbackStatus && playbackStatus.error) {
      setIsLoading(false);
      setHasError(true);
      setErrorMessage(playbackStatus.error);
      if (onError) {
        onError(playbackStatus.error);
      }
    }
  };

  // Play/pause toggle
  const togglePlayPause = async () => {
    try {
      if ('isLoaded' in status && status.isLoaded) {
        const currentPosition = Math.floor((('positionMillis' in status ? status.positionMillis : 0) || 0) / 1000);
        
        if ('isPlaying' in status && status.isPlaying) {
          await videoRef.current?.pauseAsync();
          // Track pause in session
          if (lectureId) {
            if (!isSessionActive) {
              await createOrUpdateLectureSession(currentPosition, 'pause');
            } else {
              await updateLectureProgress(currentPosition, 'pause');
            }
          }
        } else {
          await videoRef.current?.playAsync();
          // Track play in session
          if (lectureId) {
            if (!isSessionActive) {
              await createOrUpdateLectureSession(currentPosition, 'play');
            } else {
              await updateLectureProgress(currentPosition, 'play');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
      if (onError) {
        onError('Failed to play/pause video');
      }
    }
  };

  // Seek to specific position
  const seekTo = async (positionMillis: number) => {
    try {
      if ('isLoaded' in status && status.isLoaded) {
        await videoRef.current?.setPositionAsync(positionMillis);
        
        // Track seek in session
        if (lectureId) {
          const position = Math.floor(positionMillis / 1000);
          if (!isSessionActive) {
            await createOrUpdateLectureSession(position, 'seek');
          } else {
            await updateLectureProgress(position, 'seek');
          }
        }
      }
    } catch (error) {
      console.error('Error seeking video:', error);
      if (onError) {
        onError('Failed to seek video');
      }
    }
  };

  // Format time in MM:SS format
  const formatTime = (millis: number) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle video load error
  const handleLoadError = (error: string) => {
    console.error('Video load error:', error);
    setIsLoading(false);
    setHasError(true);
    setErrorMessage(error);
    if (onError) {
      onError(error);
    }
  };

  // Lecture session management functions
  const createOrUpdateLectureSession = async (position: number, action: string = 'play') => {
    if (!lectureId) return;

    try {
      const response = await sessionsAPI.createOrUpdateLectureSession({
        lectureId,
        totalDuration,
        position,
        action
      });

      if (response.success) {
        setCurrentSessionId(response.data.sessionId);
        setIsSessionActive(true);
        
        if (onSessionUpdate) {
          onSessionUpdate(response.data);
        }
      }
    } catch (error) {
      console.error('Error creating/updating lecture session:', error);
    }
  };

  const updateLectureProgress = async (position: number, action: string = 'play') => {
    if (!currentSessionId || !isSessionActive) return;

    try {
      await sessionsAPI.updateLectureProgress(currentSessionId, {
        position,
        action
      });
    } catch (error) {
      console.error('Error updating lecture progress:', error);
    }
  };

  // Track position changes for session updates
  useEffect(() => {
    if (!lectureId || !isSessionActive) return;

    const interval = setInterval(() => {
      if ('positionMillis' in status && status.isLoaded && 'isPlaying' in status && status.isPlaying) {
        const currentPosition = Math.floor((status.positionMillis || 0) / 1000);
        
        // Update session every 10 seconds or on significant position changes
        if (currentPosition - lastPosition >= 10 || Math.abs(currentPosition - lastPosition) >= 30) {
          updateLectureProgress(currentPosition, 'play');
          setLastPosition(currentPosition);
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [lectureId, isSessionActive, status, lastPosition, currentSessionId]);

  // Check if URL is a Google Drive URL and show appropriate message
  const isGoogleDriveUrl = videoUrl.includes('drive.google.com');
  const isDirectGoogleDriveUrl = videoUrl.includes('uc?export=view');

  return (
    <ThemedView style={[styles.container, style]}>
      {/* Video Player */}
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={styles.video}
          resizeMode={resizeMode}
          shouldPlay={autoPlay}
          isLooping={loop}
          isMuted={muted}
          useNativeControls={false}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          onError={handleLoadError}
        />

        {/* Loading Overlay */}
        {isLoading && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <ThemedText style={styles.loadingText}>Loading video...</ThemedText>
          </View>
        )}

        {/* Error Overlay */}
        {hasError && (
          <View style={styles.overlay}>
            <FontAwesome name="exclamation-triangle" size={48} color="#FF6B6B" />
            <ThemedText style={styles.errorText}>Failed to load video</ThemedText>
            <ThemedText style={styles.errorSubtext}>{errorMessage}</ThemedText>
            <TouchableOpacity style={styles.retryButton} onPress={() => {
              setHasError(false);
              setIsLoading(true);
              // The video will retry loading automatically
            }}>
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Google Drive URL Warning */}
        {isGoogleDriveUrl && !isDirectGoogleDriveUrl && (
          <View style={styles.warningOverlay}>
            <FontAwesome name="info-circle" size={24} color="#FFA500" />
            <ThemedText style={styles.warningText}>
              This appears to be a Google Drive sharing URL. For better playback, use the direct video URL.
            </ThemedText>
          </View>
        )}

        {/* Custom Controls */}
        {'isLoaded' in status && status.isLoaded && (
          <View style={styles.customControls}>
            <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
              <FontAwesome 
                name={('isPlaying' in status && status.isPlaying) ? "pause" : "play"} 
                size={24} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Video Info */}
      {'isLoaded' in status && status.isLoaded && (
        <View style={styles.videoInfo}>
          <ThemedText style={styles.timeText}>
            {formatTime(('positionMillis' in status ? status.positionMillis : 0) || 0)} / {formatTime(('durationMillis' in status ? status.durationMillis : 0) || 0)}
          </ThemedText>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${(((('positionMillis' in status ? status.positionMillis : 0) || 0) / (('durationMillis' in status ? status.durationMillis : 0) || 1)) * 100)}%` 
                }
              ]} 
            />
          </View>
        </View>
      )}

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    borderRadius: 10,
    overflow: 'hidden',
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9, // Standard video aspect ratio
    backgroundColor: '#000000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  errorSubtext: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 15,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  warningOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 165, 0, 0.9)',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  customControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoInfo: {
    padding: 15,
    backgroundColor: '#1A1A1A',
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 2,
  },
});
