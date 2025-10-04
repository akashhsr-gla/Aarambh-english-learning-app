import { FontAwesome } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { convertGoogleDriveUrl, isGoogleDriveUrl, validateGoogleDriveUrl } from '../utils/googleDriveHelper';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PDFViewerProps {
  pdfUrl: string;
  title?: string;
  style?: any;
  onError?: (error: string) => void;
}

export default function PDFViewer({
  pdfUrl,
  title = 'PDF Document',
  style,
  onError
}: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Convert Google Drive URL to direct PDF URL
  const directPdfUrl = convertGoogleDriveUrl(pdfUrl, 'pdf');
  const isGoogleDrive = isGoogleDriveUrl(pdfUrl);
  const validation = validateGoogleDriveUrl(pdfUrl);

  // Handle PDF load error
  const handleLoadError = (error: any) => {
    console.error('PDF load error:', error);
    setIsLoading(false);
    setHasError(true);
    const errorMsg = error?.message || 'Failed to load PDF';
    setErrorMessage(errorMsg);
    
    if (onError) {
      onError(errorMsg);
    }
  };

  // Handle retry
  const handleRetry = () => {
    setHasError(false);
    setErrorMessage('');
    setIsLoading(true);
  };

  // Handle opening Google Drive
  const handleOpenGoogleDrive = async () => {
    try {
      const canOpen = await Linking.canOpenURL(pdfUrl);
      if (canOpen) {
        await Linking.openURL(pdfUrl);
      } else {
        console.error('Cannot open Google Drive URL');
      }
    } catch (error) {
      console.error('Error opening Google Drive:', error);
    }
  };

  return (
    <ThemedView style={[styles.container, style]}>
      {/* PDF Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <FontAwesome name="file-pdf-o" size={20} color="#DC2626" />
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

      {/* PDF Viewer Container */}
      <View style={styles.pdfContainer}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DC2626" />
            <ThemedText style={styles.loadingText}>Loading PDF...</ThemedText>
          </View>
        )}

        {hasError && (
          <View style={styles.errorContainer}>
            <FontAwesome name="exclamation-triangle" size={48} color="#DC2626" />
            <ThemedText style={styles.errorText}>Failed to load PDF</ThemedText>
            <ThemedText style={styles.errorSubtext}>{errorMessage}</ThemedText>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {!hasError && (
          <WebView
            source={{ uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(directPdfUrl)}` }}
            style={styles.pdf}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => {
              setIsLoading(false);
              setHasError(false);
            }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView error: ', nativeEvent);
              handleLoadError({ message: 'Failed to load PDF in WebView' });
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
          />
        )}
      </View>

      {/* PDF Info */}
      {!hasError && (
        <View style={styles.infoContainer}>
          <ThemedText style={styles.infoText}>
            Use pinch to zoom and scroll to navigate the PDF
          </ThemedText>
        </View>
      )}

      {/* Google Drive Button */}
      {isGoogleDrive && !hasError && (
        <View style={styles.driveButtonContainer}>
          <TouchableOpacity style={styles.driveButton} onPress={handleOpenGoogleDrive}>
            <FontAwesome name="external-link" size={16} color="#4285F4" />
            <ThemedText style={styles.driveButtonText}>Open in Google Drive</ThemedText>
          </TouchableOpacity>
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
  pdfContainer: {
    height: 400,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  pdf: {
    flex: 1,
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
    color: '#DC2626',
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
    backgroundColor: '#DC2626',
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
  driveButtonContainer: {
    padding: 15,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  driveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F0FE',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#4285F4',
  },
  driveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4285F4',
    marginLeft: 8,
  },
});