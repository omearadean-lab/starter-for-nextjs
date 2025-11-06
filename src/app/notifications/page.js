'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { 
  BellIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ShieldExclamationIcon,
  InformationCircleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { notificationService } from '@/lib/notifications';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, unread: 0, alerts: 0, detectionEvents: 0, system: 0 });

  useEffect(() => {
    if (user) {
      loadNotifications();
      loadStats();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const userNotifications = await notificationService.getUserNotifications(user.$id);
      setNotifications(userNotifications);
    } catch (error) {
      toast.error('Failed to load notifications');
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const notificationStats = await notificationService.getNotificationStats(user.$id);
      setStats(notificationStats);
    } catch (error) {
      console.error('Error loading notification stats:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      loadNotifications();
      loadStats();
      toast.success('Notification marked as read');
    } catch (error) {
      toast.error('Failed to mark notification as read');
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead(user.$id);
      loadNotifications();
      loadStats();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all notifications as read');
      console.error('Error marking all notifications as read:', error);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.body?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'unread' && !notification.readAt) ||
                         (filter === 'read' && notification.readAt) ||
                         notification.type === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-light text-white">Notifications</h1>
            <p className="mt-2 text-gray-400 font-light">
              Stay updated with alerts, events, and system messages
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-200"
            >
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Mark All Read
            </button>
            <button
              onClick={loadNotifications}
              className="inline-flex items-center px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-all duration-200"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                className="block w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <select
            className="bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-3 focus:outline-none focus:ring-2 focus:ring-white/20"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Notifications</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
            <option value="alert">Alerts</option>
            <option value="detection_event">Detection Events</option>
            <option value="system">System</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-5">
          <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center">
              <BellIcon className="h-8 w-8 text-blue-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total</p>
                <p className="text-2xl font-light text-white">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-yellow-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Unread</p>
                <p className="text-2xl font-light text-white">{stats.unread}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Alerts</p>
                <p className="text-2xl font-light text-white">{stats.alerts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center">
              <EyeIcon className="h-8 w-8 text-purple-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Events</p>
                <p className="text-2xl font-light text-white">{stats.detectionEvents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center">
              <Cog6ToothIcon className="h-8 w-8 text-green-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">System</p>
                <p className="text-2xl font-light text-white">{stats.system}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start space-x-4 animate-pulse">
                  <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="divide-y divide-gray-700/30">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.$id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-white">No notifications found</h3>
              <p className="mt-1 text-sm text-gray-400">
                {searchTerm || filter !== 'all' 
                  ? 'No notifications match your current filters.' 
                  : 'You\'re all caught up! New notifications will appear here.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function NotificationItem({ notification, onMarkAsRead }) {
  const getTypeIcon = (type) => {
    switch (type) {
      case 'alert': return <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />;
      case 'detection_event': return <EyeIcon className="h-6 w-6 text-purple-400" />;
      case 'system': return <Cog6ToothIcon className="h-6 w-6 text-blue-400" />;
      default: return <InformationCircleIcon className="h-6 w-6 text-gray-400" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'alert': return 'text-red-100 bg-red-500/20 border-red-500/50';
      case 'detection_event': return 'text-purple-100 bg-purple-500/20 border-purple-500/50';
      case 'system': return 'text-blue-100 bg-blue-500/20 border-blue-500/50';
      default: return 'text-gray-100 bg-gray-500/20 border-gray-500/50';
    }
  };

  const formatType = (type) => {
    switch (type) {
      case 'alert': return 'Alert';
      case 'detection_event': return 'Detection';
      case 'system': return 'System';
      default: return type;
    }
  };

  return (
    <div className={`p-6 hover:bg-white/5 transition-colors duration-200 ${!notification.readAt ? 'bg-white/5' : ''}`}>
      <div className="flex items-start space-x-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          {getTypeIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className={`text-sm font-medium ${notification.readAt ? 'text-gray-300' : 'text-white'}`}>
                  {notification.title}
                </h3>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getTypeColor(notification.type)}`}>
                  {formatType(notification.type)}
                </span>
                {!notification.readAt && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </div>
              <p className={`text-sm ${notification.readAt ? 'text-gray-400' : 'text-gray-300'}`}>
                {notification.body}
              </p>
              <div className="flex items-center mt-2 text-xs text-gray-500">
                <ClockIcon className="h-3 w-3 mr-1" />
                {new Date(notification.createdAt).toLocaleString()}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 ml-4">
              {!notification.readAt && (
                <button
                  onClick={() => onMarkAsRead(notification.$id)}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                  title="Mark as read"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
