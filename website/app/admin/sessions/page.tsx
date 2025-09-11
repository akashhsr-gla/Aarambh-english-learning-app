'use client';

import {
    Activity,
    AlertCircle,
    Clock,
    Eye,
    MessageSquare,
    Mic,
    Play,
    Search,
    Stop,
    User,
    Users,
    Video
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface Session {
  id: string;
  type: 'group_call' | 'video_call' | 'voice_call' | 'chat' | 'game';
  title: string;
  hostName: string;
  hostEmail: string;
  participants: number;
  maxParticipants: number;
  status: 'active' | 'waiting' | 'ended' | 'cancelled';
  duration: number;
  createdAt: string;
  startedAt: string;
  endedAt: string;
  features: {
    video: boolean;
    voice: boolean;
    chat: boolean;
  };
  isPrivate: boolean;
  password: string;
}

export default function SessionManagement() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const types = ['all', 'group_call', 'video_call', 'voice_call', 'chat', 'game'];
  const statuses = ['all', 'active', 'waiting', 'ended', 'cancelled'];

  useEffect(() => {
    // Simulate API call to fetch sessions
    const fetchSessions = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setSessions([
          {
            id: '1',
            type: 'group_call',
            title: 'English Practice Group',
            hostName: 'John Doe',
            hostEmail: 'john@example.com',
            participants: 5,
            maxParticipants: 10,
            status: 'active',
            duration: 25,
            createdAt: '2024-09-10T10:00:00Z',
            startedAt: '2024-09-10T10:05:00Z',
            endedAt: '',
            features: {
              video: true,
              voice: true,
              chat: true
            },
            isPrivate: false,
            password: ''
          },
          {
            id: '2',
            type: 'video_call',
            title: 'One-on-One Lesson',
            hostName: 'Jane Smith',
            hostEmail: 'jane@example.com',
            participants: 2,
            maxParticipants: 2,
            status: 'active',
            duration: 15,
            createdAt: '2024-09-10T09:30:00Z',
            startedAt: '2024-09-10T09:35:00Z',
            endedAt: '',
            features: {
              video: true,
              voice: true,
              chat: false
            },
            isPrivate: true,
            password: 'lesson123'
          },
          {
            id: '3',
            type: 'voice_call',
            title: 'Speaking Practice',
            hostName: 'Mike Johnson',
            hostEmail: 'mike@example.com',
            participants: 3,
            maxParticipants: 5,
            status: 'waiting',
            duration: 0,
            createdAt: '2024-09-10T11:00:00Z',
            startedAt: '',
            endedAt: '',
            features: {
              video: false,
              voice: true,
              chat: true
            },
            isPrivate: false,
            password: ''
          },
          {
            id: '4',
            type: 'chat',
            title: 'Grammar Discussion',
            hostName: 'Sarah Wilson',
            hostEmail: 'sarah@example.com',
            participants: 8,
            maxParticipants: 20,
            status: 'ended',
            duration: 45,
            createdAt: '2024-09-10T08:00:00Z',
            startedAt: '2024-09-10T08:05:00Z',
            endedAt: '2024-09-10T08:50:00Z',
            features: {
              video: false,
              voice: false,
              chat: true
            },
            isPrivate: false,
            password: ''
          },
          {
            id: '5',
            type: 'game',
            title: 'Word Game Session',
            hostName: 'David Brown',
            hostEmail: 'david@example.com',
            participants: 4,
            maxParticipants: 6,
            status: 'cancelled',
            duration: 0,
            createdAt: '2024-09-10T12:00:00Z',
            startedAt: '',
            endedAt: '',
            features: {
              video: false,
              voice: false,
              chat: true
            },
            isPrivate: true,
            password: 'game456'
          }
        ]);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.hostName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || session.type === filterType;
    const matchesStatus = filterStatus === 'all' || session.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const activeSessions = sessions.filter(s => s.status === 'active').length;
  const waitingSessions = sessions.filter(s => s.status === 'waiting').length;
  const totalParticipants = sessions.reduce((sum, s) => sum + s.participants, 0);
  const averageDuration = sessions
    .filter(s => s.duration > 0)
    .reduce((sum, s) => sum + s.duration, 0) / sessions.filter(s => s.duration > 0).length || 0;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'group_call':
        return <Users className="w-5 h-5 text-blue-600" />;
      case 'video_call':
        return <Video className="w-5 h-5 text-green-600" />;
      case 'voice_call':
        return <Mic className="w-5 h-5 text-purple-600" />;
      case 'chat':
        return <MessageSquare className="w-5 h-5 text-orange-600" />;
      case 'game':
        return <Activity className="w-5 h-5 text-red-600" />;
      default:
        return <Users className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="w-4 h-4 text-green-600" />;
      case 'waiting':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'ended':
        return <Stop className="w-4 h-4 text-gray-600" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'ended':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes === 0) return 'Not started';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Session Management</h1>
        <p className="text-gray-600 mt-2">Monitor and manage all active sessions</p>
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Play className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{activeSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Waiting Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{waitingSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Participants</p>
              <p className="text-2xl font-bold text-gray-900">{totalParticipants}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Duration</p>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(Math.round(averageDuration))}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="lg:w-48">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Types</option>
              {types.slice(1).map(type => (
                <option key={type} value={type}>
                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {filteredSessions.map((session) => (
          <div key={session.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {getTypeIcon(session.type)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900">{session.title}</h3>
                    {session.isPrivate && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                        Private
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                    <span className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {session.hostName}
                    </span>
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {session.participants}/{session.maxParticipants}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatDuration(session.duration)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    {session.features.video && (
                      <span className="flex items-center text-xs text-green-600">
                        <Video className="w-3 h-3 mr-1" />
                        Video
                      </span>
                    )}
                    {session.features.voice && (
                      <span className="flex items-center text-xs text-blue-600">
                        <Mic className="w-3 h-3 mr-1" />
                        Voice
                      </span>
                    )}
                    {session.features.chat && (
                      <span className="flex items-center text-xs text-orange-600">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Chat
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  {getStatusIcon(session.status)}
                  <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.status)}`}>
                    {session.status}
                  </span>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <div>Created: {new Date(session.createdAt).toLocaleDateString()}</div>
                  {session.startedAt && (
                    <div>Started: {new Date(session.startedAt).toLocaleTimeString()}</div>
                  )}
                  {session.endedAt && (
                    <div>Ended: {new Date(session.endedAt).toLocaleTimeString()}</div>
                  )}
                </div>
                <button className="text-indigo-600 hover:text-indigo-900">
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredSessions.length === 0 && (
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterType !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'No sessions have been created yet'
            }
          </p>
        </div>
      )}
    </div>
  );
}
