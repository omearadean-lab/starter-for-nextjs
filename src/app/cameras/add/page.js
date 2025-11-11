'use client';

import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import CameraAddForm from '@/components/CameraAddForm';

export default function AddCameraPage() {
  const { isOrgAdmin, isSuperAdmin } = useAuth();

  // Check permissions
  if (!isOrgAdmin && !isSuperAdmin) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
            <p className="mt-2 text-gray-600">You don't have permission to add cameras.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add New Camera</h1>
          <p className="mt-2 text-gray-600">
            Connect a new camera to your monitoring system. go2rtc supports a wide range of protocols and devices.
          </p>
        </div>
        
        <CameraAddForm />
      </div>
    </Layout>
  );
}
