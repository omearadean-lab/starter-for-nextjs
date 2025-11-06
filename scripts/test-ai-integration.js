const { Client, Databases } = require('node-appwrite');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          process.env[key.trim()] = value;
        }
      }
    });
  }
}

// Load environment variables
loadEnvFile();

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = "690c79cc0014c7d18c28";

/**
 * Test AI Integration with Camera System
 * Demonstrates how to start AI processing for cameras
 */

async function testAIIntegration() {
  console.log('🤖 Testing AI Integration with Camera System...\n');

  try {
    // Get organisations and cameras
    const orgsResponse = await databases.listDocuments(DATABASE_ID, 'organizations');
    
    if (orgsResponse.documents.length === 0) {
      console.log('⚠ No organisations found. Please create organisations first.');
      return;
    }

    const sampleOrg = orgsResponse.documents[0];
    console.log(`Using organisation: ${sampleOrg.name} (${sampleOrg.$id})\n`);

    // Simulate camera configurations
    const cameraConfigs = [
      {
        id: 'ai-camera-001',
        name: 'Elderly Care Room Camera',
        organizationId: sampleOrg.$id,
        location: 'Bedroom 1',
        type: 'indoor',
        aiEnabled: true,
        detectionTypes: ['fall', 'face']
      },
      {
        id: 'ai-camera-002', 
        name: 'Kitchen Safety Camera',
        organizationId: sampleOrg.$id,
        location: 'Kitchen',
        type: 'indoor',
        aiEnabled: true,
        detectionTypes: ['fire', 'person']
      },
      {
        id: 'ai-camera-003',
        name: 'Retail Store Camera',
        organizationId: sampleOrg.$id,
        location: 'Shop Floor',
        type: 'indoor',
        aiEnabled: true,
        detectionTypes: ['theft', 'face']
      },
      {
        id: 'ai-camera-004',
        name: 'Perimeter Security Camera',
        organizationId: sampleOrg.$id,
        location: 'Main Entrance',
        type: 'outdoor',
        aiEnabled: true,
        detectionTypes: ['intrusion', 'face', 'vehicle']
      }
    ];

    console.log('📹 Camera Configurations:');
    cameraConfigs.forEach(camera => {
      console.log(`  • ${camera.name} (${camera.location})`);
      console.log(`    Detection Types: ${camera.detectionTypes.join(', ')}`);
    });
    console.log('');

    // Simulate starting AI processing
    console.log('🚀 Starting AI Processing Simulation...\n');

    // Create sample cameras in database
    for (const cameraConfig of cameraConfigs) {
      try {
        await databases.createDocument(
          DATABASE_ID,
          'cctv_cameras',
          cameraConfig.id,
          {
            organizationId: cameraConfig.organizationId,
            name: cameraConfig.name,
            location: cameraConfig.location,
            rtspUrl: `rtsp://demo-camera-${cameraConfig.id}:554/stream`,
            status: 'online',
            enabledDetections: JSON.stringify(cameraConfig.detectionTypes),
            lastSeen: new Date().toISOString(),
            createdAt: new Date().toISOString()
          }
        );
        console.log(`✅ Created camera: ${cameraConfig.name}`);
      } catch (error) {
        if (error.code === 409) {
          console.log(`ℹ️ Camera already exists: ${cameraConfig.name}`);
        } else {
          console.error(`❌ Error creating camera ${cameraConfig.name}:`, error.message);
        }
      }
    }

    console.log('\n🔍 Simulating AI Detection Processing...\n');

    // Simulate AI detection scenarios
    const detectionScenarios = [
      {
        cameraId: 'ai-camera-001',
        cameraName: 'Elderly Care Room Camera',
        detectionType: 'fall',
        confidence: 0.92,
        description: 'Elderly person has fallen in bedroom - immediate assistance required',
        severity: 'critical'
      },
      {
        cameraId: 'ai-camera-002',
        cameraName: 'Kitchen Safety Camera', 
        detectionType: 'fire',
        confidence: 0.87,
        description: 'Smoke and flames detected in kitchen area',
        severity: 'critical'
      },
      {
        cameraId: 'ai-camera-003',
        cameraName: 'Retail Store Camera',
        detectionType: 'theft',
        confidence: 0.79,
        description: 'Customer concealing items without payment',
        severity: 'high'
      },
      {
        cameraId: 'ai-camera-004',
        cameraName: 'Perimeter Security Camera',
        detectionType: 'intrusion',
        confidence: 0.84,
        description: 'Unauthorised person detected in restricted area',
        severity: 'high'
      }
    ];

    // Process each detection scenario
    for (const scenario of detectionScenarios) {
      console.log(`🚨 ${getDetectionEmoji(scenario.detectionType)} AI DETECTION ALERT`);
      console.log(`   Camera: ${scenario.cameraName}`);
      console.log(`   Type: ${scenario.detectionType.toUpperCase()}`);
      console.log(`   Confidence: ${Math.round(scenario.confidence * 100)}%`);
      console.log(`   Severity: ${scenario.severity.toUpperCase()}`);
      console.log(`   Description: ${scenario.description}`);

      // Create detection event
      try {
        const detectionEvent = await databases.createDocument(
          DATABASE_ID,
          'detection_events',
          `ai-detection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          {
            organizationId: sampleOrg.$id,
            cameraId: scenario.cameraId,
            cameraName: scenario.cameraName,
            detectionType: scenario.detectionType,
            confidence: scenario.confidence,
            description: scenario.description,
            metadata: JSON.stringify({
              ai_provider: 'openai_vision',
              severity: scenario.severity,
              processing_method: 'real_time_analysis',
              detection_timestamp: new Date().toISOString()
            }),
            detectedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          }
        );

        console.log(`   ✅ Created detection event: ${detectionEvent.$id}`);

        // Create alert for high/critical severity
        if (scenario.severity === 'high' || scenario.severity === 'critical') {
          const alert = await databases.createDocument(
            DATABASE_ID,
            'alerts',
            `ai-alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            {
              organizationId: sampleOrg.$id,
              cameraId: scenario.cameraId,
              cameraName: scenario.cameraName,
              alertType: `${scenario.detectionType}_detection`,
              severity: scenario.severity,
              description: scenario.description,
              confidence: scenario.confidence,
              location: 'AI Detection System',
              createdAt: new Date().toISOString()
            }
          );
          console.log(`   🚨 Created ${scenario.severity} priority alert: ${alert.$id}`);
        }

        // Create notifications
        const usersResponse = await databases.listDocuments(DATABASE_ID, 'user_profiles');
        const orgUsers = usersResponse.documents.filter(user => user.organizationId === sampleOrg.$id);

        for (const user of orgUsers) {
          await databases.createDocument(
            DATABASE_ID,
            'notifications',
            `ai-notification-${Date.now()}-${user.$id}-${Math.random().toString(36).substr(2, 5)}`,
            {
              userId: user.$id,
              organizationId: sampleOrg.$id,
              type: 'detection_event',
              title: `AI Detection: ${getDetectionName(scenario.detectionType)}`,
              body: `${scenario.description} (${Math.round(scenario.confidence * 100)}% confidence)`,
              severity: scenario.severity,
              detectionType: scenario.detectionType,
              eventId: detectionEvent.$id,
              createdAt: new Date().toISOString()
            }
          );
        }
        console.log(`   📱 Created notifications for ${orgUsers.length} users`);

      } catch (error) {
        console.error(`   ❌ Error processing detection:`, error.message);
      }

      console.log(''); // Empty line for readability
      
      // Add delay between detections
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('🎉 AI Integration Test Completed!\n');
    console.log('📊 Summary:');
    console.log(`   • ${cameraConfigs.length} AI-enabled cameras configured`);
    console.log(`   • ${detectionScenarios.length} AI detection events processed`);
    console.log(`   • ${detectionScenarios.filter(s => s.severity === 'critical').length} critical alerts generated`);
    console.log(`   • ${detectionScenarios.filter(s => s.severity === 'high').length} high priority alerts generated`);
    console.log('\n💡 Integration Points Demonstrated:');
    console.log('   ✅ Camera configuration with AI detection types');
    console.log('   ✅ Real-time AI processing simulation');
    console.log('   ✅ Detection event creation and storage');
    console.log('   ✅ Automatic alert generation for critical events');
    console.log('   ✅ User notification system integration');
    console.log('   ✅ Severity-based response handling');
    console.log('\n🔗 Next Steps for Production:');
    console.log('   1. Connect to real camera streams (RTSP/HTTP)');
    console.log('   2. Integrate with chosen AI provider (OpenAI/AWS/Google)');
    console.log('   3. Set up image storage for detection evidence');
    console.log('   4. Configure emergency response integrations');
    console.log('   5. Implement real-time dashboard updates');

  } catch (error) {
    console.error('❌ Error testing AI integration:', error);
  }
}

function getDetectionEmoji(type) {
  const emojiMap = {
    fall: '🚨',
    fire: '🔥', 
    theft: '🚨',
    face: '👤',
    intrusion: '⚠️',
    person: '👥',
    vehicle: '🚗'
  };
  return emojiMap[type] || '🔍';
}

function getDetectionName(type) {
  const nameMap = {
    fall: 'Fall Detection',
    fire: 'Fire Detection',
    theft: 'Theft Detection',
    face: 'Face Detection',
    intrusion: 'Intrusion Detection',
    person: 'Person Detection',
    vehicle: 'Vehicle Detection'
  };
  return nameMap[type] || 'Unknown Detection';
}

// Run the test
testAIIntegration();
