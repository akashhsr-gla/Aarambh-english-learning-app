import { FontAwesome } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { convertGoogleDriveUrl, isGoogleDriveUrl, validateGoogleDriveUrl } from '../utils/googleDriveHelper';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ImageViewerProps {
  imageUrl: string;
  title?: string;
  style?: any;
  onError?: (error: string) => void;
  showControls?: boolean;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}

export default function ImageViewer({
  imageUrl,
  title = 'Image',
  style,
  onError,
  showControls = true,
  resizeMode = 'contain'
}: ImageViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);

  // Convert Google Drive URL to direct image URL
  const directImageUrl = convertGoogleDriveUrl(imageUrl, 'image');
  const isGoogleDrive = isGoogleDriveUrl(imageUrl);
  const validation = validateGoogleDriveUrl(imageUrl);

  // Handle image load error
  const handleLoadError = (error: any) => {
    console.error('Image load error:', error);
    setIsLoading(false);
    setHasError(true);
    const errorMsg = error?.message || 'Failed to load image';
    setErrorMessage(errorMsg);
    setImageLoaded(false);

    if (onError) {
      onError(errorMsg);
    }
  };

  // Handle image load success
  const handleLoadSuccess = () => {
    setIsLoading(false);
    setHasError(false);
    setImageLoaded(true);
  };

  // Handle retry
  const handleRetry = () => {
    setHasError(false);
    setErrorMessage('');
    setIsLoading(true);
    setImageLoaded(false);
  };

  return (
    <ThemedView style={[styles.container, style]}>
      {/* Image Header */}
      {showControls && (
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <FontAwesome name="image" size={20} color="#3B82F6" />
            <ThemedText style={styles.title}>{title}</ThemedText>
          </View>
          
          {/* Google Drive Status */}
          {isGoogleDrive && (
            <View style={styles.statusContainer}>
              {validation.isValid ? (
                <View style={styles.validStatus}>
                  <FontAwesome name="check-circle" size={12} color="#10B981" />
                  <ThemedText style={styles.statusText}>Google Drive</ThemedText>
                </View>
              ) : (
                <View style={styles.invalidStatus}>
                  <FontAwesome name="exclamation-triangle" size={12} color="#F59E0B" />
                  <ThemedText style={styles.statusText}>Invalid URL</ThemedText>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Image Container */}
      <View style={styles.imageContainer}>
        {/* Loading Overlay */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <ThemedText style={styles.loadingText}>Loading image...</ThemedText>
          </View>
        )}

        {/* Error Overlay */}
        {hasError && (
          <View style={styles.errorContainer}>
            <FontAwesome name="exclamation-triangle" size={48} color="#EF4444" />
            <ThemedText style={styles.errorText}>Failed to load image</ThemedText>
            <ThemedText style={styles.errorSubtext}>{errorMessage}</ThemedText>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Image */}
        {!hasError && (
          <Image
            source={{ uri: directImageUrl }}
            style={styles.image}
            resizeMode={resizeMode}
            onLoadStart={() => setIsLoading(true)}
            onLoad={handleLoadSuccess}
            onError={handleLoadError}
            onLoadEnd={() => setIsLoading(false)}
          />
        )}
      </View>

      {/* Image Info */}
      {!hasError && imageLoaded && showControls && (
        <View style={styles.infoContainer}>
          <ThemedText style={styles.infoText}>
            {isGoogleDrive ? 'Google Drive image loaded successfully' : 'Image loaded successfully'}
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  validStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  invalidStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#065F46',
    marginLeft: 4,
  },
  imageContainer: {
    height: 300,
    backgroundColor: '#F3F4F6',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 10,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 5,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#EF4444',
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
  infoContainer: {
    padding: 15,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
