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
- Live camera feeds
- Instant alert notifications
- Real-time status monitoring
- Dashboard analytics

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Backend**: Appwrite (Database, Auth, Storage, Functions, Messaging)
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

### 3. Configure Appwrite

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

### Using Vercel (Recommended)
1. Connect your repository to Vercel
2. Add environment variables
3. Deploy

### Using Netlify
1. Build the project: `npm run build`
2. Deploy the `out` folder to Netlify
3. Configure environment variables

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

## 🔮 Future Enhancements

- Mobile application
- Advanced AI model integration
- Video analytics dashboard
- Integration with third-party security systems
- Advanced reporting and export features