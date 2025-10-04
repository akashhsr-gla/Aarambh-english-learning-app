import { FontAwesome } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { convertGoogleDriveUrl, isGoogleDriveUrl, validateGoogleDriveUrl } from '../utils/googleDriveHelper';

interface PDFViewerProps {
  pdfUrl: string;
  title?: string;
  style?: any;
  showDownloadButton?: boolean;
  showOpenButton?: boolean;
  onError?: (error: string) => void;
}

export default function PDFViewer({
  pdfUrl,
  title = 'PDF Document',
  style,
  showDownloadButton = true,
  showOpenButton = true,
  onError
}: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Convert Google Drive URL to direct PDF URL
  const directPdfUrl = convertGoogleDriveUrl(pdfUrl, 'pdf');
  const isGoogleDrive = isGoogleDriveUrl(pdfUrl);
  const validation = validateGoogleDriveUrl(pdfUrl);

  // Handle PDF open
  const handleOpenPDF = async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      
      // Check if the URL can be opened
      const canOpen = await Linking.canOpenURL(directPdfUrl);
      
      if (canOpen) {
        await Linking.openURL(directPdfUrl);
      } else {
        throw new Error('Cannot open PDF URL');
      }
    } catch (error) {
      console.error('Error opening PDF:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to open PDF';
      setHasError(true);
      setErrorMessage(errorMsg);
      
      if (onError) {
        onError(errorMsg);
      }
      
      Alert.alert(
        'PDF Error',
        `Failed to open PDF: ${errorMsg}\n\nPlease make sure the PDF is accessible and try again.`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle PDF download
  const handleDownloadPDF = async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      
      // For Google Drive PDFs, we can use the download URL
      const downloadUrl = isGoogleDrive 
        ? `https://drive.google.com/uc?export=download&id=${validation.fileId}`
        : directPdfUrl;
      
      const canOpen = await Linking.canOpenURL(downloadUrl);
      
      if (canOpen) {
        await Linking.openURL(downloadUrl);
      } else {
        throw new Error('Cannot download PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to download PDF';
      setHasError(true);
      setErrorMessage(errorMsg);
      
      if (onError) {
        onError(errorMsg);
      }
      
      Alert.alert(
        'Download Error',
        `Failed to download PDF: ${errorMsg}\n\nPlease try opening the PDF instead.`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle retry
  const handleRetry = () => {
    setHasError(false);
    setErrorMessage('');
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

      {/* PDF Preview/Info */}
      <View style={styles.previewContainer}>
        <View style={styles.previewIcon}>
          <FontAwesome name="file-pdf-o" size={48} color="#DC2626" />
        </View>
        
        <ThemedText style={styles.previewText}>
          {isGoogleDrive ? 'Google Drive PDF' : 'PDF Document'}
        </ThemedText>
        
        <ThemedText style={styles.urlText} numberOfLines={2}>
          {directPdfUrl}
        </ThemedText>
      </View>

      {/* Error State */}
      {hasError && (
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-triangle" size={24} color="#EF4444" />
          <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Action Buttons */}
      {!hasError && (
        <View style={styles.buttonContainer}>
          {showOpenButton && (
            <TouchableOpacity
              style={[styles.actionButton, styles.openButton]}
              onPress={handleOpenPDF}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <FontAwesome name="external-link" size={16} color="#FFFFFF" />
              )}
              <ThemedText style={styles.buttonText}>
                {isLoading ? 'Opening...' : 'Open PDF'}
              </ThemedText>
            </TouchableOpacity>
          )}
          
          {showDownloadButton && (
            <TouchableOpacity
              style={[styles.actionButton, styles.downloadButton]}
              onPress={handleDownloadPDF}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <FontAwesome name="download" size={16} color="#FFFFFF" />
              )}
              <ThemedText style={styles.buttonText}>
                {isLoading ? 'Downloading...' : 'Download'}
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Debug Info (for development) */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <ThemedText style={styles.debugText}>Original URL: {pdfUrl}</ThemedText>
          <ThemedText style={styles.debugText}>Direct URL: {directPdfUrl}</ThemedText>
          <ThemedText style={styles.debugText}>
            Validation: {validation.isValid ? 'Valid' : 'Invalid'} | 
            Google Drive: {isGoogleDrive ? 'Yes' : 'No'} | 
            File ID: {validation.fileId || 'None'}
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 4,
  },
  previewContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 16,
  },
  previewIcon: {
    marginBottom: 12,
  },
  previewText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  urlText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  openButton: {
    backgroundColor: '#3B82F6',
  },
  downloadButton: {
    backgroundColor: '#10B981',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  debugContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  debugText: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});
