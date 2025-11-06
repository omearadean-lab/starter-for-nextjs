import { databases, DATABASE_ID, COLLECTIONS } from './appwrite';
import { ID, Query } from 'appwrite';

export class OrganizationService {
  // Create new organization
  async createOrganization(data) {
    try {
      const organization = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.ORGANIZATIONS,
        ID.unique(),
        {
          name: data.name,
          description: data.description,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          address: data.address,
          subscriptionPlan: data.subscriptionPlan || 'basic',
          maxCameras: data.maxCameras || 10,
          maxUsers: data.maxUsers || 5,
          isActive: true,
          createdAt: new Date().toISOString(),
          settings: {
            alertRetentionDays: 30,
            videoRetentionDays: 7,
            enableEmailAlerts: true,
            enableSMSAlerts: false,
            enablePushNotifications: true
          }
        }
      );
      return organization;
    } catch (error) {
      throw error;
    }
  }

  // Get all organizations (Super Admin only)
  async getAllOrganizations() {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ORGANIZATIONS
      );
      return response.documents;
    } catch (error) {
      throw error;
    }
  }

  // Get organization by ID
  async getOrganization(organizationId) {
    try {
      return await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.ORGANIZATIONS,
        organizationId
      );
    } catch (error) {
      throw error;
    }
  }

  // Update organization
  async updateOrganization(organizationId, data) {
    try {
      return await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.ORGANIZATIONS,
        organizationId,
        {
          ...data,
          updatedAt: new Date().toISOString()
        }
      );
    } catch (error) {
      throw error;
    }
  }

  // Deactivate organization
  async deactivateOrganization(organizationId) {
    try {
      return await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.ORGANIZATIONS,
        organizationId,
        { 
          isActive: false,
          deactivatedAt: new Date().toISOString()
        }
      );
    } catch (error) {
      throw error;
    }
  }

  // Get organization statistics
  async getOrganizationStats(organizationId) {
    try {
      // Get cameras count
      const camerasResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CCTV_CAMERAS,
        [Query.equal('organizationId', organizationId)]
      );

      // Get users count
      const usersResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USER_PROFILES,
        [Query.equal('organizationId', organizationId)]
      );

      // Get recent alerts count (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const alertsResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ALERTS,
        [
          Query.equal('organizationId', organizationId),
          Query.greaterThan('createdAt', yesterday.toISOString())
        ]
      );

      return {
        totalCameras: camerasResponse.total,
        totalUsers: usersResponse.total,
        recentAlerts: alertsResponse.total,
        activeCameras: camerasResponse.documents.filter(cam => cam.isActive).length
      };
    } catch (error) {
      throw error;
    }
  }

  // Update organization settings
  async updateOrganizationSettings(organizationId, settings) {
    try {
      const org = await this.getOrganization(organizationId);
      const updatedSettings = { ...org.settings, ...settings };
      
      return await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.ORGANIZATIONS,
        organizationId,
        { 
          settings: updatedSettings,
          updatedAt: new Date().toISOString()
        }
      );
    } catch (error) {
      throw error;
    }
  }
}

export const organizationService = new OrganizationService();
