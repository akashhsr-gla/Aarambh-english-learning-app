'use client';

import { Edit, Eye, MapPin, Plus, Search, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Region {
  _id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  totalUsers?: number;
  totalStudents?: number;
  totalTeachers?: number;
  averageScore?: number;
  createdAt: string;
  updatedAt: string;
}

interface RegionFormData {
  name: string;
  code: string;
  description: string;
  isActive: boolean;
}

export default function RegionsManagement() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<RegionFormData>({
    name: '',
    code: '',
    description: '',
    isActive: true
  });

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://aarambh-english-learning-app-1.onrender.com';

  useEffect(() => {
    fetchRegions();
  }, []);

  const getToken = () => {
    return localStorage.getItem('adminToken');
  };

  const fetchRegions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/regions`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch regions');
      }

      const data = await response.json();
      setRegions(data.data.regions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch regions');
    } finally {
      setLoading(false);
    }
  };

  const createRegion = async (regionData: RegionFormData) => {
    try {
      const response = await fetch(`${backendUrl}/regions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(regionData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create region');
      }

      setSuccess('Region created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchRegions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create region');
    }
  };

  const updateRegion = async (regionId: string, regionData: RegionFormData) => {
    try {
      const response = await fetch(`${backendUrl}/regions/${regionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(regionData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update region');
      }

      setSuccess('Region updated successfully');
      setShowEditModal(false);
      resetForm();
      fetchRegions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update region');
    }
  };

  const deleteRegion = async (regionId: string) => {
    if (!confirm('Are you sure you want to delete this region?')) {
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/regions/${regionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete region');
      }

      setSuccess('Region deleted successfully');
      fetchRegions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete region');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      isActive: true
    });
  };

  const openEditModal = (region: Region) => {
    setSelectedRegion(region);
    setFormData({
      name: region.name,
      code: region.code,
      description: region.description || '',
      isActive: region.isActive
    });
    setShowEditModal(true);
  };

  const openViewModal = (region: Region) => {
    setSelectedRegion(region);
    setShowViewModal(true);
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showEditModal && selectedRegion) {
      updateRegion(selectedRegion._id, formData);
    } else {
      createRegion(formData);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredRegions = regions.filter(region =>
    region.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    region.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Regions Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage regions and view regional statistics
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Region</span>
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={clearMessages} className="text-red-500 hover:text-red-700">
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{success}</span>
          <button onClick={clearMessages} className="text-green-500 hover:text-green-700">
            ×
          </button>
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search regions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Regions Grid */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Regions ({filteredRegions.length})</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredRegions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No regions found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredRegions.map((region) => (
              <div key={region._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{region.name}</h3>
                      <p className="text-sm text-gray-500">Code: {region.code}</p>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    region.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {region.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {region.description && (
                  <p className="text-gray-600 text-sm mb-4">{region.description}</p>
                )}

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {region.totalUsers || 0}
                    </div>
                    <div className="text-xs text-gray-500">Total Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {region.totalStudents || 0}
                    </div>
                    <div className="text-xs text-gray-500">Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {region.totalTeachers || 0}
                    </div>
                    <div className="text-xs text-gray-500">Teachers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {region.averageScore || 0}%
                    </div>
                    <div className="text-xs text-gray-500">Avg Score</div>
                  </div>
                </div>

                <div className="text-xs text-gray-400 mb-4">
                  Created: {formatDate(region.createdAt)}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => openViewModal(region)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </button>
                  <button
                    onClick={() => openEditModal(region)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded text-sm"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteRegion(region._id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {showEditModal ? 'Edit Region' : 'Create New Region'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., IN-DL"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    {showEditModal ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedRegion && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Region Details</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="text-sm text-gray-900">{selectedRegion.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Code</label>
                    <p className="text-sm text-gray-900">{selectedRegion.code}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedRegion.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedRegion.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedRegion.createdAt)}</p>
                  </div>
                </div>

                {selectedRegion.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="text-sm text-gray-900">{selectedRegion.description}</p>
                  </div>
                )}

                {/* Statistics */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statistics</label>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedRegion.totalUsers || 0}
                        </div>
                        <div className="text-xs text-gray-500">Total Users</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {selectedRegion.totalStudents || 0}
                        </div>
                        <div className="text-xs text-gray-500">Students</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="text-2xl font-bold text-purple-600">
                          {selectedRegion.totalTeachers || 0}
                        </div>
                        <div className="text-xs text-gray-500">Teachers</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <div className="w-5 h-5 bg-orange-600 rounded"></div>
                        </div>
                        <div className="text-2xl font-bold text-orange-600">
                          {selectedRegion.averageScore || 0}%
                        </div>
                        <div className="text-xs text-gray-500">Avg Score</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
