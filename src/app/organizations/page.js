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
  VideoCameraIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import toast from 'react-hot-toast';
import { ID } from 'appwrite';

export default function OrganizationsPage() {
  const { user, isSuperAdmin } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);

  useEffect(() => {
    if (isSuperAdmin && isSuperAdmin()) {
      loadOrganizations();
    }
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      
      // Get all organizations
      const orgsResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ORGANIZATIONS
      );

      // Calculate real stats for each organization
      const orgsWithStats = await Promise.all(
        orgsResponse.documents.map(async (org) => {
          try {
            // Get real user count for this organization
            const usersResponse = await databases.listDocuments(
              DATABASE_ID,
              COLLECTIONS.USER_PROFILES
            );
            const orgUsers = usersResponse.documents.filter(user => user.organizationId === org.$id);

            // Get real camera count for this organization  
            const camerasResponse = await databases.listDocuments(
              DATABASE_ID,
              COLLECTIONS.CCTV_CAMERAS
            );
            const orgCameras = camerasResponse.documents.filter(camera => camera.organizationId === org.$id);

            // Get real alerts count for this organization
            const alertsResponse = await databases.listDocuments(
              DATABASE_ID,
              COLLECTIONS.ALERTS
            );
            const orgAlerts = alertsResponse.documents.filter(alert => alert.organizationId === org.$id);

            return {
              ...org,
              stats: {
                totalUsers: orgUsers.length,
                totalCameras: orgCameras.length,
                recentAlerts: orgAlerts.length,
                onlineCameras: orgCameras.filter(c => c.status === 'online').length
              }
            };
          } catch (error) {
            console.error(`Error getting stats for org ${org.$id}:`, error);
            return {
              ...org,
              stats: { totalUsers: 0, totalCameras: 0, recentAlerts: 0, onlineCameras: 0 }
            };
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

  const handleDeleteOrganization = async (orgId, orgName) => {
    if (!confirm(`Are you sure you want to delete "${orgName}"? This will also delete all associated users, cameras, and data. This action cannot be undone.`)) {
      return;
    }

    try {
      // In a production system, you'd want to handle this more carefully
      // with proper cascading deletes or data archival
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.ORGANIZATIONS, orgId);
      toast.success('Organization deleted successfully');
      loadOrganizations();
    } catch (error) {
      toast.error('Failed to delete organization');
      console.error('Error deleting organization:', error);
    }
  };

  const handleCreateUser = (organization) => {
    setSelectedOrg(organization);
    setShowUserModal(true);
  };

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isSuperAdmin || !isSuperAdmin()) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-light text-white">Access Denied</h1>
          <p className="mt-2 text-gray-400">You don't have permission to manage organizations.</p>
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
            <h1 className="text-3xl font-light text-white">Organization Management</h1>
            <p className="mt-2 text-gray-400 font-light">
              Manage customer organizations and their subscriptions
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-all duration-200"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Organization
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search organizations..."
            className="block w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
          <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center">
              <BuildingOfficeIcon className="h-8 w-8 text-blue-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Organizations</p>
                <p className="text-2xl font-light text-white">{organizations.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-green-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Users</p>
                <p className="text-2xl font-light text-white">
                  {organizations.reduce((sum, org) => sum + org.stats.totalUsers, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center">
              <VideoCameraIcon className="h-8 w-8 text-purple-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Cameras</p>
                <p className="text-2xl font-light text-white">
                  {organizations.reduce((sum, org) => sum + org.stats.totalCameras, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Recent Alerts</p>
                <p className="text-2xl font-light text-white">
                  {organizations.reduce((sum, org) => sum + org.stats.recentAlerts, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Organizations Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-2/3"></div>
              </div>
            ))
          ) : filteredOrganizations.length > 0 ? (
            filteredOrganizations.map((org) => (
              <OrganizationCard
                key={org.$id}
                organization={org}
                onEdit={() => setEditingOrg(org)}
                onDelete={() => handleDeleteOrganization(org.$id, org.name)}
                onCreateUser={handleCreateUser}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-white">No organizations found</h3>
              <p className="mt-1 text-sm text-gray-400">
                {searchTerm ? 'No organizations match your search.' : 'Get started by adding your first organization.'}
              </p>
            </div>
          )}
        </div>

        {/* Add/Edit Organization Modal */}
        {(showAddModal || editingOrg) && (
          <OrganizationModal
            organization={editingOrg}
            onClose={() => {
              setShowAddModal(false);
              setEditingOrg(null);
            }}
            onSave={loadOrganizations}
          />
        )}

        {/* Create User Modal */}
        {showUserModal && selectedOrg && (
          <CreateUserModal
            organization={selectedOrg}
            onClose={() => {
              setShowUserModal(false);
              setSelectedOrg(null);
            }}
            onSave={loadOrganizations}
          />
        )}
      </div>
    </Layout>
  );
}

function OrganizationCard({ organization, onEdit, onDelete, onCreateUser }) {
  const getStatusColor = (isActive) => {
    return isActive 
      ? 'text-green-100 bg-green-500/20 border-green-500/50'
      : 'text-red-100 bg-red-500/20 border-red-500/50';
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <BuildingOfficeIcon className="h-8 w-8 text-blue-400" />
          <div>
            <h3 className="text-lg font-medium text-white">{organization.name}</h3>
            <p className="text-sm text-gray-400">{organization.contactEmail}</p>
          </div>
        </div>
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(organization.isActive)}`}>
          {organization.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-white/5 rounded-lg">
          <p className="text-lg font-light text-white">{organization.stats.totalUsers}</p>
          <p className="text-xs text-gray-400">Users</p>
        </div>
        <div className="text-center p-3 bg-white/5 rounded-lg">
          <p className="text-lg font-light text-white">{organization.stats.totalCameras}</p>
          <p className="text-xs text-gray-400">Cameras</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
        <div className="flex items-center">
          <CheckCircleIcon className="h-4 w-4 mr-1 text-green-400" />
          <span>{organization.stats.onlineCameras} online</span>
        </div>
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-4 w-4 mr-1 text-yellow-400" />
          <span>{organization.stats.recentAlerts} alerts (7d)</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400">
          <div className="flex items-center">
            <ClockIcon className="h-3 w-3 mr-1" />
            Created {new Date(organization.createdAt).toLocaleDateString()}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onCreateUser(organization)}
            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors duration-200"
            title="Create Admin User"
          >
            Add Admin
          </button>
          <button
            onClick={onEdit}
            className="text-gray-400 hover:text-white transition-colors duration-200"
            title="Edit Organization"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="text-gray-400 hover:text-red-400 transition-colors duration-200"
            title="Delete Organization"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function OrganizationModal({ organization, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: organization?.name || '',
    description: organization?.description || '',
    contactEmail: organization?.contactEmail || '',
    contactPhone: organization?.contactPhone || '',
    address: organization?.address || '',
    subscriptionPlan: organization?.subscriptionPlan || 'basic',
    maxUsers: organization?.maxUsers || 10,
    maxCameras: organization?.maxCameras || 5,
    isActive: organization?.isActive ?? true
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const orgData = {
        ...formData,
        createdAt: organization?.createdAt || new Date().toISOString()
      };

      if (organization) {
        await databases.updateDocument(DATABASE_ID, COLLECTIONS.ORGANIZATIONS, organization.$id, orgData);
        toast.success('Organization updated successfully');
      } else {
        await databases.createDocument(DATABASE_ID, COLLECTIONS.ORGANIZATIONS, ID.unique(), orgData);
        toast.success('Organization created successfully');
      }

      onSave();
      onClose();
    } catch (error) {
      toast.error('Failed to save organization');
      console.error('Error saving organization:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-light text-white">
            {organization ? 'Edit Organization' : 'Add New Organization'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Organization Name</label>
              <input
                type="text"
                required
                className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <input
                type="text"
                className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Contact Email</label>
              <input
                type="email"
                required
                className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
                value={formData.contactEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Contact Phone</label>
              <input
                type="tel"
                className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
                value={formData.contactPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Subscription Plan</label>
              <select
                className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
                value={formData.subscriptionPlan}
                onChange={(e) => setFormData(prev => ({ ...prev, subscriptionPlan: e.target.value }))}
              >
                <option value="basic">Basic</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Max Users</label>
              <input
                type="number"
                min="1"
                className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
                value={formData.maxUsers}
                onChange={(e) => setFormData(prev => ({ ...prev, maxUsers: parseInt(e.target.value) }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Max Cameras</label>
              <input
                type="number"
                min="1"
                className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
                value={formData.maxCameras}
                onChange={(e) => setFormData(prev => ({ ...prev, maxCameras: parseInt(e.target.value) }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
            <textarea
              rows="3"
              className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              className="h-4 w-4 text-white focus:ring-white/20 border-gray-600 rounded bg-white/5"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-300">
              Organization is active
            </label>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-700/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50"
            >
              {saving ? 'Saving...' : organization ? 'Update Organization' : 'Create Organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateUserModal({ organization, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'org_admin'
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Import authService here to avoid circular imports
      const { authService } = await import('@/lib/auth');
      
      // Create the user account and profile
      await authService.createAccount(
        formData.email,
        formData.password,
        formData.name,
        formData.role,
        organization.$id
      );

      toast.success(`Admin user created successfully for ${organization.name}`);
      toast.success(`Login credentials: ${formData.email} / ${formData.password}`);
      
      onSave();
      onClose();
    } catch (error) {
      toast.error('Failed to create user');
      console.error('Error creating user:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-light text-white">
            Create Admin User for {organization.name}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
            <input
              type="text"
              required
              className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              required
              className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              type="password"
              required
              minLength="8"
              className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
            <select
              className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
            >
              <option value="org_admin">Organization Admin</option>
              <option value="user">Regular User</option>
            </select>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
