import { databases, DATABASE_ID, COLLECTIONS } from './appwrite';
import { detectionStorageService } from './detection-storage';
import { ID } from 'appwrite';

/**
 * Emergency Response Integration Service
 * Handles critical detection events with automated emergency responses
 */

export const EMERGENCY_TYPES = {
  FIRE: 'fire',
  FALL: 'fall',
  MEDICAL: 'medical',
  SECURITY: 'security',
  INTRUSION: 'intrusion'
};

export const RESPONSE_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

export class EmergencyResponseService {
  constructor() {
    this.responseHandlers = new Map();
    this.setupDefaultHandlers();
  }

  /**
   * Set up default emergency response handlers
   */
  setupDefaultHandlers() {
    // Fire detection response
    this.responseHandlers.set(EMERGENCY_TYPES.FIRE, {
      level: RESPONSE_LEVELS.CRITICAL,
      handler: this.handleFireEmergency.bind(this),
      contacts: ['fire_brigade', 'security_team', 'building_manager'],
      autoActions: ['evacuation_alert', 'sprinkler_system', 'fire_doors']
    });

    // Fall detection response
    this.responseHandlers.set(EMERGENCY_TYPES.FALL, {
      level: RESPONSE_LEVELS.HIGH,
      handler: this.handleFallEmergency.bind(this),
      contacts: ['ambulance', 'care_team', 'family_contact'],
      autoActions: ['medical_alert', 'two_way_audio', 'location_beacon']
    });

    // Medical emergency response
    this.responseHandlers.set(EMERGENCY_TYPES.MEDICAL, {
      level: RESPONSE_LEVELS.CRITICAL,
      handler: this.handleMedicalEmergency.bind(this),
      contacts: ['ambulance', 'medical_team', 'emergency_contact'],
      autoActions: ['medical_alert', 'door_unlock', 'emergency_lighting']
    });

    // Security threat response
    this.responseHandlers.set(EMERGENCY_TYPES.SECURITY, {
      level: RESPONSE_LEVELS.HIGH,
      handler: this.handleSecurityEmergency.bind(this),
      contacts: ['police', 'security_team', 'management'],
      autoActions: ['security_alert', 'lockdown', 'recording_activation']
    });

    // Intrusion response
    this.responseHandlers.set(EMERGENCY_TYPES.INTRUSION, {
      level: RESPONSE_LEVELS.HIGH,
      handler: this.handleIntrusionEmergency.bind(this),
      contacts: ['security_team', 'police', 'site_manager'],
      autoActions: ['perimeter_alert', 'lighting_activation', 'alarm_system']
    });
  }

  /**
   * Process emergency detection and trigger appropriate response
   */
  async processEmergencyDetection(detectionEvent, emergencyType) {
    try {
      console.log(`🚨 EMERGENCY DETECTED: ${emergencyType.toUpperCase()}`);
      console.log(`   Event ID: ${detectionEvent.$id}`);
      console.log(`   Camera: ${detectionEvent.cameraName}`);
      console.log(`   Confidence: ${Math.round(detectionEvent.confidence * 100)}%`);

      const handler = this.responseHandlers.get(emergencyType);
      if (!handler) {
        console.warn(`No emergency handler configured for type: ${emergencyType}`);
        return null;
      }

      // Create emergency incident record
      const incident = await this.createEmergencyIncident(detectionEvent, emergencyType, handler.level);

      // Store evidence immediately
      const evidence = await this.storeEmergencyEvidence(detectionEvent, incident);

      // Execute emergency response
      const response = await handler.handler(detectionEvent, incident, evidence);

      // Log emergency response
      await this.logEmergencyResponse(incident, response);

      return {
        incident,
        evidence,
        response
      };

    } catch (error) {
      console.error('Error processing emergency detection:', error);
      throw error;
    }
  }

  /**
   * Create emergency incident record
   */
  async createEmergencyIncident(detectionEvent, emergencyType, responseLevel) {
    try {
      const incident = await databases.createDocument(
        DATABASE_ID,
        'emergency_incidents',
        ID.unique(),
        {
          organizationId: detectionEvent.organizationId,
          eventId: detectionEvent.$id,
          emergencyType: emergencyType,
          responseLevel: responseLevel,
          cameraId: detectionEvent.cameraId,
          cameraName: detectionEvent.cameraName,
          location: detectionEvent.metadata?.location || 'Unknown',
          description: `${emergencyType.toUpperCase()} detected at ${detectionEvent.cameraName}`,
          confidence: detectionEvent.confidence,
          status: 'active',
          detectedAt: detectionEvent.detectedAt,
          createdAt: new Date().toISOString(),
          metadata: JSON.stringify({
            detectionType: detectionEvent.detectionType,
            originalEventId: detectionEvent.$id,
            aiProvider: detectionEvent.metadata?.aiProvider || 'unknown'
          })
        }
      );

      console.log(`📋 Created emergency incident: ${incident.$id}`);
      return incident;

    } catch (error) {
      console.error('Error creating emergency incident:', error);
      throw error;
    }
  }

  /**
   * Store emergency evidence (images, videos)
   */
  async storeEmergencyEvidence(detectionEvent, incident) {
    try {
      const evidence = {
        images: [],
        videos: [],
        metadata: {}
      };

      // Store detection image if available
      if (detectionEvent.imageUrl) {
        // In a real implementation, you would fetch the image from the URL
        // and store it using detectionStorageService
        console.log(`📸 Emergency evidence image: ${detectionEvent.imageUrl}`);
        evidence.images.push({
          url: detectionEvent.imageUrl,
          type: 'detection_snapshot',
          timestamp: detectionEvent.detectedAt
        });
      }

      // Store additional camera snapshots for context
      const contextSnapshots = await this.captureContextualEvidence(detectionEvent);
      evidence.images.push(...contextSnapshots);

      console.log(`💾 Stored ${evidence.images.length} evidence images for incident ${incident.$id}`);
      return evidence;

    } catch (error) {
      console.error('Error storing emergency evidence:', error);
      return { images: [], videos: [], metadata: {} };
    }
  }

  /**
   * Capture additional contextual evidence from nearby cameras
   */
  async captureContextualEvidence(detectionEvent) {
    try {
      // In a real implementation, this would:
      // 1. Find nearby cameras
      // 2. Capture snapshots from multiple angles
      // 3. Store video clips from before/during/after the event
      
      console.log(`📹 Capturing contextual evidence for ${detectionEvent.cameraName}`);
      
      // Simulate contextual evidence
      return [
        {
          url: `${detectionEvent.imageUrl}?context=before`,
          type: 'context_before',
          timestamp: new Date(Date.parse(detectionEvent.detectedAt) - 30000).toISOString()
        },
        {
          url: `${detectionEvent.imageUrl}?context=after`,
          type: 'context_after',
          timestamp: new Date(Date.parse(detectionEvent.detectedAt) + 30000).toISOString()
        }
      ];

    } catch (error) {
      console.error('Error capturing contextual evidence:', error);
      return [];
    }
  }

  /**
   * Handle fire emergency
   */
  async handleFireEmergency(detectionEvent, incident, evidence) {
    console.log('🔥 FIRE EMERGENCY RESPONSE ACTIVATED');
    
    const actions = [];

    // 1. Contact fire brigade
    actions.push(await this.contactEmergencyServices('fire_brigade', {
      type: 'fire',
      location: detectionEvent.cameraName,
      address: incident.location,
      confidence: detectionEvent.confidence,
      evidence: evidence.images[0]?.url
    }));

    // 2. Activate building systems
    actions.push(await this.activateBuildingSystems('fire_response', {
      evacuation_alert: true,
      sprinkler_system: true,
      fire_doors: true,
      emergency_lighting: true
    }));

    // 3. Send mass notifications
    actions.push(await this.sendMassNotification({
      type: 'fire_evacuation',
      title: 'FIRE DETECTED - EVACUATE IMMEDIATELY',
      message: `Fire detected at ${detectionEvent.cameraName}. Please evacuate the building immediately and proceed to the assembly point.`,
      priority: 'critical',
      organizationId: detectionEvent.organizationId
    }));

    // 4. Contact building management
    actions.push(await this.contactStakeholders('fire_emergency', {
      incident: incident,
      evidence: evidence,
      contacts: ['building_manager', 'security_team', 'facilities_manager']
    }));

    return {
      type: 'fire_emergency',
      actions: actions,
      timestamp: new Date().toISOString(),
      status: 'executed'
    };
  }

  /**
   * Handle fall emergency
   */
  async handleFallEmergency(detectionEvent, incident, evidence) {
    console.log('🚨 FALL EMERGENCY RESPONSE ACTIVATED');
    
    const actions = [];

    // 1. Contact medical services
    actions.push(await this.contactEmergencyServices('ambulance', {
      type: 'fall',
      location: detectionEvent.cameraName,
      address: incident.location,
      confidence: detectionEvent.confidence,
      urgency: 'high'
    }));

    // 2. Activate two-way audio if available
    actions.push(await this.activateTwoWayAudio(detectionEvent.cameraId, {
      message: 'Emergency services have been contacted. Help is on the way. Please stay calm.',
      repeat: true,
      duration: 300 // 5 minutes
    }));

    // 3. Contact care team/family
    actions.push(await this.contactStakeholders('fall_emergency', {
      incident: incident,
      evidence: evidence,
      contacts: ['care_team', 'family_contact', 'medical_team']
    }));

    // 4. Unlock doors for emergency access
    actions.push(await this.activateBuildingSystems('medical_access', {
      door_unlock: true,
      emergency_lighting: true,
      elevator_priority: true
    }));

    return {
      type: 'fall_emergency',
      actions: actions,
      timestamp: new Date().toISOString(),
      status: 'executed'
    };
  }

  /**
   * Handle security emergency
   */
  async handleSecurityEmergency(detectionEvent, incident, evidence) {
    console.log('🚨 SECURITY EMERGENCY RESPONSE ACTIVATED');
    
    const actions = [];

    // 1. Contact police if severe
    if (detectionEvent.confidence > 0.8) {
      actions.push(await this.contactEmergencyServices('police', {
        type: 'security_threat',
        location: detectionEvent.cameraName,
        address: incident.location,
        confidence: detectionEvent.confidence,
        evidence: evidence.images[0]?.url
      }));
    }

    // 2. Activate security protocols
    actions.push(await this.activateBuildingSystems('security_lockdown', {
      lockdown: true,
      recording_activation: true,
      alarm_system: true,
      security_lighting: true
    }));

    // 3. Alert security team
    actions.push(await this.contactStakeholders('security_emergency', {
      incident: incident,
      evidence: evidence,
      contacts: ['security_team', 'management', 'site_supervisor']
    }));

    return {
      type: 'security_emergency',
      actions: actions,
      timestamp: new Date().toISOString(),
      status: 'executed'
    };
  }

  /**
   * Handle intrusion emergency
   */
  async handleIntrusionEmergency(detectionEvent, incident, evidence) {
    console.log('⚠️ INTRUSION EMERGENCY RESPONSE ACTIVATED');
    
    const actions = [];

    // 1. Activate perimeter security
    actions.push(await this.activateBuildingSystems('perimeter_security', {
      perimeter_alert: true,
      lighting_activation: true,
      alarm_system: true,
      camera_tracking: true
    }));

    // 2. Alert security team immediately
    actions.push(await this.contactStakeholders('intrusion_emergency', {
      incident: incident,
      evidence: evidence,
      contacts: ['security_team', 'site_manager'],
      priority: 'immediate'
    }));

    // 3. Start continuous recording
    actions.push(await this.activateContinuousRecording(detectionEvent.cameraId, {
      duration: 1800, // 30 minutes
      quality: 'high',
      backup: true
    }));

    return {
      type: 'intrusion_emergency',
      actions: actions,
      timestamp: new Date().toISOString(),
      status: 'executed'
    };
  }

  /**
   * Contact emergency services (simulated)
   */
  async contactEmergencyServices(serviceType, details) {
    console.log(`📞 Contacting ${serviceType}:`, details);
    
    // In production, this would integrate with:
    // - Emergency services APIs
    // - SMS/voice calling services
    // - Automated dispatch systems
    
    return {
      action: 'contact_emergency_services',
      service: serviceType,
      status: 'simulated',
      timestamp: new Date().toISOString(),
      details: details
    };
  }

  /**
   * Activate building systems (simulated)
   */
  async activateBuildingSystems(systemType, controls) {
    console.log(`🏢 Activating building systems (${systemType}):`, controls);
    
    // In production, this would integrate with:
    // - Building management systems (BMS)
    // - Fire safety systems
    // - Access control systems
    // - HVAC and lighting controls
    
    return {
      action: 'activate_building_systems',
      system: systemType,
      controls: controls,
      status: 'simulated',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Send mass notification to organisation users
   */
  async sendMassNotification(notification) {
    try {
      console.log(`📢 Sending mass notification: ${notification.title}`);
      
      // Get all users in the organisation
      const usersResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USER_PROFILES
      );
      
      const orgUsers = usersResponse.documents.filter(
        user => user.organizationId === notification.organizationId
      );

      // Send notification to each user
      for (const user of orgUsers) {
        await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.NOTIFICATIONS,
          ID.unique(),
          {
            userId: user.$id,
            organizationId: notification.organizationId,
            type: 'emergency_alert',
            title: notification.title,
            body: notification.message,
            severity: notification.priority,
            createdAt: new Date().toISOString()
          }
        );
      }

      return {
        action: 'mass_notification',
        recipients: orgUsers.length,
        status: 'sent',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error sending mass notification:', error);
      return {
        action: 'mass_notification',
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Contact stakeholders
   */
  async contactStakeholders(emergencyType, details) {
    console.log(`📧 Contacting stakeholders for ${emergencyType}:`, details.contacts);
    
    // In production, this would:
    // - Send SMS alerts
    // - Make phone calls
    // - Send emails with evidence attachments
    // - Update stakeholder dashboards
    
    return {
      action: 'contact_stakeholders',
      emergency_type: emergencyType,
      contacts: details.contacts,
      status: 'simulated',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Activate two-way audio communication
   */
  async activateTwoWayAudio(cameraId, audioConfig) {
    console.log(`🔊 Activating two-way audio for camera ${cameraId}:`, audioConfig);
    
    return {
      action: 'two_way_audio',
      camera_id: cameraId,
      config: audioConfig,
      status: 'simulated',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Start continuous recording
   */
  async activateContinuousRecording(cameraId, recordingConfig) {
    console.log(`🎥 Starting continuous recording for camera ${cameraId}:`, recordingConfig);
    
    return {
      action: 'continuous_recording',
      camera_id: cameraId,
      config: recordingConfig,
      status: 'simulated',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Log emergency response actions
   */
  async logEmergencyResponse(incident, response) {
    try {
      await databases.createDocument(
        DATABASE_ID,
        'emergency_logs',
        ID.unique(),
        {
          incidentId: incident.$id,
          organizationId: incident.organizationId,
          responseType: response.type,
          actionsCount: response.actions.length,
          status: response.status,
          responseTime: new Date().toISOString(),
          metadata: JSON.stringify(response),
          createdAt: new Date().toISOString()
        }
      );

      console.log(`📝 Logged emergency response for incident ${incident.$id}`);

    } catch (error) {
      console.error('Error logging emergency response:', error);
    }
  }

  /**
   * Get emergency response statistics
   */
  async getEmergencyStatistics(organizationId, timeRange = '30d') {
    try {
      // This would query emergency incidents and responses
      // to provide statistics on response times, types, outcomes
      
      return {
        totalIncidents: 0,
        responseTime: { average: 0, median: 0 },
        incidentTypes: {},
        resolutionRate: 0
      };

    } catch (error) {
      console.error('Error getting emergency statistics:', error);
      return null;
    }
  }
}

export const emergencyResponseService = new EmergencyResponseService();
export default EmergencyResponseService;
