'use client';

import { Calendar, Clock, Eye, Search, Trash2, Users, Video } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SessionParticipant {
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  role: string;
  duration: number;
  joinedAt?: string;
  leftAt?: string;
}

interface Session {
  _id: string;
  sessionId: string;
  sessionType: 'video_call' | 'voice_call' | 'chat' | 'group_video_call' | 'group_voice_call' | 'group_chat' | 'game';
  title?: string;
  description?: string;
  status: 'active' | 'completed' | 'cancelled' | 'failed';
  duration: number;
  startedAt: string;
  endedAt?: string;
  createdAt: string;
  host: {
    _id: string;
    name: string;
    email: string;
  };
  participants: SessionParticipant[];
  gameSession?: {
    gameType: string;
    scores: Array<{
      user: string;
      score: number;
      percentage: number;
    }>;
  };
  chatSession?: {
    totalMessages: number;
  };
}

interface SessionsResponse {
  sessions: Session[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  statistics: Array<{
    _id: string;
    count: number;
    totalDuration: number;
    avgDuration: number;
  }>;
}

export default function SessionManagement() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSessions, setTotalSessions] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState({
    sessionType: '',
    status: '',
    search: ''
  });
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  
  // Statistics
  const [statistics, setStatistics] = useState<any[]>([]);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://aarambh-english-learning-app-1.onrender.com';

  useEffect(() => {
    fetchSessions();
  }, [currentPage, filters]);

  const getToken = () => {
    return localStorage.getItem('adminToken');
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(filters.sessionType && { sessionType: filters.sessionType }),
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`${backendUrl}/sessions/admin/all?${params}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data: { data: SessionsResponse } = await response.json();
      setSessions(data.data.sessions);
      setTotalPages(data.data.pagination.pages);
      setTotalSessions(data.data.pagination.total);
      setStatistics(data.data.statistics || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) {
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete session');
      }

      setSuccess('Session deleted successfully');
      fetchSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session');
    }
  };

  const openViewModal = (session: Session) => {
    setSelectedSession(session);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getSessionTypeIcon = (sessionType: string) => {
    switch (sessionType) {
      case 'video_call':
      case 'group_video_call':
        return <Video className="w-4 h-4" />;
      case 'voice_call':
      case 'group_voice_call':
        return <Users className="w-4 h-4" />;
      case 'chat':
      case 'group_chat':
        return <Users className="w-4 h-4" />;
      case 'game':
        return <Users className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getSessionTypeLabel = (sessionType: string) => {
    const labels: { [key: string]: string } = {
      video_call: 'Video Call',
      voice_call: 'Voice Call',
      chat: 'Chat',
      group_video_call: 'Group Video',
      group_voice_call: 'Group Voice',
      group_chat: 'Group Chat',
      game: 'Game Session'
    };
    return labels[sessionType] || sessionType;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            View and manage all user sessions
          </p>
        </div>
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

      {/* Statistics Cards */}
      {statistics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {statistics.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {getSessionTypeIcon(stat._id)}
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-500">
                    {getSessionTypeLabel(stat._id)}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.count}</div>
                  <div className="text-xs text-gray-500">
                    Avg: {formatDuration(stat.avgDuration)}
                  </div>
                </div>
              </div>
            </div>
          ))}
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
                placeholder="Search sessions..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
            <select
              value={filters.sessionType}
              onChange={(e) => handleFilterChange('sessionType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="video_call">Video Call</option>
              <option value="voice_call">Voice Call</option>
              <option value="chat">Chat</option>
              <option value="group_video_call">Group Video</option>
              <option value="group_voice_call">Group Voice</option>
              <option value="group_chat">Group Chat</option>
              <option value="game">Game Session</option>
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
              <option value="completed">Completed</option>
              <option value="active">Active</option>
              <option value="cancelled">Cancelled</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({ sessionType: '', status: '', search: '' });
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Sessions ({totalSessions})</h2>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No sessions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Session
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Host
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
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
                {sessions.map((session) => (
                  <tr key={session._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 mr-3">
                          {getSessionTypeIcon(session.sessionType)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {session.title || getSessionTypeLabel(session.sessionType)}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {session.sessionId}
                          </div>
                          {session.gameSession && (
                            <div className="text-xs text-blue-600">
                              Game: {session.gameSession.gameType}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{session.host.name}</div>
                        <div className="text-sm text-gray-500">{session.host.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">{session.participants.length}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">{formatDuration(session.duration)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.status)}`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(session.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openViewModal(session)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteSession(session._id)}
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
        )}
      </div>

      {/* View Modal */}
      {showViewModal && selectedSession && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Session Details</h3>
              
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Session ID</label>
                    <p className="text-sm text-gray-900 font-mono">{selectedSession.sessionId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <div className="flex items-center">
                      {getSessionTypeIcon(selectedSession.sessionType)}
                      <span className="ml-2 text-sm text-gray-900">
                        {getSessionTypeLabel(selectedSession.sessionType)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedSession.status)}`}>
                      {selectedSession.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration</label>
                    <p className="text-sm text-gray-900">{formatDuration(selectedSession.duration)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Started</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedSession.startedAt)}</p>
                  </div>
                  {selectedSession.endedAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Ended</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedSession.endedAt)}</p>
                    </div>
                  )}
                </div>

                {selectedSession.title && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <p className="text-sm text-gray-900">{selectedSession.title}</p>
                  </div>
                )}

                {selectedSession.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="text-sm text-gray-900">{selectedSession.description}</p>
                  </div>
                )}

                {/* Host Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Host</label>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-900">{selectedSession.host.name}</div>
                    <div className="text-sm text-gray-500">{selectedSession.host.email}</div>
                  </div>
                </div>

                {/* Participants */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Participants ({selectedSession.participants.length})
                  </label>
                  <div className="bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
                    {selectedSession.participants.map((participant, index) => (
                      <div key={index} className="p-3 border-b border-gray-200 last:border-b-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {participant.user.name}
                            </div>
                            <div className="text-sm text-gray-500">{participant.user.email}</div>
                            <div className="text-xs text-gray-400">
                              Role: {participant.role} • Duration: {formatDuration(participant.duration)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Game Session Info */}
                {selectedSession.gameSession && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Game Session</label>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-gray-900 mb-2">
                        Game Type: {selectedSession.gameSession.gameType}
                      </div>
                      {selectedSession.gameSession.scores && selectedSession.gameSession.scores.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-gray-700 mb-1">Scores:</div>
                          <div className="space-y-1">
                            {selectedSession.gameSession.scores.map((score, index) => (
                              <div key={index} className="text-xs text-gray-600">
                                Score: {score.score} ({score.percentage}%)
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Chat Session Info */}
                {selectedSession.chatSession && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Chat Session</label>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-900">
                        Total Messages: {selectedSession.chatSession.totalMessages}
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