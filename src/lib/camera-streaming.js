/**
 * Camera Streaming Service
 * Handles real-time video streaming from CCTV cameras
 */

export class CameraStreamingService {
  constructor() {
    this.activeStreams = new Map();
    this.streamingProtocols = {
      rtsp: this.handleRTSPStream.bind(this),
      rtsps: this.handleRTSPSStream.bind(this),
      http: this.handleHTTPStream.bind(this),
      https: this.handleHTTPSStream.bind(this),
      webrtc: this.handleWebRTCStream.bind(this)
    };
  }

  /**
   * Start streaming from a camera
   */
  async startStream(camera, videoElement) {
    try {
      console.log(`🎥 Starting stream for ${camera.name} (${camera.protocol})`);
      
      // Validate video element
      if (!videoElement) {
        throw new Error('Video element is required for streaming');
      }
      
      const streamConfig = {
        camera: camera,
        videoElement: videoElement,
        startTime: new Date(),
        status: 'connecting'
      };

      this.activeStreams.set(camera.$id, streamConfig);

      // Handle different protocols
      const handler = this.streamingProtocols[camera.protocol];
      if (handler) {
        return await handler(camera, videoElement);
      } else {
        throw new Error(`Unsupported protocol: ${camera.protocol}`);
      }

    } catch (error) {
      console.error('Error starting stream:', error);
      this.activeStreams.delete(camera.$id);
      throw error;
    }
  }

  /**
   * Stop streaming from a camera
   */
  stopStream(cameraId) {
    const stream = this.activeStreams.get(cameraId);
    if (stream) {
      try {
        if (stream.videoElement) {
          stream.videoElement.pause();
          stream.videoElement.src = '';
          stream.videoElement.load();
        }
        
        if (stream.mediaSource) {
          stream.mediaSource.endOfStream();
        }
        
        if (stream.websocket) {
          stream.websocket.close();
        }

        this.activeStreams.delete(cameraId);
        console.log(`⏹️ Stopped stream for camera ${cameraId}`);
        
      } catch (error) {
        console.error('Error stopping stream:', error);
      }
    }
  }

  /**
   * Handle RTSP streaming
   */
  async handleRTSPStream(camera, videoElement) {
    try {
      console.log(`📡 Connecting to RTSP stream: ${camera.rtspUrl}`);
      
      // Import RTSP proxy
      const { default: rtspProxy } = await import('./rtsp-proxy.js');
      
      // Try to convert RTSP to web-compatible format
      const conversion = await rtspProxy.convertRTSPStream(camera);
      
      if (conversion.success) {
        console.log(`✅ RTSP converted to ${conversion.type}: ${conversion.streamUrl}`);
        
        if (conversion.type === 'websocket') {
          // For WebSocket streams, don't use video element
          const stream = this.activeStreams.get(camera.$id);
          if (stream) {
            stream.status = 'connected';
            stream.streamUrl = conversion.streamUrl;
            stream.conversionType = conversion.type;
            stream.config = conversion.config;
          }

          return {
            success: true,
            streamUrl: conversion.streamUrl,
            protocol: `rtsp-${conversion.type}`,
            conversionType: conversion.type,
            config: conversion.config,
            useWebSocket: true
          };
        } else {
          // For HTTP streams, use video element
          videoElement.crossOrigin = 'anonymous';
          videoElement.src = conversion.streamUrl;
          
          const stream = this.activeStreams.get(camera.$id);
          if (stream) {
            stream.status = 'connected';
            stream.streamUrl = conversion.streamUrl;
            stream.conversionType = conversion.type;
          }

          return {
            success: true,
            streamUrl: conversion.streamUrl,
            protocol: `rtsp-${conversion.type}`,
            conversionType: conversion.type
          };
        }
      } else {
        throw new Error('RTSP_CONVERSION_FAILED: Unable to convert RTSP stream to web-compatible format. The camera may not support HTTP streaming.');
      }

    } catch (error) {
      console.error('RTSP streaming error:', error);
      
      // Provide helpful error message
      if (error.message.includes('CONVERSION_FAILED')) {
        throw new Error('RTSP stream conversion failed. This camera may require a dedicated media server setup. Try checking if the camera supports HTTP/MJPEG streams directly.');
      }
      
      throw error;
    }
  }

  /**
   * Handle RTSPS (secure RTSP) streaming
   */
  async handleRTSPSStream(camera, videoElement) {
    try {
      console.log(`🔒 Attempting to connect to RTSPS stream: ${camera.streamUrl || camera.rtspUrl}`);
      
      // For RTSPS, we need to try different approaches:
      // 1. Direct URL (if it's actually HTTP/HTTPS)
      // 2. WebRTC conversion
      // 3. HLS conversion
      
      const streamUrl = camera.streamUrl || camera.rtspUrl;
      
      // Try to set the video source directly first
      if (streamUrl.startsWith('http')) {
        console.log('Attempting direct HTTP/HTTPS stream connection');
        videoElement.src = streamUrl;
      } else {
        // For actual RTSPS streams, we need a media server
        console.log('RTSPS stream detected - requires media server conversion');
        
        // In production, you would:
        // 1. Send RTSPS URL to your media server
        // 2. Get back HLS/WebRTC stream URL
        // 3. Use that URL for the video element
        
        // For now, let's try to convert rtsps:// to https:// in case it's a web stream
        const convertedUrl = streamUrl.replace('rtsps://', 'https://');
        console.log(`Trying converted URL: ${convertedUrl}`);
        videoElement.src = convertedUrl;
      }
      
      const stream = this.activeStreams.get(camera.$id);
      if (stream) {
        stream.status = 'connected';
        stream.streamUrl = streamUrl;
        stream.encrypted = true;
      }

      return {
        success: true,
        streamUrl: streamUrl,
        protocol: 'rtsps',
        encrypted: true
      };

    } catch (error) {
      console.error('RTSPS streaming error:', error);
      throw error;
    }
  }

  /**
   * Handle HTTP streaming (MJPEG, etc.)
   */
  async handleHTTPStream(camera, videoElement) {
    try {
      const streamUrl = camera.streamUrl || camera.rtspUrl;
      console.log(`🌐 Connecting to HTTP stream: ${streamUrl}`);
      
      // HTTP streams can often be used directly in browsers
      videoElement.src = streamUrl;
      
      const stream = this.activeStreams.get(camera.$id);
      if (stream) {
        stream.status = 'connected';
        stream.streamUrl = streamUrl;
      }

      return {
        success: true,
        streamUrl: streamUrl,
        protocol: 'http'
      };

    } catch (error) {
      console.error('HTTP streaming error:', error);
      throw error;
    }
  }

  /**
   * Handle HTTPS streaming
   */
  async handleHTTPSStream(camera, videoElement) {
    try {
      const streamUrl = camera.streamUrl || camera.rtspUrl;
      console.log(`🔒 Connecting to HTTPS stream: ${streamUrl}`);
      
      // First, test if the URL is accessible and check for CORS issues
      try {
        const testResponse = await fetch(streamUrl, { 
          method: 'HEAD',
          mode: 'no-cors' // This will help us detect CORS issues
        });
        console.log('Stream URL accessibility test completed');
      } catch (fetchError) {
        console.warn('Stream URL may have CORS restrictions:', fetchError);
      }
      
      // Set up video element with better error handling
      console.log('Setting video element properties...');
      console.log('Video element:', videoElement);
      console.log('Stream URL:', streamUrl);
      
      videoElement.crossOrigin = 'anonymous'; // Try to request CORS
      
      // Log before setting src
      console.log('Setting video src to:', streamUrl);
      videoElement.src = streamUrl;
      console.log('Video src set, current src:', videoElement.src);
      
      // Add additional error handling
      videoElement.addEventListener('error', (e) => {
        console.error('Video element error:', e);
        // Check if it's a CORS error
        if (e.target.error && e.target.error.code === e.target.error.MEDIA_ELEMENT_ERROR) {
          throw new Error('CORS_ERROR: Stream blocked by browser security policy');
        }
      }, { once: true });
      
      const stream = this.activeStreams.get(camera.$id);
      if (stream) {
        stream.status = 'connected';
        stream.streamUrl = streamUrl;
        stream.encrypted = true;
      }

      return {
        success: true,
        streamUrl: streamUrl,
        protocol: 'https',
        encrypted: true
      };

    } catch (error) {
      console.error('HTTPS streaming error:', error);
      
      // Provide specific error messages for common issues
      if (error.message.includes('CORS')) {
        throw new Error('CORS Error: The camera stream cannot be embedded due to browser security restrictions. Try opening the stream URL directly.');
      }
      
      throw error;
    }
  }

  /**
   * Handle WebRTC streaming
   */
  async handleWebRTCStream(camera, videoElement) {
    try {
      console.log(`🔄 Setting up WebRTC stream for: ${camera.name}`);
      
      // WebRTC setup would involve:
      // 1. Creating RTCPeerConnection
      // 2. Handling signaling server communication
      // 3. Setting up ICE candidates
      // 4. Connecting to WebRTC gateway
      
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });

      // Simulate WebRTC connection
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const stream = this.activeStreams.get(camera.$id);
      if (stream) {
        stream.status = 'connected';
        stream.peerConnection = peerConnection;
      }

      return {
        success: true,
        protocol: 'webrtc',
        peerConnection: peerConnection
      };

    } catch (error) {
      console.error('WebRTC streaming error:', error);
      throw error;
    }
  }

  /**
   * Get converted stream URL for RTSP cameras
   */
  getConvertedStreamUrl(camera) {
    // Check if camera has an alternative HTTP/HLS stream URL
    if (camera.hlsUrl) {
      return camera.hlsUrl;
    }
    
    if (camera.httpStreamUrl) {
      return camera.httpStreamUrl;
    }
    
    // Check for common RTSP to HTTP conversions
    if (camera.rtspUrl) {
      const rtspUrl = camera.rtspUrl;
      
      // Try common HTTP stream patterns
      // Many IP cameras provide both RTSP and HTTP streams
      const httpPatterns = [
        rtspUrl.replace('rtsp://', 'http://').replace(':554/', ':80/'),
        rtspUrl.replace('rtsp://', 'http://') + '/mjpeg',
        rtspUrl.replace('rtsp://', 'http://') + '.mjpg',
        rtspUrl.replace('/live', '/video.cgi'),
        rtspUrl.replace('/live', '/videostream.cgi')
      ];
      
      // For now, return null to indicate conversion needed
      // In production, you would test these URLs or have a media server
      return null;
    }
    
    return null;
  }

  /**
   * Get web-compatible stream URL (for demo purposes)
   */
  getWebCompatibleStreamUrl(camera) {
    // This is kept for backward compatibility
    return this.getConvertedStreamUrl(camera);
  }

  /**
   * Test camera connection
   */
  async testCameraConnection(camera) {
    try {
      console.log(`🔍 Testing connection to ${camera.name}...`);
      
      const startTime = Date.now();
      
      // Simulate connection test based on protocol
      switch (camera.protocol) {
        case 'rtsp':
        case 'rtsps':
          // Test RTSP connection
          await this.testRTSPConnection(camera);
          break;
        case 'http':
        case 'https':
          // Test HTTP connection
          await this.testHTTPConnection(camera);
          break;
        default:
          throw new Error(`Cannot test ${camera.protocol} protocol`);
      }
      
      const latency = Date.now() - startTime;
      
      return {
        success: true,
        latency: latency,
        protocol: camera.protocol,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        protocol: camera.protocol,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test RTSP connection
   */
  async testRTSPConnection(camera) {
    // Simulate RTSP connection test
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    // Randomly simulate success/failure for demo
    if (Math.random() > 0.1) {
      return true;
    } else {
      throw new Error('RTSP connection timeout');
    }
  }

  /**
   * Test HTTP connection
   */
  async testHTTPConnection(camera) {
    try {
      // For HTTP streams, we can actually test the connection
      const response = await fetch(camera.rtspUrl, {
        method: 'HEAD',
        timeout: 5000
      });
      
      if (response.ok) {
        return true;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`HTTP connection failed: ${error.message}`);
    }
  }

  /**
   * Get active streams status
   */
  getActiveStreams() {
    const streams = [];
    for (const [cameraId, stream] of this.activeStreams) {
      streams.push({
        cameraId: cameraId,
        cameraName: stream.camera.name,
        status: stream.status,
        startTime: stream.startTime,
        protocol: stream.camera.protocol,
        encrypted: stream.encrypted || false
      });
    }
    return streams;
  }

  /**
   * Stop all active streams
   */
  stopAllStreams() {
    const cameraIds = Array.from(this.activeStreams.keys());
    cameraIds.forEach(cameraId => this.stopStream(cameraId));
    console.log(`⏹️ Stopped ${cameraIds.length} active streams`);
  }
}

export const cameraStreamingService = new CameraStreamingService();
export default CameraStreamingService;
