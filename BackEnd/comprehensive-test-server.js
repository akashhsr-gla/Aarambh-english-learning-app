require('dotenv').config({ path: './env.local' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const regionsRoutes = require('./routes/regions');
const sessionsRoutes = require('./routes/sessions');
const lecturesRoutes = require('./routes/lectures');
const transactionRoutes = require('./routes/transactions');
const adminRoutes = require('./routes/admin');
const plansRoutes = require('./routes/plans');
const userRoutes = require('./routes/users');
const referralRoutes = require('./routes/referrals');
const gameRoutes = require('./routes/games');
const leaderboardRoutes = require('./routes/leaderboard');
const communicationRoutes = require('./routes/communication');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs (increased for testing)
});
app.use(limiter);

// Logging
app.use(morgan('combined'));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'AarambhApp Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to list all available routes
app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Available API endpoints for testing',
    endpoints: {
      auth: [
        'POST /api/auth/register',
        'POST /api/auth/login',
        'POST /api/auth/logout',
        'GET /api/auth/me',
        'POST /api/auth/forgot-password',
        'POST /api/auth/reset-password',
        'PUT /api/auth/change-password'
      ],
      regions: [
        'POST /api/regions',
        'GET /api/regions',
        'GET /api/regions/:id',
        'PUT /api/regions/:id',
        'DELETE /api/regions/:id',
        'GET /api/regions/:id/statistics',
        'PATCH /api/regions/:id/toggle-status'
      ],
      sessions: [
        'GET /api/sessions/admin/all',
        'GET /api/sessions/admin/type/:sessionType',
        'GET /api/sessions/my-sessions',
        'GET /api/sessions/:id',
        'GET /api/sessions/admin/statistics',
        'POST /api/sessions/admin/search'
      ],
      lectures: [
        'POST /api/lectures',
        'GET /api/lectures',
        'GET /api/lectures/:id',
        'PUT /api/lectures/:id',
        'DELETE /api/lectures/:id',
        'PATCH /api/lectures/:id/toggle-status',
        'POST /api/lectures/:id/view',
        'GET /api/lectures/admin/statistics',
        'POST /api/lectures/search'
      ],
      transactions: [
        'GET /api/transactions/subscription',
        'GET /api/transactions/plans',
        'POST /api/transactions/create-order',
        'POST /api/transactions/verify-payment',
        'POST /api/transactions/cancel-subscription',
        'GET /api/transactions/history',
        'GET /api/transactions/:transactionId'
      ],
      admin: [
        'GET /api/admin/plans',
        'POST /api/admin/plans',
        'PUT /api/admin/plans/:planId',
        'DELETE /api/admin/plans/:planId',
        'PATCH /api/admin/plans/:planId/toggle-status',
        'GET /api/admin/transactions',
        'GET /api/admin/transactions/statistics',
        'GET /api/admin/transactions/:transactionId',
        'PATCH /api/admin/transactions/:transactionId/status',
        'GET /api/admin/subscriptions/statistics',
        'GET /api/admin/users/subscriptions'
      ],
      plans: [
        'GET /api/plans',
        'GET /api/plans/:id',
        'POST /api/plans',
        'PUT /api/plans/:id',
        'DELETE /api/plans/:id',
        'PATCH /api/plans/:id/toggle-status'
      ],
      users: [
        'GET /api/users',
        'GET /api/users/:id',
        'PUT /api/users/:id',
        'DELETE /api/users/:id',
        'PATCH /api/users/:id/reactivate',
        'GET /api/users/admin/statistics',
        'POST /api/users/admin/search'
      ],
      referrals: [
        'GET /api/referrals',
        'GET /api/referrals/:id',
        'POST /api/referrals',
        'PUT /api/referrals/:id',
        'DELETE /api/referrals/:id',
        'PATCH /api/referrals/:id/toggle-status',
        'GET /api/referrals/teacher/:teacherId',
        'GET /api/referrals/admin/statistics',
        'POST /api/referrals/validate'
      ],
      games: [
        'GET /api/games',
        'GET /api/games/type/:gameType',
        'GET /api/games/:id',
        'POST /api/games',
        'PUT /api/games/:id',
        'DELETE /api/games/:id',
        'POST /api/games/:id/start',
        'POST /api/games/:id/submit',
        'GET /api/games/:id/stats'
      ],
      leaderboard: [
        'GET /api/leaderboard/region/:regionId/top3',
        'GET /api/leaderboard/region/:regionId',
        'GET /api/leaderboard/all-regions/top3',
        'GET /api/leaderboard/my-rank',
        'GET /api/leaderboard/statistics'
      ],
      communication: [
        'POST /api/communication/call/initiate',
        'POST /api/communication/call/group/initiate',
        'POST /api/communication/call/:sessionId/join',
        'POST /api/communication/call/:sessionId/leave',
        'PUT /api/communication/call/:sessionId/participant/state',
        'POST /api/communication/chat/:sessionId/message',
        'GET /api/communication/chat/:sessionId/messages',
        'GET /api/communication/calls/active',
        'GET /api/communication/calls/history',
        'POST /api/communication/call/:sessionId/end',
        'GET /api/communication/session/:sessionId',
        'GET /api/communication/admin/sessions'
      ]
    }
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/regions', regionsRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/lectures', lecturesRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/users', userRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/communication', communicationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!' 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Comprehensive Test Server running on port ${PORT}`);
  console.log(`📚 Available at: http://localhost:${PORT}`);
  console.log(`🔍 Test endpoint: http://localhost:${PORT}/test`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
