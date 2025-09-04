// Configure API base URL based on platform
import { Platform } from 'react-native';
// Lazy load AsyncStorage to avoid NativeModule null in web or if not linked yet
let AsyncStorage = null;
try {
  // eslint-disable-next-line global-require
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  AsyncStorage = null;
}

let API_BASE_URL;
if (Platform.OS === 'android') {
  // Android emulator uses 10.0.2.2 to access host machine's localhost
  API_BASE_URL = 'http://10.0.2.2:5000/api';
} else {
  // iOS simulator and web can use localhost
  API_BASE_URL = 'http://localhost:5000/api';
}

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  // Add authorization header if token exists
  const token = await getStoredToken();
  if (token) {
    defaultOptions.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Token management (cross-platform)
const getStoredToken = async () => {
  try {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' ? window.localStorage.getItem('authToken') : null;
    }
    if (AsyncStorage && AsyncStorage.getItem) {
      return await AsyncStorage.getItem('authToken');
    }
    return global.authToken || null;
  } catch (err) {
    console.error('Error getting stored token:', err);
    return null;
  }
};

const setStoredToken = async (token) => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('authToken', token);
      }
    } else {
      if (AsyncStorage && AsyncStorage.setItem) {
        await AsyncStorage.setItem('authToken', token);
      } else {
        global.authToken = token;
      }
    }
  } catch (err) {
    console.error('Error setting stored token:', err);
  }
};

const clearStoredToken = async () => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('authToken');
      }
    } else {
      if (AsyncStorage && AsyncStorage.removeItem) {
        await AsyncStorage.removeItem('authToken');
      } else {
        global.authToken = null;
      }
    }
  } catch (err) {
    console.error('Error clearing stored token:', err);
  }
};

// Auth API
export const authAPI = {
  // Login
  login: async (email, password) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.success && response.data.token) {
      await setStoredToken(response.data.token);
    }
    
    return response;
  },

  // Register
  register: async (userData) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.success && response.data.token) {
      await setStoredToken(response.data.token);
    }
    
    return response;
  },

  // Logout
  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.log('Logout error (continuing):', error);
    } finally {
      await clearStoredToken();
    }
  },

  // Get current user
  getCurrentUser: async () => {
    return await apiRequest('/auth/me');
  },

  // Update profile
  updateProfile: async (userId, updateData) => {
    return await apiRequest(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    return await apiRequest('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

// Games API
export const gamesAPI = {
  // Get all games
  getAllGames: async () => {
    return await apiRequest('/games');
  },

  // Get games by type
  getGamesByType: async (gameType) => {
    return await apiRequest(`/games/type/${gameType}`);
  },

  // Get specific game
  getGame: async (gameId) => {
    return await apiRequest(`/games/${gameId}`);
  },

  // Start a game session
  startGame: async (gameId) => {
    return await apiRequest(`/games/${gameId}/start`, {
      method: 'POST',
    });
  },

  // Submit game answers
  submitGame: async (gameId, answers) => {
    return await apiRequest(`/games/${gameId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  },

  // Get game statistics
  getGameStats: async (gameId) => {
    return await apiRequest(`/games/${gameId}/stats`);
  },
};

// Regions API
export const regionsAPI = {
  // Get all regions
  getAllRegions: async () => {
    return await apiRequest('/regions');
  },

  // Get specific region
  getRegion: async (regionId) => {
    return await apiRequest(`/regions/${regionId}`);
  },
};

// Leaderboard API
export const leaderboardAPI = {
  // Get top 3 for a region
  getTop3ForRegion: async (regionId) => {
    return await apiRequest(`/leaderboard/region/${regionId}/top3`);
  },

  // Get full leaderboard for a region
  getRegionLeaderboard: async (regionId, page = 1, limit = 20) => {
    return await apiRequest(`/leaderboard/region/${regionId}?page=${page}&limit=${limit}`);
  },

  // Get top 3 across all regions
  getTop3AllRegions: async () => {
    return await apiRequest('/leaderboard/all-regions/top3');
  },

  // Get user's rank
  getMyRank: async () => {
    return await apiRequest('/leaderboard/my-rank');
  },
};

// Communication API
export const communicationAPI = {
  // Find partner for region-based matchmaking
  findPartner: async (sessionType, preferredLanguageLevel = null) => {
    const body = { sessionType };
    if (preferredLanguageLevel) {
      body.preferredLanguageLevel = preferredLanguageLevel;
    }
    return await apiRequest('/communication/matchmaking/find-partner', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // Initiate call
  initiateCall: async (callData) => {
    return await apiRequest('/communication/call/initiate', {
      method: 'POST',
      body: JSON.stringify(callData),
    });
  },

  // Initiate group call
  initiateGroupCall: async (callData) => {
    return await apiRequest('/communication/call/group/initiate', {
      method: 'POST',
      body: JSON.stringify(callData),
    });
  },

  // Join call
  joinCall: async (sessionId) => {
    return await apiRequest(`/communication/call/${sessionId}/join`, {
      method: 'POST',
    });
  },

  // Leave call
  leaveCall: async (sessionId) => {
    return await apiRequest(`/communication/call/${sessionId}/leave`, {
      method: 'POST',
    });
  },

  // End call
  endCall: async (sessionId) => {
    return await apiRequest(`/communication/call/${sessionId}/end`, {
      method: 'POST',
    });
  },

  // Update participant state
  updateParticipantState: async (sessionId, stateData) => {
    return await apiRequest(`/communication/call/${sessionId}/participant/state`, {
      method: 'PUT',
      body: JSON.stringify(stateData),
    });
  },

  // Send chat message
  sendMessage: async (sessionId, message) => {
    return await apiRequest(`/communication/chat/${sessionId}/message`, {
      method: 'POST',
      body: JSON.stringify(message),
    });
  },

  // Get chat messages
  getMessages: async (sessionId, page = 1, limit = 50) => {
    return await apiRequest(`/communication/chat/${sessionId}/messages?page=${page}&limit=${limit}`);
  },

  // Get active calls
  getActiveCalls: async () => {
    return await apiRequest('/communication/calls/active');
  },

  // Get call history
  getCallHistory: async (page = 1, limit = 20) => {
    return await apiRequest(`/communication/calls/history?page=${page}&limit=${limit}`);
  },

  // Get session details
  getSessionDetails: async (sessionId) => {
    return await apiRequest(`/communication/session/${sessionId}`);
  },
};

// Sessions API
export const sessionsAPI = {
  // Get user's sessions
  getMySessions: async (filters = {}) => {
    const queryParams = new URLSearchParams({
      page: '1',
      limit: '20',
      ...filters
    }).toString();
    return await apiRequest(`/sessions/my-sessions?${queryParams}`);
  },

  // Get specific session
  getSession: async (sessionId) => {
    return await apiRequest(`/sessions/${sessionId}`);
  },
};

// Lectures API
export const lecturesAPI = {
  // Get all lectures
  getAllLectures: async (page = 1, limit = 20) => {
    return await apiRequest(`/lectures?page=${page}&limit=${limit}`);
  },

  // Get specific lecture
  getLecture: async (lectureId) => {
    return await apiRequest(`/lectures/${lectureId}`);
  },

  // Search lectures
  searchLectures: async (searchData) => {
    return await apiRequest('/lectures/search', {
      method: 'POST',
      body: JSON.stringify(searchData),
    });
  },

  // Mark lecture as viewed
  markAsViewed: async (lectureId) => {
    return await apiRequest(`/lectures/${lectureId}/view`, {
      method: 'POST',
    });
  },
};

// Plans API
export const plansAPI = {
  // Get all plans
  getAllPlans: async () => {
    return await apiRequest('/plans');
  },

  // Get specific plan
  getPlan: async (planId) => {
    return await apiRequest(`/plans/${planId}`);
  },
};

// Transactions API
export const transactionsAPI = {
  // Get user subscription
  getSubscription: async () => {
    return await apiRequest('/transactions/subscription');
  },

  // Get available plans
  getAvailablePlans: async () => {
    return await apiRequest('/transactions/plans');
  },

  // Create payment order
  createOrder: async (orderData) => {
    return await apiRequest('/transactions/create-order', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  // Verify payment
  verifyPayment: async (paymentData) => {
    return await apiRequest('/transactions/verify-payment', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  // Cancel subscription
  cancelSubscription: async () => {
    return await apiRequest('/transactions/cancel-subscription', {
      method: 'POST',
    });
  },

  // Get transaction history
  getTransactionHistory: async (page = 1, limit = 20) => {
    return await apiRequest(`/transactions/history?page=${page}&limit=${limit}`);
  },
};

// Referrals API
export const referralsAPI = {
  // Validate referral code
  validateReferralCode: async (referralCode) => {
    return await apiRequest('/referrals/validate', {
      method: 'POST',
      body: JSON.stringify({ referralCode }),
    });
  },
};

// Groups API
export const groupsAPI = {
  // Create group discussion room
  createGroup: async (groupData) => {
    return await apiRequest('/groups/create', {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
  },

  // Get available groups (region-based)
  getAvailableGroups: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/groups/available?${queryParams}` : '/groups/available';
    return await apiRequest(endpoint);
  },

  // Join group by ID
  joinGroup: async (groupId, password = null) => {
    return await apiRequest('/groups/join', {
      method: 'POST',
      body: JSON.stringify({ groupId, password }),
    });
  },

  // Join group by code
  joinGroupByCode: async (joinCode, password = null) => {
    return await apiRequest('/groups/join-by-code', {
      method: 'POST',
      body: JSON.stringify({ joinCode, password }),
    });
  },

  // Get group details
  getGroupDetails: async (groupId) => {
    return await apiRequest(`/groups/${groupId}`);
  },

  // Send message to group
  sendMessage: async (groupId, message, messageType = 'text') => {
    return await apiRequest(`/groups/${groupId}/message`, {
      method: 'POST',
      body: JSON.stringify({ message, messageType }),
    });
  },

  // Get group messages
  getMessages: async (groupId, page = 1, limit = 50) => {
    return await apiRequest(`/groups/${groupId}/messages?page=${page}&limit=${limit}`);
  },

  // Start group session (host only)
  startSession: async (groupId, sessionType) => {
    return await apiRequest(`/groups/${groupId}/start`, {
      method: 'POST',
      body: JSON.stringify({ sessionType }),
    });
  },

  // Leave group
  leaveGroup: async (groupId) => {
    return await apiRequest(`/groups/${groupId}/leave`, {
      method: 'POST',
    });
  },

  // Get user's active groups
  getActiveGroups: async () => {
    return await apiRequest('/groups/my/active');
  },
};

export default {
  auth: authAPI,
  games: gamesAPI,
  regions: regionsAPI,
  leaderboard: leaderboardAPI,
  communication: communicationAPI,
  sessions: sessionsAPI,
  lectures: lecturesAPI,
  plans: plansAPI,
  transactions: transactionsAPI,
  referrals: referralsAPI,
  groups: groupsAPI,
};
