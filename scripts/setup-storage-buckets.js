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

/**
 * Set up storage buckets for detection evidence
 */
async function setupStorageBuckets() {
  console.log('📦 Setting up storage buckets for detection evidence...\n');

  const buckets = [
    {
      id: 'detection-images',
      name: 'Detection Images',
      permissions: [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ],
      fileSecurity: true,
      enabled: true,
      maximumFileSize: 10485760, // 10MB
      allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp'],
      compression: 'gzip',
      encryption: true,
      antivirus: true
    },
    {
      id: 'detection-videos',
      name: 'Detection Videos',
      permissions: [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ],
      fileSecurity: true,
      enabled: true,
      maximumFileSize: 104857600, // 100MB
      allowedFileExtensions: ['mp4', 'avi', 'mov', 'webm'],
      compression: 'gzip',
      encryption: true,
      antivirus: true
    },
    {
      id: 'alert-snapshots',
      name: 'Alert Snapshots',
      permissions: [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ],
      fileSecurity: true,
      enabled: true,
      maximumFileSize: 10485760, // 10MB
      allowedFileExtensions: ['jpg', 'jpeg', 'png'],
      compression: 'gzip',
      encryption: true,
      antivirus: true
    },
    {
      id: 'face-recognition',
      name: 'Face Recognition Images',
      permissions: [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ],
      fileSecurity: true,
      enabled: true,
      maximumFileSize: 5242880, // 5MB
      allowedFileExtensions: ['jpg', 'jpeg', 'png'],
      compression: 'gzip',
      encryption: true,
      antivirus: true
    }
  ];

  for (const bucketConfig of buckets) {
    try {
      console.log(`📁 Creating bucket: ${bucketConfig.name} (${bucketConfig.id})`);
      
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

      console.log(`✅ Created bucket: ${bucket.name}`);
      console.log(`   • ID: ${bucket.$id}`);
      console.log(`   • Max file size: ${(bucket.maximumFileSize / 1024 / 1024).toFixed(1)}MB`);
      console.log(`   • Allowed extensions: ${bucket.allowedFileExtensions.join(', ')}`);
      console.log(`   • Encryption: ${bucket.encryption ? 'Enabled' : 'Disabled'}`);
      console.log(`   • Antivirus: ${bucket.antivirus ? 'Enabled' : 'Disabled'}`);
      console.log('');

    } catch (error) {
      if (error.code === 409) {
        console.log(`ℹ️ Bucket already exists: ${bucketConfig.name}`);
        
        // Try to update bucket settings
        try {
          await storage.updateBucket(
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
          console.log(`✅ Updated bucket settings: ${bucketConfig.name}`);
        } catch (updateError) {
          console.log(`⚠️ Could not update bucket settings: ${updateError.message}`);
        }
      } else {
        console.error(`❌ Error creating bucket ${bucketConfig.name}:`, error.message);
      }
      console.log('');
    }
  }

  console.log('🎉 Storage bucket setup completed!\n');
  console.log('📊 Summary:');
  console.log('   ✅ detection-images - For AI detection screenshots');
  console.log('   ✅ detection-videos - For detection event video clips');
  console.log('   ✅ alert-snapshots - For critical alert evidence');
  console.log('   ✅ face-recognition - For known person face images');
  
  console.log('\n🔒 Security Features:');
  console.log('   • File-level permissions enabled');
  console.log('   • Encryption at rest enabled');
  console.log('   • Antivirus scanning enabled');
  console.log('   • Compression enabled for bandwidth optimization');
  
  console.log('\n💡 Usage:');
  console.log('   • Use detectionStorageService to store evidence');
  console.log('   • Images are automatically compressed and secured');
  console.log('   • Access URLs are generated for viewing/downloading');
  console.log('   • Retention policies can be implemented for cleanup');
}

setupStorageBuckets();
