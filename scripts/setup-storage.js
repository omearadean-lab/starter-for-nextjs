const { Client, Storage, Permission, Role } = require('node-appwrite');
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

const storage = new Storage(client);

// Storage bucket configurations
const buckets = {
  faces: {
    id: 'faces',
    name: 'Face Images',
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users())
    ],
    fileSecurity: true,
    enabled: true,
    maximumFileSize: 5 * 1024 * 1024, // 5MB
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    compression: 'gzip',
    encryption: true,
    antivirus: true
  },
  alert_images: {
    id: 'alert_images',
    name: 'Alert Images',
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users())
    ],
    fileSecurity: true,
    enabled: true,
    maximumFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    compression: 'gzip',
    encryption: true,
    antivirus: true
  },
  alert_videos: {
    id: 'alert_videos',
    name: 'Alert Videos',
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users())
    ],
    fileSecurity: true,
    enabled: true,
    maximumFileSize: 100 * 1024 * 1024, // 100MB
    allowedFileExtensions: ['mp4', 'avi', 'mov', 'wmv', 'webm'],
    compression: 'gzip',
    encryption: true,
    antivirus: true
  },
  profile_pics: {
    id: 'profile_pics',
    name: 'Profile Pictures',
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users())
    ],
    fileSecurity: true,
    enabled: true,
    maximumFileSize: 2 * 1024 * 1024, // 2MB
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    compression: 'gzip',
    encryption: true,
    antivirus: true
  },
  camera_configs: {
    id: 'camera_configs',
    name: 'Camera Configurations',
    permissions: [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users())
    ],
    fileSecurity: true,
    enabled: true,
    maximumFileSize: 1 * 1024 * 1024, // 1MB
    allowedFileExtensions: ['json', 'txt', 'xml', 'yaml', 'yml'],
    compression: 'gzip',
    encryption: true,
    antivirus: true
  },
  detection_imgs: {
    id: 'detection_imgs',
    name: 'Detection Images',
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users())
    ],
    fileSecurity: true,
    enabled: true,
    maximumFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    compression: 'gzip',
    encryption: true,
    antivirus: true
  }
};

async function createBucket(bucketConfig) {
  try {
    console.log(`Creating bucket: ${bucketConfig.name} (${bucketConfig.id})`);
    
    const bucket = await storage.createBucket(
      bucketConfig.id,
      bucketConfig.name,
      bucketConfig.permissions,
      bucketConfig.fileSecurity,
      bucketConfig.enabled,
      bucketConfig.maximumFileSize,
      bucketConfig.allowedFileExtensions,
      bucketConfig.compression,
      bucketConfig.encryption,
      bucketConfig.antivirus
    );
    
    console.log(`✓ Created bucket: ${bucketConfig.name}`);
    return bucket;
  } catch (error) {
    if (error.code === 409) {
      console.log(`⚠ Bucket ${bucketConfig.name} already exists`);
    } else {
      console.log(`✗ Error creating bucket ${bucketConfig.name}:`, error.message);
    }
  }
}

async function setupStorage() {
  console.log('🗄️ Setting up Appwrite storage buckets...\n');
  
  try {
    // Create all buckets
    for (const [bucketKey, bucketConfig] of Object.entries(buckets)) {
      await createBucket(bucketConfig);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n✅ Storage setup completed successfully!');
    console.log('\n📁 Created buckets:');
    console.log('- faces: Face recognition images (5MB max)');
    console.log('- alert_images: Alert snapshots (10MB max)');
    console.log('- alert_videos: Alert video clips (100MB max)');
    console.log('- profile_pics: User profile pictures (2MB max)');
    console.log('- camera_configs: Camera configuration files (1MB max)');
    console.log('- detection_imgs: General detection images (10MB max)');
    
    console.log('\n🔒 Security features enabled:');
    console.log('- File-level permissions');
    console.log('- Encryption at rest');
    console.log('- Antivirus scanning');
    console.log('- Gzip compression');
    
  } catch (error) {
    console.error('❌ Storage setup failed:', error);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupStorage();
}

module.exports = { setupStorage };
