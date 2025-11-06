'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { 
  PlusIcon, 
  UserGroupIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { authService } from '@/lib/auth';
import { databases, DATABASE_ID, COLLECTIONS, USER_ROLES } from '@/lib/appwrite';
import toast from 'react-hot-toast';
import { ID } from 'appwrite';

export default function UsersPage() {
  const { user, organization, isOrgAdmin, isSuperAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (organization || isSuperAdmin()) {
      loadUsers();
    }
  }, [organization]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      let userList = [];
      
      if (isSuperAdmin()) {
        // Super admin sees all users
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.USER_PROFILES
        );
        userList = response.documents;
      } else if (organization) {
        // Org admin sees only their organization's users
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.USER_PROFILES
        );
        userList = response.documents.filter(user => user.organizationId === organization.$id);
      }
      
      setUsers(userList);
    } catch (error) {
      toast.error('Failed to load users');
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser({
      name: '',
      email: '',
      role: USER_ROLES.USER,
      organizationId: organization?.$id || null,
      isActive: true
    });
    setShowAddModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowAddModal(true);
  };

  const handleDeactivateUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to deactivate ${userName}? They will no longer be able to access the system.`)) {
      return;
    }

    try {
      await authService.deactivateUser(userId);
      toast.success('User deactivated successfully');
      loadUsers();
    } catch (error) {
      toast.error('Failed to deactivate user');
      console.error('Error deactivating user:', error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if ((!organization && !isSuperAdmin()) || (!isOrgAdmin() && !isSuperAdmin())) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-light text-white">Access Denied</h1>
          <p className="mt-2 text-gray-400">You don't have permission to manage users.</p>
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
            <h1 className="text-3xl font-light text-white">User Management</h1>
            <p className="mt-2 text-gray-400 font-light">
              Manage users and their permissions within your organization
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-all duration-200"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add User
          </button>
        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                    <dd className="text-lg font-medium text-gray-900">{users.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShieldCheckIcon className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Users</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {users.filter(u => u.isActive).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserIcon className="h-6 w-6 text-purple-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Admins</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {users.filter(u => u.role === USER_ROLES.ORG_ADMIN || u.role === USER_ROLES.SUPER_ADMIN).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserIcon className="h-6 w-6 text-gray-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Regular Users</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {users.filter(u => u.role === USER_ROLES.USER).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search users..."
              className="block w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">
          {loading ? (
            <div className="p-8">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <UserRow
                      key={user.$id}
                      user={user}
                      onEdit={handleEditUser}
                      onDeactivate={handleDeactivateUser}
                      canEdit={isOrgAdmin() || isSuperAdmin()}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first user.'}
              </p>
              {!searchTerm && (isOrgAdmin() || isSuperAdmin()) && (
                <div className="mt-6">
                  <button
                    onClick={handleAddUser}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add User
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <UserModal
          user={editingUser}
          organization={organization}
          isSuperAdmin={isSuperAdmin()}
          onClose={() => {
            setShowAddModal(false);
            setEditingUser(null);
          }}
          onSave={() => {
            setShowAddModal(false);
            setEditingUser(null);
            loadUsers();
          }}
        />
      )}
    </Layout>
  );
}

function UserRow({ user, onEdit, onDeactivate, canEdit }) {
  const getRoleBadge = (role) => {
    switch (role) {
      case USER_ROLES.SUPER_ADMIN:
        return 'bg-red-100 text-red-800';
      case USER_ROLES.ORG_ADMIN:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case USER_ROLES.SUPER_ADMIN:
        return 'Super Admin';
      case USER_ROLES.ORG_ADMIN:
        return 'Org Admin';
      default:
        return 'User';
    }
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors duration-150">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{user.name}</div>
            <div className="text-sm text-gray-500 flex items-center">
              <EnvelopeIcon className="h-3 w-3 mr-1" />
              {user.email}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadge(user.role)}`}>
          {getRoleLabel(user.role)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        {canEdit && (
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => onEdit(user)}
              className="text-indigo-600 hover:text-indigo-900 transition-colors duration-150"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            {user.isActive && (
              <button
                onClick={() => onDeactivate(user.$id, user.name)}
                className="text-red-600 hover:text-red-900 transition-colors duration-150"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

function UserModal({ user, organization, isSuperAdmin, onClose, onSave }) {
  const [formData, setFormData] = useState(user || {
    name: '',
    email: '',
    role: USER_ROLES.USER,
    organizationId: organization?.$id || null,
    isActive: true
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (user?.$id) {
        // Update existing user
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.USER_PROFILES,
          user.$id,
          {
            name: formData.name,
            role: formData.role,
            organizationId: formData.organizationId,
            isActive: formData.isActive
          }
        );
        toast.success('User updated successfully');
      } else {
        // Create new user (this would need to be implemented with proper user creation)
        const newUser = await authService.createAccount(
          formData.email,
          'tempPassword123', // In production, generate a secure temporary password
          formData.name,
          formData.role,
          formData.organizationId
        );
        toast.success('User created successfully. They will receive login instructions via email.');
      }

      onSave();
    } catch (error) {
      toast.error('Failed to save user');
      console.error('Error saving user:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative p-5 border w-96 shadow-xl rounded-xl bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {user?.$id ? 'Edit User' : 'Add New User'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                required
                className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                disabled={!!user?.$id} // Don't allow email changes for existing users
                className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200 disabled:bg-gray-100"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200"
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              >
                <option value={USER_ROLES.USER}>User</option>
                <option value={USER_ROLES.ORG_ADMIN}>Organization Admin</option>
                {isSuperAdmin && (
                  <option value={USER_ROLES.SUPER_ADMIN}>Super Admin</option>
                )}
              </select>
            </div>

            {user?.$id && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Active User
                </label>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? 'Saving...' : (user?.$id ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
