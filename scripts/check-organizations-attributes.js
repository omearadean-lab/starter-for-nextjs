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

async function checkOrganizationsAttributes() {
  console.log('🔍 Checking organizations collection attributes...\n');

  try {
    const collection = await databases.getCollection(DATABASE_ID, 'organizations');
    
    console.log('📋 Organizations Collection Info:');
    console.log('  • Name:', collection.name);
    console.log('  • ID:', collection.$id);
    console.log('  • Total Documents:', collection.documentsCount);
    
    console.log('\n📝 Available Attributes:');
    collection.attributes.forEach(attr => {
      console.log(`  • ${attr.key} (${attr.type}) - Required: ${attr.required}`);
    });

    console.log('\n💡 Use only these attributes when creating/updating organizations.');

  } catch (error) {
    console.error('❌ Error checking organizations collection:', error);
  }
}

checkOrganizationsAttributes();
