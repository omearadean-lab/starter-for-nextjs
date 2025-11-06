import { databases, DATABASE_ID, COLLECTIONS } from './appwrite';
import { notificationService } from './notifications';
import { ID } from 'appwrite';

/**
 * AI Detection Service for CCTV Monitoring System
 * Handles Face, Fall, Theft, and Fire detection with UK English terminology
 */

export const DETECTION_TYPES = {
  FACE: 'face',
  FALL: 'fall', 
  THEFT: 'theft',
  FIRE: 'fire',
  PERSON: 'person',
  VEHICLE: 'vehicle',
  MOTION: 'motion',
  OBJECT: 'object',
  INTRUSION: 'intrusion'
};

export const SEVERITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium', 
  HIGH: 'high',
  CRITICAL: 'critical'
};

export const DETECTION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  FALSE_POSITIVE: 'false_positive',
  IGNORED: 'ignored'
};

class AIDetectionService {
  constructor() {
    this.detectionConfig = {
      [DETECTION_TYPES.FACE]: {
        name: 'Face Detection',
        description: 'Identifies and recognises human faces',
        severity: SEVERITY_LEVELS.MEDIUM,
        enabled: true,
        confidence_threshold: 0.85,
        notification_enabled: true,
        icon: 'FaceSmileIcon',
        colour: 'blue'
      },
      [DETECTION_TYPES.FALL]: {
        name: 'Fall Detection',
        description: 'Detects when a person falls (elderly care, workplace safety)',
        severity: SEVERITY_LEVELS.HIGH,
        enabled: true,
        confidence_threshold: 0.90,
        notification_enabled: true,
        icon: 'ExclamationTriangleIcon',
        colour: 'orange'
      },
      [DETECTION_TYPES.THEFT]: {
        name: 'Theft Detection',
        description: 'Identifies suspicious behaviour patterns indicating potential stealing',
        severity: SEVERITY_LEVELS.HIGH,
        enabled: true,
        confidence_threshold: 0.75,
        notification_enabled: true,
        icon: 'ShieldExclamationIcon',
        colour: 'red'
      },
      [DETECTION_TYPES.FIRE]: {
        name: 'Fire Detection',
        description: 'Early fire detection through visual flame and smoke analysis',
        severity: SEVERITY_LEVELS.CRITICAL,
        enabled: true,
        confidence_threshold: 0.80,
        notification_enabled: true,
        icon: 'ExclamationTriangleIcon',
        colour: 'red'
      },
      [DETECTION_TYPES.PERSON]: {
        name: 'Person Detection',
        description: 'Detects human presence in monitored areas',
        severity: SEVERITY_LEVELS.LOW,
        enabled: true,
        confidence_threshold: 0.70,
        notification_enabled: false,
        icon: 'UserIcon',
        colour: 'green'
      },
      [DETECTION_TYPES.VEHICLE]: {
        name: 'Vehicle Detection',
        description: 'Identifies cars, lorries, and other vehicles',
        severity: SEVERITY_LEVELS.LOW,
        enabled: true,
        confidence_threshold: 0.75,
        notification_enabled: false,
        icon: 'VideoCameraIcon',
        colour: 'blue'
      },
      [DETECTION_TYPES.INTRUSION]: {
        name: 'Intrusion Detection',
        description: 'Unauthorised access to restricted areas',
        severity: SEVERITY_LEVELS.HIGH,
        enabled: true,
        confidence_threshold: 0.85,
        notification_enabled: true,
        icon: 'ShieldExclamationIcon',
        colour: 'red'
      }
    };
  }

  /**
   * Process AI detection result from camera feed
   */
  async processDetection(detectionData) {
    try {
      const {
        cameraId,
        cameraName,
        detectionType,
        confidence,
        boundingBoxes,
        imageUrl,
        organizationId,
        metadata = {}
      } = detectionData;

      const config = this.detectionConfig[detectionType];
      if (!config || !config.enabled) {
        console.log(`Detection type ${detectionType} is disabled`);
        return null;
      }

      // Check confidence threshold
      if (confidence < config.confidence_threshold) {
        console.log(`Detection confidence ${confidence} below threshold ${config.confidence_threshold}`);
        return null;
      }

      // Create detection event
      const detectionEvent = await this.createDetectionEvent({
        organizationId,
        cameraId,
        cameraName,
        detectionType,
        confidence,
        boundingBoxes: JSON.stringify(boundingBoxes),
        imageUrl,
        metadata: JSON.stringify({
          ...metadata,
          severity: config.severity,
          processed_at: new Date().toISOString()
        }),
        detectedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });

      // Send notifications if enabled
      if (config.notification_enabled) {
        await this.sendDetectionNotification(detectionEvent, config);
      }

      // Handle specific detection type logic
      await this.handleSpecificDetection(detectionType, detectionEvent, metadata);

      return detectionEvent;

    } catch (error) {
      console.error('Error processing detection:', error);
      throw error;
    }
  }

  /**
   * Create detection event in database
   */
  async createDetectionEvent(eventData) {
    try {
      const event = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.DETECTION_EVENTS,
        ID.unique(),
        eventData
      );
      return event;
    } catch (error) {
      console.error('Error creating detection event:', error);
      throw error;
    }
  }

  /**
   * Send notification for detection event
   */
  async sendDetectionNotification(event, config) {
    try {
      // Get organisation users for notification
      const usersResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USER_PROFILES
      );
      
      const orgUsers = usersResponse.documents.filter(
        user => user.organizationId === event.organizationId
      );

      const notificationTitle = this.getNotificationTitle(event.detectionType, config);
      const notificationBody = this.getNotificationBody(event, config);

      // Send notifications to all organisation users
      for (const user of orgUsers) {
        await notificationService.createNotification({
          userId: user.$id,
          organizationId: event.organizationId,
          type: 'detection_event',
          title: notificationTitle,
          body: notificationBody,
          severity: config.severity,
          detectionType: event.detectionType,
          eventId: event.$id
        });

        // Send push notification for high/critical severity
        if (config.severity === SEVERITY_LEVELS.HIGH || config.severity === SEVERITY_LEVELS.CRITICAL) {
          await notificationService.sendPushNotification(
            user.$id,
            notificationTitle,
            notificationBody
          );
        }
      }
    } catch (error) {
      console.error('Error sending detection notification:', error);
    }
  }

  /**
   * Handle specific detection type logic
   */
  async handleSpecificDetection(detectionType, event, metadata) {
    switch (detectionType) {
      case DETECTION_TYPES.FALL:
        await this.handleFallDetection(event, metadata);
        break;
      case DETECTION_TYPES.FIRE:
        await this.handleFireDetection(event, metadata);
        break;
      case DETECTION_TYPES.THEFT:
        await this.handleTheftDetection(event, metadata);
        break;
      case DETECTION_TYPES.FACE:
        await this.handleFaceDetection(event, metadata);
        break;
    }
  }

  /**
   * Handle fall detection - critical for elderly care
   */
  async handleFallDetection(event, metadata) {
    console.log('🚨 FALL DETECTED - Immediate response required');
    
    // Could integrate with emergency services API
    // Could trigger automatic alerts to carers/family
    // Could activate two-way audio communication
    
    // For now, create high-priority alert
    await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.ALERTS,
      ID.unique(),
      {
        organizationId: event.organizationId,
        title: 'URGENT: Fall Detected',
        message: `Fall detected at ${event.cameraName}. Immediate assistance may be required.`,
        severity: 'critical',
        type: 'fall_detection',
        cameraId: event.cameraId,
        eventId: event.$id,
        createdAt: new Date().toISOString()
      }
    );
  }

  /**
   * Handle fire detection - critical safety alert
   */
  async handleFireDetection(event, metadata) {
    console.log('🔥 FIRE DETECTED - Emergency response required');
    
    // Could integrate with fire brigade API
    // Could trigger building evacuation systems
    // Could activate sprinkler systems
    
    await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.ALERTS,
      ID.unique(),
      {
        organizationId: event.organizationId,
        title: 'CRITICAL: Fire Detected',
        message: `Fire detected at ${event.cameraName}. Emergency services should be contacted immediately.`,
        severity: 'critical',
        type: 'fire_detection',
        cameraId: event.cameraId,
        eventId: event.$id,
        createdAt: new Date().toISOString()
      }
    );
  }

  /**
   * Handle theft detection - security alert
   */
  async handleTheftDetection(event, metadata) {
    console.log('🚨 THEFT DETECTED - Security response required');
    
    // Could integrate with security company API
    // Could trigger automatic recording
    // Could activate alarm systems
    
    await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.ALERTS,
      ID.unique(),
      {
        organizationId: event.organizationId,
        title: 'SECURITY ALERT: Potential Theft',
        message: `Suspicious behaviour indicating potential theft detected at ${event.cameraName}.`,
        severity: 'high',
        type: 'theft_detection',
        cameraId: event.cameraId,
        eventId: event.$id,
        createdAt: new Date().toISOString()
      }
    );
  }

  /**
   * Handle face detection - identification and access control
   */
  async handleFaceDetection(event, metadata) {
    console.log('👤 FACE DETECTED - Processing identification');
    
    // Could integrate with face recognition database
    // Could check against known persons list
    // Could trigger access control systems
    
    // Check if face matches known persons
    if (metadata.personId) {
      console.log(`Known person identified: ${metadata.personId}`);
    } else {
      console.log('Unknown person detected - creating alert');
      
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.ALERTS,
        ID.unique(),
        {
          organizationId: event.organizationId,
          title: 'Unknown Person Detected',
          message: `Unrecognised face detected at ${event.cameraName}.`,
          severity: 'medium',
          type: 'face_detection',
          cameraId: event.cameraId,
          eventId: event.$id,
          createdAt: new Date().toISOString()
        }
      );
    }
  }

  /**
   * Get notification title based on detection type
   */
  getNotificationTitle(detectionType, config) {
    const urgentTypes = [DETECTION_TYPES.FALL, DETECTION_TYPES.FIRE];
    const prefix = urgentTypes.includes(detectionType) ? '🚨 URGENT: ' : '';
    return `${prefix}${config.name}`;
  }

  /**
   * Get notification body based on detection event
   */
  getNotificationBody(event, config) {
    const confidence = Math.round(event.confidence * 100);
    return `${config.description} detected at ${event.cameraName} (${confidence}% confidence)`;
  }

  /**
   * Get detection configuration
   */
  getDetectionConfig(detectionType) {
    return this.detectionConfig[detectionType];
  }

  /**
   * Update detection configuration
   */
  async updateDetectionConfig(detectionType, updates) {
    if (this.detectionConfig[detectionType]) {
      this.detectionConfig[detectionType] = {
        ...this.detectionConfig[detectionType],
        ...updates
      };
      
      // Could save to database for persistence
      console.log(`Updated ${detectionType} configuration:`, updates);
    }
  }

  /**
   * Get all detection statistics
   */
  async getDetectionStatistics(organizationId, timeRange = '24h') {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.DETECTION_EVENTS
      );

      const orgEvents = response.documents.filter(
        event => event.organizationId === organizationId
      );

      // Calculate statistics by detection type
      const stats = {};
      Object.values(DETECTION_TYPES).forEach(type => {
        const typeEvents = orgEvents.filter(event => event.detectionType === type);
        stats[type] = {
          total: typeEvents.length,
          pending: typeEvents.filter(e => e.status === DETECTION_STATUS.PENDING).length,
          confirmed: typeEvents.filter(e => e.status === DETECTION_STATUS.CONFIRMED).length,
          false_positives: typeEvents.filter(e => e.status === DETECTION_STATUS.FALSE_POSITIVE).length
        };
      });

      return stats;
    } catch (error) {
      console.error('Error getting detection statistics:', error);
      return {};
    }
  }
}

export const aiDetectionService = new AIDetectionService();
export default aiDetectionService;
