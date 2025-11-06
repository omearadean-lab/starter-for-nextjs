'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { 
  Cog6ToothIcon,
  BellIcon,
  ShieldCheckIcon,
  VideoCameraIcon,
  ClockIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { organizationService } from '@/lib/organizations';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, organization, isOrgAdmin, isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    // General Settings
    organizationName: organization?.name || '',
    description: organization?.description || '',
    contactEmail: organization?.contactEmail || '',
    contactPhone: organization?.contactPhone || '',
    address: organization?.address || '',
    
    // Alert Settings
    alertRetentionDays: 30,
    videoRetentionDays: 7,
    enableEmailAlerts: true,
    enableSMSAlerts: false,
    enablePushNotifications: true,
    alertSeverityThreshold: 'medium',
    
    // Security Settings
    sessionTimeout: 60,
    requireMFA: false,
    allowRemoteAccess: true,
    ipWhitelist: '',
    
    // Camera Settings
    defaultResolution: '1920x1080',
    defaultFrameRate: 30,
    motionSensitivity: 'medium',
    nightVisionEnabled: true,
    
    // Notification Settings
    emailNotifications: {
      criticalAlerts: true,
      systemUpdates: true,
      weeklyReports: true,
      maintenanceAlerts: true
    },
    
    // System Settings
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h'
  });

  useEffect(() => {
    if (organization?.settings) {
      try {
        const orgSettings = JSON.parse(organization.settings);
        setSettings(prev => ({ ...prev, ...orgSettings }));
      } catch (error) {
        console.error('Error parsing organization settings:', error);
      }
    }
  }, [organization]);

  const handleSave = async () => {
    if (!organization) return;
    
    setLoading(true);
    try {
      await organizationService.updateOrganization(organization.$id, {
        name: settings.organizationName,
        description: settings.description,
        contactEmail: settings.contactEmail,
        contactPhone: settings.contactPhone,
        address: settings.address,
        settings: JSON.stringify(settings)
      });
      
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section, key, value) => {
    if (section) {
      setSettings(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };

  const tabs = [
    { id: 'general', name: 'General', icon: Cog6ToothIcon },
    { id: 'alerts', name: 'Alerts', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'cameras', name: 'Cameras', icon: VideoCameraIcon },
    { id: 'notifications', name: 'Notifications', icon: EnvelopeIcon }
  ];

  if ((!organization && !isSuperAdmin()) || (!isOrgAdmin() && !isSuperAdmin())) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-light text-white">Access Denied</h1>
          <p className="mt-2 text-gray-400">You don't have permission to access settings.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light text-white">Organization Settings</h1>
              <p className="mt-1 text-sm text-gray-400">
                Manage your CCTV monitoring system configuration
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-3 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                  Saving...
                </div>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-4">
              <div className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-white text-black shadow-lg'
                          : 'text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {tab.name}
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
              {activeTab === 'general' && (
                <GeneralSettings settings={settings} onChange={handleInputChange} />
              )}
              {activeTab === 'alerts' && (
                <AlertSettings settings={settings} onChange={handleInputChange} />
              )}
              {activeTab === 'security' && (
                <SecuritySettings settings={settings} onChange={handleInputChange} />
              )}
              {activeTab === 'cameras' && (
                <CameraSettings settings={settings} onChange={handleInputChange} />
              )}
              {activeTab === 'notifications' && (
                <NotificationSettings settings={settings} onChange={handleInputChange} />
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function GeneralSettings({ settings, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Organization Information</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Organization Name
            </label>
            <input
              type="text"
              className="block w-full bg-white/10 border border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 text-white placeholder-gray-400"
              value={settings.organizationName}
              onChange={(e) => onChange(null, 'organizationName', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contact Email
            </label>
            <input
              type="email"
              className="block w-full bg-white/10 border border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 text-white placeholder-gray-400"
              value={settings.contactEmail}
              onChange={(e) => onChange(null, 'contactEmail', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contact Phone
            </label>
            <input
              type="tel"
              className="block w-full bg-white/10 border border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 text-white placeholder-gray-400"
              value={settings.contactPhone}
              onChange={(e) => onChange(null, 'contactPhone', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Timezone
            </label>
            <select
              className="block w-full bg-white/10 border border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 text-white"
              value={settings.timezone}
              onChange={(e) => onChange(null, 'timezone', e.target.value)}
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            rows={3}
            className="block w-full bg-white/10 border border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 text-white placeholder-gray-400"
            value={settings.description}
            onChange={(e) => onChange(null, 'description', e.target.value)}
          />
        </div>
        
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Address
          </label>
          <textarea
            rows={2}
            className="block w-full bg-white/10 border border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 text-white placeholder-gray-400"
            value={settings.address}
            onChange={(e) => onChange(null, 'address', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

function AlertSettings({ settings, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Alert Configuration</h3>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Alert Retention (days)
            </label>
            <input
              type="number"
              min="1"
              max="365"
              className="block w-full bg-white/10 border border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 text-white placeholder-gray-400"
              value={settings.alertRetentionDays}
              onChange={(e) => onChange(null, 'alertRetentionDays', parseInt(e.target.value))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Video Retention (days)
            </label>
            <input
              type="number"
              min="1"
              max="90"
              className="block w-full bg-white/10 border border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 text-white placeholder-gray-400"
              value={settings.videoRetentionDays}
              onChange={(e) => onChange(null, 'videoRetentionDays', parseInt(e.target.value))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Alert Severity Threshold
            </label>
            <select
              className="block w-full bg-white/10 border border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 text-white"
              value={settings.alertSeverityThreshold}
              onChange={(e) => onChange(null, 'alertSeverityThreshold', e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical Only</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6 space-y-4">
          <h4 className="text-md font-medium text-white">Alert Channels</h4>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-white/10"
                checked={settings.enableEmailAlerts}
                onChange={(e) => onChange(null, 'enableEmailAlerts', e.target.checked)}
              />
              <label className="ml-2 block text-sm text-gray-300">
                Email Alerts
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-white/10"
                checked={settings.enableSMSAlerts}
                onChange={(e) => onChange(null, 'enableSMSAlerts', e.target.checked)}
              />
              <label className="ml-2 block text-sm text-gray-300">
                SMS Alerts
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-white/10"
                checked={settings.enablePushNotifications}
                onChange={(e) => onChange(null, 'enablePushNotifications', e.target.checked)}
              />
              <label className="ml-2 block text-sm text-gray-300">
                Push Notifications
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SecuritySettings({ settings, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Security Configuration</h3>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              min="5"
              max="480"
              className="block w-full bg-white/10 border border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 text-white placeholder-gray-400"
              value={settings.sessionTimeout}
              onChange={(e) => onChange(null, 'sessionTimeout', parseInt(e.target.value))}
            />
          </div>
        </div>
        
        <div className="mt-6 space-y-4">
          <h4 className="text-md font-medium text-white">Security Options</h4>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-white/10"
                checked={settings.requireMFA}
                onChange={(e) => onChange(null, 'requireMFA', e.target.checked)}
              />
              <label className="ml-2 block text-sm text-gray-300">
                Require Multi-Factor Authentication
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-white/10"
                checked={settings.allowRemoteAccess}
                onChange={(e) => onChange(null, 'allowRemoteAccess', e.target.checked)}
              />
              <label className="ml-2 block text-sm text-gray-300">
                Allow Remote Access
              </label>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            IP Whitelist (one per line)
          </label>
          <textarea
            rows={4}
            placeholder="192.168.1.0/24&#10;10.0.0.1&#10;203.0.113.0/24"
            className="block w-full bg-white/10 border border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 text-white placeholder-gray-400"
            value={settings.ipWhitelist}
            onChange={(e) => onChange(null, 'ipWhitelist', e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-400">
            Leave empty to allow access from any IP address
          </p>
        </div>
      </div>
    </div>
  );
}

function CameraSettings({ settings, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Default Camera Settings</h3>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Default Resolution
            </label>
            <select
              className="block w-full bg-white/10 border border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 text-white"
              value={settings.defaultResolution}
              onChange={(e) => onChange(null, 'defaultResolution', e.target.value)}
            >
              <option value="640x480">640x480 (VGA)</option>
              <option value="1280x720">1280x720 (HD)</option>
              <option value="1920x1080">1920x1080 (Full HD)</option>
              <option value="3840x2160">3840x2160 (4K)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Default Frame Rate (fps)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              className="block w-full bg-white/10 border border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 text-white placeholder-gray-400"
              value={settings.defaultFrameRate}
              onChange={(e) => onChange(null, 'defaultFrameRate', parseInt(e.target.value))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Motion Sensitivity
            </label>
            <select
              className="block w-full bg-white/10 border border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 text-white"
              value={settings.motionSensitivity}
              onChange={(e) => onChange(null, 'motionSensitivity', e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-white/10"
              checked={settings.nightVisionEnabled}
              onChange={(e) => onChange(null, 'nightVisionEnabled', e.target.checked)}
            />
            <label className="ml-2 block text-sm text-gray-300">
              Enable Night Vision by Default
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationSettings({ settings, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Email Notifications</h3>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-white/10"
              checked={settings.emailNotifications.criticalAlerts}
              onChange={(e) => onChange('emailNotifications', 'criticalAlerts', e.target.checked)}
            />
            <label className="ml-2 block text-sm text-gray-300">
              Critical Alerts
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-white/10"
              checked={settings.emailNotifications.systemUpdates}
              onChange={(e) => onChange('emailNotifications', 'systemUpdates', e.target.checked)}
            />
            <label className="ml-2 block text-sm text-gray-300">
              System Updates
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-white/10"
              checked={settings.emailNotifications.weeklyReports}
              onChange={(e) => onChange('emailNotifications', 'weeklyReports', e.target.checked)}
            />
            <label className="ml-2 block text-sm text-gray-300">
              Weekly Reports
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-white/10"
              checked={settings.emailNotifications.maintenanceAlerts}
              onChange={(e) => onChange('emailNotifications', 'maintenanceAlerts', e.target.checked)}
            />
            <label className="ml-2 block text-sm text-gray-300">
              Maintenance Alerts
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
