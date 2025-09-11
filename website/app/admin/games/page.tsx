'use client';

import {
  Calendar,
  Edit,
  Eye,
  EyeOff,
  Gamepad2,
  Search
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface BackendGame {
  _id: string;
  title: string;
  description: string;
  gameType: 'grammar' | 'pronunciation' | 'identification' | 'storytelling';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isActive: boolean;
  isPremium?: boolean;
  requiresSubscription?: boolean;
  level?: number;
  createdAt: string;
  updatedAt: string;
}

type UiDifficulty = 'easy' | 'medium' | 'hard';

interface GameUI {
  id: string;
  name: string;
  description: string;
  category: string; // maps to gameType
  difficulty: UiDifficulty;
  isActive: boolean;
  playersCount: number;
  rating: number;
  createdAt: string;
  lastPlayed: string;
  isPremium?: boolean;
}

export default function GamesManagement() {
  const [games, setGames] = useState<GameUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const backendUrl = useMemo(() => (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'), []);

  type QuestionType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'audio' | 'image' | 'video';
  interface EditOption { text: string; explanation?: string; isCorrect?: boolean }
  interface EditQuestion {
    questionNumber: number;
    questionText: string;
    questionType: QuestionType;
    points: number;
    options?: EditOption[];
    correctAnswer?: string;
    mediaUrl?: string;
    mediaType?: string;
    hint?: string;
  }
  interface EditGameForm {
    title: string;
    description: string;
    gameType: 'grammar' | 'pronunciation' | 'identification' | 'storytelling';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    level: number;
    timeLimit: number;
    maxScore: number;
    passingScore: number;
    isPremium: boolean;
    requiresSubscription: boolean;
    questions: EditQuestion[];
  }
  const [editForm, setEditForm] = useState<EditGameForm | null>(null);

  const categories = ['all', 'word', 'grammar', 'vocabulary', 'speaking', 'listening'];

  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`${backendUrl}/api/games?page=1&limit=50&sortBy=createdAt&sortOrder=desc`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Failed to fetch games');
        }
        const list: BackendGame[] = json.data?.games || [];
        const mapped: GameUI[] = list.map(g => ({
          id: g._id,
          name: g.title,
          description: g.description,
          category: g.gameType,
          difficulty: g.difficulty === 'beginner' ? 'easy' : (g.difficulty === 'intermediate' ? 'medium' : 'hard'),
          isActive: g.isActive,
          playersCount: 0,
          rating: 0,
          createdAt: g.createdAt,
          lastPlayed: g.updatedAt,
          isPremium: g.isPremium
        }));
        setGames(mapped);
      } catch (err: any) {
        console.error('Error fetching games:', err);
        setError(err.message || 'Failed to load games');
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, [backendUrl]);

  const filteredGames = games.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         game.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || game.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleGameStatus = async (gameId: string, current: boolean) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${backendUrl}/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ isActive: !current })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Toggle failed');
      setGames(games.map(game => game.id === gameId ? { ...game, isActive: !current } : game));
    } catch (err) {
      console.error('Toggle game status error:', err);
      alert('Failed to update status');
    }
  };

  const deleteGame = async (gameId: string) => {
    if (!confirm('Are you sure you want to delete (deactivate) this game?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${backendUrl}/api/games/${gameId}`, {
        method: 'DELETE',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Delete failed');
      setGames(games.filter(game => game.id !== gameId));
    } catch (err) {
      console.error('Delete game error:', err);
      alert('Failed to delete game');
    }
  };

  // Open Edit modal, load game details
  const openEdit = async (gameId: string) => {
    setSelectedGameId(gameId);
    setShowEditModal(true);
    setEditLoading(true);
    setEditError(null);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${backendUrl}/api/games/${gameId}`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to load game');
      const g = json.data.game as any;
      const form: EditGameForm = {
        title: g.title,
        description: g.description,
        gameType: g.gameType,
        difficulty: g.difficulty,
        level: g.level || 1,
        timeLimit: g.timeLimit || 0,
        maxScore: g.maxScore || 100,
        passingScore: g.passingScore || 0,
        isPremium: !!g.isPremium,
        requiresSubscription: !!g.requiresSubscription,
        questions: (g.questions || []).map((q: any, idx: number) => ({
          questionNumber: q.questionNumber || idx + 1,
          questionText: q.questionText || '',
          questionType: q.questionType || 'multiple_choice',
          points: q.points || 1,
          options: q.options || undefined,
          correctAnswer: q.correctAnswer || undefined,
          mediaUrl: q.mediaUrl,
          mediaType: q.mediaType,
          hint: q.hint
        }))
      };
      setEditForm(form);
    } catch (err: any) {
      setEditError(err.message || 'Failed to load game');
    } finally {
      setEditLoading(false);
    }
  };

  const updateQuestion = (index: number, update: Partial<EditQuestion>) => {
    if (!editForm) return;
    const next = [...editForm.questions];
    next[index] = { ...next[index], ...update } as EditQuestion;
    setEditForm({ ...editForm, questions: next });
  };

  const addQuestion = () => {
    if (!editForm) return;
    const nextNum = (editForm.questions?.length || 0) + 1;
    const next = [...editForm.questions, { questionNumber: nextNum, questionText: '', questionType: 'multiple_choice', points: 1, options: [{ text: '', isCorrect: true }, { text: '' }] } as EditQuestion];
    setEditForm({ ...editForm, questions: next });
  };

  const removeQuestion = (index: number) => {
    if (!editForm) return;
    const next = editForm.questions.filter((_, i) => i !== index).map((q, i) => ({ ...q, questionNumber: i + 1 }));
    setEditForm({ ...editForm, questions: next });
  };

  const addOption = (qi: number) => {
    if (!editForm) return;
    const q = editForm.questions[qi];
    const opts = q.options ? [...q.options, { text: '' }] : [{ text: '' }];
    updateQuestion(qi, { options: opts });
  };

  const setCorrectOption = (qi: number, oi: number) => {
    if (!editForm) return;
    const q = editForm.questions[qi];
    if (!q.options) return;
    const opts = q.options.map((o, i) => ({ ...o, isCorrect: i === oi }));
    updateQuestion(qi, { options: opts });
  };

  const saveEdit = async () => {
    if (!selectedGameId || !editForm) return;
    try {
      setEditLoading(true);
      setEditError(null);
      const token = localStorage.getItem('adminToken');
      const payload: any = {
        ...editForm,
        totalQuestions: editForm.questions.length,
        questions: editForm.questions.map((q) => ({
          ...q,
          // ensure correctAnswer present when not MCQ
          correctAnswer: q.questionType === 'multiple_choice' ? undefined : (q.correctAnswer || ''),
        }))
      };
      const res = await fetch(`${backendUrl}/api/games/${selectedGameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to save');
      // refresh list
      setShowEditModal(false);
      setSelectedGameId(null);
      // Simple refresh
      setLoading(true);
      const refRes = await fetch(`${backendUrl}/api/games?page=1&limit=50&sortBy=createdAt&sortOrder=desc`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const refJson = await refRes.json();
      const list: BackendGame[] = refJson.data?.games || [];
      const mapped: GameUI[] = list.map(g => ({
        id: g._id,
        name: g.title,
        description: g.description,
        category: g.gameType,
        difficulty: g.difficulty === 'beginner' ? 'easy' : (g.difficulty === 'intermediate' ? 'medium' : 'hard'),
        isActive: g.isActive,
        playersCount: 0,
        rating: 0,
        createdAt: g.createdAt,
        lastPlayed: g.updatedAt,
        isPremium: g.isPremium
      }));
      setGames(mapped);
    } catch (err: any) {
      setEditError(err.message || 'Save failed');
    } finally {
      setEditLoading(false);
      setLoading(false);
    }
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
      {error && (
        <div className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>
      )}
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Games Management</h1>
          <p className="text-gray-600 mt-2">Manage all games in your app</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search games..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="md:w-48">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Categories</option>
              {categories.slice(1).map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Games List */}
      <div className="space-y-4">
        {filteredGames.map((game) => (
          <div key={game.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Gamepad2 className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900">{game.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      game.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {game.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{game.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span className="capitalize">{game.category}</span>
                    <span className="capitalize">{game.difficulty}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleGameStatus(game.id, game.isActive)}
                  className={`p-2 rounded-lg transition-colors ${
                    game.isActive 
                      ? 'text-red-600 hover:bg-red-100' 
                      : 'text-green-600 hover:bg-green-100'
                  }`}
                  title={game.isActive ? 'Deactivate' : 'Activate'}
                >
                  {game.isActive ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => openEdit(game.id)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <Edit className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Created: {new Date(game.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Last played: {new Date(game.lastPlayed).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredGames.length === 0 && (
        <div className="text-center py-12">
          <Gamepad2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No games found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by adding your first game'
            }
          </p>
          {(!searchTerm && filterCategory === 'all') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add New Game
            </button>
          )}
        </div>
      )}

      {/* Add Game Modal Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Game</h3>
            <p className="text-gray-600 mb-4">Game creation form will be implemented here.</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Game Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Game</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            {editLoading && <div className="text-sm text-gray-600">Loading...</div>}
            {editError && <div className="mb-3 p-2 text-sm text-red-700 bg-red-50 rounded">{editError}</div>}
            {editForm && !editLoading && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input value={editForm.title} onChange={(e)=>setEditForm({...editForm, title:e.target.value})} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Game Type</label>
                    <select value={editForm.gameType} onChange={(e)=>setEditForm({...editForm, gameType:e.target.value as any})} className="w-full border rounded px-3 py-2">
                      <option value="grammar">grammar</option>
                      <option value="pronunciation">pronunciation</option>
                      <option value="identification">identification</option>
                      <option value="storytelling">storytelling</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                    <select value={editForm.difficulty} onChange={(e)=>setEditForm({...editForm, difficulty:e.target.value as any})} className="w-full border rounded px-3 py-2">
                      <option value="beginner">beginner</option>
                      <option value="intermediate">intermediate</option>
                      <option value="advanced">advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                    <input type="number" value={editForm.level} onChange={(e)=>setEditForm({...editForm, level:parseInt(e.target.value||'1')})} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (sec)</label>
                    <input type="number" value={editForm.timeLimit} onChange={(e)=>setEditForm({...editForm, timeLimit:parseInt(e.target.value||'0')})} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Score</label>
                    <input type="number" value={editForm.maxScore} onChange={(e)=>setEditForm({...editForm, maxScore:parseInt(e.target.value||'0')})} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Passing Score (%)</label>
                    <input type="number" value={editForm.passingScore} onChange={(e)=>setEditForm({...editForm, passingScore:parseInt(e.target.value||'0')})} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={editForm.isPremium} onChange={(e)=>setEditForm({...editForm, isPremium:e.target.checked})} /> Premium</label>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={editForm.requiresSubscription} onChange={(e)=>setEditForm({...editForm, requiresSubscription:e.target.checked})} /> Requires Subscription</label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={editForm.description} onChange={(e)=>setEditForm({...editForm, description:e.target.value})} className="w-full border rounded px-3 py-2" rows={3} />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <h4 className="text-md font-semibold text-gray-900">Questions ({editForm.questions.length})</h4>
                  <button onClick={addQuestion} className="px-3 py-1.5 bg-indigo-600 text-white rounded">Add Question</button>
                </div>
                <div className="space-y-4">
                  {editForm.questions.map((q, qi) => (
                    <div key={qi} className="border rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-gray-600">Question #{q.questionNumber}</div>
                        <button onClick={()=>removeQuestion(qi)} className="text-red-600 text-sm">Remove</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
                          <input value={q.questionText} onChange={(e)=>updateQuestion(qi,{questionText:e.target.value})} className="w-full border rounded px-3 py-2" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                          <select value={q.questionType} onChange={(e)=>updateQuestion(qi,{questionType:e.target.value as any})} className="w-full border rounded px-3 py-2">
                            <option value="multiple_choice">multiple_choice</option>
                            <option value="true_false">true_false</option>
                            <option value="fill_blank">fill_blank</option>
                            <option value="audio">audio</option>
                            <option value="image">image</option>
                            <option value="video">video</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                          <input type="number" value={q.points} onChange={(e)=>updateQuestion(qi,{points:parseInt(e.target.value||'1')})} className="w-full border rounded px-3 py-2" />
                        </div>
                        {editForm.gameType === 'identification' && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Media URL</label>
                              <input value={q.mediaUrl||''} onChange={(e)=>updateQuestion(qi,{mediaUrl:e.target.value})} className="w-full border rounded px-3 py-2" placeholder="https://..." />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Media Type</label>
                              <select value={q.mediaType||''} onChange={(e)=>updateQuestion(qi,{mediaType:e.target.value})} className="w-full border rounded px-3 py-2">
                                <option value="">Select type</option>
                                <option value="image/png">image/png</option>
                                <option value="image/jpeg">image/jpeg</option>
                                <option value="audio/mpeg">audio/mpeg</option>
                                <option value="audio/wav">audio/wav</option>
                                <option value="video/mp4">video/mp4</option>
                                <option value="video/webm">video/webm</option>
                              </select>
                            </div>
                          </>
                        )}
                      </div>
                      {(editForm.gameType === 'identification' && q.questionType === 'image' && q.mediaUrl) && (
                        <div className="mt-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={q.mediaUrl} alt="preview" className="max-h-40 rounded border" />
                        </div>
                      )}
                      {q.questionType === 'multiple_choice' ? (
                        <div className="mt-3">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-gray-700">Options</div>
                            <button onClick={()=>addOption(qi)} className="text-indigo-600 text-sm">Add option</button>
                          </div>
                          <div className="mt-2 space-y-2">
                            {(q.options||[]).map((opt, oi)=> (
                              <div key={oi} className="flex items-center gap-2">
                                <input type="radio" checked={!!opt.isCorrect} onChange={()=>setCorrectOption(qi,oi)} />
                                <input value={opt.text} onChange={(e)=>{
                                  const opts=[...(q.options||[])];
                                  opts[oi]={...opts[oi], text:e.target.value};
                                  updateQuestion(qi,{options:opts});
                                }} className="flex-1 border rounded px-3 py-2" placeholder={`Option ${oi+1}`} />
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer</label>
                          <input value={q.correctAnswer||''} onChange={(e)=>updateQuestion(qi,{correctAnswer:e.target.value})} className="w-full border rounded px-3 py-2" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={()=>setShowEditModal(false)} className="px-4 py-2 rounded border">Cancel</button>
                  <button disabled={editLoading} onClick={saveEdit} className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50">{editLoading? 'Saving...' : 'Save Changes'}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
