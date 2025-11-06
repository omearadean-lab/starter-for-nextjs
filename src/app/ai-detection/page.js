'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { 
  CogIcon,
  FaceSmileIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  UserIcon,
  VideoCameraIcon,
  EyeIcon,
  FireIcon,
  BoltIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { aiDetectionService, DETECTION_TYPES, SEVERITY_LEVELS } from '@/lib/aiDetection';
import toast from 'react-hot-toast';

export default function AIDetectionPage() {
  const { user, organization, isOrgAdmin, isSuperAdmin } = useAuth();
  const [detectionConfig, setDetectionConfig] = useState({});
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (organization) {
      loadDetectionData();
    }
  }, [organization]);

  const loadDetectionData = async () => {
    try {
      setLoading(true);
      
      // Load detection configuration
      const config = {};
      Object.values(DETECTION_TYPES).forEach(type => {
        config[type] = aiDetectionService.getDetectionConfig(type);
      });
      setDetectionConfig(config);

      // Load statistics
      const stats = await aiDetectionService.getDetectionStatistics(organization.$id);
      setStatistics(stats);

    } catch (error) {
      console.error('Error loading detection data:', error);
      toast.error('Failed to load AI detection settings');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigUpdate = async (detectionType, field, value) => {
    try {
      const updates = { [field]: value };
      await aiDetectionService.updateDetectionConfig(detectionType, updates);
      
      setDetectionConfig(prev => ({
        ...prev,
        [detectionType]: {
          ...prev[detectionType],
          ...updates
        }
      }));

      toast.success(`${detectionConfig[detectionType]?.name} settings updated`);
    } catch (error) {
      console.error('Error updating detection config:', error);
      toast.error('Failed to update detection settings');
    }
  };

  const getDetectionIcon = (detectionType) => {
    const iconMap = {
      [DETECTION_TYPES.FACE]: FaceSmileIcon,
      [DETECTION_TYPES.FALL]: ExclamationTriangleIcon,
      [DETECTION_TYPES.THEFT]: ShieldExclamationIcon,
      [DETECTION_TYPES.FIRE]: FireIcon,
      [DETECTION_TYPES.PERSON]: UserIcon,
      [DETECTION_TYPES.VEHICLE]: VideoCameraIcon,
      [DETECTION_TYPES.INTRUSION]: ShieldExclamationIcon
    };
    return iconMap[detectionType] || EyeIcon;
  };

  const getSeverityColour = (severity) => {
    const colourMap = {
      [SEVERITY_LEVELS.LOW]: 'text-green-400 bg-green-400/10 border-green-400/20',
      [SEVERITY_LEVELS.MEDIUM]: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
      [SEVERITY_LEVELS.HIGH]: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
      [SEVERITY_LEVELS.CRITICAL]: 'text-red-400 bg-red-400/10 border-red-400/20'
    };
    return colourMap[severity] || 'text-gray-400 bg-gray-400/10 border-gray-400/20';
  };

  if (!isOrgAdmin() && !isSuperAdmin()) {
    return (
      <Layout>
        <div className="text-center py-12">
          <ShieldExclamationIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-300">Access Denied</h3>
          <p className="mt-2 text-gray-400">You don't have permission to access AI detection settings.</p>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'face', name: 'Face Detection', icon: FaceSmileIcon },
    { id: 'fall', name: 'Fall Detection', icon: ExclamationTriangleIcon },
    { id: 'theft', name: 'Theft Detection', icon: ShieldExclamationIcon },
    { id: 'fire', name: 'Fire Detection', icon: FireIcon },
    { id: 'general', name: 'General Settings', icon: AdjustmentsHorizontalIcon }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light text-white">AI Detection Settings</h1>
              <p className="mt-1 text-sm text-gray-400">
                Configure advanced AI detection capabilities for your CCTV system
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <BoltIcon className="h-5 w-5 text-yellow-400" />
              <span className="text-sm text-gray-300">AI Powered</span>
            </div>
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
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              ) : (
                <>
                  {activeTab === 'overview' && (
                    <OverviewTab statistics={statistics} detectionConfig={detectionConfig} />
                  )}
                  {activeTab === 'face' && (
                    <DetectionConfigTab 
                      detectionType={DETECTION_TYPES.FACE}
                      config={detectionConfig[DETECTION_TYPES.FACE]}
                      onUpdate={handleConfigUpdate}
                    />
                  )}
                  {activeTab === 'fall' && (
                    <DetectionConfigTab 
                      detectionType={DETECTION_TYPES.FALL}
                      config={detectionConfig[DETECTION_TYPES.FALL]}
                      onUpdate={handleConfigUpdate}
                    />
                  )}
                  {activeTab === 'theft' && (
                    <DetectionConfigTab 
                      detectionType={DETECTION_TYPES.THEFT}
                      config={detectionConfig[DETECTION_TYPES.THEFT]}
                      onUpdate={handleConfigUpdate}
                    />
                  )}
                  {activeTab === 'fire' && (
                    <DetectionConfigTab 
                      detectionType={DETECTION_TYPES.FIRE}
                      config={detectionConfig[DETECTION_TYPES.FIRE]}
                      onUpdate={handleConfigUpdate}
                    />
                  )}
                  {activeTab === 'general' && (
                    <GeneralSettingsTab 
                      detectionConfig={detectionConfig}
                      onUpdate={handleConfigUpdate}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function OverviewTab({ statistics, detectionConfig }) {
  const criticalDetections = [DETECTION_TYPES.FALL, DETECTION_TYPES.FIRE, DETECTION_TYPES.THEFT];
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Detection Overview</h3>
        
        {/* Critical Detection Types */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {criticalDetections.map(type => {
            const config = detectionConfig[type];
            const stats = statistics[type] || { total: 0, pending: 0 };
            const Icon = config ? (type === DETECTION_TYPES.FIRE ? FireIcon : 
                                 type === DETECTION_TYPES.FALL ? ExclamationTriangleIcon : 
                                 ShieldExclamationIcon) : EyeIcon;
            
            return (
              <div key={type} className="bg-white/5 border border-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className="h-6 w-6 text-red-400" />
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    config?.enabled ? 'bg-green-400/10 text-green-400' : 'bg-gray-400/10 text-gray-400'
                  }`}>
                    {config?.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <h4 className="text-sm font-medium text-white">{config?.name}</h4>
                <p className="text-xs text-gray-400 mt-1">{stats.total} detections today</p>
                {stats.pending > 0 && (
                  <p className="text-xs text-orange-400 mt-1">{stats.pending} pending review</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Information Panel */}
        <div className="bg-blue-400/10 border border-blue-400/20 rounded-lg p-4">
          <div className="flex items-start">
            <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-400">AI Detection Capabilities</h4>
              <p className="text-sm text-gray-300 mt-1">
                Your CCTV system is equipped with advanced AI detection for critical safety and security scenarios:
              </p>
              <ul className="text-sm text-gray-300 mt-2 space-y-1">
                <li>• <strong>Fall Detection:</strong> Immediate alerts for elderly care and workplace safety</li>
                <li>• <strong>Fire Detection:</strong> Early fire detection through visual analysis</li>
                <li>• <strong>Theft Detection:</strong> Suspicious behaviour pattern recognition</li>
                <li>• <strong>Face Recognition:</strong> Identity verification and access control</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetectionConfigTab({ detectionType, config, onUpdate }) {
  if (!config) return <div>Loading configuration...</div>;

  const Icon = config.icon === 'FireIcon' ? FireIcon : 
               config.icon === 'FaceSmileIcon' ? FaceSmileIcon :
               config.icon === 'ExclamationTriangleIcon' ? ExclamationTriangleIcon :
               ShieldExclamationIcon;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <Icon className="h-8 w-8 text-white" />
        <div>
          <h3 className="text-lg font-medium text-white">{config.name}</h3>
          <p className="text-sm text-gray-400">{config.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Enable/Disable */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Detection Status
          </label>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => onUpdate(detectionType, 'enabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-white/10"
            />
            <label className="ml-2 block text-sm text-gray-300">
              Enable {config.name}
            </label>
          </div>
        </div>

        {/* Confidence Threshold */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Confidence Threshold: {Math.round(config.confidence_threshold * 100)}%
          </label>
          <input
            type="range"
            min="0.5"
            max="0.99"
            step="0.01"
            value={config.confidence_threshold}
            onChange={(e) => onUpdate(detectionType, 'confidence_threshold', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>50%</span>
            <span>99%</span>
          </div>
        </div>

        {/* Notifications */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Notifications
          </label>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={config.notification_enabled}
              onChange={(e) => onUpdate(detectionType, 'notification_enabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-white/10"
            />
            <label className="ml-2 block text-sm text-gray-300">
              Send notifications for this detection type
            </label>
          </div>
        </div>

        {/* Severity Level */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Severity Level
          </label>
          <select
            value={config.severity}
            onChange={(e) => onUpdate(detectionType, 'severity', e.target.value)}
            className="block w-full bg-white/10 border border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 text-white"
          >
            <option value={SEVERITY_LEVELS.LOW}>Low</option>
            <option value={SEVERITY_LEVELS.MEDIUM}>Medium</option>
            <option value={SEVERITY_LEVELS.HIGH}>High</option>
            <option value={SEVERITY_LEVELS.CRITICAL}>Critical</option>
          </select>
        </div>
      </div>

      {/* Detection-specific settings */}
      {detectionType === DETECTION_TYPES.FALL && (
        <div className="bg-orange-400/10 border border-orange-400/20 rounded-lg p-4">
          <h4 className="text-sm font-medium text-orange-400 mb-2">Fall Detection Settings</h4>
          <p className="text-sm text-gray-300">
            Fall detection is critical for elderly care and workplace safety. When enabled, the system will:
          </p>
          <ul className="text-sm text-gray-300 mt-2 space-y-1">
            <li>• Monitor for sudden vertical movement patterns</li>
            <li>• Detect person remaining on ground for extended periods</li>
            <li>• Send immediate alerts to designated contacts</li>
            <li>• Create high-priority incidents requiring urgent response</li>
          </ul>
        </div>
      )}

      {detectionType === DETECTION_TYPES.FIRE && (
        <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-400 mb-2">Fire Detection Settings</h4>
          <p className="text-sm text-gray-300">
            Fire detection provides early warning through visual analysis. The system monitors for:
          </p>
          <ul className="text-sm text-gray-300 mt-2 space-y-1">
            <li>• Flame patterns and colours</li>
            <li>• Smoke detection and movement</li>
            <li>• Heat signature anomalies</li>
            <li>• Rapid environmental changes</li>
          </ul>
        </div>
      )}
    </div>
  );
}

function GeneralSettingsTab({ detectionConfig, onUpdate }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">General AI Detection Settings</h3>
        
        <div className="space-y-4">
          <div className="bg-white/5 border border-gray-700/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-white mb-2">Detection Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(detectionConfig).map(([type, config]) => (
                <div key={type} className="text-center">
                  <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                    config?.enabled ? 'bg-green-400' : 'bg-gray-400'
                  }`}></div>
                  <p className="text-xs text-gray-300">{config?.name}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-400/10 border border-blue-400/20 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-400 mb-2">System Performance</h4>
            <p className="text-sm text-gray-300">
              AI detection performance depends on camera quality, lighting conditions, and network connectivity. 
              For optimal results, ensure cameras have clear views and adequate lighting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
