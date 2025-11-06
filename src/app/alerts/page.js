'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EyeIcon,
  FunnelIcon,
  VideoCameraIcon,
  UserIcon,
  FireIcon,
  ShieldExclamationIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { databases, DATABASE_ID, COLLECTIONS, ALERT_TYPES } from '@/lib/appwrite';
import toast from 'react-hot-toast';

export default function AlertsPage() {
  const { user, organization } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    alertType: '',
    severity: '',
    isResolved: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (organization) {
      loadAlerts();
    }
  }, [organization]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      if (organization) {
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.ALERTS
        );
        // Filter by organization on client side
        const orgAlerts = response.documents.filter(alert => alert.organizationId === organization.$id);
        setAlerts(orgAlerts);
      }
    } catch (error) {
      toast.error('Failed to load alerts');
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  const handleResolveAlert = async (alertId) => {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.ALERTS,
        alertId,
        {
          isResolved: true,
          resolvedBy: user.$id,
          resolvedAt: new Date().toISOString()
        }
      );
      toast.success('Alert resolved successfully');
      loadAlerts();
    } catch (error) {
      toast.error('Failed to resolve alert');
      console.error('Error resolving alert:', error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-100 bg-red-500/20 border-red-500/50';
      case 'high': return 'text-orange-100 bg-orange-500/20 border-orange-500/50';
      case 'medium': return 'text-yellow-100 bg-yellow-500/20 border-yellow-500/50';
      default: return 'text-gray-300 bg-gray-500/20 border-gray-500/50';
    }
  };

  const getAlertTypeIcon = (alertType) => {
    switch (alertType) {
      case ALERT_TYPES.SHOPLIFTING: return ShieldExclamationIcon;
      case ALERT_TYPES.FALL_DETECTION: return UserIcon;
      case ALERT_TYPES.FIRE_DETECTION: return FireIcon;
      case ALERT_TYPES.FACE_RECOGNITION: return UserIcon;
      case ALERT_TYPES.PEOPLE_COUNT: return UsersIcon;
      default: return ExclamationTriangleIcon;
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filters.alertType && alert.alertType !== filters.alertType) return false;
    if (filters.severity && alert.severity !== filters.severity) return false;
    if (filters.isResolved !== '' && alert.isResolved.toString() !== filters.isResolved) return false;
    if (filters.search && !alert.description.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  if (!organization) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-light text-white">No Organization</h1>
          <p className="mt-2 text-gray-400">You need to be part of an organization to view alerts.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-light text-white">Security Alerts</h1>
            <p className="mt-2 text-gray-400 font-light">
              Monitor and manage security alerts from your CCTV system
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 bg-white/5 border border-gray-700/50 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200 backdrop-blur-sm"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-all duration-200 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search alerts..."
              className="block w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Alert Type
                  </label>
                  <select
                    className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                    value={filters.alertType}
                    onChange={(e) => setFilters(prev => ({ ...prev, alertType: e.target.value }))}
                  >
                    <option value="">All Types</option>
                    <option value={ALERT_TYPES.SHOPLIFTING}>Shoplifting</option>
                    <option value={ALERT_TYPES.FALL_DETECTION}>Fall Detection</option>
                    <option value={ALERT_TYPES.FIRE_DETECTION}>Fire Detection</option>
                    <option value={ALERT_TYPES.FACE_RECOGNITION}>Face Recognition</option>
                    <option value={ALERT_TYPES.PEOPLE_COUNT}>People Count</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Severity
                  </label>
                  <select
                    className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                    value={filters.severity}
                    onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                  >
                    <option value="">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                    value={filters.isResolved}
                    onChange={(e) => setFilters(prev => ({ ...prev, isResolved: e.target.value }))}
                  >
                    <option value="">All Statuses</option>
                    <option value="false">Unresolved</option>
                    <option value="true">Resolved</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setFilters({ alertType: '', severity: '', isResolved: '', search: '' })}
                  className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
          <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Alerts</p>
                <p className="text-2xl font-light text-white">{alerts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Unresolved</p>
                <p className="text-2xl font-light text-white">
                  {alerts.filter(alert => !alert.isResolved).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Critical</p>
                <p className="text-2xl font-light text-white">
                  {alerts.filter(alert => alert.severity === 'critical').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Resolved</p>
                <p className="text-2xl font-light text-white">
                  {alerts.filter(alert => alert.isResolved).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 animate-pulse">
                  <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => {
              const AlertIcon = getAlertTypeIcon(alert.alertType);
              return (
                <div key={alert.$id} className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <AlertIcon className="h-6 w-6 text-red-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-sm font-medium text-white truncate">
                            {alert.description}
                          </h3>
                          <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getSeverityColor(alert.severity)}`}>
                            {alert.severity.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <div className="flex items-center">
                            <VideoCameraIcon className="h-4 w-4 mr-1" />
                            <span>{alert.cameraName}</span>
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            <span>{new Date(alert.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!alert.isResolved ? (
                        <button
                          onClick={() => handleResolveAlert(alert.$id)}
                          className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors duration-200"
                        >
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Resolve
                        </button>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-lg text-green-100 bg-green-500/20 border border-green-500/50">
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Resolved
                        </span>
                      )}
                      <button className="text-gray-400 hover:text-white transition-colors duration-200">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-white">No alerts found</h3>
              <p className="mt-1 text-sm text-gray-400">
                {filters.search || filters.alertType || filters.severity || filters.isResolved !== '' 
                  ? 'No alerts match your current filters.' 
                  : 'No security alerts have been generated yet.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
