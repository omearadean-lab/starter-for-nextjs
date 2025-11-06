import { Client, Account, Databases, Storage, Functions, Teams, Messaging } from "appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);
const functions = new Functions(client);
const messaging = new Messaging(client);
const teams = new Teams(client);

// Database and collection IDs
export const DATABASE_ID = "690c79cc0014c7d18c28";
export const COLLECTIONS = {
  ORGANIZATIONS: "organizations",
  USER_PROFILES: "user_profiles",
  CCTV_CAMERAS: "cctv_cameras",
  ALERTS: "alerts",
  DETECTION_EVENTS: "detection_events",
  KNOWN_PERSONS: "known_persons",
  SETTINGS: "settings",
  ANALYTICS_DAILY: "analytics_daily",
  ANALYTICS_HOURLY: "analytics_hourly",
  SYSTEM_METRICS: "system_metrics",
  NOTIFICATIONS: "notifications"
};

// User roles
export const USER_ROLES = {
  SUPER_ADMIN: "super_admin",
  ORG_ADMIN: "org_admin", 
  USER: "user"
};

// Alert types
export const ALERT_TYPES = {
  SHOPLIFTING: "shoplifting",
  FALL_DETECTION: "fall_detection", 
  FIRE_DETECTION: "fire_detection",
  FACE_RECOGNITION: "face_recognition",
  PEOPLE_COUNT: "people_count"
};

// Storage bucket IDs (free plan - single bucket)
export const STORAGE_BUCKETS = {
  DEFAULT: "faces"                   // Single bucket for all files (organized by filename prefix)
};

export { client, account, databases, storage, functions, messaging, teams };
