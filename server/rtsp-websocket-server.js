/**
 * RTSP to WebSocket Streaming Server
 * Converts RTSP streams to browser-compatible WebSocket streams
 */

const WebSocket = require('ws');
const Stream = require('node-rtsp-stream');
const http = require('http');

class RTSPWebSocketServer {
  constructor(port = 9999) {
    this.port = port;
    this.streams = new Map();
    this.server = null;
    this.wss = null;
  }

  start() {
    // Create HTTP server
    this.server = http.createServer();
    
    // Create WebSocket server
    this.wss = new WebSocket.Server({ 
      server: this.server,
      path: '/rtsp-stream'
    });

    this.wss.on('connection', (ws, req) => {
      console.log('🔌 WebSocket client connected');
      
      // Parse camera ID from URL
      const url = new URL(req.url, `http://localhost:${this.port}`);
      const cameraId = url.searchParams.get('camera');
      const rtspUrl = url.searchParams.get('rtsp');
      
      if (!cameraId || !rtspUrl) {
        ws.close(1008, 'Missing camera ID or RTSP URL');
        return;
      }

      console.log(`📹 Starting stream for camera ${cameraId}: ${rtspUrl}`);
      
      try {
        // Create or get existing stream
        let stream = this.streams.get(cameraId);
        
        if (!stream) {
          console.log(`🔧 Creating new RTSP stream for ${rtspUrl}`);
          
          // Test RTSP URL first
          console.log(`🧪 Testing RTSP connection to ${decodeURIComponent(rtspUrl)}`);
          
          // Use a different port range to avoid conflicts
          const streamPort = 10000 + parseInt(cameraId.slice(-3)) || 10000;
          
          stream = new Stream({
            name: `camera_${cameraId}`,
            streamUrl: decodeURIComponent(rtspUrl),
            wsPort: streamPort, // Use port 10000+ range
            ffmpegOptions: {
              '-stats': '',
              '-r': 15, // Frame rate
              '-s': '640x480', // Resolution
              '-f': 'mpegts', // Container format for JSMpeg
              '-codec:v': 'mpeg1video', // Video codec for JSMpeg
              '-codec:a': 'mp2', // Audio codec
              '-b:v': '1000k', // Video bitrate
              '-maxrate': '1000k',
              '-bufsize': '2000k',
              '-g': 15, // Keyframe every 15 frames (1 second at 15fps)
              '-keyint_min': 15, // Minimum keyframe interval
              '-sc_threshold': '0', // Disable scene change detection
              '-pix_fmt': 'yuv420p', // Pixel format
              '-q:v': 5, // Quality setting (1-31, lower is better)
              '-an': '', // Disable audio for now to focus on video
              '-fflags': '+genpts', // Generate presentation timestamps
              '-avoid_negative_ts': 'make_zero', // Handle timestamp issues
              '-loglevel': 'verbose' // More detailed logging
            }
          });
          
          // Add error handling for the stream
          stream.on('error', (error) => {
            console.error(`❌ RTSP Stream error for camera ${cameraId}:`, error);
            ws.send(JSON.stringify({
              type: 'error',
              message: `RTSP stream error: ${error.message}`
            }));
          });

          stream.on('exitWithError', (error) => {
            console.error(`❌ FFmpeg exited with error for camera ${cameraId}:`, error);
            ws.send(JSON.stringify({
              type: 'error',
              message: `FFmpeg error: ${error}`
            }));
          });
          
          this.streams.set(cameraId, stream);
          console.log(`✅ Stream created for camera ${cameraId} on port ${streamPort}`);
        }

        // Handle client disconnect
        ws.on('close', () => {
          console.log(`🔌 Client disconnected from camera ${cameraId}`);
          // Keep stream running for other potential clients
        });

        ws.on('error', (error) => {
          console.error(`❌ WebSocket error for camera ${cameraId}:`, error);
        });

        // Send stream info to client
        console.log(`📤 Sending stream_ready message for camera ${cameraId}`);
        const actualPort = stream.wsPort || streamPort || 10000;
        ws.send(JSON.stringify({
          type: 'stream_ready',
          cameraId,
          wsPort: actualPort
        }));
        console.log(`📡 Stream available on ws://localhost:${actualPort}`);

      } catch (error) {
        console.error(`❌ Error starting stream for camera ${cameraId}:`, error);
        ws.send(JSON.stringify({
          type: 'error',
          message: error.message
        }));
        ws.close();
      }
    });

    // Start HTTP server
    this.server.listen(this.port, () => {
      console.log(`🚀 RTSP WebSocket server running on port ${this.port}`);
      console.log(`📡 WebSocket endpoint: ws://localhost:${this.port}/rtsp-stream`);
    });
  }

  stop() {
    // Stop all streams
    for (const [cameraId, stream] of this.streams) {
      try {
        stream.stop();
        console.log(`⏹️ Stopped stream for camera ${cameraId}`);
      } catch (error) {
        console.error(`Error stopping stream for camera ${cameraId}:`, error);
      }
    }
    
    this.streams.clear();

    // Close WebSocket server
    if (this.wss) {
      this.wss.close();
    }

    // Close HTTP server
    if (this.server) {
      this.server.close();
    }

    console.log('🛑 RTSP WebSocket server stopped');
  }

  getStreamInfo(cameraId) {
    const stream = this.streams.get(cameraId);
    if (stream) {
      return {
        cameraId,
        active: true,
        wsPort: stream.wsPort || 9999
      };
    }
    return null;
  }
}

// Start server if run directly
if (require.main === module) {
  const server = new RTSPWebSocketServer(9999);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down RTSP server...');
    server.stop();
    process.exit(0);
  });

  server.start();
}

module.exports = RTSPWebSocketServer;
