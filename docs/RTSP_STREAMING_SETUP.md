# RTSP Streaming Setup Guide

## Issue Identified
Your RTSP camera `rtsp://10.254.12.134:9000/live` cannot stream directly in web browsers. RTSP is not supported by HTML5 video elements.

**Error:** `RTSP_CONVERSION_REQUIRED` - Browser cannot play RTSP streams directly.

## Why RTSP Doesn't Work in Browsers

### Technical Limitations:
- **HTML5 Video**: Only supports HTTP-based protocols (HLS, DASH, WebRTC)
- **RTSP Protocol**: Real-time streaming protocol not supported by browsers
- **Security**: Browsers block direct RTSP connections for security reasons
- **Codec Issues**: RTSP often uses codecs not supported by browsers

## Solutions Implemented

### ✅ Immediate Solutions:
1. **📋 Copy RTSP URL for VLC** - Copy URL to clipboard
2. **🎬 Open in VLC Player** - Direct VLC launch (if installed)
3. **Proper Error Messages** - Clear explanation of RTSP limitations

### 🔧 Production Solutions:

## Option 1: FFmpeg Media Server (Recommended)

### Setup FFmpeg for RTSP to HLS Conversion:
```bash
# Install FFmpeg
sudo apt update
sudo apt install ffmpeg

# Convert RTSP to HLS
ffmpeg -i rtsp://10.254.12.134:9000/live \
  -c:v libx264 -c:a aac \
  -f hls -hls_time 10 -hls_list_size 6 \
  -hls_flags delete_segments \
  /var/www/html/stream/camera1.m3u8
```

### Serve HLS Stream:
```javascript
// Update camera configuration
{
  "name": "UMA HQ",
  "protocol": "hls",
  "hlsUrl": "http://your-server.com/stream/camera1.m3u8",
  "rtspUrl": "rtsp://10.254.12.134:9000/live" // Keep for reference
}
```

## Option 2: Node Media Server

### Install and Setup:
```bash
npm install node-media-server
```

```javascript
// media-server.js
const NodeMediaServer = require('node-media-server');

const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8000,
    allow_origin: '*'
  },
  relay: {
    ffmpeg: '/usr/local/bin/ffmpeg',
    tasks: [
      {
        app: 'live',
        mode: 'pull',
        edge: 'rtsp://10.254.12.134:9000/live'
      }
    ]
  }
};

const nms = new NodeMediaServer(config);
nms.run();
```

## Option 3: WebRTC Gateway

### Using Kurento Media Server:
```javascript
// WebRTC RTSP gateway
const kurento = require('kurento-client');

kurento('ws://localhost:8888/kurento', (error, client) => {
  client.create('MediaPipeline', (error, pipeline) => {
    pipeline.create('PlayerEndpoint', {
      uri: 'rtsp://10.254.12.134:9000/live'
    }, (error, player) => {
      pipeline.create('WebRtcEndpoint', (error, webRtc) => {
        player.connect(webRtc);
        // Setup WebRTC signaling
      });
    });
  });
});
```

## Option 4: Simple HTTP Conversion

### Many IP cameras support HTTP streams:
```javascript
// Try these common HTTP patterns for your camera
const httpAlternatives = [
  'http://10.254.12.134:80/live',
  'http://10.254.12.134:80/mjpeg',
  'http://10.254.12.134:80/video.cgi',
  'http://10.254.12.134:80/videostream.cgi',
  'http://10.254.12.134:9000/live.mjpg'
];
```

## Integration with Your App

### Update Camera Configuration:
```javascript
// Add HLS URL to camera object
{
  "name": "UMA HQ",
  "protocol": "hls", // Change from 'rtsp' to 'hls'
  "hlsUrl": "http://your-media-server.com/hls/camera1.m3u8",
  "rtspUrl": "rtsp://10.254.12.134:9000/live", // Keep original
  "httpStreamUrl": "http://10.254.12.134:80/mjpeg" // If available
}
```

### Enhanced Streaming Service:
```javascript
// In camera-streaming.js
getConvertedStreamUrl(camera) {
  // Check for HLS stream
  if (camera.hlsUrl) {
    return camera.hlsUrl;
  }
  
  // Check for HTTP stream
  if (camera.httpStreamUrl) {
    return camera.httpStreamUrl;
  }
  
  // No web-compatible stream available
  return null;
}
```

## Current System Capabilities

### ✅ What Works Now:
1. **RTSP Detection** - Automatically detects RTSP cameras
2. **VLC Integration** - Copy URL or open in VLC directly
3. **Clear Error Messages** - Explains RTSP limitations
4. **Fallback Options** - Multiple ways to view RTSP streams

### 🔄 What You Can Try:
1. **Copy RTSP URL** - Use with VLC Media Player
2. **Open in VLC** - Direct launch if VLC is installed
3. **Check Camera Settings** - Look for HTTP/MJPEG options
4. **Set up Media Server** - For web streaming conversion

## Production Recommendations

### For Immediate Use:
1. **Use VLC Media Player** - Best RTSP support
2. **Check camera web interface** - May have HTTP streams
3. **Test HTTP alternatives** - Try common HTTP patterns

### For Web Integration:
1. **Set up FFmpeg** - Convert RTSP to HLS
2. **Use Node Media Server** - Real-time conversion
3. **Implement WebRTC Gateway** - For low latency
4. **Add HLS.js** - For better HLS support in browsers

## Next Steps

1. **Try VLC with your RTSP URL** - Immediate viewing solution
2. **Check camera documentation** - Look for HTTP stream options
3. **Set up media server** - For web browser compatibility
4. **Update camera configuration** - Add HLS/HTTP URLs when available

The system now properly handles RTSP cameras with appropriate guidance and working alternatives!

## Example Media Server Setup

### Docker FFmpeg Service:
```dockerfile
FROM jrottenberg/ffmpeg:4.4-alpine

COPY start-stream.sh /start-stream.sh
RUN chmod +x /start-stream.sh

CMD ["/start-stream.sh"]
```

```bash
#!/bin/bash
# start-stream.sh
ffmpeg -i rtsp://10.254.12.134:9000/live \
  -c:v libx264 -preset ultrafast -tune zerolatency \
  -c:a aac -ar 44100 -ac 2 \
  -f hls -hls_time 2 -hls_list_size 3 \
  -hls_flags delete_segments+append_list \
  /output/stream.m3u8
```

This provides a complete solution for RTSP streaming in your CCTV system!
