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

loadEnvFile();

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = "690c79cc0014c7d18c28";

// Demo cameras data
const demoCameras = [
  {
    id: 'camera-001',
    name: 'Main Entrance Camera',
    location: 'Main Entrance',
    rtspUrl: 'rtsp://demo.camera.com/main-entrance',
    organizationId: 'demo-org-001',
    isActive: true,
    status: 'online',
    resolution: '1920x1080',
    frameRate: 30,
    enabledDetections: JSON.stringify(['shoplifting', 'fall_detection', 'face_recognition']),
    alertThresholds: JSON.stringify({
      confidenceLevel: 0.8,
      peopleCountThreshold: 15,
      motionSensitivity: 'medium'
    }),
    createdAt: new Date().toISOString(),
    lastSeen: new Date().toISOString()
  },
  {
    id: 'camera-002',
    name: 'Store Floor Camera 1',
    location: 'Store Floor - Aisle 1-3',
    rtspUrl: 'rtsp://demo.camera.com/store-floor-1',
    organizationId: 'demo-org-001',
    isActive: true,
    status: 'online',
    resolution: '1920x1080',
    frameRate: 25,
    enabledDetections: JSON.stringify(['shoplifting', 'people_count']),
    alertThresholds: JSON.stringify({
      confidenceLevel: 0.75,
      peopleCountThreshold: 20,
      motionSensitivity: 'high'
    }),
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    lastSeen: new Date().toISOString()
  },
  {
    id: 'camera-003',
    name: 'Emergency Exit Camera',
    location: 'Emergency Exit - Rear',
    rtspUrl: 'rtsp://demo.camera.com/emergency-exit',
    organizationId: 'demo-org-001',
    isActive: true,
    status: 'offline',
    resolution: '1280x720',
    frameRate: 20,
    enabledDetections: JSON.stringify(['fire_detection', 'fall_detection']),
    alertThresholds: JSON.stringify({
      confidenceLevel: 0.9,
      peopleCountThreshold: 5,
      motionSensitivity: 'low'
    }),
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    lastSeen: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
  }
];

// Demo alerts data
const demoAlerts = [
  {
    id: 'alert-001',
    organizationId: 'demo-org-001',
    cameraId: 'camera-001',
    cameraName: 'Main Entrance Camera',
    alertType: 'shoplifting',
    severity: 'high',
    description: 'Suspicious behavior detected - potential shoplifting activity',
    confidence: 0.87,
    imageUrl: null,
    videoUrl: null,
    location: 'Main Entrance',
    isResolved: false,
    resolvedBy: null,
    resolvedAt: null,
    createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    metadata: JSON.stringify({
      detectionCount: 3,
      duration: '45 seconds',
      personCount: 2
    })
  },
  {
    id: 'alert-002',
    organizationId: 'demo-org-001',
    cameraId: 'camera-002',
    cameraName: 'Store Floor Camera 1',
    alertType: 'people_count',
    severity: 'medium',
    description: 'High occupancy detected - 25 people in area',
    confidence: 0.95,
    imageUrl: null,
    videoUrl: null,
    location: 'Store Floor - Aisle 1-3',
    isResolved: true,
    resolvedBy: 'user-001',
    resolvedAt: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    metadata: JSON.stringify({
      maxCount: 25,
      threshold: 20,
      duration: '10 minutes'
    })
  },
  {
    id: 'alert-003',
    organizationId: 'demo-org-001',
    cameraId: 'camera-003',
    cameraName: 'Emergency Exit Camera',
    alertType: 'fire_detection',
    severity: 'critical',
    description: 'Smoke detected in emergency exit area',
    confidence: 0.92,
    imageUrl: null,
    videoUrl: null,
    location: 'Emergency Exit - Rear',
    isResolved: true,
    resolvedBy: 'org-admin-001',
    resolvedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    createdAt: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
    metadata: JSON.stringify({
      smokeLevel: 'moderate',
      temperature: 'elevated',
      responseTime: '5 minutes'
    })
  },
  {
    id: 'alert-004',
    organizationId: 'demo-org-001',
    cameraId: 'camera-001',
    cameraName: 'Main Entrance Camera',
    alertType: 'face_recognition',
    severity: 'high',
    description: 'Known person of interest detected',
    confidence: 0.94,
    imageUrl: null,
    videoUrl: null,
    location: 'Main Entrance',
    isResolved: false,
    resolvedBy: null,
    resolvedAt: null,
    createdAt: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
    metadata: JSON.stringify({
      personId: 'known-person-001',
      matchConfidence: 0.94,
      lastSeen: '2 weeks ago'
    })
  },
  {
    id: 'alert-005',
    organizationId: 'demo-org-001',
    cameraId: 'camera-002',
    cameraName: 'Store Floor Camera 1',
    alertType: 'fall_detection',
    severity: 'critical',
    description: 'Person fall detected - immediate assistance required',
    confidence: 0.89,
    imageUrl: null,
    videoUrl: null,
    location: 'Store Floor - Aisle 1-3',
    isResolved: false,
    resolvedBy: null,
    resolvedAt: null,
    createdAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    metadata: JSON.stringify({
      fallType: 'backward',
      personAge: 'elderly',
      responseNeeded: true
    })
  }
];

// Demo known persons
const demoKnownPersons = [
  {
    id: 'known-person-001',
    organizationId: 'demo-org-001',
    name: 'John Suspicious',
    description: 'Previously caught shoplifting. Banned from premises.',
    imageUrl: null,
    isPersonOfInterest: true,
    createdAt: new Date(Date.now() - 1209600000).toISOString() // 2 weeks ago
  },
  {
    id: 'known-person-002',
    organizationId: 'demo-org-001',
    name: 'Sarah Employee',
    description: 'Store manager - authorized access to all areas',
    imageUrl: null,
    isPersonOfInterest: false,
    createdAt: new Date(Date.now() - 2592000000).toISOString() // 1 month ago
  }
];

async function createDemoData() {
  console.log('🎭 Creating demo data for CCTV monitoring system...\n');

  try {
    // Create demo cameras
    console.log('📹 Creating demo cameras...');
    for (const camera of demoCameras) {
      try {
        const { id, ...cameraData } = camera;
        await databases.createDocument(
          DATABASE_ID,
          'cctv_cameras',
          id,
          cameraData
        );
        console.log(`✓ Created camera: ${camera.name}`);
      } catch (error) {
        if (error.code === 409) {
          console.log(`⚠ Camera ${camera.name} already exists`);
        } else {
          console.log(`✗ Error creating camera ${camera.name}:`, error.message);
        }
      }
    }

    // Create demo alerts
    console.log('\n🚨 Creating demo alerts...');
    for (const alert of demoAlerts) {
      try {
        const { id, ...alertData } = alert;
        await databases.createDocument(
          DATABASE_ID,
          'alerts',
          id,
          alertData
        );
        console.log(`✓ Created alert: ${alert.description.substring(0, 50)}...`);
      } catch (error) {
        if (error.code === 409) {
          console.log(`⚠ Alert already exists`);
        } else {
          console.log(`✗ Error creating alert:`, error.message);
        }
      }
    }

    // Create demo known persons
    console.log('\n👥 Creating demo known persons...');
    for (const person of demoKnownPersons) {
      try {
        const { id, ...personData } = person;
        await databases.createDocument(
          DATABASE_ID,
          'known_persons',
          id,
          personData
        );
        console.log(`✓ Created known person: ${person.name}`);
      } catch (error) {
        if (error.code === 409) {
          console.log(`⚠ Known person ${person.name} already exists`);
        } else {
          console.log(`✗ Error creating known person ${person.name}:`, error.message);
        }
      }
    }

    console.log('\n🎉 Demo data creation completed successfully!');
    console.log('\n📊 Demo data summary:');
    console.log(`- ${demoCameras.length} CCTV cameras (2 online, 1 offline)`);
    console.log(`- ${demoAlerts.length} security alerts (3 unresolved, 2 resolved)`);
    console.log(`- ${demoKnownPersons.length} known persons (1 person of interest)`);
    
    console.log('\n🎯 Alert breakdown:');
    console.log('- 1 Critical: Fall detection (unresolved)');
    console.log('- 1 Critical: Fire detection (resolved)');
    console.log('- 2 High: Shoplifting & Face recognition (unresolved)');
    console.log('- 1 Medium: People count (resolved)');

  } catch (error) {
    console.error('❌ Demo data creation failed:', error);
  }
}

// Run if called directly
if (require.main === module) {
  createDemoData();
}

module.exports = { createDemoData };
