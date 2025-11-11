#!/bin/bash

echo "🧹 Cleaning up old streaming components..."
echo "========================================"

# List of files to remove (old streaming setup)
OLD_FILES=(
    "server/rtsp-websocket-server.js"
    "src/components/H264VideoPlayer.js"
    "src/components/WebSocketVideoPlayer.js"
    "src/app/api/rtsp-proxy/route.js"
    "src/app/api/cleanup-streams/route.js"
    "src/lib/rtsp-proxy.js"
    "public/jsmpeg.min.js"
    "test-websocket.html"
    "test-rtsp-simple.html"
)

echo "📋 Files that will be removed:"
for file in "${OLD_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file (exists)"
    else
        echo "  - $file (not found)"
    fi
done

echo ""
read -p "❓ Do you want to remove these old streaming files? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Removing old files..."
    
    for file in "${OLD_FILES[@]}"; do
        if [ -f "$file" ]; then
            rm "$file"
            echo "  ✅ Removed $file"
        fi
    done
    
    # Remove empty directories
    rmdir server 2>/dev/null && echo "  ✅ Removed empty server directory"
    rmdir src/app/api/rtsp-proxy 2>/dev/null && echo "  ✅ Removed empty rtsp-proxy directory"
    rmdir src/app/api/cleanup-streams 2>/dev/null && echo "  ✅ Removed empty cleanup-streams directory"
    
    echo ""
    echo "✅ Cleanup completed! Old streaming setup removed."
    echo "🎉 Your app now uses the clean go2rtc solution!"
else
    echo "❌ Cleanup cancelled. Old files preserved."
fi
