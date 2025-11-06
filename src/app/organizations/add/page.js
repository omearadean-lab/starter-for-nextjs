'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { organizationService } from '@/lib/organizations';
import toast from 'react-hot-toast';

export default function AddOrganizationPage() {
  const { isSuperAdmin } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    subscriptionPlan: 'basic',
    maxCameras: 10,
    maxUsers: 5
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await organizationService.createOrganization(formData);
      toast.success('Organization created successfully!');
      router.push('/organizations');
    } catch (error) {
      toast.error('Failed to create organization');
      console.error('Error creating organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  if (!isSuperAdmin()) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-gray-600">You don't have permission to access this page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Add New Organization</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create a new organization to manage CCTV systems
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow-xl rounded-xl p-8 border border-gray-100">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Organization Name *
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200 hover:border-gray-400"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
                  Contact Email *
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  id="contactEmail"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200 hover:border-gray-400"
                  value={formData.contactEmail}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  id="contactPhone"
                  className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200 hover:border-gray-400"
                  value={formData.contactPhone}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="subscriptionPlan" className="block text-sm font-medium text-gray-700">
                  Subscription Plan
                </label>
                <select
                  name="subscriptionPlan"
                  id="subscriptionPlan"
                  className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200 hover:border-gray-400"
                  value={formData.subscriptionPlan}
                  onChange={handleChange}
                >
                  <option value="basic">Basic</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="mt-6">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <textarea
                name="address"
                id="address"
                rows={2}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Limits */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Limits</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="maxCameras" className="block text-sm font-medium text-gray-700">
                  Maximum Cameras
                </label>
                <input
                  type="number"
                  name="maxCameras"
                  id="maxCameras"
                  min="1"
                  className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200 hover:border-gray-400"
                  value={formData.maxCameras}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="maxUsers" className="block text-sm font-medium text-gray-700">
                  Maximum Users
                </label>
                <input
                  type="number"
                  name="maxUsers"
                  id="maxUsers"
                  min="1"
                  className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200 hover:border-gray-400"
                  value={formData.maxUsers}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 hover:shadow-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Organization...
                </div>
              ) : (
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Organization
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
