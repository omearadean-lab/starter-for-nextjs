import { account, databases, teams, DATABASE_ID, COLLECTIONS, USER_ROLES } from './appwrite';
import { ID, Query } from 'appwrite';

export class AuthService {
  // Create account with role-based setup
  async createAccount(email, password, name, role = USER_ROLES.USER, organizationId = null) {
    let user = null;
    try {
      // First create the auth user
      user = await account.create(ID.unique(), email, password, name);
      
      // Then create user profile in database
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.USER_PROFILES,
        user.$id,
        {
          userId: user.$id,
          email,
          name,
          role,
          organizationId,
          createdAt: new Date().toISOString()
        }
      );

      return user;
    } catch (error) {
      // If profile creation failed but user was created, clean up the auth user
      if (user && error.message.includes('Unknown attribute')) {
        try {
          // Note: In production, you might want to keep the auth user and just fix the profile
          console.warn('Profile creation failed, but auth user was created:', user.$id);
        } catch (cleanupError) {
          console.error('Failed to cleanup auth user:', cleanupError);
        }
      }
      throw error;
    }
  }

  // Login
  async login(email, password) {
    try {
      return await account.createEmailPasswordSession(email, password);
    } catch (error) {
      throw error;
    }
  }

  // Logout
  async logout() {
    try {
      return await account.deleteSession('current');
    } catch (error) {
      throw error;
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const user = await account.get();
      
      // Get user profile from database
      try {
        const profile = await databases.getDocument(
          DATABASE_ID,
          COLLECTIONS.USER_PROFILES,
          user.$id
        );
        return { ...user, profile };
      } catch (profileError) {
        // If user profile doesn't exist in database, return user without profile
        console.warn('User profile not found in database:', profileError);
        return { ...user, profile: null };
      }
    } catch (error) {
      return null;
    }
  }

  // Check if user has permission
  hasPermission(userRole, requiredRole) {
    const roleHierarchy = {
      [USER_ROLES.SUPER_ADMIN]: 3,
      [USER_ROLES.ORG_ADMIN]: 2,
      [USER_ROLES.USER]: 1
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  // Get users by organization
  async getUsersByOrganization(organizationId) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USER_PROFILES,
        [Query.equal('organizationId', organizationId)]
      );
      return response.documents;
    } catch (error) {
      throw error;
    }
  }

  // Update user role
  async updateUserRole(userId, newRole) {
    try {
      return await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.USER_PROFILES,
        userId,
        { role: newRole }
      );
    } catch (error) {
      throw error;
    }
  }

  // Deactivate user
  async deactivateUser(userId) {
    try {
      return await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.USER_PROFILES,
        userId,
        { isActive: false }
      );
    } catch (error) {
      throw error;
    }
  }
}

export const authService = new AuthService();
