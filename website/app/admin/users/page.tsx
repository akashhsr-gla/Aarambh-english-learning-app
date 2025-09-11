'use client';

import {
    Calendar,
    Crown,
    Edit,
    Mail,
    Phone,
    Plus,
    Search,
    Shield,
    Trash2,
    UserCheck,
    Users,
    UserX
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'student' | 'teacher' | 'admin';
  status: 'active' | 'inactive';
  subscriptionStatus?: 'active' | 'inactive' | 'expired' | 'cancelled';
  subscriptionPlan?: string;
  joinDate?: string;
  lastActive?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const backendUrl = useMemo(() => (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'), []);
  const [regions, setRegions] = useState<{ _id: string; name: string }[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', phone: '', password: '', role: 'student', region: '' });
  const [createError, setCreateError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const roles = ['all', 'student', 'teacher', 'admin'];
  const statuses = ['all', 'active', 'inactive'];

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams();
      if (filterRole !== 'all') params.set('role', filterRole);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (searchTerm) params.set('search', searchTerm);
      params.set('page', String(page));
      params.set('limit', String(limit));
      params.set('sortBy', 'createdAt');
      params.set('sortOrder', 'desc');

      const res = await fetch(`${backendUrl}/api/users?${params.toString()}`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to load users');
      const list = (json.data?.users || []) as any[];
      const mapped: UserRow[] = list.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone || '',
        role: u.role,
        status: u.isActive ? 'active' : 'inactive',
        subscriptionStatus: u.studentInfo?.subscriptionStatus,
        subscriptionPlan: u.studentInfo?.currentPlan?.name,
        region: u.region?.name,
        joinDate: u.createdAt,
        lastActive: u.updatedAt
      }));
      setUsers(mapped);
      setTotal(json.data?.pagination?.total || mapped.length);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // load regions for forms
    (async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`${backendUrl}/api/regions`, { headers: { 'Authorization': token ? `Bearer ${token}` : '' } });
        const json = await res.json();
        if (res.ok && json.success) setRegions(json.data?.regions || []);
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRole, filterStatus, page]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const toggleUserStatus = async (userId: string, currentStatus: 'active' | 'inactive') => {
    try {
      const token = localStorage.getItem('adminToken');
      if (currentStatus === 'active') {
        const res = await fetch(`${backendUrl}/api/users/${userId}`, {
          method: 'DELETE',
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || 'Deactivate failed');
      } else {
        const res = await fetch(`${backendUrl}/api/users/${userId}/reactivate`, {
          method: 'PATCH',
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || 'Reactivate failed');
      }
      setUsers(users.map(u => u.id === userId ? { ...u, status: currentStatus === 'active' ? 'inactive' : 'active' } : u));
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Deactivate this user?')) return;
    await toggleUserStatus(userId, 'active');
  };

  const openEdit = async (userId: string) => {
    setSelectedUserId(userId);
    setShowEdit(true);
    setEditLoading(true);
    setEditError(null);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${backendUrl}/api/users/${userId}`, { headers: { 'Authorization': token ? `Bearer ${token}` : '' } });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to load user');
      const u = json.data;
      setEditForm({
        name: u.name || '',
        email: u.email || '',
        phone: u.phone || '',
        role: u.role || 'student',
        region: u.region?._id || '',
        studentInfo: {
          subscriptionStatus: u.studentInfo?.subscriptionStatus || 'inactive'
        }
      });
    } catch (err: any) {
      setEditError(err.message || 'Failed to load user');
    } finally {
      setEditLoading(false);
    }
  };

  const saveEdit = async () => {
    if (!selectedUserId || !editForm) return;
    try {
      setEditLoading(true);
      setEditError(null);
      const token = localStorage.getItem('adminToken');
      const payload: any = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        role: editForm.role,
        region: editForm.region,
        studentInfo: editForm.role === 'student' ? { subscriptionStatus: editForm.studentInfo?.subscriptionStatus } : undefined
      };
      const res = await fetch(`${backendUrl}/api/users/${selectedUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Save failed');
      setShowEdit(false);
      fetchUsers();
    } catch (err: any) {
      setEditError(err.message || 'Save failed');
    } finally {
      setEditLoading(false);
    }
  };

  const createUser = async () => {
    try {
      setCreateError(null);
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${backendUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify({
          name: createForm.name,
          email: createForm.email,
          phone: createForm.phone,
          password: createForm.password,
          role: createForm.role, // student or teacher per backend
          region: createForm.region
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Create failed');
      setShowCreate(false);
      setCreateForm({ name: '', email: '', phone: '', password: '', role: 'student', region: '' });
      fetchUsers();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create');
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    setSelectedUsers(filteredUsers.map(user => user.id));
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage all users in your app</p>
        </div>
        <button onClick={()=>setShowCreate(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="lg:w-48">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Roles</option>
              {roles.slice(1).map(role => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="lg:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Status</option>
              {statuses.slice(1).map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-indigo-700">
                {selectedUsers.length} user(s) selected
              </span>
              <div className="flex space-x-2">
                <button className="text-sm text-indigo-600 hover:text-indigo-800">
                  Export Selected
                </button>
                <button className="text-sm text-indigo-600 hover:text-indigo-800">
                  Send Email
                </button>
                <button className="text-sm text-indigo-600 hover:text-indigo-800">
                  Bulk Actions
                </button>
                <button 
                  onClick={clearSelection}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={selectAllUsers}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-indigo-600">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          {user.email}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Phone className="w-4 h-4 mr-1" />
                          {user.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {user.region || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {user.role === 'admin' ? (
                        <Crown className="w-4 h-4 text-yellow-600 mr-2" />
                      ) : user.role === 'teacher' ? (
                        <Shield className="w-4 h-4 text-blue-600 mr-2" />
                      ) : (
                        <Users className="w-4 h-4 text-gray-600 mr-2" />
                      )}
                      <span className="text-sm text-gray-900 capitalize">{user.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{user.subscriptionPlan || '-'}</div>
                      <div className={`text-xs ${
                        user.subscriptionStatus === 'active' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {user.subscriptionStatus || '-'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center text-xs">
                      <Calendar className="w-3 h-3 mr-1" />
                      {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button onClick={()=>openEdit(user.id)} className="text-gray-600 hover:text-gray-900" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => toggleUserStatus(user.id, user.status === 'active' ? 'inactive' : 'active')}
                        className={user.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                      >
                        {user.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => deleteUser(user.id)}
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
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterRole !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'No users have been added yet'
            }
          </p>
        </div>
      )}

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create User</h3>
              <button onClick={()=>setShowCreate(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input value={createForm.name} onChange={(e)=>setCreateForm({...createForm, name:e.target.value})} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input value={createForm.email} onChange={(e)=>setCreateForm({...createForm, email:e.target.value})} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input value={createForm.phone} onChange={(e)=>setCreateForm({...createForm, phone:e.target.value})} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" value={createForm.password} onChange={(e)=>setCreateForm({...createForm, password:e.target.value})} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={createForm.role} onChange={(e)=>setCreateForm({...createForm, role:e.target.value})} className="w-full border rounded px-3 py-2">
                  <option value="student">student</option>
                  <option value="teacher">teacher</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <select value={createForm.region} onChange={(e)=>setCreateForm({...createForm, region:e.target.value})} className="w-full border rounded px-3 py-2">
                  <option value="">Select region</option>
                  {regions.map(r => (
                    <option key={r._id} value={r._id}>{r.name}</option>
                  ))}
                </select>
              </div>
              {createError && <div className="p-2 text-sm text-red-700 bg-red-50 rounded">{createError}</div>}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={()=>setShowCreate(false)} className="px-4 py-2 rounded border">Cancel</button>
              <button onClick={createUser} className="px-4 py-2 rounded bg-indigo-600 text-white">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
              <button onClick={()=>setShowEdit(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            {editLoading && <div className="text-sm text-gray-600">Loading...</div>}
            {editError && <div className="mb-3 p-2 text-sm text-red-700 bg-red-50 rounded">{editError}</div>}
            {editForm && !editLoading && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input value={editForm.name} onChange={(e)=>setEditForm({...editForm, name:e.target.value})} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input value={editForm.email} onChange={(e)=>setEditForm({...editForm, email:e.target.value})} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input value={editForm.phone} onChange={(e)=>setEditForm({...editForm, phone:e.target.value})} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select value={editForm.role} onChange={(e)=>setEditForm({...editForm, role:e.target.value})} className="w-full border rounded px-3 py-2">
                    <option value="student">student</option>
                    <option value="teacher">teacher</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                  <select value={editForm.region} onChange={(e)=>setEditForm({...editForm, region:e.target.value})} className="w-full border rounded px-3 py-2">
                    <option value="">Select region</option>
                    {regions.map(r => (
                      <option key={r._id} value={r._id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                {editForm.role === 'student' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Status</label>
                    <select value={editForm.studentInfo?.subscriptionStatus} onChange={(e)=>setEditForm({
                      ...editForm,
                      studentInfo: { ...editForm.studentInfo, subscriptionStatus: e.target.value }
                    })} className="w-full border rounded px-3 py-2">
                      <option value="inactive">inactive</option>
                      <option value="active">active</option>
                      <option value="expired">expired</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </div>
                )}
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={()=>setShowEdit(false)} className="px-4 py-2 rounded border">Cancel</button>
                  <button onClick={saveEdit} className="px-4 py-2 rounded bg-indigo-600 text-white">Save</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
