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

async function fixCollectionPermissions() {
  console.log('🔧 Fixing collection permissions...\n');

  const collections = [
    'organizations',
    'user_profiles', 
    'cctv_cameras',
    'alerts',
    'known_persons',
    'settings',
    'analytics_daily',
    'analytics_hourly',
    'system_metrics'
  ];

  const permissions = [
    Permission.read(Role.any()),
    Permission.write(Role.any()),
    Permission.create(Role.any()),
    Permission.update(Role.any()),
    Permission.delete(Role.any())
  ];

  for (const collectionId of collections) {
    try {
      console.log(`Updating permissions for ${collectionId}...`);
      
      await databases.updateCollection(
        DATABASE_ID,
        collectionId,
        collectionId.charAt(0).toUpperCase() + collectionId.slice(1).replace('_', ' '),
        permissions
      );
      
      console.log(`✓ Updated ${collectionId} permissions`);
    } catch (error) {
      if (error.code === 404) {
        console.log(`⚠ Collection ${collectionId} not found, skipping...`);
      } else {
        console.log(`✗ Error updating ${collectionId}:`, error.message);
      }
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n🎉 Collection permissions updated!');
  console.log('\n💡 All collections now have proper read/write permissions.');
  console.log('💡 Please refresh your browser and try accessing Organizations again.');
}

fixCollectionPermissions();
