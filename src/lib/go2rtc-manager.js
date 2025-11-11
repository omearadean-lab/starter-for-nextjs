/**
 * go2rtc Stream Management Service
 * Dynamically manages camera streams with go2rtc server
 */

export class Go2RTCManager {
  constructor(useProxy = true) {
    this.useProxy = useProxy;
    this.baseUrl = useProxy ? '/api/go2rtc-proxy' : 'http://localhost:1984';
  }

  /**
   * Generate unique stream ID for multi-tenant system
   */
  generateStreamId(organizationId, cameraId, cameraName) {
    // Format: org_{orgId}_{cameraId}_{sanitized_name}
    const sanitizedName = cameraName.toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    
    return `org_${organizationId.slice(-8)}_${cameraId.slice(-8)}_${sanitizedName}`;
  }

  /**
   * Add camera stream to go2rtc
   */
  async addStream(camera) {
    try {
      const streamId = this.generateStreamId(
        camera.organizationId, 
        camera.$id, 
        camera.name
      );

      console.log(`📡 Adding stream to go2rtc: ${streamId}`);
      console.log(`🎥 Camera: ${camera.name} (${camera.protocol || 'rtsp'})`);
      console.log(`🔗 URL: ${camera.rtspUrl || camera.streamUrl}`);

      // Use the stream URL (should already be properly formatted by the form)
      let streamUrl = camera.streamUrl || camera.rtspUrl;
      
      // Fallback: Add protocol prefix if missing (for backward compatibility)
      if (!streamUrl.includes('://')) {
        const protocol = camera.protocol || 'rtsp';
        streamUrl = `${protocol}://${streamUrl}`;
      }

      console.log(`🔗 Stream URL: ${streamUrl}`);

      // Call go2rtc API via proxy or direct
      let response;
      if (this.useProxy) {
        response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'addStream',
            streamId,
            streamUrl
          })
        });
      } else {
        response = await fetch(`${this.baseUrl}/api/config`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            streams: {
              [streamId]: [streamUrl]
            }
          })
        });
      }

      if (!response.ok) {
        throw new Error(`go2rtc API error: ${response.status}`);
      }

      console.log(`✅ Stream added successfully: ${streamId}`);
      
      return {
        success: true,
        streamId,
        streamUrl
      };

    } catch (error) {
      console.error('❌ Failed to add stream to go2rtc:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Remove camera stream from go2rtc
   */
  async removeStream(camera) {
    try {
      const streamId = this.generateStreamId(
        camera.organizationId, 
        camera.$id, 
        camera.name
      );

      console.log(`🗑️ Removing stream from go2rtc: ${streamId}`);

      // Call go2rtc API via proxy or direct
      let response;
      if (this.useProxy) {
        response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'removeStream',
            streamId
          })
        });
      } else {
        response = await fetch(`${this.baseUrl}/api/config`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            streams: {
              [streamId]: null // null removes the stream
            }
          })
        });
      }

      if (!response.ok) {
        throw new Error(`go2rtc API error: ${response.status}`);
      }

      console.log(`✅ Stream removed successfully: ${streamId}`);
      
      return {
        success: true,
        streamId
      };

    } catch (error) {
      console.error('❌ Failed to remove stream from go2rtc:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update camera stream in go2rtc
   */
  async updateStream(camera) {
    // For updates, remove old stream and add new one
    await this.removeStream(camera);
    return await this.addStream(camera);
  }

  /**
   * Get stream URLs for a camera
   */
  getStreamUrls(camera) {
    const streamId = this.generateStreamId(
      camera.organizationId, 
      camera.$id, 
      camera.name
    );

    return {
      streamId,
      webrtc: `${this.baseUrl}/api/webrtc?src=${streamId}`,
      hls: `${this.baseUrl}/api/hls?src=${streamId}`,
      mp4: `${this.baseUrl}/api/stream.mp4?src=${streamId}`,
      mjpeg: `${this.baseUrl}/api/frame.jpeg?src=${streamId}`,
      webInterface: `${this.baseUrl}/`
    };
  }

  /**
   * Test stream connectivity
   */
  async testStream(camera) {
    try {
      const streamId = this.generateStreamId(
        camera.organizationId, 
        camera.$id, 
        camera.name
      );

      // First ensure stream is registered
      await this.addStream(camera);

      // Test WebRTC connection via proxy or direct
      let response;
      if (this.useProxy) {
        response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'testStream',
            streamId
          })
        });
      } else {
        response = await fetch(`${this.baseUrl}/api/webrtc?src=${streamId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'offer',
            sdp: 'test'
          })
        });
      }

      return {
        success: response.ok,
        streamId,
        status: response.status
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sync all organization cameras with go2rtc
   */
  async syncOrganizationCameras(cameras) {
    console.log(`🔄 Syncing ${cameras.length} cameras with go2rtc...`);
    
    const results = [];
    
    for (const camera of cameras) {
      if (camera.isActive && (camera.rtspUrl || camera.streamUrl)) {
        const result = await this.addStream(camera);
        results.push({
          camera: camera.name,
          ...result
        });
      }
    }

    console.log(`✅ Sync completed: ${results.filter(r => r.success).length}/${results.length} successful`);
    return results;
  }
}

// Export singleton instance
export const go2rtcManager = new Go2RTCManager();
