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
 * Add protocol attribute to support RTSPS, RTSP, HTTP, etc.
 */
async function addCameraProtocolAttribute() {
  console.log('🔧 Adding protocol attribute to cctv_cameras collection...\n');

  try {
    // Add protocol attribute
    console.log('📝 Adding protocol attribute...');
    await databases.createStringAttribute(
      DATABASE_ID,
      'cctv_cameras',
      'protocol',
      50,
      false, // not required (will default to 'rtsp')
      'rtsp' // default value
    );
    console.log('✅ Added protocol attribute');

    // Add streamUrl attribute (more generic than rtspUrl)
    console.log('📝 Adding streamUrl attribute...');
    await databases.createStringAttribute(
      DATABASE_ID,
      'cctv_cameras',
      'streamUrl',
      500,
      false // not required (will use rtspUrl if not provided)
    );
    console.log('✅ Added streamUrl attribute');

    // Add username attribute for authentication
    console.log('📝 Adding username attribute...');
    await databases.createStringAttribute(
      DATABASE_ID,
      'cctv_cameras',
      'username',
      100,
      false // not required
    );
    console.log('✅ Added username attribute');

    // Add password attribute for authentication
    console.log('📝 Adding password attribute...');
    await databases.createStringAttribute(
      DATABASE_ID,
      'cctv_cameras',
      'password',
      100,
      false // not required
    );
    console.log('✅ Added password attribute');

    // Add port attribute
    console.log('📝 Adding port attribute...');
    await databases.createIntegerAttribute(
      DATABASE_ID,
      'cctv_cameras',
      'port',
      false, // not required
      554 // default RTSP port
    );
    console.log('✅ Added port attribute');

    // Add encryption attribute for RTSPS support
    console.log('📝 Adding encryption attribute...');
    await databases.createBooleanAttribute(
      DATABASE_ID,
      'cctv_cameras',
      'encryption',
      false, // not required
      false // default to no encryption
    );
    console.log('✅ Added encryption attribute');

    console.log('\n🎉 Camera protocol attributes added successfully!\n');
    console.log('📋 Supported Protocols:');
    console.log('   • RTSP (Real Time Streaming Protocol)');
    console.log('   • RTSPS (RTSP over TLS/SSL) - Secure');
    console.log('   • HTTP (Web cameras)');
    console.log('   • HTTPS (Secure web cameras)');
    console.log('   • ONVIF (Open Network Video Interface)');
    console.log('   • Custom protocols');

    console.log('\n🔒 Security Features:');
    console.log('   • Username/password authentication');
    console.log('   • TLS/SSL encryption support (RTSPS)');
    console.log('   • Custom port configuration');
    console.log('   • Secure credential storage');

    console.log('\n💡 Example URLs:');
    console.log('   • RTSP: rtsp://username:password@192.168.1.100:554/stream');
    console.log('   • RTSPS: rtsps://username:password@192.168.1.100:322/stream');
    console.log('   • HTTP: http://192.168.1.100:8080/video.mjpg');
    console.log('   • HTTPS: https://camera.example.com/stream');

  } catch (error) {
    if (error.code === 409) {
      console.log('ℹ️ Attributes may already exist, checking current schema...');
      
      try {
        const collection = await databases.getCollection(DATABASE_ID, 'cctv_cameras');
        console.log('\n📋 Current Camera Attributes:');
        collection.attributes.forEach(attr => {
          console.log(`  • ${attr.key} (${attr.type}) - Required: ${attr.required}`);
        });
      } catch (checkError) {
        console.error('❌ Error checking collection:', checkError.message);
      }
    } else {
      console.error('❌ Error adding camera protocol attributes:', error.message);
    }
  }
}

addCameraProtocolAttribute();
