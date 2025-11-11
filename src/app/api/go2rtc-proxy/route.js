import { NextResponse } from 'next/server';

const GO2RTC_BASE_URL = 'http://localhost:1984';

/**
 * Proxy requests to go2rtc server to avoid CORS issues
 */
export async function POST(request) {
  let requestData;
  try {
    const body = await request.text();
    console.log('📨 Received request body:', body);
    
    if (!body || body.trim() === '') {
      console.error('❌ Empty request body');
      return NextResponse.json({
        success: false,
        error: 'Empty request body'
      }, { status: 400 });
    }
    
    requestData = JSON.parse(body);
  } catch (error) {
    console.error('❌ Invalid JSON in request:', error);
    return NextResponse.json({
      success: false,
      error: 'Invalid JSON in request'
    }, { status: 400 });
  }

  try {
    const { action, streamId, streamUrl, ...data } = requestData;

    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'Missing action parameter'
      }, { status: 400 });
    }

    let go2rtcUrl;
    let method = 'POST';
    let body = null;

    switch (action) {
      case 'addStream':
        if (!streamId || !streamUrl) {
          return NextResponse.json({
            success: false,
            error: 'Missing streamId or streamUrl for addStream'
          }, { status: 400 });
        }
        go2rtcUrl = `${GO2RTC_BASE_URL}/api/config`;
        method = 'PATCH';
        body = JSON.stringify({
          streams: {
            [streamId]: [streamUrl]
          }
        });
        break;

      case 'removeStream':
        if (!streamId) {
          return NextResponse.json({
            success: false,
            error: 'Missing streamId for removeStream'
          }, { status: 400 });
        }
        go2rtcUrl = `${GO2RTC_BASE_URL}/api/config`;
        method = 'PATCH';
        body = JSON.stringify({
          streams: {
            [streamId]: null
          }
        });
        break;

      case 'webrtc':
        if (!streamId || !data.offer) {
          return NextResponse.json({
            success: false,
            error: 'Missing streamId or offer for webrtc'
          }, { status: 400 });
        }
        go2rtcUrl = `${GO2RTC_BASE_URL}/api/webrtc?src=${streamId}`;
        method = 'POST';
        body = JSON.stringify(data.offer);
        break;

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`
        }, { status: 400 });
    }

    console.log(`🔄 Proxying ${action} to go2rtc:`, go2rtcUrl);

    const response = await fetch(go2rtcUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body
    });

    let result;
    const contentType = response.headers.get('Content-Type') || '';
    
    if (contentType.includes('application/json')) {
      result = await response.json();
    } else {
      result = await response.text();
    }

    if (!response.ok) {
      throw new Error(`go2rtc API error: ${response.status} ${response.statusText} - ${result}`);
    }
    
    return NextResponse.json({
      success: true,
      data: result,
      status: response.status
    });

  } catch (error) {
    console.error('❌ go2rtc proxy error:', error);
    console.error('Error details:', {
      action: requestData?.action || 'unknown',
      streamId: requestData?.streamId || 'unknown',
      error: error.message
    });
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * Get go2rtc server status
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint') || 'api';
    const src = searchParams.get('src');
    
    // Build the full URL with query parameters
    let go2rtcUrl = `${GO2RTC_BASE_URL}/${endpoint}`;
    if (src) {
      go2rtcUrl += `?src=${src}`;
    }
    
    console.log(`🔄 Proxying GET to go2rtc:`, go2rtcUrl);
    
    const response = await fetch(go2rtcUrl);
    
    if (!response.ok) {
      throw new Error(`go2rtc server error: ${response.status}`);
    }

    // For streaming endpoints, pipe the response directly
    if (endpoint.includes('hls') || endpoint.includes('mp4') || endpoint.includes('stream')) {
      return new Response(response.body, {
        status: response.status,
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    const data = await response.text();
    
    return NextResponse.json({
      success: true,
      data,
      status: response.status
    });

  } catch (error) {
    console.error('❌ go2rtc proxy GET failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      serverRunning: false
    }, { status: 500 });
  }
}
