const { Client, Databases, Users, ID, Permission, Role } = require('node-appwrite');
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

// Debug: Check if environment variables are loaded
console.log('🔍 Environment Variables Check:');
console.log('NEXT_PUBLIC_APPWRITE_ENDPOINT:', process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
console.log('NEXT_PUBLIC_APPWRITE_PROJECT_ID:', process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
console.log('APPWRITE_API_KEY:', process.env.APPWRITE_API_KEY ? `${process.env.APPWRITE_API_KEY.substring(0, 20)}...` : 'NOT SET');

// Validate required environment variables
if (!process.env.APPWRITE_API_KEY) {
  console.error('❌ APPWRITE_API_KEY is not set in .env file');
  console.error('Please add your API key to the .env file and try again.');
  process.exit(1);
}

// Initialize Appwrite client for server-side operations
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '690c7785003337dac829')
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const users = new Users(client);

const DATABASE_ID = "690c79cc0014c7d18c28";

// Collection schemas
const collections = {
  organizations: {
    name: 'organizations',
    attributes: [
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 1000, required: false },
      { key: 'contactEmail', type: 'email', required: true },
      { key: 'contactPhone', type: 'string', size: 20, required: false },
      { key: 'address', type: 'string', size: 500, required: false },
      { key: 'subscriptionPlan', type: 'string', size: 50, required: false, default: 'basic' },
      { key: 'maxCameras', type: 'integer', required: false, default: 10 },
      { key: 'maxUsers', type: 'integer', required: false, default: 5 },
      { key: 'isActive', type: 'boolean', required: false, default: true },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'settings', type: 'string', size: 2000, required: false } // JSON string
    ]
  },
  users: {
    name: 'users',
    attributes: [
      { key: 'email', type: 'email', required: true },
      { key: 'name', type: 'string', size: 128, required: true },
      { key: 'role', type: 'string', size: 50, required: true },
      { key: 'organizationId', type: 'string', size: 36, required: false },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'isActive', type: 'boolean', required: false, default: true }
    ]
  },
  cctv_cameras: {
    name: 'cctv_cameras',
    attributes: [
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'location', type: 'string', size: 255, required: true },
      { key: 'rtspUrl', type: 'url', required: true },
      { key: 'organizationId', type: 'string', size: 36, required: true },
      { key: 'isActive', type: 'boolean', required: false, default: true },
      { key: 'status', type: 'string', size: 20, required: false, default: 'offline' },
      { key: 'resolution', type: 'string', size: 20, required: false, default: '1920x1080' },
      { key: 'frameRate', type: 'integer', required: false, default: 30 },
      { key: 'enabledDetections', type: 'string', size: 500, required: false }, // JSON array
      { key: 'alertThresholds', type: 'string', size: 1000, required: false }, // JSON object
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'lastSeen', type: 'datetime', required: true }
    ]
  },
  alerts: {
    name: 'alerts',
    attributes: [
      { key: 'organizationId', type: 'string', size: 36, required: true },
      { key: 'cameraId', type: 'string', size: 36, required: true },
      { key: 'cameraName', type: 'string', size: 255, required: true },
      { key: 'alertType', type: 'string', size: 50, required: true },
      { key: 'severity', type: 'string', size: 20, required: true },
      { key: 'description', type: 'string', size: 500, required: true },
      { key: 'confidence', type: 'double', required: true },
      { key: 'imageUrl', type: 'url', required: false },
      { key: 'videoUrl', type: 'url', required: false },
      { key: 'location', type: 'string', size: 255, required: true },
      { key: 'isResolved', type: 'boolean', required: false, default: false },
      { key: 'resolvedBy', type: 'string', size: 36, required: false },
      { key: 'resolvedAt', type: 'datetime', required: false },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'metadata', type: 'string', size: 2000, required: false } // JSON object
    ]
  },
  detection_events: {
    name: 'detection_events',
    attributes: [
      { key: 'organizationId', type: 'string', size: 36, required: true },
      { key: 'cameraId', type: 'string', size: 36, required: true },
      { key: 'detectionType', type: 'string', size: 50, required: true },
      { key: 'confidence', type: 'double', required: true },
      { key: 'boundingBoxes', type: 'string', size: 2000, required: false }, // JSON array
      { key: 'imageUrl', type: 'url', required: false },
      { key: 'personId', type: 'string', size: 36, required: false },
      { key: 'peopleCount', type: 'integer', required: false },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'metadata', type: 'string', size: 2000, required: false } // JSON object
    ]
  },
  known_persons: {
    name: 'known_persons',
    attributes: [
      { key: 'organizationId', type: 'string', size: 36, required: true },
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 500, required: false },
      { key: 'imageUrl', type: 'url', required: false },
      { key: 'isPersonOfInterest', type: 'boolean', required: false, default: false },
      { key: 'createdAt', type: 'datetime', required: true }
    ]
  }
};

// Demo users data
const demoUsers = [
  {
    userId: 'super-admin-001',
    email: 'admin@cctv.com',
    password: 'password123',
    name: 'Super Administrator',
    role: 'super_admin',
    organizationId: null
  },
  {
    userId: 'org-admin-001',
    email: 'orgadmin@company.com',
    password: 'password123',
    name: 'Organization Admin',
    role: 'org_admin',
    organizationId: 'demo-org-001'
  },
  {
    userId: 'user-001',
    email: 'user@company.com',
    password: 'password123',
    name: 'Regular User',
    role: 'user',
    organizationId: 'demo-org-001'
  }
];

// Demo organization
const demoOrganization = {
  $id: 'demo-org-001',
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

async function createCollection(collectionId, schema) {
  try {
    console.log(`Creating collection: ${collectionId}`);
    
    // Create the collection
    await databases.createCollection(DATABASE_ID, collectionId, schema.name);
    
    // Add attributes
    for (const attr of schema.attributes) {
      console.log(`  Adding attribute: ${attr.key}`);
      
      switch (attr.type) {
        case 'string':
          await databases.createStringAttribute(DATABASE_ID, collectionId, attr.key, attr.size, attr.required, attr.default);
          break;
        case 'email':
          await databases.createEmailAttribute(DATABASE_ID, collectionId, attr.key, attr.required, attr.default);
          break;
        case 'url':
          await databases.createUrlAttribute(DATABASE_ID, collectionId, attr.key, attr.required, attr.default);
          break;
        case 'integer':
          await databases.createIntegerAttribute(DATABASE_ID, collectionId, attr.key, attr.required, null, null, attr.default);
          break;
        case 'double':
          await databases.createFloatAttribute(DATABASE_ID, collectionId, attr.key, attr.required, null, null, attr.default);
          break;
        case 'boolean':
          await databases.createBooleanAttribute(DATABASE_ID, collectionId, attr.key, attr.required, attr.default);
          break;
        case 'datetime':
          await databases.createDatetimeAttribute(DATABASE_ID, collectionId, attr.key, attr.required, attr.default);
          break;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`✓ Collection ${collectionId} created successfully`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`⚠ Collection ${collectionId} already exists`);
    } else {
      console.error(`✗ Error creating collection ${collectionId}:`, error.message);
    }
  }
}

async function createDemoUsers() {
  console.log('\nCreating demo users...');
  
  for (const userData of demoUsers) {
    try {
      // Create user in Auth
      const user = await users.create(
        userData.userId,
        userData.email,
        undefined, // phone
        userData.password,
        userData.name
      );
      
      console.log(`✓ Created user: ${userData.email}`);
      
      // Create user profile in database
      await databases.createDocument(
        DATABASE_ID,
        'users',
        userData.userId,
        {
          email: userData.email,
          name: userData.name,
          role: userData.role,
          organizationId: userData.organizationId,
          createdAt: new Date().toISOString(),
          isActive: true
        }
      );
      
      console.log(`✓ Created user profile: ${userData.email}`);
      
    } catch (error) {
      if (error.code === 409) {
        console.log(`⚠ User ${userData.email} already exists`);
      } else {
        console.error(`✗ Error creating user ${userData.email}:`, error.message);
      }
    }
  }
}

async function createDemoOrganization() {
  console.log('\nCreating demo organization...');
  
  try {
    await databases.createDocument(
      DATABASE_ID,
      'organizations',
      demoOrganization.$id,
      demoOrganization
    );
    
    console.log(`✓ Created organization: ${demoOrganization.name}`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`⚠ Organization ${demoOrganization.name} already exists`);
    } else {
      console.error(`✗ Error creating organization:`, error.message);
    }
  }
}

async function setupAppwrite() {
  console.log('🚀 Setting up Appwrite database and demo data...\n');
  
  try {
    // Create collections
    console.log('Creating collections...');
    for (const [collectionId, schema] of Object.entries(collections)) {
      await createCollection(collectionId, schema);
    }
    
    // Wait a bit for collections to be ready
    console.log('\nWaiting for collections to be ready...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create demo organization first
    await createDemoOrganization();
    
    // Create demo users
    await createDemoUsers();
    
    console.log('\n🎉 Appwrite setup completed successfully!');
    console.log('\nDemo credentials:');
    console.log('- Super Admin: admin@cctv.com / password123');
    console.log('- Org Admin: orgadmin@company.com / password123');
    console.log('- User: user@company.com / password123');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupAppwrite();
}

module.exports = { setupAppwrite };
