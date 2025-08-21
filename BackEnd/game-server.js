const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config({ path: './env.local' });

const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/games');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Game Server Running',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Game Server is working!',
    endpoints: [
      'POST /api/auth/register - User registration',
      'POST /api/auth/login - User login',
      'POST /api/auth/logout - User logout',
      'GET /api/auth/me - Get current user',
      'PUT /api/auth/change-password - Change password',
      'POST /api/games - Create game (Admin only)',
      'GET /api/games - Get all games',
      'GET /api/games/:id - Get specific game',
      'PUT /api/games/:id - Update game (Admin only)',
      'DELETE /api/games/:id - Delete game (Admin only)',
      'POST /api/games/:id/start - Start game session',
      'POST /api/games/:id/submit - Submit game answers',
      'GET /api/games/:id/stats - Get game statistics',
      'GET /api/games/type/:gameType - Get games by type',
      'GET /api/games/random/:gameType - Get random game'
    ]
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🎮 Game Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
  console.log(`🎯 Game endpoints: http://localhost:${PORT}/api/games/*`);
  console.log(`📊 MongoDB: Connected to ${process.env.MONGODB_URI}`);
});

module.exports = app;
