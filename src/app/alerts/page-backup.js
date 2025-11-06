'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EyeIcon,
  FunnelIcon,
  CalendarIcon,
  ClockIcon,
  VideoCameraIcon,
  UserIcon,
  FireIcon,
  ShieldExclamationIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  XMarkIcon
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
  }, [organization, filters]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      if (organization) {
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.ALERTS,
          [
            databases.Query?.equal('organizationId', organization.$id) || `organizationId="${organization.$id}"`
          ]
        );
        setAlerts(response.documents);
      }
    } catch (error) {
      toast.error('Failed to load alerts');
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
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

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      alertType: '',
      severity: '',
      isResolved: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  if (!organization) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">No Organization</h1>
          <p className="mt-2 text-gray-600">You need to be part of an organization to view alerts.</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Security Alerts</h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor and manage security alerts from your CCTV system
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Alerts</dt>
                    <dd className="text-lg font-medium text-gray-900">{alerts.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-orange-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {alerts.filter(a => !a.isResolved).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Resolved</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {alerts.filter(a => a.isResolved).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Critical</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {alerts.filter(a => a.severity === 'critical').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alert Type
                </label>
                <select
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={filters.alertType}
                  onChange={(e) => handleFilterChange('alertType', e.target.value)}
                >
                  <option value="">All Types</option>
                  {Object.values(ALERT_TYPES).map((type) => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severity
                </label>
                <select
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={filters.severity}
                  onChange={(e) => handleFilterChange('severity', e.target.value)}
                >
                  <option value="">All Severities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={filters.isResolved}
                  onChange={(e) => handleFilterChange('isResolved', e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="false">Pending</option>
                  <option value="true">Resolved</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Alerts List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white shadow rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : alerts.length > 0 ? (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.$id}
                alert={alert}
                onResolve={handleResolveAlert}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No alerts match your current filters.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );

  const clearFilters = () => {
    setFilters({
      alertType: '',
      severity: '',
      isResolved: '',
      search: ''
    });
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-100 bg-red-500/20 border-red-500/30';
      case 'high': return 'text-orange-100 bg-orange-500/20 border-orange-500/30';
      case 'medium': return 'text-yellow-100 bg-yellow-500/20 border-yellow-500/30';
      default: return 'text-gray-300 bg-gray-500/20 border-gray-500/30';
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

function AlertCard({ alert, onResolve }) {
  const AlertIcon = getAlertTypeIcon(alert.alertType);

  return (
    <div className={`bg-white shadow rounded-lg border-l-4 ${getSeverityColor(alert.severity).split(' ')[2]}`}>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <AlertIcon className="h-6 w-6 text-red-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-lg font-medium text-gray-900">
                  {alert.description}
                </h3>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(alert.severity)}`}>
                  {alert.severity}
                </span>
                {alert.isResolved && (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Resolved
                  </span>
                )}
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Camera:</strong> {alert.cameraName}</p>
                <p><strong>Location:</strong> {alert.location}</p>
                <p><strong>Type:</strong> {alert.alertType.replace('_', ' ').toUpperCase()}</p>
                <p><strong>Confidence:</strong> {Math.round(alert.confidence * 100)}%</p>
                <p><strong>Time:</strong> {format(new Date(alert.createdAt), 'PPpp')}</p>
                {alert.isResolved && alert.resolvedAt && (
                  <p><strong>Resolved:</strong> {format(new Date(alert.resolvedAt), 'PPpp')}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            {alert.imageUrl && (
              <button className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <EyeIcon className="h-3 w-3 mr-1" />
                View Image
              </button>
            )}
            
            {!alert.isResolved && (
              <button
                onClick={() => onResolve(alert.$id)}
                className="inline-flex items-center px-3 py-1 border border-green-300 shadow-sm text-xs font-medium rounded text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <CheckCircleIcon className="h-3 w-3 mr-1" />
                Resolve
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
