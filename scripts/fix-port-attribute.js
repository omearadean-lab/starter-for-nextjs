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
 * Fix port attribute to allow full valid port range (1-65535)
 */
async function fixPortAttribute() {
  console.log('🔧 Fixing port attribute range...\n');

  try {
    // Delete the existing port attribute with wrong range
    console.log('🗑️ Deleting existing port attribute with incorrect range...');
    await databases.deleteAttribute(DATABASE_ID, 'cctv_cameras', 'port');
    console.log('✅ Deleted existing port attribute');

    // Wait a moment for the deletion to process
    console.log('⏳ Waiting for attribute deletion to process...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create new port attribute with correct range
    console.log('📝 Creating new port attribute with correct range (1-65535)...');
    await databases.createIntegerAttribute(
      DATABASE_ID,
      'cctv_cameras',
      'port',
      false, // not required
      null,  // no default value
      1,     // minimum value (valid port range starts at 1)
      65535  // maximum value (valid port range ends at 65535)
    );
    console.log('✅ Created new port attribute with correct range');

    console.log('\n🎉 Port attribute fixed successfully!\n');
    console.log('📋 Port Range Information:');
    console.log('   • Valid range: 1-65535');
    console.log('   • RTSPS default: 322 ✅');
    console.log('   • RTSP default: 554 ✅');
    console.log('   • HTTP default: 80 ✅');
    console.log('   • HTTPS default: 443 ✅');
    console.log('   • Custom ports: Any valid port ✅');

  } catch (error) {
    if (error.message.includes('Attribute not found')) {
      console.log('ℹ️ Port attribute may have already been deleted, creating new one...');
      
      try {
        await databases.createIntegerAttribute(
          DATABASE_ID,
          'cctv_cameras',
          'port',
          false, // not required
          null,  // no default value
          1,     // minimum value
          65535  // maximum value
        );
        console.log('✅ Created new port attribute with correct range');
      } catch (createError) {
        console.error('❌ Error creating new port attribute:', createError.message);
      }
    } else {
      console.error('❌ Error fixing port attribute:', error.message);
    }
  }

  // Show updated schema
  try {
    console.log('\n📋 Checking updated camera attributes...');
    const collection = await databases.getCollection(DATABASE_ID, 'cctv_cameras');
    const portAttr = collection.attributes.find(attr => attr.key === 'port');
    
    if (portAttr) {
      console.log(`✅ Port attribute: ${portAttr.key} (${portAttr.type})`);
      console.log(`   • Required: ${portAttr.required}`);
      console.log(`   • Min: ${portAttr.min || 'none'}`);
      console.log(`   • Max: ${portAttr.max || 'none'}`);
    } else {
      console.log('⚠️ Port attribute not found in collection');
    }
  } catch (error) {
    console.error('❌ Error checking collection:', error.message);
  }
}

fixPortAttribute();
