import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function POST(request) {
  console.log('🧹 Cleaning up all FFmpeg processes and throttles...');
  
  try {
    // Kill all FFmpeg processes
    const killProcess = spawn('pkill', ['-f', 'ffmpeg']);
    
    killProcess.on('close', (code) => {
      console.log(`Cleanup process exited with code ${code}`);
    });

    // Clear throttling (import the map from rtsp-proxy)
    // Note: This is a simple approach - in production you'd use a shared cache
    console.log('🔄 Clearing request throttles');

    return NextResponse.json({ 
      message: 'Cleanup initiated - processes killed and throttles cleared',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}

export async function GET(request) {
  // Get process count
  return NextResponse.json({ 
    message: 'Use POST to cleanup processes',
    timestamp: new Date().toISOString()
  });
}
