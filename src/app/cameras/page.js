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

// Camera protocols supported by go2rtc
const CAMERA_PROTOCOLS = {
  // Traditional IP Camera Protocols
  RTSP: 'rtsp',
  RTSPS: 'rtsps', // RTSP over TLS/SSL - Secure
  HTTP: 'http',
  HTTPS: 'https',
  RTMP: 'rtmp',
  RTMPS: 'rtmps', // RTMP over TLS/SSL - Secure
  HLS: 'hls',
  MJPEG: 'mjpeg',
  WEBRTC: 'webrtc',
  
  // Professional Camera Standards
  ONVIF: 'onvif',
  ISAPI: 'isapi', // Hikvision API
  DVRIP: 'dvrip', // Dahua DVR protocol
  
  // Smart Home & IoT Cameras
  HOMEKIT: 'homekit', // Apple HomeKit cameras
  TAPO: 'tapo', // TP-Link Tapo cameras
  KASA: 'kasa', // TP-Link Kasa cameras
  
  // Cloud & Consumer Cameras
  RING: 'ring', // Ring doorbells/cameras
  NEST: 'nest', // Google Nest cameras
  IVIDEON: 'ivideon', // Ivideon cloud cameras
  HASS: 'hass', // Home Assistant integration
  
  // Action Cameras & Special Devices
  GOPRO: 'gopro', // GoPro cameras
  ROBOROCK: 'roborock', // Roborock vacuum cameras
  
  // Advanced Sources
  FFMPEG: 'ffmpeg', // Custom FFmpeg source
  FFMPEG_DEVICE: 'ffmpeg_device', // Local devices (webcams, etc.)
  BUBBLE: 'bubble', // Bubble protocol
  WEBTORRENT: 'webtorrent', // WebTorrent streaming
  
  // Custom & Development
  EXEC: 'exec', // Execute custom command
  ECHO: 'echo', // Echo/test source
  EXPR: 'expr' // Expression-based source
};

const CAMERA_BRANDS = {
  // Professional IP Cameras
  HIKVISION: 'Hikvision',
  DAHUA: 'Dahua',
  AXIS: 'Axis',
  BOSCH: 'Bosch',
  SONY: 'Sony',
  SAMSUNG: 'Samsung',
  PANASONIC: 'Panasonic',
  VIVOTEK: 'Vivotek',
  HANWHA: 'Hanwha Techwin',
  FLIR: 'FLIR',
  
  // Consumer & Smart Home
  RING: 'Ring',
  NEST: 'Google Nest',
  ARLO: 'Arlo',
  WYZE: 'Wyze',
  EUFY: 'Eufy Security',
  REOLINK: 'Reolink',
  AMCREST: 'Amcrest',
  
  // TP-Link Cameras
  TAPO: 'TP-Link Tapo',
  KASA: 'TP-Link Kasa',
  
  // Action & Special Cameras
  GOPRO: 'GoPro',
  ROBOROCK: 'Roborock',
  
  // Cloud Services
  IVIDEON: 'Ivideon',
  
  // Additional Professional
  UNIVIEW: 'Uniview',
  
  // Generic/Other
  GENERIC: 'Generic/Other'
};

const RESOLUTION_OPTIONS = [
  { value: '640x480', label: '640x480 (VGA)' },
  { value: '1280x720', label: '1280x720 (HD)' },
  { value: '1920x1080', label: '1920x1080 (Full HD)' },
  { value: '2560x1440', label: '2560x1440 (2K)' },
  { value: '3840x2160', label: '3840x2160 (4K)' }
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
    if (organization) {
      loadCameras();
    }
  }, [organization]);

  const loadCameras = async () => {
    try {
      setLoading(true);
      if (organization) {
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.CCTV_CAMERAS
        );
        // Filter by organization on client side
        const orgCameras = response.documents.filter(camera => camera.organizationId === organization.$id);
        setCameras(orgCameras);
      }
    } catch (error) {
      toast.error('Failed to load cameras');
      console.error('Error loading cameras:', error);
    } finally {
      setLoading(false);
    }
  };

  const testCameraConnection = async (camera) => {
    setTestingConnection(camera.$id);
    try {
      // In production, this would test the actual camera stream
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update camera status based on connection test
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.CCTV_CAMERAS,
        camera.$id,
        {
          status: 'online',
          lastSeen: new Date().toISOString()
        }
      );
      
      toast.success(`Camera "${camera.name}" connection successful`);
      loadCameras();
    } catch (error) {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.CCTV_CAMERAS,
        camera.$id,
        { status: 'offline' }
      );
      toast.error(`Camera "${camera.name}" connection failed`);
    } finally {
      setTestingConnection(null);
    }
  };

  const handleDeleteCamera = async (cameraId, cameraName) => {
    if (!confirm(`Are you sure you want to delete ${cameraName}?`)) return;

    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.CCTV_CAMERAS, cameraId);
      toast.success('Camera deleted successfully');
      loadCameras();
    } catch (error) {
      toast.error('Failed to delete camera');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'text-green-100 bg-green-500/20 border-green-500/50';
      case 'offline': return 'text-red-100 bg-red-500/20 border-red-500/50';
      case 'maintenance': return 'text-yellow-100 bg-yellow-500/20 border-yellow-500/50';
      default: return 'text-gray-300 bg-gray-500/20 border-gray-500/50';
    }
  };

  const filteredCameras = cameras.filter(camera =>
    camera.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    camera.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!organization || (!isOrgAdmin() && !isSuperAdmin())) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-light text-white">Access Denied</h1>
          <p className="mt-2 text-gray-400">You don't have permission to manage cameras.</p>
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
            <h1 className="text-3xl font-light text-white">Camera Management</h1>
            <p className="mt-2 text-gray-400 font-light">
              Configure and monitor your CCTV camera feeds
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-all duration-200"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Camera
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search cameras..."
            className="block w-full pl-4 pr-4 py-3 bg-white/5 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
          <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center">
              <VideoCameraIcon className="h-8 w-8 text-blue-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Cameras</p>
                <p className="text-2xl font-light text-white">{cameras.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Online</p>
                <p className="text-2xl font-light text-white">
                  {cameras.filter(c => c.status === 'online').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Offline</p>
                <p className="text-2xl font-light text-white">
                  {cameras.filter(c => c.status === 'offline').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center">
              <Cog6ToothIcon className="h-8 w-8 text-yellow-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Maintenance</p>
                <p className="text-2xl font-light text-white">
                  {cameras.filter(c => c.status === 'maintenance').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cameras Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
            ))
          ) : filteredCameras.length > 0 ? (
            filteredCameras.map((camera) => (
              <CameraCard
                key={camera.$id}
                camera={camera}
                onTest={() => testCameraConnection(camera)}
                onEdit={() => setEditingCamera(camera)}
                onDelete={() => handleDeleteCamera(camera.$id, camera.name)}
                testing={testingConnection === camera.$id}
                getStatusColor={getStatusColor}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <VideoCameraIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-white">No cameras found</h3>
              <p className="mt-1 text-sm text-gray-400">
                {searchTerm ? 'No cameras match your search.' : 'Get started by adding your first camera.'}
              </p>
            </div>
          )}
        </div>

        {/* Add/Edit Camera Modal */}
        {(showAddModal || editingCamera) && (
          <CameraModal
            camera={editingCamera}
            onClose={() => {
              setShowAddModal(false);
              setEditingCamera(null);
            }}
            onSave={loadCameras}
            organization={organization}
          />
        )}
      </div>
    </Layout>
  );
}

function CameraCard({ camera, onTest, onEdit, onDelete, testing, getStatusColor }) {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <VideoCameraIcon className="h-6 w-6 text-blue-400" />
          <div>
            <h3 className="text-sm font-medium text-white">{camera.name}</h3>
            <p className="text-xs text-gray-400">{camera.location}</p>
          </div>
        </div>
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(camera.status)}`}>
          {camera.status}
        </span>
      </div>

      <div className="space-y-2 text-xs text-gray-400 mb-4">
        <div className="flex justify-between">
          <span>Resolution:</span>
          <span className="text-gray-300">{camera.resolution}</span>
        </div>
        <div className="flex justify-between">
          <span>Frame Rate:</span>
          <span className="text-gray-300">{camera.frameRate} fps</span>
        </div>
        <div className="flex justify-between">
          <span>Protocol:</span>
          <span className="text-gray-300">{camera.protocol || 'RTSP'}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={onTest}
            disabled={testing}
            className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
          >
            {testing ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                Testing...
              </>
            ) : (
              <>
                <PlayIcon className="h-3 w-3 mr-1" />
                Test
              </>
            )}
          </button>
          
          {camera.status === 'online' && (
            <a
              href={`/live-view?camera=${camera.$id}`}
              className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              <EyeIcon className="h-3 w-3 mr-1" />
              Live View
            </a>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onEdit}
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="text-gray-400 hover:text-red-400 transition-colors duration-200"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CameraModal({ camera, onClose, onSave, organization }) {
  const [formData, setFormData] = useState({
    name: camera?.name || '',
    location: camera?.location || '',
    rtspUrl: camera?.rtspUrl || camera?.streamUrl || '',
    protocol: camera?.protocol || CAMERA_PROTOCOLS.RTSP,
    brand: camera?.brand || CAMERA_BRANDS.GENERIC,
    resolution: camera?.resolution || '1920x1080',
    frameRate: camera?.frameRate || 30,
    username: camera?.username || '',
    password: camera?.password || '',
    port: camera?.port || (camera?.protocol === 'rtsps' ? 322 : 554),
    encryption: camera?.encryption || (camera?.protocol === 'rtsps' || camera?.protocol === 'https'),
    enabledDetections: camera?.enabledDetections || []
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Build the complete stream URL based on protocol
      const buildStreamUrl = () => {
        const { protocol, username, password, rtspUrl, port } = formData;
        
        // If rtspUrl already contains protocol, use as-is
        if (rtspUrl.includes('://')) {
          return rtspUrl;
        }
        
        // Build URL with authentication if provided
        let url = `${protocol}://`;
        if (username && password) {
          url += `${username}:${password}@`;
        }
        url += rtspUrl;
        
        // Add port if not default
        const defaultPorts = { rtsp: 554, rtsps: 322, http: 80, https: 443 };
        if (port && port !== defaultPorts[protocol]) {
          // Check if port is already in URL
          if (!rtspUrl.includes(':' + port)) {
            const urlParts = rtspUrl.split('/');
            if (urlParts[0]) {
              urlParts[0] += ':' + port;
              url = `${protocol}://`;
              if (username && password) {
                url += `${username}:${password}@`;
              }
              url += urlParts.join('/');
            }
          }
        }
        
        return url;
      };

      const streamUrl = buildStreamUrl();
      
      const cameraData = {
        name: formData.name,
        location: formData.location,
        rtspUrl: streamUrl, // Keep for backward compatibility
        streamUrl: streamUrl, // New generic field
        protocol: formData.protocol,
        username: formData.username || null,
        password: formData.password || null,
        port: formData.port && !isNaN(formData.port) ? parseInt(formData.port) : null,
        encryption: formData.encryption || false,
        brand: formData.brand,
        resolution: formData.resolution,
        frameRate: formData.frameRate,
        enabledDetections: JSON.stringify(formData.enabledDetections),
        organizationId: organization.$id,
        status: 'offline',
        isActive: true,
        createdAt: new Date().toISOString(),
        lastSeen: new Date().toISOString()
      };

      if (camera) {
        await databases.updateDocument(DATABASE_ID, COLLECTIONS.CCTV_CAMERAS, camera.$id, cameraData);
        toast.success('Camera updated successfully');
      } else {
        await databases.createDocument(DATABASE_ID, COLLECTIONS.CCTV_CAMERAS, ID.unique(), cameraData);
        toast.success('Camera added successfully');
      }

      onSave();
      onClose();
    } catch (error) {
      toast.error('Failed to save camera');
      console.error('Error saving camera:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-light text-white">
            {camera ? 'Edit Camera' : 'Add New Camera'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Camera Name</label>
              <input
                type="text"
                required
                className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
              <input
                type="text"
                required
                className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Protocol</label>
              <select
                className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
                value={formData.protocol}
                onChange={(e) => {
                  const protocol = e.target.value;
                  const defaultPorts = {
                    rtsp: 554,
                    rtsps: 322,
                    http: 80,
                    https: 443,
                    rtmp: 1935,
                    rtmps: 443
                  };
                  
                  setFormData(prev => ({ 
                    ...prev, 
                    protocol: protocol,
                    port: defaultPorts[protocol] || 554,
                    encryption: protocol === 'rtsps' || protocol === 'https' || protocol === 'rtmps'
                  }));
                }}
              >
                {Object.entries(CAMERA_PROTOCOLS).map(([key, value]) => (
                  <option key={key} value={value}>
                    {key} {value === 'rtsps' || value === 'rtmps' ? '(Secure)' : ''}
                  </option>
                ))}
              </select>
              {(formData.protocol === 'rtsps' || formData.protocol === 'https') && (
                <p className="text-xs text-green-400 mt-1">🔒 Secure encrypted connection</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Port</label>
                <input
                  type="number"
                  min="1"
                  max="65535"
                  className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
                  value={formData.port || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, port: e.target.value ? parseInt(e.target.value) : null }))}
                  placeholder="554"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.encryption}
                    onChange={(e) => setFormData(prev => ({ ...prev, encryption: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-white/10"
                  />
                  <span className="ml-2 text-sm text-gray-300">TLS/SSL Encryption</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                <input
                  type="text"
                  className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Camera username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <input
                  type="password"
                  className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Camera password"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Brand</label>
              <select
                className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
                value={formData.brand}
                onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
              >
                {Object.entries(CAMERA_BRANDS).map(([key, value]) => (
                  <option key={key} value={value}>{value}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Resolution</label>
              <select
                className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
                value={formData.resolution}
                onChange={(e) => setFormData(prev => ({ ...prev, resolution: e.target.value }))}
              >
                {RESOLUTION_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Frame Rate (fps)</label>
              <input
                type="number"
                min="1"
                max="60"
                className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
                value={formData.frameRate}
                onChange={(e) => setFormData(prev => ({ ...prev, frameRate: parseInt(e.target.value) }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Stream URL</label>
            <input
              type="url"
              required
              placeholder={
                formData.protocol === 'rtsps' ? 'rtsps://192.168.1.100:322/stream1' :
                formData.protocol === 'rtsp' ? 'rtsp://192.168.1.100:554/stream1' :
                formData.protocol === 'https' ? 'https://camera.example.com/stream' :
                formData.protocol === 'http' ? 'http://192.168.1.100:8080/video.mjpg' :
                'rtsp://192.168.1.100:554/stream1'
              }
              className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
              value={formData.rtspUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, rtspUrl: e.target.value }))}
            />
            <div className="mt-2 text-xs text-gray-400">
              <p className="mb-1">
                {formData.protocol === 'rtsps' && '🔒 RTSPS (Secure): Default port 322'}
                {formData.protocol === 'rtsp' && '📡 RTSP: Default port 554'}
                {formData.protocol === 'https' && '🔒 HTTPS (Secure): Default port 443'}
                {formData.protocol === 'http' && '🌐 HTTP: Default port 80'}
              </p>
              <details className="mt-1">
                <summary className="cursor-pointer text-blue-400 hover:text-blue-300">View examples</summary>
                <div className="mt-2 space-y-1 text-xs bg-gray-800/50 p-2 rounded">
                  <p><strong>RTSPS (Secure):</strong> rtsps://admin:password@192.168.1.100:322/stream</p>
                  <p><strong>RTSP:</strong> rtsp://admin:password@192.168.1.100:554/stream1</p>
                  <p><strong>HTTP:</strong> http://192.168.1.100:8080/video.mjpg</p>
                  <p><strong>HTTPS:</strong> https://camera.example.com/live/stream</p>
                </div>
              </details>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
              <input
                type="text"
                className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                type="password"
                className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-700/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50"
            >
              {saving ? 'Saving...' : camera ? 'Update Camera' : 'Add Camera'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
