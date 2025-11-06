'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { cameraService } from '@/lib/cameras';
import { ALERT_TYPES } from '@/lib/appwrite';
import toast from 'react-hot-toast';

export default function AddCameraPage() {
  const { organization, isOrgAdmin, isSuperAdmin } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    rtspUrl: '',
    resolution: '1920x1080',
    frameRate: 30,
    enabledDetections: [ALERT_TYPES.SHOPLIFTING, ALERT_TYPES.FALL_DETECTION],
    alertThresholds: {
      confidenceLevel: 0.8,
      peopleCountThreshold: 10,
      motionSensitivity: 'medium'
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!organization) {
      toast.error('No organization selected');
      return;
    }

    setLoading(true);

    try {
      await cameraService.addCamera({
        ...formData,
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

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (name.startsWith('alertThresholds.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        alertThresholds: {
          ...prev.alertThresholds,
          [field]: type === 'number' ? parseFloat(value) : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseInt(value) || 0 : value
      }));
    }
  };

  const handleDetectionChange = (detection, checked) => {
    setFormData(prev => ({
      ...prev,
      enabledDetections: checked
        ? [...prev.enabledDetections, detection]
        : prev.enabledDetections.filter(d => d !== detection)
    }));
  };

  const testConnection = async () => {
    if (!formData.rtspUrl) {
      toast.error('Please enter RTSP URL first');
      return;
    }

    setTestingConnection(true);
    try {
      const result = await cameraService.testCameraConnection(formData.rtspUrl);
      if (result.success) {
        toast.success(`Connection successful! Latency: ${Math.round(result.latency)}ms`);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Connection test failed');
    } finally {
      setTestingConnection(false);
    }
  };

  if (!organization || (!isOrgAdmin() && !isSuperAdmin())) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-gray-600">You don't have permission to add cameras.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Add New Camera</h1>
          <p className="mt-1 text-sm text-gray-500">
            Connect a new CCTV camera to your monitoring system
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow rounded-lg p-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Camera Name *
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g., Front Entrance Camera"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  id="location"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g., Main Entrance, Store Floor 1"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="rtspUrl" className="block text-sm font-medium text-gray-700">
                RTSP URL *
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="url"
                  name="rtspUrl"
                  id="rtspUrl"
                  required
                  className="flex-1 block w-full border-gray-300 rounded-l-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="rtsp://username:password@camera-ip:port/stream"
                  value={formData.rtspUrl}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={testConnection}
                  disabled={testingConnection}
                  className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm hover:bg-gray-100 disabled:opacity-50"
                >
                  {testingConnection ? 'Testing...' : 'Test'}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Enter the RTSP stream URL for your camera
              </p>
            </div>
          </div>

          {/* Technical Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Technical Settings</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="resolution" className="block text-sm font-medium text-gray-700">
                  Resolution
                </label>
                <select
                  name="resolution"
                  id="resolution"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.resolution}
                  onChange={handleChange}
                >
                  <option value="640x480">640x480 (VGA)</option>
                  <option value="1280x720">1280x720 (HD)</option>
                  <option value="1920x1080">1920x1080 (Full HD)</option>
                  <option value="3840x2160">3840x2160 (4K)</option>
                </select>
              </div>

              <div>
                <label htmlFor="frameRate" className="block text-sm font-medium text-gray-700">
                  Frame Rate (fps)
                </label>
                <input
                  type="number"
                  name="frameRate"
                  id="frameRate"
                  min="1"
                  max="60"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.frameRate}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Detection Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">AI Detection Settings</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Enabled Detection Types
              </label>
              <div className="space-y-2">
                {Object.entries(ALERT_TYPES).map(([key, value]) => (
                  <div key={value} className="flex items-center">
                    <input
                      type="checkbox"
                      id={value}
                      checked={formData.enabledDetections.includes(value)}
                      onChange={(e) => handleDetectionChange(value, e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor={value} className="ml-2 block text-sm text-gray-900">
                      {key.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label htmlFor="alertThresholds.confidenceLevel" className="block text-sm font-medium text-gray-700">
                  Confidence Threshold
                </label>
                <input
                  type="number"
                  name="alertThresholds.confidenceLevel"
                  step="0.1"
                  min="0.1"
                  max="1.0"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.alertThresholds.confidenceLevel}
                  onChange={handleChange}
                />
                <p className="mt-1 text-xs text-gray-500">0.1 - 1.0 (higher = more accurate)</p>
              </div>

              <div>
                <label htmlFor="alertThresholds.peopleCountThreshold" className="block text-sm font-medium text-gray-700">
                  People Count Alert
                </label>
                <input
                  type="number"
                  name="alertThresholds.peopleCountThreshold"
                  min="1"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.alertThresholds.peopleCountThreshold}
                  onChange={handleChange}
                />
                <p className="mt-1 text-xs text-gray-500">Alert when count exceeds this number</p>
              </div>

              <div>
                <label htmlFor="alertThresholds.motionSensitivity" className="block text-sm font-medium text-gray-700">
                  Motion Sensitivity
                </label>
                <select
                  name="alertThresholds.motionSensitivity"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.alertThresholds.motionSensitivity}
                  onChange={handleChange}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding Camera...
                </div>
              ) : (
                'Add Camera'
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
