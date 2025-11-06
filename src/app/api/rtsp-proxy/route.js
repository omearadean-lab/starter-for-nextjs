import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

// Track active FFmpeg processes for cleanup
const activeProcesses = new Set();

// Request throttling to prevent spam
const requestThrottle = new Map();

// Add a way to clear throttles
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const rtspUrl = searchParams.get('url');
  
  if (rtspUrl) {
    requestThrottle.delete(rtspUrl);
    console.log(`🔄 Cleared throttle for: ${rtspUrl}`);
    return NextResponse.json({ message: 'Throttle cleared' });
  } else {
    requestThrottle.clear();
    console.log('🔄 Cleared all throttles');
    return NextResponse.json({ message: 'All throttles cleared' });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rtspUrl = searchParams.get('url');

  if (!rtspUrl) {
    return NextResponse.json({ error: 'RTSP URL required' }, { status: 400 });
  }

  // Check if we've had recent failures for this URL
  const now = Date.now();
  const lastFailure = requestThrottle.get(rtspUrl);
  
  if (lastFailure && (now - lastFailure) < 2000) {
    console.log('⏸️ Request throttled - too many recent failures');
    return NextResponse.json({ error: 'Too many recent failures, please wait 2 seconds' }, { status: 429 });
  }

  console.log(`🎥 Creating HTTP proxy for: ${rtspUrl}`);

  try {
    // Determine if this is RTSPS (secure) or regular RTSP
    const isRTSPS = rtspUrl.startsWith('rtsps://');
    console.log(`📡 Protocol: ${isRTSPS ? 'RTSPS (secure)' : 'RTSP'}`);

    // Convert RTSP/RTSPS to HTTP stream using FFmpeg with proper timeout
    const ffmpegArgs = [
      '-rtsp_transport', 'tcp',    // Force TCP transport
      '-timeout', '10000000',      // 10 second timeout (in microseconds)
    ];

    // Add TLS options for RTSPS
    if (isRTSPS) {
      ffmpegArgs.push(
        '-rtsp_flags', 'prefer_tcp',
        '-tls_verify', '0',          // Skip TLS certificate verification
        '-user_agent', 'FFmpeg'      // Set user agent
      );
    }

    ffmpegArgs.push(
      '-i', rtspUrl,
      '-c:v', 'libx264',           // Re-encode to browser-compatible H.264
      '-preset', 'ultrafast',      // Fast encoding
      '-profile:v', 'baseline',    // Browser-compatible profile
      '-level', '3.0',             // Browser-compatible level
      '-pix_fmt', 'yuv420p',       // Browser-compatible pixel format
      '-c:a', 'aac',               // Audio codec
      '-f', 'mp4',                 // MP4 container
      '-movflags', 'frag_keyframe+empty_moov+faststart', // Streaming optimizations
      '-avoid_negative_ts', 'make_zero',
      '-fflags', '+genpts',
      '-'                          // Output to stdout
    );

    const ffmpeg = spawn('ffmpeg', ffmpegArgs);
    
    // Track this process
    activeProcesses.add(ffmpeg);
    console.log(`📊 Active FFmpeg processes: ${activeProcesses.size}`);

    // Create streaming response (simplified but with error suppression)
    const stream = new ReadableStream({
      start(controller) {
        let isClosed = false;

        ffmpeg.stdout.on('data', (chunk) => {
          if (!isClosed) {
            try {
              controller.enqueue(chunk);
              // Clear throttle on successful data
              requestThrottle.delete(rtspUrl);
            } catch (error) {
              // Silently handle controller errors
              if (!isClosed) {
                isClosed = true;
                activeProcesses.delete(ffmpeg);
                if (!ffmpeg.killed) {
                  ffmpeg.kill('SIGTERM');
                }
              }
            }
          }
        });

        ffmpeg.stderr.on('data', (data) => {
          // Only log actual errors, suppress progress messages
          const message = data.toString();
          if (message.includes('Error') || message.includes('failed')) {
            console.log(`FFmpeg: ${message}`);
          }
        });

        ffmpeg.on('close', (code) => {
          console.log(`FFmpeg process exited with code ${code}`);
          activeProcesses.delete(ffmpeg);
          
          // If FFmpeg failed, throttle future requests
          if (code !== 0) {
            requestThrottle.set(rtspUrl, Date.now());
          }
          
          if (!isClosed) {
            try {
              controller.close();
              isClosed = true;
            } catch (error) {
              // Ignore controller close errors
            }
          }
        });

        ffmpeg.on('error', (error) => {
          console.error('FFmpeg error:', error);
          activeProcesses.delete(ffmpeg);
          if (!isClosed) {
            try {
              controller.error(error);
              isClosed = true;
            } catch (err) {
              // Ignore controller error errors
            }
          }
        });
      },
      
      cancel() {
        console.log('🚫 Stream cancelled by client');
        activeProcesses.delete(ffmpeg);
        if (!ffmpeg.killed) {
          ffmpeg.kill('SIGTERM');
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'video/mp4',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'Accept-Ranges': 'bytes',
        'Connection': 'keep-alive',
        'Transfer-Encoding': 'chunked'
      }
    });

  } catch (error) {
    console.error('RTSP proxy error:', error);
    return NextResponse.json({ error: 'Failed to proxy RTSP stream' }, { status: 500 });
  }
}
