const { Client, Databases, ID } = require('appwrite');
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

async function createAnalyticsCollections() {
  console.log('🔧 Setting up analytics collections...\n');

  try {
    // 1. Analytics Daily Collection
    console.log('Creating analytics_daily collection...');
    try {
      await databases.createCollection(
        DATABASE_ID,
        'analytics_daily',
        'Analytics Daily',
        [
          databases.permission('read', ['role:all']),
          databases.permission('write', ['role:all']),
          databases.permission('create', ['role:all']),
          databases.permission('update', ['role:all']),
          databases.permission('delete', ['role:all'])
        ]
      );
      console.log('✓ Created analytics_daily collection');
    } catch (error) {
      if (error.code === 409) {
        console.log('⚠ analytics_daily collection already exists');
      } else {
        throw error;
      }
    }

    // Add attributes to analytics_daily
    const dailyAttributes = [
      { key: 'organizationId', type: 'string', size: 255, required: true },
      { key: 'date', type: 'string', size: 10, required: true }, // YYYY-MM-DD
      { key: 'totalAlerts', type: 'integer', required: true, default: 0 },
      { key: 'criticalAlerts', type: 'integer', required: true, default: 0 },
      { key: 'resolvedAlerts', type: 'integer', required: true, default: 0 },
      { key: 'averageResponseTime', type: 'float', required: true, default: 0 },
      { key: 'camerasOnline', type: 'integer', required: true, default: 0 },
      { key: 'camerasTotal', type: 'integer', required: true, default: 0 },
      { key: 'detectionAccuracy', type: 'float', required: true, default: 0 },
      { key: 'systemUptime', type: 'float', required: true, default: 0 },
      { key: 'alertsByType', type: 'string', size: 2000, required: false }, // JSON string
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: true }
    ];

    for (const attr of dailyAttributes) {
      try {
        if (attr.type === 'string') {
          await databases.createStringAttribute(
            DATABASE_ID,
            'analytics_daily',
            attr.key,
            attr.size,
            attr.required,
            attr.default
          );
        } else if (attr.type === 'integer') {
          await databases.createIntegerAttribute(
            DATABASE_ID,
            'analytics_daily',
            attr.key,
            attr.required,
            null,
            null,
            attr.default
          );
        } else if (attr.type === 'float') {
          await databases.createFloatAttribute(
            DATABASE_ID,
            'analytics_daily',
            attr.key,
            attr.required,
            null,
            null,
            attr.default
          );
        } else if (attr.type === 'datetime') {
          await databases.createDatetimeAttribute(
            DATABASE_ID,
            'analytics_daily',
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

    // 2. Analytics Hourly Collection
    console.log('\nCreating analytics_hourly collection...');
    try {
      await databases.createCollection(
        DATABASE_ID,
        'analytics_hourly',
        'Analytics Hourly',
        [
          databases.permission('read', ['role:all']),
          databases.permission('write', ['role:all']),
          databases.permission('create', ['role:all']),
          databases.permission('update', ['role:all']),
          databases.permission('delete', ['role:all'])
        ]
      );
      console.log('✓ Created analytics_hourly collection');
    } catch (error) {
      if (error.code === 409) {
        console.log('⚠ analytics_hourly collection already exists');
      } else {
        throw error;
      }
    }

    // Add attributes to analytics_hourly
    const hourlyAttributes = [
      { key: 'organizationId', type: 'string', size: 255, required: true },
      { key: 'hourKey', type: 'string', size: 13, required: true }, // YYYY-MM-DDTHH
      { key: 'datetime', type: 'datetime', required: true },
      { key: 'alertsCount', type: 'integer', required: true, default: 0 },
      { key: 'criticalAlertsCount', type: 'integer', required: true, default: 0 },
      { key: 'averageResponseTime', type: 'float', required: true, default: 0 },
      { key: 'activeCameras', type: 'integer', required: true, default: 0 },
      { key: 'detectionEvents', type: 'integer', required: true, default: 0 },
      { key: 'createdAt', type: 'datetime', required: true }
    ];

    for (const attr of hourlyAttributes) {
      try {
        if (attr.type === 'string') {
          await databases.createStringAttribute(
            DATABASE_ID,
            'analytics_hourly',
            attr.key,
            attr.size,
            attr.required,
            attr.default
          );
        } else if (attr.type === 'integer') {
          await databases.createIntegerAttribute(
            DATABASE_ID,
            'analytics_hourly',
            attr.key,
            attr.required,
            null,
            null,
            attr.default
          );
        } else if (attr.type === 'float') {
          await databases.createFloatAttribute(
            DATABASE_ID,
            'analytics_hourly',
            attr.key,
            attr.required,
            null,
            null,
            attr.default
          );
        } else if (attr.type === 'datetime') {
          await databases.createDatetimeAttribute(
            DATABASE_ID,
            'analytics_hourly',
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

    // 3. System Metrics Collection
    console.log('\nCreating system_metrics collection...');
    try {
      await databases.createCollection(
        DATABASE_ID,
        'system_metrics',
        'System Metrics',
        [
          databases.permission('read', ['role:all']),
          databases.permission('write', ['role:all']),
          databases.permission('create', ['role:all']),
          databases.permission('update', ['role:all']),
          databases.permission('delete', ['role:all'])
        ]
      );
      console.log('✓ Created system_metrics collection');
    } catch (error) {
      if (error.code === 409) {
        console.log('⚠ system_metrics collection already exists');
      } else {
        throw error;
      }
    }

    // Add attributes to system_metrics
    const systemAttributes = [
      { key: 'timestamp', type: 'datetime', required: true },
      { key: 'totalOrganizations', type: 'integer', required: true, default: 0 },
      { key: 'totalUsers', type: 'integer', required: true, default: 0 },
      { key: 'totalCameras', type: 'integer', required: true, default: 0 },
      { key: 'totalAlerts', type: 'integer', required: true, default: 0 },
      { key: 'systemLoad', type: 'float', required: true, default: 0 },
      { key: 'memoryUsage', type: 'float', required: true, default: 0 },
      { key: 'diskUsage', type: 'float', required: true, default: 0 },
      { key: 'networkLatency', type: 'float', required: true, default: 0 },
      { key: 'createdAt', type: 'datetime', required: true }
    ];

    for (const attr of systemAttributes) {
      try {
        if (attr.type === 'integer') {
          await databases.createIntegerAttribute(
            DATABASE_ID,
            'system_metrics',
            attr.key,
            attr.required,
            null,
            null,
            attr.default
          );
        } else if (attr.type === 'float') {
          await databases.createFloatAttribute(
            DATABASE_ID,
            'system_metrics',
            attr.key,
            attr.required,
            null,
            null,
            attr.default
          );
        } else if (attr.type === 'datetime') {
          await databases.createDatetimeAttribute(
            DATABASE_ID,
            'system_metrics',
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

    console.log('\n🎉 Analytics collections setup completed successfully!');
    console.log('\n📊 Created collections:');
    console.log('  • analytics_daily - Daily aggregated metrics');
    console.log('  • analytics_hourly - Hourly granular data');
    console.log('  • system_metrics - System-wide performance metrics');
    console.log('\n💡 Analytics data will now be stored in the database for:');
    console.log('  • Historical trend analysis');
    console.log('  • Performance optimization');
    console.log('  • Faster dashboard loading');
    console.log('  • Long-term reporting');

  } catch (error) {
    console.error('❌ Error setting up analytics collections:', error);
    process.exit(1);
  }
}

createAnalyticsCollections();
