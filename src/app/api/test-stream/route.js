/**
 * API endpoint to test stream URLs
 */

export async function POST(request) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return Response.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log(`🔍 Testing stream URL: ${url}`);

    // Test if the URL is accessible
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'CCTV-Monitor/1.0'
        }
      });

      clearTimeout(timeoutId);

      const result = {
        url,
        accessible: response.ok,
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
        server: response.headers.get('server'),
        timestamp: new Date().toISOString()
      };

      console.log(`✅ Stream test result:`, result);

      return Response.json({
        success: true,
        result
      });

    } catch (fetchError) {
      console.log(`❌ Stream test failed: ${fetchError.message}`);
      
      return Response.json({
        success: false,
        error: fetchError.message,
        url,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Stream test API error:', error);
    
    return Response.json({
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({
    message: 'Stream testing API',
    usage: 'POST with { "url": "http://camera-url" }'
  });
}
