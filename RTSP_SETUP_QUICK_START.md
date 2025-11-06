# 🚀 RTSP WebSocket Streaming - Quick Start

## ✅ **WebSocket Solution Implemented!**

Your RTSP camera `rtsp://10.254.12.134:9000/live` will now stream **directly in your web app** using WebSocket conversion.

## 🔧 **Setup Steps:**

### **1. Install Dependencies**
```bash
npm install
```

### **2. Start RTSP WebSocket Server**
```bash
# Option A: Start server only
npm run rtsp-server

# Option B: Start both server and Next.js (recommended)
npm run dev-with-rtsp
```

### **3. Test Your RTSP Camera**
1. **Go to Live View** in your app
2. **Select your RTSP camera** (UMA HQ)
3. **Click "🔄 Try Smart RTSP Conversion"**
4. **Watch automatic conversion:**
   - ✅ Tests HTTP alternatives first
   - ✅ Falls back to WebSocket conversion
   - ✅ Displays live stream in app!

## 📊 **Expected Console Output:**

### **Successful WebSocket Conversion:**
```
🔄 Converting RTSP stream: rtsp://10.254.12.134:9000/live
🔍 Testing 11 HTTP alternatives...
❌ No working HTTP alternatives found
🌐 Creating WebSocket proxy...
✅ WebSocket server available
✅ RTSP converted to websocket: ws://localhost:9999/rtsp-stream?camera=...
🌐 Connected to UMA HQ via WebSocket (RTSP converted)
```

### **RTSP Server Output:**
```
🚀 RTSP WebSocket server running on port 9999
📡 WebSocket endpoint: ws://localhost:9999/rtsp-stream
🔌 WebSocket client connected
📹 Starting stream for camera [id]: rtsp://10.254.12.134:9000/live
✅ Stream created for camera [id]
```

## 🎯 **What Happens:**

1. **HTTP Test**: First tries 11 common HTTP patterns
2. **WebSocket Fallback**: If no HTTP found, starts WebSocket conversion
3. **RTSP → MPEG1**: Server converts RTSP to browser-compatible MPEG1
4. **WebSocket Stream**: Sends video data via WebSocket
5. **JSMpeg Player**: Displays stream in HTML5 canvas
6. **Live Stream**: Real-time video in your app! 🎥

## 🤖 **Ready for AI Integration:**

Once streaming works:
- ✅ **Frame Capture**: Extract frames from canvas for AI analysis
- ✅ **Real-time Processing**: Send frames to OpenAI Vision API
- ✅ **Detection Overlays**: Display AI results on live stream
- ✅ **Event Creation**: Generate alerts for banned faces/falls

## 🔧 **Dependencies Added:**

```json
{
  "ws": "^8.18.0",              // WebSocket server
  "node-rtsp-stream": "^0.0.9", // RTSP to MPEG1 conversion
  "jsmpeg": "^0.2.0",           // Browser MPEG1 player
  "concurrently": "^8.2.2"      // Run multiple processes
}
```

## 🚀 **Try It Now:**

```bash
# 1. Install dependencies
npm install

# 2. Start both servers
npm run dev-with-rtsp

# 3. Go to http://localhost:3000/live-view
# 4. Select RTSP camera
# 5. Click "Try Smart RTSP Conversion"
# 6. Watch live stream appear! 🎯
```

## 🎬 **Expected Result:**

- ✅ **No VLC needed** - Pure web solution
- ✅ **Live RTSP stream** in your app
- ✅ **Real-time video** with low latency
- ✅ **AI-ready canvas** for detection overlays
- ✅ **Professional CCTV** experience

**Your RTSP camera will now stream directly in the web app - perfect for AI detection integration!** 🎯
