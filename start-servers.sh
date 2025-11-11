#!/bin/bash

echo "🚀 Starting CCTV Monitoring System with go2rtc"
echo "=============================================="

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "go2rtc" 2>/dev/null
pkill -f "next dev" 2>/dev/null

# Start go2rtc in background
echo "📡 Starting go2rtc streaming server..."
./go2rtc -c go2rtc.yaml &
GO2RTC_PID=$!

# Wait a moment for go2rtc to start
sleep 2

# Start Next.js dev server
echo "🌐 Starting Next.js application..."
npm run dev &
NEXTJS_PID=$!

echo ""
echo "✅ Servers started successfully!"
echo "📡 go2rtc Web Interface: http://localhost:1984/"
echo "🌐 Next.js Application: http://localhost:3000/live-view"
echo ""
echo "📋 Stream URLs available:"
echo "   WebRTC: http://localhost:1984/api/webrtc?src=back_house"
echo "   HLS: http://localhost:1984/api/hls?src=back_house"
echo "   MP4: http://localhost:1984/api/stream.mp4?src=back_house"
echo ""
echo "Press Ctrl+C to stop all servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $GO2RTC_PID 2>/dev/null
    kill $NEXTJS_PID 2>/dev/null
    pkill -f "go2rtc" 2>/dev/null
    pkill -f "next dev" 2>/dev/null
    echo "✅ All servers stopped"
    exit 0
}

# Set trap to cleanup on Ctrl+C
trap cleanup SIGINT SIGTERM

# Wait for processes
wait
