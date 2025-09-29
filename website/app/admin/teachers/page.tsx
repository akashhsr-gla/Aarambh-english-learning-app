'use client';

import { Eye, GraduationCap, Search, UserCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Teacher {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  region: {
    _id: string;
    name: string;
    code: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Referral {
  _id: string;
  referredUserId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    region: {
      name: string;
      code: string;
    };
    isActive: boolean;
    createdAt: string;
  };
  referralCode: string;
  createdAt: string;
  isActive: boolean;
}

interface TeacherWithReferrals extends Teacher {
  totalReferrals: number;
  activeReferrals: number;
}

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState<TeacherWithReferrals[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [referralsLoading, setReferralsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [showReferralsModal, setShowReferralsModal] = useState(false);
  
  // Search
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const teachersPerPage = 10;

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://aarambh-english-learning-app-1.onrender.com';

  useEffect(() => {
    fetchTeachers();
  }, [currentPage, searchTerm]);

  const getToken = () => {
    return localStorage.getItem('adminToken');
  };

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: teachersPerPage.toString(),
        role: 'teacher'
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`${backendUrl}/api/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch teachers');
      }

      const data = await response.json();
      setTeachers(data.data.users || []);
      setTotalPages(data.data.pagination?.totalPages || 1);
      setTotalTeachers(data.data.pagination?.totalUsers || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherReferrals = async (teacherId: string) => {
    try {
      setReferralsLoading(true);
      const response = await fetch(`${backendUrl}/api/admin/referrals/teacher/${teacherId}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch referrals');
      }

      const data = await response.json();
      setReferrals(data.data.referrals || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch referrals');
    } finally {
      setReferralsLoading(false);
    }
  };

  const openReferralsModal = async (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setShowReferralsModal(true);
    await fetchTeacherReferrals(teacher._id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const clearError = () => {
    setError(null);
  };

  // Calculate pagination range
  const getVisiblePages = () => {
    const maxVisible = 5;
    const halfVisible = Math.floor(maxVisible / 2);
    let start = Math.max(currentPage - halfVisible, 1);
    let end = Math.min(start + maxVisible - 1, totalPages);

    if (end - start + 1 < maxVisible) {
      start = Math.max(end - maxVisible + 1, 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            View all teachers and their student referrals
          </p>
        </div>
        <div className="bg-blue-100 px-4 py-2 rounded-lg">
          <span className="text-sm font-medium text-blue-800">
            Total Teachers: {totalTeachers}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-500 hover:text-red-700">
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
            placeholder="Search teachers by name or email..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Teachers List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Teachers ({totalTeachers})
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No teachers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria.' : 'No teachers are registered yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Region
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referrals
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teachers.map((teacher) => (
                  <tr key={teacher._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-purple-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                          <div className="text-sm text-gray-500">ID: {teacher._id.slice(-8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{teacher.email}</div>
                      {teacher.phone && (
                        <div className="text-sm text-gray-500">{teacher.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{teacher.region.name}</div>
                      <div className="text-sm text-gray-500">{teacher.region.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">
                            {teacher.totalReferrals || 0}
                          </div>
                          <div className="text-xs text-gray-500">Total</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">
                            {teacher.activeReferrals || 0}
                          </div>
                          <div className="text-xs text-gray-500">Active</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        teacher.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {teacher.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(teacher.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openReferralsModal(teacher)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Referrals</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * teachersPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * teachersPerPage, totalTeachers)}
                  </span>{' '}
                  of <span className="font-medium">{totalTeachers}</span> teachers
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {getVisiblePages().map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Referrals Modal */}
      {showReferralsModal && selectedTeacher && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Referrals by {selectedTeacher.name}
              </h3>
              
              {referralsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : referrals.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No referrals found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    This teacher hasn't referred any students yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Region
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Referral Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {referrals.map((referral) => (
                        <tr key={referral._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                  <UserCheck className="w-4 h-4 text-green-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {referral.referredUserId.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {referral.referredUserId.role}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{referral.referredUserId.email}</div>
                            {referral.referredUserId.phone && (
                              <div className="text-sm text-gray-500">{referral.referredUserId.phone}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {referral.referredUserId.region.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {referral.referredUserId.region.code}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                              {referral.referralCode}
                            </code>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              referral.referredUserId.isActive && referral.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {referral.referredUserId.isActive && referral.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(referral.referredUserId.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => {
                    setShowReferralsModal(false);
                    setSelectedTeacher(null);
                    setReferrals([]);
                  }}
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
