'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { 
  EyeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  ClockIcon,
  VideoCameraIcon,
  UserIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PhotoIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  ShieldExclamationIcon,
  FaceSmileIcon
} from '@heroicons/react/24/outline';
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import toast from 'react-hot-toast';
import { ID } from 'appwrite';

const DETECTION_TYPES = {
  PERSON: 'person',
  VEHICLE: 'vehicle',
  FACE: 'face',
  FALL: 'fall',
  THEFT: 'theft',
  FIRE: 'fire',
  MOTION: 'motion',
  OBJECT: 'object',
  INTRUSION: 'intrusion'
};

const EVENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  FALSE_POSITIVE: 'false_positive',
  IGNORED: 'ignored'
};

export default function DetectionEventsPage() {
  const { user, organization, isOrgAdmin, isSuperAdmin } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    camera: 'all',
    dateRange: '7d'
  });

  useEffect(() => {
    if (organization || isSuperAdmin()) {
      loadDetectionEvents();
    }
  }, [organization, filters]);

  const loadDetectionEvents = async () => {
    try {
      setLoading(true);
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.DETECTION_EVENTS
      );

      let filteredEvents = response.documents;

      // Filter by organization
      if (!isSuperAdmin() && organization) {
        filteredEvents = filteredEvents.filter(event => event.organizationId === organization.$id);
      }

      // Apply filters
      if (filters.status !== 'all') {
        filteredEvents = filteredEvents.filter(event => event.status === filters.status);
      }

      if (filters.type !== 'all') {
        filteredEvents = filteredEvents.filter(event => event.detectionType === filters.type);
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const now = new Date();
        let cutoffDate;
        
        switch (filters.dateRange) {
          case '1d': cutoffDate = new Date(now - 24 * 60 * 60 * 1000); break;
          case '7d': cutoffDate = new Date(now - 7 * 24 * 60 * 60 * 1000); break;
          case '30d': cutoffDate = new Date(now - 30 * 24 * 60 * 60 * 1000); break;
          default: cutoffDate = null;
        }

        if (cutoffDate) {
          filteredEvents = filteredEvents.filter(event => 
            new Date(event.detectedAt) >= cutoffDate
          );
        }
      }

      // Sort by detection time (newest first)
      filteredEvents.sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt));

      setEvents(filteredEvents);
    } catch (error) {
      toast.error('Failed to load detection events');
      console.error('Error loading detection events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventAction = async (eventId, action) => {
    try {
      const updateData = {
        status: action,
        reviewedBy: user.$id,
        reviewedAt: new Date().toISOString()
      };

      await databases.updateDocument(DATABASE_ID, COLLECTIONS.DETECTION_EVENTS, eventId, updateData);
      
      const actionMessages = {
        confirmed: 'Event confirmed as valid detection',
        false_positive: 'Event marked as false positive',
        ignored: 'Event ignored'
      };

      toast.success(actionMessages[action] || 'Event updated');
      loadDetectionEvents();
    } catch (error) {
      toast.error('Failed to update event');
      console.error('Error updating event:', error);
    }
  };

  const filteredEvents = events.filter(event =>
    event.cameraName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.detectionType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if ((!organization && !isSuperAdmin()) || (!isOrgAdmin() && !isSuperAdmin())) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-light text-white">Access Denied</h1>
          <p className="mt-2 text-gray-400">You don't have permission to view detection events.</p>
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
            <h1 className="text-3xl font-light text-white">Detection Events</h1>
            <p className="mt-2 text-gray-400 font-light">
              Review and manage AI detection events from your cameras
            </p>
          </div>
          <button
            onClick={loadDetectionEvents}
            className="inline-flex items-center px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-all duration-200"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                className="block w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <select
            className="bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-3 focus:outline-none focus:ring-2 focus:ring-white/20"
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Review</option>
            <option value="confirmed">Confirmed</option>
            <option value="false_positive">False Positive</option>
            <option value="ignored">Ignored</option>
          </select>

          <select
            className="bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-3 focus:outline-none focus:ring-2 focus:ring-white/20"
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
          >
            <option value="all">All Types</option>
            <option value="person">Person</option>
            <option value="vehicle">Vehicle</option>
            <option value="face">Face</option>
            <option value="motion">Motion</option>
            <option value="object">Object</option>
            <option value="intrusion">Intrusion</option>
          </select>

          <select
            className="bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-3 focus:outline-none focus:ring-2 focus:ring-white/20"
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
          <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center">
              <EyeIcon className="h-8 w-8 text-blue-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Events</p>
                <p className="text-2xl font-light text-white">{events.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-yellow-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Pending Review</p>
                <p className="text-2xl font-light text-white">
                  {events.filter(e => e.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Confirmed</p>
                <p className="text-2xl font-light text-white">
                  {events.filter(e => e.status === 'confirmed').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center">
              <XMarkIcon className="h-8 w-8 text-red-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">False Positives</p>
                <p className="text-2xl font-light text-white">
                  {events.filter(e => e.status === 'false_positive').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 animate-pulse">
                <div className="w-full h-48 bg-gray-700 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
            ))
          ) : filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <EventCard
                key={event.$id}
                event={event}
                onAction={handleEventAction}
                onView={() => setSelectedEvent(event)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <EyeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-white">No detection events found</h3>
              <p className="mt-1 text-sm text-gray-400">
                {searchTerm || filters.status !== 'all' || filters.type !== 'all' 
                  ? 'No events match your current filters.' 
                  : 'Detection events will appear here when cameras detect activity.'}
              </p>
            </div>
          )}
        </div>

        {/* Event Detail Modal */}
        {selectedEvent && (
          <EventDetailModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onAction={handleEventAction}
          />
        )}
      </div>
    </Layout>
  );
}

function EventCard({ event, onAction, onView }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-100 bg-yellow-500/20 border-yellow-500/50';
      case 'confirmed': return 'text-green-100 bg-green-500/20 border-green-500/50';
      case 'false_positive': return 'text-red-100 bg-red-500/20 border-red-500/50';
      case 'ignored': return 'text-gray-100 bg-gray-500/20 border-gray-500/50';
      default: return 'text-gray-100 bg-gray-500/20 border-gray-500/50';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'person': return <UserIcon className="h-5 w-5" />;
      case 'vehicle': return <VideoCameraIcon className="h-5 w-5" />;
      case 'face': return <FaceSmileIcon className="h-5 w-5" />;
      case 'motion': return <EyeIcon className="h-5 w-5" />;
      case 'intrusion': return <ShieldExclamationIcon className="h-5 w-5" />;
      default: return <EyeIcon className="h-5 w-5" />;
    }
  };

  const formatStatus = (status) => {
    switch (status) {
      case 'pending': return 'Pending Review';
      case 'confirmed': return 'Confirmed';
      case 'false_positive': return 'False Positive';
      case 'ignored': return 'Ignored';
      default: return status;
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
      {/* Event Image/Video */}
      <div className="w-full h-48 mb-4 rounded-lg overflow-hidden bg-gray-800/50 flex items-center justify-center relative">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt="Detection"
            className="w-full h-full object-cover"
          />
        ) : (
          <PhotoIcon className="h-16 w-16 text-gray-500" />
        )}
        
        {/* Confidence Score */}
        {event.confidence && (
          <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded px-2 py-1">
            <span className="text-white text-xs font-medium">{Math.round(event.confidence * 100)}%</span>
          </div>
        )}
      </div>

      {/* Event Info */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <div className="text-blue-400">
                {getTypeIcon(event.detectionType)}
              </div>
              <h3 className="text-lg font-medium text-white capitalize">
                {event.detectionType} Detection
              </h3>
            </div>
            <p className="text-sm text-gray-400">{event.cameraName}</p>
          </div>
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(event.status)}`}>
            {formatStatus(event.status)}
          </span>
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-sm text-gray-300">{event.description}</p>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-400 space-y-1">
          <div className="flex items-center">
            <ClockIcon className="h-3 w-3 mr-1" />
            {new Date(event.detectedAt).toLocaleString()}
          </div>
          {event.personIdentified && (
            <div className="flex items-center">
              <FaceSmileIcon className="h-3 w-3 mr-1" />
              Person: {event.personIdentified}
            </div>
          )}
        </div>

        {/* Actions */}
        {event.status === 'pending' && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
            <div className="flex space-x-2">
              <button
                onClick={() => onAction(event.$id, 'confirmed')}
                className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors duration-200"
              >
                Confirm
              </button>
              <button
                onClick={() => onAction(event.$id, 'false_positive')}
                className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors duration-200"
              >
                False Positive
              </button>
            </div>
            <button
              onClick={onView}
              className="text-gray-400 hover:text-white transition-colors duration-200"
              title="View Details"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {event.status !== 'pending' && (
          <div className="flex items-center justify-end pt-3 border-t border-gray-700/50">
            <button
              onClick={onView}
              className="text-gray-400 hover:text-white transition-colors duration-200"
              title="View Details"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function EventDetailModal({ event, onClose, onAction }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-light text-white">
            Detection Event Details
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Event Image/Video */}
          <div>
            <div className="w-full h-64 rounded-lg overflow-hidden bg-gray-800/50 flex items-center justify-center">
              {event.imageUrl ? (
                <img
                  src={event.imageUrl}
                  alt="Detection"
                  className="w-full h-full object-cover"
                />
              ) : (
                <PhotoIcon className="h-16 w-16 text-gray-500" />
              )}
            </div>
          </div>

          {/* Event Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Event Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white capitalize">{event.detectionType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Camera:</span>
                  <span className="text-white">{event.cameraName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Detected:</span>
                  <span className="text-white">{new Date(event.detectedAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Confidence:</span>
                  <span className="text-white">{Math.round(event.confidence * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-white capitalize">{event.status.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            {event.description && (
              <div>
                <h4 className="text-md font-medium text-white mb-2">Description</h4>
                <p className="text-sm text-gray-300">{event.description}</p>
              </div>
            )}

            {event.personIdentified && (
              <div>
                <h4 className="text-md font-medium text-white mb-2">Person Identified</h4>
                <p className="text-sm text-gray-300">{event.personIdentified}</p>
              </div>
            )}

            {/* Actions */}
            {event.status === 'pending' && (
              <div className="pt-4 border-t border-gray-700/50">
                <h4 className="text-md font-medium text-white mb-3">Review Actions</h4>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      onAction(event.$id, 'confirmed');
                      onClose();
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                  >
                    Confirm Detection
                  </button>
                  <button
                    onClick={() => {
                      onAction(event.$id, 'false_positive');
                      onClose();
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                  >
                    Mark as False Positive
                  </button>
                  <button
                    onClick={() => {
                      onAction(event.$id, 'ignored');
                      onClose();
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                  >
                    Ignore
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
