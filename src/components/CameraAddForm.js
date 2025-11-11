import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cameraService } from '@/lib/cameras';
import { ALERT_TYPES } from '@/lib/appwrite';
import { getProtocolsByCategory, getProtocolConfig, generateExampleUrl, validateProtocolUrl } from '@/lib/protocol-configs';
import toast from 'react-hot-toast';
import {
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlayIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

const CameraAddForm = () => {
  const { organization } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState('rtsp');
  const [protocolCategories] = useState(getProtocolsByCategory());
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    protocol: 'rtsp',
    streamUrl: '',
    brand: '',
    model: '',
    resolution: '1920x1080',
    frameRate: 30,
    enabledDetections: [ALERT_TYPES.SHOPLIFTING, ALERT_TYPES.FALL_DETECTION],
    alertThresholds: {
      confidenceLevel: 0.8,
      peopleCountThreshold: 10,
      motionSensitivity: 'medium'
    },
    // Protocol-specific fields
    username: '',
    password: '',
    host: '',
    port: '',
    path: '',
    deviceId: '',
    token: ''
  });

  const protocolConfig = getProtocolConfig(selectedProtocol);

  useEffect(() => {
    // Update port and reset fields when protocol changes
    setFormData(prev => ({
      ...prev,
      protocol: selectedProtocol,
      port: protocolConfig?.defaultPort ? protocolConfig.defaultPort.toString() : '',
      // Reset protocol-specific fields
      host: '',
      path: '',
      username: '',
      password: '',
      token: '',
      deviceId: '',
      streamUrl: ''
    }));
  }, [selectedProtocol, protocolConfig]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!organization) {
      toast.error('No organization selected');
      return;
    }

    // Generate stream URL based on protocol
    const streamUrl = generateStreamUrl();
    if (!streamUrl) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate URL format
    const validation = validateProtocolUrl(selectedProtocol, streamUrl);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setLoading(true);

    try {
      await cameraService.addCamera({
        ...formData,
        streamUrl,
        rtspUrl: streamUrl, // For backward compatibility
        organizationId: organization.$id
      });
      toast.success('Camera added successfully!');
      router.push('/cameras');
    } catch (error) {
      toast.error('Failed to add camera');
      console.error('Error adding camera:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateStreamUrl = () => {
    const config = getProtocolConfig(selectedProtocol);
    if (!config) return '';

    switch (selectedProtocol) {
      case 'rtsp':
      case 'rtsps':
      case 'http':
      case 'https':
        if (!formData.host) return '';
        let url = `${selectedProtocol}://`;
        if (formData.username && formData.password) {
          url += `${formData.username}:${formData.password}@`;
        }
        url += formData.host;
        if (formData.port) {
          url += `:${formData.port}`;
        }
        if (formData.path) {
          url += formData.path.startsWith('/') ? formData.path : `/${formData.path}`;
        }
        return url;

      case 'onvif':
      case 'isapi':
      case 'dvrip':
        if (!formData.host) return '';
        let authUrl = `${selectedProtocol}://`;
        if (formData.username && formData.password) {
          authUrl += `${formData.username}:${formData.password}@`;
        }
        authUrl += formData.host;
        if (formData.port) {
          authUrl += `:${formData.port}`;
        }
        return authUrl;

      case 'tapo':
      case 'kasa':
        if (!formData.host || !formData.username || !formData.password) return '';
        return `${selectedProtocol}://${formData.username}:${formData.password}@${formData.host}`;

      case 'ring':
      case 'nest':
      case 'ivideon':
        if (!formData.token) return '';
        return `${selectedProtocol}://${formData.token}`;

      case 'homekit':
        if (!formData.deviceId) return '';
        return `homekit://${formData.deviceId}`;

      case 'gopro':
        if (!formData.host) return '';
        return `gopro://${formData.host}${formData.port ? `:${formData.port}` : ''}`;

      case 'roborock':
        if (!formData.deviceId) return '';
        return `roborock://${formData.deviceId}`;

      case 'ffmpeg':
        if (!formData.streamUrl) return '';
        return `ffmpeg:${formData.streamUrl}`;

      case 'exec':
        if (!formData.streamUrl) return '';
        return `exec:${formData.streamUrl}`;

      default:
        return formData.streamUrl;
    }
  };

  const testConnection = async () => {
    const streamUrl = generateStreamUrl();
    if (!streamUrl) {
      toast.error('Please fill in required fields first');
      return;
    }

    setTestingConnection(true);
    try {
      // Test via go2rtc manager
      const result = await fetch('/api/test-camera', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          streamUrl,
          protocol: selectedProtocol 
        })
      });
      
      const data = await result.json();
      
      if (data.success) {
        toast.success('Connection test successful!');
      } else {
        toast.error(data.error || 'Connection test failed');
      }
    } catch (error) {
      toast.error('Connection test failed');
    } finally {
      setTestingConnection(false);
    }
  };

  const renderProtocolFields = () => {
    if (!protocolConfig) return null;

    return (
      <div className="space-y-4">
        {/* Protocol Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900">{protocolConfig.name}</h4>
              <p className="text-sm text-blue-700 mt-1">{protocolConfig.description}</p>
              <p className="text-xs text-blue-600 mt-2 font-mono">{protocolConfig.urlFormat}</p>
              {protocolConfig.authNote && (
                <p className="text-xs text-orange-600 mt-1">⚠️ {protocolConfig.authNote}</p>
              )}
            </div>
          </div>
        </div>

        {/* Requirements */}
        {protocolConfig.requirements && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-yellow-900">Requirements</h4>
                <ul className="text-xs text-yellow-800 mt-2 space-y-1">
                  {protocolConfig.requirements.map((req, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Setup Steps */}
        {protocolConfig.setupSteps && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-green-900">Setup Steps</h4>
                <ol className="text-xs text-green-800 mt-2 space-y-1">
                  {protocolConfig.setupSteps.map((step, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2 font-medium">{index + 1}.</span>
                      <span>{step.replace(/^\d+\.\s*/, '')}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Protocol-specific fields */}
        {(selectedProtocol === 'rtsp' || selectedProtocol === 'rtsps' || 
          selectedProtocol === 'http' || selectedProtocol === 'https' ||
          selectedProtocol === 'onvif' || selectedProtocol === 'isapi' || 
          selectedProtocol === 'dvrip') && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Host/IP Address *
                </label>
                <input
                  type="text"
                  value={formData.host}
                  onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="192.168.1.100"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Port {protocolConfig.defaultPort && `(default: ${protocolConfig.defaultPort})`}
                </label>
                <input
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData(prev => ({ ...prev, port: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={protocolConfig.defaultPort?.toString() || ''}
                />
              </div>
            </div>

            {protocolConfig.requiresAuth && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="admin"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="password"
                    required
                  />
                </div>
              </div>
            )}

            {(selectedProtocol === 'rtsp' || selectedProtocol === 'rtsps' || 
              selectedProtocol === 'http' || selectedProtocol === 'https') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Path
                </label>
                <input
                  type="text"
                  value={formData.path}
                  onChange={(e) => setFormData(prev => ({ ...prev, path: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="/stream1 or /video.mjpg"
                />
              </div>
            )}
          </>
        )}

        {/* Cloud service token fields */}
        {(selectedProtocol === 'ring' || selectedProtocol === 'nest' || selectedProtocol === 'ivideon') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {selectedProtocol === 'ring' ? 'Refresh Token' : 
               selectedProtocol === 'nest' ? 'Project:Device ID' : 'Server ID'} *
            </label>
            <input
              type="text"
              value={formData.token}
              onChange={(e) => setFormData(prev => ({ ...prev, token: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={protocolConfig.example.split('://')[1]}
              required
            />
          </div>
        )}

        {/* Device ID fields */}
        {(selectedProtocol === 'homekit' || selectedProtocol === 'roborock') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Device ID *
            </label>
            <input
              type="text"
              value={formData.deviceId}
              onChange={(e) => setFormData(prev => ({ ...prev, deviceId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={protocolConfig.example.split('://')[1]}
              required
            />
          </div>
        )}

        {/* Custom URL for advanced protocols */}
        {(selectedProtocol === 'ffmpeg' || selectedProtocol === 'exec' || selectedProtocol === 'echo') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {selectedProtocol === 'ffmpeg' ? 'FFmpeg Input' : 
               selectedProtocol === 'exec' ? 'Command' : 'Message'} *
            </label>
            <textarea
              value={formData.streamUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, streamUrl: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={protocolConfig.example.split(':')[1]}
              rows={3}
              required
            />
          </div>
        )}

        {/* Generated URL Preview */}
        {generateStreamUrl() && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Generated Stream URL:
            </label>
            <code className="text-sm text-gray-800 break-all">
              {generateStreamUrl()}
            </code>
          </div>
        )}

        {/* Test Connection Button */}
        <button
          type="button"
          onClick={testConnection}
          disabled={testingConnection || !generateStreamUrl()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testingConnection ? (
            <>
              <Cog6ToothIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
              Testing...
            </>
          ) : (
            <>
              <PlayIcon className="-ml-1 mr-2 h-4 w-4" />
              Test Connection
            </>
          )}
        </button>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Camera Info */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Camera Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Office Camera 1"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Main Office, Reception Area"
            />
          </div>
        </div>
      </div>

      {/* Protocol Selection */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Camera Protocol</h3>
        
        <div className="space-y-4">
          {Object.entries(protocolCategories).map(([category, protocols]) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-gray-700 mb-2">{category}</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {protocols.map((protocol) => (
                  <label key={protocol.key} className="relative">
                    <input
                      type="radio"
                      name="protocol"
                      value={protocol.key}
                      checked={selectedProtocol === protocol.key}
                      onChange={(e) => setSelectedProtocol(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedProtocol === protocol.key
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      <div className="text-sm font-medium">{protocol.name}</div>
                      {protocol.defaultPort && (
                        <div className="text-xs text-gray-500">Port: {protocol.defaultPort}</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Protocol Configuration */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Connection Settings</h3>
        {renderProtocolFields()}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.push('/cameras')}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding Camera...' : 'Add Camera'}
        </button>
      </div>
    </form>
  );
};

export default CameraAddForm;
