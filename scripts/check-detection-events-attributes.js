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

async function checkAttributes() {
  console.log('🔍 Checking detection_events and notifications attributes...\n');

  try {
    // Check detection_events
    const detectionEventsCollection = await databases.getCollection(DATABASE_ID, 'detection_events');
    console.log('📋 Detection Events Attributes:');
    detectionEventsCollection.attributes.forEach(attr => {
      console.log(`  • ${attr.key} (${attr.type}) - Required: ${attr.required}`);
    });

    // Check notifications
    const notificationsCollection = await databases.getCollection(DATABASE_ID, 'notifications');
    console.log('\n📋 Notifications Attributes:');
    notificationsCollection.attributes.forEach(attr => {
      console.log(`  • ${attr.key} (${attr.type}) - Required: ${attr.required}`);
    });

  } catch (error) {
    console.error('❌ Error checking attributes:', error);
  }
}

checkAttributes();
