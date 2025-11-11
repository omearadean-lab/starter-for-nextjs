import { NextResponse } from 'next/server';
import { go2rtcManager } from '@/lib/go2rtc-manager';

/**
 * Test camera connection via go2rtc
 */
export async function POST(request) {
  try {
    const { streamUrl, protocol } = await request.json();

    if (!streamUrl) {
      return NextResponse.json({
        success: false,
        error: 'Stream URL is required'
      }, { status: 400 });
    }

    console.log(`🧪 Testing camera connection: ${protocol} - ${streamUrl}`);

    // Create a temporary camera object for testing
    const testCamera = {
      $id: 'test-camera',
      organizationId: 'test-org',
      name: 'Test Camera',
      streamUrl,
      rtspUrl: streamUrl,
      protocol: protocol || 'rtsp'
    };

    // Test the stream via go2rtc
    const result = await go2rtcManager.testStream(testCamera);

    if (result.success) {
      console.log(`✅ Camera test successful: ${result.streamId}`);
      
      // Clean up test stream
      setTimeout(async () => {
        try {
          await go2rtcManager.removeStream(testCamera);
          console.log('🧹 Test stream cleaned up');
        } catch (error) {
          console.warn('Failed to cleanup test stream:', error);
        }
      }, 5000);

      return NextResponse.json({
        success: true,
        message: 'Camera connection test successful',
        streamId: result.streamId,
        status: result.status
      });
    } else {
      console.log(`❌ Camera test failed: ${result.error}`);
      return NextResponse.json({
        success: false,
        error: result.error || 'Connection test failed'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Camera test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
