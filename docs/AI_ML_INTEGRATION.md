# AI/ML Model Integration Guide

This guide explains how to integrate real AI/ML models with the CCTV monitoring system for Face, Fall, Theft, and Fire detection.

## Integration Architecture

```
Camera Feed → AI Processing → Detection Results → CCTV System → Alerts/Notifications
```

## 1. Cloud-Based AI Services (Recommended for Production)

### AWS Rekognition Integration
```javascript
// src/lib/ai-providers/aws-rekognition.js
import AWS from 'aws-sdk';

const rekognition = new AWS.Rekognition({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

export class AWSRekognitionProvider {
  async detectFaces(imageBuffer) {
    try {
      const params = {
        Image: { Bytes: imageBuffer },
        Attributes: ['ALL']
      };
      
      const result = await rekognition.detectFaces(params).promise();
      
      return {
        detectionType: 'face',
        confidence: result.FaceDetails[0]?.Confidence / 100 || 0,
        boundingBoxes: result.FaceDetails.map(face => ({
          x: face.BoundingBox.Left * imageWidth,
          y: face.BoundingBox.Top * imageHeight,
          width: face.BoundingBox.Width * imageWidth,
          height: face.BoundingBox.Height * imageHeight
        })),
        metadata: {
          emotions: result.FaceDetails[0]?.Emotions,
          ageRange: result.FaceDetails[0]?.AgeRange,
          gender: result.FaceDetails[0]?.Gender
        }
      };
    } catch (error) {
      console.error('AWS Rekognition error:', error);
      throw error;
    }
  }

  async compareFaces(sourceImage, targetImage) {
    const params = {
      SourceImage: { Bytes: sourceImage },
      TargetImage: { Bytes: targetImage },
      SimilarityThreshold: 80
    };
    
    const result = await rekognition.compareFaces(params).promise();
    return result.FaceMatches.length > 0;
  }
}
```

### Google Cloud Vision API
```javascript
// src/lib/ai-providers/google-vision.js
import vision from '@google-cloud/vision';

const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

export class GoogleVisionProvider {
  async detectObjects(imageBuffer) {
    try {
      const [result] = await client.objectLocalization({
        image: { content: imageBuffer }
      });
      
      const objects = result.localizedObjectAnnotations;
      
      // Detect potential theft scenarios
      const suspiciousObjects = objects.filter(obj => 
        ['Person', 'Handbag', 'Backpack', 'Suitcase'].includes(obj.name)
      );
      
      if (this.isTheftBehaviour(suspiciousObjects)) {
        return {
          detectionType: 'theft',
          confidence: 0.75,
          boundingBoxes: suspiciousObjects.map(obj => ({
            x: obj.boundingPoly.normalizedVertices[0].x * imageWidth,
            y: obj.boundingPoly.normalizedVertices[0].y * imageHeight,
            width: (obj.boundingPoly.normalizedVertices[2].x - obj.boundingPoly.normalizedVertices[0].x) * imageWidth,
            height: (obj.boundingPoly.normalizedVertices[2].y - obj.boundingPoly.normalizedVertices[0].y) * imageHeight
          })),
          metadata: {
            objects: suspiciousObjects.map(obj => obj.name),
            behaviour_pattern: 'suspicious_object_interaction'
          }
        };
      }
      
      return null;
    } catch (error) {
      console.error('Google Vision error:', error);
      throw error;
    }
  }
  
  isTheftBehaviour(objects) {
    // Custom logic to detect theft patterns
    const personCount = objects.filter(obj => obj.name === 'Person').length;
    const bagCount = objects.filter(obj => ['Handbag', 'Backpack', 'Suitcase'].includes(obj.name)).length;
    
    return personCount > 0 && bagCount > personCount;
  }
}
```

## 2. Custom AI Models (TensorFlow/PyTorch)

### TensorFlow.js Integration (Browser-based)
```javascript
// src/lib/ai-providers/tensorflow.js
import * as tf from '@tensorflow/tfjs';

export class TensorFlowProvider {
  constructor() {
    this.models = {};
  }
  
  async loadModels() {
    try {
      // Load pre-trained models
      this.models.fallDetection = await tf.loadLayersModel('/models/fall-detection/model.json');
      this.models.fireDetection = await tf.loadLayersModel('/models/fire-detection/model.json');
      this.models.faceDetection = await tf.loadLayersModel('/models/face-detection/model.json');
      
      console.log('AI models loaded successfully');
    } catch (error) {
      console.error('Error loading AI models:', error);
    }
  }
  
  async detectFall(videoFrame) {
    if (!this.models.fallDetection) return null;
    
    try {
      // Preprocess video frame
      const tensor = tf.browser.fromPixels(videoFrame)
        .resizeNearestNeighbor([224, 224])
        .expandDims(0)
        .div(255.0);
      
      // Run inference
      const prediction = await this.models.fallDetection.predict(tensor).data();
      const confidence = prediction[0];
      
      tensor.dispose();
      
      if (confidence > 0.8) {
        return {
          detectionType: 'fall',
          confidence: confidence,
          boundingBoxes: await this.extractBoundingBoxes(videoFrame, 'person'),
          metadata: {
            fall_confidence: confidence,
            detection_method: 'pose_estimation',
            timestamp: new Date().toISOString()
          }
        };
      }
      
      return null;
    } catch (error) {
      console.error('Fall detection error:', error);
      return null;
    }
  }
  
  async detectFire(imageData) {
    if (!this.models.fireDetection) return null;
    
    try {
      const tensor = tf.browser.fromPixels(imageData)
        .resizeNearestNeighbor([256, 256])
        .expandDims(0)
        .div(255.0);
      
      const prediction = await this.models.fireDetection.predict(tensor).data();
      const fireConfidence = prediction[0];
      const smokeConfidence = prediction[1];
      
      tensor.dispose();
      
      const maxConfidence = Math.max(fireConfidence, smokeConfidence);
      
      if (maxConfidence > 0.7) {
        return {
          detectionType: 'fire',
          confidence: maxConfidence,
          boundingBoxes: await this.extractFireRegions(imageData),
          metadata: {
            fire_confidence: fireConfidence,
            smoke_confidence: smokeConfidence,
            detection_method: 'cnn_classification'
          }
        };
      }
      
      return null;
    } catch (error) {
      console.error('Fire detection error:', error);
      return null;
    }
  }
}
```

### Python AI Service Integration
```python
# ai-service/detection_service.py
import cv2
import numpy as np
import tensorflow as tf
from flask import Flask, request, jsonify
import base64
from io import BytesIO
from PIL import Image

app = Flask(__name__)

class AIDetectionService:
    def __init__(self):
        self.load_models()
    
    def load_models(self):
        """Load all AI models"""
        self.fall_model = tf.keras.models.load_model('models/fall_detection.h5')
        self.fire_model = tf.keras.models.load_model('models/fire_detection.h5')
        self.face_model = cv2.CascadeClassifier('models/haarcascade_frontalface_default.xml')
        
    def detect_fall(self, frame_sequence):
        """Detect falls using pose estimation and temporal analysis"""
        # Preprocess frames
        processed_frames = self.preprocess_frames(frame_sequence)
        
        # Run inference
        prediction = self.fall_model.predict(processed_frames)
        confidence = float(prediction[0][0])
        
        if confidence > 0.85:
            return {
                'detection_type': 'fall',
                'confidence': confidence,
                'bounding_boxes': self.extract_person_boxes(frame_sequence[-1]),
                'metadata': {
                    'fall_type': 'forward' if prediction[0][1] > 0.5 else 'backward',
                    'severity': 'high' if confidence > 0.9 else 'medium'
                }
            }
        return None
    
    def detect_fire(self, image):
        """Detect fire and smoke using CNN"""
        # Preprocess image
        img_array = self.preprocess_image(image, target_size=(224, 224))
        
        # Run inference
        prediction = self.fire_model.predict(img_array)
        fire_conf = float(prediction[0][0])
        smoke_conf = float(prediction[0][1])
        
        max_conf = max(fire_conf, smoke_conf)
        
        if max_conf > 0.8:
            return {
                'detection_type': 'fire',
                'confidence': max_conf,
                'bounding_boxes': self.extract_fire_regions(image),
                'metadata': {
                    'fire_confidence': fire_conf,
                    'smoke_confidence': smoke_conf,
                    'alert_level': 'critical'
                }
            }
        return None
    
    def detect_theft(self, image_sequence):
        """Detect theft using behaviour analysis"""
        # Analyse behaviour patterns across image sequence
        behaviour_score = self.analyse_behaviour_patterns(image_sequence)
        
        if behaviour_score > 0.75:
            return {
                'detection_type': 'theft',
                'confidence': behaviour_score,
                'bounding_boxes': self.extract_person_boxes(image_sequence[-1]),
                'metadata': {
                    'behaviour_pattern': 'concealment',
                    'risk_level': 'high'
                }
            }
        return None

@app.route('/detect', methods=['POST'])
def detect():
    try:
        data = request.json
        image_data = base64.b64decode(data['image'])
        detection_type = data.get('type', 'all')
        
        # Convert to PIL Image
        image = Image.open(BytesIO(image_data))
        
        results = []
        
        if detection_type in ['all', 'fire']:
            fire_result = ai_service.detect_fire(image)
            if fire_result:
                results.append(fire_result)
        
        if detection_type in ['all', 'fall']:
            # For fall detection, you'd need video frames
            pass
            
        return jsonify({'detections': results})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

ai_service = AIDetectionService()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

## 3. Integration with CCTV System

### AI Processing Service
```javascript
// src/lib/ai-processing.js
import { aiDetectionService } from './aiDetection';
import { AWSRekognitionProvider } from './ai-providers/aws-rekognition';
import { GoogleVisionProvider } from './ai-providers/google-vision';
import { TensorFlowProvider } from './ai-providers/tensorflow';

export class AIProcessingService {
  constructor() {
    this.providers = {
      aws: new AWSRekognitionProvider(),
      google: new GoogleVisionProvider(),
      tensorflow: new TensorFlowProvider()
    };
    
    this.activeProvider = process.env.AI_PROVIDER || 'tensorflow';
  }
  
  async processVideoFrame(frameData, cameraInfo) {
    try {
      const provider = this.providers[this.activeProvider];
      const detections = [];
      
      // Run multiple detection types in parallel
      const [faceResult, fallResult, fireResult, theftResult] = await Promise.all([
        this.detectFaces(frameData, provider),
        this.detectFalls(frameData, provider),
        this.detectFire(frameData, provider),
        this.detectTheft(frameData, provider)
      ]);
      
      // Process each detection result
      for (const result of [faceResult, fallResult, fireResult, theftResult]) {
        if (result && result.confidence > 0.7) {
          // Send to AI detection service for processing
          const processedEvent = await aiDetectionService.processDetection({
            ...result,
            cameraId: cameraInfo.id,
            cameraName: cameraInfo.name,
            organizationId: cameraInfo.organizationId,
            imageUrl: await this.saveDetectionImage(frameData, result)
          });
          
          if (processedEvent) {
            detections.push(processedEvent);
          }
        }
      }
      
      return detections;
      
    } catch (error) {
      console.error('AI processing error:', error);
      return [];
    }
  }
  
  async detectFaces(frameData, provider) {
    if (provider.detectFaces) {
      return await provider.detectFaces(frameData);
    }
    return null;
  }
  
  async detectFalls(frameData, provider) {
    if (provider.detectFall) {
      return await provider.detectFall(frameData);
    }
    return null;
  }
  
  async detectFire(frameData, provider) {
    if (provider.detectFire) {
      return await provider.detectFire(frameData);
    }
    return null;
  }
  
  async detectTheft(frameData, provider) {
    if (provider.detectTheft) {
      return await provider.detectTheft(frameData);
    }
    return null;
  }
  
  async saveDetectionImage(frameData, detection) {
    // Save detection image to storage (Appwrite Storage)
    // Return URL for later reference
    try {
      const storage = new Storage(client);
      const file = await storage.createFile(
        'detection-images',
        ID.unique(),
        frameData
      );
      return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/v1/storage/buckets/detection-images/files/${file.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
    } catch (error) {
      console.error('Error saving detection image:', error);
      return null;
    }
  }
}

export const aiProcessingService = new AIProcessingService();
```

### Camera Integration
```javascript
// src/lib/camera-integration.js
import { aiProcessingService } from './ai-processing';

export class CameraIntegrationService {
  constructor() {
    this.activeStreams = new Map();
  }
  
  async startAIProcessing(cameraId, streamUrl) {
    try {
      // Create video element for processing
      const video = document.createElement('video');
      video.src = streamUrl;
      video.play();
      
      // Process frames at regular intervals
      const processInterval = setInterval(async () => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          // Capture frame
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0);
          
          // Convert to image data
          const imageData = canvas.toDataURL('image/jpeg');
          const frameBuffer = this.dataURLToBuffer(imageData);
          
          // Process with AI
          const detections = await aiProcessingService.processVideoFrame(
            frameBuffer,
            { id: cameraId, name: `Camera ${cameraId}`, organizationId: 'current-org' }
          );
          
          // Handle detections
          if (detections.length > 0) {
            console.log(`AI detected ${detections.length} events from camera ${cameraId}`);
          }
        }
      }, 5000); // Process every 5 seconds
      
      this.activeStreams.set(cameraId, { video, processInterval });
      
    } catch (error) {
      console.error('Error starting AI processing:', error);
    }
  }
  
  stopAIProcessing(cameraId) {
    const stream = this.activeStreams.get(cameraId);
    if (stream) {
      clearInterval(stream.processInterval);
      stream.video.pause();
      this.activeStreams.delete(cameraId);
    }
  }
  
  dataURLToBuffer(dataURL) {
    const base64 = dataURL.split(',')[1];
    return Buffer.from(base64, 'base64');
  }
}

export const cameraIntegrationService = new CameraIntegrationService();
```

## 4. Environment Configuration

```bash
# .env.local
# AI Provider Configuration
AI_PROVIDER=tensorflow  # or 'aws' or 'google'

# AWS Rekognition
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Google Cloud Vision
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# Custom AI Service
AI_SERVICE_URL=http://localhost:5000

# Detection Thresholds
FALL_DETECTION_THRESHOLD=0.85
FIRE_DETECTION_THRESHOLD=0.80
THEFT_DETECTION_THRESHOLD=0.75
FACE_DETECTION_THRESHOLD=0.90
```

## 5. Deployment Options

### Docker Deployment
```dockerfile
# Dockerfile.ai-service
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "detection_service.py"]
```

### Kubernetes Deployment
```yaml
# k8s-ai-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-detection-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-detection
  template:
    metadata:
      labels:
        app: ai-detection
    spec:
      containers:
      - name: ai-detection
        image: your-registry/ai-detection:latest
        ports:
        - containerPort: 5000
        env:
        - name: MODEL_PATH
          value: "/models"
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
```

## 6. Testing Integration

```javascript
// scripts/test-ai-integration.js
import { aiProcessingService } from '../src/lib/ai-processing';
import fs from 'fs';

async function testAIIntegration() {
  try {
    // Load test image
    const testImage = fs.readFileSync('test-images/fall-test.jpg');
    
    // Process with AI
    const detections = await aiProcessingService.processVideoFrame(
      testImage,
      {
        id: 'test-camera-001',
        name: 'Test Camera',
        organizationId: 'test-org'
      }
    );
    
    console.log('AI Detection Results:', detections);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAIIntegration();
```

## Next Steps

1. **Choose your AI provider** (AWS, Google, or custom models)
2. **Set up the AI processing service**
3. **Configure camera integration**
4. **Test with sample data**
5. **Deploy to production**

The system is designed to be modular - you can start with one provider and switch or add others as needed.
