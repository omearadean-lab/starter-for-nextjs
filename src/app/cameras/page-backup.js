'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { 
  PlusIcon, 
  VideoCameraIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  StopIcon,
  Cog6ToothIcon,
  WifiIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  ClockIcon,
  CameraIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import toast from 'react-hot-toast';
import { ID } from 'appwrite';

// Camera feed types and protocols that customers commonly use
const CAMERA_PROTOCOLS = {
  RTSP: 'rtsp',
  HTTP: 'http',
  HTTPS: 'https',
  RTMP: 'rtmp',
  HLS: 'hls',
  WEBRTC: 'webrtc',
  ONVIF: 'onvif'
};

const CAMERA_BRANDS = {
  HIKVISION: 'Hikvision',
  DAHUA: 'Dahua',
  AXIS: 'Axis',
  BOSCH: 'Bosch',
  SONY: 'Sony',
  SAMSUNG: 'Samsung',
  PANASONIC: 'Panasonic',
  VIVOTEK: 'Vivotek',
  FLIR: 'FLIR',
  UNIVIEW: 'Uniview',
  GENERIC: 'Generic/Other'
};

const RESOLUTION_OPTIONS = [
  { value: '640x480', label: '640x480 (VGA)' },
  { value: '1280x720', label: '1280x720 (HD)' },
  { value: '1920x1080', label: '1920x1080 (Full HD)' },
  { value: '2560x1440', label: '2560x1440 (2K)' },
  { value: '3840x2160', label: '3840x2160 (4K)' },
  { value: '7680x4320', label: '7680x4320 (8K)' }
];

export default function CamerasPage() {
  const { user, organization, isOrgAdmin, isSuperAdmin } = useAuth();
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCamera, setEditingCamera] = useState(null);
  const [testingConnection, setTestingConnection] = useState(null);

  useEffect(() => {
    if (organization || isSuperAdmin()) {
      loadCameras();
    }
  }, [organization]);

  const loadCameras = async () => {
    try {
      setLoading(true);
      if (organization) {
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.CCTV_CAMERAS,
          [
            databases.Query?.equal('organizationId', organization.$id) || `organizationId="${organization.$id}"`
          ]
        );
        setCameras(response.documents);
      }
    } catch (error) {
      toast.error('Failed to load cameras');
      console.error('Error loading cameras:', error);
    } finally {
      setLoading(false);
    }
  };

  const testCameraConnection = async (cameraData) => {
    setTestingConnection(cameraData.name);
    try {
      // Simulate connection test - in real implementation, this would test the actual stream
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For now, we'll randomly succeed/fail for demo purposes
      // In production, this would make an actual request to the camera stream
      const success = Math.random() > 0.3; // 70% success rate for demo
      
      if (success) {
        toast.success(`Camera "${cameraData.name}" connection successful`);
        return true;
      } else {
        toast.error(`Camera "${cameraData.name}" connection failed`);
        return false;
      }
    } catch (error) {
      toast.error(`Failed to test camera connection: ${error.message}`);
      return false;
    } finally {
      setTestingConnection(null);
    }
  };

  const handleDeleteCamera = async (cameraId, cameraName) => {
    if (!confirm(`Are you sure you want to delete ${cameraName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await cameraService.deleteCamera(cameraId);
      toast.success('Camera deleted successfully');
      loadCameras();
    } catch (error) {
      toast.error('Failed to delete camera');
      console.error('Error deleting camera:', error);
    }
  };

  const handleToggleCameraStatus = async (cameraId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'online' ? 'offline' : 'online';
      await cameraService.updateCameraStatus(cameraId, newStatus);
      toast.success(`Camera ${newStatus === 'online' ? 'activated' : 'deactivated'}`);
      loadCameras();
    } catch (error) {
      toast.error('Failed to update camera status');
      console.error('Error updating camera status:', error);
    }
  };

  const filteredCameras = cameras.filter(camera =>
    camera.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    camera.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!organization && !isSuperAdmin()) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">No Organization</h1>
          <p className="mt-2 text-gray-600">You need to be part of an organization to manage cameras.</p>
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
            <h1 className="text-2xl font-bold text-gray-900">CCTV Cameras</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your CCTV camera network
            </p>
          </div>
          {(isOrgAdmin() || isSuperAdmin()) && (
            <Link
              href="/cameras/add"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Camera
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <VideoCameraIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Cameras</dt>
                    <dd className="text-lg font-medium text-gray-900">{cameras.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <SignalIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Online</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {cameras.filter(c => c.status === 'online').length}
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
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Offline</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {cameras.filter(c => c.status === 'offline').length}
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
                  <EyeIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {cameras.filter(c => c.isActive).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="max-w-md">
          <input
            type="text"
            placeholder="Search cameras..."
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Cameras Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white shadow rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredCameras.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCameras.map((camera) => (
              <CameraCard
                key={camera.$id}
                camera={camera}
                onDelete={handleDeleteCamera}
                onToggleStatus={handleToggleCameraStatus}
                canEdit={isOrgAdmin() || isSuperAdmin()}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <VideoCameraIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No cameras found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first camera.'}
            </p>
            {!searchTerm && (isOrgAdmin() || isSuperAdmin()) && (
              <div className="mt-6">
                <Link
                  href="/cameras/add"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Camera
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

function CameraCard({ camera, onDelete, onToggleStatus, canEdit }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'offline': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    return status === 'online' ? SignalIcon : ExclamationTriangleIcon;
  };

  const StatusIcon = getStatusIcon(camera.status);

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {camera.name}
          </h3>
          <div className="flex items-center space-x-2">
            <StatusIcon className="h-4 w-4 text-gray-400" />
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(camera.status)}`}>
              {camera.status}
            </span>
          </div>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>Location:</strong> {camera.location}</p>
          <p><strong>Resolution:</strong> {camera.resolution}</p>
          <p><strong>Frame Rate:</strong> {camera.frameRate} fps</p>
          <p className="text-xs text-gray-500">
            Added {new Date(camera.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Detection Types */}
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-700 mb-2">Enabled Detections:</p>
          <div className="flex flex-wrap gap-1">
            {camera.enabledDetections?.map((detection) => (
              <span
                key={detection}
                className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
              >
                {detection.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => onToggleStatus(camera.$id, camera.status)}
              className={`inline-flex items-center px-3 py-1 border shadow-sm text-xs font-medium rounded ${
                camera.status === 'online'
                  ? 'border-red-300 text-red-700 bg-white hover:bg-red-50'
                  : 'border-green-300 text-green-700 bg-white hover:bg-green-50'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {camera.status === 'online' ? 'Deactivate' : 'Activate'}
            </button>
            
            <div className="flex space-x-2">
              <Link
                href={`/cameras/${camera.$id}/edit`}
                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PencilIcon className="h-3 w-3 mr-1" />
                Edit
              </Link>
              
              <button
                onClick={() => onDelete(camera.$id, camera.name)}
                className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon className="h-3 w-3 mr-1" />
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
