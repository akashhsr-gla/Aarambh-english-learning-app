'use client';

import { Edit, Eye, FileText, Plus, Search, Trash2, Video } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Lecture {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  notes?: {
    pdfUrl?: string;
    textContent?: string;
  };
  instructor?: {
    name: string;
    email: string;
  };
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  isPremium: boolean;
  isActive: boolean;
  totalViews: number;
  createdAt: string;
}

interface LectureFormData {
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  notes: {
    pdfUrl: string;
    textContent: string;
  };
  instructor: string;
  region: string;
  isPremium: boolean;
  isActive: boolean;
  tags: string[];
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export default function LectureManagement() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLectures, setTotalLectures] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState({
    difficulty: '',
    isPremium: '',
    search: ''
  });
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<LectureFormData>({
    title: '',
    description: '',
    videoUrl: '',
    thumbnailUrl: '',
    duration: 0,
    notes: {
      pdfUrl: '',
      textContent: ''
    },
    instructor: '',
    region: '',
    isPremium: false,
    isActive: true,
    tags: [],
    category: '',
    difficulty: 'beginner'
  });

  const [instructors, setInstructors] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      videoUrl: '',
      thumbnailUrl: '',
      duration: 0,
      notes: {
        pdfUrl: '',
        textContent: ''
      },
      instructor: '',
      region: '',
      isPremium: false,
      isActive: true,
      tags: [],
      category: '',
      difficulty: 'beginner'
    });
    setSelectedLecture(null);
  };

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://aarambh-english-learning-app-1.onrender.com';

  useEffect(() => {
    fetchLectures();
    fetchInstructors();
    fetchRegions();
  }, [currentPage, filters]);

  const getToken = () => {
    return localStorage.getItem('adminToken');
  };

  const fetchLectures = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(filters.difficulty && { difficulty: filters.difficulty }),
        ...(filters.isPremium && { premium: filters.isPremium }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`${backendUrl}/lectures?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch lectures');
      }

      const data = await response.json();
      setLectures(data.data.lectures);
      setTotalPages(data.data.pagination.pages);
      setTotalLectures(data.data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch lectures');
    } finally {
      setLoading(false);
    }
  };

  const fetchInstructors = async () => {
    try {
      const response = await fetch(`${backendUrl}/users?role=teacher`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInstructors(data.data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch instructors:', err);
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

  const createLecture = async (lectureData: LectureFormData) => {
    try {
      const response = await fetch(`${backendUrl}/lectures`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(lectureData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create lecture');
      }

      setSuccess('Lecture created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchLectures();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create lecture');
    }
  };

  const updateLecture = async (id: string, lectureData: LectureFormData) => {
    try {
      const response = await fetch(`${backendUrl}/lectures/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(lectureData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update lecture');
      }

      setSuccess('Lecture updated successfully');
      setShowEditModal(false);
      resetForm();
      fetchLectures();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update lecture');
    }
  };

  const deleteLecture = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lecture?')) return;

    try {
      const response = await fetch(`${backendUrl}/lectures/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete lecture');
      }

      setSuccess('Lecture deleted successfully');
      fetchLectures();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete lecture');
    }
  };

  const toggleLectureStatus = async (id: string) => {
    try {
      const response = await fetch(`${backendUrl}/lectures/${id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to toggle lecture status');
      }

      setSuccess('Lecture status updated successfully');
      fetchLectures();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle lecture status');
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const isGoogleDriveUrl = (url: string) => {
    return url.includes('drive.google.com') || url.includes('docs.google.com');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (showCreateModal) {
      createLecture(formData);
    } else if (showEditModal && selectedLecture) {
      updateLecture(selectedLecture._id, formData);
    }
  };

  const handleEdit = (lecture: Lecture) => {
    setFormData({
      title: lecture.title,
      description: lecture.description,
      videoUrl: lecture.videoUrl,
      thumbnailUrl: lecture.thumbnailUrl || '',
      duration: lecture.duration,
      notes: {
        pdfUrl: lecture.notes?.pdfUrl || '',
        textContent: lecture.notes?.textContent || ''
      },
      instructor: lecture.instructor?._id || '',
      region: '',
      isPremium: lecture.isPremium,
      isActive: lecture.isActive,
      tags: lecture.tags,
      category: '',
      difficulty: lecture.difficulty
    });
    setSelectedLecture(lecture);
    setShowEditModal(true);
  };

  const handleView = (lecture: Lecture) => {
    setSelectedLecture(lecture);
    setShowViewModal(true);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lecture Management</h1>
          <p className="text-gray-600">Manage video lectures and course content</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Lecture
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search lectures..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
            <select
              value={filters.difficulty}
              onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.isPremium}
              onChange={(e) => setFilters({ ...filters, isPremium: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="false">Free</option>
              <option value="true">Premium</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ difficulty: '', isPremium: '', search: '' })}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      {/* Lectures Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading lectures...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lecture
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Difficulty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lectures.map((lecture) => (
                    <tr key={lecture._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            {lecture.thumbnailUrl ? (
                              <img
                                className="h-12 w-12 rounded-lg object-cover"
                                src={lecture.thumbnailUrl}
                                alt={lecture.title}
                              />
                            ) : (
                              <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                <Video className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {lecture.title}
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {lecture.description}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {isGoogleDriveUrl(lecture.videoUrl) && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Google Drive
                                </span>
                              )}
                              {lecture.notes?.pdfUrl && isGoogleDriveUrl(lecture.notes.pdfUrl) && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <FileText className="w-3 h-3 mr-1" />
                                  PDF Notes
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDuration(lecture.duration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          lecture.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                          lecture.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {lecture.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          lecture.isPremium ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {lecture.isPremium ? 'Premium' : 'Free'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lecture.totalViews.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleLectureStatus(lecture._id)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            lecture.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {lecture.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleView(lecture)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(lecture)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteLecture(lecture._id)}
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

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
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
                    Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * 10, totalLectures)}
                    </span>{' '}
                    of <span className="font-medium">{totalLectures}</span> results
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
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {showCreateModal ? 'Create New Lecture' : 'Edit Lecture'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter lecture title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (seconds) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Duration in seconds"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter lecture description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Video URL *</label>
                    <div className="relative">
                      <input
                        type="url"
                        required
                        value={formData.videoUrl}
                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://drive.google.com/file/d/... or direct video URL"
                      />
                      {isGoogleDriveUrl(formData.videoUrl) && (
                        <div className="absolute right-2 top-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Google Drive
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Supports Google Drive sharing URLs and direct video URLs
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
                    <div className="relative">
                      <input
                        type="url"
                        value={formData.thumbnailUrl}
                        onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://drive.google.com/file/d/... or direct image URL"
                      />
                      {isGoogleDriveUrl(formData.thumbnailUrl) && (
                        <div className="absolute right-2 top-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Google Drive
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instructor *</label>
                    <select
                      required
                      value={formData.instructor}
                      onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Instructor</option>
                      {instructors.map((instructor) => (
                        <option key={instructor._id} value={instructor._id}>
                          {instructor.name} ({instructor.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty *</label>
                    <select
                      required
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PDF Notes URL</label>
                  <div className="relative">
                    <input
                      type="url"
                      value={formData.notes.pdfUrl}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        notes: { ...formData.notes, pdfUrl: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://drive.google.com/file/d/... or direct PDF URL"
                    />
                    {isGoogleDriveUrl(formData.notes.pdfUrl) && (
                      <div className="absolute right-2 top-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <FileText className="w-3 h-3 mr-1" />
                          Google Drive PDF
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Supports Google Drive sharing URLs and direct PDF URLs
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Text Notes</label>
                  <textarea
                    rows={4}
                    value={formData.notes.textContent}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      notes: { ...formData.notes, textContent: e.target.value }
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter text notes for the lecture"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPremium"
                      checked={formData.isPremium}
                      onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isPremium" className="ml-2 block text-sm text-gray-900">
                      Premium Content
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                      Active
                    </label>
                  </div>
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
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {showCreateModal ? 'Create Lecture' : 'Update Lecture'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedLecture && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Lecture Details</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{selectedLecture.title}</h4>
                  <p className="text-gray-600 mt-1">{selectedLecture.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Duration:</span>
                    <p className="text-sm text-gray-900">{formatDuration(selectedLecture.duration)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Difficulty:</span>
                    <p className="text-sm text-gray-900 capitalize">{selectedLecture.difficulty}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Type:</span>
                    <p className="text-sm text-gray-900">{selectedLecture.isPremium ? 'Premium' : 'Free'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Views:</span>
                    <p className="text-sm text-gray-900">{selectedLecture.totalViews.toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-500">Video URL:</span>
                  <p className="text-sm text-blue-600 break-all">{selectedLecture.videoUrl}</p>
                  {isGoogleDriveUrl(selectedLecture.videoUrl) && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                      Google Drive Video
                    </span>
                  )}
                </div>

                {selectedLecture.notes?.pdfUrl && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">PDF Notes:</span>
                    <p className="text-sm text-blue-600 break-all">{selectedLecture.notes.pdfUrl}</p>
                    {isGoogleDriveUrl(selectedLecture.notes.pdfUrl) && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                        <FileText className="w-3 h-3 mr-1" />
                        Google Drive PDF
                      </span>
                    )}
                  </div>
                )}

                {selectedLecture.notes?.textContent && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Text Notes:</span>
                    <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{selectedLecture.notes.textContent}</p>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
