# UniFi Protect Camera Integration

## Issue Identified
Your UniFi Protect camera URL `https://monitor.ui.com/44190a7e-ce6e-4996-9470-ac4a691910ef` is being blocked by **CORS (Cross-Origin Resource Sharing)** restrictions.

**Error:** `OpaqueResponseBlocking` - Browser security prevents embedding external streams.

## Why This Happens
1. **Browser Security**: Modern browsers block cross-origin requests for security
2. **UniFi Protect**: Doesn't set CORS headers to allow embedding in other websites
3. **Same-Origin Policy**: Browser prevents loading resources from different domains

## Solutions Implemented

### ✅ Solution 1: Direct URL Access
- **"Open Stream URL Directly"** button opens camera in new tab
- **Works immediately** - bypasses CORS restrictions
- **Best for monitoring** - full UniFi interface available

### ✅ Solution 2: Iframe Embed (New)
- **"Try Iframe Embed"** button attempts iframe embedding
- **May work** if UniFi allows iframe embedding
- **Keeps you in the app** - embedded viewing

### ✅ Solution 3: Enhanced Error Handling
- **Detects CORS errors** automatically
- **Provides specific solutions** for UniFi cameras
- **Better user guidance** for troubleshooting

## UniFi Protect Specific Solutions

### Option A: UniFi Protect Web Interface
```
Direct URL: https://monitor.ui.com/44190a7e-ce6e-4996-9470-ac4a691910ef
- Full camera controls
- Recording playback
- Settings access
- Works immediately
```

### Option B: UniFi Camera Direct Stream
Some UniFi cameras provide direct RTSP streams:
```
Format: rtsp://camera-ip:7447/[stream-path]
Example: rtsp://192.168.1.100:7447/live/0/0
```

### Option C: UniFi Protect API Integration
For advanced integration:
```javascript
// UniFi Protect API endpoints
const UNIFI_API = {
  login: '/api/auth/login',
  cameras: '/proxy/protect/api/cameras',
  stream: '/proxy/protect/api/cameras/{id}/livestream'
};
```

### Option D: Proxy Server Setup
Create a proxy to bypass CORS:
```javascript
// Next.js API route: /api/camera-proxy
export default async function handler(req, res) {
  const { url } = req.query;
  
  try {
    const response = await fetch(url);
    const data = await response.body;
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', response.headers.get('content-type'));
    
    data.pipe(res);
  } catch (error) {
    res.status(500).json({ error: 'Proxy failed' });
  }
}
```

## Current System Capabilities

### ✅ What Works Now:
1. **CORS Detection** - Automatically detects and explains CORS issues
2. **Direct Access** - Opens UniFi interface in new tab
3. **Iframe Fallback** - Attempts iframe embedding
4. **Error Guidance** - Specific solutions for UniFi cameras
5. **Retry Logic** - Multiple connection attempts

### 🔄 What You Can Try:
1. **Click "Open Stream URL Directly"** - Immediate access to camera
2. **Click "Try Iframe Embed"** - May work for some UniFi setups
3. **Check UniFi settings** - Look for public sharing options
4. **Use UniFi mobile app** - Alternative monitoring method

## Production Recommendations

### For Full Integration:
1. **Set up proxy server** to handle CORS
2. **Use UniFi Protect API** for authenticated access
3. **Implement WebRTC gateway** for real-time streaming
4. **Create UniFi-specific integration** with proper authentication

### For Immediate Use:
1. **Use "Open Stream URL Directly"** - Works now
2. **Bookmark camera URLs** - Quick access
3. **Use multiple browser tabs** - Monitor multiple cameras
4. **Consider UniFi mobile app** - Native experience

## Technical Details

### CORS Error Explanation:
```
Error: OpaqueResponseBlocking
Cause: UniFi Protect doesn't set Access-Control-Allow-Origin headers
Result: Browser blocks embedding in your application
Solution: Use direct access or proxy server
```

### Browser Security:
- **Same-Origin Policy** prevents cross-domain requests
- **CORS headers** required for embedding external content
- **Iframe sandbox** may provide limited workaround
- **Proxy servers** can bypass restrictions

## Next Steps

1. **Try the new solutions** in Live View
2. **Use direct URL access** for immediate monitoring
3. **Consider proxy setup** for full integration
4. **Explore UniFi API** for advanced features

The system now provides multiple fallback options for your UniFi Protect cameras!
