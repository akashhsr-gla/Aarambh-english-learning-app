'use client';

import { Edit, Eye, Plus, Search, Trash2, UserCheck, UserX } from 'lucide-react';
import { useEffect, useState } from 'react';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'student' | 'teacher' | 'admin';
  isActive: boolean;
  isEmailVerified: boolean;
  region?: {
    _id: string;
    name: string;
    code: string;
  };
  studentInfo?: {
    age?: number;
    currentPlan?: any;
    subscriptionStatus?: string;
  };
  teacherInfo?: {
    qualification?: string;
    experience?: number;
    referralCode?: string;
  };
  adminInfo?: {
    permissions?: string[];
  };
  createdAt: string;
}

interface Region {
  _id: string;
  name: string;
  code: string;
}

interface UserFormData {
  name: string;
  email: string;
  phone: string;
  role: 'student' | 'teacher' | 'admin';
  region: string;
  password: string;
  isActive: boolean;
  isEmailVerified: boolean;
  // Role-specific fields
  age?: number;
  qualification?: string;
  experience?: number;
  permissions?: string[];
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: ''
  });
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    phone: '',
    role: 'student',
    region: '',
    password: '',
    isActive: true,
    isEmailVerified: false
  });

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://aarambh-english-learning-app-1.onrender.com';

  useEffect(() => {
    fetchUsers();
    fetchRegions();
  }, [currentPage, filters]);

  const getToken = () => {
    return localStorage.getItem('adminToken');
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(filters.role && { role: filters.role }),
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`${backendUrl}/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.data.users);
      setTotalPages(data.data.pagination.pages);
      setTotalUsers(data.data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegions = async () => {
    try {
      const response = await fetch(`${backendUrl}/regions`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRegions(data.data.regions || []);
      }
    } catch (err) {
      console.error('Failed to fetch regions:', err);
    }
  };

  const createUser = async (userData: UserFormData) => {
    try {
      const payload: any = {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        role: userData.role,
        region: userData.region,
        isActive: userData.isActive,
        isEmailVerified: userData.isEmailVerified
      };

      // Add role-specific data
      if (userData.role === 'student' && userData.age) {
        payload.studentInfo = { age: userData.age };
      } else if (userData.role === 'teacher') {
        payload.teacherInfo = {
          qualification: userData.qualification || '',
          experience: userData.experience || 0
        };
      } else if (userData.role === 'admin') {
        payload.adminInfo = {
          permissions: userData.permissions || []
        };
      }

      const response = await fetch(`${backendUrl}/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }

      setSuccess('User created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  const updateUser = async (userId: string, userData: Partial<UserFormData>) => {
    try {
      const payload: any = {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        region: userData.region,
        isActive: userData.isActive,
        isEmailVerified: userData.isEmailVerified
      };

      // Add password only if provided
      if (userData.password && userData.password.trim()) {
        payload.password = userData.password;
      }

      // Add role-specific data
      if (userData.role === 'student' && userData.age) {
        payload.studentInfo = { age: userData.age };
      } else if (userData.role === 'teacher') {
        payload.teacherInfo = {
          qualification: userData.qualification || '',
          experience: userData.experience || 0
        };
      } else if (userData.role === 'admin') {
        payload.adminInfo = {
          permissions: userData.permissions || []
        };
      }

      const response = await fetch(`${backendUrl}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }

      setSuccess('User updated successfully');
      setShowEditModal(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }

      setSuccess('User deleted successfully');
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'student',
      region: '',
      password: '',
      isActive: true,
      isEmailVerified: false
    });
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      region: user.region?._id || '',
      password: '', // Don't prefill password
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      age: user.studentInfo?.age,
      qualification: user.teacherInfo?.qualification,
      experience: user.teacherInfo?.experience,
      permissions: user.adminInfo?.permissions || []
    });
    setShowEditModal(true);
  };

  const openViewModal = (user: User) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showEditModal && selectedUser) {
      updateUser(selectedUser._id, formData);
    } else {
      createUser(formData);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage all users - students, teachers, and admins
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
          <span>Create User</span>
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

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, email..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex items-end">
                <button 
              onClick={() => {
                setFilters({ role: '', status: '', search: '' });
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
                </button>
              </div>
            </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Users ({totalUsers})</h2>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
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
                    Region
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
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.phone && (
                          <div className="text-xs text-gray-400">{user.phone}</div>
                        )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-red-100 text-red-800'
                          : user.role === 'teacher'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                    </span>
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.region ? `${user.region.name} (${user.region.code})` : 'No Region'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {user.isActive ? (
                          <UserCheck className="w-4 h-4 text-green-500" />
                        ) : (
                          <UserX className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-sm ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openViewModal(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                      </button>
                      <button 
                          onClick={() => openEditModal(user)}
                          className="text-yellow-600 hover:text-yellow-900"
                      >
                          <Edit className="w-4 h-4" />
                      </button>
                      <button 
                          onClick={() => deleteUser(user._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                  <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
              </div>
              <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {showEditModal ? 'Edit User' : 'Create New User'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
              <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
              </div>

              <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                    <select
                      required
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as 'student' | 'teacher' | 'admin' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                    <select
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Region</option>
                      {regions.map((region) => (
                        <option key={region._id} value={region._id}>
                          {region.name} ({region.code})
                        </option>
                  ))}
                </select>
              </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password {showEditModal ? '(leave blank to keep current)' : '*'}
                    </label>
                    <input
                      type="password"
                      required={!showEditModal}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Role-specific fields */}
                {formData.role === 'student' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      value={formData.age || ''}
                      onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                {formData.role === 'teacher' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                      <input
                        type="text"
                        value={formData.qualification || ''}
                        onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.experience || ''}
                        onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                {formData.role === 'admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Permissions</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['manage_users', 'manage_content', 'manage_plans', 'view_analytics', 'manage_teachers', 'manage_transactions', 'manage_regions'].map((permission) => (
                        <label key={permission} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.permissions?.includes(permission) || false}
                            onChange={(e) => {
                              const permissions = formData.permissions || [];
                              if (e.target.checked) {
                                setFormData({ ...formData, permissions: [...permissions, permission] });
                              } else {
                                setFormData({ ...formData, permissions: permissions.filter(p => p !== permission) });
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{permission.replace(/_/g, ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isEmailVerified}
                      onChange={(e) => setFormData({ ...formData, isEmailVerified: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Email Verified</span>
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
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Details</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="text-sm text-gray-900">{selectedUser.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-sm text-gray-900">{selectedUser.phone || 'Not provided'}</p>
            </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <p className="text-sm text-gray-900">{selectedUser.role}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Region</label>
                    <p className="text-sm text-gray-900">
                      {selectedUser.region ? `${selectedUser.region.name} (${selectedUser.region.code})` : 'No Region'}
                    </p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <p className={`text-sm ${selectedUser.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedUser.isActive ? 'Active' : 'Inactive'}
                    </p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email Verified</label>
                    <p className={`text-sm ${selectedUser.isEmailVerified ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedUser.isEmailVerified ? 'Yes' : 'No'}
                    </p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedUser.createdAt)}</p>
                  </div>
                </div>

                {/* Role-specific information */}
                {selectedUser.role === 'student' && selectedUser.studentInfo && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Student Information</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        {selectedUser.studentInfo.age && (
                          <div>
                            <label className="block text-xs font-medium text-gray-600">Age</label>
                            <p className="text-sm text-gray-900">{selectedUser.studentInfo.age}</p>
                          </div>
                        )}
                        {selectedUser.studentInfo.subscriptionStatus && (
                          <div>
                            <label className="block text-xs font-medium text-gray-600">Subscription</label>
                            <p className="text-sm text-gray-900">{selectedUser.studentInfo.subscriptionStatus}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {selectedUser.role === 'teacher' && selectedUser.teacherInfo && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Teacher Information</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        {selectedUser.teacherInfo.qualification && (
                          <div>
                            <label className="block text-xs font-medium text-gray-600">Qualification</label>
                            <p className="text-sm text-gray-900">{selectedUser.teacherInfo.qualification}</p>
                          </div>
                        )}
                        {selectedUser.teacherInfo.experience !== undefined && (
                          <div>
                            <label className="block text-xs font-medium text-gray-600">Experience</label>
                            <p className="text-sm text-gray-900">{selectedUser.teacherInfo.experience} years</p>
                          </div>
                        )}
                        {selectedUser.teacherInfo.referralCode && (
                          <div>
                            <label className="block text-xs font-medium text-gray-600">Referral Code</label>
                            <p className="text-sm text-gray-900">{selectedUser.teacherInfo.referralCode}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {selectedUser.role === 'admin' && selectedUser.adminInfo && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Admin Information</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div>
                        <label className="block text-xs font-medium text-gray-600">Permissions</label>
                        <div className="mt-1">
                          {selectedUser.adminInfo.permissions && selectedUser.adminInfo.permissions.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {selectedUser.adminInfo.permissions.map((permission) => (
                                <span key={permission} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {permission.replace(/_/g, ' ')}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No permissions set</p>
                          )}
                        </div>
                      </div>
                </div>
              </div>
            )}
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