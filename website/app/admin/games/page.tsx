'use client';

import { Edit, Eye, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface GameQuestion {
  questionNumber: number;
  questionText: string;
  questionType: 'multiple_choice' | 'true_false' | 'fill_blank' | 'audio' | 'image' | 'video';
  points: number;
  options?: Array<{
    text: string;
    isCorrect: boolean;
    explanation?: string;
  }>;
  correctAnswer?: string;
  explanation?: string;
  hint?: string;
  timeLimit?: number;
  mediaUrl?: string;
  mediaType?: string;
  // Game-specific fields
  grammarRule?: string;
  pronunciationGuide?: string;
  wordCategory?: string;
  storyContext?: string;
  phonetic?: string;
  example?: string;
  tips?: string;
  difficulty?: string;
  keywords?: string[];
  storyBeginning?: string;
  suggestedWords?: string[];
  wordLimit?: number;
  minWords?: number;
}

interface Game {
  _id: string;
  title: string;
  description: string;
  gameType: 'grammar' | 'pronunciation' | 'identification' | 'storytelling';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  level: number;
  timeLimit: number;
  maxScore: number;
  passingScore: number;
  totalQuestions: number;
  questions: GameQuestion[];
  isPremium: boolean;
  requiresSubscription: boolean;
  categories: string[];
  tags: string[];
  isActive: boolean;
  totalPlays: number;
  averageScore: number;
  completionRate: number;
  createdAt: string;
  updatedAt: string;
}

interface GameFormData {
    title: string;
    description: string;
    gameType: 'grammar' | 'pronunciation' | 'identification' | 'storytelling';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    level: number;
    timeLimit: number;
    maxScore: number;
    passingScore: number;
  totalQuestions: number;
  questions: GameQuestion[];
    isPremium: boolean;
    requiresSubscription: boolean;
  categories: string[];
  tags: string[];
}

export default function GameManagement() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalGames, setTotalGames] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState({
    gameType: '',
    difficulty: '',
    search: ''
  });
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<GameFormData>({
    title: '',
    description: '',
    gameType: 'grammar',
    difficulty: 'beginner',
    level: 1,
    timeLimit: 300,
    maxScore: 100,
    passingScore: 70,
    totalQuestions: 0,
    questions: [],
    isPremium: false,
    requiresSubscription: false,
    categories: [],
    tags: []
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      gameType: 'grammar',
      difficulty: 'beginner',
      level: 1,
      timeLimit: 300,
      maxScore: 100,
      passingScore: 70,
      totalQuestions: 0,
      questions: [],
      isPremium: false,
      requiresSubscription: false,
      categories: [],
      tags: []
    });
    setSelectedGame(null);
  };

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://aarambh-english-learning-app-1.onrender.com';

  useEffect(() => {
    fetchGames();
  }, [currentPage, filters]);

  const getToken = () => {
    return localStorage.getItem('adminToken');
  };

    const fetchGames = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(filters.gameType && { gameType: filters.gameType }),
        ...(filters.difficulty && { difficulty: filters.difficulty }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`${backendUrl}/games?${params}`, {
          headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch games');
      }

      const data = await response.json();
      setGames(data.data.games);
      setTotalPages(data.data.pagination.pages);
      setTotalGames(data.data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch games');
      } finally {
        setLoading(false);
      }
    };

  const createGame = async (gameData: GameFormData) => {
    try {
      const response = await fetch(`${backendUrl}/games`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gameData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create game');
      }

      setSuccess('Game created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchGames();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
    }
  };

  const updateGame = async (gameId: string, gameData: GameFormData) => {
    try {
      const response = await fetch(`${backendUrl}/games/${gameId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gameData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update game');
      }

      setSuccess('Game updated successfully');
      setShowEditModal(false);
      resetForm();
      fetchGames();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update game');
    }
  };

  const deleteGame = async (gameId: string) => {
    if (!confirm('Are you sure you want to delete this game?')) {
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/games/${gameId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete game');
      }

      setSuccess('Game deleted successfully');
      fetchGames();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete game');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Game Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage games and questions for all game types
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreateModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Game</span>
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">
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
                placeholder="Search by title..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Game Type</label>
            <select
              value={filters.gameType}
              onChange={(e) => setFilters(prev => ({ ...prev, gameType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="grammar">Grammar</option>
              <option value="pronunciation">Pronunciation</option>
              <option value="identification">Identification</option>
              <option value="storytelling">Storytelling</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
            <select
              value={filters.difficulty}
              onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({ gameType: '', difficulty: '', search: '' });
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Simple Games Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Games ({totalGames})</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No games found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {games.map((game) => (
              <div key={game._id} className="p-6 hover:bg-gray-50">
            <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{game.title}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        game.gameType === 'grammar' ? 'bg-blue-100 text-blue-800' :
                        game.gameType === 'pronunciation' ? 'bg-purple-100 text-purple-800' :
                        game.gameType === 'identification' ? 'bg-orange-100 text-orange-800' :
                        'bg-pink-100 text-pink-800'
                      }`}>
                        {game.gameType}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        game.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                        game.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {game.difficulty}
                    </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{game.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Level {game.level}</span>
                      <span>{game.totalQuestions} questions</span>
                      <span>{game.timeLimit}s</span>
                      <span>{game.totalPlays} plays</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedGame(game)}
                      className="text-blue-600 hover:text-blue-900 p-2"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedGame(game);
                        setFormData({
                          title: game.title,
                          description: game.description,
                          gameType: game.gameType,
                          difficulty: game.difficulty,
                          level: game.level,
                          timeLimit: game.timeLimit,
                          maxScore: game.maxScore,
                          passingScore: game.passingScore,
                          totalQuestions: game.totalQuestions,
                          questions: game.questions,
                          isPremium: game.isPremium,
                          requiresSubscription: game.requiresSubscription,
                          categories: game.categories,
                          tags: game.tags
                        });
                        setShowEditModal(true);
                      }}
                      className="text-yellow-600 hover:text-yellow-900 p-2"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteGame(game._id)}
                      className="text-red-600 hover:text-red-900 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Simple Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {showEditModal ? 'Edit Game' : 'Create New Game'}
            </h3>
            
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Game Type</label>
                  <select
                    value={formData.gameType}
                    onChange={(e) => setFormData({ ...formData, gameType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="grammar">Grammar</option>
                    <option value="pronunciation">Pronunciation</option>
                    <option value="identification">Identification</option>
                    <option value="storytelling">Storytelling</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
      </div>

              <div className="flex justify-end space-x-3">
            <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                  type="button"
                  onClick={() => {
                    if (showEditModal && selectedGame) {
                      updateGame(selectedGame._id, formData);
                    } else {
                      createGame(formData);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  {showEditModal ? 'Update' : 'Create'}
              </button>
            </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {selectedGame && !showEditModal && !showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Game Details</h3>
            
              <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <p className="text-sm text-gray-900">{selectedGame.title}</p>
                  </div>
                  <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <p className="text-sm text-gray-900">{selectedGame.gameType}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Difficulty</label>
                  <p className="text-sm text-gray-900">{selectedGame.difficulty}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Level</label>
                  <p className="text-sm text-gray-900">{selectedGame.level}</p>
                </div>
                      </div>

                        <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="text-sm text-gray-900">{selectedGame.description}</p>
                        </div>

                        <div>
                <label className="block text-sm font-medium text-gray-700">Questions ({selectedGame.questions.length})</label>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {selectedGame.questions.map((q, i) => (
                    <div key={i} className="p-2 bg-gray-50 rounded text-sm">
                      <strong>Q{q.questionNumber}:</strong> {q.questionText}
                    </div>
                  ))}
                </div>
                </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedGame(null)}
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