'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import FileUpload, { FilePreview } from '@/components/FileUpload';
import { 
  PlusIcon, 
  UserIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { storageService } from '@/lib/storage';
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
          COLLECTIONS.KNOWN_PERSONS,
          [
            databases.Query?.equal('organizationId', organization.$id) || `organizationId="${organization.$id}"`
          ]
        );
        setPersons(response.documents);
      }
    } catch (error) {
      toast.error('Failed to load known persons');
      console.error('Error loading known persons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPerson = () => {
    setEditingPerson({
      name: '',
      description: '',
      isPersonOfInterest: false,
      imageUrl: null,
      imageFileId: null
    });
    setShowAddModal(true);
  };

  const handleEditPerson = (person) => {
    setEditingPerson(person);
    setShowAddModal(true);
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
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-gray-600">You don't have permission to manage known persons.</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Known Persons</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage face recognition database for your organization
            </p>
          </div>
          <button
            onClick={handleAddPerson}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Person
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Persons</dt>
                    <dd className="text-lg font-medium text-gray-900">{persons.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Persons of Interest</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {persons.filter(p => p.isPersonOfInterest).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <EyeIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">With Photos</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {persons.filter(p => p.imageUrl).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="max-w-md">
          <input
            type="text"
            placeholder="Search persons..."
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Persons Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white shadow rounded-lg p-6 animate-pulse">
                <div className="h-32 bg-gray-200 rounded mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : filteredPersons.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPersons.map((person) => (
              <PersonCard
                key={person.$id}
                person={person}
                onEdit={handleEditPerson}
                onDelete={handleDeletePerson}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No persons found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first known person.'}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <button
                  onClick={handleAddPerson}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Person
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <PersonModal
          person={editingPerson}
          organization={organization}
          onClose={() => {
            setShowAddModal(false);
            setEditingPerson(null);
          }}
          onSave={() => {
            setShowAddModal(false);
            setEditingPerson(null);
            loadKnownPersons();
          }}
        />
      )}
    </Layout>
  );
}

function PersonCard({ person, onEdit, onDelete }) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="aspect-w-16 aspect-h-9 bg-gray-200">
        {person.imageUrl ? (
          <img
            src={person.imageUrl}
            alt={person.name}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 flex items-center justify-center">
            <UserIcon className="h-16 w-16 text-gray-400" />
          </div>
        )}
      </div>
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {person.name}
          </h3>
          {person.isPersonOfInterest && (
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
              POI
            </span>
          )}
        </div>
        
        {person.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {person.description}
          </p>
        )}
        
        <p className="text-xs text-gray-500 mb-4">
          Added {new Date(person.createdAt).toLocaleDateString()}
        </p>

        <div className="flex justify-between">
          <button
            onClick={() => onEdit(person)}
            className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PencilIcon className="h-3 w-3 mr-1" />
            Edit
          </button>
          
          <button
            onClick={() => onDelete(person.$id, person.name)}
            className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <TrashIcon className="h-3 w-3 mr-1" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function PersonModal({ person, organization, onClose, onSave }) {
  const [formData, setFormData] = useState(person || {
    name: '',
    description: '',
    isPersonOfInterest: false,
    imageUrl: null,
    imageFileId: null
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        organizationId: organization.$id,
        createdAt: person?.$id ? formData.createdAt : new Date().toISOString()
      };

      if (person?.$id) {
        // Update existing person
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.KNOWN_PERSONS,
          person.$id,
          data
        );
        toast.success('Person updated successfully');
      } else {
        // Create new person
        await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.KNOWN_PERSONS,
          ID.unique(),
          data
        );
        toast.success('Person added successfully');
      }

      onSave();
    } catch (error) {
      toast.error('Failed to save person');
      console.error('Error saving person:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUploaded = (file) => {
    setFormData(prev => ({
      ...prev,
      imageUrl: file.fileUrl,
      imageFileId: file.fileId
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {person?.$id ? 'Edit Person' : 'Add New Person'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                required
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={formData.isPersonOfInterest}
                onChange={(e) => setFormData(prev => ({ ...prev, isPersonOfInterest: e.target.checked }))}
              />
              <label className="ml-2 block text-sm text-gray-900">
                Person of Interest
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Face Photo
              </label>
              <FileUpload
                uploadType="face"
                maxSizeMB={5}
                onFileUploaded={handleFileUploaded}
                organizationId={organization.$id}
                entityId={person?.$id || 'new'}
                className="w-full"
              />
              {formData.imageUrl && (
                <div className="mt-2">
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded border"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : (person?.$id ? 'Update' : 'Add')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
