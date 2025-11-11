import { NextResponse } from 'next/server';

/**
 * Health check endpoint for Docker and monitoring
 */
export async function GET() {
  try {
    // Check if go2rtc is accessible
    const go2rtcHealth = await fetch('http://localhost:1984/api', {
      method: 'GET',
      timeout: 5000
    }).then(res => res.ok).catch(() => false);

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        nextjs: true,
        go2rtc: go2rtcHealth
      },
      version: process.env.npm_package_version || '1.0.0'
    };

    return NextResponse.json(health, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 503 });
  }
}
