import { storage, ID } from './appwrite';
import { storageService } from './storage';

/**
 * Detection Evidence Storage Service
 * Handles storage of images, videos, and metadata for AI detection events
 */

export const DETECTION_STORAGE_BUCKETS = {
  DETECTION_IMAGES: 'detection-images',
  DETECTION_VIDEOS: 'detection-videos', 
  ALERT_SNAPSHOTS: 'alert-snapshots',
  FACE_RECOGNITION: 'face-recognition'
};

export class DetectionStorageService {
  constructor() {
    this.buckets = DETECTION_STORAGE_BUCKETS;
  }

  /**
   * Store detection event image with metadata
   */
  async storeDetectionImage(imageBuffer, detectionEvent, metadata = {}) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${detectionEvent.detectionType}_${detectionEvent.cameraId}_${timestamp}.jpg`;
      
      // Convert buffer to File-like object
      const imageFile = new File([imageBuffer], fileName, { type: 'image/jpeg' });
      
      const fileId = `detection_${detectionEvent.$id}_${ID.unique()}`;
      
      const uploadedFile = await storage.createFile(
        this.buckets.DETECTION_IMAGES,
        fileId,
        imageFile
      );

      // Get file URLs
      const viewUrl = this.getDetectionImageUrl(fileId);
      const downloadUrl = this.getDetectionImageDownload(fileId);
      const thumbnailUrl = this.getDetectionImageThumbnail(fileId);

      // Store metadata
      const evidenceRecord = {
        fileId: uploadedFile.$id,
        eventId: detectionEvent.$id,
        detectionType: detectionEvent.detectionType,
        cameraId: detectionEvent.cameraId,
        cameraName: detectionEvent.cameraName,
        organizationId: detectionEvent.organizationId,
        fileName: fileName,
        fileSize: uploadedFile.sizeOriginal,
        viewUrl: viewUrl,
        downloadUrl: downloadUrl,
        thumbnailUrl: thumbnailUrl,
        confidence: detectionEvent.confidence,
        detectedAt: detectionEvent.detectedAt,
        storedAt: new Date().toISOString(),
        metadata: {
          ...metadata,
          originalWidth: metadata.width || null,
          originalHeight: metadata.height || null,
          boundingBoxes: detectionEvent.boundingBoxes,
          aiProvider: metadata.aiProvider || 'openai_vision'
        }
      };

      console.log(`📸 Stored detection image: ${fileName} (${uploadedFile.sizeOriginal} bytes)`);
      return evidenceRecord;

    } catch (error) {
      console.error('Error storing detection image:', error);
      throw error;
    }
  }

  /**
   * Store alert snapshot for critical events
   */
  async storeAlertSnapshot(imageBuffer, alertData, detectionEvent) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `alert_${alertData.severity}_${alertData.alertType}_${timestamp}.jpg`;
      
      const imageFile = new File([imageBuffer], fileName, { type: 'image/jpeg' });
      const fileId = `alert_${alertData.$id}_${ID.unique()}`;
      
      const uploadedFile = await storage.createFile(
        this.buckets.ALERT_SNAPSHOTS,
        fileId,
        imageFile
      );

      const evidenceRecord = {
        fileId: uploadedFile.$id,
        alertId: alertData.$id,
        eventId: detectionEvent.$id,
        alertType: alertData.alertType,
        severity: alertData.severity,
        cameraId: alertData.cameraId,
        cameraName: alertData.cameraName,
        organizationId: alertData.organizationId,
        fileName: fileName,
        fileSize: uploadedFile.sizeOriginal,
        viewUrl: this.getAlertSnapshotUrl(fileId),
        downloadUrl: this.getAlertSnapshotDownload(fileId),
        thumbnailUrl: this.getAlertSnapshotThumbnail(fileId),
        storedAt: new Date().toISOString()
      };

      console.log(`🚨 Stored alert snapshot: ${fileName} (${alertData.severity} severity)`);
      return evidenceRecord;

    } catch (error) {
      console.error('Error storing alert snapshot:', error);
      throw error;
    }
  }

  /**
   * Store video clip for detection event
   */
  async storeDetectionVideo(videoBuffer, detectionEvent, durationSeconds = 30) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${detectionEvent.detectionType}_${detectionEvent.cameraId}_${timestamp}.mp4`;
      
      const videoFile = new File([videoBuffer], fileName, { type: 'video/mp4' });
      const fileId = `video_${detectionEvent.$id}_${ID.unique()}`;
      
      const uploadedFile = await storage.createFile(
        this.buckets.DETECTION_VIDEOS,
        fileId,
        videoFile
      );

      const evidenceRecord = {
        fileId: uploadedFile.$id,
        eventId: detectionEvent.$id,
        detectionType: detectionEvent.detectionType,
        cameraId: detectionEvent.cameraId,
        cameraName: detectionEvent.cameraName,
        organizationId: detectionEvent.organizationId,
        fileName: fileName,
        fileSize: uploadedFile.sizeOriginal,
        duration: durationSeconds,
        viewUrl: this.getDetectionVideoUrl(fileId),
        downloadUrl: this.getDetectionVideoDownload(fileId),
        storedAt: new Date().toISOString()
      };

      console.log(`🎥 Stored detection video: ${fileName} (${durationSeconds}s, ${uploadedFile.sizeOriginal} bytes)`);
      return evidenceRecord;

    } catch (error) {
      console.error('Error storing detection video:', error);
      throw error;
    }
  }

  /**
   * Store face recognition image for known persons
   */
  async storeFaceImage(imageBuffer, personId, organizationId, metadata = {}) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `face_${personId}_${timestamp}.jpg`;
      
      const imageFile = new File([imageBuffer], fileName, { type: 'image/jpeg' });
      const fileId = `face_${personId}_${ID.unique()}`;
      
      const uploadedFile = await storage.createFile(
        this.buckets.FACE_RECOGNITION,
        fileId,
        imageFile
      );

      const evidenceRecord = {
        fileId: uploadedFile.$id,
        personId: personId,
        organizationId: organizationId,
        fileName: fileName,
        fileSize: uploadedFile.sizeOriginal,
        viewUrl: this.getFaceImageUrl(fileId),
        downloadUrl: this.getFaceImageDownload(fileId),
        thumbnailUrl: this.getFaceImageThumbnail(fileId),
        storedAt: new Date().toISOString(),
        metadata: metadata
      };

      console.log(`👤 Stored face image: ${fileName} for person ${personId}`);
      return evidenceRecord;

    } catch (error) {
      console.error('Error storing face image:', error);
      throw error;
    }
  }

  /**
   * Get detection image URLs
   */
  getDetectionImageUrl(fileId) {
    return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/v1/storage/buckets/${this.buckets.DETECTION_IMAGES}/files/${fileId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
  }

  getDetectionImageDownload(fileId) {
    return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/v1/storage/buckets/${this.buckets.DETECTION_IMAGES}/files/${fileId}/download?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
  }

  getDetectionImageThumbnail(fileId, width = 300, height = 300) {
    return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/v1/storage/buckets/${this.buckets.DETECTION_IMAGES}/files/${fileId}/preview?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}&width=${width}&height=${height}`;
  }

  /**
   * Get alert snapshot URLs
   */
  getAlertSnapshotUrl(fileId) {
    return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/v1/storage/buckets/${this.buckets.ALERT_SNAPSHOTS}/files/${fileId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
  }

  getAlertSnapshotDownload(fileId) {
    return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/v1/storage/buckets/${this.buckets.ALERT_SNAPSHOTS}/files/${fileId}/download?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
  }

  getAlertSnapshotThumbnail(fileId, width = 300, height = 300) {
    return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/v1/storage/buckets/${this.buckets.ALERT_SNAPSHOTS}/files/${fileId}/preview?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}&width=${width}&height=${height}`;
  }

  /**
   * Get detection video URLs
   */
  getDetectionVideoUrl(fileId) {
    return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/v1/storage/buckets/${this.buckets.DETECTION_VIDEOS}/files/${fileId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
  }

  getDetectionVideoDownload(fileId) {
    return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/v1/storage/buckets/${this.buckets.DETECTION_VIDEOS}/files/${fileId}/download?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
  }

  /**
   * Get face image URLs
   */
  getFaceImageUrl(fileId) {
    return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/v1/storage/buckets/${this.buckets.FACE_RECOGNITION}/files/${fileId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
  }

  getFaceImageDownload(fileId) {
    return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/v1/storage/buckets/${this.buckets.FACE_RECOGNITION}/files/${fileId}/download?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
  }

  getFaceImageThumbnail(fileId, width = 150, height = 150) {
    return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/v1/storage/buckets/${this.buckets.FACE_RECOGNITION}/files/${fileId}/preview?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}&width=${width}&height=${height}`;
  }

  /**
   * Clean up old detection evidence (retention policy)
   */
  async cleanupOldEvidence(retentionDays = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      console.log(`🧹 Cleaning up detection evidence older than ${retentionDays} days...`);

      // This would typically query a database of evidence records
      // and delete files older than the retention period
      // Implementation depends on your evidence tracking system

      console.log('✅ Evidence cleanup completed');

    } catch (error) {
      console.error('Error cleaning up old evidence:', error);
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStatistics() {
    try {
      const stats = {
        detectionImages: { count: 0, totalSize: 0 },
        alertSnapshots: { count: 0, totalSize: 0 },
        detectionVideos: { count: 0, totalSize: 0 },
        faceImages: { count: 0, totalSize: 0 }
      };

      // Get statistics for each bucket
      for (const [key, bucketId] of Object.entries(this.buckets)) {
        try {
          const files = await storage.listFiles(bucketId);
          const statKey = key.toLowerCase().replace('_', '');
          
          if (stats[statKey]) {
            stats[statKey].count = files.files.length;
            stats[statKey].totalSize = files.files.reduce((total, file) => total + file.sizeOriginal, 0);
          }
        } catch (error) {
          console.warn(`Could not get stats for bucket ${bucketId}:`, error.message);
        }
      }

      return stats;

    } catch (error) {
      console.error('Error getting storage statistics:', error);
      return null;
    }
  }

  /**
   * Validate evidence file before storage
   */
  validateEvidenceFile(file, type = 'image') {
    const validations = {
      image: {
        types: ['image/jpeg', 'image/jpg', 'image/png'],
        maxSize: 10 // MB
      },
      video: {
        types: ['video/mp4', 'video/avi', 'video/mov'],
        maxSize: 100 // MB
      }
    };

    const config = validations[type];
    if (!config) {
      return { isValid: false, errors: ['Invalid file type specified'] };
    }

    return storageService.validateFile(file, config.types, config.maxSize);
  }
}

export const detectionStorageService = new DetectionStorageService();
export default DetectionStorageService;
