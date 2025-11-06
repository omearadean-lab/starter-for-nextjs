const { Client, Databases, Permission, Role } = require('node-appwrite');
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

async function setupMissingCollections() {
  console.log('🔧 Setting up missing collections...\n');

  const collections = [
    {
      id: 'detection_events',
      name: 'Detection Events',
      attributes: [
        { key: 'organizationId', type: 'string', size: 255, required: true },
        { key: 'cameraId', type: 'string', size: 255, required: true },
        { key: 'cameraName', type: 'string', size: 255, required: true },
        { key: 'detectionType', type: 'string', size: 50, required: true },
        { key: 'confidence', type: 'float', required: false },
        { key: 'status', type: 'string', size: 50, required: true, default: 'pending' },
        { key: 'description', type: 'string', size: 1000, required: false },
        { key: 'imageUrl', type: 'string', size: 500, required: false },
        { key: 'personIdentified', type: 'string', size: 255, required: false },
        { key: 'detectedAt', type: 'datetime', required: true },
        { key: 'reviewedBy', type: 'string', size: 255, required: false },
        { key: 'reviewedAt', type: 'datetime', required: false },
        { key: 'createdAt', type: 'datetime', required: true }
      ]
    },
    {
      id: 'notifications',
      name: 'Notifications',
      attributes: [
        { key: 'userId', type: 'string', size: 255, required: true },
        { key: 'organizationId', type: 'string', size: 255, required: false },
        { key: 'type', type: 'string', size: 50, required: true },
        { key: 'title', type: 'string', size: 255, required: true },
        { key: 'body', type: 'string', size: 1000, required: true },
        { key: 'isRead', type: 'boolean', required: true, default: false },
        { key: 'readAt', type: 'datetime', required: false },
        { key: 'alertId', type: 'string', size: 255, required: false },
        { key: 'eventId', type: 'string', size: 255, required: false },
        { key: 'severity', type: 'string', size: 50, required: false },
        { key: 'detectionType', type: 'string', size: 50, required: false },
        { key: 'createdAt', type: 'datetime', required: true }
      ]
    }
  ];

  for (const collection of collections) {
    try {
      // Create collection
      console.log(`Creating collection: ${collection.name}`);
      try {
        await databases.createCollection(
          DATABASE_ID,
          collection.id,
          collection.name,
          [
            Permission.read(Role.any()),
            Permission.write(Role.any()),
            Permission.create(Role.any()),
            Permission.update(Role.any()),
            Permission.delete(Role.any())
          ]
        );
        console.log(`✓ Created collection: ${collection.name}`);
      } catch (error) {
        if (error.code === 409) {
          console.log(`⚠ Collection ${collection.name} already exists`);
        } else {
          throw error;
        }
      }

      // Add attributes
      for (const attr of collection.attributes) {
        try {
          if (attr.type === 'string') {
            await databases.createStringAttribute(
              DATABASE_ID,
              collection.id,
              attr.key,
              attr.size,
              attr.required,
              attr.default
            );
          } else if (attr.type === 'boolean') {
            await databases.createBooleanAttribute(
              DATABASE_ID,
              collection.id,
              attr.key,
              attr.required,
              attr.default
            );
          } else if (attr.type === 'datetime') {
            await databases.createDatetimeAttribute(
              DATABASE_ID,
              collection.id,
              attr.key,
              attr.required,
              attr.default
            );
          } else if (attr.type === 'float') {
            await databases.createFloatAttribute(
              DATABASE_ID,
              collection.id,
              attr.key,
              attr.required,
              null, // min
              null, // max
              attr.default
            );
          }
          console.log(`  ✓ Added ${attr.key} attribute`);
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          if (error.code === 409) {
            console.log(`  ⚠ ${attr.key} attribute already exists`);
          } else {
            console.log(`  ✗ Error adding ${attr.key}:`, error.message);
          }
        }
      }

      console.log('');
    } catch (error) {
      console.error(`❌ Error setting up ${collection.name}:`, error);
    }
  }

  console.log('🎉 Missing collections setup completed!');
}

setupMissingCollections();
