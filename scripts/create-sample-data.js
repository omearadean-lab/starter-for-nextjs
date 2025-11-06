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

async function createSampleData() {
  console.log('🔧 Creating sample detection events and notifications...\n');

  try {
    // Get organizations and users
    const orgsResponse = await databases.listDocuments(DATABASE_ID, 'organizations');
    const organizations = orgsResponse.documents;
    const usersResponse = await databases.listDocuments(DATABASE_ID, 'user_profiles');
    
    if (organizations.length === 0) {
      console.log('⚠ No organizations found. Please create organizations first.');
      return;
    }

    // Find organization with users
    let sampleOrg = null;
    for (const org of organizations) {
      const orgUsers = usersResponse.documents.filter(user => user.organizationId === org.$id);
      if (orgUsers.length > 0) {
        sampleOrg = org;
        break;
      }
    }
    
    if (!sampleOrg) {
      sampleOrg = organizations[0]; // Fallback to first org
    }
    console.log(`Using organization: ${sampleOrg.name} (${sampleOrg.$id})`);
    const users = usersResponse.documents.filter(user => user.organizationId === sampleOrg.$id);
    
    if (users.length === 0) {
      console.log('⚠ No users found for this organization.');
      return;
    }

    const sampleUser = users[0];
    console.log(`Using user: ${sampleUser.name} (${sampleUser.$id})`);

    // Create sample detection events (using only existing attributes)
    const detectionEvents = [
      {
        organizationId: sampleOrg.$id,
        cameraId: 'camera-001',
        cameraName: 'Front Entrance Camera',
        detectionType: 'person',
        confidence: 0.95,
        description: 'Person detected at main entrance',
        detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        organizationId: sampleOrg.$id,
        cameraId: 'camera-002',
        cameraName: 'Parking Lot Camera',
        detectionType: 'vehicle',
        confidence: 0.88,
        description: 'Vehicle detected in restricted parking area',
        detectedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        reviewedBy: sampleUser.$id,
        reviewedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      },
      {
        organizationId: sampleOrg.$id,
        cameraId: 'camera-003',
        cameraName: 'Warehouse Camera',
        detectionType: 'motion',
        confidence: 0.72,
        description: 'Motion detected in warehouse area',
        detectedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        reviewedBy: sampleUser.$id,
        reviewedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
      },
      {
        organizationId: sampleOrg.$id,
        cameraId: 'camera-001',
        cameraName: 'Front Entrance Camera',
        detectionType: 'face',
        confidence: 0.91,
        description: 'Unknown face detected at entrance',
        personIdentified: 'Unknown Person',
        detectedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      },
      {
        organizationId: sampleOrg.$id,
        cameraId: 'camera-004',
        cameraName: 'Side Exit Camera',
        detectionType: 'intrusion',
        confidence: 0.97,
        description: 'Unauthorized access attempt detected',
        detectedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      }
    ];

    console.log('Creating sample detection events...');
    for (const event of detectionEvents) {
      try {
        await databases.createDocument(DATABASE_ID, 'detection_events', ID.unique(), event);
        console.log(`  ✓ Created ${event.detectionType} detection event`);
      } catch (error) {
        console.log(`  ✗ Error creating detection event:`, error.message);
      }
    }

    // Create sample notifications (using only existing attributes)
    const notifications = [
      {
        userId: sampleUser.$id,
        organizationId: sampleOrg.$id,
        type: 'alert',
        title: 'High Priority Security Alert',
        body: 'Unauthorized access attempt detected at Side Exit Camera',
        severity: 'high',
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        userId: sampleUser.$id,
        organizationId: sampleOrg.$id,
        type: 'detection_event',
        title: 'Person Detection',
        body: 'Person detected at Front Entrance Camera',
        detectionType: 'person',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        userId: sampleUser.$id,
        organizationId: sampleOrg.$id,
        type: 'detection_event',
        title: 'Face Recognition',
        body: 'Unknown face detected at entrance - requires review',
        detectionType: 'face',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      },
      {
        userId: sampleUser.$id,
        organizationId: sampleOrg.$id,
        type: 'system',
        title: 'System Update',
        body: 'Camera system maintenance completed successfully',
        readAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        userId: sampleUser.$id,
        organizationId: sampleOrg.$id,
        type: 'alert',
        title: 'Vehicle Alert',
        body: 'Vehicle detected in restricted parking area - confirmed by admin',
        severity: 'medium',
        readAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      }
    ];

    console.log('\nCreating sample notifications...');
    for (const notification of notifications) {
      try {
        await databases.createDocument(DATABASE_ID, 'notifications', ID.unique(), notification);
        console.log(`  ✓ Created ${notification.type} notification`);
      } catch (error) {
        console.log(`  ✗ Error creating notification:`, error.message);
      }
    }

    console.log('\n🎉 Sample data creation completed!');
    console.log('\n📋 Created:');
    console.log(`  • ${detectionEvents.length} detection events`);
    console.log(`  • ${notifications.length} notifications`);
    console.log('\n💡 You should now see data in Detection Events and Notifications pages.');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  }
}

createSampleData();
