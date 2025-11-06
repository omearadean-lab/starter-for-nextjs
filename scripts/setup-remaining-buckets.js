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

// Simplified bucket configurations for free plan
const buckets = {
  media: {
    id: 'media',
    name: 'Media Files',
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users())
    ],
    fileSecurity: true,
    enabled: true,
    maximumFileSize: 50 * 1024 * 1024, // 50MB
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'avi', 'mov', 'wmv', 'webm'],
    compression: 'gzip',
    encryption: true,
    antivirus: true
  },
  documents: {
    id: 'documents',
    name: 'Documents',
    permissions: [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users())
    ],
    fileSecurity: true,
    enabled: true,
    maximumFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileExtensions: ['json', 'txt', 'xml', 'yaml', 'yml', 'pdf', 'doc', 'docx'],
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

async function setupRemainingBuckets() {
  console.log('🗄️ Setting up remaining Appwrite storage buckets...\n');
  
  try {
    // Create remaining buckets
    for (const [bucketKey, bucketConfig] of Object.entries(buckets)) {
      await createBucket(bucketConfig);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n✅ Storage setup completed successfully!');
    console.log('\n📁 Available buckets:');
    console.log('- faces: Face recognition images (5MB max)');
    console.log('- media: All images and videos (50MB max)');
    console.log('- documents: Configuration files and documents (10MB max)');
    
    console.log('\n🔒 Security features enabled:');
    console.log('- File-level permissions');
    console.log('- Encryption at rest');
    console.log('- Antivirus scanning');
    console.log('- Gzip compression');
    
    console.log('\n📝 Usage:');
    console.log('- Face images: Use "faces" bucket');
    console.log('- Alert images/videos: Use "media" bucket');
    console.log('- Profile pictures: Use "media" bucket');
    console.log('- Camera configs: Use "documents" bucket');
    
  } catch (error) {
    console.error('❌ Storage setup failed:', error);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupRemainingBuckets();
}

module.exports = { setupRemainingBuckets };
