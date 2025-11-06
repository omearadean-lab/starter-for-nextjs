import { databases, DATABASE_ID, COLLECTIONS } from './appwrite';
import { ID } from 'appwrite';

export class AnalyticsService {
  
  // Store daily analytics aggregation
  async storeDailyAnalytics(organizationId, date, metrics) {
    try {
      const analyticsData = {
        organizationId,
        date: date.toISOString().split('T')[0], // YYYY-MM-DD format
        totalAlerts: metrics.totalAlerts || 0,
        criticalAlerts: metrics.criticalAlerts || 0,
        resolvedAlerts: metrics.resolvedAlerts || 0,
        averageResponseTime: metrics.averageResponseTime || 0,
        camerasOnline: metrics.camerasOnline || 0,
        camerasTotal: metrics.camerasTotal || 0,
        detectionAccuracy: metrics.detectionAccuracy || 0,
        systemUptime: metrics.systemUptime || 0,
        alertsByType: JSON.stringify(metrics.alertsByType || []),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Check if record exists for this date
      const existing = await this.getDailyAnalytics(organizationId, date);
      
      if (existing) {
        // Update existing record
        return await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.ANALYTICS_DAILY,
          existing.$id,
          { ...analyticsData, updatedAt: new Date().toISOString() }
        );
      } else {
        // Create new record
        return await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.ANALYTICS_DAILY,
          ID.unique(),
          analyticsData
        );
      }
    } catch (error) {
      console.error('Error storing daily analytics:', error);
      throw error;
    }
  }

  // Store hourly analytics for more granular tracking
  async storeHourlyAnalytics(organizationId, datetime, metrics) {
    try {
      const hourKey = datetime.toISOString().substring(0, 13); // YYYY-MM-DDTHH format
      
      const analyticsData = {
        organizationId,
        hourKey,
        datetime: datetime.toISOString(),
        alertsCount: metrics.alertsCount || 0,
        criticalAlertsCount: metrics.criticalAlertsCount || 0,
        averageResponseTime: metrics.averageResponseTime || 0,
        activeCameras: metrics.activeCameras || 0,
        detectionEvents: metrics.detectionEvents || 0,
        createdAt: new Date().toISOString()
      };

      return await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.ANALYTICS_HOURLY,
        ID.unique(),
        analyticsData
      );
    } catch (error) {
      console.error('Error storing hourly analytics:', error);
      throw error;
    }
  }

  // Store system-wide metrics (for super admin)
  async storeSystemMetrics(metrics) {
    try {
      const systemData = {
        timestamp: new Date().toISOString(),
        totalOrganizations: metrics.totalOrganizations || 0,
        totalUsers: metrics.totalUsers || 0,
        totalCameras: metrics.totalCameras || 0,
        totalAlerts: metrics.totalAlerts || 0,
        systemLoad: metrics.systemLoad || 0,
        memoryUsage: metrics.memoryUsage || 0,
        diskUsage: metrics.diskUsage || 0,
        networkLatency: metrics.networkLatency || 0,
        createdAt: new Date().toISOString()
      };

      return await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.SYSTEM_METRICS,
        ID.unique(),
        systemData
      );
    } catch (error) {
      console.error('Error storing system metrics:', error);
      throw error;
    }
  }

  // Get daily analytics for a specific date
  async getDailyAnalytics(organizationId, date) {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ANALYTICS_DAILY,
        [
          databases.Query?.equal('organizationId', organizationId) || `organizationId="${organizationId}"`,
          databases.Query?.equal('date', dateStr) || `date="${dateStr}"`
        ]
      );
      
      return response.documents.length > 0 ? response.documents[0] : null;
    } catch (error) {
      console.error('Error getting daily analytics:', error);
      return null;
    }
  }

  // Get analytics for a date range
  async getAnalyticsRange(organizationId, startDate, endDate) {
    try {
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ANALYTICS_DAILY,
        [
          databases.Query?.equal('organizationId', organizationId) || `organizationId="${organizationId}"`,
          databases.Query?.greaterThanEqual('date', startStr) || `date>="${startStr}"`,
          databases.Query?.lessThanEqual('date', endStr) || `date<="${endStr}"`,
          databases.Query?.orderDesc('date') || 'date DESC'
        ]
      );
      
      return response.documents.map(doc => ({
        ...doc,
        alertsByType: JSON.parse(doc.alertsByType || '[]')
      }));
    } catch (error) {
      console.error('Error getting analytics range:', error);
      return [];
    }
  }

  // Get hourly analytics for detailed timeline
  async getHourlyAnalytics(organizationId, date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ANALYTICS_HOURLY,
        [
          databases.Query?.equal('organizationId', organizationId) || `organizationId="${organizationId}"`,
          databases.Query?.greaterThanEqual('datetime', startOfDay.toISOString()) || `datetime>="${startOfDay.toISOString()}"`,
          databases.Query?.lessThanEqual('datetime', endOfDay.toISOString()) || `datetime<="${endOfDay.toISOString()}"`,
          databases.Query?.orderAsc('datetime') || 'datetime ASC'
        ]
      );
      
      return response.documents;
    } catch (error) {
      console.error('Error getting hourly analytics:', error);
      return [];
    }
  }

  // Calculate and store analytics from raw data
  async calculateAndStoreAnalytics(organizationId, date = new Date()) {
    try {
      // Calculate date range for the day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get alerts for the day
      const alertsResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ALERTS,
        [
          databases.Query?.equal('organizationId', organizationId) || `organizationId="${organizationId}"`,
          databases.Query?.greaterThanEqual('createdAt', startOfDay.toISOString()) || `createdAt>="${startOfDay.toISOString()}"`,
          databases.Query?.lessThanEqual('createdAt', endOfDay.toISOString()) || `createdAt<="${endOfDay.toISOString()}"`
        ]
      );

      // Get cameras for the organization
      const camerasResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CCTV_CAMERAS,
        [
          databases.Query?.equal('organizationId', organizationId) || `organizationId="${organizationId}"`
        ]
      );

      const alerts = alertsResponse.documents;
      const cameras = camerasResponse.documents;

      // Calculate metrics
      const totalAlerts = alerts.length;
      const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
      const resolvedAlerts = alerts.filter(a => a.isResolved).length;
      const camerasOnline = cameras.filter(c => c.status === 'online').length;

      // Calculate average response time
      const resolvedAlertsWithTime = alerts.filter(a => a.isResolved && a.resolvedAt);
      const averageResponseTime = resolvedAlertsWithTime.length > 0 
        ? resolvedAlertsWithTime.reduce((acc, alert) => {
            const responseTime = new Date(alert.resolvedAt) - new Date(alert.createdAt);
            return acc + (responseTime / (1000 * 60)); // Convert to minutes
          }, 0) / resolvedAlertsWithTime.length
        : 0;

      // Group alerts by type
      const alertsByType = alerts.reduce((acc, alert) => {
        const existing = acc.find(item => item.type === alert.alertType);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ type: alert.alertType, count: 1 });
        }
        return acc;
      }, []);

      // Calculate system uptime (mock for now - in production, this would come from monitoring)
      const systemUptime = 99.8;
      const detectionAccuracy = 94.2;

      const metrics = {
        totalAlerts,
        criticalAlerts,
        resolvedAlerts,
        averageResponseTime: Math.round(averageResponseTime),
        camerasOnline,
        camerasTotal: cameras.length,
        detectionAccuracy,
        systemUptime,
        alertsByType
      };

      // Store daily analytics
      await this.storeDailyAnalytics(organizationId, date, metrics);

      return metrics;
    } catch (error) {
      console.error('Error calculating analytics:', error);
      throw error;
    }
  }

  // Get system metrics for super admin
  async getSystemMetrics(hours = 24) {
    try {
      const startTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SYSTEM_METRICS,
        [
          databases.Query?.greaterThanEqual('timestamp', startTime.toISOString()) || `timestamp>="${startTime.toISOString()}"`,
          databases.Query?.orderDesc('timestamp') || 'timestamp DESC'
        ]
      );
      
      return response.documents;
    } catch (error) {
      console.error('Error getting system metrics:', error);
      return [];
    }
  }

  // Cleanup old analytics data (run periodically)
  async cleanupOldData(daysToKeep = 90) {
    try {
      const cutoffDate = new Date(Date.now() - (daysToKeep * 24 * 60 * 60 * 1000));
      const cutoffStr = cutoffDate.toISOString().split('T')[0];

      // Clean up daily analytics
      const oldDailyResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ANALYTICS_DAILY,
        [
          databases.Query?.lessThan('date', cutoffStr) || `date<"${cutoffStr}"`
        ]
      );

      for (const doc of oldDailyResponse.documents) {
        await databases.deleteDocument(DATABASE_ID, COLLECTIONS.ANALYTICS_DAILY, doc.$id);
      }

      // Clean up hourly analytics (keep less time)
      const hourlycutoff = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)); // 30 days
      const oldHourlyResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ANALYTICS_HOURLY,
        [
          databases.Query?.lessThan('datetime', hourlyCutoff.toISOString()) || `datetime<"${hourlyCutoff.toISOString()}"`
        ]
      );

      for (const doc of oldHourlyResponse.documents) {
        await databases.deleteDocument(DATABASE_ID, COLLECTIONS.ANALYTICS_HOURLY, doc.$id);
      }

      console.log(`Cleaned up ${oldDailyResponse.documents.length} daily and ${oldHourlyResponse.documents.length} hourly analytics records`);
    } catch (error) {
      console.error('Error cleaning up old analytics data:', error);
    }
  }
}

export const analyticsService = new AnalyticsService();
