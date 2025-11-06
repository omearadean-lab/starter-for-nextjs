import { aiDetectionService } from './aiDetection';
import OpenAIVisionProvider from './ai-providers/openai-vision';
import { storage, ID } from './appwrite';

/**
 * Camera AI Integration Service
 * Connects camera feeds with AI detection models
 */

export class CameraAIIntegration {
  constructor() {
    this.aiProvider = new OpenAIVisionProvider();
    this.processingQueue = new Map();
    this.isProcessing = false;
  }

  /**
   * Start AI processing for a camera feed
   */
  async startCameraAIProcessing(cameraConfig) {
    try {
      console.log(`🎥 Starting AI processing for camera: ${cameraConfig.name}`);
      
      // For demonstration, we'll simulate processing camera snapshots
      // In production, this would connect to actual camera streams
      const processingInterval = setInterval(async () => {
        await this.processCameraSnapshot(cameraConfig);
      }, 30000); // Process every 30 seconds

      this.processingQueue.set(cameraConfig.id, {
        config: cameraConfig,
        interval: processingInterval,
        lastProcessed: new Date()
      });

      return true;
    } catch (error) {
      console.error('Error starting camera AI processing:', error);
      return false;
    }
  }

  /**
   * Stop AI processing for a camera
   */
  stopCameraAIProcessing(cameraId) {
    const processing = this.processingQueue.get(cameraId);
    if (processing) {
      clearInterval(processing.interval);
      this.processingQueue.delete(cameraId);
      console.log(`⏹️ Stopped AI processing for camera: ${cameraId}`);
    }
  }

  /**
   * Process a single camera snapshot
   */
  async processCameraSnapshot(cameraConfig) {
    if (this.isProcessing) {
      console.log('AI processing already in progress, skipping...');
      return;
    }

    try {
      this.isProcessing = true;
      console.log(`🔍 Processing snapshot from ${cameraConfig.name}...`);

      // In a real implementation, you would:
      // 1. Capture frame from camera stream
      // 2. Convert to buffer
      // For demo, we'll simulate with a test image

      const imageBuffer = await this.captureFrameFromCamera(cameraConfig);
      if (!imageBuffer) {
        console.log('No frame captured, skipping processing');
        return;
      }

      // Perform AI analysis
      const analysisResult = await this.aiProvider.performSecurityAnalysis(imageBuffer);
      
      if (analysisResult.detections.length > 0) {
        console.log(`🚨 AI detected ${analysisResult.detections.length} events:`);
        
        // Process each detection
        for (const detection of analysisResult.detections) {
          await this.processDetectionResult(detection, cameraConfig, imageBuffer);
        }
      }

      // Update last processed time
      const processing = this.processingQueue.get(cameraConfig.id);
      if (processing) {
        processing.lastProcessed = new Date();
      }

    } catch (error) {
      console.error('Error processing camera snapshot:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Capture frame from camera (simulated for demo)
   */
  async captureFrameFromCamera(cameraConfig) {
    try {
      // In production, this would connect to actual camera streams:
      // - RTSP streams
      // - HTTP camera APIs
      // - WebRTC connections
      // - Camera SDK integrations

      // For demo purposes, we'll simulate different scenarios
      const scenarios = [
        { type: 'normal', probability: 0.7 },
        { type: 'fall', probability: 0.1 },
        { type: 'fire', probability: 0.05 },
        { type: 'theft', probability: 0.1 },
        { type: 'intrusion', probability: 0.05 }
      ];

      const random = Math.random();
      let cumulative = 0;
      let selectedScenario = 'normal';

      for (const scenario of scenarios) {
        cumulative += scenario.probability;
        if (random <= cumulative) {
          selectedScenario = scenario.type;
          break;
        }
      }

      // Return null for normal scenarios (no detection needed)
      if (selectedScenario === 'normal') {
        return null;
      }

      // For demo, create a simple test image buffer
      // In production, this would be actual camera frame data
      const testImageData = this.generateTestImageData(selectedScenario);
      return Buffer.from(testImageData, 'base64');

    } catch (error) {
      console.error('Error capturing camera frame:', error);
      return null;
    }
  }

  /**
   * Generate test image data for different scenarios
   */
  generateTestImageData(scenario) {
    // This is a minimal base64 image for demo purposes
    // In production, you'd have actual camera frame data
    const testImages = {
      fall: '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A',
      fire: '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A',
      theft: '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A',
      intrusion: '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A'
    };

    return testImages[scenario] || testImages.fall;
  }

  /**
   * Process detection result and integrate with CCTV system
   */
  async processDetectionResult(detection, cameraConfig, imageBuffer) {
    try {
      console.log(`  📊 Processing ${detection.detectionType} detection (${Math.round(detection.confidence * 100)}% confidence)`);

      // Save detection image to storage
      const imageUrl = await this.saveDetectionImage(imageBuffer, detection, cameraConfig);

      // Create detection event using existing AI detection service
      const detectionEvent = await aiDetectionService.processDetection({
        cameraId: cameraConfig.id,
        cameraName: cameraConfig.name,
        detectionType: detection.detectionType,
        confidence: detection.confidence,
        boundingBoxes: detection.boundingBoxes,
        imageUrl: imageUrl,
        organizationId: cameraConfig.organizationId,
        metadata: {
          ...detection.metadata,
          ai_provider: 'openai_vision',
          camera_location: cameraConfig.location,
          processing_timestamp: new Date().toISOString()
        }
      });

      if (detectionEvent) {
        console.log(`  ✅ Created detection event: ${detectionEvent.$id}`);
        
        // Handle critical detections
        if (detection.severity === 'critical') {
          await this.handleCriticalDetection(detection, cameraConfig, detectionEvent);
        }
      }

    } catch (error) {
      console.error('Error processing detection result:', error);
    }
  }

  /**
   * Save detection image to Appwrite storage
   */
  async saveDetectionImage(imageBuffer, detection, cameraConfig) {
    try {
      const fileName = `detection_${cameraConfig.id}_${detection.detectionType}_${Date.now()}.jpg`;
      
      const file = await storage.createFile(
        'detection-images', // bucket ID
        ID.unique(),
        imageBuffer,
        [
          // Set appropriate permissions
          'read("any")'
        ]
      );

      const imageUrl = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/v1/storage/buckets/detection-images/files/${file.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
      
      console.log(`  💾 Saved detection image: ${fileName}`);
      return imageUrl;

    } catch (error) {
      console.error('Error saving detection image:', error);
      return null;
    }
  }

  /**
   * Handle critical detections that require immediate action
   */
  async handleCriticalDetection(detection, cameraConfig, detectionEvent) {
    try {
      console.log(`🚨 CRITICAL DETECTION: ${detection.detectionType} at ${cameraConfig.name}`);

      // Send immediate notifications
      // In production, this could:
      // - Send SMS alerts
      // - Call emergency services
      // - Trigger alarm systems
      // - Send push notifications to security staff

      switch (detection.detectionType) {
        case 'fall':
          console.log('  📞 Fall detected - Consider contacting emergency services');
          break;
        case 'fire':
          console.log('  🔥 Fire detected - Contact fire brigade immediately');
          break;
        case 'theft':
          console.log('  🚨 Theft detected - Alert security personnel');
          break;
        case 'intrusion':
          console.log('  ⚠️ Intrusion detected - Security response required');
          break;
      }

    } catch (error) {
      console.error('Error handling critical detection:', error);
    }
  }

  /**
   * Get processing status for all cameras
   */
  getProcessingStatus() {
    const status = [];
    
    for (const [cameraId, processing] of this.processingQueue) {
      status.push({
        cameraId: cameraId,
        cameraName: processing.config.name,
        isActive: true,
        lastProcessed: processing.lastProcessed,
        location: processing.config.location
      });
    }

    return status;
  }

  /**
   * Start AI processing for multiple cameras
   */
  async startMultipleCameras(cameraConfigs) {
    const results = [];
    
    for (const config of cameraConfigs) {
      const result = await this.startCameraAIProcessing(config);
      results.push({
        cameraId: config.id,
        success: result
      });
    }

    return results;
  }

  /**
   * Stop all AI processing
   */
  stopAllProcessing() {
    const cameraIds = Array.from(this.processingQueue.keys());
    
    for (const cameraId of cameraIds) {
      this.stopCameraAIProcessing(cameraId);
    }

    console.log(`⏹️ Stopped AI processing for ${cameraIds.length} cameras`);
  }
}

export const cameraAIIntegration = new CameraAIIntegration();
export default CameraAIIntegration;
