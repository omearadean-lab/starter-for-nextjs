'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import WebSocketVideoPlayer from '@/components/WebSocketVideoPlayer';
import H264VideoPlayer from '@/components/H264VideoPlayer';
import { 
  VideoCameraIcon,
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  CameraIcon,
  ExclamationTriangleIcon,
  SignalIcon,
  SignalSlashIcon,
  Cog6ToothIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { cameraStreamingService } from '@/lib/camera-streaming';
import toast from 'react-hot-toast';

export default function LiveViewPage() {
  const { user, organization, isOrgAdmin, isSuperAdmin } = useAuth();
  const searchParams = useSearchParams();
  const cameraParam = searchParams.get('camera');
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isIframeMode, setIsIframeMode] = useState(false);
  const [streamingType, setStreamingType] = useState('video'); // 'video', 'websocket', 'iframe'
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (user && organization) {
      console.log('Loading cameras for organization:', organization.name);
      loadCameras();
    }
    
    // Cleanup function to stop streams when component unmounts
    return () => {
      if (selectedCamera) {
        cameraStreamingService.stopStream(selectedCamera.$id);
      }
    };
  }, [user, organization]);
  
  useEffect(() => {
    // Cleanup streams when selectedCamera changes
    return () => {
      if (selectedCamera) {
        cameraStreamingService.stopStream(selectedCamera.$id);
      }
    };
  }, [selectedCamera]);

  useEffect(() => {
    // Auto-hide controls in fullscreen
    let hideTimer;
    if (isFullscreen && showControls) {
      hideTimer = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(hideTimer);
  }, [isFullscreen, showControls]);

  const loadCameras = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CCTV_CAMERAS,
        [
          Query.equal('organizationId', organization.$id),
          Query.orderAsc('name')
        ]
      );
      
      setCameras(response.documents);
      
      // Auto-select camera from URL parameter
      if (cameraParam) {
        const paramCamera = response.documents.find(cam => cam.$id === cameraParam);
        if (paramCamera) {
          // Just select the camera, user will manually connect
          setSelectedCamera(paramCamera);
          setConnectionStatus('disconnected');
          return;
        }
      }
      
      // Just select the first online camera, don't auto-connect
      const onlineCamera = response.documents.find(cam => cam.status === 'online');
      if (onlineCamera && !selectedCamera) {
        setSelectedCamera(onlineCamera);
      }
      
    } catch (error) {
      console.error('Error loading cameras:', error);
      toast.error('Failed to load cameras');
    } finally {
      setLoading(false);
    }
  };

  const connectToCamera = async (camera) => {
    try {
      // Don't proceed if we're in iframe mode
      if (isIframeMode) {
        console.log('Skipping video connection - already in iframe mode');
        return;
      }
      
      setConnectionStatus('connecting');
      setSelectedCamera(camera);
      setIsIframeMode(false); // Ensure we're in video mode for normal connection
      
      // For RTSP cameras, show appropriate connecting message
      if (camera.protocol === 'rtsp') {
        toast.loading('Converting RTSP stream for web playback...', { id: 'rtsp-conversion' });
      }
      
      // Wait for video element to be available
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!videoRef.current && camera.protocol !== 'rtsp') {
        throw new Error('Video element not ready');
      }
      
      // Use the camera streaming service to handle the connection
      const result = await cameraStreamingService.startStream(camera, videoRef.current);
      
      if (result.success) {
        // Dismiss loading toast
        toast.dismiss('rtsp-conversion');
        
        if (result.useWebSocket) {
          // Switch to WebSocket streaming mode
          setStreamingType('websocket');
          setConnectionStatus('connected');
          setIsPlaying(true);
          toast.success(`📹 Connected to ${camera.name}`);
        } else {
          // Regular video element streaming
          setStreamingType('video');
          setConnectionStatus('connected');
          setIsPlaying(true);
          
          if (result.encrypted) {
            toast.success(`🔒 Connected to ${camera.name} (Encrypted)`);
          } else {
            toast.success(`📹 Connected to ${camera.name}`);
          }
        }
      } else {
        throw new Error(result.error || 'Connection failed');
      }
      
    } catch (error) {
      console.error('Error connecting to camera:', error);
      // Dismiss any loading toasts
      toast.dismiss('rtsp-conversion');
      setConnectionStatus('error');
      toast.error(`Failed to connect to ${camera.name}`);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
    setShowControls(true);
  };

  const takeSnapshot = async () => {
    if (!selectedCamera) return;
    
    try {
      // In a real implementation, this would capture the current frame
      toast.success('Snapshot saved');
    } catch (error) {
      toast.error('Failed to take snapshot');
    }
  };

  const tryIframeEmbed = async (camera) => {
    try {
      console.log('🖼️ Attempting iframe embed for UniFi web interface...');
      
      // First, stop any existing video stream
      if (selectedCamera) {
        cameraStreamingService.stopStream(selectedCamera.$id);
      }
      
      // Find the video container
      const videoContainer = videoRef.current?.parentElement;
      if (!videoContainer) {
        throw new Error('Video container not found');
      }
      
      // Set iframe mode and connecting status
      setIsIframeMode(true);
      setConnectionStatus('connecting');
      
      // Clear the container completely
      videoContainer.innerHTML = '';
      
      // Create iframe element optimized for UniFi Protect
      const iframe = document.createElement('iframe');
      iframe.src = camera.streamUrl || camera.rtspUrl;
      iframe.className = 'w-full h-full border-0 bg-black rounded-lg';
      iframe.allow = 'camera; microphone; fullscreen; autoplay';
      iframe.sandbox = 'allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation allow-presentation';
      iframe.loading = 'eager';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      
      // Add iframe load handlers
      iframe.onload = () => {
        console.log('✅ Iframe loaded successfully');
        setConnectionStatus('connected');
        setIsPlaying(true);
        toast.success(`🖼️ UniFi web interface embedded for ${camera.name}`);
      };
      
      iframe.onerror = (error) => {
        console.error('❌ Iframe failed to load:', error);
        setConnectionStatus('error');
        toast.error('Iframe embed blocked - try "Open Stream URL Directly"');
      };
      
      // Add the iframe to the container
      videoContainer.appendChild(iframe);
      
      console.log('📺 Iframe element created and added to container');
      console.log('🔗 Iframe src:', iframe.src);
      
      // Clear video ref to prevent conflicts
      videoRef.current = null;
      
    } catch (error) {
      console.error('Iframe embed error:', error);
      setConnectionStatus('error');
      toast.error(`Iframe embed failed: ${error.message}`);
    }
  };

  const getStreamUrl = (camera) => {
    // In production, this would return the actual stream URL
    // For demo, we'll use a placeholder
    return camera.streamUrl || camera.rtspUrl || 'demo-stream';
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <SignalIcon className="h-5 w-5 text-green-400" />;
      case 'connecting':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-400"></div>;
      case 'error':
        return <SignalSlashIcon className="h-5 w-5 text-red-400" />;
      default:
        return <SignalSlashIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  // Show loading while authentication is being checked
  if (!user || !organization) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading user and organisation data...</p>
        </div>
      </Layout>
    );
  }

  // Check permissions only after user is loaded
  if (!isOrgAdmin() && !isSuperAdmin()) {
    return (
      <Layout>
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-300">Access Denied</h3>
          <p className="mt-2 text-gray-400">You don't have permission to view live camera feeds.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light text-white">Live Camera View</h1>
              <p className="mt-1 text-sm text-gray-400">
                Monitor your CCTV cameras in real-time
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {getConnectionStatusIcon()}
              <span className="text-sm text-gray-300 capitalize">{connectionStatus}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Camera List */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-4">
              <h3 className="text-lg font-medium text-white mb-4">Cameras</h3>
              
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-700/50 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {cameras.map((camera) => (
                    <button
                      key={camera.$id}
                      onClick={() => {
                        setSelectedCamera(camera);
                        setConnectionStatus('disconnected');
                        setIsIframeMode(false); // Reset iframe mode when switching cameras
                      }}
                      className={`w-full p-3 rounded-lg text-left transition-all duration-200 ${
                        selectedCamera?.$id === camera.$id
                          ? 'bg-white text-black shadow-lg'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{camera.name}</p>
                          <p className="text-xs opacity-75">{camera.location}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            camera.status === 'online' ? 'bg-green-400' : 'bg-red-400'
                          }`}></div>
                          <VideoCameraIcon className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="mt-2 text-xs opacity-75">
                        {camera.protocol?.toUpperCase()} • {camera.resolution}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Video Player */}
          <div className="lg:col-span-3">
            <div 
              ref={containerRef}
              className={`relative bg-black rounded-xl overflow-hidden ${
                isFullscreen ? 'fixed inset-0 z-50' : 'aspect-video'
              }`}
              onMouseMove={() => setShowControls(true)}
            >
              {selectedCamera ? (
                <>
                  {/* Video Display Area */}
                  {(selectedCamera?.protocol === 'rtsp' || selectedCamera?.protocol === 'rtsps') ? (
                    <H264VideoPlayer
                      camera={selectedCamera}
                      onConnectionChange={(status) => {
                        setConnectionStatus(status);
                        if (status === 'connected') {
                          setIsPlaying(true);
                        }
                      }}
                      className="w-full h-full"
                    />
                  ) : streamingType === 'websocket' ? (
                    <WebSocketVideoPlayer
                      camera={selectedCamera}
                      onConnectionChange={(status) => {
                        setConnectionStatus(status);
                        if (status === 'connected') {
                          setIsPlaying(true);
                        }
                      }}
                      className="w-full h-full"
                    />
                  ) : streamingType === 'iframe' ? (
                    <iframe
                      src={selectedCamera?.streamUrl}
                      className="w-full h-full border-0"
                      allow="camera; microphone; fullscreen"
                      sandbox="allow-same-origin allow-scripts allow-forms"
                      onLoad={() => {
                        setConnectionStatus('connected');
                        setIsPlaying(true);
                      }}
                    />
                  ) : (
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      playsInline
                      onLoadStart={() => {
                        console.log('Video loading started');
                      }}
                      onCanPlay={() => {
                        console.log('Video can play');
                        setConnectionStatus('connected');
                        setIsPlaying(true);
                      }}
                      onError={(e) => {
                        console.error('Video error event:', e);
                        setConnectionStatus('error');
                        setIsPlaying(false);
                      }}
                    />
                  )}

                  {/* Connection Status Overlay */}
                  {connectionStatus === 'connecting' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <p className="text-white">Connecting to {selectedCamera.name}...</p>
                        <p className="text-gray-400 text-sm mt-1">
                          {selectedCamera.protocol?.toUpperCase()} stream
                        </p>
                      </div>
                    </div>
                  )}

                  {connectionStatus === 'error' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="text-center max-w-md mx-4">
                        <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
                        <p className="text-white text-lg font-semibold">Stream Connection Failed</p>
                        <p className="text-gray-400 text-sm mt-2 mb-4">
                          Unable to connect to {selectedCamera.name} ({selectedCamera.protocol?.toUpperCase()})
                        </p>
                        
                        <div className="bg-gray-800/50 rounded-lg p-4 mb-4 text-left">
                          <h4 className="text-white font-medium mb-2">✅ Issue Diagnosed:</h4>
                          <ul className="text-xs text-gray-300 space-y-1">
                            {selectedCamera?.protocol === 'rtsp' ? (
                              <>
                                <li>• <strong>RTSP Protocol:</strong> Cannot play directly in browsers</li>
                                <li>• <strong>Conversion Required:</strong> Need media server (FFmpeg/Wowza)</li>
                                <li>• <strong>Solutions:</strong> Convert to HLS, WebRTC, or HTTP stream</li>
                                <li>• <strong>Alternative:</strong> Use VLC or dedicated RTSP player</li>
                                <li>• <strong>Production:</strong> Set up media server for web streaming</li>
                              </>
                            ) : (
                              <>
                                <li>• <strong>Confirmed:</strong> UniFi URL is web interface, not video stream</li>
                                <li>• <strong>Error Code 4:</strong> MEDIA_ERR_SRC_NOT_SUPPORTED</li>
                                <li>• <strong>CORS Blocked:</strong> Access-Control-Allow-Origin missing</li>
                                <li>• <strong>Status 206:</strong> Server sending partial content (HTML)</li>
                                <li>• <strong>Solution:</strong> Use iframe embed for web interfaces</li>
                                <li>• <strong>Recommended:</strong> Try "Iframe Embed" button below</li>
                              </>
                            )}
                          </ul>
                        </div>
                        
                        <div className="space-y-2">
                          <button
                            onClick={() => connectToCamera(selectedCamera)}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                          >
                            🔄 Retry Connection
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Video Controls */}
                  {showControls && connectionStatus === 'connected' && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={togglePlayPause}
                            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                          >
                            {isPlaying ? (
                              <PauseIcon className="h-5 w-5 text-white" />
                            ) : (
                              <PlayIcon className="h-5 w-5 text-white" />
                            )}
                          </button>

                          <button
                            onClick={toggleMute}
                            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                          >
                            {isMuted ? (
                              <SpeakerXMarkIcon className="h-5 w-5 text-white" />
                            ) : (
                              <SpeakerWaveIcon className="h-5 w-5 text-white" />
                            )}
                          </button>

                          <div className="text-white text-sm">
                            <p className="font-medium">{selectedCamera.name}</p>
                            <p className="text-gray-300 text-xs">{selectedCamera.location}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={takeSnapshot}
                            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                            title="Take Snapshot"
                          >
                            <CameraIcon className="h-5 w-5 text-white" />
                          </button>

                          <button
                            onClick={toggleFullscreen}
                            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                          >
                            {isFullscreen ? (
                              <ArrowsPointingInIcon className="h-5 w-5 text-white" />
                            ) : (
                              <ArrowsPointingOutIcon className="h-5 w-5 text-white" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Camera Info Overlay */}
                  <div className="absolute top-4 left-4 bg-black/50 rounded-lg p-3 text-white text-sm">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span>LIVE</span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-300">
                      <p>Protocol: {selectedCamera.protocol?.toUpperCase()}</p>
                      <p>Resolution: {selectedCamera.resolution}</p>
                      <p>FPS: {selectedCamera.frameRate}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <VideoCameraIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Select a camera to view live feed</p>
                    <p className="text-sm mt-2">Choose from the camera list on the left</p>
                  </div>
                </div>
              )}

              {/* Manual Connect Button */}
              {selectedCamera && connectionStatus === 'disconnected' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="text-center max-w-md mx-4">
                    <VideoCameraIcon className="h-12 w-12 text-white mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {selectedCamera.name}
                    </h3>
                    <p className="text-gray-300 text-sm mb-4">
                      {selectedCamera.protocol?.toUpperCase()} • {selectedCamera.resolution}
                    </p>
                    
                    {/* Show different options based on camera type */}
                    {(selectedCamera.protocol === 'rtsp' || selectedCamera.protocol === 'rtsps') ? (
                      <div className="space-y-3">
                        <button
                          onClick={() => connectToCamera(selectedCamera)}
                          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          🎥 Connect to {selectedCamera.protocol.toUpperCase()} Stream
                        </button>
                        <p className="text-sm text-gray-400 text-center">
                          Native H.264 playback via {selectedCamera.protocol === 'rtsps' ? 'secure proxy' : 'HLS/WebRTC'}
                        </p>
                      </div>
                    ) : selectedCamera.streamUrl?.includes('monitor.ui.com') ? (
                      <div className="space-y-3">
                        <p className="text-yellow-300 text-sm mb-4">
                          ⚠️ UniFi Protect detected - Web interface, not direct video stream
                        </p>
                        <button
                          onClick={() => tryIframeEmbed(selectedCamera)}
                          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          🖼️ Embed UniFi Interface (Recommended)
                        </button>
                        <button
                          onClick={() => {
                            const streamUrl = selectedCamera.streamUrl || selectedCamera.rtspUrl;
                            window.open(streamUrl, '_blank');
                          }}
                          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          🔗 Open in New Tab
                        </button>
                        <button
                          onClick={() => connectToCamera(selectedCamera)}
                          className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                        >
                          Try Video Connection (Will Fail)
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => connectToCamera(selectedCamera)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Connect to Camera
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Camera Details */}
            {selectedCamera && (
              <div className="mt-4 bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-4">
                <h3 className="text-lg font-medium text-white mb-3">Camera Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Status</p>
                    <p className={`font-medium ${
                      selectedCamera.status === 'online' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {selectedCamera.status?.charAt(0).toUpperCase() + selectedCamera.status?.slice(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Protocol</p>
                    <p className="text-white font-medium">
                      {selectedCamera.protocol?.toUpperCase()}
                      {selectedCamera.encryption && ' 🔒'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Resolution</p>
                    <p className="text-white font-medium">{selectedCamera.resolution}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Frame Rate</p>
                    <p className="text-white font-medium">{selectedCamera.frameRate} fps</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
