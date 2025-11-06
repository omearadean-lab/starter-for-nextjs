const { Client, Databases, Users } = require('node-appwrite');
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
const users = new Users(client);
const DATABASE_ID = "690c79cc0014c7d18c28";

async function cleanupOrphanedUsers() {
  console.log('🔧 Cleaning up orphaned auth users...\n');

  try {
    // Get all auth users
    const authUsers = await users.list();
    console.log(`Found ${authUsers.total} auth users`);

    // Get all user profiles
    const profilesResponse = await databases.listDocuments(DATABASE_ID, 'user_profiles');
    const profiles = profilesResponse.documents;
    console.log(`Found ${profiles.length} user profiles`);

    // Find orphaned auth users (users without profiles)
    const orphanedUsers = [];
    for (const authUser of authUsers.users) {
      const hasProfile = profiles.some(profile => profile.userId === authUser.$id);
      if (!hasProfile) {
        orphanedUsers.push(authUser);
      }
    }

    console.log(`\nFound ${orphanedUsers.length} orphaned auth users:`);
    
    for (const orphan of orphanedUsers) {
      console.log(`  • ${orphan.email} (${orphan.$id})`);
      
      // Delete the orphaned auth user
      try {
        await users.delete(orphan.$id);
        console.log(`    ✓ Deleted orphaned user: ${orphan.email}`);
      } catch (error) {
        console.log(`    ✗ Failed to delete ${orphan.email}:`, error.message);
      }
    }

    if (orphanedUsers.length === 0) {
      console.log('  No orphaned users found - all auth users have profiles!');
    }

    console.log('\n🎉 Cleanup completed!');
    console.log('💡 You can now try creating users again without conflicts.');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

cleanupOrphanedUsers();
