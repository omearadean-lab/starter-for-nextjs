import { NextResponse } from 'next/server';
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { go2rtcManager } from '@/lib/go2rtc-manager';
import { Query } from 'appwrite';

/**
 * Sync all cameras from database with go2rtc
 * Useful for startup or when go2rtc server restarts
 */
export async function POST(request) {
  try {
    console.log('🔄 Starting camera sync with go2rtc...');

    // Get organization ID from request (optional - if not provided, sync all)
    const { organizationId } = await request.json().catch(() => ({}));

    let query = [];
    if (organizationId) {
      query.push(Query.equal('organizationId', organizationId));
      console.log(`📋 Syncing cameras for organization: ${organizationId}`);
    } else {
      console.log('📋 Syncing all cameras across all organizations');
    }

    // Get all active cameras
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.CCTV_CAMERAS,
      [
        Query.equal('isActive', true),
        ...query
      ]
    );

    const cameras = response.documents;
    console.log(`📊 Found ${cameras.length} active cameras to sync`);

    if (cameras.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No cameras to sync',
        synced: 0,
        total: 0
      });
    }

    // Sync cameras with go2rtc
    const results = await go2rtcManager.syncOrganizationCameras(cameras);
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success);

    console.log(`✅ Sync completed: ${successful}/${cameras.length} successful`);
    
    if (failed.length > 0) {
      console.log('❌ Failed cameras:', failed.map(f => f.camera));
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${successful}/${cameras.length} cameras`,
      synced: successful,
      total: cameras.length,
      failed: failed.length > 0 ? failed : undefined,
      results
    });

  } catch (error) {
    console.error('❌ Camera sync failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * Get sync status and camera count
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    let query = [];
    if (organizationId) {
      query.push(Query.equal('organizationId', organizationId));
    }

    // Get camera counts
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.CCTV_CAMERAS,
      [
        Query.equal('isActive', true),
        ...query
      ]
    );

    const cameras = response.documents;
    const streamingCameras = cameras.filter(c => c.rtspUrl || c.streamUrl);

    return NextResponse.json({
      success: true,
      totalCameras: cameras.length,
      streamingCameras: streamingCameras.length,
      organizationId: organizationId || 'all',
      cameras: cameras.map(c => ({
        id: c.$id,
        name: c.name,
        protocol: c.protocol,
        hasStream: !!(c.rtspUrl || c.streamUrl),
        streamId: go2rtcManager.generateStreamId(c.organizationId, c.$id, c.name)
      }))
    });

  } catch (error) {
    console.error('❌ Failed to get sync status:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
