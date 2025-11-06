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

async function clearSampleData() {
  console.log('🧹 Clearing sample data...\n');

  try {
    // Clear detection events
    console.log('Clearing detection events...');
    const eventsResponse = await databases.listDocuments(DATABASE_ID, 'detection_events');
    for (const event of eventsResponse.documents) {
      try {
        await databases.deleteDocument(DATABASE_ID, 'detection_events', event.$id);
        console.log(`  ✓ Deleted detection event: ${event.detectionType}`);
      } catch (error) {
        console.log(`  ✗ Error deleting event:`, error.message);
      }
    }

    // Clear notifications
    console.log('\nClearing notifications...');
    const notificationsResponse = await databases.listDocuments(DATABASE_ID, 'notifications');
    for (const notification of notificationsResponse.documents) {
      try {
        await databases.deleteDocument(DATABASE_ID, 'notifications', notification.$id);
        console.log(`  ✓ Deleted notification: ${notification.type}`);
      } catch (error) {
        console.log(`  ✗ Error deleting notification:`, error.message);
      }
    }

    console.log('\n🎉 Sample data cleared successfully!');
    console.log('💡 Detection Events and Notifications pages should now be empty.');

  } catch (error) {
    console.error('❌ Error clearing sample data:', error);
  }
}

clearSampleData();
