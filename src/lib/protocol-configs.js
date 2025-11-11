/**
 * Protocol-specific configurations for go2rtc camera sources
 * Each protocol has different URL formats, default ports, and requirements
 */

export const PROTOCOL_CONFIGS = {
  // Traditional IP Camera Protocols
  rtsp: {
    name: 'RTSP',
    description: 'Real Time Streaming Protocol - Standard IP camera protocol',
    defaultPort: 554,
    urlFormat: 'rtsp://[username:password@]host[:port]/path',
    example: 'rtsp://admin:password@192.168.1.100:554/stream1',
    requiresAuth: true,
    supportsTLS: false,
    category: 'IP Camera'
  },
  
  rtsps: {
    name: 'RTSPS',
    description: 'RTSP over TLS/SSL - Secure RTSP connection',
    defaultPort: 322,
    urlFormat: 'rtsps://[username:password@]host[:port]/path',
    example: 'rtsps://admin:password@192.168.1.100:322/stream1',
    requiresAuth: true,
    supportsTLS: true,
    category: 'IP Camera'
  },

  http: {
    name: 'HTTP',
    description: 'HTTP video stream (MJPEG, MP4, etc.)',
    defaultPort: 80,
    urlFormat: 'http://[username:password@]host[:port]/path',
    example: 'http://admin:password@192.168.1.100/video.mjpg',
    requiresAuth: false,
    supportsTLS: false,
    category: 'IP Camera'
  },

  https: {
    name: 'HTTPS',
    description: 'HTTPS video stream - Secure HTTP',
    defaultPort: 443,
    urlFormat: 'https://[username:password@]host[:port]/path',
    example: 'https://admin:password@192.168.1.100/video.mjpg',
    requiresAuth: false,
    supportsTLS: true,
    category: 'IP Camera'
  },

  rtmp: {
    name: 'RTMP',
    description: 'Real-Time Messaging Protocol - Live streaming',
    defaultPort: 1935,
    urlFormat: 'rtmp://host[:port]/app/stream',
    example: 'rtmp://192.168.1.100:1935/live/stream1',
    requiresAuth: false,
    supportsTLS: false,
    category: 'Streaming'
  },

  hls: {
    name: 'HLS',
    description: 'HTTP Live Streaming - Apple streaming protocol',
    defaultPort: 80,
    urlFormat: 'http://host[:port]/path/playlist.m3u8',
    example: 'http://192.168.1.100/hls/stream1.m3u8',
    requiresAuth: false,
    supportsTLS: false,
    category: 'Streaming'
  },

  mjpeg: {
    name: 'MJPEG',
    description: 'Motion JPEG over HTTP',
    defaultPort: 80,
    urlFormat: 'http://host[:port]/path',
    example: 'http://192.168.1.100/mjpeg/1',
    requiresAuth: false,
    supportsTLS: false,
    category: 'IP Camera'
  },

  // Professional Standards
  onvif: {
    name: 'ONVIF',
    description: 'Open Network Video Interface Forum standard',
    defaultPort: 80,
    urlFormat: 'onvif://[username:password@]host[:port][/path]',
    example: 'onvif://admin:password@192.168.1.100',
    requiresAuth: true,
    supportsTLS: false,
    category: 'Professional'
  },

  isapi: {
    name: 'ISAPI',
    description: 'Hikvision Internet Server Application Programming Interface',
    defaultPort: 80,
    urlFormat: 'isapi://[username:password@]host[:port]',
    example: 'isapi://admin:password@192.168.1.100',
    requiresAuth: true,
    supportsTLS: false,
    category: 'Professional'
  },

  dvrip: {
    name: 'DVRIP',
    description: 'Dahua DVR Internet Protocol',
    defaultPort: 37777,
    urlFormat: 'dvrip://[username:password@]host[:port][?channel=N]',
    example: 'dvrip://admin:password@192.168.1.100:37777?channel=1',
    requiresAuth: true,
    supportsTLS: false,
    category: 'Professional'
  },

  // Smart Home & IoT
  homekit: {
    name: 'HomeKit',
    description: 'Apple HomeKit cameras - Requires pairing process',
    defaultPort: null,
    urlFormat: 'homekit://[host:port]?device_id=[id]&feature=[feature]&status=[status]',
    example: 'homekit://192.168.1.15:1984?device_id=39:DB:AB:1A:2B:C8&feature=0&status=1',
    requiresAuth: false,
    supportsTLS: true,
    category: 'Smart Home',
    requirements: [
      'Camera must be added to HomeKit configuration in go2rtc.yaml first',
      'Requires H.264 video and OPUS audio codecs',
      'Must be paired through Apple Home app using QR code or PIN',
      'Automatic mDNS discovery required'
    ],
    setupSteps: [
      '1. Add camera to homekit section in go2rtc config',
      '2. Start go2rtc server',
      '3. Use Apple Home app to scan QR code or enter PIN',
      '4. Camera will appear as homekit:// URL after pairing'
    ]
  },

  tapo: {
    name: 'TP-Link Tapo',
    description: 'TP-Link Tapo smart cameras (C100, C110, C200, etc.)',
    defaultPort: null,
    urlFormat: 'tapo://[username:password@]host',
    example: 'tapo://admin:password@192.168.1.100',
    requiresAuth: true,
    supportsTLS: false,
    category: 'Smart Home',
    requirements: [
      'Camera must be on same network as go2rtc',
      'Username/password from TP-Link Tapo app',
      'Camera must support RTSP (most Tapo cameras do)'
    ]
  },

  kasa: {
    name: 'TP-Link Kasa',
    description: 'TP-Link Kasa smart cameras (KC100, KC110, KC120, etc.)',
    defaultPort: null,
    urlFormat: 'kasa://[username:password@]host',
    example: 'kasa://admin:password@192.168.1.100',
    requiresAuth: true,
    supportsTLS: false,
    category: 'Smart Home',
    requirements: [
      'Camera must be on same network as go2rtc',
      'Username/password from TP-Link Kasa app',
      'May require cloud authentication for some models'
    ]
  },

  // Cloud & Consumer
  ring: {
    name: 'Ring',
    description: 'Ring doorbells and security cameras',
    defaultPort: null,
    urlFormat: 'ring://[refresh_token]',
    example: 'ring://your_refresh_token_here',
    requiresAuth: true,
    supportsTLS: true,
    category: 'Cloud Service',
    authNote: 'Requires Ring account refresh token',
    requirements: [
      'Ring account with 2FA disabled',
      'Refresh token obtained through Ring API',
      'Internet connection required',
      'May violate Ring Terms of Service'
    ],
    setupSteps: [
      '1. Create Ring account and add cameras',
      '2. Use ring-client-api or similar to get refresh token',
      '3. Enter refresh token in configuration',
      '4. Note: Unofficial API usage'
    ]
  },

  nest: {
    name: 'Google Nest',
    description: 'Google Nest cameras and doorbells',
    defaultPort: null,
    urlFormat: 'nest://[project_id]:[device_id]',
    example: 'nest://project-123:device-456',
    requiresAuth: true,
    supportsTLS: true,
    category: 'Cloud Service',
    authNote: 'Requires Google Cloud project setup',
    requirements: [
      'Google Cloud Project with Device Access API',
      'Nest device registered in Google Home',
      'OAuth 2.0 credentials configured',
      'Device Access subscription ($5 one-time fee)'
    ],
    setupSteps: [
      '1. Create Google Cloud Project',
      '2. Enable Device Access API',
      '3. Set up OAuth 2.0 credentials',
      '4. Pay Device Access fee and register devices',
      '5. Get project ID and device ID from API'
    ]
  },

  ivideon: {
    name: 'Ivideon',
    description: 'Ivideon cloud camera service',
    defaultPort: null,
    urlFormat: 'ivideon://[server_id]',
    example: 'ivideon://123456',
    requiresAuth: true,
    supportsTLS: true,
    category: 'Cloud Service'
  },

  // Special Devices
  gopro: {
    name: 'GoPro',
    description: 'GoPro action cameras with WiFi (Hero 8+)',
    defaultPort: 8080,
    urlFormat: 'gopro://host[:port]',
    example: 'gopro://10.5.5.9:8080',
    requiresAuth: false,
    supportsTLS: false,
    category: 'Action Camera',
    requirements: [
      'GoPro Hero 8 or newer with WiFi enabled',
      'Camera must be in WiFi mode (not connected to phone)',
      'Camera and go2rtc must be on same network',
      'Camera must be powered on and not recording'
    ],
    setupSteps: [
      '1. Enable WiFi on GoPro camera',
      '2. Connect to GoPro WiFi network or connect both to same network',
      '3. Find GoPro IP address (usually 10.5.5.9 on its own network)',
      '4. Use gopro://[ip]:8080 format'
    ]
  },

  roborock: {
    name: 'Roborock',
    description: 'Roborock vacuum cleaner cameras',
    defaultPort: null,
    urlFormat: 'roborock://[device_id]',
    example: 'roborock://12345678',
    requiresAuth: true,
    supportsTLS: false,
    category: 'IoT Device'
  },

  // Advanced Sources
  ffmpeg: {
    name: 'FFmpeg',
    description: 'Custom FFmpeg source with parameters',
    defaultPort: null,
    urlFormat: 'ffmpeg:[input]#[params]',
    example: 'ffmpeg:rtsp://camera/stream#video=h264#audio=aac',
    requiresAuth: false,
    supportsTLS: false,
    category: 'Advanced'
  },

  ffmpeg_device: {
    name: 'FFmpeg Device',
    description: 'Local devices (webcams, capture cards)',
    defaultPort: null,
    urlFormat: 'ffmpeg:device?[params]',
    example: 'ffmpeg:device?video=0&audio=0',
    requiresAuth: false,
    supportsTLS: false,
    category: 'Local Device'
  },

  webrtc: {
    name: 'WebRTC',
    description: 'WebRTC peer-to-peer connection',
    defaultPort: null,
    urlFormat: 'webrtc:[signaling_url]',
    example: 'webrtc:ws://localhost:8080/ws',
    requiresAuth: false,
    supportsTLS: true,
    category: 'P2P'
  },

  // Development & Testing
  echo: {
    name: 'Echo Test',
    description: 'Echo test source for development',
    defaultPort: null,
    urlFormat: 'echo:[message]',
    example: 'echo:test',
    requiresAuth: false,
    supportsTLS: false,
    category: 'Development'
  },

  exec: {
    name: 'Execute Command',
    description: 'Execute custom command as video source',
    defaultPort: null,
    urlFormat: 'exec:[command]',
    example: 'exec:ffmpeg -f lavfi -i testsrc -f rtsp rtsp://localhost/test',
    requiresAuth: false,
    supportsTLS: false,
    category: 'Development'
  }
};

/**
 * Get protocol configuration by protocol name
 */
export function getProtocolConfig(protocol) {
  return PROTOCOL_CONFIGS[protocol] || null;
}

/**
 * Get protocols by category
 */
export function getProtocolsByCategory() {
  const categories = {};
  
  Object.entries(PROTOCOL_CONFIGS).forEach(([key, config]) => {
    const category = config.category || 'Other';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push({ key, ...config });
  });

  return categories;
}

/**
 * Get default port for protocol
 */
export function getDefaultPort(protocol) {
  const config = getProtocolConfig(protocol);
  return config?.defaultPort || null;
}

/**
 * Generate example URL for protocol
 */
export function generateExampleUrl(protocol, host = '192.168.1.100', username = 'admin', password = 'password') {
  const config = getProtocolConfig(protocol);
  if (!config) return '';

  return config.example.replace(/192\.168\.1\.100/g, host)
                      .replace(/admin/g, username)
                      .replace(/password/g, password);
}

/**
 * Validate URL format for protocol
 */
export function validateProtocolUrl(protocol, url) {
  const config = getProtocolConfig(protocol);
  if (!config) return { valid: false, error: 'Unknown protocol' };

  // Basic validation - check if URL starts with protocol
  if (!url.startsWith(`${protocol}://`)) {
    return { 
      valid: false, 
      error: `URL must start with ${protocol}://` 
    };
  }

  // Check for required authentication
  if (config.requiresAuth && !url.includes('@') && !url.includes('token')) {
    return { 
      valid: false, 
      error: 'This protocol requires authentication (username:password@host or token)' 
    };
  }

  return { valid: true };
}
