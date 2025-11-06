/**
 * WebSocket Video Player Component
 * Displays RTSP streams converted via WebSocket
 */

import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

export default function WebSocketVideoPlayer({ 
  camera, 
  onConnectionChange,
  className = "w-full h-full"
}) {
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const playerRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize canvas when component mounts
    if (canvasRef.current) {
      console.log('🎨 Initializing canvas...');
      console.log('Canvas dimensions:', canvasRef.current.width, 'x', canvasRef.current.height);
      
      // Ensure canvas has proper context
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        console.log('✅ Canvas context initialized');
        // Clear canvas - ready for video
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      } else {
        console.error('❌ Failed to get canvas context');
      }
    }

    if (camera && camera.rtspUrl) {
      connectToStream();
    }

    return () => {
      disconnect();
    };
  }, [camera]);

  const connectToStream = async () => {
    try {
      setConnectionStatus('connecting');
      setError(null);
      onConnectionChange?.('connecting');

      console.log(`🔌 Connecting to WebSocket stream for ${camera.name}`);

      // Wait a bit to ensure servers are ready
      await new Promise(resolve => setTimeout(resolve, 500));

      // Load JSMpeg library dynamically
      if (typeof window !== 'undefined' && !window.JSMpeg) {
        try {
          await loadJSMpeg();
        } catch (error) {
          console.error('❌ Failed to load JSMpeg library:', error);
          setError('Failed to load video player library. Please check your internet connection.');
          setConnectionStatus('error');
          onConnectionChange?.('error');
          return;
        }
      }

      // Test if WebSocket server is available first
      console.log('🧪 Testing WebSocket server availability...');
      
      // Create WebSocket connection to our RTSP server
      const wsUrl = `ws://localhost:9999/rtsp-stream?camera=${encodeURIComponent(camera.$id)}&rtsp=${encodeURIComponent(camera.rtspUrl)}`;
      
      console.log(`🔗 Connecting to: ${wsUrl}`);
      wsRef.current = new WebSocket(wsUrl);

      // Add connection timeout
      const connectionTimeout = setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
          console.log('⏰ WebSocket connection timeout');
          wsRef.current.close();
          setError('Connection timeout - Server may be busy');
          setConnectionStatus('error');
          onConnectionChange?.('error');
        }
      }, 10000); // 10 second timeout

      wsRef.current.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('✅ WebSocket connected');
      };

      wsRef.current.onmessage = (event) => {
        try {
          console.log('📨 WebSocket message received:', event.data);
          const data = JSON.parse(event.data);
          
          if (data.type === 'stream_ready') {
            console.log(`📹 Stream ready for camera ${data.cameraId}, port: ${data.wsPort}`);
            startVideoPlayer(data.wsPort || 9999);
          } else if (data.type === 'error') {
            console.error('❌ Server error:', data.message);
            throw new Error(data.message);
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
          setError(error.message);
          setConnectionStatus('error');
          onConnectionChange?.('error');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        console.error('WebSocket readyState:', wsRef.current?.readyState);
        console.error('WebSocket URL:', wsUrl);
        setError('WebSocket connection failed - RTSP server may not be running');
        setConnectionStatus('error');
        onConnectionChange?.('error');
      };

      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket disconnected');
        console.log('Close code:', event.code, 'Reason:', event.reason);
        
        if (event.code === 1006) {
          setError('WebSocket connection lost - Server may have stopped');
        }
        
        setConnectionStatus('disconnected');
        onConnectionChange?.('disconnected');
      };

    } catch (error) {
      console.error('Connection error:', error);
      setError(error.message);
      setConnectionStatus('error');
      onConnectionChange?.('error');
    }
  };

  const startVideoPlayer = (wsPort) => {
    try {
      if (!canvasRef.current) {
        throw new Error('Canvas element not available');
      }

      console.log(`🎬 Starting JSMpeg player on port ${wsPort}`);
      console.log(`🔗 Video stream URL: ws://localhost:${wsPort}`);

      // Create JSMpeg player with enhanced debugging
      playerRef.current = new window.JSMpeg.Player(`ws://localhost:${wsPort}`, {
        canvas: canvasRef.current,
        autoplay: true,
        audio: false, // Disable audio for now
        videoBufferSize: 1024 * 1024, // 1MB buffer
        audioBufferSize: 128 * 1024,  // 128KB buffer
        preserveDrawingBuffer: true,
        progressive: true,
        throttled: false,
        chunkSize: 1024,
        forceGL: false, // Force Canvas 2D rendering instead of WebGL
        disableGl: true, // Disable WebGL completely
        onSourceEstablished: () => {
          console.log('📡 JSMpeg source connection established');
        },
        onSourceCompleted: () => {
          console.log('📡 JSMpeg source completed');
        },
        onPlay: () => {
          console.log('🎥 Video playback started');
          console.log('📊 Canvas size:', canvasRef.current.width, 'x', canvasRef.current.height);
          setConnectionStatus('connected');
          onConnectionChange?.('connected');
          toast.success(`Connected to ${camera.name} via WebSocket`);
        },
        onStalled: () => {
          console.warn('⚠️ Video playback stalled');
        },
        onError: (error) => {
          console.error('❌ JSMpeg player error:', error);
          setError('Video playback error');
          setConnectionStatus('error');
          onConnectionChange?.('error');
        }
      });

      // Add additional debugging
      console.log('✅ JSMpeg player created');
      console.log('🎯 Player object:', playerRef.current);
      console.log('🎨 Renderer type:', playerRef.current.renderer?.constructor?.name || 'Unknown');
      console.log('🖼️ Using WebGL:', !!playerRef.current.renderer?.gl);

      // Check if video starts playing after a delay
      setTimeout(() => {
        if (playerRef.current && canvasRef.current) {
          console.log('📊 Player status after 3s:');
          console.log('  - Is playing:', playerRef.current.isPlaying);
          console.log('  - Has source:', !!playerRef.current.source);
          console.log('  - Canvas width:', canvasRef.current.width);
          console.log('  - Canvas height:', canvasRef.current.height);
          
          const ctx = canvasRef.current.getContext('2d');
          console.log('  - Canvas context:', !!ctx);
          
          if (ctx) {
            console.log('  - Canvas context type:', ctx.constructor.name);
            console.log('  - Canvas ready for video rendering');
          }
        }
      }, 3000);

    } catch (error) {
      console.error('Player start error:', error);
      setError(error.message);
      setConnectionStatus('error');
      onConnectionChange?.('error');
    }
  };

  const loadJSMpeg = () => {
    return new Promise((resolve, reject) => {
      if (window.JSMpeg) {
        resolve();
        return;
      }

      // Try multiple CDN sources for JSMpeg
      const cdnSources = [
        'https://unpkg.com/jsmpeg@0.2.0/jsmpeg.min.js',
        'https://cdn.jsdelivr.net/npm/jsmpeg@0.2.0/jsmpeg.min.js', 
        'https://raw.githubusercontent.com/phoboslab/jsmpeg/master/jsmpeg.min.js',
        '/jsmpeg.min.js' // Local fallback
      ];

      let currentIndex = 0;

      const tryLoadScript = () => {
        if (currentIndex >= cdnSources.length) {
          reject(new Error('Failed to load JSMpeg library from all CDN sources'));
          return;
        }

        const script = document.createElement('script');
        script.src = cdnSources[currentIndex];
        
        script.onload = () => {
          console.log(`✅ JSMpeg library loaded from: ${cdnSources[currentIndex]}`);
          resolve();
        };
        
        script.onerror = () => {
          console.warn(`❌ Failed to load JSMpeg from: ${cdnSources[currentIndex]}`);
          currentIndex++;
          // Remove failed script
          document.head.removeChild(script);
          // Try next CDN
          setTimeout(tryLoadScript, 100);
        };
        
        document.head.appendChild(script);
      };

      tryLoadScript();
    });
  };

  const disconnect = () => {
    // Stop video player
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
        playerRef.current = null;
        console.log('⏹️ Video player stopped');
      } catch (error) {
        console.error('Error stopping player:', error);
      }
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionStatus('disconnected');
    onConnectionChange?.('disconnected');
  };

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="w-full h-full bg-black"
        style={{ 
          display: connectionStatus === 'connected' ? 'block' : 'none',
          objectFit: 'contain'
        }}
      />
      
      {/* Connection Status Overlay */}
      {connectionStatus !== 'connected' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-center text-white">
            {connectionStatus === 'connecting' && (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>Connecting to WebSocket stream...</p>
                <p className="text-sm text-gray-400 mt-2">Converting RTSP to WebSocket</p>
              </>
            )}
            
            {connectionStatus === 'error' && (
              <>
                <div className="text-red-400 mb-4">⚠️</div>
                <p className="text-red-400">Connection Failed</p>
                <p className="text-sm text-gray-400 mt-2">{error}</p>
                <button
                  onClick={connectToStream}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retry Connection
                </button>
              </>
            )}
            
            {connectionStatus === 'disconnected' && (
              <>
                <div className="text-gray-400 mb-4">📹</div>
                <p>Ready to Connect</p>
                <button
                  onClick={connectToStream}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Connect to Stream
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
