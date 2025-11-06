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

// Missing attributes to add
const missingAttributes = {
  organizations: [
    { key: 'subscriptionPlan', type: 'string', size: 50, required: false, default: 'basic' },
    { key: 'maxCameras', type: 'integer', required: false, default: 10 },
    { key: 'maxUsers', type: 'integer', required: false, default: 5 },
    { key: 'isActive', type: 'boolean', required: false, default: true },
    { key: 'settings', type: 'string', size: 2000, required: false },
    { key: 'createdAt', type: 'datetime', required: true }
  ],
  users: [
    { key: 'isActive', type: 'boolean', required: false, default: true }
  ],
  cctv_cameras: [
    { key: 'isActive', type: 'boolean', required: false, default: true },
    { key: 'status', type: 'string', size: 20, required: false, default: 'offline' },
    { key: 'resolution', type: 'string', size: 20, required: false, default: '1920x1080' },
    { key: 'frameRate', type: 'integer', required: false, default: 30 },
    { key: 'enabledDetections', type: 'string', size: 500, required: false },
    { key: 'alertThresholds', type: 'string', size: 1000, required: false },
    { key: 'createdAt', type: 'datetime', required: true },
    { key: 'lastSeen', type: 'datetime', required: true }
  ],
  alerts: [
    { key: 'isResolved', type: 'boolean', required: false, default: false },
    { key: 'resolvedBy', type: 'string', size: 36, required: false },
    { key: 'resolvedAt', type: 'datetime', required: false },
    { key: 'createdAt', type: 'datetime', required: true },
    { key: 'metadata', type: 'string', size: 2000, required: false }
  ],
  known_persons: [
    { key: 'isPersonOfInterest', type: 'boolean', required: false, default: false },
    { key: 'createdAt', type: 'datetime', required: true }
  ]
};

async function addMissingAttribute(collectionId, attr) {
  try {
    console.log(`  Adding missing attribute: ${attr.key} to ${collectionId}`);
    
    switch (attr.type) {
      case 'string':
        await databases.createStringAttribute(DATABASE_ID, collectionId, attr.key, attr.size, attr.required, attr.default);
        break;
      case 'integer':
        await databases.createIntegerAttribute(DATABASE_ID, collectionId, attr.key, attr.required, null, null, attr.default);
        break;
      case 'boolean':
        await databases.createBooleanAttribute(DATABASE_ID, collectionId, attr.key, attr.required, attr.default);
        break;
      case 'datetime':
        await databases.createDatetimeAttribute(DATABASE_ID, collectionId, attr.key, attr.required, attr.default);
        break;
    }
    
    console.log(`    ✓ Added ${attr.key}`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`    ⚠ Attribute ${attr.key} already exists`);
    } else {
      console.log(`    ✗ Error adding ${attr.key}: ${error.message}`);
    }
  }
}

async function createDemoData() {
  console.log('\n📝 Creating demo organization and user profiles...\n');
  
  // Demo organization
  const demoOrganization = {
    name: 'Demo Security Company',
    description: 'A demo organization for testing the CCTV monitoring system',
    contactEmail: 'contact@demosecurity.com',
    contactPhone: '+1-555-0123',
    address: '123 Security Street, Demo City, DC 12345',
    subscriptionPlan: 'professional',
    maxCameras: 50,
    maxUsers: 20,
    isActive: true,
    createdAt: new Date().toISOString(),
    settings: JSON.stringify({
      alertRetentionDays: 30,
      videoRetentionDays: 7,
      enableEmailAlerts: true,
      enableSMSAlerts: false,
      enablePushNotifications: true
    })
  };
  
  // Create demo organization
  try {
    await databases.createDocument(
      DATABASE_ID,
      'organizations',
      'demo-org-001',
      demoOrganization
    );
    console.log('✓ Created demo organization');
  } catch (error) {
    if (error.code === 409) {
      console.log('⚠ Demo organization already exists');
    } else {
      console.log('✗ Error creating demo organization:', error.message);
    }
  }
  
  // Create user profiles for existing auth users
  const userProfiles = [
    {
      id: 'super-admin-001',
      email: 'admin@cctv.com',
      name: 'Super Administrator',
      role: 'super_admin',
      organizationId: null,
      createdAt: new Date().toISOString(),
      isActive: true
    },
    {
      id: 'org-admin-001',
      email: 'orgadmin@company.com',
      name: 'Organization Admin',
      role: 'org_admin',
      organizationId: 'demo-org-001',
      createdAt: new Date().toISOString(),
      isActive: true
    },
    {
      id: 'user-001',
      email: 'user@company.com',
      name: 'Regular User',
      role: 'user',
      organizationId: 'demo-org-001',
      createdAt: new Date().toISOString(),
      isActive: true
    }
  ];
  
  for (const profile of userProfiles) {
    try {
      const { id, ...profileData } = profile;
      await databases.createDocument(
        DATABASE_ID,
        'users',
        id,
        profileData
      );
      console.log(`✓ Created user profile: ${profile.email}`);
    } catch (error) {
      if (error.code === 409) {
        console.log(`⚠ User profile ${profile.email} already exists`);
      } else {
        console.log(`✗ Error creating user profile ${profile.email}:`, error.message);
      }
    }
  }
}

async function fixCollections() {
  console.log('🔧 Adding missing attributes to existing collections...\n');
  
  for (const [collectionId, attributes] of Object.entries(missingAttributes)) {
    console.log(`Checking collection: ${collectionId}`);
    
    for (const attr of attributes) {
      await addMissingAttribute(collectionId, attr);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('');
  }
  
  console.log('✅ Finished adding missing attributes!');
  
  // Create demo data
  await createDemoData();
  
  console.log('\n🎉 Setup completed successfully!');
}

// Run if called directly
if (require.main === module) {
  fixCollections();
}

module.exports = { fixCollections };
