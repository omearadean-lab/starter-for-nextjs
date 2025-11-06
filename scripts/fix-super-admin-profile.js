const { Client, Databases, ID } = require('node-appwrite');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
  });
}

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '690c7785003337dac829')
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = "690c79cc0014c7d18c28";

async function fixSuperAdminProfile() {
  console.log('🔧 Fixing Super Admin profile...\n');

  try {
    const superAdminUserId = 'super-admin-001';
    
    // Check if profile already exists
    try {
      const existingProfile = await databases.getDocument(
        DATABASE_ID,
        'user_profiles',
        superAdminUserId
      );
      console.log('✓ Super Admin profile already exists:', existingProfile);
      
      // Update the role to make sure it's correct
      await databases.updateDocument(
        DATABASE_ID,
        'user_profiles',
        superAdminUserId,
        {
          role: 'super_admin',
          updatedAt: new Date().toISOString()
        }
      );
      console.log('✓ Updated Super Admin role to ensure it\'s correct');
      
    } catch (error) {
      if (error.code === 404) {
        // Profile doesn't exist, create it
        console.log('Creating Super Admin profile...');
        
        const profileData = {
          userId: superAdminUserId,
          role: 'super_admin',
          organizationId: null, // Super admin doesn't belong to any specific organization
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await databases.createDocument(
          DATABASE_ID,
          'user_profiles',
          superAdminUserId, // Use the same ID as the user ID
          profileData
        );
        
        console.log('✓ Created Super Admin profile successfully');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 Super Admin profile fix completed!');
    console.log('\n📋 Super Admin Details:');
    console.log('  • User ID: super-admin-001');
    console.log('  • Email: admin@cctv.com');
    console.log('  • Role: super_admin');
    console.log('  • Organization: None (system-wide access)');
    console.log('\n💡 You should now see the Organizations menu when logged in as Super Admin.');

  } catch (error) {
    console.error('❌ Error fixing Super Admin profile:', error);
    process.exit(1);
  }
}

fixSuperAdminProfile();
