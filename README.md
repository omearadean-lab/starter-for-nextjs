# UMA AEye Monitoring System

A comprehensive multi-tenant AI-powered CCTV monitoring and security management platform built with Next.js and Appwrite. This advanced system provides intelligent video surveillance with cutting-edge AI detection capabilities for shoplifting, fall detection, fire detection, face recognition, and people counting.

## 🚀 Features

### Multi-Tenant Architecture
- **Super Admin Dashboard**: Manage organizations and system-wide analytics
- **Organization Admin Dashboard**: Configure CCTV cameras, manage users, and view reports
- **User Dashboard**: Monitor alerts and view live feeds

### AI Detection Capabilities
- **Shoplifting Detection**: Identify suspicious behavior patterns
- **Fall Detection**: Detect when people fall and need assistance
- **Fire Detection**: Early fire and smoke detection
- **Face Recognition**: Identify known persons of interest
- **People Counting**: Monitor occupancy levels

### Real-time Features
- **Live Camera Feeds**: Professional RTSP/RTSPS streaming via go2rtc
- **Multiple Stream Formats**: WebRTC, HLS, MP4 with automatic fallbacks
- **Low Latency Streaming**: Sub-second latency with WebRTC
- **Instant Alert Notifications**: Real-time push notifications
- **Real-time Status Monitoring**: Live camera status and health
- **Dashboard Analytics**: Real-time metrics and insights

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Backend**: Appwrite (Database, Auth, Storage, Functions, Messaging)
- **Streaming**: go2rtc (Professional RTSP/WebRTC streaming server)
- **Video Protocols**: RTSP, RTSPS, WebRTC, HLS, MP4
- **UI Components**: Heroicons, Headless UI
- **Charts**: Recharts
- **Notifications**: React Hot Toast

## 📋 Prerequisites

1. **Appwrite Account**: Sign up at [cloud.appwrite.io](https://cloud.appwrite.io)
2. **Node.js**: Version 18 or higher
3. **npm**: Latest version

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone <repository-url>
cd cctv-monitoring-saas
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Video Streaming

The system uses **go2rtc** for professional RTSP/RTSPS streaming with multiple output formats and **CORS-enabled proxy** for seamless browser integration.

#### Streaming Architecture
- **go2rtc Server**: Professional streaming server (port 1984)
- **Next.js API Proxy**: CORS-enabled proxy at `/api/go2rtc-proxy`
- **Dynamic Stream Registration**: Cameras automatically registered via API
- **Multiple Fallbacks**: WebRTC → HLS → MP4 with automatic failover

#### Development Scripts
```bash
# 🚀 START SERVERS (Primary command)
npm run dev:full

# 🛑 KILL ALL SERVERS
pkill -f "go2rtc\|npm\|next"

# Individual server commands
npm run streaming        # Start only go2rtc
npm run dev             # Start only Next.js
npm run cleanup:streaming # Clean up old components
```

#### Supported Protocols & Features
- **RTSP/RTSPS**: Direct camera connections with secure encryption
- **WebRTC**: Ultra-low latency (sub-second) - preferred method
- **HLS**: HTTP Live Streaming for broad browser compatibility  
- **MP4**: Direct HTTP stream fallback
- **Multi-tenant Stream IDs**: `org_{orgId}_{cameraId}_{name}` format
- **CORS Proxy**: Seamless browser-to-go2rtc communication
- **Auto-reconnection**: Intelligent connection retry logic

### 4. Configure Appwrite

#### Create Appwrite Project
1. Go to [Appwrite Console](https://cloud.appwrite.io)
2. Create a new project
3. Note down your Project ID and Endpoint

#### Update Environment Variables
Update `.env` with your Appwrite credentials:
```env
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_PROJECT_NAME=CCTV_Monitoring
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
```

### 4. Set Up Database Schema

Create the following collections in your Appwrite database:

#### Database: `cctv_monitoring`

**Collection: `organizations`**
```json
{
  "name": "string",
  "description": "string",
  "contactEmail": "string",
  "contactPhone": "string", 
  "address": "string",
  "subscriptionPlan": "string",
  "maxCameras": "integer",
  "maxUsers": "integer",
  "isActive": "boolean",
  "createdAt": "datetime",
  "settings": "json"
}
```

**Collection: `users`**
```json
{
  "email": "string",
  "name": "string", 
  "role": "string",
  "organizationId": "string",
  "createdAt": "datetime",
  "isActive": "boolean"
}
```

**Collection: `cctv_cameras`**
```json
{
  "name": "string",
  "location": "string",
  "rtspUrl": "string",
  "organizationId": "string",
  "isActive": "boolean",
  "status": "string",
  "resolution": "string",
  "frameRate": "integer",
  "enabledDetections": "array",
  "alertThresholds": "json",
  "createdAt": "datetime",
  "lastSeen": "datetime"
}
```

**Collection: `alerts`**
```json
{
  "organizationId": "string",
  "cameraId": "string",
  "cameraName": "string",
  "alertType": "string",
  "severity": "string",
  "description": "string",
  "confidence": "double",
  "imageUrl": "string",
  "videoUrl": "string",
  "location": "string",
  "isResolved": "boolean",
  "resolvedBy": "string",
  "resolvedAt": "datetime",
  "createdAt": "datetime",
  "metadata": "json"
}
```

**Collection: `detection_events`**
```json
{
  "organizationId": "string",
  "cameraId": "string",
  "detectionType": "string",
  "confidence": "double",
  "boundingBoxes": "array",
  "imageUrl": "string",
  "personId": "string",
  "peopleCount": "integer",
  "createdAt": "datetime",
  "metadata": "json"
}
```

**Collection: `known_persons`**
```json
{
  "organizationId": "string",
  "name": "string",
  "description": "string",
  "imageUrl": "string",
  "isPersonOfInterest": "boolean",
  "createdAt": "datetime"
}
```

### 5. Set Up Permissions

Configure the following permissions for each collection:

- **Read**: Users with appropriate organization access
- **Write**: Organization admins and super admins
- **Delete**: Organization admins and super admins

### 6. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 👥 User Roles & Access

### Super Admin
- Manage all organizations
- View system-wide analytics
- Create and deactivate organizations
- Access all features

### Organization Admin  
- Manage cameras within their organization
- Configure alert settings
- Manage organization users
- View organization analytics

### User
- View alerts and camera feeds
- Resolve alerts
- Monitor assigned cameras

## 🔐 Demo Credentials

For testing purposes, you can use these demo credentials:

- **Super Admin**: admin@cctv.com / password123
- **Org Admin**: orgadmin@company.com / password123  
- **User**: user@company.com / password123

*Note: You'll need to create these users in your Appwrite Auth and add corresponding user profiles in the database.*

## 📱 Features Overview

### Dashboard
- Real-time statistics
- Recent alerts overview
- Quick action buttons
- System health monitoring

### Camera Management
- Add/edit/delete cameras
- Configure detection settings
- Monitor camera status
- Test camera connections

### Alert Management
- View all alerts with filtering
- Resolve alerts
- Export alert reports
- Configure notification settings

### Organization Management (Super Admin)
- Create organizations
- Set subscription limits
- Monitor organization usage
- Deactivate organizations

## 🔧 Customization

### Adding New Detection Types
1. Update `ALERT_TYPES` in `/src/lib/appwrite.js`
2. Modify alert evaluation logic in `/src/lib/alerts.js`
3. Update UI components to display new types

### Notification Channels
Configure notification settings in organization settings:
- Email notifications
- SMS alerts (for critical alerts)
- Push notifications
- Webhook integrations

## 📊 Analytics & Reporting

The system provides comprehensive analytics:
- Alert trends and patterns
- Camera performance metrics
- User activity logs
- System usage statistics

## 🎭 Demo Credentials

For testing the application, demo credentials are available in the `DEMO_CREDENTIALS.md` file. This includes:

- **Super Administrator** access for system management
- **Organization Administrator** access for CCTV management  
- **Regular User** access for monitoring
- Pre-configured demo data including cameras, alerts, and known persons

**⚠️ Important**: Demo credentials are for testing only. Remove or change them before production deployment.

## 🚀 Deployment

### Using Docker (Recommended for Production)

#### Prerequisites
- Docker and Docker Compose installed
- `.env` file configured with Appwrite credentials

#### Production Deployment
```bash
# Build and start production containers
npm run docker:prod

# Or manually with docker-compose
docker-compose up -d cctv-app

# View logs
docker-compose logs -f cctv-app

# Stop services
npm run docker:stop
```

#### Development with Docker
```bash
# Start development environment
npm run docker:dev

# Or manually
docker-compose --profile dev up cctv-dev
```

#### Docker Management
```bash
# Build custom image
npm run docker:build

# Clean up containers and volumes
npm run docker:clean

# View container status
docker-compose ps
```

#### Environment Variables for Docker
Create a `.env` file in the project root:
```env
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_PROJECT_NAME=CCTV_Monitoring
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
OPENAI_API_KEY=your_openai_key
```

#### Ports Exposed
- **3000**: Next.js application
- **1984**: go2rtc web interface and API
- **8554**: RTSP server for camera connections
- **8555**: WebRTC server for low-latency streaming

### Using Vercel
1. Connect your repository to Vercel
2. Add environment variables
3. Deploy
4. **Note**: go2rtc streaming server requires separate hosting (VPS/dedicated server)

### Using Netlify
1. Build the project: `npm run build`
2. Deploy the `out` folder to Netlify
3. Configure environment variables
4. **Note**: Streaming functionality requires separate go2rtc server deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the [Appwrite Documentation](https://appwrite.io/docs)
- Create an issue in this repository
- Contact the development team

## 🆕 Recent Updates & Fixes (November 2025)

### ✅ CORS & Streaming Issues Resolved
- **Fixed CORS Policy Errors**: Implemented Next.js API proxy (`/api/go2rtc-proxy`) to eliminate browser CORS blocks
- **Resolved Error Flooding**: Fixed infinite connection loops and multiple simultaneous attempts
- **Enhanced Error Handling**: Proper event listener cleanup and graceful fallbacks
- **Dynamic Stream Registration**: Cameras now auto-register with go2rtc via API calls

### 🔧 Technical Improvements
- **Multi-Protocol Support**: Enhanced support for RTSPS (secure RTSP) with proper encryption
- **Connection Throttling**: Intelligent connection management to prevent resource exhaustion  
- **Proxy Architecture**: Server-side go2rtc communication for production-ready CORS handling
- **Error Recovery**: Robust error handling with automatic retry mechanisms
- **Stream Lifecycle**: Proper stream cleanup and connection state management

### 🐛 Bug Fixes
- Fixed `Maximum update depth exceeded` React errors
- Resolved `net::ERR_FAILED` and `500 Internal Server Error` issues
- Fixed video element error loops causing browser crashes
- Corrected go2rtc configuration reload requirements
- Updated outdated UniFi-specific error messages to generic RTSP/RTSPS guidance

### 📊 Server Management
```bash
# Start all services (go2rtc + Next.js)
npm run dev:full

# Kill all running servers
pkill -f "go2rtc\|npm\|next"

# Check server status
curl -s http://localhost:1984/api        # go2rtc health
curl -s http://localhost:3000/api/health # Next.js health (if endpoint exists)
```

### 🔍 Troubleshooting Network Issues
- **Camera Connectivity**: Use `ping <camera-ip>` and `nc -z -v <camera-ip> <port>` to test
- **RTSPS Authentication**: Ensure credentials are included: `rtsps://user:pass@ip:port/path`
- **go2rtc Logs**: Check terminal output for connection timeouts or authentication failures
- **Stream Registration**: Verify streams appear in `curl -s http://localhost:1984/api/streams`

## 🔮 Future Enhancements

- Mobile application
- Advanced AI model integration  
- Video analytics dashboard
- Integration with third-party security systems
- Advanced reporting and export features
- Docker containerization for easier deployment