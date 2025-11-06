import { databases, messaging, DATABASE_ID, COLLECTIONS, ALERT_TYPES } from './appwrite';
import { ID, Query } from 'appwrite';

export class AlertService {
  // Create new alert
  async createAlert(data) {
    try {
      const alert = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.ALERTS,
        ID.unique(),
        {
          organizationId: data.organizationId,
          cameraId: data.cameraId,
          cameraName: data.cameraName,
          alertType: data.alertType,
          severity: data.severity || 'medium',
          description: data.description,
          confidence: data.confidence,
          imageUrl: data.imageUrl,
          videoUrl: data.videoUrl,
          location: data.location,
          isResolved: false,
          resolvedBy: null,
          resolvedAt: null,
          createdAt: new Date().toISOString(),
          metadata: data.metadata || {}
        }
      );

      // Send notifications if enabled
      await this.sendAlertNotifications(alert);

      return alert;
    } catch (error) {
      throw error;
    }
  }

  // Get alerts by organization
  async getAlertsByOrganization(organizationId, filters = {}) {
    try {
      const queries = [Query.equal('organizationId', organizationId)];
      
      if (filters.alertType) {
        queries.push(Query.equal('alertType', filters.alertType));
      }
      
      if (filters.severity) {
        queries.push(Query.equal('severity', filters.severity));
      }
      
      if (filters.isResolved !== undefined) {
        queries.push(Query.equal('isResolved', filters.isResolved));
      }
      
      if (filters.cameraId) {
        queries.push(Query.equal('cameraId', filters.cameraId));
      }
      
      if (filters.dateFrom) {
        queries.push(Query.greaterThan('createdAt', filters.dateFrom));
      }
      
      if (filters.dateTo) {
        queries.push(Query.lessThan('createdAt', filters.dateTo));
      }

      queries.push(Query.orderDesc('createdAt'));

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ALERTS,
        queries
      );
      
      return response.documents;
    } catch (error) {
      throw error;
    }
  }

  // Get alert by ID
  async getAlert(alertId) {
    try {
      return await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.ALERTS,
        alertId
      );
    } catch (error) {
      throw error;
    }
  }

  // Resolve alert
  async resolveAlert(alertId, resolvedBy, notes = '') {
    try {
      return await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.ALERTS,
        alertId,
        {
          isResolved: true,
          resolvedBy,
          resolvedAt: new Date().toISOString(),
          resolutionNotes: notes
        }
      );
    } catch (error) {
      throw error;
    }
  }

  // Create detection event
  async createDetectionEvent(data) {
    try {
      const event = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.DETECTION_EVENTS,
        ID.unique(),
        {
          organizationId: data.organizationId,
          cameraId: data.cameraId,
          detectionType: data.detectionType,
          confidence: data.confidence,
          boundingBoxes: data.boundingBoxes || [],
          imageUrl: data.imageUrl,
          personId: data.personId || null, // For face recognition
          peopleCount: data.peopleCount || null, // For people counting
          createdAt: new Date().toISOString(),
          metadata: data.metadata || {}
        }
      );

      // Check if this should trigger an alert
      await this.evaluateForAlert(event);

      return event;
    } catch (error) {
      throw error;
    }
  }

  // Evaluate if detection event should create an alert
  async evaluateForAlert(event) {
    try {
      let shouldAlert = false;
      let alertDescription = '';
      let severity = 'low';

      switch (event.detectionType) {
        case ALERT_TYPES.SHOPLIFTING:
          if (event.confidence > 0.8) {
            shouldAlert = true;
            alertDescription = 'Potential shoplifting activity detected';
            severity = 'high';
          }
          break;
          
        case ALERT_TYPES.FALL_DETECTION:
          if (event.confidence > 0.7) {
            shouldAlert = true;
            alertDescription = 'Person fall detected';
            severity = 'high';
          }
          break;
          
        case ALERT_TYPES.FIRE_DETECTION:
          if (event.confidence > 0.6) {
            shouldAlert = true;
            alertDescription = 'Fire or smoke detected';
            severity = 'critical';
          }
          break;
          
        case ALERT_TYPES.FACE_RECOGNITION:
          if (event.personId && event.confidence > 0.85) {
            // Check if this is a known person of interest
            const person = await databases.getDocument(
              DATABASE_ID,
              COLLECTIONS.KNOWN_PERSONS,
              event.personId
            );
            
            if (person.isPersonOfInterest) {
              shouldAlert = true;
              alertDescription = `Known person of interest detected: ${person.name}`;
              severity = 'high';
            }
          }
          break;
          
        case ALERT_TYPES.PEOPLE_COUNT:
          if (event.peopleCount > 15) { // Configurable threshold
            shouldAlert = true;
            alertDescription = `High people count detected: ${event.peopleCount} people`;
            severity = 'medium';
          }
          break;
      }

      if (shouldAlert) {
        const camera = await databases.getDocument(
          DATABASE_ID,
          COLLECTIONS.CCTV_CAMERAS,
          event.cameraId
        );

        await this.createAlert({
          organizationId: event.organizationId,
          cameraId: event.cameraId,
          cameraName: camera.name,
          alertType: event.detectionType,
          severity,
          description: alertDescription,
          confidence: event.confidence,
          imageUrl: event.imageUrl,
          location: camera.location,
          metadata: {
            detectionEventId: event.$id,
            ...event.metadata
          }
        });
      }
    } catch (error) {
      console.error('Error evaluating alert:', error);
    }
  }

  // Send alert notifications
  async sendAlertNotifications(alert) {
    try {
      // Get organization settings to determine notification preferences
      const org = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.ORGANIZATIONS,
        alert.organizationId
      );

      const notificationData = {
        title: `${alert.alertType.toUpperCase()} Alert`,
        message: `${alert.description} at ${alert.location}`,
        severity: alert.severity,
        alertId: alert.$id,
        cameraName: alert.cameraName
      };

      // Send email notifications if enabled
      if (org.settings?.enableEmailAlerts) {
        // Get users to notify
        const users = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.USER_PROFILES,
          [
            Query.equal('organizationId', alert.organizationId),
            Query.equal('isActive', true)
          ]
        );

        // Send email to each user (implement with Appwrite Functions)
        // This would typically call an Appwrite Function
      }

      // Send push notifications if enabled
      if (org.settings?.enablePushNotifications) {
        // Implement push notification logic
      }

      // Send SMS if enabled and critical
      if (org.settings?.enableSMSAlerts && alert.severity === 'critical') {
        // Implement SMS notification logic
      }

    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  }

  // Get alert statistics
  async getAlertStats(organizationId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ALERTS,
        [
          Query.equal('organizationId', organizationId),
          Query.greaterThan('createdAt', startDate.toISOString())
        ]
      );

      const alerts = response.documents;
      
      // Group by type
      const alertsByType = {};
      const alertsBySeverity = {};
      let resolvedCount = 0;

      alerts.forEach(alert => {
        // By type
        if (!alertsByType[alert.alertType]) {
          alertsByType[alert.alertType] = 0;
        }
        alertsByType[alert.alertType]++;

        // By severity
        if (!alertsBySeverity[alert.severity]) {
          alertsBySeverity[alert.severity] = 0;
        }
        alertsBySeverity[alert.severity]++;

        // Resolved count
        if (alert.isResolved) {
          resolvedCount++;
        }
      });

      return {
        totalAlerts: alerts.length,
        resolvedAlerts: resolvedCount,
        pendingAlerts: alerts.length - resolvedCount,
        alertsByType,
        alertsBySeverity,
        resolutionRate: alerts.length > 0 ? (resolvedCount / alerts.length) * 100 : 0
      };
    } catch (error) {
      throw error;
    }
  }
}

export const alertService = new AlertService();
