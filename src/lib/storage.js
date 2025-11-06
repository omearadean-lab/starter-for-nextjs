import { storage, STORAGE_BUCKETS } from './appwrite';
import { ID } from 'appwrite';

export class StorageService {
  // Upload face image for known person
  async uploadFaceImage(file, personId, organizationId) {
    try {
      const fileId = `face_${personId}_${ID.unique()}`;
      const uploadedFile = await storage.createFile(
        STORAGE_BUCKETS.DEFAULT,
        fileId,
        file
      );
      
      // Return the file URL for immediate use
      const fileUrl = storage.getFileView(STORAGE_BUCKETS.DEFAULT, fileId);
      
      return {
        fileId: uploadedFile.$id,
        fileUrl: fileUrl.href,
        fileName: file.name,
        fileSize: uploadedFile.sizeOriginal
      };
    } catch (error) {
      throw error;
    }
  }

  // Upload alert image/snapshot
  async uploadAlertImage(file, alertId, cameraId) {
    try {
      const fileId = `alert_${alertId}_${cameraId}_${ID.unique()}`;
      const uploadedFile = await storage.createFile(
        STORAGE_BUCKETS.DEFAULT,
        fileId,
        file
      );
      
      const fileUrl = storage.getFileView(STORAGE_BUCKETS.DEFAULT, fileId);
      
      return {
        fileId: uploadedFile.$id,
        fileUrl: fileUrl.href,
        fileName: file.name,
        fileSize: uploadedFile.sizeOriginal
      };
    } catch (error) {
      throw error;
    }
  }

  // Upload alert video clip
  async uploadAlertVideo(file, alertId, cameraId) {
    try {
      const fileId = `video_${alertId}_${cameraId}_${ID.unique()}`;
      const uploadedFile = await storage.createFile(
        STORAGE_BUCKETS.DEFAULT,
        fileId,
        file
      );
      
      const fileUrl = storage.getFileView(STORAGE_BUCKETS.DEFAULT, fileId);
      
      return {
        fileId: uploadedFile.$id,
        fileUrl: fileUrl.href,
        fileName: file.name,
        fileSize: uploadedFile.sizeOriginal
      };
    } catch (error) {
      throw error;
    }
  }

  // Upload user profile picture
  async uploadProfilePicture(file, userId) {
    try {
      const fileId = `profile_${userId}_${ID.unique()}`;
      const uploadedFile = await storage.createFile(
        STORAGE_BUCKETS.DEFAULT,
        fileId,
        file
      );
      
      const fileUrl = storage.getFileView(STORAGE_BUCKETS.DEFAULT, fileId);
      
      return {
        fileId: uploadedFile.$id,
        fileUrl: fileUrl.href,
        fileName: file.name,
        fileSize: uploadedFile.sizeOriginal
      };
    } catch (error) {
      throw error;
    }
  }

  // Upload detection event image
  async uploadDetectionImage(file, eventId, cameraId) {
    try {
      const fileId = `detection_${eventId}_${cameraId}_${ID.unique()}`;
      const uploadedFile = await storage.createFile(
        STORAGE_BUCKETS.DEFAULT,
        fileId,
        file
      );
      
      const fileUrl = storage.getFileView(STORAGE_BUCKETS.DEFAULT, fileId);
      
      return {
        fileId: uploadedFile.$id,
        fileUrl: fileUrl.href,
        fileName: file.name,
        fileSize: uploadedFile.sizeOriginal
      };
    } catch (error) {
      throw error;
    }
  }

  // Upload camera configuration file
  async uploadCameraConfig(file, cameraId, organizationId) {
    try {
      const fileId = `config_${cameraId}_${organizationId}_${ID.unique()}`;
      const uploadedFile = await storage.createFile(
        STORAGE_BUCKETS.DEFAULT,
        fileId,
        file
      );
      
      const fileUrl = storage.getFileView(STORAGE_BUCKETS.DEFAULT, fileId);
      
      return {
        fileId: uploadedFile.$id,
        fileUrl: fileUrl.href,
        fileName: file.name,
        fileSize: uploadedFile.sizeOriginal
      };
    } catch (error) {
      throw error;
    }
  }

  // Get file preview URL
  getFilePreview(bucketId, fileId, width = 300, height = 300) {
    try {
      return storage.getFilePreview(bucketId, fileId, width, height);
    } catch (error) {
      throw error;
    }
  }

  // Get file download URL
  getFileDownload(bucketId, fileId) {
    try {
      return storage.getFileDownload(bucketId, fileId);
    } catch (error) {
      throw error;
    }
  }

  // Delete file
  async deleteFile(bucketId, fileId) {
    try {
      return await storage.deleteFile(bucketId, fileId);
    } catch (error) {
      throw error;
    }
  }

  // Get file info
  async getFile(bucketId, fileId) {
    try {
      return await storage.getFile(bucketId, fileId);
    } catch (error) {
      throw error;
    }
  }

  // List files in bucket with filters
  async listFiles(bucketId, queries = []) {
    try {
      return await storage.listFiles(bucketId, queries);
    } catch (error) {
      throw error;
    }
  }

  // Validate file type and size
  validateFile(file, allowedTypes, maxSizeMB = 10) {
    const errors = [];
    
    // Check file type
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }
    
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      errors.push(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum ${maxSizeMB}MB`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Common file type constants
  static FILE_TYPES = {
    IMAGES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    VIDEOS: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'],
    DOCUMENTS: ['application/pdf', 'text/plain', 'application/json'],
    ALL_MEDIA: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/avi', 'video/mov']
  };
}

export const storageService = new StorageService();
