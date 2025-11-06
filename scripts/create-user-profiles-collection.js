const { Client, Databases, ID, Permission, Role } = require('node-appwrite');
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

async function createUserProfilesCollection() {
  console.log('🔧 Creating user_profiles collection...\n');

  try {
    // Create the collection
    console.log('Creating user_profiles collection...');
    try {
      await databases.createCollection(
        DATABASE_ID,
        'user_profiles',
        'User Profiles',
        [
          Permission.read(Role.any()),
          Permission.write(Role.any()),
          Permission.create(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any())
        ]
      );
      console.log('✓ Created user_profiles collection');
    } catch (error) {
      if (error.code === 409) {
        console.log('⚠ user_profiles collection already exists');
      } else {
        throw error;
      }
    }

    // Add attributes
    const attributes = [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'email', type: 'string', size: 255, required: true },
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'role', type: 'string', size: 50, required: true },
      { key: 'organizationId', type: 'string', size: 255, required: false },
      { key: 'isActive', type: 'boolean', required: true, default: true },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: false }
    ];

    for (const attr of attributes) {
      try {
        if (attr.type === 'string') {
          await databases.createStringAttribute(
            DATABASE_ID,
            'user_profiles',
            attr.key,
            attr.size,
            attr.required,
            attr.default
          );
        } else if (attr.type === 'boolean') {
          await databases.createBooleanAttribute(
            DATABASE_ID,
            'user_profiles',
            attr.key,
            attr.required,
            attr.default
          );
        } else if (attr.type === 'datetime') {
          await databases.createDatetimeAttribute(
            DATABASE_ID,
            'user_profiles',
            attr.key,
            attr.required,
            attr.default
          );
        }
        console.log(`  ✓ Added ${attr.key} attribute`);
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        if (error.code === 409) {
          console.log(`  ⚠ ${attr.key} attribute already exists`);
        } else {
          console.log(`  ✗ Error adding ${attr.key}:`, error.message);
        }
      }
    }

    // Create Super Admin profile
    console.log('\nCreating Super Admin profile...');
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
          organizationId: null,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );
      console.log('✓ Created Super Admin profile');
    } catch (error) {
      if (error.code === 409) {
        console.log('⚠ Super Admin profile already exists');
      } else {
        console.log('✗ Error creating Super Admin profile:', error.message);
      }
    }

    console.log('\n🎉 User profiles collection setup completed!');
    console.log('\n📋 Super Admin Details:');
    console.log('  • User ID: super-admin-001');
    console.log('  • Email: admin@cctv.com');
    console.log('  • Role: super_admin');
    console.log('  • Organization: None (system-wide access)');
    console.log('\n💡 You should now see the Organizations menu when logged in as Super Admin.');
    console.log('💡 Please refresh your browser and login again.');

  } catch (error) {
    console.error('❌ Error creating user profiles collection:', error);
    process.exit(1);
  }
}

createUserProfilesCollection();
