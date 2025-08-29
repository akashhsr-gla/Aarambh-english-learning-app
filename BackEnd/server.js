const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: './env.local' });

const connectDB = require('./config/database');

const app = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration for web and mobile support
app.use(cors({
  origin: [
    'http://localhost:8081', // Expo web dev server
    'http://localhost:19006', // Expo web alternative port
    'http://localhost:3000',  // Next.js web
    'http://127.0.0.1:8081',
    'http://127.0.0.1:19006',
    'http://10.0.2.2:8081',   // Android emulator
    'exp://localhost:19000',  // Expo development
    'exp://127.0.0.1:19000',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'AarambhApp Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/regions', require('./routes/regions'));
app.use('/api/plans', require('./routes/plans'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/games', require('./routes/games'));
app.use('/api/lectures', require('./routes/lectures'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/communication', require('./routes/communication'));

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 AarambhApp Backend Server running on port ${PORT}`);
  console.log(`📚 Available at: http://localhost:${PORT}`);
  console.log(`🔍 Test endpoint: http://localhost:${PORT}/test`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 MongoDB: Connected`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;
