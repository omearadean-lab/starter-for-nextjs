/**
 * RTSP to Web Stream Proxy
 * Converts RTSP streams to web-compatible formats
 */

class RTSPProxy {
  constructor() {
    this.activeStreams = new Map();
  }

  /**
   * Convert RTSP stream to web-compatible format
   */
  async convertRTSPStream(camera) {
    try {
      console.log(`🔄 Converting RTSP stream: ${camera.rtspUrl}`);
      
      // For RTSP cameras, go straight to WebSocket conversion
      // Skip HTTP testing since we know it's RTSP protocol
      console.log('📡 RTSP protocol detected - using WebSocket conversion');
      
      const websocketStream = await this.createWebSocketProxy(camera);
      if (websocketStream) {
        return {
          success: true,
          streamUrl: websocketStream.wsUrl,
          type: 'websocket',
          config: websocketStream
        };
      }

      throw new Error('WebSocket conversion failed - RTSP server may not be running');

    } catch (error) {
      console.error('RTSP conversion error:', error);
      throw error;
    }
  }

  /**
   * Try common HTTP stream alternatives
   */
  async tryHTTPAlternatives(camera) {
    const rtspUrl = camera.rtspUrl;
    const urlParts = new URL(rtspUrl.replace('rtsp://', 'http://'));
    
    // Common HTTP stream patterns for IP cameras
    const alternatives = [
      // Standard HTTP stream
      `http://${urlParts.host.replace(':9000', ':80')}/live`,
      `http://${urlParts.host.replace(':9000', ':80')}/mjpeg`,
      `http://${urlParts.host.replace(':9000', ':80')}/video.cgi`,
      `http://${urlParts.host.replace(':9000', ':80')}/videostream.cgi`,
      `http://${urlParts.host.replace(':9000', ':80')}/axis-cgi/mjpg/video.cgi`,
      
      // Try same port with HTTP
      `http://${urlParts.host}/live`,
      `http://${urlParts.host}/mjpeg`,
      `http://${urlParts.host}/video.mjpg`,
      
      // Common camera manufacturer patterns
      `http://${urlParts.hostname}:8080/video`,
      `http://${urlParts.hostname}:8081/mjpeg`,
      `http://${urlParts.hostname}/cgi-bin/mjpg/video.cgi`
    ];

    console.log(`🔍 Testing ${alternatives.length} HTTP alternatives...`);

    // Test each alternative
    for (const url of alternatives) {
      try {
        console.log(`Testing: ${url}`);
        
        const response = await fetch('/api/test-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        
        const result = await response.json();
        
        if (result.success && result.result.accessible) {
          console.log(`✅ Found working HTTP stream: ${url}`);
          console.log(`Content-Type: ${result.result.contentType}`);
          return url;
        }
        
      } catch (error) {
        console.log(`❌ Failed to test ${url}: ${error.message}`);
      }
    }

    console.log('❌ No working HTTP alternatives found');
    return null;
  }

  /**
   * Create WebSocket proxy for RTSP stream
   */
  async createWebSocketProxy(camera) {
    try {
      console.log('🌐 Creating WebSocket proxy...');
      
      // Check if WebSocket server is running
      const serverUrl = 'ws://localhost:9999/rtsp-stream';
      
      // Test WebSocket server availability with proper URL
      try {
        const testWs = new WebSocket(`ws://localhost:9999/rtsp-stream?test=true`);
        
        return new Promise((resolve) => {
          const timeout = setTimeout(() => {
            testWs.close();
            console.log('❌ WebSocket server not available - make sure RTSP server is running');
            resolve(null);
          }, 3000); // Increased timeout

          testWs.onopen = () => {
            clearTimeout(timeout);
            testWs.close();
            console.log('✅ WebSocket server available');
            
            // Return WebSocket stream configuration
            resolve({
              type: 'websocket',
              wsUrl: `ws://localhost:9999/rtsp-stream?camera=${encodeURIComponent(camera.$id)}&rtsp=${encodeURIComponent(camera.rtspUrl)}`,
              cameraId: camera.$id
            });
          };

          testWs.onerror = (error) => {
            clearTimeout(timeout);
            console.log('❌ WebSocket server connection failed:', error);
            resolve(null);
          };

          testWs.onclose = (event) => {
            clearTimeout(timeout);
            console.log('❌ WebSocket connection closed:', event.code, event.reason);
            resolve(null);
          };
        });

      } catch (error) {
        console.log('❌ WebSocket not supported or server unavailable:', error);
        return null;
      }
      
    } catch (error) {
      console.error('WebSocket proxy error:', error);
      return null;
    }
  }

  /**
   * Create canvas-based proxy for RTSP stream
   */
  async createCanvasProxy(camera) {
    try {
      console.log('🎨 Creating canvas proxy...');
      
      // This would use a backend service to:
      // 1. Capture RTSP frames
      // 2. Convert to images
      // 3. Stream as MJPEG or WebSocket
      
      const proxyUrl = `/api/canvas-proxy/${encodeURIComponent(camera.rtspUrl)}`;
      
      return null; // Not implemented yet
      
    } catch (error) {
      console.error('Canvas proxy error:', error);
      return null;
    }
  }

  /**
   * Test if a stream URL is accessible
   */
  async testStreamUrl(url) {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'no-cors'
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Stop proxy stream
   */
  stopProxy(cameraId) {
    if (this.activeStreams.has(cameraId)) {
      const stream = this.activeStreams.get(cameraId);
      // Clean up stream resources
      this.activeStreams.delete(cameraId);
      console.log(`⏹️ Stopped proxy for camera ${cameraId}`);
    }
  }
}

export default new RTSPProxy();
