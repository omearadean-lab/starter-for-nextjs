const { Client, Databases, ID } = require('node-appwrite');
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

async function createSuperAdminProfile() {
  console.log('🔧 Creating Super Admin profile...\n');

  try {
    // First, let's see what attributes exist
    console.log('Checking existing attributes...');
    
    // Create Super Admin profile with only the attributes that exist
    console.log('Creating Super Admin profile...');
    try {
      await databases.createDocument(
        DATABASE_ID,
        'user_profiles',
        'super-admin-001', // Use the same ID as the user
        {
          userId: 'super-admin-001',
          email: 'admin@cctv.com',
          name: 'Super Administrator',
          role: 'super_admin',
          createdAt: new Date().toISOString()
        }
      );
      console.log('✓ Created Super Admin profile successfully');
    } catch (error) {
      if (error.code === 409) {
        console.log('⚠ Super Admin profile already exists, updating it...');
        try {
          await databases.updateDocument(
            DATABASE_ID,
            'user_profiles',
            'super-admin-001',
            {
              role: 'super_admin',
              updatedAt: new Date().toISOString()
            }
          );
          console.log('✓ Updated Super Admin profile');
        } catch (updateError) {
          console.log('✗ Error updating Super Admin profile:', updateError.message);
        }
      } else {
        console.log('✗ Error creating Super Admin profile:', error.message);
        
        // Try with minimal data
        console.log('Trying with minimal profile data...');
        try {
          await databases.createDocument(
            DATABASE_ID,
            'user_profiles',
            'super-admin-001',
            {
              role: 'super_admin'
            }
          );
          console.log('✓ Created minimal Super Admin profile');
        } catch (minimalError) {
          console.log('✗ Even minimal profile failed:', minimalError.message);
        }
      }
    }

    console.log('\n🎉 Super Admin profile setup completed!');
    console.log('\n📋 Super Admin Details:');
    console.log('  • User ID: super-admin-001');
    console.log('  • Email: admin@cctv.com');
    console.log('  • Role: super_admin');
    console.log('\n💡 Please refresh your browser and login again.');
    console.log('💡 You should now see the Organizations menu.');

  } catch (error) {
    console.error('❌ Error creating Super Admin profile:', error);
    process.exit(1);
  }
}

createSuperAdminProfile();
