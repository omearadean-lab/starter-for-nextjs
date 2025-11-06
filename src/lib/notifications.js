import { messaging, databases, DATABASE_ID, COLLECTIONS } from './appwrite';
import { ID } from 'appwrite';

export class NotificationService {
  // Send push notification
  async sendPushNotification(title, body, data = {}, targets = []) {
    try {
      const message = await messaging.createPush(
        ID.unique(),
        title,
        body,
        targets,
        data,
        null, // action
        null, // icon
        null, // sound
        null, // color
        null, // tag
        null, // badge
        false, // draft
        null  // scheduledAt
      );
      
      return message;
    } catch (error) {
      console.error('Failed to send push notification:', error);
      throw error;
    }
  }

  // Send email notification
  async sendEmailNotification(subject, content, targets = [], cc = [], bcc = []) {
    try {
      const message = await messaging.createEmail(
        ID.unique(),
        subject,
        content,
        targets,
        cc,
        bcc,
        null, // html
        false, // draft
        null  // scheduledAt
      );
      
      return message;
    } catch (error) {
      console.error('Failed to send email notification:', error);
      throw error;
    }
  }

  // Send SMS notification
  async sendSMSNotification(content, targets = []) {
    try {
      const message = await messaging.createSms(
        ID.unique(),
        content,
        targets,
        false, // draft
        null   // scheduledAt
      );
      
      return message;
    } catch (error) {
      console.error('Failed to send SMS notification:', error);
      throw error;
    }
  }

  // Create notification record in database
  async createNotificationRecord(notificationData) {
    try {
      const notification = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.NOTIFICATIONS,
        ID.unique(),
        {
          ...notificationData,
          createdAt: new Date().toISOString(),
          isRead: false
        }
      );
      
      return notification;
    } catch (error) {
      console.error('Failed to create notification record:', error);
      throw error;
    }
  }

  // Get notifications for user
  async getUserNotifications(userId, limit = 50) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.NOTIFICATIONS
      );
      
      // Filter and sort on client side
      const userNotifications = response.documents
        .filter(notification => notification.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);
      
      return userNotifications;
    } catch (error) {
      console.error('Failed to get user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.NOTIFICATIONS,
        notificationId,
        {
          readAt: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for user
  async markAllAsRead(userId) {
    try {
      const notifications = await this.getUserNotifications(userId);
      const unreadNotifications = notifications.filter(n => !n.readAt);
      
      await Promise.all(
        unreadNotifications.map(notification => 
          this.markAsRead(notification.$id)
        )
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  // Send alert notification
  async sendAlertNotification(alert, users = []) {
    try {
      const title = `Security Alert: ${alert.type}`;
      const body = `${alert.severity.toUpperCase()} alert from ${alert.cameraName}: ${alert.description}`;
      
      const notificationData = {
        type: 'alert',
        title,
        body,
        alertId: alert.$id,
        severity: alert.severity,
        organizationId: alert.organizationId
      };

      // Send push notifications to users
      if (users.length > 0) {
        const targets = users.map(user => user.$id);
        await this.sendPushNotification(title, body, notificationData, targets);
      }

      // Create notification records for each user
      await Promise.all(
        users.map(user => 
          this.createNotificationRecord({
            ...notificationData,
            userId: user.$id
          })
        )
      );

      return true;
    } catch (error) {
      console.error('Failed to send alert notification:', error);
      throw error;
    }
  }

  // Send detection event notification
  async sendDetectionEventNotification(event, users = []) {
    try {
      const title = `Detection Event: ${event.detectionType}`;
      const body = `${event.detectionType} detected by ${event.cameraName}`;
      
      const notificationData = {
        type: 'detection_event',
        title,
        body,
        eventId: event.$id,
        detectionType: event.detectionType,
        organizationId: event.organizationId
      };

      // Send push notifications to users
      if (users.length > 0) {
        const targets = users.map(user => user.$id);
        await this.sendPushNotification(title, body, notificationData, targets);
      }

      // Create notification records for each user
      await Promise.all(
        users.map(user => 
          this.createNotificationRecord({
            ...notificationData,
            userId: user.$id
          })
        )
      );

      return true;
    } catch (error) {
      console.error('Failed to send detection event notification:', error);
      throw error;
    }
  }

  // Send system notification
  async sendSystemNotification(title, message, users = [], type = 'system') {
    try {
      const notificationData = {
        type,
        title,
        body: message
      };

      // Send push notifications to users
      if (users.length > 0) {
        const targets = users.map(user => user.$id);
        await this.sendPushNotification(title, message, notificationData, targets);
      }

      // Create notification records for each user
      await Promise.all(
        users.map(user => 
          this.createNotificationRecord({
            ...notificationData,
            userId: user.$id
          })
        )
      );

      return true;
    } catch (error) {
      console.error('Failed to send system notification:', error);
      throw error;
    }
  }

  // Get notification statistics
  async getNotificationStats(userId) {
    try {
      const notifications = await this.getUserNotifications(userId, 1000);
      
      return {
        total: notifications.length,
        unread: notifications.filter(n => !n.readAt).length,
        alerts: notifications.filter(n => n.type === 'alert').length,
        detectionEvents: notifications.filter(n => n.type === 'detection_event').length,
        system: notifications.filter(n => n.type === 'system').length
      };
    } catch (error) {
      console.error('Failed to get notification stats:', error);
      return { total: 0, unread: 0, alerts: 0, detectionEvents: 0, system: 0 };
    }
  }
}

export const notificationService = new NotificationService();
