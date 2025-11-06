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

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.USER_PROFILES, userId);
      toast.success('User deleted successfully');
      loadUsers();
    } catch (error) {
      toast.error('Failed to delete user');
      console.error('Error deleting user:', error);
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
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            className="block w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
          <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-blue-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Users</p>
                <p className="text-2xl font-light text-white">{users.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-8 w-8 text-green-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Admins</p>
                <p className="text-2xl font-light text-white">
                  {users.filter(u => u.role === 'org_admin' || u.role === 'super_admin').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-purple-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Regular Users</p>
                <p className="text-2xl font-light text-white">
                  {users.filter(u => u.role === 'user').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-yellow-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Active</p>
                <p className="text-2xl font-light text-white">
                  {users.filter(u => u.isActive !== false).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 animate-pulse">
                  <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-300">User</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-300">Role</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-300">Organization</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-300">Status</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-300">Created</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <UserRow
                      key={user.$id}
                      user={user}
                      isLast={index === filteredUsers.length - 1}
                      onEdit={() => setEditingUser(user)}
                      onDelete={() => handleDeleteUser(user.$id, user.name)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-white">No users found</h3>
              <p className="mt-1 text-sm text-gray-400">
                {searchTerm ? 'No users match your search.' : 'Get started by adding your first user.'}
              </p>
            </div>
          )}
        </div>

        {/* Add/Edit User Modal */}
        {(showAddModal || editingUser) && (
          <UserModal
            user={editingUser}
            organization={organization}
            onClose={() => {
              setShowAddModal(false);
              setEditingUser(null);
            }}
            onSave={loadUsers}
          />
        )}
      </div>
    </Layout>
  );
}

function UserRow({ user, isLast, onEdit, onDelete }) {
  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin': return 'text-red-100 bg-red-500/20 border-red-500/50';
      case 'org_admin': return 'text-blue-100 bg-blue-500/20 border-blue-500/50';
      case 'user': return 'text-gray-300 bg-gray-500/20 border-gray-500/50';
      default: return 'text-gray-300 bg-gray-500/20 border-gray-500/50';
    }
  };

  const getStatusColor = (isActive) => {
    return isActive !== false
      ? 'text-green-100 bg-green-500/20 border-green-500/50'
      : 'text-red-100 bg-red-500/20 border-red-500/50';
  };

  const formatRole = (role) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'org_admin': return 'Org Admin';
      case 'user': return 'User';
      default: return role;
    }
  };

  return (
    <tr className={`hover:bg-white/5 transition-colors duration-200 ${!isLast ? 'border-b border-gray-700/30' : ''}`}>
      <td className="py-4 px-6">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-white">{user.name}</div>
            <div className="text-sm text-gray-400">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="py-4 px-6">
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getRoleColor(user.role)}`}>
          {formatRole(user.role)}
        </span>
      </td>
      <td className="py-4 px-6">
        <div className="text-sm text-gray-300">
          {user.organizationId ? 'Organization Member' : 'System User'}
        </div>
      </td>
      <td className="py-4 px-6">
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(user.isActive)}`}>
          {user.isActive !== false ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="py-4 px-6">
        <div className="text-sm text-gray-400">
          {new Date(user.createdAt).toLocaleDateString()}
        </div>
      </td>
      <td className="py-4 px-6 text-right">
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={onEdit}
            className="text-gray-400 hover:text-white transition-colors duration-200"
            title="Edit User"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="text-gray-400 hover:text-red-400 transition-colors duration-200"
            title="Delete User"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function UserModal({ user, organization, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'user',
    isActive: user?.isActive ?? true
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (user) {
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
        // Create new user
        await authService.createAccount(
          formData.email,
          formData.password,
          formData.name,
          formData.role,
          organization?.$id
        );
        toast.success('User created successfully');
      }

      onSave();
      onClose();
    } catch (error) {
      toast.error('Failed to save user');
      console.error('Error saving user:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-light text-white">
            {user ? 'Edit User' : 'Add New User'}
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
              disabled={!!user}
              className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          {!user && (
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
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
            <select
              className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
            >
              <option value="user">Regular User</option>
              <option value="org_admin">Organization Admin</option>
            </select>
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
              User is active
            </label>
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
              {saving ? 'Saving...' : user ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
