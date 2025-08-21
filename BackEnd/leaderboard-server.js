const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config({ path: './env.local' });

const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const leaderboardRoutes = require('./routes/leaderboard');

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
    message: 'Leaderboard Server Running',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Leaderboard Server is working!',
    endpoints: [
      'POST /api/auth/register - User registration',
      'POST /api/auth/login - User login',
      'POST /api/auth/logout - User logout',
      'GET /api/auth/me - Get current user',
      'PUT /api/auth/change-password - Change password',
      'GET /api/leaderboard/region/:regionId/top3 - Get top 3 in region',
      'GET /api/leaderboard/region/:regionId - Get full regional leaderboard',
      'GET /api/leaderboard/all-regions/top3 - Get top 3 for all regions',
      'GET /api/leaderboard/my-rank - Get current user rank',
      'GET /api/leaderboard/statistics - Admin: Get leaderboard statistics',
      'POST /api/leaderboard/update-activity/:userId - Admin: Update user activity'
    ]
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

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
  console.log(`🏆 Leaderboard Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
  console.log(`🏆 Leaderboard endpoints: http://localhost:${PORT}/api/leaderboard/*`);
  console.log(`📊 MongoDB: Connected to ${process.env.MONGODB_URI}`);
});

module.exports = app;
