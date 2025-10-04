/**
 * Google Drive URL Helper for Frontend
 * Converts Google Drive sharing URLs to direct playable URLs
 */

/**
 * Extract file ID from Google Drive sharing URL
 */
export const extractFileId = (url: string): string | null => {
  if (!url || typeof url !== 'string') return null;
  
  // Pattern 1: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  const pattern1 = /\/file\/d\/([a-zA-Z0-9-_]+)/;
  
  // Pattern 2: https://drive.google.com/open?id=FILE_ID
  const pattern2 = /[?&]id=([a-zA-Z0-9-_]+)/;
  
  // Pattern 3: https://docs.google.com/document/d/FILE_ID/edit
  const pattern3 = /\/document\/d\/([a-zA-Z0-9-_]+)/;
  
  // Pattern 4: https://docs.google.com/presentation/d/FILE_ID/edit
  const pattern4 = /\/presentation\/d\/([a-zA-Z0-9-_]+)/;
  
  const match1 = url.match(pattern1);
  const match2 = url.match(pattern2);
  const match3 = url.match(pattern3);
  const match4 = url.match(pattern4);
  
  return match1?.[1] || match2?.[1] || match3?.[1] || match4?.[1] || null;
};

/**
 * Check if URL is a Google Drive URL
 */
export const isGoogleDriveUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  const googleDrivePatterns = [
    /drive\.google\.com/,
    /docs\.google\.com/,
    /docs\.googleusercontent\.com/
  ];
  
  return googleDrivePatterns.some(pattern => pattern.test(url));
};

/**
 * Convert Google Drive sharing URL to direct video URL
 */
export const convertToDirectVideoUrl = (url: string): string => {
  if (!isGoogleDriveUrl(url)) return url;
  
  const fileId = extractFileId(url);
  if (!fileId) return url;
  
  // For videos, use the view URL which works better with video players
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
};

/**
 * Convert Google Drive sharing URL to direct image URL
 */
export const convertToDirectImageUrl = (url: string): string => {
  if (!isGoogleDriveUrl(url)) return url;
  
  const fileId = extractFileId(url);
  if (!fileId) return url;
  
  // For images, use the view URL
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
};

/**
 * Convert Google Drive sharing URL to direct PDF URL
 */
export const convertToDirectPdfUrl = (url: string): string => {
  if (!isGoogleDriveUrl(url)) return url;
  
  const fileId = extractFileId(url);
  if (!fileId) return url;
  
  // For PDFs, use the export URL which works better for PDF viewers
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
};

/**
 * Convert Google Drive sharing URL to preview URL (for thumbnails)
 */
export const convertToPreviewUrl = (url: string): string => {
  if (!isGoogleDriveUrl(url)) return url;
  
  const fileId = extractFileId(url);
  if (!fileId) return url;
  
  // For thumbnails/previews, use the thumbnail URL
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h300`;
};

/**
 * Get file type from Google Drive URL
 */
export const getFileType = (url: string): string => {
  if (!isGoogleDriveUrl(url)) return 'unknown';
  
  if (url.includes('/file/d/')) return 'file';
  if (url.includes('/document/d/')) return 'document';
  if (url.includes('/presentation/d/')) return 'presentation';
  if (url.includes('/spreadsheet/d/')) return 'spreadsheet';
  
  return 'unknown';
};

/**
 * Convert Google Drive URL based on file type
 */
export const convertGoogleDriveUrl = (url: string, type: 'video' | 'image' | 'pdf' | 'thumbnail' | 'auto' = 'auto'): string => {
  if (!isGoogleDriveUrl(url)) return url;
  
  const fileType = getFileType(url);
  
  switch (type) {
    case 'video':
      return convertToDirectVideoUrl(url);
    case 'image':
      return convertToDirectImageUrl(url);
    case 'pdf':
      return convertToDirectPdfUrl(url);
    case 'thumbnail':
      return convertToPreviewUrl(url);
    case 'auto':
    default:
      // Auto-detect based on URL patterns
      if (url.includes('video') || url.includes('mp4') || url.includes('avi') || url.includes('mov')) {
        return convertToDirectVideoUrl(url);
      } else if (url.includes('pdf')) {
        return convertToDirectPdfUrl(url);
      } else if (url.includes('image') || url.includes('jpg') || url.includes('png') || url.includes('jpeg')) {
        return convertToDirectImageUrl(url);
      } else {
        // Default to view URL
        const fileId = extractFileId(url);
        return fileId ? `https://drive.google.com/uc?export=view&id=${fileId}` : url;
      }
  }
};

/**
 * Validate Google Drive URL format
 */
export const validateGoogleDriveUrl = (url: string): {
  isValid: boolean;
  isGoogleDrive: boolean;
  fileId: string | null;
  fileType: string;
  error: string | null;
} => {
  const result = {
    isValid: false,
    isGoogleDrive: false,
    fileId: null as string | null,
    fileType: 'unknown',
    error: null as string | null
  };
  
  try {
    if (!url || typeof url !== 'string') {
      result.error = 'URL is required and must be a string';
      return result;
    }
    
    result.isGoogleDrive = isGoogleDriveUrl(url);
    if (!result.isGoogleDrive) {
      result.error = 'Not a Google Drive URL';
      return result;
    }
    
    result.fileId = extractFileId(url);
    if (!result.fileId) {
      result.error = 'Could not extract file ID from URL';
      return result;
    }
    
    result.fileType = getFileType(url);
    result.isValid = true;
    
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
  }
  
  return result;
};
