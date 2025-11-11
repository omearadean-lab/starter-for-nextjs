import { databases, storage, DATABASE_ID, COLLECTIONS, ALERT_TYPES } from './appwrite';
import { ID, Query } from 'appwrite';
import { go2rtcManager } from './go2rtc-manager';

export class CameraService {
  // Add new CCTV camera
  async addCamera(data) {
    try {
      const camera = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.CCTV_CAMERAS,
        ID.unique(),
        {
          name: data.name,
          location: data.location,
          rtspUrl: data.rtspUrl || data.streamUrl, // Backward compatibility
          streamUrl: data.streamUrl,
          protocol: data.protocol || 'rtsp',
          brand: data.brand,
          model: data.model,
          organizationId: data.organizationId,
          isActive: true,
          status: 'online',
          resolution: data.resolution || '1920x1080',
          frameRate: data.frameRate || 30,
          enabledDetections: data.enabledDetections || [
            ALERT_TYPES.SHOPLIFTING,
            ALERT_TYPES.FALL_DETECTION,
            ALERT_TYPES.FIRE_DETECTION
          ],
          alertThresholds: {
            confidenceLevel: 0.8,
            peopleCountThreshold: 10,
            motionSensitivity: 'medium'
          },
          createdAt: new Date().toISOString(),
          lastSeen: new Date().toISOString()
        }
      );

      // Register camera with go2rtc for streaming
      if (camera.rtspUrl || camera.streamUrl) {
        console.log('📡 Registering camera with go2rtc...');
        const streamResult = await go2rtcManager.addStream(camera);
        
        if (streamResult.success) {
          console.log(`✅ Camera registered with go2rtc: ${streamResult.streamId}`);
        } else {
          console.warn(`⚠️ Failed to register camera with go2rtc: ${streamResult.error}`);
          // Don't fail the camera creation, just log the warning
        }
      }

      return camera;
    } catch (error) {
      throw error;
    }
  }

  // Get cameras by organization
  async getCamerasByOrganization(organizationId) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CCTV_CAMERAS,
        [Query.equal('organizationId', organizationId)]
      );
      return response.documents;
    } catch (error) {
      throw error;
    }
  }

  // Get camera by ID
  async getCamera(cameraId) {
    try {
      return await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.CCTV_CAMERAS,
        cameraId
      );
    } catch (error) {
      throw error;
    }
  }

  // Update camera
  async updateCamera(cameraId, data) {
    try {
      // Get current camera for go2rtc operations
      const currentCamera = await this.getCamera(cameraId);
      
      const updatedCamera = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.CCTV_CAMERAS,
        cameraId,
        {
          ...data,
          updatedAt: new Date().toISOString()
        }
      );

      // Update go2rtc stream if URL changed
      if (data.rtspUrl || data.streamUrl) {
        console.log('📡 Updating camera stream in go2rtc...');
        const streamResult = await go2rtcManager.updateStream(updatedCamera);
        
        if (streamResult.success) {
          console.log(`✅ Camera stream updated in go2rtc: ${streamResult.streamId}`);
        } else {
          console.warn(`⚠️ Failed to update camera stream in go2rtc: ${streamResult.error}`);
        }
      }

      return updatedCamera;
    } catch (error) {
      throw error;
    }
  }

  // Update camera status
  async updateCameraStatus(cameraId, status) {
    try {
      return await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.CCTV_CAMERAS,
        cameraId,
        {
          status,
          lastSeen: new Date().toISOString()
        }
      );
    } catch (error) {
      throw error;
    }
  }

  // Delete camera
  async deleteCamera(cameraId) {
    try {
      // Get camera data before deletion for go2rtc cleanup
      const camera = await this.getCamera(cameraId);
      
      // Remove from go2rtc first
      if (camera.rtspUrl || camera.streamUrl) {
        console.log('📡 Removing camera stream from go2rtc...');
        const streamResult = await go2rtcManager.removeStream(camera);
        
        if (streamResult.success) {
          console.log(`✅ Camera stream removed from go2rtc: ${streamResult.streamId}`);
        } else {
          console.warn(`⚠️ Failed to remove camera stream from go2rtc: ${streamResult.error}`);
        }
      }

      // Delete from database
      return await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.CCTV_CAMERAS,
        cameraId
      );
    } catch (error) {
      throw error;
    }
  }

  // Update camera detection settings
  async updateDetectionSettings(cameraId, settings) {
    try {
      return await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.CCTV_CAMERAS,
        cameraId,
        {
          enabledDetections: settings.enabledDetections,
          alertThresholds: settings.alertThresholds,
          updatedAt: new Date().toISOString()
        }
      );
    } catch (error) {
      throw error;
    }
  }

  // Get camera statistics
  async getCameraStats(cameraId, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get detection events for this camera
      const eventsResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.DETECTION_EVENTS,
        [
          Query.equal('cameraId', cameraId),
          Query.greaterThan('createdAt', startDate.toISOString())
        ]
      );

      // Get alerts for this camera
      const alertsResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ALERTS,
        [
          Query.equal('cameraId', cameraId),
          Query.greaterThan('createdAt', startDate.toISOString())
        ]
      );

      // Group by detection type
      const detectionsByType = {};
      eventsResponse.documents.forEach(event => {
        if (!detectionsByType[event.detectionType]) {
          detectionsByType[event.detectionType] = 0;
        }
        detectionsByType[event.detectionType]++;
      });

      return {
        totalDetections: eventsResponse.total,
        totalAlerts: alertsResponse.total,
        detectionsByType,
        averageDetectionsPerDay: Math.round(eventsResponse.total / days)
      };
    } catch (error) {
      throw error;
    }
  }

  // Test camera connection
  async testCameraConnection(rtspUrl) {
    // This would typically involve calling a backend function
    // For now, we'll simulate the test
    try {
      // In a real implementation, this would test the RTSP stream
      return {
        success: true,
        message: 'Camera connection successful',
        latency: Math.random() * 100 + 50 // Simulated latency
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to connect to camera',
        error: error.message
      };
    }
  }
}

export const cameraService = new CameraService();
