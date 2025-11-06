const { Client, Databases, ID } = require('node-appwrite');
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
 * Simulate AI Detection Events for Testing
 * This demonstrates how real AI detection would integrate with the system
 */

const DETECTION_TYPES = {
  FACE: 'face',
  FALL: 'fall',
  THEFT: 'theft', 
  FIRE: 'fire',
  PERSON: 'person',
  VEHICLE: 'vehicle',
  INTRUSION: 'intrusion'
};

async function simulateAIDetections() {
  console.log('🤖 Simulating AI Detection Events...\n');

  try {
    // Get organisations and users
    const orgsResponse = await databases.listDocuments(DATABASE_ID, 'organizations');
    const usersResponse = await databases.listDocuments(DATABASE_ID, 'user_profiles');
    
    if (orgsResponse.documents.length === 0) {
      console.log('⚠ No organisations found. Please create organisations first.');
      return;
    }

    const sampleOrg = orgsResponse.documents.find(org => 
      usersResponse.documents.some(user => user.organizationId === org.$id)
    );

    if (!sampleOrg) {
      console.log('⚠ No organisation with users found.');
      return;
    }

    console.log(`Using organisation: ${sampleOrg.name} (${sampleOrg.$id})`);

    // Simulate various AI detection scenarios
    const detectionScenarios = [
      {
        type: DETECTION_TYPES.FALL,
        cameraId: 'camera-elderly-001',
        cameraName: 'Elderly Care Room Camera',
        confidence: 0.94,
        description: 'Elderly resident has fallen in bedroom - immediate assistance required',
        severity: 'critical',
        boundingBoxes: [{ x: 120, y: 200, width: 80, height: 150 }],
        metadata: {
          person_age_estimate: 'elderly',
          fall_duration: '3_seconds',
          movement_after_fall: 'none',
          emergency_response_required: true
        }
      },
      {
        type: DETECTION_TYPES.FIRE,
        cameraId: 'camera-kitchen-002',
        cameraName: 'Kitchen Safety Camera',
        confidence: 0.89,
        description: 'Fire detected in kitchen area - emergency services should be contacted',
        severity: 'critical',
        boundingBoxes: [{ x: 300, y: 150, width: 120, height: 200 }],
        metadata: {
          flame_size: 'medium',
          smoke_detected: true,
          temperature_anomaly: true,
          evacuation_recommended: true
        }
      },
      {
        type: DETECTION_TYPES.THEFT,
        cameraId: 'camera-retail-003',
        cameraName: 'Retail Store Camera',
        confidence: 0.82,
        description: 'Suspicious behaviour indicating potential shoplifting detected',
        severity: 'high',
        boundingBoxes: [{ x: 200, y: 100, width: 60, height: 180 }],
        metadata: {
          behaviour_pattern: 'concealment',
          item_interaction: 'prolonged',
          exit_attempt: 'without_payment',
          security_alert: true
        }
      },
      {
        type: DETECTION_TYPES.FACE,
        cameraId: 'camera-entrance-004',
        cameraName: 'Main Entrance Camera',
        confidence: 0.91,
        description: 'Unknown person detected at main entrance',
        severity: 'medium',
        boundingBoxes: [{ x: 150, y: 50, width: 100, height: 120 }],
        metadata: {
          face_quality: 'high',
          known_person_match: false,
          access_attempt: true,
          time_of_day: 'after_hours'
        }
      },
      {
        type: DETECTION_TYPES.INTRUSION,
        cameraId: 'camera-perimeter-005',
        cameraName: 'Perimeter Security Camera',
        confidence: 0.87,
        description: 'Unauthorised person detected in restricted area',
        severity: 'high',
        boundingBoxes: [{ x: 250, y: 180, width: 70, height: 160 }],
        metadata: {
          restricted_zone: 'high_security',
          time_of_intrusion: 'night',
          movement_pattern: 'suspicious',
          security_breach: true
        }
      }
    ];

    console.log('Creating AI detection events...\n');

    for (const scenario of detectionScenarios) {
      try {
        // Create detection event
        const detectionEvent = await databases.createDocument(
          DATABASE_ID,
          'detection_events',
          ID.unique(),
          {
            organizationId: sampleOrg.$id,
            cameraId: scenario.cameraId,
            cameraName: scenario.cameraName,
            detectionType: scenario.type,
            confidence: scenario.confidence,
            description: scenario.description,
            boundingBoxes: JSON.stringify(scenario.boundingBoxes),
            metadata: JSON.stringify(scenario.metadata),
            detectedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          }
        );

        console.log(`✅ ${getDetectionEmoji(scenario.type)} ${scenario.type.toUpperCase()} DETECTION`);
        console.log(`   Camera: ${scenario.cameraName}`);
        console.log(`   Confidence: ${Math.round(scenario.confidence * 100)}%`);
        console.log(`   Description: ${scenario.description}`);
        console.log(`   Event ID: ${detectionEvent.$id}\n`);

        // Create corresponding alert for high/critical severity
        if (scenario.severity === 'high' || scenario.severity === 'critical') {
          await databases.createDocument(
            DATABASE_ID,
            'alerts',
            ID.unique(),
            {
              organizationId: sampleOrg.$id,
              title: `${scenario.severity.toUpperCase()}: ${getDetectionName(scenario.type)}`,
              message: scenario.description,
              severity: scenario.severity,
              type: `${scenario.type}_detection`,
              cameraId: scenario.cameraId,
              eventId: detectionEvent.$id,
              createdAt: new Date().toISOString()
            }
          );
          console.log(`   🚨 Created ${scenario.severity} priority alert`);
        }

        // Create notifications for organisation users
        const orgUsers = usersResponse.documents.filter(user => user.organizationId === sampleOrg.$id);
        for (const user of orgUsers) {
          await databases.createDocument(
            DATABASE_ID,
            'notifications',
            ID.unique(),
            {
              userId: user.$id,
              organizationId: sampleOrg.$id,
              type: 'detection_event',
              title: `${getDetectionName(scenario.type)} Detected`,
              body: `${scenario.description} (${Math.round(scenario.confidence * 100)}% confidence)`,
              severity: scenario.severity,
              detectionType: scenario.type,
              eventId: detectionEvent.$id,
              createdAt: new Date().toISOString()
            }
          );
        }
        console.log(`   📱 Created notifications for ${orgUsers.length} users\n`);

        // Add delay between detections to simulate real-time
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Error creating ${scenario.type} detection:`, error.message);
      }
    }

    console.log('🎉 AI Detection simulation completed!\n');
    console.log('📊 Summary:');
    console.log(`   • ${detectionScenarios.length} detection events created`);
    console.log(`   • ${detectionScenarios.filter(s => s.severity === 'critical').length} critical alerts`);
    console.log(`   • ${detectionScenarios.filter(s => s.severity === 'high').length} high priority alerts`);
    console.log('\n💡 Check the Detection Events and Notifications pages to see the results!');

  } catch (error) {
    console.error('❌ Error simulating AI detections:', error);
  }
}

function getDetectionEmoji(type) {
  const emojiMap = {
    [DETECTION_TYPES.FALL]: '🚨',
    [DETECTION_TYPES.FIRE]: '🔥',
    [DETECTION_TYPES.THEFT]: '🚨',
    [DETECTION_TYPES.FACE]: '👤',
    [DETECTION_TYPES.INTRUSION]: '⚠️',
    [DETECTION_TYPES.PERSON]: '👥',
    [DETECTION_TYPES.VEHICLE]: '🚗'
  };
  return emojiMap[type] || '🔍';
}

function getDetectionName(type) {
  const nameMap = {
    [DETECTION_TYPES.FALL]: 'Fall Detection',
    [DETECTION_TYPES.FIRE]: 'Fire Detection',
    [DETECTION_TYPES.THEFT]: 'Theft Detection',
    [DETECTION_TYPES.FACE]: 'Face Detection',
    [DETECTION_TYPES.INTRUSION]: 'Intrusion Detection',
    [DETECTION_TYPES.PERSON]: 'Person Detection',
    [DETECTION_TYPES.VEHICLE]: 'Vehicle Detection'
  };
  return nameMap[type] || 'Unknown Detection';
}

// Run the simulation
simulateAIDetections();
