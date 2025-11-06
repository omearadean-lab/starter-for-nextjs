'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { 
  VideoCameraIcon, 
  ExclamationTriangleIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  EyeIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { organizationService } from '@/lib/organizations';
import { cameraService } from '@/lib/cameras';
import { alertService } from '@/lib/alerts';

export default function DashboardPage() {
  const { user, organization, isSuperAdmin, isOrgAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalOrganizations: 0,
    totalCameras: 0,
    totalUsers: 0,
    recentAlerts: 0,
    activeCameras: 0,
    resolvedAlerts: 0
  });
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      if (isSuperAdmin()) {
        // Super admin sees system-wide stats
        const organizations = await organizationService.getAllOrganizations();
        setStats(prev => ({ ...prev, totalOrganizations: organizations.length }));
        
        // Get aggregated stats from all organizations
        let totalCameras = 0;
        let totalUsers = 0;
        let totalRecentAlerts = 0;
        let totalActiveCameras = 0;
        
        for (const org of organizations) {
          const orgStats = await organizationService.getOrganizationStats(org.$id);
          totalCameras += orgStats.totalCameras;
          totalUsers += orgStats.totalUsers;
          totalRecentAlerts += orgStats.recentAlerts;
          totalActiveCameras += orgStats.activeCameras;
        }
        
        setStats(prev => ({
          ...prev,
          totalCameras,
          totalUsers,
          recentAlerts: totalRecentAlerts,
          activeCameras: totalActiveCameras
        }));
        
      } else if (organization) {
        // Organization-specific stats
        const orgStats = await organizationService.getOrganizationStats(organization.$id);
        const alertStats = await alertService.getAlertStats(organization.$id, 7);
        
        setStats(prev => ({
          ...prev,
          totalCameras: orgStats.totalCameras,
          totalUsers: orgStats.totalUsers,
          recentAlerts: orgStats.recentAlerts,
          activeCameras: orgStats.activeCameras,
          resolvedAlerts: alertStats.resolvedAlerts
        }));
        
        // Load recent alerts
        const alerts = await alertService.getAlertsByOrganization(organization.$id, {
          isResolved: false
        });
        setRecentAlerts(alerts.slice(0, 5));
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-white">
            {isSuperAdmin() ? 'System Overview' : 'Dashboard'}
          </h1>
          <p className="mt-2 text-gray-400 font-light">
            {isSuperAdmin() 
              ? 'Monitor all organizations and system performance'
              : `Welcome back, ${user.name}. Here's what's happening with your CCTV system.`
            }
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {isSuperAdmin() && (
            <StatCard
              title="Organizations"
              value={stats.totalOrganizations}
              icon={BuildingOfficeIcon}
              color="bg-blue-500"
              loading={loading}
            />
          )}
          
          <StatCard
            title="Total Cameras"
            value={stats.totalCameras}
            icon={VideoCameraIcon}
            color="bg-green-500"
            loading={loading}
          />
          
          <StatCard
            title="Active Cameras"
            value={stats.activeCameras}
            icon={EyeIcon}
            color="bg-indigo-500"
            loading={loading}
          />
          
          <StatCard
            title="Recent Alerts"
            value={stats.recentAlerts}
            icon={ExclamationTriangleIcon}
            color="bg-red-500"
            loading={loading}
          />
          
          {!isSuperAdmin() && (
            <StatCard
              title="Team Members"
              value={stats.totalUsers}
              icon={UserGroupIcon}
              color="bg-purple-500"
              loading={loading}
            />
          )}
        </div>

        {/* Recent Alerts */}
        {!isSuperAdmin() && (
          <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl">
            <div className="px-6 py-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl leading-6 font-light text-white">
                  Recent Alerts
                </h3>
                <div className="flex items-center text-sm text-gray-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  Live Updates
                </div>
              </div>
              
              {loading ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : recentAlerts.length > 0 ? (
                <div className="space-y-3">
                  {recentAlerts.map((alert) => (
                    <AlertItem key={alert.$id} alert={alert} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
                  <p className="mt-2 text-sm text-gray-500">No recent alerts</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl">
          <div className="px-6 py-6">
            <h3 className="text-lg font-light text-white mb-6">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(isOrgAdmin() || isSuperAdmin()) && (
                <>
                  <QuickActionCard
                    title="Add Camera"
                    description="Connect a new CCTV camera"
                    href="/cameras/add"
                    color="bg-blue-500"
                  />
                  <QuickActionCard
                    title="Manage Users"
                    description="Add or manage team members"
                    href="/users"
                    color="bg-green-500"
                  />
                </>
              )}
              
              <QuickActionCard
                title="View All Alerts"
                description="See all system alerts"
                href="/alerts"
                color="bg-red-500"
              />
              
              {isSuperAdmin() && (
                <QuickActionCard
                  title="Add Organization"
                  description="Create new organization"
                  href="/organizations/add"
                  color="bg-purple-500"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ title, value, icon: Icon, color, loading }) {
  return (
    <div className="bg-white/5 backdrop-blur-xl overflow-hidden border border-gray-700/50 rounded-xl hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-1">
      <div className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`${color} rounded-xl p-4 shadow-lg backdrop-blur-sm`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-300 truncate">
                {title}
              </dt>
              <dd className="text-2xl font-light text-white mt-1">
                {loading ? (
                  <div className="animate-pulse h-8 bg-gray-700 rounded w-16"></div>
                ) : (
                  value
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertItem({ alert }) {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      default: return '📋';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-gray-700/30 hover:bg-white/10 transition-all duration-200">
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
            <span className="text-lg">{getSeverityIcon(alert.severity)}</span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white truncate">{alert.description}</p>
          <div className="flex items-center mt-1 space-x-2">
            <span className="text-xs text-gray-400">{alert.cameraName}</span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-400">{alert.location}</span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-400">{new Date(alert.createdAt).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getSeverityColor(alert.severity)}`}>
          {alert.severity.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

function QuickActionCard({ title, description, href, color }) {
  return (
    <a
      href={href}
      className="block p-6 border border-gray-700/50 rounded-xl hover:border-gray-600 hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-1 bg-white/5 backdrop-blur-xl"
    >
      <div className="flex items-center space-x-4">
        <div className={`${color} rounded-xl p-3 shadow-lg backdrop-blur-sm`}>
          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-white mb-1">{title}</h4>
          <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
        </div>
      </div>
    </a>
  );
}
