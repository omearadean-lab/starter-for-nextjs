'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { 
  PlusIcon, 
  BuildingOfficeIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';
import { organizationService } from '@/lib/organizations';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function OrganizationsPage() {
  const { isSuperAdmin } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isSuperAdmin()) {
      loadOrganizations();
    }
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const orgs = await organizationService.getAllOrganizations();
      
      // Get stats for each organization
      const orgsWithStats = await Promise.all(
        orgs.map(async (org) => {
          try {
            const stats = await organizationService.getOrganizationStats(org.$id);
            return { ...org, stats };
          } catch (error) {
            return { ...org, stats: { totalCameras: 0, totalUsers: 0, recentAlerts: 0 } };
          }
        })
      );
      
      setOrganizations(orgsWithStats);
    } catch (error) {
      toast.error('Failed to load organizations');
      console.error('Error loading organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateOrganization = async (orgId, orgName) => {
    if (!confirm(`Are you sure you want to deactivate ${orgName}? This will disable access for all users in this organization.`)) {
      return;
    }

    try {
      await organizationService.deactivateOrganization(orgId);
      toast.success('Organization deactivated successfully');
      loadOrganizations();
    } catch (error) {
      toast.error('Failed to deactivate organization');
      console.error('Error deactivating organization:', error);
    }
  };

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage all organizations in the system
            </p>
          </div>
          <Link
            href="/organizations/add"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Organization
          </Link>
        </div>

        {/* Search */}
        <div className="max-w-md">
          <input
            type="text"
            placeholder="Search organizations..."
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Organizations Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white shadow rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredOrganizations.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredOrganizations.map((org) => (
              <OrganizationCard
                key={org.$id}
                organization={org}
                onDeactivate={handleDeactivateOrganization}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No organizations found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating a new organization.'}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <Link
                  href="/organizations/add"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Organization
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

function OrganizationCard({ organization, onDeactivate }) {
  const getStatusColor = (isActive) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {organization.name}
          </h3>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(organization.isActive)}`}>
            {organization.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          <p>{organization.contactEmail}</p>
          <p>{organization.subscriptionPlan}</p>
          <p className="text-xs text-gray-500">
            Created {new Date(organization.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center">
              <VideoCameraIcon className="h-4 w-4 text-gray-400 mr-1" />
              <span className="text-sm font-medium text-gray-900">
                {organization.stats?.totalCameras || 0}
              </span>
            </div>
            <p className="text-xs text-gray-500">Cameras</p>
          </div>
          <div>
            <div className="flex items-center justify-center">
              <UsersIcon className="h-4 w-4 text-gray-400 mr-1" />
              <span className="text-sm font-medium text-gray-900">
                {organization.stats?.totalUsers || 0}
              </span>
            </div>
            <p className="text-xs text-gray-500">Users</p>
          </div>
          <div>
            <div className="flex items-center justify-center">
              <span className="text-sm font-medium text-red-600">
                {organization.stats?.recentAlerts || 0}
              </span>
            </div>
            <p className="text-xs text-gray-500">Alerts</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-between">
          <Link
            href={`/organizations/${organization.$id}`}
            className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <EyeIcon className="h-3 w-3 mr-1" />
            View
          </Link>
          
          <div className="flex space-x-2">
            <Link
              href={`/organizations/${organization.$id}/edit`}
              className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PencilIcon className="h-3 w-3 mr-1" />
              Edit
            </Link>
            
            {organization.isActive && (
              <button
                onClick={() => onDeactivate(organization.$id, organization.name)}
                className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon className="h-3 w-3 mr-1" />
                Deactivate
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
