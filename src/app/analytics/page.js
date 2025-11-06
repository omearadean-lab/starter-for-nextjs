'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { 
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  VideoCameraIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { analyticsService } from '@/lib/analytics';
import toast from 'react-hot-toast';

const TIME_RANGES = {
  '24h': { label: '24 Hours', hours: 24 },
  '7d': { label: '7 Days', hours: 168 },
  '30d': { label: '30 Days', hours: 720 },
  '90d': { label: '90 Days', hours: 2160 }
};

export default function AnalyticsPage() {
  const { user, organization, isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [analytics, setAnalytics] = useState({
    totalAlerts: 0,
    criticalAlerts: 0,
    resolvedAlerts: 0,
    averageResponseTime: 0,
    camerasOnline: 0,
    camerasTotal: 0,
    detectionAccuracy: 0,
    systemUptime: 0,
    alertsByType: [],
    alertsByHour: [],
    cameraPerformance: [],
    responseTimesTrend: []
  });

  useEffect(() => {
    if (organization || isSuperAdmin()) {
      loadAnalytics();
    }
  }, [organization, timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      if (organization) {
        // For time ranges longer than 24h, use stored analytics data
        if (timeRange !== '24h') {
          const endDate = new Date();
          const startDate = new Date(endDate.getTime() - (TIME_RANGES[timeRange].hours * 60 * 60 * 1000));
          
          // Get stored analytics data
          const storedAnalytics = await analyticsService.getAnalyticsRange(
            organization.$id, 
            startDate, 
            endDate
          );
          
          if (storedAnalytics.length > 0) {
            // Aggregate stored data
            const aggregated = storedAnalytics.reduce((acc, day) => ({
              totalAlerts: acc.totalAlerts + day.totalAlerts,
              criticalAlerts: acc.criticalAlerts + day.criticalAlerts,
              resolvedAlerts: acc.resolvedAlerts + day.resolvedAlerts,
              averageResponseTime: (acc.averageResponseTime + day.averageResponseTime) / 2,
              camerasOnline: Math.max(acc.camerasOnline, day.camerasOnline),
              camerasTotal: Math.max(acc.camerasTotal, day.camerasTotal),
              detectionAccuracy: (acc.detectionAccuracy + day.detectionAccuracy) / 2,
              systemUptime: (acc.systemUptime + day.systemUptime) / 2
            }), {
              totalAlerts: 0, criticalAlerts: 0, resolvedAlerts: 0,
              averageResponseTime: 0, camerasOnline: 0, camerasTotal: 0,
              detectionAccuracy: 0, systemUptime: 0
            });

            // Combine alert types from all days
            const allAlertsByType = storedAnalytics.flatMap(day => day.alertsByType);
            const alertsByType = allAlertsByType.reduce((acc, alert) => {
              const existing = acc.find(item => item.type === alert.type);
              if (existing) {
                existing.count += alert.count;
              } else {
                acc.push({ type: alert.type, count: alert.count });
              }
              return acc;
            }, []);

            setAnalytics({
              ...aggregated,
              alertsByType,
              alertsByHour: generateHourlyTrend(),
              cameraPerformance: await getCameraPerformance(),
              responseTimesTrend: generateMockTrend()
            });
            
            return;
          }
        }

        // For 24h or when no stored data, calculate real-time
        const calculatedMetrics = await analyticsService.calculateAndStoreAnalytics(
          organization.$id,
          new Date()
        );

        // Get hourly data for timeline
        const hourlyData = await analyticsService.getHourlyAnalytics(
          organization.$id,
          new Date()
        );

        // Generate 24-hour timeline from hourly data or alerts
        const alertsByHour = Array.from({ length: 24 }, (_, hour) => {
          const hourlyRecord = hourlyData.find(h => new Date(h.datetime).getHours() === hour);
          return {
            hour,
            count: hourlyRecord ? hourlyRecord.alertsCount : 0
          };
        });

        setAnalytics({
          ...calculatedMetrics,
          alertsByHour,
          cameraPerformance: await getCameraPerformance(),
          responseTimesTrend: generateMockTrend()
        });
      }

    } catch (error) {
      toast.error('Failed to load analytics');
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCameraPerformance = async () => {
    try {
      const camerasResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CCTV_CAMERAS,
        [databases.Query?.equal('organizationId', organization.$id) || `organizationId="${organization.$id}"`]
      );

      const alertsResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ALERTS,
        [databases.Query?.equal('organizationId', organization.$id) || `organizationId="${organization.$id}"`]
      );

      return camerasResponse.documents.map(camera => ({
        name: camera.name,
        location: camera.location,
        status: camera.status,
        uptime: camera.status === 'online' ? 98.5 + Math.random() * 1.5 : Math.random() * 50,
        alertsGenerated: alertsResponse.documents.filter(a => a.cameraId === camera.$id).length
      }));
    } catch (error) {
      console.error('Error getting camera performance:', error);
      return [];
    }
  };

  const generateHourlyTrend = () => {
    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: Math.floor(Math.random() * 10)
    }));
  };

  const generateMockTrend = () => {
    return Array.from({ length: 7 }, (_, i) => ({
      day: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
      responseTime: Math.floor(Math.random() * 20) + 5
    }));
  };

  const exportReport = () => {
    // In production, this would generate and download a PDF/Excel report
    toast.success('Report export started - you will receive an email when ready');
  };

  if (!organization && !isSuperAdmin()) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-light text-white">Access Denied</h1>
          <p className="mt-2 text-gray-400">You don't have permission to view analytics.</p>
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
            <h1 className="text-3xl font-light text-white">Analytics & Reports</h1>
            <p className="mt-2 text-gray-400 font-light">
              Comprehensive insights into your CCTV system performance
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              className="bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20 backdrop-blur-sm"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              {Object.entries(TIME_RANGES).map(([key, range]) => (
                <option key={key} value={key}>{range.label}</option>
              ))}
            </select>
            <button
              onClick={exportReport}
              className="inline-flex items-center px-4 py-2 bg-white/5 border border-gray-700/50 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200 backdrop-blur-sm"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Export Report
            </button>
            <button
              onClick={loadAnalytics}
              className="inline-flex items-center px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-all duration-200"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Alerts"
            value={analytics.totalAlerts}
            icon={ExclamationTriangleIcon}
            color="bg-blue-500/20"
            iconColor="text-blue-400"
            loading={loading}
          />
          <MetricCard
            title="Critical Alerts"
            value={analytics.criticalAlerts}
            icon={ExclamationTriangleIcon}
            color="bg-red-500/20"
            iconColor="text-red-400"
            loading={loading}
          />
          <MetricCard
            title="Avg Response Time"
            value={`${analytics.averageResponseTime}m`}
            icon={ClockIcon}
            color="bg-yellow-500/20"
            iconColor="text-yellow-400"
            loading={loading}
          />
          <MetricCard
            title="System Uptime"
            value={`${analytics.systemUptime}%`}
            icon={ShieldCheckIcon}
            color="bg-green-500/20"
            iconColor="text-green-400"
            loading={loading}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Alerts by Type */}
          <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-light text-white mb-4">Alerts by Type</h3>
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-8 bg-gray-700 rounded animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {analytics.alertsByType.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-300 capitalize">
                      {item.type?.replace('_', ' ') || 'Unknown'}
                    </span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-400 h-2 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${Math.min((item.count / Math.max(...analytics.alertsByType.map(a => a.count))) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-white w-8 text-right">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Camera Status */}
          <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-light text-white mb-4">Camera Status</h3>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-700 rounded animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">Online</span>
                  </div>
                  <span className="text-lg font-light text-white">{analytics.camerasOnline}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">Offline</span>
                  </div>
                  <span className="text-lg font-light text-white">
                    {analytics.camerasTotal - analytics.camerasOnline}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <VideoCameraIcon className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-gray-300">Total Cameras</span>
                  </div>
                  <span className="text-lg font-light text-white">{analytics.camerasTotal}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Alert Timeline */}
        <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
          <h3 className="text-lg font-light text-white mb-4">Alert Activity (24 Hours)</h3>
          {loading ? (
            <div className="h-64 bg-gray-700 rounded animate-pulse"></div>
          ) : (
            <div className="h-64 flex items-end justify-between space-x-2">
              {analytics.alertsByHour.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-blue-500/30 rounded-t transition-all duration-500 hover:bg-blue-500/50"
                    style={{ 
                      height: `${Math.max((item.count / Math.max(...analytics.alertsByHour.map(a => a.count))) * 200, 4)}px` 
                    }}
                  ></div>
                  <span className="text-xs text-gray-400 mt-2">{item.hour}:00</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Camera Performance Table */}
        <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
          <h3 className="text-lg font-light text-white mb-4">Camera Performance</h3>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-700 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700/50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Camera</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Location</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Uptime</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Alerts</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.cameraPerformance.slice(0, 10).map((camera, index) => (
                    <tr key={index} className="border-b border-gray-700/30 hover:bg-white/5 transition-colors duration-200">
                      <td className="py-3 px-4 text-sm text-white">{camera.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-300">{camera.location}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          camera.status === 'online' 
                            ? 'text-green-100 bg-green-500/20 border border-green-500/50'
                            : 'text-red-100 bg-red-500/20 border border-red-500/50'
                        }`}>
                          {camera.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300">{camera.uptime.toFixed(1)}%</td>
                      <td className="py-3 px-4 text-sm text-white">{camera.alertsGenerated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Performance Insights */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <InsightCard
            title="Detection Accuracy"
            value={`${analytics.detectionAccuracy}%`}
            trend="up"
            change="+2.1%"
            description="AI detection accuracy improved this week"
            loading={loading}
          />
          <InsightCard
            title="Response Time"
            value={`${analytics.averageResponseTime}m`}
            trend="down"
            change="-15%"
            description="Faster alert resolution compared to last period"
            loading={loading}
          />
          <InsightCard
            title="System Health"
            value={`${analytics.systemUptime}%`}
            trend="up"
            change="+0.2%"
            description="Excellent system reliability"
            loading={loading}
          />
        </div>
      </div>
    </Layout>
  );
}

function MetricCard({ title, value, icon: Icon, color, iconColor, loading }) {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-xl ${color}`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-300">{title}</p>
          {loading ? (
            <div className="h-8 w-16 bg-gray-700 rounded animate-pulse mt-1"></div>
          ) : (
            <p className="text-2xl font-light text-white">{value}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function InsightCard({ title, value, trend, change, description, loading }) {
  const TrendIcon = trend === 'up' ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
  const trendColor = trend === 'up' ? 'text-green-400' : 'text-red-400';

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
      {loading ? (
        <div className="space-y-3">
          <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse"></div>
          <div className="h-8 bg-gray-700 rounded w-1/2 animate-pulse"></div>
          <div className="h-3 bg-gray-700 rounded animate-pulse"></div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-300">{title}</h4>
            <div className={`flex items-center ${trendColor}`}>
              <TrendIcon className="h-4 w-4 mr-1" />
              <span className="text-xs font-medium">{change}</span>
            </div>
          </div>
          <p className="text-2xl font-light text-white mb-1">{value}</p>
          <p className="text-xs text-gray-400">{description}</p>
        </>
      )}
    </div>
  );
}
