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

// Load environment variables
loadEnvFile();

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = "690c79cc0014c7d18c28";

async function checkUsersAndOrgs() {
  console.log('🔍 Checking users and organizations...\n');

  try {
    // Get organizations
    const orgsResponse = await databases.listDocuments(DATABASE_ID, 'organizations');
    console.log('📋 Organizations:');
    orgsResponse.documents.forEach(org => {
      console.log(`  • ${org.name} (${org.$id})`);
    });

    // Get users
    const usersResponse = await databases.listDocuments(DATABASE_ID, 'user_profiles');
    console.log('\n👥 Users:');
    usersResponse.documents.forEach(user => {
      console.log(`  • ${user.name} (${user.$id}) - Role: ${user.role} - Org: ${user.organizationId || 'None'}`);
    });

    // Show which users belong to which organizations
    console.log('\n🏢 Organization Membership:');
    orgsResponse.documents.forEach(org => {
      const orgUsers = usersResponse.documents.filter(user => user.organizationId === org.$id);
      console.log(`  ${org.name}:`);
      if (orgUsers.length > 0) {
        orgUsers.forEach(user => {
          console.log(`    - ${user.name} (${user.role})`);
        });
      } else {
        console.log(`    - No users assigned`);
      }
    });

  } catch (error) {
    console.error('❌ Error checking data:', error);
  }
}

checkUsersAndOrgs();
