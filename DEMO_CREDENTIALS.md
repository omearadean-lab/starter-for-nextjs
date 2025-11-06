# 🔐 Demo Credentials - UMA AEye Monitoring System

This document contains the demo credentials for testing the UMA AEye Monitoring System. These credentials provide access to different user roles and functionalities within the application.

## 🎭 Available Demo Accounts

### Super Administrator
- **Email**: `admin@cctv.com`
- **Password**: `password123`
- **Role**: Super Admin
- **Permissions**: 
  - Full system access
  - Manage all organizations
  - Create/edit/delete organizations
  - View system-wide analytics
  - Access all administrative features

### Organization Administrator
- **Email**: `orgadmin@company.com`
- **Password**: `password123`
- **Role**: Organization Admin
- **Organization**: Demo Security Company
- **Permissions**:
  - Manage organization users
  - Configure CCTV cameras
  - Manage known persons database
  - Configure organization settings
  - View organization analytics
  - Manage alerts and notifications

### Regular User
- **Email**: `user@company.com`
- **Password**: `password123`
- **Role**: User
- **Organization**: Demo Security Company
- **Permissions**:
  - View live camera feeds
  - Monitor security alerts
  - View known persons database
  - Basic dashboard access
  - Limited settings access

## 🏢 Demo Organization Details

**Organization Name**: Demo Security Company  
**Description**: A demo organization for testing the CCTV monitoring system  
**Contact Email**: contact@demosecurity.com  
**Contact Phone**: +1-555-0123  
**Address**: 123 Security Street, Demo City, DC 12345  
**Subscription Plan**: Professional  
**Max Cameras**: 50  
**Max Users**: 20  

## 📹 Demo Camera Data

The system includes 3 pre-configured demo cameras:

1. **Main Entrance Camera**
   - Location: Main Entrance
   - Status: Online
   - Resolution: 1920x1080
   - Enabled Detections: Shoplifting, Fall Detection, Face Recognition

2. **Store Floor Camera 1**
   - Location: Store Floor - Aisle 1-3
   - Status: Online
   - Resolution: 1920x1080
   - Enabled Detections: Shoplifting, People Count

3. **Emergency Exit Camera**
   - Location: Emergency Exit - Rear
   - Status: Offline
   - Resolution: 1280x720
   - Enabled Detections: Fire Detection, Fall Detection

## 🚨 Demo Alert Data

The system includes 5 realistic demo alerts:

1. **Critical - Fall Detection** (Unresolved)
   - Person fall detected - immediate assistance required
   - Location: Store Floor - Aisle 1-3
   - Time: 5 minutes ago

2. **Critical - Fire Detection** (Resolved)
   - Smoke detected in emergency exit area
   - Location: Emergency Exit - Rear
   - Time: 3 hours ago

3. **High - Shoplifting** (Unresolved)
   - Suspicious behavior detected - potential shoplifting activity
   - Location: Main Entrance
   - Time: 30 minutes ago

4. **High - Face Recognition** (Unresolved)
   - Known person of interest detected
   - Location: Main Entrance
   - Time: 10 minutes ago

5. **Medium - People Count** (Resolved)
   - High occupancy detected - 25 people in area
   - Location: Store Floor - Aisle 1-3
   - Time: 1 hour ago

## 👥 Demo Known Persons

1. **John Suspicious** (Person of Interest)
   - Previously caught shoplifting. Banned from premises.
   - Added: 2 weeks ago

2. **Sarah Employee** (Authorized Personnel)
   - Store manager - authorized access to all areas
   - Added: 1 month ago

## 🎯 Testing Scenarios

### As Super Administrator:
1. Login and view system-wide dashboard
2. Navigate to Organizations → View all organizations
3. Create a new organization
4. View system analytics and reports

### As Organization Administrator:
1. Login and view organization dashboard
2. Navigate to Users → Manage organization users
3. Navigate to Cameras → Add/configure cameras
4. Navigate to Known Persons → Add face recognition data
5. Navigate to Settings → Configure organization settings
6. Navigate to Alerts → Monitor and resolve alerts

### As Regular User:
1. Login and view basic dashboard
2. Navigate to Alerts → View security alerts
3. Navigate to Known Persons → View database (read-only)
4. Limited access to other features

## 🔒 Security Notes

⚠️ **Important**: These are demo credentials for testing purposes only.

- **Never use these credentials in production**
- **Change all passwords before deploying to production**
- **Remove or disable demo accounts in production environments**
- **Implement proper user registration and authentication flows**
- **Enable multi-factor authentication for production use**

## 🚀 Getting Started

1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Use any of the demo credentials above to login
4. Explore the different features based on your role
5. Test the various functionalities and user interfaces

## 📞 Support

If you encounter any issues with the demo credentials or need assistance:
- Check the main README.md for setup instructions
- Verify that all Appwrite collections are properly configured
- Ensure demo data has been created using `npm run create-demo-data`
- Review the browser console for any error messages

---

**Last Updated**: November 6, 2025  
**System Version**: 1.0.0  
**Demo Data Version**: 1.0.0
