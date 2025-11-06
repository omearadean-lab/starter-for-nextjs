'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '@/lib/auth';
import { organizationService } from '@/lib/organizations';
import { USER_ROLES } from '@/lib/appwrite';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        
        // Load organization data if user belongs to one
        if (currentUser.profile?.organizationId) {
          try {
            const org = await organizationService.getOrganization(
              currentUser.profile.organizationId
            );
            setOrganization(org);
          } catch (error) {
            console.warn('Organization not found:', error);
          }
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      await authService.login(email, password);
      await checkAuth();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setOrganization(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      await authService.createAccount(
        userData.email,
        userData.password,
        userData.name,
        userData.role,
        userData.organizationId
      );
      
      // Auto-login after registration
      await login(userData.email, userData.password);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const hasPermission = (requiredRole) => {
    if (!user?.profile?.role) return false;
    return authService.hasPermission(user.profile.role, requiredRole);
  };

  const isSuperAdmin = () => {
    return user?.profile?.role === USER_ROLES.SUPER_ADMIN;
  };

  const isOrgAdmin = () => {
    return user?.profile?.role === USER_ROLES.ORG_ADMIN;
  };

  const isUser = () => {
    return user?.profile?.role === USER_ROLES.USER;
  };

  const refreshOrganization = async () => {
    if (user?.profile?.organizationId) {
      try {
        const org = await organizationService.getOrganization(
          user.profile.organizationId
        );
        setOrganization(org);
      } catch (error) {
        console.error('Failed to refresh organization:', error);
      }
    }
  };

  const value = {
    user,
    organization,
    loading,
    login,
    logout,
    register,
    hasPermission,
    isSuperAdmin,
    isOrgAdmin,
    isUser,
    refreshOrganization,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };
