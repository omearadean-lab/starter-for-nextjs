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

async function checkAllCollections() {
  console.log('🔍 Checking all collection attributes...\n');

  const collections = [
    'cctv_cameras',
    'alerts', 
    'detection_events',
    'notifications'
  ];

  for (const collectionId of collections) {
    try {
      const collection = await databases.getCollection(DATABASE_ID, collectionId);
      console.log(`📋 ${collectionId} Attributes:`);
      collection.attributes.forEach(attr => {
        console.log(`  • ${attr.key} (${attr.type}) - Required: ${attr.required}`);
      });
      console.log('');
    } catch (error) {
      console.log(`❌ ${collectionId} collection error:`, error.message);
      console.log('');
    }
  }
}

checkAllCollections();
