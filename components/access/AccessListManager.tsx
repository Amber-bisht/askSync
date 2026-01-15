'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  DocumentArrowUpIcon,
  UsersIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface AccessList {
  _id: string;
  name: string;
  description: string;
  userCount: number;
  createdAt: string;
  usageCount: number;
  isActive: boolean;
  users?: Array<{
    email: string;
    name: string;
    addedAt: Date;
    lastAccessedAt?: Date;
    accessCount: number;
  }>;
}


export default function AccessListManager() {
  const { data: session } = useSession();
  const [accessLists, setAccessLists] = useState<AccessList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedList, setSelectedList] = useState<AccessList | null>(null);
  const [showListDetails, setShowListDetails] = useState(false);

  useEffect(() => {
    if (session?.user) {
      console.log('AccessListManager - Session data:', {
        isPaid: session.user.isPaid,
        accessListsLimit: session.user.accessListsLimit,
        accessListsCreated: session.user.accessListsCreated
      });
      fetchAccessLists();
    }
  }, [session]);

  const fetchAccessLists = async () => {
    try {
      const response = await fetch('/api/access-lists');
      if (response.ok) {
        const data = await response.json();
        setAccessLists(data.accessLists);
      } else {
        toast.error('Failed to fetch access lists');
      }
    } catch (error) {
      console.error('Error fetching access lists:', error);
      toast.error('Failed to fetch access lists');
    } finally {
      setLoading(false);
    }
  };

  const deleteAccessList = async (listId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/access-lists/${listId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Access list deleted successfully');
        fetchAccessLists();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete access list');
      }
    } catch (error) {
      console.error('Error deleting access list:', error);
      toast.error('Failed to delete access list');
    }
  };

  const viewListDetails = async (list: AccessList) => {
    try {
      const response = await fetch(`/api/access-lists/${list._id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedList({ ...list, users: data.accessList.users });
        setShowListDetails(true);
      } else {
        toast.error('Failed to fetch list details');
      }
    } catch (error) {
      console.error('Error fetching list details:', error);
      toast.error('Failed to fetch list details');
    }
  };

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <UsersIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Required</h1>
          <p className="text-gray-600 dark:text-gray-400">Please sign in to manage access lists.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Access Lists</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Manage user access for private forms and tests
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center px-4 py-2 border border-neutral-700 rounded-lg text-gray-300 hover:bg-neutral-800 transition-colors"
              >
                <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                Import CSV
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create List
              </button>
            </div>
          </div>
        </div>


        {/* Access Lists */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading access lists...</p>
          </div>
        ) : accessLists.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No access lists found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first access list to control who can access your private forms and tests.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Your First List
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accessLists.map((list) => (
              <div
                key={list._id}
                className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-sm hover:border-neutral-700 transition-colors p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center">
                      <UsersIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{list.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{list.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => viewListDetails(list)}
                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
                      title="View details"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedList(list);
                        setShowCreateModal(true);
                      }}
                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400"
                      title="Edit list"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteAccessList(list._id, list.name)}
                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                      title="Delete list"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Users</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{list.userCount}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Used by</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{list.usageCount} forms/tests</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${list.isActive
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}>
                      {list.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Created</span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {new Date(list.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <CreateAccessListModal
            list={selectedList}
            onClose={() => {
              setShowCreateModal(false);
              setSelectedList(null);
            }}
            onSuccess={() => {
              fetchAccessLists();
              setShowCreateModal(false);
              setSelectedList(null);
            }}
          />
        )}

        {/* Import CSV Modal */}
        {showImportModal && (
          <ImportCSVModal
            onClose={() => setShowImportModal(false)}
            onSuccess={() => {
              fetchAccessLists();
              setShowImportModal(false);
            }}
          />
        )}

        {/* List Details Modal */}
        {showListDetails && selectedList && (
          <ListDetailsModal
            list={selectedList}
            onClose={() => {
              setShowListDetails(false);
              setSelectedList(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

// Sub-components would be implemented here...
function CreateAccessListModal({ list, onClose, onSuccess }: {
  list?: AccessList | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: list?.name || '',
    description: list?.description || '',
    users: list?.users || []
  });
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(false);

  const addUser = () => {
    const email = emailInput.trim().toLowerCase();
    const name = nameInput.trim();

    if (!email) {
      toast.error('Email is required');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (formData.users.some(user => user.email === email)) {
      toast.error('Email already added');
      return;
    }

    setFormData(prev => ({
      ...prev,
      users: [...prev.users, {
        email,
        name: name || '',
        addedAt: new Date(),
        accessCount: 0
      }]
    }));

    setEmailInput('');
    setNameInput('');
    toast.success('User added successfully');
  };

  const removeUser = (emailToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      users: prev.users.filter(user => user.email !== emailToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('List name is required');
      return;
    }

    setLoading(true);

    try {
      const url = list ? `/api/access-lists/${list._id}` : '/api/access-lists';
      const method = list ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          users: formData.users
        }),
      });

      if (response.ok) {
        toast.success(`Access list ${list ? 'updated' : 'created'} successfully`);
        onSuccess();
      } else {
        const data = await response.json();
        toast.error(data.error || `Failed to ${list ? 'update' : 'create'} access list`);
      }
    } catch (error) {
      console.error('Error saving access list:', error);
      toast.error(`Failed to ${list ? 'update' : 'create'} access list`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              {list ? 'Edit Access List' : 'Create Access List'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  List Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-neutral-800 text-white"
                  placeholder="Enter list name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Enter description (optional)"
                  rows={3}
                />
              </div>

              {/* Add Users */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Add Users
                </label>
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Enter email address"
                    />
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Enter name (optional)"
                    />
                    <button
                      type="button"
                      onClick={addUser}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Users List */}
              {formData.users.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Users ({formData.users.length})
                  </label>
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg max-h-60 overflow-y-auto">
                    {formData.users.map((user, index) => (
                      <div key={user.email} className={`flex items-center justify-between p-3 ${index !== formData.users.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{user.email}</div>
                          {user.name && <div className="text-sm text-gray-500 dark:text-gray-400">{user.name}</div>}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeUser(user.email)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : (list ? 'Update List' : 'Create List')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function ImportCSVModal({ onClose, onSuccess }: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<Array<{ email: string; name: string }>>([]);
  const [listName, setListName] = useState('');
  const [listDescription, setListDescription] = useState('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    parseCSV(selectedFile);
  };

  const parseCSV = (csvFile: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length === 0) {
        toast.error('CSV file is empty');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const emailIndex = headers.findIndex(h => h.includes('email'));
      const nameIndex = headers.findIndex(h => h.includes('name'));

      if (emailIndex === -1) {
        toast.error('CSV must contain an email column');
        return;
      }

      const users: Array<{ email: string; name: string }> = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const email = values[emailIndex]?.replace(/"/g, '').trim();
        const name = nameIndex !== -1 ? values[nameIndex]?.replace(/"/g, '').trim() : '';

        if (email && email.includes('@')) {
          users.push({ email: email.toLowerCase(), name: name || '' });
        }
      }

      if (users.length === 0) {
        toast.error('No valid email addresses found in CSV');
        return;
      }

      setPreview(users);
      toast.success(`Found ${users.length} valid email addresses`);
    };

    reader.readAsText(csvFile);
  };

  const handleImport = async () => {
    if (!listName.trim()) {
      toast.error('List name is required');
      return;
    }

    if (preview.length === 0) {
      toast.error('No users to import');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/access-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: listName.trim(),
          description: listDescription.trim(),
          users: preview
        }),
      });

      if (response.ok) {
        toast.success('Access list imported successfully');
        onSuccess();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to import access list');
      }
    } catch (error) {
      console.error('Error importing access list:', error);
      toast.error('Failed to import access list');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Import CSV</h2>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* CSV Format Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2">CSV Format Requirements</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                Your CSV file should contain columns for email addresses and optionally names.
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Example: email,name<br />
                john@example.com,John Doe<br />
                jane@example.com,Jane Smith
              </p>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload CSV File
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'
                  }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Drag and drop your CSV file here, or{' '}
                  <label className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer">
                    browse
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                  </label>
                </p>
                {file && (
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                    Selected: {file.name}
                  </p>
                )}
              </div>
            </div>

            {/* List Details */}
            {preview.length > 0 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    List Name *
                  </label>
                  <input
                    type="text"
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Enter list name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Description
                  </label>
                  <textarea
                    value={listDescription}
                    onChange={(e) => setListDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Enter description (optional)"
                    rows={3}
                  />
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Preview ({preview.length} users)
                  </label>
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg max-h-60 overflow-y-auto">
                    {preview.slice(0, 10).map((user, index) => (
                      <div key={user.email} className={`flex items-center justify-between p-3 ${index !== Math.min(preview.length, 10) - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{user.email}</div>
                          {user.name && <div className="text-sm text-gray-500 dark:text-gray-400">{user.name}</div>}
                        </div>
                      </div>
                    ))}
                    {preview.length > 10 && (
                      <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
                        ... and {preview.length - 10} more users
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={loading || preview.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Importing...' : 'Import List'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ListDetailsModal({ list, onClose }: {
  list: AccessList;
  onClose: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'email' | 'name' | 'accessCount' | 'lastAccessed'>('email');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredUsers = useMemo(() => {
    if (!list.users) return [];

    const filtered = list.users.filter(user =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'email':
          aValue = a.email;
          bValue = b.email;
          break;
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'accessCount':
          aValue = a.accessCount;
          bValue = b.accessCount;
          break;
        case 'lastAccessed':
          aValue = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0;
          bValue = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc'
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });

    return filtered;
  }, [list.users, searchTerm, sortBy, sortOrder]);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const exportCSV = () => {
    if (!list.users || list.users.length === 0) {
      toast.error('No users to export');
      return;
    }

    const csvContent = [
      'Email,Name,Access Count,Last Accessed,Added Date',
      ...list.users.map(user => [
        user.email,
        user.name || '',
        user.accessCount.toString(),
        user.lastAccessedAt ? new Date(user.lastAccessedAt).toLocaleDateString() : 'Never',
        new Date(user.addedAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${list.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_users.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('User list exported successfully');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{list.name}</h2>
              {list.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">{list.description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{list.userCount || 0}</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Total Users</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{list.usageCount || 0}</div>
              <div className="text-sm text-green-700 dark:text-green-300">Forms/Tests Using</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {list.users?.reduce((sum, user) => sum + user.accessCount, 0) || 0}
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">Total Accesses</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {list.isActive ? 'Active' : 'Inactive'}
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-300">Status</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as typeof sortBy);
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="email-asc">Email (A-Z)</option>
                <option value="email-desc">Email (Z-A)</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="accessCount-desc">Most Active</option>
                <option value="accessCount-asc">Least Active</option>
                <option value="lastAccessed-desc">Recently Accessed</option>
                <option value="lastAccessed-asc">Oldest Access</option>
              </select>
            </div>
            <button
              onClick={exportCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
            >
              <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          </div>

          {/* Users Table */}
          <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-300 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Users ({filteredUsers.length})
                </h3>
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No users match your search.' : 'No users found in this list.'}
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                    <tr>
                      <th
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('email')}
                      >
                        Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('name')}
                      >
                        Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('accessCount')}
                      >
                        Access Count {sortBy === 'accessCount' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('lastAccessed')}
                      >
                        Last Accessed {sortBy === 'lastAccessed' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Added Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredUsers.map((user) => (
                      <tr key={user.email} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {user.email}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {user.name || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.accessCount > 0
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}>
                            {user.accessCount}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {user.lastAccessedAt
                            ? new Date(user.lastAccessedAt).toLocaleDateString()
                            : 'Never'
                          }
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(user.addedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
