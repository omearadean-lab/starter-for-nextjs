import { client, databases, DATABASE_ID, COLLECTIONS } from './appwrite';
import { Query } from 'appwrite';

/**
 * Real-time Dashboard Service
 * Provides live updates for detection events, alerts, and system status
 */

export class RealtimeDashboardService {
  constructor() {
    this.subscribers = new Map();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
  }

  /**
   * Subscribe to real-time updates for an organisation
   */
  async subscribeToOrganisation(organizationId, callbacks = {}) {
    try {
      console.log(`🔄 Subscribing to real-time updates for organisation: ${organizationId}`);

      // Subscribe to detection events
      const detectionSubscription = client.subscribe(
        `databases.${DATABASE_ID}.collections.${COLLECTIONS.DETECTION_EVENTS}.documents`,
        (response) => {
          this.handleDetectionEventUpdate(response, organizationId, callbacks.onDetectionEvent);
        }
      );

      // Subscribe to alerts
      const alertSubscription = client.subscribe(
        `databases.${DATABASE_ID}.collections.${COLLECTIONS.ALERTS}.documents`,
        (response) => {
          this.handleAlertUpdate(response, organizationId, callbacks.onAlert);
        }
      );

      // Subscribe to notifications
      const notificationSubscription = client.subscribe(
        `databases.${DATABASE_ID}.collections.${COLLECTIONS.NOTIFICATIONS}.documents`,
        (response) => {
          this.handleNotificationUpdate(response, organizationId, callbacks.onNotification);
        }
      );

      // Subscribe to camera status updates
      const cameraSubscription = client.subscribe(
        `databases.${DATABASE_ID}.collections.cctv_cameras.documents`,
        (response) => {
          this.handleCameraUpdate(response, organizationId, callbacks.onCameraUpdate);
        }
      );

      // Store subscriptions for cleanup
      this.subscribers.set(organizationId, {
        detectionSubscription,
        alertSubscription,
        notificationSubscription,
        cameraSubscription,
        callbacks,
        connectedAt: new Date().toISOString()
      });

      this.isConnected = true;
      this.reconnectAttempts = 0;

      console.log(`✅ Real-time subscriptions active for organisation: ${organizationId}`);

      // Call connection callback if provided
      if (callbacks.onConnect) {
        callbacks.onConnect({ organizationId, connectedAt: new Date().toISOString() });
      }

      return true;

    } catch (error) {
      console.error('Error subscribing to real-time updates:', error);
      
      // Attempt reconnection
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
          this.subscribeToOrganisation(organizationId, callbacks);
        }, this.reconnectDelay * this.reconnectAttempts);
      }

      return false;
    }
  }

  /**
   * Handle detection event updates
   */
  handleDetectionEventUpdate(response, organizationId, callback) {
    try {
      const event = response.payload;
      
      // Only process events for this organisation
      if (event.organizationId !== organizationId) return;

      const updateData = {
        type: 'detection_event',
        action: response.events[0], // 'databases.*.collections.*.documents.*.create'
        event: event,
        timestamp: new Date().toISOString()
      };

      console.log(`🔍 Real-time detection event: ${event.detectionType} at ${event.cameraName}`);

      // Call callback if provided
      if (callback) {
        callback(updateData);
      }

      // Broadcast to all dashboard components
      this.broadcastUpdate(organizationId, 'detection_event', updateData);

    } catch (error) {
      console.error('Error handling detection event update:', error);
    }
  }

  /**
   * Handle alert updates
   */
  handleAlertUpdate(response, organizationId, callback) {
    try {
      const alert = response.payload;
      
      if (alert.organizationId !== organizationId) return;

      const updateData = {
        type: 'alert',
        action: response.events[0],
        alert: alert,
        timestamp: new Date().toISOString()
      };

      console.log(`🚨 Real-time alert: ${alert.alertType} (${alert.severity}) at ${alert.cameraName}`);

      // Call callback if provided
      if (callback) {
        callback(updateData);
      }

      // Broadcast to dashboard components
      this.broadcastUpdate(organizationId, 'alert', updateData);

      // Handle critical alerts with special processing
      if (alert.severity === 'critical') {
        this.handleCriticalAlert(alert, organizationId);
      }

    } catch (error) {
      console.error('Error handling alert update:', error);
    }
  }

  /**
   * Handle notification updates
   */
  handleNotificationUpdate(response, organizationId, callback) {
    try {
      const notification = response.payload;
      
      if (notification.organizationId !== organizationId) return;

      const updateData = {
        type: 'notification',
        action: response.events[0],
        notification: notification,
        timestamp: new Date().toISOString()
      };

      console.log(`📱 Real-time notification: ${notification.title}`);

      if (callback) {
        callback(updateData);
      }

      this.broadcastUpdate(organizationId, 'notification', updateData);

    } catch (error) {
      console.error('Error handling notification update:', error);
    }
  }

  /**
   * Handle camera status updates
   */
  handleCameraUpdate(response, organizationId, callback) {
    try {
      const camera = response.payload;
      
      if (camera.organizationId !== organizationId) return;

      const updateData = {
        type: 'camera_status',
        action: response.events[0],
        camera: camera,
        timestamp: new Date().toISOString()
      };

      console.log(`📹 Real-time camera update: ${camera.name} - ${camera.status}`);

      if (callback) {
        callback(updateData);
      }

      this.broadcastUpdate(organizationId, 'camera_status', updateData);

    } catch (error) {
      console.error('Error handling camera update:', error);
    }
  }

  /**
   * Handle critical alerts with immediate actions
   */
  handleCriticalAlert(alert, organizationId) {
    try {
      console.log(`🚨 CRITICAL ALERT DETECTED: ${alert.alertType}`);

      // Send browser notification if supported
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(`CRITICAL: ${alert.alertType}`, {
            body: alert.description,
            icon: '/icons/alert-critical.png',
            tag: `critical-${alert.$id}`,
            requireInteraction: true
          });
        }
      }

      // Play alert sound
      this.playAlertSound('critical');

      // Flash browser tab title
      this.flashTabTitle(`🚨 CRITICAL ALERT - ${alert.alertType}`);

      // Update dashboard with critical styling
      this.broadcastUpdate(organizationId, 'critical_alert', {
        type: 'critical_alert',
        alert: alert,
        timestamp: new Date().toISOString(),
        requiresAttention: true
      });

    } catch (error) {
      console.error('Error handling critical alert:', error);
    }
  }

  /**
   * Broadcast updates to all dashboard components
   */
  broadcastUpdate(organizationId, updateType, data) {
    try {
      // Use custom events to notify dashboard components
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('dashboard-update', {
          detail: {
            organizationId,
            updateType,
            data,
            timestamp: new Date().toISOString()
          }
        });
        
        window.dispatchEvent(event);
      }

      // Store recent updates for new subscribers
      this.storeRecentUpdate(organizationId, updateType, data);

    } catch (error) {
      console.error('Error broadcasting update:', error);
    }
  }

  /**
   * Store recent updates for dashboard state management
   */
  storeRecentUpdate(organizationId, updateType, data) {
    try {
      const key = `dashboard_updates_${organizationId}`;
      const maxUpdates = 50; // Keep last 50 updates
      
      if (typeof window !== 'undefined' && window.localStorage) {
        let updates = [];
        
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            updates = JSON.parse(stored);
          }
        } catch (e) {
          updates = [];
        }

        // Add new update
        updates.unshift({
          type: updateType,
          data: data,
          timestamp: new Date().toISOString()
        });

        // Keep only recent updates
        updates = updates.slice(0, maxUpdates);

        // Store back
        localStorage.setItem(key, JSON.stringify(updates));
      }

    } catch (error) {
      console.error('Error storing recent update:', error);
    }
  }

  /**
   * Get recent updates for dashboard initialisation
   */
  getRecentUpdates(organizationId, limit = 20) {
    try {
      const key = `dashboard_updates_${organizationId}`;
      
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(key);
        if (stored) {
          const updates = JSON.parse(stored);
          return updates.slice(0, limit);
        }
      }

      return [];

    } catch (error) {
      console.error('Error getting recent updates:', error);
      return [];
    }
  }

  /**
   * Play alert sound based on severity
   */
  playAlertSound(severity = 'medium') {
    try {
      if (typeof window === 'undefined' || !window.Audio) return;

      const soundMap = {
        low: '/sounds/alert-low.mp3',
        medium: '/sounds/alert-medium.mp3',
        high: '/sounds/alert-high.mp3',
        critical: '/sounds/alert-critical.mp3'
      };

      const soundFile = soundMap[severity] || soundMap.medium;
      const audio = new Audio(soundFile);
      
      audio.volume = 0.7;
      audio.play().catch(error => {
        console.warn('Could not play alert sound:', error);
      });

    } catch (error) {
      console.error('Error playing alert sound:', error);
    }
  }

  /**
   * Flash browser tab title for attention
   */
  flashTabTitle(alertTitle, duration = 10000) {
    try {
      if (typeof window === 'undefined') return;

      const originalTitle = document.title;
      let isFlashing = true;
      
      const flashInterval = setInterval(() => {
        document.title = isFlashing ? alertTitle : originalTitle;
        isFlashing = !isFlashing;
      }, 1000);

      // Stop flashing after duration
      setTimeout(() => {
        clearInterval(flashInterval);
        document.title = originalTitle;
      }, duration);

    } catch (error) {
      console.error('Error flashing tab title:', error);
    }
  }

  /**
   * Get live dashboard statistics
   */
  async getLiveDashboardStats(organizationId) {
    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Get recent detection events
      const detectionEvents = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.DETECTION_EVENTS,
        [
          Query.equal('organizationId', organizationId),
          Query.greaterThan('createdAt', last24Hours.toISOString()),
          Query.orderDesc('createdAt'),
          Query.limit(100)
        ]
      );

      // Get active alerts
      const alerts = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ALERTS,
        [
          Query.equal('organizationId', organizationId),
          Query.equal('isResolved', false),
          Query.orderDesc('createdAt')
        ]
      );

      // Get camera status
      const cameras = await databases.listDocuments(
        DATABASE_ID,
        'cctv_cameras',
        [
          Query.equal('organizationId', organizationId)
        ]
      );

      // Calculate statistics
      const stats = {
        detectionEvents: {
          total: detectionEvents.documents.length,
          last24h: detectionEvents.documents.length,
          byType: this.groupByType(detectionEvents.documents, 'detectionType'),
          recent: detectionEvents.documents.slice(0, 5)
        },
        alerts: {
          active: alerts.documents.length,
          critical: alerts.documents.filter(a => a.severity === 'critical').length,
          high: alerts.documents.filter(a => a.severity === 'high').length,
          recent: alerts.documents.slice(0, 5)
        },
        cameras: {
          total: cameras.documents.length,
          online: cameras.documents.filter(c => c.status === 'online').length,
          offline: cameras.documents.filter(c => c.status === 'offline').length,
          aiEnabled: cameras.documents.filter(c => c.enabledDetections).length
        },
        lastUpdated: new Date().toISOString()
      };

      return stats;

    } catch (error) {
      console.error('Error getting live dashboard stats:', error);
      return null;
    }
  }

  /**
   * Group items by a specific field
   */
  groupByType(items, field) {
    return items.reduce((acc, item) => {
      const key = item[field] || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribeFromOrganisation(organizationId) {
    try {
      const subscription = this.subscribers.get(organizationId);
      
      if (subscription) {
        // Close all subscriptions
        subscription.detectionSubscription();
        subscription.alertSubscription();
        subscription.notificationSubscription();
        subscription.cameraSubscription();
        
        this.subscribers.delete(organizationId);
        
        console.log(`🔌 Unsubscribed from real-time updates for organisation: ${organizationId}`);
      }

    } catch (error) {
      console.error('Error unsubscribing from real-time updates:', error);
    }
  }

  /**
   * Clean up all subscriptions
   */
  cleanup() {
    try {
      for (const [organizationId] of this.subscribers) {
        this.unsubscribeFromOrganisation(organizationId);
      }
      
      this.isConnected = false;
      console.log('🧹 Cleaned up all real-time subscriptions');

    } catch (error) {
      console.error('Error cleaning up subscriptions:', error);
    }
  }

  /**
   * Check connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      activeSubscriptions: this.subscribers.size,
      reconnectAttempts: this.reconnectAttempts,
      subscriptions: Array.from(this.subscribers.keys())
    };
  }
}

export const realtimeDashboardService = new RealtimeDashboardService();
export default RealtimeDashboardService;
