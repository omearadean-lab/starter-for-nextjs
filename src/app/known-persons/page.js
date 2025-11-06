'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { 
  PlusIcon, 
  UserIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  ShieldExclamationIcon,
  FaceSmileIcon
} from '@heroicons/react/24/outline';
import { databases, DATABASE_ID, COLLECTIONS, storage, STORAGE_BUCKETS } from '@/lib/appwrite';
import toast from 'react-hot-toast';
import { ID } from 'appwrite';

export default function KnownPersonsPage() {
  const { user, organization, isOrgAdmin, isSuperAdmin } = useAuth();
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (organization) {
      loadKnownPersons();
    }
  }, [organization]);

  const loadKnownPersons = async () => {
    try {
      setLoading(true);
      if (organization) {
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.KNOWN_PERSONS
        );
        // Filter by organization on client side to avoid query issues
        const orgPersons = response.documents.filter(person => person.organizationId === organization.$id);
        setPersons(orgPersons);
      }
    } catch (error) {
      toast.error('Failed to load known persons');
      console.error('Error loading known persons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePerson = async (personId, personName) => {
    if (!confirm(`Are you sure you want to delete ${personName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.KNOWN_PERSONS, personId);
      toast.success('Person deleted successfully');
      loadKnownPersons();
    } catch (error) {
      toast.error('Failed to delete person');
      console.error('Error deleting person:', error);
    }
  };

  const filteredPersons = persons.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!organization || (!isOrgAdmin() && !isSuperAdmin())) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-light text-white">Access Denied</h1>
          <p className="mt-2 text-gray-400">You don't have permission to manage known persons.</p>
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
            <h1 className="text-3xl font-light text-white">Known Persons</h1>
            <p className="mt-2 text-gray-400 font-light">
              Manage face recognition database for person identification
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-all duration-200"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Person
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search known persons..."
            className="block w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
          <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-blue-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Persons</p>
                <p className="text-2xl font-light text-white">{persons.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Active</p>
                <p className="text-2xl font-light text-white">
                  {persons.filter(p => p.isActive !== false).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center">
              <ShieldExclamationIcon className="h-8 w-8 text-yellow-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Persons of Interest</p>
                <p className="text-2xl font-light text-white">
                  {persons.filter(p => p.isPersonOfInterest).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center">
              <PhotoIcon className="h-8 w-8 text-purple-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">With Photos</p>
                <p className="text-2xl font-light text-white">
                  {persons.filter(p => p.photoUrl).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Persons Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading ? (
            [...Array(8)].map((_, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 animate-pulse">
                <div className="w-full h-48 bg-gray-700 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
            ))
          ) : filteredPersons.length > 0 ? (
            filteredPersons.map((person) => (
              <PersonCard
                key={person.$id}
                person={person}
                onEdit={() => setEditingPerson(person)}
                onDelete={() => handleDeletePerson(person.$id, person.name)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-white">No known persons found</h3>
              <p className="mt-1 text-sm text-gray-400">
                {searchTerm ? 'No persons match your search.' : 'Get started by adding your first known person.'}
              </p>
            </div>
          )}
        </div>

        {/* Add/Edit Person Modal */}
        {(showAddModal || editingPerson) && (
          <PersonModal
            person={editingPerson}
            organization={organization}
            onClose={() => {
              setShowAddModal(false);
              setEditingPerson(null);
            }}
            onSave={loadKnownPersons}
          />
        )}
      </div>
    </Layout>
  );
}

function PersonCard({ person, onEdit, onDelete }) {
  const getStatusColor = (isActive) => {
    return isActive !== false
      ? 'text-green-100 bg-green-500/20 border-green-500/50'
      : 'text-red-100 bg-red-500/20 border-red-500/50';
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
      {/* Photo */}
      <div className="w-full h-48 mb-4 rounded-lg overflow-hidden bg-gray-800/50 flex items-center justify-center">
        {person.photoUrl ? (
          <img
            src={person.photoUrl}
            alt={person.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <FaceSmileIcon className="h-16 w-16 text-gray-500" />
        )}
      </div>

      {/* Info */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-medium text-white">{person.name}</h3>
            {person.description && (
              <p className="text-sm text-gray-400 mt-1">{person.description}</p>
            )}
          </div>
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(person.isActive)}`}>
            {person.isActive !== false ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {person.isPersonOfInterest && (
            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full text-yellow-100 bg-yellow-500/20 border border-yellow-500/50">
              Person of Interest
            </span>
          )}
          {person.department && (
            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full text-blue-100 bg-blue-500/20 border border-blue-500/50">
              {person.department}
            </span>
          )}
        </div>

        {/* Metadata */}
        <div className="text-xs text-gray-400 space-y-1">
          <div className="flex items-center">
            <ClockIcon className="h-3 w-3 mr-1" />
            Added {new Date(person.createdAt).toLocaleDateString()}
          </div>
          {person.lastSeen && (
            <div className="flex items-center">
              <EyeIcon className="h-3 w-3 mr-1" />
              Last seen {new Date(person.lastSeen).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
          <button
            onClick={onEdit}
            className="text-gray-400 hover:text-white transition-colors duration-200"
            title="Edit Person"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="text-gray-400 hover:text-red-400 transition-colors duration-200"
            title="Delete Person"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PersonModal({ person, organization, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: person?.name || '',
    description: person?.description || '',
    department: person?.department || '',
    employeeId: person?.employeeId || '',
    isPersonOfInterest: person?.isPersonOfInterest || false,
    isActive: person?.isActive ?? true,
    notes: person?.notes || ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(person?.photoUrl || null);
  const [saving, setSaving] = useState(false);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let photoUrl = person?.photoUrl || null;

      // Upload photo if a new one was selected
      if (photoFile) {
        try {
          const uploadedFile = await storage.createFile(
            STORAGE_BUCKETS.DEFAULT,
            ID.unique(),
            photoFile
          );
          photoUrl = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${STORAGE_BUCKETS.DEFAULT}/files/${uploadedFile.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
        } catch (uploadError) {
          console.error('Photo upload failed:', uploadError);
          toast.error('Failed to upload photo');
          return;
        }
      }

      const personData = {
        ...formData,
        organizationId: organization.$id,
        photoUrl,
        createdAt: person?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (person) {
        await databases.updateDocument(DATABASE_ID, COLLECTIONS.KNOWN_PERSONS, person.$id, personData);
        toast.success('Person updated successfully');
      } else {
        await databases.createDocument(DATABASE_ID, COLLECTIONS.KNOWN_PERSONS, ID.unique(), personData);
        toast.success('Person added successfully');
      }

      onSave();
      onClose();
    } catch (error) {
      toast.error('Failed to save person');
      console.error('Error saving person:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-light text-white">
            {person ? 'Edit Person' : 'Add New Person'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Photo</label>
            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-800/50 flex items-center justify-center">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <FaceSmileIcon className="h-8 w-8 text-gray-500" />
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-white/10 file:text-white hover:file:bg-white/20"
                />
                <p className="text-xs text-gray-400 mt-1">Upload a clear photo for face recognition</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
              <input
                type="text"
                required
                className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Employee ID</label>
              <input
                type="text"
                className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
                value={formData.employeeId}
                onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
              <input
                type="text"
                className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPersonOfInterest"
                  className="h-4 w-4 text-white focus:ring-white/20 border-gray-600 rounded bg-white/5"
                  checked={formData.isPersonOfInterest}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPersonOfInterest: e.target.checked }))}
                />
                <label htmlFor="isPersonOfInterest" className="ml-2 block text-sm text-gray-300">
                  Person of Interest
                </label>
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
                  Active
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              rows="2"
              className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
            <textarea
              rows="3"
              className="block w-full bg-white/5 border border-gray-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
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
              {saving ? 'Saving...' : person ? 'Update Person' : 'Add Person'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
