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

/**
 * Add missing camera attributes like brand
 */
async function addMissingCameraAttributes() {
  console.log('🔧 Adding missing camera attributes...\n');

  const attributesToAdd = [
    {
      key: 'brand',
      type: 'string',
      size: 50,
      required: false,
      default: 'Generic',
      description: 'Camera brand/manufacturer'
    }
  ];

  for (const attr of attributesToAdd) {
    try {
      console.log(`📝 Adding ${attr.key} attribute...`);
      
      await databases.createStringAttribute(
        DATABASE_ID,
        'cctv_cameras',
        attr.key,
        attr.size,
        attr.required,
        attr.default
      );
      
      console.log(`✅ Added ${attr.key} attribute (${attr.description})`);
      
    } catch (error) {
      if (error.code === 409) {
        console.log(`ℹ️ ${attr.key} attribute already exists`);
      } else {
        console.error(`❌ Error adding ${attr.key} attribute:`, error.message);
      }
    }
  }

  console.log('\n🎉 Missing camera attributes added successfully!\n');
  
  // Show current schema
  try {
    const collection = await databases.getCollection(DATABASE_ID, 'cctv_cameras');
    console.log('📋 Updated Camera Attributes:');
    collection.attributes.forEach(attr => {
      console.log(`  • ${attr.key} (${attr.type}) - Required: ${attr.required}`);
    });
  } catch (error) {
    console.error('❌ Error checking collection:', error.message);
  }
}

addMissingCameraAttributes();
